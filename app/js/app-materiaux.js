// BatiSpot — Matériaux d'un devis, prix d'achat de l'artisan, estimation.
//
// POURQUOI (04/09/2026, décision Moctar) : « la liste des matériaux doit
// apparaître pour chaque devis ; une estimation des prix d'achat quand
// l'artisan n'a pas ses tarifs, une marge plus précise quand il les a ; et il
// doit pouvoir renseigner ses prix d'achat dans l'outil ».
//
// Trois sources, jamais mélangées :
//   1. quantités  — calculées par le serveur (mode `materiaux-devis`, règles de
//                   métré du socle), mises en cache sur le devis (colonne
//                   `devis.materiaux`), une seule fois.
//   2. prix réels — table `artisan_prix_achat`, les siens, saisis ou lus sur une
//                   facture fournisseur. Ils PRIMENT toujours.
//   3. estimation — fourchette d'achat renvoyée par le serveur, affichée en ambre
//                   avec le mot « estimation », et retirée dès qu'un prix réel
//                   existe. Elle n'entre JAMAIS dans une ligne du devis : elle
//                   ne sert qu'à la marge.
//
// Ce module rend l'interface du volet « Fournitures et matériaux » ; la page ne
// fait que l'appeler avec le devis ouvert.

import { supabase, getSession } from './supabase.js';

const UNITES_LISIBLES = { m2: 'm²', m3: 'm³' };

function eur(n) {
  return (Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}
function normaliser(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function uniteNorm(u) {
  const x = String(u || 'u').toLowerCase().replace('²', '2').replace('³', '3').trim();
  return x === 'unite' || x === 'unité' || x === 'piece' ? 'u' : x;
}

// ── Prix d'achat de l'artisan ─────────────────────────────────────────────
let _cachePrix = null;

export async function chargerPrixAchat({ recharger = false } = {}) {
  if (_cachePrix && !recharger) return _cachePrix;
  const { data, error } = await supabase.from('artisan_prix_achat')
    .select('id, label, unit, prix_achat, fournisseur, source, updated_at')
    .order('label', { ascending: true });
  if (error) throw error;
  _cachePrix = data || [];
  return _cachePrix;
}

/** Enregistre (ou remplace) un prix d'achat. Rend la ligne. */
export async function enregistrerPrixAchat({ label, unit, prix, fournisseur = null, source = 'saisie' }) {
  const session = await getSession();
  if (!session) throw new Error('non connecté');
  const ligne = {
    user_id: session.user.id,
    label: String(label || '').trim().slice(0, 160),
    unit: uniteNorm(unit),
    prix_achat: Number(prix),
    fournisseur: fournisseur ? String(fournisseur).slice(0, 80) : null,
    source,
    updated_at: new Date().toISOString(),
  };
  if (!ligne.label || !(ligne.prix_achat >= 0)) throw new Error('prix invalide');
  // L'index unique porte sur (user_id, lower(label), unit) : on cherche d'abord
  // pour mettre à jour, l'upsert PostgREST ne sait pas viser un index d'expression.
  const existants = await chargerPrixAchat({ recharger: true });
  const deja = existants.find((p) => p.label.toLowerCase() === ligne.label.toLowerCase() && uniteNorm(p.unit) === ligne.unit);
  let res;
  if (deja) {
    res = await supabase.from('artisan_prix_achat').update({ prix_achat: ligne.prix_achat, fournisseur: ligne.fournisseur, source, updated_at: ligne.updated_at }).eq('id', deja.id).select().single();
  } else {
    res = await supabase.from('artisan_prix_achat').insert(ligne).select().single();
  }
  if (res.error) throw res.error;
  _cachePrix = null;
  return res.data;
}

export async function supprimerPrixAchat(id) {
  const { error } = await supabase.from('artisan_prix_achat').delete().eq('id', id);
  if (error) throw error;
  _cachePrix = null;
}

/** Le prix réel qui correspond à un matériau, ou null. Même unité, libellé
 *  identique ou contenant tous les mots significatifs de l'autre. */
export function apparier(materiau, prix) {
  const u = uniteNorm(materiau.unite);
  const nomM = normaliser(materiau.nom);
  const motsM = nomM.split(' ').filter((m) => m.length > 2);
  let meilleur = null, score = 0;
  for (const p of prix || []) {
    if (uniteNorm(p.unit) !== u) continue;
    const nomP = normaliser(p.label);
    if (nomP === nomM) return p;
    const motsP = nomP.split(' ').filter((m) => m.length > 2);
    const communs = motsM.filter((m) => motsP.includes(m)).length;
    const ratio = communs / Math.max(1, Math.min(motsM.length, motsP.length));
    if (communs >= 2 && ratio >= 0.6 && ratio > score) { score = ratio; meilleur = p; }
  }
  return meilleur;
}

// ── Calcul serveur ───────────────────────────────────────────────────────
export async function calculerMateriaux(quote) {
  const cfg = window.__BATISPOT_CONFIG__ || {};
  const base = cfg.SUPABASE_URL || 'https://cisniwhaiydazdpzvino.supabase.co';
  const h = { 'content-type': 'application/json' };
  if (cfg.SUPABASE_ANON_KEY) {
    h['apikey'] = cfg.SUPABASE_ANON_KEY;
    const jeton = (typeof window.bsJetonSession === 'function' && window.bsJetonSession()) || cfg.SUPABASE_ANON_KEY;
    h['authorization'] = 'Bearer ' + jeton;
  }
  // Seules les lignes voyagent : désignation, quantité, unité. Ni le client ni les prix de vente.
  const lignes = [];
  (quote.lots || []).forEach((lot) => {
    (lot.lines || lot.items || lot.lignes || []).forEach((l) => {
      lignes.push({ designation: l.desig || l.label || l.description || '', quantite: l.qte || l.quantite || '', unite: l.unit || '' });
    });
  });
  if (!lignes.length) return { materiaux: [], avertissements: ['Ce devis n\'a pas de lignes détaillées.'] };
  let prixAchat = [];
  try { prixAchat = (await chargerPrixAchat()).map((p) => ({ label: p.label, unit: p.unit, prix: Number(p.prix_achat) })); } catch (_) {}
  const ctrl = new AbortController();
  const killer = setTimeout(() => ctrl.abort(), 45_000);
  let r;
  try {
    r = await fetch(base + '/functions/v1/gemini-assistant', {
      method: 'POST', headers: h, signal: ctrl.signal,
      body: JSON.stringify({
        mode: 'materiaux-devis',
        prompt: 'Prépare la liste des matériaux de ce devis.',
        baseQuote: { objet: quote.title || '', lignes },
        prixArtisan: prixAchat.map((p) => ({ label: p.label, unit: p.unit, price: p.prix })),
      }),
    });
  } finally { clearTimeout(killer); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) {
    const err = new Error(j.text || j.error || ('HTTP ' + r.status)); err.name = j.error || 'http'; throw err;
  }
  let data = j.data;
  if (!data && typeof j.text === 'string') { try { data = JSON.parse(j.text); } catch (_) {} }
  const materiaux = Array.isArray(data?.materiaux) ? data.materiaux : [];
  return {
    materiaux: materiaux.filter((m) => m && m.nom).map((m) => ({
      nom: String(m.nom).slice(0, 120),
      categorie: m.categorie || 'Autre',
      quantite: Number(m.quantite) || 0,
      unite: String(m.unite || 'u'),
      base: m.base || '',
      estimationMin: m.estimationMin != null ? Number(m.estimationMin) : null,
      estimationMax: m.estimationMax != null ? Number(m.estimationMax) : null,
      pourLigne: m.pourLigne || '',
    })),
    avertissements: Array.isArray(data?.avertissements) ? data.avertissements.slice(0, 5) : [],
    // Outillage à charger (Moctar, 05/09 : « visseuse, ponceuse… ») : jamais
    // de prix, c'est le sien. Tableau vide = le serveur n'a rien vu à prévoir.
    outillage: (Array.isArray(data?.outillage) ? data.outillage : [])
      .filter((o) => o && o.nom)
      .slice(0, 40)
      .map((o) => ({
        nom: String(o.nom).slice(0, 80),
        pourLigne: o.pourLigne ? String(o.pourLigne).slice(0, 120) : '',
        note: o.note ? String(o.note).slice(0, 120) : '',
      })),
    calculeLe: new Date().toISOString(),
  };
}

/** Met en cache la liste sur le devis en base (colonne `materiaux`). Best-effort. */
export async function sauverMateriauxDevis(dbId, materiaux) {
  if (!dbId) return false;
  const { error } = await supabase.from('devis').update({ materiaux }).eq('id', dbId);
  if (error) { console.warn('[matériaux] cache non enregistré :', error.message); return false; }
  return true;
}

// ── Totaux ───────────────────────────────────────────────────────────────
export function totaux(materiaux, prix) {
  let reel = 0, estMin = 0, estMax = 0, nbReel = 0, nbEst = 0, nbSans = 0;
  for (const m of materiaux || []) {
    const p = apparier(m, prix);
    if (p) { reel += m.quantite * Number(p.prix_achat); nbReel++; }
    else if (m.estimationMin != null && m.estimationMax != null) { estMin += m.quantite * m.estimationMin; estMax += m.quantite * m.estimationMax; nbEst++; }
    else nbSans++;
  }
  return { reel, estMin, estMax, nbReel, nbEst, nbSans, totalMin: reel + estMin, totalMax: reel + estMax };
}

// ── Rendu du volet ───────────────────────────────────────────────────────
/**
 * @param {HTMLElement} conteneur
 * @param {object} quote  devis ouvert (lots, _dbId, materiaux?)
 * @param {{onTotaux?: (t:object)=>void, onMateriaux?: (m:object)=>void}} opts
 */
export async function rendreVolet(conteneur, quote, opts = {}) {
  if (!conteneur) return;
  conteneur.innerHTML = '';
  const info = (txt, style = '') => {
    const d = document.createElement('div');
    d.style.cssText = 'font-size:12px;color:#5A7268;padding:8px 2px;line-height:1.45;' + style;
    d.textContent = txt; return d;
  };

  let prix = [];
  try { prix = await chargerPrixAchat(); } catch (_) {}

  let cache = quote.materiaux && Array.isArray(quote.materiaux.materiaux) ? quote.materiaux : null;
  if (!cache) {
    conteneur.appendChild(info('Calcul de la liste des matériaux à partir des lignes du devis…'));
    try {
      cache = await calculerMateriaux(quote);
      quote.materiaux = cache;
      if (quote._dbId) sauverMateriauxDevis(quote._dbId, cache);
      opts.onMateriaux && opts.onMateriaux(cache);
    } catch (e) {
      conteneur.innerHTML = '';
      const msg = e && e.name === 'quota_atteint' ? "Limite d'utilisation de l'assistant atteinte pour aujourd'hui."
        : "La liste n'a pas pu être calculée. Réessayez dans un instant.";
      conteneur.appendChild(info(msg, 'color:#9A3412;'));
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'mq-btn mq-ghost'; btn.textContent = 'Réessayer';
      btn.addEventListener('click', () => rendreVolet(conteneur, quote, opts));
      conteneur.appendChild(btn);
      return;
    }
    conteneur.innerHTML = '';
  }

  const liste = cache.materiaux || [];
  if (!liste.length) {
    conteneur.appendChild(info('Aucun matériau déduit de ce devis : ses lignes ne décrivent pas d\'ouvrage à fournir.'));
    return;
  }

  const dessiner = () => {
    conteneur.innerHTML = '';
    const t = totaux(liste, prix);
    liste.forEach((m) => {
      const p = apparier(m, prix);
      const carte = document.createElement('div');
      carte.style.cssText = 'display:flex;flex-direction:column;gap:3px;font-size:12px;padding:8px 10px;background:#F7FBF8;border-radius:8px;';
      const haut = document.createElement('div');
      haut.style.cssText = 'display:flex;justify-content:space-between;gap:8px;align-items:baseline;';
      const nom = document.createElement('span');
      nom.style.cssText = 'font-weight:700;color:#1C2B22;';
      nom.textContent = m.nom;
      const qte = document.createElement('strong');
      qte.style.cssText = 'color:#1C2B22;white-space:nowrap;font-variant-numeric:tabular-nums;';
      qte.textContent = (Number.isInteger(m.quantite) ? m.quantite : m.quantite.toFixed(1)) + ' ' + (UNITES_LISIBLES[m.unite] || m.unite);
      haut.appendChild(nom); haut.appendChild(qte);
      carte.appendChild(haut);
      if (m.base) {
        const b = document.createElement('span'); b.style.cssText = 'font-size:10.5px;color:#5A7268;'; b.textContent = m.base; carte.appendChild(b);
      }
      const ligne = document.createElement('div');
      ligne.style.cssText = 'display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:2px;';
      const gauche = document.createElement('span');
      const droite = document.createElement('span');
      droite.style.cssText = 'white-space:nowrap;font-variant-numeric:tabular-nums;font-weight:800;';
      if (p) {
        gauche.innerHTML = '<span style="color:#1B7049;font-weight:700;">Votre prix</span> <span style="color:#5A7268;">' + eur(p.prix_achat) + ' / ' + (UNITES_LISIBLES[uniteNorm(p.unit)] || p.unit) + (p.fournisseur ? ' · ' + p.fournisseur : '') + '</span>';
        droite.style.color = '#1B7049';
        droite.textContent = eur(m.quantite * Number(p.prix_achat));
      } else if (m.estimationMin != null && m.estimationMax != null) {
        gauche.innerHTML = '<span style="color:#B45309;font-weight:700;">Estimation</span> <span style="color:#5A7268;">' + eur(m.estimationMin) + ' – ' + eur(m.estimationMax) + ' / ' + (UNITES_LISIBLES[m.unite] || m.unite) + '</span>';
        droite.style.color = '#B45309';
        droite.textContent = eur(m.quantite * m.estimationMin) + ' – ' + eur(m.quantite * m.estimationMax);
      } else {
        gauche.innerHTML = '<span style="color:#5A7268;">Prix inconnu</span>';
        droite.textContent = '—';
      }
      ligne.appendChild(gauche); ligne.appendChild(droite);
      carte.appendChild(ligne);

      // Renseigner / corriger SON prix d'achat, sur place.
      const saisie = document.createElement('div');
      saisie.style.cssText = 'display:none;gap:6px;align-items:center;margin-top:4px;';
      const champ = document.createElement('input');
      champ.type = 'number'; champ.step = '0.01'; champ.min = '0'; champ.inputMode = 'decimal';
      champ.placeholder = 'Prix d\'achat HT / ' + (UNITES_LISIBLES[m.unite] || m.unite);
      champ.value = p ? Number(p.prix_achat) : '';
      champ.className = 'form-input';
      champ.style.cssText = 'flex:1;font-size:16px;padding:7px 8px;';
      const ok = document.createElement('button');
      ok.type = 'button'; ok.className = 'mq-btn mq-primary'; ok.style.cssText = 'min-height:36px;padding:0 12px;font-size:12.5px;';
      ok.textContent = 'Enregistrer';
      ok.addEventListener('click', async () => {
        const v = parseFloat(String(champ.value).replace(',', '.'));
        if (!(v >= 0)) return;
        ok.disabled = true;
        try {
          await enregistrerPrixAchat({ label: m.nom, unit: m.unite, prix: v });
          prix = await chargerPrixAchat({ recharger: true });
          dessiner();
          if (typeof window.showToast === 'function') window.showToast('Prix d\'achat enregistré : il servira à tous vos prochains devis.');
        } catch (e) {
          ok.disabled = false;
          if (typeof window.showToast === 'function') window.showToast('Prix non enregistré : ' + (e.message || 'réessayez'), true);
        }
      });
      saisie.appendChild(champ); saisie.appendChild(ok);
      const lien = document.createElement('button');
      lien.type = 'button';
      lien.style.cssText = 'background:none;border:none;padding:0;margin-top:2px;align-self:flex-start;font-size:11.5px;font-weight:800;color:#1B7049;cursor:pointer;text-decoration:underline;';
      lien.textContent = p ? 'Modifier mon prix' : 'Renseigner mon prix d\'achat';
      lien.addEventListener('click', () => { saisie.style.display = saisie.style.display === 'flex' ? 'none' : 'flex'; if (saisie.style.display === 'flex') champ.focus(); });
      carte.appendChild(lien);
      carte.appendChild(saisie);
      conteneur.appendChild(carte);
    });

    // Total et incitation.
    const total = document.createElement('div');
    total.style.cssText = 'display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:900;padding:10px 2px 4px;border-top:1.5px solid #E7EEEA;margin-top:4px;';
    const lib = document.createElement('span'); lib.textContent = 'Achat matériaux HT';
    const val = document.createElement('span'); val.style.cssText = 'white-space:nowrap;font-variant-numeric:tabular-nums;';
    if (t.nbEst === 0 && t.nbSans === 0) { val.style.color = '#1B7049'; val.textContent = eur(t.reel) + ' (vos prix)'; }
    else { val.style.color = '#B45309'; val.textContent = eur(t.totalMin) + ' – ' + eur(t.totalMax); }
    total.appendChild(lib); total.appendChild(val);
    conteneur.appendChild(total);
    if (t.nbEst > 0 || t.nbSans > 0) {
      const nudge = document.createElement('div');
      nudge.style.cssText = 'font-size:12px;color:#B45309;background:#FBEFE3;border-radius:8px;padding:8px 10px;line-height:1.45;';
      nudge.textContent = 'Pour une marge plus précise, renseignez vos prix d\'achat : ' + (t.nbEst + t.nbSans) + ' matériau' + (t.nbEst + t.nbSans > 1 ? 'x' : '') + ' sur ' + liste.length + ' repose' + (t.nbEst + t.nbSans > 1 ? 'nt' : '') + ' sur une estimation. Vous pouvez aussi déposer vos factures fournisseurs dans Mon entreprise › Grille de prix.';
      conteneur.appendChild(nudge);
    } else {
      conteneur.appendChild(info('Calculé avec vos prix d\'achat. Les quantités viennent des rendements de pose : vérifiez-les avant de commander.'));
    }
    if (cache.avertissements && cache.avertissements.length) {
      conteneur.appendChild(info('À vérifier : ' + cache.avertissements.join(' · ')));
    }
    dessinerOutillage(conteneur, quote, cache, opts);
    opts.onTotaux && opts.onTotaux(t);
  };
  dessiner();
}

// ── Outillage à prévoir ──────────────────────────────────────────────────
// Ce que l'artisan charge dans le camion pour ce devis. Pas de prix, pas de
// quantité à commander : une liste à cocher de tête. Les listes calculées
// avant le 05/09 n'ont pas ce champ → on propose de recalculer, sans le faire
// dans son dos (un appel au modèle coûte).
function dessinerOutillage(conteneur, quote, cache, opts) {
  const bloc = document.createElement('div');
  bloc.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1.5px solid #E7EEEA;';
  const titre = document.createElement('div');
  titre.style.cssText = 'font-size:12px;font-weight:900;color:#1C2B22;padding:0 2px 6px;';
  titre.textContent = 'Outillage à prévoir';
  bloc.appendChild(titre);

  if (!Array.isArray(cache.outillage)) {
    const p = document.createElement('div');
    p.style.cssText = 'font-size:12px;color:#5A7268;padding:0 2px;line-height:1.45;';
    p.textContent = 'Liste calculée avant l\'ajout de l\'outillage. ';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = 'background:none;border:none;padding:0;font-size:12px;font-weight:800;color:#1B7049;cursor:pointer;text-decoration:underline;';
    btn.textContent = 'Recalculer avec l\'outillage';
    btn.addEventListener('click', () => { quote.materiaux = null; rendreVolet(conteneur, quote, opts); });
    p.appendChild(btn);
    bloc.appendChild(p);
    conteneur.appendChild(bloc);
    return;
  }
  if (!cache.outillage.length) {
    const p = document.createElement('div');
    p.style.cssText = 'font-size:12px;color:#5A7268;padding:0 2px;';
    p.textContent = 'Rien de particulier au-delà de l\'outillage courant.';
    bloc.appendChild(p);
    conteneur.appendChild(bloc);
    return;
  }
  const ul = document.createElement('ul');
  ul.style.cssText = 'list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;';
  cache.outillage.forEach((o) => {
    const li = document.createElement('li');
    li.style.cssText = 'display:flex;gap:8px;align-items:baseline;font-size:12px;padding:6px 10px;background:#F7FBF8;border-radius:8px;';
    const nom = document.createElement('span');
    nom.style.cssText = 'font-weight:700;color:#1C2B22;';
    nom.textContent = o.nom;
    li.appendChild(nom);
    if (o.note) {
      const n = document.createElement('span');
      n.style.cssText = 'color:#5A7268;';
      n.textContent = o.note;
      li.appendChild(n);
    }
    if (o.pourLigne) {
      const l = document.createElement('span');
      l.style.cssText = 'margin-left:auto;color:#8AA096;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40%;';
      l.title = o.pourLigne;
      l.textContent = o.pourLigne;
      li.appendChild(l);
    }
    ul.appendChild(li);
  });
  bloc.appendChild(ul);
  const note = document.createElement('div');
  note.style.cssText = 'font-size:11.5px;color:#5A7268;padding:6px 2px 0;line-height:1.45;';
  note.textContent = 'Déduit des lignes du devis. Sans prix : c\'est votre matériel.';
  bloc.appendChild(note);
  conteneur.appendChild(bloc);
}

// BatiSpot Pro — Persistance des devis. UNIQUE point d'écriture de l'application.
//
// Règle de conception : l'artisan est sur un chantier, souvent sans réseau.
//   1. on écrit d'abord sur l'appareil (localStorage) — synchrone, ne peut pas échouer ;
//   2. on tente ensuite la synchronisation Supabase ;
//   3. si elle échoue, le devis reste lisible et on le dit honnêtement.
//
// Aucun écran n'annonce « enregistré » sans savoir OÙ. Les appelants reçoivent
// un `etat` (`'synchro'` | `'local'`) et composent leur message à partir de ça.
//
// Les quatre chemins de création de devis.html (formulaire, notes de visite,
// dictée, assistant) ET l'action `creer_devis` de l'assistant passent tous ici.

import { supabase, getSession } from './supabase.js';

const CLE_DEVIS = 'batispot_devis_v1';
const CLE_CACHE_NUM = 'batispot_devis_numeros_v1';

const norm = (s) => (s || '').toString().trim().toLowerCase();

function uuid() {
  try {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
  } catch (_) {}
  return 'lid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// ── Journal local ──────────────────────────────────────────
// Chaque entrée : { lid, dbId, sync: 'attente'|'ok', err, majAt, quote }

export function lireLocal() {
  try {
    const brut = localStorage.getItem(CLE_DEVIS);
    const arr = brut ? JSON.parse(brut) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function ecrireLocal(entrees) {
  try {
    localStorage.setItem(CLE_DEVIS, JSON.stringify(entrees));
    return true;
  } catch (e) {
    console.error('[devis-store] écriture locale impossible', e);
    return false;
  }
}

function majEntree(lid, patch) {
  const arr = lireLocal();
  const i = arr.findIndex((e) => e.lid === lid);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch, majAt: new Date().toISOString() };
  ecrireLocal(arr);
  return arr[i];
}

export function nbEnAttente() {
  return lireLocal().filter((e) => e.sync !== 'ok').length;
}

// ── Numérotation ───────────────────────────────────────────
// Le numéro est décidé localement (pour rester stable sous les yeux de l'artisan,
// y compris hors ligne) puis confirmé à la synchronisation : si le serveur connaît
// déjà ce numéro, on en prend le premier libre. Pas de collision silencieuse.

function numerosConnus() {
  let cache = [];
  try { cache = JSON.parse(localStorage.getItem(CLE_CACHE_NUM) || '[]'); } catch (_) {}
  const locaux = lireLocal().map((e) => e.quote && e.quote.id).filter(Boolean);
  return new Set([...(Array.isArray(cache) ? cache : []), ...locaux]);
}

function cacherNumeros(numeros) {
  try { localStorage.setItem(CLE_CACHE_NUM, JSON.stringify(numeros)); } catch (_) {}
}

function formatNumero(annee, n) {
  return `DEV-${annee}-${String(n).padStart(4, '0')}`;
}

function seq(numero) {
  const v = parseInt(String(numero || '').split('-').pop(), 10);
  return isNaN(v) ? 0 : v;
}

// Prochain numéro d'après ce que l'appareil sait (cache serveur + devis locaux).
export function numeroLocalSuivant() {
  const annee = new Date().getFullYear();
  const pris = numerosConnus();
  let max = 0;
  pris.forEach((num) => {
    if (String(num).startsWith(`DEV-${annee}-`)) max = Math.max(max, seq(num));
  });
  let n = max + 1;
  while (pris.has(formatNumero(annee, n))) n++;
  return formatNumero(annee, n);
}

// ── D'où se LIT un devis, et où il s'ÉCRIT ────────────────────────────────
// Depuis le 23/08/2026, les colonnes d'argent de la table `devis` (total_ht,
// total_tva, total_ttc, tva_globale, cout_prevu_ht, lines) ne sont plus
// lisibles par le rôle `authenticated` : le privilège de colonne leur a été
// retiré. Un `select('*')` sur `devis` répond 403 — pour le patron aussi.
//
// Ce n'est pas une régression, c'est le seul moyen d'empêcher un compagnon de
// lire les prix en tapant l'API directement : la RLS filtre des LIGNES, jamais
// des COLONNES. Le masquage vit donc dans la vue `devis_visible`, qui ne cache
// rien au patron ni à un chef autorisé.
//
//   LECTURE  → devis_visible   (masquée selon le rôle, jointure chantiers OK)
//   ÉCRITURE → devis           (insert/update, en ne relisant QUE des colonnes
//                               autorisées : sinon le RETURNING repasse 403)
const TABLE_DEVIS = 'devis';            // écriture
const VUE_DEVIS   = 'devis_visible';    // lecture
// Colonnes sûres à relire juste après une écriture. Le reste (montants) est
// rechargé depuis la vue par relireDevis().
// `chantiers(public_token)` ajoute le 02/09/2026 : sans lui, `row.chantiers`
// est absent apres une ecriture et l'entree locale reste sans jeton — donc le
// document officiel du devis reste inaccessible jusqu'au prochain rechargement
// complet. Ce n'est PAS une colonne d'argent : le 403 vise total_ht, total_tva,
// total_ttc, tva_globale, cout_prevu_ht et lines, pas une jointure.
const SELECT_APRES_ECRITURE = 'id, numero, status, chantier_id, objet, created_at, updated_at, chantiers(public_token)';

// Recharge un devis complet (montants inclus, selon les droits) après écriture.
async function relireDevis(id) {
  const { data, error } = await supabase
    .from(VUE_DEVIS).select(SELECT_DEVIS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// Le devis déjà en base qui porte ce numéro (le mien : la RLS ne me montre
// que les miens). Sert au rattrapage d'un insert refusé pour doublon.
async function devisParNumero(numero) {
  const { data, error } = await supabase
    .from(VUE_DEVIS).select(SELECT_DEVIS).eq('numero', numero).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

// 23505 = unique_violation. Depuis le 05/09/2026 la base porte un index
// unique sur (pro_id, numero) : c'est elle, et elle seule, qui garantit
// qu'un numéro de devis n'existe qu'une fois — deux onglets ou deux appareils
// passent à côté du verrou de synchronisation, jamais à côté de celui-ci.
//
// Un refus pour doublon N'EST PAS une erreur ici : il dit « ce devis est déjà
// synchronisé ». Le traiter comme un échec remettrait l'entrée en `attente` et
// la ferait rejouer à chaque retour de réseau, indéfiniment.
function estConflitNumero(e) {
  const code = e && (e.code || e.details?.code);
  if (String(code) !== '23505') return false;
  const txt = `${e.message || ''} ${e.details || ''} ${e.constraint || ''}`.toLowerCase();
  return txt.includes('numero') || txt.includes('devis_pro_numero');
}

// Confirme (ou remplace) le numéro souhaité en interrogeant la base.
async function numeroLibre(souhaite) {
  const annee = new Date().getFullYear();
  const { data, error } = await supabase
    .from(TABLE_DEVIS)
    .select('numero')
    .like('numero', `DEV-${annee}-%`);
  if (error) throw error;
  const pris = new Set((data || []).map((d) => d.numero));
  cacherNumeros([...pris]);
  if (souhaite && !pris.has(souhaite)) return souhaite;
  let max = 0;
  pris.forEach((num) => { max = Math.max(max, seq(num)); });
  let n = max + 1;
  while (pris.has(formatNumero(annee, n))) n++;
  return formatNumero(annee, n);
}

// ── Chantiers (un devis est toujours rattaché à un chantier en base) ──

export async function trouverChantier(recherche) {
  const q = norm(recherche);
  if (!q) return null;
  const { data, error } = await supabase
    .from('chantiers')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).find(
    (c) => norm(c.client_name).includes(q) || norm(c.adresse).includes(q)
  ) || null;
}

// L'identité « entreprise » : les policies RLS comparent pro_id à mon_entreprise(),
// qui vaut auth.uid() pour le patron mais le pro_id du patron pour un salarié.
// Utiliser auth.uid() en dur ferait échouer toute écriture d'un membre d'équipe.
async function proId(session) {
  try {
    const { data, error } = await supabase.rpc('mon_entreprise');
    if (!error && data) return data;
  } catch (_) {}
  return session.user.id;
}

export async function trouverOuCreerChantier(clientName, adresse, session) {
  const existant = await trouverChantier(clientName);
  if (existant) return existant;
  const { data, error } = await supabase
    .from('chantiers')
    .insert({
      client_name: clientName || 'Client à préciser',
      adresse: adresse || null,
      status: 'en_attente',
      // `description` sert de TITRE du chantier, y compris sur la page que le
      // client ouvre. On y ecrivait « Créé automatiquement à l'enregistrement
      // d'un devis » : une note de plomberie interne, affichee en gros au
      // client comme si c'etait le nom de ses travaux. On laisse vide — la page
      // retombe alors sur « Chantier — <nom du client> », qui veut dire quelque
      // chose. L'artisan renomme quand il veut.
      description: null,
      pro_id: await proId(session),
    })
    .select()
    .single();
  if (error) throw error;
  // Marque « créé par cet appel », invisible aux spreads et à JSON : elle
  // permet à pousserEnBase de défaire CE chantier-là si le devis, lui, est
  // refusé pour doublon (voir plus bas). Un chantier retrouvé n'est jamais
  // marqué : on ne défait que ce qu'on vient de faire.
  Object.defineProperty(data, '_cree', { value: true, enumerable: false });
  return data;
}

// ── Conversions UI ⇄ base ──────────────────────────────────
// Format UI (quotesDB)  : { id, ver, client, address, title, status, statusLabel,
//                           totHt, totTva, totTtc, acompte, lots:[{name, lines:[
//                           {desig, qte:"14 m²", pu, tot, _tva}]}], supplies, … }
// Format base (devis)   : { numero, objet, lines:[{lot, description, quantity,
//                           unit, unitPrice, vatRate, total_ht}], total_* , status }

function decouperQte(qte) {
  const m = String(qte == null ? '1' : qte).trim().match(/^([\d\s.,]+)\s*(.*)$/);
  if (!m) return { quantity: 1, unit: 'u' };
  const nombre = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'));
  return {
    quantity: isNaN(nombre) ? 1 : nombre,
    unit: (m[2] || 'u').trim() || 'u',
  };
}

// Taux de TVA d'une ligne, en pourcentage. `_tva` est une fraction (0.10) dans l'UI.
function tauxLigne(ligne, tauxDefaut) {
  let t = ligne._tva;
  if (t == null) return tauxDefaut;
  t = parseFloat(t);
  // 0 % est un taux CHOISI (franchise en base, art. 293 B), pas une absence.
  // `!(t > 0)` le renvoyait au taux par defaut : une ligne exoneree ressortait
  // a 10 %. Seule une valeur non numerique justifie le repli.
  if (!Number.isFinite(t) || t < 0) return tauxDefaut;
  return t <= 1 ? t * 100 : t;
}

export function lotsVersLignes(lots, totHt, totTva) {
  // Si aucune ligne ne porte son taux, on retombe sur le taux global effectif :
  // les totaux affichés à l'artisan restent alors exacts au rechargement.
  const global = totHt > 0 ? (totTva / totHt) * 100 : 10;
  const out = [];
  (lots || []).forEach((lot) => {
    (lot.lines || []).forEach((l) => {
      const { quantity, unit } = decouperQte(l.qte);
      const pu = Number(l.pu) || 0;
      const tot = l.tot != null ? Number(l.tot) : quantity * pu;
      out.push({
        lot: lot.name || null,
        description: l.desig || 'Prestation',
        quantity,
        unit,
        unitPrice: pu,
        vatRate: tauxLigne(l, global),
        total_ht: tot,
      });
    });
  });
  return out;
}

export function lignesVersLots(lignes) {
  const parLot = {};
  const ordre = [];
  (lignes || []).forEach((l) => {
    const nom = l.lot || 'Lot 01 — Ouvrages';
    if (!parLot[nom]) { parLot[nom] = []; ordre.push(nom); }
    const q = Number(l.quantity) || 0;
    const pu = Number(l.unitPrice) || 0;
    parLot[nom].push({
      desig: l.description || 'Prestation',
      qte: `${q} ${l.unit || 'u'}`.trim(),
      pu,
      tot: l.total_ht != null ? Number(l.total_ht) : q * pu,
      // 0 % est un taux CHOISI : `|| 10` le ramenait a 10 % a chaque
      // aller-retour. Un devis exonere revenait taxe dans l'editeur, et la
      // moindre modification le sauvegardait faux.
      _tva: (Number.isFinite(Number(l.vatRate)) ? Number(l.vatRate) : 10) / 100,
    });
  });
  return ordre.map((nom) => ({ name: nom, lines: parLot[nom] }));
}

/**
 * LE recalcul des totaux d'un devis, à partir de ses lignes.
 *
 * Ce calcul existait en trois copies (devis.html : bsBuildQuoteFromLLM,
 * confirmNewVersion, saveQuote), et elles avaient déjà divergé — c'est le motif
 * qui a produit « 0 € à l'écran, 1 500 € en base ». Un devis modifié par
 * l'assistant emprunte donc la même fonction que l'écran.
 *
 * Le total d'une ligne est TOUJOURS quantité × prix unitaire : on ne conserve
 * pas un `tot` hérité qui ne correspondrait plus aux deux autres champs.
 * 0 % de TVA est un taux CHOISI (franchise en base, art. 293 B), jamais une
 * absence : seule une valeur non numérique retombe sur 10 %.
 *
 * @param {object} quote        devis au format UI ({ lots:[{ lines:[…] }] })
 * @param {number} [acomptePct] pourcentage d'acompte, 30 par défaut
 * @returns {object} le MÊME objet, totaux à jour
 */
export function recalculerTotaux(quote, acomptePct) {
  let totHt = 0;
  let totTva = 0;
  (quote.lots || []).forEach((lot) => {
    (lot.lines || []).forEach((l) => {
      const { quantity } = decouperQte(l.qte);
      const pu = Number(l.pu) || 0;
      const tot = quantity * pu;
      l.tot = tot;
      let t = Number(l._tva);
      if (!Number.isFinite(t) || t < 0) t = 0.10;
      if (t > 1) t = t / 100;             // tolère 10 comme 0.10
      l._tva = t;
      totHt += tot;
      totTva += tot * t;
    });
  });
  const totTtc = totHt + totTva;
  const pct = Number.isFinite(Number(acomptePct)) ? Number(acomptePct) : 30;
  quote.totHt = totHt;
  quote.totTva = totTva;
  quote.totTtc = totTtc;
  quote.acompte = totTtc * (pct / 100);
  return quote;
}

// UI → base. Les statuts UI sont plus pauvres que ceux de la base : on ne
// « rétrograde » jamais un devis déjà envoyé/accepté côté serveur.
const UI_VERS_BASE = { attente: 'brouillon', signe: 'accepte', termine: 'accepte' };
const BASE_VERS_UI = {
  brouillon: { status: 'attente', statusLabel: 'Brouillon' },
  envoye: { status: 'attente', statusLabel: 'Envoyé au client' },
  accepte: { status: 'signe', statusLabel: 'Accepté par le client' },
  refuse: { status: 'attente', statusLabel: 'Refusé' },
  expire: { status: 'attente', statusLabel: 'Expiré' },
};

// Le statut a REPOUSSER en base. Les statuts UI sont quatre fois plus pauvres
// que ceux de la base : 'envoye', 'refuse' et 'expire' retombent tous sur
// 'attente'. Traduire betement dans l'autre sens RETROGRADAIT le devis :
// modifier une ligne d'un devis deja ENVOYE au client le renvoyait a
// « brouillon » en base — l'artisan perdait la trace de son envoi, et les
// relances (qui filtrent sur 'envoye') cessaient de le voir. Verifie le
// 05/09/2026 sur le compte de test : D-TEST-001, 'envoye', repassait
// 'brouillon' a chaque enregistrement.
//
// Regle : si le statut UI signifie encore la meme chose que le statut de base
// d'ou il vient, on repousse celui d'origine. Un vrai changement d'etat (la
// signature : 'attente' -> 'signe') passe, lui, normalement.
function statutPourBase(quote) {
  const origine = quote._statutBase;
  if (origine && BASE_VERS_UI[origine] && BASE_VERS_UI[origine].status === quote.status) {
    return origine;
  }
  return UI_VERS_BASE[quote.status] || 'brouillon';
}

function ligneBase(quote) {
  const lignes = lotsVersLignes(quote.lots, Number(quote.totHt) || 0, Number(quote.totTva) || 0);
  return {
    numero: quote.id,
    objet: quote.title || 'Devis',
    lines: lignes,
    total_ht: Number(quote.totHt) || 0,
    total_tva: Number(quote.totTva) || 0,
    total_ttc: Number(quote.totTtc) || 0,
    status: statutPourBase(quote),
    validite_jours: Number(quote.validiteJours) || 30,
    notes: quote.notes || null,
  };
}

// Base → UI. Ni les fournitures ni la marge ne sont stockées : ce ne sont pas
// des données saisies mais des estimations. On affiche un tiret plutôt qu'un
// pourcentage inventé — même règle que finances.html et que le reste de l'écran.
export function rangeeVersQuote(row) {
  const st = BASE_VERS_UI[row.status] || BASE_VERS_UI.brouillon;
  return {
    id: row.numero,
    _dbId: row.id,
    ver: 'v1',
    client: (row.chantiers && row.chantiers.client_name) || 'Client',
    address: (row.chantiers && row.chantiers.adresse) || 'Adresse à préciser',
    // Sert a savoir s'il est possible de PROPOSER l'envoi par email. On ne
    // propose pas une option qu'on ne pourrait pas honorer, et on n'affiche
    // jamais cette adresse : elle ne sert qu'a ce test.
    clientEmail: (row.chantiers && row.chantiers.client_email) || null,
    // Sert a ouvrir le DOCUMENT officiel (devis-document.html), celui qui porte
    // les mentions obligatoires et la signature du client. L'artisan n'y avait
    // pas acces : son bouton « Telecharger en PDF » imprimait la modale de
    // l'appli, sans mentions legales et sans signature.
    publicToken: (row.chantiers && row.chantiers.public_token) || null,
    // Le chantier VISÉ par ce devis — pas une recherche par nom. Sert à
    // modifier_client (app-actions.js) pour ne jamais toucher au chantier
    // d'un autre client qui porterait un nom ou une adresse ressemblants.
    chantierId: row.chantier_id || null,
    title: row.objet || 'Devis',
    status: st.status,
    statusLabel: st.statusLabel,
    // Statut BRUT de la base, garde pour ne pas retrograder le devis a la
    // prochaine ecriture (voir statutPourBase). Jamais affiche, jamais ecrit.
    _statutBase: row.status,
    totHt: Number(row.total_ht) || 0,
    totTva: Number(row.total_tva) || 0,
    totTtc: Number(row.total_ttc) || 0,
    acompte: (Number(row.total_ttc) || 0) * 0.3,
    lots: lignesVersLots(row.lines),
    supplies: [],
    // Liste des matériaux calculée une fois (04/09) — null tant qu'elle n'a
    // pas été demandée ; la vue la masque aux rôles sans droit sur les marges.
    materiaux: row.materiaux || null,
    _dbId: row.id,
    pointP: '—',
    brico: '—',
    margeRate: '—',
    margeAmount: '—',
    createdAt: row.created_at,
  };
}

// Complète les champs d'affichage qu'un appelant peut ne pas fournir. On ne
// fabrique aucun chiffre ici : ce que l'appelant ne donne pas s'affiche en tiret.
export function completerQuote(q) {
  const totTtc = Number(q.totTtc) || 0;
  return {
    ver: 'v1',
    status: 'attente',
    statusLabel: 'Brouillon',
    address: 'Adresse à préciser',
    title: 'Devis',
    ...q,
    // Préservé explicitement : sans lui, modifier_client (app-actions.js) ne
    // peut plus retrouver le chantier visé et refuse de modifier le client.
    chantierId: q.chantierId != null ? q.chantierId : null,
    acompte: q.acompte != null ? Number(q.acompte) : totTtc * 0.3,
    lots: q.lots || [],
    supplies: q.supplies || [],
    materiaux: q.materiaux || null,
    pointP: q.pointP || '—',
    brico: q.brico || '—',
    margeRate: q.margeRate || '—',
    margeAmount: q.margeAmount || '—',
  };
}

// ── Écriture ───────────────────────────────────────────────

// ⚠️ Hors périmètre du correctif du 05/09/2026 (chantierId sur le devis,
// voir rangeeVersQuote/completerQuote ci-dessus) : ici, le chantier est
// retrouvé/créé par NOM + ADRESSE (trouverOuCreerChantier(q.client, q.address,
// …)), pas par quote.chantierId. Un devis dont le client a été renommé entre
// deux enregistrements peut donc, ici, se retrouver rattaché à un AUTRE
// chantier (ou en créer un nouveau) plutôt qu'au sien. À reprendre séparément.
// Le chantier est créé AVANT l'insert du devis. Quand ce devis se révèle déjà
// en base (poussé par une autre synchronisation), le chantier qu'on vient de
// créer est un doublon sans devis — reproduit le 05/09/2026 : deux
// « verrou D » pour un seul devis. On ne supprime que ce que CET appel a créé
// (marque `_cree`), et seulement s'il n'est pas celui du devis déjà en base.
// Jamais bloquant : le devis est sauvé, c'est ce qui compte.
async function defaireChantierCree(chantier, chantierIdGarde) {
  if (!chantier || !chantier._cree || !chantierIdGarde || chantierIdGarde === chantier.id) return;
  try {
    const { error } = await supabase.from('chantiers').delete().eq('id', chantier.id);
    if (error) console.warn('[devis] chantier doublon non supprimé', error);
  } catch (e) {
    console.warn('[devis] chantier doublon non supprimé', e);
  }
}

async function pousserEnBase(entree) {
  const session = await getSession();
  if (!session) {
    const e = new Error("Vous n'êtes pas connecté : le devis reste sur cet appareil.");
    e.code = 'no-session';
    throw e;
  }
  const q = entree.quote;
  const chantier = await trouverOuCreerChantier(q.client, q.address, session);
  const base = ligneBase(q);

  if (entree.dbId) {
    // Le numéro d'un devis déjà émis ne change jamais : on ne le repousse pas.
    const { numero: _ignore, ...patch } = base;
    const { data, error } = await supabase
      .from(TABLE_DEVIS)
      .update({ ...patch, chantier_id: chantier.id })
      .eq('id', entree.dbId)
      .select(SELECT_APRES_ECRITURE)   // surtout pas '*' : 403 sur les montants
      .single();
    if (error) throw error;
    return (await relireDevis(data.id)) || data;
  }

  const numero = await numeroLibre(q.id);

  // Dernier regard sur le journal AVANT d'insérer : si une autre
  // synchronisation (autre onglet, autre instance) a déjà poussé CETTE entrée
  // pendant qu'on cherchait le numéro et le chantier, elle a écrit son dbId.
  // Insérer quand même ferait un second devis — avec un AUTRE numéro, que
  // l'unicité en base ne peut pas voir. On rend le sien, et on défait le
  // chantier qu'on aurait créé pour rien.
  const dejaPoussee = lireLocal().find((x) => x.lid === entree.lid);
  if (dejaPoussee && dejaPoussee.dbId) {
    const deja = (await relireDevis(dejaPoussee.dbId))
      || { id: dejaPoussee.dbId, numero: dejaPoussee.quote.id, chantier_id: null };
    await defaireChantierCree(chantier, deja.chantier_id);
    return deja;
  }

  const { data, error } = await supabase
    .from(TABLE_DEVIS)
    .insert({
      ...base,
      numero,
      chantier_id: chantier.id,
      pro_id: await proId(session),
    })
    .select(SELECT_APRES_ECRITURE)
    .single();
  if (error) {
    // Doublon de numéro : quelqu'un (un autre onglet, l'autre synchronisation)
    // a déjà écrit CE devis. On récupère la ligne existante et on la rend comme
    // si l'insert avait réussi — c'est le même devis, il est en base, il n'y a
    // rien à réessayer et surtout rien à insérer une deuxième fois.
    if (estConflitNumero(error)) {
      const deja = await devisParNumero(numero);
      if (deja) {
        await defaireChantierCree(chantier, deja.chantier_id);
        return deja;
      }
    }
    throw error;
  }
  return (await relireDevis(data.id)) || data;
}

/**
 * LE point d'enregistrement. Écrit d'abord sur l'appareil, tente ensuite la base.
 * Ne jette jamais tant que localStorage répond : perdre le travail de l'artisan
 * n'est pas une option acceptable.
 *
 * @returns {{quote, etat:'synchro'|'local', message:string, erreur:string|null}}
 */
export async function enregistrerDevis(quote) {
  const q = completerQuote(quote);
  if (!q.id) q.id = numeroLocalSuivant();

  const entree = {
    lid: uuid(),
    dbId: null,
    sync: 'attente',
    err: null,
    majAt: new Date().toISOString(),
    quote: q,
  };
  const arr = lireLocal();
  arr.unshift(entree);
  const ecrit = ecrireLocal(arr);

  if (!ecrit) {
    return {
      quote: q,
      etat: 'local',
      message: "Impossible d'écrire sur cet appareil (stockage plein ou navigation privée). Ne fermez pas cette page avant d'avoir noté le devis.",
      erreur: 'localstorage',
    };
  }

  try {
    const row = await pousserEnBase(entree);
    // Meme regle qu'au rechargement : on reprend le jeton renvoye par la base,
    // sinon l'entree locale reste sans jeton et le document reste inaccessible.
    const majQuote = { ...q, id: row.numero, _dbId: row.id,
      publicToken: (row.chantiers && row.chantiers.public_token) || q.publicToken || null };
    majEntree(entree.lid, { dbId: row.id, sync: 'ok', err: null, quote: majQuote });
    return {
      quote: majQuote,
      etat: 'synchro',
      message: `Devis ${row.numero} enregistré.`,
      erreur: null,
    };
  } catch (e) {
    const msg = (e && e.message) || 'réseau indisponible';
    majEntree(entree.lid, { sync: 'attente', err: msg });
    return {
      quote: q,
      etat: 'local',
      message: `Devis ${q.id} enregistré sur votre appareil — synchronisation en attente (${msg}).`,
      erreur: msg,
    };
  }
}

/**
 * Met à jour un devis déjà enregistré (avenant, changement de statut).
 * Même contrat : local d'abord, base ensuite.
 */
export async function majDevisEnregistre(quote) {
  const arr = lireLocal();
  const i = arr.findIndex(
    (e) => (quote._dbId && e.dbId === quote._dbId) || (e.quote && e.quote.id === quote.id)
  );
  let entree;
  if (i === -1) {
    entree = { lid: uuid(), dbId: quote._dbId || null, sync: 'attente', err: null, majAt: new Date().toISOString(), quote: { ...quote } };
    arr.unshift(entree);
  } else {
    arr[i] = { ...arr[i], sync: 'attente', quote: { ...quote }, majAt: new Date().toISOString() };
    entree = arr[i];
  }
  ecrireLocal(arr);

  try {
    const row = await pousserEnBase(entree);
    const majQuote = { ...quote, id: row.numero, _dbId: row.id,
      publicToken: (row.chantiers && row.chantiers.public_token) || quote.publicToken || null };
    majEntree(entree.lid, { dbId: row.id, sync: 'ok', err: null, quote: majQuote });
    return { quote: majQuote, etat: 'synchro', message: `Devis ${row.numero} mis à jour.`, erreur: null };
  } catch (e) {
    const msg = (e && e.message) || 'réseau indisponible';
    majEntree(entree.lid, { sync: 'attente', err: msg });
    return { quote, etat: 'local', message: `Modification enregistrée sur cet appareil — synchronisation en attente (${msg}).`, erreur: msg };
  }
}

// ── Nouvelle version d'un devis (avenant V2, V3…) ──────────────────────────
//
// Un avenant est un devis DE PLUS, jamais une retouche : le devis d'origine —
// celui que le client a reçu, parfois signé — reste la pièce qui fait foi et
// ne doit pas bouger d'un centime.
//
// L'ancien `confirmNewVersion()` de devis.html faisait exactement l'inverse :
// il poussait un lot « Avenant » DANS l'objet du devis d'origine, changeait son
// `ver`, et repassait par `majDevisEnregistre` — donc par un UPDATE de la MÊME
// ligne en base. Il n'existait aucune V2 : le document que le client avait sous
// les yeux changeait sous lui, et la version précédente était perdue. Corrigé
// le 05/09/2026, et la logique vit ici pour que l'écran et l'assistant fassent
// la même chose.
//
// Le chiffrage des consignes revient au mode serveur `revise-quote`
// (gemini-assistant), qui porte déjà les deux règles du socle :
//   1. une ligne conservée garde AU CENTIME le prix du devis d'origine ;
//   2. une ligne ajoutée dont le prix ne figure nulle part part à 0, et le dit.
// On ne les croit pas sur parole : `recollerPrix` les REVÉRIFIE ici, sur les
// lignes réelles du devis d'origine. Une remise ou un prix dicté par l'artisan
// passe (ses consignes parlent d'argent) ; un prix apparu tout seul, non.

// Ce que le devis d'origine envoie au serveur : son numéro, son objet, et ses
// lignes (désignation, quantité, unité, prix, TVA). NI l'adresse du chantier,
// NI l'e-mail, NI le téléphone du client — la révision n'en a aucun besoin.
// L'objet, lui, part tel que l'artisan l'a écrit, et il porte souvent le nom du
// client (« Salle de bain · Mme Ravier ») : c'est le titre de SON devis, et il
// sert au serveur à comprendre de quel ouvrage on parle. À dire tel quel plutôt
// que de laisser croire que rien d'identifiant ne circule.
function baseQuotePourRevision(numero, objet, lignes) {
  return {
    numero,
    objet: objet || 'Devis',
    items: lignes.map((l, i) => ({
      id: 'item-' + (i + 1),
      category: l.lot || null,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unitPrice: l.unitPrice,
      vatRate: l.vatRate,
    })),
  };
}

// Un devis encore BROUILLON n'a jamais quitté l'entreprise : il n'y a rien à
// figer. `_statutBase` porte le statut réel de la base ('brouillon', 'envoye',
// 'accepte'…) ; sans lui (devis pas encore synchronisé), le statut UI 'attente'
// vaut 'brouillon', comme partout ailleurs dans ce fichier.
export function estBrouillonDevis(q) {
  const base = q._statutBase || UI_VERS_BASE[q.status] || 'brouillon';
  return base === 'brouillon';
}

// Racine d'un numéro : `DEV-2026-0007-V2` → `DEV-2026-0007`. Une V3 se numérote
// donc sur le devis d'ORIGINE, pas sur la V2 (sinon `…-V2-V2`).
function racineNumero(numero) {
  return String(numero || '').replace(/-V\d+$/i, '');
}

// Le rang de la prochaine version. On regarde la base ET le journal local :
// deux avenants faits hors ligne le même jour ne doivent pas porter le même
// numéro. Hors ligne, on se contente de ce que l'appareil sait.
async function prochaineVersion(numero) {
  const racine = racineNumero(numero);
  let max = 1;
  const compter = (n) => {
    if (racineNumero(n) !== racine) return;
    const m = String(n).match(/-V(\d+)$/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  };
  try {
    const { data, error } = await supabase
      .from(TABLE_DEVIS).select('numero').like('numero', racine + '-V%');
    if (error) throw error;
    (data || []).forEach((d) => compter(d.numero));
  } catch (_) { /* hors ligne : le journal local fait foi */ }
  lireLocal().forEach((e) => { if (e.quote && e.quote.id) compter(e.quote.id); });
  return max + 1;
}

// Titre du devis, versionné une seule fois : reprendre une V2 pour en faire une
// V3 ne doit pas produire « … — V2 (avenant) — V3 (avenant) ».
function titreVersion(titre, version) {
  const t = String(titre || 'Devis').replace(/\s*[—-]\s*V\d+\s*\(avenant\)\s*$/i, '').trim();
  return `${t || 'Devis'} — V${version} (avenant)`;
}

// Clé de rapprochement d'une ligne : sans accents, sans ponctuation. Sert à
// retrouver dans le devis d'origine la ligne que le serveur dit avoir conservée
// ou modifiée, même si sa désignation a été reformulée à la marge.
function cleLigne(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// Les consignes de l'artisan parlent-elles d'argent ? Si oui, un prix qui bouge
// vient de LUI et on le laisse passer (« 5 % de remise », « la faïence à 42 le
// mètre »). Si non, aucun prix n'a de raison de changer dans un avenant :
// tout écart est recollé sur le devis d'origine.
const RE_CONSIGNE_ARGENT = /remise|rabais|ristourne|geste commercial|%|pour ?cents?|prix|tarif|euros?|€|gratuit|offert|augment|baiss|r[eé]duction|majoration|arrondi|ht\b|ttc\b/i;

// Un montant, écrit comme on l'écrit sur un devis.
function eur(n) {
  const v = Number(n) || 0;
  return v.toFixed(2).replace('.', ',') + ' €';
}

// Une quantité, sans zéros inutiles : « 12 m² », pas « 12.00 m² ».
function qteFr(q, unit) {
  const v = Number(q) || 0;
  const s = (Math.round(v * 100) / 100).toString().replace('.', ',');
  return `${s} ${unit || 'u'}`.trim();
}

/**
 * Revérifie les prix rendus par le serveur contre le devis d'origine, et
 * DÉCRIT ce qui a réellement été construit.
 *
 * - ligne retrouvée dans l'origine : son prix est celui de l'origine, au
 *   centime, sauf si les consignes parlent d'argent ;
 * - ligne NOUVELLE dont le prix ne vient d'aucune ligne d'origine : 0, et on
 *   le dit. Jamais une moyenne, jamais un tarif de marché : le métré est notre
 *   travail, le prix est le sien.
 *
 * Le résumé rendu à l'artisan se calcule ICI, sur les lignes effectivement
 * gardées — pas sur ce que le serveur DIT avoir fait. Les deux divergent dès
 * que le recollage rejette un prix : `versionNotes` pouvait annoncer « baisse
 * de 10 % appliquée » sur une V2 aux prix inchangés (revue du 05/09/2026).
 *
 * @returns {{lignes:Array, prixASaisir:string[], prixChanges:string[],
 *            prixRestaures:string[], ajoutees:string[], retirees:string[],
 *            modifiees:string[], manquantes:string[], remises:string[],
 *            ajouteesHt:number, retireesHt:number}}
 */
function recollerPrix(items, origine, argentAutorise) {
  const parCle = new Map();
  const rangParSrc = new Map();
  origine.forEach((l, i) => {
    parCle.set('item-' + (i + 1), l);
    const c = cleLigne(l.description);
    if (c && !parCle.has(c)) parCle.set(c, l);
    rangParSrc.set(l, i);
  });

  const lignes = [];
  const prixASaisir = [];
  const prixChangesBruts = [];
  const prixRestaures = [];
  const ajoutees = [];
  const retirees = [];
  const modifiees = [];
  const remises = [];
  const vues = new Set();
  let ajouteesHt = 0;
  let retireesHt = 0;

  (items || []).forEach((it) => {
    if (!it) return;
    const desc = String(it.description || '').trim() || 'Prestation';
    const src = parCle.get(String(it.id || '')) || parCle.get(cleLigne(desc)) || null;
    if (src) vues.add(rangParSrc.get(src));

    // Le serveur peut porter une remise dans un champ `discount` dont il ne dit
    // NI l'unité (5 % ? 5 € ?) NI l'assiette. Le devis, lui, n'a pas de champ
    // remise : la seule forme qu'il sait écrire est une ligne négative
    // (`appliquerRemise`, app-actions.js). Choisir à la place de l'artisan
    // entre 5 % et 5 €, c'est inventer un chiffre sur ses prix. On refuse, et
    // `creerNouvelleVersion` le dit — plutôt qu'une carte qui annonce une
    // remise que la V2 ne porte pas.
    const rem = Number(it.discount);
    if (Number.isFinite(rem) && rem !== 0) remises.push(desc);

    if (norm(it.changeStatus) === 'supprime') {
      if (src) { retirees.push(src.description); retireesHt += Number(src.total_ht) || 0; }
      return;
    }
    // « conserve » veut dire conserve. Sur ces lignes-là, l'unité et le taux de
    // TVA sont ceux du devis d'origine, pas ceux que le serveur a reformulés :
    // vu le 05/09/2026 sur le compte de test, « 1 ens. » ressortait « 1 forfait »
    // sur une ligne pourtant inchangée. Une ligne « modifie » garde le droit de
    // changer : c'est ce que l'artisan a demandé.
    const conserve = !!src && norm(it.changeStatus || 'conserve') === 'conserve';

    const qte = Number(it.quantity);
    const quantity = Number.isFinite(qte) && qte > 0 ? qte : 1;
    const unit = conserve
      ? (String(src.unit || 'u').trim() || 'u')
      : (String(it.unit || (src && src.unit) || 'u').trim() || 'u');

    let vatRate = Number(it.vatRate);
    if (Number.isFinite(vatRate) && vatRate > 0 && vatRate <= 1) vatRate *= 100;
    if (!Number.isFinite(vatRate) || vatRate < 0) vatRate = src ? Number(src.vatRate) : 10;
    if (conserve) vatRate = Number(src.vatRate);

    let unitPrice = Number(it.unitPrice);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) unitPrice = 0;
    if (src) {
      const ref = Number(src.unitPrice) || 0;
      if (Math.abs(unitPrice - ref) >= 0.005) {
        if (argentAutorise) prixChangesBruts.push({ txt: `${desc} : ${eur(ref)} → ${eur(unitPrice)}/${unit}`, poids: Math.abs(unitPrice - ref) * quantity });
        else {
          // Le serveur a bougé un prix que RIEN dans les consignes ne demande.
          // On remet celui de l'artisan, au centime — et on le DIT : sans ça,
          // la carte pouvait annoncer une baisse qui n'existait nulle part.
          unitPrice = ref;
          prixRestaures.push(desc);
        }
      }
    } else if (unitPrice > 0) {
      if (argentAutorise) prixChangesBruts.push({ txt: `${desc} : ${eur(unitPrice)}/${unit}`, poids: unitPrice * quantity });
      else unitPrice = 0;
    }
    if (!(unitPrice > 0)) prixASaisir.push(desc);

    const total_ht = quantity * unitPrice;
    lignes.push({
      lot: it.category || (src && src.lot) || null,
      description: desc,
      quantity,
      unit,
      unitPrice,
      vatRate,
      total_ht,
    });

    // Le diff se lit APRÈS le recollage : il décrit la ligne telle qu'elle est
    // écrite dans la V2, pas telle que le serveur l'a proposée.
    if (!src) {
      ajoutees.push(`${desc} (${qteFr(quantity, unit)}` + (unitPrice > 0 ? ` × ${eur(unitPrice)}` : ' — prix à saisir') + ')');
      ajouteesHt += total_ht;
    } else {
      const refQ = Number(src.quantity) || 0;
      const refP = Number(src.unitPrice) || 0;
      const dq = Math.abs(quantity - refQ) >= 0.005 || String(unit) !== String(src.unit || 'u');
      const dp = Math.abs(unitPrice - refP) >= 0.005;
      if (dq || dp) {
        const bouts = [];
        if (dq) bouts.push(`${qteFr(refQ, src.unit)} → ${qteFr(quantity, unit)}`);
        if (dp) bouts.push(`${eur(refP)} → ${eur(unitPrice)}`);
        modifiees.push(`${desc} : ${bouts.join(', ')}`);
      }
    }
  });

  // Toute ligne d'origine que le serveur n'a NI rendue NI marquée supprimée est
  // une ligne perdue : la V2 naîtrait amputée avec un total cohérent en
  // apparence. `creerNouvelleVersion` refuse plutôt que d'enregistrer ça.
  const manquantes = origine.filter((_, i) => !vues.has(i)).map((l) => l.description);

  // Triés par impact décroissant : sur un gros devis, la ligne qui coûte le
  // plus cher est celle qu'il faut lire en premier, pas la première du lot.
  const prixChanges = prixChangesBruts
    .sort((a, b) => b.poids - a.poids).map((x) => x.txt);

  return { lignes, prixASaisir, prixChanges, prixRestaures,
    ajoutees, retirees, modifiees, manquantes, remises, ajouteesHt, retireesHt };
}

/**
 * LA porte « argent » d'un avenant : le total HT d'origine, celui de la V2,
 * l'écart, et si les consignes le justifient.
 *
 * Une carte de validation qui n'affiche que « Total : 2 310 € TTC » n'offre
 * aucune ancre : une remise de 5 % appliquée à 50 % passe inaperçue. On montre
 * donc TOUJOURS les deux totaux et l'écart, et on isole la part que les
 * consignes n'expliquent pas : l'écart moins ce qu'apportent les lignes
 * ajoutées, plus ce qu'emportent les lignes retirées. Ce qui reste est de
 * l'argent qui a bougé sur des lignes que l'artisan n'a demandé ni d'ajouter
 * ni de retirer — il n'est justifié que si les consignes dictent un pourcentage
 * de cet ordre (« 5 % de remise » = 5 % d'écart attendu).
 *
 * Une seule fonction, appelée par la carte de l'assistant ET par l'écran devis :
 * deux copies auraient fini par ne plus dire la même chose.
 *
 * @returns {{ecart:number, ecartPct:number, inexplique:number,
 *            inexpliquePct:number, attenduPct:number|null, justifie:boolean,
 *            texte:string, alerte:string|null}}
 */
export function controlerEcartTotal(o) {
  const htOrigine = Number(o && o.htOrigine) || 0;
  const htNouvelle = Number(o && o.htNouvelle) || 0;
  const ajouteesHt = Number(o && o.ajouteesHt) || 0;
  const retireesHt = Number(o && o.retireesHt) || 0;
  const consignes = String((o && o.consignes) || '');

  const ecart = htNouvelle - htOrigine;
  const ecartPct = htOrigine > 0 ? (ecart / htOrigine) * 100 : 0;
  const inexplique = ecart - ajouteesHt + retireesHt;
  const inexpliquePct = htOrigine > 0 ? (inexplique / htOrigine) * 100 : 0;

  // Le pourcentage que l'artisan a lui-même dicté, s'il en a dicté un.
  let attenduPct = null;
  const trouves = consignes.match(/\d+(?:[.,]\d+)?\s*(?:%|pour ?cents?)/gi) || [];
  trouves.forEach((t) => {
    const v = parseFloat(t.replace(',', '.'));
    if (Number.isFinite(v)) attenduPct = Math.max(attenduPct == null ? 0 : attenduPct, v);
  });

  const signe = (v) => (v >= 0 ? '+' : '−');
  const pctFr = (v) => `${signe(v)}${Math.abs(v).toFixed(1).replace('.', ',')} %`;
  const texte = `Total HT : ${eur(htOrigine)} → ${eur(htNouvelle)} (${pctFr(ecartPct)})`;

  // En dessous d'un centime par millier, il n'y a rien à signaler : ce sont les
  // arrondis, pas de l'argent qui a bougé.
  const bruit = Math.max(0.5, htOrigine * 0.001);
  let justifie = Math.abs(inexplique) <= bruit;
  if (!justifie && attenduPct != null) {
    justifie = Math.abs(inexpliquePct) <= attenduPct + 1;
  }

  const alerte = justifie ? null
    : `⚠ ${eur(Math.abs(inexplique))} HT (${pctFr(inexpliquePct)}) ont bougé sur des lignes que vos consignes `
      + `ne demandent ni d'ajouter ni de retirer`
      + (attenduPct != null ? ` — vous aviez dicté ${String(attenduPct).replace('.', ',')} %` : '')
      + '. Vérifiez les prix avant de valider.';

  return { ecart, ecartPct, inexplique, inexpliquePct, attenduPct, justifie, texte, alerte };
}

/**
 * Le résumé d'un avenant, en français, calculé sur la V2 RÉELLEMENT construite.
 * `versionNotes` du serveur peut venir en complément (`res.notes`), jamais
 * seul : il décrit ce que le modèle a voulu faire, pas ce que le code a gardé.
 *
 * Une seule fonction pour la carte de l'assistant et pour l'écran devis.
 */
export function resumeChangements(res) {
  const l = [];
  const r = (res && res.resume) || {};
  const n = (a) => (Array.isArray(a) ? a : []);
  if (n(r.ajoutees).length) l.push(`Ajouté : ${n(r.ajoutees).slice(0, 6).join(' · ')}`);
  if (n(r.retirees).length) l.push(`Retiré : ${n(r.retirees).slice(0, 6).join(' · ')}`);
  if (n(r.modifiees).length) l.push(`Modifié : ${n(r.modifiees).slice(0, 6).join(' · ')}`);
  if (!l.length) l.push('Aucune ligne ajoutée, retirée ni modifiée.');
  return l;
}

// Appel du mode serveur `revise-quote`. Même chemin que app-materiaux.js :
// fetch direct sur gemini-assistant, jeton de la session de l'artisan.
async function appelerRevision(baseQuote, consignes) {
  const cfg = (typeof window !== 'undefined' && window.__BATISPOT_CONFIG__) || {};
  const url = (cfg.SUPABASE_URL || 'https://cisniwhaiydazdpzvino.supabase.co')
    + '/functions/v1/gemini-assistant';
  const session = await getSession();
  const headers = { 'content-type': 'application/json' };
  if (cfg.SUPABASE_ANON_KEY) headers.apikey = cfg.SUPABASE_ANON_KEY;
  headers.authorization = 'Bearer ' + ((session && session.access_token) || cfg.SUPABASE_ANON_KEY || '');

  const ctrl = new AbortController();
  const killer = setTimeout(() => ctrl.abort(), 45000);
  let r;
  try {
    r = await fetch(url, {
      method: 'POST',
      headers,
      signal: ctrl.signal,
      body: JSON.stringify({ mode: 'revise-quote', prompt: consignes, baseQuote }),
    });
  } finally { clearTimeout(killer); }

  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.text || j.error || ('HTTP ' + r.status));
  let data = j.data;
  if (!data && typeof j.text === 'string') { try { data = JSON.parse(j.text); } catch (_) {} }
  if (!data || !Array.isArray(data.items) || !data.items.length) {
    throw new Error("La nouvelle version n'a pas pu être préparée : réponse inexploitable.");
  }
  return data;
}

/**
 * Crée la version suivante (V2, V3…) d'un devis déjà envoyé ou signé.
 * Le devis d'origine n'est JAMAIS touché : la nouvelle version est un devis
 * distinct, numéroté `<numéro d'origine>-V<n>`, rattaché au même chantier.
 *
 * @param {object} quote      devis d'origine, format UI
 * @param {string} consignes  ce qui change, dans les mots de l'artisan
 * @param {{motif?:string, montantSuppHt?:number}} [options]
 *        repli hors ligne de l'écran devis.html : si le serveur ne répond pas
 *        ET que l'artisan a saisi lui-même un motif et un montant, la version
 *        est construite à partir de CE QU'IL A SAISI — rien d'inventé.
 * @returns {{quote, etat:'synchro'|'local', erreur, version, numero, origine,
 *            notes, changements:string[], prixASaisir:string[],
 *            prixChanges:string[], horsLigne:boolean}}
 */
export async function creerNouvelleVersion(quote, consignes, options = {}) {
  const q = completerQuote(Object.assign({}, quote || {}));
  const texte = String(consignes || '').trim();
  if (!texte) throw new Error("Dites ce qui change dans cette nouvelle version.");
  if (!q.id) {
    throw new Error("Ce devis n'a pas encore de numéro : enregistrez-le avant d'en faire une nouvelle version.");
  }
  if (estBrouillonDevis(q)) {
    throw new Error(
      `Le devis ${q.id} est encore un brouillon : il n'a jamais été envoyé au client. `
      + 'Modifiez-le directement — une nouvelle version ne servirait à rien.'
    );
  }

  const origine = lotsVersLignes(q.lots, Number(q.totHt) || 0, Number(q.totTva) || 0);
  if (!origine.length) {
    throw new Error(`Le devis ${q.id} n'a aucune ligne détaillée : il n'y a rien à reprendre en nouvelle version.`);
  }

  const version = await prochaineVersion(q.id);
  const montant = Number(options.montantSuppHt);
  const motif = String(options.motif || '').trim();

  let data;
  let horsLigne = false;
  try {
    data = await appelerRevision(baseQuotePourRevision(q.id, q.title, origine), texte);
  } catch (e) {
    // Repli : uniquement si l'artisan a lui-même donné le motif ET le montant.
    // Sans ces deux-là, il n'y a rien à écrire qui ne soit pas inventé.
    if (!(motif && Number.isFinite(montant) && montant > 0)) throw e;
    horsLigne = true;
    data = {
      versionNotes: motif,
      changesSummary: [`Travaux supplémentaires : ${motif}`],
      items: origine.map((l, i) => ({
        id: 'item-' + (i + 1),
        category: l.lot,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        vatRate: l.vatRate,
        changeStatus: 'conserve',
      })).concat([{
        category: `Lot Avenant V${version} — travaux supplémentaires`,
        description: motif,
        quantity: 1,
        unit: 'forfait',
        unitPrice: montant,
        vatRate: origine[origine.length - 1].vatRate,
        changeStatus: 'ajoute',
      }]),
    };
  }

  // `horsLigne` : le montant vient de l'artisan lui-même, il fait autorité.
  const argentAutorise = horsLigne || RE_CONSIGNE_ARGENT.test(texte);
  const rec = recollerPrix(data.items, origine, argentAutorise);
  const { lignes, prixASaisir, prixChanges, prixRestaures } = rec;
  if (!lignes.length) {
    throw new Error("Cette nouvelle version ne contiendrait aucune ligne : dites-moi ce qu'elle doit contenir.");
  }

  // Une remise dont on ne connaît ni l'unité ni l'assiette ne s'applique pas en
  // devinant : elle se saisit sur le devis, où elle s'écrit en ligne négative.
  // Rien n'est enregistré, plutôt qu'une V2 qui porte une remise approximative
  // ou une carte qui en annonce une absente.
  if (rec.remises.length) {
    const n = rec.remises.length;
    throw new Error(
      `Le serveur a renvoyé une remise sur ${n} ligne${n > 1 ? 's' : ''} (${rec.remises.slice(0, 3).join(' · ')})`
      + " sans dire si c'est un pourcentage ou des euros — je ne devine pas un chiffre sur vos prix."
      + ' La remise se saisit sur le devis : créez la nouvelle version sans remise, puis dites'
      + ' « applique X % de remise » dessus.'
    );
  }

  // Une ligne d'origine ni rendue ni marquée supprimée est une ligne PERDUE.
  // La V2 aurait un total cohérent en apparence et un ouvrage en moins.
  if (rec.manquantes.length) {
    const n = rec.manquantes.length;
    throw new Error(
      `Le serveur a perdu ${n} ligne${n > 1 ? 's' : ''} du devis d'origine (${rec.manquantes.slice(0, 3).join(' · ')})`
      + ` : la nouvelle version serait amputée. Réessayez, ou faites l'avenant à la main.`
    );
  }

  const notes = String(data.versionNotes || motif || texte).trim();
  const nouvelle = completerQuote({
    ...q,
    id: racineNumero(q.id) + '-V' + version,
    ver: 'v' + version,
    title: titreVersion(q.title, version),
    // La version qui naît est un brouillon : elle n'a été ni envoyée ni signée.
    status: 'attente',
    statusLabel: 'Brouillon',
    _statutBase: 'brouillon',
    lots: lignesVersLots(lignes),
    notes,
    // Recalculée sur les nouvelles lignes le jour où on la demandera.
    materiaux: null,
  });
  // Identité de l'entrée d'ORIGINE : la laisser passerait l'insertion en UPDATE
  // du devis d'origine — exactement le bug qu'on répare.
  delete nouvelle._dbId;
  delete nouvelle._lid;
  delete nouvelle._sync;
  delete nouvelle._cache;
  recalculerTotaux(nouvelle);

  const res = await enregistrerDevis(nouvelle);

  // La porte « argent », sur les totaux RÉELS des deux devis.
  const htOrigine = origine.reduce((s, l) => s + (Number(l.total_ht) || 0), 0);
  const ecart = controlerEcartTotal({
    htOrigine,
    htNouvelle: Number(res.quote.totHt) || 0,
    ajouteesHt: rec.ajouteesHt,
    retireesHt: rec.retireesHt,
    consignes: texte,
  });

  return {
    quote: res.quote,
    etat: res.etat,
    erreur: res.erreur,
    version: 'V' + version,
    numero: res.quote.id,
    origine: q.id,
    notes,
    // Ce que le SERVEUR dit avoir fait — complément, jamais le message à soi seul.
    changements: Array.isArray(data.changesSummary)
      ? data.changesSummary.filter(Boolean).slice(0, 6).map((c) => String(c).trim())
      : [],
    // Ce que le CODE a réellement écrit dans la V2.
    resume: {
      ajoutees: rec.ajoutees,
      retirees: rec.retirees,
      modifiees: rec.modifiees,
      prixRestaures,
    },
    ecart,
    htOrigine,
    htNouvelle: Number(res.quote.totHt) || 0,
    prixASaisir,
    prixChanges,
    prixRestaures,
    horsLigne,
  };
}

// ⚠️ DEUX SYNCHRONISATIONS EN MÊME TEMPS CRÉAIENT DEUX DEVIS AU MÊME NUMÉRO
// (corrigé le 05/09/2026). Deux appelants partent à la seconde près quand
// l'artisan remonte du sous-sol et ouvre l'écran Devis : l'événement `online`
// posé en bas de ce fichier, et `devis.html` au chargement. Chacun lisait le
// même journal local, voyait le même devis « en attente », et l'insérait.
// Résultat observé en base : deux devis portant le MÊME numéro légal, et deux
// chantiers pour le même client — le second devis orphelin, invisible sur
// l'appareil mais bien présent dans la liste que l'artisan lit.
//
// Le verrou : une promesse partagée au niveau du module. Le second appelant
// n'en lance pas une deuxième — il attend la première et reçoit SON résultat.
// C'est volontaire : les deux appelants veulent la même chose (« que tout soit
// parti »), et le premier passage a déjà tout tenté.
//
// Ce verrou ne protège qu'UN onglet. Deux onglets, deux appareils, ou un
// rechargement au mauvais moment passent à côté : c'est pour cela que
// l'unicité `(pro_id, numero)` existe aussi en base (voir
// app/supabase-devis-numero-unique-2026-09-05.sql) et que `pousserEnBase`
// traite un refus 23505 comme « déjà synchronisé », pas comme une erreur.
let syncEnCours = null;

/** Rejoue tout ce qui n'est pas encore parti. Silencieux si tout est à jour. */
export function synchroniserEnAttente() {
  if (syncEnCours) return syncEnCours;
  const p = synchroniserEnAttenteInterne()
    .finally(() => { if (syncEnCours === p) syncEnCours = null; });
  syncEnCours = p;
  return p;
}

async function synchroniserEnAttenteInterne() {
  const arr = lireLocal();
  const restants = arr.filter((e) => e.sync !== 'ok');
  if (!restants.length) return { tentes: 0, reussis: 0, restants: 0 };
  let reussis = 0;
  for (const e of restants) {
    // Un autre onglet a pu synchroniser cette entrée pendant qu'on traitait
    // la précédente : le journal local est partagé, on le relit avant chaque
    // envoi. Ça ne remplace pas l'unicité en base, ça évite de la solliciter.
    const courant = lireLocal().find((x) => x.lid === e.lid);
    if (courant && courant.sync === 'ok') continue;
    try {
      const row = await pousserEnBase(e);
      majEntree(e.lid, { dbId: row.id, sync: 'ok', err: null, quote: { ...e.quote, id: row.numero, _dbId: row.id } });
      reussis++;
    } catch (err) {
      majEntree(e.lid, { sync: 'attente', err: (err && err.message) || 'réseau indisponible' });
    }
  }
  return { tentes: restants.length, reussis, restants: nbEnAttente() };
}

// ── Lecture ────────────────────────────────────────────────

// Colonnes lues partout. Un devis sans son chantier n'a pas de nom de client :
// la jointure fait partie de la lecture, elle n'est pas optionnelle.
const SELECT_DEVIS = '*, chantiers(client_name, adresse, id, client_email, public_token)';

/**
 * LA lecture des devis de l'artisan (rangées brutes de la base).
 *
 * devis.html, finances.html, planning.html et dashboard.html écrivaient chacun
 * leur propre `supabase.from('devis').select(...)`, avec des colonnes et des
 * filtres légèrement différents. C'est le motif qui a produit les bugs
 * « corrigés à un endroit sur trois » : une page continuait d'afficher les
 * anciennes données pendant que les autres étaient réparées. Un seul endroit.
 *
 * @param {{statuts?: string[], depuis?: Date|string}} options
 * @returns {Promise<Array>} rangées, plus récentes d'abord
 */
export async function listerDevis(options = {}) {
  let req = supabase.from(VUE_DEVIS).select(SELECT_DEVIS);
  if (options.statuts && options.statuts.length) req = req.in('status', options.statuts);
  if (options.depuis) {
    const d = options.depuis instanceof Date ? options.depuis : new Date(options.depuis);
    req = req.gte('created_at', d.toISOString());
  }
  const { data, error } = await req.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Liste des devis de l'artisan, format UI.
 * La base fait autorité sur l'existence ; la copie locale, plus riche
 * (lots, libellés), est préférée quand elle existe pour le même devis.
 *
 * @returns {{quotes:Array, horsLigne:boolean, enAttente:number, erreur:string|null}}
 */
export async function chargerDevisUI() {
  const locaux = lireLocal();
  const parDbId = {};
  locaux.forEach((e) => { if (e.dbId) parDbId[e.dbId] = e; });

  let rows = null;
  let erreur = null;
  try {
    const session = await getSession();
    if (!session) throw new Error('non connecté');
    rows = await listerDevis();
    cacherNumeros(rows.map((r) => r.numero));
  } catch (e) {
    erreur = (e && e.message) || 'réseau indisponible';
  }

  const quotes = [];
  const vus = new Set();

  // 1. Les devis pas encore partis, en tête — ce sont eux qu'il ne faut pas perdre.
  locaux.filter((e) => e.sync !== 'ok').forEach((e) => {
    quotes.push({ ...e.quote, _sync: 'attente', _lid: e.lid });
    vus.add(e.quote.id);
  });

  if (rows) {
    rows.forEach((row) => {
      if (vus.has(row.numero)) return;
      const local = parDbId[row.id];
      // ⚠️ `publicToken` VENAIT DE DISPARAITRE ICI (corrige le 02/09/2026).
      // Quand une copie locale existait, on la preferait — mais la copie locale
      // n'a jamais eu de `publicToken` : seul `rangeeVersQuote(row)` le lit.
      // Consequence : sur tout devis cree depuis CET appareil, le bouton
      // « Voir le devis signe » repondait « Ce devis n'est pas encore
      // synchronise », alors qu'il l'etait parfaitement. L'artisan ne pouvait
      // jamais ouvrir le document officiel de son propre devis, et
      // l'explication qu'on lui donnait etait fausse.
      // Regle : ce qui vient de la BASE fait autorite sur l'identite du devis
      // (numero, id, statut, jeton) ; le local ne garde que le contenu saisi.
      const q = local
        ? { ...local.quote, id: row.numero, _dbId: row.id,
            publicToken: (row.chantiers && row.chantiers.public_token) || local.quote.publicToken || null,
            // Même règle que publicToken : la copie locale n'a jamais porté
            // chantierId (ajouté le 05/09/2026), la base fait autorité.
            chantierId: row.chantier_id || local.quote.chantierId || null,
            ...statutDepuisBase(row) }
        : rangeeVersQuote(row);
      quotes.push({ ...q, _sync: 'ok' });
      vus.add(row.numero);
    });
  } else {
    // Hors ligne : on montre au moins ce que l'appareil a gardé.
    locaux.filter((e) => e.sync === 'ok').forEach((e) => {
      if (vus.has(e.quote.id)) return;
      quotes.push({ ...e.quote, _sync: 'ok', _cache: true });
      vus.add(e.quote.id);
    });
  }

  return { quotes, horsLigne: rows === null, enAttente: nbEnAttente(), erreur };
}

function statutDepuisBase(row) {
  const st = BASE_VERS_UI[row.status] || BASE_VERS_UI.brouillon;
  return { status: st.status, statusLabel: st.statusLabel, _statutBase: row.status };
}

// Relance automatique dès que le réseau revient.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    synchroniserEnAttente().then((r) => {
      if (r.reussis > 0 && typeof window.bsOnDevisSynchro === 'function') {
        window.bsOnDevisSynchro(r);
      }
    }).catch(() => {});
  });
}

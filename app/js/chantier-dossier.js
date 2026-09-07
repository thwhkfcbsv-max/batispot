// BatiSpot — Dossier réglementaire de chantier (31/08/2026, restructuré 04/09/2026)
//
// Historique : un bouton « Dossier de fin de chantier » et une modale « PV de
// Réception & Dossier Réglementaire » avaient été livrés le 22/08 puis retirés
// le même jour — ils affichaient « Dossier Réglementaire complet envoyé » sans
// rien générer ni envoyer. Ce module est la version qui fait le travail.
//
// Le socle est volontairement court. Le DOE, le PPSPS et la déclaration préalable
// concernent des chantiers à plusieurs corps d'état ; sur la cuisine à 8 000 €
// ils n'existent pas, et la déclaration préalable n'est pas déposée par l'artisan
// mais par le client.
//
// L'attestation TVA réduite n'est PAS un document : depuis le 01/03/2025 le Cerfa
// 1301-SD est supprimé, remplacé par une mention datée et signée par le client
// sur le devis. Elle est donc affichée comme un point de contrôle, pas comme une
// pièce à produire — annoncer un document aboli enverrait l'artisan chercher un
// formulaire qui n'existe plus.
//
// Le PV de réception est le seul document du socle qui n'existait nulle part, et
// c'est le plus lourd de conséquences : il fait courir la garantie de parfait
// achèvement (1 an), la biennale (2 ans) et la décennale (10 ans), et il
// déclenche le solde.
//
// ── RESTRUCTURATION DU 04/09/2026 ────────────────────────────────────────────
// Le fondateur a signalé un bug : sur un chantier créé depuis un devis (pas
// depuis une demande BatiSpot), l'onglet Docs affichait « Ce chantier n'est pas
// lié à une demande BatiSpot. Les documents ne sont pas disponibles. » — un
// message qui vit dans chantier.js (renderDocuments, coffre `client_documents`
// lié à une demande) et qui n'a JAMAIS concerné ce module : renderDossierChantier
// lit le chantier, les devis, le coffre `coffre_documents` et les tâches
// directement, sans jamais passer par une demande. Le bug est corrigé côté
// chantier.js (message adouci, plus jamais présenté comme un dossier manquant) ;
// ce module, lui, a toujours fonctionné pour tout chantier.
//
// Le contenu est réorganisé en DEUX cartes distinctes (demandées par le
// fondateur) : « Dossier avant travaux » et « Dossier de fin de chantier ».
// Chacune porte l'état réel de ses pièces ET un bouton unique qui PRÉVIENT le
// client (un e-mail par dossier, jamais un e-mail par pièce — voir
// `envoyerDossierAuClient` dans supabase.js) plutôt que d'envoyer les pièces
// une à une.
import {
  supabase, toast, fmtDate, fmtEuro, listCoffreDocs, listPhotos,
  envoyerDossierAuClient, dossierDejaEnvoye, listPiecesChantier, lienPiece,
} from './supabase.js';

const LABEL_PIECE = {
  devis_signe: 'Devis signé', pv_reception: 'Procès-verbal de réception',
  facture: 'Facture', attestation: 'Attestation', autre: 'Document',
};

const el = (tag, style, text) => {
  const n = document.createElement(tag);
  if (style) n.style.cssText = style;
  if (text !== undefined) n.textContent = text;
  return n;
};

const ico = (nom, taille) => (window.bsIcon ? window.bsIcon(nom, taille || 16) : '');

// Trois états seulement, et jamais d'état inventé : « je ne sais pas » est un
// état légitime, contrairement à un faux « fait ».
const PASTILLE = {
  ok:       ['✓', '#065F46', '#DCFCE7'],
  manquant: ['○', '#9A3412', '#FFF7ED'],
  info:     ['i', '#1E3A8A', '#DBEAFE'],
};

function ligneDocument({ titre, detail, etat, action }) {
  const [signe, couleur, fond] = PASTILLE[etat] || PASTILLE.info;
  const row = el('div', 'display:flex;gap:10px;align-items:flex-start;padding:9px 10px;background:#F7FBF8;border:1px solid #E7EEEA;border-radius:9px');

  const p = el('div', `width:20px;height:20px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:${couleur};background:${fond}`, signe);
  const mid = el('div', 'flex:1;min-width:0');
  mid.appendChild(el('div', 'font-size:12.5px;font-weight:800;color:#1C2B22', titre));
  if (detail) mid.appendChild(el('div', 'font-size:11.5px;color:#5A7268;margin-top:2px;line-height:1.4', detail));

  row.appendChild(p);
  row.appendChild(mid);
  if (action) row.appendChild(action);
  return row;
}

function boutonPetit(texte, onClick, primaire) {
  const b = el('button', `padding:6px 10px;font-size:11px;font-weight:800;border-radius:8px;cursor:pointer;white-space:nowrap;flex-shrink:0;border:1.5px solid #228B5B;${primaire ? 'background:#228B5B;color:#fff' : 'background:#fff;color:#0F5132'}`, texte);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

/**
 * Rend les deux cartes du dossier (avant travaux / fin de chantier) dans
 * `conteneur`. Fonctionne pour TOUT chantier, qu'il vienne ou non d'une
 * demande BatiSpot — voir la note du 04/09/2026 en tête de fichier.
 * @param {HTMLElement} conteneur
 * @param {{id:string, client_name?:string, adresse?:string, date_debut?:string, status?:string}} chantier
 */
export async function renderDossierChantier(conteneur, chantier) {
  if (!conteneur || !chantier || !chantier.id) return;
  conteneur.replaceChildren();
  conteneur.style.cssText = 'display:flex;flex-direction:column;gap:12px';
  conteneur.appendChild(el('div', 'font-size:12px;color:#5A7268;padding:8px', 'Lecture de votre dossier…'));

  // ── Lecture de l'état RÉEL ────────────────────────────────────────────────
  let devisChantier = [], signatures = [], pv = null, taches = [], coffre = [],
      factures = [], photos = [], dejaAvant = false, dejaFin = false, pieces = [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Session expirée');

    const [rDevis, rPv, rTaches, rCoffre, rFactures, rPhotos, rAvant, rFin, rPieces] = await Promise.all([
      supabase.from('devis')
        .select('id, numero, status, total_ttc, accepted_at, created_at')
        .eq('chantier_id', chantier.id).order('created_at'),
      supabase.from('pv_reception')
        .select('*').eq('chantier_id', chantier.id)
        .order('created_at', { ascending: false }).limit(1),
      supabase.from('taches').select('id, statut').eq('chantier_id', chantier.id),
      listCoffreDocs().catch(() => []),
      supabase.from('factures')
        .select('id, numero, type, statut, total_ttc, created_at').eq('chantier_id', chantier.id),
      listPhotos(chantier.id).catch(() => []),
      dossierDejaEnvoye(chantier.id, 'avant'),
      dossierDejaEnvoye(chantier.id, 'fin'),
      listPiecesChantier(chantier.id).catch(() => []),
    ]);
    devisChantier = rDevis.data || [];
    pv = (rPv.data && rPv.data[0]) || null;
    taches = rTaches.data || [];
    coffre = rCoffre || [];
    factures = rFactures.data || [];
    photos = rPhotos || [];
    dejaAvant = rAvant; dejaFin = rFin;
    pieces = rPieces || [];

    if (devisChantier.length) {
      const { data } = await supabase.from('devis_signatures')
        .select('devis_id, signe_le, signataire_nom')
        .in('devis_id', devisChantier.map((d) => d.id));
      signatures = data || [];
    }
  } catch (e) {
    conteneur.replaceChildren();
    conteneur.appendChild(el('div', 'font-size:12px;color:#9A3412;padding:8px',
      "Impossible de lire l'état du dossier : " + (e.message || e)));
    if (typeof window.bsSignalerPanne === 'function') {
      window.bsSignalerPanne({ action: 'dossier reglementaire', code: 'lecture', detail: String(e.message || e) });
    }
    return;
  }

  conteneur.replaceChildren();

  const aDecennale = coffre.some((d) => d.categorie === 'decennale');
  const aKbis = coffre.some((d) => d.categorie === 'kbis');
  const aRcPro = coffre.some((d) => d.categorie === 'rc_pro');
  const devisSigne = devisChantier.find((d) => signatures.some((s) => s.devis_id === d.id));
  const signDevis = devisSigne ? signatures.find((s) => s.devis_id === devisSigne.id) : null;
  const toutesEtapesCochees = taches.length > 0 && taches.every((t) => t.statut === 'termine');
  const facturesSolde = factures.filter((f) => f.type === 'solde');
  const facturesSituation = factures.filter((f) => f.type === 'situation')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const aAvantPhoto = photos.some((p) => p && p.phase === 'avant');
  const apresPhoto = photos.some((p) => p && p.phase === 'apres');

  // ── Bouton unique « Prévenir le client » ────────────────────────────────
  // Un seul et même comportement pour les deux cartes : compose le message +
  // e-mail (envoyerDossierAuClient), affiche ce qui est parti / ce qui manque
  // (pieces / manquantes renvoyés par l'Edge Function), et re-rend tout le
  // dossier pour rafraîchir le libellé « Prévenir » → « Renvoyer ».
  function boutonPrevenir(type, dejaEnvoye) {
    const libelle = type === 'avant' ? 'le dossier avant travaux' : 'le dossier de fin de chantier';
    const b = el('button', null);
    b.type = 'button';
    b.className = 'mq-btn mq-primary';
    b.style.width = '100%';
    // (06/09, Moctar) « Envoyer le dossier avant travaux » plutôt que
    // « Prévenir le client : dossier avant travaux » : c'est l'action.
    b.innerHTML = `${ico('send', 16)} ${dejaEnvoye ? 'Renvoyer' : 'Envoyer'} ${libelle}`;
    b.addEventListener('click', async () => {
      b.disabled = true;
      const avant = b.innerHTML;
      b.textContent = 'Envoi…';
      try {
        const r = await envoyerDossierAuClient(chantier.id, type);
        const partis = (r.pieces || []).map((p) => p.label).filter(Boolean).join(', ');
        const manque = (r.manquantes || []).map((m) => m.label).filter(Boolean).join(', ');
        let msg = `Message envoyé à ${r.client_name}`
          + (r.email_envoye ? ' (+ e-mail).' : ' (e-mail non envoyé — le message reste votre trace).');
        if (partis) msg += ` Pièces jointes : ${partis}.`;
        if (manque) msg += ` Manquantes : ${manque}.`;
        toast(msg, manque ? 'info' : 'success');
        renderDossierChantier(conteneur, chantier);
      } catch (e) {
        toast(e.message || "L'envoi a échoué.", 'error');
        if (typeof window.bsSignalerPanne === 'function') {
          window.bsSignalerPanne({ action: 'prevenir dossier', code: type, detail: String(e.message || e) });
        }
      } finally {
        b.disabled = false;
        b.innerHTML = avant;
      }
    });
    return b;
  }

  // ── Carte « Dossier avant travaux » ─────────────────────────────────────
  const carteAvant = el('div', 'background:#fff;border:1.5px solid #D3E3DA;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:10px');
  carteAvant.className = 'mq-card';
  carteAvant.appendChild(el('strong', 'font-size:14px;color:#1C2B22', 'Dossier avant travaux'));
  carteAvant.appendChild(el('p', 'font-size:12px;color:#5A7268;margin:0;line-height:1.45',
    "Ce que le client doit pouvoir consulter avant le premier coup de pioche. L'état est lu dans vos données, il n'est pas déclaratif."));

  const listeAvant = el('div', 'display:flex;flex-direction:column;gap:6px');
  carteAvant.appendChild(listeAvant);

  listeAvant.appendChild(ligneDocument({
    titre: 'Devis signé par le client',
    detail: devisSigne
      ? `${devisSigne.numero} — signé le ${fmtDate(signDevis.signe_le)}${signDevis.signataire_nom ? ' par ' + signDevis.signataire_nom : ''}`
      : (devisChantier.length
          ? `${devisChantier.length} devis sur ce chantier, aucun signé à ce jour`
          : 'Devis envoyé, pas encore signé par le client'),
    etat: devisSigne ? 'ok' : 'manquant',
    action: devisSigne ? null : boutonPetit('Voir les devis', () => { location.href = './devis.html'; }),
  }));

  listeAvant.appendChild(ligneDocument({
    titre: 'Attestation d’assurance décennale',
    detail: aDecennale
      ? 'Présente dans votre coffre. Vérifiez qu’elle couvre la période du chantier et qu’elle est partagée avec vos clients.'
      : 'Absente de votre coffre. Le client peut l’exiger avant le premier coup de pioche.',
    etat: aDecennale ? 'ok' : 'manquant',
    action: boutonPetit(aDecennale ? 'Coffre-fort' : 'Déposer', () => { location.href = './coffre.html'; }),
  }));

  listeAvant.appendChild(ligneDocument({
    titre: 'Extrait Kbis',
    detail: aKbis ? 'Présent dans votre coffre.' : 'Absent de votre coffre.',
    etat: aKbis ? 'ok' : 'manquant',
    action: aKbis ? null : boutonPetit('Déposer', () => { location.href = './coffre.html'; }),
  }));

  listeAvant.appendChild(ligneDocument({
    titre: 'Responsabilité civile professionnelle',
    detail: aRcPro ? 'Présente dans votre coffre.' : 'Absente de votre coffre.',
    etat: aRcPro ? 'ok' : 'manquant',
    action: aRcPro ? null : boutonPetit('Déposer', () => { location.href = './coffre.html'; }),
  }));

  listeAvant.appendChild(ligneDocument({
    titre: 'Planning du chantier',
    detail: taches.length
      ? `${taches.length} étape(s) planifiée(s).`
      : 'Aucune étape planifiée pour l’instant.',
    etat: taches.length ? 'ok' : 'manquant',
    action: taches.length ? null : boutonPetit('Planifier', () => {
      document.querySelector('[data-tab="deroulement"]')?.click();
    }),
  }));

  listeAvant.appendChild(el('p', 'font-size:10.5px;color:#5A7268;margin:2px 0 0;line-height:1.4',
    'Les attestations ne partent au client que si elles sont partagées (Coffre-fort → « Vos clients »).'));

  carteAvant.appendChild(boutonPrevenir('avant', dejaAvant));
  conteneur.appendChild(carteAvant);

  // ── Carte « Dossier de fin de chantier » ────────────────────────────────
  // Visible seulement quand il y a quelque chose à y montrer : chantier
  // marqué terminé, ou toutes les étapes planifiées sont cochées.
  if (chantier.status === 'termine' || toutesEtapesCochees) {
    const carteFin = el('div', null);
    carteFin.className = 'mq-card';
    carteFin.style.cssText = 'background:#fff;border:1.5px solid #D3E3DA;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:10px';
    carteFin.appendChild(el('strong', 'font-size:14px;color:#1C2B22', 'Dossier de fin de chantier'));
    carteFin.appendChild(el('p', 'font-size:12px;color:#5A7268;margin:0;line-height:1.45',
      'Ce que le client doit pouvoir consulter à la réception : procès-verbal, solde, photos et garanties.'));

    const listeFin = el('div', 'display:flex;flex-direction:column;gap:6px');
    carteFin.appendChild(listeFin);

    listeFin.appendChild(ligneDocument({
      titre: 'Procès-verbal de réception',
      detail: pv
        ? `Réception du ${fmtDate(pv.date_reception)}${pv.avec_reserves ? ' — AVEC réserves' : ' — sans réserve'}. `
          + `Parfait achèvement jusqu’au ${dansUnAn(pv.date_reception)}.`
          + (pv.signe_le ? ` Signé le ${fmtDate(pv.signe_le)}${pv.signataire_nom ? ' par ' + pv.signataire_nom : ''}.` : ' Pas encore signé.')
        : "Non établi. C’est lui qui fait courir vos garanties (parfait achèvement 1 an, biennale 2 ans, décennale 10 ans) et qui déclenche le solde.",
      etat: pv ? (pv.signe_le ? 'ok' : 'info') : 'manquant',
      action: boutonPetit(pv ? 'Modifier' : 'Établir le PV',
        () => ouvrirFormulairePv(conteneur, chantier, pv), !pv),
    }));

    // Actions du PV : signer sur place, imprimer, envoyer individuellement —
    // distinctes du bouton « Prévenir » ci-dessous, qui couvre tout le
    // dossier d'un coup. Elles n'apparaissent qu'une fois le PV établi.
    if (pv) {
      const actions = el('div', 'display:flex;gap:6px;flex-wrap:wrap;padding:0 0 2px 30px');
      if (!pv.signe_le) {
        actions.appendChild(boutonPetit('Faire signer le client',
          () => ouvrirSignaturePv(conteneur, chantier, pv), true));
      }
      actions.appendChild(boutonPetit('Imprimer', () => imprimerPv(pv, chantier)));
      actions.appendChild(boutonPetit(pv.envoye_le ? 'Renvoyer le PV seul' : 'Envoyer le PV seul',
        () => envoyerPvAuClient(conteneur, chantier, pv)));
      listeFin.appendChild(actions);

      if (!pv.signe_le) {
        listeFin.appendChild(el('div', 'font-size:11px;color:#5A7268;padding:0 0 4px 30px;line-height:1.45',
          'Non signé, ce procès-verbal ne vaut rien : la réception est contradictoire, elle se signe par les deux parties.'));
      }
    }

    const situationsDetail = facturesSituation.length
      ? `${facturesSituation.length} situation(s) déjà émise(s) pour ${fmtEuro(facturesSituation.reduce((s, f) => s + Number(f.total_ttc || 0), 0))} TTC. `
      : '';
    listeFin.appendChild(ligneDocument({
      titre: 'Facture de solde',
      detail: facturesSolde.length
        ? `${situationsDetail}${facturesSolde.map((f) => `${f.numero} — ${fmtEuro(f.total_ttc)}`).join(', ')}.`
        : (situationsDetail || 'Aucune facture émise sur ce chantier pour l’instant.') + ' Solde à émettre après la réception.',
      etat: facturesSolde.length ? 'ok' : 'manquant',
      // Vers finances.html, onglet Factures, filtré sur ce chantier — pas
      // devis.html, qui n'a rien à voir avec l'émission d'une facture
      // (04/09/2026). Le bouton « Nouvelle facture » de finances.html y
      // propose directement le solde (ou une situation) pré-chiffrée.
      action: boutonPetit(facturesSolde.length ? 'Ouvrir' : 'Facturer',
        () => { location.href = `./finances.html?onglet=factures&chantier=${chantier.id}`; }, !facturesSolde.length),
    }));

    listeFin.appendChild(ligneDocument({
      titre: 'Photos avant / après',
      detail: (aAvantPhoto && apresPhoto)
        ? 'Une photo avant et une photo après sont disponibles.'
        : 'Il manque au moins une photo (avant ou après) pour comparer.',
      etat: (aAvantPhoto && apresPhoto) ? 'ok' : 'manquant',
      action: (aAvantPhoto && apresPhoto) ? null : boutonPetit('Photos', () => {
        document.querySelector('[data-tab="photos"]')?.click();
      }),
    }));

    listeFin.appendChild(ligneDocument({
      titre: 'Garanties',
      detail: aDecennale
        ? `Attestation décennale présente : parfait achèvement (1 an), biennale (2 ans) et décennale (10 ans) sont couvertes à compter de la réception.`
        : 'Attestation décennale absente de votre coffre : rien ne prouve la couverture des garanties.',
      etat: aDecennale ? 'ok' : 'manquant',
      action: aDecennale ? null : boutonPetit('Déposer', () => { location.href = './coffre.html'; }),
    }));

    const btnPartager = el('button', null);
    btnPartager.type = 'button';
    btnPartager.className = 'mq-btn mq-ghost';
    btnPartager.style.width = '100%';
    btnPartager.innerHTML = `${ico('share', 16)} Partager l'avant / après`;
    btnPartager.addEventListener('click', () => {
      document.getElementById('avant-apres-partager')?.click();
    });
    carteFin.appendChild(btnPartager);

    carteFin.appendChild(boutonPrevenir('fin', dejaFin));
    conteneur.appendChild(carteFin);

    if (!pv) {
      carteFin.appendChild(el('p', 'font-size:11.5px;color:#5A7268;margin:0;line-height:1.45',
        "Sans PV de réception, la date de départ de vos garanties n’est pas fixée : en cas de litige, c’est vous qui devrez la prouver."));
    }
  }

  // ── Pièces déjà rangées (04/09/2026) ────────────────────────────────────
  // `pieces_chantier` est écrite automatiquement par signer-devis,
  // pv-reception et envoyer-facture-client — jamais par un geste manuel ici.
  // Simple rappel de ce qui a déjà été tracé, avec ses liens ; n'apparaît
  // que s'il y a quelque chose à montrer.
  if (pieces.length) {
    const carteRangees = el('div', 'background:#fff;border:1.5px solid #D3E3DA;border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:8px');
    carteRangees.className = 'mq-card';
    carteRangees.appendChild(el('strong', 'font-size:13px;color:#1C2B22', 'Pièces déjà rangées'));
    const listeRangees = el('div', 'display:flex;flex-direction:column;gap:6px');
    pieces.forEach((pc) => {
      const ligne = el('a', 'display:flex;align-items:center;gap:8px;padding:8px 10px;background:#F7FBF8;border:1px solid #E7EEEA;border-radius:9px;text-decoration:none;color:#1C2B22;font-size:12px;font-weight:700;');
      ligne.href = lienPiece(pc.url_relative) || '#';
      ligne.target = '_blank';
      ligne.rel = 'noopener noreferrer';
      ligne.textContent = `${LABEL_PIECE[pc.type] || 'Document'}${pc.label ? ' — ' + pc.label : ''}`;
      listeRangees.appendChild(ligne);
    });
    carteRangees.appendChild(listeRangees);
    conteneur.appendChild(carteRangees);
  }
}

function dansUnAn(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString('fr-FR');
  } catch (_) { return '—'; }
}

// ── Formulaire du PV ────────────────────────────────────────────────────────
function ouvrirFormulairePv(conteneur, chantier, pvExistant) {
  const fond = el('div', 'position:fixed;inset:0;background:rgba(15,81,50,.45);z-index:1200;display:flex;align-items:flex-end;justify-content:center;padding:0');
  const carte = el('div', 'background:#fff;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;border-radius:16px 16px 0 0;padding:16px;display:flex;flex-direction:column;gap:10px');
  fond.appendChild(carte);
  fond.addEventListener('click', (e) => { if (e.target === fond) fond.remove(); });

  carte.appendChild(el('strong', 'font-size:15.5px;color:#1C2B22', 'Procès-verbal de réception'));
  carte.appendChild(el('p', 'font-size:12px;color:#5A7268;margin:0;line-height:1.45',
    'La réception est contradictoire : elle se signe sur place, par vous et par le client. Ce document est à imprimer ou à présenter, puis à signer par les deux parties.'));

  const champ = (label, node) => {
    const w = el('div', 'display:flex;flex-direction:column;gap:4px');
    w.appendChild(el('label', 'font-size:12px;font-weight:700;color:#3D5A4E', label));
    w.appendChild(node);
    return w;
  };
  const styleInput = 'padding:9px 11px;border:1.5px solid #D3E3DA;border-radius:8px;font-size:16px;font-family:inherit;width:100%;box-sizing:border-box';

  const iDate = el('input', styleInput); iDate.type = 'date';
  iDate.value = (pvExistant && pvExistant.date_reception) || new Date().toISOString().slice(0, 10);
  carte.appendChild(champ('Date de réception', iDate));

  const iNom = el('input', styleInput); iNom.type = 'text';
  iNom.placeholder = 'Nom du client présent à la réception';
  iNom.value = (pvExistant && pvExistant.signataire_nom) || chantier.client_name || '';
  carte.appendChild(champ('Reçu par', iNom));

  const wReserves = el('label', 'display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#1C2B22;cursor:pointer;padding:9px 10px;background:#F7FBF8;border:1px solid #E7EEEA;border-radius:9px');
  const iReserves = el('input', 'width:17px;height:17px;accent-color:#228B5B');
  iReserves.type = 'checkbox';
  iReserves.checked = !!(pvExistant && pvExistant.avec_reserves);
  wReserves.appendChild(iReserves);
  wReserves.appendChild(el('span', null, 'Réception AVEC réserves'));
  carte.appendChild(wReserves);

  const zoneReserves = el('div', 'display:flex;flex-direction:column;gap:10px');
  const iListeReserves = el('textarea', styleInput + ';min-height:80px;resize:vertical');
  iListeReserves.placeholder = 'Une réserve par ligne — décrivez précisément ce qui reste à reprendre.';
  iListeReserves.value = (pvExistant && pvExistant.reserves) || '';
  zoneReserves.appendChild(champ('Réserves constatées', iListeReserves));
  const iLevee = el('input', styleInput); iLevee.type = 'date';
  iLevee.value = (pvExistant && pvExistant.levee_reserves_avant) || '';
  zoneReserves.appendChild(champ('Levée des réserves avant le', iLevee));
  carte.appendChild(zoneReserves);

  const majReserves = () => { zoneReserves.style.display = iReserves.checked ? 'flex' : 'none'; };
  iReserves.addEventListener('change', majReserves);
  majReserves();

  const iObs = el('textarea', styleInput + ';min-height:60px;resize:vertical');
  iObs.placeholder = 'Optionnel';
  iObs.value = (pvExistant && pvExistant.observations) || '';
  carte.appendChild(champ('Observations', iObs));

  const statut = el('div', 'display:none;font-size:12px;padding:8px 10px;border-radius:8px;line-height:1.45');
  carte.appendChild(statut);
  const dire = (t, err) => {
    statut.style.display = 'block'; statut.textContent = t;
    statut.style.color = err ? '#9A3412' : '#065F46';
    statut.style.background = err ? '#FFF7ED' : '#DCFCE7';
  };

  const barre = el('div', 'display:flex;gap:8px;margin-top:2px');
  const btnAnnuler = el('button', 'flex:1;padding:11px;font-size:12.5px;font-weight:800;border-radius:10px;border:1.5px solid #D3E3DA;background:#fff;color:#1C2B22;cursor:pointer', 'Fermer');
  btnAnnuler.type = 'button';
  btnAnnuler.addEventListener('click', () => fond.remove());
  const btnValider = el('button', 'flex:2;padding:11px;font-size:12.5px;font-weight:800;border-radius:10px;border:1.5px solid #228B5B;background:#228B5B;color:#fff;cursor:pointer',
    pvExistant ? 'Mettre à jour et imprimer' : 'Établir le PV et imprimer');
  btnValider.type = 'button';
  barre.appendChild(btnAnnuler); barre.appendChild(btnValider);
  carte.appendChild(barre);

  btnValider.addEventListener('click', async () => {
    // Une réception « avec réserves » sans réserve écrite ne vaut rien : c'est
    // précisément la liste qui protège l'artisan comme le client.
    if (iReserves.checked && !iListeReserves.value.trim()) {
      dire('Vous avez coché « avec réserves » : décrivez-les, sinon le PV ne protège personne.', true);
      iListeReserves.focus();
      return;
    }
    if (!iDate.value) { dire('La date de réception est obligatoire.', true); return; }

    btnValider.disabled = true;
    const libelle = btnValider.textContent;
    btnValider.textContent = 'Enregistrement…';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expirée, reconnectez-vous.');

      const ligne = {
        chantier_id: chantier.id,
        pro_id: session.user.id,
        date_reception: iDate.value,
        avec_reserves: iReserves.checked,
        reserves: iReserves.checked ? iListeReserves.value.trim() : null,
        levee_reserves_avant: (iReserves.checked && iLevee.value) ? iLevee.value : null,
        observations: iObs.value.trim() || null,
        signataire_nom: iNom.value.trim() || null,
      };

      let enregistre;
      if (pvExistant) {
        const { data, error } = await supabase.from('pv_reception')
          .update(ligne).eq('id', pvExistant.id).select().single();
        if (error) throw error;
        enregistre = data;
      } else {
        const { data, error } = await supabase.from('pv_reception')
          .insert(ligne).select().single();
        if (error) throw error;
        enregistre = data;
      }

      // On n'imprime QU'APRÈS l'enregistrement réussi : un PV imprimé mais non
      // enregistré laisserait une preuve papier sans trace dans l'app.
      fond.remove();
      toast('Procès-verbal enregistré.', 'success');
      imprimerPv(enregistre, chantier);
      renderDossierChantier(conteneur, chantier);
    } catch (e) {
      dire(e.message || "Enregistrement impossible.", true);
      if (typeof window.bsSignalerPanne === 'function') {
        window.bsSignalerPanne({ action: 'pv de reception', code: 'ecriture', detail: String(e.message || e) });
      }
    } finally {
      btnValider.disabled = false;
      btnValider.textContent = libelle;
    }
  });

  document.body.appendChild(fond);
}

// ── Appel de l'Edge Function pv-reception ───────────────────────────────────
async function appelerPv(charge) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Session expirée, reconnectez-vous.');
  const cfg = window.__BATISPOT_CONFIG__ || {};
  const rep = await (window.bsFetchAvecDelai || fetch)(
    `${cfg.SUPABASE_URL}/functions/v1/pv-reception`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(charge),
    }, 45000);
  const j = await rep.json().catch(() => ({}));
  if (!rep.ok) {
    const messages = {
      deja_signe: 'Ce procès-verbal est déjà signé. On ne remplace pas une signature : deux signatures contradictoires détruiraient la valeur des deux.',
      signature_invalide: 'La signature est vide ou illisible.',
      nom_signataire_requis: 'Indiquez le nom du signataire.',
      email_client_invalide: "Ce chantier n'a pas d'email client. Renseignez-le dans l'onglet Infos.",
      envoi_indisponible: "L'envoi est momentanément indisponible.",
      envoi_echoue: "L'envoi a échoué. Vérifiez l'adresse du client.",
      pv_non_autorise: "Ce procès-verbal ne vous appartient pas.",
    };
    throw new Error(messages[j.error] || `Erreur ${rep.status}`);
  }
  return j;
}

// ── Envoi au client ─────────────────────────────────────────────────────────
async function envoyerPvAuClient(conteneur, chantier, pv) {
  if (!chantier.client_email) {
    toast("Ce chantier n'a pas d'email client. Renseignez-le dans l'onglet Infos.", 'error');
    return;
  }
  // Un PV non signé qui part chez le client peut être pris pour un document
  // acquis : on le dit avant, plutôt que de le laisser croire.
  const avertissement = pv.signe_le ? '' :
    "\n\nAttention : ce procès-verbal n'est PAS signé. Il ne vaut que signé par les deux parties.";
  if (!window.confirm(`Envoyer le procès-verbal de réception à :\n\n${chantier.client_email}\n\nVous serez en copie.${avertissement}`)) return;
  try {
    const j = await appelerPv({ action: 'envoyer', pv_id: pv.id });
    toast(`Procès-verbal envoyé à ${j.envoye_a}.`, 'success');
    renderDossierChantier(conteneur, chantier);
  } catch (e) {
    toast(e.message || "L'envoi a échoué.", 'error');
    if (typeof window.bsSignalerPanne === 'function') {
      window.bsSignalerPanne({ action: 'envoi pv reception', code: 'envoi', detail: String(e.message || e) });
    }
  }
}

// ── Signature sur place ─────────────────────────────────────────────────────
// La réception est contradictoire : le client signe sur le téléphone de
// l'artisan, pendant la visite, les deux parties présentes. C'est la seule
// façon fidèle à ce qu'est une réception.
function ouvrirSignaturePv(conteneur, chantier, pv) {
  const fond = el('div', 'position:fixed;inset:0;background:rgba(15,81,50,.45);z-index:1200;display:flex;align-items:center;justify-content:center;padding:14px');
  const carte = el('div', 'background:#fff;width:100%;max-width:480px;max-height:92vh;overflow-y:auto;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px');
  fond.appendChild(carte);
  fond.addEventListener('click', (e) => { if (e.target === fond) fond.remove(); });

  carte.appendChild(el('strong', 'font-size:15.5px;color:#1C2B22', 'Signature du client'));
  carte.appendChild(el('p', 'font-size:12px;color:#5A7268;margin:0;line-height:1.45',
    `Réception du ${new Date(pv.date_reception + 'T00:00:00').toLocaleDateString('fr-FR')}, `
    + `${pv.avec_reserves ? 'AVEC réserves' : 'sans réserve'}. Faites relire le procès-verbal au client avant qu'il signe.`));

  const styleInput = 'padding:9px 11px;border:1.5px solid #D3E3DA;border-radius:8px;font-size:16px;font-family:inherit;width:100%;box-sizing:border-box';
  const iNom = el('input', styleInput); iNom.type = 'text';
  iNom.placeholder = 'Nom et prénom du signataire';
  iNom.value = pv.signataire_nom || chantier.client_name || '';
  carte.appendChild(iNom);

  const iEmail = el('input', styleInput); iEmail.type = 'email';
  iEmail.placeholder = 'Email du signataire (optionnel)';
  iEmail.value = chantier.client_email || '';
  carte.appendChild(iEmail);

  carte.appendChild(el('div', 'font-size:11.5px;color:#5A7268;margin-top:2px', 'Signature, au doigt :'));
  const toile = document.createElement('canvas');
  toile.style.cssText = 'width:100%;height:170px;border:1.5px dashed #D3E3DA;border-radius:10px;touch-action:none;background:#FDFEFD';
  carte.appendChild(toile);

  // Le canvas doit être dimensionné en pixels réels, sinon le tracé est décalé
  // par rapport au doigt sur un écran à forte densité.
  let ctx, aTrace = false;
  const preparerToile = () => {
    const r = toile.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    toile.width = Math.round(r.width * d);
    toile.height = Math.round(r.height * d);
    ctx = toile.getContext('2d');
    ctx.scale(d, d);
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1C2B22';
  };

  let dessine = false;
  const pos = (ev) => {
    const r = toile.getBoundingClientRect();
    const p = ev.touches ? ev.touches[0] : ev;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  };
  const demarrer = (ev) => { ev.preventDefault(); dessine = true; const { x, y } = pos(ev); ctx.beginPath(); ctx.moveTo(x, y); };
  const tracer = (ev) => { if (!dessine) return; ev.preventDefault(); const { x, y } = pos(ev); ctx.lineTo(x, y); ctx.stroke(); aTrace = true; };
  const finir = () => { dessine = false; };
  ['mousedown', 'touchstart'].forEach((e) => toile.addEventListener(e, demarrer, { passive: false }));
  ['mousemove', 'touchmove'].forEach((e) => toile.addEventListener(e, tracer, { passive: false }));
  ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((e) => toile.addEventListener(e, finir));

  const statut = el('div', 'display:none;font-size:12px;padding:8px 10px;border-radius:8px;line-height:1.45');
  carte.appendChild(statut);
  const dire = (t, err) => {
    statut.style.display = 'block'; statut.textContent = t;
    statut.style.color = err ? '#9A3412' : '#065F46';
    statut.style.background = err ? '#FFF7ED' : '#DCFCE7';
  };

  const barre = el('div', 'display:flex;gap:8px');
  const btnEffacer = el('button', 'flex:1;padding:11px;font-size:12.5px;font-weight:800;border-radius:10px;border:1.5px solid #D3E3DA;background:#fff;color:#1C2B22;cursor:pointer', 'Effacer');
  btnEffacer.type = 'button';
  btnEffacer.addEventListener('click', () => { preparerToile(); aTrace = false; });
  const btnSigner = el('button', 'flex:2;padding:11px;font-size:12.5px;font-weight:800;border-radius:10px;border:1.5px solid #228B5B;background:#228B5B;color:#fff;cursor:pointer', 'Valider la signature');
  btnSigner.type = 'button';
  barre.appendChild(btnEffacer); barre.appendChild(btnSigner);
  carte.appendChild(barre);

  const fermer = el('button', 'padding:9px;font-size:12px;font-weight:700;border-radius:9px;border:none;background:none;color:#5A7268;cursor:pointer', 'Annuler');
  fermer.type = 'button';
  fermer.addEventListener('click', () => fond.remove());
  carte.appendChild(fermer);

  carte.appendChild(el('p', 'font-size:10.5px;color:#5A7268;margin:0;line-height:1.4',
    "Signature électronique simple au sens du règlement eIDAS (art. 3.10), recevable en preuve (art. 25.1). L'horodatage et l'empreinte du document sont établis par le serveur."));

  btnSigner.addEventListener('click', async () => {
    if (!aTrace) { dire('Faites signer le client dans le cadre avant de valider.', true); return; }
    if (iNom.value.trim().length < 2) { dire('Indiquez le nom du signataire.', true); iNom.focus(); return; }
    btnSigner.disabled = true;
    const libelle = btnSigner.textContent;
    btnSigner.textContent = 'Enregistrement…';
    try {
      const j = await appelerPv({
        action: 'signer',
        pv_id: pv.id,
        signataire_nom: iNom.value.trim(),
        signataire_email: iEmail.value.trim() || null,
        signature_image: toile.toDataURL('image/png'),
      });
      fond.remove();
      toast('Procès-verbal signé.', 'success');
      // On propose l'envoi dans la foulée : le client vient de signer, c'est le
      // moment où il attend sa copie.
      if (chantier.client_email
          && window.confirm(`Envoyer maintenant une copie au client ?\n\n${chantier.client_email}`)) {
        await envoyerPvAuClient(conteneur, chantier, Object.assign({}, pv, { signe_le: j.signe_le }));
      } else {
        renderDossierChantier(conteneur, chantier);
      }
    } catch (e) {
      dire(e.message || "La signature n'a pas pu être enregistrée.", true);
      if (typeof window.bsSignalerPanne === 'function') {
        window.bsSignalerPanne({ action: 'signature pv', code: 'signature', detail: String(e.message || e) });
      }
    } finally {
      btnSigner.disabled = false;
      btnSigner.textContent = libelle;
    }
  });

  document.body.appendChild(fond);
  requestAnimationFrame(preparerToile);
}

// ── Impression ──────────────────────────────────────────────────────────────
// Même mécanique que le devis : une fenêtre dédiée puis window.print(), donc
// « Enregistrer en PDF » depuis le navigateur. Pas de bibliothèque à charger.
function imprimerPv(pv, chantier) {
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dateFr = (d) => { try { return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR'); } catch (_) { return d || '—'; } };

  const reserves = pv.avec_reserves && pv.reserves
    ? '<ul>' + String(pv.reserves).split('\n').filter((l) => l.trim())
        .map((l) => `<li>${esc(l.trim())}</li>`).join('') + '</ul>'
    : '<p><em>Aucune réserve n’a été formulée à la réception.</em></p>';

  const w = window.open('', '_blank');
  if (!w) { toast("Autorisez les fenêtres pour imprimer le PV.", 'error'); return; }
  w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>PV de réception — ${esc(chantier.client_name || '')}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: Inter, system-ui, Arial, sans-serif; color:#1C2B22; font-size:12.5px; line-height:1.55; }
  h1 { font-size:19px; margin:0 0 4px; }
  h2 { font-size:13px; margin:18px 0 6px; text-transform:uppercase; letter-spacing:.04em; color:#0F5132; border-bottom:1.5px solid #D3E3DA; padding-bottom:3px; }
  .sous { color:#5A7268; font-size:12px; margin:0 0 14px; }
  table.champs { width:100%; border-collapse:collapse; }
  table.champs td { padding:4px 0; vertical-align:top; }
  table.champs td:first-child { width:38%; color:#5A7268; }
  .encadre { border:1.5px solid #D3E3DA; border-radius:8px; padding:10px 12px; margin-top:6px; }
  .sign { display:flex; gap:24px; margin-top:26px; }
  .sign > div { flex:1; border:1px solid #D3E3DA; border-radius:8px; padding:10px; min-height:90px; }
  .sign strong { display:block; font-size:11.5px; margin-bottom:4px; }
  .pied { margin-top:22px; font-size:10.5px; color:#5A7268; line-height:1.5; }
  ul { margin:4px 0 0; padding-left:18px; }
</style></head><body>
<h1>Procès-verbal de réception de travaux</h1>
<p class="sous">Établi contradictoirement entre les parties, conformément à l’article 1792-6 du Code civil.</p>

<h2>Chantier</h2>
<table class="champs">
  <tr><td>Maître d’ouvrage</td><td><strong>${esc(chantier.client_name || '—')}</strong></td></tr>
  <tr><td>Adresse des travaux</td><td>${esc(chantier.adresse || '—')}</td></tr>
  <tr><td>Nature des travaux</td><td>${esc(chantier.description || '—')}</td></tr>
  <tr><td>Date de réception</td><td><strong>${dateFr(pv.date_reception)}</strong></td></tr>
</table>

<h2>Réception</h2>
<p>Les travaux sont reçus <strong>${pv.avec_reserves ? 'AVEC réserves' : 'SANS réserve'}</strong>.</p>
<div class="encadre">${reserves}
${pv.avec_reserves && pv.levee_reserves_avant
  ? `<p style="margin:8px 0 0"><strong>Levée des réserves attendue avant le ${dateFr(pv.levee_reserves_avant)}.</strong></p>` : ''}</div>

${pv.observations ? `<h2>Observations</h2><div class="encadre">${esc(pv.observations).replace(/\n/g, '<br>')}</div>` : ''}

<h2>Effets de la réception</h2>
<p>La réception fait courir, à compter du ${dateFr(pv.date_reception)} :</p>
<ul>
  <li>la <strong>garantie de parfait achèvement</strong> — 1 an (art. 1792-6 du Code civil) ;</li>
  <li>la <strong>garantie de bon fonctionnement</strong> — 2 ans (art. 1792-3) ;</li>
  <li>la <strong>garantie décennale</strong> — 10 ans (art. 1792).</li>
</ul>

<div class="sign">
  <div><strong>Le maître d’ouvrage</strong>${pv.signataire_nom ? '<br>' + esc(pv.signataire_nom) : ''}
    <br><span style="color:#5A7268;font-size:10.5px">Date et signature, précédées de « Reçu »</span></div>
  <div><strong>L’entreprise</strong><br><span style="color:#5A7268;font-size:10.5px">Date et signature</span></div>
</div>

<p class="pied">Document établi le ${dateFr(pv.date_reception)} et remis en deux exemplaires, un pour chaque partie.<br>
Généré avec BatiSpot. Ce procès-verbal ne vaut que signé par les deux parties.</p>
</body></html>`);
  w.document.close();
  setTimeout(() => { try { w.print(); } catch (_) {} }, 400);
}

// ─────────────────────────────────────────────────────────────────────────────
// Photographier un ticket → une dépense, depuis N'IMPORTE QUEL écran.
//
// POURQUOI CE FICHIER (09/09/2026, Moctar : « comment on upload les dépenses
// chantier ? »). Mesuré en base le matin même : 35 dépenses, dont 26 rattachées
// à un chantier — et ZÉRO justificatif, ZÉRO lecture OCR, ZÉRO détail de lignes.
// Les 12 dépenses réelles sont toutes en `source: 'saisie'`, tapées à la main.
//
// Pourtant tout existait : `lireTicketIA` lit le ticket, `uploadJustificatif`
// range la photo, `enregistrer_depense` écrit la ligne. Le chemin était complet
// et n'avait jamais servi. La cause, trouvée en lisant l'écran : le panneau
// « Dépenses » ne contient AUCUN bouton pour en ajouter une — ni appareil photo,
// ni champ fichier. La capture n'existait que dans l'assistant et dans l'écran
// Photos, c'est-à-dire partout sauf là où l'artisan regarde ses dépenses.
// Une porte sans poignée.
//
// Ce module est la poignée. Il est AUTONOME : il fabrique sa propre fenêtre de
// validation au lieu de dépendre du DOM d'une page, pour pouvoir être branché
// sur plusieurs écrans sans les coupler entre eux. `photos.html` garde son
// implémentation d'origine — on ne casse pas ce qui marche pour refactorer.
//
// RÈGLE TENUE : on ne crée JAMAIS la dépense sans que l'artisan ait vu et
// validé les montants. Une transcription est approximative ; un montant faux
// parti en comptabilité est pire que pas de montant du tout.
// ─────────────────────────────────────────────────────────────────────────────

const euros = (n) => (Number(n) || 0).toLocaleString('fr-FR', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 2,
});

function ligne(libelle, valeur, fort) {
  const l = document.createElement('div');
  l.style.cssText = 'display:flex;justify-content:space-between;gap:12px;font-size:13px;padding:3px 0;';
  const g = document.createElement('span');
  g.style.color = '#5A7268';
  g.textContent = libelle;
  const v = document.createElement(fort ? 'strong' : 'span');
  v.style.cssText = 'color:#1C2B22;text-align:right;';
  v.textContent = valeur;
  l.append(g, v);
  return l;
}

/** Fenêtre de validation. Résout avec { chantier_id } ou null si l'artisan renonce. */
function confirmerDepense(d, chantiers) {
  return new Promise((resolve) => {
    const fond = document.createElement('div');
    fond.style.cssText = 'position:fixed;inset:0;z-index:10050;background:rgba(15,23,42,.55);'
      + 'display:flex;align-items:flex-end;justify-content:center;padding:0;';
    const carte = document.createElement('div');
    carte.style.cssText = 'background:#fff;width:100%;max-width:520px;border-radius:18px 18px 0 0;'
      + 'padding:20px 18px calc(18px + env(safe-area-inset-bottom,0px));max-height:88vh;overflow:auto;';

    const titre = document.createElement('div');
    titre.style.cssText = 'font-size:16px;font-weight:800;color:#1C2B22;margin-bottom:2px;';
    titre.textContent = 'Vérifiez avant d’enregistrer';
    const sous = document.createElement('div');
    sous.style.cssText = 'font-size:12.5px;color:#5A7268;margin-bottom:12px;';
    sous.textContent = 'Ce que j’ai lu sur le ticket. Corrigez si besoin, rien n’est enregistré avant votre validation.';
    carte.append(titre, sous);

    const recap = document.createElement('div');
    recap.style.cssText = 'background:#F7FAF8;border:1px solid #DCE6E0;border-radius:10px;padding:10px 12px;';
    recap.appendChild(ligne('Fournisseur', d.supplier || 'non lu'));
    if (d.date) recap.appendChild(ligne('Date', d.date));
    recap.appendChild(ligne('Montant HT', euros(d.totalHT)));
    recap.appendChild(ligne('TVA', `${d.vatRate != null ? d.vatRate : 20} %`));
    recap.appendChild(ligne('Total TTC', euros(d.totalTTC), true));
    recap.appendChild(ligne('Poste', d.category || 'Matériaux'));
    // La fiabilité ne s'affiche que si elle est basse : au-dessus elle encombre,
    // en dessous elle invite à relire. Même règle que l'écran Photos.
    if (d.confidence != null && Number(d.confidence) < 80) {
      const avert = document.createElement('div');
      avert.style.cssText = 'font-size:12px;color:#B45309;font-weight:700;margin-top:6px;line-height:1.4;';
      avert.textContent = `Lecture incertaine (${Math.round(Number(d.confidence))} %) — vérifiez les montants avant d’enregistrer.`;
      recap.appendChild(avert);
    }
    carte.appendChild(recap);

    const lab = document.createElement('label');
    lab.style.cssText = 'display:block;font-size:12px;font-weight:700;color:#5A7268;margin:14px 0 5px;';
    lab.textContent = 'Chantier';
    const select = document.createElement('select');
    // 16 px minimum : en dessous, Safari iOS zoome la page au focus.
    select.style.cssText = 'width:100%;font-size:16px;padding:11px 12px;border:1px solid #DCE6E0;'
      + 'border-radius:10px;background:#fff;color:#1C2B22;';
    const vide = document.createElement('option');
    vide.value = ''; vide.textContent = 'Aucun chantier (frais général)';
    select.appendChild(vide);
    (chantiers || []).forEach((c) => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.client_name || c.description || 'Chantier';
      select.appendChild(o);
    });
    carte.append(lab, select);

    const barre = document.createElement('div');
    barre.style.cssText = 'display:flex;gap:10px;margin-top:18px;';
    const non = document.createElement('button');
    non.type = 'button';
    non.style.cssText = 'flex:1;padding:13px;border-radius:12px;border:1px solid #DCE6E0;'
      + 'background:#fff;color:#5A7268;font-size:15px;font-weight:700;';
    non.textContent = 'Annuler';
    const oui = document.createElement('button');
    oui.type = 'button';
    oui.style.cssText = 'flex:1.4;padding:13px;border-radius:12px;border:0;background:#228B5B;'
      + 'color:#fff;font-size:15px;font-weight:800;';
    oui.textContent = 'Enregistrer';
    barre.append(non, oui);
    carte.appendChild(barre);

    fond.appendChild(carte);
    document.body.appendChild(fond);

    const fermer = (val) => { try { fond.remove(); } catch (_) {} resolve(val); };
    non.onclick = () => fermer(null);
    oui.onclick = () => fermer({ chantier_id: select.value || null });
    fond.onclick = (e) => { if (e.target === fond) fermer(null); };
  });
}

/**
 * Lit un ticket et enregistre la dépense après validation.
 * @param {File} file      la photo du ticket
 * @param {Function} toast (message, estErreur) — l'écran appelant décide comment le montrer
 * @returns {Promise<boolean>} vrai si une dépense a été créée
 */
export async function depuisTicket(file, toast = () => {}) {
  if (!file) return false;
  toast('Lecture du ticket en cours…');
  const ia = await import('./app-photo-ia.js');
  try {
    const lu = await ia.lireTicketIA(file);
    const d = lu.data;

    // Le document n'est PAS un justificatif d'achat (09/09/2026). Le lecteur
    // classe désormais ce qu'il voit : un plan, une attestation ou un courrier
    // ne doit pas devenir une dépense à 0 €. On le dit, on n'invente rien, et
    // on ne crée aucune ligne. Ranger ces documents-là viendra ensuite —
    // `coffre_documents` existe déjà et attend son premier écrivain.
    if (d && d.estUneDepense === false) {
      const quoi = {
        plan: 'un plan', attestation: 'une attestation', courrier: 'un courrier',
        devis_recu: 'un devis reçu', facture_client: 'une facture client',
        photo_chantier: 'une photo de chantier', bon_livraison: 'un bon de livraison',
      }[d.typeDocument] || 'un document';
      toast(`Ce n'est pas un justificatif d'achat : on dirait ${quoi}. Aucune dépense enregistrée.`, true);
      return false;
    }

    let chantiers = [];
    const supa = await import('./supabase.js');
    try { chantiers = (await supa.listChantiers()) || []; } catch (_) { /* frais général */ }

    // On PROPOSE, l'artisan valide. Rien n'est écrit avant son clic.
    const choix = await confirmerDepense(d, chantiers);
    if (!choix) { toast('Dépense non enregistrée.'); return false; }

    // Un échec de dépôt du justificatif ne doit pas faire perdre la dépense :
    // on l'enregistre sans, et on le dit.
    let justificatif = null;
    try {
      justificatif = await supa.uploadJustificatif(lu.fichierReduit);
    } catch (eUp) {
      console.warn('[depense] justificatif non conservé', eUp);
    }

    const mod = await import('./app-actions.js');
    const resultat = await mod.executerAction('enregistrer_depense', {
      fournisseur: d.supplier,
      date_achat: d.date,
      categorie: (d.category || 'Materiaux').split(' ')[0].replace('é', 'e'),
      montant_ht: d.totalHT,
      tva: d.vatRate,
      montant_ttc: d.totalTTC,
      designation: Array.isArray(d.items) ? d.items.map((i) => i.name).join(', ') : null,
      items: Array.isArray(d.items) ? d.items : null,
      source: 'ocr',
      confiance_ocr: d.confidence,
      chantier_id: choix.chantier_id,
      justificatif_path: justificatif,
    });
    // Le justificatif rejoint le COFFRE, relié à la dépense qu'il justifie.
    // C'est ce qui transforme une photo perdue dans un bucket en pièce
    // retrouvable : par date, par type, par chantier — et par l'assistant.
    // Un échec ici ne fait pas perdre la dépense : elle est déjà écrite.
    if (justificatif && resultat && resultat.data && resultat.data.id) {
      try {
        await supa.lierJustificatifAuCoffre({
          chemin: justificatif,
          depense_id: resultat.data.id,
          chantier_id: resultat.data.chantier_id || null,
          fournisseur: resultat.data.fournisseur || null,
          date_achat: resultat.data.date_achat || null,
          categorie: resultat.data.categorie || 'autre',
          type_mime: (lu.fichierReduit && lu.fichierReduit.type) || 'image/jpeg',
          taille_octets: (lu.fichierReduit && lu.fichierReduit.size) || null,
        });
      } catch (eCoffre) {
        console.warn('[depense] justificatif non range au coffre', eCoffre);
      }
    }

    toast(justificatif
      ? (resultat && resultat.message) || 'Dépense enregistrée.'
      : ((resultat && resultat.message) || 'Dépense enregistrée.') + ' La photo n’a pas pu être conservée.');
    return true;
  } catch (e) {
    const echec = ia.messageEchecPhoto(e, 'ticket');
    toast(echec.message, true);
    return false;
  }
}

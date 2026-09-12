// BatiSpot Pro — Exécution des actions proposées par l'assistant.
//
// L'assistant PROPOSE, l'artisan VALIDE, ce module EXÉCUTE. Rien ici ne part
// sans un clic explicite : c'est le pendant applicatif du verrou d'action du
// prompt serveur. Aucune action sortante (envoi client, facture) n'est faite ici.
//
// Toutes les écritures passent par la session de l'artisan : les politiques RLS
// (pro_id = auth.uid()) garantissent qu'un artisan ne touche jamais les données
// d'un autre. Aucune clé de service n'est utilisée côté navigateur.

import { telAppelable } from './tel.js';
import { normaliserHeure, heureLisible } from './heures.js';
import {
  supabase,
  getSession,
  listChantiers,
  createChantier,
  updateChantier,
  deleteChantier,
  modifierTache,
  supprimerTache,
  listMembres,
  envoyerMessageEquipe,
  annoncerFilEquipe,
  listTachesChantier,
  listTachesJour,
  listTachesPeriode,
  majStatutTache,
  assignerTache,
  nomAssigne,
  mesDroits,
  getMyProfile,
  majVisibiliteDoc,
  envoyerDossierAuClient,
  listMessages,
  listPhotos,
  listPhotosEquipe,
  signPhotoUrls,
  coffreDocsExpirants,
  listClientDocs,
  listDepensesParChantier,
  listTachesMainDoeuvre,
  listMembresTauxHoraire,
  majParametresEquipe,
  majTauxHoraireMembre,
  renvoyerInvitation,
  retirerMembre,
  modifierMessage,
  supprimerMessage,
  setPhotosVisiblesClient,
  setPhotoRoleClient,
  accepterDemande,
  uploadCoffreDoc,
  deleteCoffreDoc,
  uploadJustificatif,
  listGroupesLibres,
  envoyerMessageGroupe,
  creerConstat,
  creerIndisponibilite,
  creerTache,
  envoyerFacture,
  envoyerFactureParEmail,
  getChantier,
  listCoffreDocs,
  listConstats,
  listIndisponibilites,
  listMessagesEquipe,
  listNouvellesDemandes,
  sendMessage,
  upsertMyProfile,
  inviterMembre,
} from './supabase.js';
// L'écriture d'un devis n'existe qu'à un seul endroit : devis-store.js.
// L'assistant emprunte le même chemin que les écrans de devis.html.
import {
  enregistrerDevis as storeEnregistrerDevis, lignesVersLots,
  // modifier_devis (05/09/2026) : la modification d'un devis existant emprunte
  // exactement le meme chemin que devis.html — meme lecture, meme recalcul des
  // totaux, meme enregistrement local-d'abord.
  chargerDevisUI, completerQuote, lotsVersLignes, recalculerTotaux, majDevisEnregistre,
  // nouvelle_version_devis (05/09/2026) : l'avenant est un devis DE PLUS. Toute
  // la logique (garde brouillon, appel du mode serveur revise-quote, recollage
  // des prix sur le devis d'origine, numerotation -V2) vit dans le store, pour
  // que le bouton « Nouvelle version » de devis.html et l'assistant fassent la
  // meme chose — et pour que le devis d'origine ne soit touche par personne.
  creerNouvelleVersion,
  resumeChangements,
} from './devis-store.js';
// Le lien du document client d'une facture : compose UNE fois, ici et dans
// finances.html (bouton « Partager »). Voir app-factures.js.
import { lienFacture } from './app-factures.js';

// ── Utilitaires ────────────────────────────────────────────
const norm = (s) => (s || '').toString().trim().toLowerCase();

function euro(n) {
  return (Number(n) || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }) + ' €';
}

// Retrouve un chantier par nom de client (ou adresse), sinon null.
// `taches.duree_h` est NOT NULL avec un defaut de 2 — mais un defaut Postgres ne
// s'applique QUE si la colonne est omise, jamais si on l'envoie explicitement a
// null. Une etape sans duree faisait donc echouer toute la planification avec
// « null value in column duree_h ». (Constate en prod le 08/09 sur Copropriete
// Jaures.) Ce garde rend une duree utilisable ou le defaut, jamais null.
function dureeSure(v, defaut = 2) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : defaut;
}

async function trouverChantier(recherche) {
  const q = norm(recherche);
  if (!q) return null;
  const chantiers = await listChantiers();
  return chantiers.find((c) =>
    norm(c.client_name).includes(q) || norm(c.adresse).includes(q)
  ) || null;
}

// trouverOuCreerChantier() et prochainNumeroDevis() vivaient ici, en double avec
// devis.html. Elles sont dans devis-store.js, avec deux corrections :
//  - pro_id passe par mon_entreprise() et non session.user.id. Les policies RLS
//    comparent à mon_entreprise() (= le pro_id du patron pour un salarié) :
//    l'écriture d'un membre d'équipe échouait silencieusement.
//  - le numéro est confirmé libre en base au lieu d'être déduit du dernier connu.

// Normalise les lignes proposées par l'assistant vers le format stocké.
function normaliserLignes(lignes) {
  return (lignes || []).map((l) => {
    const qte = parseFloat(l.quantity ?? l.quantite ?? 1) || 1;
    const pu = parseFloat(l.unitPrice ?? l.prix_ht ?? 0) || 0;
    let tva = parseFloat(l.vatRate ?? l.tva ?? 10);
    if (tva > 0 && tva <= 1) tva = tva * 100;      // tolère 0.10 comme 10 %
    if (!(tva > 0) || tva > 30) tva = 10;
    return {
      description: l.description || l.designation || 'Prestation',
      quantity: qte,
      unit: l.unit || l.unite || 'u',
      unitPrice: pu,
      vatRate: tva,
      total_ht: qte * pu,
    };
  });
}

function totaux(lignes) {
  const ht = lignes.reduce((s, l) => s + l.total_ht, 0);
  const tva = lignes.reduce((s, l) => s + l.total_ht * (l.vatRate / 100), 0);
  return { ht, tva, ttc: ht + tva };
}


// ── LE MÉTRÉ SE CALCULE, IL NE SE RÉDIGE PAS ────────────────────────────────
//
// Constaté le 08/09 sur un devis réel : l'assistant écrivait « périmètre estimé
// à 22,2 ml → 57 m² de murs » avec une hauteur annoncée de 2,50 m. 22,2 × 2,50
// fait 55,5, pas 57. Le chiffre était faux d'un mètre et demi, et il annonçait
// lui-même les deux nombres qui le contredisaient.
//
// Ce n'est pas une coquille : un modèle de langage n'a aucune raison d'être bon
// en arithmétique, et la compagne de Moctar — qui faisait les devis chez Apexis
// — voit ce genre d'écart en trois secondes. Un devis dont un calcul ne tombe
// pas juste perd la confiance sur TOUT le reste, même sur ce qui est exact.
//
// Donc : le modèle fournit les COTES, le code fait le calcul et écrit la note.
// Les totaux, eux, étaient déjà calculés par totaux() — c'est la seule partie
// qui était restée en prose.
function metreDeveloppe(m) {
  if (!m || typeof m !== 'object') return null;
  const n = (x) => {
    const v = Number(String(x ?? '').replace(',', '.'));
    return Number.isFinite(v) && v > 0 ? v : null;
  };
  const sol = n(m.surface_sol_m2 ?? m.surface_sol ?? m.sol);
  const haut = n(m.hauteur_m ?? m.hauteur ?? m.hsp);
  let perim = n(m.perimetre_ml ?? m.perimetre);
  const baies = n(m.deduction_baies_m2 ?? m.baies) || 0;
  const avecPlafond = m.plafond !== false;
  if (!haut && !sol) return null;

  const bouts = [];
  let estime = false;
  // Sans périmètre donné, on le déduit du sol EN SUPPOSANT une pièce carrée —
  // et on l'écrit, parce que c'est une hypothèse, pas une mesure.
  if (!perim && sol) { perim = 4 * Math.sqrt(sol); estime = true; }

  // Virgule décimale, pas de point : c'est un document français, lu par un
  // client français. « 21.2 ml » sur un devis fait amateur.
  const r1 = (x) => (Math.round(x * 10) / 10).toLocaleString('fr-FR');
  let murs = null;
  if (perim && haut) {
    murs = perim * haut - baies;
    bouts.push(`murs ${r1(perim)} ml × ${r1(haut)} m`
      + (baies ? ` − ${r1(baies)} m² de baies` : '')
      + ` = ${r1(murs)} m²`
      + (estime ? ' (périmètre déduit d’une pièce carrée, à confirmer sur place)' : ''));
  }
  const plafond = (avecPlafond && sol) ? sol : 0;
  if (plafond) bouts.push(`plafond ${r1(plafond)} m²`);
  if (!bouts.length) return null;
  const total = (murs || 0) + plafond;
  return {
    total: r1(total),
    texte: `Métré : ${bouts.join(' · ')} → ${r1(total)} m² développés.`,
  };
}

// ── Actions ────────────────────────────────────────────────

// Enregistre un devis en brouillon. Ne l'envoie jamais au client.
// Délègue à devis-store.js : même écriture locale-d'abord que devis.html, donc
// une proposition validée par l'artisan n'est jamais perdue faute de réseau.
async function creerDevis(p) {
  const lignes = normaliserLignes(p.lignes || p.items || p.lines);
  if (!lignes.length) throw new Error('Aucune ligne à enregistrer.');
  // Une remise dictée à la création passe par LA MEME fonction que
  // modifier_devis : `appliquerRemise`, ligne négative par taux de TVA. Les
  // prix unitaires de l'artisan ne bougent pas, et si elle ne peut pas être
  // posée (prix encore à saisir), le message le dit — jamais un silence.
  const remise = poserRemiseCreation(lignes, p);
  const t = totaux(remise.lignes);
  const client = p.client_nom || p.client || p.clientName || 'Client à préciser';

  // Pas de devis sans adresse (Moctar, 01/09). Le defaut « Adresse a preciser »
  // partait en base et se propageait : le chantier cree depuis ce devis naissait
  // sans lieu, donc sans planning possible et avec un suivi client vide. On refuse
  // plutot que de remplir a la place de l'artisan — l'assistant redemande.
  const adresse = (p.client_adresse || p.adresse || p.clientAddress || '').trim();
  if (!adresse || /^adresse à préciser$/i.test(adresse)) {
    throw new Error(
      `À quelle adresse se fait le chantier de ${client} ? `
      + `Un devis sans adresse ne peut être ni planifié ni suivi — donnez-la-moi et j'enregistre.`
    );
  }

  const res = await storeEnregistrerDevis({
    client,
    address: adresse,
    title: p.titre || p.objet || p.quoteTitle || 'Devis',
    status: 'attente',              // jamais 'envoye' sans geste explicite
    statusLabel: 'Brouillon',
    totHt: t.ht,
    totTva: t.tva,
    totTtc: t.ttc,
    acompte: t.ttc * 0.3,
    lots: lignesVersLots(remise.lignes),
    validiteJours: p.delai_validite_jours || p.validite_jours || 30,
    // La note du métré est écrite par le CODE, en tête, et fait foi : le calcul
    // du modèle passe derrière, ou pas du tout.
    notes: (() => {
      const m = metreDeveloppe(p.metre || p.metré || p.cotes);
      let reste = (p.notes || '').trim();
      if (!m) return reste || null;
      // Le modèle a beau avoir la consigne, il continue d'écrire son propre
      // métré dans la prose — et il le rate (« 56 m² » pour 22,2 × 2,50 = 55,5).
      // Deux métrés contradictoires sur le même devis, c'est pire qu'un seul
      // faux. Puisque le calcul appartient au code, on retire les phrases de la
      // note qui portent une surface ou un linéaire chiffrés. Le reste — la TVA
      // supposée, les prix à compléter — est conservé tel quel : ce ne sont pas
      // des calculs, ce sont des réserves utiles.
      if (reste) {
        const CHIFFREE = /\d[\d\s.,]*\s*(m²|m2|ml)\b/i;
        reste = reste
          .split(/(?<=[.!?])\s+|\n+/)
          .filter((phrase) => phrase.trim() && !CHIFFREE.test(phrase))
          .join(' ')
          .trim();
      }
      return reste ? `${m.texte}\n${reste}` : m.texte;
    })(),
  });
  const suffixe = res.etat === 'synchro'
    ? ''
    : "\n\n⚠ Enregistré sur cet appareil uniquement — la synchronisation reprendra dès le retour du réseau.";
  return {
    message: `Devis ${res.quote.id} enregistré en brouillon pour ${client} — ${euro(t.ttc)} TTC.`
      + remise.message + suffixe,
    lien: res.quote._dbId ? `./devis.html?id=${res.quote._dbId}` : './devis.html',
    data: res.quote,
  };
}

// Pose ou décale un chantier dans le planning.
async function ajouterAuPlanning(p) {
  // (06/09/2026, Moctar : « j'ai demandé un rendez-vous pour mon chantier à
  // Nersac, est-ce qu'il l'a fait ? ») — l'outil avait CRÉÉ un chantier
  // « Mme Dupont » au 8 mars 2027 au lieu de poser une visite. Désormais :
  //   1. un chantier existant seulement (nom OU adresse/ville) ; sinon on
  //      rend la liste et on demande, on ne crée jamais ici (creer_chantier
  //      existe pour ça) ;
  //   2. une visite / rendez-vous / métré / réception = UNE ÉTAPE datée sur
  //      ce chantier, sans toucher à sa date de démarrage ni à son statut ;
  //   3. sinon (démarrage du chantier) : dates de début/fin comme avant.
  const debut = p.date_debut || p.dateDebut || p.date || null;
  let fin = p.date_fin_prevue || p.dateFin || null;
  if (!fin && debut && p.duree_jours) {
    const d = new Date(debut);
    if (!isNaN(d)) { d.setDate(d.getDate() + (parseInt(p.duree_jours, 10) || 1) - 1); fin = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  }
  const texteRecherche = [p.client_nom, p.client, p.clientName].find(Boolean) || '';
  const description = String(p.description || p.objet || p.resume_humain || '').trim();
  let existant = await trouverChantier(texteRecherche);
  if (!existant) {
    // « mon chantier à Nersac » : la ville est souvent dans la description.
    const mots = (norm(description) + ' ' + norm(texteRecherche)).split(/[^a-z0-9]+/).filter((m) => m.length >= 4);
    const chantiers = await listChantiers();
    existant = chantiers.find((c) => mots.some((m) => norm(c.adresse).includes(m) || norm(c.client_name).includes(m))) || null;
  }
  if (!existant) {
    const chantiers = await listChantiers();
    const noms = chantiers.slice(0, 8).map((c) => c.client_name + (c.adresse ? ` (${c.adresse})` : '')).join(' · ');
    throw new Error(`Je ne trouve pas de chantier pour « ${texteRecherche || description || '?'} ». `
      + (noms ? `Vos chantiers : ${noms}. Dites-moi lequel, ` : 'Vous n\'avez pas encore de chantier ; ')
      + `ou demandez « crée un chantier pour … ».`);
  }

  const ponctuel = /visite|rendez|\brdv\b|m[ée]tr[ée]|r[ée]ception|passage|rencontre|relev[ée]/i.test(description + ' ' + (p.resume_humain || ''));
  if (ponctuel) {
    if (!debut) throw new Error('À quelle date faut-il poser ce rendez-vous ?');
    const existantes = await listTachesChantier(existant.id);
    const ordre = existantes.reduce((m, t) => Math.max(m, Number(t.ordre) || 0), 0) + 1;
    const titre = (description || 'Visite de chantier').slice(0, 120);
    const { data, error } = await supabase.from('taches').insert({
      chantier_id: existant.id, titre, ordre, jour: debut, jour_fin: debut,
      duree_h: 2, duree_estimee_h: 2, duree_prevue_h: 2, duree_source: 'rendez_vous',
      assigne_a: p.assigne_a && !/^moi$/i.test(p.assigne_a) ? p.assigne_a : null,
      statut: 'a_faire',
    }).select().single();
    if (error) throw error;
    return { message: `Rendez-vous posé : « ${titre} » chez ${existant.client_name} le ${debut}. Le chantier lui-même n'est pas modifié.`, lien: `./chantier.html?id=${encodeURIComponent(existant.id)}`, data };
  }

// (12/09, Moctar : « façade ravalement "en cours" alors qu'il démarre le 23 oct »)
// La DATE prime sur le statut saisi : un chantier qui démarre après aujourd'hui
// est « à venir » (`en_attente` en base), pas « en cours ».
function statutSelonDebut(debut) {
  const auj = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  return debut && String(debut).slice(0, 10) > auj ? 'en_attente' : 'en_cours';
}
  const { data, error } = await supabase
    .from('chantiers')
    .update({ date_debut: debut, date_fin_prevue: fin, status: statutSelonDebut(debut) })
    .eq('id', existant.id)
    .select()
    .single();
  if (error) throw error;
  return { message: `Chantier « ${data.client_name} » calé au ${debut || 'à préciser'}.`,
           lien: debut ? `./planning.html?vue=jour&date=${encodeURIComponent(String(debut).slice(0, 10))}` : './planning.html', data };
}

async function detecterRelance(chantier, objetDemande) {
  const objet = (objetDemande || 'auto').toLowerCase();
  const devisEnAttente = objet !== 'facture'
    ? (await chargerDevis({ statut: 'envoye', client_nom: chantier.client_name }))[0] || null
    : null;
  let factureEnAttente = null;
  if (objet !== 'devis') {
    const { data, error } = await supabase.from('factures')
      .select('id, numero, total_ttc, statut, chantier_id')
      .eq('chantier_id', chantier.id)
      .eq('statut', 'envoyee')
      .order('date_emission', { ascending: true })
      .limit(1);
    if (error) throw error;
    factureEnAttente = (data || [])[0] || null;
  }
  const morceaux = [];
  if (devisEnAttente) {
    morceaux.push(`votre devis n° ${devisEnAttente.numero} (${euro(devisEnAttente.total_ttc)} TTC) est toujours en attente de votre accord`);
  }
  if (factureEnAttente) {
    morceaux.push(`votre facture n° ${factureEnAttente.numero} (${euro(factureEnAttente.total_ttc)} TTC) reste à régler`);
  }
  const lien = chantier.public_token ? lienSuivi(chantier.public_token) : '';
  const texte = morceaux.length
    ? `Bonjour ${chantier.client_name}, un petit rappel : ${morceaux.join(' et ')}.`
      + (lien ? ` Vous pouvez tout consulter ici : ${lien}` : '')
    : '';
  return { devisEnAttente, factureEnAttente, texte, lien };
}

// Rédige une relance et la dépose dans le fil du chantier, EN BROUILLON :
// jamais visible du client, jamais envoyée. Conservée pour compatibilité —
// avec un texte fourni par l'artisan (sujet/message), il part tel quel comme
// avant ; sans texte, elle utilise la même détection que relancer_client.
async function preparerRelance(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.clientName);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.client || p.clientName || '?'} ».`);
  let texte = [p.sujet, p.message || p.texte || p.contenu].filter(Boolean).join(' — ');
  if (!texte) {
    ({ texte } = await detecterRelance(chantier, p.objet));
  }
  if (!texte) {
    throw new Error(`Rien en attente chez ${chantier.client_name} (pas de devis envoyé non signé, pas de facture émise impayée) et aucun texte de relance proposé.`);
  }
  // (06/09, Moctar : « ici il devrait écrire un message au client, au lieu
  // de l'amener dans Chantier ») : rien n'est déposé dans le fil. Le texte
  // s'affiche dans la conversation, avec « Envoyer au client » ; l'artisan
  // relit, et c'est LUI qui envoie (envoyerAuClient ci-dessous).
  return {
    message: `Message pour ${chantier.client_name} :\n« ${texte} »\n\nRelisez, puis envoyez-le au client — ou ouvrez le fil pour le modifier.`,
    lien: `./chantier.html?id=${chantier.id}#messages`,
    libelle_lien: 'Modifier dans le fil',
    geste: { envoyer_client: { chantier_id: chantier.id, client_name: chantier.client_name, texte } },
    data: { chantier_id: chantier.id, texte },
  };
}

// « Dis à Mme Dupont que j'arrive à 9 h » (Moctar, 12/09 13h35 : « les messages
// envoyés par l'assistant n'apparaissent pas au client ») — jusqu'ici le seul
// outil « message » était celui de l'ÉQUIPE (visible_client=false) : le client
// ne voyait rien. Ici : fil du chantier côté client (+ e-mail avec le lien de
// suivi par le trigger), puis on propose de prévenir l'équipe.
async function envoyerMessageClient(p) {
  const texte = String(p.message || p.texte || '').trim();
  if (!texte) throw new Error('Aucun message à envoyer.');
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.client || '?'} ».`);
  const msg = await sendMessage(chantier.id, texte);
  // (12/09, Moctar : « il faut toujours que l'artisan renseigne l'e-mail du client »)
  // Sans e-mail, le client n'a jamais reçu de lien : il ne verra PAS ce message.
  // On le dit tel quel, et on propose d'ajouter l'adresse tout de suite.
  const sansEmail = !chantier.client_email;
  const contact = sansEmail
    ? `⚠️ ${chantier.client_name} n'a pas d'e-mail enregistré : il ne verra pas ce message tant que vous ne l'ajoutez pas`
    : 'e-mail envoyé avec le lien de suivi';
  const suites = sansEmail
    ? [{ libelle: `Ajouter l'e-mail de ${chantier.client_name}`, question: `Enregistre l'e-mail du client ${chantier.client_name} (je te le dicte)` }]
    : [{ libelle: "Prévenir l'équipe du même sujet", question: `Envoie à l'équipe du chantier ${chantier.client_name} : ${texte.slice(0, 140)}` }];
  return {
    message: `Message envoyé à ${chantier.client_name} :\n« ${texte} »\n\n${contact}.`,
    lien: `./chantier.html?id=${chantier.id}#messages`,
    libelle_lien: 'Voir le fil',
    geste: { suites },
    data: msg,
  };
}

// Envoi effectif au client, sur le geste explicite de l'artisan (bouton de la
// carte) : même chemin que le composeur de la fiche chantier (sendMessage :
// fil client + notification), donc même résultat.
export async function envoyerAuClient({ chantier_id, texte }) {
  const t = String(texte || '').trim();
  if (!chantier_id || !t) throw new Error('Rien à envoyer.');
  const msg = await sendMessage(chantier_id, t);
  return { message: 'Message envoyé au client.', data: msg };
}

// Relance RÉELLE : détecte ce qui est en attente, compose le texte, et
// l'envoie sur le ou les canaux demandés. canal : 'message' (fil du chantier,
// visible du client), 'email', ou 'les_deux' (défaut). L'email d'un devis
// passe par l'Edge Function envoyer-devis-client (même chemin que le bouton
// d'envoi de devis.html) ; il n'existe AUCUNE Edge Function d'email pour une
// facture aujourd'hui — on le dit plutôt que de faire semblant.
async function relancerClient(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.clientName);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.client || p.clientName || '?'} ».`);

  const detection = await detecterRelance(chantier, p.objet);
  const { devisEnAttente, factureEnAttente } = detection;
  // Texte retouché par l'artisan dans la carte (apercuMessage) : il prime.
  const texte = String(p.message || '').trim() || detection.texte;
  if (!texte) {
    return {
      message: `Rien en attente chez ${chantier.client_name} : pas de devis envoyé non signé, pas de facture émise impayée.`,
      lien: `./chantier.html?id=${chantier.id}`,
    };
  }

  // Le contact AVANT le canal (Moctar, 05/09 : « il faut rappeler de prendre
  // les adresses e-mail » ; « je crois que le workflow n'est pas bon »).
  // Une relance déposée sur la page de suivi ne prévient personne : sans
  // e-mail ni téléphone, on ne relance pas dans le vide, on demande.
  const email = (chantier.client_email || '').trim() || null;
  const tel = telAppelable(chantier.client_phone);
  if (!email && !tel) {
    throw new Error(`Pas d'e-mail ni de téléphone pour ${chantier.client_name} : dites-moi son e-mail ou son numéro (« l'e-mail de ${chantier.client_name} est … ») et je relance.`);
  }

  let canal = (p.canal || 'auto').toLowerCase();
  if (canal === 'les_deux') canal = 'auto';
  if (canal === 'auto') canal = email ? (tel ? 'email_whatsapp' : 'email') : 'whatsapp';
  if (canal === 'email' && !email) canal = tel ? 'whatsapp' : canal;
  if (canal === 'whatsapp' && !tel) canal = email ? 'email' : canal;

  const resultats = [];
  let lienCarte = `./chantier.html?id=${chantier.id}`;

  // 1) Trace sur la page de suivi : le client la lit quand il ouvre son lien.
  if (chantier.public_token) {
    try { await sendMessage(chantier.id, texte); resultats.push('rappel écrit sur sa page de suivi'); } catch (_) { /* non bloquant */ }
  }

  // 2) E-mail de RAPPEL (objet « Rappel : votre devis n° … »), pas le devis renvoyé.
  if ((canal === 'email' || canal === 'email_whatsapp') && email) {
    if (devisEnAttente) {
      try {
        const { data, error } = await supabase.functions.invoke('envoyer-devis-client', {
          body: { devis_id: devisEnAttente.id, rappel: true },
        });
        if (error || !data?.ok) throw new Error(data?.error || error?.message || 'envoi_refuse');
        resultats.push(`e-mail de rappel envoyé à ${data.envoye_a}`);
      } catch (e) {
        resultats.push(`e-mail de rappel NON envoyé (${(e && e.message) || 'erreur'})`);
      }
    }
    if (factureEnAttente) {
      try {
        const res = await envoyerFactureParEmail(factureEnAttente.id);
        resultats.push(`e-mail de la facture envoyé à ${res.envoye_a}`);
      } catch (e) {
        resultats.push(`e-mail de facture NON envoyé (${(e && e.message) || 'erreur'})`);
      }
    }
  }

  // 3) WhatsApp : message + lien déjà écrits, vers le numéro du client. Le
  //    lien ouvre l'application (Android et iPhone) ; c'est l'artisan qui
  //    appuie sur Envoyer, on ne peut pas le faire à sa place.
  if ((canal === 'whatsapp' || canal === 'email_whatsapp') && tel) {
    lienCarte = `https://wa.me/${tel.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(texte)}`;
    resultats.push('WhatsApp prêt : ouvrez le lien, le message est écrit, appuyez sur Envoyer');
  }

  return {
    message: `Relance de ${chantier.client_name} : ${resultats.join(' · ')}.`,
    lien: lienCarte,
    libelle_lien: lienCarte.startsWith('https://wa.me/') ? 'Ouvrir WhatsApp →' : undefined,
    data: { devis: devisEnAttente, facture: factureEnAttente, canal, email, tel },
  };
}

// Lecture seule : retrouve un chantier.
async function chercherChantier(p) {
  const c = await trouverChantier(p.terme_recherche || p.recherche || p.client || p.query);
  if (!c) throw new Error(`Aucun chantier trouvé pour « ${p.terme_recherche || p.recherche || p.client || '?'} ».`);
  return {
    message: `${c.client_name}${c.adresse ? ' — ' + c.adresse : ''} · statut ${c.status}.`,
    lien: `./chantier.html?id=${c.id}`,
    data: c,
  };
}

// ── Lectures : les mêmes réponses que les écrans, mais demandables à l'assistant ──

const STATUT_LABEL = {
  brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté',
  refuse: 'Refusé', expire: 'Expiré',
};

// Charge les devis de l'artisan avec le nom du client (via le chantier lié).
async function chargerDevis({ statut, client_nom } = {}) {
  // devis_visible et non devis : les colonnes d'argent ne sont plus lisibles sur
  // la table (privilège de colonne retiré le 23/08). La vue applique le masquage
  // par rôle — elle ne cache rien au patron.
  let req = supabase
    .from('devis_visible')
    .select('*, chantiers(client_name, adresse, id)')
    .order('created_at', { ascending: false });
  if (statut) req = req.eq('status', statut);
  const { data, error } = await req;
  if (error) throw error;
  const q = norm(client_nom);
  return q
    ? data.filter((d) => norm(d.chantiers && d.chantiers.client_name).includes(q))
    : data;
}

function refDevis(devis, ref, client) {
  const r = norm(ref);
  if (r) {
    const parRef = devis.find((d) => norm(d.numero) === r || norm(d.numero).includes(r));
    if (parRef) return parRef;
  }
  const c = norm(client);
  if (c) return devis.find((d) => norm(d.chantiers && d.chantiers.client_name).includes(c)) || null;
  return null;
}

// Retrouve un devis par numéro OU par nom de client — même recherche que
// creerFacture / envoyerFactureEmailAction (chargerDevis + refDevis), pour
// que « ouvre le devis de Mme Ravier » retombe sur le même devis qu'un
// « envoie la facture de Mme Ravier ».
async function trouverDevis(recherche) {
  const q = String(recherche || '').trim();
  if (!q) return null;
  const devis = await chargerDevis({});
  return refDevis(devis, q, q);
}

async function listerDevis(p) {
  const devis = await chargerDevis(p);
  if (!devis.length) return { message: "Aucun devis ne correspond pour l'instant.", lien: './devis.html' };
  const lignes = devis.slice(0, 8).map((d) =>
    `${d.numero} · ${(d.chantiers && d.chantiers.client_name) || 'Client'} · ${euro(d.total_ttc)} TTC · ${STATUT_LABEL[d.status] || d.status}`
  );
  const total = devis.reduce((s, d) => s + Number(d.total_ttc || 0), 0);
  const reste = devis.length > 8 ? `\n… et ${devis.length - 8} autre(s).` : '';
  return {
    message: `${devis.length} devis · ${euro(total)} TTC au total :\n` + lignes.join('\n') + reste,
    lien: './devis.html',
    data: devis,
  };
}

// Planifie le chantier rattaché à un devis existant.
// ── Factures ───────────────────────────────────────────────
//
// Trois moments dans un chantier : l acompte a la commande, les situations en cours,
// le solde a la fin. Le solde se calcule sur ce qui RESTE — sinon il refacturerait
// l acompte, et le client paierait deux fois.
async function creerFacture(p) {
  const devis = await chargerDevis({});
  // `chantier_id` (04/09/2026) : selecteur precis pour les ecrans qui
  // connaissent deja le chantier (bouton « Nouvelle facture » de
  // finances.html) — on prend le devis ACCEPTE de ce chantier plutot que de
  // laisser retomber sur le tout dernier devis cree tous chantiers confondus.
  const d = (p.chantier_id && devis.find((x) => x.chantier_id === p.chantier_id && x.status === 'accepte'))
    || refDevis(devis, p.devis_ref, p.client_nom) || devis[0];
  if (!d) throw new Error(`Devis introuvable pour « ${p.devis_ref || p.client_nom || '?'} ».`);
  if (!d.chantier_id) throw new Error(`Le devis ${d.numero} n'est rattaché à aucun chantier.`);

  const type = (p.type || 'situation').toLowerCase();
  if (!['acompte', 'situation', 'solde'].includes(type)) {
    throw new Error("Type de facture inconnu : acompte, situation ou solde.");
  }

  const ttcDevis = Number(d.total_ttc) || 0;
  if (!(ttcDevis > 0)) throw new Error(`Le devis ${d.numero} n'a pas de montant.`);

  const { data: dejaData, error: eDeja } = await supabase.rpc('deja_facture', { p_chantier: d.chantier_id });
  if (eDeja) throw eDeja;
  const deja = Number(dejaData) || 0;
  const reste = Math.round((ttcDevis - deja) * 100) / 100;

  let ttc;
  if (type === 'solde') {
    if (reste <= 0) throw new Error(`Tout est déjà facturé sur ce chantier (${euro(deja)} sur ${euro(ttcDevis)}).`);
    ttc = reste;
  } else {
    const pct = Number(p.pourcentage ?? (type === 'acompte' ? 30 : 0));
    if (!(pct > 0 && pct <= 100)) throw new Error("Indiquez le pourcentage à facturer.");
    ttc = Math.round(ttcDevis * (pct / 100) * 100) / 100;
    if (ttc > reste) {
      throw new Error(`Ce montant dépasserait le devis : ${euro(ttc)} demandés, ${euro(reste)} restants.`);
    }
  }

  // ⚠️ AUTOLIQUIDATION EN SOUS-TRAITANCE (ajoute le 02/09/2026).
  //
  // Quand l'artisan execute des travaux immobiliers EN SOUS-TRAITANCE pour un
  // preneur assujetti, la TVA est due par le PRENEUR : le sous-traitant facture
  // HT, sans TVA, et porte la mention « Autoliquidation »
  // (art. 283, 2 nonies du CGI ; mention obligatoire art. 242 nonies A de
  // l'annexe II). S'applique a tous les rangs de sous-traitance, pour les
  // contrats conclus depuis le 01/01/2014.
  //
  // Jusqu'ici la TVA etait appliquee dans TOUS les cas. Une TVA facturee a tort
  // RESTE DUE au Tresor et n'est pas deductible par le donneur d'ordre : soit il
  // refuse de payer la facture, soit l'artisan la paie deux fois. Sur 20 000 EUR
  // HT, 4 000 EUR.
  const { data: ch } = await supabase.from('chantiers')
    .select('sous_traitance').eq('id', d.chantier_id).maybeSingle();
  const autoliquidation = ch?.sous_traitance === true;

  // La TVA suit celle du devis, pas un taux redecide ici.
  const tauxTva = autoliquidation
    ? 0
    : (ttcDevis && d.total_ht ? (Number(d.total_tva) / Number(d.total_ht)) : 0.10);
  const ht = Math.round((ttc / (1 + tauxTva)) * 100) / 100;
  const tva = Math.round((ttc - ht) * 100) / 100;

  const { data: session } = await supabase.auth.getSession();
  const { data: proId, error: eEnt } = await supabase.rpc('mon_entreprise');
  if (eEnt) throw eEnt;

  const { data: numero, error: eNum } = await supabase.rpc('prochain_numero_facture', { p_pro: proId });
  if (eNum) throw eNum;

  const libelle = type === 'acompte' ? `Acompte sur devis ${d.numero}`
    : type === 'solde' ? `Solde sur devis ${d.numero}`
    : `Situation de travaux — devis ${d.numero}`;

  const echeance = new Date();
  echeance.setDate(echeance.getDate() + (Number(p.delai_jours) || 30));

  const { data, error } = await supabase.from('factures').insert({
    pro_id: proId,
    chantier_id: d.chantier_id,
    devis_id: d.id,
    numero,
    type,
    objet: p.objet || libelle,
    // `vatRate` sur la ligne : les lignes de facture n'en portaient AUCUN, alors
    // que toutes les lignes de devis en ont un. L'art. 242 nonies A impose la
    // ventilation par taux — une facture sans taux par ligne n'est pas ventilee.
    lines: [{ description: libelle, quantity: 1, unit: 'forfait', unitPrice: ht,
              total_ht: ht, vatRate: Math.round(tauxTva * 1000) / 10 }],
    total_ht: ht, total_tva: tva, total_ttc: ttc,
    date_echeance: new Date(echeance.getTime() - echeance.getTimezoneOffset() * 60000).toISOString().slice(0, 10),
    statut: 'brouillon',      // jamais envoyee sans un geste explicite
    // La mention d'autoliquidation est OBLIGATOIRE sur la facture, pas
    // seulement implicite dans un total de TVA a zero.
    notes: autoliquidation
      ? ['Autoliquidation de la TVA — art. 283, 2 nonies du CGI. '
         + 'TVA due par le preneur assujetti.', p.notes].filter(Boolean).join('\n')
      : (p.notes || null),
  }).select().single();
  if (error) throw error;

  const restant = Math.round((ttcDevis - deja - ttc) * 100) / 100;
  return {
    message: `Facture ${numero} créée — ${euro(ttc)} ${autoliquidation ? 'HT' : 'TTC'} (${libelle}).\n`
      + (autoliquidation
          ? `⚠️ Sous-traitance : facturée SANS TVA, mention « Autoliquidation » ajoutée. `
            + `C'est le donneur d'ordre qui déclare la TVA.\n`
          : '')
      + `Facturé sur ce chantier : ${euro(deja + ttc)} sur ${euro(ttcDevis)}`
      + (restant > 0 ? ` — reste ${euro(restant)}.` : ' — chantier soldé.')
      + `\nElle est en brouillon : relisez-la avant de l'envoyer.`,
    lien: `./facture-document.html?id=${data.id}`,
    data,
  };
}

// Étape 1 sur 2 : PROPOSER un planning, sans rien écrire.
// L'artisan relit et corrige les durées avant que quoi que ce soit parte en base —
// la date de fin finit chez son client, elle ne doit pas être posée dans son dos.
async function proposerPlanningDevis(p) {
  const moteur = await import('./app-planning-engine.js');
  const devis = await chargerDevis({});
  const d = refDevis(devis, p.devis_ref, p.client_nom);
  if (!d) throw new Error(`Devis introuvable pour « ${p.devis_ref || p.client_nom || '?'} ».`);
  if (!d.chantier_id) throw new Error(`Le devis ${d.numero} n'est rattaché à aucun chantier.`);

  const lignes = d.lines || [];
  if (!lignes.length) throw new Error(`Le devis ${d.numero} ne comporte aucune ligne : rien à planifier.`);

  const debut = p.date_debut || d.chantiers?.date_debut || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  // Les durées ne sont PAS déduites du prix, sauf demande explicite de l'artisan
  // (estimer_durees). La plupart chiffrent au métré ou au forfait : diviser un
  // montant par un taux horaire inverserait un calcul qui n'a jamais eu lieu.
  const taches = moteur.tachesDepuisLignes(lignes, {
    estimerDepuisPrix: p.estimer_durees === true,
    tauxHoraire: p.taux_horaire,
  });
  const planifiees = moteur.ordonnancer(taches, debut);
  const fin = planifiees.length ? planifiees[planifiees.length - 1].jour : null;

  return {
    message: `${planifiees.length} tâches proposées pour « ${d.chantiers?.client_name || 'ce chantier'} », `
      + `du ${debut} au ${fin}. Durées estimées d'après les montants du devis — relisez-les avant d'enregistrer.`,
    lien: './planning.html',
    data: { chantier_id: d.chantier_id, devis_numero: d.numero, date_debut: debut, date_fin_prevue: fin, taches: planifiees },
  };
}

// Étape 2 sur 2 : ENREGISTRER le planning validé.
// Écrit les dates sur le chantier ET les tâches — c'est le manque qui faisait que
// « mettre un chantier au planning » ne montrait rien : la vue journée ne lit que
// la table `taches`, que personne ne remplissait.
async function planifierDepuisDevis(p) {
  const moteur = await import('./app-planning-engine.js');
  const devis = await chargerDevis({});
  const d = refDevis(devis, p.devis_ref, p.client_nom);
  if (!d) throw new Error(`Devis introuvable pour « ${p.devis_ref || p.client_nom || '?'} ».`);
  if (!d.chantier_id) throw new Error(`Le devis ${d.numero} n'est rattaché à aucun chantier.`);

  const debut = p.date_debut || null;
  // Sans date (Moctar, 05/09 : « si la date n'a pas été fixée, mettre juste
  // le déroulement, et ajouter au calendrier quand une date de début a été
  // fixée ») : on prépare les étapes dans l'ordre, sans jour ; elles
  // apparaissent dans le déroulement du chantier, pas au planning.
  const sansDates = p.sans_dates === true || !debut;
  if (!debut && p.sans_dates !== true && p.date_debut !== undefined) {
    throw new Error("Indiquez une date de démarrage, ou demandez les étapes sans dates.");
  }

  // ⚠️ JAMAIS DANS LE PASSE (08/09). L'assistant a repris la date_debut
  // HISTORIQUE d'un chantier (20 aout) au lieu du jour ou l'artisan planifie :
  // les cinq etapes sont nees datees d'aout, la date_fin_prevue du chantier a
  // RECULE au 27 aout, et l'artisan n'a rien vu apparaitre — ses etapes
  // etaient toutes derriere « aujourd'hui ». Rien ne l'avait signale.
  // On planifie a partir d'aujourd'hui, on ne remonte pas le temps.
  if (debut) {
    const auj = new Date(); auj.setHours(0, 0, 0, 0);
    const d0 = new Date(String(debut).slice(0, 10) + 'T00:00:00');
    if (!Number.isNaN(d0.getTime()) && d0 < auj) {
      const jours = Math.round((auj - d0) / 86400000);
      throw new Error(
        `Le ${d0.toLocaleDateString('fr-FR')} est passé (il y a ${jours} j). `
        + `Les étapes seraient créées derrière vous et n'apparaîtraient nulle part. `
        + `Donnez-moi une date à partir d'aujourd'hui, ou demandez les étapes sans dates.`);
    }
  }

  // Les tâches validées par l'artisan si elles arrivent, sinon celles déduites du devis.
  const brutes = Array.isArray(p.taches) && p.taches.length
    ? p.taches
    : moteur.tachesDepuisLignes(d.lines || [], { estimerDepuisPrix: p.estimer_durees === true, tauxHoraire: p.taux_horaire });
  let planifiees = sansDates
    ? brutes.map((t, i) => ({ ...t, ordre: i + 1, jour: null, jour_fin: null }))
    : moteur.ordonnancer(brutes, debut);

  // (06/09, Moctar : « ça ne crée pas les étapes ») — avant, une seule étape
  // sans durée faisait tout refuser, et l'artisan repartait sans rien. Une
  // étape sans durée est calée à UNE JOURNÉE par défaut, marquée comme
  // telle, et le message le dit : il ajuste ensuite dans le déroulement.
  const sansDuree = sansDates ? 0 : planifiees.filter((t) => t.duree_h == null).length;
  if (sansDuree) {
    const heuresJour = (typeof moteur.HEURES_JOUR_DEFAUT === 'number' && moteur.HEURES_JOUR_DEFAUT > 0) ? moteur.HEURES_JOUR_DEFAUT : 8;
    const completees = brutes.map((t) => (t.duree_h == null
      ? { ...t, duree_h: heuresJour, duree_estimee_h: t.duree_estimee_h != null ? t.duree_estimee_h : heuresJour, duree_source: 'defaut_1_jour' }
      : t));
    planifiees = moteur.ordonnancer(completees, debut);
  }
  const noteDuree = sansDuree
    ? ` ${sansDuree} étape${sansDuree > 1 ? 's' : ''} sans durée connue ${sansDuree > 1 ? 'ont été calées' : 'a été calée'} sur une journée : ajustez-la${sansDuree > 1 ? ' ' : ''} dans le déroulement si besoin.`
    : '';

  const fin = planifiees.length ? planifiees[planifiees.length - 1].jour : null;

  let data;
  if (sansDates) {
    const r = await supabase.from('chantiers').select().eq('id', d.chantier_id).single();
    if (r.error) throw r.error;
    data = r.data;
  } else {
    const r = await supabase
      .from('chantiers')
      .update({ date_debut: debut, date_fin_prevue: fin, status: statutSelonDebut(debut) })
      .eq('id', d.chantier_id)
      .select()
      .single();
    if (r.error) throw r.error;
    data = r.data;
  }

  if (planifiees.length) {
    // Replanifier remplace : sinon un second passage empilerait les tâches en double.
    const { error: eDel } = await supabase.from('taches').delete().eq('chantier_id', d.chantier_id);
    if (eDel) throw eDel;
    const { error: eIns } = await supabase.from('taches').insert(planifiees.map((t) => ({
      chantier_id: d.chantier_id,
      titre: t.titre,
      description: t.description || null,
      ordre: t.ordre,
      jour: t.jour,
      jour_fin: t.jour_fin || t.jour,
      // Trois durees, trois sens differents :
      //   duree_estimee_h = ce que l'app a propose  (fige)
      //   duree_h         = ce que l'artisan a retenu pour le planning
      //   duree_reelle_h  = ce qu'il aura constate, valide par lui a la fin
      // C'est l'ecart entre les trois qui fera l'etude, le jour ou il y aura
      // assez de donnees. On repertorie ; on ne conclut pas.
      duree_h: dureeSure(t.duree_h),
      duree_estimee_h: dureeSure(t.duree_estimee_h, dureeSure(t.duree_h)),
      duree_prevue_h: dureeSure(t.duree_estimee_h, dureeSure(t.duree_h)),
      duree_source: t.duree_source || null,
      delai_apres_h: t.delai_apres_h || 0,
      mobilise_artisan: t.mobilise_artisan !== false,
      assigne_a: t.assigne_a || null,
    })));
    if (eIns) throw eIns;
    // Le groupe du chantier voit arriver le planning (pont déroulement → fil).
    // Dates en toutes lettres (Moctar, 09/09 : « Planning posé : 5 étapes du
    // 2026-08-20 au 2026-08-27 » ne se lit pas sur un chantier).
    const lisible = (iso) => { try { return new Date(String(iso).slice(0, 10) + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch (_) { return String(iso); } };
    annoncerFilEquipe(d.chantier_id, sansDates
      ? `📋 ${planifiees.length} étape${planifiees.length > 1 ? 's' : ''} préparée${planifiees.length > 1 ? 's' : ''} depuis le devis, sans dates`
      : `📋 Planning posé : ${planifiees.length} étape${planifiees.length > 1 ? 's' : ''} du ${lisible(debut)}${fin ? ' au ' + lisible(fin) : ''}\nVoir le déroulement : https://batispot.pro/app/chantier.html?id=${d.chantier_id}&onglet=deroulement`);
  }

  if (sansDates) {
    return {
      message: (`${planifiees.length} étape${planifiees.length > 1 ? 's' : ''} préparée${planifiees.length > 1 ? 's' : ''} pour ${data.client_name} depuis le devis ${d.numero}, sans dates : elles sont dans le déroulement du chantier. Dites-moi la date de début et je les cale au planning.`) + noteDuree,
      lien: `./chantier.html?id=${d.chantier_id}&onglet=deroulement`,
      data: { ...data, taches: planifiees.length, sans_dates: true },
    };
  }

  // « 2026-09-08 » ne se lit pas ; « lundi 8 septembre » se lit. Les dates
  // sortaient en ISO, et le message ne disait pas ce qui se passe EN PREMIER
  // (Moctar, 08/09 : « on devrait avoir une notification qui montre la
  // creation de ce planning dans le calendrier »).
  const enClair = (iso) => {
    if (!iso) return '';
    try {
      return new Date(String(iso).slice(0, 10) + 'T12:00:00')
        .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (_) { return String(iso); }
  };
  const premiere = planifiees.find((t) => t.jour) || null;

  return {
    message: `✅ ${planifiees.length} étape${planifiees.length > 1 ? 's' : ''} au planning pour « ${data.client_name} » (devis ${d.numero}).\n\n`
      + `📅 Du ${enClair(debut)}${fin ? ` au ${enClair(fin)}` : ''}.\n`
      + (premiere ? `▶️ On commence par « ${premiere.titre} » le ${enClair(premiere.jour)}.` : ''),
    // (Moctar, 12/09 : « il doit ouvrir LE planning en question ») — le jour du
    // début, en vue jour, pas la page planning générique.
    lien: debut ? `./planning.html?vue=jour&date=${encodeURIComponent(String(debut).slice(0, 10))}` : './planning.html',
    libelle_lien: debut ? `Voir le planning du ${enClair(debut)} →` : undefined,
    data: { ...data, taches: planifiees.length },
  };
}

// Déduit les fournitures des lignes du devis (hors main-d'œuvre et forfaits de service).
async function listerFournitures(p) {
  const devis = await chargerDevis({});
  const d = refDevis(devis, p.devis_ref, p.client_nom) || devis[0];
  if (!d) throw new Error("Aucun devis disponible pour établir une liste de fournitures.");
  const HORS = /main.?d.?oeuvre|main.?d.?œuvre|nettoyage|repli|protection|dépose|depose|évacuation|evacuation|forfait de/i;
  const lignes = (d.lines || []).filter((l) => !HORS.test(l.description || ''));
  if (!lignes.length) throw new Error(`Le devis ${d.numero} ne comporte pas de ligne de fourniture identifiable.`);
  const detail = lignes.map((l) => `${l.description} — ${l.quantity} ${l.unit}`);
  return {
    message: `Fournitures à approvisionner pour ${d.numero} (${(d.chantiers && d.chantiers.client_name) || 'client'}) :\n`
      + detail.join('\n')
      + "\nLes quantités sortent du devis ; ajoutez vos chutes et pertes habituelles.",
    lien: './devis.html',
    data: lignes,
  };
}

// Détail d'un poste financier, calculé sur les devis réels (jamais inventé).
async function detailFinances(p) {
  const periode = (p.periode || 'annee').toLowerCase();
  const depuis = new Date();
  if (periode === 'mois') depuis.setMonth(depuis.getMonth() - 1);
  else if (periode === 'trimestre') depuis.setMonth(depuis.getMonth() - 3);
  else depuis.setFullYear(depuis.getFullYear() - 1);

  const devis = (await chargerDevis({})).filter((d) => new Date(d.created_at) >= depuis);
  if (!devis.length) {
    return { message: `Aucun devis sur la période (${periode}). Les montants s'afficheront dès vos premiers devis.`, lien: './finances.html' };
  }
  const somme = (arr, k) => arr.reduce((s, d) => s + Number(d[k] || 0), 0);
  const acceptes = devis.filter((d) => d.status === 'accepte');
  const attente = devis.filter((d) => d.status === 'envoye');
  const poste = (p.poste || 'tous').toLowerCase();

  const blocs = {
    chiffre_affaires: `Chiffre d'affaires signé (devis acceptés) : ${euro(somme(acceptes, 'total_ht'))} HT · ${euro(somme(acceptes, 'total_ttc'))} TTC sur ${acceptes.length} devis.`,
    en_attente: `En attente de réponse client : ${euro(somme(attente, 'total_ttc'))} TTC sur ${attente.length} devis.`,
    tva: `TVA collectée sur les devis acceptés : ${euro(somme(acceptes, 'total_tva'))}.`,
    acomptes: `Acomptes théoriques (30 % des devis acceptés) : ${euro(somme(acceptes, 'total_ttc') * 0.3)}.`,
    encaisse: `Encaissements : non suivis pour l'instant dans l'application — seuls les devis sont comptabilisés.`,
  };
  // Dossiers comptables déjà exportés/envoyés (12/09, Moctar : « il doit
  // pouvoir se rappeler des documents déjà envoyés »).
  let exportsTxt = '';
  let exportsData = [];
  try {
    const { data: ex } = await supabase.from('exports_comptables')
      .select('created_at, debut, fin, destination, email, nb_factures, nb_depenses')
      .order('created_at', { ascending: false }).limit(3);
    exportsData = ex || [];
    if (exportsData.length) {
      exportsTxt = '\nDossiers comptables : ' + exportsData.map((e) =>
        `${e.destination === 'comptable' ? `envoyé le ${dateFr(e.created_at)} à ${e.email || 'votre comptable'}` : `téléchargé le ${dateFr(e.created_at)}`} (${libellePeriode(e.debut, e.fin)}, ${e.nb_factures || 0} facture(s), ${e.nb_depenses || 0} dépense(s))`).join(' ; ') + '.';
    } else {
      exportsTxt = '\nDossiers comptables : aucun export envoyé pour l\'instant.';
    }
  } catch (_) { /* table absente ou vide : rien à dire */ }
  const message = poste in blocs
    ? blocs[poste]
    : `Sur ${periode === 'mois' ? 'le dernier mois' : periode === 'trimestre' ? 'le dernier trimestre' : 'les 12 derniers mois'} (${devis.length} devis) :\n`
      + [blocs.chiffre_affaires, blocs.en_attente, blocs.tva].join('\n') + exportsTxt;
  return { message, lien: './finances.html', data: { devis: devis.length, acceptes: acceptes.length, exports: exportsData } };
}

// ── Planning détaillé : tâches, séchage, charge, trajets ───

// Crée les tâches d'un chantier en les ordonnançant : chaque délai de séchage
// décale la suite, et les creux restent réutilisables pour un autre chantier.
async function planifierTaches(p) {
  const moteur = await import('./app-planning-engine.js');
  const chantier = await trouverChantier(p.client_nom || p.client || p.clientName);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.client || '?'} ».`);

  const brutes = p.taches || p.tasks || [];
  if (!brutes.length) throw new Error('Aucune tâche à planifier.');

  const preparees = brutes.map((t, i) => ({
    chantier_id: chantier.id,
    titre: t.titre || t.title || `Tâche ${i + 1}`,
    description: t.description || null,
    ordre: t.ordre != null ? t.ordre : i + 1,
    duree_h: Number(t.duree_h || t.dureeH || t.duration_h || 2),
    // Si le délai n'est pas donné, on le déduit du libellé (séchage peinture,
    // prise d'enduit…) plutôt que d'enchaîner deux couches le même jour.
    delai_apres_h: t.delai_apres_h != null
      ? Number(t.delai_apres_h)
      : moteur.delaiSuggere(t.titre || t.title),
    mobilise_artisan: t.mobilise_artisan !== false,
    assigne_a: t.assigne_a || t.assignedTo || null,
  }));

  const debut = p.date_debut || chantier.date_debut || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const planifiees = moteur.ordonnancer(preparees, debut);

  const { data, error } = await supabase
    .from('taches')
    .insert(planifiees.map((t) => ({
      chantier_id: t.chantier_id, titre: t.titre, description: t.description,
      ordre: t.ordre, jour: t.jour, duree_h: dureeSure(t.duree_h),
      delai_apres_h: t.delai_apres_h, mobilise_artisan: t.mobilise_artisan,
      assigne_a: t.assigne_a,
    })))
    .select();
  if (error) throw error;

  // Le chantier prend les dates réelles issues de l'ordonnancement.
  const jours = planifiees.map((t) => t.jour).sort();
  await supabase.from('chantiers')
    .update({ date_debut: jours[0], date_fin_prevue: jours[jours.length - 1], status: statutSelonDebut(jours[0]) })
    .eq('id', chantier.id);

  const creux = moteur.creneauxLibres(planifiees);
  const detail = planifiees.map((t) =>
    `${t.jour} · ${t.debut_h}h-${t.fin_h}h · ${t.titre}` + (t.delai_apres_h ? ` (puis ${t.delai_apres_h} h de séchage)` : '')
  ).join('\n');
  const dispo = creux.length
    ? `\n\nCreux réutilisables pendant les séchages : ` + creux.map((c) => `${c.jour} (${c.libre} h)`).join(', ')
    : '';

  return {
    message: `${data.length} tâches planifiées pour ${chantier.client_name}, du ${jours[0]} au ${jours[jours.length - 1]} :\n${detail}${dispo}`,
    lien: `./chantier.html?id=${chantier.id}`,
    data,
  };
}

// UNE etape en plus sur un chantier qui a deja son deroule.
// « chantier Dubois, nettoyage a faire en plus », « rajoute le ragreage ».
//
// POURQUOI CETTE FONCTION EXISTE PLUTOT QUE DE REUTILISER planifierTaches
// planifierTaches ne supprime rien — mais il fait deux choses qui, sur une
// seule etape, abiment le chantier :
//   1. il renumerote (`ordre: i + 1`) : l'etape ajoutee prendrait la place 1 et
//      le « nettoyage en plus » se retrouverait en TETE du deroule ;
//   2. il reecrit `date_debut`, `date_fin_prevue` et force `status:'en_cours'`
//      a partir des SEULES taches qu'on lui passe. Ajouter une etape ecraserait
//      donc les bornes du chantier avec le jour de cette unique etape, et
//      rouvrirait un chantier termine.
// C'est une perte de donnees silencieuse — sur `chantiers`, pas sur `taches`.
// Ici : un seul insert, aucune ecriture sur le chantier.
async function ajouterEtape(p) {
  const moteur = await import('./app-planning-engine.js');
  const chantier = await trouverChantier(p.client_nom || p.client || p.clientName);
  // Jamais deviner de quel chantier il s'agit : mieux vaut redemander que
  // d'ecrire une etape chez le mauvais client. Meme motif qu'assigner_tache.
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.client || '?'} ».`);

  const titre = (p.titre || p.title || '').trim();
  if (!titre) throw new Error('Quelle étape faut-il ajouter ?');

  const existantes = await listTachesChantier(chantier.id);

  // La place se prend APRES ce qui existe. On lit le maximum reel plutot que de
  // compter les lignes : une etape supprimee laisserait un trou, et compter
  // redonnerait un `ordre` deja pris.
  const ordreMax = existantes.reduce((m, t) => Math.max(m, Number(t.ordre) || 0), 0);
  let ordre = ordreMax + 1;
  let decalees = [];

  // L'artisan peut situer l'etape (« apres la pose »). Sans ca, c'est la fin du
  // chantier — le cas de loin le plus courant, et celui du « en plus ».
  if (p.apres_etape) {
    const cible = norm(p.apres_etape);
    const apres = existantes.find((t) => norm(t.titre).includes(cible));
    if (!apres) throw new Error(`Aucune étape « ${p.apres_etape} » sur ce chantier.`);
    ordre = (Number(apres.ordre) || 0) + 1;
    decalees = existantes.filter((t) => (Number(t.ordre) || 0) >= ordre);
  }

  // Le jour : celui de l'etape precedente, sinon la fin prevue, sinon
  // aujourd'hui. On ne CALCULE pas un planning ici — l'artisan deplacera
  // l'etape s'il le faut, et `deplacer_tache` existe deja pour ca.
  const precedente = existantes
    .filter((t) => (Number(t.ordre) || 0) < ordre && t.jour)
    .sort((a, b) => (Number(b.ordre) || 0) - (Number(a.ordre) || 0))[0];
  const jour = p.jour || (precedente && precedente.jour)
    || chantier.date_fin_prevue || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  // Decalage des suivantes, seulement si on s'insere au milieu.
  for (const t of decalees) {
    const { error } = await supabase.from('taches')
      .update({ ordre: (Number(t.ordre) || 0) + 1 }).eq('id', t.id);
    if (error) throw error;
  }

  // Heure facultative (07/09) : « cale un dépannage chez Benali mardi à 9 h ».
  // Refusée plutôt que devinée si elle n'est pas lisible.
  const heureBrute = p.heure ?? p.heure_debut ?? p.horaire;
  const heure = normaliserHeure(heureBrute);
  if (heureBrute != null && String(heureBrute).trim() !== '' && !heure) {
    throw new Error(`« ${heureBrute} » n'est pas une heure que je sais lire. Dites par exemple « à 9 h » ou « 14 h 30 ».`);
  }

  const { data, error } = await supabase.from('taches').insert({
    chantier_id: chantier.id,
    titre,
    description: p.description || null,
    ordre,
    jour,
    heure_debut: heure,
    duree_h: Number(p.duree_h || p.dureeH || 2),
    // Delai technique deduit du libelle quand il n'est pas donne : un enduit
    // pose en fin de chantier impose quand meme son temps de prise.
    delai_apres_h: p.delai_apres_h != null
      ? Number(p.delai_apres_h)
      : moteur.delaiSuggere(titre),
    mobilise_artisan: p.mobilise_artisan !== false,
    assigne_a: p.assigne_a || p.assignedTo || null,
    statut: 'a_faire',
  }).select().single();
  if (error) throw error;
  // Jumeau de creerTache() (supabase.js) : le groupe du chantier voit l'étape.
  annoncerFilEquipe(chantier.id, `📋 Nouvelle étape : « ${titre} »${data.assigne_a ? ' — ' + data.assigne_a : ''}${jour ? ' — ' + jour : ''}${heure ? ' à ' + heureLisible(heure) : ''}`);

  const place = p.apres_etape ? `après « ${p.apres_etape} »` : 'en fin de chantier';
  // (06/09, Moctar) une étape ajoutée à un chantier dont le devis est signé
  // = des travaux supplémentaires : l'assistant doit ENCHAÎNER — proposer
  // le devis complémentaire, les fournitures, et conseiller sur les
  // matériaux. Les suites sont des boutons dans la carte (app-assistant.js).
  //
  // 07/09, Moctar : « le TS c'est un devis EN PLUS de celui qui existe, pas
  // une modification de celui qui a déjà été signé ». Cette suite appelait
  // `nouvelle_version_devis`, qui reprend TOUTES les lignes du marché signé
  // pour y ajouter un lot : le client re-signait 8 900 € pour un supplément
  // de 400 €. Le bon geste est un devis séparé, avec son propre numéro, que
  // le client signe avant que le travail commence — c'est aussi ce qu'exige
  // l'article 1793 du Code civil sur un marché à forfait (autorisation
  // écrite et prix convenu). Le devis d'origine ne bouge pas.
  //
  // Pas d'outil pré-rempli ici : un devis suppose une quantité et un PRIX,
  // qui sont ceux de l'artisan et de personne d'autre. La suite relance
  // l'assistant, qui les demande.
  let suites = [];
  try {
    const devisClient = await chargerDevis({ client_nom: chantier.client_name });
    const signe = (devisClient || []).find((d) => ['signe', 'accepte', 'signed', 'accepted'].includes(String(d.status || '').toLowerCase()));
    if (signe) {
      suites.push({
        libelle: 'Devis de travaux supplémentaires',
        question: `Prépare un devis de travaux supplémentaires pour ${chantier.client_name}`
          + `${chantier.adresse ? `, ${chantier.adresse}` : ''} : « ${titre} »`
          + `${p.description ? ' — ' + p.description : ''}.`
          + ` C'est un devis À PART, en plus du devis ${signe.numero || ''} déjà signé, qui ne doit pas changer.`
          + ' Demande-moi la quantité et mon prix si tu ne les as pas.',
      });
    }
  } catch (_) { /* pas de devis lisible : pas de proposition de devis TS */ }
  suites.push({ libelle: 'Fournitures pour cette étape', question: `Quelles fournitures et quel matériel prévoir pour « ${titre} » chez ${chantier.client_name} ?` });
  suites.push({ libelle: 'Conseil matériaux', question: `Pour « ${titre} » chez ${chantier.client_name}, quel type de matériau me conseilles-tu, et où l'acheter au meilleur rapport qualité-prix ?` });
  return {
    message: `Étape « ${titre} » ajoutée ${place} sur le chantier ${chantier.client_name}, le ${jour}${heure ? ` à ${heureLisible(heure)}` : ''}.`
      + (suites.some((x) => x.libelle === 'Devis de travaux supplémentaires')
        ? ' Cette étape n\'est pas dans le devis signé : voulez-vous un devis de travaux supplémentaires, à part ? Le devis signé ne bougera pas.'
        : ''),
    lien: `./chantier.html?id=${chantier.id}`,
    geste: { suites },
    data,
  };
}

// L'artisan VALIDE le temps qu'il a passe sur une etape. Jamais chronometre en
// douce : c'est lui qui confirme, et c'est cette donnee-la qui vaut quelque chose.
// Le prevu (duree_prevue_h) reste intact pour qu'on puisse mesurer l'ecart.
async function validerTempsPasse(p) {
  const heures = Number(p.duree_reelle_h ?? p.heures ?? p.duree);
  if (!(heures > 0)) throw new Error('Indiquez le temps passé, en heures.');
  if (!p.tache_id) throw new Error('Quelle étape ?');

  const maj = {
    duree_reelle_h: heures,
    termine_le: p.termine_le || new Date().toISOString(),
    statut: p.statut || 'termine',
  };
  if (p.commence_le) maj.commence_le = p.commence_le;

  const { data, error } = await supabase
    .from('taches').update(maj).eq('id', p.tache_id).select().single();
  if (error) throw error;

  const prevu = Number(data.duree_prevue_h);
  let ecart = '';
  if (prevu > 0) {
    const d = Math.round(((heures - prevu) / prevu) * 100);
    ecart = d === 0 ? ' — conforme à la prévision'
      : ` — ${Math.abs(d)} % ${d > 0 ? 'de plus' : 'de moins'} que prévu (${prevu} h)`;
  }
  return {
    message: `« ${data.titre} » : ${heures} h enregistrées${ecart}.`,
    lien: `./chantier.html?id=${data.chantier_id}`,
    data,
  };
}

// Charge par personne sur la période + alerte de surcharge.
async function verifierCharge(p) {
  const moteur = await import('./app-planning-engine.js');
  const { data: taches, error } = await supabase
    .from('taches').select('*').not('jour', 'is', null);
  if (error) throw error;
  // Les absences déclarées pèsent sur la charge : quelqu'un en congé n'est pas
  // disponible, même si son planning paraît vide. Sans ça, l'assistant
  // proposait d'assigner une étape à quelqu'un qu'on venait de mettre en RTT.
  const indispos = await listIndisponibilites().catch(() => []);
  if (!taches.length) return { message: "Aucune tâche planifiée pour l'instant.", lien: './planning.html' };

  const chantiers = await listChantiers();
  const parId = Object.fromEntries(chantiers.map((c) => [c.id, c]));
  const charge = moteur.analyserCharge(taches, parId);
  const surcharges = charge.filter((c) => c.surcharge);

  const absencesLisibles = (indispos || []).slice(0, 6).map((i) => {
    const q = i.jour_fin && i.jour_fin !== i.jour ? `du ${i.jour} au ${i.jour_fin}` : `le ${i.jour}`;
    const m = i.moment === 'matin' ? ' (matin)' : i.moment === 'apres_midi' ? ' (après-midi)' : '';
    return `  absent ${q}${m}` + (i.motif ? ` — ${i.motif}` : '');
  });
  const bloc = absencesLisibles.length
    ? `\n\nAbsences déclarées :\n${absencesLisibles.join('\n')}`
    : '';

  if (!surcharges.length) {
    return { message: `Charge maîtrisée sur ${charge.length} jour(s) planifié(s) : aucune journée au-dessus de la capacité.` + bloc,
             lien: './planning.html' };
  }
  return {
    message: `${surcharges.length} journée(s) en surcharge :\n`
      + surcharges.map((c) => `${c.jour} · ${c.personne} : ${c.heures} h prévues (capacité ${c.capacite} h) sur ${c.chantiers.join(' + ')}`).join('\n')
      + bloc,
    lien: './planning.html',
    data: surcharges,
  };
}

// Ordre de passage optimisé pour une journée donnée.
async function itineraireJour(p) {
  const moteur = await import('./app-planning-engine.js');
  const jour = p.jour || p.date || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const { data: taches, error } = await supabase.from('taches').select('chantier_id').eq('jour', jour);
  if (error) throw error;
  if (!taches.length) return { message: `Aucun chantier planifié le ${jour}.`, lien: './planning.html' };

  const chantiers = await listChantiers();
  const ids = [...new Set(taches.map((t) => t.chantier_id))];
  const etapes = [];
  for (const id of ids) {
    const c = chantiers.find((x) => x.id === id);
    if (!c) continue;
    etapes.push({ nom: c.client_name, adresse: c.adresse, coord: await moteur.geocoder(c.adresse) });
  }
  const sansAdresse = etapes.filter((e) => !e.coord).map((e) => e.nom);
  const depart = p.depart ? await moteur.geocoder(p.depart) : null;
  const r = moteur.ordonnerJournee(etapes, depart);

  let msg = `Ordre conseillé le ${jour} : ` + r.ordre.map((e, i) => `${i + 1}. ${e.nom}`).join(' → ');
  if (r.km) msg += `\nTrajet estimé : ${r.km} km à vol d'oiseau.`;
  if (sansAdresse.length) msg += `\nSans adresse renseignée (non ordonnés) : ${sansAdresse.join(', ')}.`;
  return { message: msg, lien: './planning.html', data: r.ordre };
}

// ── Dépenses et marge ──────────────────────────────────────
//
// La marge n'était pas calculable : l'app ne stockait aucun coût. Deux sources
// désormais — le coût prévu saisi au devis (marge prévisionnelle) et les
// dépenses réelles (marge réelle). L'écart entre les deux est l'information
// la plus utile à un artisan.

// Lit un nombre qui peut arriver en texte francais (« 12,40 », « 1 250,00 »).
// L'OCR renvoie souvent le prix tel qu'il est imprime sur le ticket.
function nombreFr(v) {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return NaN;
  return Number(v.replace(/\s| |€/g, '').replace(',', '.'));
}

// Normalise le detail article par article d'un justificatif.
// L'OCR renvoie [{name, price}] ; on conserve aussi quantite et unite quand
// elles sont lisibles. Ce detail est la seule source de prix d'achat
// fournisseur reels dont nous disposerons : le total seul ne permet pas de
// construire une base de prix.
function normaliserLignesDepense(items) {
  if (!Array.isArray(items) || !items.length) return null;
  const lignes = items
    .map((it) => {
      if (!it) return null;
      const libelle = String(it.name || it.designation || '').trim();
      const prix = nombreFr(it.price ?? it.prix ?? it.montant);
      if (!libelle || !Number.isFinite(prix)) return null;
      const l = { name: libelle, price: Math.round(prix * 100) / 100 };
      const qte = Number(it.qty ?? it.quantite);
      if (Number.isFinite(qte) && qte > 0) l.qty = qte;
      const unite = String(it.unit || it.unite || '').trim();
      if (unite) l.unit = unite;
      return l;
    })
    .filter(Boolean);
  return lignes.length ? lignes : null;
}

// Enregistre une dépense. Appelé après lecture d'un ticket ou saisie manuelle.
async function enregistrerDepense(p) {
  const session = await getSession();
  const ht = Number(p.montant_ht ?? p.totalHT ?? 0);
  const tva = Number(p.tva ?? p.vatRate ?? 20);
  const ttc = Number(p.montant_ttc ?? p.totalTTC ?? 0) || ht * (1 + tva / 100);
  const chantier = p.client_nom ? await trouverChantier(p.client_nom) : null;
  const { data, error } = await supabase
    .from('depenses')
    .insert({
      pro_id: session.user.id,
      chantier_id: p.chantier_id || (chantier && chantier.id) || null,
      fournisseur: p.fournisseur || p.supplier || null,
      date_achat: p.date_achat || p.date || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
      categorie: p.categorie || p.category || 'Materiaux',
      designation: p.designation || (Array.isArray(p.items) ? p.items.map((i) => i.name).join(', ') : null),
      montant_ht: ht,
      tva,
      montant_ttc: ttc,
      // Detail article par article : l'OCR le produisait deja, on n'en gardait
      // que les noms concatenes dans `designation` et on jetait les prix.
      lignes: normaliserLignesDepense(p.items),
      source: p.source || 'saisie',
      confiance_ocr: p.confiance_ocr ?? p.confidence ?? null,
      // Chemin de la photo du ticket dans le bucket artisan-docs. La colonne
      // existait depuis le debut et n'avait AUCUN ecrivain : la photo etait
      // envoyee a l'OCR puis jetee. Le dossier comptable annoncait donc
      // toujours « 0 piece jointe ».
      justificatif_path: p.justificatif_path || null,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    message: `Dépense enregistrée : ${data.fournisseur || 'fournisseur'} — ${euro(data.montant_ttc)} TTC`
      + (chantier ? ` sur le chantier ${chantier.client_name}.` : ' (non rattachée à un chantier).'),
    lien: './finances.html?onglet=depenses',
    data,
  };
}

// Marge réelle : devis acceptés moins dépenses engagées.
async function calculerMarge(p) {
  const [{ data: devis, error: e1 }, { data: dep, error: e2 }] = await Promise.all([
    supabase.from('devis_visible').select('numero, status, total_ht, cout_prevu_ht, chantier_id, chantiers(client_name)'),
    supabase.from('depenses').select('montant_ht, chantier_id'),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const acceptes = (devis || []).filter((d) => d.status === 'accepte');
  if (!acceptes.length) {
    return { message: "Aucun devis accepté : la marge se calculera dès votre premier chantier signé.", lien: './finances.html' };
  }
  const cible = p && p.client_nom ? norm(p.client_nom) : null;
  const retenus = cible
    ? acceptes.filter((d) => norm(d.chantiers && d.chantiers.client_name).includes(cible))
    : acceptes;
  if (!retenus.length) throw new Error(`Aucun devis accepté pour « ${p.client_nom} ».`);

  const ids = new Set(retenus.map((d) => d.chantier_id));
  const ca = retenus.reduce((s, d) => s + Number(d.total_ht || 0), 0);
  const coutPrevu = retenus.reduce((s, d) => s + Number(d.cout_prevu_ht || 0), 0);
  const depense = (dep || []).filter((x) => ids.has(x.chantier_id))
    .reduce((s, x) => s + Number(x.montant_ht || 0), 0);

  const lignes = [`Chiffre d'affaires HT : ${euro(ca)}`];
  if (coutPrevu > 0) {
    lignes.push(`Coût prévu au devis : ${euro(coutPrevu)} → marge prévisionnelle ${Math.round(((ca - coutPrevu) / ca) * 100)} %`);
  }
  if (depense > 0) {
    lignes.push(`Dépenses engagées : ${euro(depense)} → marge réelle ${Math.round(((ca - depense) / ca) * 100)} %`);
    if (coutPrevu > 0) {
      const ecart = depense - coutPrevu;
      lignes.push(ecart > 0
        ? `Écart : ${euro(ecart)} de dépenses au-dessus du prévu.`
        : `Écart : ${euro(-ecart)} d'économie sur le prévu.`);
    }
  } else {
    lignes.push("Aucune dépense enregistrée : la marge réelle ne peut pas encore être calculée. Scannez vos tickets ou saisissez vos achats.");
  }
  return { message: lignes.join('\n'), lien: './finances.html', data: { ca, coutPrevu, depense } };
}

// Liste des dépenses, avec regroupement par catégorie.
// « Combien j'ai depense chez Point.P ce mois-ci », « montre-moi la facture de la
// baignoire », « cette depense c'est quel chantier » — un seul outil, filtre.
// Le justificatif remonte avec la depense : depuis le 09/09 il est range au
// coffre et relie par `depense_id`, donc il se retrouve.
async function chercherDepenses(p = {}) {
  let req = supabase
    .from('depenses')
    .select('id, fournisseur, date_achat, categorie, designation, montant_ht, montant_ttc, chantier_id, justificatif_path, chantiers(client_name), coffre_documents(id, nom, chemin)')
    .order('date_achat', { ascending: false })
    .limit(60);
  if (p.depuis) req = req.gte('date_achat', p.depuis);
  if (p.jusqua) req = req.lte('date_achat', p.jusqua);
  if (p.categorie) req = req.ilike('categorie', `%${p.categorie}%`);
  if (p.fournisseur) req = req.ilike('fournisseur', `%${p.fournisseur}%`);
  const { data, error } = await req;
  if (error) throw error;
  let dep = data || [];
  if (p.mot_cle) {
    const q = norm(p.mot_cle);
    dep = dep.filter((d) => norm(d.designation).includes(q)
      || norm(d.fournisseur).includes(q)
      || (d.coffre_documents || []).some((c) => norm(c.nom).includes(q)));
  }
  if (!dep.length) {
    return { message: 'Aucune dépense ne correspond à cette recherche.',
             lien: './finances.html?onglet=depenses' };
  }
  const total = dep.reduce((s, d) => s + Number(d.montant_ttc || 0), 0);
  const lignes = dep.slice(0, 12).map((d) => {
    const chantier = d.chantiers && d.chantiers.client_name ? ` · ${d.chantiers.client_name}` : '';
    const piece = (d.coffre_documents && d.coffre_documents.length) || d.justificatif_path
      ? ' · justificatif' : '';
    return `${d.date_achat || '?'} · ${d.fournisseur || 'fournisseur inconnu'} · ${euro(d.montant_ttc)} TTC${chantier}${piece}`;
  });
  return {
    message: `${dep.length} dépense(s) · ${euro(total)} TTC au total\n` + lignes.join('\n')
      + (dep.length > 12 ? `\n… et ${dep.length - 12} autre(s).` : ''),
    lien: './finances.html?onglet=depenses',
    data: dep,
  };
}

async function listerDepenses(p) {
  let req = supabase.from('depenses').select('*, chantiers(client_name)').order('date_achat', { ascending: false });
  const { data, error } = await req;
  if (error) throw error;
  let dep = data || [];
  if (p && p.client_nom) {
    const q = norm(p.client_nom);
    dep = dep.filter((d) => norm(d.chantiers && d.chantiers.client_name).includes(q));
  }
  if (!dep.length) return { message: "Aucune dépense enregistrée pour l'instant.", lien: './finances.html?onglet=depenses' };
  const parCat = {};
  dep.forEach((d) => { parCat[d.categorie] = (parCat[d.categorie] || 0) + Number(d.montant_ht || 0); });
  const total = dep.reduce((s, d) => s + Number(d.montant_ht || 0), 0);
  return {
    message: `${dep.length} dépense(s) · ${euro(total)} HT au total\n`
      + Object.entries(parCat).map(([c, v]) => `  ${c} : ${euro(v)}`).join('\n'),
    lien: './finances.html?onglet=depenses',
    data: dep,
  };
}

// Prépare l'envoi d'un devis au client : passe le devis en « envoyé » et
// renvoie le lien public que l'artisan transmet lui-même (SMS, WhatsApp, email).
// Aucun envoi automatique : l'artisan reste maître de ce qui part chez son client.
async function envoyerDevis(p) {
  const devis = await chargerDevis({});
  const d = refDevis(devis, p.devis_ref, p.client_nom);
  if (!d) throw new Error(`Devis introuvable pour « ${p.devis_ref || p.client_nom || '?'} ».`);

  // Le lien de suivi s'appuie sur le public_token du chantier (déjà généré en base).
  const { data: chantier, error: e1 } = await supabase
    .from('chantiers').select('public_token, client_name, client_email').eq('id', d.chantier_id).single();
  if (e1) throw e1;
  if (!chantier || !chantier.public_token) throw new Error("Ce chantier n'a pas de lien de suivi.");

  const { error: e2 } = await supabase
    .from('devis')
    // `sent_to_email` n'est PLUS renseignee ici. Elle l'etait a chaque fois,
    // meme sans envoi : la base affirmait « envoye a untel@... » alors que
    // l'artisan avait seulement copie un lien. Seule l'Edge Function l'ecrit
    // desormais, apres acceptation par Brevo.
    .update({ status: 'envoye', sent_at: new Date().toISOString() })
    .eq('id', d.id);
  if (e2) throw e2;

  const lien = lienSuivi(chantier.public_token);
  try { await navigator.clipboard.writeText(lien); } catch (_) {}

  // L'email est une OPTION, jamais un automatisme. Le moyen normal reste le lien
  // que l'artisan colle dans un SMS ou un WhatsApp : c'est la que son client lit,
  // et c'est lui qui choisit le moment et le ton. Un envoi automatique partirait
  // aussi quand il voulait seulement figer le devis.
  //
  // L'envoi vient APRES le passage en « envoye » : si l'email echoue, le devis
  // reste envoye et le lien est copie — l'artisan a toujours de quoi faire.
  let email = '';
  if (p.par_email === true) {
    const destinataire = p.email || chantier.client_email;
    if (!destinataire) {
      email = `\n\n⚠️ Email non envoyé : aucune adresse connue pour ${chantier.client_name}.`
        + ` Renseignez-la sur la fiche du chantier, ou transmettez le lien vous-même.`;
    } else {
      try {
        const { data, error } = await supabase.functions.invoke('envoyer-devis-client', {
          body: { devis_id: d.id },
        });
        if (error || !data?.ok) throw new Error(data?.error || error?.message || 'envoi_refuse');
        // On affiche l'adresse RENVOYEE PAR LE SERVEUR, celle a laquelle le
        // message est reellement parti — pas celle qu'on croyait avoir.
        email = `\n\n✉️ Email envoyé à ${data.envoye_a}.`;
        if (data.message_id) email += `\nRéférence d'envoi : ${data.message_id}`;
        if (data.trace === false) {
          email += `\n(l'email est parti, mais la trace n'a pas pu être enregistrée)`;
        }
      } catch (e) {
        // On dit que l'email n'est pas parti. Annoncer un envoi qui n'a pas eu
        // lieu est ce que faisait l'ancienne version de cet ecran.
        email = `\n\n⚠️ Email non envoyé (${(e && e.message) || 'erreur'}).`
          + ` Le lien reste valable, transmettez-le vous-même.`;
      }
    }
  }

  return {
    message: `Devis ${d.numero} marqué comme envoyé.\n\nLien à transmettre à ${chantier.client_name} :\n${lien}\n\n`
      + `(copié dans le presse-papier — envoyez-le par SMS, WhatsApp ou email)${email}`,
    lien: `./suivi.html?t=${chantier.public_token}`,
    data: { devis: d, url: lien },
  };
}

// ── Messagerie et déroulement, pilotés par l'assistant ─────
// « Envoie un message à Karim », « où en est le chantier Bertin ? »,
// « qui travaille lundi ? ». Ces fonctions existaient à l'écran mais
// l'assistant ne savait pas les actionner.

// Retrouve un membre de l'équipe par prénom, nom ou email.
async function trouverMembre(recherche) {
  const q = norm(recherche);
  if (!q) return null;
  const membres = await listMembres();
  const actifs = membres.filter((m) => m.statut !== 'inactif');
  return actifs.find((m) =>
    norm(m.prenom) === q || norm(`${m.prenom} ${m.nom || ''}`).trim() === q || norm(m.email) === q
  ) || actifs.find((m) =>
    norm(`${m.prenom} ${m.nom || ''}`).includes(q) || norm(m.email).includes(q)
  ) || null;
}

// Un message d'équipe est toujours rattaché à un chantier : c'est ce qui le
// rend retrouvable plus tard, et ce qui fait porter la policy RLS. On refuse
// donc d'écrire « dans le vide » plutôt que d'inventer un rattachement.
async function envoyerMessage(p) {
  const texte = (p.message || p.texte || p.contenu || '').toString().trim();
  if (!texte) throw new Error('Aucun message à envoyer.');

  // Groupe LIBRE (12/09, Moctar) : « dis à l'équipe peinture… », ou un nom de
  // groupe donné là où on attend un chantier. Cherché d'abord, sans jamais
  // inventer : pas de correspondance → on retombe sur le chantier.
  const nomGroupe = String(p.groupe || p.groupe_nom || p.client_nom || p.client || p.chantier || '').trim();
  if (nomGroupe) {
    try {
      const libres = await listGroupesLibres();
      const cibleG = libres.find((g) => norm(g.nom) === norm(nomGroupe))
        || libres.find((g) => norm(g.nom).includes(norm(nomGroupe)) || norm(nomGroupe).includes(norm(g.nom)));
      if (cibleG && (p.groupe || p.groupe_nom || !(await trouverChantier(nomGroupe).catch(() => null)))) {
        const msgG = await envoyerMessageGroupe(cibleG.id, texte);
        return {
          message: `Message publié dans le groupe « ${cibleG.nom} » :\n« ${texte} »\n\nSes membres sont prévenus ; le client, non.`,
          lien: `./equipe.html?groupe=${cibleG.id}#fil`,
          data: msgG,
        };
      }
    } catch (_) { /* pas de groupe libre : suite normale */ }
  }
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) {
    const ouverts = (await listChantiers()).filter((c) => c.status !== 'termine');
    throw new Error(
      p.client_nom || p.chantier
        ? `Aucun chantier trouvé pour « ${p.client_nom || p.chantier} ».`
        : 'Précisez sur quel chantier envoyer ce message'
          + (ouverts.length ? ` : ${ouverts.slice(0, 5).map((c) => c.client_name).join(', ')}.` : '.')
    );
  }

  // Le destinataire est indicatif : le fil du chantier est lu par toute
  // l'équipe. On le nomme en tête du message plutôt que de laisser croire
  // à un envoi privé qui n'existe pas.
  let entete = '';
  if (p.destinataire || p.membre || p.a) {
    const cible = await trouverMembre(p.destinataire || p.membre || p.a);
    if (!cible) throw new Error(`Aucun membre d'équipe nommé « ${p.destinataire || p.membre || p.a} ».`);
    entete = `@${cible.prenom} `;
  }

  const msg = await envoyerMessageEquipe(chantier.id, entete + texte);
  return {
    message: `Message publié sur le fil du chantier ${chantier.client_name}`
      + (entete ? `, à l'attention de ${entete.slice(1).trim()}` : '')
      + ` :\n« ${entete + texte} »\n\nToute l'équipe du chantier le voit ; le client, non.`,
    lien: './equipe.html',
    data: msg,
  };
}

// « Où en est le chantier X ? » — l'état réel, pas une estimation.
async function deroulementChantier(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.chantier || '?'} ».`);

  const taches = await listTachesChantier(chantier.id);
  if (!taches.length) {
    return {
      message: `Aucune étape planifiée sur le chantier ${chantier.client_name}. `
        + `Dites-moi les travaux et je découpe le chantier en étapes datées.`,
      lien: `./chantier.html?id=${chantier.id}`,
    };
  }

  const finies = taches.filter((t) => t.statut === 'termine');
  const restantes = taches.filter((t) => t.statut !== 'termine');
  const heuresRestantes = restantes.reduce((s, t) => s + (Number(t.duree_h) || 0), 0);
  const prochaine = restantes[0];
  const detail = taches.map((t) =>
    `${t.statut === 'termine' ? '✓' : '·'} ${t.jour || 'non daté'} — ${t.titre}`
    + (t.assigne_a ? ` (${t.assigne_a})` : '')
  ).join('\n');

  return {
    message: `Chantier ${chantier.client_name} : ${finies.length}/${taches.length} étapes faites, `
      + `${heuresRestantes} h de travail restantes.\n\n${detail}`
      + (prochaine ? `\n\nProchaine étape : ${prochaine.titre}${prochaine.jour ? ` le ${prochaine.jour}` : ''}.` : '\n\nToutes les étapes sont faites.'),
    lien: `./chantier.html?id=${chantier.id}`,
    data: taches,
  };
}

// « Qui travaille lundi, et où ? »
//
// Un artisan seul s'entendait repondre « Non assigné — 7 h sur chantier
// Dubois ». Sur son propre planning, ou il est le seul a travailler, la
// question « qui ? » n'a qu'une reponse : lui. Meme regle que l'ecran
// planning — non assignee ne veut dire « personne » que s'il y a une equipe.
async function quiTravaille(p) {
  const jour = p.jour || p.date || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  // Les ABSENCES du jour (07/09/2026, Moctar : « l'assistant peut créer une
  // action et EN TENIR COMPTE »). Bloquer l'agenda de quelqu'un ne servait à
  // rien tant que personne ne lisait la table : l'assistant continuait de le
  // proposer. On regarde qui est absent AVANT de dire qui travaille.
  const [taches, chantiers, indispos] = await Promise.all([
    listTachesJour(jour), listChantiers(),
    listIndisponibilites(jour, jour).catch(() => []),
  ]);
  const absents = (indispos || []).filter((i) => {
    const fin = i.jour_fin || i.jour;
    return i.jour <= jour && jour <= fin;
  });
  const membresAbsents = new Set(absents.map((i) => i.qui).filter(Boolean));
  const artisanAbsent = absents.some((i) => !i.qui);
  const lignesAbsence = absents.length
    ? '\n\n' + absents.map((i) => {
        const m = i.moment === 'matin' ? ' (matin)' : i.moment === 'apres_midi' ? ' (après-midi)' : '';
        return `⚠ Absent ce jour${m}` + (i.motif ? ` — ${i.motif}` : '') + '.';
      }).join('\n')
    : '';
  if (!taches.length) {
    return { message: `Personne n'est planifié le ${jour}.` + lignesAbsence, lien: './planning.html' };
  }

  // Le contexte porte deja la regle (`membres`, `nomComplet`, `moi`) : on la
  // reutilise au lieu de la reecrire ici. S'il echoue, on retombe sur
  // l'ancien libelle plutot que de perdre la reponse.
  let solo = false, monNom = null;
  try {
    const ctx = await contexteEquipe();
    solo = ctx.membres.length === 0;
    monNom = ctx.moi ? ctx.nomComplet(ctx.moi) : null;
  } catch (_) { /* la réponse vaut mieux qu'une erreur */ }

  const parId = Object.fromEntries(chantiers.map((c) => [c.id, c]));
  const parPersonne = new Map();
  for (const t of taches) {
    // En solo, une tache sans nom est la sienne : on l'annonce sous son nom
    // (ou « Vous » si le profil ne le donne pas), jamais « Non assigné ».
    const qui = t.assigne_a || (solo ? (monNom || 'Vous') : 'Non assigné');
    if (!parPersonne.has(qui)) parPersonne.set(qui, []);
    parPersonne.get(qui).push(t);
  }

  const CAPACITE_H = 7;
  const lignes = [];
  for (const [qui, lot] of parPersonne) {
    const h = lot.reduce((s, t) => s + (Number(t.duree_h) || 0), 0);
    const lieux = [...new Set(lot.map((t) => parId[t.chantier_id]?.client_name).filter(Boolean))];
    lignes.push(`${qui} — ${h} h sur ${lieux.join(' + ') || 'chantier inconnu'}`
      + (h > CAPACITE_H ? ` ⚠ au-dessus de la capacité (${CAPACITE_H} h)` : ''));
  }
  return {
    message: `Le ${jour} :\n` + lignes.join('\n') + lignesAbsence,
    lien: './planning.html',
    data: [...parPersonne.keys()],
  };
}

// « L'étape sous-couche est finie »
async function terminerTache(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.chantier || '?'} ».`);

  const taches = await listTachesChantier(chantier.id);
  const q = norm(p.etape || p.tache || p.titre);
  if (!q) throw new Error('Précisez quelle étape est terminée.');

  const cible = taches.find((t) => norm(t.titre) === q) || taches.find((t) => norm(t.titre).includes(q));
  if (!cible) {
    throw new Error(`Aucune étape « ${p.etape || p.tache} » sur ce chantier. `
      + `Étapes en cours : ${taches.filter((t) => t.statut !== 'termine').map((t) => t.titre).join(', ') || 'aucune'}.`);
  }
  if (cible.statut === 'termine') {
    return { message: `L'étape « ${cible.titre} » était déjà marquée terminée.`, lien: `./chantier.html?id=${chantier.id}` };
  }

  await majStatutTache(cible.id, 'termine');
  const restantes = taches.filter((t) => t.statut !== 'termine' && t.id !== cible.id);
  return {
    message: `Étape « ${cible.titre} » marquée terminée sur le chantier ${chantier.client_name}.`
      + (restantes.length ? `\nReste ${restantes.length} étape(s), la prochaine étant « ${restantes[0].titre} ».` : `\nToutes les étapes du chantier sont faites.`),
    lien: `./chantier.html?id=${chantier.id}`,
  };
}

// ── Ce qui a été construit le 01/09 et n'était joignable que par des écrans ──
//
// Quatre capacités réelles de l'application n'avaient aucune porte vocale.
// Une fonctionnalité qu'on ne peut pas demander à l'assistant est, pour
// l'artisan qui a les mains dans le plâtre, une fonctionnalité absente.

// « Le chantier Dupont est fini. » Ce n'est pas un simple changement d'état :
// ça prévient le client par email, ça ouvre son compte à rebours de 14 jours
// pour télécharger son dossier, et ça ferme son lien de suivi ensuite.
// On le DIT, pour que l'artisan sache ce qu'il déclenche.
async function terminerChantier(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.chantier || '?'} ».`);
  if (chantier.status === 'termine') {
    return { message: `Le chantier de ${chantier.client_name} était déjà marqué terminé.`,
             lien: `./chantier.html?id=${chantier.id}` };
  }

  // Prévenir plutôt que corriger après : des étapes ouvertes sur un chantier
  // déclaré fini, c'est en général un oubli.
  const taches = await listTachesChantier(chantier.id).catch(() => []);
  const ouvertes = taches.filter((t) => t.statut !== 'termine');

  const { error } = await supabase.from('chantiers')
    .update({ status: 'termine' }).eq('id', chantier.id);
  if (error) throw error;

  // 14 jours (Moctar, 02/09/2026). ⚠️ A NE PAS CONFONDRE avec les 14 jours de
  // RETRACTATION : celle-ci court depuis la SIGNATURE et releve de l'art.
  // L221-18 du code de la consommation ; celle-la est un choix de service, la
  // duree pendant laquelle le client garde acces a ses documents apres la fin
  // des travaux. Deux compteurs distincts qui tombent souvent le meme jour.
  const fin = new Date(Date.now() + 14 * 86400000).toLocaleDateString('fr-FR');
  return {
    message: `Chantier de ${chantier.client_name} marqué terminé.\n\n`
      + (chantier.client_email
          ? `Votre client est prévenu par email : il peut télécharger son devis signé, ses factures, les photos et vos attestations jusqu'au ${fin}.\n`
          : `⚠️ Aucun email n'est enregistré pour ce client : il ne sera pas prévenu. Son lien de suivi reste ouvert jusqu'au ${fin}.\n`)
      + `Passé cette date, le lien ne fonctionnera plus.`
      + (ouvertes.length ? `\n\n⚠️ ${ouvertes.length} étape(s) encore ouverte(s) : ${ouvertes.map((t) => t.titre).join(', ')}.` : ''),
    lien: `./chantier.html?id=${chantier.id}`,
  };
}

// « Envoie mon attestation décennale au client. » Le coffre stockait déjà ces
// pièces ; seule la visibilité manquait. Sans cette action, il fallait ouvrir
// le coffre et faire défiler un sélecteur.
async function partagerDocumentClient(p) {
  const quoi = norm(p.document || p.categorie || p.piece);
  if (!quoi) throw new Error('Quelle pièce voulez-vous transmettre ? (décennale, RC pro, PV de réception…)');
  const docs = await listCoffreDocs();
  if (!docs.length) throw new Error("Votre coffre est vide : déposez d'abord la pièce depuis Mes documents.");

  const cible = docs.find((d) => norm(d.categorie) === quoi)
    || docs.find((d) => norm(d.categorie).includes(quoi) || norm(d.nom).includes(quoi));
  if (!cible) {
    throw new Error(`Aucune pièce « ${p.document || p.categorie} » dans votre coffre. `
      + `Disponibles : ${[...new Set(docs.map((d) => d.categorie))].join(', ')}.`);
  }
  if (cible.visibilite === 'client') {
    return { message: `« ${cible.nom} » est déjà visible par vos clients.`, lien: './coffre.html' };
  }
  await majVisibiliteDoc(cible.id, 'client');
  return {
    message: `« ${cible.nom} » est maintenant dans le dossier que vos clients consultent depuis leur lien de suivi.`,
    lien: './coffre.html',
  };
}

// « Où en sont mes factures ? » — lecture seule, réponse immédiate.
async function listerFactures(p) {
  let q = supabase.from('factures')
    .select('numero, type, total_ttc, statut, date_emission, date_echeance, payee_le, chantiers(client_name)')
    .order('date_emission', { ascending: false }).limit(30);
  const { data, error } = await q;
  if (error) throw error;
  let liste = data || [];
  const nom = norm(p.client_nom || p.client);
  if (nom) liste = liste.filter((f) => norm(f.chantiers?.client_name).includes(nom));
  if (!liste.length) return { message: nom ? `Aucune facture pour « ${p.client_nom} ».` : 'Aucune facture pour le moment.' };

  const impayees = liste.filter((f) => f.statut !== 'payee');
  const du = impayees.reduce((s, f) => s + (Number(f.total_ttc) || 0), 0);
  const lignes = liste.slice(0, 12).map((f) =>
    `${f.numero} · ${f.chantiers?.client_name || '—'} · ${euro(f.total_ttc)} · `
    + (f.statut === 'payee' ? 'réglée' : 'à régler'));
  return {
    message: `${liste.length} facture(s).`
      + (impayees.length ? ` ${impayees.length} en attente, ${euro(du)} dus.\n\n` : '\n\n')
      + lignes.join('\n'),
    lien: './finances.html?onglet=factures',
  };
}

// ── Recherche d'une facture : UNE seule implémentation ────────────────────
//
// Les quatre exécutants de facture (`envoyer_facture`, `envoyer_facture_email`,
// `marquer_facture_payee`, `partager_facture`) cherchaient chacun la leur, avec
// le même ordre recopié quatre fois : numéro exact, puis numéro partiel
// (« 0002 » pour « F-2026-0002 »), puis nom du client. Ce qui diffère vraiment
// entre eux tient en deux paramètres — `prefere`, qui départage plusieurs
// factures d'un même client, et `exclusif`, qui interdit d'en sortir.
//
// Introuvable → on le dit, on n'agit JAMAIS sur une autre facture.
const COLONNES_FACTURE =
  'id, numero, type, statut, total_ttc, chantiers(public_token, client_name)';

async function resoudreFacture(p, opts = {}) {
  const ref = norm(p.numero || p.facture || p.reference);
  const nom = norm(p.client_nom || p.client);
  // Seul `partager_facture` demande un repère avant de chercher : les trois
  // autres répondent « Facture introuvable », ce qu'ils faisaient déjà.
  if (!ref && !nom && opts.exigeRepere) throw new Error(opts.exigeRepere);

  const { data, error } = await supabase.from('factures')
    .select(COLONNES_FACTURE)
    .order('date_emission', { ascending: false });
  if (error) throw error;
  const liste = data || [];

  const duClient = (f) => !!nom && norm(f.chantiers && f.chantiers.client_name).includes(nom);
  const prefere = opts.prefere;
  const cible = (ref && liste.find((f) => norm(f.numero) === ref))
    || (ref && liste.find((f) => norm(f.numero).includes(ref)))
    || (prefere && liste.find((f) => duClient(f) && prefere(f)))
    || (!opts.exclusif && liste.find(duClient))
    || null;
  if (!cible) throw new Error(`Facture introuvable pour « ${p.numero || p.facture || p.client_nom || '?'} ».`);
  return cible;
}

// Un brouillon n'est jamais visible du client : `get_factures_by_token` ne le
// sort pas (js/supabase.js). Le partager remettrait un lien mort — et en PDF,
// la fenêtre d'impression s'ouvrirait sur « Aucune facture disponible pour ce
// chantier. » Même refus et MÊME PHRASE pour `envoyer_facture_email` et
// `partager_facture` : deux tests séparés auraient fini par énoncer deux règles.
function refuserBrouillon(f) {
  if (f && f.statut === 'brouillon') {
    throw new Error(`La facture ${f.numero} est encore en brouillon : envoyez-la d'abord (elle n'a jamais été transmise).`);
  }
}

// « Envoie la facture 0002 au client. » Bascule le brouillon en facture
// envoyée et prévient le client sur le fil du chantier — même fonction que
// le bouton « Envoyer la facture » de finances.html (js/supabase.js:envoyerFacture).
async function envoyerFactureAction(p) {
  // Nommé sans numéro, c'est le brouillon du client qu'on veut envoyer.
  const cible = await resoudreFacture(p, { prefere: (f) => f.statut === 'brouillon' });
  if (cible.statut !== 'brouillon') {
    return {
      message: `La facture ${cible.numero} est déjà ${cible.statut === 'payee' ? 'payée' : 'envoyée'}.`,
      lien: './finances.html?onglet=factures',
    };
  }
  const res = await envoyerFacture(cible.id);
  return {
    message: `Facture ${res.numero} envoyée à ${res.client_name || cible.chantiers?.client_name || 'votre client'}.`,
    lien: './finances.html?onglet=factures',
    data: res,
  };
}

// « Renvoie la facture 0002 par e-mail. » Distincte d'envoyerFactureAction :
// celle-ci ne bascule jamais un brouillon, elle ne fait QUE (re)déclencher
// l'e-mail d'une facture déjà envoyée — même fonction que le bouton
// « Renvoyer par e-mail » de finances.html (js/supabase.js:envoyerFactureParEmail).
// Nom d'action IMPOSÉ par les outils déclarés à l'assistant (v61) :
// `envoyer_facture_email`, params `numero`, `client_nom`, `type`.
async function envoyerFactureEmailAction(p) {
  // « la facture d'acompte de Mme Ravier » : le type départage ses factures.
  const type = (p.type || '').toLowerCase();
  const cible = await resoudreFacture(p, { prefere: (f) => !!type && f.type === type });
  refuserBrouillon(cible);
  const res = await envoyerFactureParEmail(cible.id);
  return {
    message: `Facture ${cible.numero} renvoyée par e-mail${res.envoye_a ? ' à ' + res.envoye_a : ''}.`,
    lien: './finances.html?onglet=factures',
    data: res,
  };
}

// « La facture 0001 est payée. » Sans ça, le suivi des impayés reste faux.
async function marquerFacturePayee(p) {
  // `exclusif` : nommé sans numéro, on ne remonte QUE ses factures non réglées.
  // Aller chercher une facture déjà payée pour la « marquer payée » n'aurait
  // aucun sens — comportement d'origine, conservé.
  const cible = await resoudreFacture(p, { prefere: (f) => f.statut !== 'payee', exclusif: true });
  if (cible.statut === 'payee') {
    return { message: `La facture ${cible.numero} était déjà réglée.`, lien: './finances.html?onglet=factures' };
  }
  const { error: e2 } = await supabase.from('factures')
    .update({ statut: 'payee', payee_le: new Date().toISOString() }).eq('id', cible.id);
  if (e2) throw e2;
  return {
    message: `Facture ${cible.numero} (${euro(cible.total_ttc)}) marquée réglée`
      + `${cible.chantiers?.client_name ? ' pour ' + cible.chantiers.client_name : ''}.`,
    lien: './finances.html?onglet=factures',
  };
}

// « Ajoute Karim comme compagnon, karim@mail.com. » Même chemin que le
// formulaire d'équipe.html (js/supabase.js:inviterMembre) : l'invitation est
// créée puis l'email part depuis l'Edge Function, jamais une clé côté navigateur.
async function ajouterCoequipier(p) {
  const prenom = String(p.prenom || '').trim();
  if (!prenom) throw new Error("Le prénom du coéquipier est requis.");
  const email = String(p.email || '').trim();
  if (!email) throw new Error("L'email du coéquipier est requis pour l'inviter.");
  const res = await inviterMembre({
    prenom,
    nom: p.nom || '',
    email,
    telephone: p.telephone || '',
    metier: p.metier || '',
    role: 'compagnon',
  });
  return {
    message: `${prenom} invité${res.emailEnvoye ? ', l\'email est parti' : ' — mais l\'email n\'est pas parti, renvoyez l\'invitation depuis Mon équipe'}.`,
    lien: './equipe.html',
    data: res,
  };
}

// « Ce chantier est en sous-traitance pour Bâti Pro. » Sans cette action, le
// drapeau ne se pose QUE dans la base : l'artisan ne peut pas le declarer, donc
// la facture reste fausse quoi qu'il fasse.
async function declarerSousTraitance(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.chantier || '?'} ».`);
  // Par defaut on ACTIVE : l'artisan qui prononce le mot veut le poser.
  const actif = p.sous_traitance !== false;

  const { error } = await supabase.from('chantiers')
    .update({ sous_traitance: actif, client_est_pro: actif ? true : undefined })
    .eq('id', chantier.id);
  if (error) throw error;

  return {
    message: actif
      ? `Chantier de ${chantier.client_name} déclaré en sous-traitance.\n\n`
        + `Vos prochaines factures partiront SANS TVA, avec la mention « Autoliquidation » `
        + `(art. 283, 2 nonies du CGI) : c'est le donneur d'ordre qui la déclare.\n`
        + `⚠️ Les factures déjà émises ne sont pas modifiées.`
      : `Chantier de ${chantier.client_name} repassé en facturation normale, avec TVA.`,
    lien: `./chantier.html?id=${chantier.id}`,
  };
}

// ══ PLANNING PAR LA PAROLE ═══════════════════════════════════════════════
//
// Tout ce que l'écran planning sait faire doit être accessible sans le toucher :
// un artisan les mains dans le plâtre parle, il ne navigue pas dans des menus.
//
// Règle tenue ici : ces outils n'ont AUCUNE logique métier à eux. Ils appellent
// les mêmes fonctions que l'interface (`listTachesPeriode`, `majStatutTache`,
// `assignerTache`) et la même détection de conflits (`detecterConflits` du
// moteur). Un conflit annoncé à l'oral est donc, par construction, celui que
// l'écran affiche.

const JOURS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const ISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Interprète une date dite à l'oral : « demain », « jeudi », « le 12 »,
 * « 2026-09-12 ». Renvoie null si rien n'est reconnu — l'assistant demandera
 * plutôt que de deviner une date au hasard.
 */
function dateDite(txt, base = new Date()) {
  if (!txt) return null;
  const t = norm(txt);
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(base); d.setHours(0, 0, 0, 0);
  if (/(apres|après).?demain/.test(t)) { d.setDate(d.getDate() + 2); return ISO(d); }
  if (/\bdemain\b/.test(t)) { d.setDate(d.getDate() + 1); return ISO(d); }
  if (/\b(aujourd|ce jour)/.test(t)) return ISO(d);
  if (/\bhier\b/.test(t)) { d.setDate(d.getDate() - 1); return ISO(d); }
  const idx = JOURS_FR.findIndex((j) => t.includes(j));
  if (idx >= 0) {
    let delta = (idx - d.getDay() + 7) % 7;
    if (delta === 0) delta = 7;             // « jeudi » un jeudi = jeudi prochain
    d.setDate(d.getDate() + delta);
    return ISO(d);
  }
  // DÉCALAGE RELATIF : « d'un jour », « de 2 jours », « +3 jours »,
  // « d'une semaine ». L'artisan parle comme ça — « décale la pose d'un jour »
  // est la phrase normale, et la suggestion de l'appli l'écrit elle-même.
  // Sans ce cas, l'assistant demandait « vers quelle date ? » alors que la
  // réponse était dans la question (Moctar, 08/09). Le calcul part de `base`,
  // qui doit être la date ACTUELLE DE L'ÉTAPE, pas aujourd'hui.
  const rel = t.match(/(?:^|\bde\s|\bd['’]|\+)\s*(un|une|\d{1,3})\s*(jour|semaine|mois)/);
  if (rel) {
    const n = /^(un|une)$/.test(rel[1]) ? 1 : parseInt(rel[1], 10);
    if (n > 0 && n < 400) {
      const enArriere = /\b(avant|plus t[oô]t|en arriere|en arrière|recule)\b/.test(t);
      const k = enArriere ? -n : n;
      if (rel[2] === 'jour') d.setDate(d.getDate() + k);
      else if (rel[2] === 'semaine') d.setDate(d.getDate() + k * 7);
      else d.setMonth(d.getMonth() + k);
      return ISO(d);
    }
  }
  const m = t.match(/\ble\s+(\d{1,2})\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 31) {
      if (n < d.getDate()) d.setMonth(d.getMonth() + 1);
      d.setDate(n);
      return ISO(d);
    }
  }
  return null;
}

/** Bornes d'une période dite : « demain », « cette semaine », « ce mois ». */
function periodeDite(p) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = norm(p.periode || p.période || p.echelle || '');
  const jour = dateDite(p.jour || p.date, today);

  if (/semaine/.test(t)) {
    const debut = new Date(today);
    debut.setDate(debut.getDate() - ((debut.getDay() + 6) % 7));
    if (/prochaine|suivante/.test(t)) debut.setDate(debut.getDate() + 7);
    const fin = new Date(debut); fin.setDate(fin.getDate() + 6);
    return { debut: ISO(debut), fin: ISO(fin), libelle: `du ${debut.toLocaleDateString('fr-FR')} au ${fin.toLocaleDateString('fr-FR')}` };
  }
  if (/mois/.test(t)) {
    const dec = /prochain|suivant/.test(t) ? 1 : 0;
    const debut = new Date(today.getFullYear(), today.getMonth() + dec, 1);
    const fin = new Date(debut.getFullYear(), debut.getMonth() + 1, 0);
    return { debut: ISO(debut), fin: ISO(fin), libelle: debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) };
  }
  const j = jour || ISO(today);
  return { debut: j, fin: j, libelle: `le ${new Date(j + 'T00:00:00').toLocaleDateString('fr-FR')}` };
}

/**
 * Qui suis-je, et ai-je le droit de voir toute l'équipe ?
 *
 * Reprend EXACTEMENT le modèle de l'écran planning : un patron n'est pas une
 * ligne de `membres_equipe` (vérifié en base le 03/09 — créer un compte n'en
 * insère aucune), il est donc représenté par un membre « virtuel ».
 */
async function contexteEquipe() {
  const [droits, session] = await Promise.all([
    mesDroits().catch(() => null),
    getSession().catch(() => null),
  ]);
  let membres = [];
  try { membres = await listMembres(); } catch (e) { membres = []; }
  const uid = session && session.user ? session.user.id : null;
  let moi = uid ? (membres.find((m) => m.user_id === uid) || null) : null;
  let equipe = membres;
  if (!moi) {
    let nom = 'Moi';
    try {
      const profil = await getMyProfile();
      if (profil && profil.display_name) nom = profil.display_name.trim() || 'Moi';
    } catch (e) { /* « Moi » suffit */ }
    moi = { id: '__moi__', prenom: nom, nom: '', user_id: uid, __virtuel: true };
    equipe = [moi, ...membres];
  }
  // Le périmètre par rôle vaut pour l'assistant AUSSI : un compagnon qui
  // demande « qui est sur quoi jeudi ? » n'obtient pas la charge de l'équipe.
  const encadrement = !(droits && droits.encadrement === false);
  const parId = new Map(membres.map((m) => [m.id, m]));
  const nomComplet = (m) => [m.prenom, m.nom].filter(Boolean).join(' ').trim() || 'Membre';
  const estMienne = (t) => {
    const monNom = nomComplet(moi).toLowerCase();
    if (moi.__virtuel) {
      if (t.assigne_id) return false;
      const txt = String(t.assigne_a || '').trim();
      if (txt) return txt.toLowerCase() === monNom;
      // Non assignée = la mienne seulement si je travaille seul. Même règle que
      // l'écran planning : dès qu'il y a une équipe, elle n'est à personne.
      return membres.length === 0;
    }
    if (t.assigne_id) return t.assigne_id === moi.id;
    return String(t.assigne_a || '').trim().toLowerCase() === monNom;
  };
  return { droits, moi, equipe, membres, parId, encadrement, nomComplet, estMienne };
}

/**
 * Retrouve un membre par son nom. Ne devine JAMAIS : en cas d'ambiguïté ou
 * d'absence, on renvoie la raison pour que l'assistant demande. Assigner au
 * hasard « le premier qui ressemble » est exactement le genre d'invention
 * qu'on refuse partout ailleurs dans ce projet.
 */
function resoudreMembre(ctx, recherche) {
  const q = norm(recherche);
  if (!q) return { erreur: 'Qui doit intervenir ? Précisez la personne.' };
  if (/^(moi|me|je|mon|patron)$/.test(q)) return { membre: ctx.moi };
  const candidats = ctx.equipe.filter((m) => {
    const complet = norm(ctx.nomComplet(m));
    return complet === q || norm(m.prenom) === q || complet.includes(q);
  });
  if (candidats.length === 1) return { membre: candidats[0] };
  if (candidats.length > 1) {
    return { erreur: `Plusieurs personnes correspondent à « ${recherche} » : `
      + candidats.map(ctx.nomComplet).join(', ') + '. Laquelle ?' };
  }
  if (!ctx.membres.length) {
    return { erreur: `Vous n'avez personne dans votre équipe pour l'instant : « ${recherche} » est introuvable. `
      + "Vous pouvez inviter quelqu'un depuis l'écran Équipe, ou vous assigner la tâche vous-même." };
  }
  return { erreur: `Je ne trouve personne qui s'appelle « ${recherche} » dans votre équipe (`
    + ctx.equipe.map(ctx.nomComplet).join(', ') + '). Qui voulez-vous ?' };
}

/** Retrouve UNE tâche par libellé, dans un périmètre donné. Ne devine pas. */
function trouverTache(taches, recherche) {
  const q = norm(recherche);
  if (!q) return { erreur: 'De quelle étape parlez-vous ?' };
  let candidats = taches.filter((t) => norm(t.titre) === q);
  if (!candidats.length) candidats = taches.filter((t) => norm(t.titre).includes(q));
  if (candidats.length === 1) return { tache: candidats[0] };
  if (candidats.length > 1) {
    return { erreur: `Plusieurs étapes correspondent à « ${recherche} » : `
      + candidats.map((t) => `« ${t.titre} »${t.jour ? ` (${t.jour})` : ''}`).join(', ')
      + '. Laquelle ?' };
  }
  return { erreur: `Je ne trouve aucune étape « ${recherche} » sur cette période.` };
}

/** Conflits sur la période d'une tâche — même moteur que la vue Charge. */
async function conflitsAutour(ctx, jour) {
  const moteur = await import('./app-planning-engine.js');
  const [taches, chantiers] = await Promise.all([
    listTachesPeriode(jour, jour), listChantiers(),
  ]);
  const parChantier = Object.fromEntries(chantiers.map((c) => [c.id, c]));
  const nomsParId = new Map(ctx.equipe.map((m) => [m.id, ctx.nomComplet(m)]));
  return moteur.detecterConflits(taches, parChantier, {
    nomDe: (t) => {
      if (t.assigne_id && nomsParId.has(t.assigne_id)) return nomsParId.get(t.assigne_id);
      return String(t.assigne_a || '').trim() || null;
    },
  });
}

// ── LECTURE : « qu'est-ce que j'ai demain ? », « montre-moi ma semaine » ──
async function planningPeriode(p) {
  const ctx = await contexteEquipe();
  const { debut, fin, libelle } = periodeDite(p);
  const [brutes, chantiers] = await Promise.all([
    listTachesPeriode(debut, fin), listChantiers(),
  ]);
  // Périmètre : un compagnon ne voit que les siennes. Un patron peut demander
  // « et moi ? » — d'où le drapeau `seulement_moi`.
  const seulementMoi = !ctx.encadrement || /^(1|true|oui)$/i.test(String(p.seulement_moi ?? ''));
  const taches = seulementMoi ? brutes.filter(ctx.estMienne) : brutes;

  const parChantier = Object.fromEntries(chantiers.map((c) => [c.id, c]));
  if (!taches.length) {
    return {
      message: seulementMoi
        ? `Rien ne vous est assigné ${libelle}.`
        : `Rien n'est planifié ${libelle}.`,
      lien: './planning.html',
    };
  }

  const parJour = new Map();
  for (const t of taches) {
    if (!t.jour) continue;
    if (!parJour.has(t.jour)) parJour.set(t.jour, []);
    parJour.get(t.jour).push(t);
  }

  const lignes = [];
  for (const iso of [...parJour.keys()].sort()) {
    const lot = parJour.get(iso).slice().sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
    // Heures de TRAVAIL : un séchage n'occupe personne.
    const h = lot.reduce((s, t) => s + (t.mobilise_artisan === false ? 0 : (Number(t.duree_h) || 0)), 0);
    const d = new Date(iso + 'T00:00:00');
    lignes.push(`${d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} — ${Math.round(h * 10) / 10} h`);
    for (const t of lot) {
      const c = parChantier[t.chantier_id];
      const qui = nomAssigne(t, ctx.parId);
      lignes.push(`  • ${t.titre} (${t.duree_h} h) — ${c ? (c.client_name || 'chantier') : 'chantier'}`
        + (c && c.adresse ? `, ${c.adresse}` : '')
        + (seulementMoi ? '' : ` — ${qui || 'non assigné'}`));
    }
  }
  return { message: `Votre planning ${libelle} :\n` + lignes.join('\n'), lien: './planning.html', data: taches };
}

// ── ÉCRITURE : « je commence la faïence » ──
async function demarrerTache(p) {
  const jour = dateDite(p.jour || p.date) || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const taches = await listTachesPeriode(jour, jour);
  const { tache, erreur } = trouverTache(taches, p.tache || p.titre || p.etape);
  if (erreur) throw new Error(erreur);
  if (tache.statut === 'en_cours') return { message: `« ${tache.titre} » est déjà en cours.`, lien: './planning.html' };
  if (tache.statut === 'termine') return { message: `« ${tache.titre} » est déjà terminée.`, lien: './planning.html' };
  await majStatutTache(tache.id, 'en_cours');
  return { message: `« ${tache.titre} » est passée en cours.`, lien: './planning.html' };
}

// ── ÉCRITURE : « mets Karim sur la chape mardi » ──
async function assignerTacheAction(p) {
  const ctx = await contexteEquipe();
  if (!ctx.encadrement) {
    throw new Error("Seul le responsable ou le chef d'équipe peut assigner une tâche.");
  }
  const { membre, erreur: errM } = resoudreMembre(ctx, p.membre || p.personne || p.qui);
  if (errM) throw new Error(errM);

  const jour = dateDite(p.jour || p.date);
  const bornes = jour ? { debut: jour, fin: jour } : periodeDite({ periode: 'semaine' });
  const taches = await listTachesPeriode(bornes.debut, bornes.fin);
  const { tache, erreur: errT } = trouverTache(taches, p.tache || p.titre || p.etape);
  if (errT) throw new Error(errT);

  await assignerTache(tache.id, membre);

  // Conflit APRÈS écriture, sur les données réelles : on ne l'enregistre pas en
  // silence, on le dit. La détection est celle du moteur, pas une seconde
  // implémentation.
  let alerte = '';
  try {
    const conflits = (await conflitsAutour(ctx, tache.jour))
      .filter((c) => norm(c.personne) === norm(ctx.nomComplet(membre)));
    if (conflits.length) alerte = '\n⚠ ' + conflits.map((c) => c.texte).join('\n⚠ ');
  } catch (e) { /* l'assignation est faite ; l'alerte est un plus */ }

  return {
    message: `« ${tache.titre} » est assignée à ${ctx.nomComplet(membre)}`
      + (tache.jour ? ` le ${new Date(tache.jour + 'T00:00:00').toLocaleDateString('fr-FR')}` : '')
      + '.' + alerte,
    lien: './planning.html',
  };
}

// ── ÉCRITURE : « décale la chape à jeudi » ──
async function deplacerTache(p) {
  const ctx = await contexteEquipe();
  const versBrut = p.vers || p.nouvelle_date || p.date_cible || p.jour_cible;
  // Résolu une première fois depuis aujourd'hui ; s'il s'agit d'un décalage
  // relatif (« d'un jour »), on le recalculera depuis la date de l'étape une
  // fois celle-ci trouvée — décaler d'un jour, c'est un jour après SA date.
  const relatif = !!(versBrut && /(?:^|\bde\s|\bd['’]|\+)\s*(?:un|une|\d{1,3})\s*(?:jour|semaine|mois)/i.test(String(versBrut)));
  let vers = dateDite(versBrut);
  // Depuis le 07/09 une étape peut porter une heure : « mets le dépannage
  // Benali à 14 h » est un déplacement valable sans changement de date.
  // « journee » (ou « toute la journée ») retire l'heure et rend l'étape à
  // la journée entière.
  const heureBrute = p.heure ?? p.heure_debut ?? p.horaire;
  const retirerHeure = heureBrute != null && /^(journ[ée]e|toute la journ[ée]e|sans heure)$/i.test(String(heureBrute).trim());
  const heure = retirerHeure ? null : normaliserHeure(heureBrute);
  if (heureBrute != null && !retirerHeure && !heure) {
    throw new Error(`« ${heureBrute} » n'est pas une heure que je sais lire. Dites par exemple « à 9 h » ou « 14 h 30 ».`);
  }
  if (!vers && heureBrute == null) {
    throw new Error("Vers quelle date faut-il décaler ? Dites par exemple « à jeudi » ou donnez la date.");
  }
  // On cherche la tâche dans une fenêtre large autour d'aujourd'hui, pour
  // pouvoir décaler une étape passée comme à venir.
  const today = new Date();
  const d1 = new Date(today); d1.setDate(d1.getDate() - 60);
  const d2 = new Date(today); d2.setDate(d2.getDate() + 120);
  const taches = await listTachesPeriode(ISO(d1), ISO(d2));
  const { tache, erreur } = trouverTache(taches, p.tache || p.titre || p.etape);
  if (erreur) throw new Error(erreur);

  const avant = tache.jour;
  const avantHeure = tache.heure_debut;
  // Le décalage relatif se recalcule depuis la date réelle de l'étape.
  if (relatif && tache.jour) {
    const rebase = dateDite(versBrut, new Date(tache.jour + 'T12:00:00'));
    if (rebase) vers = rebase;
  }
  const patch = { updated_at: new Date().toISOString() };
  if (vers) {
    patch.jour = vers;
    // LA FIN SUIT LE DÉBUT. Déplacer `jour` sans toucher `jour_fin` laissait la
    // fin à son ancienne date : sur cinq étapes de Copropriété Jaurès, la fin
    // se retrouvait AVANT le début (fin 20 août pour un début au 8 septembre),
    // et le tableau de bord en déduisait « Retard 19 j » sur un chantier qui
    // démarrait le jour même — au jour près (constaté en base le 08/09).
    // Une étape sur plusieurs jours garde sa durée : on décale la fin d'autant.
    if (tache.jour_fin && avant) {
      const ecart = Math.round(
        (new Date(vers + 'T12:00:00') - new Date(avant + 'T12:00:00')) / 86400000,
      );
      const f = new Date(tache.jour_fin + 'T12:00:00');
      f.setDate(f.getDate() + ecart);
      patch.jour_fin = ISO(f);
    }
  }
  if (heureBrute != null) patch.heure_debut = heure;   // null = retour à la journée
  const { error } = await supabase.from('taches')
    .update(patch).eq('id', tache.id);
  if (error) throw error;
  const jourFinal = vers || tache.jour;

  let alerte = '';
  try {
    const qui = nomAssigne({ ...tache, jour: jourFinal }, ctx.parId);
    const conflits = (await conflitsAutour(ctx, jourFinal))
      .filter((c) => !qui || norm(c.personne) === norm(qui));
    if (conflits.length) alerte = '\n⚠ ' + conflits.map((c) => c.texte).join('\n⚠ ');
  } catch (e) { /* le déplacement est fait */ }

  const fr = (iso) => iso ? new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR') : 'sans date';
  // Le message dit ce qui a VRAIMENT changé : la date, l'heure, ou les deux.
  let quoi;
  if (vers && heureBrute != null) {
    quoi = `du ${fr(avant)} au ${fr(vers)}${heure ? `, à ${heureLisible(heure)}` : ', sur la journée entière'}`;
  } else if (vers) {
    quoi = `du ${fr(avant)} au ${fr(vers)}`;
  } else {
    quoi = heure
      ? `${avantHeure ? `de ${heureLisible(avantHeure)} ` : ''}à ${heureLisible(heure)} le ${fr(jourFinal)}`
      : `sur la journée entière du ${fr(jourFinal)}`;
  }
  // L'ECHEANCE DU CHANTIER SUIT SES ETAPES (08/09). Decaler une etape au-dela
  // de la fin prevue laissait le chantier sur son ancienne date : il paraissait
  // fini alors qu'il restait du travail, et le repere de temps de l'ecran
  // Chantiers mentait. Le controle des regles metier a trouve deux chantiers
  // en cours SANS aucune echeance, tous deux avec des etapes.
  // On recalcule depuis les etapes reelles, jamais depuis une supposition.
  try {
    const { data: bornes } = await supabase
      .from('taches')
      .select('jour')
      .eq('chantier_id', tache.chantier_id)
      .not('jour', 'is', null)
      .order('jour', { ascending: false })
      .limit(1);
    const derniere = bornes && bornes[0] && bornes[0].jour;
    if (derniere) {
      await supabase.from('chantiers')
        .update({ date_fin_prevue: derniere })
        .eq('id', tache.chantier_id);
    }
  } catch (e) {
    // Le decalage a eu lieu : on ne le fait pas echouer pour une echeance.
    console.warn('[actions] echeance du chantier non recalculee', e);
  }

  // CE QUI VIENT APRÈS UN DÉCALAGE (Moctar, 08/09 : « est-ce qu'il compte
  // ensuite demander : est-ce que j'envoie un message au client, je préviens
  // l'équipe ? »). Décaler une étape ne concerne jamais l'artisan seul : le
  // client attendait un jour, et quelqu'un devait venir. On propose, il
  // décide — rien n'est envoyé sans son geste.
  const suites = [];
  let nomClient = '';
  try {
    const { data: ch } = await supabase.from('chantiers')
      .select('client_name').eq('id', tache.chantier_id).maybeSingle();
    nomClient = (ch && ch.client_name) || '';
  } catch (_) { /* on propose quand même, sans le nom */ }
  if (nomClient) {
    suites.push({
      libelle: 'Prévenir le client',
      question: `Écris un message court à ${nomClient} pour le prévenir que « ${tache.titre} » `
        + `est décalée ${quoi}. Reste factuel, sans excuse appuyée, et dis ce qui ne change pas.`,
    });
  }
  const porteur = nomAssigne(tache, ctx.parId);
  suites.push({
    libelle: porteur ? `Prévenir ${porteur}` : "Prévenir l'équipe",
    question: `Poste dans le fil d'équipe du chantier ${nomClient || 'concerné'} que `
      + `« ${tache.titre} » est décalée ${quoi}.`,
  });
  suites.push({
    libelle: 'Voir la semaine',
    question: `Qu'est-ce qui est planifié cette semaine, et qui est trop chargé ?`,
  });

  return {
    message: `« ${tache.titre} » est décalée ${quoi}.` + alerte,
    lien: './planning.html',
    geste: { suites },
  };
}

// « Préviens le client que son dossier avant travaux est disponible. »
// Nom d'action IMPOSÉ par les outils déclarés à l'assistant (v61) :
// `envoyer_dossier`, params `client_nom`, `type` ('avant'|'fin'). Même
// fonction que le bouton unique de chantier-dossier.js
// (js/supabase.js:envoyerDossierAuClient) : message dans le fil + e-mail
// best effort via l'Edge Function envoyer-dossier-client.
async function envoyerDossierAction(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.clientName);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.client || p.clientName || '?'} ».`);
  const type = (p.type || '').toLowerCase();
  if (!['avant', 'fin'].includes(type)) {
    throw new Error("Précisez le type de dossier : « avant » (avant travaux) ou « fin » (fin de chantier).");
  }
  const res = await envoyerDossierAuClient(chantier.id, type);
  const partis = (res.pieces || []).map((x) => x.label).filter(Boolean).join(', ');
  const manque = (res.manquantes || []).map((x) => x.label).filter(Boolean).join(', ');
  return {
    message: `Dossier ${type === 'avant' ? 'avant travaux' : 'de fin de chantier'} : `
      + `message envoyé à ${res.client_name}${res.email_envoye ? ' (+ e-mail)' : ' (e-mail non envoyé)'}.`
      + (partis ? `\nPièces : ${partis}.` : '')
      + (manque ? `\nManquantes : ${manque}.` : ''),
    lien: `./chantier.html?id=${chantier.id}`,
    data: res,
  };
}

// ── Rappels du dossier (lecture seule, 04/09/2026) ──────────────────────────
// Quatre alertes calculées sur tous les chantiers en cours ou terminés,
// jamais une écriture : sert la carte « L'assistant propose » de
// dashboard.html et chantier.html via `window.bsRappelsDossier()`, exposé
// plus bas. Chaque rappel porte son propre lien vers l'endroit qui le
// résout — on ne propose jamais une action qu'on ne peut pas montrer où faire.
async function rappelsDossier() {
  const tous = await listChantiers();
  const actifs = tous.filter((c) => ['en_cours', 'retard', 'termine'].includes(c.status));
  if (!actifs.length) return { message: 'Aucun chantier en cours.', data: [] };

  const ids = actifs.map((c) => c.id);
  const [{ data: taches }, { data: factures }, coffre] = await Promise.all([
    supabase.from('taches').select('chantier_id, statut, updated_at').in('chantier_id', ids),
    supabase.from('factures').select('chantier_id, type, statut, date_echeance, total_ttc').in('chantier_id', ids),
    listCoffreDocs().catch(() => []),
  ]);
  const aDecennale = (coffre || []).some((d) => d.categorie === 'decennale');
  const aRcPro = (coffre || []).some((d) => d.categorie === 'rc_pro');

  const parTaches = new Map();
  (taches || []).forEach((t) => { const l = parTaches.get(t.chantier_id) || []; l.push(t); parTaches.set(t.chantier_id, l); });
  const parFactures = new Map();
  (factures || []).forEach((f) => { const l = parFactures.get(f.chantier_id) || []; l.push(f); parFactures.set(f.chantier_id, l); });

  const auj = new Date();
  const joursEntre = (a, b) => Math.round((b - a) / 86400000);
  const rappels = [];

  for (const c of actifs) {
    const tTaches = parTaches.get(c.id) || [];
    const tFactures = parFactures.get(c.id) || [];
    const lienChantier = `./chantier.html?id=${c.id}`;
    const lienFactures = `./finances.html?onglet=factures&chantier=${c.id}`;

    // 1. Attestation manquante à J-3 du début.
    if (c.status !== 'termine' && c.date_debut && (!aDecennale || !aRcPro)) {
      const debut = new Date(c.date_debut + 'T00:00:00');
      const j = joursEntre(auj, debut);
      if (j >= 0 && j <= 3) {
        rappels.push({
          id: `attestation-${c.id}`, chantier_id: c.id, client_name: c.client_name,
          libelle: `${!aDecennale ? 'Décennale' : 'RC Pro'} absente`,
          texte: `${!aDecennale ? 'Décennale' : 'RC Pro'} absente, début chez ${c.client_name} ${j === 0 ? "aujourd'hui" : 'dans ' + j + ' j'}.`,
          lien: './coffre.html',
        });
      }
    }

    // 2. PV non signé, 3 jours après la dernière étape terminée.
    const terminees = tTaches.filter((t) => t.statut === 'termine');
    if (tTaches.length && terminees.length === tTaches.length) {
      const derniere = terminees.reduce((max, t) => (new Date(t.updated_at) > new Date(max.updated_at) ? t : max), terminees[0]);
      const j = joursEntre(new Date(derniere.updated_at), auj);
      if (j >= 3) {
        try {
          const { data: pv } = await supabase.from('pv_reception').select('signe_le')
            .eq('chantier_id', c.id).order('created_at', { ascending: false }).limit(1);
          if (!(pv && pv[0] && pv[0].signe_le)) {
            rappels.push({
              id: `pv-${c.id}`, chantier_id: c.id, client_name: c.client_name,
              libelle: `PV à faire signer`,
              texte: `PV à faire signer chez ${c.client_name} — dernière étape finie depuis ${j} j.`,
              lien: lienChantier,
            });
          }
        } catch (_) { /* rappel manqué plutôt que planté */ }
      }
    }

    // 3. Facture de solde absente après terminé.
    if (c.status === 'termine' && !tFactures.some((f) => f.type === 'solde')) {
      rappels.push({
        id: `solde-${c.id}`, chantier_id: c.id, client_name: c.client_name,
        libelle: `Facture de solde`,
        texte: `Facture de solde absente chez ${c.client_name}, le chantier est terminé.`,
        lien: lienFactures,
      });
    }

    // 4. Facture à échéance sous 2 jours, non payée.
    tFactures.filter((f) => f.statut === 'envoyee' && f.date_echeance).forEach((f) => {
      const ech = new Date(f.date_echeance + 'T12:00:00');
      const j = joursEntre(auj, ech);
      if (j >= 0 && j <= 2) {
        rappels.push({
          id: `echeance-${c.id}-${f.date_echeance}`, chantier_id: c.id, client_name: c.client_name,
          libelle: `Facture à échéance`,
          texte: `Facture de ${c.client_name} à échéance ${j === 0 ? "aujourd'hui" : 'dans ' + j + ' j'}, pas encore payée.`,
          lien: lienFactures,
        });
      }
    });

    // 5. Facture de situation à émettre : chantier en cours, plus de la
    // moitié des étapes faites, depuis plus de 14 jours, et rien émis
    // depuis l'acompte (ni situation ni solde). Proposé, jamais imposé —
    // c'est finances.html qui pré-chiffre le montant si l'artisan clique.
    if (c.status !== 'termine' && tTaches.length && c.date_debut) {
      const pctRealise = Math.round((terminees.length / tTaches.length) * 100);
      const dureeJours = joursEntre(new Date(c.date_debut + 'T00:00:00'), auj);
      const aSituationOuSolde = tFactures.some((f) => f.type === 'situation' || f.type === 'solde');
      if (pctRealise > 50 && dureeJours > 14 && !aSituationOuSolde) {
        rappels.push({
          id: `situation-${c.id}`, chantier_id: c.id, client_name: c.client_name,
          libelle: `Facture de situation`,
          texte: `Facture de situation à émettre chez ${c.client_name} (${pctRealise} % réalisé).`,
          lien: lienFactures,
        });
      }
    }
  }

  return {
    message: rappels.length ? `${rappels.length} rappel(s) de dossier.` : 'Aucun rappel de dossier pour l’instant.',
    data: rappels,
  };
}

// Exposé pour la carte « L'assistant propose » de dashboard.html et
// chantier.html — dynamiquement `import('./js/app-actions.js')` avant appel,
// le chargement du module suffit à poser ce global. `chantierId` filtre sur
// un seul chantier (utile dans chantier.html) ; omis, renvoie tout.
window.bsRappelsDossier = async (chantierId) => {
  try {
    const { data } = await rappelsDossier();
    return chantierId ? (data || []).filter((r) => r.chantier_id === chantierId) : (data || []);
  } catch (_) {
    return [];
  }
};

// ── Navigation (04/09/2026) ──────────────────────────────────────────────
// ouvrir_ecran et prendre_photo ne lisent ni n'écrivent aucune donnée : ils
// déplacent l'artisan dans l'application. Exécution immédiate, comme une
// lecture, mais un outil de navigation n'appartient jamais à LECTURES —
// bsAstRendreProposition (app-assistant.js) traite les deux ensembles pareil
// (pas de carte Valider) mais ce sont deux ensembles disjoints, pour que le
// test d'outils (test_outils_assistant.py) les distingue clairement.
// `trouverChantier` (recherche par client_name/adresse) et `trouverMembre`
// (recherche par prénom/nom/email) existent déjà plus haut dans ce fichier :
// on les réutilise tels quels plutôt que d'écrire trouverChantierParClient.
async function ouvrirEcran(p) {
  const page = {
    devis: 'devis.html', chantiers: 'dashboard.html', chantier: 'chantier.html',
    planning: 'planning.html', photos: 'photos.html', finances: 'finances.html',
    analyses: 'analyses.html', equipe: 'equipe.html', messages: 'messages.html',
    dm: 'dm.html', entreprise: 'profile-entreprise.html', coffre: 'coffre.html',
  }[p.ecran];
  if (!page) return { message: `Écran « ${p.ecran} » inconnu.` };
  const q = new URLSearchParams();
  if (p.chantier_client) {
    const ch = await trouverChantier(p.chantier_client);
    if (!ch) return { message: `Aucun chantier pour « ${p.chantier_client} ».` };
    q.set('id', ch.id);
    if (p.ecran === 'photos') { q.delete('id'); q.set('chantier', ch.id); }
  }
  // « Ouvre mon dernier devis » (Moctar, 12/09) : c'est LE devis le plus récent
  // qu'on ouvre, pas la page « Mes devis ». Déterministe ici : le modèle n'a
  // qu'à poser `dernier`, il ne devine aucun numéro.
  if (p.dernier || /^(dernier|le dernier|mon dernier|r[ée]cent|le plus r[ée]cent)$/i.test(String(p.devis_numero || '').trim())) {
    const tous = await chargerDevis({});
    if (!tous.length) return { message: "Vous n'avez aucun devis pour l'instant." };
    q.set('id', tous[0]._dbId || tous[0].id);   // chargerDevis trie par created_at desc
  } else if (p.devis_numero) {
    const d = await trouverDevis(p.devis_numero);
    if (!d) return { message: `Aucun devis pour « ${p.devis_numero} ».` };
    q.set('id', d._dbId || d.id);
  }
  if (p.onglet) q.set('onglet', p.onglet);
  if (p.vue) q.set('vue', p.vue);
  if (p.date) q.set('date', p.date);
  if (p.periode) q.set('periode', p.periode);
  if (p.filtre) q.set('filtre', p.filtre);
  if (p.collegue) {
    const m = await trouverMembre(p.collegue);
    if (!m) return { message: `Je ne trouve pas « ${p.collegue} » dans l'équipe.` };
    q.set('avec', m.user_id);
  }
  const hash = (p.ecran === 'chantier' && p.onglet) ? '#' + p.onglet : '';
  location.href = `./${page}${q.toString() ? '?' + q : ''}${hash}`;
  return { message: `J'ouvre ${p.ecran}.` };
}

async function prendrePhoto(p) {
  if (p.usage === 'metre' || p.usage === 'ticket') {
    const usage = p.usage === 'ticket' ? 'ocr' : 'metre';
    // La tentative d'ouverture directe reste (elle marche sur un poste fixe),
    // mais elle ne peut PAS être le seul chemin : voir le commentaire du
    // `geste` dans devisDepuisPhoto — sans activation utilisateur, le clic sur
    // l'input fichier est ignoré sans erreur. Le bouton, lui, part d'un vrai
    // appui de l'artisan.
    window.bsAssistantOuvrirPhoto(usage);
    return {
      message: "J'ouvre l'appareil photo... si rien ne s'affiche, touchez « Prendre une photo ».",
      geste: { photo: usage, libelle: 'Prendre une photo' },
    };
  }
  let ch = null;
  if (p.chantier_client) {
    ch = await trouverChantier(p.chantier_client);
    if (!ch) return { message: `Aucun chantier pour « ${p.chantier_client} ». Dites-moi le nom exact du client.` };
  }
  location.href = `./photos.html?phase=${encodeURIComponent(p.usage)}${ch ? '&chantier=' + ch.id : ''}&declencher=1`;
  return { message: "J'ouvre l'appareil photo... si rien ne s'affiche, touchez « Prendre une photo »." };
}

// ── devis_depuis_photo (05/09/2026) : un geste au lieu de trois ──────────
//
// L'artisan est dans la pièce. Il dit « fais-moi un devis peinture de cette
// pièce en photo ». Avant, il lui fallait trois gestes : demander la photo,
// lire le métré, redicter les surfaces pour obtenir un devis. Ici l'outil pose
// un crochet, ouvre l'appareil photo, et quand le métré revient il relance
// l'assistant tout seul avec l'ouvrage ET les cotes. Le chiffrage repasse par
// creer_devis, avec sa carte de validation : rien n'est écrit sans l'artisan.
//
// AUCUNE SURFACE N'EST DÉDUITE ICI. Le serveur (`scan-room-photo`) renvoie une
// surface au sol, une hauteur sous plafond, parfois une longueur et une largeur,
// et le compte des ouvertures : on transmet ces relevés tels quels. Déduire une
// surface de murs dans ce fichier reviendrait à réécrire une deuxième fois les
// règles de métré qui vivent dans le socle (module `metre` : « périmètre dicté →
// l'utiliser ») — et c'est exactement ce genre de règle dupliquée qui avait
// donné le faux « 3 × S ». Le périmètre, lui, est transmis quand les deux cotes
// sont là : 2 × (L + l) est de l'arithmétique sur deux mesures, pas une règle.
//
// La photo est une ESTIMATION, jamais un métré. La phrase envoyée le dit en
// toutes lettres, pour que l'artisan le lise sur la carte avant de valider.

// Un métré arrivé plus de dix minutes après la demande n'est plus la réponse à
// cette demande : l'artisan a pu annuler l'appareil photo, ranger son téléphone,
// puis photographier une autre pièce pour une autre raison. Le crochet se
// périme plutôt que de chiffrer la mauvaise pièce.
const DELAI_CROCHET_METRE_MS = 10 * 60 * 1000;

function m2(v) {
  return Number(v).toFixed(1).replace('.', ',');
}

/** Une ligne de l'assistant, dans le fil, sans passer par le modèle. Sert aux
 * chemins d'échec : un devis promis puis abandonné doit se dire, sinon
 * l'artisan attend devant son téléphone. */
function direAssistant(texte) {
  if (typeof window.bsAssistantDireBot === 'function') window.bsAssistantDireBot(texte);
}

/** Phrase renvoyée à l'assistant : l'ouvrage dit par l'artisan + les cotes
 * relevées par le serveur, sans rien y ajouter.
 *
 * SEUL point de composition de cette phrase dans toute l'application : les
 * trois entrées « devis depuis une photo » (l'outil de l'assistant, le bouton
 * de photos.html, la chip de devis.html) passent toutes par ici. Trois copies
 * divergentes, c'est trois métrés différents pour la même photo — c'est
 * exactement ce qui avait donné le faux « 3 × S ». Exportée, et posée sur
 * `window` (voir le bas du fichier) pour les écrans en script classique. */
export function phraseDevisDepuisPhoto(ouvrage, m, client) {
  const cotes = [];
  cotes.push(`sol ${m2(m.surfaceEstimeeM2)} m²`);
  if (Number(m.hauteurSousPlafondM) > 0) cotes.push(`hauteur sous plafond ${m2(m.hauteurSousPlafondM)} m`);
  const L = Number(m.longueurEstimeeM), l = Number(m.largeurEstimeeM);
  if (L > 0 && l > 0) {
    cotes.push(`longueur ${m2(L)} m × largeur ${m2(l)} m`);
    cotes.push(`périmètre ${m2(2 * (L + l))} m`);
  }
  const ouv = m.ouvertures || {};
  const portes = Number(ouv.portes) || 0;
  const fenetres = Number(ouv.fenetres) || 0;
  if (portes > 0) cotes.push(`${portes} porte${portes > 1 ? 's' : ''}`);
  if (fenetres > 0) cotes.push(`${fenetres} fenêtre${fenetres > 1 ? 's' : ''}`);
  const inconnu = (v) => !v || norm(v).indexOf('indetermin') === 0;
  if (!inconnu(m.revetementSolExistant)) cotes.push(`sol existant : ${m.revetementSolExistant}`);
  if (!inconnu(m.revetementMursExistant)) cotes.push(`murs existants : ${m.revetementMursExistant}`);

  const piece = m.typePiece && norm(m.typePiece) !== 'autre' ? m.typePiece : 'pièce';
  return `${(ouvrage || '').toString().trim()} — ${piece}${client ? ` chez ${client}` : ''}, surfaces mesurées : `
    + cotes.join(', ')
    + '. (Surfaces estimées depuis une photo, à confirmer sur place.)';
}

async function devisDepuisPhoto(p) {
  const ouvrage = (p.ouvrage || '').toString().trim();
  if (!ouvrage) {
    return { message: "Dites-moi ce qu'il y a à chiffrer dans cette pièce (peinture des murs, carrelage au sol...) et je pars de votre photo." };
  }
  if (typeof window.bsAssistantOuvrirPhoto !== 'function'
      || typeof window.bsAssistantEnvoyerQuestion !== 'function') {
    return { message: "Je ne peux pas ouvrir l'appareil photo depuis cet écran. Ouvrez l'assistant, puis touchez l'appareil photo." };
  }

  // Le client n'est qu'une mention dans la phrase : jamais un blocage. Si le
  // chantier ne se résout pas (nom inconnu, plusieurs candidats), on chiffre
  // quand même — l'artisan corrigera le client sur la carte du devis.
  let client = '';
  try {
    const { chantier } = await resoudreChantier(p);
    if (chantier) client = chantier.client_name || '';
  } catch (_) { /* la photo passe avant la fiche client */ }

  const poseA = Date.now();
  window.bsApresMetre = function (metre, raison) {
    window.bsApresMetre = null; // un métré, un chiffrage : le crochet ne resert pas
    // Un devis a été promis à l'artisan (« je chiffre ... ensuite »). Chaque
    // sortie sans devis le lui dit : un silence sur une promesse, c'est un
    // artisan qui attend devant son téléphone.
    if (Date.now() - poseA > DELAI_CROCHET_METRE_MS) {
      direAssistant("Pas de devis : votre demande date de plus de dix minutes, je ne chiffre pas cette photo. Redemandez-moi le devis depuis la photo.");
      return;
    }
    if (raison === 'annule') {
      direAssistant("Pas de devis : aucune photo n'a été prise. Reprenez une photo ou dictez-moi les surfaces.");
      return;
    }
    // Métré absent ou sans surface : bsAfficherMetre n'a rien affiché de fiable
    // (photo illisible, serveur muet). On ne chiffre pas sur du vide.
    if (!metre || !(Number(metre.surfaceEstimeeM2) > 0)) {
      direAssistant("Pas de devis : le métré n'a pas abouti. Dites-moi les surfaces ou reprenez une photo.");
      return;
    }
    window.bsAssistantEnvoyerQuestion(phraseDevisDepuisPhoto(ouvrage, metre, client));
  };

  // L'appareil photo N'EST PAS ouvert ici, et c'est volontaire.
  //
  // 1. Le message doit être à l'écran AVANT la caméra : sur mobile le sélecteur
  //    de fichier est une vue plein écran, et l'appelant ne peint `message`
  //    qu'après la résolution de cette promesse — l'artisan lisait la phrase en
  //    revenant de la caméra, pas avant d'y entrer.
  // 2. Surtout : `input[type=file].click()` déclenché depuis une continuation
  //    async, après un aller-retour réseau vers le modèle, n'a plus
  //    d'activation utilisateur transitoire. Chrome et Safari l'ignorent alors
  //    SILENCIEUSEMENT : l'artisan lit « prenez la photo » et rien ne s'ouvre.
  //
  // Le bouton `geste` (rendu par app-assistant.js) rouvre la caméra depuis un
  // vrai appui de l'artisan. Le crochet, lui, est déjà armé et attend.
  return {
    message: `Prenez la photo de la pièce, je chiffre « ${ouvrage} » ensuite.`,
    geste: { photo: 'metre', libelle: 'Prendre la photo' },
  };
}

// ── modifier_devis (05/09/2026) ────────────────────────────
// Modifie un devis EXISTANT, ligne par ligne, sans le recreer. Rien n'est
// envoye au client. Tout est deterministe : aucune de ces operations ne passe
// par le modele, et AUCUN PRIX N'EST INVENTE. Un prix que l'artisan n'a pas dit
// reste a 0 et le message le dit (« prix a saisir »).
//
// Le seul prix repris automatiquement est un prix que l'artisan a LUI-MEME
// saisi dans sa grille (source « Saisie Artisan »). Les lignes du catalogue
// livre avec l'application (source « Catalogue BatiSpot ») sont ignorees : ce
// ne sont pas ses prix, et un devis part chez son client a son nom.

const TVA_ADMISES = [5.5, 10, 20];
const PREFIXE_REMISE = 'Remise commerciale';

// Comparaison de libelles : sans accents, sans casse, espaces normalises.
function sansAccents(s) {
  return (s == null ? '' : String(s))
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
}

function nbFr(n) {
  return Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

// Sources qui font d'une ligne de grille un prix DE L'ARTISAN. La liste de
// reference vit dans app-knowledge-btp.js (BtpPriceGridManager.SOURCES_ARTISAN) ;
// la copie ci-dessous ne sert que si ce script n'est pas charge sur l'ecran.
// 'Catalogue BatiSpot' n'en fait jamais partie : ce sont les 10 lignes livrees
// avec l'application, pas les tarifs de l'artisan.
function sourcesArtisan() {
  const g = (typeof window !== 'undefined') ? window.BtpPriceGridManager : null;
  return (g && Array.isArray(g.SOURCES_ARTISAN))
    ? g.SOURCES_ARTISAN
    : ['Saisie Artisan', 'Ajusté manuellement', 'Assistant'];
}

function grilleArtisan() {
  try {
    const g = (typeof window !== 'undefined') ? window.BtpPriceGridManager : null;
    if (!g) return [];
    const items = (typeof g.getGrid === 'function') ? g.getGrid() : g.items;
    return Array.isArray(items) ? items : [];
  } catch (_) {
    return [];
  }
}

// Cherche un prix dans LA GRILLE DE L'ARTISAN, a unite egale.
// Renvoie null des que le choix n'est pas evident : deux tarifs differents
// aussi plausibles l'un que l'autre, c'est a l'artisan de trancher, pas a nous.
function prixDeSaGrille(designation, unite) {
  const d = sansAccents(designation);
  if (!d) return null;
  const u = sansAccents(unite);
  const mots = d.split(' ').filter((m) => m.length >= 4);
  let meilleur = null;
  let score = 0;
  let exaequo = false;
  grilleArtisan().forEach((it) => {
    // 'Ajusté manuellement' reste un prix DE L'ARTISAN (il l'a corrigé lui-même),
    // 'Assistant' aussi (il l'a dicté à l'assistant, qui ne l'invente jamais) ;
    // 'Catalogue BatiSpot' ne l'est jamais — ce sont les 10 lignes livrées avec
    // l'app (faïence à 55 €/m², carrelage à 48 €/m²…), jamais celles de l'artisan.
    if (!it || !sourcesArtisan().includes(it.source)) return;
    if (!(Number(it.price) > 0)) return;
    if (u && sansAccents(it.unit) !== u) return;
    const lab = sansAccents(it.label);
    if (!lab) return;
    let s;
    if (lab === d) s = 100;
    else if (lab.includes(d) || d.includes(lab)) s = 50;
    else s = mots.filter((m) => lab.includes(m)).length;
    if (s <= 0) return;
    if (s > score) { score = s; meilleur = it; exaequo = false; }
    else if (s === score && meilleur && Number(meilleur.price) !== Number(it.price)) exaequo = true;
  });
  if (!meilleur || exaequo) return null;
  return { prix: Number(meilleur.price), label: meilleur.label };
}

function listerLignes(lignes) {
  return lignes.map((l, i) => `${i + 1}. ${l.description}`).join(' · ');
}

// Ligne visee par son numero (1, 2…) ou par son libelle. Une reference
// ambigue ne modifie RIEN : on redemande laquelle.
function indexLigne(lignes, ref) {
  const brut = (ref == null ? '' : String(ref)).trim();
  if (!brut) {
    throw new Error(`Quelle ligne ? ${listerLignes(lignes)}.`);
  }
  if (/^\d+$/.test(brut)) {
    const i = parseInt(brut, 10) - 1;
    if (i < 0 || i >= lignes.length) {
      throw new Error(`Ce devis a ${lignes.length} ligne${lignes.length > 1 ? 's' : ''} : il n'y a pas de ligne ${brut}.`);
    }
    return i;
  }
  const q = sansAccents(brut);
  const trouves = [];
  lignes.forEach((l, i) => { if (sansAccents(l.description).includes(q)) trouves.push(i); });
  if (!trouves.length) {
    throw new Error(`Aucune ligne « ${brut} » dans ce devis. Les lignes sont : ${listerLignes(lignes)}.`);
  }
  if (trouves.length > 1) {
    throw new Error(`Plusieurs lignes correspondent à « ${brut} » : ${trouves.map((i) => `${i + 1}. ${lignes[i].description}`).join(' · ')}. Laquelle ?`);
  }
  return trouves[0];
}

function estLigneRemise(l) {
  return sansAccents(l.description).startsWith(sansAccents(PREFIXE_REMISE));
}

// Remise commerciale globale, exprimee en lignes negatives — le modele de
// devis n'a pas de champ « remise », et en inventer un ne survivrait pas a
// l'enregistrement (devis-store.js n'ecrit que des lignes et des totaux).
// Une remise par taux de TVA : sur un devis mixte 10 % / 20 %, une remise
// unique fausserait la TVA collectee. Elle REMPLACE la precedente : « fina-
// lement 10 % » ne doit pas s'ajouter aux 5 % deja poses.
function appliquerRemise(lignes, pct) {
  const base = lignes.filter((l) => !estLigneRemise(l));
  const parTaux = new Map();
  base.forEach((l) => {
    const t = Number(l.vatRate) || 0;
    parTaux.set(t, (parTaux.get(t) || 0) + (Number(l.total_ht) || 0));
  });
  const lot = base.length ? base[base.length - 1].lot : null;
  const plusieurs = parTaux.size > 1;
  const remises = [];
  parTaux.forEach((ht, t) => {
    if (!(ht > 0)) return;
    const montant = -(ht * pct) / 100;
    remises.push({
      lot,
      description: `${PREFIXE_REMISE} ${nbFr(pct)} %` + (plusieurs ? ` (TVA ${nbFr(t)} %)` : ''),
      quantity: 1,
      unit: 'forfait',
      unitPrice: montant,
      vatRate: t,
      total_ht: montant,
    });
  });
  return base.concat(remises);
}

// ── LA remise, une seule forme dans toute l'application ────────────────────
//
// Une remise ne touche JAMAIS les prix de l'artisan : elle s'ecrit en ligne
// negative « Remise commerciale X % », une par taux de TVA (appliquerRemise
// ci-dessus), a partir d'un POURCENTAGE que l'artisan a dicte. C'est vrai a la
// creation (creer_devis), a la modification (modifier_devis, operation
// « remise »), et sur un avenant — ou elle se pose apres coup, sur la nouvelle
// version, parce que les lignes y reviennent reecrites par le serveur.
//
// Le champ `discount` par ligne n'existe plus nulle part (05/09/2026) : il ne
// disait ni son unite (5 % ? 5 EUR ?) ni son assiette, personne ne le lisait,
// et une remise dictee etait annoncee sans etre appliquee. Voir aussi le refus
// de `discount` dans recollerPrix (devis-store.js).

// Le pourcentage dicte, ou null s'il n'y en a pas. Meme borne que l'operation
// « remise » de modifier_devis : au-dela, on demande plutot que de deviner.
function remiseDictee(p) {
  const brut = (p && (p.remise_pourcentage != null ? p.remise_pourcentage
    : (p.remise_pct != null ? p.remise_pct : p.remise)));
  if (brut == null || brut === '') return null;
  const pct = Number(brut);
  if (!Number.isFinite(pct) || pct === 0) return null;
  if (pct < 0 || pct >= 100) throw new Error("Quel pourcentage de remise ? (entre 0 et 100)");
  return pct;
}

// Montant HT de la remise, calcule sur les lignes DEJA chiffrees. 0 si le devis
// n'a encore aucun prix : il n'y a alors rien a remiser.
function montantRemise(lignes, pct) {
  const ht = lignes
    .filter((l) => !estLigneRemise(l))
    .reduce((s, l) => s + (Number(l.total_ht) || 0), 0);
  return ht > 0 ? -(ht * pct) / 100 : 0;
}

// Applique la remise dictee aux lignes d'un devis en cours de creation, et rend
// la phrase qui dit ce qui en a ete fait — posee, ou pas posee et pourquoi.
function poserRemiseCreation(lignes, p) {
  const pct = remiseDictee(p);
  if (pct == null) return { lignes, message: '' };
  const montant = montantRemise(lignes, pct);
  if (!montant) {
    return {
      lignes,
      message: `\n\n⚠ Remise ${nbFr(pct)} % NON appliquée : les prix de ce devis sont encore à saisir`
        + ` (0 €), il n'y a rien à remiser. Saisissez vos prix, puis dites`
        + ` « applique ${nbFr(pct)} % de remise ».`,
    };
  }
  return {
    lignes: appliquerRemise(lignes, pct),
    message: `\n\nRemise ${nbFr(pct)} % : ${euro(montant)} HT, en ligne négative`
      + ` (une par taux de TVA). Vos prix unitaires n'ont pas bougé.`,
  };
}

/**
 * Ce que l'action fera d'une remise, DIT SUR LA CARTE avant validation.
 *
 * Le corps de la carte, c'est `resume_humain` — un texte du modele. Une remise
 * qu'il annonce et que le code ne pose pas est exactement le bug du 05/09 :
 * cette ligne-ci est ecrite par le code qui l'appliquera, pas par le modele.
 * Rend '' quand il n'y a rien a dire.
 */
// Aperçu du MESSAGE qu'une action va envoyer (Moctar 06/09, capture 15h :
// « Message d'information de report pour Mme Ravier » proposé sans montrer le
// message). La carte l'affiche dans une zone modifiable ; le texte retouché
// repart dans params.message et c'est LUI qui est envoyé.
export async function apercuMessage(nom, params) {
  const p = params || {};
  try {
    if (nom === 'envoyer_message') {
      return { texte: String(p.message || '').trim(), titre: "Message qui sera publié sur le fil d'équipe (le client ne le voit pas)" };
    }
    if (nom === 'envoyer_message_client') {
      const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
      return { texte: String(p.message || '').trim(), titre: `Message qui sera envoyé à ${chantier ? chantier.client_name : 'votre client'}${chantier && chantier.client_email ? ' (' + chantier.client_email + ')' : ''}` };
    }
    // (A57, audit 12/09) : preparer_relance affichait « Envoyer au client »
    // SANS le texte — l'artisan envoyait un message qu'il n'avait pas lu.
    if (nom === 'relancer_client' || nom === 'preparer_relance') {
      const chantier = await trouverChantier(p.client_nom || p.client || p.clientName);
      if (!chantier) return null;
      const override = String(p.message || '').trim();
      const { texte } = override ? { texte: override } : await detecterRelance(chantier, p.objet);
      if (!texte) return null;
      const email = (chantier.client_email || '').trim();
      const tel = telAppelable(chantier.client_phone);
      const ou = [email ? `e-mail ${email}` : '', tel ? `WhatsApp ${tel}` : ''].filter(Boolean).join(' · ');
      return { texte, titre: `Message qui sera envoyé à ${chantier.client_name}${ou ? ' (' + ou + ')' : ''}` };
    }
  } catch (_) { /* pas d'aperçu plutôt qu'une carte cassée */ }
  return null;
}

export function detailProposition(nom, params) {
  const p = params || {};
  try {
    if (nom === 'creer_devis') {
      const pct = remiseDictee(p);
      if (pct == null) return '';
      const montant = montantRemise(normaliserLignes(p.lignes || p.items || p.lines), pct);
      return montant
        ? `Remise ${nbFr(pct)} % : ${euro(montant)} HT, posée en ligne négative (une par taux de TVA). Vos prix unitaires ne bougent pas.`
        : `Remise ${nbFr(pct)} % : rien à remiser, les prix sont encore à saisir (0 €). Le devis sera enregistré sans elle.`;
    }
    if (nom === 'modifier_devis') {
      const ops = Array.isArray(p.operations) ? p.operations : [];
      const op = ops.filter((o) => o && norm(o.type) === 'remise').slice(-1)[0];
      if (!op) return '';
      const pct = remiseDictee({ remise_pourcentage: op.pourcentage != null ? op.pourcentage : op.remise });
      if (pct == null) return '';
      return `Remise ${nbFr(pct)} % : posée en ligne négative (une par taux de TVA), elle remplace la précédente. Vos prix unitaires ne bougent pas.`;
    }
  } catch (err) {
    // Un apercu ne doit jamais empecher la carte de s'afficher. Le refus, lui,
    // se dit AVANT le clic (« entre 0 et 100 ») plutot qu'apres : c'est le meme
    // message que celui que l'execution lancerait.
    return (err && err.message) ? err.message : '';
  }
  return '';
}

// ── Resolution d'un devis, UN SEUL endroit ────────────────────────────────
//
// Extraite de modifierDevis le 05/09/2026, quand partager_devis et
// signer_sur_ecran ont eu besoin de la meme recherche. Trois copies de cette
// logique auraient fini par diverger, et « imprime le devis Ravier » aurait
// designe un autre devis que « modifie le devis Ravier ».
//
// Ordre : le devis A L'ECRAN d'abord (« ce devis » = celui qu'il regarde),
// puis le numero exact, puis le nom du client. Plusieurs clients possibles →
// on DEMANDE lequel, on n'en choisit jamais un : agir sur le mauvais devis
// d'un client est pire que ne rien faire. Introuvable → message clair, aucune
// action de repli.
//
// `verbe` n'entre que dans les messages (« faut-il modifier ? », « Lequel
// voulez-vous partager ? ») — la recherche, elle, est identique pour tous.
async function resoudreDevisUI(p, verbe) {
  const ctx = (typeof window !== 'undefined' && typeof window.bsContexteEcran === 'function')
    ? (window.bsContexteEcran() || {})
    : {};
  const ref = (p.devis_ref || p.numero || p.devis || '').toString().trim();

  const { quotes } = await chargerDevisUI();
  if (!quotes.length) throw new Error("Aucun devis enregistré pour l'instant.");

  let cible = null;
  if (!ref && ctx.devis_id) cible = quotes.find((q) => q._dbId === ctx.devis_id) || null;
  if (!cible && !ref && ctx.devis_numero) cible = quotes.find((q) => q.id === ctx.devis_numero) || null;
  if (!cible && ref) {
    const r = sansAccents(ref);
    cible = quotes.find((q) => sansAccents(q.id) === r) || null;
    if (!cible) {
      const parClient = quotes.filter((q) => sansAccents(q.client).includes(r));
      if (parClient.length > 1) {
        throw new Error(
          `Plusieurs devis correspondent à « ${ref} » : `
          + parClient.map((q) => `${q.id} (${q.client}, ${euro(q.totTtc)})`).join(' · ')
          + `. Lequel voulez-vous ${verbe} ?`
        );
      }
      cible = parClient[0] || null;
    }
  }
  if (!cible) {
    throw new Error(ref
      ? `Je ne trouve aucun devis « ${ref} ».`
      : `Quel devis faut-il ${verbe} ? Donnez-moi son numéro ou le nom du client.`);
  }
  return { cible, quotes, ctx, ref };
}

async function modifierDevis(p) {
  const ops = Array.isArray(p.operations)
    ? p.operations
    : (p.operations ? [p.operations] : []);
  if (!ops.length) throw new Error("Dites-moi ce qu'il faut changer sur ce devis.");

  const { cible, ctx } = await resoudreDevisUI(p, 'modifier');

  // La signature porte sur le CONTENU EXACT du devis : le modifier apres coup
  // rendrait faux le document que le client a signe.
  if (cible.status === 'signe' || /accept|sign/i.test(cible.statusLabel || '')) {
    throw new Error(`Ce devis (${cible.id}) est signé : je peux préparer une nouvelle version (avenant).`);
  }

  const quote = completerQuote(Object.assign({}, cible));
  let lignes = lotsVersLignes(quote.lots, Number(quote.totHt) || 0, Number(quote.totTva) || 0);
  const faits = [];
  let clientMaj = null;
  // Dernier pourcentage de remise vu dans les operations — appliqué UNE fois
  // après la boucle (voir plus bas), sur l'état final des lignes. L'appliquer
  // à chaque occurrence pendant la boucle la ferait porter sur un état
  // intermédiaire : « remise 5 % » puis « ajoute une ligne » calculerait la
  // remise sans cette ligne.
  let remisePct = null;

  for (const op of ops) {
    const type = sansAccents(op && (op.type || op.operation)).replace(/ /g, '_');
    switch (type) {
      case 'ajouter_ligne': {
        const desig = (op.designation || op.description || op.libelle || '').toString().trim();
        if (!desig) throw new Error("Quelle prestation faut-il ajouter au devis ?");
        const qte = Number(op.quantite != null ? op.quantite : op.quantity);
        const quantity = Number.isFinite(qte) && qte > 0 ? qte : 1;
        const unit = ((op.unite || op.unit || 'u').toString().trim()) || 'u';
        const derniere = lignes.filter((l) => !estLigneRemise(l)).slice(-1)[0] || null;
        let vatRate = Number(op.tva);
        if (vatRate > 0 && vatRate <= 1) vatRate *= 100;
        if (!TVA_ADMISES.includes(vatRate)) {
          vatRate = derniere ? Number(derniere.vatRate) : 10;
        }
        const prixDit = Number(op.prix_ht != null ? op.prix_ht : op.unitPrice);
        let unitPrice = 0;
        let mention = ' (prix à saisir)';
        if (Number.isFinite(prixDit) && prixDit > 0) {
          unitPrice = prixDit;
          mention = ` à ${euro(unitPrice)}/${unit}`;
        } else {
          const g = prixDeSaGrille(desig, unit);
          if (g) {
            unitPrice = g.prix;
            mention = ` à ${euro(unitPrice)}/${unit} (prix repris de votre grille)`;
          }
        }
        lignes.push({
          lot: derniere ? derniere.lot : null,
          description: desig,
          quantity,
          unit,
          unitPrice,
          vatRate,
          total_ht: quantity * unitPrice,
        });
        faits.push(`+ ${desig} ${nbFr(quantity)} ${unit}${mention}`);
        break;
      }
      case 'retirer_ligne':
      case 'supprimer_ligne': {
        const i = indexLigne(lignes, op.ligne != null ? op.ligne : op.designation);
        const [enlevee] = lignes.splice(i, 1);
        faits.push(`− ${enlevee.description}`);
        break;
      }
      case 'modifier_quantite': {
        const i = indexLigne(lignes, op.ligne != null ? op.ligne : op.designation);
        const qte = Number(op.quantite != null ? op.quantite : op.quantity);
        if (!Number.isFinite(qte) || qte <= 0) {
          throw new Error(`Quelle quantité pour « ${lignes[i].description} » ?`);
        }
        lignes[i].quantity = qte;
        lignes[i].total_ht = qte * (Number(lignes[i].unitPrice) || 0);
        faits.push(`${lignes[i].description} : ${nbFr(qte)} ${lignes[i].unit}`);
        break;
      }
      case 'modifier_prix': {
        const i = indexLigne(lignes, op.ligne != null ? op.ligne : op.designation);
        const prix = Number(op.prix_ht != null ? op.prix_ht : op.unitPrice);
        if (!Number.isFinite(prix) || prix < 0) {
          throw new Error(`Quel prix unitaire HT pour « ${lignes[i].description} » ?`);
        }
        lignes[i].unitPrice = prix;
        lignes[i].total_ht = (Number(lignes[i].quantity) || 0) * prix;
        faits.push(`${lignes[i].description} : ${euro(prix)}/${lignes[i].unit}`);
        break;
      }
      case 'modifier_tva': {
        let t = Number(op.tva != null ? op.tva : op.taux);
        if (t > 0 && t <= 1) t *= 100;
        if (!TVA_ADMISES.includes(t)) {
          throw new Error(
            "En rénovation, les taux applicables sont 5,5 %, 10 % ou 20 %"
            + (Number.isFinite(t) ? ` — pas ${nbFr(t)} %.` : '.')
            + ' Lequel dois-je mettre ?'
          );
        }
        const cibleLigne = op.ligne != null && String(op.ligne).trim() !== '' ? op.ligne : null;
        if (cibleLigne) {
          const i = indexLigne(lignes, cibleLigne);
          lignes[i].vatRate = t;
          faits.push(`TVA ${nbFr(t)} % sur ${lignes[i].description}`);
        } else {
          lignes.forEach((l) => { l.vatRate = t; });
          faits.push(`TVA ${nbFr(t)} %`);
        }
        break;
      }
      case 'remise': {
        const pct = Number(op.pourcentage != null ? op.pourcentage : op.remise);
        if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) {
          throw new Error("Quel pourcentage de remise ? (entre 0 et 100)");
        }
        // Retire la remise deja posee : elle sera recalculee apres la boucle,
        // sur l'etat final des lignes (voir remisePct plus bas).
        lignes = lignes.filter((l) => !estLigneRemise(l));
        remisePct = pct;
        faits.push(`remise ${nbFr(pct)} %`);
        break;
      }
      case 'modifier_client': {
        const c = op.client || op;
        const nom = (c.nom || c.client_nom || '').toString().trim();
        const adresse = (c.adresse || c.address || '').toString().trim();
        const email = (c.email || '').toString().trim();
        const tel = (c.telephone || c.tel || c.phone || '').toString().trim();
        if (!nom && !adresse && !email && !tel) {
          throw new Error("Que faut-il corriger sur la fiche du client ?");
        }
        // Le chantier VISE par CE devis, jamais une recherche par nom/adresse :
        // trouverChantier() pouvait retomber sur le chantier d'un AUTRE client
        // au nom ou a l'adresse ressemblants et lui ecraser sa fiche. Sans
        // chantierId (devis pas encore synchronise, ou tres ancien), on refuse
        // plutot que de deviner.
        if (!quote.chantierId) {
          throw new Error("Ce devis n'est rattaché à aucun chantier, changez le client depuis la fiche du devis.");
        }
        clientMaj = Object.assign(clientMaj || {}, { nom, adresse, email, tel });
        const quoi = [nom && 'nom', adresse && 'adresse', email && 'e-mail', tel && 'téléphone']
          .filter(Boolean).join(', ');
        faits.push(`client : ${quoi} à jour`);
        break;
      }
      default:
        throw new Error(`Opération « ${(op && op.type) || '?'} » inconnue sur un devis.`);
    }
  }

  // Remise : appliquee UNE fois ici, sur l'etat final des lignes (voir
  // remisePct dans la boucle) — pas a chaque « remise » rencontree.
  if (remisePct != null) {
    if (!lignes.filter((l) => !estLigneRemise(l)).length) {
      throw new Error("Ce devis n'a aucune ligne : il n'y a rien sur quoi appliquer une remise.");
    }
    lignes = appliquerRemise(lignes, remisePct);
  }

  quote.lots = lignesVersLots(lignes);
  recalculerTotaux(quote);

  const res = await majDevisEnregistre(quote);
  const suffixe = res.etat === 'synchro'
    ? ''
    : "\n\n⚠ Enregistré sur cet appareil uniquement — la synchronisation reprendra dès le retour du réseau.";

  // Nom, adresse, e-mail et telephone du client vivent sur la FICHE CHANTIER,
  // pas sur le devis. Fait APRES l'enregistrement du devis (pas avant) : si la
  // sauvegarde retombe en local (pas de reseau), le chantier n'est pas
  // touche — inutile de corriger la fiche client d'un devis qui n'a pas
  // encore atteint la base, et on le dit plutot que de laisser croire que
  // c'est fait.
  let clientSuffixe = '';
  if (clientMaj) {
    if (res.etat !== 'synchro') {
      clientSuffixe = "\n\n⚠ La fiche du client n'a pas été mise à jour : ce devis n'est pas encore synchronisé.";
    } else {
      const patch = {};
      if (clientMaj.nom) patch.client_name = clientMaj.nom;
      if (clientMaj.adresse) patch.adresse = clientMaj.adresse;
      if (clientMaj.email) patch.client_email = clientMaj.email;
      if (clientMaj.tel) patch.client_phone = clientMaj.tel;
      const { error } = await supabase.from('chantiers').update(patch).eq('id', quote.chantierId);
      if (error) {
        clientSuffixe = "\n\n⚠ Le devis est enregistré, mais la fiche du client n'a pas pu être corrigée : " + error.message;
      } else {
        if (clientMaj.nom) quote.client = clientMaj.nom;
        if (clientMaj.adresse) quote.address = clientMaj.adresse;
        if (clientMaj.email) quote.clientEmail = clientMaj.email;
      }
    }
  }

  // La modale de detail, si elle est ouverte sur ce devis, doit montrer le
  // nouvel etat sans que l'artisan recharge (crochet pose par devis.html).
  if (typeof window !== 'undefined') {
    try {
      if (typeof window.bsRafraichirDevis === 'function') await window.bsRafraichirDevis(res.quote.id);
      else if (typeof window.rechargerDevis === 'function') await window.rechargerDevis();
    } catch (_) { /* l'enregistrement, lui, est fait */ }
  }

  return {
    message: `Devis ${res.quote.id} : ${faits.join(' · ')}. Nouveau total : ${euro(quote.totTtc)} TTC.` + suffixe + clientSuffixe,
    lien: ctx.page === 'devis'
      ? null
      : (res.quote._dbId ? `./devis.html?id=${res.quote._dbId}` : './devis.html'),
    data: res.quote,
  };
}

// ── nouvelle_version_devis (avenant) ────────────────────────────────────────
//
// Le pendant de `modifier_devis` pour un devis DÉJÀ PARTI. `modifier_devis`
// refuse un devis signé — « je peux préparer une nouvelle version (avenant) » ;
// voici cette nouvelle version. Toute la mécanique (garde brouillon, appel du
// mode serveur `revise-quote`, recollage des prix sur le devis d'origine,
// numérotation `…-V2`, écriture) vit dans devis-store.js, pour que l'écran
// devis.html et l'assistant fassent exactement la même chose. Ici, on résout le
// devis visé et on rend compte.
async function nouvelleVersionDevis(p) {
  const consignes = (p.consignes || p.instructions || p.modifications || '').toString().trim();
  if (!consignes) {
    throw new Error("Que doit contenir cette nouvelle version ? Dites-moi ce qui change par rapport au devis d'origine.");
  }
  const { cible, ctx } = await resoudreDevisUI(p, 'reprendre en nouvelle version');

  const res = await creerNouvelleVersion(completerQuote(Object.assign({}, cible)), consignes);

  // Le résumé est calculé sur la V2 RÉELLEMENT construite (lignes ajoutées,
  // retirées, modifiées), pas recollé depuis ce que le modèle dit avoir fait :
  // `versionNotes` pouvait annoncer « remise appliquée » sur une version aux prix
  // inchangés. Il ne vient plus qu'en complément, jamais seul.
  let message = `Version ${res.version} créée : ${res.numero}.`
    + `\n${resumeChangements(res).join('\n')}`
    + `\n${res.ecart.texte} · Total : ${euro(res.quote.totTtc)} TTC.`
    + `\nLe devis d'origine ${res.origine} n'a pas bougé.`;

  const complement = String(res.notes || '').trim();
  if (complement) message += `\n\nCe que dit la révision : ${complement}`;

  // LA porte « argent » : de l'argent a bougé sur des lignes que les consignes ne
  // demandent ni d'ajouter ni de retirer. Rendu à part (`alerte`) pour que la
  // carte l'affiche EN ROUGE, sous les deux totaux HT qui lui servent d'ancre.
  const alerte = res.ecart.justifie ? null : res.ecart.alerte;
  if (res.prixChanges.length) {
    // Un prix qui bouge dans un avenant se VOIT sur la carte de validation :
    // l'artisan valide en connaissance de cause, ou refuse. Triés par écart
    // décroissant et bornés : sur un gros devis, la ligne qui surprend est en tête.
    message += `\n\n\u26a0 Prix modifiés d'après vos consignes : ${res.prixChanges.slice(0, 6).join(' · ')}`
      + (res.prixChanges.length > 6 ? ` (+ ${res.prixChanges.length - 6} autres)` : '') + '.';
  }
  if (res.prixRestaures.length) {
    // Le symétrique du précédent : le serveur avait bougé ces prix sans qu'aucune
    // consigne ne le demande. On a remis les VÔTRES, au centime, et on le dit.
    const n = res.prixRestaures.length;
    message += `\n\nJ'ai gardé VOS prix sur ${n} ligne${n > 1 ? 's' : ''} que la révision voulait changer : `
      + res.prixRestaures.slice(0, 6).join(' · ') + '.';
  }
  if (res.prixASaisir.length) {
    // On ne comble jamais un prix manquant : c'est le sien, pas un tarif de
    // marché. On le DIT, et l'artisan le saisit sur la fiche.
    message += `\n\n⚠ Prix à saisir sur ${res.prixASaisir.length > 1 ? 'ces lignes' : 'cette ligne'} : `
      + res.prixASaisir.join(' · ') + '.';
  }
  if (res.etat !== 'synchro') {
    message += "\n\n⚠ Enregistrée sur cet appareil uniquement — la synchronisation reprendra dès le retour du réseau.";
  }

  // L'écran des devis, s'il est ouvert, doit montrer la nouvelle version sans
  // que l'artisan recharge (même crochet que modifier_devis).
  if (typeof window !== 'undefined') {
    try {
      if (typeof window.bsRafraichirDevis === 'function') await window.bsRafraichirDevis(res.numero);
      else if (typeof window.rechargerDevis === 'function') await window.rechargerDevis();
    } catch (_) { /* la version, elle, est créée */ }
  }

  return {
    message,
    alerte,
    lien: ctx.page === 'devis'
      ? null
      : (res.quote._dbId ? `./devis.html?id=${res.quote._dbId}` : './devis.html'),
    data: res.quote,
  };
}

// ── Chantier et étapes, en entier (05/09/2026) ──────────────────────────────
//
// Ce qui manquait : l'assistant savait planifier, démarrer, terminer, mais pas
// CRÉER un chantier, corriger sa fiche, corriger une étape, ni la supprimer.
// Un artisan qui dicte « nouveau chantier chez Mme Sanchez » devait ouvrir un
// écran — donc reposer les outils, donc ne pas le faire.
//
// Les deux suppressions sont les PREMIERS outils de l'ensemble DESTRUCTIFS :
// leur carte passe en rouge et n'exécute qu'après un appui maintenu d'une
// seconde (bsAstRendreProposition, app-assistant.js). Rien d'autre n'entre là :
// un changement de statut se rattrape, une ligne supprimée en base non.

// Colonnes réelles de la table `chantiers` (vérifiées dans chantier.js
// fillInfoForm/info-form et supabase.js accepterDemande) : le budget s'appelle
// `budget_estime`, et le statut « à venir » de l'écran vaut `en_attente` en
// base — dashboard.html:611 fait exactement cette traduction. Écrire
// `status: 'a_venir'` ou `budget: …` créerait une colonne fantôme (rejet
// PostgREST) ou un chantier invisible dans les trois onglets du tableau de bord.
const STATUTS_CHANTIER = ['en_attente', 'en_cours', 'retard', 'termine'];
const STATUT_DIT = {
  a_venir: 'en_attente', avenir: 'en_attente', en_attente: 'en_attente',
  attente: 'en_attente', prevu: 'en_attente', planifie: 'en_attente',
  en_cours: 'en_cours', encours: 'en_cours', demarre: 'en_cours', commence: 'en_cours',
  retard: 'retard', en_retard: 'retard',
  termine: 'termine', fini: 'termine', acheve: 'termine',
};

/**
 * Quel chantier ? Le chantier OUVERT à l'écran d'abord — « supprime cette
 * étape » n'a de sens que sur celui qu'il regarde. Mais s'il en NOMME un
 * autre, c'est celui-là qui gagne : prendre le contexte contre un nom explicite
 * ferait supprimer le mauvais chantier, et une suppression ne se rattrape pas.
 * Zéro ou plusieurs candidats → on renvoie la raison, on n'écrit rien.
 */
async function resoudreChantier(p) {
  const ctx = (typeof window !== 'undefined' && typeof window.bsContexteEcran === 'function')
    ? (window.bsContexteEcran() || {})
    : {};
  const dit = (p.chantier_client || p.client_nom || p.client || p.chantier || '').toString().trim();
  const id = (p.chantier_id || '').toString().trim();
  const chantiers = await listChantiers();

  if (id) {
    const c = chantiers.find((x) => x.id === id);
    if (c) return { chantier: c };
    return { erreur: "Je ne retrouve pas ce chantier. Donnez-moi le nom du client." };
  }

  const ouvert = (ctx.page === 'chantier' && ctx.chantier_id)
    ? (chantiers.find((x) => x.id === ctx.chantier_id) || null)
    : null;

  if (!dit) {
    if (ouvert) return { chantier: ouvert };
    return { erreur: 'De quel chantier parlez-vous ? Donnez-moi le nom du client.' };
  }

  const q = norm(dit);
  // Correctif revue 05/09 : l'égalité EXACTE, sur TOUTE la liste, passe
  // toujours avant le chantier ouvert. Vérifier d'abord une inclusion sur
  // `ouvert` (ancien code) pouvait résoudre au chantier affiché à l'écran sur
  // une simple sous-chaîne, alors qu'un AUTRE chantier correspondait mot pour
  // mot au nom dicté — et une suppression sur le mauvais chantier ne se
  // rattrape pas.
  const exacts = chantiers.filter((c) => norm(c.client_name) === q || norm(c.adresse) === q);
  // Le contexte d'écran ne gagne que s'il fait partie des candidats exacts :
  // jamais contre un nom qui désigne exactement un autre chantier.
  if (ouvert && exacts.some((c) => c.id === ouvert.id)) return { chantier: ouvert };
  if (exacts.length === 1) return { chantier: exacts[0] };
  if (exacts.length === 0) {
    const inclus = chantiers.filter((c) => norm(c.client_name).includes(q) || norm(c.adresse).includes(q));
    if (inclus.length === 1) return { chantier: inclus[0] };
    if (inclus.length > 1) {
      return { erreur: `Plusieurs chantiers correspondent à « ${dit} » : `
        + inclus.map((c) => `${c.client_name}${c.adresse ? ` (${c.adresse})` : ''}`).join(' · ')
        + '. Lequel ?' };
    }
    return { erreur: `Je ne trouve aucun chantier « ${dit} ».` };
  }
  return { erreur: `Plusieurs chantiers correspondent à « ${dit} » : `
    + exacts.map((c) => `${c.client_name}${c.adresse ? ` (${c.adresse})` : ''}`).join(' · ')
    + '. Lequel ?' };
}

/**
 * Quelle étape ? Par NUMÉRO (1-based, dans l'ordre affiché du déroulement,
 * c'est-à-dire l'ordre rendu par listTachesChantier) ou par intitulé. Jamais
 * de choix au hasard : deux candidats, on les liste et on ne touche à rien.
 */
function resoudreEtape(taches, ref) {
  const brut = (ref == null ? '' : String(ref)).trim();
  const liste = () => taches.map((t, i) => `${i + 1}. ${t.titre}`).join(' · ');
  if (!taches.length) return { erreur: "Ce chantier n'a aucune étape planifiée." };
  if (!brut) return { erreur: `De quelle étape parlez-vous ? ${liste()}` };

  const n = brut.match(/^n?°?\s*(\d+)$/);
  if (n) {
    const i = parseInt(n[1], 10);
    if (i >= 1 && i <= taches.length) return { tache: taches[i - 1] };
    return { erreur: `Ce chantier a ${taches.length} étape(s) : ${liste()}. Laquelle ?` };
  }

  const q = norm(brut);
  let cands = taches.filter((t) => norm(t.titre) === q);
  if (!cands.length) cands = taches.filter((t) => norm(t.titre).includes(q));
  if (cands.length === 1) return { tache: cands[0] };
  if (cands.length > 1) {
    return { erreur: `Plusieurs étapes correspondent à « ${brut} » : `
      + cands.map((t) => `« ${t.titre} »${t.jour ? ` (${t.jour})` : ''}`).join(' · ')
      + '. Laquelle ?' };
  }
  return { erreur: `Je ne trouve aucune étape « ${brut} » sur ce chantier. ${liste()}` };
}

// ── ÉCRITURE : « ouvre-moi un chantier pour M. Dubois » ──
//
// L'adresse manque souvent au moment où l'artisan dicte, dans la voiture ou
// sur le chantier d'à côté. On ne bloque pas dessus (règle Moctar, 04/09) : on
// crée, et on dit ce qui reste à compléter. C'est l'inverse du devis, qui lui
// refuse sans adresse — un devis part chez le client, un chantier non.
async function creerChantierAction(p) {
  // RLS réserve l'INSERT sur `chantiers` à patron/chef (chantiers_insert_encadrement) :
  // un ouvrier obtiendrait 0 ligne insérée sans erreur PostgREST explicite.
  // Même mécanique que assignerChantierAction.
  const ctx = await contexteEquipe();
  if (!ctx.encadrement) {
    throw new Error("Seul le responsable ou le chef d'équipe peut créer un chantier.");
  }

  const nom = (p.client_nom || p.client || p.nom || '').toString().trim();
  if (!nom) throw new Error('Pour quel client faut-il ouvrir ce chantier ?');

  const adresse = (p.adresse || p.client_adresse || '').toString().trim();
  const telephone = (p.telephone || p.tel || p.client_phone || '').toString().trim();
  const email = (p.email || p.client_email || '').toString().trim();

  // Doublon = même nom ET même adresse normalisés. Le nom seul suffisait à
  // bloquer un second chantier légitime chez un client qui revient pour un
  // autre chantier, à une autre adresse.
  const dejaLa = (await listChantiers()).filter(
    (c) => norm(c.client_name) === norm(nom) && norm(c.adresse) === norm(adresse)
  );
  if (dejaLa.length) {
    const c = dejaLa[0];
    return {
      message: `Un chantier existe déjà pour ${c.client_name}`
        + (c.adresse ? ` (${c.adresse})` : '')
        + `. Je ne crée pas de doublon : dites-moi si vous voulez le modifier, ou donnez un intitulé différent.`,
      lien: `./chantier.html?id=${c.id}`,
      data: c,
    };
  }

  const dateDebut = p.date_debut ? dateDite(p.date_debut) : null;
  if (p.date_debut && !dateDebut) {
    throw new Error(`Je ne comprends pas la date de début « ${p.date_debut} ». Dites « jeudi », « demain », ou donnez-la au format 2026-09-12.`);
  }
  const dateFin = p.date_fin_prevue ? dateDite(p.date_fin_prevue) : null;
  if (p.date_fin_prevue && !dateFin) {
    throw new Error(`Je ne comprends pas la date de fin « ${p.date_fin_prevue} ». Dites « jeudi », « demain », ou donnez-la au format 2026-09-12.`);
  }

  const data = await createChantier({
    client_name: nom,
    adresse: adresse || null,
    client_phone: telephone || null,
    client_email: email || null,
    description: (p.description || p.objet || '').toString().trim() || null,
    date_debut: dateDebut,
    date_fin_prevue: dateFin,
    status: 'en_attente',
  });

  const manque = [];
  if (!adresse) manque.push("l'adresse");
  if (!telephone) manque.push('le téléphone');
  if (!email) manque.push("l'e-mail");

  return {
    message: `Chantier ${data.client_name} créé`
      + (adresse ? `, ${adresse}` : '')
      + (dateDebut ? `, début le ${new Date(dateDebut + 'T00:00:00').toLocaleDateString('fr-FR')}` : '')
      + '.'
      + (manque.length
          ? `\nIl reste à compléter ${manque.join(', ')} : dites-le-moi et je l'ajoute.`
          : ''),
    lien: `./chantier.html?id=${data.id}`,
    data,
  };
}

// ── ÉCRITURE : « corrige l'adresse chez Mme Ravier » ──
async function modifierChantierAction(p) {
  const { chantier, erreur } = await resoudreChantier(p);
  if (erreur) throw new Error(erreur);

  const c = (p.champs && typeof p.champs === 'object') ? p.champs : p;
  const patch = {};
  const faits = [];
  const texte = (v) => (v == null ? null : String(v).trim());

  if (texte(c.client_nom) || texte(c.client)) {
    // `client_name` est NOT NULL en base (même garde-fou que chantier.js) :
    // pas de vérif ici, elle est déjà faite par la condition ci-dessus — l'une
    // des deux valeurs est nécessairement non vide pour qu'on entre ce bloc.
    const nom = texte(c.client_nom) || texte(c.client);
    patch.client_name = nom; faits.push(`client : ${nom}`);
  }
  if (c.adresse !== undefined) {
    patch.adresse = texte(c.adresse) || null;
    faits.push(patch.adresse ? `adresse : ${patch.adresse}` : 'adresse effacée');
  }
  if (c.telephone !== undefined || c.tel !== undefined) {
    patch.client_phone = texte(c.telephone !== undefined ? c.telephone : c.tel) || null;
    faits.push(patch.client_phone ? `téléphone : ${patch.client_phone}` : 'téléphone effacé');
  }
  if (c.email !== undefined) {
    patch.client_email = texte(c.email) || null;
    faits.push(patch.client_email ? `e-mail : ${patch.client_email}` : 'e-mail effacé');
  }
  if (c.date_debut !== undefined) {
    const brut = c.date_debut;
    if (brut === null || String(brut).trim() === '') {
      patch.date_debut = null; faits.push('date de début effacée');
    } else {
      // dateDite (déjà utilisée par modifier_etape) : accepte « jeudi »,
      // « demain », pas seulement le format ISO brut passé tel quel.
      const iso = dateDite(brut);
      if (!iso) throw new Error(`Je ne comprends pas la date de début « ${brut} ». Dites « jeudi », « demain », ou donnez-la au format 2026-09-12.`);
      patch.date_debut = iso;
      faits.push(`début le ${new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR')}`);
    }
  }
  if (c.date_fin_prevue !== undefined || c.date_fin !== undefined) {
    const brut = c.date_fin_prevue !== undefined ? c.date_fin_prevue : c.date_fin;
    if (brut === null || String(brut).trim() === '') {
      patch.date_fin_prevue = null; faits.push('date de fin effacée');
    } else {
      const iso = dateDite(brut);
      if (!iso) throw new Error(`Je ne comprends pas la date de fin « ${brut} ». Dites « jeudi », « demain », ou donnez-la au format 2026-09-12.`);
      patch.date_fin_prevue = iso;
      faits.push(`fin prévue le ${new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR')}`);
    }
  }
  if (c.budget !== undefined || c.budget_estime !== undefined) {
    const brut = c.budget !== undefined ? c.budget : c.budget_estime;
    if (brut === null || String(brut).trim() === '') {
      patch.budget_estime = null; faits.push('budget effacé');
    } else {
      const v = Number(String(brut).replace(',', '.').replace(/[^\d.\-]/g, ''));
      // `>= 0` et non `> 0` : un budget de 0 est une valeur, pas une absence
      // (même distinction que lireBudget dans chantier.js).
      if (!Number.isFinite(v) || v < 0) throw new Error('Budget invalide : donnez un montant positif.');
      patch.budget_estime = v; faits.push(`budget : ${euro(v)}`);
    }
  }
  if (c.statut !== undefined || c.status !== undefined) {
    const dit = norm(c.statut !== undefined ? c.statut : c.status).replace(/[\s'’-]+/g, '_');
    const st = STATUT_DIT[sansAccents(dit)] || (STATUTS_CHANTIER.includes(dit) ? dit : null);
    if (!st) {
      throw new Error(`Statut « ${c.statut || c.status} » inconnu. Les statuts possibles : à venir, en cours, en retard.`);
    }
    // « terminé » n'est PAS un simple changement d'état : terminer_chantier
    // prévient le client par e-mail et ouvre son compte à rebours de 14 jours.
    // L'écrire ici en silence priverait le client de son dossier.
    if (st === 'termine') {
      throw new Error("Pour clore un chantier, dites-moi « le chantier est terminé » : "
        + "je préviens alors le client et j'ouvre son accès au dossier, ce qu'un simple changement de statut ne fait pas.");
    }
    patch.status = st;
    faits.push(`statut : ${st === 'en_attente' ? 'à venir' : (st === 'en_cours' ? 'en cours' : 'en retard')}`);
  }

  if (!faits.length) throw new Error("Dites-moi ce qu'il faut changer sur cette fiche.");

  const data = await updateChantier(chantier.id, patch);
  return {
    message: `Fiche du chantier ${data.client_name} mise à jour : ${faits.join(' · ')}.`,
    lien: `./chantier.html?id=${chantier.id}`,
    data,
  };
}

// ── DESTRUCTIF : « supprime le chantier Dubois » ──
//
// Garde-fous, en plus du maintien d'une seconde de la carte rouge :
//   1. RLS réserve le DELETE sur `chantiers` à patron/chef
//      (chantiers_delete_encadrement) : un ouvrier obtiendrait 204 avec 0
//      ligne supprimée, sans erreur PostgREST — d'où la vérification
//      explicite ci-dessous ET la relecture après coup ;
//   2. une facture ENVOYÉE ou PAYÉE rattachée au chantier interdit la
//      suppression — c'est une pièce comptable, elle doit rester rattachée à
//      son chantier ; la supprimer effacerait la trace d'une somme réclamée
//      ou encaissée ;
//   3. un devis SIGNÉ (accepté) rattaché interdit aussi la suppression
//      (décision contrôleur 05/09) : c'est un engagement contractuel, au même
//      titre qu'une facture envoyée ;
//   4. on annonce EXACTEMENT ce qui part avec, avant l'exécution : la cascade
//      en base emporte les étapes, les devis, les factures, les messages, les
//      photos, les pièces jointes et les PV du chantier. Les documents du
//      coffre et les dépenses restent, détachés (aucune contrainte de clé
//      étrangère ne les lie au chantier — vérifié sur le schéma de
//      `coffre_documents`, dont `chantier_id` est un simple uuid sans
//      `references chantiers`).
async function supprimerChantierAction(p) {
  const ctx = await contexteEquipe();
  if (!ctx.encadrement) {
    throw new Error("Seul le responsable ou le chef d'équipe peut supprimer un chantier.");
  }

  const { chantier, erreur } = await resoudreChantier(p);
  if (erreur) throw new Error(erreur);

  // Pas de fonction de liste par chantier dans supabase.js : requêtes
  // directes, sous RLS (pro_id = mon_entreprise()), comme partout ailleurs ici.
  const [{ data: factures, error: errF }, { data: devisChantier, error: errD }] = await Promise.all([
    supabase.from('factures').select('id, numero, statut').eq('chantier_id', chantier.id),
    supabase.from('devis').select('id, numero, status').eq('chantier_id', chantier.id),
  ]);
  if (errF) throw errF;
  if (errD) throw errD;

  const engagees = (factures || []).filter((f) => f.statut === 'envoyee' || f.statut === 'payee');
  if (engagees.length) {
    throw new Error(
      `Je ne supprime pas le chantier ${chantier.client_name} : `
      + `${engagees.length} facture(s) y sont rattachées (${engagees.map((f) => f.numero || f.id.slice(0, 8)).join(', ')}), `
      + `déjà envoyées ou payées. Ce sont des pièces comptables : elles doivent rester rattachées à leur chantier.`
    );
  }
  const signes = (devisChantier || []).filter((d) => d.status === 'accepte');
  if (signes.length) {
    throw new Error(
      `Je ne supprime pas le chantier ${chantier.client_name} : `
      + `${signes.length} devis y sont signés (${signes.map((d) => d.numero || d.id.slice(0, 8)).join(', ')}). `
      + `Un devis signé est un engagement contractuel : il doit rester rattaché à son chantier.`
    );
  }

  const taches = await listTachesChantier(chantier.id).catch(() => []);
  const nom = chantier.client_name;
  await deleteChantier(chantier.id);

  // RLS peut avoir laissé la ligne en place sans lever d'erreur (0 ligne
  // supprimée = succès aux yeux de PostgREST). On relit avant d'annoncer quoi
  // que ce soit : mieux vaut un échec honnête qu'une suppression fantôme.
  const encoreLa = await getChantier(chantier.id).catch(() => null);
  if (encoreLa) {
    throw new Error(`La suppression du chantier ${nom} n'a pas abouti : rien n'a été supprimé. Vérifiez vos droits ou réessayez.`);
  }

  return {
    message: `Chantier ${nom} supprimé définitivement, avec tout ce qui lui était rattaché : `
      + `${taches.length} étape(s)`
      + `, ${(devisChantier || []).length} devis`
      + `, ${(factures || []).length} facture(s) en brouillon`
      + `, ses messages, ses photos, ses pièces jointes et ses PV.`
      + ` Les documents du coffre et les dépenses restent, détachés de ce chantier.`,
    lien: './dashboard.html',
  };
}

// ── ÉCRITURE : « la pose passe à jeudi », « renomme l'étape préparation » ──
async function modifierEtapeAction(p) {
  const { chantier, erreur } = await resoudreChantier(p);
  if (erreur) throw new Error(erreur);

  const taches = await listTachesChantier(chantier.id);
  const { tache, erreur: errE } = resoudreEtape(taches, p.etape || p.tache || p.numero);
  if (errE) throw new Error(errE);

  const c = (p.champs && typeof p.champs === 'object') ? p.champs : p;
  const patch = {};
  const faits = [];

  if (c.titre !== undefined || c.nouveau_titre !== undefined) {
    const t = String(c.titre !== undefined ? c.titre : c.nouveau_titre).trim();
    if (!t) throw new Error("L'intitulé d'une étape ne peut pas être vide.");
    patch.titre = t; faits.push(`intitulé : « ${t} »`);
  }
  if (c.jour !== undefined || c.date !== undefined) {
    const brut = c.jour !== undefined ? c.jour : c.date;
    if (brut === null || String(brut).trim() === '') {
      patch.jour = null; faits.push('date retirée');
    } else {
      const iso = dateDite(brut);
      if (!iso) throw new Error(`Je ne comprends pas la date « ${brut} ». Dites « jeudi », « demain », ou donnez-la au format 2026-09-12.`);
      patch.jour = iso;
      faits.push(`déplacée au ${new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR')}`);
    }
  }
  // Heure de début (07/09) : « à 9 h » la pose en créneau, « journee » la
  // rend à la journée entière. Une heure qu'on ne sait pas lire est refusée,
  // jamais devinée — une heure fausse envoie l'artisan au mauvais moment.
  const heureDite = c.heure !== undefined ? c.heure : (c.heure_debut !== undefined ? c.heure_debut : c.horaire);
  if (heureDite !== undefined) {
    const brut = heureDite === null ? '' : String(heureDite).trim();
    if (brut === '' || /^(journ[ée]e|toute la journ[ée]e|sans heure)$/i.test(brut)) {
      patch.heure_debut = null; faits.push('remise sur la journée entière');
    } else {
      const h = normaliserHeure(brut);
      if (!h) throw new Error(`Je ne comprends pas l'heure « ${brut} ». Dites « 9 h », « 14 h 30 », ou « journée » pour la remettre sur la journée entière.`);
      patch.heure_debut = h; faits.push(`à ${heureLisible(h)}`);
    }
  }
  if (c.duree_h !== undefined || c.duree !== undefined) {
    const v = Number(String(c.duree_h !== undefined ? c.duree_h : c.duree).replace(',', '.'));
    if (!Number.isFinite(v) || v <= 0) throw new Error('Durée invalide : donnez un nombre d\'heures positif.');
    patch.duree_h = v; faits.push(`durée : ${nombreFr(v)} h`);
  }
  if (c.delai_apres_h !== undefined || c.sechage_h !== undefined) {
    const v = Number(String(c.delai_apres_h !== undefined ? c.delai_apres_h : c.sechage_h).replace(',', '.'));
    if (!Number.isFinite(v) || v < 0) throw new Error("Temps de séchage invalide : donnez un nombre d'heures.");
    patch.delai_apres_h = v;
    faits.push(v ? `séchage après : ${nombreFr(v)} h` : 'plus de séchage après');
  }

  // L'assignation ne passe PAS par modifierTache : assignerTache est le seul
  // point d'écriture de `assigne_id` + `assigne_a` dans l'application (voir son
  // commentaire dans supabase.js — la fenêtre de lecture d'un apprenti dépend
  // encore de la colonne texte). On la fait à part, après le patch.
  const quiDit = c.assigne !== undefined ? c.assigne : (c.assigne_a !== undefined ? c.assigne_a : c.membre);
  let membre = null;
  if (quiDit !== undefined && quiDit !== null && String(quiDit).trim() !== '') {
    const ctx = await contexteEquipe();
    if (!ctx.encadrement) throw new Error("Seul le responsable ou le chef d'équipe peut assigner une étape.");
    const r = resoudreMembre(ctx, quiDit);
    if (r.erreur) throw new Error(r.erreur);
    membre = r.membre;
    faits.push(`assignée à ${ctx.nomComplet(membre)}`);
  }

  if (!faits.length) throw new Error("Dites-moi ce qu'il faut changer sur cette étape.");

  if (Object.keys(patch).length) await modifierTache(tache.id, patch);
  if (membre) await assignerTache(tache.id, membre);

  return {
    message: `Étape « ${patch.titre || tache.titre} » du chantier ${chantier.client_name} : ${faits.join(' · ')}.`,
    lien: `./chantier.html?id=${chantier.id}`,
  };
}

// ── DESTRUCTIF : « supprime l'étape peinture » ──
//
// RLS réserve le DELETE sur `taches` à patron/chef (taches_delete_encadrement) :
// un ouvrier obtiendrait 204 avec 0 ligne supprimée, sans erreur. Même garde
// que supprimerChantierAction : vérifier le rôle AVANT, relire APRÈS.
async function supprimerEtapeAction(p) {
  const ctx = await contexteEquipe();
  if (!ctx.encadrement) {
    throw new Error("Seul le responsable ou le chef d'équipe peut supprimer une étape.");
  }

  const { chantier, erreur } = await resoudreChantier(p);
  if (erreur) throw new Error(erreur);

  const taches = await listTachesChantier(chantier.id);
  const { tache, erreur: errE } = resoudreEtape(taches, p.etape || p.tache || p.numero);
  if (errE) throw new Error(errE);

  await supprimerTache(tache.id);

  // Relecture : si RLS a laissé la ligne en place, listTachesChantier la
  // contiendra encore malgré un DELETE « réussi » côté PostgREST.
  const apres = await listTachesChantier(chantier.id).catch(() => taches);
  if (apres.some((t) => t.id === tache.id)) {
    throw new Error(`La suppression de l'étape « ${tache.titre} » n'a pas abouti : rien n'a été supprimé. Vérifiez vos droits ou réessayez.`);
  }

  return {
    message: `Étape « ${tache.titre} » supprimée définitivement du chantier ${chantier.client_name}.`
      + (apres.length ? `\nIl reste ${apres.length} étape(s).` : `\nCe chantier n'a plus aucune étape.`),
    lien: `./chantier.html?id=${chantier.id}`,
  };
}

// ── ÉCRITURE : « mets Karim sur le chantier Dubois » ──
//
// Même boucle que window.bsAssignerChantier (planning.html) : toutes les
// étapes du chantier, une par une, par assignerTache. On compte celles qui
// changent réellement de main pour ne pas annoncer « 6 étapes assignées »
// quand 5 l'étaient déjà à la même personne.
async function assignerChantierAction(p) {
  const ctx = await contexteEquipe();
  if (!ctx.encadrement) {
    throw new Error("Seul le responsable ou le chef d'équipe peut assigner un chantier.");
  }
  const { chantier, erreur } = await resoudreChantier(p);
  if (erreur) throw new Error(erreur);

  const { membre, erreur: errM } = resoudreMembre(ctx, p.membre || p.personne || p.qui || p.assigne);
  if (errM) throw new Error(errM);

  const taches = await listTachesChantier(chantier.id);
  if (!taches.length) {
    throw new Error(`Le chantier ${chantier.client_name} n'a aucune étape à assigner. `
      + `Dites-moi les travaux et je le découpe en étapes datées d'abord.`);
  }

  const nom = ctx.nomComplet(membre);
  let changees = 0;
  for (const t of taches) {
    const dejaLui = membre.__virtuel
      ? (!t.assigne_id && norm(t.assigne_a) === norm(nom))
      : (t.assigne_id === membre.id);
    await assignerTache(t.id, membre);
    if (!dejaLui) changees++;
  }

  return {
    message: `${nom} prend le chantier ${chantier.client_name} : ${taches.length} étape(s) lui sont assignées`
      + (changees === taches.length ? '' : ` (${changees} changement(s), le reste l'était déjà)`)
      + '.',
    lien: `./chantier.html?id=${chantier.id}`,
  };
}

// ── LECTURE : « donne-moi le lien de suivi de Mme Ravier » ──
//
// Le lien est celui du bouton « Copier le lien client » de chantier.html :
// même URL, même presse-papiers. La copie est un CONFORT — si le navigateur la
// refuse (page non focalisée, permission), le lien est quand même dans la
// réponse, en clair, prêt à être recopié.
async function lienSuiviClient(p) {
  const { chantier, erreur } = await resoudreChantier(p);
  if (erreur) throw new Error(erreur);
  // Branche morte (revue 05/09) : `public_token` est `not null default
  // encode(gen_random_bytes(16), 'hex')` sur `chantiers` (app/supabase-schema.sql),
  // donc toujours renseigné dès l'insertion. Gardée quand même en défense —
  // sans effet aujourd'hui, mais sans coût si le schéma change un jour.
  if (!chantier.public_token) {
    throw new Error(`Le chantier ${chantier.client_name} n'a pas encore de lien client. `
      + `Ouvrez sa fiche une fois pour le générer.`);
  }
  const lien = lienSuivi(chantier.public_token);

  let copie = false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(lien);
      copie = true;
    }
  } catch (e) { /* le lien est dans le message : la copie n'est qu'un confort */ }

  return {
    message: `Lien de suivi de ${chantier.client_name} :\n${lien}`
      + (copie ? '\nCopié — vous pouvez le coller dans un SMS ou un e-mail.' : '\nCopiez-le pour l\'envoyer à votre client.'),
    lien: `./chantier.html?id=${chantier.id}`,
    data: { lien },
  };
}

// ── LECTURE : « appelle M. Dubois » ──
//
// `tel:` est traité par le système, pas par la page : sur un téléphone il ouvre
// le composeur. Sur un ordinateur sans application associée, il ne se passe
// rien de visible — d'où le numéro écrit en clair dans la réponse, qui reste
// utile dans tous les cas.
async function appelerClient(p) {
  const { chantier, erreur } = await resoudreChantier(p);
  if (erreur) throw new Error(erreur);

  const tel = (chantier.client_phone || '').toString().trim();
  if (!tel) {
    return {
      message: `Aucun numéro n'est enregistré pour ${chantier.client_name}. `
        + `Dites-le-moi et je l'ajoute à sa fiche.`,
      lien: `./chantier.html?id=${chantier.id}`,
    };
  }
  const numero = tel.replace(/[^\d+]/g, '');
  if (typeof window !== 'undefined' && window.location) {
    window.location.href = 'tel:' + numero;
  }
  return {
    message: `J'appelle ${chantier.client_name} au ${tel}.`,
    data: { telephone: tel },
  };
}

// ── Partage et signature (05/09/2026) ─────────────────────────────────────
//
// Ces trois exécutants ne touchent RIEN en base : aucun statut ne bouge, aucun
// e-mail ne part, aucune signature n'est enregistrée. Ils remettent au client
// un document (PDF, lien, WhatsApp) ou lui présentent la feuille de signature.
//
// Le lien remis est TOUJOURS celui que l'artisan donne déjà à la main :
// `suivi.html?t=<public_token>` pour un devis (le même que `envoyer_devis` et
// que le bouton « Copier le lien client »), `facture-document.html?t=…&f=…`
// pour une facture (le même que le bouton « Partager » de finances.html, via
// `lienFacture`). Rien d'autre n'y transite : le message WhatsApp ne porte
// QUE le lien — pas de montant, pas de nom de client, pas d'adresse. C'est le
// client qui ouvre la page et y lit ce qui le concerne, sur un canal dont on
// ne maîtrise ni le destinataire final ni l'historique.

// Lien de suivi d'un chantier — une seule composition pour `lien_suivi_client`
// et `partager_devis`. `SUIVI_URL` (js/config.js) porte le domaine public :
// `location.origin` donnerait un lien `localhost` ou `127.0.0.1` intransmissible
// à un client dès qu'on travaille en local.
function lienSuivi(token) {
  const base = (typeof window !== 'undefined' && window.__BATISPOT_CONFIG__ && window.__BATISPOT_CONFIG__.SUIVI_URL)
    || 'https://batispot.pro/app/suivi.html';
  return `${base}?t=${encodeURIComponent(token)}`;
}

// « en PDF », « par WhatsApp », « donne-moi le lien » : trois formulations que
// le modèle rend dans `canal`. Tout ce qui n'est ni PDF ni WhatsApp est traité
// comme un lien — c'est le moyen le moins engageant (rien ne s'ouvre, rien ne
// s'imprime) et donc le bon défaut quand on n'est pas sûr.
function canalPartage(p) {
  const c = norm(p && (p.canal || p.moyen || p.format));
  if (/whats|wa\.me/.test(c)) return 'whatsapp';
  if (/pdf|imprim/.test(c)) return 'pdf';
  return 'lien';
}

// `navigator.share` n'existe que sur mobile et exige un geste utilisateur : ici
// on est dans une continuation asynchrone (retour du modèle), l'activation a pu
// expirer — d'où le repli presse-papiers, puis le lien ÉCRIT EN CLAIR dans le
// message. Les trois chemins laissent l'artisan avec un lien utilisable.
async function remettreLien(titre, url) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try { await navigator.share({ title: titre, url }); return 'partage'; }
    catch (e) { if (e && e.name === 'AbortError') return 'annule'; /* sinon : repli copie */ }
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      return 'copie';
    }
  } catch (_) { /* le lien est dans le message */ }
  return 'affiche';
}

const SUFFIXE_REMISE = {
  partage: '\nLe partage est ouvert.',
  annule: '\nPartage annulé — le lien reste valable.',
  copie: '\nCopié : collez-le dans un SMS, un e-mail ou WhatsApp.',
  affiche: '\nCopiez-le pour l\'envoyer à votre client.',
};

// wa.me ouvre WhatsApp (application ou web) sur un message pré-rempli, sans
// destinataire : c'est l'artisan qui choisit à qui il l'envoie, dans WhatsApp.
// Le texte est le lien SEUL — voir l'en-tête de section.
function lienWhatsApp(url) {
  return 'https://wa.me/?text=' + encodeURIComponent(url);
}

// LECTURE : « donne-moi le PDF du devis Ravier », « partage ce devis par WhatsApp ».
async function partagerDevis(p) {
  const canal = canalPartage(p);
  const { cible } = await resoudreDevisUI(p, 'partager');

  if (canal === 'pdf') {
    // La fiche officielle ne sait s'imprimer que depuis l'écran Devis (feuille
    // @media print de devis.html) : on APPELLE son impression, on n'en écrit
    // pas une deuxième qui divergerait du document réellement remis au client.
    if (typeof window !== 'undefined' && typeof window.bsImprimerDevis === 'function') {
      const ok = window.bsImprimerDevis(cible._dbId || cible.id);
      return {
        message: ok
          ? `Devis ${cible.id} : la fenêtre d'impression s'ouvre — choisissez « Enregistrer au format PDF ».`
          : `Devis ${cible.id} : je n'ai pas pu ouvrir l'impression. Ouvrez le devis puis « Imprimer ».`,
      };
    }
    // Ailleurs dans l'appli : on va sur l'écran Devis, qui imprime en arrivant
    // (`&partager=pdf`, lu au chargement de devis.html).
    const url = `./devis.html?id=${encodeURIComponent(cible._dbId || cible.id)}&partager=pdf`;
    if (typeof window !== 'undefined' && window.location) window.location.href = url;
    return { message: `J'ouvre le devis ${cible.id} pour l'enregistrer en PDF.`, lien: url };
  }

  if (!cible.publicToken) {
    throw new Error(`Le devis ${cible.id} n'a pas encore de lien client `
      + `(il n'est pas synchronisé). Reprenez quand le réseau est revenu, ou partagez-le en PDF.`);
  }
  const url = lienSuivi(cible.publicToken);

  if (canal === 'whatsapp') {
    const wa = lienWhatsApp(url);
    // Une fenêtre ouverte depuis une continuation asynchrone est bloquée sans
    // bruit par Chrome et Safari (aucune erreur, rien ne s'affiche) : on tente,
    // et le bouton `geste` de la carte rend le clic à l'artisan dans tous les cas.
    let ouvert = null;
    try { if (typeof window !== 'undefined') ouvert = window.open(wa, '_blank', 'noopener'); } catch (_) {}
    return {
      message: `Devis ${cible.id} — message WhatsApp prêt avec le lien :\n${url}`
        + (ouvert ? '\nWhatsApp s\'ouvre.' : '\nSi WhatsApp ne s\'est pas ouvert, appuyez sur le bouton.'),
      geste: { url: wa, libelle: 'Ouvrir WhatsApp' },
      data: { lien: url },
    };
  }

  const etat = await remettreLien(`Devis ${cible.id}`, url);
  return {
    message: `Devis ${cible.id} — lien à envoyer à votre client :\n${url}` + SUFFIXE_REMISE[etat],
    data: { lien: url },
  };
}

// LECTURE : « envoie-moi la facture 0002 en PDF », « la facture de Mme Ravier sur WhatsApp ».
async function partagerFacture(p) {
  const canal = canalPartage(p);
  const f = await resoudreFacture(p, {
    exigeRepere: "Quelle facture faut-il partager ? Donnez-moi son numéro ou le nom du client.",
  });
  // Le client ne verrait rien : un brouillon ne sort pas de `get_factures_by_token`.
  refuserBrouillon(f);
  const url = lienFacture(f);
  if (!url) {
    throw new Error(`La facture ${f.numero} n'a pas de lien client `
      + `(le chantier n'a pas de lien de suivi). Ouvrez sa fiche une fois, puis réessayez.`);
  }

  if (canal === 'pdf') {
    // `&print=1` : facture-document.html ouvre l'impression en arrivant
    // (« Enregistrer au format PDF »). C'est le MÊME document que celui que le
    // client consulte — pas une seconde mise en page.
    const impression = url + '&print=1';
    let ouvert = null;
    try { if (typeof window !== 'undefined') ouvert = window.open(impression, '_blank', 'noopener'); } catch (_) {}
    return {
      message: `Facture ${f.numero} : le document s'ouvre, choisissez « Télécharger en PDF ».`
        + (ouvert ? '' : '\nSi rien ne s\'est ouvert, appuyez sur le bouton.'),
      geste: { url: impression, libelle: 'Ouvrir la facture' },
      data: { lien: url },
    };
  }

  if (canal === 'whatsapp') {
    const wa = lienWhatsApp(url);
    let ouvert = null;
    try { if (typeof window !== 'undefined') ouvert = window.open(wa, '_blank', 'noopener'); } catch (_) {}
    return {
      message: `Facture ${f.numero} — message WhatsApp prêt avec le lien :\n${url}`
        + (ouvert ? '\nWhatsApp s\'ouvre.' : '\nSi WhatsApp ne s\'est pas ouvert, appuyez sur le bouton.'),
      geste: { url: wa, libelle: 'Ouvrir WhatsApp' },
      data: { lien: url },
    };
  }

  const etat = await remettreLien(`Facture ${f.numero}`, url);
  return {
    message: `Facture ${f.numero} — lien à envoyer à votre client :\n${url}` + SUFFIXE_REMISE[etat],
    data: { lien: url },
  };
}

// NAVIGATION : « le client est là, on signe ». N'enregistre aucune signature —
// il ouvre la feuille sur laquelle le CLIENT trace la sienne, devant l'artisan.
async function signerSurEcran(p) {
  const { cible, ctx } = await resoudreDevisUI(p, 'faire signer');
  // Pas d'uuid = pas encore en base : rien à signer côté serveur. On le dit,
  // plutôt que d'ouvrir une feuille dont l'enregistrement échouera après coup.
  if (!cible._dbId) {
    throw new Error(`Le devis ${cible.id} n'est pas encore synchronisé : `
      + `attendez le retour du réseau pour le faire signer.`);
  }
  const surEcranDevis = ctx.page === 'devis'
    && typeof window !== 'undefined'
    && typeof window.openQuoteDetailModal === 'function'
    && typeof window.openSignatureForCurrentQuote === 'function';
  if (surEcranDevis) {
    // Déjà sur l'écran : on ouvre le devis puis la signature, sans recharger la
    // page (un rechargement fermerait le panneau de l'assistant en cours d'usage).
    window.openQuoteDetailModal(cible.id);
    window.openSignatureForCurrentQuote();
    return {
      message: `Devis ${cible.id} — ${cible.client} : la signature est ouverte, `
        + `passez l'écran à votre client.`,
    };
  }
  const url = `./devis.html?id=${encodeURIComponent(cible._dbId)}&signer=1`;
  if (typeof window !== 'undefined' && window.location) window.location.href = url;
  return { message: `J'ouvre le devis ${cible.id} pour la signature.`, lien: url };
}

// ── Grille de prix et prix d'achat (05/09/2026) ────────────────────────────
//
// REGLE ABSOLUE : le prix vient de l'artisan, jamais d'ici. Ces quatre
// executants n'estiment rien, ne completent rien, ne reprennent aucun bareme.
// Un prix absent fait echouer l'action avec une question precise ; c'est le
// seul comportement acceptable, parce qu'un tarif invente part chez son client
// a son nom et lui coute de l'argent sur chaque chantier.
//
// Deux grilles, deux tables, jamais melangees :
//   - VENTE  : ce qu'il facture. window.BtpPriceGridManager (localStorage +
//              remontee vers la table `artisan_prix`, faite dans
//              addOrUpdateItem des que la source est une source artisan).
//   - ACHAT  : ce qu'il paie a son negoce. Table `artisan_prix_achat` sous RLS,
//              par app-materiaux.js — le meme chemin que le volet Fournitures
//              d'un devis et que la liste de profile-entreprise.html.
//
// Les lignes creees par l'assistant portent la source « Assistant » : c'est un
// prix DE L'ARTISAN (il l'a dicte), au meme titre que « Saisie Artisan » et
// « Ajuste manuellement ». Les 10 entrees livrees avec l'application portent
// « Catalogue BatiSpot » et ne sont JAMAIS les siennes.

const SOURCE_CATALOGUE = 'Catalogue BatiSpot';

function uniteLisible(u) {
  const x = norm(u).replace(/\s+/g, '');
  return { m2: 'm²', m3: 'm³', unite: 'u', unité: 'u', piece: 'u', pièce: 'u' }[x] || (u || 'u').toString().trim();
}

function prixDicte(valeur, quoi) {
  const n = (typeof valeur === 'string')
    ? parseFloat(valeur.replace(/\s/g, '').replace(',', '.'))
    : Number(valeur);
  if (!(n > 0)) {
    throw new Error(`Je n'ai pas votre prix pour « ${quoi} ». Dites-moi combien : je ne l'invente pas.`);
  }
  return n;
}

// Cherche une ligne de la grille par libelle : egalite d'abord, inclusion
// ensuite. Le catalogue est inclus dans la recherche — modifier un prix du
// catalogue, c'est le faire sien. Plusieurs candidats : on ne touche a rien.
function chercherDansGrille(designation) {
  const d = sansAccents(designation);
  if (!d) throw new Error('Quel ouvrage de votre grille ?');
  const grille = grilleArtisan();
  let trouves = grille.filter((it) => it && sansAccents(it.label) === d);
  if (!trouves.length) {
    trouves = grille.filter((it) => {
      const lab = sansAccents(it && it.label);
      return lab && (lab.includes(d) || d.includes(lab));
    });
  }
  if (!trouves.length) return null;
  if (trouves.length > 1) {
    throw new Error(
      `Plusieurs lignes de votre grille correspondent à « ${designation} » : `
      + trouves.map((it) => `${it.label} (${euro(it.price)} / ${it.unit})`).join(' · ')
      + '. Laquelle ?'
    );
  }
  return trouves[0];
}

async function ajouterPrixGrille(p) {
  const designation = (p.designation || '').toString().trim();
  if (!designation) throw new Error('Quel ouvrage faut-il ajouter à votre grille ?');
  // L'unite n'a pas de defaut ici : 32 EUR du m2 et 32 EUR piece ne sont pas
  // le meme tarif, et c'est SON devis qui partirait faux chez son client.
  if (!(p.unite || '').toString().trim()) {
    throw new Error(`Dans quelle unité facturez-vous « ${designation} » ? (m², ml, u, forfait…)`);
  }
  const unite = uniteLisible(p.unite);
  const prix = prixDicte(p.prix_ht != null ? p.prix_ht : p.prix, designation);

  const g = (typeof window !== 'undefined') ? window.BtpPriceGridManager : null;
  if (!g || typeof g.addOrUpdateItem !== 'function') {
    throw new Error("Votre grille de prix n'est pas disponible sur cet écran.");
  }
  const avant = chercherExactement(designation);
  g.addOrUpdateItem(null, designation, unite, prix, (p.categorie || 'Personnalisé').toString().trim(), 'Assistant');
  return {
    message: avant
      ? `« ${designation} » était déjà dans votre grille : le prix passe à ${euro(prix)} / ${unite}.`
      : `« ${designation} » ajouté à votre grille : ${euro(prix)} / ${unite}.`,
    data: { designation, unite, prix_ht: prix },
    lien: './profile-entreprise.html?onglet=grille',
  };
}

// addOrUpdateItem apparie sur le libelle exact : on regarde la meme chose pour
// savoir si le message doit dire « ajouté » ou « mis à jour ».
function chercherExactement(designation) {
  const d = norm(designation);
  return grilleArtisan().find((it) => it && norm(it.label) === d) || null;
}

async function modifierPrixGrille(p) {
  const designation = (p.designation || '').toString().trim();
  const item = chercherDansGrille(designation);
  if (!item) {
    throw new Error(
      `« ${designation} » n'est pas dans votre grille. Dites-moi son prix et son unité, je l'ajoute.`
    );
  }
  const prix = prixDicte(p.prix_ht != null ? p.prix_ht : p.prix, item.label);
  const ancien = Number(item.price) || 0;

  const g = (typeof window !== 'undefined') ? window.BtpPriceGridManager : null;
  if (!g || typeof g.addOrUpdateItem !== 'function') {
    throw new Error("Votre grille de prix n'est pas disponible sur cet écran.");
  }
  // Corriger un prix du catalogue, c'est le faire sien : la ligne cesse d'être
  // « Catalogue BatiSpot » et devient un prix de l'artisan.
  const source = item.source === SOURCE_CATALOGUE ? 'Ajusté manuellement' : (item.source || 'Assistant');
  g.addOrUpdateItem(item.id, item.label, item.unit, prix, item.category, source);
  return {
    message: `« ${item.label} » : ${euro(ancien)} → ${euro(prix)} / ${item.unit}.`,
    data: { designation: item.label, ancien_prix: ancien, prix_ht: prix },
    lien: './profile-entreprise.html?onglet=grille',
  };
}

async function enregistrerPrixAchatAction(p) {
  const designation = (p.designation || '').toString().trim();
  if (!designation) throw new Error('Quel matériau ?');
  // Repli sur 'u' quand l'unite d'achat n'est pas dite : c'est deja le defaut
  // de enregistrerPrixAchat() et du volet Fournitures d'un devis. Contrairement
  // au prix de VENTE, rien ne part chez le client — seule la marge s'en ressent.
  const unite = uniteLisible(p.unite);
  const prix = prixDicte(p.prix != null ? p.prix : p.prix_achat, designation);
  const fournisseur = (p.fournisseur || '').toString().trim() || null;

  const mod = await import('./app-materiaux.js');
  // source: 'saisie' et non 'assistant'. La colonne porte une contrainte
  // CHECK (source in ('saisie','facture')) — voir
  // app/supabase-prix-achat-materiaux-2026-09-04.sql ; ecrire 'assistant'
  // fait echouer l'INSERT (verifie en base le 05/09). Et 'saisie' est exact :
  // ce prix, l'artisan vient de le DICTER, il ne sort d'aucune facture lue.
  await mod.enregistrerPrixAchat({
    label: designation, unit: unite, prix, fournisseur, source: 'saisie',
  });
  return {
    message: `Prix d'achat enregistré : ${designation} à ${euro(prix)} / ${unite}`
      + (fournisseur ? ` chez ${fournisseur}` : '') + '. Il servira au calcul de vos marges.',
    data: { designation, unite, prix, fournisseur },
    lien: './profile-entreprise.html?onglet=grille',
  };
}

async function supprimerPrixAchatAction(p) {
  const designation = (p.designation || '').toString().trim();
  if (!designation) throw new Error("Quel prix d'achat faut-il supprimer ?");

  const mod = await import('./app-materiaux.js');
  const liste = await mod.chargerPrixAchat({ recharger: true });
  const d = sansAccents(designation);
  let trouves = liste.filter((x) => sansAccents(x.label) === d);
  if (!trouves.length) {
    trouves = liste.filter((x) => {
      const lab = sansAccents(x.label);
      return lab && (lab.includes(d) || d.includes(lab));
    });
  }
  if (!trouves.length) {
    throw new Error(`Aucun prix d'achat « ${designation} » enregistré.`);
  }
  if (trouves.length > 1) {
    throw new Error(
      `Plusieurs prix d'achat correspondent à « ${designation} » : `
      + trouves.map((x) => `${x.label} (${euro(x.prix_achat)} / ${x.unit})`).join(' · ')
      + '. Lequel ?'
    );
  }
  const cible = trouves[0];
  await mod.supprimerPrixAchat(cible.id);
  // Relecture obligatoire : sous RLS, un DELETE sans droit renvoie 204 avec
  // zéro ligne touchée, jamais une erreur. Sans ce contrôle, on annoncerait
  // « supprimé » alors que la ligne est toujours là.
  const apres = await mod.chargerPrixAchat({ recharger: true });
  if (apres.some((x) => x.id === cible.id)) {
    throw new Error(`« ${cible.label} » n'a pas pu être supprimé. Réessayez depuis Mon entreprise › Grille de prix.`);
  }
  return {
    message: `Prix d'achat « ${cible.label} » supprimé.`,
    data: { designation: cible.label },
  };
}

// ── NAVIGATION : « je veux déposer mes anciens devis » ──
//
// N'écrit aucun prix : ouvre l'onglet Grille de prix sur le bon bloc de dépôt.
// La page lit `import=` (voir chargerGrille dans profile-entreprise.html),
// monte l'import avec la bonne cible et met le bloc en évidence. C'est
// l'artisan qui choisit son fichier, puis coche ligne par ligne.
async function deposerFichier(p) {
  const c = norm(p.cible);
  if (!c) throw new Error('Vos anciens devis (prix de vente) ou vos factures fournisseurs (prix d\'achat) ?');
  const achat = c.includes('achat') || c.includes('fournisseur') || c.includes('facture');
  location.href = `./profile-entreprise.html?onglet=grille&import=${achat ? 'achat' : 'vente'}`;
  return {
    message: achat
      ? "J'ouvre le dépôt de vos factures fournisseurs. Choisissez votre fichier : PDF ou photo."
      : "J'ouvre le dépôt de vos anciens devis. Choisissez votre fichier : PDF ou photo.",
  };
}


// ── LES NEUF LECTURES (07/09/2026) ───────────────────────────────────────────
//
// Issues de la cartographie des capacités : neuf demandes courantes auxquelles
// l'assistant ne savait pas répondre alors que l'écran, lui, savait. Aucune
// n'écrit quoi que ce soit — elles répondent tout de suite, sans carte de
// validation. Chacune rend { message, lien, data } et dit ce qu'elle n'a pas
// trouvé plutôt que de rendre une liste vide.

// « J'ai des nouvelles demandes ? » — le nerf commercial du produit.
// La vue `demandes_publiques` masque les coordonnées tant que la demande n'est
// pas acceptée : on l'explique au lieu d'afficher des champs vides.
async function listerDemandes(p) {
  const dem = await listNouvellesDemandes();
  let liste = dem || [];
  if (p && p.ville) {
    const q = norm(p.ville);
    liste = liste.filter((d) => norm(d.code_postal).includes(q) || norm(d.departement).includes(q));
  }
  if (!liste.length) {
    return { message: p && p.ville
      ? `Aucune demande en attente pour « ${p.ville} ».`
      : "Aucune nouvelle demande pour l'instant.", lien: './dashboard.html' };
  }
  const jours = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  const lignes = liste.slice(0, 10).map((d) => {
    const age = jours(d.created_at);
    return `· ${d.type_travaux || 'Travaux'} — ${d.code_postal || d.departement || 'secteur non précisé'}`
      + (d.budget_estime ? ` · budget annoncé ${d.budget_estime}` : '')
      + ` · reçue ${age === 0 ? "aujourd'hui" : `il y a ${age} j`}`;
  });
  return {
    message: `${liste.length} demande(s) en attente.\n\n${lignes.join('\n')}\n\n`
      + `Les coordonnées du client apparaissent quand vous acceptez la demande.`,
    lien: './dashboard.html', data: liste,
  };
}

// « Qu'est-ce que M. Benali m'a répondu ? » — et surtout : qui attend une
// réponse. Sans ça, l'assistant proposait des relances à des clients qui
// avaient déjà écrit.
async function messagesRecus(p) {
  const chantiers = await listChantiers();
  const cible = p && (p.client_nom || p.client) ? norm(p.client_nom || p.client) : null;
  let concernes = chantiers.filter((c) => c.status !== 'termine');
  if (cible) {
    concernes = chantiers.filter((c) => norm(c.client_name).includes(cible)
      || norm(c.adresse).includes(cible));
    if (!concernes.length) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.client} ».`);
  }
  const fils = await Promise.all(concernes.map(async (c) => {
    try { return { c, msgs: await listMessages(c.id) }; }
    catch (_) { return { c, msgs: [] }; }
  }));
  // Ce qui compte n'est pas « y a-t-il des messages » mais « le DERNIER est-il
  // du client » : c'est ça, un message en attente de réponse.
  const attente = [], lus = [];
  fils.forEach(({ c, msgs }) => {
    if (!msgs || !msgs.length) return;
    const dernier = msgs[msgs.length - 1];
    (dernier.author === 'client' ? attente : lus).push({ c, dernier, n: msgs.length });
  });
  if (!attente.length && !lus.length) {
    return { message: cible ? `Aucun message échangé avec ${concernes[0].client_name}.`
      : 'Aucun message client pour le moment.', lien: './messages.html' };
  }
  const extrait = (t) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, 110);
  const bloc = (x) => `· ${x.c.client_name} : « ${extrait(x.dernier.content)} »`;
  const parts = [];
  if (attente.length) {
    parts.push(`${attente.length} message(s) en attente de votre réponse :\n`
      + attente.map(bloc).join('\n'));
  }
  if (lus.length && !cible) {
    parts.push(`\n${lus.length} fil(s) où vous avez écrit en dernier.`);
  } else if (lus.length && cible) {
    parts.push(`\nDernier échange : « ${extrait(lus[0].dernier.content)} » (vous).`);
  }
  return { message: parts.join('\n'), lien: './messages.html',
           data: { attente: attente.length, lus: lus.length } };
}

// « Qu'est-ce qui s'est dit sur le chantier ? » — le fil d'équipe en lecture.
// L'écriture existait déjà (envoyer_message), pas la lecture.
async function lireFilEquipe(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.chantier || '?'} ».`);
  const msgs = await listMessagesEquipe(chantier.id);
  if (!msgs || !msgs.length) {
    return { message: `Aucun message sur le fil du chantier ${chantier.client_name}.`,
             lien: './equipe.html' };
  }
  const n = Math.max(1, Math.min(Number(p.limite) || 15, 50));
  const derniers = msgs.slice(-n);
  const quand = (d) => {
    try { return new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch (_) { return ''; }
  };
  const lignes = derniers.map((m) =>
    `${quand(m.created_at)} — ${m.author === 'membre' ? 'Équipe' : 'Vous'} : `
    + String(m.content || '').replace(/\s+/g, ' ').trim().slice(0, 160));
  return {
    message: `Fil du chantier ${chantier.client_name}`
      + (msgs.length > derniers.length ? ` (${derniers.length} derniers sur ${msgs.length})` : '')
      + ` :\n\n${lignes.join('\n')}`,
    lien: './equipe.html', data: derniers,
  };
}

// « Montre-moi les photos du chantier Ravier. »
// Le bucket est PRIVÉ : sans signPhotoUrls, les URL ne chargent pas.
async function listerPhotos(p) {
  let photos, titre;
  if (p && (p.client_nom || p.client || p.chantier)) {
    const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
    if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.chantier} ».`);
    photos = await listPhotos(chantier.id);
    titre = `chantier ${chantier.client_name}`;
  } else {
    photos = await listPhotosEquipe(40);
    titre = 'vos chantiers';
  }
  let liste = photos || [];
  if (p && p.phase) {
    const q = norm(p.phase);
    liste = liste.filter((x) => norm(x.phase) === q);
  }
  if (!liste.length) {
    return { message: p && p.phase
      ? `Aucune photo « ${p.phase} » sur ${titre}.`
      : `Aucune photo sur ${titre}.`, lien: './photos.html' };
  }
  try { await signPhotoUrls(liste); } catch (_) { /* la liste reste lisible sans vignette */ }
  const parPhase = {};
  liste.forEach((x) => { const k = x.phase || 'autre'; parPhase[k] = (parPhase[k] || 0) + 1; });
  const visibles = liste.filter((x) => x.visible_client).length;
  return {
    message: `${liste.length} photo(s) sur ${titre}.\n`
      + Object.entries(parPhase).map(([k, v]) => `  ${k} : ${v}`).join('\n')
      + `\n\n${visibles} déjà visible(s) par le client`
      + (visibles < liste.length ? `, ${liste.length - visibles} non partagée(s).` : '.'),
    lien: './photos.html', data: liste,
  };
}

// « Ma décennale expire quand ? » — le coffre en lecture, avec l'alerte.
async function listerCoffre(p) {
  const [docs, expirants] = await Promise.all([
    listCoffreDocs(),
    coffreDocsExpirants(60).catch(() => []),
  ]);
  let liste = docs || [];
  if (p && p.categorie) {
    const q = norm(p.categorie);
    liste = liste.filter((d) => norm(d.categorie).includes(q) || norm(d.nom).includes(q));
    if (!liste.length) {
      const dispo = [...new Set((docs || []).map((d) => d.categorie))].join(', ');
      throw new Error(`Aucune pièce « ${p.categorie} » dans votre coffre.`
        + (dispo ? ` Disponibles : ${dispo}.` : ''));
    }
  }
  if (!liste.length) {
    return { message: "Votre coffre est vide. Rangez-y vos attestations : elles seront rappelées avant expiration.",
             lien: './coffre.html' };
  }
  const parCat = {};
  liste.forEach((d) => { const k = d.categorie || 'autre'; (parCat[k] = parCat[k] || []).push(d); });
  const lignes = Object.entries(parCat).map(([k, v]) =>
    `  ${k} : ${v.length} pièce(s)` + (v[0].expire_le ? ` — expire le ${v[0].expire_le}` : ''));
  const alerte = (expirants || []).length
    ? `\n\n⚠ ${expirants.length} pièce(s) expire(nt) sous 60 jours : `
      + expirants.map((e) => `${e.nom || e.categorie} (${e.expire_le})`).join(', ')
    : '';
  return { message: `${liste.length} pièce(s) dans votre coffre.\n${lignes.join('\n')}${alerte}`,
           lien: './coffre.html', data: liste };
}

// « Qui a signé ? qui n'a pas répondu ? » — l'état des devis côté client.
// Le nombre de jours depuis l'envoi est ce qui décide d'une relance.
async function reponsesDevis(p) {
  const devis = await chargerDevis({});
  let liste = devis || [];
  const cible = p && (p.client_nom || p.client) ? norm(p.client_nom || p.client) : null;
  if (cible) {
    liste = liste.filter((d) => norm(d.client && d.client.name).includes(cible)
      || norm(d.clientName).includes(cible) || norm(d.client_nom).includes(cible));
    if (!liste.length) throw new Error(`Aucun devis pour « ${p.client_nom || p.client} ».`);
  }
  if (!liste.length) return { message: 'Aucun devis pour le moment.', lien: './devis.html' };
  const nomDe = (d) => (d.client && d.client.name) || d.clientName || d.client_nom || 'client';
  const jours = (iso) => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : null;
  const par = { accepte: [], refuse: [], envoye: [], brouillon: [], expire: [] };
  liste.forEach((d) => { (par[d.status] = par[d.status] || []).push(d); });
  const parts = [];
  if (par.accepte.length) parts.push(`${par.accepte.length} accepté(s) : ` + par.accepte.map(nomDe).join(', '));
  if (par.refuse.length) parts.push(`${par.refuse.length} refusé(s) : ` + par.refuse.map(nomDe).join(', '));
  if (par.envoye.length) {
    const sans = par.envoye.map((d) => {
      const j = jours(d.sent_at || d.sentAt);
      return `${nomDe(d)}${j === null ? '' : ` (${j} j)`}`;
    });
    parts.push(`${par.envoye.length} sans réponse : ${sans.join(', ')}`);
  }
  if (par.brouillon.length) parts.push(`${par.brouillon.length} brouillon(s), jamais envoyé(s).`);
  if (par.expire && par.expire.length) parts.push(`${par.expire.length} expiré(s).`);
  return { message: parts.join('\n'), lien: './devis.html', data: par };
}

// « Il a joint des plans ? » — les documents déposés sur une demande de devis.
async function listerDocumentsClient(p) {
  const docs = await listClientDocs();
  let liste = docs || [];
  if (p && (p.client_nom || p.client)) {
    const q = norm(p.client_nom || p.client);
    liste = liste.filter((d) => norm(d.file_name).includes(q));
  }
  if (!liste.length) {
    return { message: p && p.client_nom
      ? `Aucun document reçu pour « ${p.client_nom} ».`
      : 'Aucun document reçu de vos prospects.', lien: './dashboard.html' };
  }
  const lignes = liste.slice(0, 12).map((d) =>
    `· ${d.file_name || 'document'} (${d.doc_type || 'pièce'})`
    + ` — déposé par ${d.uploader_role === 'client' ? 'le client' : 'vous'}`
    + ` le ${String(d.created_at || '').slice(0, 10)}`);
  return { message: `${liste.length} document(s) reçu(s).\n\n${lignes.join('\n')}`,
           lien: './dashboard.html', data: liste };
}

// « Où est-ce que je perds de l'argent ? » — la rentabilité d'ENSEMBLE.
// calculer_marge fait UN chantier ; celle-ci les classe tous.
async function analyseRentabilite(p) {
  const [{ data: devis, error }, depParChantier, chantiers] = await Promise.all([
    supabase.from('devis_visible').select('status, total_ht, cout_prevu_ht, chantier_id'),
    listDepensesParChantier(),
    listChantiers(),
  ]);
  if (error) throw error;
  const acceptes = (devis || []).filter((d) => d.status === 'accepte' && d.chantier_id);
  if (!acceptes.length) {
    return { message: "Aucun devis accepté : la rentabilité se calculera dès votre premier chantier signé.",
             lien: './analyses.html' };
  }
  const nomDe = new Map(chantiers.map((c) => [c.id, c.client_name]));
  const parChantier = new Map();
  acceptes.forEach((d) => {
    const e = parChantier.get(d.chantier_id) || { ca: 0, prevu: 0 };
    e.ca += Number(d.total_ht || 0); e.prevu += Number(d.cout_prevu_ht || 0);
    parChantier.set(d.chantier_id, e);
  });
  const lignes = [...parChantier.entries()].map(([id, e]) => {
    const dep = depParChantier.get(id) || 0;
    const marge = e.ca - dep;
    return { nom: nomDe.get(id) || 'Chantier', ca: e.ca, dep, marge,
             taux: e.ca > 0 ? Math.round((marge / e.ca) * 100) : null };
  }).sort((a, b) => (b.taux ?? -999) - (a.taux ?? -999));
  const caTotal = lignes.reduce((s, l) => s + l.ca, 0);
  const depTotal = lignes.reduce((s, l) => s + l.dep, 0);
  const sansDepense = lignes.filter((l) => l.dep === 0).length;
  const detail = lignes.map((l) => `· ${l.nom} : ${euro(l.ca)} − ${euro(l.dep)} = ${euro(l.marge)}`
    + (l.taux === null ? '' : ` (${l.taux} %)`)).join('\n');
  return {
    message: `Sur ${lignes.length} chantier(s) signé(s) : ${euro(caTotal)} facturés, `
      + `${euro(depTotal)} de dépenses, marge ${euro(caTotal - depTotal)}.\n\n${detail}`
      + (sansDepense ? `\n\n${sansDepense} chantier(s) sans dépense enregistrée : leur marge est optimiste.` : ''),
    lien: './analyses.html', data: lignes,
  };
}

// « Combien d'heures Karim a fait ce mois-ci ? »
// Le coût n'apparaît que si le taux horaire est renseigné — on ne l'invente pas.
async function heuresParMembre(p) {
  const [taches, membres, taux, chantiers] = await Promise.all([
    listTachesMainDoeuvre(),
    listMembres(),
    listMembresTauxHoraire().catch(() => []),
    listChantiers(),
  ]);
  let lignes = taches || [];
  if (p && (p.client_nom || p.client || p.chantier)) {
    const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
    if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.chantier} ».`);
    lignes = lignes.filter((t) => t.chantier_id === chantier.id);
  }
  const tauxDe = new Map((taux || []).map((t) => [t.id, t.taux_horaire]));
  const nomDe = new Map((membres || []).map((m) => [m.id, [m.prenom, m.nom].filter(Boolean).join(' ')]));
  const cumul = new Map();
  lignes.forEach((t) => {
    const h = Number(t.duree_reelle_h) || 0;
    if (!h) return;
    const cle = t.assigne_id || (t.mobilise_artisan ? '__moi__' : (t.assigne_a || '__non_assigne__'));
    const e = cumul.get(cle) || { h: 0, n: 0 };
    e.h += h; e.n += 1; cumul.set(cle, e);
  });
  if (p && p.membre) {
    const cible = await trouverMembre(p.membre);
    if (!cible) throw new Error(`Aucun membre d'équipe nommé « ${p.membre} ».`);
    const e = cumul.get(cible.id);
    if (!e) return { message: `Aucune heure validée pour ${cible.prenom} sur cette période.`, lien: './equipe.html' };
    const t = tauxDe.get(cible.id);
    return { message: `${cible.prenom} : ${e.h} h validées sur ${e.n} étape(s)`
      + (t ? `, soit ${euro(e.h * Number(t))} de main-d'œuvre.` : `.\nSon taux horaire n'est pas renseigné : le coût ne peut pas être calculé.`),
      lien: './equipe.html', data: { heures: e.h, etapes: e.n } };
  }
  if (!cumul.size) {
    return { message: "Aucune heure validée pour l'instant. Les heures se valident à la fin d'une étape.",
             lien: './equipe.html' };
  }
  const sansTaux = [];
  const rendu = [...cumul.entries()].map(([cle, e]) => {
    const nom = cle === '__moi__' ? 'Vous'
      : cle === '__non_assigne__' ? 'Non assigné'
      : (nomDe.get(cle) || cle);
    const t = tauxDe.get(cle);
    if (!t && cle !== '__moi__' && cle !== '__non_assigne__') sansTaux.push(nom);
    return `· ${nom} : ${e.h} h` + (t ? ` — ${euro(e.h * Number(t))}` : '');
  }).join('\n');
  return {
    message: `${total} h validées au total.\n\n${rendu}`
      + (sansTaux.length ? `\n\nTaux horaire manquant pour : ${sansTaux.join(', ')}.` : ''),
    lien: './equipe.html', data: Object.fromEntries(cumul),
  };
}


// ── LES TREIZE ÉCRITURES ET GESTION (07/09/2026) ──────────────────────────────
//
// Complètent les 22 outils issus de la cartographie des capacités :
// 5 écritures simples, 6 écritures à visibilité externe / client, 2 destructifs.
// Toute écriture passe par la session de l'artisan (RLS pro_id = auth.uid()).
// Réutilise les fonctions de app/js/supabase.js sans requête parallèle.

// ── 1. modifier_mon_entreprise ─────────────────────────────────────────────
// Met à jour les informations de l'entreprise de l'artisan (pro_profiles)
// et les réglages d'équipe (parametres_equipe).
// N'écrit QUE les champs fournis par l'artisan — jamais de valeur inventée.
async function modifierMonEntreprise(p) {
  const patchProfile = {};
  const patchEquipe = {};
  const modifies = [];

  // E-mail du comptable (artisan_leads.email_comptable) : c'est lui qui rend
  // « envoie le dossier à mon comptable » possible sans question.
  if (p.email_comptable != null || p.emailComptable != null) {
    const v = String(p.email_comptable ?? p.emailComptable).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) throw new Error("L'adresse e-mail du comptable n'est pas valide.");
    const { data: s0 } = await supabase.auth.getSession();
    const uid = s0 && s0.session && s0.session.user && s0.session.user.id;
    if (!uid) throw new Error('Session expirée, reconnectez-vous.');
    const { error: eC } = await supabase.from('artisan_leads').update({ email_comptable: v }).eq('user_id', uid);
    if (eC) throw eC;
    modifies.push(`e-mail du comptable (${v})`);
  }

  if (p.taux_horaire_ttc != null || p.taux_horaire != null || p.tauxHoraire != null) {
    const v = Number(p.taux_horaire_ttc ?? p.taux_horaire ?? p.tauxHoraire);
    if (!isNaN(v) && v >= 0) {
      patchProfile.taux_horaire_ttc = v;
      modifies.push(`taux horaire (${euro(v)} TTC)`);
    }
  }
  if (p.display_name != null || p.displayName != null || p.nom_entreprise != null) {
    const v = String(p.display_name ?? p.displayName ?? p.nom_entreprise).trim();
    if (v) { patchProfile.display_name = v; modifies.push(`nom commercial (« ${v} »)`); }
  }
  if (p.address != null || p.adresse != null) {
    const v = String(p.address ?? p.adresse).trim();
    if (v) { patchProfile.address = v; modifies.push(`adresse (« ${v} »)`); }
  }
  if (p.phone != null || p.telephone != null) {
    const v = String(p.phone ?? p.telephone).trim();
    if (v) { patchProfile.phone = v; modifies.push(`téléphone (${v})`); }
  }
  if (p.siret != null) {
    const v = String(p.siret).trim();
    if (v) { patchProfile.siret = v; modifies.push(`SIRET (${v})`); }
  }
  if (p.tva_intracom != null || p.tvaIntracom != null) {
    const v = String(p.tva_intracom ?? p.tvaIntracom).trim();
    if (v) { patchProfile.tva_intracom = v; modifies.push(`TVA intracommunautaire (${v})`); }
  }
  if (p.forme_juridique != null || p.formeJuridique != null) {
    const v = String(p.forme_juridique ?? p.formeJuridique).trim();
    if (v) { patchProfile.forme_juridique = v; modifies.push(`forme juridique (${v})`); }
  }
  if (p.assurance_nom != null || p.assuranceNom != null) {
    const v = String(p.assurance_nom ?? p.assuranceNom).trim();
    if (v) { patchProfile.assurance_nom = v; modifies.push(`assureur décennale (${v})`); }
  }
  if (p.assurance_police != null || p.assurancePolice != null) {
    const v = String(p.assurance_police ?? p.assurancePolice).trim();
    if (v) { patchProfile.assurance_police = v; modifies.push(`police d'assurance (${v})`); }
  }
  if (p.assurance_couverture != null || p.assuranceCouverture != null) {
    const v = String(p.assurance_couverture ?? p.assuranceCouverture).trim();
    if (v) { patchProfile.assurance_couverture = v; modifies.push(`couverture assurance (${v})`); }
  }
  if (p.frais_deplacement != null || p.fraisDeplacement != null) {
    const v = Number(p.frais_deplacement ?? p.fraisDeplacement);
    if (!isNaN(v) && v >= 0) {
      patchProfile.frais_deplacement = v;
      modifies.push(`frais de déplacement (${euro(v)})`);
    }
  }
  if (p.default_tva != null || p.defaultTva != null) {
    const v = Number(p.default_tva ?? p.defaultTva);
    if (!isNaN(v) && v >= 0) {
      patchProfile.default_tva = v;
      modifies.push(`TVA par défaut (${v} %)`);
    }
  }
  if (p.default_validite_jours != null || p.defaultValiditeJours != null) {
    const v = Number(p.default_validite_jours ?? p.defaultValiditeJours);
    if (!isNaN(v) && v > 0) {
      patchProfile.default_validite_jours = v;
      modifies.push(`validité des devis (${v} j)`);
    }
  }
  if (p.default_conditions_paiement != null || p.defaultConditionsPaiement != null) {
    const v = String(p.default_conditions_paiement ?? p.defaultConditionsPaiement).trim();
    if (v) { patchProfile.default_conditions_paiement = v; modifies.push(`conditions de paiement`); }
  }
  if (p.iban != null) {
    const v = String(p.iban).trim();
    if (v) { patchProfile.iban = v; modifies.push(`IBAN (${v})`); }
  }

  if (p.chef_voit_prix !== undefined) {
    patchEquipe.chef_voit_prix = p.chef_voit_prix === true;
    modifies.push(`visibilité des prix chef (${p.chef_voit_prix ? 'activée' : 'désactivée'})`);
  }
  if (p.chef_voit_marges !== undefined) {
    patchEquipe.chef_voit_marges = p.chef_voit_marges === true;
    modifies.push(`visibilité des marges chef (${p.chef_voit_marges ? 'activée' : 'désactivée'})`);
  }

  if (!modifies.length) {
    throw new Error("Aucune information d'entreprise à modifier n'a été transmise.");
  }

  let profileData = null;
  if (Object.keys(patchProfile).length > 0) {
    profileData = await upsertMyProfile(patchProfile);
  }
  if (Object.keys(patchEquipe).length > 0) {
    await majParametresEquipe(patchEquipe);
  }

  return {
    message: `Informations de votre entreprise mises à jour : ${modifies.join(', ')}.`,
    lien: './profile-entreprise.html',
    data: { profile: profileData, equipe: patchEquipe },
  };
}

// ── 2. modifier_taux_horaire ───────────────────────────────────────────────
// Modifie le taux horaire d'un coéquipier (membres_equipe).
// Réservé au patron (policy equipe_maj_patron).
async function modifierTauxHoraire(p) {
  if (!p.membre) throw new Error("Précisez pour quel coéquipier modifier le taux horaire.");
  const cible = await trouverMembre(p.membre);
  if (!cible) throw new Error(`Aucun membre d'équipe nommé « ${p.membre} ».`);

  const taux = Number(p.taux_horaire ?? p.taux);
  if (isNaN(taux) || taux < 0) throw new Error("Indiquez un taux horaire valide en euros.");

  try {
    const data = await majTauxHoraireMembre(cible.id, taux);
    // Relire après écriture (Règle RLS)
    const { data: relu } = await supabase
      .from('membres_equipe')
      .select('id, taux_horaire')
      .eq('id', cible.id)
      .maybeSingle();
    if (!relu || Number(relu.taux_horaire) !== taux) {
      throw new Error("Seul le patron de l'entreprise peut modifier le taux horaire d'un coéquipier.");
    }
    return {
      message: `Taux horaire de ${cible.prenom} mis à jour : ${euro(taux)}/h.`,
      lien: './equipe.html',
      data,
    };
  } catch (e) {
    if (e.message && e.message.includes('patron')) throw e;
    throw new Error(e.message || "Seul le patron de l'entreprise peut modifier le taux horaire d'un coéquipier.");
  }
}

// ── 3. relancer_invitation ────────────────────────────────────────────────
// Renvoie l'invitation à un coéquipier qui n'a pas encore rejoint l'équipe.
async function relancerInvitation(p) {
  if (!p.membre) throw new Error("Précisez pour quel coéquipier renvoyer l'invitation.");
  const membres = await listMembres();
  const q = norm(p.membre);
  const cible = (membres || []).find((m) =>
    norm(m.prenom) === q || norm(`${m.prenom} ${m.nom || ''}`).trim() === q || norm(m.email) === q
  ) || (membres || []).find((m) =>
    norm(`${m.prenom} ${m.nom || ''}`).includes(q) || norm(m.email).includes(q)
  );
  if (!cible) throw new Error(`Aucun coéquipier trouvé pour « ${p.membre} ».`);

  const res = await renvoyerInvitation(cible.id);
  const emailDest = (res.membre && res.membre.email) || cible.email;
  return {
    message: res.emailEnvoye
      ? `Invitation renvoyée par e-mail à ${emailDest}.`
      : `Invitation régénérée pour ${cible.prenom}, mais l'e-mail n'a pas pu partir. Transmettez-lui ce lien : ${res.lien}`,
    lien: './equipe.html',
    data: res,
  };
}

// ── 4. retirer_coequipier ──────────────────────────────────────────────────
// Révoque l'accès d'un coéquipier via la RPC revoquer_invitation.
// La ligne reste en base avec statut inactif pour préserver l'historique.
async function retirerCoequipier(p) {
  if (!p.membre) throw new Error("Précisez quel coéquipier retirer de l'équipe.");
  const cible = await trouverMembre(p.membre);
  if (!cible) throw new Error(`Aucun coéquipier trouvé pour « ${p.membre} ».`);

  const res = await retirerMembre(cible.id);
  // Relire après écriture (Règle RLS)
  const { data: relu } = await supabase
    .from('membres_equipe')
    .select('id, statut')
    .eq('id', cible.id)
    .maybeSingle();
  if (relu && relu.statut === 'actif') {
    throw new Error("Seul le patron de l'entreprise peut retirer un coéquipier de l'équipe.");
  }
  const nomComplet = [cible.prenom, cible.nom].filter(Boolean).join(' ');
  return {
    message: `${nomComplet} a été retiré de l'équipe : ses accès sont révoqués. Son historique de chantiers et de messages reste conservé.`,
    lien: './equipe.html',
    data: res,
  };
}

// ── 5. modifier_message ───────────────────────────────────────────────────
// Corrige un message déjà envoyé, tant qu'il n'a pas été lu et que le délai
// n'est pas dépassé (déclencheur messages_garde_modif en base).
async function modifierMessageAction(p) {
  const texte = String(p.nouveau_texte || p.texte || p.message || '').trim();
  if (!texte) throw new Error("Indiquez le nouveau texte corrigé du message.");

  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.client || '?'} ».`);

  const { data: msgs, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chantier_id', chantier.id)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const proMsgs = (msgs || []).filter((m) => m.author !== 'client');
  if (!proMsgs.length) {
    throw new Error(`Aucun message modifiable trouvé sur le chantier ${chantier.client_name}.`);
  }

  let cible = null;
  if (p.repere) {
    const q = norm(p.repere);
    cible = proMsgs.filter((m) => norm(m.content).includes(q)).pop();
    if (!cible) {
      throw new Error(`Aucun message contenant « ${p.repere} » sur le chantier ${chantier.client_name}.`);
    }
  } else {
    cible = proMsgs[proMsgs.length - 1];
  }

  try {
    const modifie = await modifierMessage(cible.id, texte);
    return {
      message: `Message corrigé sur le chantier ${chantier.client_name} :\n« ${texte} »`,
      lien: `./chantier.html?id=${chantier.id}#messages`,
      data: modifie,
    };
  } catch (e) {
    if (e.message && e.message.includes('déjà été lu')) throw e;
    throw new Error("Ce message ne peut plus être modifié (délai dépassé ou déjà lu par le destinataire).");
  }
}

// ── 6. envoyer_photos_client ──────────────────────────────────────────────
// Rend des photos de chantier visibles sur la page de suivi du client.
async function envoyerPhotosClient(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.client || '?'} ».`);

  const photos = await listPhotos(chantier.id);
  if (!photos || !photos.length) {
    throw new Error(`Aucune photo enregistrée sur le chantier ${chantier.client_name}.`);
  }

  let cibles = photos;
  const phase = (p.phase || '').toLowerCase().trim();
  if (phase && phase !== 'toutes' && phase !== 'tous') {
    cibles = photos.filter((ph) => norm(ph.phase) === phase);
    if (!cibles.length) {
      throw new Error(`Aucune photo « ${phase} » trouvée sur le chantier ${chantier.client_name}.`);
    }
  }

  const limite = Number(p.combien);
  if (!isNaN(limite) && limite > 0) {
    cibles = cibles.slice(0, limite);
  }

  const ids = cibles.map((ph) => ph.id).filter(Boolean);
  if (!ids.length) {
    throw new Error(`Aucune photo sélectionnée pour le chantier ${chantier.client_name}.`);
  }

  await setPhotosVisiblesClient(ids, true);

  // Relire après écriture (Règle RLS)
  const { data: verif } = await supabase
    .from('photos')
    .select('id, visible_client')
    .in('id', ids)
    .eq('visible_client', true);
  const reussies = (verif || []).length;
  if (reussies === 0) {
    throw new Error("Impossible de modifier la visibilité des photos (droits insuffisants).");
  }

  const detailPhase = phase && phase !== 'toutes' && phase !== 'tous' ? ` (${phase})` : '';
  return {
    message: `${reussies} photo(s)${detailPhase} rendue(s) visible(s) au client sur le chantier ${chantier.client_name}.`,
    lien: `./chantier.html?id=${chantier.id}&onglet=photos`,
    data: { chantier_id: chantier.id, count: reussies, ids },
  };
}

// ── 7. accepter_demande ───────────────────────────────────────────────────
// Accepte une demande de devis reçue (réservation atomique via RPC claim_demande
// + création de chantier + liaison).
async function accepterDemandeAction(p) {
  const ref = String(p.demande_ref || p.ref || p.demande || '').trim();
  if (!ref) throw new Error("Précisez quelle demande de devis vous souhaitez accepter (nom, ville ou type de travaux).");

  const dem = await listNouvellesDemandes();
  if (!dem || !dem.length) {
    throw new Error("Aucune nouvelle demande de devis en attente.");
  }

  const q = norm(ref);
  const correspondances = dem.filter((d) =>
    d.id === ref ||
    norm(d.type_travaux).includes(q) ||
    norm(d.code_postal).includes(q) ||
    norm(d.departement).includes(q) ||
    norm(d.description).includes(q) ||
    norm(d.client_name).includes(q)
  );

  if (!correspondances.length) {
    const liste = dem.slice(0, 5).map((d) =>
      `· ${d.type_travaux || 'Travaux'} à ${d.code_postal || d.departement || 'secteur non précisé'}`
    ).join('\n');
    throw new Error(`Aucune demande ne correspond à « ${ref} ».\n\nDemandes disponibles :\n${liste}`);
  }

  if (correspondances.length > 1) {
    const options = correspondances.map((d) =>
      `· ${d.type_travaux || 'Travaux'} — ${d.code_postal || d.departement || 'secteur non précisé'}${d.budget_estime ? ` · budget ${d.budget_estime}` : ''}`
    ).join('\n');
    throw new Error(`Plusieurs demandes correspondent à « ${ref} » :\n${options}\n\nPrécisez laquelle vous souhaitez accepter.`);
  }

  const cible = correspondances[0];
  const chantier = await accepterDemande(cible.id, cible);

  // Relire après écriture (Règle RLS)
  const verifChantier = await getChantier(chantier.id);
  if (!verifChantier) {
    throw new Error("La réservation de la demande a échoué. Veuillez réessayer.");
  }

  const lieu = cible.code_postal || cible.departement || '';
  const nomClient = verifChantier.client_name || chantier.client_name || 'le client';
  return {
    message: `Demande acceptée pour ${nomClient} (${cible.type_travaux || 'Travaux'}${lieu ? ' — ' + lieu : ''}). Le chantier a été créé et les coordonnées complètes sont révélées.`,
    lien: `./chantier.html?id=${chantier.id}`,
    data: verifChantier,
  };
}

// ── 8. preparer_pv_reception ──────────────────────────────────────────────
// Établit le procès-verbal de réception d'un chantier (table pv_reception).
// Ne signe pas le document : la signature se fait en présence des parties.
async function preparerPvReception(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.client || '?'} ».`);

  const { data: existants, error: eFind } = await supabase
    .from('pv_reception')
    .select('*')
    .eq('chantier_id', chantier.id)
    .order('created_at', { ascending: false })
    .limit(1);
  if (eFind) throw eFind;

  const pvExistant = existants && existants[0];
  if (pvExistant && pvExistant.signe_le) {
    throw new Error(`Le procès-verbal de réception du chantier ${chantier.client_name} a déjà été signé le ${pvExistant.signe_le.slice(0, 10)}. Un PV déjà signé ne peut pas être remplacé.`);
  }

  const { data: session } = await supabase.auth.getSession();
  const { data: proId } = await supabase.rpc('mon_entreprise');
  const pro = proId || (session && session.user.id);

  const dateRec = p.date_reception || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const avecReserves = p.avec_reserves === true || !!(p.reserves && String(p.reserves).trim());
  const ligne = {
    chantier_id: chantier.id,
    pro_id: pro,
    date_reception: dateRec,
    avec_reserves: avecReserves,
    reserves: avecReserves ? (p.reserves || '').trim() || null : null,
    levee_reserves_avant: (avecReserves && p.levee_reserves_avant) ? p.levee_reserves_avant : null,
    observations: (p.observations || '').trim() || null,
    signataire_nom: (p.signataire_nom || '').trim() || null,
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

  // Relire après écriture (Règle RLS)
  const { data: relu } = await supabase
    .from('pv_reception')
    .select('id, date_reception')
    .eq('id', enregistre.id)
    .maybeSingle();
  if (!relu) {
    throw new Error("L'enregistrement du procès-verbal a échoué (droits insuffisants).");
  }

  return {
    message: `Procès-verbal de réception préparé pour ${chantier.client_name} (date : ${dateRec}${avecReserves ? ' — avec réserves' : ' — sans réserve'}).\n\nLe document est prêt dans le dossier du chantier : la signature se fait directement sur l'écran avec le client.`,
    lien: `./chantier.html?id=${chantier.id}&onglet=docs`,
    data: enregistre,
  };
}

// ── 9. export_comptable ───────────────────────────────────────────────────
// Prépare le dossier comptable (Edge Function dossier-comptable) et l'envoie
// par e-mail au comptable ou le télécharge.
async function exportComptable(p) {
  let debut = p.debut || null;
  let fin = p.fin || null;

  // (Moctar, 09/09 : « pourquoi télécharger si l'envoi se fait via l'appli…
  // pourquoi c'est dans Réglages ») et 12/09 : « Export pour le comptable »
  // posait DEUX questions (période, destination). Défauts décidés ici : ce
  // mois, et téléchargement — l'envoi au comptable ne part que si l'artisan
  // l'a demandé (« envoie à mon comptable »).
  if (!debut && !fin && !p.periode) p.periode = 'ce mois';
  // 12/09, Moctar : « envoyer le dossier directement au comptable » — si son
  // e-mail est connu, c'est la destination par défaut ; sinon téléchargement,
  // et le compte rendu dit comment l'enregistrer.
  const emailMemorise = await emailComptableMemorise();
  if (!p.destination) p.destination = emailMemorise ? 'comptable' : 'telecharger';

  if (!debut && !fin && p.periode) {
    const per = norm(p.periode);
    const now = new Date();
    const an = now.getFullYear();
    const m = now.getMonth(); // 0-indexed

    if (per === 'ce mois' || per === 'mois') {
      debut = `${an}-${String(m + 1).padStart(2, '0')}-01`;
      const der = new Date(an, m + 1, 0).getDate();
      fin = `${an}-${String(m + 1).padStart(2, '0')}-${String(der).padStart(2, '0')}`;
    } else if (per === 'mois dernier') {
      const prevM = m === 0 ? 11 : m - 1;
      const prevAn = m === 0 ? an - 1 : an;
      debut = `${prevAn}-${String(prevM + 1).padStart(2, '0')}-01`;
      const der = new Date(prevAn, prevM + 1, 0).getDate();
      fin = `${prevAn}-${String(prevM + 1).padStart(2, '0')}-${String(der).padStart(2, '0')}`;
    } else if (per === 'ce trimestre' || per === 'trimestre') {
      const qStart = Math.floor(m / 3) * 3;
      debut = `${an}-${String(qStart + 1).padStart(2, '0')}-01`;
      const der = new Date(an, qStart + 3, 0).getDate();
      fin = `${an}-${String(qStart + 3).padStart(2, '0')}-${String(der).padStart(2, '0')}`;
    } else if (per === 'trimestre dernier') {
      let qStart = Math.floor(m / 3) * 3 - 3;
      let qAn = an;
      if (qStart < 0) { qStart = 9; qAn = an - 1; }
      debut = `${qAn}-${String(qStart + 1).padStart(2, '0')}-01`;
      const der = new Date(qAn, qStart + 3, 0).getDate();
      fin = `${qAn}-${String(qStart + 3).padStart(2, '0')}-${String(der).padStart(2, '0')}`;
    } else if (per === 'cette annee' || per === 'annee') {
      debut = `${an}-01-01`;
      fin = `${an}-12-31`;
    } else if (per === 'annee derniere') {
      debut = `${an - 1}-01-01`;
      fin = `${an - 1}-12-31`;
    }
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData && sessionData.session;
  if (!session) throw new Error("Session expirée, reconnectez-vous.");

  const cfg = (typeof window !== 'undefined' && window.__BATISPOT_CONFIG__) || {};
  const dest = norm(p.destination);
  const telecharger = dest === 'telecharger' || dest === 'download';
  const periodeTxt = libellePeriode(debut, fin);
  // « il doit pouvoir se rappeler des documents déjà envoyés » : même période
  // déjà exportée → on le dit, on n'empêche rien.
  let dejaTxt = '';
  try {
    const { data: prec } = await supabase.from('exports_comptables')
      .select('created_at, destination, email')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false }).limit(20);
    const meme = (prec || []).find((e) => true) && (prec || []).filter((e) => e.destination === 'comptable');
    const memePeriode = (prec || []).find((e) => e.destination === 'comptable' && String(e.created_at || '') && (e.debut || null) == (debut || null));
    const d0 = memePeriode || null;
    if (d0) dejaTxt = ` Déjà envoyé le ${dateFr(d0.created_at)} à ${d0.email || 'votre comptable'}.`;
    void meme;
  } catch (_) { /* pas d'historique = pas de blocage */ }

  if (!telecharger) {
    let emailCible = String(p.email || '').trim().toLowerCase();
    if (!emailCible) {
      const { data: lead } = await supabase
        .from('artisan_leads')
        .select('email_comptable')
        .eq('user_id', session.user.id)
        .maybeSingle();
      emailCible = (lead && lead.email_comptable) || '';
    }
    if (!emailCible || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(emailCible)) {
      throw new Error("Adresse e-mail du comptable manquante ou invalide. Renseignez l'e-mail de votre comptable ou demandez à télécharger le dossier.");
    }

    const corps = { envoyer: true, email: emailCible };
    if (debut) corps.debut = debut;
    if (fin) corps.fin = fin;

    const rep = await (typeof window !== 'undefined' && window.bsFetchAvecDelai ? window.bsFetchAvecDelai : fetch)(
      `${cfg.SUPABASE_URL || ''}/functions/v1/dossier-comptable`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(corps),
      },
      90000
    );
    const j = await rep.json().catch(() => ({}));
    if (!rep.ok) {
      const messages = {
        dossier_trop_lourd: `Dossier trop lourd pour un e-mail (${j.taille_mo || '?'} Mo). Téléchargez-le et transmettez-le vous-même.`,
        email_comptable_invalide: "L'adresse e-mail du comptable n'est pas valide.",
        envoi_indisponible: "L'envoi est momentanément indisponible. Téléchargez le dossier en attendant.",
        envoi_echoue: "L'envoi a échoué. Vérifiez l'adresse ou téléchargez le dossier.",
      };
      throw new Error(messages[j.error] || (j.error ? `Erreur : ${j.error}` : `Erreur ${rep.status}`));
    }
    return {
      message: `Dossier comptable ${periodeTxt} envoyé à ${j.envoye_a || emailCible} (vous êtes en copie) — ${j.factures || 0} facture(s), ${j.depenses || 0} dépense(s), ${j.justificatifs || 0} justificatif(s)${j.justificatifs_manquants ? `, ${j.justificatifs_manquants} pièce(s) manquante(s)` : ''}.`
        + resumeTotaux(j.totaux) + dejaTxt,
      lien: './finances.html',
      data: j,
    };
  } else {
    const corps = {};
    if (debut) corps.debut = debut;
    if (fin) corps.fin = fin;

    const rep = await (typeof window !== 'undefined' && window.bsFetchAvecDelai ? window.bsFetchAvecDelai : fetch)(
      `${cfg.SUPABASE_URL || ''}/functions/v1/dossier-comptable`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(corps),
      },
      90000
    );
    if (!rep.ok) {
      let msg = `Erreur ${rep.status}`;
      try { msg = (await rep.json()).error || msg; } catch (_) {}
      throw new Error(msg);
    }
    const blob = await rep.blob();
    const nom = (rep.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'dossier-comptable.zip';
    let resume = null;
    try { resume = JSON.parse(decodeURIComponent(rep.headers.get('X-Bs-Resume') || '')); } catch (_) { resume = null; }
    if (typeof document !== 'undefined') {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = nom;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    return {
      message: `Dossier comptable ${periodeTxt} téléchargé (${nom})`
        + (resume ? ` — ${resume.factures || 0} facture(s), ${resume.depenses || 0} dépense(s), ${resume.justificatifs || 0} justificatif(s).` : '.')
        + resumeTotaux(resume && resume.totaux)
        + (emailMemorise ? '' : " Pour l'envoyer directement la prochaine fois, donnez-moi l'e-mail de votre comptable."),
      lien: './finances.html',
      data: resume || undefined,
    };
  }
}

// E-mail du comptable mémorisé dans Mon entreprise (artisan_leads.email_comptable).
async function emailComptableMemorise() {
  try {
    const { data: s } = await supabase.auth.getSession();
    const uid = s && s.session && s.session.user && s.session.user.id;
    if (!uid) return '';
    const { data: lead } = await supabase.from('artisan_leads').select('email_comptable').eq('user_id', uid).maybeSingle();
    const v = String((lead && lead.email_comptable) || '').trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? v : '';
  } catch (_) { return ''; }
}

// « du 1er au 30 septembre 2026 » — la période en toutes lettres, comme
// l'artisan la dirait à son comptable.
function libellePeriode(debut, fin) {
  const j = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    if (isNaN(d)) return iso;
    const n = d.getDate();
    return `${n === 1 ? '1er' : n} ${d.toLocaleDateString('fr-FR', { month: 'long' })}${''}`;
  };
  const an = (iso) => (iso ? String(iso).slice(0, 4) : '');
  if (debut && fin) {
    return an(debut) === an(fin) ? `du ${j(debut)} au ${j(fin)} ${an(fin)}` : `du ${j(debut)} ${an(debut)} au ${j(fin)} ${an(fin)}`;
  }
  if (debut) return `depuis le ${j(debut)} ${an(debut)}`;
  if (fin) return `jusqu'au ${j(fin)} ${an(fin)}`;
  return 'depuis le début';
}

function dateFr(iso) {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (_) { return String(iso || ''); }
}

// Les chiffres que l'assistant restitue après un export : ventes, achats, TVA.
function resumeTotaux(t) {
  if (!t || !t.ventes || !t.achats) return '';
  const v = t.ventes, a = t.achats;
  return `\nVentes (${v.nb || 0} facture${v.nb > 1 ? 's' : ''}${v.avoirs ? `, ${v.avoirs} avoir${v.avoirs > 1 ? 's' : ''}` : ''}) : ${euro(v.ht)} HT · TVA ${euro(v.tva)} · ${euro(v.ttc)} TTC`
    + `\nAchats (${a.nb || 0} dépense${a.nb > 1 ? 's' : ''}) : ${euro(a.ht)} HT · TVA ${euro(a.tva)} · ${euro(a.ttc)} TTC`
    + `\nTVA nette (collectée − déductible) : ${euro(t.tva_nette)} — indicatif, ce n'est pas la déclaration.`;
}

// Ce que la carte dit AVANT validation, quand il faut lire la base pour le
// savoir (ici : l'e-mail du comptable). Complète detailProposition (synchrone).
export async function detailPropositionAsync(nom, params) {
  const p = params || {};
  try {
    if (nom === 'export_comptable') {
      const per = String(p.periode || (p.debut || p.fin ? '' : 'ce mois')).trim();
      const email = await emailComptableMemorise();
      const dest = norm(p.destination || (email ? 'comptable' : 'telecharger'));
      const envoi = dest !== 'telecharger' && dest !== 'download';
      const cible = String(p.email || '').trim() || email;
      const periode = (p.debut || p.fin) ? libellePeriode(p.debut || null, p.fin || null) : (per ? `période : ${per}` : 'ce mois');
      if (envoi && !cible) return `${periode}. Envoi impossible : aucun e-mail de comptable enregistré — dites-le-moi (« l'e-mail de mon comptable est … ») ou le dossier sera téléchargé.`;
      return `${periode} · ${envoi ? `envoi à ${cible}, vous en copie` : 'téléchargement sur cet appareil'}. Le compte rendu donnera les totaux ventes / achats / TVA.`;
    }
  } catch (_) { /* jamais bloquer la carte */ }
  return '';
}

// ── 10. ranger_document_coffre ────────────────────────────────────────────
// Classe une pièce dans le coffre-fort avec sa catégorie et sa date d'expiration.
// Si le fichier est fourni (File), effectue l'upload ; sinon ouvre le coffre/sélecteur.
async function rangerDocumentCoffre(p) {
  const cat = (p.categorie || p.category || 'autre').toString().trim().toLowerCase();
  const expire = p.expire_le || p.expireLe || null;
  const nom = (p.nom || '').toString().trim();
  const file = p.file || p.fichier || null;

  if (file) {
    const doc = await uploadCoffreDoc(file, {
      categorie: cat,
      expire_le: expire,
      visibilite: 'prive',
    });
    if (nom && doc && doc.id) {
      await supabase.from('coffre_documents').update({ nom }).eq('id', doc.id);
      doc.nom = nom;
    }
    // Relire après écriture (Règle RLS)
    const { data: relu } = await supabase
      .from('coffre_documents')
      .select('id, nom, categorie, expire_le')
      .eq('id', doc.id)
      .maybeSingle();
    if (!relu) {
      throw new Error("L'enregistrement du document a échoué (droits insuffisants).");
    }
    return {
      message: `Pièce « ${nom || file.name} » rangée dans votre coffre (catégorie ${cat}${expire ? ` · expiration le ${expire}` : ''}).`,
      lien: './coffre.html',
      data: relu,
    };
  }

  if (typeof location !== 'undefined') {
    location.href = `./coffre.html`;
  }
  return {
    message: `J'ouvre votre coffre pour ranger votre pièce (${cat}${expire ? ` — expiration le ${expire}` : ''}). Choisissez votre fichier : PDF ou photo.`,
    lien: './coffre.html',
    geste: { fichier: 'coffre', categorie: cat, expire_le: expire, nom },
  };
}

// ── 11. joindre_justificatif ──────────────────────────────────────────────
// Rattache la photo d'un ticket ou facture à une dépense existante.
async function joindreJustificatif(p) {
  const { data: depenses, error } = await supabase
    .from('depenses')
    .select('*')
    .order('date_achat', { ascending: false });
  if (error) throw error;

  if (!depenses || !depenses.length) {
    throw new Error("Aucune dépense enregistrée. Utilisez plutôt « Prendre une photo » (usage ticket) pour créer la dépense et joindre le justificatif en même temps.");
  }

  let candidates = depenses;
  if (p.fournisseur) {
    const qF = norm(p.fournisseur);
    const filtre = candidates.filter((d) => norm(d.fournisseur).includes(qF));
    if (filtre.length) candidates = filtre;
  }
  if (p.montant != null) {
    const m = Number(p.montant);
    if (!isNaN(m) && m > 0) {
      const filtre = candidates.filter((d) =>
        Math.abs(Number(d.montant_ttc || 0) - m) < 0.5 ||
        Math.abs(Number(d.montant_ht || 0) - m) < 0.5
      );
      if (filtre.length) candidates = filtre;
    }
  }
  if (p.date_achat) {
    const filtre = candidates.filter((d) => d.date_achat === p.date_achat);
    if (filtre.length) candidates = filtre;
  }

  const cible = candidates[0];
  if (!cible) {
    throw new Error("Aucune dépense correspondante trouvée. Utilisez « Prendre une photo » (usage ticket) pour créer la dépense avec son justificatif.");
  }

  const file = p.file || p.fichier || null;
  if (file) {
    const path = await uploadJustificatif(file);
    const { data: maj, error: eUp } = await supabase
      .from('depenses')
      .update({ justificatif_path: path })
      .eq('id', cible.id)
      .select()
      .single();
    if (eUp) throw eUp;
    // Relire après écriture (Règle RLS)
    const { data: relu } = await supabase
      .from('depenses')
      .select('id, justificatif_path')
      .eq('id', cible.id)
      .maybeSingle();
    if (!relu || !relu.justificatif_path) {
      throw new Error("Le rattachement du justificatif a échoué (droits insuffisants).");
    }
    return {
      message: `Justificatif rattaché à la dépense ${cible.fournisseur || ''} (${euro(cible.montant_ttc || cible.montant_ht)} du ${cible.date_achat || ''}).`,
      lien: './finances.html?onglet=depenses',
      data: maj,
    };
  }

  if (typeof window !== 'undefined' && typeof window.bsAssistantOuvrirPhoto === 'function') {
    window.bsAssistantOuvrirPhoto('ocr');
  }
  return {
    message: `J'ouvre l'appareil photo pour photographier le ticket de la dépense ${cible.fournisseur || 'fournisseur'} (${euro(cible.montant_ttc || cible.montant_ht)} du ${cible.date_achat || ''}).`,
    lien: './finances.html?onglet=depenses',
    geste: { photo: 'ocr', depense_id: cible.id, libelle: 'Prendre en photo le ticket' },
    data: cible,
  };
}

// ── 12. supprimer_message ──────────────────────────────────────────────────
// Supprime un message envoyé, tant qu'il n'a pas été lu (déclencheur
// messages_garde_modif en base). Action destructive (carte rouge, appui 1 s).
async function supprimerMessageAction(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.client || '?'} ».`);

  const { data: msgs, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chantier_id', chantier.id)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const proMsgs = (msgs || []).filter((m) => m.author !== 'client');
  if (!proMsgs.length) {
    throw new Error(`Aucun message de votre part sur le chantier ${chantier.client_name}.`);
  }

  let cible = null;
  if (p.repere) {
    const q = norm(p.repere);
    cible = proMsgs.filter((m) => norm(m.content).includes(q)).pop();
    if (!cible) {
      throw new Error(`Aucun message contenant « ${p.repere} » sur le chantier ${chantier.client_name}.`);
    }
  } else {
    cible = proMsgs[proMsgs.length - 1];
  }

  await supprimerMessage(cible.id);

  // Relire après suppression (Règle RLS)
  const { data: relu } = await supabase
    .from('messages')
    .select('id')
    .eq('id', cible.id)
    .maybeSingle();
  if (relu) {
    throw new Error("Ce message n'a pas pu être supprimé (déjà lu ou délai dépassé).");
  }

  return {
    message: `Message supprimé sur le chantier ${chantier.client_name}.`,
    lien: `./chantier.html?id=${chantier.id}#messages`,
  };
}

// ── 13. supprimer_document_coffre ──────────────────────────────────────────
// Supprime définitivement une pièce du coffre-fort (base + storage).
// Action destructive (carte rouge, appui maintenu 1 s).
async function supprimerDocumentCoffre(p) {
  const nomDoc = String(p.document || p.nom || '').trim();
  if (!nomDoc) throw new Error("Précisez quelle pièce supprimer de votre coffre.");

  const docs = await listCoffreDocs();
  if (!docs || !docs.length) {
    throw new Error("Votre coffre-fort est vide : aucune pièce à supprimer.");
  }

  const q = norm(nomDoc);
  const correspondances = (docs || []).filter((d) =>
    norm(d.nom).includes(q) || norm(d.categorie).includes(q)
  );

  if (!correspondances.length) {
    const dispo = docs.map((d) => d.nom || d.categorie).filter(Boolean).join(', ');
    throw new Error(`Aucune pièce correspondant à « ${nomDoc} » dans votre coffre.`
      + (dispo ? ` Pièces disponibles : ${dispo}.` : ''));
  }

  if (correspondances.length > 1) {
    const liste = correspondances.map((d) =>
      `· ${d.nom || 'Sans nom'} (${d.categorie || 'autre'}${d.expire_le ? ` · expire le ${d.expire_le}` : ''})`
    ).join('\n');
    throw new Error(`Plusieurs pièces correspondent à « ${nomDoc} » :\n${liste}\n\nPrécisez le nom exact de la pièce à supprimer.`);
  }

  const cible = correspondances[0];
  await deleteCoffreDoc(cible.id, cible.chemin);

  // Relire après suppression (Règle RLS)
  const { data: relu } = await supabase
    .from('coffre_documents')
    .select('id')
    .eq('id', cible.id)
    .maybeSingle();
  if (relu) {
    throw new Error("La suppression de la pièce a échoué (droits insuffisants).");
  }

  return {
    message: `Pièce « ${cible.nom || cible.categorie} » définitivement supprimée du coffre-fort.`,
    lien: './coffre.html',
  };
}


// ── AVOIR (07/09/2026) ───────────────────────────────────────────────────────
//
// Une facture émise ne se corrige pas et ne s'efface pas : depuis la loi
// anti-fraude à la TVA (art. 286, I-3° bis du CGI), la numérotation doit être
// continue et sans rupture, et un logiciel qui permettrait de supprimer une
// facture est hors la loi. La seule voie légale pour annuler ou réduire est
// l'AVOIR — une facture de sens inverse qui référence l'originale.
//
// Jusqu'ici l'artisan n'avait AUCUN moyen de corriger une erreur de montant :
// il était en infraction dès la première faute de frappe.
//
// Ce que l'avoir doit porter (art. 242 nonies A de l'annexe II) : les mêmes
// mentions qu'une facture, la référence explicite à la facture annulée, et les
// montants en négatif. On ne touche JAMAIS à la facture d'origine — c'est tout
// l'intérêt : les deux pièces coexistent et se compensent.
async function creerAvoir(p) {
  const f = await resoudreFacture(p, {
    exigeRepere: "Quelle facture voulez-vous annuler ? Donnez son numéro ou le nom du client.",
  });
  if (!f) throw new Error("Facture introuvable. Donnez son numéro exact.");

  // Un avoir sur un avoir n'a pas de sens : on annulerait une annulation.
  if (f.type === 'avoir') {
    throw new Error(`${f.numero} est déjà un avoir. Pour revenir dessus, il faut refacturer.`);
  }

  // Déjà annulée ? Un second avoir créerait un crédit qui n'existe pas.
  const { data: dejaAvoirs } = await supabase.from('factures')
    .select('numero, total_ttc').eq('facture_annulee_id', f.id);
  if (dejaAvoirs && dejaAvoirs.length) {
    const deja = dejaAvoirs.reduce((s2, a) => s2 + Math.abs(Number(a.total_ttc) || 0), 0);
    const total = Math.abs(Number(f.total_ttc) || 0);
    if (deja >= total - 0.005) {
      throw new Error(`${f.numero} est déjà annulée en totalité par ${dejaAvoirs.map((a) => a.numero).join(', ')}.`);
    }
  }

  // Avoir TOTAL par défaut. Un avoir partiel (remise, geste commercial, erreur
  // sur une ligne) se demande explicitement par un montant.
  const totalFacture = Math.abs(Number(f.total_ttc) || 0);
  if (!(totalFacture > 0)) throw new Error(`${f.numero} n'a pas de montant.`);
  const demande = p.montant_ttc != null ? Math.abs(Number(p.montant_ttc)) : totalFacture;
  if (!(demande > 0)) throw new Error("Le montant de l'avoir doit être supérieur à zéro.");
  if (demande > totalFacture + 0.005) {
    throw new Error(`L'avoir ne peut pas dépasser la facture : ${euro(demande)} demandés `
      + `pour une facture de ${euro(totalFacture)}.`);
  }

  // On relit la facture d'origine pour reprendre SON taux de TVA : un avoir
  // qui ne rend pas la TVA au même taux que la facture laisse un écart au
  // Trésor. Jamais un taux redécidé ici.
  const { data: orig, error: eOrig } = await supabase.from('factures')
    .select('id, numero, type, objet, total_ht, total_tva, total_ttc, chantier_id, devis_id, notes, date_emission')
    .eq('id', f.id).single();
  if (eOrig) throw eOrig;

  const ratio = demande / Math.abs(Number(orig.total_ttc) || 1);
  const ht  = Math.round(Math.abs(Number(orig.total_ht) || 0) * ratio * 100) / 100;
  const tva = Math.round((demande - ht) * 100) / 100;
  const tauxTva = ht > 0 ? Math.round((tva / ht) * 1000) / 10 : 0;

  const { data: proId, error: eEnt } = await supabase.rpc('mon_entreprise');
  if (eEnt) throw eEnt;
  // Même série que les factures : la numérotation doit rester continue.
  const { data: numero, error: eNum } = await supabase.rpc('prochain_numero_facture', { p_pro: proId });
  if (eNum) throw eNum;

  const total = demande >= totalFacture - 0.005;
  const motif = String(p.motif || '').trim();
  const libelle = `${total ? 'Annulation' : 'Avoir partiel'} de la facture ${orig.numero}`
    + (orig.date_emission ? ` du ${String(orig.date_emission).slice(0, 10)}` : '');

  const { data, error } = await supabase.from('factures').insert({
    pro_id: proId,
    chantier_id: orig.chantier_id,
    devis_id: orig.devis_id,
    facture_annulee_id: orig.id,
    numero,
    type: 'avoir',
    objet: p.objet || libelle,
    // Montants NÉGATIFS : c'est ce qui fait de cette pièce un avoir et ce qui
    // permet au comptable de compenser sans retraitement.
    lines: [{ description: libelle + (motif ? ` — ${motif}` : ''), quantity: 1, unit: 'forfait',
              unitPrice: -ht, total_ht: -ht, vatRate: tauxTva }],
    total_ht: -ht, total_tva: -tva, total_ttc: -demande,
    date_echeance: null,
    statut: 'brouillon',
    notes: [`Avoir sur la facture ${orig.numero}.`, motif ? `Motif : ${motif}` : null, p.notes]
      .filter(Boolean).join('\n'),
  }).select().single();
  if (error) throw error;

  return {
    message: `Avoir ${numero} créé : ${euro(-demande)} sur la facture ${orig.numero}`
      + (total ? ' (annulation totale).' : ` (annulation partielle, il reste ${euro(totalFacture - demande)} dus).`)
      + `\n\nLa facture ${orig.numero} n'est pas modifiée — elle ne peut pas l'être. `
      + `Les deux pièces se compensent, et votre comptable les recevra ensemble.`,
    lien: './finances.html?onglet=factures',
    data,
  };
}

// ── LES DEUX IMPRÉVUS (07/09/2026) ───────────────────────────────────────────
//
// Mesuré le même jour : « bloque mon vendredi aprem je prends mon RTT » faisait
// appeler `planning_periode`, et « décale tout chez Dupont de 2 jours, Karim
// est malade » appelait `deroulement_chantier`. Deux outils de LECTURE. En dix
// et vingt-trois secondes, l'assistant affichait quelque chose au lieu de faire
// ce qu'on lui demandait — sans dire qu'il ne savait pas.

// « Bloque mon vendredi », « je suis en formation la semaine prochaine ».
async function bloquerAgenda(p) {
  const jour = await normaliserDate(p.jour || p.date);
  if (!jour) throw new Error("Quelle date faut-il bloquer ?");
  const fin = p.jour_fin ? await normaliserDate(p.jour_fin) : null;
  if (fin && fin < jour) throw new Error("La fin est avant le début.");

  const m = norm(p.moment);
  const moment = /matin/.test(m) ? 'matin'
    : (/midi|aprem|après-midi|apres-midi|pm/.test(m) ? 'apres_midi' : 'journee');

  let qui = null, quiNom = 'vous';
  if (p.membre) {
    const cible = await trouverMembre(p.membre);
    if (!cible) throw new Error(`Aucun membre d'équipe nommé « ${p.membre} ».`);
    qui = cible.id; quiNom = cible.prenom;
  }

  // Ce qui est DÉJÀ planifié ce jour-là n'est pas déplacé tout seul : on le
  // signale, l'artisan décide. Bloquer une journée et effacer son travail en
  // silence serait pire que de ne rien faire.
  const taches = await listTachesJour(jour).catch(() => []);
  const enCours = (taches || []).filter((t) => t.statut !== 'termine');

  const d = await creerIndisponibilite({ jour, jour_fin: fin, moment, motif: p.motif || null, qui });

  const quand = fin ? `du ${jour} au ${fin}` : `le ${jour}`;
  const libMoment = moment === 'journee' ? '' : (moment === 'matin' ? ' (matin)' : ' (après-midi)');
  return {
    message: `Agenda bloqué ${quand}${libMoment} pour ${quiNom}`
      + (p.motif ? ` — ${p.motif}.` : '.')
      + (enCours.length
          ? `\n\n⚠ ${enCours.length} étape(s) sont déjà planifiées ce jour-là : `
            + enCours.slice(0, 4).map((t) => t.titre).join(', ')
            + `. Elles ne sont pas déplacées — dites-moi si vous voulez les décaler.`
          : ''),
    lien: './planning.html',
    data: d,
  };
}

// « Décale tout le chantier Benali de 3 jours » — il pleut, quelqu'un est
// malade. Translation EN BLOC des étapes non terminées : les écarts entre
// étapes sont conservés, c'est tout l'intérêt par rapport à un décalage un par
// un. Ce qui est TERMINÉ ne bouge jamais : c'est du passé, le décaler
// réécrirait l'histoire du chantier.
async function decalerChantier(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.chantier || '?'} ».`);

  const taches = await listTachesChantier(chantier.id);
  const aBouger = (taches || []).filter((t) => t.statut !== 'termine' && t.jour);
  if (!aBouger.length) {
    const finies = (taches || []).filter((t) => t.statut === 'termine').length;
    throw new Error(finies
      ? `Toutes les étapes du chantier ${chantier.client_name} sont terminées : il n'y a rien à décaler.`
      : `Aucune étape datée sur le chantier ${chantier.client_name}.`);
  }

  // ── DEUX FAÇONS DE DÉCALER, et il faut savoir laquelle ────────────────────
  // « à partir de lundi » : on REDÉMARRE. La première étape restante prend
  // cette date, les autres gardent leurs écarts. C'est ce qu'on veut quand le
  // chantier s'est arrêté et qu'on reprend.
  // « de 5 jours » : on GLISSE tout de 5 jours depuis les dates actuelles.
  // C'est ce qu'on veut quand le chantier tourne et prend du retard.
  //
  // Les deux donnaient le même résultat tant que les étapes étaient à venir.
  // Sur un chantier ARRÊTÉ, glisser de 5 jours des étapes du 24 août replace
  // tout au 29 août — encore dans le passé, un mois en arrière. C'est ce que
  // Moctar a photographié le 08/09 : « il planifie en arrière, on est en
  // septembre ». On ne devine pas : on demande.
  const aujourdISO = ISO(new Date());
  const premiere = aBouger.map((t) => t.jour).sort()[0];
  const depart = dateDite(p.a_partir_de || p.depart || p.reprise);
  let jours = Number(p.jours);

  if (depart) {
    // Redémarrage : l'écart est calculé sur la PREMIÈRE étape restante.
    jours = Math.round(
      (new Date(depart + 'T12:00:00') - new Date(premiere + 'T12:00:00')) / 86400000,
    );
  } else if (!Number.isFinite(jours) || jours === 0) {
    throw new Error("De combien de jours faut-il décaler ? (un nombre négatif avance le chantier)");
  } else if (premiere < aujourdISO) {
    // Le chantier est déjà en retard : un glissement laisserait les étapes
    // dans le passé. On refuse de planifier en arrière et on pose LA question.
    const projete = new Date(premiere + 'T12:00:00');
    projete.setDate(projete.getDate() + jours);
    if (ISO(projete) < aujourdISO) {
      const fr = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
      throw new Error(
        `Les étapes restantes de ${chantier.client_name} sont déjà passées `
        + `(la première était le ${fr(premiere)}). Les décaler de ${jours} jours les laisserait `
        + `au ${fr(ISO(projete))}, encore dans le passé.\n\n`
        + `À partir de quelle date reprend-on ? Dites par exemple « à partir de lundi » `
        + `ou « à partir du 15 septembre » — je recale tout le déroulement dessus.`,
      );
    }
  }

  const decale = (iso) => {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + jours);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  };

  const faits = [];
  for (const t of aBouger) {
    const champs = { jour: decale(t.jour) };
    if (t.jour_fin) champs.jour_fin = decale(t.jour_fin);
    await modifierTache(t.id, champs);
    faits.push({ titre: t.titre, avant: t.jour, apres: champs.jour });
  }

  // Relecture : sous RLS, un UPDATE sans droit renvoie 204 sans erreur. On ne
  // dit pas « décalé » avant de l'avoir constaté.
  const apres = await listTachesChantier(chantier.id);
  const ok = faits.filter((f) => (apres || []).some((t) => t.titre === f.titre && t.jour === f.apres)).length;
  if (ok === 0) throw new Error("Le décalage n'a pas été enregistré. Vérifiez vos droits sur ce chantier.");

  const sens = jours > 0 ? 'décalé' : 'avancé';
  const n = Math.abs(jours);
  // Des dates EN FRANÇAIS. « 2026-08-24 → 2026-08-29 » est un format de base de
  // données : ça ne se lit pas sur un chantier (Moctar, 08/09 : « les dates,
  // mauvais format »).
  const fr = (iso) => {
    try {
      return new Date(iso + 'T12:00:00')
        .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (_) { return iso; }
  };

  // CE QUI VIENT APRÈS. Décaler un chantier entier, ce n'est jamais une affaire
  // interne : le client attendait des dates, l'équipe avait bloqué des journées
  // (Moctar, 08/09 : « ensuite : pourquoi, dites-moi, et je préviens les
  // clients et l'équipe, je modifie leur agenda »). On propose, il décide.
  const derniere = faits.map((f) => f.apres).sort().slice(-1)[0];
  const suites = [
    { libelle: 'Prévenir le client',
      question: `Écris un message court à ${chantier.client_name} : le chantier est ${sens} de `
        + `${n} jour${n > 1 ? 's' : ''}, la fin est maintenant prévue vers le ${fr(derniere)}. `
        + `Reste factuel, sans excuse appuyée, et dis ce qui ne change pas.` },
    { libelle: "Prévenir l'équipe",
      question: `Poste dans le fil d'équipe du chantier ${chantier.client_name} que toutes les `
        + `étapes restantes sont ${sens}${jours > 0 ? 'es' : 'es'} de ${n} jour${n > 1 ? 's' : ''}, `
        + `et rappelle qui est concerné et à quelles nouvelles dates.` },
    { libelle: 'Voir la semaine',
      question: "Qu'est-ce qui est planifié cette semaine, et qui est trop chargé ?" },
  ];

  return {
    message: `Chantier ${chantier.client_name} ${sens} de ${n} jour${n > 1 ? 's' : ''}`
      + ` : ${ok} étape${ok > 1 ? 's' : ''} déplacée${ok > 1 ? 's' : ''}.\n`
      + faits.slice(0, 6).map((f) => `  ${f.titre} : ${fr(f.avant)} → ${fr(f.apres)}`).join('\n')
      + (faits.length > 6 ? `\n  … et ${faits.length - 6} autre(s).` : '')
      + `\n\nLes étapes déjà terminées n'ont pas bougé.`,
    lien: `./chantier.html?id=${chantier.id}`,
    geste: { suites },
    data: faits,
  };
}

// ── MAIN COURANTE (07/09/2026) ───────────────────────────────────────────────
//
// Troisième et dernier des « imprévus ». Le plus coûteux et le moins visible :
// un changement demandé à l'oral que rien ne trace, c'est de la marge perdue à
// chaque chantier — sur un marché à forfait, l'article 1793 du Code civil
// n'autorise un supplément que s'il a été convenu par écrit, travail ET prix.
//
// Ce n'est PAS un journal à remplir tous les soirs : personne ne le tiendrait.
// C'est trois secondes quand quelque chose cloche.
async function noterConstat(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.chantier || '?'} ».`);

  const texte = String(p.texte || p.note || p.constat || '').trim();
  if (!texte) throw new Error("Qu'est-ce que vous avez constaté ?");

  const t = norm(p.type);
  const type = /decouvert|découvert|support|etat|état|desordre|désordre/.test(t) ? 'decouverte'
    : /changement|modif|demande|supplement|supplément/.test(t) ? 'changement'
    : /reserve|réserve/.test(t) ? 'reserve'
    : /incident|casse|degat|dégât|accident/.test(t) ? 'incident'
    : 'note';

  const constate = p.constate_le ? await normaliserDate(p.constate_le) : null;
  const d = await creerConstat({
    chantier_id: chantier.id, type, texte,
    constate_le: constate ? `${constate}T12:00:00Z` : null,
  });

  // Ce qu'un constat déclenche ensuite, selon ce qu'il est. On le PROPOSE, on
  // ne le fait pas : l'artisan décide s'il chiffre le supplément.
  const suite = type === 'changement'
    ? `\n\nUn changement demandé à l'oral ne se facture pas : sur un forfait, l'article 1793 exige un accord écrit sur le travail et son prix. Voulez-vous que je prépare le devis supplémentaire ?`
    : type === 'decouverte'
      ? `\n\nSi ça sort du devis signé, ça se chiffre à part. Voulez-vous que je prépare le devis supplémentaire ?`
      : type === 'reserve'
        ? `\n\nJe peux l'ajouter au procès-verbal de réception.`
        : '';

  const quand = String(d.constate_le || '').slice(0, 10);
  const LIB = { decouverte: 'Découverte', changement: 'Changement demandé',
                reserve: 'Réserve', incident: 'Incident', note: 'Note' };
  return {
    message: `${LIB[type]} consignée sur le chantier ${chantier.client_name}, datée du ${quand} :\n`
      + `« ${texte} »`
      + `\n\nElle part dans le dossier remis au client.` + suite,
    lien: `./chantier.html?id=${chantier.id}#docs`,
    data: d,
  };
}

// « Qu'est-ce qui s'est passé sur ce chantier ? » — relire la main courante.
async function lireMainCourante(p) {
  const chantier = await trouverChantier(p.client_nom || p.client || p.chantier);
  if (!chantier) throw new Error(`Aucun chantier trouvé pour « ${p.client_nom || p.chantier || '?'} ».`);
  let liste = await listConstats(chantier.id);
  if (p && p.type) {
    const t = norm(p.type);
    liste = liste.filter((c) => norm(c.type).includes(t));
  }
  if (!liste.length) {
    return { message: `Rien de consigné sur le chantier ${chantier.client_name}.`
      + ` Dites-moi ce que vous constatez et je le date.`,
      lien: `./chantier.html?id=${chantier.id}#docs` };
  }
  const LIB = { decouverte: 'Découverte', changement: 'Changement', reserve: 'Réserve',
                incident: 'Incident', note: 'Note' };
  const lignes = liste.map((c) =>
    `${String(c.constate_le).slice(0, 10)} · ${LIB[c.type] || c.type} : `
    + String(c.texte).replace(/\s+/g, ' ').slice(0, 130)
    + (c.photo_id ? ' 📷' : '')
    + (c.client_informe_le ? '' : ' — client pas encore informé'));
  const aInformer = liste.filter((c) => !c.client_informe_le && c.type !== 'note').length;
  return {
    message: `${liste.length} constat(s) sur le chantier ${chantier.client_name} :\n\n${lignes.join('\n')}`
      + (aInformer ? `\n\n⚠ ${aInformer} n'ont pas encore été portés à la connaissance du client.`
                     + ` Un constat que le client ignore ne protège de rien.` : ''),
    lien: `./chantier.html?id=${chantier.id}#docs`, data: liste,
  };
}


// ---------------------------------------------------------------- metre AR

// Releve d'une piece a la camera. Deux methodes selon l'appareil, choisies par
// le plugin natif et pas ici : balayage 3D si l'iPhone a le LiDAR, sinon points
// poses aux coins du sol. Le releve est ENREGISTRE : c'est ce qui permet de
// rechiffrer la meme piece des mois plus tard sans y retourner.
async function releverPiece(p) {
  const M = await import('./metre-ar.js');
  const cap = await M.capacitesMetre();
  if (cap.methode === 'aucune' || cap.methode === 'photo') {
    return {
      message: "Le metre par camera demande l'application installee sur un iPhone ou un "
             + "Android compatible. Sur cet appareil, prenez une photo avec une feuille A4 "
             + "posee au sol : je m'en sers comme etalon.",
      geste: { photo: 'metre', libelle: 'Prendre une photo' },
    };
  }

  const releve = await M.releverPiece();
  if (!releve) return { message: 'Releve annule, rien enregistre.' };
  releve.piece = (p && p.piece) || 'Piece';

  let chantier = null;
  if (p && p.chantier_client) chantier = await trouverChantier(p.chantier_client);

  const { planSVG } = await import('./metre-plan.js');
  const { data: proId } = await supabase.rpc('mon_entreprise');
  const { error } = await supabase.from('releves_piece').insert({
    pro_id: proId,
    chantier_id: chantier ? chantier.id : null,
    piece: releve.piece,
    methode: releve.source === 'balayage3d' ? 'balayage3d' : 'points',
    surface_sol: releve.surfaceSol,
    perimetre: releve.perimetre,
    hauteur: releve.hauteurSousPlafond,
    hauteur_supposee: !!releve.hauteurSupposee,
    donnees: releve,
    plan_svg: planSVG(releve),
  });
  // Le releve est deja fait : si l'enregistrement echoue on rend quand meme les
  // cotes plutot que de faire refaire le tour de la piece a l'artisan.
  const note = error ? "\n\n(Je n'ai pas pu l'archiver, notez les cotes.)" : '';

  const reserves = [];
  if (releve.hauteurSupposee) reserves.push('la hauteur sous plafond n\'a pas ete mesuree');
  if (releve.fiabilite === 'douteuse') reserves.push('le suivi a decroche, verifiez les cotes');
  if (releve.source === 'points') reserves.push('portes et fenetres non detectees');

  return {
    message: `${releve.piece} : ${M.resumeParle(releve)}.`
           + (reserves.length ? ` A savoir : ${reserves.join(', ')}.` : '')
           + (chantier ? ` Range dans le dossier de ${chantier.client_name}.` : '')
           + ' Quels travaux prevoyez-vous dans cette piece ?'
           + note,
    releve,
  };
}

// Relit les releves deja faits. C'est l'outil qui evite le deplacement : le
// client rappelle huit mois plus tard pour changer le sol, les cotes sont la.
async function lireReleves(p) {
  let q = supabase.from('releves_piece')
    .select('id, piece, methode, surface_sol, perimetre, hauteur, hauteur_supposee, chantier_id, created_at')
    .order('created_at', { ascending: false })
    .limit(30);
  let ou = 'vos releves';
  if (p && p.chantier_client) {
    const ch = await trouverChantier(p.chantier_client);
    if (!ch) throw new Error(`Aucun chantier pour « ${p.chantier_client} ».`);
    q = q.eq('chantier_id', ch.id);
    ou = `le chantier ${ch.client_name}`;
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  let liste = data || [];
  if (p && p.piece) {
    const n = norm(p.piece);
    liste = liste.filter((r) => norm(r.piece).includes(n));
  }
  if (!liste.length) {
    return { message: `Aucun releve enregistre pour ${ou}. Voulez-vous relever la piece maintenant ?` };
  }
  const lignes = liste.map((r) => {
    const s = r.surface_sol ? `${Number(r.surface_sol).toFixed(2).replace('.', ',')} m2` : 'surface inconnue';
    const h = r.hauteur
      ? `${Number(r.hauteur).toFixed(2).replace('.', ',')} m sous plafond`
      : 'hauteur non mesuree';
    return `• ${r.piece} — ${s}, ${h} (${r.methode === 'balayage3d' ? 'balayage 3D' : 'points au sol'})`;
  });
  return { message: `Releves pour ${ou} :\n${lignes.join('\n')}`, releves: liste };
}

const ACTIONS = {
  creer_devis: creerDevis,
  // Ecriture : elle passe par la carte de validation, pas dans LECTURES.
  modifier_devis: modifierDevis,
  // Ecriture : une V2 est un devis de plus, elle passe par la carte de validation.
  nouvelle_version_devis: nouvelleVersionDevis,
  valider_temps_passe: validerTempsPasse,
  planifier_taches: planifierTaches,
  // Ecriture : elle passe par le verrou de validation, pas dans LECTURES.
  ajouter_etape: ajouterEtape,
  planning_periode: planningPeriode,
  demarrer_tache: demarrerTache,
  assigner_tache: assignerTacheAction,
  deplacer_tache: deplacerTache,
  envoyer_message: envoyerMessage,
  deroulement_chantier: deroulementChantier,
  qui_travaille: quiTravaille,
  terminer_tache: terminerTache,
  verifier_charge: verifierCharge,
  itineraire_jour: itineraireJour,
  enregistrer_depense: enregistrerDepense,
  chercher_depenses: chercherDepenses,
  calculer_marge: calculerMarge,
  lister_depenses: listerDepenses,
  envoyer_devis: envoyerDevis,
  ajouter_au_planning: ajouterAuPlanning,
  preparer_relance: preparerRelance,
  envoyer_message_client: envoyerMessageClient,
  chercher_chantier: chercherChantier,
  lister_devis: listerDevis,
  creer_facture: creerFacture,
  proposer_planning_devis: proposerPlanningDevis,
  planifier_depuis_devis: planifierDepuisDevis,
  lister_fournitures: listerFournitures,
  detail_finances: detailFinances,
  terminer_chantier: terminerChantier,
  partager_document_client: partagerDocumentClient,
  lister_factures: listerFactures,
  envoyer_facture: envoyerFactureAction,
  marquer_facture_payee: marquerFacturePayee,
  declarer_sous_traitance: declarerSousTraitance,
  ajouter_coequipier: ajouterCoequipier,
  relancer_client: relancerClient,
  // Chantier et etapes en entier (05/09/2026). Les deux suppressions sont
  // dans DESTRUCTIFS : carte rouge + appui maintenu d'une seconde.
  creer_chantier: creerChantierAction,
  modifier_chantier: modifierChantierAction,
  supprimer_chantier: supprimerChantierAction,
  modifier_etape: modifierEtapeAction,
  supprimer_etape: supprimerEtapeAction,
  assigner_chantier: assignerChantierAction,
  lien_suivi_client: lienSuiviClient,
  appeler_client: appelerClient,
  // Partage et signature (05/09/2026). partager_devis / partager_facture sont
  // des LECTURES (rien ne bouge en base) ; signer_sur_ecran est de la
  // NAVIGATION (il ouvre une feuille, il ne signe pas).
  partager_devis: partagerDevis,
  partager_facture: partagerFacture,
  signer_sur_ecran: signerSurEcran,
  // Outils déclarés à l'assistant v61 (04/09/2026) — noms imposés.
  envoyer_facture_email: envoyerFactureEmailAction,
  envoyer_dossier: envoyerDossierAction,
  rappels_dossier: rappelsDossier,
  // Navigation (04/09/2026) : ouvre un écran ou l'appareil photo, n'écrit rien.
  ouvrir_ecran: ouvrirEcran,
  prendre_photo: prendrePhoto,
  relever_piece: releverPiece,
  lire_releves: lireReleves,
  // devis_depuis_photo est de la NAVIGATION : il ouvre l'appareil photo et
  // n'écrit rien lui-même. Le devis, lui, repasse par creer_devis et sa carte.
  devis_depuis_photo: devisDepuisPhoto,
  // Grille de prix de vente et prix d'achat (05/09/2026). Aucun de ces
  // executants n'invente un prix : il vient de l'artisan ou l'action echoue.
  // deposer_fichier est de la NAVIGATION, supprimer_prix_achat est DESTRUCTIF.
  ajouter_prix_grille: ajouterPrixGrille,
  modifier_prix_grille: modifierPrixGrille,
  enregistrer_prix_achat: enregistrerPrixAchatAction,
  supprimer_prix_achat: supprimerPrixAchatAction,
  deposer_fichier: deposerFichier,
  // Les neuf LECTURES du 07/09/2026 (cartographie des capacités). Toutes dans
  // LECTURES ci-dessous : elles répondent tout de suite, rien n'est écrit.
  lister_demandes: listerDemandes,
  messages_recus: messagesRecus,
  lire_fil_equipe: lireFilEquipe,
  lister_photos: listerPhotos,
  lister_coffre: listerCoffre,
  reponses_devis: reponsesDevis,
  lister_documents_client: listerDocumentsClient,
  analyse_rentabilite: analyseRentabilite,
  heures_par_membre: heuresParMembre,
  // Avoir (07/09/2026) : une facture émise ne se corrige ni ne s'efface,
  // la loi impose une numérotation continue. Écriture, carte de validation.
  creer_avoir: creerAvoir,
  // Les deux imprévus (07/09/2026). Écritures : carte de validation.
  bloquer_agenda: bloquerAgenda,
  decaler_chantier: decalerChantier,
  // Main courante : noter est une ÉCRITURE, relire une LECTURE.
  noter_constat: noterConstat,
  lire_main_courante: lireMainCourante,
  // Les treize ÉCRITURES et gestion du 07/09/2026 (cartographie des capacités).
  modifier_mon_entreprise: modifierMonEntreprise,
  modifier_taux_horaire: modifierTauxHoraire,
  relancer_invitation: relancerInvitation,
  retirer_coequipier: retirerCoequipier,
  modifier_message: modifierMessageAction,
  envoyer_photos_client: envoyerPhotosClient,
  accepter_demande: accepterDemandeAction,
  preparer_pv_reception: preparerPvReception,
  export_comptable: exportComptable,
  ranger_document_coffre: rangerDocumentCoffre,
  joindre_justificatif: joindreJustificatif,
  supprimer_message: supprimerMessageAction,
  supprimer_document_coffre: supprimerDocumentCoffre,
};

// Les lectures n'écrivent rien : inutile de faire valider l'artisan, on exécute direct.
// deroulement_chantier et qui_travaille ne font que lire : on répond direct.
// envoyer_message et terminer_tache écrivent : validation obligatoire.
// proposer_planning_devis n'écrit rien non plus : il calcule des durées et les
// rend à l'écran pour que l'artisan les corrige. Le faire valider reviendrait à
// lui demander d'approuver l'affichage d'une proposition. rappels_dossier ne
// fait que calculer des alertes sur des données déjà en base.
const LECTURES = new Set([
  'lire_releves','chercher_depenses','lister_devis', 'lister_fournitures', 'detail_finances', 'chercher_chantier', 'calculer_marge', 'lister_depenses', 'deroulement_chantier', 'qui_travaille', 'proposer_planning_devis', 'lister_factures', 'planning_periode', 'rappels_dossier', 'verifier_charge', 'itineraire_jour', 'lien_suivi_client', 'appeler_client', 'partager_devis', 'partager_facture', 'lister_demandes', 'lire_fil_equipe', 'messages_recus', 'lister_photos', 'lister_coffre', 'lister_documents_client', 'reponses_devis', 'analyse_rentabilite', 'heures_par_membre', 'lire_main_courante']);
export function estLecture(nom) {
  return LECTURES.has(nom);
}
// Outils dont l'effet ne se rattrape pas : bsAstRendreProposition
// (app-assistant.js) passe leur carte en rouge et n'exécute qu'après un appui
// MAINTENU d'une seconde. Les deux suppressions du 05/09/2026 sont les
// premières à y entrer — un chantier ou une étape supprimés ne se récupèrent
// pas, là où un statut se corrige. Doit rester identique à DESTRUCTIFS côté
// serveur (outils-assistant.ts) : voir ~/batispot-llm/eval/test_outils_assistant.py.
const DESTRUCTIFS = new Set(['supprimer_chantier', 'supprimer_etape', 'supprimer_prix_achat', 'supprimer_document_coffre', 'supprimer_message']);
export function estDestructif(nom) {
  return DESTRUCTIFS.has(nom);
}
// Outils qui OUVRENT un écran ou l'appareil photo : exécution immédiate comme
// une lecture, mais jamais dans LECTURES — un outil de navigation ne lit ni
// n'écrit rien. Doit rester identique à NAVIGATION côté serveur
// (outils-assistant.ts) : voir ~/batispot-llm/eval/test_outils_assistant.py.
const NAVIGATION = new Set(['ouvrir_ecran', 'prendre_photo', 'relever_piece', 'deposer_fichier', 'devis_depuis_photo', 'signer_sur_ecran']);
export function estNavigation(nom) {
  return NAVIGATION.has(nom);
}

// Point d'entrée unique : n'exécute que sur validation explicite de l'artisan.
// ── Dates relatives (06/09/2026, Moctar : « C'est quoi l'équipe pour le
// chantier de demain ? » → « invalid input syntax for type date: "demain" »).
// Le modèle rend parfois « demain », « lundi », « le 20 septembre » au lieu
// d'une date ISO. On convertit ICI, à l'entrée de TOUS les outils, pour
// chaque paramètre qui porte une date. Une chaîne qu'on ne sait pas lire est
// laissée telle quelle : l'outil dira ce qu'il attend.
const CLES_DATE = /^(date|jour|date_debut|date_fin|date_fin_prevue|nouveau_jour|nouvelle_date|jour_fin|date_echeance|echeance|du|au|debut|fin)$/;
const MOIS_FR_DATES = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
const JOURS_FR_DATES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
function isoLocalDates(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function normaliserDate(valeur, ref = new Date()) {
  if (valeur == null || typeof valeur !== 'string') return valeur;
  const v = valeur.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const t = norm(v);
  const base = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const plus = (n) => { const d = new Date(base); d.setDate(d.getDate() + n); return isoLocalDates(d); };
  if (/^(aujourd ?hui|ce jour)$/.test(t)) return plus(0);
  if (/^demain$/.test(t)) return plus(1);
  if (/^apres[ -]?demain$/.test(t)) return plus(2);
  if (/^hier$/.test(t)) return plus(-1);
  let m = t.match(/^dans (\d+) ?(jour|jours|j)$/);
  if (m) return plus(parseInt(m[1], 10));
  m = t.match(/^dans (\d+) ?(semaine|semaines|sem)$/);
  if (m) return plus(7 * parseInt(m[1], 10));
  m = t.match(/^(?:ce |le |)(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)(?: prochain| qui vient)?$/);
  if (m) {
    const cible = JOURS_FR_DATES.indexOf(m[1]);
    let delta = (cible - base.getDay() + 7) % 7;
    if (delta === 0) delta = 7;           // « lundi » dit un lundi = le prochain, jamais aujourd'hui
    return plus(delta);
  }
  m = t.match(/^(?:le |)(\d{1,2})(?:er)?(?: (janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre))?(?: (\d{4}))?$/);
  if (m) {
    const j = parseInt(m[1], 10);
    let mois = m[2] ? MOIS_FR_DATES.indexOf(m[2]) : base.getMonth();
    let an = m[3] ? parseInt(m[3], 10) : base.getFullYear();
    let d = new Date(an, mois, j);
    // « le 8 » ou « le 8 mars » sans année : la prochaine occurrence, pas une date passée.
    if (!m[3] && d < base) { if (m[2]) d = new Date(an + 1, mois, j); else d = new Date(an, mois + 1, j); }
    return isoLocalDates(d);
  }
  m = t.match(/^(\d{1,2})[\/.](\d{1,2})(?:[\/.](\d{2,4}))?$/);
  if (m) {
    let an = m[3] ? parseInt(m[3], 10) : base.getFullYear();
    if (an < 100) an += 2000;
    return isoLocalDates(new Date(an, parseInt(m[2], 10) - 1, parseInt(m[1], 10)));
  }
  return valeur;
}
function normaliserDatesParams(params) {
  const out = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (CLES_DATE.test(k) && typeof v === 'string') out[k] = normaliserDate(v);
    else if (Array.isArray(v)) out[k] = v.map((x) => (x && typeof x === 'object' && !Array.isArray(x)) ? normaliserDatesParams(x) : x);
    else if (v && typeof v === 'object') out[k] = normaliserDatesParams(v);
    else out[k] = v;
  }
  return out;
}
if (typeof window !== 'undefined') window.bsNormaliserDate = normaliserDate;

export async function executerAction(nom, params) {
  const fn = ACTIONS[nom];
  if (!fn) throw new Error(`Action « ${nom} » non disponible pour l'instant.`);
  return fn(normaliserDatesParams(params || {}));
}

export function actionDisponible(nom) {
  return Object.prototype.hasOwnProperty.call(ACTIONS, nom);
}

// ── Contrôle AVANT de proposer « Valider » ────────────────────────────────
//
// Moctar, 08/09 (capture) : l'assistant affichait « Décalage de l'étape "Pose"
// d'un jour — Valider », ET juste en dessous, en rouge, « Plusieurs étapes
// correspondent à "Pose" : … Laquelle ? ». On lui proposait donc de valider une
// action que l'application savait déjà impossible.
//
// Même principe qu'actionDisponible : on ne propose jamais un bouton qui ne
// peut qu'échouer. Ici on résout la cible À BLANC — aucune écriture — et si
// elle est ambiguë ou introuvable, on rend la QUESTION à poser au lieu de la
// carte de validation.
// Les outils d'ECRITURE qui designent un chantier par un nom dicte. Tous
// passent par resoudreChantier, qui rend { chantier, erreur } sans jamais
// lever : on peut donc l'appeler A BLANC, sans risque et sans ecriture.
const ECRITURES_SUR_CHANTIER = new Set([
  'modifier_chantier', 'supprimer_chantier', 'assigner_chantier',
  'appeler_client', 'lien_suivi_client',
  'modifier_etape', 'supprimer_etape',
]);

export async function questionAvantAction(nom, params) {
  const p = params || {};
  if (!ECRITURES_SUR_CHANTIER.has(nom)) return null;

  let chantier = null;
  try {
    const r = await resoudreChantier(p);
    // Le chantier ne se resout pas : c'est LA question a poser. « Chez
    // Dupont » quand deux Dupont existent, ou aucun — dans les deux cas,
    // proposer « Valider » revient a faire valider une supposition.
    if (r.erreur) return r.erreur;
    if (!r.chantier) return null;
    chantier = r.chantier;
  } catch (_) {
    return null;   // panne technique : on laisse le parcours normal decider
  }

  // Deuxieme cran pour les outils qui designent une etape DANS ce chantier.
  if (nom !== 'modifier_etape' && nom !== 'supprimer_etape') return null;
  const ref = p.etape || p.tache || p.numero;
  if (!ref) return null;
  try {
    const taches = await listTachesChantier(chantier.id);
    const { erreur: errE } = resoudreEtape(taches, ref);
    return errE || null;
  } catch (_) {
    return null;
  }
}

// Composition de la phrase de métré, exposée aux écrans en script classique
// (photos.html, devis.html) qui ne peuvent pas importer ce module au chargement.
// Un seul point de composition : voir le commentaire de phraseDevisDepuisPhoto.
if (typeof window !== 'undefined') window.bsPhraseDevisDepuisPhoto = phraseDevisDepuisPhoto;

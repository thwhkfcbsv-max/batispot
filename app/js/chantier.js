// Logique page détail chantier : hub (Déroulement / Photos / Docs / Messages)
// (Création de devis retirée de l'app — sécurité + numérotation légale)
//
// 04/09/2026 : écran refondu pour reproduire la maquette validée
// (ANALYSE_APP_2026-09-03_maquette.html, écrans 02 · Chantier (hub),
// 07 · Chantier › Photos, 12 · Chantier › Messages). Classes `mq-*`
// (portées dans app.css). Voir les commentaires par section pour les
// écarts assumés entre la maquette (mockup statique) et cet écran réel.

import { telAppelable, hrefTel, hrefItineraire } from './tel.js';
import { listDevis } from './supabase.js';
import { modifierMessage, supprimerMessage } from './supabase.js';
import { uploadPhoto as uploadPhotoMsg, listPhotos as listPhotosMsg, marquerPhotoVisibleClient } from './supabase.js';
import { choisirPhoto, iconeFil as iconeFilMsg } from './mq-thread.js';
import {
  supabase, requireAuth, toast,
  getChantier, updateChantier, deleteChantier,
  listPhotos, uploadPhoto, deletePhoto, signPhotoUrls,
  setPhotosVisiblesClient, setPhotoRoleClient,
  listMessages, sendMessage,
  listTachesChantier, majStatutTache,
  creerTache, modifierTache, supprimerTache, mesDroits, listMembres,
  uploadArtisanDoc, listClientDocs, deleteClientDoc, clientDocSignedUrl, DOC_TYPE_LABEL,
  fmtDate, fmtDateTime,
  TYPE_TRAVAUX_LABEL,
} from './supabase.js';
import {
  rendreFil, rendreEtatVide, brancherComposeur,
  marquerLuMessagesClient, actualiserBadgeMessages,
} from './mq-thread.js';
import {
  deduirePhase, libelleBoutonPhotos, rendreCasesTemps,
  rendreBlocAvapArtisan, creerGalerie, envoyerFichiersPhotos,
} from './photos-galerie.js';

const session = await requireAuth();
if (!session) throw new Error('No session');

const params = new URLSearchParams(location.search);
const chantierId = params.get('id');
if (!chantierId) { location.href = './dashboard.html'; throw new Error('no id'); }

let chantier = null;
let demandeId = null;
let ongletCourant = null;

// Contexte d'écran (task 5) : lu par app-assistant.js (bsAstAskLLM) à chaque
// question, pour que le serveur sache « ce chantier » sans le redemander.
// Une seule fonction, posée une fois : elle relit `chantier` et `ongletCourant`
// à chaque appel, pas besoin de la remettre à jour ailleurs.
window.bsContexteEcran = () => ({
  page: 'chantier',
  chantier_id: chantier?.id || chantierId || null,
  chantier_client: chantier?.client_name || null,
  onglet: ongletCourant,
});

// ── app-assistant.js injecte automatiquement une carte « L'assistant
// propose » générique en bas de chaque page (voir js/app-assistant.js,
// table BS_SUGGESTIONS_PAR_PAGE['chantier.html']). Cet écran a SA PROPRE
// carte `.mq-assist`, fidèle à la maquette et dont les puces changent avec
// l'onglet ouvert — les deux cartes affichées ensemble dupliqueraient
// « L'assistant propose ». On retire la carte générique dès qu'elle
// apparaît, sans toucher au script partagé (utilisé par 10 autres pages).
const bsObservateurCarteAuto = new MutationObserver(() => {
  const doublon = document.getElementById('bsAssistSuggestions');
  if (doublon) { doublon.remove(); bsObservateurCarteAuto.disconnect(); }
});
bsObservateurCarteAuto.observe(document.body, { childList: true, subtree: true });

// ── Qui est devant l'écran ────────────────────────────
// Lu UNE fois, au démarrage, parce que tout l'écran s'y réfère.
//
// ⚠️ Ce que cette variable décide est du CONFORT D'AFFICHAGE, comme le dit
// l'en-tête de nav-roles.js : ne pas proposer une porte fermée. Elle ne protège
// RIEN. Ce qui protège, ce sont les policies `taches_insert_encadrement` et
// `taches_delete_encadrement` en base, qui refusent l'insertion et la
// suppression à un compagnon quoi qu'affiche ce fichier.
//
// ⚠️ En revanche l'UPDATE de `taches` n'est PAS restreint par rôle en base
// (policy `taches_update_fenetre`, relue le 03/09/2026) : un compagnon qui
// contourne cet écran peut encore renommer ou redater une étape. Le correctif
// SQL est proposé dans app/supabase-taches-roles-2026-09-03.sql — NON APPLIQUÉ.
// Tant qu'il ne l'est pas, « modifier une étape » n'est ici que masqué.
let droits = null;
// `=== true` et jamais `!== false` : un champ absent ne doit pas ouvrir les
// droits en silence — c'est la règle déjà posée dans droits-logique.js.
const peutGererEtapes = () => !!droits && droits.encadrement === true;

// ── Travaille-t-il seul ? ─────────────────────────────
// `null` = on ne sait pas encore (ou l'appel a échoué). On ne devine pas :
// tant qu'on ne sait pas, on garde l'ancien affichage.
//
// La règle « seul = aucun membre d'équipe » n'est pas réinventée ici : c'est
// exactement le critère `membres.length === 0` qu'applique `contexteEquipe()`
// dans app-actions.js, sur la même source (`listMembres()`). Cette fonction
// n'est pas exportée, sinon on l'appellerait directement — mais le critère et
// la source restent les siens. C'est déjà le troisième écran à porter ce test :
// s'il doit changer, il doit changer aux trois endroits.
let equipeVide = null;

// Dernier chargement des étapes : le temps proposé pour une photo (Début /
// Pendant / Fin) s'en déduit — voir deduirePhase() (js/photos-galerie.js).
let dernieresTaches = [];

async function loadChantier() {
  chantier = await getChantier(chantierId);
  renderHero();
  fillInfoForm();
}

// ── Quand le chantier n'a pas pu être lu ──────────────
// Même critère que photos.html : un fetch qui n'atteint jamais le serveur
// (TypeError « Failed to fetch » sur Chrome, « Load failed » sur Safari) est
// une absence de réseau, pas une panne serveur ni un chantier introuvable.
// ⚠️ L'erreur qui arrive ici n'est PAS un TypeError : postgrest-js attrape
// l'échec de fetch et rend un objet nu { message: "TypeError: Failed to
// fetch", details, hint, code: "" } (c'est le « Uncaught Object » de la
// console). Tester `e.name` ou `instanceof` ne voit donc jamais le réseau —
// vérifié hors ligne le 05/09/2026 : le bandeau disait « réseau ou serveur »
// au lieu de « Hors ligne ». Le message, lui, porte le mot.
function estErreurReseau(e) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  if (!e) return false;
  if (e.delaiDepasse || e.name === 'AbortError' || e.name === 'TypeError' || e instanceof TypeError) return true;
  const m = String(e.message || e.details || '').toLowerCase();
  return m.includes('failed to fetch') || m.includes('load failed')
    || m.includes('networkerror') || m.includes('ne répond pas');
}

// Un bandeau qui dit LEQUEL des deux s'est passé, et un bouton pour réessayer.
// Posé en haut de l'écran, au-dessus de l'en-tête : c'est la première chose
// qu'on lit, avant un titre resté sur « Chantier ».
function bandeauChargementImpossible(err) {
  const ecran = document.querySelector('.mq-screen');
  if (!ecran || document.getElementById('bs-bandeau-hors-ligne')) return;

  const reseau = estErreurReseau(err);
  const b = document.createElement('div');
  b.id = 'bs-bandeau-hors-ligne';
  b.setAttribute('role', 'alert');
  b.style.cssText = 'background:#FEF6E7;border:1px solid #E9C989;color:#7A4E06;'
    + 'border-radius:12px;padding:12px 14px;margin-bottom:12px;font-size:13px;'
    + 'line-height:1.5;font-weight:600;';

  const txt = document.createElement('div');
  txt.textContent = reseau
    ? "Hors ligne : ce chantier n'est pas disponible sans réseau. Rien n'est perdu — "
      + "ses étapes, ses photos et ses messages vous attendent au retour de la connexion."
    : "Ce chantier n'a pas pu être chargé (réseau ou serveur). Rien n'est perdu — réessayez.";
  b.appendChild(txt);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Réessayer';
  btn.style.cssText = 'margin-top:10px;padding:8px 16px;border-radius:10px;border:1px solid #7A4E06;'
    + 'background:#fff;color:#7A4E06;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer;';
  btn.addEventListener('click', () => location.reload());
  b.appendChild(btn);

  ecran.insertBefore(b, ecran.firstChild);

  // Le titre et la ligne d'avancement restaient sur « Chantier » et
  // « Avancement… », c'est-à-dire sur un chargement qui n'arrivera jamais.
  const ligne = document.getElementById('mq-progress-line');
  if (ligne) ligne.textContent = reseau ? 'Avancement indisponible hors ligne' : 'Avancement indisponible';

  // Le composeur existe (il est branché plus haut dans ce module), mais un
  // message tapé maintenant partirait dans le vide : `sendMessage` échouerait
  // et le texte serait perdu. Tant qu'il n'y a pas de file d'attente, on le
  // ferme en le DISANT, plutôt que de laisser l'artisan écrire pour rien.
  const saisie = document.getElementById('msg-input');
  const envoyer = document.getElementById('msg-send-btn');
  const micro = document.getElementById('msg-mic-btn');
  [saisie, envoyer, micro].forEach((el) => { if (el) el.disabled = true; });
  if (saisie) {
    saisie.placeholder = reseau
      ? "Hors ligne — impossible d'envoyer un message pour l'instant."
      : "Envoi indisponible pour l'instant.";
    saisie.style.opacity = '0.6';
  }
  const indice = document.getElementById('msg-indice');
  if (indice) {
    indice.textContent = reseau
      ? "Hors ligne : le message ne partirait pas. Notez-le ailleurs, ou réessayez une fois connecté."
      : "Envoi indisponible : réessayez dans un instant.";
  }
}

// Type de travaux → libellé (sert le titre du hub : « Cuisine · M. Benali »).
const TYPE_CARD_KEYS = new Set([
  'cuisine', 'salle_bain', 'electricite', 'toiture',
  'plomberie', 'peinture', 'facade', 'autre',
]);
function inferTypeTravaux(c) {
  if (c?.type_travaux && TYPE_CARD_KEYS.has(c.type_travaux)) return c.type_travaux;
  const txt = String(c?.description || '').toLowerCase();
  if (/cuisine/.test(txt)) return 'cuisine';
  if (/salle\s*de\s*bain|sdb|douche|baignoire/.test(txt)) return 'salle_bain';
  if (/électric|electric|tableau|prise/.test(txt)) return 'electricite';
  if (/toiture|toit|charpente|tuile/.test(txt)) return 'toiture';
  if (/plomb|fuite|robinet|évier|evier|chauffe-eau/.test(txt)) return 'plomberie';
  if (/peinture|peindre|enduit|revêtement|revetement/.test(txt)) return 'peinture';
  if (/façade|facade|ravalement|crépi|crepi/.test(txt)) return 'facade';
  return 'autre';
}

// Libellé humain du statut enregistré — utilisé pour la note de
// réconciliation (renderStatutCalcule).
const STATUS_LABEL = {
  en_attente: 'En attente', en_cours: 'En cours', retard: 'En retard', termine: 'Terminé',
};
function labelStatus(s) { return STATUS_LABEL[s] || s; }

// ── En-tête (mq-top) ────────────────────────────────────────────────────
// « Objet · Client » en h2, « adresse · dates » en small — markup et
// classes de la maquette écran 02, remplis avec les données réelles.
function formatDatesChantier(c) {
  const d1 = c.date_debut ? fmtDate(c.date_debut) : null;
  const d2 = c.date_fin_prevue ? fmtDate(c.date_fin_prevue) : null;
  if (d1 && d2) return `${d1} → ${d2}`;
  if (d1) return `Début le ${d1}`;
  if (d2) return `Fin prévue le ${d2}`;
  return null;
}

function renderHero() {
  if (!chantier) return;   // rien lu : on laisse le HTML tel qu'il est arrivé
  const titre = document.getElementById('mq-titre');
  const sous = document.getElementById('mq-sous');
  if (!titre || !sous) return;

  const typeKey = inferTypeTravaux(chantier);
  const objet = TYPE_TRAVAUX_LABEL[typeKey] || 'Chantier';
  titre.textContent = `${objet} · ${chantier.client_name || 'Client'}`;

  const segs = [];
  if (chantier.adresse) segs.push(chantier.adresse);
  const dates = formatDatesChantier(chantier);
  if (dates) segs.push(dates);
  sous.textContent = segs.join(' · ');
  renderContactActions();
}

// ── Appeler · Itinéraire · Répertoire ─────────────────────────────────
// Moctar, 05/09 : « le numéro du client doit permettre d'appeler depuis le
// téléphone, et l'adresse d'ouvrir Maps ou Waze ». Trois liens système,
// rien d'inventé : tel: compose, geo:/maps ouvre l'appli de cartes que le
// téléphone propose (Android liste Maps ET Waze), et une fiche vCard
// ajoute le client au répertoire du téléphone en un geste.
function vCard(c) {
  const nom = (c.client_name || 'Client').replace(/[\n;,]/g, ' ').trim();
  const lignes = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${nom}`, `N:${nom};;;;`];
  const tel = telAppelable(c.client_phone);
  if (tel) lignes.push(`TEL;TYPE=CELL:${tel}`);
  if (c.client_email) lignes.push(`EMAIL:${c.client_email}`);
  if (c.adresse) lignes.push(`ADR;TYPE=HOME:;;${c.adresse.replace(/[\n;]/g, ' ')};;;;`);
  lignes.push('NOTE:Client BatiSpot', 'END:VCARD');
  return 'data:text/vcard;charset=utf-8,' + encodeURIComponent(lignes.join('\r\n'));
}
function renderContactActions() {
  const top = document.querySelector('.mq-top');
  if (!top) return;
  let zone = document.getElementById('mq-contact-actions');
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'mq-contact-actions';
    zone.className = 'mq-contact-actions';
    top.insertAdjacentElement('afterend', zone);
  }
  zone.replaceChildren();
  const ico = (n) => (window.bsIcon ? window.bsIcon(n, 16) : '');
  const tel = hrefTel(chantier.client_phone);
  if (tel) {
    const a = document.createElement('a');
    a.href = tel; a.className = 'mq-btn mq-ghost';
    a.innerHTML = ico('phone') + 'Appeler';
    zone.appendChild(a);
  }
  if (chantier.adresse && !/^adresse à préciser$/i.test(chantier.adresse.trim())) {
    const a = document.createElement('a');
    a.href = hrefItineraire(chantier.adresse); a.className = 'mq-btn mq-ghost';
    a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = ico('pin') + 'Itinéraire';
    zone.appendChild(a);
  }
  // E-mail absent : on le dit ici, là où on relance et où on envoie des liens.
  if (!chantier.client_email) {
    const a = document.createElement('a');
    a.href = '#'; a.className = 'mq-btn mq-ghost mq-btn-manque';
    a.innerHTML = ico('send') + "E-mail à ajouter";
    a.addEventListener('click', (e) => {
      e.preventDefault();
      // Le formulaire d'infos vit dans l'onglet Documents, replié dans un <details>.
      if (typeof activerOnglet === 'function') activerOnglet('documents');
      const det = document.getElementById('infos-form-details');
      if (det) det.open = true;
      const champ = document.getElementById('i-client-email');
      if (champ) { champ.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => champ.focus(), 300); }
    });
    zone.appendChild(a);
  }
  if (tel || chantier.client_email) {
    // Android (Moctar, 05/09 : « Répertoire me fait télécharger un fichier ») :
    // un lien data: vCard se télécharge au lieu de s'ouvrir. On passe par le
    // menu de partage du téléphone, qui propose Contacts (Android) ou la fiche
    // (iPhone) ; le téléchargement ne reste qu'en repli si le partage de
    // fichiers n'existe pas.
    const nomFichier = `${(chantier.client_name || 'client').replace(/[^\w\- ]+/g, '').trim() || 'client'}.vcf`;
    const a = document.createElement('a');
    a.href = vCard(chantier); a.className = 'mq-btn mq-ghost';
    a.download = nomFichier;
    a.innerHTML = ico('users') + 'Ajouter au répertoire';
    a.addEventListener('click', async (e) => {
      try {
        const contenu = decodeURIComponent(a.href.split(',')[1] || '');
        const fichier = new File([contenu], nomFichier, { type: 'text/vcard' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [fichier] })) {
          e.preventDefault();
          await navigator.share({ files: [fichier], title: chantier.client_name || 'Client' });
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;   // l'artisan a fermé le menu
        // Sinon : le lien de téléchargement fait son travail.
      }
    });
    zone.appendChild(a);
  }
  zone.hidden = !zone.children.length;
}

// Avancement RÉEL, recalculé à chaque rafraîchissement du déroulement — jamais
// un pourcentage saisi à part. Le retard se lit sur les étapes non terminées
// dont la date (jour_fin, sinon jour) est dépassée — même règle que le pill
// du tableau de bord (dashboard.html).
function majEnTeteAvancement(taches) {
  const bar = document.getElementById('mq-progress-bar');
  const ligne = document.getElementById('mq-progress-line');
  if (!bar || !ligne) return;

  if (!taches.length) {
    bar.style.width = '0%';
    bar.style.background = '#228B5B';
    ligne.textContent = 'Aucune étape planifiée';
    return;
  }

  const total = taches.length;
  const faites = taches.filter((t) => t.statut === 'termine').length;
  const pct = Math.round((faites / total) * 100);
  bar.style.width = pct + '%';

  const aujourdhui = new Date().toISOString().slice(0, 10);
  let retard = 0;
  for (const t of taches) {
    if (t.statut === 'termine') continue;
    const limite = t.jour_fin || t.jour;
    if (!limite || limite >= aujourdhui) continue;
    const j = Math.floor((new Date(aujourdhui) - new Date(limite)) / 86400000);
    if (j > retard) retard = j;
  }
  // Ambre = même couleur que partout ailleurs dans la maquette (légende :
  // « en attente, à encaisser »). La barre n'a pas de variante CSS dédiée,
  // on pose la couleur en ligne — exactement comme le fait la maquette
  // elle-même pour ses barres en retard (écran 06).
  bar.style.background = retard > 0 ? '#B45309' : '#228B5B';
  const statutTxt = retard > 0 ? `retard ${retard} j` : 'dans les temps';
  ligne.textContent = `${pct} % · ${faites} étape${faites > 1 ? 's' : ''} sur ${total} · ${statutTxt}`;
}

// ── Statut calculé vs statut enregistré ────────────────────────────────────
// L'écriture reste explicite : on ne bascule jamais `chantiers.status` tout
// seul, on propose un bouton et c'est l'artisan qui décide.
function renderStatutCalcule(taches) {
  const area = document.getElementById('statut-calcule-area');
  if (!area) return;
  area.replaceChildren();
  if (!taches.length) return;

  const toutesTerminees = taches.every((t) => t.statut === 'termine');

  if (toutesTerminees && chantier.status !== 'termine') {
    const bloc = document.createElement('div');
    bloc.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:12px;';
    const note = document.createElement('div');
    note.className = 'ui-note';
    note.textContent = 'Toutes les étapes sont terminées.';
    bloc.appendChild(note);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mq-btn mq-ghost';
    btn.style.width = '100%';
    btn.textContent = 'Marquer le chantier terminé';
    btn.addEventListener('click', () => marquerChantierTermine(btn));
    bloc.appendChild(btn);
    area.appendChild(bloc);
  } else if (chantier.status === 'termine' && !toutesTerminees) {
    const restantes = taches.filter((t) => t.statut !== 'termine').length;
    const note = document.createElement('div');
    note.className = 'ui-note warn';
    note.style.marginTop = '12px';
    note.textContent = restantes > 1
      ? `Ce chantier est marqué « ${labelStatus('termine')} », mais ${restantes} étapes ne sont pas encore terminées.`
      : `Ce chantier est marqué « ${labelStatus('termine')} », mais 1 étape n’est pas encore terminée.`;
    area.appendChild(note);
  }
}

async function marquerChantierTermine(bouton) {
  bouton.disabled = true;
  const libelle = bouton.textContent;
  bouton.textContent = 'Un instant…';
  try {
    await updateChantier(chantierId, { status: 'termine' });
    await loadChantier();
    toast('Chantier marqué terminé', 'success');
    renderDeroulement();
  } catch (err) {
    console.warn('[chantier] marquage terminé', err);
    toast('Impossible de marquer le chantier terminé. Réessayez.', 'error');
    bouton.disabled = false;
    bouton.textContent = libelle;
  }
}

// ── Tabs ──────────────────────────────────────────────
// Rien ici ne dépend de l'ORDRE des boutons : tout passe par `data-tab`.
// On peut donc réordonner la barre dans le HTML sans toucher à ce fichier.
const tabs = document.querySelectorAll('.mq-tab');

// Le rendu d'un onglet est déclaré une seule fois, ici. Avant, la liste vivait
// dans le gestionnaire de clic : un onglet ouvert par défaut n'était donc
// JAMAIS rendu, puisque personne ne cliquait dessus.
// `documents` n'est PAS dans cette table pour sa fiche (remplie une fois par
// loadChantier() via fillInfoForm) — seul le coffre-fort (renderDocuments)
// s'y recharge à chaque activation.
const RENDUS = {
  deroulement: () => renderDeroulement(),
  photos: () => renderPhotos(),
  messages: () => renderMessages(),
  documents: () => renderDocuments(),
};

// Puces de l'assistant, propres à chaque onglet — reprises telles quelles
// de la maquette (écrans 02, 07, 12).
const CHIPS_PAR_ONGLET = {
  deroulement: ["Décaler la pose d'un jour", 'Prévenir le client', "Photo d'avancement"],
  photos: ['Envoyer au client', 'Devis depuis cette photo', 'Comparer avant / après'],
  messages: ['Prévenir du décalage', 'Envoyer les photos du jour'],
};

function poserChips(zone, libelles) {
  zone.replaceChildren();
  libelles.forEach((texte) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'mq-chip';
    chip.textContent = texte;
    chip.addEventListener('click', () => {
      if (typeof window.bsAssistantEnvoyerQuestion === 'function') {
        window.bsAssistantEnvoyerQuestion(texte);
      }
    });
    zone.appendChild(chip);
  });
}

// Docs n'a pas de puces fixes dans la maquette — mais depuis le 04/09/2026,
// les rappels du dossier (attestation manquante, PV à faire signer, facture
// de solde/situation à émettre…) sont calculés en vrai par
// `rappels_dossier` (app-actions.js) et affichés ICI, pas inventés. Un
// chantier sans rappel n'affiche rien : jamais de puce vide de sens.
async function majAssistantDocuments(carte, zone) {
  try {
    const mod = await import('./app-actions.js');
    const rappels = (await mod.executerAction('rappels_dossier', {})).data
      .filter((r) => r.chantier_id === chantierId);
    if (!rappels.length) { carte.hidden = true; return; }
    carte.hidden = false;
    poserChips(zone, rappels.slice(0, 3).map((r) => r.texte));
  } catch (e) {
    carte.hidden = true;
  }
}

function majAssistant(nom) {
  const carte = document.getElementById('mq-assist');
  const zone = document.getElementById('mq-chips');
  if (!carte || !zone) return;
  if (nom === 'documents') { majAssistantDocuments(carte, zone); return; }
  const chips = CHIPS_PAR_ONGLET[nom];
  if (!chips) { carte.hidden = true; return; }
  carte.hidden = false;
  poserChips(zone, chips);
}

function activerOnglet(nom) {
  // Sans nom d'onglet on ne touche à rien : tout masquer laisserait un écran
  // blanc, ce qui est pire que de laisser le HTML tel qu'il est arrivé.
  if (!nom) return;
  ongletCourant = nom;
  tabs.forEach((x) => {
    const actif = x.dataset.tab === nom;
    x.classList.toggle('mq-on', actif);
    x.setAttribute('aria-selected', String(actif));
  });
  document.querySelectorAll('.tab-content').forEach((c) => {
    c.classList.toggle('hidden', c.dataset.tabContent !== nom);
  });
  // Fil plein écran seulement sur Messages (correctif révision tâche 19,
  // 04/09) : voir le commentaire CSS .app-shell.mq-fil-plein dans
  // chantier.html — c'est ce qui borne l'écran à 100dvh pour que seul
  // .mq-thread défile.
  const shell = document.querySelector('.app-shell');
  if (shell) shell.classList.toggle('mq-fil-plein', nom === 'messages');
  // Même bascule sur <body> : css/app.css s'en sert pour effacer le bouton
  // flottant de l'assistant, qui se posait pile sur le bouton Envoyer.
  document.body.classList.toggle('bs-fil', nom === 'messages');
  if (RENDUS[nom]) RENDUS[nom]();
  if (typeof window.bsRejouer === 'function') {
    window.bsRejouer(document.querySelector(`.tab-content[data-tab-content="${nom}"]`), 'bs-glisse');
  }
  majAssistant(nom);
}

tabs.forEach((t) => t.addEventListener('click', () => activerOnglet(t.dataset.tab)));

// ── Déroulement : les tâches ordonnancées ──────────────
// Le moteur (app-planning-engine.js) écrit ces tâches en base avec leur
// jour et leur durée. Cet écran est la première chose qui les relit.
// Chaque ligne porte sa date : une étape sans date n'est pas vérifiable.

const JOUR_FMT = { weekday: 'long', day: 'numeric', month: 'long' };
const JOUR_ABBREV = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// « Jeu » + « 10 », comme dans la maquette (mq-d / <b>).
function jourAbregeEtNumero(iso) {
  const d = new Date(iso + 'T00:00:00');
  return { abbr: JOUR_ABBREV[d.getDay()], num: d.getDate() };
}

// ── Cocher une étape ───────────────────────────────────
// La maquette réduit l'état d'une étape à une case : cochée = terminée. La
// base garde ses trois états (a_faire / en_cours / termine), mais cet écran
// n'écrit plus que l'aller (→ terminée) et, pour l'encadrement seul, le
// retour (→ à faire) — la règle posée par Moctar le 03/09/2026 : rouvrir une
// étape déjà validée (avec son temps passé) reste réservé au patron et au
// chef. Un compagnon peut cocher, jamais décocher.
async function toggleEtapeCoche(cbBtn, t) {
  const versTermine = t.statut !== 'termine';
  if (!versTermine && !peutGererEtapes()) {
    toast('Seuls le patron et le chef peuvent rouvrir une étape.', 'error');
    return;
  }
  const nouveauStatut = versTermine ? 'termine' : 'a_faire';
  cbBtn.disabled = true;
  try {
    await majStatutTache(t.id, nouveauStatut);
    t.statut = nouveauStatut;
    if (versTermine) toast('Étape terminée', 'success');
    renderDeroulement();
  } catch (err) {
    console.warn('[chantier] statut étape', err);
    toast('Statut non enregistré. Réessayez.', 'error');
    cbBtn.disabled = false;
  }
}

// ── Modifier (et supprimer) une étape ──────────────────
// Un seul formulaire pour créer et pour modifier : les champs sont les mêmes,
// et deux formulaires jumeaux auraient divergé au premier ajout de champ.
// `tache` absent = création. `ancre` reçoit le formulaire juste après elle.
function ouvrirFormEtape(ancre, tache) {
  const existant = document.getElementById('der-form-etape');
  if (existant) existant.remove();

  const f = document.createElement('form');
  f.id = 'der-form-etape';
  f.className = 'der-form';

  const champ = (id, libelle, type, valeur, attrs = {}) => {
    const d = document.createElement('div');
    const l = document.createElement('label');
    l.textContent = libelle;
    l.setAttribute('for', id);
    const i = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    i.id = id;
    if (type !== 'textarea') i.type = type;
    // Jamais innerHTML : un titre d'étape vient de la base et peut contenir
    // n'importe quoi. `.value` ne construit pas de DOM, il ne peut rien injecter.
    i.value = valeur != null ? String(valeur) : '';
    Object.entries(attrs).forEach(([k, v]) => i.setAttribute(k, v));
    d.append(l, i);
    return d;
  };

  const titre = champ('df-titre', 'Intitulé de l’étape', 'text', tache ? tache.titre : '', { required: 'required', maxlength: '160' });
  const desc = champ('df-desc', 'Détail (optionnel)', 'textarea', tache ? tache.description : '', { rows: '2', maxlength: '600' });

  const ligne = document.createElement('div');
  ligne.className = 'der-form-ligne';
  ligne.append(
    champ('df-jour', 'Date', 'date', tache ? tache.jour : ''),
    champ('df-duree', 'Durée (h)', 'number', tache ? tache.duree_h : '', { min: '0.25', step: '0.25' }),
  );

  const boutons = document.createElement('div');
  boutons.className = 'der-form-boutons';
  const ok = document.createElement('button');
  ok.type = 'submit';
  ok.className = 'btn-cta';
  ok.style.cssText = 'flex:1;padding:9px';
  ok.textContent = tache ? 'Enregistrer' : 'Ajouter l’étape';
  const annul = document.createElement('button');
  annul.type = 'button';
  annul.className = 'btn-light';
  annul.style.cssText = 'padding:9px 14px';
  annul.textContent = 'Annuler';
  annul.addEventListener('click', () => { f.remove(); });

  // Supprimer vit désormais dans le formulaire d'édition — la ligne de
  // l'étape n'a plus de crayon ni de croix (maquette : la case et le
  // libellé seulement). Réservé à l'encadrement, comme avant.
  if (tache && peutGererEtapes()) {
    const suppr = document.createElement('button');
    suppr.type = 'button';
    suppr.className = 'btn-light';
    suppr.style.cssText = 'padding:9px 14px;color:var(--danger);border-color:var(--danger);';
    suppr.textContent = 'Supprimer';
    suppr.addEventListener('click', async () => {
      if (!confirm(`Supprimer l’étape « ${tache.titre || 'sans titre'} » ?`)) return;
      suppr.disabled = true;
      try {
        await supprimerTache(tache.id);
        toast('Étape supprimée', 'success');
        f.remove();
        renderDeroulement();
      } catch (err) {
        console.warn('[chantier] suppression étape', err);
        toast('Suppression refusée. Seuls le patron et le chef peuvent supprimer une étape.', 'error');
        suppr.disabled = false;
      }
    });
    boutons.append(ok, suppr, annul);
  } else {
    boutons.append(ok, annul);
  }

  f.append(titre, desc, ligne, boutons);

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const vTitre = f.querySelector('#df-titre').value.trim();
    if (!vTitre) { f.querySelector('#df-titre').focus(); return; }

    // Une durée vide reste vide : on ne fabrique pas un « 2 h » par défaut à
    // l'écran. La base a son propre défaut, c'est à elle de le poser.
    const brutDuree = f.querySelector('#df-duree').value;
    const vDuree = brutDuree === '' ? undefined : Number(brutDuree);
    if (vDuree !== undefined && !(vDuree > 0)) {
      toast('La durée doit être supérieure à zéro.', 'error');
      return;
    }

    const champs = {
      titre: vTitre,
      description: f.querySelector('#df-desc').value.trim() || null,
      jour: f.querySelector('#df-jour').value || null,
    };
    if (vDuree !== undefined) champs.duree_h = vDuree;

    ok.disabled = annul.disabled = true;
    ok.textContent = 'Un instant…';
    try {
      if (tache) {
        await modifierTache(tache.id, champs);
        toast('Étape modifiée', 'success');
      } else {
        await creerTache(chantierId, champs);
        toast('Étape ajoutée', 'success');
        f.remove();
        // La proposition vient APRÈS le rendu, et on l'attend : lancée en
        // parallèle, sa carte était insérée dans la liste puis balayée par le
        // `replaceChildren()` de renderDeroulement() — course perdue une fois
        // sur deux, et la proposition ne s'affichait jamais (07/09, Moctar :
        // « il aurait fallu que l'assistant demande »).
        await renderDeroulement();
        proposerDevisTravauxSupp(champs.titre);
        return;
      }
      f.remove();
      renderDeroulement();
    } catch (err) {
      console.warn('[chantier] écriture étape', err);
      toast(tache
        ? 'Modification refusée. Réessayez.'
        : 'Ajout refusé. Seuls le patron et le chef peuvent ajouter une étape.', 'error');
      ok.disabled = annul.disabled = false;
      ok.textContent = tache ? 'Enregistrer' : 'Ajouter l’étape';
    }
  });

  ancre.appendChild(f);
  f.querySelector('#df-titre').focus();
}

// Le bouton « ajouter une étape », sous la liste — absent de la maquette
// (qui ne montre pas cette action-là) mais indispensable : sans lui,
// l'encadrement n'a plus aucun moyen d'ajouter une étape à la main sur ce
// hub. Reconstruit à chaque rendu : les droits peuvent ne pas être encore
// connus au tout premier passage.
function rendreZoneAjout() {
  const zone = document.getElementById('deroulement-actions');
  if (!zone) return;
  zone.replaceChildren();
  if (!peutGererEtapes()) return;

  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'mq-btn mq-ghost';
  b.style.cssText = 'width:100%;margin-top:12px;';
  b.textContent = 'Ajouter une étape';
  b.addEventListener('click', () => ouvrirFormEtape(zone, null));
  zone.appendChild(b);
}

// Une action de l'assistant qui touche aux étapes (planifier, ajouter,
// décaler, terminer…) : le déroulement se met à jour sans rechargement.
document.addEventListener('bs:action-executee', (e) => {
  const a = String((e.detail && e.detail.action) || '');
  if (/etape|tache|planifier|planning|terminer_chantier|modifier_chantier/.test(a)) {
    renderDeroulement().catch(() => {});
  }
});

// ── Poser les étapes au calendrier ────────────────────────────────────
// Moctar, 07/09 : « à planifier m'a amené vers l'assistant sans donner
// l'opportunité de mettre une date de début ». Le parcours partait
// directement en `sans_dates` dès que le chantier n'avait pas de date : la
// seule façon d'en poser une était d'aller la chercher dans l'onglet Infos,
// que personne ne devine. La date se demande ICI, à l'endroit où l'on
// planifie, et « je ne sais pas encore » reste possible — un artisan qui
// attend la livraison du carrelage n'a pas de date à donner.
function zonePlanification() {
  const client = chantier?.client_name || '';

  // Chantier déjà daté : rien à demander, on planifie depuis cette date.
  if (chantier?.date_debut) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'mq-btn mq-primary'; btn.style.width = '100%';
    btn.textContent = 'Planifier les étapes depuis le devis';
    btn.addEventListener('click', () => lancerPlanification(chantier.date_debut));
    return btn;
  }

  const zone = document.createElement('div');
  zone.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:12px;';

  const label = document.createElement('label');
  label.style.cssText = 'font-size:12.5px;font-weight:700;color:#3D5A4E;';
  label.textContent = 'Le chantier démarre le';
  const champ = document.createElement('input');
  champ.type = 'date';
  champ.id = 'plan-date-debut';
  // 16 px minimum : en dessous, Safari iOS zoome la page à la mise au point.
  champ.style.cssText = 'width:100%;font-size:16px;padding:10px;border:1px solid #D9E2DC;border-radius:10px;';
  champ.min = new Date().toISOString().slice(0, 10);
  label.setAttribute('for', 'plan-date-debut');

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'mq-btn mq-primary'; btn.style.width = '100%';
  btn.textContent = 'Planifier les étapes depuis le devis';
  btn.addEventListener('click', async () => {
    const date = champ.value;
    if (!date) { toast('Donnez la date de démarrage, ou choisissez « Je n’ai pas encore de date ».', 'error'); champ.focus(); return; }
    btn.disabled = true;
    const libelle = btn.textContent;
    btn.textContent = 'Un instant…';
    try {
      // La date saisie devient CELLE DU CHANTIER : sans ça, les étapes
      // partent au calendrier pendant que la fiche reste sans date, et
      // l'écran d'accueil continue d'afficher « À planifier ».
      await updateChantier(chantierId, { date_debut: date });
      if (chantier) chantier.date_debut = date;
    } catch (e) {
      console.warn('[chantier] date de début', e);
      toast('Date non enregistrée. Vérifiez votre connexion et réessayez.', 'error');
      btn.disabled = false; btn.textContent = libelle;
      return;
    }
    lancerPlanification(date);
  });

  const sansDate = document.createElement('button');
  sansDate.type = 'button'; sansDate.className = 'mq-btn mq-ghost'; sansDate.style.width = '100%';
  sansDate.textContent = 'Je n’ai pas encore de date';
  sansDate.addEventListener('click', () => lancerPlanification(null));

  const note = document.createElement('div');
  note.style.cssText = 'font-size:11.5px;color:#6B7F76;';
  note.textContent = 'Sans date, les étapes sont préparées ici et rejoindront le calendrier quand la date sera fixée.';

  zone.append(label, champ, btn, sansDate, note);
  return zone;
}

// Une seule voie vers l'assistant, datée ou non. Le bouton connaît déjà le
// chantier et l'outil voulu : on ne laisse pas le modèle deviner (06/09,
// Moctar : « ça ouvre l'assistant puis ça ne crée pas les étapes »), la
// carte Valider est proposée directement.
function lancerPlanification(dateDebut) {
  const client = chantier?.client_name || '';
  const texte = dateDebut
    ? `Planifie les étapes du chantier de ${client} depuis son devis à partir du ${dateDebut}.`
    : `Prépare les étapes du chantier de ${client} depuis son devis, sans dates.`;
  if (typeof window.bsAssistantProposer === 'function') {
    window.bsAssistantProposer('planifier_depuis_devis',
      dateDebut ? { client_nom: client, date_debut: dateDebut } : { client_nom: client, sans_dates: true },
      texte,
      dateDebut
        ? `Planifier les étapes de ${client} depuis son devis à partir du ${dateDebut}`
        : `Préparer les étapes de ${client} depuis son devis, sans dates`);
    return;
  }
  if (typeof window.bsAssistantEnvoyerQuestion !== 'function') return;
  window.bsAssistantEnvoyerQuestion(texte);
}

async function renderDeroulement() {
  const liste = document.getElementById('deroulement-liste');
  if (typeof window.bsSquelette === 'function') liste.replaceChildren(window.bsSquelette(3, { court: true }));
  else liste.innerHTML = '<div class="empty"><p>Chargement…</p></div>';
  rendreZoneAjout();

  let taches = [];
  try {
    taches = await listTachesChantier(chantierId);
  } catch (e) {
    liste.innerHTML = '<div class="empty"><p>Impossible de charger le déroulement. Réessayez.</p></div>';
    return;
  }
  dernieresTaches = taches;

  // L'en-tête (barre d'avancement + statut calculé) se met à jour ici, que
  // la liste soit vide ou non : c'est la même lecture des tâches.
  majEnTeteAvancement(taches);
  renderStatutCalcule(taches);

  if (!taches.length) {
    // Pas d'étapes : on les prépare depuis le devis, même sans date de début
    // (Moctar, 05/09) — elles vivent ici, et rejoignent le calendrier quand
    // la date est fixée.
    liste.innerHTML = '<div class="empty"><p>Aucune étape sur ce chantier.'
      + (chantier?.date_debut ? '' : '<br>Ce chantier n’a pas encore de date de début.')
      + '</p></div>';
    liste.appendChild(zonePlanification());
    return;
  }

  // Regroupement par jour, en gardant l'ordre d'exécution (nulls en dernier,
  // voir listTachesChantier).
  const parJour = new Map();
  for (const t of taches) {
    const cle = t.jour || 'sans-date';
    if (!parJour.has(cle)) parJour.set(cle, []);
    parJour.get(cle).push(t);
  }

  liste.replaceChildren();
  if (typeof window.bsCascade === 'function') window.bsCascade(liste);
  for (const [jour, lot] of parJour) {
    const jourDiv = document.createElement('div');
    jourDiv.className = 'mq-day';

    const dEl = document.createElement('div');
    dEl.className = 'mq-d';
    if (jour === 'sans-date') {
      dEl.append('Sans', document.createElement('b'));
      dEl.lastChild.textContent = 'date';
    } else {
      const { abbr, num } = jourAbregeEtNumero(jour);
      dEl.append(abbr, document.createElement('b'));
      dEl.lastChild.textContent = String(num);
    }
    // Le libellé complet du jour reste accessible au lecteur d'écran / à la
    // survolée, même si la maquette n'affiche que l'abrégé.
    if (jour !== 'sans-date') {
      const d = new Date(jour + 'T00:00:00');
      dEl.title = d.toLocaleDateString('fr-FR', JOUR_FMT);
    }
    jourDiv.appendChild(dEl);

    const tasksDiv = document.createElement('div');
    tasksDiv.className = 'mq-tasks';

    for (const t of lot) {
      const wrap = document.createElement('div');

      const row = document.createElement('div');
      row.className = 'mq-task' + (t.statut === 'termine' ? ' mq-done' : '');

      const cbBtn = document.createElement('button');
      cbBtn.type = 'button';
      cbBtn.className = 'mq-cb-hit';
      cbBtn.setAttribute('role', 'checkbox');
      cbBtn.setAttribute('aria-checked', String(t.statut === 'termine'));
      cbBtn.setAttribute('aria-label', `Étape ${t.titre || 'sans titre'}`);
      const cbSpan = document.createElement('span');
      cbSpan.className = 'mq-cb' + (t.statut === 'termine' ? ' mq-done' : '');
      cbBtn.appendChild(cbSpan);
      cbBtn.addEventListener('click', () => toggleEtapeCoche(cbBtn, t));
      row.appendChild(cbBtn);

      const label = document.createElement('span');
      label.className = 'mq-titre-etape';
      label.textContent = t.titre || 'Étape';
      // Taper sur le libellé ouvre le formulaire existant — réservé à
      // l'encadrement, comme l'étaient le crayon et la croix qu'il remplace.
      if (peutGererEtapes()) {
        label.classList.add('der-editable');
        label.setAttribute('role', 'button');
        label.tabIndex = 0;
        label.setAttribute('aria-label', `Modifier l’étape ${t.titre || ''}`.trim());
        label.addEventListener('click', () => ouvrirFormEtape(wrap, t));
        label.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); label.click(); }
        });
      }
      row.appendChild(label);

      // « Qui » : un prénom si assigné, un tiret si l'équipe existe mais que
      // personne n'est assigné (comme le montre la maquette pour l'étape de
      // séchage), rien du tout si l'artisan travaille seul — lui afficher
      // « personne » serait un faux constat, il n'y a personne À qui
      // assigner.
      let quiTexte = null;
      if (t.assigne_a) quiTexte = t.assigne_a;
      else if (equipeVide === false) quiTexte = '—';
      if (quiTexte) {
        const qui = document.createElement('span');
        qui.className = 'mq-who';
        qui.textContent = quiTexte;
        row.appendChild(qui);
      }

      wrap.appendChild(row);
      tasksDiv.appendChild(wrap);
    }

    jourDiv.appendChild(tasksDiv);
    liste.appendChild(jourDiv);
  }
}

// ── Info form (fiche du chantier, onglet Docs) ─────────
function fillInfoForm() {
  if (!chantier) return;   // rien lu : ne pas vider la fiche avec des blancs
  document.getElementById('i-client-name').value = chantier.client_name || '';
  document.getElementById('i-client-email').value = chantier.client_email || '';
  document.getElementById('i-client-phone').value = chantier.client_phone || '';
  document.getElementById('i-adresse').value = chantier.adresse || '';
  document.getElementById('i-description').value = chantier.description || '';
  document.getElementById('i-status').value = chantier.status || 'en_cours';
  // `?? ''` et non `|| ''` : un budget de 0 est une valeur, pas une absence.
  // Avec `||` il s'affichait vide, et le réenregistrement le remettait à null.
  document.getElementById('i-budget').value =
    chantier.budget_estime ?? '';
  document.getElementById('i-date-debut').value = chantier.date_debut || '';
  document.getElementById('i-date-fin').value = chantier.date_fin_prevue || '';
}

// Le budget vient d'un <input type="number"> : une saisie que le navigateur
// juge invalide y arrive comme chaîne vide, indistinguable d'un champ effacé.
// On distingue donc les trois cas explicitement, parce que `parseFloat(v) || null`
// les confondait tous les trois — et transformait un budget de 0 en « aucun ».
function lireBudget(brut) {
  const v = String(brut).trim();
  if (v === '') return { ok: true, valeur: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return { ok: false };
  return { ok: true, valeur: n };
}

document.getElementById('info-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const bouton = e.target.querySelector('button[type="submit"]');

  // `client_name` est NOT NULL en base. Sans garde-fou ici, vider le champ
  // enregistrait une chaîne vide : le chantier perdait son nom à l'écran
  // (le hero retombait sur le type de travaux) sans qu'aucune erreur ne le dise.
  const nom = document.getElementById('i-client-name').value.trim();
  if (!nom) {
    toast('Le nom du client est obligatoire.', 'error');
    document.getElementById('i-client-name').focus();
    return;
  }

  const budget = lireBudget(document.getElementById('i-budget').value);
  if (!budget.ok) {
    toast('Budget invalide. Saisissez un nombre positif, ou laissez vide.', 'error');
    document.getElementById('i-budget').focus();
    return;
  }

  // Sans état occupé, un double clic partait deux fois et le second écrasait
  // parfois le premier avec un formulaire déjà rechargé.
  const libelle = bouton ? bouton.textContent : '';
  if (bouton) { bouton.disabled = true; bouton.textContent = 'Enregistrement…'; }
  try {
    await updateChantier(chantierId, {
      client_name: nom,
      client_email: document.getElementById('i-client-email').value.trim() || null,
      client_phone: document.getElementById('i-client-phone').value.trim() || null,
      adresse: document.getElementById('i-adresse').value.trim() || null,
      description: document.getElementById('i-description').value.trim() || null,
      status: document.getElementById('i-status').value,
      budget_estime: budget.valeur,
      date_debut: document.getElementById('i-date-debut').value || null,
      date_fin_prevue: document.getElementById('i-date-fin').value || null,
    });
    // On recharge AVANT de dire que c'est enregistré : le message ne doit
    // annoncer que ce que la base a effectivement rendu.
    await loadChantier();
    toast('Chantier enregistré', 'success');
  } catch (err) {
    // Le message de Postgres ne veut rien dire pour un artisan. La cause
    // technique reste en console, lui reçoit une phrase actionnable.
    console.warn('[chantier] enregistrement fiche', err);
    toast('Enregistrement impossible. Vérifiez votre connexion et réessayez.', 'error');
  } finally {
    if (bouton) { bouton.disabled = false; bouton.textContent = libelle; }
  }
});

// ── Retour après suppression ──────────────────────────
// On revient D'OÙ ON VIENT. `chantier.html?id=…` est ouvert depuis le tableau
// de bord, depuis quatre endroits du planning et depuis l'assistant : renvoyer
// tout le monde au tableau de bord sortait l'artisan de son planning à chaque
// suppression.
//
// Le referrer n'est pas fiable par nature (vide en navigation directe, ou
// posé par un autre site). On ne l'accepte donc que s'il est de MÊME ORIGINE
// et qu'il ne pointe pas sur la page qu'on vient de détruire. Sinon, planning.
function retourApresSuppression() {
  const repli = './planning.html';
  const ref = document.referrer;
  if (!ref) return repli;
  try {
    const u = new URL(ref, location.href);
    if (u.origin !== location.origin) return repli;
    // Revenir sur la fiche supprimée afficherait une erreur de chargement.
    if (u.pathname === location.pathname) return repli;
    return u.href;
  } catch (_) {
    return repli;
  }
}

document.getElementById('delete-chantier-btn').addEventListener('click', async (e) => {
  if (!confirm('Supprimer ce chantier et toutes ses données (photos, messages, devis) ?')) return;
  const bouton = e.currentTarget;
  bouton.disabled = true;
  try {
    await deleteChantier(chantierId);
    // `replace` et non `href` : la fiche n'existe plus, la laisser dans
    // l'historique offrait un bouton Retour vers un écran qui plante.
    location.replace(retourApresSuppression());
  } catch (err) {
    console.warn('[chantier] suppression chantier', err);
    // La policy `chantiers_delete_encadrement` réserve la suppression au
    // patron et au chef : c'est la cause la plus probable d'un refus ici.
    toast('Suppression refusée. Seuls le patron et le chef peuvent supprimer un chantier.', 'error');
    bouton.disabled = false;
  }
});

// ── Lien client ───────────────────────────────────────
document.getElementById('copy-suivi-btn').addEventListener('click', async () => {
  const url = `${window.__BATISPOT_CONFIG__.SUIVI_URL}?t=${chantier.public_token}`;
  try {
    await navigator.clipboard.writeText(url);
    toast('Lien copié — envoie-le au client', 'success');
  } catch {
    prompt('Copie ce lien et envoie-le au client :', url);
  }
});

// Bouton « Partager l'avant / après » : Web Share API si dispo (partage
// natif vers WhatsApp, SMS, etc.), sinon repli sur la copie du lien —
// même lien de suivi que copy-suivi-btn ci-dessus.
document.getElementById('avant-apres-partager').addEventListener('click', async () => {
  if (!chantier?.public_token) return;
  const url = `${window.__BATISPOT_CONFIG__.SUIVI_URL}?t=${chantier.public_token}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Avant / après du chantier', text: 'Suivez l’avancement du chantier en photos.', url });
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return;
      // Le partage natif a échoué (pas d'app compatible, etc.) : on retombe
      // sur la copie plutôt que de laisser l'artisan sans solution.
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Lien copié — envoie-le au client', 'success');
  } catch {
    prompt('Copie ce lien et envoie-le au client :', url);
  }
});

// ── Photos ────────────────────────────────────────────
// « Photos de chantier en trois temps » (06/09/2026, validé par le
// fondateur) : un seul vocabulaire — Début · Pendant · Fin — visible et
// changé d'un tap, prise en rafale, et RIEN ne part chez le client sans un
// geste de l'artisan. Toute la mécanique de galerie (groupes, appui long,
// sélection, barre d'actions) vit dans js/photos-galerie.js, partagée avec
// photos.html. Ici : l'état propre à ce chantier et les appels Supabase.
//
// Le temps proposé se déduit des étapes (deduirePhase) ; `phasePhotoChoisie`
// garde le choix manuel de l'artisan pour la session, null = suivre la
// proposition. En base, photos.phase reste avant / pendant / apres.
let phasePhotoChoisie = null;
let photosCourantes = [];
let galeriePhotos = null;

function phasePhotoCourante() {
  return phasePhotoChoisie || deduirePhase(dernieresTaches);
}

function majBoutonPhotos() {
  const lib = document.getElementById('upload-btn-libelle');
  if (lib) lib.textContent = libelleBoutonPhotos(phasePhotoCourante());
}

function renderCasesTemps() {
  rendreCasesTemps(document.getElementById('photo-temps'), {
    photos: photosCourantes,
    phaseChoisie: phasePhotoCourante(),
    phaseProposee: deduirePhase(dernieresTaches),
    onChoisir: (phase) => { phasePhotoChoisie = phase; renderCasesTemps(); },
  });
  majBoutonPhotos();
}

// ── Avant / après ───────────────────────────────────────
// Les deux photos que l'artisan a MARQUÉES « Avant » et « Après »
// (photos.role_client) — plus la première / dernière d'une phase. Sans ce
// choix, la case dit « Chantier en cours », comme sur la page client.
function renderAvantApres(photos) {
  const card = document.getElementById('avant-apres-card');
  const partagerBtn = document.getElementById('avant-apres-partager');
  const { avant, apres } = rendreBlocAvapArtisan(card, photos);
  if (partagerBtn) {
    partagerBtn.style.display = chantier?.public_token && avant && apres ? '' : 'none';
  }
}

function galerie() {
  if (galeriePhotos) return galeriePhotos;
  galeriePhotos = creerGalerie({
    conteneur: document.getElementById('photos-grid'),
    notifier: toast,
    onAjouter: () => document.getElementById('photo-input').click(),
    actions: {
      envoyerClient: (ids, visible) => setPhotosVisiblesClient(ids, visible),
      marquerRole: (id, role) => setPhotoRoleClient(chantierId, id, role),
      supprimer: async (ids) => {
        for (const id of ids) {
          const p = photosCourantes.find((x) => x.id === id);
          if (p) await deletePhoto({ id: p.id, storage_path: p.storage_path });
        }
      },
    },
    apresAction: () => renderPhotos({ silencieux: true }),
  });
  return galeriePhotos;
}

// `silencieux` : pas de roue de chargement quand on rafraîchit après une
// action ou pendant une rafale — la galerie reste affichée, elle se met à
// jour. La roue n'a de sens qu'à la première ouverture de l'onglet.
async function renderPhotos({ silencieux = false } = {}) {
  const grid = document.getElementById('photos-grid');
  if (!silencieux) grid.innerHTML = '<div class="loading-center"><div class="loading"></div></div>';

  // Ouvert directement sur ?onglet=photos : les étapes ne sont pas encore
  // chargées, la proposition serait toujours « Pendant ». On les lit une
  // fois ; un échec n'empêche rien (Pendant reste le repli).
  if (!dernieresTaches.length) {
    try { dernieresTaches = await listTachesChantier(chantierId); } catch (_) { /* repli : pendant */ }
  }

  let photos;
  try {
    photos = await signPhotoUrls(await listPhotos(chantierId));
  } catch (err) {
    grid.innerHTML = `<div class="empty"><p>Photos indisponibles pour le moment (réseau ou serveur). Réessayez.</p></div>`;
    toast(err.message || String(err), 'error');
    renderAvantApres([]);
    renderCasesTemps();
    return;
  }

  photosCourantes = photos || [];
  renderCasesTemps();
  renderAvantApres(photosCourantes);
  galerie().rendre(photosCourantes);
}

// Prise en rafale (capture="environment" multiple) ou import depuis la
// galerie (multiple, sans capture) : même traitement, chaque photo apparaît
// dans sa section dès son envoi, sans légende demandée.
async function envoyerFichiersChoisis(input) {
  const files = Array.from(input.files || []);
  input.value = '';
  if (!files.length) return;
  await envoyerFichiersPhotos({
    files,
    chantierId,
    phase: phasePhotoCourante(),
    uploadPhoto,
    notifier: toast,
    apresChaque: () => renderPhotos({ silencieux: true }),
  });
}

document.getElementById('upload-btn').addEventListener('click', () => {
  document.getElementById('photo-input').click();
});
document.getElementById('upload-galerie-btn').addEventListener('click', () => {
  document.getElementById('photo-input-galerie').click();
});
document.getElementById('photo-input').addEventListener('change', (e) => envoyerFichiersChoisis(e.target));
document.getElementById('photo-input-galerie').addEventListener('change', (e) => envoyerFichiersChoisis(e.target));

// ── Messages ──────────────────────────────────────────
// Tout le rendu (bulles, ergot, heure dans la bulle, séparateurs de jour,
// liens cliquables, accusé de lecture) vient de js/mq-thread.js : c'est la
// MÊME fonction qui dessine le fil direct, le fil d'équipe et la page de
// suivi du client. Il ne reste ici que ce qui est propre à ce fil-là — qui
// est « moi » (l'artisan) et comment s'appelle l'autre bout.

async function renderMessages() {
  const list = document.getElementById('msg-list');
  list.innerHTML = '<div class="loading-center"><div class="loading"></div></div>';
  let msgs;
  try {
    msgs = await listMessages(chantierId);
  } catch (err) {
    list.replaceChildren(rendreEtatVide('Messages indisponibles pour le moment. Réessayez.'));
    return;
  }
  const nomClient = (chantier && chantier.client_name) || 'Votre client';
  rendreFil(list, msgs, {
    mienne: (m) => m.author === 'pro',
    auteur: () => nomClient,
    // Accusé de lecture : `messages.lu_le` est posé par marquerLuMessagesClient(),
    // qui ne marque QUE les messages venus du client. Rien n'écrit « le client
    // a lu » — la page de suivi est publique et n'a aucun droit d'écriture sur
    // cette colonne. Afficher une double coche verte ici serait donc mentir à
    // l'artisan : une seule coche, « parti ».
    lu: (m) => (m.author === 'pro' ? false : null),
    // Appui long sur MA bulle : modifier (15 min) ou supprimer (48 h) — la
    // page de suivi ne marque jamais « lu », la base tranche par le délai.
    actions: (m) => (m.author === 'pro' ? {
      modifier: (msg, txt) => modifierMessage(msg.id, txt),
      supprimer: (msg) => supprimerMessage(msg.id),
    } : null),
    vide: "Aucun message pour l'instant. Écrivez le premier — votre client le verra sur sa page de suivi.",
  });
  // Le fil vient d'être affiché : on marque lu et on rafraîchit le badge de
  // la barre du bas. Jamais bloquant pour l'affichage (échoue en silence si
  // la colonne lu_le manque — voir mq-thread.js).
  marquerLuMessagesClient(chantierId).then(() => actualiserBadgeMessages());
}

// Zone de saisie : emoji à gauche, texte au milieu, bouton rond à droite qui
// montre « envoyer » dès qu'il y a du texte et « micro » quand le champ est
// vide. Le micro DICTE dans le champ, il n'envoie jamais tout seul.
const msgInput = document.getElementById('msg-input');
brancherComposeur({
  textarea: msgInput,
  sendBtn: document.getElementById('msg-send-btn'),
  micBtn: document.getElementById('msg-mic-btn'),
  emojiBtn: document.getElementById('msg-emoji-btn'),
  panel: document.getElementById('msg-emoji-panel'),
  tabs: document.getElementById('msg-emoji-tabs'),
  grid: document.getElementById('msg-emoji-grid'),
  indice: document.getElementById('msg-indice'),
  micro: true,
  contexteDictee: 'note',
  onMessage: (texte, type) => toast(texte, type),
  onEnvoyer: async () => {
    const content = msgInput.value.trim();
    if (!content) return;
    try {
      await sendMessage(chantierId, content);
      msgInput.value = '';
      renderMessages();
    } catch (err) { toast(err.message, 'error'); }
  },
});

// Photo dans le fil client (Moctar 06/09) : depuis le téléphone / le Drive
// (sélecteur système) ou parmi les photos du chantier. Une photo envoyée au
// client devient visible sur sa page de suivi.
const msgCamBtn = document.getElementById('msg-cam-btn');
if (msgCamBtn) {
  msgCamBtn.innerHTML = iconeFilMsg('camera', 18);
  msgCamBtn.addEventListener('click', async () => {
    const choix = await choisirPhoto({ titre: 'Envoyer une photo au client', listerPhotosApp: () => listPhotosMsg(chantierId), libelleApp: 'Photos du chantier' });
    if (!choix) return;
    try {
      let chemin;
      if (choix.type === 'fichier') {
        const st = chantier && chantier.status;
        const phase = st === 'en_attente' ? 'avant' : st === 'termine' ? 'apres' : 'pendant';
        toast('Envoi de la photo…', 'info');
        const p = await uploadPhotoMsg(chantierId, choix.file, 'Envoyée au client', phase, { visibleClient: true });
        chemin = p.storage_path;
      } else {
        chemin = choix.photo.storage_path;
        if (!choix.photo.visible_client) await marquerPhotoVisibleClient(choix.photo.id);
      }
      await sendMessage(chantierId, `[photo:${chemin}]`);
      renderMessages();
    } catch (err) { toast((err && err.message) || 'Photo non envoyée. Réessayez.', 'error'); }
  });
}

// (Bloc Devis retiré — création de devis désactivée dans l'app)

// ── Documents (coffre fort artisan) ──────────────────
function makeEl(tag, style, text) {
  const el = document.createElement(tag);
  if (style) el.style.cssText = style;
  if (text !== undefined) el.textContent = text;
  return el;
}

async function renderDocuments() {
  const area = document.getElementById('docs-tab-area');
  if (!area) return;

  // Le dossier reglementaire vient EN PREMIER : c'est ce qui expose l'artisan
  // s'il manque, alors que le coffre de fichiers en dessous est du confort.
  // Il se rend independamment du coffre — un chantier sans demande BatiSpot
  // liee a quand meme besoin de son PV de reception.
  let zoneDossier = document.getElementById('dossier-reglementaire');
  if (!zoneDossier) {
    zoneDossier = document.createElement('div');
    zoneDossier.id = 'dossier-reglementaire';
    zoneDossier.style.cssText = 'margin-bottom:16px';
    area.parentNode.insertBefore(zoneDossier, area);
  }
  // ?v= sur un import() dynamique : pas de <script src> a versionner pour ce
  // module (il n'est jamais charge par une balise HTML), donc c'est ici que
  // le cache du navigateur/service worker doit etre invalide.
  import('./chantier-dossier.js?v=v35_2026_09_04')
    .then((m) => m.renderDossierChantier(zoneDossier, chantier))
    .catch((e) => {
      console.warn('[chantier] dossier reglementaire', e);
      if (typeof window.bsSignalerPanne === 'function') {
        window.bsSignalerPanne({ action: 'dossier reglementaire', code: 'chargement', detail: String(e.message || e) });
      }
    });

  area.replaceChildren(makeEl('div', 'text-align:center;padding:24px', ''));
  area.firstChild.appendChild(makeEl('div', null)).className = 'loading';

  // Un chantier créé depuis un devis (pas depuis une demande BatiSpot) n'a
  // pas de dossier `client_documents` (pièces échangées via une demande) —
  // mais ça ne concerne QUE cette liste-ci. Le dossier réglementaire
  // (avant travaux / fin de chantier), au-dessus, existe déjà pour TOUT
  // chantier : il ne dépend jamais de `demandeId`. Avant le 04/09/2026 ce
  // bloc affichait « Les documents ne sont pas disponibles », un message
  // alarmant qui faisait croire que tout l'onglet Docs était cassé alors
  // que le dossier au-dessus fonctionnait très bien.
  if (!demandeId) {
    area.replaceChildren();
    const msg = makeEl('div', 'text-align:center;padding:20px 16px');
    msg.appendChild(makeEl('p', 'font-size:12.5px;color:var(--sub)',
      'Aucun document échangé via une demande BatiSpot pour ce chantier.'));
    area.appendChild(msg);
    return;
  }

  try {
    const docs = await listClientDocs(demandeId);
    area.replaceChildren();

    // Liste des docs existants
    const listWrap = makeEl('div', 'display:flex;flex-direction:column;gap:8px;margin-bottom:16px');

    if (docs.length === 0) {
      listWrap.appendChild(makeEl('p', 'text-align:center;color:var(--sub);font-size:13px;padding:16px 0', 'Aucun document pour ce chantier.'));
    } else {
      const svgNS = 'http://www.w3.org/2000/svg';

      docs.forEach(doc => {
        const row = makeEl('div', 'display:flex;align-items:center;gap:10px;background:#fff;border:1px solid rgba(34,139,91,0.1);border-radius:10px;padding:10px 12px');

        const icon = makeEl('div', 'width:32px;height:32px;border-radius:7px;flex-shrink:0;display:flex;align-items:center;justify-content:center');
        const isPdf = (doc.file_name || '').toLowerCase().endsWith('.pdf');
        icon.style.background = isPdf ? '#FEF2F2' : '#EFF6FF';
        icon.style.color = isPdf ? '#DC2626' : '#2563EB';
        const svg = document.createElementNS(svgNS,'svg');
        ['width','height','viewBox','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin'].forEach((a,i) =>
          svg.setAttribute(a,['14','14','0 0 24 24','none','currentColor','2','round','round'][i]));
        svg.setAttribute('aria-hidden','true');
        const pp = document.createElementNS(svgNS,'path'); pp.setAttribute('d','M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z');
        const pl = document.createElementNS(svgNS,'polyline'); pl.setAttribute('points','14 2 14 8 20 8');
        svg.appendChild(pp); svg.appendChild(pl);
        icon.appendChild(svg);

        const info = makeEl('div', 'flex:1;min-width:0');
        const name = makeEl('div', 'font-size:12px;font-weight:700;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap');
        name.textContent = doc.file_name;
        const meta = makeEl('div', 'font-size:11px;color:#9CA3AF;margin-top:1px');
        meta.textContent = (DOC_TYPE_LABEL[doc.doc_type] || doc.doc_type) + ' · ' + (doc.uploader_role === 'client' ? 'Client' : 'Vous') + ' · ' + fmtDate(doc.created_at);
        info.appendChild(name); info.appendChild(meta);

        const dlBtn = makeEl('button', 'padding:5px 10px;font-size:11px;white-space:nowrap;flex-shrink:0');
        dlBtn.className = 'btn-light'; dlBtn.title = 'Télécharger'; dlBtn.textContent = '↓';
        dlBtn.addEventListener('click', async () => {
          try {
            const url = await clientDocSignedUrl(doc.storage_path);
            const a = document.createElement('a');
            a.href = url; a.download = doc.file_name; a.target = '_blank';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          } catch (e) { toast(e.message || 'Téléchargement impossible', 'error'); }
        });

        row.appendChild(icon); row.appendChild(info); row.appendChild(dlBtn);

        if (doc.uploader_id === session.user.id) {
          const delBtn = makeEl('button', 'padding:5px 8px;font-size:11px;flex-shrink:0');
          delBtn.className = 'btn-light';
          delBtn.style.color = 'var(--danger)'; delBtn.style.borderColor = 'var(--danger)';
          delBtn.title = 'Supprimer'; delBtn.textContent = '×';
          delBtn.addEventListener('click', async () => {
            if (!confirm('Supprimer "' + doc.file_name + '" ?')) return;
            try { await deleteClientDoc(doc.id, doc.storage_path); row.remove(); toast('Supprimé', 'success'); }
            catch (e) { toast(e.message, 'error'); }
          });
          row.appendChild(delBtn);
        }
        listWrap.appendChild(row);
      });
    }
    area.appendChild(listWrap);

    // Zone upload artisan
    const uploadSection = makeEl('div', 'border:1px solid rgba(34,139,91,0.15);border-radius:12px;padding:14px');
    uploadSection.appendChild(makeEl('div', 'font-size:13px;font-weight:800;color:#0d3320;margin-bottom:10px', 'Ajouter un document'));

    const typeRow = makeEl('div', 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px');
    let selectedDocType = 'devis';
    [['devis','Devis'],['facture','Facture'],['autre','Autre']].forEach(([val, label], i) => {
      const chip = makeEl('span', 'font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;cursor:pointer;color:#374151;border:1.5px solid #E5E7EB', label);
      if (i === 0) { chip.style.borderColor = '#1A6B45'; chip.style.background = '#EBF7F1'; chip.style.color = '#0F5132'; }
      chip.addEventListener('click', () => {
        typeRow.querySelectorAll('span').forEach(c => { c.style.borderColor='#E5E7EB'; c.style.background=''; c.style.color='#374151'; });
        chip.style.borderColor='#1A6B45'; chip.style.background='#EBF7F1'; chip.style.color='#0F5132';
        selectedDocType = val;
      });
      typeRow.appendChild(chip);
    });
    uploadSection.appendChild(typeRow);

    const fileInput = document.createElement('input');
    fileInput.type = 'file'; fileInput.accept = '.pdf,image/*'; fileInput.style.display = 'none';
    uploadSection.appendChild(fileInput);

    const uploadBtn = makeEl('button', 'width:100%;padding:11px');
    uploadBtn.className = 'btn-cta'; uploadBtn.textContent = '+ Sélectionner un fichier (PDF, image)';
    uploadBtn.addEventListener('click', () => fileInput.click());
    uploadSection.appendChild(uploadBtn);

    const progWrap = makeEl('div', 'margin-top:8px;height:4px;background:#E5E7EB;border-radius:2px;overflow:hidden;display:none');
    const progFill = makeEl('div', 'height:100%;background:linear-gradient(90deg,#1A6B45,#4CAF82);border-radius:2px;width:0%;transition:width .2s');
    progWrap.appendChild(progFill);
    uploadSection.appendChild(progWrap);

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      uploadBtn.disabled = true;
      progWrap.style.display = 'block'; progFill.style.width = '40%';
      try {
        await uploadArtisanDoc(demandeId, file, selectedDocType);
        progFill.style.width = '100%';
        setTimeout(() => { progWrap.style.display = 'none'; progFill.style.width = '0%'; }, 400);
        toast('Document ajouté', 'success');
        renderDocuments();
      } catch (err) {
        toast(err.message || 'Erreur upload', 'error');
        progWrap.style.display = 'none'; progFill.style.width = '0%';
      } finally { uploadBtn.disabled = false; fileInput.value = ''; }
    });

    area.appendChild(uploadSection);
  } catch (err) {
    area.replaceChildren(makeEl('p', 'text-align:center;padding:24px;color:var(--sub)', err.message || 'Erreur'));
  }
}

// ── Init ──────────────────────────────────────────────
// Les droits AVANT le premier rendu : le déroulement se dessine différemment
// selon le rôle, et le dessiner deux fois ferait clignoter des boutons.
// Un échec ne bloque pas l'écran — DROITS_SOLO (artisan seul = patron) est
// déjà le repli de mesDroits(), et la base refusera ce qu'elle doit refuser.
// Les deux en parallèle : ni l'un ni l'autre ne dépend de l'autre, et les
// enchaîner retarderait le premier rendu pour rien.
const [rDroits, rMembres] = await Promise.allSettled([mesDroits(), listMembres()]);
if (rDroits.status === 'fulfilled') droits = rDroits.value;
else console.warn('[chantier] droits indisponibles', rDroits.reason);
// Échec = on ne sait pas. `equipeVide` reste null et l'affichage ne change pas.
if (rMembres.status === 'fulfilled') equipeVide = (rMembres.value || []).length === 0;
else console.warn('[chantier] équipe indisponible', rMembres.reason);

// La suppression du chantier est réservée au patron et au chef par la policy
// `chantiers_delete_encadrement`. On retire le bouton plutôt que de laisser un
// compagnon découvrir le refus après le message de confirmation.
if (!peutGererEtapes()) {
  const btnSuppr = document.getElementById('delete-chantier-btn');
  if (btnSuppr) btnSuppr.remove();
}

// ⚠️ CE `await` ÉTAIT NU, ET IL TUAIT TOUT L'ÉCRAN (corrigé le 05/09/2026).
//
// `loadChantier()` jette sur erreur réseau. Au premier niveau d'un module, un
// rejet non attrapé interrompt l'évaluation : TOUT ce qui suit — activerOnglet
// juste en dessous, la recherche de la demande liée, le canal realtime, les
// gestionnaires posés plus bas — n'était JAMAIS exécuté. Hors ligne, l'artisan
// avait un écran mort figé sur « Avancement… », sans un seul onglet rendu et
// sans un mot d'explication. C'est l'écran qu'il ouvre le plus souvent.
//
// Le chantier n'a pas de copie locale (aucune lecture n'est mise en cache dans
// cette application, voir hors-ligne-investigation.md §5) : sans réseau il n'y
// a rien à afficher à sa place. Ce qu'on peut faire — et qu'on fait ici — c'est
// le DIRE, et laisser le reste de l'écran vivre.
try {
  await loadChantier();
} catch (e) {
  console.warn('[chantier] chantier non chargé', e);
  bandeauChargementImpossible(e);
}

// Rendre l'onglet ouvert au chargement. Sans ça, l'onglet par défaut reste
// VIDE jusqu'au premier clic ailleurs puis retour : son rendu n'était déclenché
// que par le gestionnaire de clic. La source de vérité reste le HTML : on lit
// quel onglet y porte `mq-on`.
// Ancre d'arrivée : chantier.html?id=…#messages ouvre directement le fil (action rapide « Messages » de la liste).
const ALIAS_ONGLET = { docs: 'documents', dossier: 'documents', doc: 'documents', etapes: 'deroulement' };
const ongletBrut = (location.hash || '').replace('#', '').toLowerCase();
const ongletDemande = ALIAS_ONGLET[ongletBrut] || ongletBrut;
const ongletValide = ['deroulement', 'photos', 'documents', 'messages', 'infos'].includes(ongletDemande) ? ongletDemande : null;
activerOnglet(ongletValide || (document.querySelector('.mq-tab.mq-on') || document.querySelector('.mq-tab'))?.dataset.tab);

// Trouver la demande liée à ce chantier (pour le coffre fort docs)
try {
  const { data: dem } = await supabase
    .from('demandes_devis')
    .select('id')
    .eq('chantier_id', chantierId)
    .eq('pro_id', session.user.id)
    .maybeSingle();
  demandeId = dem?.id || null;
} catch (_) {}

// ── Realtime messages ─────────────────────────────────
supabase
  .channel(`messages:${chantierId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `chantier_id=eq.${chantierId}`,
  }, () => {
    // Re-render seulement si l'onglet messages est actif
    const msgTab = document.querySelector('[data-tab="messages"]');
    if (msgTab && msgTab.classList.contains('mq-on')) renderMessages();
  })
  .subscribe();

// Rafraichit la fiche au retour sur l'ecran : c'est ici que Moctar a vu une
// adresse pourtant enregistree ne pas apparaitre.
if (window.bsRafraichirAuRetour) window.bsRafraichirAuRetour(loadChantier);


// ── Étape ajoutée sur un chantier dont le devis est signé → devis TS ? ──
//
// LA MÉCANIQUE (Moctar, 07/09 — elle avait été écrite de travers le 05/09) :
// des travaux supplémentaires font l'objet d'un DEVIS EN PLUS, à part, avec
// son propre numéro. Ce n'est PAS une nouvelle version du devis signé : le
// marché signé reste tel quel, le client l'a accepté à ce prix-là, et il
// signe à côté un second devis qui ne contient que le travail en plus.
// Reprendre les 8 900 € du devis d'origine dans une V2 pour y glisser une
// ligne à 400 € fait re-signer tout le marché pour un supplément — c'est ce
// que faisait la version précédente.
//
// Le fond juridique va dans le même sens : sur un marché à forfait, l'article
// 1793 du Code civil ne laisse réclamer un supplément que si le client l'a
// autorisé PAR ÉCRIT et que le prix a été convenu avec lui. Un devis
// complémentaire signé avant les travaux, c'est exactement cet écrit-là.
//
// Et ça reste une PROPOSITION (Moctar, 07/09 : « s'il ne veut pas faire de
// TS c'est son choix ») : un « Non » la fait disparaître, rien ne se crée
// tout seul, et l'étape ajoutée reste dans le chantier dans tous les cas.
async function proposerDevisTravauxSupp(titreEtape) {
  try {
    const devis = await listDevis(chantierId);
    const signe = (devis || []).find((d) => d.status === 'accepte' || d.status === 'signe');
    if (!signe) return;
    const liste = document.getElementById('deroulement-liste');
    if (!liste) return;
    document.getElementById('bs-devis-ts-propose')?.remove();
    const carte = document.createElement('div');
    carte.id = 'bs-devis-ts-propose';
    carte.className = 'mq-box';
    carte.style.cssText = 'display:flex;flex-direction:column;gap:8px;font-size:12.5px;font-weight:600;color:#3D5A4E;border-color:#E9C989;background:#FBF1E6;';
    const txt = document.createElement('div');
    txt.textContent = `Le devis ${signe.numero || ''} est signé. « ${titreEtape} » est un travail en plus ?`
      + ' Faites-en un devis séparé, à faire signer avant de le commencer :'
      + ` le devis ${signe.numero || 'signé'} ne bouge pas.`;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'mq-btn mq-primary';
    btn.textContent = 'Préparer le devis de travaux supplémentaires';
    btn.addEventListener('click', () => {
      carte.remove();
      const client = chantier?.client_name || '';
      if (typeof window.bsAssistantEnvoyerQuestion === 'function') {
        window.bsAssistantEnvoyerQuestion(
          `Prépare un devis de travaux supplémentaires pour ${client}`
          + `${chantier?.adresse ? `, ${chantier.adresse}` : ''} : « ${titreEtape} ».`
          + ` C'est un devis À PART, en plus du devis ${signe.numero || ''} déjà signé, qui ne doit pas changer.`
          + ' Demande-moi la quantité et mon prix si tu ne les as pas.');
      }
    });
    const non = document.createElement('button');
    non.type = 'button'; non.className = 'mq-btn mq-ghost';
    non.textContent = 'Non, c\'est compris dans le devis';
    non.addEventListener('click', () => carte.remove());
    carte.append(txt, btn, non);
    liste.insertAdjacentElement('afterbegin', carte);
  } catch (e) { /* jamais bloquant */ }
}

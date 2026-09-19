// Suivi de conversion — les quatre moments qui comptent (14/09/2026).
//
// POURQUOI CE FICHIER
// GA4 est chargé sur 2 084 pages et mesure des visites. Or une visite ne dit
// rien : on ne sait pas quel contenu produit une inscription. Sans ça, le jour
// où on lancera de la publicité, Google optimisera vers des clics au lieu
// d'inscriptions, et on paiera pour du trafic qui ne s'inscrit jamais. C'est la
// première dépense inutile de tous ceux qui démarrent.
//
// LES QUATRE MOMENTS, et pas un de plus
//   inscription_terminee  — le compte existe
//   premier_devis         — l'artisan a produit quelque chose (le vrai signal
//                           d'activation : un compte sans devis ne vaut rien)
//   devis_envoye_client   — il s'en sert avec son client
//   abonnement_clic       — il regarde le paiement
// Multiplier les événements dilue le signal : GA4 et Ads apprennent mieux sur
// peu d'événements fréquents que sur beaucoup de rares.
//
// CE QU'ON N'ENVOIE JAMAIS
// Aucune donnée personnelle — ni e-mail, ni nom de client, ni montant de devis,
// ni adresse de chantier. GA4 l'interdit et ce serait un manquement au RGPD.
// Seuls des compteurs et des étiquettes de métier passent.

const ID_MESURE = 'G-5Z1GK4VJ4E';

/** GA4 peut ne pas être chargé (mode hors ligne, bloqueur, WebView Capacitor).
 *  Le suivi ne doit JAMAIS casser une action de l'artisan : tout est avalé. */
function envoyer(nom, parametres = {}) {
  try {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    window.gtag('event', nom, { send_to: ID_MESURE, ...parametres });
  } catch (_) { /* le suivi n'est jamais une raison d'échouer */ }
}

/** Mémoire locale : « premier devis » ne doit se déclencher qu'une fois par
 *  compte, sinon le taux d'activation est faux. localStorage peut jeter
 *  (navigation privée, stockage bloqué) — dans ce cas on n'envoie rien plutôt
 *  que d'envoyer en double. */
function dejaVu(cle) {
  try {
    if (localStorage.getItem(cle)) return true;
    localStorage.setItem(cle, '1');
    return false;
  } catch (_) {
    return true;
  }
}

export function inscriptionTerminee(source) {
  envoyer('inscription_terminee', {
    event_category: 'conversion',
    // D'où vient l'artisan : utile pour savoir quel article a converti.
    event_label: source || 'direct',
  });
}

/** Appelé à chaque devis créé, mais ne remonte QUE le premier. C'est le signal
 *  d'activation : un compte qui n'a jamais produit de devis n'a rien prouvé. */
export function devisCree(metier) {
  if (dejaVu('bs_conv_premier_devis')) {
    envoyer('devis_cree', { event_category: 'usage', event_label: metier || 'inconnu' });
    return;
  }
  envoyer('premier_devis', { event_category: 'conversion', event_label: metier || 'inconnu' });
}

export function devisEnvoyeClient(canal) {
  envoyer('devis_envoye_client', {
    event_category: 'conversion',
    // e-mail, lien partagé, signature sur écran — pas l'identité du client.
    event_label: canal || 'email',
  });
}

export function abonnementClic(palier) {
  envoyer('abonnement_clic', { event_category: 'conversion', event_label: palier || 'inconnu' });
}

/** La source d'acquisition, lue une seule fois et conservée : au moment de
 *  l'inscription, le référent d'origine a disparu depuis longtemps. On garde
 *  donc la première trace vue, pas la dernière. */
export function memoriserSource() {
  try {
    if (localStorage.getItem('bs_source')) return;
    const p = new URLSearchParams(location.search);
    const source = p.get('utm_source') || p.get('ref')
      || (document.referrer && !document.referrer.includes('batispot.pro')
          ? new URL(document.referrer).hostname : '')
      || 'direct';
    localStorage.setItem('bs_source', source);
    // La page d'entrée dit quel article a amené l'artisan — c'est ce qui
    // manquait pour relier le contenu à l'inscription.
    localStorage.setItem('bs_page_entree', location.pathname.slice(0, 120));
  } catch (_) { /* stockage indisponible : on perd l'attribution, pas l'inscription */ }
}

export function sourceMemorisee() {
  try {
    return localStorage.getItem('bs_source') || 'direct';
  } catch (_) {
    return 'direct';
  }
}

export function pageEntree() {
  try {
    return localStorage.getItem('bs_page_entree') || '';
  } catch (_) {
    return '';
  }
}

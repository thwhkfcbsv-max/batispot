// BatiSpot — Numéros de téléphone appelables.
//
// POURQUOI CE FICHIER EXISTE (01/09/2026)
//
// `tel:0148572240` ne fonctionne qu'à l'intérieur de la France : le 0 initial
// est un préfixe national, pas une partie du numéro. Depuis l'étranger, le
// bouton « Appeler » ouvre le clavier avec un numéro qui n'aboutit pas.
//
// Trois écrans construisaient ce lien chacun de leur côté, avec trois
// nettoyages différents et le même défaut :
//   • suivi.html      — le client appelle son artisan
//   • client.html     — le client appelle son artisan (espace connecté)
//   • dashboard.html  — l'artisan appelle son client
// Une seule définition, testée, plutôt que trois approximations.
//
// RÈGLE DE PRUDENCE : on ne convertit QUE ce qu'on reconnaît avec certitude.
// Tout le reste est laissé tel quel plutôt que réécrit au hasard — un numéro
// mal transformé fait appeler quelqu'un d'autre, ce qui est pire que pas de
// bouton du tout.

/**
 * Normalise un numéro saisi librement en une forme composable partout (E.164).
 * Renvoie `null` s'il n'y a rien d'appelable : l'appelant doit alors NE PAS
 * afficher de bouton, plutôt qu'en afficher un qui ne fait rien.
 */
export function telAppelable(brut) {
  const s = String(brut ?? '').trim();
  if (!s) return null;
  const plus = s.startsWith('+');
  const chiffres = s.replace(/\D/g, '');
  if (!chiffres) return null;

  if (plus) return '+' + chiffres;                                  // déjà international
  if (chiffres.startsWith('00')) return '+' + chiffres.slice(2);    // 00 = + à l'oral
  if (chiffres.startsWith('33') && chiffres.length === 11) return '+' + chiffres;

  // Numéro français à 10 chiffres : 01…09 → +33 sans le 0 initial.
  // Le second chiffre ne peut pas être 0, ce qui évite de confondre avec un
  // numéro étranger noté sans indicatif.
  if (chiffres.length === 10 && chiffres[0] === '0' && chiffres[1] !== '0') {
    return '+33' + chiffres.slice(1);
  }

  // Format inconnu (numéro court, standard interne, saisie partielle) :
  // on le laisse composable tel quel sans lui inventer un indicatif.
  return chiffres;
}

/** `href` prêt à poser, ou `null` s'il n'y a rien à appeler. */
export function hrefTel(brut) {
  const n = telAppelable(brut);
  return n ? `tel:${n}` : null;
}

// ── Itinéraire vers une adresse ─────────────────────────────────────────
//
// POURQUOI ICI (07/09/2026)
//
// Moctar, 05/09 : « l'adresse doit ouvrir Maps ou Waze ». La fonction vivait
// dans `chantier.js`, donc la fiche chantier savait ouvrir la carte pendant
// que la pastille « Itinéraire » du tableau de bord, elle, renvoyait vers
// `planning.html` — un bouton qui ne fait pas ce qu'il dit. Une seule
// définition, dans le même module que `tel:` : ce sont les mêmes liens
// système, avec les mêmes pièges de plateforme.
//
// Android : `geo:` ouvre le sélecteur du téléphone (Google Maps ET Waze), on
// garde donc le choix de l'artisan. iOS : Plans avec `daddr`, qui trace
// directement le trajet ; Google Maps et Waze s'y proposent au partage.
export function hrefItineraire(adresse) {
  const a = String(adresse ?? '').trim();
  if (!a) return null;                      // pas d'adresse = pas de bouton
  const q = encodeURIComponent(a);
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios ? `https://maps.apple.com/?daddr=${q}` : `geo:0,0?q=${q}`;
}

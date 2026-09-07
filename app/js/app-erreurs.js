// BatiSpot — Remontee des erreurs JavaScript des telephones (05/09/2026)
//
// POURQUOI. `SENTRY_DSN` est vide dans `app/js/config.js` : `js/sentry-init.js`
// ne charge jamais rien, et RIEN ne capte les erreurs du navigateur. Une panne
// peut donc durer des jours sans que personne le sache — c'est deja arrive (le
// scan de tickets repondait 401 a TOUS les artisans, decouvert par hasard en
// cherchant pourquoi la table `depenses` etait vide).
//
// Pas de Sentry ni d'autre prestataire : la page de confidentialite nomme nos
// sous-traitants et `scripts/security_audit.py` verifie la concordance dans les
// deux sens. Une solution maison ne touche pas a cette page et ne fait sortir
// aucune donnee de navigation vers un tiers.
//
// CE QUI PART, ET RIEN D'AUTRE :
//   message (500 max) · fichier · ligne · colonne · pile (2 000 max)
//   page = CHEMIN SEUL — `suivi.html?t=<jeton>` devient `/app/suivi.html`,
//          sinon on enverrait des jetons d'acces client en clair
//   version (VERSION du service worker, sinon `app.css?v=`) · navigateur
//   artisan = true/false (y a-t-il une session ?), JAMAIS l'identifiant.
// Aucun contenu de champ, aucune adresse e-mail, aucun jeton.
//
// FAIL-SILENT. Tout est enveloppe : cette remontee ne doit JAMAIS casser une
// page. Un artisan qui rencontre deja un bug ne doit pas en recevoir un second.
//
// COMPLEMENTARITE avec `app-alerte.js` : celui-la surveille les pannes VIVANTES
// (fil principal gele, ecran reste vide, appel serveur en echec) et envoie un
// e-mail immediat. Celui-ci journalise les erreurs JavaScript en base, ou elles
// sont dedoublonnees par signature et par jour ; l'e-mail ne part qu'a la
// premiere occurrence. Les deux ecouteurs `error`/`unhandledrejection` de
// `app-alerte.js` ont ete retires le 05/09/2026 pour ne pas envoyer deux fois.

const POINT = '/functions/v1/journal-erreurs';
// 5 envois par CHARGEMENT de page : un ecran qui boucle sur une erreur en
// produit des centaines par minute. Le 6e est ignore — la panne est deja connue.
const MAX_PAR_PAGE = 5;
const MAX_STACK = 2000;
const MAX_MESSAGE = 500;

let envoyes = 0;
const dejaVues = new Set();
let versionConnue = null;

/** Bruit a exclure — repris de `app-alerte.js`, ou il a ete calibre le
 *  31/08/2026 apres des alertes recues alors que personne n'etait connecte :
 *  les scripts tiers (analytics, Clarity) et les extensions de navigateur
 *  levent des erreurs en permanence, et elles ne viennent pas de notre code. */
const TIERS = /gtag|googletagmanager|google-analytics|clarity|sentry|browser-sentry|chrome-extension|moz-extension|safari-extension|hotjar|facebook|doubleclick/i;
/** Erreurs qui ne sont pas des pannes : `Script error.` est ce que le navigateur
 *  renvoie pour un script cross-origin (aucune information exploitable), et
 *  `Load failed` / `NetworkError` sont le reseau de chantier, pas un bug. */
const BRUIT = /ResizeObserver loop|^Script error\.?$|Non-Error promise rejection|Load failed|NetworkError when attempting/i;

function bruitConnu(message, fichier) {
  const m = String(message || '');
  const f = String(fichier || '');
  return TIERS.test(f) || TIERS.test(m) || BRUIT.test(m);
}

function base() {
  try {
    const c = window.__BATISPOT_CONFIG__ || {};
    // Repli en dur : 404.html, offline.html et clear-cache.html ne chargent pas
    // config.js. L'URL du projet est publique (elle est dans chaque page).
    return c.SUPABASE_URL || 'https://cisniwhaiydazdpzvino.supabase.co';
  } catch (_) {
    return 'https://cisniwhaiydazdpzvino.supabase.co';
  }
}

/** Y a-t-il une session Supabase ? On ne lit RIEN de son contenu : savoir que
 *  l'erreur touche un artisan connecte (et pas un robot de passage sur une page
 *  publique) change la priorite ; savoir QUI n'ajoute rien et serait une donnee
 *  personnelle de plus dans une table de logs. */
function sessionPresente() {
  try {
    const url = base();
    const ref = url.match(/https:\/\/([^.]+)\./);
    if (!ref) return false;
    return !!localStorage.getItem('sb-' + ref[1] + '-auth-token');
  } catch (_) {
    return false;
  }
}

/** La VERSION du service worker si elle est lisible — c'est elle qui dit quelle
 *  version du code tourne VRAIMENT sur le telephone (un artisan peut garder une
 *  version en cache plusieurs jours). Le nom du cache est `batispot-app-<VERSION>`.
 *  A defaut, `app.css?v=` : approximatif mais toujours present. */
function versionCss() {
  try {
    const l = document.querySelector('link[rel="stylesheet"][href*="app.css"]');
    const m = l && l.getAttribute('href').match(/[?&]v=([^&"']+)/);
    return m ? m[1] : '';
  } catch (_) {
    return '';
  }
}

function preparerVersion() {
  versionConnue = versionCss();
  try {
    if (!window.caches || !caches.keys) return;
    caches.keys().then((noms) => {
      const n = noms.find((x) => x.indexOf('batispot-app-') === 0);
      if (n) versionConnue = n.slice('batispot-app-'.length);
    }).catch(() => {});
  } catch (_) { /* fail-silent */ }
}

/** Chemin seul : ni query string, ni fragment. `suivi.html?t=<jeton>` est la
 *  raison d'etre de cette fonction — ce jeton donne acces au dossier d'un
 *  client, il n'a rien a faire dans un journal d'erreurs. */
function cheminSeul(u) {
  try {
    return new URL(String(u || ''), location.href).pathname;
  } catch (_) {
    return String(u || '').split('?')[0].split('#')[0];
  }
}

function envoyer(donnees) {
  try {
    const url = base() + POINT;
    const corps = JSON.stringify(donnees);
    // ⚠️ `text/plain` ET PAS `application/json` : `sendBeacon` ne peut pas
    // declencher de pre-vol CORS, et `application/json` en exige un. Avec
    // `text/plain` la requete est « simple » et part vraiment. La fonction lit
    // du texte et fait le JSON.parse elle-meme.
    const blob = new Blob([corps], { type: 'text/plain;charset=UTF-8' });
    if (navigator.sendBeacon && navigator.sendBeacon(url, blob)) return;
    // Repli : `keepalive` pour que la requete survive a la fermeture de l'onglet.
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: corps,
      keepalive: true,
      mode: 'cors',
    }).catch(() => {});
  } catch (_) { /* fail-silent : une remontee ratee ne casse pas la page */ }
}

function signaler(info) {
  try {
    if (envoyes >= MAX_PAR_PAGE) return;
    const message = String(info.message || '').slice(0, MAX_MESSAGE);
    if (!message) return;
    const source = cheminSeul(info.source);
    if (bruitConnu(message, info.source)) return;

    // Dedoublonnage LOCAL, en plus de celui de la base : une meme erreur qui se
    // repete dans la page ne consomme pas les 5 envois.
    const empreinte = message.slice(0, 160) + '|' + source + '|' + (info.ligne || 0);
    if (dejaVues.has(empreinte)) return;
    dejaVues.add(empreinte);
    envoyes++;

    envoyer({
      message,
      source,
      ligne: info.ligne || 0,
      colonne: info.colonne || 0,
      stack: String(info.stack || '').slice(0, MAX_STACK),
      page: cheminSeul(location.href),
      version: versionConnue || versionCss(),
      ua: String(navigator.userAgent || '').slice(0, 300),
      artisan: sessionPresente(),
    });
  } catch (_) { /* fail-silent */ }
}

try {
  preparerVersion();

  window.addEventListener('error', (e) => {
    // Une erreur de chargement de ressource (<img>, <script>) n'a pas de
    // `message` : `e.target` porte l'information. On ne la remonte pas ici,
    // elle n'est pas une erreur de code.
    if (!e || !e.message) return;
    signaler({
      message: e.message,
      source: e.filename,
      ligne: e.lineno,
      colonne: e.colno,
      stack: (e.error && e.error.stack) || '',
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    const r = e && e.reason;
    const message = String((r && (r.message || r)) || 'promesse rejetee sans motif');
    signaler({
      message,
      source: (r && r.fileName) || '',
      ligne: (r && r.lineNumber) || 0,
      colonne: (r && r.columnNumber) || 0,
      stack: (r && r.stack) || '',
    });
  });
} catch (_) { /* fail-silent */ }

// Exporte pour les tests et pour un appel manuel depuis la console.
export { signaler };

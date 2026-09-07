// BatiSpot App — config Supabase
// Remplir avec tes propres clés depuis le dashboard Supabase
// Project Settings → API → Project URL + anon public key
//
// IMPORTANT : la clé anon est PUBLIQUE (fait pour être côté client).
// Ce qui protège les données = les RLS policies dans supabase-schema.sql.

window.__BATISPOT_CONFIG__ = {
  SUPABASE_URL: 'https://cisniwhaiydazdpzvino.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_LUXdyprriDy-_wcr7-r8Yw_3N8AP_s1', // gitleaks:allow

  // URL publique du site (utilisée dans les emails de devis)
  APP_URL: 'https://batispot.pro/app',
  SUIVI_URL: 'https://batispot.pro/app/suivi.html',

  // Nom de ton entreprise (apparaît dans devis PDF)
  PRO_DEFAULT_NAME: 'Votre entreprise',

  // Notifications email : routées via Edge Function `notify-admin`
  // (la clé Brevo n'est PLUS exposée côté client — vault dans Supabase secrets).

  // Cloudflare Turnstile site_key (anti-bot) — public, pas un secret.
  // Widget "Managed", clearance "Managed (medium)". Domaine : batispot.pro.
  // Posee le 23/08/2026. La cle secrete correspondante est dans les secrets
  // Supabase (TURNSTILE_SECRET_KEY), jamais dans ce fichier.
  TURNSTILE_SITE_KEY: '0x4AAAAAAEZMLp0fQ9DKKCZA',

  // Sentry DSN public — pour le monitoring d'erreurs front
  // Creer un projet "Browser JavaScript" sur https://sentry.io
  // Laisser vide pour desactiver Sentry.
  SENTRY_DSN: '',

  // Microsoft Clarity Project ID (heatmaps + session recordings, gratuit)
  // Active 28/04/2026 — projet "BatiSpot"
  // Dashboard : https://clarity.microsoft.com/projects/view/wipd1yjnju
  CLARITY_PROJECT_ID: 'wipd1yjnju',

  // VAPID public key (web push notifications) — generer avec :
  //   npx web-push generate-vapid-keys
  // La cle PRIVEE doit etre stockee dans les secrets Supabase, pas ici.
  VAPID_PUBLIC_KEY: 'BAJUwXwEr2z1AfZMhQSFFEma4J-vRP5v-VRgmMwnq4CIqLDHSRgMhwC2UB2VSyS0Q02MQSSvmhtOQhPstdxHPM4',
};

// ── Remontee des erreurs JavaScript (05/09/2026) ─────────────────────────────
// `app-erreurs.js` est charge D'ICI, et pas par un <script> dans chaque page :
// 35 pages HTML, aucune ne partage un module commun (app-nav.js n'est que sur
// 13, app-barre-assistant.js sur 12). config.js, lui, est charge par 28 d'entre
// elles — dont `suivi.html` et `index.html`. Les 7 qui ne le chargent pas ont
// un <script type="module"> direct : `test_erreurs_front.py` verifie qu'AUCUNE
// page de app/*.html n'y echappe.
//
// On injecte une balise <script type="module"> plutot que d'ecrire `import()`
// ici : `import()` est une CONSTRUCTION SYNTAXIQUE, donc un navigateur qui ne
// la connait pas rejette TOUT le fichier — et config.js est le fichier qui pose
// `__BATISPOT_CONFIG__`. Un `try/catch` ne rattrape pas une erreur d'analyse.
// Avec une balise, un navigateur sans modules ignore simplement l'element.
//
// L'URL est calculee depuis `document.currentScript.src` et non ecrite en
// relatif : les pages ne sont pas toutes a la meme profondeur (/app/404.html
// est servie pour n'importe quelle URL inconnue) et Capacitor sert les fichiers
// sous une autre origine.
//
// Fail-silent de bout en bout : si le module ne charge pas, la page fonctionne
// comme avant. Le pire cas est qu'on ne voie pas une erreur, pas qu'on en cree une.
(function () {
  try {
    var s = document.currentScript && document.currentScript.src;
    var url = s ? s.replace(/config\.js.*$/, 'app-erreurs.js?v=2026_09_05')
                : './js/app-erreurs.js?v=2026_09_05';
    var t = document.createElement('script');
    t.type = 'module';
    t.src = url;
    (document.head || document.documentElement).appendChild(t);
  } catch (_) { /* rien ne doit remonter d'ici */ }
})();

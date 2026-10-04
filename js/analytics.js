// BatiSpot — Analytics loader officiel GA4
(function () {
  'use strict';
  var GA_ID = 'G-5Z1GK4VJ4E';

  // ── Exclusion trafic interne (nous) ──────────────────────────────
  // Visiter n'importe quelle page avec ?internal=1 marque l'appareil ;
  // ?internal=0 le démarque. Un appareil marqué ne compte JAMAIS dans GA
  // (ni pageviews ni events), quel que soit l'IP/le pays. Robuste au voyage.
  var INTERNAL = false;
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('internal') === '1') localStorage.setItem('bs-internal', '1');
    else if (q.get('internal') === '0') localStorage.removeItem('bs-internal');
    INTERNAL = localStorage.getItem('bs-internal') === '1';
  } catch (e) {}
  // (30/09/2026) NOS TESTS NE SONT PAS DES VISITEURS. GA montrait des sessions
  // « localhost » et un référent « localhost:8848 » : les audits Playwright de
  // la publication, les diagnostics, les serveurs locaux — tous chargeaient
  // gtag et comptaient comme du trafic. Trois signaux, chacun suffisant :
  //   - la page est servie en local (localhost, 127.0.0.1, ::1) ;
  //   - navigator.webdriver : navigateur piloté (Playwright, Selenium) ;
  //   - on arrive DEPUIS une page locale (référent localhost) — c'est le cas
  //     du test de fumée qui ouvre le site en ligne depuis un serveur local.
  try {
    var h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '') INTERNAL = true;
    if (navigator.webdriver === true) INTERNAL = true;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(document.referrer || '')) INTERNAL = true;
  } catch (e) {}
  if (INTERNAL) { window['ga-disable-' + GA_ID] = true; }

  // (30/09/2026, décision confiée par Moctar) GA NE SE CHARGE QU'APRÈS ACCEPTATION.
  // Pratique CNIL : GA4 n'est pas sur la liste des mesures exemptées, donc rien
  // avant le clic « Accepter » du bandeau (js/consent.js, chargé avant sur les
  // 195 pages). Conséquence assumée : moins de sessions mesurées — la référence
  // de trafic reste la Search Console, GA sert aux conversions des artisans qui
  // ont accepté. Un refus, ou une absence de choix, ne mesure rien.
  var CHARGE = false;
  function chargerGA() {
    if (CHARGE || INTERNAL) return;
    CHARGE = true;
    window['ga-disable-' + GA_ID] = false;
    if (!window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', GA_ID, { send_page_view: true });
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
      document.head.appendChild(s);
    }
  }
  try {
    var consentement = window.bsConsent;
    if (consentement && consentement.canTrack && consentement.canTrack()) chargerGA();
    if (consentement && consentement.onChange) {
      consentement.onChange(function (e) {
        if (e && e.analytics) chargerGA();
        else window['ga-disable-' + GA_ID] = true;
      });
    }
    // Pages SANS bandeau — l'appli, où on ne pose pas la question (elle l'est
    // à la connexion et sur le site, même origine, même localStorage) : on lit
    // le choix mémorisé directement. Clé et forme de js/consent.js, 13 mois.
    if (!consentement) {
      var brut = localStorage.getItem('bs-consent-v1');
      var choix = brut ? JSON.parse(brut) : null;
      var age = choix && choix.date ? (Date.now() - new Date(choix.date).getTime()) / 86400000 : 1e9;
      if (choix && choix.analytics === true && age <= 395) chargerGA();
    }
  } catch (e) {}

  // Helper public de tracking
  window.bsTrack = function (eventName, params) {
    if (!eventName) return;
    if (INTERNAL || !CHARGE) return; // interne, ou pas de consentement → aucun event
    try {
      if (window.gtag) {
        window.gtag('event', eventName, params || {});
      }
    } catch (_) {}
  };
})();


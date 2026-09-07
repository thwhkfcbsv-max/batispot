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
  if (INTERNAL) { window['ga-disable-' + GA_ID] = true; }

  // Chargement direct du SDK Google Tag Manager
  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, {
      send_page_view: true
    });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // Helper public de tracking
  window.bsTrack = function (eventName, params) {
    if (!eventName) return;
    if (INTERNAL) return; // appareil interne → aucun event
    try {
      if (window.gtag) {
        window.gtag('event', eventName, params || {});
      }
    } catch (_) {}
  };
})();


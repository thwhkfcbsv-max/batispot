// BatiSpot — Sentry init avec respect du consentement RGPD
// Charge Sentry browser SDK uniquement si :
//   1. SENTRY_DSN est configure dans __BATISPOT_CONFIG__
//   2. l'utilisateur a accepte les cookies analytics (RGPD)
//
// A inclure APRES /js/consent.js et APRES /app/js/config.js (pour avoir le DSN).
(function () {
  'use strict';
  function getDsn() {
    var c = window.__BATISPOT_CONFIG__ || {};
    return c.SENTRY_DSN || '';
  }

  function loadSentry() {
    if (window.Sentry || window.__SENTRY_LOADING__) return;
    var dsn = getDsn();
    if (!dsn) return;
    window.__SENTRY_LOADING__ = true;
    var s = document.createElement('script');
    s.src = 'https://browser.sentry-cdn.com/8.45.1/bundle.tracing.replay.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = function () {
      try {
        window.Sentry.init({
          dsn: dsn,
          environment: location.hostname.includes('batispot.pro') ? 'production' : 'staging',
          release: 'batispot-app@' + (document.querySelector('meta[name="version"]')?.content || 'live'),
          tracesSampleRate: 0.1,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 0.5,
          // Pas de PII personnel envoye
          sendDefaultPii: false,
          beforeSend: function (event) {
            // Drop si pas de consent
            if (!window.bsConsent || !window.bsConsent.canTrack || !window.bsConsent.canTrack()) return null;
            return event;
          },
        });
      } catch (e) { /* silencieux */ }
    };
    document.head.appendChild(s);
  }

  function init() {
    var c = window.bsConsent;
    if (c && c.canTrack && c.canTrack()) loadSentry();
    if (c && c.onChange) {
      c.onChange(function (state) { if (state.analytics) loadSentry(); });
    }
  }

  // Attendre que config.js soit charge
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

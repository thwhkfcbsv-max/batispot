// BatiSpot — Microsoft Clarity loader avec respect du consentement RGPD
// Charge Clarity (heatmaps + session recordings) UNIQUEMENT si :
//   1. CLARITY_PROJECT_ID est configure dans __BATISPOT_CONFIG__
//   2. l'utilisateur a accepte les cookies analytics (RGPD)
//
// A inclure APRES /js/consent.js et APRES /app/js/config.js (pour avoir l'ID).
//
// Pour activer :
// 1. Cree un compte sur https://clarity.microsoft.com (gratuit, illimite)
// 2. Cree un projet "BatiSpot" → tu obtiens un Project ID (10 chars)
// 3. Mets-le dans app/js/config.js : CLARITY_PROJECT_ID: 'xxxxxxxxxx'
// 4. Push → Cloudflare deploie → tracking actif sous 5 min.
(function () {
  'use strict';
  var loaded = false;

  // L'ID du projet Clarity n'est pas un secret : il voyage dans le HTML de
  // toute page tracee. Le garder ici en repli permet de tracer les pages du
  // site vitrine, qui ne chargent pas app/js/config.js.
  var PROJECT_ID_DEFAUT = 'wipd1yjnju';

  function getProjectId() {
    var c = window.__BATISPOT_CONFIG__ || {};
    return c.CLARITY_PROJECT_ID || PROJECT_ID_DEFAUT;
  }

  // Nos propres visites ne doivent pas polluer les enregistrements.
  // Cette logique vivait dans le snippet inline (retire le 22/08/2026 car
  // il chargeait Clarity avant tout consentement) : elle est portee ici.
  function estTraficInterne() {
    try {
      var q = new URLSearchParams(location.search);
      var v = q.get('internal');
      if (v === '1') localStorage.setItem('bs-internal', '1');
      else if (v === '0') localStorage.removeItem('bs-internal');
      return localStorage.getItem('bs-internal') === '1';
    } catch (e) {
      return false;
    }
  }

  function loadClarity() {
    if (loaded || window.clarity) return;
    if (estTraficInterne()) return;
    var projectId = getProjectId();
    if (!projectId) return;
    loaded = true;
    // Snippet officiel Microsoft Clarity (https://learn.microsoft.com/clarity/setup-and-installation)
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', projectId);
  }

  function init() {
    var c = window.bsConsent;
    if (c && c.canTrack && c.canTrack()) loadClarity();
    if (c && c.onChange) {
      c.onChange(function (state) { if (state.analytics) loadClarity(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// BatiSpot — A/B Testing infrastructure ultra-simple
// Assigne chaque visiteur a un variant (A ou B) de maniere stable (cookie 30j)
// + track les conversions via window.bsTrack.
//
// USAGE :
//   <h1 data-bs-test="hero_headline_v1" data-bs-variant="A">39€/mois fixe, 0% commission</h1>
//   <h1 data-bs-test="hero_headline_v1" data-bs-variant="B" hidden>Garde 100% de tes devis</h1>
//
// Le script affiche le variant assigne et masque les autres.
// A chaque conversion (signup, demande, etc.), on track avec :
//   bsTrack('conversion', { test: 'hero_headline_v1', variant: 'A' });
//
// ANALYSE : dans GA4 Explore → custom dimension `bs_variant`.
// Tu vois quelle variant convertit le mieux.
(function () {
  'use strict';
  var STORAGE_KEY = 'bs-ab-assignments';

  function loadAssignments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) { return {}; }
  }

  function saveAssignments(a) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(a)); } catch (_) {}
  }

  function pickVariant(testName) {
    // Hash deterministe du testName + un id user pseudo-stable
    // pour que le meme user voit le meme variant entre les pages
    var assignments = loadAssignments();
    if (assignments[testName]) return assignments[testName];

    // Generation pseudo-aleatoire stable basee sur un id session
    var sid = localStorage.getItem('bs-session-id');
    if (!sid) {
      sid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
      try { localStorage.setItem('bs-session-id', sid); } catch (_) {}
    }
    // Hash simple : somme codes ASCII modulo 2 → A/B 50/50
    var hash = 0;
    var combined = testName + sid;
    for (var i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash |= 0;
    }
    var variant = Math.abs(hash) % 2 === 0 ? 'A' : 'B';
    assignments[testName] = variant;
    saveAssignments(assignments);
    return variant;
  }

  // Applique l'assignment sur la page : montre le variant choisi, masque les autres
  function applyAssignments() {
    var elements = document.querySelectorAll('[data-bs-test]');
    var tests = {}; // groupBy test name
    elements.forEach(function (el) {
      var name = el.dataset.bsTest;
      if (!tests[name]) tests[name] = [];
      tests[name].push(el);
    });

    Object.keys(tests).forEach(function (name) {
      var assigned = pickVariant(name);
      var els = tests[name];
      els.forEach(function (el) {
        var v = el.dataset.bsVariant || 'A';
        if (v === assigned) {
          el.hidden = false;
          el.style.removeProperty('display');
        } else {
          el.hidden = true;
        }
      });

      // Track exposure une fois par test/variant
      if (window.bsTrack) {
        window.bsTrack('ab_test_exposure', { test: name, variant: assigned });
      }

      // Tag en GA4 user_properties pour cross-funnel
      if (window.gtag) {
        var prop = {};
        prop['bs_' + name.replace(/[^a-z0-9_]/gi, '_').toLowerCase()] = assigned;
        try { window.gtag('set', 'user_properties', prop); } catch (_) {}
      }
    });
  }

  // API publique
  window.bsAB = {
    getVariant: pickVariant,
    getAll: loadAssignments,
    // Force un variant (debug / preview admin)
    forceVariant: function (testName, variant) {
      var a = loadAssignments();
      a[testName] = variant;
      saveAssignments(a);
      applyAssignments();
    },
    // Reset (pour re-tester)
    reset: function () { try { localStorage.removeItem(STORAGE_KEY); } catch (_) {} },
    // Track une conversion liee a un test
    trackConversion: function (testName, conversionName) {
      var v = pickVariant(testName);
      if (window.bsTrack) {
        window.bsTrack('ab_test_conversion', {
          test: testName,
          variant: v,
          conversion: conversionName || 'default',
        });
      }
    },
  };

  // Auto-apply après DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAssignments);
  } else {
    applyAssignments();
  }

  // Hook : si l'utilisateur change de page (SPA-like) → re-apply
  // (pas indispensable pour BatiSpot multi-page mais safe)
  window.addEventListener('popstate', applyAssignments);

  // Hook : trigger conversion via clic sur element [data-bs-conversion]
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-bs-conversion]');
    if (!t) return;
    var test = t.dataset.bsTest || t.closest('[data-bs-test]')?.dataset.bsTest;
    if (!test) return;
    window.bsAB.trackConversion(test, t.dataset.bsConversion);
  });
})();

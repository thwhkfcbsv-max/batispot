// BatiSpot — Cloudflare Turnstile helper
// Ajoute le widget Turnstile sur les forms publics si TURNSTILE_SITE_KEY est
// configure dans config.js. Le token capture est verifie cote backend
// (Supabase Edge function ou serverless) — voir doc Cloudflare.
//
// Usage cote page (HTML) :
//   <div class="bs-turnstile" data-action="login"></div>
//   <button type="submit">Envoyer</button>
//
// Usage cote JS au submit :
//   const token = window.bsTurnstile.getToken(form);
//   if (!token) { toast('Validation antispam echouee'); return; }
//   // POST le token au backend pour verification
//
// Si TURNSTILE_SITE_KEY est vide → le widget ne s'affiche pas et getToken()
// retourne 'no-turnstile' (passthrough). Permet de developper sans cle.
(function () {
  'use strict';
  function getKey() {
    var c = window.__BATISPOT_CONFIG__ || {};
    return c.TURNSTILE_SITE_KEY || '';
  }

  var loaded = false;
  function loadScript() {
    if (loaded || document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
      loaded = true; return;
    }
    loaded = true;
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  function renderAll() {
    var key = getKey();
    if (!key) return; // dev mode : on saute
    if (!window.turnstile) {
      // Script pas encore charge : retry
      setTimeout(renderAll, 200);
      return;
    }
    document.querySelectorAll('.bs-turnstile').forEach(function (el) {
      if (el.dataset.rendered === '1') return;
      el.dataset.rendered = '1';
      window.turnstile.render(el, {
        sitekey: key,
        action: el.dataset.action || 'submit',
        theme: 'light',
        size: 'flexible',
        callback: function (token) { el.dataset.token = token; },
        // Un token Turnstile expire au bout de ~300 s. Avant, on se contentait
        // de le vider : l'utilisateur qui laissait le formulaire ouvert cinq
        // minutes se retrouvait avec un token vide, et Supabase Auth (captcha
        // active, provider turnstile) rejetait la connexion sans qu'il puisse
        // comprendre pourquoi. On redemande donc immediatement un token neuf.
        'expired-callback': function () {
          el.dataset.token = '';
          try { window.turnstile.reset(el); } catch (_) {}
        },
        'error-callback': function () {
          el.dataset.token = '';
          try { window.turnstile.reset(el); } catch (_) {}
        },
      });
    });
  }

  // API publique
  window.bsTurnstile = {
    getToken: function (form) {
      var key = getKey();
      if (!key) return 'no-turnstile-dev';
      var widget = (form || document).querySelector('.bs-turnstile');
      if (!widget) return 'no-turnstile-widget';
      return widget.dataset.token || '';
    },
    // Attend qu'un token soit disponible, jusqu'a timeoutMs. A utiliser au
    // submit : le widget peut n'avoir pas fini son challenge, ou venir
    // d'expirer et etre en train d'en refaire un. Envoyer un token vide a
    // Supabase, c'est un echec de connexion garanti et incomprehensible.
    waitForToken: function (form, timeoutMs) {
      var self = this;
      var limite = Date.now() + (timeoutMs || 8000);
      return new Promise(function (resolve) {
        (function reessayer() {
          var t = self.getToken(form);
          if (t) return resolve(t);
          if (Date.now() > limite) return resolve('');
          setTimeout(reessayer, 150);
        })();
      });
    },
    reset: function () {
      if (window.turnstile) {
        document.querySelectorAll('.bs-turnstile').forEach(function (el) {
          try { window.turnstile.reset(el); el.dataset.token = ''; } catch (_) {}
        });
      }
    },
  };

  function init() {
    var key = getKey();
    // Pas de cle configuree → on cache tout widget present pour eviter d'afficher un placeholder vide
    if (!key) {
      document.querySelectorAll('.bs-turnstile').forEach(function (el) { el.style.display = 'none'; });
      return;
    }
    if (!document.querySelector('.bs-turnstile')) return;
    loadScript();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

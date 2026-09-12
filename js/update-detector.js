// BatiSpot — détecteur de mise à jour PWA + service worker register
// À inclure sur toutes les pages (site public + PWA app).
// Affiche un banner discret quand une nouvelle version est dispo, sans uninstall.
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;

  var SW_PATH = location.pathname.startsWith('/app/') ? '/app/sw.js' : '/sw.js';
  var BANNER_ID = 'bs-update-banner';
  var DISMISSED_KEY = 'bs-update-dismissed-version';

  function injectStyles() {
    if (document.getElementById('bs-update-styles')) return;
    var s = document.createElement('style');
    s.id = 'bs-update-styles';
    // Bandeau BLANC (retour Moctar 06/09) : le vert fonce jurait avec la
    // barre de navigation blanche juste en dessous. Seul le bouton est vert.
    s.textContent = [
      '#' + BANNER_ID + '{position:fixed;left:50%;bottom:20px;transform:translateX(-50%) translateY(80px);',
      'background:#FFFFFF;color:#1C2B22;border:1.5px solid #DCE6E0;padding:14px 18px 14px 22px;border-radius:14px;',
      'box-shadow:0 12px 32px rgba(15,23,42,.18);z-index:99999;display:flex;align-items:center;gap:14px;',
      'font:600 14px/1.4 Inter,system-ui,-apple-system,sans-serif;max-width:92vw;opacity:0;',
      'transition:transform .3s ease,opacity .3s ease;pointer-events:none}',
      '#' + BANNER_ID + '.show{transform:translateX(-50%) translateY(0);opacity:1;pointer-events:auto}',
      '#' + BANNER_ID + ' button{background:#228B5B;color:#fff;border:none;padding:8px 16px;',
      'border-radius:9px;font:800 13px Inter,sans-serif;cursor:pointer;white-space:nowrap}',
      '#' + BANNER_ID + ' button:hover{background:#1B7049}',
      '#' + BANNER_ID + ' .close-x{background:transparent;color:#6B7F76;font-size:18px;padding:4px 8px;font-weight:400}',
      '#' + BANNER_ID + ' .close-x:hover{background:#F4F7F5}'
    ].join('');
    document.head.appendChild(s);
  }

  function showBanner(onReload) {
    if (document.getElementById(BANNER_ID)) return;
    injectStyles();
    var bar = document.createElement('div');
    bar.id = BANNER_ID;
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');

    var txt = document.createElement('span');
    txt.textContent = 'Nouvelle version disponible';
    bar.appendChild(txt);

    var reloadBtn = document.createElement('button');
    reloadBtn.type = 'button';
    reloadBtn.textContent = 'Recharger';
    reloadBtn.addEventListener('click', onReload);
    bar.appendChild(reloadBtn);

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'close-x';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function () {
      try { localStorage.setItem(DISMISSED_KEY, '1'); } catch (_) {}
      bar.classList.remove('show');
      setTimeout(function () { bar.remove(); }, 300);
    });
    bar.appendChild(closeBtn);

    document.body.appendChild(bar);
    requestAnimationFrame(function () { bar.classList.add('show'); });
  }

  function activateNewSW(reg) {
    if (!reg || !reg.waiting) { location.reload(); return; }
    // Demande au SW d'activer la nouvelle version, puis reload quand controller change
    var reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloaded) return;
      reloaded = true;
      location.reload();
    });
    reg.waiting.postMessage({ type: 'skip-waiting' });
  }

  navigator.serviceWorker.register(SW_PATH).then(function (reg) {
    // Cas 1 : nouveau SW détecté pendant cette session
    reg.addEventListener('updatefound', function () {
      var newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener('statechange', function () {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Une vieille version est encore active → propose recharger
          showBanner(function () { activateNewSW(reg); });
        }
      });
    });

    // Cas 2 : un SW est déjà en attente quand la page charge
    if (reg.waiting && navigator.serviceWorker.controller) {
      showBanner(function () { activateNewSW(reg); });
    }

    // Vérifier les updates régulièrement (toutes les 30 min)
    setInterval(function () { reg.update().catch(function () {}); }, 30 * 60 * 1000);

    // Vérifier au focus de la fenêtre (utile mode standalone PWA)
    window.addEventListener('focus', function () { reg.update().catch(function () {}); });
  }).catch(function () { /* silencieux */ });

  // Cas 3 : message broadcast du SW après activate
  navigator.serviceWorker.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'sw-updated') {
      // Le banner a déjà été montré au cas 1 ; rien à faire ici sauf si on veut
      // forcer un reload. Pour rester non-intrusif, on laisse l'utilisateur cliquer.
    }
  });
})();

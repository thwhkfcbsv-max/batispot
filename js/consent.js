// BatiSpot — Cookie consent banner (RGPD/CNIL)
// A inclure AVANT tout script de tracking (gtag, fbq, sentry, etc.).
// Stocke le choix utilisateur dans localStorage pendant 13 mois (recommandation CNIL).
//
// Standard CNIL : "Refuser" doit etre aussi accessible que "Accepter".
// Pas de pre-cocher de cases. Le tracking analytics ne s'active QU'APRES "Accepter".
//
// API publique : window.bsConsent
//   .get()      -> { analytics: bool, version: int, date: iso } | null
//   .accept()   -> tout accepter
//   .reject()   -> tout refuser (analytics off)
//   .open()     -> reouvrir le banner
//   .onChange(cb) -> callback {analytics:bool} a chaque changement
//   .canTrack() -> bool : est-ce qu'on a le droit d'envoyer du tracking ?
(function () {
  'use strict';
  var KEY = 'bs-consent-v1';
  var TTL_DAYS = 395; // 13 mois CNIL
  var listeners = [];

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.date) return null;
      // Expiration apres 13 mois → re-demander
      var ageDays = (Date.now() - new Date(parsed.date).getTime()) / 86400000;
      if (ageDays > TTL_DAYS) return null;
      return parsed;
    } catch (_) { return null; }
  }

  function save(state) {
    try {
      var entry = { analytics: !!state.analytics, version: 1, date: new Date().toISOString() };
      localStorage.setItem(KEY, JSON.stringify(entry));
      listeners.forEach(function (fn) { try { fn(entry); } catch (_) {} });
      return entry;
    } catch (_) { return null; }
  }

  function injectStyles() {
    if (document.getElementById('bs-consent-styles')) return;
    var s = document.createElement('style');
    s.id = 'bs-consent-styles';
    s.textContent = [
      // max-height : sur un ecran etroit le texte s'enroule et le bandeau
      // atteignait 720px dans une fenetre de 667 — il couvrait tout l'ecran
      // et aucune reserve ne pouvait liberer le bouton d'une modale.
      '#bs-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:99998;',
      'max-height:42vh;overflow-y:auto;overscroll-behavior:contain;',
      'background:#fff;border:1px solid rgba(34,139,91,.18);border-radius:14px;',
      'box-shadow:0 16px 40px rgba(13,51,32,.18);padding:16px 18px;',
      'font:500 13px/1.5 Inter,system-ui,-apple-system,sans-serif;color:#0d3320;',
      'transform:translateY(120%);transition:transform .3s ease;max-width:520px;margin:0 auto}',
      '#bs-consent.show{transform:translateY(0)}',
      '#bs-consent .bs-c-title{font-weight:900;font-size:14px;color:#1A6B45;margin-bottom:6px;letter-spacing:-.01em}',
      '#bs-consent p{margin:0 0 12px;color:#3D5A4E;font-size:12.5px;line-height:1.5}',
      '#bs-consent a{color:#1A6B45;text-decoration:underline;font-weight:700}',
      '#bs-consent .bs-c-row{display:flex;gap:8px;flex-wrap:wrap}',
      // Le bandeau est fixe en bas : sans cette reserve, il recouvre les
      // boutons d'action situes en bas de page et les rend incliquables.
      'body.bs-consent-open{padding-bottom:var(--bs-consent-h,180px)!important}',
      // Les modales sont en position:fixed : le padding du body ne les
      // deplace pas. Celles alignees en bas (feuilles glissantes) passaient
      // donc SOUS le bandeau, rendant leur bouton principal incliquable —
      // « Enregistrer le Devis » etait inatteignable a la premiere visite.
      'body.bs-consent-open .modal-overlay,'
        + 'body.bs-consent-open .modal-overlay.open,'
        + 'body.bs-consent-open .sheet-overlay,'
        // :not(#bs-consent) — le bandeau lui-meme porte role="dialog" : sans
        // cette exclusion, il recevait son propre padding, et chaque `resize`
        // (barre Safari iOS qui se replie) le remesurait avec ce padding →
        // carte blanche geante (vu au simulateur iPhone le 04/09/2026).
        + 'body.bs-consent-open [role="dialog"]:not(#bs-consent){padding-bottom:var(--bs-consent-h,180px)!important}',
      '#bs-consent button{flex:1;min-width:120px;padding:10px 14px;border-radius:9px;',
      'border:none;font:800 13px Inter,sans-serif;cursor:pointer;font-family:inherit;transition:background .15s,transform .12s}',
      '#bs-consent button.accept{background:#1A6B45;color:#fff}',
      '#bs-consent button.accept:hover{background:#228B5B;transform:translateY(-1px)}',
      '#bs-consent button.reject{background:#fff;color:#0d3320;border:1.5px solid #D1D5DB}',
      '#bs-consent button.reject:hover{background:#F3F4F6}'
    ].join('');
    document.head.appendChild(s);
  }

  function buildBanner() {
    var bar = document.createElement('div');
    bar.id = 'bs-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Préférences de cookies');

    var t = document.createElement('div');
    t.className = 'bs-c-title';
    t.textContent = 'On respecte votre vie privée';
    bar.appendChild(t);

    var p = document.createElement('p');
    p.appendChild(document.createTextNode("BatiSpot utilise des cookies de mesure d'audience pour comprendre l'usage du site. "));
    p.appendChild(document.createTextNode('Vous pouvez accepter, refuser, ou consulter notre '));
    var a = document.createElement('a');
    a.href = '/confidentialite';
    a.textContent = 'politique de confidentialité';
    p.appendChild(a);
    p.appendChild(document.createTextNode('.'));
    bar.appendChild(p);

    var row = document.createElement('div');
    row.className = 'bs-c-row';

    var rejectBtn = document.createElement('button');
    rejectBtn.type = 'button';
    rejectBtn.className = 'reject';
    rejectBtn.textContent = 'Refuser';
    rejectBtn.addEventListener('click', function () { reject(); hide(); });
    row.appendChild(rejectBtn);

    var acceptBtn = document.createElement('button');
    acceptBtn.type = 'button';
    acceptBtn.className = 'accept';
    acceptBtn.textContent = 'Accepter';
    acceptBtn.addEventListener('click', function () { accept(); hide(); });
    row.appendChild(acceptBtn);

    bar.appendChild(row);

    document.body.appendChild(bar);
    requestAnimationFrame(function () {
      bar.classList.add('show');
      reserverEspace(bar);
    });
    // La hauteur du bandeau depend de la largeur de l'ecran : sur mobile le
    // texte s'enroule et il peut doubler (168px -> 352px mesures). Une mesure
    // unique a l'affichage sous-estimait la reserve et le bandeau recouvrait
    // encore le bouton principal des modales. On suit donc sa hauteur reelle.
    if (typeof ResizeObserver === 'function') {
      new ResizeObserver(function () { reserverEspace(bar); }).observe(bar);
    } else {
      window.addEventListener('resize', function () { reserverEspace(bar); });
    }
    return bar;
  }

  // Reserve en bas de page la hauteur reelle du bandeau (+ marge), pour que
  // rien ne reste masque dessous.
  function reserverEspace(bar) {
    if (!bar || !document.body) return;
    var h = bar.getBoundingClientRect().height;
    if (!h) return;
    document.documentElement.style.setProperty('--bs-consent-h', Math.ceil(h + 32) + 'px');
    document.body.classList.add('bs-consent-open');
  }

  function libererEspace() {
    if (!document.body) return;
    document.body.classList.remove('bs-consent-open');
    document.documentElement.style.removeProperty('--bs-consent-h');
  }

  function show() {
    if (document.getElementById('bs-consent')) return;
    injectStyles();
    if (document.body) buildBanner();
    else document.addEventListener('DOMContentLoaded', buildBanner);
  }

  function hide() {
    var bar = document.getElementById('bs-consent');
    if (!bar) return;
    bar.classList.remove('show');
    libererEspace();
    setTimeout(function () { bar.remove(); }, 320);
  }

  function accept() { return save({ analytics: true }); }
  function reject() { return save({ analytics: false }); }

  function canTrack() {
    var c = load();
    return !!(c && c.analytics);
  }

  // Bloque gtag avant son chargement si refus stocke
  // (les pages doivent inclure ce script AVANT gtag/sentry/etc.)
  window.dataLayer = window.dataLayer || [];
  var origPush = window.dataLayer.push.bind(window.dataLayer);
  window.dataLayer.push = function () {
    if (!canTrack()) return; // drop tout si pas de consent
    return origPush.apply(null, arguments);
  };

  // Si pas de choix stocke → afficher le banner
  if (!load()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', show);
    } else {
      show();
    }
  }

  window.bsConsent = {
    get: load,
    accept: function () { accept(); hide(); },
    reject: function () { reject(); hide(); },
    open: show,
    onChange: function (cb) { listeners.push(cb); },
    canTrack: canTrack,
  };
})();

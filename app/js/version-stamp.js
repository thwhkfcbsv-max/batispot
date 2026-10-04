// Affiche la version de l'application RÉELLEMENT servie (celle du service
// worker qui contrôle la page), en bas de la connexion (#bsVersion) et du menu
// (injecté sous « Déconnexion »). Diagnostic : un téléphone qui garde une vieille
// version le montre ici. (29/09/2026)
(function () {
  function poser(txt) {
    var el = document.getElementById('bsVersion');
    if (!el) {
      var d = document.getElementById('mqDeconnexion');
      if (!d) return false;
      el = document.createElement('div');
      el.id = 'bsVersion';
      el.style.cssText = 'font-size:12px;color:#5A7268;padding:10px 16px 4px;font-family:inherit;';
      d.insertAdjacentElement('afterend', el);
    }
    el.textContent = txt;
    return true;
  }
  var version = null, essais = 0;
  function tenter() { if (version && !poser(version) && essais++ < 20) setTimeout(tenter, 500); }
  try {
    if (!('serviceWorker' in navigator)) { version = 'sans service worker'; tenter(); return; }
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'version') { version = 'BatiSpot Pro · ' + e.data.version; tenter(); }
    });
    var demander = function () { var c = navigator.serviceWorker.controller; if (c) c.postMessage({ type: 'version' }); };
    if (navigator.serviceWorker.controller) demander();
    else navigator.serviceWorker.addEventListener('controllerchange', demander);
    setTimeout(function () { if (!version) { version = 'BatiSpot Pro · page servie sans cache (première visite)'; tenter(); } }, 3000);
  } catch (_) {}
})();

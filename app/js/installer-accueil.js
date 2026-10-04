// Mettre BatiSpot Pro sur l'écran d'accueil. (29/09/2026)
// Moctar sur le A57 : « on devrait avoir un pop-up qui dit installer sur votre
// écran d'accueil », puis « ça install pas : mettre sur l'écran d'accueil ».
// On ne parle plus d'installation : on met l'appli sur l'écran d'accueil.
// Deux portes : une barre discrète après la connexion, et une entrée
// permanente dans le menu (« Mettre sur l'écran d'accueil ») — elle répond à
// « pourquoi je ne l'ai pas ? » quand la barre n'est pas là.
(function () {
  var CLE = 'bs_install_refuse_le';
  var evenement = null;
  function refuseRecemment() {
    try { var t = parseInt(localStorage.getItem(CLE) || '0', 10); return t && (Date.now() - t) < 14 * 86400000; } catch (_) { return false; }
  }
  function dejaInstallee() {
    try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (_) { return false; }
  }
  function navigateur() {
    var ua = navigator.userAgent || '';
    if (/SamsungBrowser/i.test(ua)) return 'samsung';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'autre';
  }
  // Le menu cache son entrée quand on est déjà sur l'écran d'accueil.
  try {
    var st = document.createElement('style');
    st.textContent = 'body.bs-standalone #mqEcranAccueil{display:none !important}';
    document.head.appendChild(st);
    if (dejaInstallee()) document.documentElement.classList.add('bs-standalone-doc');
    var poserClasse = function () { if (dejaInstallee() && document.body) document.body.classList.add('bs-standalone'); };
    if (document.body) poserClasse(); else document.addEventListener('DOMContentLoaded', poserClasse);
  } catch (_) {}

  // Quand Chrome ne nous donne pas la main (pas d'événement), on montre le
  // geste à faire dans le navigateur — le bon pour chaque navigateur.
  function expliquer() {
    var b = navigateur(), titre, etapes;
    if (dejaInstallee()) { titre = 'BatiSpot Pro est déjà sur votre écran d’accueil.'; etapes = []; }
    else if (b === 'samsung') {
      titre = 'Depuis Samsung Internet, ça ne marche pas — passez par Chrome.';
      etapes = ['Ouvrez <b>batispot.pro/app</b> dans <b>Chrome</b>.', 'Menu <b>⋮</b> en haut à droite → <b>Ajouter à l’écran d’accueil</b>.', 'Choisissez <b>Créer un raccourci</b>, puis <b>Ajouter</b>. L’icône BatiSpot Pro apparaît.'];
    } else if (b === 'ios') {
      titre = 'Sur iPhone, ça se fait depuis Safari.';
      etapes = ['Bouton <b>Partager</b> (le carré avec la flèche).', '<b>Sur l’écran d’accueil</b>.', '<b>Ajouter</b>.'];
    } else {
      titre = 'Dans Chrome, trois gestes.';
      etapes = ['Menu <b>⋮</b> en haut à droite de Chrome.', '<b>Ajouter à l’écran d’accueil</b>.', 'Choisissez <b>Créer un raccourci</b>, puis <b>Ajouter</b>. L’icône BatiSpot Pro apparaît tout de suite.', 'Si vous aviez choisi « Installer » et que ça tourne sans fin : c’est le Play Store qui attend un compte Google actif. Le raccourci, lui, ne dépend de rien.'];
    }
    var old = document.getElementById('bsAccueilAide'); if (old) old.remove();
    var v = document.createElement('div');
    v.id = 'bsAccueilAide'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true');
    v.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(15,40,30,.55);display:flex;align-items:flex-end;justify-content:center;padding:12px;font-family:Inter,system-ui,sans-serif;';
    var c = document.createElement('div');
    c.style.cssText = 'background:#FFF;color:#0F2A1E;border-radius:16px;padding:18px 16px;width:100%;max-width:440px;box-shadow:0 12px 32px rgba(0,0,0,.3);font-size:14.5px;line-height:1.45;';
    var h = '<b style="font-size:16px;display:block;margin-bottom:6px;">Mettre BatiSpot Pro sur l’écran d’accueil</b>'
          + '<div style="color:#3D5A4E;margin-bottom:10px;">' + titre + '</div>';
    if (etapes.length) { h += '<ol style="margin:0 0 12px 18px;padding:0;">'; etapes.forEach(function (e) { h += '<li style="margin:4px 0;">' + e + '</li>'; }); h += '</ol>'; }
    h += '<button type="button" id="bsAccueilAideOk" style="width:100%;background:#228B5B;color:#FFF;border:0;border-radius:10px;padding:12px;font-weight:800;font-size:15px;font-family:inherit;min-height:44px;">Compris</button>';
    c.innerHTML = h; v.appendChild(c); document.body.appendChild(v);
    var fermer = function () { v.remove(); };
    document.getElementById('bsAccueilAideOk').addEventListener('click', fermer);
    v.addEventListener('click', function (e) { if (e.target === v) fermer(); });
  }

  function proposer() {
    if (evenement) {
      var ev = evenement;
      ev.prompt();
      ev.userChoice.then(function (r) {
        // Un refus explicite se respecte 3 jours ; un échec du navigateur
        // n'est pas un refus, on ne verrouille rien.
        if (r && r.outcome === 'dismissed') { try { localStorage.setItem(CLE, String(Date.now() - 11 * 86400000)); } catch (_) {} }
        var b = document.getElementById('bsInstallBar'); if (b) b.remove();
        evenement = null;
      }).catch(function () { evenement = null; });
    } else {
      expliquer();
    }
  }
  window.bsMettreSurEcranAccueil = proposer;

  // (29/09, Moctar : « ça devrait me le proposer après le login, pas pendant »)
  // Jamais sur la connexion ; dans l'appli, après un délai, et jamais pendant
  // la visite guidée — on attend qu'elle finisse.
  function montrer() {
    if (/login\.html$/.test(location.pathname)) return;
    if (document.getElementById('bsInstallBar') || refuseRecemment() || dejaInstallee()) return;
    if (document.body.classList.contains('bs-demo-en-cours') || document.getElementById('bsTourOverlay')?.classList.contains('open')) { setTimeout(montrer, 2000); return; }
    var bar = document.createElement('div');
    bar.id = 'bsInstallBar';
    bar.setAttribute('role', 'dialog');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:9000;'
      + 'background:#0F5132;color:#FFF;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;'
      + 'box-shadow:0 8px 24px rgba(0,0,0,.25);font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.35;';
    var ico = document.createElement('div');
    ico.innerHTML = '<svg width="34" height="34" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="10" fill="#228B5B"/><path d="M24 12 L12 22 L12 36 L36 36 L36 22 Z" fill="none" stroke="#FFF" stroke-width="2.5" stroke-linejoin="round"/><rect x="20" y="27" width="8" height="9" rx="1.5" fill="#FFF" opacity=".92"/></svg>';
    var txt = document.createElement('div');
    txt.style.flex = '1';
    txt.innerHTML = '<b>Sur votre écran d’accueil</b><br><span style="opacity:.85;font-size:13px">BatiSpot Pro s’ouvre d’un geste, comme une appli.</span>';
    var ok = document.createElement('button');
    ok.type = 'button'; ok.textContent = 'Ajouter';
    ok.style.cssText = 'background:#FFF;color:#0F5132;border:0;border-radius:10px;padding:10px 14px;font-weight:800;font-size:14px;font-family:inherit;min-height:44px;';
    var non = document.createElement('button');
    non.type = 'button'; non.setAttribute('aria-label', 'Plus tard'); non.textContent = '×';
    non.style.cssText = 'background:transparent;color:#FFF;border:0;font-size:22px;line-height:1;padding:6px 4px;font-family:inherit;min-width:32px;min-height:44px;';
    ok.addEventListener('click', function () { proposer(); });
    non.addEventListener('click', function () { try { localStorage.setItem(CLE, String(Date.now())); } catch (_) {} bar.remove(); });
    bar.append(ico, txt, ok, non);
    document.body.appendChild(bar);
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();          // on garde la main : c'est NOTRE barre qui invite
    evenement = e;
    var lancer = function () { setTimeout(montrer, 2500); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lancer); else lancer();
  });
  window.addEventListener('appinstalled', function () { var b = document.getElementById('bsInstallBar'); if (b) b.remove(); evenement = null; });

  // L'entrée du menu (app-menu.js la dessine ; ici on lui donne son geste).
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('#mqEcranAccueil') : null;
    if (!a) return;
    e.preventDefault();
    try { document.getElementById('bsDrawerOverlay')?.classList.remove('open'); document.querySelector('.bs-drawer.open')?.classList.remove('open'); } catch (_) {}
    proposer();
  });
})();

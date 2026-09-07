
// ── Icônes SVG communes (aucun emoji dans l'interface — règle du 04/09) ──
(function () {
  var A = 'xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var P = {
    building: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><rect x="9" y="12" width="6" height="9"/><line x1="9" y1="8" x2="9.01" y2="8"/><line x1="15" y1="8" x2="15.01" y2="8"/>',
    chart: '<line x1="4" y1="20" x2="20" y2="20"/><rect x="6" y="11" width="3" height="7"/><rect x="11" y="6" width="3" height="12"/><rect x="16" y="9" width="3" height="9"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    euro: '<path d="M19 5.5A8 8 0 0 0 13 3a8 8 0 0 0 0 18 8 8 0 0 0 6-2.5"/><line x1="3" y1="10" x2="14" y2="10"/><line x1="3" y1="14" x2="14" y2="14"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    finances: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="10" y1="21" x2="10" y2="10"/><line x1="16" y1="21" x2="16" y2="16"/><polyline points="4 9 11 4 15 7 21 2"/><polyline points="16 2 21 2 21 7"/>',
    wall: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><line x1="3" y1="9.3" x2="21" y2="9.3"/><line x1="3" y1="14.7" x2="21" y2="14.7"/><line x1="9" y1="4" x2="9" y2="9.3"/><line x1="15" y1="4" x2="15" y2="9.3"/><line x1="12" y1="9.3" x2="12" y2="14.7"/><line x1="9" y1="14.7" x2="9" y2="20"/><line x1="15" y1="14.7" x2="15" y2="20"/>',
    hammer: '<path d="m15 12-8.4 8.4a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.9-1.9A2 2 0 0 1 19 8.2V7l-2.3-2.3a6 6 0 0 0-4.2-1.7L9 3l.9.8A6.2 6.2 0 0 1 12 8.4V10l2 2h1.2a2 2 0 0 1 1.4.6l1.9 1.9"/>',
    hardhat: '<path d="M2 17h20"/><path d="M4 17v-1a8 8 0 0 1 16 0v1"/><path d="M10 9.5V5.5a2 2 0 0 1 4 0v4"/><path d="M4 20h16"/>',
    lines: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
    spark: '<path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="8" width="10" height="8" rx="1"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>',
    receipt: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 1 .7V2l-3 2-3-2-3 2-3-2-3 2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    chevron: '<polyline points="9 18 15 12 9 6"/>',
    back: '<polyline points="15 18 9 12 15 6"/>',
    warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    // Déclencheur du sélecteur d'emoji (tâche 19, 04/09) : une icône, jamais
    // un emoji lui-même — la grille d'emoji EST le contenu qu'on choisit,
    // le bouton qui l'ouvre reste un pictogramme sans emoji décoratif.
    smiley: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'
  };
  window.bsIcon = function (name, size) {
    var body = P[name] || '';
    var a = size ? A.replace('width="20" height="20"', 'width="' + size + '" height="' + size + '"') : A;
    return '<svg ' + a + '>' + body + '</svg>';
  };
})();

// BatiSpot Pro — Barre de navigation unifiee (5 onglets)
//
// POURQUOI CE FICHIER EXISTE
// La barre du bas (classe .bn) etait codee en dur, a l'identique, dans 11
// pages : Devis / Planning / Photos / Finances / Equipe. Le fondateur a
// valide une nouvelle maquette — Devis / Chantiers / Finances / Equipe /
// Menu — et changer ca a la main dans 11 fichiers aurait garanti un oubli.
// Desormais une seule source de verite genere la barre partout, et Planning
// / Photos ne disparaissent pas : ils passent en sous-navigation (onglets
// "Chantiers / Planning / Photos / Metre") sous l'entete des ecrans concernes.
//
// Script classique (pas de module), sans dependance : nav-roles.js (qui
// masque Devis/Finances pour un compagnon en filtrant les <a class="bn-i">)
// doit s'executer APRES ce script pour trouver les onglets a filtrer — voir
// l'ordre des balises <script> dans chaque page.
(function () {
  'use strict';

  var ICON_DEVIS = '<svg class="bn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg>';
  var ICON_CHANTIERS = '<svg class="bn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="1.5"/><line x1="3" y1="9.3" x2="21" y2="9.3"/><line x1="3" y1="14.7" x2="21" y2="14.7"/><line x1="9" y1="4" x2="9" y2="9.3"/><line x1="15" y1="4" x2="15" y2="9.3"/><line x1="12" y1="9.3" x2="12" y2="14.7"/><line x1="9" y1="14.7" x2="9" y2="20"/><line x1="15" y1="14.7" x2="15" y2="20"/></svg>';
  // Finances = barres + flèche qui monte (Moctar, 05/09 : « plutôt qu'un
  // euro je vois un graphe avec une flèche vers le haut »).
  var ICON_FINANCES = '<svg class="bn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="10" y1="21" x2="10" y2="10"/><line x1="16" y1="21" x2="16" y2="16"/><polyline points="4 9 11 4 15 7 21 2"/><polyline points="16 2 21 2 21 7"/></svg>';
  var ICON_EQUIPE = '<svg class="bn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var ICON_MESSAGES = '<svg class="bn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var ICON_PLANNING = '<svg class="bn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var ICON_MENU = '<svg class="bn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>';

  // Ordre valide par le fondateur : Devis / Chantiers / Finances / Equipe / Menu.
  var TABS = [
    { key: 'devis', label: 'Devis', href: './devis.html', icon: ICON_DEVIS },
    { key: 'chantiers', label: 'Chantiers', href: './dashboard.html', icon: ICON_CHANTIERS },
    { key: 'planning', label: 'Planning', href: './planning.html', icon: ICON_PLANNING },
    { key: 'finances', label: 'Finances', href: './finances.html', icon: ICON_FINANCES },
    { key: 'messages', label: 'Messages', href: './messages.html', icon: ICON_MESSAGES }
  ];

  // Fichier de page (sans .html) -> onglet actif dans la barre du bas.
  var GROUPE_PAGE = {
    dashboard: 'chantiers', chantier: 'chantiers', planning: 'planning',
    photos: 'chantiers', 
    devis: 'devis',
    finances: 'finances', analyses: 'finances',
    messages: 'messages',
    equipe: null, settings: null, profile: null, 'profile-entreprise': null, coffre: null
  };

  function pageKey() {
    var last = (location.pathname.split('/').pop() || 'dashboard.html').split('?')[0];
    return last.replace(/\.html$/, '') || 'dashboard';
  }

  function findMount() {
    return document.querySelector('.app-shell') || document.querySelector('.phone-screen') || document.body;
  }

  function findNav() {
    return document.querySelector('nav.bn') || document.querySelector('#bottom-nav') || document.querySelector('.bn');
  }

  function ensureNav() {
    var nav = findNav();
    if (nav) {
      // Element deja present dans la page (11 pages sur 13) : on garde le
      // meme noeud, on s'assure juste des classes/role attendus.
      if (nav.tagName !== 'NAV') {
        // Ancien <div class="bn">, cf. coffre.html : on le laisse tel quel,
        // c'est le style CSS (.bn) qui compte, pas la balise.
      }
      nav.classList.add('bn');
      if (!nav.hasAttribute('role')) nav.setAttribute('role', 'navigation');
      if (!nav.hasAttribute('aria-label')) nav.setAttribute('aria-label', 'Navigation principale');
      return nav;
    }
    // Pages sans barre codee en dur (chantier.html, metre.html) : on la cree.
    nav = document.createElement('nav');
    nav.id = 'bottom-nav';
    nav.className = 'bn';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Navigation principale');
    findMount().appendChild(nav);
    return nav;
  }

  function renderNav() {
    var nav = ensureNav();
    var actif = GROUPE_PAGE[pageKey()] || null;

    nav.innerHTML = '';
    TABS.forEach(function (tab) {
      var isActif = tab.key === actif;
      var el;
      if (tab.key === 'menu') {
        el = document.createElement('button');
        el.type = 'button';
        el.addEventListener('click', function () {
          if (typeof window.openAppDrawer === 'function') {
            window.openAppDrawer();
          } else {
            location.href = './settings.html';
          }
        });
      } else {
        el = document.createElement('a');
        el.href = tab.href;
      }
      el.className = isActif ? 'bn-i active' : 'bn-i';
      if (isActif) el.setAttribute('aria-current', 'page');
      el.innerHTML = tab.icon + '\n        ' + tab.label + '\n      ';
      if (tab.key === 'messages') {
        // Badge de non-lus (tâche 19, 04/09) : valeur mise en cache par
        // js/mq-thread.js (actualiserBadgeMessages(), appelée depuis les
        // écrans de messagerie) — ce script classique n'importe pas le
        // client Supabase, il se contente d'afficher la dernière valeur
        // connue au chargement de CETTE page.
        var badge = document.createElement('span');
        badge.className = 'bn-badge';
        badge.id = 'bn-badge-messages';
        var n = 0;
        try { n = parseInt(localStorage.getItem('bs_badge_messages') || '0', 10) || 0; } catch (_e) {}
        if (n > 0) { badge.textContent = n > 99 ? '99+' : String(n); } else { badge.hidden = true; }
        el.appendChild(badge);
      }
      nav.appendChild(el);
    });
  }

  // Appelée par mq-thread.js (actualiserBadgeMessages) juste après une
  // requête à jour : met à jour le badge SANS re-render toute la barre.
  window.bsMajBadgeMessages = function (n) {
    var badge = document.getElementById('bn-badge-messages');
    if (!badge) return;
    if (n > 0) { badge.textContent = n > 99 ? '99+' : String(n); badge.hidden = false; }
    else { badge.hidden = true; }
  };

  // ── Correcteur d'orthographe (Moctar, 06/09 : « mets en place un
  // correcteur d'orthographe ») ────────────────────────────────────────────
  // Sur mobile, la correction et les suggestions viennent du clavier ; elles
  // ne se déclenchent que si le champ les autorise. Tous les champs de texte
  // libre de l'appli (messages, notes, descriptions, questions à l'assistant)
  // les autorisent, y compris ceux créés après le chargement. Les champs
  // e-mail / téléphone / nombre / recherche restent tels quels.
  function bsActiverCorrection(racine) {
    var champs = (racine || document).querySelectorAll('textarea, input[type="text"]:not([data-bs-sans-correction]), input:not([type])');
    Array.prototype.forEach.call(champs, function (el) {
      if (el.dataset.bsCorrection) return;
      var nom = (el.name || el.id || '').toLowerCase();
      if (/mail|tel|phone|siret|iban|code|mot|pass|recherche|search|num|ref|prix|montant/.test(nom)) return;
      el.setAttribute('spellcheck', 'true');
      el.setAttribute('autocorrect', 'on');
      if (!el.hasAttribute('autocapitalize')) el.setAttribute('autocapitalize', 'sentences');
      el.dataset.bsCorrection = '1';
    });
  }
  window.bsActiverCorrection = bsActiverCorrection;
  document.addEventListener('DOMContentLoaded', function () {
    bsActiverCorrection(document);
    try {
      new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          Array.prototype.forEach.call(m.addedNodes, function (n) { if (n && n.nodeType === 1) bsActiverCorrection(n); });
        });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (_e) {}
  });

  // ── Sous-navigation (Chantiers/Planning/Photos/Metre, Bilan/Analyses) ──
  // Planning et Photos ne disparaissent pas de l'appli : ils deviennent une
  // rangee d'onglets secondaires sous l'entete, sur les ecrans concernes.
  function bsSousNav(items) {
    var host = document.getElementById('sous-nav');
    if (!host) return;
    if (!items || !items.length) {
      host.hidden = true;
      host.replaceChildren();
      return;
    }
    var wrap = document.createElement('div');
    wrap.className = 'ui-subtabs';
    items.forEach(function (it) {
      var a = document.createElement('a');
      a.className = it.on ? 'ui-subtab on' : 'ui-subtab';
      a.href = it.href;
      a.textContent = it.label;
      if (it.on) a.setAttribute('aria-current', 'page');
      wrap.appendChild(a);
    });
    host.hidden = false;
    host.replaceChildren(wrap);
  }

  function chantiersSousNav(actif) {
    // (06/09, Moctar) « dans Chantiers, enlever Photos : on y accède déjà en
    // cliquant sur le chantier ». Plus de rangée Chantiers · Photos : une
    // liste vide masque la sous-navigation (bsSousNav). photos.html reste
    // joignable par l'onglet Photos de chaque chantier et par l'assistant.
    return [];
  }

  // Finances n'a plus de sous-navigation injectee ici (retiree le 04/09) :
  // la page porte deja ses propres onglets Bilan / Factures / Depenses /
  // Par chantier / Par poste / Analyses, et cette rangee « Bilan · Analyses »
  // faisait apparaitre « Bilan » et « Analyses » DEUX fois sur l'ecran
  // (releve par Moctar). analyses.html garde son lien retour vers Finances.
  function renderSousNav() {
    var k = pageKey();
    // Planning est un onglet principal (05/09) : pas de rangée « Chantiers /
    // Photos » au-dessus du calendrier (Moctar : « Photo et Photos »).
    if (k === 'dashboard' || k === 'photos' || k === 'metre') {
      bsSousNav(chantiersSousNav(k));
    } else {
      // Masque le conteneur #sous-nav vide : sinon sa bordure et son
      // padding laissent une bande blanche sous l'en-tete.
      bsSousNav([]);
    }
  }

  function init() {
    renderNav();
    renderSousNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ── En-tête compact (maquette validée 04/09) ──────────────────────────
// Sur les pages artisan, le bandeau logo devient : petit texte (date ou
// contexte) + titre de l'écran + avatar rond à droite. Le logo reste dans
// le tiroir Menu. Le premier <h1> de la page portant le même titre est
// masqué pour ne pas doubler.
(function () {
  var TITRES = {
    'dashboard.html': 'Chantiers', 'devis.html': 'Mes devis', 'finances.html': 'Finances', 'messages.html': 'Messages',
    'equipe.html': 'Équipe', 'planning.html': 'Planning', 'photos.html': 'Photos',
    'metre.html': 'Métré', 'analyses.html': 'Analyses', 'coffre.html': 'Coffre-fort',
    'settings.html': 'Réglages', 'profile.html': 'Mon profil', 'profile-entreprise.html': 'Mon entreprise'
  };
  function page() { return (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase(); }
  function initiales() {
    try {
      var raw = localStorage.getItem('bs_display_name') || '';
      var parts = raw.trim().split(/\s+/).filter(Boolean);
      if (parts.length) return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    } catch (_) {}
    return '';
  }
  function entete() {
    var h = document.querySelector('.app-h');
    var titre = TITRES[page()];
    if (!h || !titre || h.querySelector('.ui-top')) return;
    var logo = h.querySelector('a');
    if (logo) logo.classList.add('bs-logo-cache');
    var top = document.createElement('div');
    top.className = 'ui-top';
    var small = document.createElement('small');
    var d = new Date();
    // « vendredi 4 septembre » en tête d'écran manquait de tenue (retour Moctar
    // 04/09) : le navigateur rend le jour en minuscule, on capitalise, comme
    // n'importe quelle ligne qui ouvre un écran.
    var dateTxt = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    small.textContent = dateTxt.charAt(0).toUpperCase() + dateTxt.slice(1);
    var h2 = document.createElement('h2');
    h2.textContent = titre;
    top.appendChild(small); top.appendChild(h2);
    h.insertBefore(top, h.firstChild);
    var btn = h.querySelector('button');
    if (btn) {
      btn.classList.add('bs-avatar');
      btn.innerHTML = (window.bsIcon ? window.bsIcon('lines', 22) : '<span aria-hidden="true">≡</span>');
      btn.setAttribute('aria-label', 'Menu');
      btn.title = 'Menu';
    }
    // Masque le premier titre de page identique (évite « Chantiers » deux fois).
    var h1 = document.querySelector('main h1, .phone-screen h1, .app-shell h1, h1');
    if (h1 && h1.textContent.trim().toLowerCase().indexOf(titre.toLowerCase().split(' ')[0]) === 0) {
      h1.classList.add('bs-titre-cache');
    }
    // Barre « Dites-lui quoi faire » (tâche 9) : app-barre-assistant.js est un
    // module, donc différé — il s'exécute AVANT DOMContentLoaded, donc avant
    // cette fonction entete() (appelée sur cet événement), et se monte tout
    // seul en cherchant son ancre (.app-h/.ui-top, .mq-top ou <header>). Cet
    // appel ne sert que si, un jour, l'ordre de chargement change et que le
    // module s'exécute après entete() — la garde #bsBarre couvre les deux
    // ordres.
    if (window.bsMonterBarre) window.bsMonterBarre(h);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', entete);
  else entete();
})();

// Remplit les icônes déclarées en HTML : <span class="bs-ico" data-ico="camera"></span>
(function () {
  function remplir() {
    document.querySelectorAll('.bs-ico[data-ico]').forEach(function (el) {
      if (!el.firstChild && window.bsIcon) { el.innerHTML = window.bsIcon(el.getAttribute('data-ico'), 18); el.style.display = 'inline-flex'; el.style.marginRight = '6px'; }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', remplir); else remplir();
  window.bsRemplirIcones = remplir;
})();

// Enveloppe native iOS (Capacitor) : la barre d'accessoires du clavier
// (flèches + coche) recouvrait le bas de l'assistant (Moctar, 05/09 : « le
// bandeau menu mange les icônes »). Dans Safari / PWA, window.Capacitor
// n'existe pas : rien ne se passe.
(function () {
  try {
    var K = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Keyboard;
    if (K && typeof K.setAccessoryBarVisible === 'function') K.setAccessoryBarVisible({ isVisible: false }).catch(function () {});
  } catch (_) {}
})();

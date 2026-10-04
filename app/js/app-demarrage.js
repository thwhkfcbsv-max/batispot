// BatiSpot Pro — « Bien démarrer » : les quatre premiers gestes, en guides
// pas à pas (demande de Moctar, 05/09/2026 22h05 : « les écrans d'accueil
// doivent devenir des guides pas à pas pour l'artisan »).
//
// Ce module remplace, sur le tableau de bord, les cartes d'accueil de
// welcome.html (notifications, « vos anciens devis = vos prix », « factures
// fournisseurs = prix d'achat ») et y ajoute le premier devis dicté. Il ne
// réécrit aucun de ces flux : il les REUTILISE tels quels.
// (06/09, Moctar) titres courts, sur UNE ligne — le détail est dans le sous-titre.
//   1. Être prévenu ............ js/push-helper.js (enablePush('pro'))
//   2. Mes prix de vente ....... js/app-import-devis.js (BsImportDevis.monter)
//   3. Mes prix d'achat ........ js/app-import-devis.js (cible 'achat')
//   4. Mon premier devis dicté . window.bsAssistantDicterDevis() (app-assistant.js)
//
// Ce qu'il montre : une carte « Bien démarrer » sous l'en-tête du tableau de
// bord (avant la liste des chantiers) avec la progression (« 1 sur 4 »), puis
// pour chaque étape une feuille en bas de l'écran en trois écrans :
// « Ce que ça fait » · « Pourquoi ça compte pour vous » · « Faites-le
// maintenant » — le troisième porte le VRAI bouton d'action, jamais une
// image de bouton. Une étape « Plus tard » reste proposée, jamais bloquante.
// La carte disparaît quand les quatre sont faites ; le Menu garde « Revoir
// les guides » (app-menu.js).
//
// Mémoire : par compte, dans pro_profiles.demarrage (jsonb, migration
// additive app/supabase-demarrage-2026-09-06.sql). Tant que la colonne
// n'existe pas, ou hors ligne, repli sur localStorage (clé bs_demarrage:<uid>)
// — le module fonctionne dans les deux cas, sans erreur visible.
//
// API publique (pour l'assistant, la carte « L'assistant propose », le Menu) :
//   window.bsDemarrageEtape(n)   ouvre le guide de l'étape n (1..4, ou son id
//                                'push' | 'prix_vente' | 'prix_achat' |
//                                'premier_devis') à l'écran « Ce que ça fait ».
//                                Renvoie une promesse résolue à true si le guide
//                                s'est ouvert, false sinon (page sans session).
//   window.bsDemarrageOuvrir()   ouvre la feuille « Bien démarrer » avec les
//                                quatre étapes et leur état (« Revoir les guides »).
//   window.bsDemarrageEtat()     renvoie une copie de l'état :
//                                { etapes: { push: { s: 'fait'|'plus_tard'|'commence', le: ISO } … },
//                                  faites: 2, total: 4, termine: false }.
//   window.bsDemarrageMarquer(id, statut)  pose un statut ('fait', 'plus_tard',
//                                'commence') — pour que l'assistant puisse
//                                valider une étape qu'il a menée lui-même.
//
// Règles tenues ici : vouvoiement, aucun emoji, aucun prix inventé, aucun
// texte qui promette une fonction qui n'existe pas (les phrases reprennent
// celles de welcome.html et d'app-import-devis.js, déjà en production).

(function () {
  'use strict';

  var ETAPES = [
    {
      id: 'push',
      titre: 'Être prévenu',
      court: 'Notifications sur ce téléphone',
      quoi: [
        "Votre téléphone vous prévient dès qu'un client accepte un devis ou vous envoie un message.",
        "Une notification, comme pour un SMS, sans avoir à ouvrir l'application."
      ],
      pourquoi: [
        "Un client qui accepte un devis attend une réponse rapide. Sans notification, vous le découvrez le soir, ou le lendemain.",
        "Avec, vous répondez entre deux tâches, depuis le chantier."
      ],
      faire: [
        "Appuyez sur le bouton, puis acceptez la demande de votre téléphone.",
        "Vous pourrez couper les notifications à tout moment dans Réglages."
      ]
    },
    {
      id: 'prix_vente',
      titre: 'Mes anciens devis',
      court: 'Vos prix se retrouvent d’un devis à l’autre',
      quoi: [
        "Vous déposez vos devis ou factures déjà faits, en PDF ou en photo — plusieurs, car un seul devis ne contient pas tous vos prix.",
        "Les prix qui y sont écrits sont relus et vous sont proposés ligne par ligne : vous cochez ceux que vous gardez."
      ],
      pourquoi: [
        "Vos devis se chiffrent avec vos prix, pas ceux d'un catalogue.",
        "Chaque prix que vous validez ici est repris dans vos prochains devis, sans le retaper. Rien n'entre dans votre grille sans votre validation."
      ],
      faire: [
        "Choisissez un devis récent et lisible, une page à la fois. Une photo prise au téléphone convient."
      ]
    },
    {
      id: 'prix_achat',
      titre: "Mes prix d'achat",
      court: 'Une facture de votre négoce',
      quoi: [
        "Vous déposez une facture de votre négoce ou de votre grande surface.",
        "Les prix d'achat qui y sont écrits sont relus et proposés : vous cochez ceux que vous gardez."
      ],
      pourquoi: [
        "Ces prix servent à calculer votre marge sur chaque devis. Ils ne servent jamais à écrire votre devis.",
        "Tant qu'ils manquent, l'application affiche une estimation, en ambre, pour que vous sachiez qu'elle n'est pas la vôtre."
      ],
      faire: [
        "Prenez une facture fournisseur récente, une page à la fois, chiffres lisibles."
      ]
    },
    {
      id: 'premier_devis',
      titre: 'Mon premier devis dicté',
      court: "Décrire les travaux à voix haute",
      quoi: [
        "Vous décrivez les travaux à voix haute, comme à un collègue. L'assistant prépare le devis avec vos prix.",
        "Vous relisez tout avant d'envoyer quoi que ce soit."
      ],
      pourquoi: [
        "Un devis dicté depuis la voiture ou le chantier, c'est une soirée de moins devant l'ordinateur.",
        "Le premier prend quelques minutes ; les suivants iront plus vite."
      ],
      faire: [
        "Appuyez sur le bouton : l'assistant s'ouvre. Maintenez le micro, décrivez les travaux, relâchez.",
        "Le devis reste un brouillon tant que vous ne l'envoyez pas."
      ]
    }
  ];

  var ECRANS = [
    { cle: 'quoi', kicker: 'Ce que ça fait' },
    { cle: 'pourquoi', kicker: 'Pourquoi ça compte pour vous' },
    { cle: 'faire', kicker: 'Faites-le maintenant' }
  ];

  var SVG_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
  var SVG_CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg>';
  var SVG_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  // ── État ────────────────────────────────────────────────────────────────
  var uid = null;
  var etat = { etapes: {} };
  var colonneServeur = null; // null = pas encore su, true/false ensuite
  var pretResolve;
  var pret = new Promise(function (r) { pretResolve = r; });
  var carte = null;
  var overlay = null;
  var courant = { etape: null, ecran: 0 }; // etape = index dans ETAPES, ou null = vue d'ensemble

  function cleLocale() { return 'bs_demarrage:' + (uid || 'anonyme'); }

  function lireLocal() {
    try {
      var j = JSON.parse(localStorage.getItem(cleLocale()) || 'null');
      if (j && typeof j === 'object' && j.etapes && typeof j.etapes === 'object') return j;
    } catch (_) { /* localStorage indisponible ou corrompu : on repart de zéro */ }
    return { etapes: {} };
  }

  function ecrireLocal(e) {
    try { localStorage.setItem(cleLocale(), JSON.stringify(e)); } catch (_) { /* rien à faire */ }
  }

  // Deux états (local + serveur) : pour chaque étape, le plus récent gagne.
  function fusion(a, b) {
    var r = { etapes: {} };
    // `vu_le` : la carte a déjà été montrée une fois (n'importe quel appareil).
    var v = [a && a.vu_le, b && b.vu_le].filter(Boolean).sort();
    if (v.length) r.vu_le = v[0];
    ETAPES.forEach(function (et) {
      var x = a && a.etapes && a.etapes[et.id];
      var y = b && b.etapes && b.etapes[et.id];
      if (x && y) r.etapes[et.id] = (String(y.le || '') > String(x.le || '')) ? y : x;
      else if (x || y) r.etapes[et.id] = x || y;
    });
    return r;
  }

  async function chargerServeur() {
    try {
      var m = await import('./supabase.js');
      // select('*') et non select('demarrage') : tant que la migration n'est
      // pas appliquée, demander la colonne par son nom renvoie un 400 que le
      // navigateur inscrit en rouge dans la console. Avec la ligne entière,
      // on constate simplement si la clé existe, sans erreur.
      var res = await m.supabase.from('pro_profiles').select('*').eq('pro_id', uid).maybeSingle();
      if (res.error || !res.data) { colonneServeur = false; return null; }
      colonneServeur = Object.prototype.hasOwnProperty.call(res.data, 'demarrage');
      var d = res.data.demarrage;
      return (colonneServeur && d && typeof d === 'object' && d.etapes) ? d : null;
    } catch (_) {
      colonneServeur = false;
      return null;
    }
  }

  async function sauver() {
    ecrireLocal(etat);
    if (colonneServeur === false || !uid) return;
    try {
      var m = await import('./supabase.js');
      var res = await m.supabase.from('pro_profiles').update({ demarrage: etat }).eq('pro_id', uid);
      if (res.error) {
        // PGRST204 : la colonne n'existe pas encore (migration non appliquée).
        // Le repli localStorage suffit ; on arrête d'essayer pour cette page.
        colonneServeur = false;
      }
    } catch (_) { colonneServeur = false; }
  }

  function statut(id) { var s = etat.etapes[id]; return s ? s.s : ''; }

  // push-helper attend `navigator.serviceWorker.ready`, qui ne se résout
  // JAMAIS quand aucun service worker n'est enregistré (page ouverte hors
  // PWA, premier chargement) : sans délai, le bouton n'apparaîtrait pas.
  function avecDelai(promesse, ms) {
    return Promise.race([
      promesse,
      new Promise(function (_, rej) { setTimeout(function () { rej(new Error('delai')); }, ms); })
    ]);
  }

  function marquer(id, s) {
    if (!ETAPES.some(function (e) { return e.id === id; })) return;
    // « fait » n'est jamais rétrogradé par « plus_tard » ou « commence ».
    if (statut(id) === 'fait' && s !== 'fait') return;
    if (statut(id) === s) return;
    etat.etapes[id] = { s: s, le: new Date().toISOString() };
    sauver();
    rendreCarte();
  }

  function nbFaites() {
    return ETAPES.filter(function (e) { return statut(e.id) === 'fait'; }).length;
  }

  function prochaineAFaire(apres) {
    for (var i = 0; i < ETAPES.length; i++) {
      var j = (apres + 1 + i) % ETAPES.length;
      if (statut(ETAPES[j].id) !== 'fait') return j;
    }
    return -1;
  }

  // ── Détection de ce qui est déjà fait (ne rétrograde jamais) ───────────
  // Best-effort, chaque sonde isolée : une sonde qui échoue ne marque rien.
  async function detecter() {
    var change = false;
    function fait(id) {
      if (statut(id) !== 'fait') { etat.etapes[id] = { s: 'fait', le: new Date().toISOString() }; change = true; }
    }
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        var ph = await import('./push-helper.js');
        var abo = await avecDelai(ph.getCurrentSubscription(), 1500);
        if (abo) fait('push');
      }
    } catch (_) { /* pas de push ici */ }
    try {
      var g = window.BtpPriceGridManager;
      if (g && typeof g.getGrid === 'function' && typeof g.estPrixArtisan === 'function') {
        var grille = g.getGrid() || [];
        if (grille.some(function (x) { return x && g.estPrixArtisan(x.source); })) fait('prix_vente');
      }
    } catch (_) { /* grille indisponible */ }
    try {
      var mat = await import('./app-materiaux.js');
      var achats = await mat.chargerPrixAchat();
      if (Array.isArray(achats) && achats.length) fait('prix_achat');
    } catch (_) { /* table indisponible */ }
    try {
      var m = await import('./supabase.js');
      var res = await m.supabase.from('devis_visible').select('id').eq('pro_id', uid).limit(1);
      if (!res.error && res.data && res.data.length) fait('premier_devis');
    } catch (_) { /* pas de devis lisible */ }
    if (change) { sauver(); rendreCarte(); }
  }

  // ── Carte du tableau de bord ───────────────────────────────────────────
  function el(tag, cls, texte) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texte != null) e.textContent = texte;
    return e;
  }

  function ligneEtape(et, i, onClick) {
    var li = el('li', 'bs-dem-etape');
    var s = statut(et.id);
    if (s === 'fait') li.classList.add('faite');
    else if (s === 'plus_tard') li.classList.add('plus-tard');
    var b = el('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Étape ' + (i + 1) + ' : ' + et.titre);
    var num = el('span', 'bs-dem-num');
    if (s === 'fait') num.innerHTML = SVG_CHECK; else num.textContent = String(i + 1);
    var lib = el('span', 'bs-dem-lib', et.titre);
    lib.appendChild(el('small', null, et.court));
    b.appendChild(num); b.appendChild(lib);
    if (s === 'fait') b.appendChild(el('span', 'bs-dem-pill ok', 'Fait'));
    else if (s === 'plus_tard') b.appendChild(el('span', 'bs-dem-pill wait', 'Plus tard'));
    else if (s === 'commence') b.appendChild(el('span', 'bs-dem-pill wait', 'Commencé'));
    var chev = el('span', 'bs-dem-chev'); chev.innerHTML = SVG_CHEV;
    b.appendChild(chev);
    b.addEventListener('click', function () { onClick(i); });
    li.appendChild(b);
    return li;
  }

  function rendreListe(onClick) {
    var ol = el('ol', 'bs-dem-liste');
    ETAPES.forEach(function (et, i) { ol.appendChild(ligneEtape(et, i, onClick)); });
    return ol;
  }

  // La carte « Bien démarrer » ne vit sur Chantiers qu'à la PREMIÈRE
  // connexion (Moctar, 05/09 : « ne doit pas rester sur Chantiers »). Ensuite,
  // les guides se rouvrent uniquement par Menu › Revoir les guides (?guides=1).
  var carteAutorisee = false;
  function decider() {
    carteAutorisee = !etat.vu_le && nbFaites() === 0;
  }

  function rendreCarte() {
    if (!carte) return;
    var faites = nbFaites();
    carte.replaceChildren();
    if (!carteAutorisee || faites >= ETAPES.length) { carte.hidden = true; return; }
    carte.hidden = false;
    var head = el('div', 'bs-dem-head');
    var titre = el('div', 'bs-dem-titre', 'Bien démarrer');
    titre.appendChild(el('small', null, faites ? 'Continuez à votre rythme.' : 'Quatre gestes, quelques minutes chacun.'));
    head.appendChild(titre);
    head.appendChild(el('div', 'bs-dem-sous', faites + ' sur ' + ETAPES.length));
    carte.appendChild(head);
    var barre = el('div', 'bs-dem-barre');
    barre.setAttribute('role', 'progressbar');
    barre.setAttribute('aria-valuemin', '0');
    barre.setAttribute('aria-valuemax', String(ETAPES.length));
    barre.setAttribute('aria-valuenow', String(faites));
    var i = el('i'); i.style.width = Math.round(100 * faites / ETAPES.length) + '%';
    barre.appendChild(i);
    carte.appendChild(barre);
    carte.appendChild(rendreListe(function (idx) { ouvrirEtape(idx); }));
  }

  function monterCarte() {
    if (carte) return;
    var ancre = document.getElementById('chantiers-tabs');
    var corps = document.getElementById('scr-body');
    if (!corps) return;
    carte = el('section', 'bs-dem');
    carte.id = 'bsDemarrage';
    carte.setAttribute('aria-label', 'Bien démarrer');
    carte.hidden = true;
    if (ancre && ancre.parentNode === corps) corps.insertBefore(carte, ancre);
    else corps.insertBefore(carte, corps.firstChild);
    rendreCarte();
  }

  // ── Feuille-guide ──────────────────────────────────────────────────────
  function creerOverlay() {
    if (overlay) return overlay;
    overlay = el('div', 'bs-dem-ov');
    overlay.id = 'bsDemOverlay';
    var sheet = el('div', 'bs-dem-sheet');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'bsDemTitre');
    sheet.innerHTML = ''
      + '<div class="bs-dem-sh-head"><div><b id="bsDemTitre"></b><small id="bsDemSous"></small></div>'
      + '<button type="button" class="bs-dem-sh-close" id="bsDemClose" aria-label="Fermer">' + SVG_CLOSE + '</button></div>'
      + '<div class="bs-dem-sh-body" id="bsDemBody"></div>'
      + '<div class="bs-dem-sh-foot" id="bsDemFoot"></div>';
    overlay.appendChild(sheet);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) fermer(); });
    sheet.querySelector('#bsDemClose').addEventListener('click', fermer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) fermer();
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  function fermer() {
    if (overlay) overlay.classList.remove('open');
    courant.etape = null;
  }

  function bouton(texte, cls, onClick) {
    var b = el('button', 'bs-dem-btn ' + cls, texte);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  function ouvrirVueEnsemble() {
    creerOverlay();
    courant.etape = null;
    var faites = nbFaites();
    document.getElementById('bsDemTitre').textContent = 'Bien démarrer';
    document.getElementById('bsDemSous').textContent = faites >= ETAPES.length
      ? 'Les quatre étapes sont faites. Vous pouvez les revoir quand vous voulez.'
      : faites + ' sur ' + ETAPES.length + ' — ouvrez une étape pour la revoir ou la faire.';
    var body = document.getElementById('bsDemBody');
    body.replaceChildren();
    body.appendChild(rendreListe(function (idx) { ouvrirEtape(idx); }));
    var foot = document.getElementById('bsDemFoot');
    foot.replaceChildren();
    foot.appendChild(bouton('Fermer', 'ghost', fermer));
    overlay.classList.add('open');
  }

  function ouvrirEtape(idx, ecran) {
    if (idx < 0 || idx >= ETAPES.length) return false;
    creerOverlay();
    courant.etape = idx;
    courant.ecran = ecran || 0;
    rendreEcran();
    overlay.classList.add('open');
    return true;
  }

  function rendreEcran() {
    var idx = courant.etape;
    var et = ETAPES[idx];
    var ec = ECRANS[courant.ecran];
    document.getElementById('bsDemTitre').textContent = et.titre;
    document.getElementById('bsDemSous').textContent = 'Étape ' + (idx + 1) + ' sur ' + ETAPES.length
      + ' — écran ' + (courant.ecran + 1) + ' sur ' + ECRANS.length;

    var body = document.getElementById('bsDemBody');
    body.replaceChildren();
    var pts = el('div', 'bs-dem-pts');
    ECRANS.forEach(function (_, i) { var s = el('span'); if (i <= courant.ecran) s.className = 'on'; pts.appendChild(s); });
    body.appendChild(pts);
    body.appendChild(el('div', 'bs-dem-kicker', ec.kicker));
    var txt = el('div', 'bs-dem-txt');
    et[ec.cle].forEach(function (p) { txt.appendChild(el('p', null, p)); });
    body.appendChild(txt);

    var foot = document.getElementById('bsDemFoot');
    foot.replaceChildren();

    if (courant.ecran < ECRANS.length - 1) {
      foot.appendChild(bouton('Plus tard', 'ghost', function () { marquer(et.id, 'plus_tard'); fermer(); }));
      foot.appendChild(bouton('Suivant', 'primary', function () { courant.ecran++; rendreEcran(); body.scrollTop = 0; }));
      return;
    }

    // Écran 3 : le vrai bouton d'action.
    var zone = el('div', 'bs-dem-action');
    body.appendChild(zone);
    if (statut(et.id) === 'fait') {
      var ok = el('div', 'bs-dem-fait');
      ok.innerHTML = SVG_CHECK;
      ok.appendChild(document.createTextNode('Cette étape est faite. Vous pouvez la refaire si besoin.'));
      zone.appendChild(ok);
    }
    ACTIONS[et.id](zone, et);

    foot.appendChild(bouton('Précédent', 'ghost', function () { courant.ecran--; rendreEcran(); body.scrollTop = 0; }));
    if (statut(et.id) === 'fait') {
      var suiv = prochaineAFaire(idx);
      foot.appendChild(suiv >= 0
        ? bouton('Étape suivante', 'primary', function () { ouvrirEtape(suiv); body.scrollTop = 0; })
        : bouton('Fermer', 'primary', fermer));
    } else {
      foot.appendChild(bouton('Plus tard', 'ghost', function () { marquer(et.id, 'plus_tard'); fermer(); }));
    }
  }

  // Après une action réussie : on marque, on remplace la zone par la
  // confirmation et on propose l'étape suivante dans le pied.
  function reussite(et, zone, message) {
    marquer(et.id, 'fait');
    zone.replaceChildren();
    var ok = el('div', 'bs-dem-fait');
    ok.innerHTML = SVG_CHECK;
    ok.appendChild(document.createTextNode(message));
    zone.appendChild(ok);
    var foot = document.getElementById('bsDemFoot');
    foot.replaceChildren();
    var suiv = prochaineAFaire(courant.etape);
    foot.appendChild(suiv >= 0
      ? bouton('Étape suivante', 'primary', function () { ouvrirEtape(suiv); })
      : bouton('Fermer', 'primary', fermer));
  }

  var ACTIONS = {
    // 1. Notifications — même logique que welcome.html (#push-card).
    push: function (zone, et) {
      if (statut(et.id) === 'fait') return;
      var note = el('div', 'bs-dem-note', 'Un instant…');
      zone.appendChild(note);
      import('./push-helper.js').then(async function (ph) {
        note.remove();
        if (!ph.isPushSupported()) {
          zone.appendChild(el('div', 'bs-dem-attente', "Ce navigateur ne sait pas recevoir de notifications. Ouvrez BatiSpot depuis l'application installée sur votre téléphone."));
          return;
        }
        if (ph.getPushPermission() === 'denied') {
          zone.appendChild(el('div', 'bs-dem-attente', 'Les notifications sont bloquées pour BatiSpot dans les réglages de votre téléphone. Autorisez-les là-bas, puis revenez ici.'));
          return;
        }
        var isIos = /iP(hone|ad|od)/.test(navigator.userAgent) && !window.MSStream;
        var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
        if (isIos && !standalone) {
          zone.appendChild(el('div', 'bs-dem-attente', "Sur iPhone, ajoutez d'abord BatiSpot à votre écran d'accueil : appuyez sur Partager, puis « Sur l'écran d'accueil ». Ouvrez ensuite BatiSpot depuis cette icône et revenez ici."));
          return;
        }
        var deja = await avecDelai(ph.getCurrentSubscription(), 1500).catch(function () { return null; });
        if (deja) { reussite(et, zone, 'Les notifications sont déjà actives sur ce téléphone.'); return; }
        var b = bouton('Activer les notifications', 'primary', async function () {
          b.disabled = true;
          var avant = b.textContent;
          b.textContent = 'Un instant…';
          try {
            // Même enregistrement que inscription-pro.html : sans service
            // worker, enablePush attendrait `serviceWorker.ready` pour toujours.
            var reg = await navigator.serviceWorker.getRegistration();
            if (!reg) await navigator.serviceWorker.register('./sw.js');
            await avecDelai(ph.enablePush('pro'), 20000);
            reussite(et, zone, 'Les notifications sont actives sur ce téléphone.');
          } catch (err) {
            console.warn('[demarrage] push', err);
            b.textContent = avant;
            b.disabled = false;
            var msg = zone.querySelector('.bs-dem-attente') || el('div', 'bs-dem-attente');
            msg.textContent = (err && err.message === 'delai')
              ? "Votre téléphone n'a pas répondu. Vérifiez la demande d'autorisation, puis réessayez."
              : ((err && err.message) || "L'activation a échoué. Réessayez.");
            zone.appendChild(msg);
          }
        });
        zone.appendChild(b);
      }).catch(function (err) {
        console.warn('[demarrage] push-helper indisponible', err);
        note.textContent = 'Les notifications ne sont pas disponibles pour le moment.';
      });
    },

    // 2 et 3. Import — BsImportDevis.monter, exactement comme welcome.html.
    prix_vente: function (zone, et) { monterImport(zone, et, null); },
    prix_achat: function (zone, et) { monterImport(zone, et, 'achat'); },

    // 4. Dicter — l'assistant fait le devis ; on ne le refait pas ici.
    premier_devis: function (zone, et) {
      var b = bouton('Dicter mon premier devis', 'primary', function () {
        if (statut(et.id) !== 'fait') marquer(et.id, 'commence');
        fermer();
        if (typeof window.bsAssistantDicterDevis === 'function') window.bsAssistantDicterDevis();
        else location.href = './devis.html';
      });
      zone.appendChild(b);
      zone.appendChild(el('div', 'bs-dem-note', "L'étape sera cochée dès que votre premier devis existe."));
    }
  };

  function monterImport(zone, et, cible) {
    var conteneur = el('div');
    conteneur.style.width = '100%';
    zone.appendChild(conteneur);
    var total = 0;
    var tentatives = 0;
    (function essayer() {
      tentatives++;
      if (window.BsImportDevis && typeof window.BsImportDevis.monter === 'function') {
        window.BsImportDevis.monter(conteneur, {
          cible: cible || undefined,
          onImport: function (n) {
            total += n;
            marquer(et.id, 'fait');
            var c = zone.querySelector('.bs-dem-fait') || el('div', 'bs-dem-fait');
            c.innerHTML = SVG_CHECK;
            c.appendChild(document.createTextNode(cible === 'achat'
              ? total + (total > 1 ? " prix d'achat enregistrés." : " prix d'achat enregistré.")
              : total + (total > 1 ? ' prix ajoutés à votre grille.' : ' prix ajouté à votre grille.')));
            zone.insertBefore(c, conteneur);
            var foot = document.getElementById('bsDemFoot');
            foot.replaceChildren();
            var suiv = prochaineAFaire(courant.etape);
            foot.appendChild(bouton('Précédent', 'ghost', function () { courant.ecran--; rendreEcran(); }));
            foot.appendChild(suiv >= 0
              ? bouton('Étape suivante', 'primary', function () { ouvrirEtape(suiv); })
              : bouton('Fermer', 'primary', fermer));
          }
        });
        return;
      }
      if (tentatives < 25) { setTimeout(essayer, 200); return; }
      // Sans le module (page sans app-import-devis.js) : on renvoie vers
      // l'écran qui l'héberge déjà, plutôt qu'un bouton mort.
      var a = el('a', 'bs-dem-btn primary', cible === 'achat' ? "Déposer une facture fournisseur" : 'Importer mes devis');
      a.href = './profile-entreprise.html#grille';
      conteneur.appendChild(a);
    })();
  }

  // ── Démarrage ──────────────────────────────────────────────────────────
  async function init() {
    try {
      var m = await import('./supabase.js');
      var session = await m.getSession();
      if (!session || !session.user) { pretResolve(false); return; }
      uid = session.user.id;
    } catch (_) { pretResolve(false); return; }

    etat = lireLocal();
    decider();
    monterCarte();
    var serveur = await chargerServeur();
    if (serveur) { etat = fusion(etat, serveur); ecrireLocal(etat); decider(); rendreCarte(); }
    pretResolve(true);
    if (carteAutorisee) {
      // Première fois : on marque « vue » tout de suite (local + serveur).
      // La carte reste affichée sur CETTE page ; au prochain écran, elle
      // n'est plus là.
      etat.vu_le = new Date().toISOString();
      sauver();
    }

    var q = new URLSearchParams(location.search);
    if (q.get('guides') === '1') ouvrirVueEnsemble();

    detecter();

    // (06/09, Moctar) « quand je me connecte la première fois, il doit me
    // demander l'activation des notifs » : une seule fois par compte et par
    // appareil, si le téléphone n'a encore jamais répondu, on ouvre l'étape
    // « Être prévenu » — son bouton déclenche la vraie demande du système
    // (un geste de l'utilisateur est obligatoire pour ça).
    try {
      var cleNotif = 'bs_notif_demande:' + uid;
      if (q.get('guides') !== '1' && statut('push') !== 'fait'
          && 'Notification' in window && Notification.permission === 'default'
          && !localStorage.getItem(cleNotif)) {
        localStorage.setItem(cleNotif, new Date().toISOString());
        setTimeout(function () { ouvrirEtape(0, 0); }, 600);
      }
    } catch (_) { /* pas de notifications ici */ }
  }

  window.bsDemarrageEtape = function (n) {
    return pret.then(function (ok) {
      if (!ok) return false;
      var idx = typeof n === 'number' ? n - 1
        : ETAPES.findIndex(function (e) { return e.id === String(n); });
      return ouvrirEtape(idx, 0);
    });
  };
  window.bsDemarrageOuvrir = function () {
    return pret.then(function (ok) { if (ok) ouvrirVueEnsemble(); return ok; });
  };
  window.bsDemarrageEtat = function () {
    var copie = JSON.parse(JSON.stringify(etat));
    copie.faites = nbFaites();
    copie.total = ETAPES.length;
    copie.termine = copie.faites >= ETAPES.length;
    return copie;
  };
  window.bsDemarrageMarquer = function (id, s) {
    return pret.then(function (ok) { if (ok) marquer(String(id), String(s)); return ok; });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

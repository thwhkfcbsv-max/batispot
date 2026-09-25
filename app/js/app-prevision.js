// BatiSpot Pro — prévision du prochain acte (19/09/2026).
//
// POURQUOI CE FICHIER EXISTE. Les actes d'un artisan s'enchaînent : devis →
// envoi → relance → signature → acompte → chantier → solde → encaissement.
// Le prochain se lit dans l'ÉTAT de sa base, pas dans la conversation. La
// fonction SQL `prochains_actes()` (app/supabase-prevision-prochains-actes-
// 2026-09-19.sql) le calcule avec des délais métier ; ce script la lit une
// fois par page et la sert à l'assistant :
//   - puces NOMMÉES (l'entité est dedans : l'étude du 18/09 a mesuré que deux
//     tiers des échecs de l'assistant sont des puces sans entité) ;
//   - phrase d'ouverture : l'assistant parle le premier ;
//   - `prevu` joint à chaque requête, pour que le serveur journalise l'écart
//     prévu/réel (assistant_log.prevu) — la donnée qui permettra d'apprendre.
//
// Script classique (pas de module) : il lit le jeton là où app-assistant.js le
// lit (bsJetonSession) et appelle la RPC en REST. Aucun appel LLM. Fail-silent :
// sans session, sans réseau, sans droits, la prévision est simplement vide et
// l'assistant garde ses puces d'origine.
(function () {
  'use strict';

  var CLE = 'bs_prevision';
  var TTL_MS = 60000;   // une minute : l'état change quand l'artisan agit, pas plus vite
  var MAX = 6;
  var enCours = null;

  // Le cache se lit à deux niveaux : FRAIS (moins d'une minute) ou PÉRIMÉ.
  // Un périmé se sert quand même (une prévision d'il y a deux minutes vaut
  // mieux que des puces sans entité) pendant qu'on relit derrière — sinon
  // l'artisan qui ouvre l'assistant pile pendant la relecture retombe sur
  // les puces génériques (vu au test du 20/09).
  function lireCacheBrut() {
    try {
      var c = JSON.parse(sessionStorage.getItem(CLE) || 'null');
      if (c && Array.isArray(c.actes)) return c;
    } catch (_) {}
    return null;
  }
  function lireCache() {
    var c = lireCacheBrut();
    return c && Date.now() - Number(c.at || 0) < TTL_MS ? c.actes : null;
  }
  function lireCachePerime() {
    var c = lireCacheBrut();
    return c ? c.actes : null;
  }
  function ecrireCache(actes) {
    try { sessionStorage.setItem(CLE, JSON.stringify({ at: Date.now(), actes: actes })); } catch (_) {}
  }

  // Pages du CLIENT (particulier) : jamais de prévision, ce n'est pas son état.
  function estPageClient() {
    var p = String(location.pathname.split('/').pop() || '').toLowerCase();
    return /^(client|suivi|rejoindre|demande-devis|login|auth-callback|welcome|inscription)/.test(p);
  }

  // Le jeton de session, lu là où supabase-js le range — le MÊME code que
  // bsJetonSession (app-assistant.js), recopié parce que ce script s'exécute
  // AVANT lui (ordre des `defer`) : au moment où on lit, bsJetonSession
  // n'existe pas encore. Dépendre de lui rendait la prévision vide partout.
  function lireJeton() {
    try {
      var cfg = window.__BATISPOT_CONFIG__ || {};
      var ref = String(cfg.SUPABASE_URL || '').match(/https:\/\/([^.]+)\./);
      if (!ref) return null;
      var brut = localStorage.getItem('sb-' + ref[1] + '-auth-token');
      if (!brut) return null;
      var s = JSON.parse(brut);
      var jeton = s && (s.access_token || (s.currentSession && s.currentSession.access_token));
      if (!jeton) return null;
      var exp = s.expires_at || (s.currentSession && s.currentSession.expires_at);
      if (exp && Number(exp) * 1000 < Date.now()) return null;
      return jeton;
    } catch (_) { return null; }
  }

  function charger(force) {
    if (estPageClient()) return Promise.resolve([]);
    if (!force) { var c = lireCache(); if (c) return Promise.resolve(c); }
    if (enCours) return enCours;
    var cfg = window.__BATISPOT_CONFIG__ || {};
    var jeton = lireJeton();
    if (!jeton || !cfg.SUPABASE_ANON_KEY) return Promise.resolve([]);
    var url = (cfg.SUPABASE_URL || 'https://cisniwhaiydazdpzvino.supabase.co') + '/rest/v1/rpc/prochains_actes';
    enCours = fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: cfg.SUPABASE_ANON_KEY, authorization: 'Bearer ' + jeton },
      body: '{}',
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (a) {
        a = Array.isArray(a) ? a.filter(function (x) { return x && x.acte && x.outil; }).slice(0, MAX) : [];
        ecrireCache(a);
        return a;
      })
      .catch(function () { return []; })
      .then(function (a) { enCours = null; return a; });
    return enCours;
  }

  function actes() {
    var frais = lireCache();
    if (frais) return frais;
    var perime = lireCachePerime();
    if (perime) charger(true);   // servi tel quel, relu derrière
    return perime || [];
  }

  // Une puce = un acte, au format que bsAstOutilForcable attend déjà. L'entité
  // est résolue par construction (elle vient de la base), donc l'outil est
  // forcé. La question envoyée au modèle = l'acte + sa raison : un ordre
  // complet, nommé, motivé — rien à deviner.
  function puces() {
    return actes().map(function (a) {
      var p = { label: a.acte, question: a.acte + (a.raison ? ' — ' + a.raison : ''), prevu: true,
                outil: a.outil, sujet: 'requis', sujetResolu: true, sujet_id: a.sujet_id || null };
      // Un brouillon à envoyer n'a pas besoin du modèle : on ouvre le devis.
      if (a.outil === 'ouvrir_ecran' && a.sujet_type === 'devis' && a.sujet_id) {
        p.action = function () { location.href = './devis.html?id=' + encodeURIComponent(a.sujet_id); };
      }
      return p;
    });
  }

  // La phrase d'ouverture : les trois premiers actes, tels quels. Rien
  // d'inventé, rien de reformulé — ce sont les faits de la base.
  function phrase() {
    var l = actes();
    if (!l.length) return '';
    var top = l.slice(0, 3).map(function (a) { return a.acte; });
    var reste = l.length - top.length;
    return 'À faire : ' + top.join(' · ') + (reste > 0 ? ' (+' + reste + ')' : '') + '. Par où on commence ?';
  }

  // Ce qui part avec chaque requête : `actes` = noms d'outils (journalisés),
  // `libelles` = texte pour le modèle (jamais journalisé).
  function outils() {
    var l = actes();
    return { actes: l.map(function (a) { return a.outil; }), libelles: l.map(function (a) { return a.acte; }) };
  }

  function rafraichirUI() {
    if (typeof window.bsAssistantRafraichirSuggestions === 'function') {
      try { window.bsAssistantRafraichirSuggestions(); } catch (_) {}
    }
    // Les écrans qui dessinent leur propre carte (tableau de bord) écoutent.
    try { window.dispatchEvent(new CustomEvent('bs:prevision')); } catch (_) {}
  }

  // Après une action validée, l'état a changé : on relit.
  function invalider() {
    try { sessionStorage.removeItem(CLE); } catch (_) {}
    charger(true).then(rafraichirUI);
  }

  // (24/09) Le prénom de l'artisan vit dans sa fiche de candidature (artisan_leads),
  // ni dans pro_profiles ni dans le compte. Lu une fois par session, jamais bloquant.
  var CLE_PRENOM = 'bs_prenom';
  function chargerPrenom() {
    try { if (sessionStorage.getItem(CLE_PRENOM) !== null) return; } catch (_) {}
    var jeton = lireJeton(); var cfg = window.__BATISPOT_CONFIG__ || {};
    if (!jeton || !cfg.SUPABASE_ANON_KEY) return;
    // (24/09, Moctar a vu « Bonsoir Jean ») : son compte est admin des candidatures, un
    // `limit=1` sans filtre rendait la PREMIÈRE ligne de la table. On filtre sur SON
    // identifiant (puis son e-mail), lus dans le jeton — jamais la première venue.
    var uid = '', email = '';
    try { var c = JSON.parse(atob(jeton.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); uid = c.sub || ''; email = (c.email || '').toLowerCase(); } catch (_) {}
    var base = (cfg.SUPABASE_URL || 'https://cisniwhaiydazdpzvino.supabase.co') + '/rest/v1/artisan_leads?select=prenom&limit=1&';
    var entetes = { headers: { apikey: cfg.SUPABASE_ANON_KEY, authorization: 'Bearer ' + jeton } };
    var lire = function (filtre) { return fetch(base + filtre, entetes).then(function (r) { return r.ok ? r.json() : []; }); };
    (uid ? lire('user_id=eq.' + encodeURIComponent(uid)) : Promise.resolve([]))
      .then(function (l) { return (l && l.length) ? l : (email ? lire('email=eq.' + encodeURIComponent(email)) : []); })
      .then(function (l) { var p = (l && l[0] && l[0].prenom) ? String(l[0].prenom).trim() : ''; try { sessionStorage.setItem(CLE_PRENOM, p); } catch (_) {} })
      .catch(function () {});
  }
  window.bsPrevisionPrenom = function () { try { return sessionStorage.getItem(CLE_PRENOM) || ''; } catch (_) { return ''; } };
  chargerPrenom();

  window.bsPrevision = charger;
  window.bsPrevisionActes = actes;
  window.bsPrevisionPuces = puces;
  window.bsPrevisionPhrase = phrase;
  window.bsPrevisionOutils = outils;
  window.bsPrevisionInvalider = invalider;

  // Au chargement : si le cache est vide, on lit, puis on redemande le rendu
  // des puces (la carte de la page comme la feuille de l'assistant relisent
  // bsPrevisionPuces au moment de s'afficher).
  function demarrer() {
    if (lireCache()) return;
    charger(false).then(function (a) { if (a.length) rafraichirUI(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();

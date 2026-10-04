// BatiSpot — Remontee des pannes vivantes chez l'artisan
//
// Ecrit le 31/08/2026, apres avoir decouvert que le scan de tickets renvoyait
// 401 pour TOUS les artisans depuis des jours. Ils lisaient « Ticket illisible »,
// pensaient que leur photo etait mauvaise, reessayaient, abandonnaient. Personne
// ne l'a su : on ne l'a trouve qu'en cherchant pourquoi la table `depenses`
// etait vide.
//
// Deux constats qui dictent la forme de ce fichier :
//
// 1. Le bug le plus couteux est SILENCIEUX. L'artisan ne se plaint pas : il
//    conclut que l'app est mauvaise et il part. On perd un client sans jamais
//    savoir pourquoi. Donc la remontee doit etre automatique, pas declarative.
//
// 2. L'assistant ne peut pas signaler ces pannes-la : quand l'appel echoue en
//    401, Gemini n'est jamais atteint. Il ne sait meme pas qu'on l'a appele.
//    L'IA sert a l'autre moitie du probleme — reperer quand l'artisan DIT que
//    ca ne marche pas (bsSignalerPlainte, plus bas).
//
// Sentry existe dans le depot (js/sentry-init.js) mais SENTRY_DSN est vide dans
// config.js : il ne se charge jamais. Ce fichier ne le remplace pas, il comble
// le trou sans dependance externe ni cout, en reutilisant `notify-admin` qui est
// deja deployee et envoie a contact@batispot.pro via Brevo.

(function () {
  'use strict';

  // notify-admin limite a 5 appels/min/IP. Un ecran qui boucle sur une erreur
  // brulerait ce quota en quelques secondes et masquerait les autres pannes.
  // On garde donc une empreinte par type de panne : la meme panne ne repart
  // qu'une fois par demi-heure, et jamais plus de 3 alertes par session.
  var CLE_MEMOIRE = 'batispot_alertes_envoyees_v1';
  var DELAI_REPETITION_MS = 30 * 60 * 1000;
  var MAX_PAR_SESSION = 3;
  var envoyeesCetteSession = 0;

  function dejaSignalee(empreinte) {
    try {
      var m = JSON.parse(localStorage.getItem(CLE_MEMOIRE) || '{}');
      var t = m[empreinte];
      return !!(t && (Date.now() - t) < DELAI_REPETITION_MS);
    } catch (_) { return false; }
  }

  function memoriser(empreinte) {
    try {
      var m = JSON.parse(localStorage.getItem(CLE_MEMOIRE) || '{}');
      m[empreinte] = Date.now();
      // On ne garde que les 20 dernieres : inutile de faire grossir le storage.
      var cles = Object.keys(m).sort(function (a, b) { return m[b] - m[a]; }).slice(0, 20);
      var propre = {};
      cles.forEach(function (c) { propre[c] = m[c]; });
      localStorage.setItem(CLE_MEMOIRE, JSON.stringify(propre));
    } catch (_) { /* storage plein ou desactive : on n'empeche rien */ }
  }

  // L'identite sert a RAPPELER l'artisan, c'est tout. On lit l'email de la
  // session locale ; s'il n'y en a pas, l'alerte part quand meme en anonyme —
  // savoir qu'une panne existe vaut mieux que ne rien savoir.
  function identiteArtisan() {
    try {
      var cfg = window.__BATISPOT_CONFIG__ || {};
      var ref = String(cfg.SUPABASE_URL || '').match(/https:\/\/([^.]+)\./);
      if (!ref) return null;
      var s = JSON.parse(localStorage.getItem('sb-' + ref[1] + '-auth-token') || 'null');
      var u = s && (s.user || (s.currentSession && s.currentSession.user));
      return (u && u.email) || null;
    } catch (_) { return null; }
  }

  async function envoyer(sujet, donnees) {
    var cfg = window.__BATISPOT_CONFIG__ || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return false;
    try {
      var r = await fetch(cfg.SUPABASE_URL + '/functions/v1/notify-admin', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          apikey: cfg.SUPABASE_ANON_KEY,
          authorization: 'Bearer ' + cfg.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ subject: sujet, data: donnees }),
      });
      return r.ok;
    } catch (_) {
      // Une alerte qui echoue ne doit jamais casser l'ecran de l'artisan : il a
      // deja un probleme, on ne va pas lui en ajouter un.
      return false;
    }
  }

  /**
   * Signale une panne technique. A appeler dans le `catch` de tout appel serveur.
   * @param {{action:string, code?:string|number, detail?:string, mode?:string}} info
   */
  function bsSignalerPanne(info) {
    info = info || {};
    var page = (location.pathname.split('/').pop() || 'inconnue');
    var empreinte = page + '|' + (info.action || '?') + '|' + (info.code || '?');
    if (envoyeesCetteSession >= MAX_PAR_SESSION || dejaSignalee(empreinte)) return;
    envoyeesCetteSession++;
    memoriser(empreinte);

    envoyer('Panne app artisan — ' + (info.action || 'appel serveur'), {
      page: page,
      action: info.action || '',
      mode_serveur: info.mode || '',
      code: String(info.code == null ? '' : info.code),
      detail: String(info.detail || '').slice(0, 400),
      artisan: identiteArtisan() || 'non connecte',
      navigateur: navigator.userAgent.slice(0, 200),
      en_ligne: navigator.onLine ? 'oui' : 'non',
      // Pas de Date.now() lisible cote email sans fuseau : on envoie l'heure locale
      // de l'artisan, c'est elle qui compte pour le rappeler.
      heure_artisan: new Date().toLocaleString('fr-FR'),
    });
  }

  /**
   * Signale que l'artisan DIT que quelque chose ne marche pas. Declenche par
   * l'assistant (app-assistant.js) sur detection dans le message.
   * @param {{message:string, contexte?:string}} info
   */
  function bsSignalerPlainte(info) {
    info = info || {};
    if (envoyeesCetteSession >= MAX_PAR_SESSION) return;
    envoyeesCetteSession++;

    var email = identiteArtisan();
    envoyer('Un artisan signale un probleme', {
      page: (location.pathname.split('/').pop() || 'inconnue'),
      ce_qu_il_ecrit: String(info.message || '').slice(0, 600),
      contexte: String(info.contexte || '').slice(0, 600),
      artisan: email || 'non connecte',
      heure_artisan: new Date().toLocaleString('fr-FR'),
    });
  }

  // Detection de plainte. Volontairement etroite : on cherche des formulations
  // ou l'artisan dit qu'une action ECHOUE, pas le mot « probleme » tout seul
  // (« j'ai un probleme d'humidite sur ce mur » n'est pas un bug de l'app).
  var MOTIFS_PLAINTE = [
    /(ça|ca|cela|il|elle)\s+(ne\s+)?(marche|fonctionne)\s*(pas|plus)/i,
    /(marche|fonctionne)\s+pas/i,
    /(j'?arrive|jarrive)\s+pas\s+[àa]/i,
    /je\s+(n'?)?arrive\s+pas\s+[àa]/i,
    /(c'?est|cest)\s+(bloqu[ée]|planté|plante|fig[ée])/i,
    /(bug|bugue|plante|plant[ée])\b/i,
    /(rien\s+ne\s+se\s+passe|ne\s+se\s+passe\s+rien)/i,
    /(erreur|impossible)\s+(d'?envoyer|de\s+cr[ée]er|d'?enregistrer|de\s+charger)/i,
    /(l'?app|l'?application|le\s+site)\s+(bug|plante|rame|est\s+cass)/i,
  ];

  function bsEstUnePlainte(texte) {
    if (!texte || String(texte).length < 6) return false;
    var t = String(texte);
    return MOTIFS_PLAINTE.some(function (m) { return m.test(t); });
  }

  // ── APP FIGEE OU BLOQUEE ────────────────────────────────────────────────
  // Les trois formes de blocage ne produisent AUCUNE erreur, donc aucune alerte
  // avec ce qui precede. Il faut aller les chercher.

  /**
   * 1. La requete qui ne repond jamais.
   * Sans delai maximum, un serveur muet laisse l'ecran sur « en cours… » pour
   * toujours : pas d'exception, pas de catch, pas d'alerte, et l'artisan attend.
   * Ce wrapper transforme le silence en echec visible.
   */
  function bsFetchAvecDelai(url, options, delaiMs) {
    var ms = delaiMs || 30000;
    var ctrl = new AbortController();
    var minuteur = setTimeout(function () { ctrl.abort(); }, ms);
    var opts = Object.assign({}, options || {}, { signal: ctrl.signal });
    return fetch(url, opts)
      .catch(function (e) {
        if (e && e.name === 'AbortError') {
          var err = new Error('delai_depasse');
          err.delaiDepasse = true;
          err.delaiMs = ms;
          throw err;
        }
        throw e;
      })
      .finally(function () { clearTimeout(minuteur); });
  }

  /**
   * 2. Le fil principal gele.
   * Une boucle infinie ou un traitement trop lourd bloque tout : l'ecran ne
   * repond plus aux clics, mais rien n'est « en erreur ». On mesure la derive
   * d'un battement regulier — si un tic prevu toutes les 2 s arrive 8 s trop
   * tard, c'est que plus rien ne tournait pendant ce temps.
   */
  var BATTEMENT_MS = 2000;
  var SEUIL_GEL_MS = 8000;
  var dernierBattement = Date.now();
  setInterval(function () {
    var maintenant = Date.now();
    var derive = maintenant - dernierBattement - BATTEMENT_MS;
    dernierBattement = maintenant;
    // L'onglet mis en arriere-plan est ralenti par le navigateur : ce n'est pas
    // un gel, et le signaler noierait les vrais.
    if (document.hidden) return;
    if (!pageApplicative()) return;
    if (derive > SEUIL_GEL_MS) {
      bsSignalerPanne({
        action: 'application figee',
        code: 'gel',
        detail: "Le fil principal est reste bloque " + Math.round(derive / 1000) + " s.",
      });
    }
  }, BATTEMENT_MS);

  document.addEventListener('visibilitychange', function () {
    // Au retour d'arriere-plan, le compteur est fausse : on le remet a zero.
    if (!document.hidden) dernierBattement = Date.now();
  });

  /**
   * 3. L'ecran reste vide.
   * Une erreur pendant l'initialisation laisse une page blanche : l'artisan voit
   * un ecran mort, et nous ne voyons rien du tout.
   */
  window.addEventListener('load', function () {
    setTimeout(function () {
      // Uniquement dans l'app, et uniquement pour quelqu'un de connecte : une
      // page publique vue par un robot n'est pas un ecran mort d'artisan.
      if (!pageApplicative() || !identiteArtisan()) return;
      var texte = (document.body && document.body.innerText || '').trim();
      if (texte.length < 40) {
        bsSignalerPanne({
          action: 'ecran reste vide',
          code: 'vide',
          detail: 'Page chargee mais quasiment aucun contenu affiche apres 12 s ('
            + texte.length + ' caracteres).',
        });
      }
    }, 12000);
  });

  window.bsSignalerPanne = bsSignalerPanne;
  window.bsSignalerPlainte = bsSignalerPlainte;
  window.bsEstUnePlainte = bsEstUnePlainte;
  window.bsFetchAvecDelai = bsFetchAvecDelai;

  // Une page applicative = une page de /app/ ouverte par quelqu'un de connecte.
  // Les pages publiques (accueil, connexion, demande de devis) recoivent des
  // robots et des visiteurs de passage : y declencher des alertes noierait les
  // vraies pannes d'artisans.
  function pageApplicative() {
    return location.pathname.indexOf('/app/') !== -1;
  }

  // ── Erreurs JavaScript : deplacees dans app/js/app-erreurs.js (05/09/2026) ──
  //
  // Ce fichier avait ici deux ecouteurs `error` / `unhandledrejection` qui
  // envoyaient un e-mail via notify-admin a CHAQUE erreur. Deux defauts :
  //
  //  1. Aucune trace. L'e-mail parti, il ne restait rien : impossible de savoir
  //     si une erreur touche un artisan ou quarante, ni depuis quand elle dure.
  //  2. Le quota de notify-admin (5/min/IP) etait brule par le premier ecran qui
  //     boucle, ce qui MASQUAIT les autres pannes — l'inverse du but.
  //
  // `app-erreurs.js` les journalise maintenant dans la table `erreurs_front`,
  // dedoublonnees par signature et par jour, et ne declenche l'e-mail qu'a la
  // PREMIERE occurrence du jour. Les remontees ci-dessus (fil gele, ecran vide,
  // appel serveur en echec) restent ici : ce ne sont pas des erreurs JavaScript,
  // rien ne les leve, il faut aller les chercher.

})();

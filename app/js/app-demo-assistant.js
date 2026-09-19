// BatiSpot Pro — DÉMO DE L'ASSISTANT, six étapes sur l'écran réel.
//
// Demande de Moctar (08/09/2026) : « 1-6 devrait montrer l'assistant, 2-6 un
// devis à la voix avec la touche micro qui clignote, et ainsi de suite — ça
// devrait être une démo visuelle avec les zones où appuyer. »
//
// Ce que ce module N'EST PAS : les feuilles de texte de `app-demarrage.js`
// (« Ce que ça fait / Pourquoi ça compte / Faites-le maintenant »). Celles-là
// EXPLIQUENT. Celle-ci MONTRE : le reste de l'écran s'assombrit, la zone à
// toucher reste éclairée et pulse, une bulle dit la phrase en une ligne.
// L'artisan fait le VRAI geste — on ne simule aucun bouton.
//
// Pourquoi ça compte : « trop de fonctionnalités, trop long à apprendre »
// (Moctar, 06/09). Un artisan n'apprend pas une application en lisant, il
// l'apprend en touchant, une fois, au bon endroit.
//
// Les six étapes portent toutes sur l'ASSISTANT, pas sur le parcours devis →
// chantier → encaissement (arbitré avec Moctar le 08/09) :
//   1. L'étoile, présente sur chaque écran        → #bsAssistantBtn
//   2. Dicter un devis, micro qui pulse           → #bsAstMic
//   3. Ce qu'il propose selon l'écran ouvert      → #bsAstChips
//   4. Photographier plutôt que décrire           → #bsAstCam
//   5. Écrire une question métier                 → #bsAstInput
//   6. Rien ne part sans validation               → .bs-ast-valider (ou l'envoi)
//
// Mémoire : `pro_profiles.demarrage.demo_assistant` — même colonne jsonb que
// les guides, aucune migration. Vue une fois, elle ne revient pas ; le Menu
// garde de quoi la rejouer (window.bsDemoAssistant.rejouer).
//
// AUCUN écran nouveau, aucune commande déplacée : une surcouche par-dessus
// l'existant, qui se retire entièrement.
(function () {
  'use strict';

  var CLE = 'demo_assistant';

  // Une étape = une ancre réelle du DOM, une phrase, et ce qu'on attend.
  // `attend` : 'clic' = on avance quand l'artisan touche la zone ;
  //            'suite' = il avance lui-même avec le bouton.
  // `ouvre`  : ce qu'il faut avoir ouvert avant de pouvoir montrer la zone.
  var ETAPES = [
    {
      cible: '#bsAssistantBtn',
      titre: 'Votre assistant est ici',
      dit: 'Cette étoile vous suit sur tous les écrans. Touchez-la.',
      attend: 'clic',
    },
    {
      cible: '#bsAstMic',
      ouvre: 'assistant',
      titre: 'Dictez, ne tapez pas',
      dit: 'Maintenez le micro et décrivez les travaux comme à un collègue. Il en fait un devis.',
      attend: 'suite',
      pulse: true,
    },
    {
      cible: '#bsAstChips',
      ouvre: 'assistant',
      titre: 'Il regarde le même écran que vous',
      dit: 'Ces propositions changent selon ce que vous avez sous les yeux. Rien à chercher.',
      attend: 'suite',
    },
    {
      cible: '#bsAstCam',
      ouvre: 'assistant',
      titre: 'Une photo vaut une description',
      dit: 'La pièce à chiffrer, un ticket de caisse, un dégât : photographiez, il s’en occupe.',
      attend: 'suite',
    },
    {
      cible: '#bsAstInput',
      ouvre: 'assistant',
      titre: 'Posez-lui une question de métier',
      dit: '« Quel DTU pour un ragréage ? », « comment relancer un client qui ne répond pas ? »',
      attend: 'suite',
    },
    {
      cible: '#bsAstMessages',
      ouvre: 'assistant',
      titre: 'Par exemple',
      dit: 'Vous demandez, il répond avec vos chiffres — et propose la suite.',
      exemple: {
        q: 'Où en est le chantier Dupont ?',
        r: 'Exemple de réponse : « 3 étapes faites sur 5, fin prévue vendredi. Karim y est demain. Je préviens le client ? »',
      },
      attend: 'suite',
    },
    {
      cible: '#bsAstSend',
      ouvre: 'assistant',
      titre: 'Rien ne part sans vous',
      dit: 'Quand il propose une action, vous validez ou vous modifiez. Il n’enregistre jamais seul.',
      attend: 'suite',
      dernier: true,
    },
  ];

  var index = 0;
  var surcouche = null;
  var observateur = null;

  // ── Mémoire (même colonne jsonb que les guides de démarrage) ────────────
  async function client() {
    try {
      var m = await import('./supabase.js');
      return m && m.supabase ? m : null;
    } catch (e) { return null; }
  }

  async function dejaVue() {
    var m = await client();
    if (!m) return true; // sans base, on ne s'impose pas
    try {
      var s = await m.supabase.auth.getSession();
      var uid = s && s.data && s.data.session ? s.data.session.user.id : null;
      if (!uid) return true;
      var r = await m.supabase.from('pro_profiles').select('*').eq('pro_id', uid).maybeSingle();
      var d = r && r.data && r.data.demarrage;
      return !!(d && d[CLE] && d[CLE].vue);
    } catch (e) { return true; }
  }

  async function marquerVue() {
    var m = await client();
    if (!m) return;
    try {
      var s = await m.supabase.auth.getSession();
      var uid = s && s.data && s.data.session ? s.data.session.user.id : null;
      if (!uid) return;
      var r = await m.supabase.from('pro_profiles').select('*').eq('pro_id', uid).maybeSingle();
      var etat = (r && r.data && r.data.demarrage) || {};
      etat[CLE] = { vue: true, le: new Date().toISOString() };
      await m.supabase.from('pro_profiles').update({ demarrage: etat }).eq('pro_id', uid);
    } catch (e) { /* la démo a été vue, ne pas casser l'écran pour ça */ }
  }

  // ── La surcouche ────────────────────────────────────────────────────────
  function construire() {
    if (surcouche) return surcouche;
    surcouche = document.createElement('div');
    surcouche.className = 'bs-demo';
    surcouche.setAttribute('role', 'dialog');
    surcouche.setAttribute('aria-label', 'Démonstration de l’assistant');
    surcouche.innerHTML =
      '<div class="bs-demo-voile" aria-hidden="true">'
      + '<svg width="100%" height="100%"><defs><mask id="bsDemoMask">'
      + '<rect width="100%" height="100%" fill="white"/>'
      + '<rect id="bsDemoTrou" x="0" y="0" width="0" height="0" rx="14" fill="black"/>'
      + '</mask></defs>'
      + '<rect width="100%" height="100%" fill="rgba(16,28,22,.74)" mask="url(#bsDemoMask)"/>'
      + '</svg></div>'
      + '<div class="bs-demo-halo" id="bsDemoHalo" aria-hidden="true"></div>'
      + '<div class="bs-demo-bulle" id="bsDemoBulle">'
      + '  <p class="bs-demo-rang" id="bsDemoRang"></p>'
      + '  <h3 id="bsDemoTitre"></h3>'
      + '  <p class="bs-demo-dit" id="bsDemoDit"></p>'
      + '  <div class="bs-demo-ex" id="bsDemoEx" hidden><div class="bs-demo-ex-q" id="bsDemoExQ"></div><div class="bs-demo-ex-r" id="bsDemoExR"></div></div>'
      + '  <div class="bs-demo-pieds">'
      + '    <button type="button" class="bs-demo-passer" id="bsDemoPasser">Passer</button>'
      + '    <button type="button" class="bs-demo-retour" id="bsDemoRetour" aria-label="Étape précédente">‹ Retour</button>'
      + '    <button type="button" class="bs-demo-suite" id="bsDemoSuite">Suivant</button>'
      + '  </div>'
      + '</div>';
    document.body.appendChild(surcouche);
    document.getElementById('bsDemoPasser').addEventListener('click', terminer);
    document.getElementById('bsDemoSuite').addEventListener('click', suivant);
    // (12/09, Moctar : « avec le wizard on devrait pouvoir revenir en arrière »)
    document.getElementById('bsDemoRetour').addEventListener('click', precedent);
    // Échap ferme : une démo dont on ne sort pas est une prison.
    document.addEventListener('keydown', surEchap, true);
    return surcouche;
  }

  function surEchap(e) { if (e.key === 'Escape') terminer(); }

  /** Ouvre le panneau de l'assistant si l'étape en a besoin, et attend qu'il
   *  soit réellement dans le DOM — pas un délai fixe : on observe. */
  function assurerAssistantOuvert() {
    return new Promise(function (resolve) {
      if (document.getElementById('bsAstSheet')) {
        var b = document.getElementById('bsAssistantBtn');
        // Le panneau existe mais peut être fermé : la classe `on` le dit.
        if (b && !b.classList.contains('on')) b.click();
        return resolve();
      }
      var b2 = document.getElementById('bsAssistantBtn');
      if (b2) b2.click();
      var essais = 0;
      var t = setInterval(function () {
        if (document.getElementById('bsAstSheet') || ++essais > 40) {
          clearInterval(t); resolve();
        }
      }, 50);
    });
  }

  function placer(el) {
    var r = el.getBoundingClientRect();
    var marge = 8;
    var x = Math.max(0, r.left - marge), y = Math.max(0, r.top - marge);
    var w = r.width + marge * 2, h = r.height + marge * 2;

    // Le trou epouse la FORME du bouton : un carre autour d'une etoile ronde
    // se voit tout de suite (constate a l'ecran). On lit l'arrondi reel et on
    // ajoute la marge ; un bouton circulaire donne un trou circulaire.
    var rayonCss = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    var rond = rayonCss >= Math.min(r.width, r.height) / 2 - 1;
    var rayon = rond ? Math.max(w, h) / 2 : Math.min(rayonCss + marge, 18);

    var trou = document.getElementById('bsDemoTrou');
    trou.setAttribute('x', x); trou.setAttribute('y', y);
    trou.setAttribute('width', w); trou.setAttribute('height', h);
    trou.setAttribute('rx', rayon); trou.setAttribute('ry', rayon);

    var halo = document.getElementById('bsDemoHalo');
    halo.style.left = x + 'px'; halo.style.top = y + 'px';
    halo.style.width = w + 'px'; halo.style.height = h + 'px';
    halo.style.borderRadius = rayon + 'px';

    // La bulle se pose du côté où il y a de la place, jamais sur la zone.
    var bulle = document.getElementById('bsDemoBulle');
    var enBas = (y + h / 2) < window.innerHeight / 2;
    bulle.style.top = enBas ? (y + h + 14) + 'px' : '';
    bulle.style.bottom = enBas ? '' : (window.innerHeight - y + 14) + 'px';
  }

  async function montrer() {
    var et = ETAPES[index];
    if (!et) return terminer();
    construire();

    if (et.ouvre === 'assistant') await assurerAssistantOuvert();
    // iPhone (Alice, 12/09) : l'ouverture de l'assistant donne le focus au champ de
    // saisie → clavier à chaque étape, et le bouton Suivant passe dessous. Pendant la
    // démo, aucun champ ne garde le focus.
    setTimeout(function () { try { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); } catch (_) {} }, 350);

    var el = document.querySelector(et.cible);
    if (!el) {
      // Une ancre absente ne bloque pas la démo : on passe à la suivante.
      // (Un écran peut ne pas porter toutes les commandes.)
      console.warn('[demo] zone introuvable, étape passée :', et.cible);
      index++;
      return montrer();
    }

    document.getElementById('bsDemoRang').textContent = (index + 1) + ' sur ' + ETAPES.length;
    document.getElementById('bsDemoTitre').textContent = et.titre;
    document.getElementById('bsDemoDit').textContent = et.dit;
    document.getElementById('bsDemoSuite').textContent = et.dernier ? 'Terminer' : 'Suivant';
    document.getElementById('bsDemoRetour').hidden = index === 0;
    var ex = document.getElementById('bsDemoEx');
    ex.hidden = !et.exemple;
    if (et.exemple) {
      // (12/09, Moctar : « il faut que les phrases aient un sens ») La question de
      // l'exemple reprend la première proposition réelle de l'assistant (un vrai
      // chantier de l'artisan) ; la réponse reste un exemple, marqué comme tel.
      var puce = document.querySelector('#bsAstChips button, #bsAstChips .bs-ast-chip');
      var q = puce && puce.textContent.trim() ? puce.textContent.trim() : et.exemple.q;
      document.getElementById('bsDemoExQ').textContent = q;
      document.getElementById('bsDemoExR').textContent = et.exemple.r;
    }
    surcouche.classList.toggle('bs-demo-pulse', !!et.pulse);
    surcouche.classList.toggle('bs-demo-attend-clic', et.attend === 'clic');

    placer(el);
    // La zone reste cliquable pour de vrai : c'est tout l'intérêt.
    if (et.attend === 'clic') {
      el.addEventListener('click', suivant, { once: true });
    }

    // La page bouge (clavier, scroll, panneau qui s'ouvre) : on suit.
    if (observateur) observateur.disconnect();
    if (window.ResizeObserver) {
      observateur = new ResizeObserver(function () { placer(el); });
      observateur.observe(document.body);
    }
    window.addEventListener('resize', function () { placer(el); });
  }

  function suivant() { index++; montrer(); }
  function precedent() { if (index > 0) { index--; montrer(); } }

  function terminer() {
    document.body.classList.remove('bs-demo-en-cours');
    if (observateur) { observateur.disconnect(); observateur = null; }
    document.removeEventListener('keydown', surEchap, true);
    if (surcouche) { surcouche.remove(); surcouche = null; }
    index = 0;
    marquerVue();
  }

  async function lancer(force) {
    if (!document.getElementById('bsAssistantBtn')) return; // pas d'assistant ici
    // JAMAIS dans un navigateur pilote : le smoke de production conduit
    // l'appli comme un artisan, et une surcouche qui s'ouvre au milieu d'un
    // parcours le fait echouer (08/09 : 9/10 -> 6/10, trois parcours bloques).
    // `navigator.webdriver` vaut true sous Playwright/Puppeteer, jamais sur
    // le telephone d'un artisan.
    if (!force && navigator.webdriver) return;
    if (!force && await dejaVue()) return;
    // (12/09, retour d'Alice sur iPhone) La démo ne se marquait « vue » qu'à la fin :
    // bloquée à l'étape 6 par le clavier, elle redémarrait à CHAQUE chargement et
    // l'artisan ne pouvait plus rien faire d'autre. Vue = lancée une fois.
    if (!force) marquerVue();
    document.body.classList.add('bs-demo-en-cours');
    index = 0;
    montrer();
  }

  window.bsDemoAssistant = {
    rejouer: function () { lancer(true); },
    lancer: lancer,
  };

  // Première connexion : on laisse l'écran se poser avant de le recouvrir.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(lancer, 1200); });
  } else {
    setTimeout(lancer, 1200);
  }
})();

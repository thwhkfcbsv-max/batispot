// BatiSpot Pro — Tour Guidé Interactif Pas-à-Pas (Spotlight Contextuel)
// Guide l'artisan étape par étape en pointant directement sur chaque élément de l'écran

(function() {
  'use strict';

  // Cle PAR UTILISATEUR. Avec une cle globale, le deuxieme compte ouvert sur un
  // meme telephone n'aurait jamais la visite — precisement le cas d'un appareil
  // de test passe d'un testeur a l'autre. On lit l'identifiant depuis le jeton
  // range par supabase-js ; a defaut, on retombe sur l'ancienne cle globale.
  function uidCourant() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!/^sb-.*-auth-token$/.test(k)) continue;
        var j = JSON.parse(localStorage.getItem(k) || 'null');
        var u = j && (j.user || (j.currentSession && j.currentSession.user));
        if (u && u.id) return u.id;
      }
    } catch (_) { /* localStorage indisponible ou jeton illisible */ }
    return null;
  }
  const WIZARD_STORAGE_KEY = 'batispot_pro_spotlight_wizard_v3'
    + (uidCourant() ? ':' + uidCourant() : '');

  // Ordre voulu : l'assistant EN PREMIER. C'est le coeur du produit — il ne
  // repond pas a des questions, il fait le travail. L'ancienne version le
  // reléguait en 4/4 avec « posez une question, verifiez un prix », ce qui le
  // faisait passer pour une aide en ligne.
  //
  // Chaque etape accepte PLUSIEURS selecteurs : le tour tourne sur 5 pages qui
  // n'ont pas les memes elements, et une cible absente ne doit plus tuer la
  // visite (voir afficherEtape).
  const TOUR_STEPS = [
    {
      step: 1,
      // 09/09/2026 : `.bs-barre` / `.bs-barre-input` n'existent PLUS dans l'appli
      // (verifie en direct sur dashboard.html). L'assistant est devenu un bouton
      // flottant `#bsAssistantBtn`. Les deux premieres etapes retombaient donc
      // toutes les deux sur `#mqAssist`, la carte de suggestions : le cadre vert
      // designait la mauvaise zone. Moctar : « le wizard ne montre toujours pas
      // les zones en question ».
      targetSelector: '#bsAssistantBtn, .bs-assistant-fab, #mqAssist',
      title: "1/6 · Votre assistant fait le travail",
      desc: "Demandez-lui en français : <strong>« fais un devis pour 40 m² de peinture »</strong>, <strong>« planifie ce chantier jeudi »</strong>, <strong>« relance mon client »</strong>. Il ne se contente pas de répondre — <strong>il exécute</strong>.",
      position: 'top-left'
    },
    {
      step: 2,
      // Le micro n'est plus sur l'ecran : il est DANS le panneau de l'assistant.
      // On designe donc le bouton qui l'ouvre, et le texte le dit.
      targetSelector: '#bsAssistantBtn, .bs-assistant-fab, #mqAssist',
      title: "2/6 · Un devis en 30 secondes, à la voix",
      desc: "Ouvrez l'assistant, appuyez sur le <strong>micro</strong>, décrivez le chantier à voix haute, appuyez à nouveau pour envoyer. Votre devis se remplit seul, au juste prix, avec vos marges.",
      position: 'bottom'
    },
    {
      step: 3,
      // Cible le lien Profil du menu, ou la barre du bas a defaut : l'import
      // vit dans profile.html depuis le 31/08.
      targetSelector: 'a[href$="profile.html"], a[href$="devis.html"], #bottom-nav, .bn',
      title: "3/6 · Vos devis d'avant, vos prix à vous",
      desc: "Dans <strong>Mon Profil Artisan</strong>, déposez un ancien devis ou une facture (PDF ou photo) : les prix qui y sont écrits sont relus et versés dans votre grille. Vos chiffrages partent alors de <strong>vos tarifs</strong>, pas d'une moyenne.",
      position: 'bottom'
    },
    {
      step: 4,
      // Sur le tableau de bord — l'ecran d'ou part la visite — ni #lienMetreAR
      // ni a[href$="metre.html"] n'existent : le premier vit dans photos.html,
      // le second n'est lie nulle part. La liste retombait donc sur le lien
      // Photos, c'est-a-dire la cible de l'etape 5 : deux etapes eclairaient le
      // MEME bouton, et celle-ci designait autre chose que ce qu'elle racontait.
      // L'entree reelle du metre ici est le bouton « Photo Studio », qui appelle
      // openPhotoStudioModal('metre'). Le lien Photos a ete retire de la liste :
      // il appartient a l'etape suivante.
      targetSelector: '.bs-barre-cam, a[href$="metre.html"], a[href$="photos.html"], #bottom-nav, .bn',
      // On MONTRE cette etape meme sans WebXR : elle annonce ce qui arrive au
      // lieu de le cacher. Seul le texte change, pour ne rien promettre que
      // l'appareil ne sait faire aujourd'hui.
      title: "4/6 · Mesurez la pièce avec votre téléphone",
      desc: "Visez le sol, posez un point dans chaque angle : <strong>surface, périmètre, murs et plinthes</strong> sont calculés et versés dans le devis. Plus de mètre ruban, plus de calcul au retour.",
      descSansWebxr: "Visez le sol, posez un point dans chaque angle et la <strong>surface, le périmètre et les murs</strong> partent directement dans le devis.<br><br><strong>Pas encore sur votre iPhone :</strong> la mesure a besoin de la réalité augmentée, qu'Apple n'ouvre pas encore à Safari. Elle arrivera avec l'application BatiSpot. Elle fonctionne déjà sur Android.",
      position: 'bottom'
    },
    {
      step: 5,
      targetSelector: 'a[href$="photos.html"], #cards-area, #today-area, #scr-body > *:first-child',
      title: "5/6 · Vos chantiers, en photos",
      desc: "Photos <strong>avant / après</strong>, scan de vos <strong>tickets de caisse</strong> pour suivre les dépenses, et vos <strong>documents</strong> — décennale, Kbis — rangés au même endroit.",
      position: 'bottom'
    },
    {
      step: 6,
      targetSelector: '#bottom-nav, .bn',
      title: "6/6 · Tout est là, en bas",
      // La barre a change (app-nav.js, TABS) : elle porte Devis, Chantiers,
      // Planning, Finances, Messages. Le texte annoncait encore Photos et
      // Equipe, qui n'y sont plus, et oubliait Chantiers et Messages —
      // « wizard incomplet » (Moctar, 08/09). Photos vit sous Chantiers.
      desc: "<strong>Devis</strong>, <strong>Chantiers</strong>, <strong>Planning</strong>, <strong>Finances</strong> et <strong>Messages</strong>. Les photos et l'équipe se trouvent depuis Chantiers et le Menu. Et l'assistant reste disponible partout, à tout moment.",
      position: 'top'
    }
  ];

  let currentStep = 0;

  // Detection unique de la realite augmentee. Sert a masquer l'etape « metre »
  // sur les appareils qui ne peuvent pas l'utiliser (iPhone/Safari).
  window.__bsWebxrOk = false;
  (async function () {
    try { window.__bsWebxrOk = !!(navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')); }
    catch (_) { window.__bsWebxrOk = false; }
  })();

  function injectTourStyles() {
    if (document.getElementById('bs-tour-styles')) return;
    const style = document.createElement('style');
    style.id = 'bs-tour-styles';
    style.textContent = `
      /* L'overlay ne sert qu'a CAPTER LES CLICS : il doit rester transparent.
         Il portait un fond a 0.42 ET un backdrop-filter: blur(2px). Deux
         consequences, remontees par Moctar le 03/09 :
           - le flou s'appliquait a TOUTE la page, y compris a l'element mis en
             avant : l'encadre vert designait quelque chose d'illisible ;
           - son voile s'ajoutait a celui du spotlight (0.42 + 0.42), l'ecran
             etait deux fois plus sombre que prevu.
         C'est le box-shadow du spotlight qui fait le voile, et lui epargne la
         zone ciblee. */
      /* La barre de navigation d'Android et l'indicateur d'accueil d'iOS
         mangent le bas de l'ecran. La fonction env() ne se lit pas depuis
         JavaScript : on la fait calculer ici par le navigateur, et le
         placement de la carte relit ces deux valeurs. Un navigateur qui
         ignore env() garde 0px, donc le comportement d'avant. */
      :root {
        --bs-safe-bottom: env(safe-area-inset-bottom, 0px);
        --bs-safe-top: env(safe-area-inset-top, 0px);
      }
      .bs-tour-overlay {
        position: fixed;
        inset: 0;
        z-index: 9999;
        pointer-events: auto;
        display: none;
        background: transparent;
        transition: opacity 0.2s ease;
      }
      .bs-tour-overlay.open {
        display: block;
      }
      .bs-tour-spotlight {
        position: fixed;
        z-index: 10000;
        border-radius: 14px;
        /* Seul voile de l'ecran, donc un peu plus dense qu'avant — il faisait
           0.42 en doublon. Le halo vert reste, mais vers l'exterieur. */
        box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.58), 0 0 0 3px rgba(34, 197, 94, 0.35);
        border: 2.5px solid #22C55E;
        background: transparent;
        pointer-events: none;
        transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .bs-tour-card {
        position: fixed;
        z-index: 10001;
        background: #FFFFFF;
        width: 90%;
        max-width: 380px;
        border-radius: 16px;
        border: 2px solid #228B5B;
        box-shadow: 0 16px 40px rgba(0,0,0,0.3);
        padding: 16px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 10px;
        color: #1C2B22;
        font-family: "Inter", system-ui, -apple-system, sans-serif;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        animation: tourPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes tourPop {
        from { transform: scale(0.92); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .bs-tour-btn-primary {
        background: #228B5B;
        border: 1.5px solid #228B5B;
        color: #FFFFFF;
        font-weight: 800;
        font-size: 13px;
        padding: 10px 14px;
        border-radius: 10px;
        cursor: pointer;
        font-family: inherit;
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .bs-tour-btn-secondary {
        background: #FFFFFF;
        border: 1.5px solid #D3E3DA;
        color: #1C2B22;
        font-weight: 800;
        font-size: 12px;
        padding: 9px 12px;
        border-radius: 10px;
        cursor: pointer;
        font-family: inherit;
      }
    `;
    document.head.appendChild(style);
  }

  function initTourDOM() {
    if (document.getElementById('bsTourOverlay')) return;
    injectTourStyles();

    const overlay = document.createElement('div');
    overlay.id = 'bsTourOverlay';
    overlay.className = 'bs-tour-overlay';
    // 09/09/2026 (Moctar) : « quand je clique sur l'ecran de l'appli il
    // disparait alors que je n'ai pas eu le temps de voir ». C'etait
    // `overlay.onclick = closeTour` : le moindre clic hors de la carte fermait
    // la visite — y compris un clic sur la zone encadree, qui est justement le
    // geste que la visite invite a faire. On ne ferme plus par accident : le
    // clic hors carte fait AVANCER d'une etape, et on sort par la croix ou par
    // « Passer la visite », deliberement.
    overlay.onclick = () => { try { window.nextTourStep(); } catch (_) { /* fin de visite */ } };

    const spotlight = document.createElement('div');
    spotlight.id = 'bsTourSpotlight';
    spotlight.className = 'bs-tour-spotlight';

    const card = document.createElement('div');
    card.id = 'bsTourCard';
    card.className = 'bs-tour-card';
    card.onclick = (e) => e.stopPropagation();

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #E7EEEA;padding-bottom:8px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:24px;height:24px;border-radius:6px;background:#228B5B;color:#FFFFFF;display:flex;align-items:center;justify-content:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"/></svg>
          </div>
          <strong style="font-size:13px;color:#0F5132;" id="tourStepTitle">1/4 · Étape</strong>
        </div>
        <button type="button" onclick="closeTour()" aria-label="Fermer la visite guidee" title="Fermer" style="background:none;border:none;color:#5A7268;cursor:pointer;font-size:20px;font-weight:700;line-height:1;padding:2px 12px;min-width:44px;min-height:44px;">&times;</button>
      </div>

      <p style="margin:0;font-size:12.5px;color:#334155;line-height:1.45;" id="tourStepDesc"></p>

      <div style="display:flex;gap:6px;margin-top:4px;">
        <button type="button" class="bs-tour-btn-secondary" id="tourBtnPrev" onclick="prevTourStep()">Précédent</button>
        <button type="button" class="bs-tour-btn-primary" id="tourBtnNext" onclick="nextTourStep()">Suivant →</button>
      </div>

      <!-- Sortie ecrite en toutes lettres. La croix seule reste discrete pour
           qui decouvre l'application, et sur telephone il n'y a pas d'Echap :
           l'overlay couvre tout l'ecran, il faut une issue qu'on ne cherche pas. -->
      <div style="display:flex;justify-content:center;margin-top:2px;">
        <button type="button" onclick="closeTour()" style="background:none;border:none;color:#5A7268;cursor:pointer;font-size:12px;text-decoration:underline;padding:6px 10px;">Passer la visite</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(spotlight);
    document.body.appendChild(card);
  }

  // `sens` : +1 quand on avance, -1 quand on recule. Sans lui, une etape
  // sans cible visible renvoyait TOUJOURS vers l'avant — donc reculer de 3
  // vers 2 ramenait aussitot a 3, et « Precedent » paraissait mort.
  // (Moctar, 08/09 : « le bouton precedent ne fonctionne pas ».)
  function positionTour(idx, sens) {
    const pas = (sens === -1) ? -1 : 1;
    currentStep = Math.max(0, Math.min(idx, TOUR_STEPS.length - 1));
    const step = TOUR_STEPS[currentStep];

    // On cherche le premier element VISIBLE parmi les selecteurs, pas le
    // premier trouve : querySelector renvoyait le bouton de metre AR masque
    // sur iPhone, et l'etape sautait alors qu'un repli visible existait.
    const target = (function () {
      for (const sel of step.targetSelector.split(',')) {
        const el = document.querySelector(sel.trim());
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        if (r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden') return el;
      }
      return null;
    })();
    const spotlight = document.getElementById('bsTourSpotlight');
    const card = document.getElementById('bsTourCard');
    const titleEl = document.getElementById('tourStepTitle');
    const descEl = document.getElementById('tourStepDesc');
    const btnPrev = document.getElementById('tourBtnPrev');
    const btnNext = document.getElementById('tourBtnNext');

    if (!spotlight || !card) return;

    // Une cible absente ne doit PLUS interrompre la visite en silence.
    // Le tour tourne sur 5 pages : l'ancienne version faisait « return » des
    // qu'un element manquait, et l'etape Assistant — qui n'existe que sur
    // devis.html — tuait le tour sur les 4 autres pages. L'artisan ne voyait
    // jamais la fin, sans comprendre pourquoi.
    // Une cible peut EXISTER dans le DOM tout en etant masquee : c'est le cas
    // du bouton de metre AR sur iPhone (display:none faute de WebXR).
    // getBoundingClientRect() renvoie alors 0x0 et le cadre se poserait en haut
    // a gauche, sur rien. On traite « invisible » comme « absent ».
    const visible = (el) => {
      if (!el) return false;
      // ⚠️ NE PAS tester offsetParent : il vaut null pour tout element en
      // position:fixed — donc pour le bouton de l'assistant. Le tester faisait
      // sauter l'etape la plus importante de la visite (attrape en test le 28/08).
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      const s = window.getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    };
    if (!visible(target)) {
      // SECONDE CHANCE avant de sauter. Une cible peut n'etre pas encore posee
      // au moment ou l'on mesure : barre d'assistant injectee en JS, police en
      // cours de chargement, image qui pousse la mise en page. L'ancienne
      // version sautait aussitot et definitivement — la visite demarrait alors
      // a l'etape 3 en ayant l'air « mal calibree » (Moctar, 08/09).
      // ⚠️ BOUCLE INFINIE corrigee le 08/09 (Moctar : « le wizard ne montre
      // qu'une etape et passe »). Le drapeau etait remis a false DANS le
      // setTimeout, AVANT le rappel : la « seconde chance » se redonnait donc
      // a chaque tour, sans jamais sauter l'etape ni fermer la visite. Le
      // wizard tournait en rond sur la premiere cible manquante.
      // Le drapeau ne se leve qu'ICI, au 2e passage, quand on renonce.
      if (!positionTour._reessaye) {
        positionTour._reessaye = true;
        return setTimeout(function () { positionTour(idx, pas); }, 320);
      }
      positionTour._reessaye = false;
      const suivant = currentStep + pas;
      // On saute DANS LE SENS DE LA MARCHE. En reculant, si plus aucune etape
      // n'a de cible en amont, on reste ou l'on est plutot que de repartir en
      // avant : l'artisan a demande a revenir, pas a avancer.
      if (suivant >= 0 && suivant < TOUR_STEPS.length) return positionTour(suivant, pas);
      if (pas === -1) return;
      return window.closeTour();
    }

    // Cible trouvee : on rend sa seconde chance aux etapes suivantes.
    positionTour._reessaye = false;

    const rect = target.getBoundingClientRect();

    // Position spotlight around target element
    // Plafond volontaire : le 21/08, l'etape « barre du bas » encadrait un
    // element si haut que la visite donnait l'impression que le menu occupait
    // tout l'ecran — c'est ce qui avait fait desactiver le lancement auto.
    const hMax = Math.round(window.innerHeight * 0.35);
    const h = Math.min(rect.height + 12, hMax);
    spotlight.style.top = `${Math.max(4, rect.top - 6)}px`;
    spotlight.style.left = `${Math.max(4, rect.left - 6)}px`;
    spotlight.style.width = `${rect.width + 12}px`;
    spotlight.style.height = `${h}px`;

    // Populate content
    titleEl.textContent = step.title;
    // Texte adapte quand l'appareil n'a pas la realite augmentee : on annonce
    // la fonction et on explique franchement pourquoi elle n'est pas la.
    descEl.innerHTML = (!window.__bsWebxrOk && step.descSansWebxr) ? step.descSansWebxr : step.desc;

    btnPrev.style.visibility = currentStep === 0 ? 'hidden' : 'visible';
    btnNext.textContent = currentStep === TOUR_STEPS.length - 1 ? "Terminer la visite" : "Étape Suivante →";

    // Position la carte pres de la cible.
    //
    // POURQUOI ON MESURE AU LIEU DE SUPPOSER
    // Avant, la carte etait placee par son HAUT avec une hauteur devinee en
    // dur : `Math.min(window.innerHeight - 180, ...)` pour le bas, et des
    // reculs de 170/160 px pour le haut. Une etape au texte long — l'etape 3
    // en fait cinq lignes — depasse largement ces 180 px : la carte sortait
    // sous l'ecran et ses boutons « Precedent / Suivant » passaient derriere
    // la barre de navigation du telephone. Le visiteur ne pouvait plus avancer,
    // ni voir qu'il y avait quelque chose a cliquer.
    //
    // On lit donc la hauteur REELLE apres avoir pose le texte, et on garde la
    // carte entierement dans la zone sure. `env(safe-area-inset-bottom)` n'est
    // pas lisible en JS : on le fait calculer par le navigateur via une
    // propriete personnalisee, avec 0 en repli sur un navigateur qui l'ignore.
    const cardWidth = Math.min(window.innerWidth * 0.9, 380);
    const cardLeft = Math.max(16, (window.innerWidth - cardWidth) / 2);
    card.style.left = `${cardLeft}px`;

    const lireInset = (nom) => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(nom);
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };
    const basSur = lireInset('--bs-safe-bottom');
    const hautSur = lireInset('--bs-safe-top');
    const MARGE = 12;

    // ⚠️ L'ORDRE COMPTE. `maxHeight` etait pose APRES cette mesure : on
    // calculait donc le placement avec la hauteur NON bornee, et sur un petit
    // ecran la carte sortait par le bas (Moctar, 08/09 : « depasse de
    // l'ecran »). On borne D'ABORD, on mesure ENSUITE.
    card.style.maxHeight = `${Math.max(160, window.innerHeight - basSur - hautSur - 2 * MARGE)}px`;
    card.style.overflowY = 'auto';

    // La hauteur n'est connue qu'une fois le contenu pose ET borne :
    // `descEl.innerHTML` vient d'etre ecrit juste au-dessus.
    const hCarte = card.offsetHeight || 180;
    const hautMin = hautSur + MARGE;
    const hautMax = window.innerHeight - basSur - MARGE - hCarte;

    let haut;
    if (step.position === 'top' || step.position === 'top-left') {
      haut = rect.top - hCarte - 14;          // au-dessus de la cible
    } else {
      haut = rect.bottom + 14;                 // en dessous
    }

    // Si la carte ne tient nulle part (petit ecran, texte long), on la colle en
    // haut de la zone sure : mieux vaut un bas qui depasse et se defile qu'un
    // bloc de boutons invisible sous la barre systeme.
    card.style.top = `${hautMax < hautMin ? hautMin : Math.min(Math.max(haut, hautMin), hautMax)}px`;

  }

  window.openWizard = function(startIdx = 0) {
    // On marque la visite comme vue DES L'OUVERTURE, pas seulement a la
    // fermeture. Sinon un artisan qui quitte la page en cours de visite ne
    // pose jamais la cle, et le tour se relance a chaque retour sur le tableau
    // de bord — c'est ce que Moctar a constate le 29/08 en naviguant vers un
    // chantier puis en revenant.
    try { localStorage.setItem(WIZARD_STORAGE_KEY, 'true'); } catch (_) {}
    initTourDOM();
    document.getElementById('bsTourOverlay').classList.add('open');
    document.getElementById('bsTourSpotlight').style.display = 'block';
    document.getElementById('bsTourCard').style.display = 'flex';
    // 100 ms ne suffisaient pas : la barre d'assistant est injectee en JS et
    // la police se charge encore. On attend une image rendue PUIS un delai.
    requestAnimationFrame(() => setTimeout(() => positionTour(startIdx, 1), 350));
  };

  window.closeTour = function() {
    const overlay = document.getElementById('bsTourOverlay');
    const spotlight = document.getElementById('bsTourSpotlight');
    const card = document.getElementById('bsTourCard');
    if (overlay) overlay.classList.remove('open');
    if (spotlight) spotlight.style.display = 'none';
    if (card) card.style.display = 'none';
    localStorage.setItem(WIZARD_STORAGE_KEY, 'true');
  };

  window.closeWizard = window.closeTour;

  // Issue de secours. L'overlay est en position:fixed inset:0 avec
  // pointer-events:auto : tant qu'il est la, plus rien ne defile. Le 29/08,
  // le bouton de fermeture etait VIDE — aucun caractere entre les balises —
  // donc invisible. Gabriel s'est retrouve avec un ecran fige sans moyen d'en
  // sortir. Un seul chemin de sortie, et qui plus est invisible, ne suffit pas.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('bsTourOverlay')) window.closeTour();
  });

  window.nextTourStep = function() {
    if (currentStep < TOUR_STEPS.length - 1) {
      positionTour(currentStep + 1, 1);
    } else {
      closeTour();
      if (typeof showToast === 'function') {
        showToast("Visite terminée ! Vous pouvez relancer le guide à tout moment.");
      }
    }
  };

  window.prevTourStep = function() {
    if (currentStep > 0) {
      positionTour(currentStep - 1, -1);
    }
  };

  // Lancement AUTOMATIQUE a la premiere connexion (retabli le 28/08/2026).
  //
  // Il avait ete desactive le 21/08 pour deux raisons visuelles, corrigees ici :
  // l'ecran etait trop assombri (0.65 -> 0.42) et le spotlight pouvait encadrer
  // un element si haut qu'il semblait occuper tout l'ecran (plafonne a 35 %).
  //
  // Restrictions volontaires :
  //  - UNIQUEMENT sur le tableau de bord, la page d'arrivee apres connexion.
  //    Sinon la visite se declenche sur la premiere page ouverte, au milieu
  //    d'une tache.
  //  - UNE SEULE FOIS par appareil (localStorage).
  //  - Apres un delai, pour laisser la page finir de se rendre : un spotlight
  //    positionne sur un element pas encore en place tombe a cote.
  function lancerSiPremiereVisite() {
    // 07/09/2026 (Moctar) : « la visite guidee inutile pour nos instances, mais
    // pour les tests et clients officiels si ». Elle avait ete coupee le 03/09
    // parce qu'elle nous genait, nous ; un artisan qui decouvre l'appli n'a pas
    // le meme besoin qu'un fondateur qui la connait par coeur.
    //
    // « Nos instances » se reconnaissent au marqueur `bs-internal`, deja pose
    // par ?internal=1 sur toutes les pages (il sert a couper les statistiques).
    // Pas d'adresses e-mail en dur dans le code.
    try {
      if (localStorage.getItem('bs-internal') === '1') return;
    } catch (_) { /* pas de localStorage : on traite comme un vrai artisan */ }
    try {
      if (localStorage.getItem(WIZARD_STORAGE_KEY) === 'true') return;
      if (!/\/dashboard\.html$|\/dashboard$/.test(location.pathname)) return;
      // (audit 12/09, A37) : la visite s'ouvrait PAR-DESSUS le parcours de
      // démarrage (« Être prévenu ») — deux fenêtres superposées à l'arrivée.
      // On attend qu'aucune fenêtre ne soit ouverte, jusqu'à 90 s.
      var essais = 0;
      var tenter = function () {
        var ouverte = false;
        try {
          ouverte = Array.prototype.some.call(document.querySelectorAll('[role="dialog"], .bs-demarrage-overlay.open'), function (d) {
            var b = d.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !d.hidden;
          });
        } catch (_) {}
        if (!ouverte) { window.openWizard(0); return; }
        if (++essais < 45) setTimeout(tenter, 2000);
      };
      setTimeout(tenter, 1400);
    } catch (_) { /* localStorage indisponible : on ne lance rien */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lancerSiPremiereVisite);
  } else {
    lancerSiPremiereVisite();
  }

})();

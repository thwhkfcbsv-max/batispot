// BatiSpot — Barre « Dites-lui quoi faire » (tâche 9, 04/09/2026).
//
// POURQUOI CE FICHIER EXISTE
//
// Décision du fondateur du 04/09 : « assistant partout + écrans gardés ».
// Chaque écran artisan garde ses vues (devis, chantiers, planning…), mais
// l'entrée principale de l'appli devient une seule barre, sous l'en-tête,
// présente partout : texte, micro maintenu, photo. Elle ne fait rien
// elle-même — elle envoie à l'assistant existant (app-assistant.js), même
// moteur, même validation avant écriture. Ce module ne décide de rien
// d'autre que « où poser la barre » et « comment lui donner le texte ».
//
// MONTAGE
//
// app-nav.js (script classique, non différé) construit .ui-top dans .app-h
// et — en toute fin de sa fonction entete() — appelle
// `window.bsMonterBarre(h)` s'il existe déjà. Mais ce module est chargé en
// <script type="module">, donc différé par le navigateur : sur toutes les
// pages actuelles il s'exécute en réalité AVANT DOMContentLoaded, donc AVANT
// entete() (qui, elle, attend cet événement) — c'est cet appel-là qui arrive
// trop tôt (bsMonterBarre n'existe pas encore quand app-nav.js s'exécute) et
// ne fait rien. C'est pour ça que ce module se monte aussi tout seul, dès
// qu'il s'exécute : il cherche un point d'ancrage — .app-h + .ui-top (écrans
// avec bandeau logo), sinon .mq-top (écrans « maquette » sans .app-h :
// chantier.html, dm.html — un commentaire source dans ces pages le dit),
// sinon en dernier recours le premier <header> de la page — et attend
// l'apparition de cet ancrage au besoin sur quelques requestAnimationFrame,
// puis se monte. #bsBarre garde qu'une seule barre existe, quel que soit le
// nombre d'appels ou l'ordre d'exécution.
import { dicteeServeurDisponible, brancherBoutonMaintenu } from './app-dictee-serveur.js?v=2026_09_06b';
import { actualiserBadgeMessages } from './mq-thread.js?v=2026_09_06b';

// (06/09, Moctar) la barre n'est plus montée : le bouton flottant étoile la
// remplace et fait le switch IA / fonctionnalités (voir demarrer()).
const BARRE_MONTEE = false;

// ── Badge de non-lus sur l'onglet Messages, PARTOUT (Moctar, 05/09 23h30) ──
// Avant : actualiserBadgeMessages() n'était appelée que depuis les écrans de
// messagerie ; ailleurs, la barre du bas montrait la dernière valeur mise en
// cache — donc jamais un message reçu pendant qu'on était sur Devis ou
// Finances. Ce module est chargé sur les 12 écrans artisan : c'est le bon
// endroit. Une requête au chargement, puis toutes les 60 s tant que l'onglet
// est visible, et au retour au premier plan. Trois « count exact / head » :
// aucune ligne rapatriée, coût négligeable.
(function badgeMessagesPartout() {
  let timer = null;
  const maj = () => { actualiserBadgeMessages().catch(() => {}); };
  const lancer = () => {
    if (timer) return;
    maj();
    timer = setInterval(maj, 60 * 1000);
  };
  const stopper = () => { if (timer) { clearInterval(timer); timer = null; } };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') lancer(); else stopper();
  });
  // app-nav.js ne pose le badge qu'au rendu de la barre (DOMContentLoaded) ;
  // s'il n'est pas encore là, la valeur est en cache et sera lue au rendu.
  if (document.visibilityState !== 'hidden') lancer();
})();

// ── Reprise après une photo qui a tué la page (Moctar, Android, 05/09) ─────
// Hypothèse consignée : pendant l'appareil photo, Android ferme l'onglet ;
// au retour, la PWA redémarre sur sa page de départ et l'artisan « se
// retrouve au chantier ». app-assistant.js pose un témoin AVANT d'ouvrir
// la caméra (bs_photo_en_cours : url de l'écran, action, heure) et l'efface
// dès que la photo revient ou que le sélecteur est annulé. S'il est encore
// là au démarrage, moins de 5 min après, c'est que la page est morte entre
// les deux : on ramène l'artisan sur l'écran d'où il était parti et on le
// lui dit, plutôt que de le laisser deviner.
(function reprisePhoto() {
  let t = null;
  try { t = JSON.parse(localStorage.getItem('bs_photo_en_cours') || 'null'); } catch (_) { t = null; }
  if (!t || !t.url || !t.t) return;
  try { localStorage.removeItem('bs_photo_en_cours'); } catch (_) {}
  if (Date.now() - t.t > 5 * 60 * 1000) return;
  const ici = location.pathname + location.search;
  let la = ici;
  try { const u = new URL(t.url, location.href); la = u.pathname + u.search; } catch (_) {}
  if (la !== ici) {
    // On repart sur l'écran d'origine ; le message y sera montré au montage
    // (le témoin « à annoncer » ne survit qu'à cette navigation).
    try { sessionStorage.setItem('bs_photo_perdue', '1'); } catch (_) {}
    location.replace(t.url);
    return;
  }
  try { sessionStorage.setItem('bs_photo_perdue', '1'); } catch (_) {}
})();
// Sans barre, le message « photo perdue » passe par la feuille de l'assistant.
(function annoncerPhotoPerdue() {
  let due = false;
  try { due = sessionStorage.getItem('bs_photo_perdue') === '1'; } catch (_) {}
  if (!due) return;
  let essais = 0;
  (function essayer() {
    if (typeof window.bsAssistantDireBot === 'function') {
      try { sessionStorage.removeItem('bs_photo_perdue'); } catch (_) {}
      window.bsAssistantDireBot('La photo n’est pas revenue : l’appareil photo a fermé BatiSpot. Réessayez.');
      return;
    }
    if (++essais < 40) setTimeout(essayer, 250);
  })();
})();

const PLACEHOLDER = {
  devis: 'Dictez un devis, ou demandez…',
  chantiers: 'Que faire aujourd’hui ?',
  chantier: 'Une étape, une photo, une facture pour ce chantier…',
  planning: 'Décalez, assignez, planifiez…',
  photos: 'Photo avant, après, ticket…',
  finances: 'Facture, relance, dépense…',
  equipe: 'Inviter, assigner, charge de la semaine…',
  messages: 'Relancer un client, écrire à l’équipe…',
};
const PLACEHOLDER_DEFAUT = 'Dites-lui quoi faire…';

function placeholderPage(page) {
  return PLACEHOLDER[page] || PLACEHOLDER_DEFAUT;
}

function monter(h) {
  if (!h || document.getElementById('bsBarre')) return;
  const page = (typeof window.bsContexteEcran === 'function' ? window.bsContexteEcran().page : '') || '';
  const ph = placeholderPage(page);

  const b = document.createElement('form');
  b.id = 'bsBarre';
  b.className = 'bs-barre';
  b.setAttribute('role', 'search');
  // Un BOUTON, pas un champ (Moctar, 05/09 : « remplacer la barre de recherche
  // par un bouton assistant, ce serait plus logique ») : depuis que le toucher
  // ouvre la feuille, un champ qui ressemble à une zone de saisie mentait.
  // La phrase du contexte reste dessous : c'est elle qui apprend quoi demander.
  b.innerHTML = `<span class="bs-barre-ico">${window.bsIcon ? window.bsIcon('spark', 18) : ''}</span>
    <button type="button" class="bs-barre-input bs-barre-btn-assistant" aria-label="Ouvrir l’assistant BatiSpot"><b>Assistant BatiSpot</b><small>${ph}</small></button>
    <button type="button" class="bs-barre-btn bs-barre-mic" aria-label="Maintenir pour dicter">${window.bsIcon ? window.bsIcon('mic', 20) : ''}</button>
    <button type="button" class="bs-barre-btn bs-barre-cam" aria-label="Photo">${window.bsIcon ? window.bsIcon('camera', 20) : ''}</button>`;

  // h est l'ancre trouvée par essayerMontageAutonome (.app-h, .mq-top ou un
  // <header>) : c'est une rangée d'en-tête, la barre doit passer SOUS elle,
  // pas dedans — d'où insertAdjacentElement('afterend', …) sur l'ancre
  // elle-même (jamais sur un élément interne à cette rangée, comme .ui-top).
  h.insertAdjacentElement('afterend', b);

  const input = b.querySelector('.bs-barre-input');
  // Le bouton n'a pas de valeur : les fonctions ci-dessous lisent/écrivent
  // `value` comme avant, sur un objet inerte.
  if (input.tagName !== 'INPUT') { input.value = ''; }
  // `placeholder` sur le bouton = le <small> de la phrase de contexte : les
  // handlers micro/dictée écrivent dedans comme sur un vrai champ.
  if (input.tagName !== 'INPUT') {
    const small = input.querySelector('small');
    Object.defineProperty(input, 'placeholder', {
      get: () => (small ? small.textContent : ''),
      set: (v) => { if (small) small.textContent = v; },
    });
  }
  // Retour d'une photo qui a fait mourir la page (voir reprisePhoto).
  try {
    if (sessionStorage.getItem('bs_photo_perdue') === '1') {
      sessionStorage.removeItem('bs_photo_perdue');
      input.placeholder = 'La photo n’est pas revenue (l’appareil photo a fermé BatiSpot). Réessayez.';
      setTimeout(() => { input.placeholder = ph; }, 8000);
    }
  } catch (_) {}
  const mic = b.querySelector('.bs-barre-mic');
  const cam = b.querySelector('.bs-barre-cam');
  document.body.classList.add('bs-barre-presente');
  // Le rond flottant revient dès que la barre est sortie de l'écran (Moctar,
  // 05/09 : « quand je scrolle je ne vois plus le bandeau… remettre l'icône
  // au niveau du pouce »). Visible = pas de rond ; hors écran = rond.
  try {
    new IntersectionObserver((entries) => {
      document.body.classList.toggle('bs-barre-visible', entries.some((e) => e.isIntersecting));
    }, { threshold: 0.2 }).observe(b);
  } catch (_) { document.body.classList.add('bs-barre-visible'); }

  // Toucher le champ = ouvrir la conversation de l'assistant, clavier dans
  // SON champ (Moctar, 05/09 : « quand je clique dessus je veux que ça ouvre
  // l'assistant, pour qu'on voie notamment ce qu'on tape »). La barre reste
  // le point d'entrée visible ; on tape et on lit la réponse au même endroit.
  // Le texte déjà présent (dictée, retour arrière) suit dans la feuille. Si
  // app-assistant.js n'est pas là, le champ reste un champ normal : le
  // submit ci-dessous garde son repli.
  const ouvrirFeuille = () => {
    if (typeof window.bsAssistantOuvrirSaisie === 'function') {
      const t = input.value || '';
      input.value = '';
      if (typeof input.blur === 'function') input.blur();
      window.bsAssistantOuvrirSaisie(t);
    } else {
      const btn = document.getElementById('bsAssistantBtn');
      if (btn) btn.click();
    }
  };
  input.addEventListener('click', ouvrirFeuille);
  input.addEventListener('focus', () => { if (input.tagName === 'INPUT') ouvrirFeuille(); });

  b.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    // app-assistant.js peut ne pas encore être chargé/exécuté (ordre de
    // scripts, échec réseau) : sans garde, la question tapée disparaît sans
    // aucun retour pour l'artisan. On retombe sur l'ouverture de la fenêtre
    // assistant (le FAB #bsAssistantBtn) plutôt que d'échouer en silence.
    if (typeof window.bsAssistantEnvoyerQuestion === 'function') {
      window.bsAssistantEnvoyerQuestion(q);
    } else {
      const btn = document.getElementById('bsAssistantBtn');
      if (btn) btn.click();
    }
  });

  // Ceinture et bretelles : sur un test DevTools en émulation mobile, Entrée
  // seule n'a pas déclenché le submit du formulaire (constaté le 04/09) alors
  // que requestSubmit() marche à tous les coups. On force donc l'envoi sur
  // Entrée sans Shift (Shift+Entrée reste réservé à une future ligne
  // multiple), en laissant le handler submit ci-dessus gérer la garde
  // « texte vide ».
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      b.requestSubmit();
    }
  });

  cam.addEventListener('click', () => {
    if (typeof window.bsAssistantOuvrirPhoto === 'function') window.bsAssistantOuvrirPhoto('metre');
  });

  if (dicteeServeurDisponible()) {
    brancherBoutonMaintenu(mic, {
      contexte: 'assistant',
      texteAvant: () => input.value,
      onDebut: () => {
        mic.classList.add('on');
        input.placeholder = 'Je vous écoute… relâchez pour envoyer';
      },
      onAttente: () => {
        input.placeholder = 'Je transcris…';
      },
      // brancherBoutonMaintenu résout onFin avec un OBJET { id, texte,
      // incertain, tropCourt? } — jamais une chaîne nue (voir
      // app-dictee-serveur.js:~185). Texte vide (silence, appui trop court,
      // erreur avalée) → on n'envoie rien, le placeholder de la page revient.
      onFin: (res) => {
        mic.classList.remove('on');
        input.placeholder = ph;
        const texte = res && typeof res.texte === 'string' ? res.texte.trim() : '';
        if (texte) window.bsAssistantEnvoyerQuestion(texte);
      },
      onErreur: (msg) => {
        mic.classList.remove('on');
        input.placeholder = msg || ph;
      },
      // Premier appui sur Android : l'autorisation du micro a été demandée
      // seule (voir app-dictee-serveur.js) ; on le dit, sans rien enregistrer.
      onInfo: (msg) => {
        mic.classList.remove('on');
        input.placeholder = msg || ph;
        setTimeout(() => { if (input.placeholder === msg) input.placeholder = ph; }, 6000);
      },
    });
  } else {
    mic.addEventListener('click', () => {
      if (typeof window.bsAssistantDicter === 'function') window.bsAssistantDicter();
    });
  }
}

// app-nav.js appelle aussi bsMonterBarre() en fin d'entete() : même garde.
window.bsMonterBarre = BARRE_MONTEE ? monter : function () {};

// Le micro de la feuille assistant (app-assistant.js, script classique) veut
// la même dictée serveur « maintenir » que cette barre. On lui tend le
// brancheur, dans les deux ordres de chargement possibles.
if (dicteeServeurDisponible()) {
  window.bsBrancherMicServeur = brancherBoutonMaintenu;
  if (typeof window.bsAssistantMicServeurPret === 'function') window.bsAssistantMicServeurPret(brancherBoutonMaintenu);
}

// Une ancre n'est utilisable que si elle est RÉELLEMENT à l'écran.
//
// Bug trouvé par le test de fumée du 05/09/2026 (parcours 8) : sur
// devis.html, la première .mq-top de la page est celle de la modale
// #quoteDetailModal — fermée tant qu'aucun devis n'est ouvert. La barre s'y
// montait, mesurait 0 × 0, et l'artisan n'avait aucun moyen de parler à
// l'assistant depuis l'écran Devis. Mesuré : dashboard/messages/planning/
// finances 358 × 54 px, devis 0 × 0.
//
// On écarte donc toute ancre posée dans un sous-arbre masqué : attribut
// `hidden`, `aria-hidden="true"`, modale/`role=dialog` non ouverte, ou boîte
// de taille nulle (ce qui couvre display:none hérité, y compris quand la
// modale est cachée par une règle CSS sans classe d'état).
function ancreOuverte(n) {
  if (n.tagName === 'DIALOG') return n.open;
  const modale = n.classList.contains('modal')
    || n.classList.contains('modal-overlay')
    || n.getAttribute('role') === 'dialog';
  if (!modale) return true;
  return n.classList.contains('open') || n.classList.contains('show')
    || n.classList.contains('active') || n.classList.contains('visible');
}

function ancreVisible(el) {
  if (!el || !el.isConnected) return false;
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (n.hasAttribute('hidden')) return false;
    if (n.getAttribute('aria-hidden') === 'true') return false;
    if (!ancreOuverte(n)) return false;
  }
  const st = window.getComputedStyle(el);
  if (st.display === 'none' || st.visibility === 'hidden') return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function premiereVisible(sel, filtre) {
  const els = document.querySelectorAll(sel);
  for (let i = 0; i < els.length; i += 1) {
    const el = els[i];
    if (filtre && !filtre(el)) continue;
    if (ancreVisible(el)) return el;
  }
  return null;
}

function trouverAncre() {
  // 1) écrans avec bandeau logo : .ui-top est ajouté dans .app-h par
  //    entete() (app-nav.js) — le cas nominal, on le prend en premier.
  const avecUiTop = premiereVisible('.app-h', (h) => !!h.querySelector('.ui-top'));
  if (avecUiTop) return avecUiTop;
  // 2) écrans « maquette » sans .app-h (chantier.html, dm.html) : leur
  //    repère de retour est .mq-top, présent dans le HTML statique dès le
  //    départ. On ne prend que la première VISIBLE : sur devis.html celles
  //    des modales fermées sont écartées.
  const mqTop = premiereVisible('.mq-top');
  if (mqTop) return mqTop;
  // 3) .app-h visible mais pas encore garni par entete() : ce module est un
  //    module ES, il s'exécute AVANT DOMContentLoaded donc avant entete().
  //    L'en-tête de page reste une bien meilleure ancre qu'un <header> de
  //    modale, et le point d'insertion (afterend de .app-h) est le même que
  //    dans le cas 1 — .ui-top s'ajoutera dedans juste après, sans déplacer
  //    la barre.
  const appH = premiereVisible('.app-h');
  if (appH) return appH;
  // 4) dernier recours, si une page future n'a ni l'un ni l'autre.
  const header = premiereVisible('header');
  if (header) return header;
  return null;
}

function essayerMontageAutonome(tentative) {
  if (document.getElementById('bsBarre')) return;
  const h = trouverAncre();
  if (h) {
    monter(h);
    return;
  }
  // Aucune ancre VISIBLE pour l'instant : on réessaie. Le plafond est monté
  // de 10 à 60 images (~1 s) parce que le filtre de visibilité peut
  // légitimement écarter toutes les ancres pendant les premières images
  // (modale encore fermée, en-tête pas encore construit) — avec 10 essais on
  // risquait de renoncer avant que l'écran soit prêt.
  if ((tentative || 0) < 60) requestAnimationFrame(() => essayerMontageAutonome((tentative || 0) + 1));
}

// (06/09, Moctar) « on va enlever le bouton BatiSpot, on va le remplacer par
// le bouton flottant étoile sur tous les écrans ; c'est ça qui fera le
// switch entre les 2 modes, IA et fonctionnalités ». La barre n'est donc
// plus montée. Ce module reste chargé pour ce qu'il porte d'autre : badge
// Messages partout, reprise après photo, dictée serveur tendue à la feuille.
function demarrer() {
  if (!BARRE_MONTEE) return;
  essayerMontageAutonome(0);
}

// Ce module s'exécute avant DOMContentLoaded (module ES = différé) : on lance
// tout de suite, ET on relance sur DOMContentLoaded / load au cas où l'ancre
// n'apparaisse qu'après (entete() d'app-nav.js, rendu tardif). #bsBarre
// garantit qu'une seule barre existe quel que soit le nombre d'appels.
demarrer();
if (document.readyState !== 'complete') {
  document.addEventListener('DOMContentLoaded', demarrer);
  window.addEventListener('load', demarrer);
}

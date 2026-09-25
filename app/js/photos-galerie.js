// Photos de chantier en trois temps — Début · Pendant · Fin (06/09/2026)
// ─────────────────────────────────────────────────────────────────────────
// Proposition validée par le fondateur (« Photos de chantier en trois
// temps ») : l'artisan ne connaît qu'UN vocabulaire, choisit le temps d'un
// tap, prend plusieurs photos d'affilée, et RIEN ne part chez le client sans
// son geste — sélection dans la galerie, puis « Envoyer au client ». Le
// comparateur avant / après se compose avec deux photos envoyées qu'il
// marque « Avant » et « Après ».
//
// Ce module est la SEULE implémentation de la galerie : chantier.html
// (onglet Photos) et photos.html (Photo Studio) l'importent tous les deux.
// Un correctif ici vaut pour les deux écrans — pas de jumeau à oublier.
//
// En base, `photos.phase` garde avant / pendant / apres ; seuls les mots
// changent. « autre » (03/09) n'existe plus à l'écran : traité comme pendant.
// Colonnes ajoutées par app/supabase-photos-client-2026-09-06.sql :
//   visible_client boolean (défaut false) — la photo est sur la page client ;
//   role_client    'avant' | 'apres'      — sa place dans le comparateur.
// Tant que la migration n'est pas appliquée, ces champs sont absents : la
// galerie s'affiche quand même, et l'action « Envoyer au client » explique
// que la base doit être mise à jour — rien n'est envoyé (repli sûr).

export const PHASE_LABEL = { avant: 'Début', pendant: 'Pendant', apres: 'Fin' };
export const PHASES_ORDRE = ['avant', 'pendant', 'apres'];

/** Valeur de base garantie : tout ce qui n'est ni début ni fin est « pendant ». */
export function normaliserPhase(phase) {
  return phase === 'avant' || phase === 'apres' ? phase : 'pendant';
}

/** Libellé du bouton principal : il répète le temps choisi. */
export function libelleBoutonPhotos(phase) {
  return `Photos « ${PHASE_LABEL[normaliserPhase(phase)]} »`;
}

// Le temps proposé suit le chantier : Début avant la première étape,
// Pendant ensuite, Fin quand la dernière étape est cochée. Sans aucune
// étape connue, rien n'a commencé : Début — l'artisan corrige d'un tap.
export function deduirePhase(taches) {
  const liste = Array.isArray(taches) ? taches : [];
  if (!liste.length) return 'avant';
  const faites = liste.filter((t) => t && t.statut === 'termine').length;
  if (faites === 0) return 'avant';
  if (faites === liste.length) return 'apres';
  return 'pendant';
}

export function compterParPhase(photos) {
  const compte = { avant: 0, pendant: 0, apres: 0 };
  (photos || []).forEach((p) => { compte[normaliserPhase(p && p.phase)] += 1; });
  return compte;
}

// ── Formats ──────────────────────────────────────────────────────────────
export function heureCourte(iso) {
  const d = new Date(iso || '');
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
/** « mer. 2 sept. » — en-tête de groupe de la galerie. */
export function jourLabelPhoto(jourIso) {
  if (!jourIso) return 'date inconnue';
  const d = new Date(jourIso.length === 10 ? jourIso + 'T00:00:00' : jourIso);
  if (isNaN(d)) return 'date inconnue';
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}
/** « 2 sept. » — légendes du comparateur. */
export function jourCourtAvap(iso) {
  const d = new Date(iso || '');
  if (isNaN(d)) return 'date inconnue';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Les anciennes photos portaient le mot de leur phase en légende (« Avant »,
// « Réception », « Autre »…) : ce n'est pas une légende, c'est l'ancien
// vocabulaire. On montre l'heure de prise à la place.
const LEGENDES_HERITEES = new Set(['avant', 'pendant', 'après', 'apres', 'réception', 'reception', 'autre', 'début', 'debut', 'fin']);
export function legendeTuile(p) {
  const cap = String((p && p.caption) || '').trim();
  if (cap && !LEGENDES_HERITEES.has(cap.toLowerCase())) return cap;
  return heureCourte(p && p.taken_at);
}

// ── Icônes (trait 2,2 px, jamais d'emoji — règle du 04/09) ───────────────
const ICONES = {
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  retirer: '<path d="M17 3H7a2 2 0 0 0-2 2v16l7-4 7 4V5a2 2 0 0 0-2-2z"/><line x1="9" y1="9" x2="15" y2="9"/>',
  avant: '<polyline points="11 17 6 12 11 7"/><line x1="18" y1="12" x2="6" y2="12"/>',
  apres: '<polyline points="13 7 18 12 13 17"/><line x1="6" y1="12" x2="18" y2="12"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
};
export function iconePhoto(nom, taille = 18) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + taille + '" height="' + taille
    + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"'
    + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + (ICONES[nom] || '') + '</svg>';
}

// ── Erreurs ──────────────────────────────────────────────────────────────
// Colonne absente (migration non appliquée) : PostgREST répond PGRST204 sur
// un update, Postgres 42703 sur un filtre. On le dit clairement — et rien
// n'a été envoyé, c'est le repli voulu.
export function expliquerErreurPhotos(e, fallback) {
  const code = String((e && e.code) || '');
  const msg = String((e && e.message) || e || '');
  if (code === 'PGRST204' || code === '42703' || /visible_client|role_client/.test(msg)) {
    return "La base doit être mise à jour (photos côté client) — rien n'a été envoyé.";
  }
  if ((typeof navigator !== 'undefined' && navigator.onLine === false) || e instanceof TypeError) {
    return 'Pas de connexion — réessayez une fois connecté.';
  }
  return msg || fallback || 'Action impossible pour le moment.';
}

// ── Trois cases : Début · Pendant · Fin ──────────────────────────────────
// Le temps proposé est surligné (déduit de l'avancement, mais DIT), chaque
// case porte son compte. Un tap change le temps courant.
export function rendreCasesTemps(conteneur, { photos, phaseChoisie, phaseProposee, onChoisir }) {
  if (!conteneur) return;
  const compte = compterParPhase(photos);
  const choisie = normaliserPhase(phaseChoisie);
  conteneur.replaceChildren();
  PHASES_ORDRE.forEach((phase) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(phase === choisie));
    b.dataset.phase = phase;
    if (phase === choisie) b.classList.add('on');
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = PHASE_LABEL[phase];
    const s = document.createElement('span');
    s.className = 's';
    const nb = compte[phase];
    let sous = nb === 0 ? 'aucune' : nb === 1 ? '1 photo' : `${nb} photos`;
    if (phase === phaseProposee) sous += ' · en cours';
    s.textContent = sous;
    b.append(n, s);
    b.addEventListener('click', () => { if (typeof onChoisir === 'function') onChoisir(phase); });
    conteneur.appendChild(b);
  });
}

// ── Groupes de la galerie ────────────────────────────────────────────────
// Par temps + jour, le plus récent en premier : « Pendant · mer. 2 sept. ».
export function grouperPhotos(photos) {
  const groupes = new Map();
  (photos || []).forEach((p) => {
    if (!p) return;
    const jourIso = String(p.taken_at || '').slice(0, 10);
    const phase = normaliserPhase(p.phase);
    const cle = `${jourIso}|${phase}`;
    if (!groupes.has(cle)) groupes.set(cle, { phase, jourIso, photos: [] });
    groupes.get(cle).photos.push(p);
  });
  const rang = { apres: 0, pendant: 1, avant: 2 };
  return [...groupes.values()]
    .map((g) => {
      g.photos.sort((a, b) => new Date(b.taken_at || 0) - new Date(a.taken_at || 0));
      return g;
    })
    .sort((a, b) => (b.jourIso.localeCompare(a.jourIso)) || (rang[a.phase] - rang[b.phase]));
}

// ── Avant / après (ce que voit le client) ────────────────────────────────
// Ce ne sont plus « la première photo de début et la dernière de fin » :
// ce sont les deux photos que l'artisan a MARQUÉES « Avant » et « Après ».
export function choisirAvantApresClient(photos) {
  const liste = (photos || []).filter((p) => p && p.url);
  return {
    avant: liste.find((p) => p.role_client === 'avant') || null,
    apres: liste.find((p) => p.role_client === 'apres') || null,
  };
}

// Comparateur au curseur : la photo « après » est superposée à la photo
// « avant », un masque clip-path la découvre jusqu'au curseur. Classes
// mq-avap-* (déclarées dans chaque page qui l'affiche).
export function construireComparateurAvap(avant, apres) {
  const box = document.createElement('div');
  box.className = 'mq-avap';

  const imgAvant = document.createElement('img');
  imgAvant.className = 'mq-avap-img mq-avap-before';
  imgAvant.src = avant.url;
  imgAvant.loading = 'lazy';
  imgAvant.alt = 'Avant';

  const imgApres = document.createElement('img');
  imgApres.className = 'mq-avap-img mq-avap-after';
  imgApres.src = apres.url;
  imgApres.loading = 'lazy';
  imgApres.alt = 'Après';

  const capAvant = document.createElement('span');
  capAvant.className = 'mq-avap-cap mq-avap-cap-before';
  capAvant.textContent = `Avant · ${jourCourtAvap(avant.taken_at)}`;

  const capApres = document.createElement('span');
  capApres.className = 'mq-avap-cap mq-avap-cap-after';
  capApres.textContent = `Après · ${jourCourtAvap(apres.taken_at)}`;

  const div = document.createElement('div');
  div.className = 'mq-avap-div';
  const handle = document.createElement('div');
  handle.className = 'mq-avap-handle';

  const range = document.createElement('input');
  range.type = 'range';
  range.className = 'mq-avap-range';
  range.min = '0';
  range.max = '100';
  range.value = '50';
  range.setAttribute('aria-label', 'Comparer avant et après');

  const majPosition = (val) => {
    imgApres.style.clipPath = `inset(0 0 0 ${val}%)`;
    div.style.left = `${val}%`;
    handle.style.left = `${val}%`;
  };
  range.addEventListener('input', () => majPosition(range.value));
  majPosition(50);

  box.append(imgAvant, imgApres, capAvant, capApres, div, handle, range);
  return box;
}

function celluleAvap(p, role) {
  const cell = document.createElement('div');
  cell.className = 'mq-avap-cell';
  const img = document.createElement('img');
  img.src = p.url;
  img.loading = 'lazy';
  img.alt = role === 'avant' ? 'Avant' : 'Après';
  const cap = document.createElement('span');
  cap.className = `mq-avap-cap ${role === 'avant' ? 'mq-avap-cap-before' : 'mq-avap-cap-after'}`;
  cap.textContent = `${role === 'avant' ? 'Avant' : 'Après'} · ${jourCourtAvap(p.taken_at)}`;
  cell.append(img, cap);
  return cell;
}

/**
 * Bloc « Avant / après » côté artisan : le comparateur si les deux photos
 * sont marquées ; sinon on montre celle qui l'est et on dit ce qu'il reste
 * à choisir — sans jamais réclamer une prise de vue.
 * Renvoie { avant, apres } pour que l'appelant décide du bouton Partager.
 */
export function rendreBlocAvapArtisan(card, photos) {
  if (!card) return { avant: null, apres: null };
  const { avant, apres } = choisirAvantApresClient(photos);
  card.replaceChildren();
  if (avant && apres) {
    card.appendChild(construireComparateurAvap(avant, apres));
  } else if (avant || apres) {
    const demi = document.createElement('div');
    demi.className = 'ph-avap-demi';
    const attente = (role) => {
      const d = document.createElement('div');
      d.className = 'ph-avap-attente';
      d.textContent = role === 'avant'
        ? 'Choisissez la photo « Avant » dans la galerie'
        : 'Choisissez la photo « Après » dans la galerie';
      return d;
    };
    demi.append(avant ? celluleAvap(avant, 'avant') : attente('avant'), apres ? celluleAvap(apres, 'apres') : attente('apres'));
    card.appendChild(demi);
  } else {
    const vide = document.createElement('div');
    vide.className = 'ph-avap-vide';
    const b = document.createElement('b');
    b.textContent = 'Chantier en cours';
    vide.append(b, document.createTextNode('Sélectionnez une photo dans la galerie, puis « Avant » ou « Après » : c’est ce que verra votre client.'));
    card.appendChild(vide);
  }
  return { avant, apres };
}

// ── Envoi en rafale ──────────────────────────────────────────────────────
// Chaque photo apparaît dans sa section dès son envoi (apresChaque), sans
// légende demandée. Les échecs sont comptés et dits, pas avalés.
export async function envoyerFichiersPhotos({ files, chantierId, phase, uploadPhoto, notifier, apresChaque }) {
  const liste = Array.from(files || []);
  if (!liste.length) return { ok: 0, ko: 0 };
  const temps = PHASE_LABEL[normaliserPhase(phase)];
  if (typeof notifier === 'function') {
    notifier(liste.length > 1 ? `Envoi de ${liste.length} photos « ${temps} »…` : `Envoi de la photo « ${temps} »…`);
  }
  let ok = 0;
  let ko = 0;
  for (const f of liste) {
    try {
      await uploadPhoto(chantierId, f, '', normaliserPhase(phase));
      ok += 1;
      if (typeof apresChaque === 'function') await apresChaque();
    } catch (e) {
      ko += 1;
      console.warn('[photos] envoi impossible', e);
      if (typeof notifier === 'function') notifier(expliquerErreurPhotos(e, 'Photo non envoyée.'), 'error');
    }
  }
  if (ok && typeof notifier === 'function') {
    notifier(ok > 1 ? `${ok} photos ajoutées (${temps})` : `Photo ajoutée (${temps})`, 'success');
  }
  return { ok, ko };
}

// ── Galerie avec sélection ───────────────────────────────────────────────
// creerGalerie() construit une fois la barre d'actions ; rendre(photos)
// redessine les groupes. Appui long (450 ms) ou poignée « Sélectionner »
// → sélection multiple → « Envoyer au client » / « Avant » / « Après » /
// « Supprimer ». Les actions sont fournies par l'appelant (Supabase) ; le
// module ne connaît ni la table ni la session.
const DUREE_APPUI_LONG_MS = 450;

export function creerGalerie({ conteneur, notifier, actions, onAjouter, apresAction }) {
  const dire = (m, t) => { if (typeof notifier === 'function') notifier(m, t); };
  const selection = new Set();
  let modeSelection = false;
  let photosCourantes = [];
  let occupe = false;

  conteneur.classList.add('ph-galerie');

  // Barre d'actions, une seule par page — fixe en bas.
  const barre = document.createElement('div');
  barre.className = 'ph-barre';
  barre.setAttribute('role', 'toolbar');
  barre.setAttribute('aria-label', 'Actions sur les photos sélectionnées');
  const tete = document.createElement('div');
  tete.className = 'ph-barre-tete';
  const compteur = document.createElement('span');
  const annuler = document.createElement('button');
  annuler.type = 'button';
  annuler.textContent = 'Annuler';
  annuler.addEventListener('click', () => quitterSelection());
  tete.append(compteur, annuler);
  const zoneActions = document.createElement('div');
  zoneActions.className = 'ph-barre-actions';

  const bouton = (cls, texte, ico) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.innerHTML = iconePhoto(ico) + '<span></span>';
    b.querySelector('span').textContent = texte;
    zoneActions.appendChild(b);
    return b;
  };
  const bEnvoyer = bouton('ph-principal', 'Envoyer au client', 'send');
  const bAvant = bouton('', 'Avant', 'avant');
  const bApres = bouton('', 'Après', 'apres');
  const bSuppr = bouton('ph-danger', 'Supprimer', 'trash');
  barre.append(tete, zoneActions);
  document.body.appendChild(barre);

  function photosSelectionnees() {
    return photosCourantes.filter((p) => selection.has(p.id));
  }

  function majBarre() {
    const n = selection.size;
    compteur.textContent = n === 0 ? 'Touchez les photos à sélectionner' : n === 1 ? '1 photo sélectionnée' : `${n} photos sélectionnées`;
    const choisies = photosSelectionnees();
    const toutesVisibles = n > 0 && choisies.every((p) => p.visible_client === true);
    bEnvoyer.innerHTML = iconePhoto(toutesVisibles ? 'retirer' : 'send') + '<span></span>';
    bEnvoyer.querySelector('span').textContent = toutesVisibles ? 'Retirer du client' : 'Envoyer au client';
    bEnvoyer.dataset.mode = toutesVisibles ? 'retirer' : 'envoyer';
    bEnvoyer.disabled = occupe || n === 0;
    bAvant.disabled = occupe || n !== 1;
    bApres.disabled = occupe || n !== 1;
    bSuppr.disabled = occupe || n === 0;
    bAvant.title = n === 1 ? '' : 'Une seule photo à la fois';
    bApres.title = bAvant.title;
  }

  function entrerSelection() {
    if (modeSelection) return;
    modeSelection = true;
    conteneur.classList.add('ph-selection');
    barre.classList.add('on');
    majBarre();
  }

  function quitterSelection() {
    modeSelection = false;
    selection.clear();
    conteneur.classList.remove('ph-selection');
    barre.classList.remove('on');
    conteneur.querySelectorAll('.ph-tuile.ph-sel').forEach((t) => {
      t.classList.remove('ph-sel');
      t.setAttribute('aria-pressed', 'false');
    });
    majBarre();
  }

  function basculer(id, tuile) {
    if (selection.has(id)) selection.delete(id); else selection.add(id);
    const on = selection.has(id);
    tuile.classList.toggle('ph-sel', on);
    tuile.setAttribute('aria-pressed', String(on));
    majBarre();
  }

  async function executer(travail, messageOk) {
    if (occupe) return;
    occupe = true;
    majBarre();
    try {
      await travail();
      if (messageOk) dire(messageOk, 'success');
      quitterSelection();
      if (typeof apresAction === 'function') await apresAction();
    } catch (e) {
      console.warn('[photos] action impossible', e);
      dire(expliquerErreurPhotos(e), 'error');
    } finally {
      occupe = false;
      majBarre();
    }
  }

  bEnvoyer.addEventListener('click', () => {
    const ids = [...selection];
    if (!ids.length) return;
    const retirer = bEnvoyer.dataset.mode === 'retirer';
    executer(
      () => actions.envoyerClient(ids, !retirer),
      retirer
        ? (ids.length > 1 ? `${ids.length} photos retirées de la page client.` : 'Photo retirée de la page client.')
        : (ids.length > 1 ? `${ids.length} photos envoyées au client.` : 'Photo envoyée au client.'),
    );
  });
  bAvant.addEventListener('click', () => {
    const [id] = [...selection];
    if (!id) return;
    executer(() => actions.marquerRole(id, 'avant'), 'Photo « Avant » choisie — visible par le client.');
  });
  bApres.addEventListener('click', () => {
    const [id] = [...selection];
    if (!id) return;
    executer(() => actions.marquerRole(id, 'apres'), 'Photo « Après » choisie — visible par le client.');
  });
  bSuppr.addEventListener('click', () => {
    const ids = [...selection];
    if (!ids.length) return;
    const q = ids.length > 1 ? `Supprimer ces ${ids.length} photos ? Cette action est définitive.` : 'Supprimer cette photo ? Cette action est définitive.';
    if (!window.confirm(q)) return;
    executer(() => actions.supprimer(ids), ids.length > 1 ? `${ids.length} photos supprimées.` : 'Photo supprimée.');
  });

  function tuilePhoto(p) {
    const tuile = document.createElement('div');
    tuile.className = 'mq-ph ph-tuile';
    tuile.setAttribute('role', 'button');
    tuile.setAttribute('tabindex', '0');
    tuile.setAttribute('aria-pressed', String(selection.has(p.id)));
    tuile.setAttribute('aria-label', `Photo ${PHASE_LABEL[normaliserPhase(p.phase)]} · ${legendeTuile(p)}`);
    if (selection.has(p.id)) tuile.classList.add('ph-sel');
    if (p.url) {
      tuile.style.backgroundImage = `url("${String(p.url).replace(/"/g, '\\"')}")`;
      tuile.style.backgroundSize = 'cover';
      tuile.style.backgroundPosition = 'center';
    }

    if (p.visible_client === true || p.role_client === 'avant' || p.role_client === 'apres') {
      const badge = document.createElement('span');
      badge.className = 'ph-badge';
      badge.textContent = p.role_client === 'avant' ? 'Client · Avant' : p.role_client === 'apres' ? 'Client · Après' : 'Client';
      tuile.appendChild(badge);
    }

    const check = document.createElement('span');
    check.className = 'ph-check';
    check.innerHTML = iconePhoto('check', 13);
    tuile.appendChild(check);

    const b = document.createElement('b');
    b.textContent = legendeTuile(p);
    tuile.appendChild(b);

    // Appui long → sélection. Un déplacement du doigt (défilement) annule.
    let minuteur = null;
    let depart = null;
    let appuiLongFait = false;
    const annulerAppui = () => { if (minuteur) { clearTimeout(minuteur); minuteur = null; } };
    tuile.addEventListener('pointerdown', (e) => {
      if (e.button && e.button !== 0) return;
      depart = { x: e.clientX, y: e.clientY };
      appuiLongFait = false;
      annulerAppui();
      minuteur = setTimeout(() => {
        minuteur = null;
        appuiLongFait = true;
        entrerSelection();
        basculer(p.id, tuile);
        if (navigator.vibrate) { try { navigator.vibrate(12); } catch (_) { /* pas grave */ } }
      }, DUREE_APPUI_LONG_MS);
    });
    tuile.addEventListener('pointermove', (e) => {
      if (!minuteur || !depart) return;
      if (Math.abs(e.clientX - depart.x) > 8 || Math.abs(e.clientY - depart.y) > 8) annulerAppui();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => tuile.addEventListener(ev, annulerAppui));
    tuile.addEventListener('contextmenu', (e) => e.preventDefault());
    tuile.addEventListener('click', () => {
      if (appuiLongFait) { appuiLongFait = false; return; }
      if (modeSelection) { basculer(p.id, tuile); return; }
      if (p.url) window.open(p.url, '_blank', 'noopener');
    });
    tuile.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tuile.click(); }
    });
    return tuile;
  }

  function tuileAjout() {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'mq-ph mq-add';
    t.style.cssText = 'font-family:inherit;cursor:pointer;padding:0;';
    t.innerHTML = iconePhoto('plus', 22);
    t.setAttribute('aria-label', 'Ajouter des photos');
    t.addEventListener('click', () => { if (typeof onAjouter === 'function') onAjouter(); });
    return t;
  }

  function rendre(photos) {
    photosCourantes = Array.isArray(photos) ? photos.filter(Boolean) : [];
    // Une photo supprimée ailleurs ne doit pas rester « sélectionnée ».
    const ids = new Set(photosCourantes.map((p) => p.id));
    [...selection].forEach((id) => { if (!ids.has(id)) selection.delete(id); });

    conteneur.replaceChildren();
    if (!photosCourantes.length) {
      quitterSelection();
      const vide = document.createElement('div');
      vide.className = 'ph-vide';
      vide.textContent = 'Pas encore de photos. Choisissez le temps du chantier, puis appuyez sur le bouton pour commencer.';
      conteneur.appendChild(vide);
      return;
    }

    grouperPhotos(photosCourantes).forEach((groupe, idx) => {
      const ligne = document.createElement('div');
      ligne.className = 'ph-sec-ligne';
      const sec = document.createElement('div');
      sec.className = 'mq-sec';
      sec.textContent = `${PHASE_LABEL[groupe.phase]} · ${jourLabelPhoto(groupe.jourIso)}`;
      ligne.appendChild(sec);
      if (idx === 0) {
        const poignee = document.createElement('button');
        poignee.type = 'button';
        poignee.className = 'ph-poignee';
        poignee.textContent = 'Sélectionner';
        poignee.addEventListener('click', () => { if (modeSelection) quitterSelection(); else entrerSelection(); });
        ligne.appendChild(poignee);
      }
      conteneur.appendChild(ligne);

      const grille = document.createElement('div');
      grille.className = 'mq-ph-grid';
      groupe.photos.forEach((p) => grille.appendChild(tuilePhoto(p)));
      if (idx === 0) grille.appendChild(tuileAjout());
      conteneur.appendChild(grille);
    });
    majBarre();
  }

  majBarre();
  return { rendre, entrerSelection, quitterSelection, get enSelection() { return modeSelection; } };
}

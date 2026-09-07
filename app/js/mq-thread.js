// mq-thread.js — briques communes aux 3 messageries de l'appli Pro
// (fil client dans chantier.html, messages directs dans dm.html, fil
// d'équipe dans equipe.html) : sélecteur d'emoji, séparateurs de jour,
// zone de saisie qui grandit, marquage lu, badge de non-lus.
//
// POURQUOI CE FICHIER EXISTE (même raison que messages-directs.js) : un
// autre agent travaille en parallèle sur js/supabase.js — toute la logique
// ajoutée ici pour la tâche 19 (« messagerie comme WhatsApp », demande du
// fondateur le 04/09) vit donc à côté, pas dedans. Ce module se contente
// d'importer `supabase`/`getSession` comme n'importe quel script de page.
//
// ⚠️ marquerLuMessagesClient()/marquerLuMessagesEquipe()/actualiserBadge…
// s'appuient sur la colonne `messages.lu_le`, qui n'existe PAS encore en
// prod au moment où ce fichier est écrit — voir la migration additive
// app/supabase-messages-lus-2026-09-04.sql (à appliquer par le contrôleur).
// Tant qu'elle n'est pas appliquée, ces fonctions échouent silencieusement
// (try/catch) : aucune n'est jamais bloquante pour l'envoi ou la lecture
// d'un message, seul le compteur de non-lus reste à 0 en attendant.

import { supabase, getSession, photoUrlAsync } from './supabase.js';

// ── Photos dans un fil ───────────────────────────────────────────────────
// Une photo postée dans le groupe d'un chantier (equipe.html) est d'abord
// rangée dans le dossier photos du chantier (uploadPhoto → table `photos`),
// puis annoncée dans le fil par un marqueur texte `[photo:<storage_path>]`.
// La table `messages` ne change pas ; seul le rendu sait lire le marqueur.
export const RE_PHOTO = /\[photo:([A-Za-z0-9_./-]+)\]/g;

// Résolution du chemin d'une photo en URL affichable. Artisan connecté :
// URL signée (photoUrlAsync). Page client (suivi.html) : elle n'a pas de
// session, elle branche son propre résolveur (Edge Function chantier-photos).
let resoudrePhoto = photoUrlAsync;
export function definirResolveurPhoto(fn) { resoudrePhoto = typeof fn === 'function' ? fn : photoUrlAsync; }

/**
 * Sélecteur de photo pour un message (Moctar 06/09) : feuille à deux choix,
 * « Depuis le téléphone ou le Drive » (sélecteur système : galerie, Fichiers,
 * Drive) et « Photos de l'appli » (grille des photos déjà dans BatiSpot).
 * Résout { type:'fichier', file } · { type:'app', photo } · null (annulé).
 */
export function choisirPhoto({ titre = 'Envoyer une photo', listerPhotosApp = null, libelleApp = "Photos de l'appli" } = {}) {
  return new Promise((resolve) => {
    document.querySelectorAll('.mq-menu-msg').forEach((m) => m.remove());
    const voile = document.createElement('div');
    voile.className = 'mq-menu-msg';
    const feuille = document.createElement('div');
    feuille.className = 'mq-menu-msg-feuille';
    const t = document.createElement('div');
    t.className = 'mq-menu-msg-titre';
    t.textContent = titre;
    feuille.appendChild(t);
    const fermer = (val) => { voile.remove(); resolve(val || null); };
    const bouton = (libelle, classe, fn) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mq-menu-msg-btn' + (classe ? ' ' + classe : ''); b.textContent = libelle;
      b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
      return b;
    };
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.hidden = true;
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      fermer(f ? { type: 'fichier', file: f } : null);
    });
    feuille.appendChild(input);
    feuille.appendChild(bouton('Depuis le téléphone ou le Drive', '', () => input.click()));
    if (listerPhotosApp) {
      feuille.appendChild(bouton(libelleApp, '', async () => {
        feuille.querySelectorAll('.mq-menu-msg-btn').forEach((b) => { if (b.textContent !== 'Annuler') b.remove(); });
        const grille = document.createElement('div');
        grille.className = 'mq-photo-grille';
        const attente = document.createElement('div');
        attente.className = 'mq-menu-msg-titre';
        attente.textContent = 'Un instant…';
        feuille.insertBefore(attente, feuille.lastChild);
        let photos = [];
        try { photos = (await listerPhotosApp()) || []; } catch (_) { photos = []; }
        attente.remove();
        if (!photos.length) {
          const vide = document.createElement('div');
          vide.className = 'mq-menu-msg-titre';
          vide.textContent = "Aucune photo dans l'appli pour l'instant.";
          feuille.insertBefore(vide, feuille.lastChild);
          return;
        }
        photos.forEach((p) => {
          const img = document.createElement('img');
          img.className = 'mq-photo-choix';
          img.alt = p.caption || 'Photo';
          img.loading = 'lazy';
          resoudrePhoto(p.storage_path).then((u) => { if (u) img.src = u; }).catch(() => {});
          img.addEventListener('click', () => fermer({ type: 'app', photo: p }));
          grille.appendChild(img);
        });
        feuille.insertBefore(grille, feuille.lastChild);
      }));
    }
    feuille.appendChild(bouton('Annuler', 'mq-ghost', () => fermer(null)));
    voile.appendChild(feuille);
    voile.addEventListener('click', (e) => { if (e.target === voile) fermer(null); });
    document.body.appendChild(voile);
  });
}

/** Chemins de photos portés par un message, dans l'ordre. */
export function photosDuContenu(texte) {
  const out = [];
  const re = new RegExp(RE_PHOTO.source, 'g');
  let m;
  while ((m = re.exec(String(texte ?? ''))) !== null) out.push(m[1]);
  return out;
}

/** Texte d'aperçu (liste de fils) : le marqueur devient « 📷 Photo ». */
export function apercuContenu(texte) {
  return String(texte ?? '').replace(new RegExp(RE_PHOTO.source, 'g'), '📷 Photo').replace(/\s+/g, ' ').trim();
}

// ── Emoji ────────────────────────────────────────────────────────────────
// Même liste que la messagerie client (suivi.html), pour que les deux bouts
// d'une conversation se ressemblent — complétée du casque de chantier (👷)
// demandé explicitement par le fondateur. Volontairement courte : un
// artisan écrit à un client ou un collègue, pas à des amis.
// Libellés texte courts (correctif révision tâche 19, 04/09) : un onglet
// d'interface n'est jamais un emoji brut — un emoji dans un onglet se lit
// comme un pictogramme illisible à cette taille et brouille la frontière
// avec les emoji « contenu » de la grille en dessous. Les emoji restent
// uniquement dans `liste` (ce qu'on choisit) et dans les messages envoyés.
export const EMOJI_CATEGORIES = [
  { nom: 'Chantier', liste: '👍 👌 🙏 ✅ ❌ ⚠️ 👷 🔨 🔧 🪛 🪚 🧱 🚪 🪟 🚿 🚰 🔌 💡 🪜 🧰 🧹 🎨 🪣 📐 📏 🏠 🏗️ 🚧 📦 🚚 🗝️' },
  { nom: 'Sourires', liste: '🙂 😀 😃 😄 😁 😊 😉 😍 🤩 😎 🤝 😅 😂 🥲 🤔 🤨 😐 😕 🙁 😟 😢 😭 😤 😠 😴 🤒 🥳 😇 🫡 🙌' },
  { nom: 'Gestes', liste: '👋 🤚 ✋ 👌 🤏 ✌️ 🤞 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👏 🙌 🤲 🙏 💪 🫶 ✍️' },
  { nom: 'Divers', liste: '💬 📞 📱 ✉️ 📧 📅 🕐 ⏰ ⏳ 📸 📷 🖼️ 📄 📝 📋 💰 💶 💳 🧾 🔑 ⭐ ❤️ 🎉 ✨ 🔥 ☀️ 🌧️ ❄️ 🚗 ⛽' },
];

/**
 * Branche un sélecteur d'emoji sur un bouton + panneau + textarea, sans
 * dépendance externe (même mécanique que suivi.html : mousedown pour ne
 * jamais perdre le focus/la position du curseur dans le textarea).
 * @param {{btn:HTMLElement, panel:HTMLElement, tabs:HTMLElement, grid:HTMLElement, textarea:HTMLTextAreaElement, onInsert?:Function}} opts
 */
export function initEmojiPicker({ btn, panel, tabs, grid, textarea, onInsert }) {
  let construits = false;

  function fermer() {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  function inserer(emoji) {
    const debut = textarea.selectionStart ?? textarea.value.length;
    const fin = textarea.selectionEnd ?? textarea.value.length;
    textarea.value = textarea.value.slice(0, debut) + emoji + textarea.value.slice(fin);
    const pos = debut + emoji.length;
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
    if (onInsert) onInsert();
  }

  function afficherCategorie(idx) {
    grid.replaceChildren();
    EMOJI_CATEGORIES[idx].liste.split(' ').filter(Boolean).forEach((e) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = e;
      b.setAttribute('aria-label', `Emoji ${e}`);
      b.addEventListener('mousedown', (ev) => { ev.preventDefault(); inserer(e); });
      grid.appendChild(b);
    });
    [...tabs.children].forEach((t, i) => t.classList.toggle('active', i === idx));
  }

  function construire() {
    if (construits) return;
    construits = true;
    EMOJI_CATEGORIES.forEach((cat, i) => {
      const t = document.createElement('button');
      t.type = 'button';
      t.className = 'mq-emoji-tab';
      t.textContent = cat.nom;
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-label', cat.nom);
      t.addEventListener('mousedown', (ev) => { ev.preventDefault(); afficherCategorie(i); });
      tabs.appendChild(t);
    });
    afficherCategorie(0);
  }

  btn.addEventListener('click', () => {
    construire();
    const ouvert = panel.hidden;
    panel.hidden = !ouvert;
    btn.setAttribute('aria-expanded', String(ouvert));
  });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) fermer();
  });
  textarea.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) fermer(); });

  return { fermer };
}

// ── Textarea qui grandit (1 → ~4 lignes), jamais plus ─────────────────────
export function autoResizeTextarea(el, maxPx = 110) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, maxPx) + 'px';
}

// ── Séparateur de jour, façon messagerie mobile ────────────────────────────
// Même règle que suivi.html : compare des jours calendaires, jamais des
// durées (un message d'hier 23 h n'est pas « il y a 2 heures »).
export function libelleJour(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const jour = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const ecart = Math.round((jour(new Date()) - jour(d)) / 86400000);
  if (ecart === 0) return "Aujourd'hui";
  if (ecart === 1) return 'Hier';
  if (ecart < 7) {
    const txt = d.toLocaleDateString('fr-FR', { weekday: 'long' });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

/** Insère un séparateur de jour dans `list` si `iso` change de jour calendaire par rapport à `jourPrecedent` (une string de comparaison, pas une date). Retourne le nouveau jourPrecedent. */
export function poserSeparateurJour(list, iso, jourPrecedent) {
  const jour = new Date(iso).toDateString();
  if (jour !== jourPrecedent) {
    const sep = document.createElement('div');
    sep.className = 'mq-day-sep';
    sep.textContent = libelleJour(iso);
    list.appendChild(sep);
  }
  return jour;
}

// ── Marquage lu (colonne messages.lu_le — voir avertissement en tête de
// fichier) ──────────────────────────────────────────────────────────────

/** Marque lus les messages du CLIENT sur ce chantier (fil client ⇄ artisan). */
export async function marquerLuMessagesClient(chantierId) {
  try {
    await supabase
      .from('messages')
      .update({ lu_le: new Date().toISOString() })
      .eq('chantier_id', chantierId)
      .eq('visible_client', true)
      .eq('author', 'client')
      .is('lu_le', null);
  } catch (_) { /* colonne pas encore migrée, ou RLS : pas bloquant */ }
}

/** Marque lus les messages du fil d'équipe de ce chantier, hors les miens. */
export async function marquerLuMessagesEquipe(chantierId, monId) {
  try {
    let q = supabase
      .from('messages')
      .update({ lu_le: new Date().toISOString() })
      .eq('chantier_id', chantierId)
      .eq('visible_client', false)
      .is('lu_le', null);
    if (monId) q = q.neq('auteur_id', monId);
    await q;
  } catch (_) { /* pas bloquant */ }
}

// ── Fil client ⇄ artisan en temps réel ─────────────────────────────────────
// Symétrique de suivreThread() (messages-directs.js) et suivreMessagesEquipe()
// (supabase.js) : le filtre serveur porte sur chantier_id, le tri
// « visible_client=true uniquement » se fait ensuite côté client.
export function suivreMessagesClient(chantierId, onMessage) {
  return supabase
    .channel(`messages-client:${chantierId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chantier_id=eq.${chantierId}` },
      (payload) => { if (payload.new && payload.new.visible_client === true) onMessage(payload.new); })
    .subscribe();
}

// ── Badge de non-lus (onglet Messages de la barre du bas) ─────────────────
// Requête légère (3 x count exact, head:true — aucune ligne rapatriée),
// appelée depuis les écrans de messagerie eux-mêmes (messages.html, dm.html,
// chantier.html, equipe.html) après chargement/marquage lu. Les autres
// écrans affichent la dernière valeur connue, mise en cache dans
// localStorage par cette même fonction — app-nav.js la lit au rendu de la
// barre du bas. Un badge qui ne se met à jour qu'à la visite d'un fil de
// messagerie reste très proche de la réalité en usage normal, pour une
// fraction du coût d'une requête sur chaque écran de l'appli.
export async function actualiserBadgeMessages() {
  let total = 0;
  try {
    const session = await getSession();
    if (!session) return 0;
    const monId = session.user.id;

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('visible_client', true)
        .eq('author', 'client')
        .is('lu_le', null);
      if (!error && typeof count === 'number') total += count;
    } catch (_) { /* colonne pas migrée : ignoré */ }

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('visible_client', false)
        .is('lu_le', null)
        .neq('auteur_id', monId);
      if (!error && typeof count === 'number') total += count;
    } catch (_) { /* colonne pas migrée : ignoré */ }

    try {
      const { count, error } = await supabase
        .from('messages_directs')
        .select('id', { count: 'exact', head: true })
        .eq('a_user_id', monId)
        .is('lu_le', null);
      if (!error && typeof count === 'number') total += count;
    } catch (_) { /* ignoré */ }
  } catch (_) { /* pas de session, etc. */ }

  try { localStorage.setItem('bs_badge_messages', String(total)); } catch (_) {}
  if (typeof window.bsMajBadgeMessages === 'function') window.bsMajBadgeMessages(total);

  // Badge sur l'icône de l'app (demande du fondateur, correctif révision
  // tâche 19, 04/09) : un point rouge, jamais un nombre — cohérent avec le
  // badge posé côté push (sw.js). Support : iOS = appli installée sur
  // l'écran d'accueil + notifications acceptées (16.4+) ; Android Chrome
  // fonctionne directement. Absent ailleurs (desktop, anciens navigateurs)
  // — jamais bloquant, dans son propre try/catch.
  try {
    if (navigator.setAppBadge) {
      if (total > 0) navigator.setAppBadge(total).catch(() => {});
      else if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
    }
  } catch (_) { /* API absente ou refusée : pas bloquant */ }

  return total;
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDU DES BULLES — source unique (tâche 24, 05/09/2026)
//
// POURQUOI CE BLOC EXISTE
// La revue du 04/09 a relevé TROIS copies du rendu d'une bulle : chantier.js
// (fil client), dm.html (messages directs) et equipe.html (fil d'équipe),
// plus une quatrième dans suivi.html côté client — chacune avec sa propre
// `fmtHeureCourte`, ses propres classes et son propre découpage des retours
// à la ligne. Résultat : la messagerie du client était en avance (ergot,
// heure dans la bulle, séparateurs) sur celle de l'artisan, et un correctif
// devait être écrit quatre fois.
//
// Tout passe désormais par `rendreBulle()` / `rendreFil()`. Les quatre
// écrans ne fournissent plus que trois fonctions minuscules : est-ce mon
// message, comment s'appelle l'autre, et le message a-t-il été lu.
//
// ⚠️ Aucune de ces fonctions n'écrit de HTML fabriqué à partir d'un contenu
// de message : tout est createElement + textContent. La seule chose qu'on
// « interprète » dans un message est une URL http(s), et elle devient un
// vrai élément <a>, jamais une chaîne injectée.
// ═══════════════════════════════════════════════════════════════════════════

// Icônes du fil. Volontairement recopiées ici plutôt qu'appelées via
// window.bsIcon (app-nav.js) : suivi.html est une page PUBLIQUE par jeton,
// elle ne charge pas la barre de navigation de l'appli — et les bulles du
// client doivent ressembler exactement à celles de l'artisan.
const ICONES = {
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
  smiley: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  back: '<polyline points="15 18 9 12 15 6"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
};

/** SVG d'interface (jamais un emoji décoratif — règle du 04/09). */
export function iconeFil(nom, taille = 18) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + taille + '" height="' + taille
    + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"'
    + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + (ICONES[nom] || '') + '</svg>';
}

/** Heure d'horloge courte — UNE seule définition pour les quatre fils. */
export function fmtHeureCourte(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * « il y a 2 h », « hier » — pour la LISTE des fils, pas pour une bulle :
 * dans une liste on cherche qui attend une réponse, pas l'heure exacte.
 */
export function heureRelative(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  // Moctar, 05/09 : « on doit pouvoir avoir l'heure, hier, ou la date » —
  // plus de « 12 min » : aujourd'hui = l'heure.
  const jour = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const ecart = Math.round((jour(new Date()) - jour(d)) / 86400000);
  if (ecart === 0) return fmtHeureCourte(iso);
  if (ecart === 1) return 'hier';
  if (ecart < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
}

/** Initiales d'un nom complet (avatar rond de la liste et de l'en-tête). */
export function initialesDe(nomComplet) {
  const mots = String(nomComplet || '').trim().split(/\s+/).filter(Boolean);
  if (!mots.length) return '?';
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[1][0]).toUpperCase();
}

// Un message qui ne contient que des emoji (3 au plus) s'affiche en grand et
// sans bulle. \p{Extended_Pictographic} couvre les emoji composés (drapeaux,
// familles, teintes de peau) qu'un intervalle \u{1F300}-… rate.
const RE_EMOJI_SEUL = /^(?:\p{Extended_Pictographic}(?:️|‍|[\u{1F3FB}-\u{1F3FF}])*){1,3}$/u;
export function estEmojiSeul(txt) {
  const t = String(txt ?? '').trim();
  return t.length > 0 && RE_EMOJI_SEUL.test(t);
}

// Liens : UNIQUEMENT http(s). Volontairement strict — pas de `www.`, pas de
// détection de domaine nu, et surtout jamais de schéma arbitraire : une
// détection large finirait par fabriquer un lien `javascript:` ou `data:` à
// partir d'un texte écrit par quelqu'un d'autre.
const RE_URL = /https?:\/\/[^\s<>"']+/g;

/** Abrège une URL pour l'affichage, en gardant le domaine lisible. */
function libelleUrl(url) {
  let u;
  try { u = new URL(url); } catch (_) { return url.length > 42 ? url.slice(0, 40) + '…' : url; }
  const reste = (u.pathname === '/' ? '' : u.pathname) + u.search;
  const hote = u.host.replace(/^www\./, '');
  if (!reste) return hote;
  return reste.length > 18 ? hote + reste.slice(0, 16) + '…' : hote + reste;
}

/**
 * Écrit `texte` dans `conteneur` : retours à la ligne conservés, URL http(s)
 * transformées en vrais liens. Aucune chaîne HTML n'est construite à partir
 * du contenu — que des nœuds texte et des éléments <a> dont le href est une
 * URL déjà validée par le motif ci-dessus.
 */
export function ecrireContenu(conteneur, texte) {
  const brut = String(texte ?? '');
  brut.split('\n').forEach((ligne, iLigne) => {
    if (iLigne > 0) conteneur.appendChild(document.createElement('br'));
    let curseur = 0;
    RE_URL.lastIndex = 0;
    let m;
    while ((m = RE_URL.exec(ligne)) !== null) {
      // La ponctuation finale (« … suivi.html. ») n'appartient pas à l'URL.
      let url = m[0];
      const queue = url.match(/[.,;:!?)\]]+$/);
      if (queue) url = url.slice(0, url.length - queue[0].length);
      if (!url) continue;
      if (m.index > curseur) conteneur.appendChild(document.createTextNode(ligne.slice(curseur, m.index)));
      const a = document.createElement('a');
      a.className = 'mq-lien';
      a.href = url;                       // http(s) uniquement, cf. RE_URL
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = url;                      // l'adresse complète reste lisible
      a.textContent = libelleUrl(url);
      conteneur.appendChild(a);
      curseur = m.index + url.length;
    }
    if (curseur < ligne.length) conteneur.appendChild(document.createTextNode(ligne.slice(curseur)));
  });
}

/**
 * Une bulle. Source unique pour les quatre messageries.
 *
 * @param {{content?:string, created_at?:string}} msg
 * @param {object} opts
 *   mienne  {boolean} — bulle verte à droite (moi) ou blanche à gauche
 *   lu      {boolean|null} — accusé de lecture : null = pas d'accusé du tout,
 *                            false = envoyé (une coche), true = lu (deux
 *                            coches). N'a de sens que sur mes propres bulles.
 *   auteur  {string} — nom affiché en tête de série (bulles des autres)
 *   queue   {boolean} — dernier message d'une série : porte l'ergot
 *   heure   {string} — forcer l'horodatage ; sinon calculé sur created_at
 * @returns {HTMLElement}
 */
// ── Modifier / supprimer SON message (Moctar 06/09, « comme WhatsApp ») ────
// Appui long (ou clic droit) sur une bulle à moi → feuille « Modifier ·
// Supprimer ». Les droits réels sont côté base (déclencheur
// messages_garde_modif / messages_directs_garde_maj) : ici on ne fait
// qu'appeler, et on affiche le refus tel quel s'il arrive.
function ouvrirMenuMessage(bulle, msg, actions) {
  document.querySelectorAll('.mq-menu-msg').forEach((m) => m.remove());
  const voile = document.createElement('div');
  voile.className = 'mq-menu-msg';
  const feuille = document.createElement('div');
  feuille.className = 'mq-menu-msg-feuille';
  const fermer = () => voile.remove();
  const bouton = (libelle, classe, fn) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mq-menu-msg-btn' + (classe ? ' ' + classe : ''); b.textContent = libelle;
    b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fermer(); fn && fn(); });
    return b;
  };
  if (actions.modifier) feuille.appendChild(bouton('Modifier', '', () => editerBulle(bulle, msg, actions.modifier)));
  if (actions.supprimer) feuille.appendChild(bouton('Supprimer', 'mq-danger', () => confirmerSuppression(bulle, msg, actions.supprimer)));
  feuille.appendChild(bouton('Annuler', 'mq-ghost', null));
  voile.appendChild(feuille);
  voile.addEventListener('click', (e) => { if (e.target === voile) fermer(); });
  document.body.appendChild(voile);
}

function direErreurBulle(bulle, err) {
  const m = document.createElement('div');
  m.className = 'mq-msg-erreur';
  m.textContent = (err && err.message) ? err.message : 'Impossible pour le moment.';
  bulle.appendChild(m);
  setTimeout(() => m.remove(), 5000);
}

function editerBulle(bulle, msg, modifier) {
  const txt = bulle.querySelector('.mq-txt');
  if (!txt || bulle.querySelector('.mq-edit')) return;
  const zone = document.createElement('div');
  zone.className = 'mq-edit';
  const ta = document.createElement('textarea');
  ta.className = 'mq-edit-ta';
  ta.value = String(msg.content || '');
  ta.rows = Math.min(6, Math.max(2, ta.value.split('\n').length));
  const barre = document.createElement('div');
  barre.className = 'mq-edit-barre';
  const ok = document.createElement('button'); ok.type = 'button'; ok.className = 'mq-edit-ok'; ok.textContent = 'Enregistrer';
  const non = document.createElement('button'); non.type = 'button'; non.className = 'mq-edit-non'; non.textContent = 'Annuler';
  barre.append(non, ok);
  zone.append(ta, barre);
  txt.hidden = true;
  bulle.appendChild(zone);
  ta.focus();
  non.addEventListener('click', () => { zone.remove(); txt.hidden = false; });
  ok.addEventListener('click', async () => {
    const nouveau = ta.value.trim();
    if (!nouveau || nouveau === String(msg.content || '')) { zone.remove(); txt.hidden = false; return; }
    ok.disabled = true; ok.textContent = 'Un instant…';
    try {
      await modifier(msg, nouveau);
      msg.content = nouveau;
      txt.replaceChildren();
      ecrireContenu(txt, nouveau);
      txt.appendChild(document.createTextNode('\u00A0'.repeat(11)));
      zone.remove(); txt.hidden = false;
    } catch (err) {
      ok.disabled = false; ok.textContent = 'Enregistrer';
      direErreurBulle(bulle, err);
    }
  });
}

function confirmerSuppression(bulle, msg, supprimer) {
  const voile = document.createElement('div');
  voile.className = 'mq-menu-msg';
  const feuille = document.createElement('div');
  feuille.className = 'mq-menu-msg-feuille';
  const q = document.createElement('div');
  q.className = 'mq-menu-msg-titre';
  q.textContent = 'Supprimer ce message ? Il disparaît pour tout le monde.';
  const oui = document.createElement('button'); oui.type = 'button'; oui.className = 'mq-menu-msg-btn mq-danger'; oui.textContent = 'Supprimer';
  const non = document.createElement('button'); non.type = 'button'; non.className = 'mq-menu-msg-btn mq-ghost'; non.textContent = 'Annuler';
  feuille.append(q, oui, non);
  voile.appendChild(feuille);
  const fermer = () => voile.remove();
  non.addEventListener('click', fermer);
  voile.addEventListener('click', (e) => { if (e.target === voile) fermer(); });
  oui.addEventListener('click', async () => {
    oui.disabled = true; oui.textContent = 'Un instant…';
    try { await supprimer(msg); fermer(); bulle.remove(); }
    catch (err) { fermer(); direErreurBulle(bulle, err); }
  });
  document.body.appendChild(voile);
}

function brancherAppuiLong(bulle, msg, actions) {
  let timer = null;
  const annuler = () => { if (timer) { clearTimeout(timer); timer = null; } bulle.classList.remove('mq-presse'); };
  bulle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('.mq-edit, .mq-photo, a')) return;
    bulle.classList.add('mq-presse');
    timer = setTimeout(() => { timer = null; bulle.classList.remove('mq-presse'); ouvrirMenuMessage(bulle, msg, actions); }, 550);
  });
  ['pointerup', 'pointercancel', 'pointerleave', 'pointermove'].forEach((ev) => bulle.addEventListener(ev, (e) => {
    if (ev === 'pointermove' && timer) { /* un léger tremblement ne doit pas annuler */ return; }
    annuler();
  }));
  bulle.addEventListener('contextmenu', (e) => { e.preventDefault(); annuler(); ouvrirMenuMessage(bulle, msg, actions); });
}

export function rendreBulle(msg, { mienne = false, lu = null, auteur = '', queue = true, heure, actions = null } = {}) {
  const photos = photosDuContenu(msg && msg.content);
  const texte = photos.length
    ? String((msg && msg.content) || '').replace(new RegExp(RE_PHOTO.source, 'g'), '').trim()
    : (msg && msg.content);
  const seul = !photos.length && estEmojiSeul(texte);
  const bulle = document.createElement('div');
  bulle.className = 'mq-msg ' + (mienne ? 'mq-out' : 'mq-in')
    + (queue ? ' mq-tail' : '') + (seul ? ' mq-emoji-seul' : '') + (photos.length ? ' mq-avec-photo' : '');

  if (auteur && !mienne && !seul) {
    const qui = document.createElement('span');
    qui.className = 'mq-auteur';
    qui.textContent = auteur;
    bulle.appendChild(qui);
  }

  // Photos d'abord (URL signée, chargée après coup : la bulle s'affiche sans
  // attendre). Un chemin qui ne se signe pas laisse une case grise, jamais
  // une bulle vide.
  photos.forEach((chemin) => {
    const img = document.createElement('img');
    img.className = 'mq-photo';
    img.alt = 'Photo du chantier';
    img.loading = 'lazy';
    img.decoding = 'async';
    resoudrePhoto(chemin).then((u) => { if (u) img.src = u; }).catch(() => {});
    img.addEventListener('click', () => { if (img.src) window.open(img.src, '_blank', 'noopener'); });
    bulle.appendChild(img);
  });

  const txt = document.createElement('span');
  txt.className = 'mq-txt';
  ecrireContenu(txt, texte);
  // Réserve la place de l'horodatage sur la dernière ligne : sans ces
  // espaces insécables, l'heure flottante retombe seule sur une ligne vide
  // dès que le texte finit près du bord.
  if (!seul) txt.appendChild(document.createTextNode('\u00A0'.repeat(lu === null ? 8 : 11)));
  bulle.appendChild(txt);

  const pied = document.createElement('span');
  pied.className = 'mq-h';
  pied.appendChild(document.createTextNode(heure !== undefined ? heure : fmtHeureCourte(msg && msg.created_at)));
  if (mienne && lu !== null) pied.appendChild(cocheEnvoi(!!lu));
  bulle.appendChild(pied);

  if (mienne && actions && (actions.modifier || actions.supprimer)) {
    bulle.classList.add('mq-editable');
    brancherAppuiLong(bulle, msg, actions);
  }

  return bulle;
}

/**
 * Coche d'envoi : une seule = parti, deux = lu. Sur une bulle #228B5B, une
 * coche « verte » serait invisible — la coche de lecture est donc un vert
 * CLAIR (#8FE3B8), qui se lit comme du vert sur le fond vert foncé, là où
 * la coche « envoyé » reste blanche translucide.
 */
function cocheEnvoi(lu) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'mq-coche' + (lu ? ' mq-lu' : ''));
  svg.setAttribute('viewBox', lu ? '0 0 16 14' : '0 0 13.5 14');
  svg.setAttribute('width', lu ? '13' : '11');
  svg.setAttribute('height', '11');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const trait = (d) => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    p.setAttribute('points', d);
    svg.appendChild(p);
  };
  trait('1 7.5 5 11.5 12 3');
  if (lu) trait('7 11.5 14 3');
  svg.setAttribute('role', 'img');
  const titre = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  titre.textContent = lu ? 'Lu' : 'Envoyé';
  svg.appendChild(titre);
  return svg;
}

/** État vide d'un fil — une invitation à écrire, jamais un écran blanc. */
export function rendreEtatVide(texte) {
  const p = document.createElement('div');
  p.className = 'mq-vide';
  p.textContent = texte;
  return p;
}

/**
 * Rend un fil COMPLET : séparateurs de jour, regroupement par série (nom de
 * l'auteur en tête de série, ergot en pied de série), état vide, défilement.
 *
 * @param {HTMLElement} list conteneur .mq-thread
 * @param {Array} messages triés du plus ancien au plus récent
 * @param {object} adapt
 *   mienne(m) -> boolean            (obligatoire)
 *   auteur(m) -> string             (optionnel : nom montré en tête de série)
 *   lu(m)     -> boolean|null       (optionnel : accusé de lecture)
 *   vide      -> string             (texte de l'état vide)
 *   collerEnBas -> boolean          (par défaut : oui)
 */
export function rendreFil(list, messages, adapt = {}) {
  const {
    mienne = () => false, auteur = () => '', lu = () => null,
    actions = () => null,
    vide = 'Aucun message pour l’instant. Écrivez le premier.',
    collerEnBas = true,
  } = adapt;

  list.replaceChildren();
  if (!messages || !messages.length) {
    list.appendChild(rendreEtatVide(vide));
    return;
  }

  let jour = null;
  messages.forEach((m, i) => {
    jour = poserSeparateurJour(list, m.created_at, jour);
    const suivant = messages[i + 1];
    // Fin de série : plus de message après, ou l'autre bout parle, ou on
    // change de jour calendaire (le séparateur casse la série).
    const finSerie = !suivant
      || mienne(suivant) !== mienne(m)
      || new Date(suivant.created_at).toDateString() !== new Date(m.created_at).toDateString();
    const precedent = messages[i - 1];
    const debutSerie = !precedent
      || mienne(precedent) !== mienne(m)
      || new Date(precedent.created_at).toDateString() !== new Date(m.created_at).toDateString();
    list.appendChild(rendreBulle(m, {
      mienne: mienne(m),
      lu: lu(m),
      auteur: debutSerie ? auteur(m) : '',
      queue: finSerie,
      actions: actions(m),
    }));
  });
  if (collerEnBas) list.scrollTop = list.scrollHeight;
}

/** Vrai si on est déjà collé en bas : sinon on n'arrache pas sa lecture. */
export function estEnBasDuFil(list, marge = 40) {
  return list.scrollHeight - list.scrollTop - list.clientHeight < marge;
}

/**
 * Zone de saisie complète : capsule blanche, emoji à gauche, texte au
 * milieu, bouton rond à droite qui montre « envoyer » quand il y a du texte
 * et « micro » quand le champ est vide (maintenir pour dicter).
 *
 * Le micro et l'envoi sont DEUX boutons superposés dans le même
 * emplacement, pas un seul bouton qui change de rôle : `brancherBoutonMaintenu`
 * écoute pointerdown/pointerup, un clic d'envoi sur le même élément se
 * déclencherait au milieu d'un appui long.
 *
 * @returns {Promise<{majBouton: Function, micBranche: boolean}>}
 */
export async function brancherComposeur({
  textarea, sendBtn, micBtn = null,
  emojiBtn, panel, tabs, grid,
  onEnvoyer,
  micro = false, contexteDictee = 'note',
  onMessage = null,           // (texte, type) — remontée d'un avis à l'artisan
  indice = null,              // élément où écrire « Parlez… » / « Transcription… »
}) {
  sendBtn.innerHTML = iconeFil('send', 18);
  if (emojiBtn) emojiBtn.innerHTML = iconeFil('smiley', 18);

  // ── Correcteur d'orthographe (Moctar, 06/09) ──────────────────────────
  // Un bouton « Aa » à gauche d'Envoyer, visible dès qu'il y a du texte :
  // le message est relu par le serveur (mode corriger-texte), corrigé sans
  // être réécrit, puis REMIS DANS LE CHAMP — l'artisan relit et envoie
  // lui-même. Rien ne part tout seul.
  const corrBtn = document.createElement('button');
  corrBtn.type = 'button';
  corrBtn.className = 'mq-compose-emoji mq-compose-corr';
  corrBtn.setAttribute('aria-label', "Corriger l'orthographe");
  corrBtn.title = "Corriger l'orthographe";
  corrBtn.textContent = 'Aa';
  corrBtn.style.cssText = 'font-weight:900;font-size:13px;letter-spacing:-0.5px;';
  corrBtn.hidden = true;
  sendBtn.insertAdjacentElement('beforebegin', corrBtn);
  let correctionEnVol = false;
  corrBtn.addEventListener('click', async () => {
    const brut = textarea.value.trim();
    if (!brut || correctionEnVol) return;
    correctionEnVol = true;
    corrBtn.disabled = true;
    dire('Correction en cours…');
    try {
      const m = await import('./app-correcteur.js?v=2026_09_06');
      const res = await m.corrigerTexte(brut);
      if (res && res.texte && res.texte.trim() && res.texte.trim() !== brut) {
        textarea.value = res.texte.trim();
        autoResizeTextarea(textarea);
        dire(res.nb_corrections ? `${res.nb_corrections} correction${res.nb_corrections > 1 ? 's' : ''} — relisez avant d'envoyer.` : 'Texte corrigé — relisez avant d\'envoyer.');
      } else {
        dire('Rien à corriger.');
      }
    } catch (e) {
      dire((e && e.message) || 'Correction indisponible pour le moment.', 'error');
    } finally {
      correctionEnVol = false;
      corrBtn.disabled = false;
      majBouton();
    }
  });
  if (micBtn) {
    micBtn.innerHTML = iconeFil('mic', 19);
    micBtn.hidden = true;
  }

  let micBranche = false;

  function majBouton() {
    const aDuTexte = textarea.value.trim().length > 0;
    corrBtn.hidden = !aDuTexte || correctionEnVol;
    if (!micBranche) { sendBtn.hidden = false; return; }
    sendBtn.hidden = !aDuTexte;
    micBtn.hidden = aDuTexte;
  }

  function dire(texte, type) {
    if (indice) { indice.textContent = texte || ''; indice.hidden = !texte; }
    if (texte && type === 'error' && onMessage) onMessage(texte, type);
  }

  // Verrou en vol : deux « Entrée » rapprochés (ou un double appui sur Envoyer)
  // partaient deux fois, le champ n'etant vide qu'apres l'aller-retour reseau.
  let envoiEnVol = false;
  const envoyer = async () => {
    if (envoiEnVol || !textarea.value.trim()) return;
    envoiEnVol = true;
    sendBtn.disabled = true;
    try {
      await onEnvoyer();
    } finally {
      envoiEnVol = false;
      sendBtn.disabled = false;
      autoResizeTextarea(textarea);
      majBouton();
    }
  };

  sendBtn.addEventListener('click', envoyer);
  // Entrée envoie, Maj+Entrée passe à la ligne — le geste attendu partout.
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); }
  });
  textarea.addEventListener('input', () => { autoResizeTextarea(textarea); majBouton(); });

  if (emojiBtn && panel && tabs && grid) {
    initEmojiPicker({
      btn: emojiBtn, panel, tabs, grid, textarea,
      onInsert: () => { autoResizeTextarea(textarea); majBouton(); },
    });
  }

  // Dictée serveur : chargée seulement si la page la demande (suivi.html,
  // page publique du client, ne la charge pas — voir le rapport de tâche).
  if (micro && micBtn) {
    try {
      const d = await import('./app-dictee-serveur.js?v=2026_09_06b');
      if (d.dicteeServeurDisponible()) {
        micBranche = true;
        d.brancherBoutonMaintenu(micBtn, {
          contexte: contexteDictee,          // 'note' : un message, pas un devis
          texteAvant: () => textarea.value,
          onDebut: () => { micBtn.classList.add('mq-dicte'); dire('Parlez… relâchez pour insérer.'); },
          onAttente: () => { micBtn.classList.remove('mq-dicte'); dire('Transcription…'); },
          onFin: (res) => {
            micBtn.classList.remove('mq-dicte');
            dire('');
            const texte = (res && res.texte || '').trim();
            if (!texte) { if (res && res.tropCourt) dire('Trop court — maintenez le bouton pendant que vous parlez.'); return; }
            // Le texte dicté est INSÉRÉ, jamais envoyé tout seul : l'artisan
            // relit avant que son client ne reçoive quoi que ce soit.
            const sep = textarea.value && !/\s$/.test(textarea.value) ? ' ' : '';
            textarea.value = textarea.value + sep + texte;
            textarea.focus();
            autoResizeTextarea(textarea);
            majBouton();
          },
          onErreur: (m) => { micBtn.classList.remove('mq-dicte'); dire(''); if (onMessage) onMessage(m, 'error'); },
        });
      }
    } catch (e) {
      // Module indisponible (hors ligne, cache vide) : le bouton envoyer
      // reste seul, la messagerie fonctionne à l'écrit sans rien casser.
      console.warn('[messagerie] dictée indisponible', e);
    }
  }

  majBouton();
  return { majBouton, micBranche };
}

/**
 * En-tête compact d'un fil : retour, avatar aux initiales, nom + sous-titre
 * sur une ligne. Remplit un élément .mq-fil-tete déjà présent dans la page.
 */
export function rendreEnteteFil(tete, { retourHref, retourLabel = 'Retour', nom, sousTitre = '' }) {
  tete.replaceChildren();

  const retour = document.createElement('a');
  retour.className = 'mq-fil-retour';
  retour.href = retourHref;
  retour.setAttribute('aria-label', retourLabel);
  retour.innerHTML = iconeFil('back', 20);
  tete.appendChild(retour);

  const av = document.createElement('div');
  av.className = 'mq-av';
  av.textContent = initialesDe(nom);
  tete.appendChild(av);

  const bloc = document.createElement('div');
  bloc.className = 'mq-fil-ident';
  const h = document.createElement('h2');
  h.textContent = nom || '';
  bloc.appendChild(h);
  if (sousTitre) {
    const s = document.createElement('small');
    s.textContent = sousTitre;
    bloc.appendChild(s);
  }
  tete.appendChild(bloc);
}

// chat-ui.js — rendu et saisie de la conversation BatiSpot.
//
// Partagé par la page CLIENT (suivi.html) et la page ARTISAN
// (chantier.html). Ce module ne sait RIEN de Supabase : il reçoit des
// messages déjà chargés et appelle un callback pour envoyer. C'est ce qui
// permet aux deux pages de l'utiliser alors qu'elles n'ont pas du tout le
// même accès aux données — le client passe par des RPC à token, l'artisan
// par une session authentifiée.
//
// Voir app/css/chat.css pour la présentation.

export const MAX_CAR = 2000;   // aligné sur post_client_message côté Postgres

// ── Utilitaires d'affichage ──────────────────────────────────────

export function echapper(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function heure(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Séparateur de jour : « Aujourd'hui », « Hier », le jour de la semaine,
// puis la date en clair. On compare des jours calendaires et pas des durées :
// un message d'hier 23 h n'est pas « il y a 2 heures », il est d'hier.
export function libelleJour(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const jour = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const auj = new Date();
  const ecart = Math.round((jour(auj) - jour(d)) / 86400000);
  if (ecart === 0) return "Aujourd'hui";
  if (ecart === 1) return 'Hier';
  if (ecart > 1 && ecart < 7) return d.toLocaleDateString('fr-FR', { weekday: 'long' });
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long',
    year: d.getFullYear() === auj.getFullYear() ? undefined : 'numeric',
  });
}

// Un message composé uniquement d'emoji (max 3) s'affiche en grand et sans
// bulle. \p{Extended_Pictographic} couvre les emoji composés (drapeaux,
// familles, modificateurs de teinte) qu'un intervalle \u{1F300}-… manque.
const RE_EMOJI_SEUL = /^(?:\p{Extended_Pictographic}(?:️|‍|[\u{1F3FB}-\u{1F3FF}])*){1,3}$/u;
export function estEmojiSeul(txt) {
  const t = String(txt ?? '').trim();
  return t.length > 0 && RE_EMOJI_SEUL.test(t);
}

/**
 * Rend un fil de discussion dans un conteneur.
 *
 * @param {HTMLElement} el       conteneur .bsc-list
 * @param {Array}       messages [{ id, author, content, created_at }]
 * @param {object}      opts
 *   - moi        : valeur de `author` correspondant à l'utilisateur courant
 *                  ('client' sur suivi.html, 'pro' sur chantier.html)
 *   - libelles   : { moi: 'Vous', eux: 'Votre artisan' }
 *   - vide       : HTML affiché quand il n'y a aucun message
 *   - forcerBas  : force le défilement en bas même si l'utilisateur avait remonté
 *   - signature  : empreinte du fil déjà affiché (évite de re-rendre pour rien)
 * @returns {string} la nouvelle signature, à repasser au prochain appel
 */
export function rendreFil(el, messages, opts = {}) {
  const {
    moi = 'pro',
    libelles = { moi: 'Vous', eux: 'Lui' },
    vide = 'Aucun message pour l\'instant.',
    forcerBas = false,
    signature: signaturePrec = null,
  } = opts;

  const signature = messages.map((m) => m.id).join(',');
  if (signature === signaturePrec) return signature;

  // On ne recolle en bas que si l'utilisateur y était déjà, sinon on lui
  // arrache sa lecture à chaque rafraîchissement.
  const estEnBas = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  const collerEnBas = forcerBas || signaturePrec === null || estEnBas;

  if (!messages.length) {
    el.innerHTML = `<div class="bsc-vide">${vide}</div>`;
    return signature;
  }

  const cote = (m) => (m.author === moi ? 'moi' : 'eux');
  let html = '';
  let jourPrec = null;

  messages.forEach((m, i) => {
    const c = cote(m);
    const jour = new Date(m.created_at).toDateString();
    if (jour !== jourPrec) {
      html += `<div class="bsc-jour">${echapper(libelleJour(m.created_at))}</div>`;
      jourPrec = jour;
    }

    // Le nom de l'expéditeur n'apparaît qu'en tête de série et l'ergot qu'en
    // pied de série : deux messages d'affilée forment un bloc visuel.
    const prec = messages[i - 1];
    const suiv = messages[i + 1];
    const debutSerie = !prec || cote(prec) !== c
      || new Date(prec.created_at).toDateString() !== jour;
    const finSerie = !suiv || cote(suiv) !== c
      || new Date(suiv.created_at).toDateString() !== jour;

    const seul = estEmojiSeul(m.content);
    const classes = ['bsc-msg', c];
    if (finSerie) classes.push('bout');
    if (seul) classes.push('emoji-seul');

    html += `<div class="${classes.join(' ')}">`
      + (debutSerie && !seul ? `<div class="bsc-auteur">${echapper(c === 'moi' ? libelles.moi : libelles.eux)}</div>` : '')
      + `<span class="bsc-txt">${echapper(m.content).replace(/\n/g, '<br>')}</span>`
      + `<span class="bsc-h">${heure(m.created_at)}</span>`
      + `</div>`;
  });

  el.innerHTML = html;
  if (collerEnBas) el.scrollTop = el.scrollHeight;
  return signature;
}

// ── Sélecteur d'emoji ────────────────────────────────────────────
// Liste embarquée volontairement courte : on écrit à propos d'un chantier,
// pas à ses copains. Première catégorie orientée bâtiment.
export const EMOJIS = [
  { onglet: '🔨', nom: 'Chantier', liste: '👍 👌 🙏 ✅ ❌ ⚠️ 🔨 🔧 🪛 🪚 🧱 🚪 🪟 🚿 🚰 🔌 💡 🪜 🧰 🧹 🎨 🪣 📐 📏 🏠 🏗️ 🚧 📦 🚚 🗝️' },
  { onglet: '🙂', nom: 'Visages',  liste: '🙂 😀 😃 😄 😁 😊 😉 😍 🤩 😎 🤝 😅 😂 🥲 🤔 🤨 😐 😕 🙁 😟 😢 😭 😤 😠 😴 🤒 🥳 😇 🫡 🙌' },
  { onglet: '👋', nom: 'Gestes',   liste: '👋 🤚 ✋ 👌 🤏 ✌️ 🤞 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👏 🙌 🤲 🙏 💪 🫶 ✍️' },
  { onglet: '💬', nom: 'Divers',   liste: '💬 📞 📱 ✉️ 📧 📅 🕐 ⏰ ⏳ 📸 📷 🖼️ 📄 📝 📋 💰 💶 💳 🧾 🔑 ⭐ ❤️ 🎉 ✨ 🔥 ☀️ 🌧️ ❄️ 🚗 ⛽' },
];

/**
 * Câble la barre de saisie : hauteur auto, compteur, emoji, raccourcis.
 *
 * @param {object} els  { input, envoi, emojiBtn, panel, tabs, grid, compteur }
 * @param {Function} onEnvoi  appelé quand l'utilisateur valide
 * @returns {object} { ajusterHauteur, majCompteur, fermerEmojis }
 */
export function brancherSaisie(els, onEnvoi) {
  const { input, envoi, emojiBtn, panel, tabs, grid, compteur } = els;
  let construits = false;

  function ajusterHauteur() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 110) + 'px';
  }

  function majCompteur() {
    if (!compteur) return;
    const n = input.value.length;
    compteur.hidden = n < MAX_CAR * 0.75;
    compteur.textContent = `${n} / ${MAX_CAR}`;
    compteur.classList.toggle('over', n >= MAX_CAR);
  }

  function fermerEmojis() {
    if (!panel) return;
    panel.hidden = true;
    emojiBtn?.setAttribute('aria-expanded', 'false');
  }

  function inserer(emoji) {
    const debut = input.selectionStart ?? input.value.length;
    const fin = input.selectionEnd ?? input.value.length;
    const avant = input.value.slice(0, debut);
    const apres = input.value.slice(fin);
    if ((avant + emoji + apres).length > MAX_CAR) return;
    input.value = avant + emoji + apres;
    const pos = debut + emoji.length;
    input.setSelectionRange(pos, pos);
    input.focus();
    ajusterHauteur();
    majCompteur();
  }

  function afficherCategorie(idx) {
    grid.innerHTML = '';
    EMOJIS[idx].liste.split(' ').filter(Boolean).forEach((e) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = e;
      b.setAttribute('aria-label', `Emoji ${e}`);
      // mousedown plutôt que click : le textarea garde le focus, donc le
      // curseur reste où il était et l'insertion tombe au bon endroit.
      b.addEventListener('mousedown', (ev) => { ev.preventDefault(); inserer(e); });
      grid.appendChild(b);
    });
    [...tabs.children].forEach((t, i) => t.classList.toggle('active', i === idx));
  }

  function construire() {
    if (construits) return;
    construits = true;
    EMOJIS.forEach((cat, i) => {
      const t = document.createElement('button');
      t.type = 'button';
      t.className = 'bsc-emoji-tab';
      t.textContent = cat.onglet;
      t.title = cat.nom;
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-label', cat.nom);
      t.addEventListener('mousedown', (ev) => { ev.preventDefault(); afficherCategorie(i); });
      tabs.appendChild(t);
    });
    afficherCategorie(0);
  }

  envoi.addEventListener('click', onEnvoi);
  input.addEventListener('input', () => { ajusterHauteur(); majCompteur(); });
  input.addEventListener('keydown', (e) => {
    // Entrée envoie (réflexe messagerie), Maj+Entrée passe à la ligne.
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onEnvoi(); }
    if (e.key === 'Escape') fermerEmojis();
  });

  if (emojiBtn && panel) {
    emojiBtn.addEventListener('click', () => {
      construire();
      const ouvrir = panel.hidden;
      panel.hidden = !ouvrir;
      emojiBtn.setAttribute('aria-expanded', String(ouvrir));
      if (ouvrir) input.focus();
    });
    document.addEventListener('click', (e) => {
      if (!panel.hidden && !panel.contains(e.target)
          && e.target !== emojiBtn && !emojiBtn.contains(e.target)) {
        fermerEmojis();
      }
    });
  }

  ajusterHauteur();
  return { ajusterHauteur, majCompteur, fermerEmojis };
}

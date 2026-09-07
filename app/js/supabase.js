// Init Supabase client + helpers partagés
// Chargé avant tout autre script JS dans chaque page

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Le lien du document client d'une facture est compose a UN SEUL endroit
// (js/app-factures.js) : l'ecran Finances, l'assistant et l'envoi ci-dessous
// donnent ainsi litteralement la meme URL. `app-factures.js` n'importe rien,
// donc aucun cycle d'import ici.
import { lienFactureDepuis } from './app-factures.js';

const config = window.__BATISPOT_CONFIG__ || {};
if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
  console.error('[BatiSpot] Config Supabase manquante. Remplis /app/js/config.js');
}

// ⚠️ AUCUN DELAI MAXIMUM SUR 127 DES 131 APPELS SUPABASE (corrige le 02/09/2026).
//
// `fetch` n'a pas de timeout par defaut. Sur une 4G qui « stalle » — connexion
// TCP ouverte, zero octet qui arrive, ce qui est le comportement NORMAL d'un
// reseau de chantier dans une cage d'escalier ou un sous-sol — la promesse ne
// resout ni ne rejette JAMAIS. L'ecran reste sur son indicateur de chargement
// indefiniment, et l'artisan croit l'application plantee.
//
// Pire : le service worker garde la donnee en cache mais ne la sert pas, parce
// que son `.catch()` de repli attend un rejet qui n'arrive pas.
//
// Un seul point de correction couvre TOUS les appels : le client Supabase
// accepte un `fetch` personnalise. C'est la difference entre corriger 127
// endroits et en corriger un.
//
// 15 secondes : assez pour une 4G lente honnete, assez court pour qu'un artisan
// ne reste pas planter devant un ecran mort. Au-dela, on rejette proprement et
// les `catch` deja ecrits font leur travail.
const DELAI_RESEAU_MS = 15000;

function fetchAvecDelai(url, options = {}) {
  // Si l'appelant gere deja son propre signal (upload annulable), on ne s'en
  // mele pas : deux controleurs sur la meme requete, c'est un bug a retardement.
  if (options.signal) return fetch(url, options);

  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), DELAI_RESEAU_MS);
  return fetch(url, { ...options, signal: ctrl.signal })
    .catch((e) => {
      // On renomme l'abandon en erreur reseau lisible : « AbortError » ne dit
      // rien a personne et se confond avec une annulation volontaire.
      if (e?.name === 'AbortError') {
        const err = new Error('Le réseau ne répond pas. Vérifiez votre connexion.');
        err.delaiDepasse = true;
        throw err;
      }
      throw e;
    })
    .finally(() => clearTimeout(minuteur));
}

export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY,
  {
    global: { fetch: fetchAvecDelai },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
      storage: localStorage,
    },
  }
);

// ── Toasts ─────────────────────────────────────────────
export function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 250); }, 3000);
}

// ── Format ─────────────────────────────────────────────
export const fmtDate = (d) => {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const fmtDateTime = (d) => {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
export const fmtEuro = (n) => {
  if (n == null || isNaN(n)) return '— €';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
};
export const STATUS_LABEL = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  retard: 'En retard',
  termine: 'Terminé',
};
export const DEVIS_STATUS_LABEL = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  expire: 'Expiré',
};

// Compte interne : celui de l'equipe BatiSpot, qui garde l'acces a son espace
// meme sans dossier artisan valide.
//
// ⚠️ L'adresse personnelle de Moctar etait ecrite ICI, dans un module servi par
// batispot.pro. Elle designait publiquement le compte le plus interessant a
// attaquer. Ce fichier est le plus telecharge de l'application.
//
// On interroge desormais le serveur. La reponse est un oui/non : elle ne dit
// jamais QUI est interne. Le domaine @batispot.pro reste teste ici parce qu'il
// ne revele aucune personne — c'est deja le nom du site.
//
// Cette fonction ne pilote que du CONFORT d'affichage. Les vrais droits sont
// portes par la RLS et par est_admin() cote base : meme forcee a true dans la
// console, elle ne donne acces a aucune donnee supplementaire.
export async function isVipUser(email) {
  const e = String(email || '').trim().toLowerCase();
  if (e.endsWith('@batispot.pro')) return true;
  if (!e) return false;
  try {
    const { data, error } = await supabase.rpc('est_admin');
    return !error && data === true;
  } catch (_) {
    return false;   // dans le doute, pas de traitement de faveur
  }
}

// ── Auth helpers ───────────────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
// ── « Le serveur dit non » ≠ « je n'ai pas pu demander » ──────────────────
//
// ⚠️ UN ARTISAN HORS RÉSEAU ÉTAIT ÉJECTÉ VERS login.html (corrigé le
// 05/09/2026). Le jeton d'accès Supabase vit 1 heure. Passé ce délai sans
// réseau, `getSession()` ne peut pas le rafraîchir et rend `null` — exactement
// comme si la session avait été révoquée. On redirigeait donc vers une page
// où, hors ligne, AUCUN lien magique ne peut arriver : une impasse. Le jeton
// de rafraîchissement et le journal des devis en attente étaient toujours dans
// `localStorage` ; l'artisan ne pouvait simplement plus les atteindre.
//
// Le refresh token vit bien plus longtemps qu'une heure. Rien n'oblige à
// déconnecter quelqu'un dont on n'a pas pu joindre le serveur.

// La session telle que supabase-js l'a persistée. On la lit à la main parce
// que c'est le seul moyen de savoir qu'une session EXISTE quand `getSession()`
// rend null faute d'avoir pu la rafraîchir.
function cleStockageSession() {
  try {
    const ref = new URL(config.SUPABASE_URL).hostname.split('.')[0];
    return `sb-${ref}-auth-token`;
  } catch (_) { return null; }
}

function sessionPersistee() {
  const cle = cleStockageSession();
  if (!cle) return null;
  try {
    const brut = localStorage.getItem(cle);
    if (!brut) return null;
    const o = JSON.parse(brut);
    const sess = o && o.access_token ? o : (o && o.currentSession) || null;
    return sess && sess.refresh_token && sess.user ? sess : null;
  } catch (_) { return null; }
}

// Le serveur est-il seulement joignable ? On le DEMANDE au lieu de croire
// `navigator.onLine`, qui reste `true` sous l'émulation réseau de DevTools et
// qui, sur un téléphone, ment dès qu'un portail Wi-Fi capte sans router.
//
// ⚠️ PAS via supabase-js. Une première version demandait
// `supabase.auth.refreshSession()` : hors ligne, supabase-js réessaie le
// rafraîchissement en boucle (8 tentatives, ~25 s) et sérialise tous les
// appels sur le même verrou interne — mesuré le 05/09/2026 : plus de deux
// minutes sans bandeau ni écran. Une sonde brute vers /auth/v1/health, avec
// son propre délai de 4 s, répond en quelques millisecondes hors ligne.
// N'importe quelle réponse HTTP (même 4xx) prouve que le serveur est là.
const DELAI_SONDE_MS = 4000;
async function serveurInjoignable() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), DELAI_SONDE_MS);
  try {
    await fetch(`${config.SUPABASE_URL}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: config.SUPABASE_ANON_KEY },
      cache: 'no-store',
      signal: ctrl.signal,
    });
    return false;
  } catch (_) {
    return true;
  } finally {
    clearTimeout(minuteur);
  }
}

// Le jeton d'accès persisté est-il déjà périmé (marge de 30 s) ? Si oui,
// `getSession()` va vouloir le rafraîchir : c'est LE cas où, hors ligne,
// il faut trancher AVANT de laisser supabase-js réessayer pendant 25 s.
function jetonPerime(sess) {
  const exp = Number(sess && sess.expires_at);
  if (!exp) return false;
  return exp * 1000 < Date.now() + 30000;
}

// Bandeau honnête, en haut de l'écran, plutôt qu'une redirection.
function bandeauSessionHorsLigne() {
  if (document.getElementById('bs-bandeau-session-hors-ligne')) return;
  const poser = () => {
    if (document.getElementById('bs-bandeau-session-hors-ligne')) return;
    const b = document.createElement('div');
    b.id = 'bs-bandeau-session-hors-ligne';
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;'
      + 'background:#FEF6E7;border-bottom:1px solid #E9C989;color:#7A4E06;'
      + 'padding:10px 14px;font-size:13px;line-height:1.4;font-weight:600;'
      + 'text-align:center;font-family:inherit;';
    b.textContent = "Hors ligne — votre session n'a pas pu être vérifiée. "
      + "Vous restez connecté ; tout se remettra à jour au retour du réseau.";
    document.body.appendChild(b);
  };
  if (document.body) poser();
  else document.addEventListener('DOMContentLoaded', poser, { once: true });

  // Au retour du réseau : le jeton se rafraîchit et l'écran se recharge avec
  // de vraies données. On ne laisse pas l'artisan sur une page périmée.
  if (!window.__BS_RETENTE_SESSION) {
    window.__BS_RETENTE_SESSION = true;
    window.addEventListener('online', async () => {
      try {
        const { data } = await supabase.auth.refreshSession();
        if (data && data.session) location.reload();
      } catch (_) { /* toujours pas de réseau : on réessaiera au prochain online */ }
    });
  }
}

export async function requireAuth(redirectTo = './login.html') {
  const persistee = sessionPersistee();

  // Jeton périmé + serveur injoignable : on tranche tout de suite, sans
  // passer par `getSession()` — qui, hors ligne, mettrait ~25 s à rendre
  // null (voir serveurInjoignable). On n'a PAS pu demander : on garde
  // l'artisan sur son écran.
  if (persistee && jetonPerime(persistee) && await serveurInjoignable()) {
    console.warn('[BatiSpot] Session non vérifiable hors ligne — pas de redirection.');
    bandeauSessionHorsLigne();
    return persistee;
  }

  const session = await getSession();
  if (session) return session;

  // Pas de session utilisable. Deux cas très différents : le serveur a dit
  // non, ou on n'a pas réussi à lui demander (réseau tombé entre-temps).
  if (persistee && await serveurInjoignable()) {
    console.warn('[BatiSpot] Session non vérifiable hors ligne — pas de redirection.');
    bandeauSessionHorsLigne();
    return persistee;
  }

  // Le serveur a répondu, ou il n'y a rien à garder : là, c'est une vraie
  // déconnexion.
  window.location.href = redirectTo;
  return null;
}
export async function signOut() {
  // Flag pour distinguer un signOut volontaire d'une expiration inattendue (cf. listener
  // onAuthStateChange plus bas). Sans ca, la redirection automatique sur perte de
  // session redirigerait deux fois et casserait le flux.
  window.__BS_SIGNING_OUT = true;
  try { await supabase.auth.signOut(); } catch (_) {}
  // Nettoyage best-effort des prefs locaux pour eviter qu'un autre user heritent des toggles
  try { localStorage.removeItem('batispot_notif_prefs'); } catch (_) {}
  // Retour a l'ecran de choix "Je suis client / Je suis artisan"
  window.location.href = './index.html';
}

// ─────────────────────────────────────────────────────────
// Session expiration handler (P2)
// Si le token Supabase expire pendant que l'user utilise l'app, il se retrouve
// sur une page figee (les fetch retournent 401 sans rien afficher). Ce listener
// detecte la perte de session involontaire et redirige proprement.
// ─────────────────────────────────────────────────────────
let __wasSignedIn = false;
supabase.auth.onAuthStateChange((event, session) => {
  if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
    __wasSignedIn = true;
    return;
  }
  if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
    // Si signOut volontaire (clic Deconnexion), on laisse signOut() gerer le redirect
    if (window.__BS_SIGNING_OUT) return;
    // Si on n'avait jamais ete logge sur cette page (cas d'une page publique),
    // pas la peine de rediriger
    if (!__wasSignedIn) return;
    // Pages publiques ou de transition : pas de redirect (l'auth-flow normal gere)
    const path = (window.location.pathname || '').toLowerCase();
    const isPublic = /\/(index|login|client-login|welcome|auth-callback|demande-devis|404|offline|clear-cache)\.html$/.test(path)
      || path === '/' || path === '/app/' || path === '/app';
    if (isPublic) return;
    // Session perdue (token expire / revoque) → redirect vers ecran de choix
    console.warn('[BatiSpot] Session perdue, redirection vers /app/index.html');
    try { localStorage.removeItem('batispot_notif_prefs'); } catch (_) {}
    window.location.href = '/app/index.html';
  }
});

// ── Profil pro ─────────────────────────────────────────
export async function getMyProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('pro_profiles')
    .select('*')
    .eq('pro_id', session.user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function upsertMyProfile(patch) {
  const session = await getSession();
  const { data, error } = await supabase
    .from('pro_profiles')
    .upsert({ pro_id: session.user.id, ...patch })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function uploadLogo(file) {
  const session = await getSession();
  const ext = (file.name.split('.').pop() || 'png').toLowerCase();
  if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    throw new Error('Formats acceptés : PNG, JPG, WEBP');
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Logo trop lourd (max 2 Mo)');
  }
  const path = `${session.user.id}/_profile/logo.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('chantiers')
    .upload(path, file, { contentType: file.type, upsert: true, cacheControl: '3600' });
  if (upErr) throw upErr;
  await upsertMyProfile({ logo_storage_path: path });
  return path;
}
export async function logoAsDataUrl(storagePath) {
  if (!storagePath) return null;
  const { data, error } = await supabase.storage
    .from('chantiers')
    .createSignedUrl(storagePath, SIGNATURE_SECONDES);
  if (error) return null;
  const res = await fetch(data.signedUrl, { cache: 'no-cache' });
  if (!res.ok) return null;
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('Lecture logo impossible'));
    r.readAsDataURL(blob);
  });
}

// ── Chantiers ──────────────────────────────────────────
export async function listChantiers() {
  const { data, error } = await supabase
    .from('chantiers')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}
export async function getChantier(id) {
  const { data, error } = await supabase.from('chantiers').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
export async function createChantier(payload) {
  const session = await getSession();
  const { data, error } = await supabase
    .from('chantiers')
    .insert({ ...payload, pro_id: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function updateChantier(id, patch) {
  const { data, error } = await supabase
    .from('chantiers')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function deleteChantier(id) {
  const { error } = await supabase.from('chantiers').delete().eq('id', id);
  if (error) throw error;
}

// ── Photos ─────────────────────────────────────────────
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;        // 8 Mo limite hard
const ACCEPTED_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

// Compresse une image > 1.5 Mo via canvas avant upload (réduit la conso storage Supabase)
async function compressIfLarge(file, targetMaxBytes = 1_500_000, maxDim = 1920) {
  if (file.size <= targetMaxBytes || !file.type.startsWith('image/')) return file;
  if (file.type === 'image/heic') return file;  // canvas ne lit pas HEIC, on laisse
  try {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * ratio);
    const h = Math.round(bitmap.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.82));
    if (blob && blob.size < file.size) {
      const newName = file.name.replace(/\.\w+$/, '') + '.jpg';
      return new File([blob], newName, { type: 'image/jpeg' });
    }
  } catch (e) {
    console.warn('[compressIfLarge] échec, on garde le fichier brut', e);
  }
  return file;
}

export async function uploadPhoto(chantierId, file, caption = '', phase = 'pendant', { visibleClient = false } = {}) {
  // Validation MIME
  if (!ACCEPTED_PHOTO_MIMES.includes(file.type)) {
    throw new Error(`Format non supporté (${file.type || 'inconnu'}). Utilise JPEG, PNG, WebP ou HEIC.`);
  }
  // Validation taille
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error(`Photo trop volumineuse (${Math.round(file.size / 1_048_576)} Mo). Limite : 8 Mo.`);
  }
  // Compression auto pour économiser le storage Supabase
  const fileToUpload = await compressIfLarge(file);

  const session = await getSession();
  const ext = (fileToUpload.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${session.user.id}/${chantierId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('chantiers')
    .upload(path, fileToUpload, { contentType: fileToUpload.type, cacheControl: '3600' });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from('photos')
    .insert({ chantier_id: chantierId, storage_path: path, caption, phase, visible_client: !!visibleClient })
    .select()
    .single();
  if (error) throw error;
  return data;
}
// ── Photos dans les MESSAGES (Moctar 06/09 : « partager des photos qui sont
// dans l'appli, dans son tel ou dans son drive ») ─────────────────────────
// Message direct : pas de chantier → dossier `<moi>/direct-<destinataire>/`,
// lisible par le destinataire (politique chantiers_select_direct). Pas de
// ligne `photos` : ce n'est pas une photo de chantier.
export async function uploadPhotoDirect(destinataireId, file) {
  if (!ACCEPTED_PHOTO_MIMES.includes(file.type)) {
    throw new Error(`Format non supporté (${file.type || 'inconnu'}). Utilise JPEG, PNG, WebP ou HEIC.`);
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error(`Photo trop volumineuse (${Math.round(file.size / 1_048_576)} Mo). Limite : 8 Mo.`);
  }
  const fileToUpload = await compressIfLarge(file);
  const session = await getSession();
  const ext = (fileToUpload.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${session.user.id}/direct-${destinataireId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from('chantiers')
    .upload(path, fileToUpload, { contentType: fileToUpload.type, cacheControl: '3600' });
  if (error) throw error;
  return path;
}
// Les photos des chantiers de mon équipe, les plus récentes d'abord (sélecteur
// « Photos de l'appli » des messages directs).
export async function listPhotosEquipe(limite = 60) {
  const { data, error } = await supabase
    .from('photos')
    .select('id, chantier_id, storage_path, caption, taken_at, visible_client, chantiers(client_name)')
    .order('taken_at', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data || [];
}
// Une photo envoyée au client dans le fil devient visible sur sa page de suivi.
export async function marquerPhotoVisibleClient(photoId) {
  const { error } = await supabase.from('photos').update({ visible_client: true }).eq('id', photoId);
  if (error) throw error;
}
export async function listPhotos(chantierId) {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('chantier_id', chantierId)
    .order('phase')
    // La table photos n'a PAS de colonne created_at (schéma : taken_at).
    // L'ancien .order('created_at') faisait échouer la requête → galerie vide partout.
    .order('taken_at', { ascending: true });
  if (error) throw error;
  return data;
}
// Les pièces déjà « rangées » automatiquement (04/09/2026) : `pieces_chantier`
// est écrite par signer-devis, pv-reception et envoyer-facture-client à
// chaque événement — jamais par un dépôt manuel. Sert « Pièces déjà
// rangées » de l'onglet Docs (chantier-dossier.js). RLS : pro_id = auth.uid().
export async function listPiecesChantier(chantierId) {
  const { data, error } = await supabase
    .from('pieces_chantier')
    .select('id, type, label, url_relative, created_at')
    .eq('chantier_id', chantierId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function deletePhoto(photo) {
  await supabase.storage.from('chantiers').remove([photo.storage_path]);
  const { error } = await supabase.from('photos').delete().eq('id', photo.id);
  if (error) throw error;
}
// ── Photos côté client (06/09/2026, « Photos de chantier en trois temps ») ──
// Rien ne part chez le client tout seul : `photos.visible_client` (défaut
// false) dit qu'une photo est sur la page de suivi, `photos.role_client`
// ('avant' | 'apres') sa place dans le comparateur. Colonnes ajoutées par
// app/supabase-photos-client-2026-09-06.sql ; tant qu'elle n'est pas
// appliquée, PostgREST répond PGRST204 / 42703 — l'appelant l'explique et
// rien n'est envoyé (js/photos-galerie.js, expliquerErreurPhotos).
export async function setPhotosVisiblesClient(ids, visible) {
  const liste = (ids || []).filter(Boolean);
  if (!liste.length) return;
  const { error } = await supabase
    .from('photos')
    .update({ visible_client: visible === true })
    .in('id', liste);
  if (error) throw error;
}
// Une seule photo « avant » et une seule « après » par chantier : marquer
// une photo retire d'abord le rôle à celle qui le portait. Marquer rend
// aussi visible : le comparateur se compose avec des photos envoyées.
export async function setPhotoRoleClient(chantierId, photoId, role) {
  if (role !== 'avant' && role !== 'apres') throw new Error('Rôle inconnu.');
  const { error: e1 } = await supabase
    .from('photos')
    .update({ role_client: null })
    .eq('chantier_id', chantierId)
    .eq('role_client', role);
  if (e1) throw e1;
  const { error: e2 } = await supabase
    .from('photos')
    .update({ role_client: role, visible_client: true })
    .eq('id', photoId);
  if (e2) throw e2;
}
// Le bucket "chantiers" est PRIVÉ depuis le 16/08/2026. Il était public pour
// que le lien de suivi client fonctionne sans session — mais toute personne
// disposant d'une URL (email transféré, historique, referer) pouvait voir
// l'intérieur du logement d'un client. On signe désormais des liens temporaires.
//
//   • artisan connecté   → signPhotoUrls() / photoUrlAsync() ci-dessous
//   • client sans compte → Edge Function chantier-photos (valide son token)
//
// Ne pas revenir à getPublicUrl() : la politique de lecture ouverte à tous a
// été supprimée, l'URL renvoyée ne chargerait plus.
const SIGNATURE_SECONDES = 3600;

// Signe plusieurs chemins en un seul appel et renseigne p.url sur chaque photo.
// À appeler AVANT le rendu : l'affichage des tuiles est synchrone.
export async function signPhotoUrls(photos) {
  const list = (photos || []).filter((p) => p && p.storage_path);
  if (!list.length) return photos || [];
  const { data, error } = await supabase.storage
    .from('chantiers')
    .createSignedUrls(list.map((p) => p.storage_path), SIGNATURE_SECONDES);
  if (error) return photos;
  const parChemin = new Map((data || []).map((d) => [d.path, d.signedUrl]));
  list.forEach((p) => { p.url = parChemin.get(p.storage_path) || null; });
  return photos;
}

export async function photoUrlAsync(storagePath) {
  if (!storagePath) return null;
  const { data, error } = await supabase.storage
    .from('chantiers')
    .createSignedUrl(storagePath, SIGNATURE_SECONDES);
  return error ? null : data.signedUrl;
}

// ── Messages ───────────────────────────────────────────
// Fil ARTISAN ↔ CLIENT uniquement. La table `messages` porte aussi la
// messagerie interne d'équipe (visible_client = false, author = 'membre') :
// sans ce filtre l'artisan verrait dans l'onglet « Messages » du chantier des
// notes internes que son client, lui, ne reçoit pas — la fonction publique
// get_messages_by_token les écarte déjà côté client. Les deux vues doivent
// montrer exactement le même fil, sinon l'artisan croit avoir écrit au client.
export async function listMessages(chantierId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chantier_id', chantierId)
    .eq('visible_client', true)
    .in('author', ['pro', 'client'])
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}
export async function sendMessage(chantierId, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chantier_id: chantierId, author: 'pro', content, visible_client: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Modifier / supprimer SON message tant qu'il n'a pas été lu (Moctar 06/09).
// Les règles vraies sont dans le déclencheur messages_garde_modif (base) :
// auteur seulement, jamais un message du client, pas après lecture, et pour
// le fil client (jamais marqué lu par la page publique) 15 min pour modifier,
// 48 h pour supprimer. Ici on filtre déjà lu_le is null pour ne rien tenter
// d'inutile ; 0 ligne = déjà lu.
export async function modifierMessage(id, content) {
  const { data, error } = await supabase
    .from('messages').update({ content }).eq('id', id).is('lu_le', null).select();
  if (error) throw error;
  if (!data || !data.length) throw new Error('Ce message a déjà été lu : il ne peut plus être modifié.');
  return data[0];
}
export async function supprimerMessage(id) {
  const { data, error } = await supabase
    .from('messages').delete().eq('id', id).is('lu_le', null).select('id');
  if (error) throw error;
  if (!data || !data.length) throw new Error('Ce message a déjà été lu : il ne peut plus être supprimé.');
}

// ── Devis (lecture uniquement — création retirée de l'app) ────────────
// Lecture conservée pour pub_getDevis (vue client : suivi.html) qui affiche
// les devis envoyés depuis l'extérieur de l'app. Aucune création/modif possible.
// devis_visible, pas devis : les montants ne sont plus lisibles sur la table
// (privilège de colonne retiré le 23/08 — voir devis-store.js pour le pourquoi).
export async function listDevis(chantierId) {
  const { data, error } = await supabase
    .from('devis_visible')
    .select('*')
    .eq('chantier_id', chantierId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
export async function getDevis(id) {
  const { data, error } = await supabase.from('devis_visible').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

// ── IA devis ───────────────────────────────────────────
// (conservée pour usage externe potentiel — pas appelée dans l'app PWA)
export async function aiDraftDevis(description, context = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${config.SUPABASE_URL}/functions/v1/ai-devis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ description, context }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Erreur IA');
  }
  return res.json();
}

// ── Public client API (via token, sans auth) ──────────
export async function pub_getChantier(token) {
  const { data, error } = await supabase.rpc('get_chantier_by_token', { p_token: token });
  if (error) throw error;
  return data?.[0] || null;
}
// Le client de suivi n'a pas de session : il ne peut pas signer d'URL lui-même.
// L'Edge Function valide son token puis renvoie des liens temporaires. Chaque
// photo arrive avec un champ `url` déjà signé — voir chantier-photos/index.ts.
export async function pub_getPhotos(token) {
  const { data, error } = await supabase.functions.invoke('chantier-photos', {
    body: { token },
  });
  if (error) throw error;
  return data?.photos || [];
}
// Les mentions legales de l'artisan : assureur, n° de police, etendue de la
// garantie, mediateur de la consommation. Elles existaient en base et n'etaient
// lues que par les documents imprimables — le client ne les voyait donc jamais
// depuis son suivi, alors que ce sont precisement les references qu'on lui
// demande de conserver dix ans.
export async function pub_getEntreprise(token) {
  const { data, error } = await supabase.rpc('get_entreprise_by_token', { p_token: token });
  if (error) throw error;
  return data?.[0] || null;
}
// Les pieces reglementaires que l'artisan a marquees `visibilite = 'client'`
// dans son coffre : decennale, RC pro, PV de reception, garanties. Meme
// mecanique que les photos — bucket prive, URL signees cote serveur.
// Renvoie aussi `logo_url` (04/09/2026) : la fonction Edge signe desormais
// le logo de l'artisan au meme appel, pour l'en-tete de suivi.html — le
// bucket `chantiers` est prive et le client anonyme ne peut pas le signer
// lui-meme (voir supabase/functions/chantier-documents/index.ts).
export async function pub_getDocuments(token) {
  const { data, error } = await supabase.functions.invoke('chantier-documents', {
    body: { token },
  });
  if (error) throw error;
  return { documents: data?.documents || [], logo_url: data?.logo_url || null };
}
// Les pièces déjà « rangées » côté serveur (04/09/2026) : `pieces_chantier`
// est alimentée automatiquement par signer-devis, pv-reception et
// envoyer-facture-client — jamais par un geste manuel côté écran. Sert
// « Votre dossier » de suivi.html, en plus des attestations partagées et
// des photos. `url_relative` est relatif à /app/, jamais une URL complète.
export async function pub_getPieces(token) {
  const { data, error } = await supabase.rpc('get_pieces_by_token', { p_token: token });
  if (error) throw error;
  return data || [];
}
export function lienPiece(urlRelative) {
  if (!urlRelative) return null;
  return `${location.origin}/app/${String(urlRelative).replace(/^\/?app\//, '').replace(/^\//, '')}`;
}
export async function pub_getMessages(token) {
  const { data, error } = await supabase.rpc('get_messages_by_token', { p_token: token });
  if (error) throw error;
  return data || [];
}
export async function pub_postMessage(token, content) {
  const { error } = await supabase.rpc('post_client_message', { p_token: token, p_content: content });
  if (error) throw error;
}
export async function pub_getDevis(token) {
  const { data, error } = await supabase.rpc('get_devis_by_token', { p_token: token });
  if (error) throw error;
  return data || [];
}
// Le deroule du chantier, cote client (01/09). La page suivi affichait le devis
// et les messages, mais jamais les etapes : le client ne savait pas ce qui allait
// se passer ni quand. Meme modele que les trois autres fonctions publiques —
// SECURITY DEFINER, filtre par le token du lien, lecture seule.
export async function pub_getTaches(token) {
  const { data, error } = await supabase.rpc('get_taches_by_token', { p_token: token });
  if (error) throw error;
  return data || [];
}
// Le client accepte ou refuse son devis depuis la page de suivi.
// Le nom du signataire est exige cote base pour une acceptation : une acceptation
// anonyme ne prouve rien. Le declencheur notify_push_on_devis_accepte previent
// ensuite l'artisan.
// Les factures du chantier, cote client. Les brouillons ne sortent jamais.
export async function pub_getFactures(token) {
  const { data, error } = await supabase.rpc('get_factures_by_token', { p_token: token });
  if (error) throw error;
  return data || [];
}
// `signature` est le trace manuscrit du client (PNG en data URI). Le serveur
// l'EXIGE pour une acceptation et verifie son format : un controle qui ne vit
// que dans la page se contourne, et c'est nous qui devrons produire la preuve
// en cas de contestation.
export async function pub_respondDevis(token, devisId, response, signataire, signature = null) {
  const { error } = await supabase.rpc('client_respond_devis', {
    p_token: token, p_devis_id: devisId, p_response: response,
    p_signataire: signataire || null, p_signature: signature || null
  });
  if (error) throw error;
}

// ── Client (particulier) ───────────────────────────────
export const TYPE_TRAVAUX_LABEL = {
  salle_bain: 'Salle de bain',
  cuisine: 'Cuisine',
  peinture: 'Peinture / revêtements',
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  toiture: 'Toiture',
  facade: 'Façade / ravalement',
  autre: 'Autre',
};
export const BUDGET_LABEL = {
  '< 2000': 'Moins de 2 000 €',
  '2000-5000': '2 000 – 5 000 €',
  '5000-10000': '5 000 – 10 000 €',
  '10000-30000': '10 000 – 30 000 €',
  '> 30000': 'Plus de 30 000 €',
};
export const DELAI_LABEL = {
  urgent: 'Urgent (< 15 jours)',
  '1_mois': 'Dans le mois',
  '3_mois': 'Dans les 3 mois',
  pas_presse: 'Pas pressé',
};
export const DEMANDE_STATUS_LABEL = {
  nouvelle: 'Nouvelle',
  en_traitement: 'En traitement',
  matchee: 'Artisan trouvé',
  chantier_cree: 'Chantier en cours',
  abandonnee: 'Abandonnée',
};

// Formulaire public (avant auth) — insert anonyme (client_id = null)
export async function submitDemandeDevis(payload, turnstileToken) {
  // Anti-bot : le widget etait affiche sur ce formulaire depuis des semaines,
  // mais son token n'etait jamais lu ni verifie. verify-turnstile est
  // fail-open sans secret configure (dev), donc en l'absence de token ce
  // garde ne bloque rien tant que TURNSTILE_SECRET_KEY n'est pas pose.
  const { data: v, error: eV } = await supabase.functions.invoke('verify-turnstile', {
    body: { token: turnstileToken || '', action: 'demande_devis' },
  });
  if (eV || !v || v.ok !== true) {
    throw new Error('Validation anti-spam echouee. Rechargez la page et reessayez.');
  }

  // On passe par une fonction SECURITY DEFINER au lieu d'un insert direct.
  // L'ancien `.insert().select().single()` obligeait a garder une policy de
  // lecture anonyme sur la table ; celle qui existait (`anon_read_own_orphan`,
  // fenetre de 5 s) laissait en realite moissonner les leads de TOUT LE MONDE
  // — nom, email, telephone, adresse. Fermee le 30/08/2026.
  // La fonction insere et ne renvoie que l'id, dont on a besoin pour ranger
  // les photos dans demandes/<id>/. Voir supabase-rls-fuite-leads-2026-08-30.sql.
  const { data, error } = await supabase.rpc('creer_demande_devis', {
    p: { ...payload, client_id: null },
  });
  if (error) throw error;
  if (!data) throw new Error('Demande non enregistree. Reessayez.');
  // La fonction renvoie un uuid nu ; le reste de l'app attend un objet avec
  // `.id` (chemin d'upload des photos dans demande-devis.html).
  return { id: data };
}

// Associer une demande "orpheline" (sans client_id) au compte qui vient de s'authentifier
// Critère : même email (normalisé). Pas de limite de temps — la RLS protège déjà par email.
export async function claimOrphanDemandes() {
  const session = await getSession();
  if (!session) return 0;
  const email = (session.user.email || '').toLowerCase();
  const { data, error } = await supabase
    .from('demandes_devis')
    .update({ client_id: session.user.id })
    .is('client_id', null)
    .eq('client_email', email)
    .select('id');
  if (error) { console.warn('[claim orphan]', error); return 0; }
  return (data || []).length;
}

export async function getMyClientProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('client_profiles')
    .select('*')
    .eq('client_id', session.user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
export async function upsertMyClientProfile(patch) {
  const session = await getSession();
  const { data, error } = await supabase
    .from('client_profiles')
    .upsert({ client_id: session.user.id, ...patch })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function listMyDemandes() {
  const { data, error } = await supabase
    .from('demandes_devis')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Demandes client + info artisan quand le pro a accepté (via RPC security definer)
export async function listMyDemandesWithArtisan() {
  const { data, error } = await supabase.rpc('get_my_demandes_with_artisan');
  if (error) {
    // Fallback : la fonction SQL n'est peut-être pas encore déployée
    console.warn('[listMyDemandesWithArtisan] RPC unavailable, fallback:', error.message);
    return listMyDemandes();
  }
  return data || [];
}
export async function listMyClientChantiers() {
  const session = await getSession();
  if (!session) return [];
  const { data, error } = await supabase
    .from('chantiers')
    .select('*')
    .eq('client_user_id', session.user.id)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── Coffre fort documents (client + artisan) ─────────────
const MAX_DOC_BYTES = 20 * 1024 * 1024;
const ACCEPTED_DOC_MIMES = ['application/pdf','image/jpeg','image/png','image/webp','image/heic'];
export const DOC_TYPE_LABEL = {
  plan: 'Plan',
  devis: 'Devis',
  facture: 'Facture',
  photo: 'Photo',
  autre: 'Document',
};

export async function uploadClientDoc(demandeId, file, docType = 'plan') {
  if (!ACCEPTED_DOC_MIMES.includes(file.type)) {
    throw new Error('Format non supporté. Acceptés : PDF, JPG, PNG, WebP, HEIC.');
  }
  if (file.size > MAX_DOC_BYTES) {
    throw new Error(`Fichier trop lourd (${Math.round(file.size / 1048576)} Mo). Limite : 20 Mo.`);
  }
  const session = await getSession();
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().slice(0, 5);
  const path = `${session.user.id}/${demandeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('client-docs')
    .upload(path, file, { contentType: file.type, cacheControl: '3600' });
  if (upErr) throw upErr;
  const { data, error } = await supabase
    .from('client_documents')
    .insert({ demande_id: demandeId, uploader_id: session.user.id, uploader_role: 'client',
              doc_type: docType, file_name: file.name, storage_path: path, file_size: file.size })
    .select().single();
  if (error) throw error;
  return data;
}

export async function uploadArtisanDoc(demandeId, file, docType = 'devis') {
  if (file.size > MAX_DOC_BYTES) {
    throw new Error(`Fichier trop lourd (${Math.round(file.size / 1048576)} Mo). Limite : 20 Mo.`);
  }
  const session = await getSession();
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().slice(0, 5);
  const path = `${session.user.id}/${demandeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('client-docs')
    .upload(path, file, { contentType: file.type, cacheControl: '3600' });
  if (upErr) throw upErr;
  const { data, error } = await supabase
    .from('client_documents')
    .insert({ demande_id: demandeId, uploader_id: session.user.id, uploader_role: 'artisan',
              doc_type: docType, file_name: file.name, storage_path: path, file_size: file.size })
    .select().single();
  if (error) throw error;
  return data;
}

export async function listClientDocs(demandeId = null) {
  let q = supabase.from('client_documents').select('*').order('created_at', { ascending: false });
  if (demandeId) q = q.eq('demande_id', demandeId);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function clientDocSignedUrl(storagePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from('client-docs')
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteClientDoc(id, storagePath) {
  // La ligne d'abord, le fichier ensuite — jamais l'inverse.
  // Dans l'autre ordre, si la RLS refuse la suppression en base, le fichier a
  // deja disparu et il reste une ligne fantome pointant vers du vide : le
  // document apparait encore dans la liste et devient intelechargeable.
  // Ici, si le retrait du fichier echoue, il reste un fichier orphelin dans le
  // stockage — invisible, et sans consequence pour l'utilisateur.
  // Meme ordre que coffre.html, qui le faisait deja correctement.
  const { error } = await supabase.from('client_documents').delete().eq('id', id);
  if (error) throw error;
  try {
    await supabase.storage.from('client-docs').remove([storagePath]);
  } catch (e) {
    console.warn('[docs] ligne supprimee, fichier non retire du stockage', e);
  }
}

// ── Demandes pour artisan ──────────────────────────────
// Utilise la vue demandes_publiques qui anonymise les PII tant que pro_id != auth.uid().
// L'artisan voit la demande (type travaux, ville, budget) mais pas l'email/tel/adresse
// du client — ces infos n'apparaissent qu'apres claim via claim_demande RPC.
export async function listNouvellesDemandes() {
  const { data, error } = await supabase
    .from('demandes_publiques')
    .select('*')
    .in('status', ['nouvelle', 'en_traitement'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function accepterDemande(demandeId, demandeData) {
  // 1. Réservation atomique via RPC claim_demande
  const { data: claimed, error: claimErr } = await supabase
    .rpc('claim_demande', { p_demande_id: demandeId });
  if (claimErr) {
    throw new Error(claimErr.message || 'Impossible de réserver cette demande');
  }

  // 2. Créer le chantier — rollback du claim si ça échoue
  let chantier;
  try {
    chantier = await createChantier({
      client_name:  demandeData.client_name  || (claimed && claimed.client_name),
      client_email: demandeData.client_email || (claimed && claimed.client_email),
      client_phone: demandeData.client_phone || (claimed && claimed.client_phone),
      adresse:      demandeData.adresse      || (claimed && claimed.adresse),
      description:  demandeData.description  || (claimed && claimed.description),
    });
  } catch (err) {
    // Remettre la demande à l'état initial pour éviter une donnée fantôme
    await supabase
      .from('demandes_devis')
      .update({ pro_id: null, status: 'nouvelle' })
      .eq('id', demandeId);
    throw err;
  }

  // 3. Lier le chantier à la demande
  const { error: linkErr } = await supabase
    .from('demandes_devis')
    .update({ chantier_id: chantier.id, status: 'matchee' })
    .eq('id', demandeId);
  if (linkErr) {
    console.warn('[accepterDemande] lien chantier→demande échec:', linkErr);
  }

  return chantier;
}

// Determine si l'user authentifie est un CLIENT (a un client_profile ou une demande_devis a son nom).
// Utilise sur les pages artisan pour eviter qu'un compte client tombe sur "Deposer ma candidature".
// Retourne true si l'user a un signal "client" et AUCUN signal "artisan" (artisan_leads vide).
export async function isClientAccount(session) {
  if (!session) return false;
  const userId = session.user.id;
  const userEmail = (session.user.email || '').toLowerCase();
  try {
    // Requêtes liées par .eq() uniquement (jamais d'interpolation dans .or() — évite l'injection de grammaire PostgREST via l'email)
    const one = (table, col, val) => supabase.from(table).select('id').eq(col, val).limit(1).maybeSingle();
    const none = Promise.resolve({ data: null });
    const [cpRes, ddById, ddByEmail, leadById, leadByEmail] = await Promise.all([
      supabase.from('client_profiles').select('client_id').eq('client_id', userId).limit(1).maybeSingle(),
      one('demandes_devis', 'client_id', userId),
      userEmail ? one('demandes_devis', 'client_email', userEmail) : none,
      one('artisan_leads', 'user_id', userId),
      userEmail ? one('artisan_leads', 'email', userEmail) : none,
    ]);
    const hasClientSignal = !!(cpRes.data || ddById.data || ddByEmail.data);
    const hasProSignal = !!(leadById.data || leadByEmail.data);
    return hasClientSignal && !hasProSignal;
  } catch (err) {
    console.warn('[isClientAccount] check failed', err);
    return false;
  }
}

// Guard pour les pages artisan : si l'user est un compte client, redirige vers son espace.
// A appeler apres requireAuth(). Throw apres redirect pour stopper le reste du script.
export async function redirectClientToTheirSpace(session, target = './client.html') {
  if (await isClientAccount(session)) {
    window.location.replace(target);
    throw new Error('client redirected to client space');
  }
}

// Route après login : pro ou client ?
export async function resolveUserRole() {
  const session = await getSession();
  if (!session) return null;
  const userId = session.user.id;
  const email = (session.user.email || '').toLowerCase();
  const { data: pro } = await supabase
    .from('pro_profiles').select('pro_id').eq('pro_id', userId).maybeSingle();
  if (pro) return 'pro';
  // Artisan en attente de validation (pas encore de pro_profiles) → dashboard gère l'état
  // Match par user_id, puis fallback email — via .eq() uniquement (pas d'interpolation dans .or())
  let { data: lead } = await supabase
    .from('artisan_leads').select('id').eq('user_id', userId).limit(1).maybeSingle();
  if (!lead && email) {
    ({ data: lead } = await supabase
      .from('artisan_leads').select('id').eq('email', email).limit(1).maybeSingle());
  }
  if (lead) return 'pro';
  const { data: client } = await supabase
    .from('client_profiles').select('client_id').eq('client_id', userId).maybeSingle();
  if (client) return 'client';

  // Aucune table ne connait cet utilisateur. Renvoyer « client » par defaut
  // envoyait tout nouvel artisan dans l'espace particulier : il s'inscrivait
  // depuis une page intitulee ESPACE ARTISAN et atterrissait cote client.
  // C'est arrive a Gabriel le 29/08 — il avait simplement utilise son adresse
  // habituelle plutot que celle qu'on avait pre-enregistree.
  // On se souvient donc de la porte par laquelle il est entre.
  try {
    const espace = localStorage.getItem(ESPACE_CLE);
    if (espace === 'pro' || espace === 'client') return espace;
  } catch (_) { /* mode prive : on retombe sur le defaut */ }
  return 'client';
}

// Porte d'entree choisie par l'utilisateur, posee par login.html (pro) et
// client-login.html (client). Sert uniquement a trancher quand la base ne
// connait pas encore le compte — jamais a accorder un droit.
export const ESPACE_CLE = 'bs_espace';
export function memoriserEspace(espace) {
  try { localStorage.setItem(ESPACE_CLE, espace); } catch (_) {}
}

// ── Rôles et droits ───────────────────────────────────────
// LA source unique. Un seul aller-retour, la même réponse pour tous les écrans.
// Ce n'est PAS la sécurité — la sécurité est en SQL (policies + privilèges de
// colonne). C'est ce qui permet à l'écran de dire la vérité AVANT l'appel :
// masquer un bouton qui échouerait, afficher une phrase claire plutôt qu'un 403.
import { DROITS_SOLO, ROLES_SIMULES, appliquerSimulation } from './droits-logique.js';

export { DROITS_SOLO };

export const ROLE_LABEL = {
  patron: 'Responsable', chef: "Chef d'équipe", compagnon: 'Compagnon',
  apprenti: 'Apprenti', interimaire: 'Intérimaire',
};

const SIMULATION_CLE = 'bs_simuler_role';

export function roleSimule() {
  try { return localStorage.getItem(SIMULATION_CLE) || null; } catch (_) { return null; }
}

export function simulerRole(role) {
  try {
    if (!role || role === 'patron') localStorage.removeItem(SIMULATION_CLE);
    else localStorage.setItem(SIMULATION_CLE, role);
  } catch (_) { /* mode prive : l'apercu est simplement indisponible */ }
  oublierDroits();
}

export function rolesSimulables() { return Object.keys(ROLES_SIMULES); }

let _droits = null;
export async function mesDroits({ recharger = false } = {}) {
  if (_droits && !recharger) return _droits;
  const { data, error } = await supabase.rpc('mes_droits');
  // Un artisan seul est patron : c'est le defaut assume cote base (mon_role()).
  // Si l'appel echoue (hors ligne), on ne verrouille pas l'app par accident —
  // la base refusera de toute facon ce qui doit etre refuse.
  const reels = (!error && data) ? data : { ...DROITS_SOLO };
  _droits = appliquerSimulation(reels, roleSimule());
  return _droits;
}
export function oublierDroits() { _droits = null; }

/**
 * Garde d'écran. Renvoie les droits si l'accès est permis, sinon affiche un
 * message lisible et ramène à l'accueil — jamais une erreur technique.
 * @param {(d:object)=>boolean} predicat
 * @param {string} message
 */
export async function exigerDroit(predicat, message) {
  const d = await mesDroits();
  if (predicat(d)) return d;
  ecranRefus(message);
  return null;
}

export function ecranRefus(message) {
  const fond = document.createElement('div');
  fond.setAttribute('role', 'alertdialog');
  fond.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#FFFFFF;'
    + 'display:flex;align-items:center;justify-content:center;padding:24px;'
    + 'font-family:Inter,system-ui,-apple-system,sans-serif;';
  const carte = document.createElement('div');
  carte.style.cssText = 'max-width:340px;text-align:center;display:flex;'
    + 'flex-direction:column;gap:14px;align-items:center;';
  const t = document.createElement('div');
  t.style.cssText = 'font-size:17px;font-weight:900;color:#1C2B22;';
  t.textContent = 'Accès réservé';
  const p = document.createElement('p');
  p.style.cssText = 'font-size:13.5px;color:#5A7268;line-height:1.55;margin:0;';
  p.textContent = message;
  const a = document.createElement('a');
  a.href = './dashboard.html';
  a.style.cssText = 'padding:12px 22px;border-radius:10px;background:#228B5B;'
    + 'color:#FFFFFF;font-size:13px;font-weight:800;text-decoration:none;';
  a.textContent = "Revenir à l'accueil";
  carte.append(t, p, a);
  fond.appendChild(carte);
  document.body.appendChild(fond);
}

// ── Équipe ────────────────────────────────────────────────
// Un compagnon voit les chantiers de son patron grâce à mon_entreprise()
// côté base : toutes les policies passent par elle. Ici on ne fait que lire
// et écrire — la sécurité est en SQL, pas en JavaScript.

// equipe_visible et non membres_equipe : la vue masque le taux horaire des
// collègues et n'expose JAMAIS invite_token. La table brute est réservée au
// patron et au chef depuis le 23/08.
export async function listMembres() {
  const { data, error } = await supabase
    .from('equipe_visible').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Crée l'invitation puis envoie l'email. Deux étapes distinctes, et c'est
 * volontaire : si Brevo tombe, l'invitation existe quand même et le patron peut
 * la renvoyer. L'inverse (email parti, ligne absente) serait ingérable.
 * @returns {{membre:object, emailEnvoye:boolean, lien:string}}
 */
export async function inviterMembre({ prenom, nom, email, telephone, metier, taux_horaire, role }) {
  const { data, error } = await supabase.rpc('inviter_membre', {
    p_prenom: (prenom || '').trim(),
    p_nom: (nom || '').trim() || null,
    p_email: (email || '').trim().toLowerCase(),
    p_metier: (metier || '').trim() || null,
    p_role: role || 'compagnon',
    p_taux_horaire: taux_horaire || null,
    p_telephone: (telephone || '').trim() || null,
  });
  if (error) throw error;
  const emailEnvoye = await envoyerInvitation(data.id);
  return { membre: data, emailEnvoye, lien: lienInvitation(data.invite_token) };
}

export function lienInvitation(token) {
  return `${window.location.origin}/app/rejoindre.html?token=${encodeURIComponent(token)}`;
}

// L'email part d'une Edge Function : la clé Brevo ne doit jamais toucher le
// navigateur. La fonction relit l'invitation avec le jeton du patron, donc elle
// ne peut rien envoyer pour une équipe qui n'est pas la sienne.
async function envoyerInvitation(membreId) {
  try {
    const session = await getSession();
    const cfg = window.__BATISPOT_CONFIG__ || {};
    const r = await fetch(`${cfg.SUPABASE_URL}/functions/v1/inviter-equipe`, {
      method: 'POST',
      headers: {
        apikey: cfg.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ membre_id: membreId }),
    });
    return r.ok;
  } catch (_) {
    return false;
  }
}

export async function renvoyerInvitation(id) {
  const { data, error } = await supabase.rpc('renvoyer_invitation', { p_id: id });
  if (error) throw error;
  const emailEnvoye = await envoyerInvitation(id);
  return { membre: data, emailEnvoye, lien: lienInvitation(data.invite_token) };
}

// Ne supprime jamais la ligne : l'historique des messages et des chantiers doit
// rester lisible. Le token est rotationné côté base, donc l'ancien lien meurt.
export async function retirerMembre(id) {
  const { data, error } = await supabase.rpc('revoquer_invitation', { p_id: id });
  if (error) throw error;
  return data;
}

// La table brute, pas `equipe_visible` — volontaire. Cette lecture sert
// l'édition inline du taux horaire (equipe.html) et le calcul de marge
// (analyses.html), tous deux réservés à l'encadrement. La policy
// `equipe_lecture` autorise déjà patron/chef à lire membres_equipe en
// direct ; un compagnon qui appellerait ceci ne recevrait que sa propre
// ligne (`user_id = auth.uid()`), jamais celle d'un collègue.
export async function listMembresTauxHoraire() {
  const { data, error } = await supabase
    .from('membres_equipe')
    .select('id, prenom, nom, taux_horaire, statut')
    .neq('statut', 'inactif');
  if (error) throw error;
  return data || [];
}

// Seul le patron peut écrire (policy `equipe_maj_patron` : mon_role() =
// 'patron'). Un chef peut lire le taux de l'équipe mais pas le modifier —
// la base refuserait de toute façon, ceci ne fait qu'éviter un appel voué
// à l'échec.
export async function majTauxHoraireMembre(id, taux_horaire) {
  const valeur = taux_horaire === '' || taux_horaire === null || taux_horaire === undefined
    ? null : Number(taux_horaire);
  const { data, error } = await supabase
    .from('membres_equipe')
    .update({ taux_horaire: valeur })
    .eq('id', id)
    .select('id, taux_horaire')
    .single();
  if (error) throw error;
  return data;
}

/**
 * Rattache le compte connecté à une invitation, PAR TOKEN.
 *
 * L'ancienne version faisait un `update … where email = …` depuis le
 * navigateur du collaborateur. Elle ne pouvait pas marcher : tant qu'aucune
 * ligne active n'existe, mon_entreprise() renvoie auth.uid(), donc la policy
 * `pro_id = mon_entreprise()` ne matche aucune ligne. PostgREST répondait 200
 * avec un tableau vide, sans erreur — et le collaborateur atterrissait dans
 * l'espace client sans que rien ne le signale.
 * La RPC est SECURITY DEFINER et lève une exception à chaque refus.
 */
export async function rejoindreEquipe(token) {
  const { data, error } = await supabase.rpc('rejoindre_equipe', { p_token: token });
  if (error) throw new Error(error.message || "Cette invitation n'a pas pu être acceptée.");
  oublierDroits();
  return data;
}

// Qui suis-je dans l'entreprise ? (null = je suis le patron)
export async function monProfilEquipe() {
  const session = await getSession();
  if (!session) return null;
  const { data } = await supabase
    .from('membres_equipe').select('*').eq('user_id', session.user.id).limit(1);
  return (data || [])[0] || null;
}

// ── Réglages d'équipe (les deux interrupteurs du patron) ──
export async function getParametresEquipe() {
  const d = await mesDroits();
  const { data } = await supabase
    .from('parametres_equipe').select('*').eq('pro_id', d.entreprise).maybeSingle();
  return data || { chef_voit_prix: false, chef_voit_marges: false };
}

export async function majParametresEquipe(patch) {
  const d = await mesDroits();
  const { error } = await supabase
    .from('parametres_equipe')
    .upsert({ pro_id: d.entreprise, ...patch, updated_at: new Date().toISOString() },
            { onConflict: 'pro_id' });
  if (error) throw error;
}

// ── Messagerie d'équipe ───────────────────────────────────
// Elle passe par la table messages, mais avec visible_client = false :
// ces échanges ne sont JAMAIS montrés au client sur sa page de suivi.

export async function listMessagesEquipe(chantierId) {
  const { data, error } = await supabase
    .from('messages').select('*')
    .eq('chantier_id', chantierId).eq('visible_client', false)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function envoyerMessageEquipe(chantierId, contenu) {
  const session = await getSession();
  const moi = await monProfilEquipe();
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chantier_id: chantierId,
      author: moi ? 'membre' : 'pro',
      auteur_id: session.user.id,
      content: contenu,
      visible_client: false,          // interne à l'équipe
    })
    .select().single();
  if (error) throw error;
  return data;
}

// Annonce automatique dans le groupe du chantier (Moctar, 05/09 : « quand une
// nouvelle tâche est assignée dans un chantier elle est visible dans le
// groupe et dans le déroulement du chantier, et inversement »). Le
// déroulement lit la table `taches` ; le groupe lit `messages`. Ce pont écrit
// une ligne dans le second quand le premier bouge. Jamais bloquant : une
// étape créée sans son annonce vaut mieux qu'une étape refusée.
export async function annoncerFilEquipe(chantierId, texte) {
  try {
    if (!chantierId || !texte) return null;
    return await envoyerMessageEquipe(chantierId, String(texte).slice(0, 500));
  } catch (e) {
    console.warn('[équipe] annonce non envoyée :', e && e.message);
    return null;
  }
}

function libelleJourCourt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso + (String(iso).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch (_) { return String(iso); }
}

// Temps réel : le fil se met à jour sans rechargement.
export function suivreMessagesEquipe(chantierId, onMessage) {
  return supabase
    .channel(`equipe:${chantierId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chantier_id=eq.${chantierId}` },
      (payload) => { if (payload.new && payload.new.visible_client === false) onMessage(payload.new); })
    .subscribe();
}

// ── Tâches de chantier (déroulement) ──────────────────────
// La table `taches` est remplie par l'ordonnanceur (app-planning-engine.js)
// via l'outil `planifier_taches` de l'assistant. Jusqu'ici RIEN ne la
// relisait : les tâches étaient calculées, écrites, puis invisibles.
// Ces fonctions sont la face lecture qui manquait.

// Le déroulement d'un chantier, dans l'ordre d'exécution.
export async function listTachesChantier(chantierId) {
  const { data, error } = await supabase
    .from('taches').select('*')
    .eq('chantier_id', chantierId)
    .order('jour', { ascending: true, nullsFirst: false })
    .order('ordre', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Toutes les tâches d'une journée donnée, tous chantiers confondus.
// Sert la question « qui travaille, et où, ce jour-là ? ».
export async function listTachesJour(jour) {
  // Une tache longue s'etale : une preparation de 29 h court du 3 au 8 septembre.
  // Filtrer sur `jour = <date>` ne la montrait QUE le 3, et les jours suivants
  // paraissaient vides alors que l'artisan etait sur le chantier. On prend donc
  // toute tache dont la plage [jour ; jour_fin] contient la date demandee.
  const { data, error } = await supabase
    .from('taches').select('*')
    .lte('jour', jour)
    .or(`jour_fin.gte.${jour},jour_fin.is.null`)
    .order('ordre', { ascending: true });
  if (error) throw error;
  // jour_fin absent (taches d'avant le 01/09) : la tache ne vaut que pour son jour.
  return (data || []).filter((t) => t.jour_fin ? true : t.jour === jour);
}

// Bornes incluses — pour colorer une semaine ou un mois d'un seul appel
// plutôt qu'une requête par jour affiché.
export async function listTachesPeriode(debut, fin) {
  const { data, error } = await supabase
    .from('taches').select('*')
    .gte('jour', debut).lte('jour', fin)
    .order('jour', { ascending: true })
    .order('ordre', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── Marge par chantier (analyses.html) ───────────────────────────────────
// Trois lectures groupées, chacune en UNE requête pour TOUS les chantiers —
// jamais une requête par chantier affiché. Le regroupement (par chantier_id)
// se fait ici, côté client ; le calcul de marge et la logique de complétude
// (devis + dépenses + temps réel + taux horaire) restent dans analyses.html.

// `devis_visible`, pas `devis` : la colonne total_ht n'a plus de privilège
// SELECT sur la table brute (retiré le 23/08, voir listDevis ci-dessus). La
// vue la ré-expose via peut_voir_prix() — toujours vrai pour un patron.
export async function listChantiersDevisAcceptes() {
  const { data, error } = await supabase
    .from('devis_visible')
    .select('chantier_id, total_ht, objet, created_at, chantiers(id, client_name, description, status)')
    .eq('status', 'accepte')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const parChantier = new Map();
  (data || []).forEach((d) => {
    const c = d.chantiers;
    if (!c || !c.id) return;
    // Le plus récent gagne pour l'objet affiché (tri déjà décroissant) : un
    // chantier avec deux devis acceptés montre l'intitulé du dernier, mais
    // la somme HT compte les deux.
    const ligne = parChantier.get(c.id)
      || { id: c.id, client_name: c.client_name, description: c.description, status: c.status,
           objet: d.objet || null, devis_ht: 0 };
    ligne.devis_ht += Number(d.total_ht) || 0;
    parChantier.set(c.id, ligne);
  });
  return parChantier;
}

// Somme des dépenses HT, groupée par chantier — une seule requête.
export async function listDepensesParChantier() {
  const { data, error } = await supabase.from('depenses').select('chantier_id, montant_ht');
  if (error) throw error;
  const parChantier = new Map();
  (data || []).forEach((d) => {
    if (!d.chantier_id) return;
    parChantier.set(d.chantier_id, (parChantier.get(d.chantier_id) || 0) + (Number(d.montant_ht) || 0));
  });
  return parChantier;
}

// Toutes les étapes de tous les chantiers, brutes — le calcul de qui a été
// payé combien (membre via assigne_id, ou le patron lui-même via assigne_a)
// a besoin de chaque ligne, pas d'une somme déjà faite.
export async function listTachesMainDoeuvre() {
  const { data, error } = await supabase
    .from('taches')
    .select('chantier_id, assigne_id, assigne_a, duree_reelle_h, statut, mobilise_artisan');
  if (error) throw error;
  return data || [];
}

export async function majStatutTache(id, statut) {
  const { data, error } = await supabase
    .from('taches')
    .update({ statut, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  // Le groupe du chantier voit l'étape avancer (pont déroulement → fil).
  if (statut === 'termine') annoncerFilEquipe(data.chantier_id, `✅ « ${data.titre} » terminée`);
  else if (statut === 'en_cours') annoncerFilEquipe(data.chantier_id, `▶️ « ${data.titre} » commencée`);
  return data;
}

// ── Écriture d'une étape : créer, modifier, supprimer ────────
//
// `taches` n'a PAS de trigger `touch_updated_at` (vérifié en base le
// 03/09/2026 : seule `chantiers` en porte un). C'est pour ça que
// majStatutTache et assignerTache écrivent `updated_at` à la main, et que
// les trois fonctions ci-dessous font pareil. L'oublier laisserait des lignes
// modifiées avec une date de modification périmée.
//
// ⚠️ Ces trois fonctions n'appliquent AUCUN contrôle de rôle, et c'est
// délibéré : le seul contrôle qui compte est en base. Les policies
// `taches_insert_encadrement` et `taches_delete_encadrement` refusent déjà
// l'insertion et la suppression à un compagnon. L'écran masque les boutons
// par confort — si jamais il se trompe, c'est la base qui dit non.

// L'ordre n'est pas un détail : c'est lui qui donne la suite d'exécution.
// Une étape ajoutée à la main se range en fin de chantier, à l'artisan de la
// déplacer ensuite. On le calcule ici plutôt qu'à l'écran pour qu'il n'y ait
// qu'une seule règle, quel que soit l'appelant.
export async function creerTache(chantierId, champs = {}) {
  let ordre = champs.ordre;
  if (ordre == null) {
    const { data: dernier } = await supabase
      .from('taches').select('ordre')
      .eq('chantier_id', chantierId)
      .order('ordre', { ascending: false }).limit(1).maybeSingle();
    ordre = (dernier && Number(dernier.ordre) || 0) + 1;
  }
  const { data, error } = await supabase
    .from('taches')
    .insert({
      chantier_id: chantierId,
      titre: (champs.titre || '').trim(),
      description: (champs.description || '').trim() || null,
      jour: champs.jour || null,
      duree_h: champs.duree_h != null ? champs.duree_h : 2,
      ordre,
      // `statut` est volontairement absent : la colonne a pour défaut
      // 'a_faire' en base, et c'est elle qui doit trancher.
      updated_at: new Date().toISOString(),
    })
    .select().single();
  if (error) throw error;
  annoncerFilEquipe(chantierId, `📋 Nouvelle étape : « ${data.titre} »${data.jour ? ' — ' + libelleJourCourt(data.jour) : ''}`);
  return data;
}

// Modification d'une étape déjà planifiée. On n'écrit QUE les champs fournis :
// un patch partiel ne doit jamais effacer une durée ou une date qu'on n'a pas
// touchée. `undefined` = « je n'y touche pas », `null` = « je vide ».
export async function modifierTache(id, champs = {}) {
  const patch = { updated_at: new Date().toISOString() };
  for (const cle of ['titre', 'description', 'jour', 'duree_h', 'ordre', 'delai_apres_h', 'mobilise_artisan']) {
    if (champs[cle] !== undefined) patch[cle] = champs[cle];
  }
  const { data, error } = await supabase
    .from('taches')
    .update(patch)
    .eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// `depend_de` est une FK ON DELETE SET NULL : supprimer une étape dont une
// autre dépend ne casse rien, elle perd simplement son antécédent.
export async function supprimerTache(id) {
  const { error } = await supabase.from('taches').delete().eq('id', id);
  if (error) throw error;
}

// ── Assignation d'une tâche ─────────────────────────────────
//
// LE SEUL point d'écriture de l'assignation dans toute l'application. Tout passe
// par ici pour qu'il n'y ait jamais deux façons divergentes d'assigner.
//
// On écrit DEUX colonnes, et c'est délibéré :
//   • `assigne_id` — la vérité. FK vers membres_equipe, c'est elle qui permet de
//     calculer une charge par personne et qui survit à un changement de nom.
//   • `assigne_a` — le nom en toutes lettres. Ce n'est PAS une redondance
//     décorative : la fonction SQL `ma_fenetre_planning()`, qui borne ce qu'un
//     apprenti ou un intérimaire a le droit de lire dans `taches`, compare encore
//     `assigne_a` au prénom/nom du membre. Ne remplir que `assigne_id`
//     réduirait sa fenêtre de lecture à ±7 jours et lui masquerait ses propres
//     tâches. À supprimer le jour où cette fonction passera sur `assigne_id`.
// Le cas du PATRON SANS ÉQUIPE est le plus courant, pas une exception.
// Vérifié en base le 03/09 : créer un compte artisan n'insère AUCUNE ligne dans
// `membres_equipe` (0 ligne alors que des chantiers et des factures existent) ;
// `mon_role()` renvoie 'patron' par défaut justement parce que la ligne est
// absente. Un patron n'a donc pas d'`id` de membre à écrire dans `assigne_id`,
// qui est une FK — l'y forcer violerait la contrainte.
// D'où le membre « virtuel » : `membre.__virtuel === true` signifie « moi,
// l'utilisateur connecté, qui ne suis pas une ligne d'équipe ». On écrit alors
// son nom dans `assigne_a` et on laisse `assigne_id` à NULL. C'est exactement
// l'usage pour lequel la colonne texte a été conservée.
export async function assignerTache(tacheId, membre) {
  const nom = membre
    ? [membre.prenom, membre.nom].filter(Boolean).join(' ').trim()
    : null;
  const { data, error } = await supabase
    .from('taches')
    .update({
      assigne_id: (membre && !membre.__virtuel) ? membre.id : null,
      assigne_a: nom || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tacheId).select().single();
  if (error) throw error;
  annoncerFilEquipe(data.chantier_id, nom
    ? `📋 « ${data.titre} » assignée à ${nom}${data.jour ? ' — ' + libelleJourCourt(data.jour) : ''}`
    : `📋 « ${data.titre} » n'est plus assignée`);
  return data;
}

/**
 * Qui fait cette tâche, en lecture. L'ordre des tentatives compte :
 *   1. le membre résolu par `assigne_id` — la seule source fiable ;
 *   2. à défaut le texte `assigne_a`, pour les tâches créées avant la migration
 *      du 03/09 qui n'ont que lui. Sans ce repli elles perdraient leur
 *      assignation à l'écran alors qu'elle existe en base.
 * @param {object} tache
 * @param {Map<string,object>} membresParId
 */
export function nomAssigne(tache, membresParId) {
  if (tache && tache.assigne_id && membresParId) {
    const m = membresParId.get(tache.assigne_id);
    if (m) return [m.prenom, m.nom].filter(Boolean).join(' ').trim() || 'Membre';
  }
  const txt = (tache && tache.assigne_a || '').trim();
  return txt || null;
}

// PAS de lecteur pour la vue SQL `charge_equipe`, et c'est délibéré.
// La vue existe bien en base (vérifié le 03/09, security_invoker = on) et elle
// est correcte, mais l'écran planning charge déjà toutes les tâches de la
// période par `listTachesPeriode` pour dessiner l'agenda et le calendrier. En
// lisant `charge_equipe` par-dessus, on paierait un second aller-retour réseau
// pour recalculer ce qu'on a en mémoire. Le plan de charge se déduit donc de
// ces tâches-là, avec `analyserCharge()` du moteur de planning.
// Si un écran a un jour besoin de la charge SANS avoir déjà les tâches (un
// tableau de bord, par exemple), c'est là que la vue vaudra le coup.

// Factures émises sur une période. Sert le récapitulatif annuel du planning :
// c'est la SEULE source d'un montant facturé. Aucun écran n'a le droit
// d'afficher un chiffre d'affaires qui ne vienne pas d'ici.
export async function listFacturesPeriode(debut, fin) {
  const { data, error } = await supabase
    .from('factures').select('id,total_ttc,date_emission,statut,chantier_id')
    .gte('date_emission', debut).lte('date_emission', fin)
    .order('date_emission', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── Envoi d'une facture au client (04/09/2026) ──────────────────────────────
// Avant cette fonction, `creerFacture` posait un brouillon (statut='brouillon')
// et RIEN ne l'envoyait jamais : l'artisan devait retrouver le lien et le
// transmettre lui-meme. C'etait le trou n°1 du produit — une facture qui ne
// part jamais n'est pas encaissee.
//
// Le SIRET est verifie ICI, pas seulement cote ecran : n'importe quel appelant
// (bouton finances.html, futur assistant vocal) doit passer par la meme porte.
// Lu depuis `pro_profiles` (RLS : pro_id = auth.uid(), donc toujours lisible
// par l'artisan connecte) — pas via la RPC anonyme de facture-document.html,
// qui n'est garantie qu'au role anon et pourrait refuser un appel authentifie.
export async function envoyerFacture(id) {
  const { data: f, error: eF } = await supabase
    .from('factures')
    .select('id, numero, type, total_ht, total_tva, total_ttc, statut, chantier_id, chantiers(client_name, public_token)')
    .eq('id', id)
    .maybeSingle();
  if (eF) throw eF;
  if (!f) throw new Error('Facture introuvable.');

  const clientName = f.chantiers?.client_name || 'votre client';

  // Deja partie : on ne renvoie pas un second message pour un simple double-clic.
  if (f.statut !== 'brouillon') {
    return { ...f, client_name: clientName };
  }

  const token = f.chantiers?.public_token;
  if (!token) {
    throw new Error("Ce chantier n'a pas de lien client. Ouvrez sa fiche pour le générer avant d'envoyer.");
  }

  // Le SIRET vit dans pro_profiles, mais les comptes créés par l'inscription
  // l'ont d'abord dans artisan_leads : on accepte l'un ou l'autre, et on ne
  // bloque que s'il manque partout (mention obligatoire sur une facture).
  const profil = await getMyProfile();
  let siret = profil?.siret;
  if (!siret) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: lead } = await supabase
        .from('artisan_leads').select('siret').eq('user_id', user?.id).limit(1).maybeSingle();
      siret = lead?.siret;
    } catch (_) { /* pas de lead : on tombe sur l'erreur explicite */ }
  }
  if (!siret) {
    throw new Error('Renseignez votre SIRET dans Mon entreprise avant d’envoyer.');
  }

  const { data, error } = await supabase
    .from('factures')
    .update({ statut: 'envoyee', envoyee_le: new Date().toISOString() })
    .eq('id', id)
    .select('id, numero, type, total_ht, total_tva, total_ttc, statut, date_echeance, envoyee_le, chantier_id')
    .single();
  if (error) throw error;

  const TYPE_MSG = { acompte: "d'acompte", situation: 'de situation', solde: 'de solde' };
  const lien = lienFactureDepuis(token, id);
  const texte = `Votre facture ${TYPE_MSG[f.type] || ''} n° ${f.numero} de ${fmtEuro(f.total_ttc)} `
    + `est disponible : ${lien}`;
  // Le statut est deja change en base : si le message echoue (reseau), la
  // facture reste envoyee plutot que de revenir a un etat incoherent.
  try { await sendMessage(f.chantier_id, texte); }
  catch (e) { console.warn('[factures] message client non envoyé', e); }

  // Envoi par e-mail, EN PLUS du message sur la page de suivi (04/09/2026) :
  // best effort, volontairement. Le message ci-dessus est deja parti quand on
  // arrive ici — si l'e-mail echoue (Edge Function indisponible, pas d'email
  // client), la facture reste envoyee et l'appelant le dit dans son toast
  // plutot que de faire echouer tout l'envoi pour un canal secondaire.
  let emailEnvoye = false, emailA = null;
  try {
    const r = await envoyerFactureParEmail(id);
    emailEnvoye = !!r?.ok;
    emailA = r?.envoye_a || null;
  } catch (e) {
    console.warn('[factures] e-mail non envoyé', e);
  }

  return { ...data, client_name: clientName, email_envoye: emailEnvoye, envoye_a: emailA };
}

// ── Envoi (ou renvoi) d'une facture PAR E-MAIL, via l'Edge Function
// envoyer-facture-client (04/09/2026) ───────────────────────────────────────
// Distincte d'`envoyerFacture` : celle-ci ne touche jamais le statut de la
// facture, elle ne fait QUE déclencher l'e-mail — c'est ce qui permet de
// « Renvoyer par e-mail » une facture déjà envoyée (finances.html) et de
// servir le canal e-mail de `relancer_client` (app-actions.js) sans repasser
// par toute la logique de premier envoi (SIRET, statut, message de suivi).
// Meme mecanique d'appel que pv-reception / inviter-equipe : JWT artisan en
// Authorization, apikey en tete, jamais via `supabase.functions.invoke` pour
// garder le controle du delai reseau (bsFetchAvecDelai).
export async function envoyerFactureParEmail(id) {
  const session = await getSession();
  if (!session) throw new Error('Session expirée, reconnectez-vous.');
  const rep = await (window.bsFetchAvecDelai || fetch)(
    `${config.SUPABASE_URL}/functions/v1/envoyer-facture-client`,
    {
      method: 'POST',
      headers: {
        apikey: config.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ facture_id: id }),
    });
  const j = await rep.json().catch(() => ({}));
  if (!rep.ok || !j.ok) {
    if (j.error === 'deja_envoyee_recemment') {
      throw new Error('Déjà envoyée il y a moins de 5 minutes. Patientez avant de renvoyer.');
    }
    throw new Error(j.error || `Erreur ${rep.status}`);
  }
  return j;
}

// ── Envoi du dossier réglementaire (avant travaux ou fin de chantier) au
// client, via l'Edge Function envoyer-dossier-client (04/09/2026) ──────────
// `type` : 'avant' | 'fin'. La fonction relit elle-même les pièces
// disponibles côté serveur (coffre, devis, taches) et renvoie ce qui est
// parti ET ce qui manque — on ne décide jamais côté écran de ce qui est
// complet, seulement on affiche ce que le serveur a constaté.
export async function envoyerDossierClient(chantierId, type) {
  const session = await getSession();
  if (!session) throw new Error('Session expirée, reconnectez-vous.');
  const rep = await (window.bsFetchAvecDelai || fetch)(
    `${config.SUPABASE_URL}/functions/v1/envoyer-dossier-client`,
    {
      method: 'POST',
      headers: {
        apikey: config.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chantier_id: chantierId, type }),
    });
  const j = await rep.json().catch(() => ({}));
  if (!rep.ok || !j.ok) {
    if (j.error === 'aucune_piece_disponible') {
      throw new Error('Aucune pièce disponible à envoyer pour ce dossier pour le moment.');
    }
    throw new Error(j.error || `Erreur ${rep.status}`);
  }
  return j;   // { ok, pieces:[{type,label,url?,detail?}], manquantes:[{label,raison}] }
}

// Les deux textes qui marquent une prévenance de dossier dans le fil du
// chantier. Un seul et même préfixe sert à la fois à composer le message ET
// à détecter, ensuite, qu'un dossier a déjà été envoyé (garde-fou
// « Renvoyer » côté chantier-dossier.js) — pas de colonne dédiée en base
// pour ça, le fil de messages EST la trace.
export const MARQUEUR_DOSSIER = {
  avant: 'Votre dossier avant travaux est disponible',
  fin: 'Votre dossier de fin de chantier est disponible',
};

// A-t-on déjà prévenu ce client pour ce type de dossier ? Sert uniquement à
// choisir le libellé du bouton (« Prévenir » vs « Renvoyer ») — jamais à
// bloquer un renvoi, le client peut très bien avoir perdu le lien.
export async function dossierDejaEnvoye(chantierId, type) {
  const prefixe = MARQUEUR_DOSSIER[type];
  if (!prefixe) return false;
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('id')
      .eq('chantier_id', chantierId)
      .eq('author', 'pro')
      .ilike('content', `${prefixe}%`)
      .limit(1);
    if (error) throw error;
    return !!(data && data.length);
  } catch (_) {
    return false;   // dans le doute, on propose « Prévenir », jamais « Renvoyer »
  }
}

// ── Prévenir le client qu'un dossier est disponible (04/09/2026) ───────────
// C'est l'action du bouton unique de chantier-dossier.js : le client ne
// reçoit un e-mail qu'à DEUX moments dans la vie d'un chantier — dossier
// avant travaux, dossier de fin — jamais un e-mail par pièce déposée. Même
// mécanique qu'envoyerFacture : un message dans le fil (visible et
// consultable du client, sert aussi de trace « déjà envoyé ») PUIS, en plus,
// un e-mail best effort via l'Edge Function. Si l'e-mail échoue, le message
// est déjà parti — le dossier est donc « disponible » quoi qu'il arrive.
export async function envoyerDossierAuClient(chantierId, type) {
  const { data: ch, error } = await supabase
    .from('chantiers')
    .select('id, client_name, public_token')
    .eq('id', chantierId)
    .maybeSingle();
  if (error) throw error;
  if (!ch) throw new Error('Chantier introuvable.');
  if (!ch.public_token) {
    throw new Error("Ce chantier n'a pas de lien client. Ouvrez sa fiche pour le générer avant d'envoyer.");
  }

  const lien = `${config.SUIVI_URL}?t=${encodeURIComponent(ch.public_token)}`;
  const texte = `${MARQUEUR_DOSSIER[type] || 'Votre dossier est disponible'} sur votre page de suivi : ${lien}`;

  try { await sendMessage(chantierId, texte); }
  catch (e) { console.warn('[dossier] message client non envoyé', e); }

  let ok = false, pieces = [], manquantes = [];
  try {
    const r = await envoyerDossierClient(chantierId, type);
    ok = !!r.ok;
    pieces = r.pieces || [];
    manquantes = r.manquantes || [];
  } catch (e) {
    console.warn('[dossier] e-mail non envoyé', e);
  }

  return { client_name: ch.client_name || 'votre client', email_envoye: ok, pieces, manquantes };
}


// ── COFFRE-FORT DE DOCUMENTS (artisan) ──────────────────────────────────────
// Kbis, attestation decennale, plans, PV de reception, garanties. Distinct de
// `client_documents`, qui concerne les pieces echangees avec un particulier.

export async function listCoffreDocs() {
  const { data, error } = await supabase
    .from('coffre_documents')
    .select('id, nom, categorie, chemin, type_mime, taille_octets, expire_le, chantier_id, visibilite, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function uploadCoffreDoc(file, { categorie = 'autre', expire_le = null, chantier_id = null, visibilite = 'prive' } = {}) {
  if (!ACCEPTED_DOC_MIMES.includes(file.type)) {
    throw new Error('Format non supporté. Acceptés : PDF, JPG, PNG, WebP, HEIC.');
  }
  if (file.size > MAX_DOC_BYTES) {
    throw new Error(`Fichier trop lourd (${Math.round(file.size / 1048576)} Mo). Limite : 20 Mo.`);
  }
  const session = await getSession();
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().slice(0, 5);
  // Le prefixe « artisan/ » n'est pas decoratif : toutes les policies RLS du bucket
  // artisan-docs exigent foldername[1] = 'artisan' et foldername[2] = auth.uid().
  // Sans lui, l'upload etait refuse en silence — coffre_documents est reste vide
  // depuis la mise en service (verifie le 28/08 : 0 ligne, 0 objet).
  const path = `artisan/${session.user.id}/coffre/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from('artisan-docs')
    .upload(path, file, { contentType: file.type, cacheControl: '3600' });
  if (upErr) throw upErr;
  const { data, error } = await supabase
    .from('coffre_documents')
    .insert({
      pro_id: session.user.id,
      nom: file.name.slice(0, 180),
      categorie,
      chemin: path,
      type_mime: file.type,
      taille_octets: file.size,
      expire_le,
      chantier_id,
      visibilite,
    })
    .select()
    .single();
  if (error) {
    // On ne laisse pas un fichier orphelin dans le stockage si la ligne echoue.
    await supabase.storage.from('artisan-docs').remove([path]).catch(() => {});
    throw error;
  }
  return data;
}

// ── Justificatif d'une depense ──────────────────────────────────────────────
// La photo du ticket etait lue par l'OCR puis JETEE : elle partait en base64
// vers le modele et n'etait jamais stockee. La colonne
// `depenses.justificatif_path` n'avait donc aucun ecrivain, et le dossier
// comptable annoncait toujours « justificatifs/ : 0 piece » — alors que c'est
// exactement ce qu'un expert-comptable reclame, et ce que l'administration
// exige de conserver.
//
// Meme bucket et meme prefixe que le coffre : les policies RLS de artisan-docs
// exigent foldername[1] = 'artisan' et foldername[2] = auth.uid().
export async function uploadJustificatif(file) {
  const session = await getSession();
  const brut = (file.type || '').split('/')[1] || 'jpg';
  const ext = brut.toLowerCase().replace('jpeg', 'jpg').slice(0, 5);
  const path = `artisan/${session.user.id}/justificatifs/`
    + `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from('artisan-docs')
    .upload(path, file, { contentType: file.type || 'image/jpeg', cacheControl: '3600' });
  if (error) throw error;
  return path;
}

export async function coffreDocSignedUrl(chemin, secondes = 300) {
  const { data, error } = await supabase.storage
    .from('artisan-docs')
    .createSignedUrl(chemin, secondes);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteCoffreDoc(id, chemin) {
  const { error } = await supabase.from('coffre_documents').delete().eq('id', id);
  if (error) throw error;
  await supabase.storage.from('artisan-docs').remove([chemin]).catch(() => {});
}

// Attestations qui expirent bientot : c'est ce qui evite de se presenter sur
// un chantier sans couverture valide.
export async function coffreDocsExpirants(joursAvant = 60) {
  const limite = new Date(Date.now() + joursAvant * 86400000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('coffre_documents')
    .select('id, nom, categorie, expire_le')
    .not('expire_le', 'is', null)
    .lte('expire_le', limite)
    .order('expire_le', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Le patron ouvre ou referme un document. La RLS refuse l'appel a tout autre
// role : inutile de dupliquer le controle ici, mais on remonte l'echec.
export async function majVisibiliteDoc(id, visibilite) {
  const { data, error } = await supabase
    .from('coffre_documents')
    .update({ visibilite })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Apprentissage de la dictée ──────────────────────────────
//
// Ce que l'artisan rectifie apres notre couche de correction. Voir la table
// dictee_corrections : rien ici ne change le comportement de l'app, ca alimente
// v_dictee_candidats que Moctar relit avant de toucher app-dictee-btp.js.
//
// ⚠️ Ne jamais faire echouer une dictee parce que la trace n'est pas partie.
// L'artisan est sur un chantier ; son devis passe avant notre apprentissage.
// Dictée SERVEUR (04/09/2026) : complète la ligne de `dictees_log` ouverte par
// la fonction transcrire-dictee — `corrige` = après app-dictee-btp.js, `final` =
// ce que l'artisan a laissé avant de générer. RLS : il ne peut toucher que les
// siennes. Best-effort : n'interrompt jamais un devis.
export async function enregistrerDicteeFinale(id, champs = {}) {
  if (!id) return false;
  const patch = {};
  if (typeof champs.corrige === 'string') patch.corrige = champs.corrige;
  if (typeof champs.final === 'string') patch.final = champs.final;
  if (!Object.keys(patch).length) return false;
  try {
    const { error } = await supabase.from('dictees_log').update(patch).eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[dictée] journal non complété :', e?.message || e);
    return false;
  }
}

export async function enregistrerCorrectionsDictee(lecons) {
  if (!Array.isArray(lecons) || !lecons.length) return 0;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    const { error } = await supabase.from('dictee_corrections').insert(
      lecons.map((l) => ({
        pro_id: user.id,
        avant: l.avant,
        apres: l.apres,
        origine: l.origine,
        contexte: l.contexte || null,
      }))
    );
    if (error) throw error;
    return lecons.length;
  } catch (e) {
    console.warn('[dictée] apprentissage non enregistré :', e?.message || e);
    return 0;
  }
}

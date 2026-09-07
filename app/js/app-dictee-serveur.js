// BatiSpot — Dictée SERVEUR (04/09/2026).
//
// POURQUOI CE FICHIER EXISTE
//
// La dictée reposait sur la reconnaissance vocale du navigateur (Google via la
// Web Speech API). Elle n'existe pas dans la WKWebView de l'appli iOS, elle se
// coupe et redit les phrases sur Android, et son vocabulaire ne se contrôle
// pas : « placard » pour « Placo », « plainte » pour « plinthe ».
//
// Ici, le navigateur ENREGISTRE seulement (MediaRecorder, disponible partout,
// appli native comprise), et le serveur transcrit avec le lexique du bâtiment
// (Edge Function `transcrire-dictee`). La relecture reste celle de
// app-dictee-btp.js : une seule source de vérité corrige, celle-ci ne fait
// qu'entendre.
//
// Ce module ne touche jamais au DOM de la page : il rend un texte, la page
// décide où l'écrire. Il ne démarre jamais le micro tout seul : c'est un geste
// de l'artisan (bouton maintenu) qui l'ouvre.

const DUREE_MAX_MS = 120_000;   // au-delà, ce n'est plus une dictée de devis
const DUREE_MIN_MS = 400;       // un effleurement du bouton n'est pas une dictée

// ── Mesure du signal pendant l'enregistrement (05/09/2026) ──────────────────
//
// POURQUOI : le serveur sait mesurer un WAV, pas un Opus ni un AAC — or c'est
// exactement ce que produit MediaRecorder ici. Sans mesure, un enregistrement
// MUET partait quand même au modèle, qui inventait une dictée de chantier
// entière et plausible ; elle atterrissait dans le devis d'un client.
//
// On écoute donc le flux en parallèle (AnalyserNode, aucune permission de plus,
// aucun octet envoyé nulle part) et on joint deux nombres à l'audio :
//   niveauDb    — RMS moyen en dBFS (0 = pleine échelle)
//   dureeUtileS — cumul des fenêtres au-dessus de SEUIL_ACTIVITE_DB
// Le serveur applique les MÊMES seuils. Ces nombres ne peuvent que faire
// ÉCONOMISER un appel : ils n'autorisent jamais ce que le serveur refuse.
const FENETRE_MS = 50;          // cadence de mesure
const SEUIL_ACTIVITE_DB = -45;  // au-dessus, la fenêtre compte comme de la parole
const dBFS = (x) => (x > 0 ? 20 * Math.log10(x) : -120);

/** Vrai si l'appareil sait enregistrer. Ne demande AUCUNE permission. */
export function dicteeServeurDisponible() {
  return !!(typeof window !== 'undefined'
    && window.isSecureContext
    && navigator.mediaDevices
    && typeof navigator.mediaDevices.getUserMedia === 'function'
    && typeof window.MediaRecorder === 'function');
}

/** Format d'enregistrement : Opus/WebM sur Chrome et Android, AAC/MP4 sur Safari et iOS. */
export function formatEnregistrement() {
  if (typeof window.MediaRecorder !== 'function' || typeof MediaRecorder.isTypeSupported !== 'function') return '';
  const candidats = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm'];
  return candidats.find((m) => MediaRecorder.isTypeSupported(m)) || '';
}

/** Enregistreur à un seul usage : démarrer() puis arrêter() → Blob. */
export class Enregistreur {
  constructor() {
    this.flux = null;
    this.rec = null;
    this.morceaux = [];
    this.debut = 0;
    this.mime = formatEnregistrement();
    this._garde = null;
    this.actif = false;
    this._audioCtx = null;
    this._timerMesure = null;
    this._sommeCarres = 0;
    this._fenetres = 0;
    this._utileS = 0;
    this._crete = 0;
  }

  /** Écoute le flux en parallèle pour mesurer son énergie. Jamais bloquant :
   *  un navigateur sans AudioContext enregistre comme avant, sans mesure. */
  _ecouter(flux) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this._audioCtx = new AC();
      const analyseur = this._audioCtx.createAnalyser();
      analyseur.fftSize = 2048;
      this._audioCtx.createMediaStreamSource(flux).connect(analyseur);
      const tampon = new Float32Array(analyseur.fftSize);
      const seuil = Math.pow(10, SEUIL_ACTIVITE_DB / 20);
      this._timerMesure = setInterval(() => {
        try {
          analyseur.getFloatTimeDomainData(tampon);
          let somme = 0;
          for (let i = 0; i < tampon.length; i++) {
            const v = tampon[i];
            somme += v * v;
            const a = Math.abs(v);
            if (a > this._crete) this._crete = a;
          }
          const rms = Math.sqrt(somme / tampon.length);
          this._sommeCarres += rms * rms;
          this._fenetres += 1;
          if (rms > seuil) this._utileS += FENETRE_MS / 1000;
        } catch (_) { /* une mesure ratée ne coupe pas la dictée */ }
      }, FENETRE_MS);
    } catch (_) { this._audioCtx = null; }
  }

  /** Ce qu'on a entendu, ou `null` si on n'a pas pu mesurer. */
  _mesure() {
    if (!this._fenetres) return null;
    return {
      niveauDb: Math.round(dBFS(Math.sqrt(this._sommeCarres / this._fenetres)) * 10) / 10,
      creteDb: Math.round(dBFS(this._crete) * 10) / 10,
      dureeUtileS: Math.round(this._utileS * 100) / 100,
    };
  }

  /** Ouvre le micro (permission demandée ICI, sur le geste de l'artisan) et démarre. */
  async demarrer() {
    if (this.actif) return;
    this.flux = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
    });
    this.morceaux = [];
    this._sommeCarres = 0; this._fenetres = 0; this._utileS = 0; this._crete = 0;
    this._ecouter(this.flux);
    this.rec = this.mime ? new MediaRecorder(this.flux, { mimeType: this.mime }) : new MediaRecorder(this.flux);
    this.mime = this.rec.mimeType || this.mime || 'audio/webm';
    this.rec.ondataavailable = (e) => { if (e.data && e.data.size) this.morceaux.push(e.data); };
    this.rec.start(250);
    this.debut = Date.now();
    this.actif = true;
    // Sécurité : un bouton resté enfoncé (poche, écran posé) ne doit pas
    // enregistrer indéfiniment ni envoyer un fichier énorme.
    this._garde = setTimeout(() => { this.arreter().catch(() => {}); }, DUREE_MAX_MS);
  }

  /** Arrête et rend le Blob. Résout `null` si l'enregistrement est trop court. */
  arreter() {
    return new Promise((resolve) => {
      if (!this.actif || !this.rec) { this._fermer(); resolve(null); return; }
      clearTimeout(this._garde);
      const duree = Date.now() - this.debut;
      const rec = this.rec;
      rec.onstop = () => {
        const blob = new Blob(this.morceaux, { type: this.mime });
        const mesure = this._mesure();
        this._fermer();
        resolve(duree < DUREE_MIN_MS || !blob.size
          ? null
          : { blob, mime: this.mime, dureeS: Math.round(duree / 100) / 10, ...(mesure || {}) });
      };
      try { rec.stop(); } catch (_) { this._fermer(); resolve(null); }
    });
  }

  annuler() { clearTimeout(this._garde); try { this.rec && this.rec.state !== 'inactive' && this.rec.stop(); } catch (_) {} this._fermer(); }

  _fermer() {
    this.actif = false;
    clearInterval(this._timerMesure);
    this._timerMesure = null;
    if (this._audioCtx) { try { this._audioCtx.close(); } catch (_) {} this._audioCtx = null; }
    if (this.flux) { this.flux.getTracks().forEach((t) => { try { t.stop(); } catch (_) {} }); }
    this.flux = null;
    this.rec = null;
  }
}

function enBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('lecture audio impossible'));
    fr.onload = () => resolve(String(fr.result).split(',')[1] || '');
    fr.readAsDataURL(blob);
  });
}

// Ce qu'on dit quand on n'a rien entendu : court, sans reproche, actionnable.
export const MESSAGE_RIEN_ENTENDU = "Je n'ai rien entendu, réessayez";

/** Message à montrer à l'artisan pour une erreur donnée. Jamais de jargon. */
export function messageErreurDictee(err) {
  const nom = err && (err.name || err.code || '');
  if (nom === 'NotAllowedError' || nom === 'PermissionDeniedError') {
    return 'Le micro est bloqué pour BatiSpot. Autorisez-le dans les réglages du navigateur, puis réessayez.';
  }
  if (nom === 'NotFoundError' || nom === 'DevicesNotFoundError') return 'Aucun micro détecté sur cet appareil.';
  if (nom === 'quota_atteint' || nom === 'plafond_atteint' || nom === 'quota_indisponible') {
    return (err && err.text) || 'La dictée est momentanément indisponible. Écrivez votre demande, le devis se génère pareil.';
  }
  if (nom === 'reseau') return 'Pas de réseau : la dictée a besoin d\'une connexion. Écrivez votre demande en attendant.';
  return (err && err.text) || 'La transcription a échoué. Réessayez, ou écrivez votre demande.';
}

/**
 * Envoie l'audio au serveur. Résout { id, texte, incertain, vide, raison }.
 *
 * `vide: true` = RIEN n'a été entendu (silence mesuré, ou réponse du modèle
 * jugée inventée côté serveur). Dans ce cas `texte` est TOUJOURS la chaîne
 * vide : aucun appelant ne peut écrire par accident une phrase que personne
 * n'a prononcée dans un devis.
 *
 * Rejette une Error dont `.name` est le code serveur (quota_atteint, gemini_502…).
 */
export async function transcrire({ blob, mime, dureeS, niveauDb, creteDb, dureeUtileS }, { contexte = 'devis', texteAvant = '' } = {}) {
  const cfg = window.__BATISPOT_CONFIG__ || window.BS_CFG || {};
  const base = cfg.SUPABASE_URL || 'https://cisniwhaiydazdpzvino.supabase.co';
  const h = { 'content-type': 'application/json' };
  if (cfg.SUPABASE_ANON_KEY) {
    h['apikey'] = cfg.SUPABASE_ANON_KEY;
    // Le jeton de session identifie l'artisan (quota plein, journal à son nom) ;
    // à défaut la clé anonyme passe, sous quota réduit.
    const jeton = (typeof window.bsJetonSession === 'function' && window.bsJetonSession()) || cfg.SUPABASE_ANON_KEY;
    h['authorization'] = 'Bearer ' + jeton;
  }
  const data = await enBase64(blob);
  const ctrl = new AbortController();
  const killer = setTimeout(() => ctrl.abort(), 60_000);
  let r;
  try {
    r = await fetch(base + '/functions/v1/transcrire-dictee', {
      method: 'POST', headers: h, signal: ctrl.signal,
      body: JSON.stringify({
        audio: { data, mimeType: mime },
        contexte,
        texteAvant: String(texteAvant || '').slice(-1500),
        dureeS,
        // Mesures de l'enregistrement : le serveur ne sait pas décoder l'Opus
        // ni l'AAC, c'est ici qu'on a entendu le signal (ou son absence).
        ...(Number.isFinite(niveauDb) ? { niveauDb } : {}),
        ...(Number.isFinite(creteDb) ? { creteDb } : {}),
        ...(Number.isFinite(dureeUtileS) ? { dureeUtileS } : {}),
      }),
    });
  } catch (e) {
    clearTimeout(killer);
    const err = new Error('réseau'); err.name = 'reseau'; throw err;
  }
  clearTimeout(killer);
  let j = {};
  try { j = await r.json(); } catch (_) {}
  if (!r.ok || j.error) {
    const err = new Error(j.text || j.error || ('HTTP ' + r.status));
    err.name = j.error || ('http_' + r.status);
    err.text = j.text || '';
    throw err;
  }
  // `vide` fait autorité sur `texte` : si le serveur dit qu'il n'a rien
  // entendu, on ne rend rien, quoi qu'il y ait d'autre dans la réponse.
  const vide = j.vide === true || !String(j.texte || '').trim();
  return {
    id: j.id || null,
    texte: vide ? '' : String(j.texte),
    incertain: !vide && Array.isArray(j.incertain) ? j.incertain : [],
    vide,
    raison: vide ? String(j.raison || 'vide') : '',
  };
}

/**
 * Branche un bouton en « maintenir pour dicter ».
 *   onDebut()            — le micro tourne
 *   onFin({texte,…})     — transcription reçue. `vide: true` (avec `texte: ''`
 *                          et `message`) = rien entendu : NE RIEN INSÉRER.
 *   onErreur(message)    — message déjà lisible par l'artisan
 *   onAttente()          — audio envoyé, réponse en cours
 * Rend une fonction qui débranche.
 */
export function brancherBoutonMaintenu(bouton, { contexte = 'devis', texteAvant = () => '', onDebut, onAttente, onFin, onErreur, onInfo } = {}) {
  let enr = null;
  let enCours = false;   // transcription en vol : on ignore un nouvel appui
  let demarrage = null;  // démarrage du micro en vol (getUserMedia pas encore résolu)
  let relache = false;   // le doigt est parti PENDANT ce démarrage

  // ── Autorisation du micro (Moctar, Android, 05/09 : « le maintien ne
  // marche pas ») : la boîte « Autoriser le micro ? » s'ouvre au premier
  // appui, prend le focus, et le navigateur envoie pointercancel — le
  // maintien est rompu avant même que l'enregistrement commence. Si on
  // laisse faire, getUserMedia se résout APRÈS le relâchement et le micro
  // tourne tout seul jusqu'au garde-fou de durée. Donc : tant que
  // l'autorisation n'est pas connue comme acquise, le premier appui ne fait
  // QUE la demander (flux ouvert puis refermé), on le dit, et le maintien
  // suivant dicte normalement. `navigator.permissions` (Chrome) évite ce
  // détour quand c'est déjà accordé ; Safari ne le sait pas → repli sur un
  // témoin local posé la première fois qu'un flux a été obtenu.
  const MSG_AUTORISE = 'Micro autorisé · maintenez le bouton pour dicter';
  let permisOk = false;
  try { permisOk = localStorage.getItem('bs_micro_ok') === '1'; } catch (_) {}
  const noterPermis = () => { permisOk = true; try { localStorage.setItem('bs_micro_ok', '1'); } catch (_) {} };
  const info = (m) => { if (onInfo) onInfo(m); else if (onErreur) onErreur(m); };
  async function permissionConnue() {
    if (permisOk) return true;
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const st = await navigator.permissions.query({ name: 'microphone' });
        if (st.state === 'granted') { noterPermis(); return true; }
      }
    } catch (_) { /* Safari : name 'microphone' inconnu */ }
    return false;
  }
  async function demanderSeule() {
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      flux.getTracks().forEach((t) => { try { t.stop(); } catch (_) {} });
      noterPermis();
      info(MSG_AUTORISE);
    } catch (err) {
      onErreur && onErreur(messageErreurDictee(err));
    }
  }

  // Un appui long sur mobile ouvre le menu contextuel ou sélectionne du texte :
  // les deux interrompent l'enregistrement.
  bouton.style.touchAction = 'none';
  bouton.style.webkitUserSelect = 'none';
  bouton.style.userSelect = 'none';
  bouton.style.webkitTouchCallout = 'none';
  const antiMenu = (e) => e.preventDefault();

  const debut = async (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    if (enCours || demarrage || (enr && enr.actif)) return;
    try { bouton.setPointerCapture && bouton.setPointerCapture(e.pointerId); } catch (_) {}
    // `demarrage` reste posé du premier await jusqu'à ce que le micro tourne
    // vraiment : tout relâchement pendant ce temps est noté dans `relache`,
    // jamais perdu.
    relache = false;
    demarrage = (async () => {
      if (!(await permissionConnue())) { await demanderSeule(); return false; }
      if (relache) return false;
      enr = new Enregistreur();
      await enr.demarrer();
      if (relache) {
        // Le doigt est parti pendant l'ouverture du micro (boîte
        // d'autorisation re-posée par Safari, ou appui très bref) : on ne
        // laisse pas tourner un micro que personne ne tient.
        enr.annuler(); enr = null;
        noterPermis();
        info(MSG_AUTORISE);
        return false;
      }
      noterPermis();
      return true;
    })();
    try {
      const ok = await demarrage;
      demarrage = null;
      if (ok) onDebut && onDebut();
    } catch (err) {
      demarrage = null;
      if (enr) { try { enr.annuler(); } catch (_) {} }
      enr = null;
      onErreur && onErreur(messageErreurDictee(err));
    }
  };

  const fin = async (e) => {
    if (demarrage) { relache = true; return; }
    if (!enr || !enr.actif) return;
    e && e.preventDefault && e.preventDefault();
    const courant = enr;
    enr = null;
    const audio = await courant.arreter();
    if (!audio) { onFin && onFin({ id: null, texte: '', incertain: [], tropCourt: true }); return; }
    enCours = true;
    onAttente && onAttente();
    try {
      const res = await transcrire(audio, { contexte, texteAvant: texteAvant() });
      // Rien entendu : la page reçoit un texte vide ET le drapeau. Elle ne peut
      // pas insérer d'invention même si elle ne lit que `texte`.
      onFin && onFin(res.vide ? { ...res, texte: '', incertain: [], message: MESSAGE_RIEN_ENTENDU } : res);
    } catch (err) {
      onErreur && onErreur(messageErreurDictee(err));
    } finally {
      enCours = false;
    }
  };

  bouton.addEventListener('pointerdown', debut);
  bouton.addEventListener('pointerup', fin);
  bouton.addEventListener('pointercancel', fin);
  bouton.addEventListener('lostpointercapture', fin);
  bouton.addEventListener('contextmenu', antiMenu);
  // Clavier : espace ou entrée maintenus.
  const kd = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) debut(e); };
  const ku = (e) => { if (e.key === ' ' || e.key === 'Enter') fin(e); };
  bouton.addEventListener('keydown', kd);
  bouton.addEventListener('keyup', ku);

  return () => {
    bouton.removeEventListener('pointerdown', debut);
    bouton.removeEventListener('pointerup', fin);
    bouton.removeEventListener('pointercancel', fin);
    bouton.removeEventListener('lostpointercapture', fin);
    bouton.removeEventListener('contextmenu', antiMenu);
    bouton.removeEventListener('keydown', kd);
    bouton.removeEventListener('keyup', ku);
    if (enr) enr.annuler();
  };
}

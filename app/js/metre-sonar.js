// Sonar du téléphone (03/10/2026, Moctar : « approfondis le sonar, ça peut vraiment être notre atout tech »,
// « un outil qui marche avec le téléphone de l'artisan seulement »).
//
// Le haut-parleur émet un chirp 17→21 kHz de 10 ms (quasi inaudible), le micro écoute, et la distance
// perpendiculaire au mur en face vaut (écho − trajet direct) × c / 2. Le trajet direct haut-parleur → micro,
// toujours le plus fort et le premier, sert d'horloge : la latence audio d'Android ne compte pas (BeepBeep 2007).
// État de l'art (BatMapper 2017, SAMS 2018) : 1 à 2 cm jusqu'à 3,5 m sur un mur nu, 5 à 10 cm à 4 m.
//
// Dans le film, la caméra (pose ARCore + suivi des murs) dit à quelle distance ATTENDRE l'écho : on ne cherche
// qu'à ±30 cm autour, ce qui écarte le sol, le plafond et les meubles qui répondent aussi. Un écho net affine
// la cote du mur ; sinon on ne touche à rien. Tout est journalisé pour le banc.
//
// Deux PORTÉES (03/10, Moctar : « le sonar doit pouvoir aller plus loin, à 5 m des murs ») :
//   - proche (≤ 3 m) : 17-21 kHz, 10 ms, 8 tirs — quasi inaudible ;
//   - loin  (> 3 m) : 8-16 kHz, 25 ms, 16 tirs — un bip bref, audible : l'air absorbe 4× moins à 12 kHz qu'à 19,
//     le haut-parleur y est bien plus fort, le chirp 2,5× plus long et les tirs 2× plus nombreux ajoutent 7 dB,
//     et la fenêtre d'écoute monte à 12 m. La caméra choisit la portée d'après la distance attendue.
// Fonctions pures (testables dans Node) : chirp, correler, profilEchos, chercherEcho. Classe Sonar : le matériel.

export const VITESSE_SON = 343;   // m/s à 20 °C (0,6 m/s par degré ; 5 °C d'écart = 1,5 % = 4,5 cm à 3 m)
export const PORTEES = {
  // (audit Opus 03/10) Avec un haut-parleur qui chute de 12 dB entre 17 et 21 kHz, la bande 17-21 ne portait pas
  // au-delà de 1 m en simulation : bande ramenée à 15-19,5 kHz (toujours quasi inaudible), 12 ms, 12 tirs.
  proche: { f0: 15000, f1: 19500, dur: 0.003, nTirs: 20, pas: 0.055, fenetreS: 0.05, dMax: 6 },
  // (04/10, audit des 20 mesures réelles du A57) Le chirp de 25 ms créait une ZONE AVEUGLE de
  // 4,3 m : sur les 20 mesures, AUCUN écho sous 4,3 m, et tous les pics libres commençaient
  // exactement à 4,35 m. En théorie la compression d'impulsion rend la zone aveugle négligeable ;
  // en pratique le haut-parleur continue de vibrer pendant toute la durée du chirp et noie
  // l'écho d'un mur proche, qui est 40 dB plus faible. 3 ms = 0,5 m d'aveugle, la durée de
  // BatMapper, et c'est ce qui a trouvé le mur à 7,31 m dans la sonde. L'énergie perdue est
  // reprise par le nombre de tirs.
  loin: { f0: 8000, f1: 16000, dur: 0.003, nTirs: 20, pas: 0.055, fenetreS: 0.075, dMax: 12 },
};
// (04/10 01h35, 1er essai réel sur le A57 à 7,36 m d'un mur) : 17-21 kHz → aucun écho ; 8-16 kHz → écho du mur à
// 7,31 m (rapport au bruit 7,5) et des échos de meubles bien plus forts à 6,2 et 7,0 m, que la fenêtre caméra écarte.
// Tant que la bande inaudible n'a pas fait ses preuves sur un vrai téléphone, le bip grave sert à toutes les distances.
export const porteePour = (attendu) => 'loin';
export const BASE_HP_MICRO = 0.03;   // m entre haut-parleur et micro (bord bas du A57) : le trajet direct n'est pas nul

/** Chirp linéaire f0→f1 sur `dur` s, fenêtre de Hann (pas de clic), échantillonné à sr. */
export function chirp(sr, f0 = 17000, f1 = 21000, dur = 0.010) {
  const n = Math.round(sr * dur), out = new Float32Array(n), k = (f1 - f0) / dur;
  for (let i = 0; i < n; i++) {
    const t = i / sr, w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1));
    out[i] = w * Math.sin(2 * Math.PI * (f0 * t + 0.5 * k * t * t));
  }
  return out;
}

/** Filtre adapté SIGNÉ : corrélation de x avec h (la phase est gardée pour sommer les tirs en cohérence). */
export function correlerSigne(x, h) {
  const n = x.length - h.length, out = new Float32Array(Math.max(0, n));
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < h.length; j++) s += x[i + j] * h[j]; out[i] = s; }
  return out;
}
/** Enveloppe : |v| lissée par moyenne glissante ±r (plateaux évités, pics nets). */
export function enveloppe(v, r = 4) {
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) { let m = 0, c = 0; for (let j = -r; j <= r; j++) { const k = i + j; if (k >= 0 && k < v.length) { m += Math.abs(v[k]); c++; } } out[i] = m / c; }
  return out;
}
/** Filtre adapté : |corrélation de x avec h|, lissée (compatibilité ; profilEchos somme en cohérence). */
export function correler(x, h, r = 4) { return enveloppe(correlerSigne(x, h), r); }

/**
 * Profil d'échos moyen sur `nTirs` tirs espacés de `pas` secondes. Pour chaque tir, le trajet direct (pic le
 * plus fort autour de l'instant attendu) devient l'origine ; les profils, normalisés par ce pic, s'additionnent.
 * @returns {{ profil: Float32Array, tirs: number, sr: number }} profil[i] ≈ écho à la distance i / sr × c / 2
 */
export function profilEchos(x, h, sr, nTirs, pas, fenetreS = 0.05, decalages = null) {
  // Somme COHÉRENTE : chaque tir est calé sur son trajet direct (pic de |corr|), puis les corrélations SIGNÉES
  // s'additionnent (le signe est ramené à celui du pic direct). La géométrie ne bouge pas entre deux tirs, l'écho
  // s'ajoute en phase, le bruit non : 16 tirs = bruit ÷ 4 (un simple cumul des enveloppes ne le réduit pas).
  const cs = correlerSigne(x, h), env = enveloppe(cs, 0), pasN = Math.round(pas * sr), fen = Math.round(fenetreS * sr);
  let meilleur = 0, i0 = 0;
  for (let i = 0; i < Math.min(env.length, pasN * 2); i++) if (env[i] > meilleur) { meilleur = env[i]; i0 = i; }
  // (audit Opus 03/10) Le pic le plus fort n'est pas forcément le PREMIER tir : on remonte tant qu'un tir plausible
  // précède (≥ 40 % du plus fort). Puis chaque trajet direct est cherché à ±5 ms de sa place attendue, et un tir
  // dont le direct est anormalement faible (< 35 % de la médiane : bloc audio perdu, tir mort) est écarté.
  const demi = Math.max(8, Math.round(0.005 * sr));
  const picAutour = (b) => { let p = 0, ip = b; for (let i = Math.max(0, b - demi), f = Math.min(env.length, b + demi); i < f; i++) if (env[i] > p) { p = env[i]; ip = i; } return [p, ip]; };
  while (i0 - pasN >= 0) { const [p, ip] = picAutour(i0 - pasN); if (p < 0.4 * meilleur) break; i0 = ip; }
  const pics = [], ibs = [];
  for (let k = 0; k < nTirs; k++) { const [p, ip] = picAutour(i0 + k * pasN); pics.push(p); ibs.push(ip); }
  const med = [...pics].sort((a, b) => a - b)[pics.length >> 1] || 0;
  const somme = new Float32Array(fen); let tirs = 0, ecartes = 0;
  for (let k = 0; k < nTirs; k++) {
    const pic = pics[k], ib = ibs[k];
    if (ib + fen >= cs.length || pic <= 0 || pic < 0.35 * med) { ecartes++; continue; }
    // (04/10, 5 mesures sans écho en marchant) COMPENSATION DU DÉPLACEMENT : entre le 1er et le
    // dernier bip il s'écoule plus d'une seconde ; si l'artisan avance, le mur n'est plus à la
    // même distance et les échos ne tombent plus au même endroit — ils s'annulent au lieu de
    // s'additionner. La caméra sait de combien le téléphone a bougé : on décale chaque tir de
    // cette quantité connue avant de sommer. C'est ce que fait un sonar sur une cible mobile.
    const dk = decalages ? (decalages[k] | 0) : 0;
    const signe = cs[Math.max(0, ib + dk)] >= 0 ? 1 : -1;
    for (let i = 0; i < fen; i++) { const j = ib + i + dk; somme[i] += j >= 0 && j < cs.length ? signe * cs[j] / pic : 0; }
    tirs++;
  }
  if (tirs) for (let i = 0; i < fen; i++) somme[i] /= tirs;
  return { profil: enveloppe(somme, 4), tirs, ecartes, sr };
}

/**
 * Cherche l'écho d'un mur. Avec `attendu` (m), on ne regarde que [attendu − tol, attendu + tol] ; sans,
 * tout 0,3–6 m. Le plancher de bruit est la médiane du profil au-delà de 0,3 m ; un écho vaut si son
 * rapport au plancher dépasse `snrMin`. Position affinée au sous-échantillon (parabole sur 3 points).
 * @returns {{ d: number, snr: number, indice: number } | null}
 */
export function chercherEcho({ profil, sr }, attendu = null, tol = 0.30, snrMin = 6, c = VITESSE_SON, dMax = 6, base = BASE_HP_MICRO) {
  // (audit Opus 03/10) Le trajet direct vaut déjà `base` ; l'écho fait 2d : d = (c·Δt + base) / 2 (sinon −1,5 cm de biais)
  const dist = (i) => ((i / sr) * c + base) / 2, iDe = (d) => Math.round((2 * d - base) / c * sr);
  const iDeb = Math.max(2, iDe(0.3)), iFin = Math.min(profil.length - 3, iDe(dMax));
  if (iFin <= iDeb + 2) return null;
  const tri = Array.from(profil.slice(iDeb, iFin)).sort((a, b) => a - b), plancher = tri[tri.length >> 1] || 1e-9;
  const lo = attendu == null ? iDeb : Math.max(iDeb, iDe(attendu - tol)), hi = attendu == null ? iFin : Math.min(iFin, iDe(attendu + tol));
  let meilleur = null;
  for (let i = Math.max(2, lo); i <= hi; i++) {
    if (!(profil[i] >= profil[i - 1] && profil[i] >= profil[i + 1] && profil[i] > profil[i - 2] && profil[i] > profil[i + 2])) continue;
    const snr = profil[i] / plancher; if (snr < snrMin) continue;
    // Sans attente : le plus fort pondéré par d (compense la décroissance sans amplifier le bruit lointain).
    const score = attendu == null ? profil[i] * dist(i) : profil[i];
    if (!meilleur || score > meilleur.score) {
      const a = profil[i - 1], b = profil[i], cc = profil[i + 1], den = a - 2 * b + cc;
      const delta = den ? 0.5 * (a - cc) / den : 0;
      meilleur = { d: +dist(i + (Math.abs(delta) < 1 ? delta : 0)).toFixed(3), snr: +snr.toFixed(1), indice: i, score };
    }
  }
  if (!meilleur) return null;
  delete meilleur.score; return meilleur;
}

/** Le matériel : micro sans traitement, contexte audio 48 kHz, tirs programmés sur l'horloge audio. */
export class Sonar {
  constructor(ctx, flux, options = {}) {
    this.ctx = ctx; this.flux = flux; this.sr = ctx.sampleRate;
    this.portees = {};
    for (const [nom, p] of Object.entries(PORTEES)) {
      const h = chirp(this.sr, p.f0, Math.min(p.f1, this.sr / 2 - 1000), p.dur);
      const buf = ctx.createBuffer(1, h.length, this.sr); buf.getChannelData(0).set(h);
      this.portees[nom] = Object.assign({}, p, { h, buf });
    }
    this.src = ctx.createMediaStreamSource(flux);
    this.tampon = []; this.enregistre = false;
    // ScriptProcessor : simple et partout ; 2048 échantillons = 43 ms par bloc, coût négligeable.
    this.proc = ctx.createScriptProcessor(2048, 1, 1);
    this.proc.onaudioprocess = (e) => { if (this.enregistre) this.tampon.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
    this.src.connect(this.proc); this.proc.connect(ctx.destination);
    this.occupe = false; this.reglages = flux.getAudioTracks()[0].getSettings();
  }
  /** Ouvre micro + contexte. Échoue (rejette) si le micro est refusé ou absent. */
  static async ouvrir(options = {}) {
    const flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: { ideal: false }, noiseSuppression: { ideal: false }, autoGainControl: { ideal: false }, channelCount: { ideal: 1 }, sampleRate: { ideal: 48000 } } });
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive', sampleRate: 48000 });
    await ctx.resume();
    return new Sonar(ctx, flux, options);
  }
  /** Une mesure : tirs, écoute, profil, recherche de l'écho autour de `attendu` (m). ≈ 0,7 s. */
  /**
   * Une mesure. `distanceMaintenant` : fonction rendant la distance perpendiculaire au mur visé
   * à l'instant où on l'appelle (la caméra la connaît). Appelée au début et à la fin, elle donne
   * la vitesse d'approche, qui sert à recaler les tirs entre eux.
   */
  async mesurer(attendu = null, tol = null, portee = null, distanceMaintenant = null) {
    if (this.occupe) return null; this.occupe = true;
    const nom = portee || porteePour(attendu), P = this.portees[nom];
    // Fenêtre de recherche : 30 cm, ou 8 % de la distance attendue au-delà de 3,75 m (la pose dérive avec la distance).
    // (04/10, 1er film réel avec échos : un « écho » à 0,42 m alors que la caméra annonçait 0,60 m
    // a été accepté, parce que ±30 cm à 60 cm laisse passer une erreur de 50 %. La fenêtre est
    // désormais RELATIVE près du mur — au plus un quart de la distance — et large au loin.)
    const tolerance = tol != null ? tol : (attendu == null ? 0.30 : Math.min(Math.max(0.12, 0.25 * attendu), Math.max(0.30, 0.08 * attendu)));
    try {
      this.tampon = []; this.enregistre = true;
      const d0 = distanceMaintenant ? distanceMaintenant() : null;
      const t0 = this.ctx.currentTime + 0.08;
      for (let k = 0; k < P.nTirs; k++) { const s = this.ctx.createBufferSource(); s.buffer = P.buf; s.connect(this.ctx.destination); s.start(t0 + k * P.pas); }
      await new Promise((r) => setTimeout(r, 80 + P.nTirs * P.pas * 1000 + 150));
      this.enregistre = false;
      const d1 = distanceMaintenant ? distanceMaintenant() : null;
      // Vitesse d'approche moyenne pendant les tirs, puis le décalage de chaque tir en échantillons.
      let decalages = null, vitesse = 0;
      if (d0 != null && d1 != null && isFinite(d0) && isFinite(d1)) {
        vitesse = (d1 - d0) / ((P.nTirs - 1) * P.pas || 1);
        if (Math.abs(vitesse) > 0.05) {
          decalages = new Array(P.nTirs);
          for (let k = 0; k < P.nTirs; k++) decalages[k] = Math.round(2 * (vitesse * k * P.pas) / VITESSE_SON * this.sr);
        }
      }
      let n = 0; for (const b of this.tampon) n += b.length;
      const x = new Float32Array(n); let o = 0; for (const b of this.tampon) { x.set(b, o); o += b.length; }
      const pe = profilEchos(x, P.h, this.sr, P.nTirs, P.pas, P.fenetreS, decalages);
      // La distance rendue est celle du PREMIER tir, puisque c'est sur lui que tout est recalé.
      const echo = chercherEcho(pe, d0 != null ? d0 : attendu, tolerance, 6, VITESSE_SON, P.dMax);
      return { attendu, depart: d0, vitesse: +vitesse.toFixed(3), recale: !!decalages, portee: nom, tolerance, echo, tirs: pe.tirs,
               libre: attendu == null ? null : chercherEcho(pe, null, 0.3, 6, VITESSE_SON, P.dMax) };
    } finally { this.occupe = false; }
  }
  fermer() {
    try { this.src.disconnect(); this.proc.disconnect(); } catch (_) {}
    try { this.flux.getTracks().forEach((t) => t.stop()); } catch (_) {}
    try { this.ctx.close(); } catch (_) {}
  }
}

/**
 * Le mur « en face » parmi les murs suivis (format metre-murs : n, d, a, b, dir), vu depuis la position p
 * en regardant dans la direction f (plan du sol). Il faut : le regard à moins de `angleMax` de la normale,
 * le pied de la perpendiculaire sur le tronçon, et une distance dans [dMin, dMax].
 * @returns {{ mur, indice, distance: number, angle: number } | null}
 */
export function murEnFace(murs, p, f, { dMin = 0.5, dMax = 7, angleMax = 25 * Math.PI / 180 } = {}) {
  const lf = Math.hypot(f.x, f.z) || 1; const fx = f.x / lf, fz = f.z / lf;
  let best = null;
  murs.forEach((m, i) => {
    if (!m || !m.n) return;
    const signe = m.n.x * p.x + m.n.z * p.z - m.d, dist = Math.abs(signe);
    if (dist < dMin || dist > dMax) return;
    // Le mur doit être DEVANT : le regard f va vers la droite du mur (même sens que la perpendiculaire p → mur).
    // Sans ce signe, un mur dans le dos à 20° passait aussi (trouvé par la simulation du 03/10).
    const versMur = -(signe >= 0 ? 1 : -1), cosA = versMur * (fx * m.n.x + fz * m.n.z);
    if (cosA <= 0) return;
    const angle = Math.acos(Math.min(1, cosA));
    if (angle > angleMax) return;
    // Le point visé doit être sur le tronçon : projection de p sur la droite, comparée à a et b.
    const t = (p.x - m.a.x) * m.dir.x + (p.z - m.a.z) * m.dir.z, L = Math.hypot(m.b.x - m.a.x, m.b.z - m.a.z);
    if (t < -0.2 || t > L + 0.2) return;
    if (!best || angle < best.angle) best = { mur: m, indice: i, distance: +dist.toFixed(3), angle };
  });
  return best;
}

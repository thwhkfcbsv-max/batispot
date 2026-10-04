// Le film → la pièce (03/10/2026). Pour chaque image gardée pendant le film, on
// connaît la position du téléphone, sa matrice de projection et le plan du sol.
// La segmentation (sol / mur / plafond, dans le navigateur) donne pour cette
// image la FRONTIÈRE sol/mur et la frontière mur/plafond en pixels. Ici :
//   - frontière sol/mur → rayon par pixel ∩ plan du sol → points au sol (mètres)
//   - tous les points au sol de toutes les images → murs et angles (metre-murs.js)
//   - frontière mur/plafond → rayon ∩ plan vertical du mur trouvé → hauteurs
// Calculs purs, testables sans téléphone. Longueurs en MÈTRES, repère monde WebXR.
import { preparerPhoto, mat4Inverse, rayonDepuisPixel, rayonVersSol, rayonVersMur, collerArete } from './metre-photo.js';
import { analyserPointsSol } from './metre-murs.js';
import { profilDepuisPoints, analyserCombles } from './metre-combles.js';

/** Matrice caméra→monde (colonne-major) depuis position + quaternion WebXR. */
export function matriceCameraVersMonde(position, q) {
  const { x, y, z, w } = q;
  const m = new Float64Array(16);
  m[0] = 1 - 2 * (y * y + z * z); m[1] = 2 * (x * y + w * z); m[2] = 2 * (x * z - w * y); m[3] = 0;
  m[4] = 2 * (x * y - w * z); m[5] = 1 - 2 * (x * x + z * z); m[6] = 2 * (y * z + w * x); m[7] = 0;
  m[8] = 2 * (x * z + w * y); m[9] = 2 * (y * z - w * x); m[10] = 1 - 2 * (x * x + y * y); m[11] = 0;
  m[12] = position.x; m[13] = position.y; m[14] = position.z; m[15] = 1;
  return m;
}

/**
 * Prépare une image du film pour la projection : `meta` est la fiche gardée par
 * metre.html (position, orientation, projection, taille du JPEG).
 * Rend { photo, largeur, hauteur } ou null si la matrice n'est pas inversible.
 */
export function preparerImage(meta) {
  const c2w = matriceCameraVersMonde(meta.position, meta.orientation);
  const w2c = mat4Inverse(c2w);
  if (!w2c) return null;
  const photo = preparerPhoto(meta.projection, w2c, meta.position);
  if (!photo) return null;
  return { photo, largeur: meta.taille[0], hauteur: meta.taille[1] };
}

/**
 * Distance au mur EN FACE, lue sur la COLONNE CENTRALE de la frontière sol/mur d'une image
 * (04/10/2026 : le tir de mesure par le son était conditionné à un mur déjà reconnu par le
 * suivi, qui ne converge pas sur une vraie pièce — aucune mesure n'était donc jamais faite).
 * On ne garde que les colonnes dans la bande centrale (± `bande` de la largeur), chacune est
 * projetée au sol, et on prend la MÉDIANE : un meuble sur une colonne ne décale plus tout.
 * Rend { point: {x, z}, distance, n } — distance HORIZONTALE caméra → pied du mur, en mètres —
 * ou null si la bande centrale ne donne rien d'exploitable.
 */
export function distanceMurCentral(meta, frontiereSol, { bande = 0.12, distanceMin = 0.3, distanceMax = 8, nMin = 3 } = {}) {
  const img = preparerImage(meta); if (!img) return null;
  const solY = meta.solY; if (solY == null) return null;
  const u0 = img.largeur * (0.5 - bande), u1 = img.largeur * (0.5 + bande);
  const cands = [];
  for (const px of frontiereSol || []) {
    const u = px.u != null ? px.u : px[0], v = px.v != null ? px.v : px[1];
    if (!(u >= u0 && u <= u1) || !(v >= 0)) continue;
    const p = rayonVersSol(rayonDepuisPixel(img.photo, u, v, img.largeur, img.hauteur), solY);
    if (!p) continue;
    const d = Math.hypot(p.x - meta.position.x, p.z - meta.position.z);
    if (!(d >= distanceMin) || d > distanceMax) continue;
    cands.push({ p, d });
  }
  if (cands.length < nMin) return null;
  cands.sort((a, b) => a.d - b.d);
  const m = cands[cands.length >> 1];
  return { point: { x: m.p.x, z: m.p.z }, distance: +m.d.toFixed(3), n: cands.length };
}

/**
 * Accumulateur du film : on lui donne, image par image, les frontières trouvées
 * (listes de pixels {u,v} dans le repère du JPEG), il garde des points au sol et
 * des pixels de plafond, et rend le résultat quand on le lui demande.
 */
export class Accumulateur {
  constructor({ solY = null, distanceMax = 6, pas = 1 } = {}) {
    this.solY = solY; this.distanceMax = distanceMax; this.pas = pas;
    this.hitsSol = [];            // {x,y,z} : points de sol vus par la caméra (hit-test), pour le niveau du sol
    // (04/10, film réel : la hauteur du sol proposée allait de −1,30 m à +0,36 m d'une image à
    // l'autre — la caméra prend les tables et les meubles pour le sol.) Le plan du sol était
    // verrouillé sur la TOUTE PREMIÈRE image : viser une table au départ faussait tout le relevé.
    // On garde donc les propositions des premières secondes, et le sol devient le plan le PLUS BAS
    // vu de façon répétée : les points déjà projetés sont alors recalculés, exactement.
    this.solsProposes = [];
    this.solRevise = false;
    this.trajectoire = [];        // {x,z} : où était le téléphone à chaque image acceptée (preuve d'espace libre)
    this.ouverturesVues = [];     // { img, u0, u1, type, vBas, vHaut } : portes/fenêtres vues image par image
    this.pointsSol = [];          // {x,z, img, distance, poids}
    this.plafond = [];            // { image, pixels:[{u,v}] } — projetés sur les murs à la fin
    this.images = 0; this.ignores = 0;
    this.derniereDistance = null; // distance médiane des points de la dernière image (guidage)
    this.plafondRecent = 0;       // pixels de plafond vus dans les 5 dernières images (guidage)
    this._plafondParImage = [];
  }
  /**
   * Ajoute une image : `frontiereSol` = pixels sol/mur, `frontierePlafond` = pixels
   * mur/plafond. `lire(x,y)` (optionnel) rend la luminance du JPEG : la frontière
   * est alors COLLÉE à l'arête de contraste la plus proche (axe 1, ± 5 px).
   */
  ajouter(meta, frontiereSol = [], frontierePlafond = [], lire = null) {
    const img = preparerImage(meta); if (!img) { this.ignores++; return 0; }
    const solY = this.solY != null ? this.solY : meta.solY;
    if (solY == null) { this.ignores++; return 0; }
    if (this.solY == null) this.solY = solY;
    if (meta.solY != null && isFinite(meta.solY) && this.solsProposes.length < 14) this.solsProposes.push(meta.solY);
    let n = 0; const dists = [];
    this.derniers = [];           // les points de CETTE image (pour le suivi des murs)
    for (let i = 0; i < frontiereSol.length; i += this.pas) {
      let px = frontiereSol[i];
      if (lire) { const c = collerArete(lire, px.u, px.v, img.largeur, img.hauteur, 5); if (c.force > 0) px = c; }
      const r = rayonDepuisPixel(img.photo, px.u, px.v, img.largeur, img.hauteur);
      const p = rayonVersSol(r, solY);
      if (!p || p.distance > this.distanceMax) continue;
      // Poids (axe 2) : 1 à 1,5 m, décroît en 1/d² ; et × l'angle d'incidence sur le sol
      // (rayon qui plonge = précis, rayon rasant = un pixel vaut des décimètres).
      const L = Math.hypot(r.d.x, r.d.y, r.d.z) || 1, plongee = Math.abs(r.d.y) / L;
      const poids = Math.min(1, 2.25 / (p.distance * p.distance)) * Math.min(1, plongee / 0.35);
      // La position de la caméra accompagne le point : elle permet de le reprojeter exactement
      // si le plan du sol est corrigé (un point est l'intersection d'un rayon et du plan).
      const pt = { x: p.x, z: p.z, img: this.images, distance: p.distance, poids, cx: r.o.x, cy: r.o.y, cz: r.o.z };
      this.pointsSol.push(pt); this.derniers.push(pt); dists.push(p.distance); n++;
    }
    this.corrigerSol();
    if (dists.length) { dists.sort((u, v) => u - v); this.derniereDistance = dists[Math.floor(dists.length / 2)]; }
    if (frontierePlafond.length) this.plafond.push({ img, pixels: frontierePlafond });
    // Pour le suivi en direct : la ligne du plafond de CETTE image projetée à la hauteur estimée
    // (2,50 tant qu'elle n'est pas mesurée). Une hauteur fausse décale ces points avec le point de
    // vue : la parallaxe de la grille les écarte alors d'elle-même.
    this.derniersPlafond = [];
    if (frontierePlafond.length) {
      const y = solY + (this.hauteurEstimee || 2.5);
      for (let i = 0; i < frontierePlafond.length; i += 2) {
        const r = rayonDepuisPixel(img.photo, frontierePlafond[i].u, frontierePlafond[i].v, img.largeur, img.hauteur);
        if (!(r.d.y > 1e-6)) continue; const t = (y - r.o.y) / r.d.y; if (!(t > 0)) continue;
        const L = Math.hypot(r.d.x, r.d.y, r.d.z) || 1, distance = t * L; if (distance > 7) continue;
        this.derniersPlafond.push({ x: r.o.x + r.d.x * t, z: r.o.z + r.d.z * t, poids: Math.min(1, 6.25 / (distance * distance)) * Math.min(1, (r.d.y / L) / 0.3), distance, plafond: true });
      }
    }
    this._plafondParImage.push(frontierePlafond.length); if (this._plafondParImage.length > 5) this._plafondParImage.shift();
    this.plafondRecent = this._plafondParImage.reduce((a, b) => a + b, 0);
    // La TRAJECTOIRE : la caméra était physiquement DANS la pièce. C'est la preuve d'espace libre
    // dont l'assembleur (étage 7) se sert pour étiqueter les faces, et le contrôle de cohérence
    // pour refuser un plan qui ne contient pas tout le trajet parcouru.
    this.trajectoire.push({ x: meta.position.x, z: meta.position.z });
    this.images++;
    return n;
  }
  /**
   * Le CONTEXTE de l'assembleur (expérience (g)) : la trajectoire du téléphone et les RAYONS
   * qu'il a vus. Un point de frontière sol/mur vu depuis la caméra prouve que le segment
   * [caméra, point] est du sol libre, et que juste derrière le point on est derrière un mur.
   * On n'en garde qu'un échantillon (`rayonsCible`) : au-delà, l'étiquetage ne change plus.
   */
  contexte({ rayonsCible = 3000 } = {}) {
    const pas = Math.max(1, Math.round(this.pointsSol.length / rayonsCible));
    const vues = [];
    for (let i = 0; i < this.pointsSol.length; i += pas) {
      const p = this.pointsSol[i], c = this.trajectoire[p.img];
      if (c) vues.push({ c, p: { x: p.x, z: p.z }, poids: p.poids });
    }
    return { trajectoire: this.trajectoire, vues, pointsSol: this.pointsSol };
  }
  /**
   * LA HAUTEUR SANS LA LIRE (04/10/2026, expérience h) : le mur est VERTICAL, donc la ligne du
   * plafond projetée à la BONNE hauteur tombe sur l'empreinte du pied des murs. On balaye h et on
   * garde celui qui superpose le mieux les deux nuages (grille de 12 cm). Aucune hauteur n'est lue.
   *
   * Pourquoi ça compte : l'échelle du plan par le plafond est proportionnelle au bras de levier
   * (h − hauteur de la caméra) ≈ 0,91 m, donc 1 cm d'erreur sur h fait 1,1 % sur toutes les
   * longueurs et 2,2 % sur la surface. La hauteur LUE dépendait d'un seul tirage de RANSAC : sur le
   * salon de Moctar elle va de 2,485 à 2,590 m selon la graine (vrai 2,56). Le recoupement donne
   * 2,53 m, sans tirage.
   *
   * Rend { h, score, nettete } ou null. `nettete` = score du pic / score à ±20 cm : sous 1,5, le
   * pic n'en est pas un, et le contrôle de cohérence le refuse.
   */
  hauteurRecoupee(mursSol, solY, { cell = 0.12, hMin = 2.1, hMax = 3.3, pas = 0.01 } = {}) {
    if (!mursSol || !mursSol.length) return null;
    // Référence : les points du sol qui sont SUR un mur (pas tout le nuage — les meubles
    // tireraient la hauteur vers le bas).
    const ref = [];
    for (const p of this.pointsSol) for (const m of mursSol) {
      const ex = m.b.x - m.a.x, ez = m.b.z - m.a.z, L = Math.hypot(ex, ez) || 1;
      const nx = -ez / L, nz = ex / L;
      if (Math.abs(nx * (p.x - m.a.x) + nz * (p.z - m.a.z)) > 0.10) continue;
      const u = ((p.x - m.a.x) * ex + (p.z - m.a.z) * ez) / (L * L);
      if (u >= -0.05 && u <= 1.05) { ref.push(p); break; }
    }
    if (ref.length < 200) return null;
    // Grille d'occupation du pied des murs, en POIDS : une cellule tenue par un seul point rasant
    // ne doit pas attirer la ligne du plafond.
    const g = new Map();
    for (const p of ref) { const k = Math.floor(p.x / cell) + ',' + Math.floor(p.z / cell); g.set(k, (g.get(k) || 0) + (p.poids == null ? 1 : p.poids)); }
    const occupee = (i, j) => (g.get(i + ',' + j) || 0) >= 0.5;
    const score = (h) => {
      const P = this.pointsPlafondProjetes(h);
      if (P.length < 60) return 0;
      let w = 0, tot = 0;
      for (const p of P) {
        const pw = p.poids == null ? 1 : p.poids; tot += pw;
        const i = Math.floor(p.x / cell), j = Math.floor(p.z / cell);
        let ok = false;
        for (let a = -1; a <= 1 && !ok; a++) for (let b = -1; b <= 1 && !ok; b++) if (occupee(i + a, j + b)) ok = true;
        if (ok) w += pw;
      }
      return tot ? w / tot : 0;
    };
    // Le score est PLAT au sommet : prendre l'argmax donnerait la plus BASSE hauteur du plateau
    // (mesuré : 2,44 au lieu de 2,50 sur le film synthétique, soit −13 % de surface). On garde
    // donc le MILIEU du plateau — toutes les hauteurs à moins de 1 point du maximum.
    const lignes = [];
    for (let h = hMin; h <= hMax + 1e-9; h += pas) { const sc = score(h); if (sc > 0) lignes.push({ h: +h.toFixed(3), s: sc }); }
    if (!lignes.length) return null;
    const sMax = Math.max(...lignes.map((l) => l.s));
    const plateau = lignes.filter((l) => l.s >= sMax - 0.01).map((l) => l.h).sort((u, v) => u - v);
    const h = plateau.length % 2 ? plateau[(plateau.length - 1) / 2] : (plateau[plateau.length / 2 - 1] + plateau[plateau.length / 2]) / 2;
    const nettete = sMax / Math.max(1e-6, Math.max(score(h - 0.20), score(h + 0.20)));
    return { h: +h.toFixed(3), score: +sMax.toFixed(4), nettete: +nettete.toFixed(2), plateau: [plateau[0], plateau[plateau.length - 1]] };
  }
  /**
   * Hauteurs lues sur les murs trouvés : pour chaque pixel de la ligne mur/plafond, le mur
   * que son rayon rencontre, l'abscisse u (mètres depuis a) et la hauteur h. Rend
   * { toutes:[h], parMur:[[{u,h}]] }. Un mur dont les hauteurs varient beaucoup est un PIGNON
   * de combles : son nuage (u,h) est le profil du toit.
   */
  hauteurs(murs, solY) {
    const toutes = [], parMur = murs.map(() => []);
    for (const { img, pixels } of this.plafond) {
      for (let i = 0; i < pixels.length; i += 2) {
        const r = rayonDepuisPixel(img.photo, pixels[i].u, pixels[i].v, img.largeur, img.hauteur);
        let meilleur = null, idx = -1;
        murs.forEach((m, k) => { const h = rayonVersMur(r, m); if (h && h.u >= -0.05 && h.u <= 1.05 && (!meilleur || h.t < meilleur.t)) { meilleur = h; idx = k; } });
        if (meilleur) { const h = meilleur.p.y - solY; if (h > 0.2 && h < 6) { toutes.push(h); parMur[idx].push({ u: meilleur.u * meilleur.L, h }); } }
      }
    }
    return { toutes, parMur };
  }
  /**
   * (04/10, 2e film réel) La LIGNE DU PLAFOND ne voit jamais les meubles : projetée sur le plan
   * y = solY + h, elle dessine la pièce fermée là où la frontière du sol est hachée par le canapé,
   * la table, les cartons. Rend les points {x, z, poids, distance} de toutes les images.
   */
  pointsPlafondProjetes(h, { distanceMax = 7, pas = 2 } = {}) {
    const solY = this.solY || 0, y = solY + h, out = [];
    for (const { img, pixels } of this.plafond) {
      for (let i = 0; i < pixels.length; i += pas) {
        const r = rayonDepuisPixel(img.photo, pixels[i].u, pixels[i].v, img.largeur, img.hauteur);
        if (!(r.d.y > 1e-6)) continue;                 // il faut regarder vers le haut
        const t = (y - r.o.y) / r.d.y; if (!(t > 0)) continue;
        const L = Math.hypot(r.d.x, r.d.y, r.d.z) || 1, distance = t * L; if (distance > distanceMax) continue;
        const montee = r.d.y / L;                      // rayon qui monte franchement = précis
        const poids = Math.min(1, 6.25 / (distance * distance)) * Math.min(1, montee / 0.3);
        out.push({ x: r.o.x + r.d.x * t, z: r.o.z + r.d.z * t, poids, distance });
      }
    }
    return out;
  }
  /**
   * Les RAYONS de la ligne du plafond, projetés à la hauteur h : même preuve d'espace libre que
   * pour le sol, mais vue d'en haut — là où les meubles ne cachent rien. Sert de contexte à
   * l'assembleur quand le plan vient du plafond (expérience (g) § 5.2, « le dernier pouce »).
   */
  vuesPlafond(h, { rayonsCible = 2000, distanceMax = 7 } = {}) {
    const solY = this.solY || 0, y = solY + h, out = [];
    const total = this.plafond.reduce((a, q) => a + q.pixels.length, 0) || 1;
    const pas = Math.max(2, Math.round(total / rayonsCible));
    for (const { img, pixels } of this.plafond) {
      const c = { x: img.photo.camera.x, z: img.photo.camera.z };
      for (let i = 0; i < pixels.length; i += pas) {
        const r = rayonDepuisPixel(img.photo, pixels[i].u, pixels[i].v, img.largeur, img.hauteur);
        if (!(r.d.y > 1e-6)) continue;
        const t = (y - r.o.y) / r.d.y; if (!(t > 0)) continue;
        const L = Math.hypot(r.d.x, r.d.y, r.d.z) || 1, distance = t * L; if (distance > distanceMax) continue;
        out.push({ c, p: { x: r.o.x + r.d.x * t, z: r.o.z + r.d.z * t }, poids: Math.min(1, 6.25 / (distance * distance)) * Math.min(1, (r.d.y / L) / 0.3) });
      }
    }
    return out;
  }
  /** Portes et fenêtres vues dans une image (pixels), gardées avec la photo pour la projection finale. */
  ajouterOuvertures(meta, ouvertures) {
    if (!ouvertures || !ouvertures.length) return;
    const img = preparerImage(meta); if (!img) return;
    for (const o of ouvertures) this.ouverturesVues.push({ img, ...o });
  }
  /**
   * Les ouvertures posées sur les murs : chaque observation est projetée (bas de l'ouverture →
   * plan du sol → mur le plus proche à 30 cm ; haut → plan vertical de ce mur → hauteur), puis les
   * observations qui se recouvrent sur un même mur sont fusionnées (médiane). Rend
   * [{ mur, u0, u1, bas, haut, type, vues }] (u0/u1 en 0..1 le long du mur, bas/haut en mètres).
   */
  ouvertures(murs, solY) {
    const obs = [];
    for (const o of this.ouverturesVues) {
      const bas = o.type === 'porte' ? solY : null;
      // Deux colonnes extrêmes de l'ouverture, au bas : où tombent-elles au sol, et sur quel mur ?
      const pts = [o.u0, o.u1].map((u) => rayonVersSol(rayonDepuisPixel(o.img.photo, u, o.vBas, o.img.largeur, o.img.hauteur), solY));
      const projSol = pts.map((p) => p ? p : null);
      let idx = -1, meilleur = Infinity, u0 = null, u1 = null;
      murs.forEach((m, k) => {
        const ex = m.b.x - m.a.x, ez = m.b.z - m.a.z, L = Math.hypot(ex, ez); if (L < 1e-6) return;
        const nx = -ez / L, nz = ex / L, d = nx * m.a.x + nz * m.a.z;
        // Fenêtre (bas en hauteur) : on vise le mur par le rayon des colonnes au niveau du sol de l'image… à défaut, le rayon à vBas sur le plan vertical.
        const us = [o.u0, o.u1].map((u) => { const r = rayonVersMur(rayonDepuisPixel(o.img.photo, u, o.vBas, o.img.largeur, o.img.hauteur), m); return r ? r.u : null; });
        if (us.some((u) => u == null)) return;
        const dist = projSol[0] && projSol[1] ? (Math.abs(nx * projSol[0].x + nz * projSol[0].z - d) + Math.abs(nx * projSol[1].x + nz * projSol[1].z - d)) / 2 : 0.25;
        const uMin = Math.min(...us), uMax = Math.max(...us);
        if (uMax < -0.05 || uMin > 1.05) return;
        if (dist < meilleur && dist < 0.35) { meilleur = dist; idx = k; u0 = Math.max(0, uMin); u1 = Math.min(1, uMax); }
      });
      if (idx < 0) continue;
      const m = murs[idx];
      const h = (v) => { const r = rayonVersMur(rayonDepuisPixel(o.img.photo, (o.u0 + o.u1) / 2, v, o.img.largeur, o.img.hauteur), m); return r ? r.p.y - solY : null; };
      const haut = h(o.vHaut), basM = bas != null ? 0 : h(o.vBas);
      if (haut == null || basM == null || haut - basM < 0.4 || haut > 4) continue;
      obs.push({ mur: idx, u0, u1, bas: basM, haut, type: o.type });
    }
    // Fusion : même mur, même type, recouvrement des u → médianes.
    const groupes = [];
    for (const o of obs) {
      let g = groupes.find((q) => q.mur === o.mur && q.type === o.type && Math.min(q.u1, o.u1) - Math.max(q.u0, o.u0) > -0.02);
      if (!g) { g = { mur: o.mur, type: o.type, u0: o.u0, u1: o.u1, obs: [] }; groupes.push(g); }
      g.obs.push(o); g.u0 = Math.min(g.u0, o.u0); g.u1 = Math.max(g.u1, o.u1);
    }
    const med = (a) => { const t = a.slice().sort((u, v) => u - v); return t[Math.floor(t.length / 2)]; };
    return groupes.filter((g) => g.obs.length >= 2).map((g) => ({ mur: g.mur, type: g.type, u0: +med(g.obs.map((o) => o.u0)).toFixed(3), u1: +med(g.obs.map((o) => o.u1)).toFixed(3), bas: +med(g.obs.map((o) => o.bas)).toFixed(2), haut: +med(g.obs.map((o) => o.haut)).toFixed(2), vues: g.obs.length }));
  }
  /** Un point de sol réellement détecté (hit-test ARCore) : nourrit le niveau du sol. */
  ajouterHitSol(p) { if (p && isFinite(p.y)) this.hitsSol.push({ x: p.x, y: p.y, z: p.z }); }
  /**
   * Corrige une fois le plan du sol, dans les premières secondes, s'il a été verrouillé sur un
   * meuble. Le sol est le plan le PLUS BAS vu au moins deux fois (une valeur isolée plus basse
   * serait du bruit). Les points déjà projetés sont recalculés : un point est l'intersection du
   * rayon caméra → pixel avec le plan, donc le déplacer revient à changer la longueur du rayon.
   * @param {number} [ecartMin=0.12] écart (m) en dessous duquel on ne touche à rien
   */
  corrigerSol(ecartMin = 0.12) {
    if (this.solRevise || this.solsProposes.length < 5 || this.solY == null) return false;
    const tri = this.solsProposes.slice().sort((a, b) => a - b);
    const basRepete = tri[1];                       // le plus bas vu au moins deux fois
    if (!(basRepete < this.solY - ecartMin)) {
      if (this.solsProposes.length >= 14) this.solRevise = true;   // assez vu : on ne rouvre plus
      return false;
    }
    const ancien = this.solY;
    this.solY = basRepete; this.solRevise = true;
    for (const pt of this.pointsSol) {
      if (pt.cy == null) continue;
      const den = ancien - pt.cy; if (Math.abs(den) < 1e-6) continue;
      const k = (basRepete - pt.cy) / den;
      pt.x = pt.cx + (pt.x - pt.cx) * k; pt.z = pt.cz + (pt.z - pt.cz) * k;
      // Même définition que `rayonVersSol` : la distance est celle du rayon, en 3D.
      pt.distance = Math.hypot(pt.x - pt.cx, basRepete - pt.cy, pt.z - pt.cz);
    }
    this.solCorrige = { de: +ancien.toFixed(3), vers: +basRepete.toFixed(3), points: this.pointsSol.length };
    return true;
  }
  /** Le résultat de la pièce (format resultat.json), à partir de tout ce qui a été accumulé. */
  resultat(options = {}, { pas = 1 } = {}) {
    // `pas` > 1 : analyse LÉGÈRE en cours de film (un point sur `pas`), pour dessiner la
    // pièce qui se construit sans peser sur l'image ; le résultat final se fait avec tout.
    const pts = pas > 1 ? this.pointsSol.filter((_, i) => i % pas === 0) : this.pointsSol;
    // Le sol n'a jamais été reconnu : toutes les images ont été ignorées, et la vraie cause n'est
    // pas « trop peu de points » mais « pas de sol » (1er film réel : la caméra filmait une table).
    if (this.images === 0 && this.ignores > 0) {
      return { statut: 'echec', message: 'Le sol n\'a pas été reconnu pendant le film : avant de filmer, visez le sol à 1 ou 2 m devant vous jusqu\'à ce que l\'anneau soit plein.', angles: [], murs: [], surface_sol: 0, perimetre: 0, hauteur: null, solY: this.solY, images: 0, pointsSol: 0, avertissements: [] };
    }
    const solY = this.solY || 0;
    const ctx = this.contexte();
    // 1. Le plan par le SOL (frontière sol/mur) : haché par les meubles, mais à la bonne échelle.
    const base = analyserPointsSol(pts, { solY, options, contexte: ctx });
    base.images = this.images; base.pointsSol = this.pointsSol.length; base.source_plan = 'sol';
    // 2. La HAUTEUR. (04/10, expérience h) Elle est le BRAS DE LEVIER du plan par le plafond :
    //    1 cm sur h fait 1,1 % sur toutes les longueurs et 2,2 % sur la surface. Elle était lue
    //    sur les murs d'UN SEUL tirage de RANSAC — sur le salon de Moctar, h va de 2,485 à
    //    2,590 m selon la seule graine (vrai 2,56), et notre graine donnait la plus basse.
    //    Trois tirages, médiane, et on GARDE L'ÉTENDUE : c'est elle qui dit s'il faut y croire.
    //    On en profite pour mesurer la DISPERSION de la surface d'une graine à l'autre.
    let hauteur = null, hauteurs = [], hauteurEtendue = null, dispersionGraine = null;
    const lues = [], surfaces = [];
    for (const graine of [3, 7, 11]) {
      const b = graine === 7 ? base : analyserPointsSol(pts, { solY, contexte: ctx, options: Object.assign({}, options, { graine }) });
      if (b.surface_sol) surfaces.push(b.surface_sol);
      if (!b.murs.length) continue;
      const t = this.hauteurs(b.murs, solY).toutes.filter((h) => h > 1.8 && h < 4.5);
      if (!t.length) continue;
      if (graine === 7) hauteurs = t;
      const q = t.slice().sort((u, v) => u - v);
      lues.push(q[Math.floor(q.length / 2)]);
    }
    if (lues.length) {
      const q = lues.slice().sort((u, v) => u - v);
      hauteur = +q[Math.floor(q.length / 2)].toFixed(2);
      hauteurEtendue = +(q[q.length - 1] - q[0]).toFixed(3);
    }
    if (surfaces.length >= 2) {
      const q = surfaces.slice().sort((u, v) => u - v), med = q[Math.floor(q.length / 2)];
      if (med) dispersionGraine = +((q[q.length - 1] - q[0]) / med).toFixed(3);
    }
    // La hauteur RECOUPÉE prime : mesurée 2,53 m contre 2,56 vrais (−1,2 %), là où la lecture
    // donnait 2,485 (−2,9 %). Coût ≈ 100 ms, une seule fois, à la fin.
    const recoupee = (base.detections || base.murs || []).length ? this.hauteurRecoupee(base.detections || base.murs, solY) : null;
    if (recoupee && recoupee.h != null) hauteur = +recoupee.h.toFixed(2);
    if (this.hauteurForcee) hauteur = this.hauteurForcee;   // banc uniquement : isoler l'effet de la hauteur
    // 3. Le PLAN PAR LE PLAFOND (2e film réel, 04/10) : la ligne du plafond ne voit jamais les
    //    meubles. Projetée à la hauteur (mesurée, sinon 2,50 supposée), elle dessine la pièce
    //    fermée là où le sol est haché. S'il ferme la pièce, il prime ; chaque mur est ensuite
    //    « confirmé par le sol » quand la frontière du sol le longe aussi.
    const hPlan = hauteur || 2.5;
    const ptsPlafond = this.pointsPlafondProjetes(hPlan);
    let final = base;
    if (ptsPlafond.length >= 60) {
      // Le nuage du plafond est plus épais que celui du sol (erreur de pose × distance) : tolérance et
      // longueur minimale plus larges, mesurées sur le 2e film réel (8 murs, 16,9 m² ; serré : 18 bouts).
      const ctxPlafond = Object.assign({}, ctx, { vues: ctx.vues.concat(this.vuesPlafond(hPlan)), pointsSol: ptsPlafond });
      const parPlafond = analyserPointsSol(ptsPlafond, { solY, contexte: ctxPlafond, options: Object.assign({ tolerance: 0.10, longueurMin: 1.0, supportMin: 40, ecart: 0.12, angleDeg: 6 }, options) });
      const mieux = parPlafond.statut === 'ok' && parPlafond.angles.length >= 3 && (base.statut !== 'ok' || parPlafond.angles.length >= base.angles.length);
      if (mieux) {
        const solPts = this.pointsSol;
        const murs = parPlafond.murs.map((m) => {
          const ex = m.b.x - m.a.x, ez = m.b.z - m.a.z, L = Math.hypot(ex, ez) || 1, nx = -ez / L, nz = ex / L, d = nx * m.a.x + nz * m.a.z;
          let n = 0;
          for (const p of solPts) { if (Math.abs(nx * p.x + nz * p.z - d) > 0.08) continue; const u = ((p.x - m.a.x) * ex + (p.z - m.a.z) * ez) / (L * L); if (u >= -0.05 && u <= 1.05) n++; }
          return Object.assign({}, m, { confirmeSol: n >= 20, pointsSol: n, confiance: Math.min(1, (m.confiance || 1) * (n >= 20 ? 1 : 0.85)) });
        });
        final = Object.assign({}, parPlafond, { murs, images: this.images, pointsSol: this.pointsSol.length, source_plan: 'plafond', hauteur_supposee: !hauteur });
        final.message = 'Pièce reconstituée par la ligne du plafond' + (murs.every((m) => m.confirmeSol) ? ', confirmée par le sol.' : (murs.some((m) => m.confirmeSol) ? ', en partie confirmée par le sol.' : '.'));
        if (!hauteur) final.avertissements.push('Hauteur supposée à 2,50 m : le plan vient de la ligne du plafond.');
      }
    }
    final.hauteur = hauteur; final.hauteurs = hauteurs.length;
    final.hauteurEtendue = hauteurEtendue; final.hauteurRecoupee = recoupee; final.dispersionGraine = dispersionGraine;
    if (!hauteur) { if (final.source_plan === 'plafond') final.hauteur = 2.5; else final.avertissements.push('Hauteur non lue : filmez la ligne où les murs rencontrent le plafond.'); }
    else if (hauteurs.length < 5) final.avertissements.push('Hauteur lue sur peu de points : filmez la ligne du plafond.');
    if (!final.murs.length) return final;
    // 4. COMBLES : seulement sur un mur CONFIRMÉ par le sol dont la ligne du plafond monte et
    //    descend (écart > 40 cm sur ≥ 25 points) — un bout de mur de meuble ne peut plus être un pignon.
    const { parMur } = this.hauteurs(final.murs, solY);
    let combles = null;
    final.murs.forEach((m, k) => {
      const pts2 = parMur[k]; if (pts2.length < 25 || combles) return;
      if (final.source_plan === 'plafond' && !m.confirmeSol) return;
      if (final.source_plan === 'sol' && (m.longueur || 0) < 1.5) return;
      const hs2 = pts2.map((p) => p.h).sort((u, v) => u - v);
      // Des combles descendent bas : il faut un écart > 60 cm ET un point bas sous 1,70 m. Un simple
      // coffrage ou une retombée de plafond (2e film réel : 2,03 → 2,49 m) n'est pas un pignon.
      if (hs2[Math.floor(hs2.length * 0.95)] - hs2[Math.floor(hs2.length * 0.05)] < 0.6) return;
      if (hs2[Math.floor(hs2.length * 0.05)] > 1.7) return;
      const profil = profilDepuisPoints(pts2);
      if (!profil || profil.segments.length < 1) return;
      const L = Math.hypot(m.b.x - m.a.x, m.b.z - m.a.z) || 1;
      const pignon = { a: m.a, dir: { x: (m.b.x - m.a.x) / L, z: (m.b.z - m.a.z) / L } };
      if (final.angles.length >= 3) combles = Object.assign(analyserCombles(final.angles, pignon, profil), { pignon: k, points: pts2.length });
    });
    if (combles) {
      final.combles = combles; final.hauteur = combles.hauteur_max; final.hauteur_variable = true;
      final.avertissements.push(`Combles (${combles.type}) : hauteur de ${Math.min(combles.jambettes.gauche, combles.jambettes.droite).toFixed(2)} à ${combles.hauteur_max.toFixed(2)} m, surface habitable ${combles.surface_habitable} m² (hauteur ≥ 1,80 m).`);
    }
    // 5. Niveau du sol, aplomb des murs, ouvertures.
    const base2 = final;
    base2.niveauSol = niveauSol(this.hitsSol);
    base2.aplombs = base2.murs.map((m, k) => aplombMur(m, this.plafond, this.solY || 0));
    base2.ouvertures = this.ouvertures(base2.murs, this.solY || 0);
    return base2;
  }
}


/**
 * Niveau du sol : plan y = a·x + b·z + c ajusté (moindres carrés) sur les points de sol
 * détectés par la caméra. ARCore aligne Y sur la pesanteur, donc la pente est réelle.
 * Rend { pente_mm_par_m, direction_deg, points } ou null (< 30 points ou étendue < 1,5 m).
 */
export function niveauSol(pts) {
  if (!pts || pts.length < 30) return null;
  const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z);
  if (Math.max(...xs) - Math.min(...xs) < 1.5 && Math.max(...zs) - Math.min(...zs) < 1.5) return null;
  // Moindres carrés : [x z 1] · [a b c]ᵀ = y
  let sxx = 0, sxz = 0, sx = 0, szz = 0, sz = 0, n = 0, sxy = 0, szy = 0, sy = 0;
  for (const p of pts) { sxx += p.x * p.x; sxz += p.x * p.z; sx += p.x; szz += p.z * p.z; sz += p.z; sxy += p.x * p.y; szy += p.z * p.y; sy += p.y; n++; }
  const A = [[sxx, sxz, sx], [sxz, szz, sz], [sx, sz, n]], B = [sxy, szy, sy];
  const sol = resoudre3(A, B); if (!sol) return null;
  const [a, b] = sol;
  const pente = Math.hypot(a, b);
  return { pente_mm_par_m: +(pente * 1000).toFixed(1), direction_deg: +((Math.atan2(b, a) * 180 / Math.PI + 360) % 360).toFixed(0), points: n };
}
function resoudre3(A, B) {
  const m = A.map((r, i) => [...r, B[i]]);
  for (let c = 0; c < 3; c++) {
    let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
    if (Math.abs(m[p][c]) < 1e-12) return null;
    [m[c], m[p]] = [m[p], m[c]];
    for (let r = 0; r < 3; r++) { if (r === c) continue; const f = m[r][c] / m[c][c]; for (let k = c; k < 4; k++) m[r][k] -= f * m[c][k]; }
  }
  return [m[0][3] / m[0][0], m[1][3] / m[1][1], m[2][3] / m[2][2]];
}

/**
 * Aplomb d'un mur : la ligne mur/plafond est vue depuis plusieurs positions ; on cherche la
 * droite horizontale (parallèle au mur) la plus proche de tous les rayons, à une distance
 * d_haut de l'origine (le long de la normale du mur) et à une hauteur h_haut. Si d_haut diffère
 * du pied du mur, le mur penche. Linéaire : pour un rayon o + t·d, y = o.y + d.y·(d_haut − n·o)/(n·d).
 * Rend { devers_mm, hauteur, angle_deg, rayons } ou null (< 12 rayons ou peu de recul entre vues).
 */
export function aplombMur(mur, plafond, solY) {
  const ex = mur.b.x - mur.a.x, ez = mur.b.z - mur.a.z, L = Math.hypot(ex, ez); if (L < 1e-6) return null;
  const nx = -ez / L, nz = ex / L, dBas = nx * mur.a.x + nz * mur.a.z;
  const lignes = [];   // y = alpha + beta · d_haut, pour chaque rayon qui regarde ce mur
  const positions = new Set();
  for (const { img, pixels } of plafond) {
    for (let i = 0; i < pixels.length; i += 3) {
      const r0 = rayonDepuisPixel(img.photo, pixels[i].u, pixels[i].v, img.largeur, img.hauteur);
      const Ld = Math.hypot(r0.d.x, r0.d.y, r0.d.z) || 1;
      const r = { o: r0.o, d: { x: r0.d.x / Ld, y: r0.d.y / Ld, z: r0.d.z / Ld } };   // direction unitaire : t en mètres
      const nd = nx * r.d.x + nz * r.d.z; if (Math.abs(nd) < 1e-6) continue;
      // Ce rayon doit tomber sur CE mur (abscisse 0..1 au niveau du pied) et de face.
      const t0 = (dBas - (nx * r.o.x + nz * r.o.z)) / nd; if (!(t0 > 0.3)) continue;
      const px = r.o.x + r.d.x * t0, pz = r.o.z + r.d.z * t0;
      const u = ((px - mur.a.x) * ex + (pz - mur.a.z) * ez) / (L * L); if (u < -0.05 || u > 1.05) continue;
      const no = nx * r.o.x + nz * r.o.z;
      lignes.push({ alpha: r.o.y - r.d.y * no / nd, beta: r.d.y / nd, no });
      positions.add(Math.round(no * 10));   // recul (en décimètres) : il faut des vues depuis des distances différentes
    }
  }
  if (lignes.length < 12 || positions.size < 3) return null;
  // Conditionnement : la triangulation n'a de sens que si les vues sont prises depuis des reculs
  // vraiment différents (≥ 60 cm d'écart le long de la normale du mur). Sinon les rayons sont
  // presque parallèles et le dévers calculé est du bruit (vu au banc : 15 à 25 cm de faux dévers).
  const nos = lignes.map((l) => l.no);
  if (Math.max(...nos) - Math.min(...nos) < 0.6) return null;
  // Moindres carrés en (d_haut, h_haut) : alpha + beta·d − h = 0
  let sbb = 0, sb = 0, sba = 0, sa = 0, n = 0;
  for (const l of lignes) { sbb += l.beta * l.beta; sb += l.beta; sba += l.beta * l.alpha; sa += l.alpha; n++; }
  const det = sbb * n - sb * sb; if (Math.abs(det) < 1e-9) return null;
  const dHaut = (-sba * n + sa * sb) / det;
  const hHaut = (sbb * sa - sb * sba) / det;
  const hauteur = hHaut - solY; if (!(hauteur > 1.5 && hauteur < 6)) return null;
  const devers = dHaut - dBas;   // > 0 : le haut du mur s'écarte du côté de la normale
  if (Math.abs(devers) > 0.08 * hauteur) return null;   // plus de 8 % de dévers : ce n'est pas un mur qui penche, c'est une mesure fausse
  return { devers_mm: +(devers * 1000).toFixed(0), hauteur: +hauteur.toFixed(2), angle_deg: +(Math.atan2(devers, hauteur) * 180 / Math.PI).toFixed(2), rayons: lignes.length };
}


// ══════════════════════════════════════════════════════════════════════════════
// LE CONTRÔLE DE COHÉRENCE (04/10/2026, expérience h.8)
// « Un métré faux et affirmé coûte plus cher qu'un métré refusé. » Six vérifications, toutes
// calculables SANS vérité terrain, donc sur le téléphone. Mesuré sur 85 films : 19 cotes
// affichées, ZÉRO fausse, erreur de surface médiane 0,36 % ; sans lui (fermeture seule),
// 20 affichées dont 2 FAUSSES. Les seuils sont calibrés sur ces 85 films — à revérifier dès
// qu'on a trois ou quatre films réels de plus.
// ══════════════════════════════════════════════════════════════════════════════

/** Un point est-il dans le polygone {x,z} ? (lancer de rayon) */
export function pointDansPolygone(poly, x, z) {
  let dedans = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.z > z) !== (b.z > z) && x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x) dedans = !dedans;
  }
  return dedans;
}

/** Part des positions `pts` qui tombent DANS le polygone. null si la question n'a pas de sens. */
export function partDansPolygone(poly, pts) {
  if (!poly || poly.length < 3 || !pts || !pts.length) return null;
  let n = 0; for (const p of pts) if (pointDansPolygone(poly, p.x, p.z)) n++;
  return n / pts.length;
}

/**
 * Part de chaque côté réellement VUE : on échantillonne le côté tous les 10 cm et on regarde
 * s'il y a un point du nuage à moins de 12 cm. Un côté sans appui est un côté que l'appareil
 * n'a jamais vu — il a été déduit, et sa longueur ne vaut rien.
 * Rend [{ longueur, appui }] dans l'ordre des côtés.
 */
export function appuiCotes(poly, nuage, { pas = 0.10, tol = 0.12 } = {}) {
  const g = new Set();
  for (const p of nuage || []) g.add(Math.floor(p.x / tol) + ',' + Math.floor(p.z / tol));
  const pres = (x, z) => {
    const i = Math.floor(x / tol), j = Math.floor(z / tol);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (g.has((i + a) + ',' + (j + b))) return true;
    return false;
  };
  const out = [];
  for (let i = 0; i < (poly || []).length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(2, Math.round(L / pas));
    let ok = 0;
    for (let k = 0; k <= n; k++) { const t = k / n; if (pres(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) ok++; }
    out.push({ longueur: +L.toFixed(2), appui: +(ok / (n + 1)).toFixed(2) });
  }
  return out;
}

/**
 * Peut-on AFFICHER ces cotes comme sûres ?
 * `res` = le résultat de `Accumulateur.resultat()`, `acc` = l'accumulateur, `echos` = les mesures
 * par le son sous la forme [{ sonar, camera }] (distances en mètres).
 *
 * Rend { affichable, controles, raisons } ; chaque contrôle vaut true, false, ou **null quand il
 * n'a pas pu être mesuré** (le micro refusé, par exemple). Un contrôle non mesuré ne condamne
 * pas : il ne confirme pas. Seul un `false` retire la mention « sûr ».
 */
export function controlerCoherence(res, acc, { echos = [] } = {}) {
  const c = {}, raisons = [];
  const angles = (res && res.angles) || [];
  const nuage = res && res.source_plan === 'plafond' ? acc.pointsPlafondProjetes(res.hauteur || 2.5) : acc.pointsSol;
  // 1. La pièce est refermée, et aucun côté n'est sans mur détecté.
  c.ferme = !!res && res.statut === 'ok' && angles.length >= 3 && !((res.murs || []).some((m) => m.trouve === 'manquant'));
  if (!c.ferme) raisons.push('La pièce n\'est pas refermée : il manque un mur. Filmez le pied de chaque mur.');
  // 2. Tout le trajet parcouru doit être DANS le plan : sinon le plan décrit autre chose.
  const dedans = partDansPolygone(angles, acc.trajectoire);
  c.trajectoire = dedans == null ? null : dedans >= 0.90;
  if (c.trajectoire === false) raisons.push('Le plan ne contient pas tout le trajet que vous avez parcouru : il décrit autre chose que cette pièce.');
  // 3. Chaque côté a été vu (sauf les tout petits retours).
  const ap = angles.length >= 3 ? appuiCotes(angles, nuage) : [];
  c.appui = ap.length ? ap.every((q) => q.appui >= 0.20 || q.longueur < 0.30) : null;
  if (c.appui === false) raisons.push('Un côté du plan n\'a presque pas été vu : refaites un passage le long de ce mur.');
  // 4. La hauteur est stable d'un tirage à l'autre, et son pic de recoupement en est un.
  const etendue = res && res.hauteurEtendue, net = res && res.hauteurRecoupee && res.hauteurRecoupee.nettete;
  c.hauteur = etendue == null && net == null ? null : (etendue == null || etendue <= 0.05) && (net == null || net >= 1.5);
  if (c.hauteur === false) raisons.push('La hauteur sous plafond n\'est pas stable : filmez la ligne où les murs rencontrent le plafond.');
  // 5. Le son retrouve les murs là où la caméra les annonce (≥ 2 murs, à 6 cm + 2 % près).
  c.echelle = echos.length ? echos.filter((e) => Math.abs(e.sonar - e.camera) <= 0.06 + 0.02 * e.camera).length >= 2 : null;
  if (c.echelle === false) raisons.push('Le son n\'a pas retrouvé vos murs : approchez-vous d\'un mur et refaites un passage.');
  // 6. Le même film rend la même surface d'un tirage à l'autre.
  const disp = res && res.dispersionGraine;
  c.stable = disp == null ? null : disp <= 0.05;
  if (c.stable === false) raisons.push('Le calcul n\'est pas stable d\'un essai à l\'autre : la pièce est trop encombrée ou trop peu filmée.');
  return { affichable: Object.values(c).every((v) => v !== false), controles: c, raisons };
}

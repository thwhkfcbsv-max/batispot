// Métré « photo figée » (03/10/2026, Moctar : « mettre les points après la
// photo », « on trace des murs, les angles sont calculés », « tout avec le
// téléphone, soyons précis »).
//
// Pendant la session AR, une image de la caméra est figée AVEC la position du
// téléphone, sa focale (matrice de projection) et le plan du sol. Ensuite, tout
// pixel touché sur la photo se projette au sol par calcul : un rayon part de la
// caméra à travers le pixel et coupe le plan du sol. Les murs sont tracés par
// deux points sur leur pied, les angles sont les intersections de ces droites,
// donc jamais touchés eux-mêmes — un meuble devant l'angle ne gêne plus.
//
// Ce module ne contient que des calculs purs, vérifiables avec `node --test`
// sans WebXR ni téléphone (même principe que metre-geometrie.js). Les matrices
// sont en colonne-major, comme WebXR les fournit (Float32Array de 16).
// Toutes les longueurs sont en MÈTRES.

/** Inverse d'une matrice 4×4 colonne-major. Rend null si singulière. */
export function mat4Inverse(m) {
  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
  const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det || !isFinite(det)) return null;
  det = 1 / det;
  const o = new Float64Array(16);
  o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return o;
}

/** Produit de matrices 4×4 colonne-major, out = a·b. */
export function mat4Mul(a, b) {
  const o = new Float64Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let v = 0; for (let k = 0; k < 4; k++) v += a[k * 4 + j] * b[i * 4 + k];
    o[i * 4 + j] = v;
  }
  return o;
}

function appliquer(m, x, y, z, w) {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12] * w,
    m[1] * x + m[5] * y + m[9] * z + m[13] * w,
    m[2] * x + m[6] * y + m[10] * z + m[14] * w,
    m[3] * x + m[7] * y + m[11] * z + m[15] * w,
  ];
}

/**
 * Ce qu'on garde d'une photo figée : la position de la caméra et l'inverse de
 * (projection × vue), qui ramène un point de l'écran dans le monde.
 * @param {ArrayLike<number>} projection  view.projectionMatrix
 * @param {ArrayLike<number>} vueInverse  view.transform.inverse.matrix (monde → caméra)
 * @param {{x:number,y:number,z:number}} camera  view.transform.position
 */
export function preparerPhoto(projection, vueInverse, camera) {
  const ecran = mat4Mul(projection, vueInverse);
  const inv = mat4Inverse(ecran);
  if (!inv) return null;
  return { inv, camera: { x: camera.x, y: camera.y, z: camera.z } };
}

/**
 * Rayon partant de la caméra à travers un pixel de la photo.
 * (u, v) en pixels image, origine en haut à gauche ; largeur/hauteur de l'image.
 * Rend { o, d } : origine et direction (non normalisée) en repère monde.
 */
export function rayonDepuisPixel(photo, u, v, largeur, hauteur) {
  const nx = (u / largeur) * 2 - 1;
  const ny = 1 - (v / hauteur) * 2;
  const p0 = appliquer(photo.inv, nx, ny, -1, 1);
  const p1 = appliquer(photo.inv, nx, ny, 1, 1);
  const a = { x: p0[0] / p0[3], y: p0[1] / p0[3], z: p0[2] / p0[3] };
  const b = { x: p1[0] / p1[3], y: p1[1] / p1[3], z: p1[2] / p1[3] };
  return { o: photo.camera, d: { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z } };
}

/**
 * Intersection d'un rayon avec le plan horizontal y = solY.
 * Rend le point au sol, ou null si le rayon ne descend pas vers le sol
 * (pixel au-dessus de l'horizon : un mur, le plafond).
 */
export function rayonVersSol(rayon, solY) {
  const { o, d } = rayon;
  if (!(d.y < -1e-9)) return null;
  const t = (solY - o.y) / d.y;
  if (!(t > 0)) return null;
  return { x: o.x + d.x * t, y: solY, z: o.z + d.z * t, distance: t * Math.hypot(d.x, d.y, d.z) };
}

/**
 * Un pixel de la photo → un point au sol, en une fois.
 * Rend null si le pixel n'est pas « au sol » (au-dessus de l'horizon).
 */
export function pixelVersSol(photo, u, v, largeur, hauteur, solY) {
  return rayonVersSol(rayonDepuisPixel(photo, u, v, largeur, hauteur), solY);
}

/**
 * Intersection de deux droites du plan du sol (XZ), chacune donnée par deux
 * points. Rend { x, z, angleDeg } ou null si quasi parallèles (< 5°) — dans ce
 * cas l'angle n'est pas défini et l'artisan doit retracer un des murs.
 */
export function intersectionMurs(m1, m2) {
  const ux = m1.b.x - m1.a.x, uz = m1.b.z - m1.a.z;
  const vx = m2.b.x - m2.a.x, vz = m2.b.z - m2.a.z;
  const lu = Math.hypot(ux, uz), lv = Math.hypot(vx, vz);
  if (lu < 1e-6 || lv < 1e-6) return null;
  const den = ux * vz - uz * vx;
  const sinus = Math.abs(den) / (lu * lv);
  if (sinus < Math.sin(5 * Math.PI / 180)) return null;
  const wx = m2.a.x - m1.a.x, wz = m2.a.z - m1.a.z;
  const t = (wx * vz - wz * vx) / den;
  const cos = (ux * vx + uz * vz) / (lu * lv);
  const angleDeg = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
  return { x: m1.a.x + ux * t, z: m1.a.z + uz * t, angleDeg: 180 - angleDeg };
}

/**
 * Les angles de la pièce à partir des murs tracés dans l'ordre (chaque mur =
 * deux points sur son pied). L'angle i est l'intersection du mur i et du mur
 * i+1 ; la pièce fermée ajoute l'intersection du dernier et du premier.
 * Rend { angles: [{x,y,z}], manques: [i…] } — `manques` liste les paires de
 * murs quasi parallèles, dont l'angle n'a pas pu être calculé.
 */
export function anglesDepuisMurs(murs, solY, fermer = true) {
  const n = murs.length;
  const angles = [], manques = [];
  if (n < 2) return { angles, manques };
  const paires = fermer ? n : n - 1;
  for (let i = 0; i < paires; i++) {
    const p = intersectionMurs(murs[i], murs[(i + 1) % n]);
    if (!p) { manques.push(i); continue; }
    angles.push({ x: p.x, y: solY, z: p.z, angleDeg: p.angleDeg });
  }
  return { angles, manques };
}

/**
 * Intersection d'un rayon avec le plan VERTICAL d'un mur (droite au sol
 * prolongée vers le haut). Sert à la hauteur : le pixel touché sur la ligne
 * mur/plafond, projeté sur le mur, donne l'altitude du plafond.
 * Rend { p, u, t } (point, abscisse le long du mur 0..1, distance) ou null.
 */
export function rayonVersMur(rayon, mur) {
  const ex = mur.b.x - mur.a.x, ez = mur.b.z - mur.a.z;
  const L = Math.hypot(ex, ez); if (L < 1e-6) return null;
  const nx = -ez / L, nz = ex / L;                       // normale horizontale du mur
  const { o, d } = rayon;
  const den = nx * d.x + nz * d.z; if (Math.abs(den) < 1e-6) return null;
  const t = (nx * (mur.a.x - o.x) + nz * (mur.a.z - o.z)) / den;
  if (!(t > 0)) return null;
  const p = { x: o.x + d.x * t, y: o.y + d.y * t, z: o.z + d.z * t };
  const u = ((p.x - mur.a.x) * ex + (p.z - mur.a.z) * ez) / (L * L);
  return { p, u, t, L };
}

/**
 * Hauteur sous plafond depuis un pixel touché sur la ligne mur/plafond : on
 * cherche le mur que le rayon rencontre (abscisse entre -0,2 et 1,2 pour
 * tolérer un prolongement), le plus proche d'abord. Rend la hauteur en mètres,
 * ou null si aucun mur n'est devant ce pixel.
 */
export function hauteurDepuisPixel(photo, u, v, largeur, hauteur, murs, solY) {
  const rayon = rayonDepuisPixel(photo, u, v, largeur, hauteur);
  let meilleur = null;
  for (const m of murs) {
    const r = rayonVersMur(rayon, m);
    if (!r || r.u < -0.2 || r.u > 1.2) continue;
    if (!meilleur || r.t < meilleur.t) meilleur = r;
  }
  if (!meilleur) return null;
  const h = meilleur.p.y - solY;
  return h > 0 ? h : null;
}

/**
 * Colle un point touché à l'arête de contraste la plus proche dans la photo.
 * `lire(x, y)` rend la luminance (0..255) du pixel ; on cherche, dans un carré
 * de ±rayon pixels, le pixel dont le gradient (Sobel) est le plus fort, en
 * pondérant par la proximité du doigt pour ne pas sauter sur un motif
 * lointain. Rend { u, v, force } — `force` 0 si aucune arête nette (le point
 * reste alors sous le doigt).
 */
export function collerArete(lire, u, v, largeur, hauteur, rayon = 8) {
  let meilleur = { u, v, force: 0 };
  const x0 = Math.max(1, Math.round(u) - rayon), x1 = Math.min(largeur - 2, Math.round(u) + rayon);
  const y0 = Math.max(1, Math.round(v) - rayon), y1 = Math.min(hauteur - 2, Math.round(v) + rayon);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const gx = (lire(x + 1, y - 1) + 2 * lire(x + 1, y) + lire(x + 1, y + 1)) - (lire(x - 1, y - 1) + 2 * lire(x - 1, y) + lire(x - 1, y + 1));
    const gy = (lire(x - 1, y + 1) + 2 * lire(x, y + 1) + lire(x + 1, y + 1)) - (lire(x - 1, y - 1) + 2 * lire(x, y - 1) + lire(x + 1, y - 1));
    const g = Math.hypot(gx, gy);
    const dist = Math.hypot(x - u, y - v);
    const score = g * (1 - 0.5 * dist / (rayon + 1));
    if (score > meilleur.force) meilleur = { u: x, v: y, force: score };
  }
  // Une arête « nette » : au moins 80 sur l'échelle Sobel (≈ 20 niveaux de gris de saut).
  return meilleur.force >= 80 ? meilleur : { u, v, force: 0 };
}

/**
 * Ajuste la droite d'un mur sur tous les pixels d'arête entre ses deux points
 * (régression orthogonale sur les points au sol). Rend { a, b } : les deux
 * points d'origine projetés sur la droite ajustée, ou le mur inchangé si moins
 * de 6 points.
 */
export function ajusterMur(mur, pointsSol) {
  if (!pointsSol || pointsSol.length < 6) return mur;
  const n = pointsSol.length;
  const mx = pointsSol.reduce((s, p) => s + p.x, 0) / n, mz = pointsSol.reduce((s, p) => s + p.z, 0) / n;
  let sxx = 0, sxz = 0, szz = 0;
  for (const p of pointsSol) { const dx = p.x - mx, dz = p.z - mz; sxx += dx * dx; sxz += dx * dz; szz += dz * dz; }
  // Direction principale (vecteur propre de la plus grande valeur propre).
  const theta = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  const dx = Math.cos(theta), dz = Math.sin(theta);
  const proj = (p) => { const t = (p.x - mx) * dx + (p.z - mz) * dz; return { x: mx + dx * t, z: mz + dz * t }; };
  return { a: Object.assign({}, mur.a, proj(mur.a)), b: Object.assign({}, mur.b, proj(mur.b)) };
}

/**
 * Positions écran (pixels image) d'un point du monde sur une photo donnée :
 * sert à redessiner les murs et angles calculés par-dessus la photo.
 * Rend { u, v, devant }.
 */
export function mondeVersPixel(ecran, p, largeur, hauteur) {
  const r = appliquer(ecran, p.x, p.y, p.z, 1);
  if (!(r[3] > 1e-6)) return { u: 0, v: 0, devant: false };
  const nx = r[0] / r[3], ny = r[1] / r[3];
  return { u: (nx + 1) / 2 * largeur, v: (1 - ny) / 2 * hauteur, devant: nx >= -1.5 && nx <= 1.5 && ny >= -1.5 && ny <= 1.5 };
}

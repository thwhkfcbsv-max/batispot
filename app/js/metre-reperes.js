// Repères visuels du métré AR : les formes que le viseur dessine sur l'image
// de la caméra (réticule, angles posés, traits au sol, fil à plomb). Séparé de
// la page pour la même raison que metre-geometrie.js : ce sont des calculs
// purs, vérifiables avec `node --test`, sans WebXR ni téléphone.
//
// Pourquoi ce module existe (01/10/2026, Moctar : « visez le sol, posez un
// point — est-ce qu'on peut ajouter ces repères visuels dans la caméra ? ») :
// le viseur dessinait déjà un anneau, des points et des traits, mais en
// primitives LINES/POINTS WebGL — un pixel de large sur Android, quelle que
// soit la valeur demandée. Sur une image de caméra en plein jour, c'est
// invisible. Ici, chaque repère est une SURFACE (triangles) : un anneau plein,
// un disque, une bande de largeur réelle en mètres, avec un halo sombre
// dessous pour rester lisible sur un sol clair comme sur un sol foncé.
//
// Toutes les longueurs sont en MÈTRES (l'unité de WebXR). Les coordonnées
// rendues sont des tableaux plats [x, y, z, x, y, z, …] prêts pour
// gl.bufferData, dans le mode indiqué par chaque fonction.

/** Petite surélévation au-dessus du sol pour ne pas se battre avec le plan détecté. */
export const SUR_SOL = 0.005;

/**
 * Anneau plat (horizontal) entre deux rayons — mode TRIANGLE_STRIP.
 * C'est le réticule, et le liseré blanc autour d'un angle posé.
 */
export function anneau(c, rInt, rExt, n = 40) {
  const out = [];
  const y = c.y + SUR_SOL;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const cx = Math.cos(a), sz = Math.sin(a);
    out.push(c.x + cx * rExt, y, c.z + sz * rExt);
    out.push(c.x + cx * rInt, y, c.z + sz * rInt);
  }
  return out;
}

/** Disque plat (horizontal) — mode TRIANGLE_FAN. Le cœur d'un angle posé. */
export function disque(c, r, n = 32) {
  const out = [c.x, c.y + SUR_SOL, c.z];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(c.x + Math.cos(a) * r, c.y + SUR_SOL, c.z + Math.sin(a) * r);
  }
  return out;
}

/**
 * Bande plate au sol entre deux points, de largeur réelle — mode TRIANGLE_STRIP
 * (4 sommets). Remplace le trait d'un pixel entre deux angles.
 * Deux points confondus rendent une bande vide : rien à dessiner.
 */
export function bande(a, b, largeur) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const l = Math.hypot(dx, dz);
  if (l < 1e-6) return [];
  // Perpendiculaire horizontale, demi-largeur.
  const px = (-dz / l) * (largeur / 2), pz = (dx / l) * (largeur / 2);
  const ya = a.y + SUR_SOL, yb = b.y + SUR_SOL;
  return [
    a.x + px, ya, a.z + pz,
    a.x - px, ya, a.z - pz,
    b.x + px, yb, b.z + pz,
    b.x - px, yb, b.z - pz,
  ];
}

/**
 * Bande en pointillés : le trait « en attente » entre le dernier angle posé et
 * le réticule. Rend une liste de bandes (une par tiret), chacune en
 * TRIANGLE_STRIP. Le dernier tiret est tronqué à la longueur restante.
 */
export function bandePointillee(a, b, largeur, tiret = 0.10, espace = 0.06) {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const l = Math.hypot(dx, dz);
  if (l < 1e-6) return [];
  const out = [];
  for (let d = 0; d < l; d += tiret + espace) {
    const fin = Math.min(d + tiret, l);
    const t0 = d / l, t1 = fin / l;
    out.push(bande(
      { x: a.x + dx * t0, y: a.y + dy * t0, z: a.z + dz * t0 },
      { x: a.x + dx * t1, y: a.y + dy * t1, z: a.z + dz * t1 },
      largeur,
    ));
  }
  return out;
}

/**
 * Fil à plomb : bande VERTICALE partant d'un pied au sol, de hauteur donnée,
 * tournée vers la caméra pour rester visible de face — mode TRIANGLE_STRIP.
 * Sert à l'étape du plafond : « à l'aplomb » se voit, au lieu de se deviner.
 */
export function filAPlomb(pied, hauteur, largeur, camera) {
  // Direction horizontale caméra → pied ; la bande lui est perpendiculaire.
  let dx = pied.x - camera.x, dz = pied.z - camera.z;
  let l = Math.hypot(dx, dz);
  if (l < 1e-6) { dx = 1; dz = 0; l = 1; }
  const px = (-dz / l) * (largeur / 2), pz = (dx / l) * (largeur / 2);
  const y0 = pied.y, y1 = pied.y + hauteur;
  return [
    pied.x + px, y0, pied.z + pz,
    pied.x - px, y0, pied.z - pz,
    pied.x + px, y1, pied.z + pz,
    pied.x - px, y1, pied.z - pz,
  ];
}

/** Centre des angles posés (moyenne), au sol. */
export function centroide(points) {
  if (!points.length) return null;
  const s = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y, z: acc.z + p.z }), { x: 0, y: 0, z: 0 });
  const n = points.length;
  return { x: s.x / n, y: s.y / n, z: s.z / n };
}

/**
 * Projette un point du monde sur l'écran, en pixels CSS, à partir de la
 * matrice projection × vue (colonne-major, comme WebXR la fournit).
 * Rend { x, y, devant } ; `devant` est faux si le point est derrière la caméra
 * — on ne pose alors pas d'étiquette.
 * Sert aux numéros « 1, 2, 3, 4 » posés en DOM au-dessus de chaque angle.
 */
export function projeter(m, p, largeurPx, hauteurPx) {
  const x = m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12];
  const y = m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13];
  const w = m[3] * p.x + m[7] * p.y + m[11] * p.z + m[15];
  if (!(w > 1e-6)) return { x: 0, y: 0, devant: false };
  const nx = x / w, ny = y / w;
  return {
    x: (nx + 1) / 2 * largeurPx,
    y: (1 - ny) / 2 * hauteurPx,
    devant: nx >= -1.2 && nx <= 1.2 && ny >= -1.2 && ny <= 1.2,
  };
}

/**
 * LA TRAÎNÉE AU SOL (04/10/2026, diagnostic de nuit : « on ne sait pas ce qui est pris
 * en compte »). Chaque point de frontière sol/mur projeté au sol laisse une trace qui
 * s'accumule : l'artisan voit ce que l'outil a pris AVANT qu'un mur soit reconnu, sans
 * rien attendre du suivi.
 *
 * Trois règles tirées de l'étude du 03/10 ([[reference_batispot_etude_balayage_rendu_20261003]]) :
 *   - bords ADOUCIS (alpha 0 sur le pourtour, comme le plan d'ARCore) ;
 *   - HYSTÉRÉSIS : une cellule n'apparaît qu'au-dessus d'un poids, et ne disparaît plus
 *     — aucun scintillement, jamais de points épars qui clignotent ;
 *   - opacité QUI MONTE avec le poids : la densité dit la confiance.
 * Les cellules se recouvrent (rayon > demi-cellule) : on lit un ruban, pas des pois.
 */
export class Trainee {
  constructor({ cellule = 0.06, seuil = 0.35, max = 1100, rayon = 0.085, segments = 6 } = {}) {
    this.cellule = cellule; this.seuil = seuil; this.max = max; this.rayon = rayon; this.segments = segments;
    this.cellules = new Map(); this.version = 0;
  }
  get taille() { return this.cellules.size; }
  get visibles() { let n = 0; for (const c of this.cellules.values()) if (c.vue) n++; return n; }
  vider() { this.cellules.clear(); this.version++; }
  /** Ajoute des points {x, z, poids?} ; rend le nombre de cellules devenues visibles. */
  ajouter(points) {
    let nouvelles = 0;
    for (const p of points || []) {
      if (!isFinite(p.x) || !isFinite(p.z)) continue;
      const k = Math.round(p.x / this.cellule) + ',' + Math.round(p.z / this.cellule);
      const w = p.poids == null ? 0.35 : Math.max(0.02, p.poids);
      let c = this.cellules.get(k);
      if (!c) { c = { x: p.x, z: p.z, poids: 0, vue: false }; this.cellules.set(k, c); }
      // Position moyenne pondérée : le centre de la cellule n'est qu'un index.
      c.x = (c.x * c.poids + p.x * w) / (c.poids + w); c.z = (c.z * c.poids + p.z * w) / (c.poids + w);
      c.poids = Math.min(4, c.poids + w);
      if (!c.vue && c.poids >= this.seuil) { c.vue = true; nouvelles++; }
    }
    // Plafond de mémoire : on oublie les cellules les plus anciennes (ordre d'insertion).
    if (this.cellules.size > this.max) {
      const it = this.cellules.keys();
      for (let i = this.cellules.size - this.max; i > 0; i--) this.cellules.delete(it.next().value);
    }
    this.version++;
    return nouvelles;
  }
  /**
   * Opacité d'une cellule : 0,30 dès qu'elle apparaît (sinon, sur un mur vu de 3 m au premier
   * passage, le ruban est invisible — mesuré sur les captures du 04/10), 0,85 quand elle est
   * bien vue. Le halo sombre dessous fait le reste du travail sur un sol clair.
   */
  opacite(poids) { return +(0.30 + 0.55 * Math.min(1, poids / 1.6)).toFixed(3); }
  /**
   * Sommets `x y z a` (alpha par sommet) en mode TRIANGLES, posés sur le plan y.
   * Chaque cellule visible est un disque adouci : centre opaque, pourtour transparent.
   * `facteurRayon` > 1 sert au HALO sombre dessous : sans lui, un ruban blanc verdi
   * disparaît sur un sol clair en plein jour (même raison que le halo des autres repères).
   */
  sommets(y, facteurRayon = 1) {
    const n = this.segments, r = this.rayon * facteurRayon;
    const vus = []; for (const c of this.cellules.values()) if (c.vue) vus.push(c);
    const out = new Float32Array(vus.length * n * 3 * 4);
    let o = 0;
    for (const c of vus) {
      const a = this.opacite(c.poids);
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
        out[o++] = c.x; out[o++] = y; out[o++] = c.z; out[o++] = a;
        out[o++] = c.x + Math.cos(a0) * r; out[o++] = y; out[o++] = c.z + Math.sin(a0) * r; out[o++] = 0;
        out[o++] = c.x + Math.cos(a1) * r; out[o++] = y; out[o++] = c.z + Math.sin(a1) * r; out[o++] = 0;
      }
    }
    return out;
  }
}

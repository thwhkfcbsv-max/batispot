// ASSEMBLAGE DU POLYGONE DE LA PIÈCE — expérience (g), 04/10/2026.
//
// Le constat de l'expérience (a) : notre GÉOMÉTRIE est bonne (les droites des murs sont à 0,4 à
// 3 cm de leur plan vrai) mais l'ASSEMBLAGE ne l'est pas. `ordonnerMurs` + intersections
// consécutives referme ce qu'on lui donne : il n'a aucun moyen de voir qu'il MANQUE un mur
// (ai_002_009 : 4 murs trouvés pour une pièce qui en a 6, surface −36 %) ni qu'il y en a TROP
// (ai_004_009 : 7 à 10 détections pour 4 murs, surface −95 %).
//
// Ce module remplace cette étape. L'idée centrale, empruntée à la reconstruction de plans
// d'intérieur par PARTITION DE L'ESPACE (Ikehata et al. 2015, « structured indoor modeling » ;
// Chen et al. 2019, Floor-SP) : on ne chaîne plus les murs, on partitionne le plan du sol par
// toutes les droites des murs (un ARRANGEMENT de droites, dont toutes les faces sont convexes),
// puis on ÉTIQUETTE chaque face « dedans » ou « dehors » avec une preuve indépendante de la
// géométrie — l'ESPACE LIBRE :
//
//   * la caméra était physiquement DANS la pièce → une face traversée par la trajectoire est dedans
//     (preuve PONDÉRÉE, 60 votes par pas de 5 cm : un pas égaré ne fait pas entrer une niche) ;
//   * un point de frontière sol/mur vu depuis la caméra prouve que le segment [caméra, point] est
//     du sol LIBRE → toute face traversée par ce segment est dedans ;
//   * juste DERRIÈRE ce point (12 à 45 cm au-delà, le long du rayon) on est derrière un mur → dehors.
//
// La pièce = la COMPOSANTE CONNEXE de faces « dedans » que la caméra a traversée (c'est la version
// non convexe du « cycle minimal entourant la trajectoire » : un îlot d'espace libre vu par une
// porte ouverte reste dehors), et son contour = les arêtes de l'arrangement dont les deux faces
// voisines ne portent pas la même étiquette. Trois propriétés tombent gratuitement :
//
//   1. un mur DUPLIQUÉ coupe une face en deux, mais les deux moitiés sont « dedans » : l'union ne
//      change pas. Les détections en trop deviennent inoffensives au lieu d'être fatales ;
//   2. un mur MANQUANT ne ferme plus rien de force : si les droites existantes suffisent à borner
//      l'espace libre, le polygone est juste ; sinon le contour touche le bord de la boîte et on
//      le DIT (`statut: 'partiel'`) au lieu de rendre un chiffre faux ;
//   3. les RETOURS courts (pièce en L, niche, poteau) apparaissent d'eux-mêmes comme arêtes de
//      l'arrangement, sans règle spéciale — et une pièce non convexe est rendue telle quelle.
//
// Zéro dépendance : ce fichier est importable tel quel par l'appli (`app/js/`). Repère monde
// WebXR, plan du sol = XZ, toutes les longueurs en MÈTRES.

const RAD = Math.PI / 180;

// ══════════════════════════════════════════════════════════════════════════════════════════
//  0. Briques de géométrie (copies autonomes, pour que ce module n'ait aucune dépendance)
// ══════════════════════════════════════════════════════════════════════════════════════════

/** Aire (lacet) et périmètre d'un polygone {x,z}. */
export function aireEtPerimetre(poly) {
  let a = 0, p = 0;
  for (let i = 0; i < poly.length; i++) {
    const u = poly[i], v = poly[(i + 1) % poly.length];
    a += u.x * v.z - v.x * u.z; p += Math.hypot(v.x - u.x, v.z - u.z);
  }
  return { aire: Math.abs(a) / 2, perimetre: p };
}

/** Aire SIGNÉE (> 0 : sens trigonométrique dans le repère (x, z)). */
export function aireSignee(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const u = poly[i], v = poly[(i + 1) % poly.length];
    a += u.x * v.z - v.x * u.z;
  }
  return a / 2;
}

/** Intersection de deux murs (copie de `metre-photo.js::intersectionMurs`) : null si < 5° d'écart. */
export function intersectionMurs(m1, m2) {
  const ux = m1.b.x - m1.a.x, uz = m1.b.z - m1.a.z;
  const vx = m2.b.x - m2.a.x, vz = m2.b.z - m2.a.z;
  const lu = Math.hypot(ux, uz), lv = Math.hypot(vx, vz);
  if (lu < 1e-6 || lv < 1e-6) return null;
  const den = ux * vz - uz * vx;
  const sinus = Math.abs(den) / (lu * lv);
  if (sinus < Math.sin(5 * RAD)) return null;
  const wx = m2.a.x - m1.a.x, wz = m2.a.z - m1.a.z;
  const t = (wx * vz - wz * vx) / den;
  const cos = (ux * vx + uz * vz) / (lu * lv);
  const angleDeg = Math.acos(Math.max(-1, Math.min(1, cos))) / RAD;
  return { x: m1.a.x + ux * t, z: m1.a.z + uz * t, angleDeg: 180 - angleDeg };
}

/** Chaînage bout à bout (copie de `metre-murs.js::ordonnerMurs`). */
export function ordonnerMurs(murs) {
  if (murs.length < 2) return murs.slice();
  const reste = murs.map((m) => ({ ...m, a: { ...m.a }, b: { ...m.b }, dir: { ...m.dir }, n: { ...m.n } }))
    .sort((u, v) => v.longueur - u.longueur);
  const out = [reste.shift()];
  while (reste.length) {
    const fin = out[out.length - 1].b;
    let bi = -1, bd = Infinity, retourner = false;
    reste.forEach((m, i) => {
      const da = Math.hypot(m.a.x - fin.x, m.a.z - fin.z), db = Math.hypot(m.b.x - fin.x, m.b.z - fin.z);
      if (da < bd) { bd = da; bi = i; retourner = false; }
      if (db < bd) { bd = db; bi = i; retourner = true; }
    });
    const m = reste.splice(bi, 1)[0];
    if (retourner) { const t = m.a; m.a = m.b; m.b = t; m.dir = { x: -m.dir.x, z: -m.dir.z }; m.n = { x: -m.n.x, z: -m.n.z }; m.d = -m.d; }
    out.push(m);
  }
  return out;
}

/** Redressement LOCAL des angles droits (copie de `metre-murs.js::redresserAnglesDroits`). */
export function redresserAnglesDroits(mursOrdonnes, { seuilDeg = 7 } = {}) {
  const murs = mursOrdonnes.map((m) => ({ ...m, a: { ...m.a }, b: { ...m.b }, dir: { ...m.dir }, n: { ...m.n } }));
  let redresses = 0;
  for (let i = 1; i < murs.length; i++) {
    const p = murs[i - 1], m = murs[i];
    const cos = p.dir.x * m.dir.x + p.dir.z * m.dir.z;
    const ang = Math.acos(Math.max(-1, Math.min(1, Math.abs(cos)))) / RAD;
    if (Math.abs(ang - 90) > seuilDeg || Math.abs(ang - 90) < 1e-9) continue;
    const perp = { x: -p.dir.z, z: p.dir.x };
    const signe = (perp.x * m.dir.x + perp.z * m.dir.z) >= 0 ? 1 : -1;
    const dir = { x: perp.x * signe, z: perp.z * signe };
    const cx = (m.a.x + m.b.x) / 2, cz = (m.a.z + m.b.z) / 2, h = m.longueur / 2;
    m.dir = dir; m.n = { x: -dir.z, z: dir.x }; m.d = m.n.x * cx + m.n.z * cz;
    m.a = { x: cx - dir.x * h, z: cz - dir.z * h }; m.b = { x: cx + dir.x * h, z: cz + dir.z * h };
    redresses++;
  }
  return { murs, redresses };
}

/** Le point p est-il dans le polygone (lancer de rayon) ? */
export function pointDansPolygone(poly, p) {
  let dedans = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.z > p.z) !== (b.z > p.z) && p.x < (b.x - a.x) * (p.z - a.z) / (b.z - a.z) + a.x) dedans = !dedans;
  }
  return dedans;
}

/** Découpe un polygone CONVEXE par le demi-plan { sens · (n·p − rho) ≥ 0 } (Sutherland-Hodgman). */
function clipperDemiPlan(poly, nx, nz, rho, sens) {
  if (!poly.length) return poly;
  const out = [];
  const val = (p) => sens * (nx * p.x + nz * p.z - rho);
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i], B = poly[(i + 1) % poly.length];
    const va = val(A), vb = val(B);
    if (va >= -1e-12) out.push(A);
    if ((va > 1e-12 && vb < -1e-12) || (va < -1e-12 && vb > 1e-12)) {
      const t = va / (va - vb);
      out.push({ x: A.x + (B.x - A.x) * t, z: A.z + (B.z - A.z) * t });
    }
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
//  1. Les droites candidates
// ══════════════════════════════════════════════════════════════════════════════════════════

/** Forme canonique d'un mur : θ ∈ [0, π), ρ signé, et l'étendue observée le long de la droite. */
function canoniser(mur) {
  let th = Math.atan2(mur.dir.z, mur.dir.x);
  let dir = { x: mur.dir.x, z: mur.dir.z };
  if (th < 0) { th += Math.PI; dir = { x: -dir.x, z: -dir.z }; }
  if (th >= Math.PI) { th -= Math.PI; dir = { x: -dir.x, z: -dir.z }; }
  const n = { x: -dir.z, z: dir.x };
  const rho = n.x * mur.a.x + n.z * mur.a.z;
  const t = [ (mur.a.x * dir.x + mur.a.z * dir.z), (mur.b.x * dir.x + mur.b.z * dir.z) ];
  return { th, rho, dir, n, t0: Math.min(...t), t1: Math.max(...t) };
}

/**
 * Les droites candidates : un mur = une droite (θ, ρ), les quasi-doublons fusionnés (moyenne
 * pondérée par le support), avec l'UNION des étendues réellement observées — c'est elle qui dira
 * plus loin si une arête du contour est vue ou extrapolée.
 */
export function droitesCandidates(murs, { angleDeg = 4, ecart = 0.10 } = {}) {
  const lignes = [];
  for (const m of murs) {
    const c = canoniser(m);
    const w = Math.max(1, m.support || 1) * Math.max(0.1, m.longueur || 0.1);
    let cible = null;
    for (const l of lignes) {
      let dth = Math.abs(c.th - l.th), rho = c.rho, inverse = false;
      if (dth > Math.PI / 2) { dth = Math.PI - dth; rho = -rho; inverse = true; }
      if (dth <= angleDeg * RAD && Math.abs(rho - l.rho) <= ecart) { cible = { l, rho, inverse }; break; }
    }
    if (!cible) {
      lignes.push({ th: c.th, rho: c.rho, dir: c.dir, n: c.n, poids: w,
        segments: [{ t0: c.t0, t1: c.t1 }], support: m.support || 0, longueur: m.longueur || 0,
        confiance: m.confiance == null ? 1 : m.confiance, sources: 1 });
      continue;
    }
    const { l, rho, inverse } = cible;
    // θ ramené du côté de l avant la moyenne (sinon 179° et 1° se moyennent à 90°).
    let thD = c.th; if (Math.abs(thD - l.th) > Math.PI / 2) thD += thD < l.th ? Math.PI : -Math.PI;
    const W = l.poids + w;
    l.th = (l.th * l.poids + thD * w) / W;
    l.rho = (l.rho * l.poids + rho * w) / W;
    l.poids = W;
    if (l.th < 0) { l.th += Math.PI; l.rho = -l.rho; } if (l.th >= Math.PI) { l.th -= Math.PI; l.rho = -l.rho; }
    l.dir = { x: Math.cos(l.th), z: Math.sin(l.th) }; l.n = { x: -l.dir.z, z: l.dir.x };
    const t = inverse ? [-c.t1, -c.t0] : [c.t0, c.t1];
    l.segments.push({ t0: t[0], t1: t[1] });
    l.support += m.support || 0;
    l.longueur = Math.max(l.longueur, m.longueur || 0);
    l.confiance = Math.max(l.confiance, m.confiance == null ? 1 : m.confiance);
    l.sources++;
  }
  // Les étendues sont reprojetées sur la droite FINALE (θ a pu bouger de quelques dixièmes).
  for (const l of lignes) {
    l.segments = l.segments.map((s) => ({ t0: s.t0, t1: s.t1 })).sort((u, v) => u.t0 - v.t0);
    const f = [];
    for (const s of l.segments) {
      const d = f[f.length - 1];
      if (d && s.t0 <= d.t1 + 0.05) d.t1 = Math.max(d.t1, s.t1); else f.push({ t0: s.t0, t1: s.t1 });
    }
    l.segments = f;
    l.vu = f.reduce((a, s) => a + (s.t1 - s.t0), 0);
  }
  return lignes;
}

/** Score d'une droite : support, longueur vue, et cohérence avec la direction dominante (mod 90°). */
export function scorerDroites(lignes) {
  // Direction dominante modulo 90°, histogramme pondéré à 0,5° (comme l'expérience (b)).
  const n = 180, h = new Float64Array(n);
  for (const l of lignes) {
    const th = ((l.th / RAD) % 90 + 90) % 90;
    const w = Math.max(1, l.support) * Math.max(0.2, l.vu);
    for (let d = -2; d <= 2; d++) h[((Math.round(th * 2) + d) % n + n) % n] += w * (1 - Math.abs(d) / 3);
  }
  let im = 0; for (let i = 1; i < n; i++) if (h[i] > h[im]) im = i;
  const th0 = (im / 2) * RAD;
  for (const l of lignes) {
    const k = Math.round((l.th - th0) / (Math.PI / 2));
    const ec = Math.abs(((l.th - (th0 + k * Math.PI / 2) + Math.PI) % (2 * Math.PI)) - Math.PI) / RAD;
    l.ecartGrille = ec;
    l.score = Math.min(1, l.support / 60) * Math.min(1, l.vu / 1.2) * (ec <= 10 ? 1 : Math.max(0.3, 1 - (ec - 10) / 40));
  }
  return { th0_deg: +(th0 / RAD).toFixed(3), lignes };
}

// ══════════════════════════════════════════════════════════════════════════════════════════
//  2. L'arrangement de droites
// ══════════════════════════════════════════════════════════════════════════════════════════

/** Boîte englobante de tout ce qu'on connaît, avec une marge. */
export function boiteEnglobante({ trajectoire = [], pointsSol = [], murs = [] }, marge = 1.0) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  const ajt = (p) => { if (!p || !isFinite(p.x) || !isFinite(p.z)) return; x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); };
  trajectoire.forEach(ajt); pointsSol.forEach(ajt);
  murs.forEach((m) => { ajt(m.a); ajt(m.b); });
  if (!isFinite(x0)) return { x0: -5, z0: -5, x1: 5, z1: 5 };
  return { x0: x0 - marge, z0: z0 - marge, x1: x1 + marge, z1: z1 + marge };
}

/** Intervalle [t0, t1] de la droite (c = n·ρ, dir) à l'intérieur de la boîte (Liang-Barsky). */
function clipperDroite(l, boite) {
  const cx = l.n.x * l.rho, cz = l.n.z * l.rho;
  let t0 = -Infinity, t1 = Infinity;
  const borne = (p, d, lo, hi) => {
    if (Math.abs(d) < 1e-12) return (p >= lo && p <= hi);
    const a = (lo - p) / d, b = (hi - p) / d;
    t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b));
    return true;
  };
  if (!borne(cx, l.dir.x, boite.x0, boite.x1)) return null;
  if (!borne(cz, l.dir.z, boite.z0, boite.z1)) return null;
  if (!(t1 > t0 + 1e-6)) return null;
  return { t0, t1, c: { x: cx, z: cz } };
}

/**
 * L'ARRANGEMENT : les droites des murs (et les 4 côtés de la boîte) découpées en arêtes
 * élémentaires par leurs intersections mutuelles. Rend { sommets, aretes } ; chaque arête porte
 * sa droite d'origine, ses deux bouts, son milieu et la demi-largeur libre autour de ce milieu
 * (pour échantillonner les deux faces voisines sans sortir de l'arête).
 */
export function construireArrangement(lignes, boite) {
  // Les 4 côtés de la boîte, en droites canoniques (dir vers +, n à gauche).
  const bords = [
    { th: 0, rho: boite.z0, dir: { x: 1, z: 0 }, n: { x: 0, z: 1 }, boite: true },
    { th: 0, rho: boite.z1, dir: { x: 1, z: 0 }, n: { x: 0, z: 1 }, boite: true },
    { th: Math.PI / 2, rho: -boite.x0, dir: { x: 0, z: 1 }, n: { x: -1, z: 0 }, boite: true },
    { th: Math.PI / 2, rho: -boite.x1, dir: { x: 0, z: 1 }, n: { x: -1, z: 0 }, boite: true },
  ];
  const toutes = lignes.map((l, i) => ({ ...l, idx: i, boite: false })).concat(bords.map((b, i) => ({ ...b, idx: lignes.length + i })));
  const clips = toutes.map((l) => clipperDroite(l, { x0: boite.x0 - 1e-6, z0: boite.z0 - 1e-6, x1: boite.x1 + 1e-6, z1: boite.z1 + 1e-6 }));

  // Sommets : bouts des droites dans la boîte + intersections mutuelles, fusionnés à 1 mm.
  const sommets = [];
  const ajouter = (p) => {
    for (let i = 0; i < sommets.length; i++) if (Math.abs(sommets[i].x - p.x) < 1e-3 && Math.abs(sommets[i].z - p.z) < 1e-3) return i;
    sommets.push({ x: p.x, z: p.z }); return sommets.length - 1;
  };
  toutes.forEach((l, i) => {
    const c = clips[i]; if (!c) return;
    ajouter({ x: c.c.x + l.dir.x * c.t0, z: c.c.z + l.dir.z * c.t0 });
    ajouter({ x: c.c.x + l.dir.x * c.t1, z: c.c.z + l.dir.z * c.t1 });
  });
  for (let i = 0; i < toutes.length; i++) for (let j = i + 1; j < toutes.length; j++) {
    if (!clips[i] || !clips[j]) continue;
    const A = toutes[i], B = toutes[j];
    const den = A.dir.x * B.dir.z - A.dir.z * B.dir.x;
    if (Math.abs(den) < Math.sin(0.5 * RAD)) continue;   // quasi parallèles : pas d'intersection utile
    // n_A·p = ρ_A et n_B·p = ρ_B
    const det = A.n.x * B.n.z - A.n.z * B.n.x;
    if (Math.abs(det) < 1e-9) continue;
    const x = (A.rho * B.n.z - B.rho * A.n.z) / det;
    const z = (B.rho * A.n.x - A.rho * B.n.x) / det;
    if (x < boite.x0 - 1e-6 || x > boite.x1 + 1e-6 || z < boite.z0 - 1e-6 || z > boite.z1 + 1e-6) continue;
    ajouter({ x, z });
  }

  // Arêtes : sur chaque droite, les sommets qui lui appartiennent, triés le long de dir.
  const aretes = [];
  toutes.forEach((l, i) => {
    const c = clips[i]; if (!c) return;
    const sur = [];
    sommets.forEach((s, k) => {
      if (Math.abs(l.n.x * s.x + l.n.z * s.z - l.rho) > 2e-3) return;
      const t = (s.x - c.c.x) * l.dir.x + (s.z - c.c.z) * l.dir.z;
      if (t < c.t0 - 1e-3 || t > c.t1 + 1e-3) return;
      sur.push({ k, t });
    });
    sur.sort((u, v) => u.t - v.t);
    for (let q = 1; q < sur.length; q++) {
      const t0 = sur[q - 1].t, t1 = sur[q].t;
      if (t1 - t0 < 2e-3) continue;
      const tm = (t0 + t1) / 2;
      const mid = { x: c.c.x + l.dir.x * tm, z: c.c.z + l.dir.z * tm };
      // Dégagement : distance du milieu à toutes les AUTRES droites, pour un ε sûr.
      let libre = Infinity;
      toutes.forEach((o, j) => { if (j === i) return; libre = Math.min(libre, Math.abs(o.n.x * mid.x + o.n.z * mid.z - o.rho)); });
      aretes.push({ ligne: i, idxDroite: l.idx, boite: !!l.boite, n: l.n, dir: l.dir, rho: l.rho,
        iv0: sur[q - 1].k, iv1: sur[q].k, a: { x: c.c.x + l.dir.x * t0, z: c.c.z + l.dir.z * t0 },
        b: { x: c.c.x + l.dir.x * t1, z: c.c.z + l.dir.z * t1 }, mid, t0, t1,
        longueur: t1 - t0, eps: Math.max(1e-5, Math.min(1e-3, libre / 3)) });
    }
  });
  return { sommets, aretes, lignes: toutes.filter((l) => !l.boite) };
}

/** Signature d'un point : le côté de CHAQUE droite de mur où il se trouve (les bords de la boîte ne comptent pas). */
function signature(lignes, p) {
  let s = '';
  for (let i = 0; i < lignes.length; i++) s += (lignes[i].n.x * p.x + lignes[i].n.z * p.z - lignes[i].rho) >= 0 ? '1' : '0';
  return s;
}

/** Le polygone (convexe) de la face dont la signature est `sig`. */
function polygoneCellule(lignes, sig, boite) {
  let poly = [{ x: boite.x0, z: boite.z0 }, { x: boite.x1, z: boite.z0 }, { x: boite.x1, z: boite.z1 }, { x: boite.x0, z: boite.z1 }];
  for (let i = 0; i < lignes.length && poly.length; i++) poly = clipperDemiPlan(poly, lignes[i].n.x, lignes[i].n.z, lignes[i].rho, sig[i] === '1' ? 1 : -1);
  return poly;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
//  3. L'espace libre : la preuve qui ne vient pas de la géométrie
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Compte, pour chaque face de l'arrangement, trois preuves :
 *   `traj`     — la trajectoire de la caméra y est passée (preuve forte : on y était) ;
 *   `libre`    — des segments [caméra → point de frontière] la traversent (du sol vu, donc dedans) ;
 *   `derriere` — des échantillons pris 12 à 45 cm AU-DELÀ d'un point de frontière y tombent (derrière un mur).
 * Rend une Map signature → { traj, libre, derriere }.
 */
export function preuvesEspaceLibre(lignes, { trajectoire = [], vues = [] } = {},
  { pasTraj = 0.05, pasRayon = 0.15, margeArret = 0.12, derriereDe = 0.12, derriereA = 0.45, pasVues = 1 } = {}) {
  const M = new Map();
  const bin = (p, cle, w) => {
    const s = signature(lignes, p);
    let c = M.get(s); if (!c) { c = { traj: 0, libre: 0, derriere: 0 }; M.set(s, c); }
    c[cle] += w;
  };
  // Trajectoire : densifiée tous les 5 cm entre deux positions consécutives.
  for (let i = 0; i < trajectoire.length; i++) {
    bin(trajectoire[i], 'traj', 1);
    if (i === 0) continue;
    const a = trajectoire[i - 1], b = trajectoire[i], L = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.min(200, Math.floor(L / pasTraj));
    for (let k = 1; k < n; k++) bin({ x: a.x + (b.x - a.x) * k / n, z: a.z + (b.z - a.z) * k / n }, 'traj', 1);
  }
  // Rayons : [caméra → point], puis au-delà.
  for (let i = 0; i < vues.length; i += pasVues) {
    const v = vues[i];
    const dx = v.p.x - v.c.x, dz = v.p.z - v.c.z, L = Math.hypot(dx, dz);
    if (!(L > 0.3)) continue;
    const ux = dx / L, uz = dz / L, w = v.poids == null ? 1 : Math.max(0.05, v.poids);
    const arret = L - margeArret;
    for (let t = pasRayon; t < arret; t += pasRayon) bin({ x: v.c.x + ux * t, z: v.c.z + uz * t }, 'libre', w);
    for (let t = derriereDe; t <= derriereA; t += 0.11) bin({ x: v.p.x + ux * t, z: v.p.z + uz * t }, 'derriere', w);
  }
  return M;
}

/**
 * Étiquette chaque face « dedans » ou « dehors ».
 *   1. la preuve d'une face = son espace libre, plus `poidsTraj` par pas de trajectoire qui la
 *      traverse (la caméra y était : c'est la preuve la plus sûre, mais elle reste une preuve
 *      PONDÉRÉE — un seul pas égaré ne doit pas faire entrer une niche dans la pièce) ;
 *   2. une face est dedans si sa densité de preuve atteint une FRACTION de la densité maximale
 *      observée (seuil relatif, donc insensible au nombre de points du film) et domine la preuve
 *      « derrière » ; elle est dehors si la preuve « derrière » est dense ;
 *   3. les faces sans preuve sont tranchées par leurs voisines (propagation par arêtes partagées),
 *      ce qui rebouche les coins qu'aucun rayon n'a traversés (meuble, angle mort).
 */
export function etiqueterCellules(lignes, arr, preuves, boite,
  { seuilLibre = 2, fracMax = 0.05, seuilDerriere = 2, poidsTraj = 60, minAire = 0.25, passes = 4 } = {}) {
  // Les faces connues : celles où tombe au moins une preuve, plus les deux voisines de chaque arête.
  const faces = new Map();
  const voir = (sig) => {
    let f = faces.get(sig);
    if (!f) {
      const poly = polygoneCellule(lignes, sig, boite);
      const { aire } = poly.length >= 3 ? aireEtPerimetre(poly) : { aire: 0 };
      f = { sig, poly, aire, traj: 0, libre: 0, derriere: 0, voisins: new Map() };
      const p = preuves.get(sig);
      if (p) { f.traj = p.traj; f.libre = p.libre; f.derriere = p.derriere; }
      faces.set(sig, f);
    }
    return f;
  };
  for (const sig of preuves.keys()) voir(sig);
  // Les deux faces de chaque arête, et la longueur qu'elles partagent.
  for (const e of arr.aretes) {
    const pPlus = { x: e.mid.x + e.n.x * e.eps, z: e.mid.z + e.n.z * e.eps };
    const pMoins = { x: e.mid.x - e.n.x * e.eps, z: e.mid.z - e.n.z * e.eps };
    e.sigPlus = signature(lignes, pPlus); e.sigMoins = signature(lignes, pMoins);
    const A = voir(e.sigPlus), B = voir(e.sigMoins);
    if (e.sigPlus === e.sigMoins) continue;          // arête d'un bord de boîte : même face des deux côtés
    A.voisins.set(e.sigMoins, (A.voisins.get(e.sigMoins) || 0) + e.longueur);
    B.voisins.set(e.sigPlus, (B.voisins.get(e.sigPlus) || 0) + e.longueur);
  }
  // 1-2. étiquetage direct, sur un seuil RELATIF à la densité de preuve la plus forte.
  let dMax = 0;
  for (const f of faces.values()) {
    f.preuve = f.libre + poidsTraj * f.traj;
    f.densite = f.aire > 1e-6 ? f.preuve / f.aire : 0;
    if (f.aire >= minAire) dMax = Math.max(dMax, f.densite);
  }
  const seuil = Math.max(seuilLibre, fracMax * dMax);
  for (const f of faces.values()) {
    if (f.aire < 1e-6) { f.etiq = 'dehors'; continue; }
    const dDerriere = f.derriere / f.aire;
    if (f.densite >= seuil && f.preuve > 1.5 * f.derriere) f.etiq = 'dedans';
    else if (dDerriere >= seuilDerriere) f.etiq = 'dehors';
    else f.etiq = null;
  }
  faces.seuil = seuil; faces.densiteMax = dMax;
  // 3. propagation : une face SANS preuve reste dehors. La règle est volontairement asymétrique —
  //    une face ne devient jamais « dedans » sans preuve d'espace libre, sinon la pièce fuit
  //    dans tout l'espace que la caméra n'a pas vu (mesuré le 04/10 sur ai_002_009 : une face de
  //    6,95 m² sans aucune preuve était entrée dans la pièce par simple voisinage).
  //    Seule exception : une face ENCLAVÉE, dont tout le pourtour touche des faces « dedans ».
  for (let k = 0; k < passes; k++) {
    let bouge = 0;
    for (const f of faces.values()) {
      if (f.etiq) continue;
      let total = 0, dedans = 0;
      for (const [sig, L] of f.voisins) { total += L; const o = faces.get(sig); if (o && o.etiq === 'dedans') dedans += L; }
      if (total > 0 && dedans / total > 0.95 && f.derriere < 1) { f.etiq = 'dedans'; bouge++; }
    }
    if (!bouge) break;
  }
  for (const f of faces.values()) if (!f.etiq) f.etiq = 'dehors';
  return faces;
}

/**
 * La pièce n'est pas « toutes les faces dedans » mais la COMPOSANTE CONNEXE de faces dedans que la
 * caméra a traversée — c'est la version non convexe du « cycle minimal entourant la trajectoire ».
 * Les îlots d'espace libre vus à travers une porte restent dehors. Rend le nombre de composantes.
 */
export function garderComposanteDeLaCamera(faces) {
  const dedans = [...faces.values()].filter((f) => f.etiq === 'dedans');
  const vus = new Set(), comps = [];
  for (const f of dedans) {
    if (vus.has(f.sig)) continue;
    const pile = [f], comp = []; vus.add(f.sig);
    while (pile.length) {
      const c = pile.pop(); comp.push(c);
      for (const sig of c.voisins.keys()) {
        const o = faces.get(sig);
        if (!o || o.etiq !== 'dedans' || vus.has(sig)) continue;
        vus.add(sig); pile.push(o);
      }
    }
    comps.push(comp);
  }
  if (comps.length <= 1) return { composantes: comps.length, comp: comps[0] || [] };
  const score = (c) => [c.reduce((a, f) => a + f.traj, 0), c.reduce((a, f) => a + f.aire, 0)];
  comps.sort((u, v) => { const a = score(u), b = score(v); return b[0] - a[0] || b[1] - a[1]; });
  for (let i = 1; i < comps.length; i++) for (const f of comps[i]) f.etiq = 'dehors';
  return { composantes: comps.length, comp: comps[0],
    ecartees: comps.slice(1).map((c) => +c.reduce((a, f) => a + f.aire, 0).toFixed(2)) };
}

// ══════════════════════════════════════════════════════════════════════════════════════════
//  4. Le contour de l'union des faces « dedans »
// ══════════════════════════════════════════════════════════════════════════════════════════

/** Les arêtes du contour, orientées pour que le DEDANS soit à gauche, puis chaînées en boucles. */
export function extraireContour(arr, faces) {
  const orientees = [];
  for (const e of arr.aretes) {
    const A = faces.get(e.sigPlus), B = faces.get(e.sigMoins);
    const dPlus = A && A.etiq === 'dedans', dMoins = B && B.etiq === 'dedans';
    if (e.sigPlus === e.sigMoins) {
      // Arête sur un bord de la boîte : frontière si la face qui la borde est dedans.
      if (!dPlus) continue;
      // L'orientation (le dedans à gauche) est décidée plus bas, au moment du chaînage : la face
      // voisine n'existe que d'un côté, on regarde donc laquelle des deux moitiés la contient.
      orientees.push({ ...e, sens: 1, bordBoite: true });
      continue;
    }
    if (dPlus === dMoins) continue;
    orientees.push({ ...e, sens: dPlus ? 1 : -1, bordBoite: false });
  }
  // Les arêtes de bord de boîte doivent être orientées à part : on le fait au moment du chaînage,
  // en choisissant le sens qui garde la face « dedans » à gauche.
  const seg = orientees.map((e) => {
    let A = e.a, B = e.b;
    if (e.bordBoite) {
      // dedans est du côté `n` ou `-n` ? la face voisine n'existe que d'un côté : on regarde
      // laquelle des deux moitiés contient la face `dedans` en testant un point décalé.
      const f = faces.get(e.sigPlus);
      const pIn = { x: e.mid.x + e.n.x * e.eps, z: e.mid.z + e.n.z * e.eps };
      const dedansCoteN = f && f.poly.length >= 3 && pointDansPolygone(f.poly, pIn);
      if (!dedansCoteN) { A = e.b; B = e.a; }
    } else if (e.sens < 0) { A = e.b; B = e.a; }
    return { a: A, b: B, arete: e };
  });
  // Chaînage : au bout d'une arête, l'arête sortante la plus « à droite » (on longe l'intérieur).
  const cle = (p) => Math.round(p.x * 1e4) + ',' + Math.round(p.z * 1e4);
  const parDebut = new Map();
  seg.forEach((s, i) => { const k = cle(s.a); if (!parDebut.has(k)) parDebut.set(k, []); parDebut.get(k).push(i); });
  const pris = new Array(seg.length).fill(false);
  const boucles = [];
  for (let i0 = 0; i0 < seg.length; i0++) {
    if (pris[i0]) continue;
    const boucle = []; let i = i0;
    for (let garde = 0; garde < seg.length + 2; garde++) {
      if (pris[i]) break;
      pris[i] = true; boucle.push(seg[i]);
      const cands = (parDebut.get(cle(seg[i].b)) || []).filter((j) => !pris[j]);
      if (!cands.length) break;
      if (cle(seg[i].b) === cle(seg[i0].a)) { boucle.ferme = true; break; }
      const u = { x: seg[i].b.x - seg[i].a.x, z: seg[i].b.z - seg[i].a.z };
      const Lu = Math.hypot(u.x, u.z) || 1; u.x /= Lu; u.z /= Lu;
      let best = cands[0], bestAng = -Infinity;
      for (const j of cands) {
        const v = { x: seg[j].b.x - seg[j].a.x, z: seg[j].b.z - seg[j].a.z };
        const Lv = Math.hypot(v.x, v.z) || 1;
        const cos = (u.x * v.x + u.z * v.z) / Lv, sin = (u.x * v.z - u.z * v.x) / Lv;
        // « le plus à droite » = angle signé le plus petit (sin < 0 = virage à droite dans (x, z)).
        const ang = -Math.atan2(sin, cos);
        if (ang > bestAng) { bestAng = ang; best = j; }
      }
      i = best;
    }
    if (boucle.length >= 3) {
      const der = boucle[boucle.length - 1];
      boucle.ferme = cle(der.b) === cle(boucle[0].a);
      boucles.push(boucle);
    }
  }
  return boucles;
}

/** Fusionne les arêtes consécutives portées par la MÊME droite, puis supprime les côtés < `minCote`. */
export function simplifierContour(boucle, { minCote = 0.06 } = {}) {
  if (!boucle.length) return { sommets: [], cotes: [] };
  // 1. fusion des arêtes colinéaires (même droite d'origine).
  const cotes = [];
  for (const s of boucle) {
    const d = cotes[cotes.length - 1];
    if (d && d.idxDroite === s.arete.idxDroite) { d.b = s.b; continue; }
    cotes.push({ a: s.a, b: s.b, idxDroite: s.arete.idxDroite, boite: s.arete.boite, n: s.arete.n, rho: s.arete.rho, dir: s.arete.dir });
  }
  if (cotes.length > 1 && cotes[0].idxDroite === cotes[cotes.length - 1].idxDroite) {
    cotes[0].a = cotes[cotes.length - 1].a; cotes.pop();
  }
  // 2. petits côtés : on les absorbe (le sommet suivant remonte sur l'intersection des voisins).
  let change = true;
  while (change && cotes.length > 3) {
    change = false;
    for (let i = 0; i < cotes.length; i++) {
      const c = cotes[i];
      if (Math.hypot(c.b.x - c.a.x, c.b.z - c.a.z) >= minCote) continue;
      const p = cotes[(i - 1 + cotes.length) % cotes.length], q = cotes[(i + 1) % cotes.length];
      const X = intersectionMurs({ a: p.a, b: p.b }, { a: q.a, b: q.b });
      if (!X) continue;
      p.b = { x: X.x, z: X.z }; q.a = { x: X.x, z: X.z };
      cotes.splice(i, 1); change = true; break;
    }
  }
  return { sommets: cotes.map((c) => c.a), cotes };
}

// ══════════════════════════════════════════════════════════════════════════════════════════
//  5. Les cinq assembleurs
// ══════════════════════════════════════════════════════════════════════════════════════════

const VIDE = (msg) => ({ statut: 'echec', message: msg, angles: [], murs: [], surface_sol: 0,
  perimetre: 0, avertissements: [msg], methode: null, diagnostic: {} });

/**
 * (ii) LE CHAÎNAGE — la référence. Copie fidèle du bloc d'assemblage de
 * `metre-murs.js::analyserPointsSol` (version du 04/10/2026) : chaînage bout à bout, redressement
 * local, retours courts déduits entre deux murs parallèles, angles par intersections consécutives,
 * longueurs recalculées entre angles. Rien n'y change : c'est le chiffre à battre.
 */
export function assemblerParChainage(mursEntree, { redressement = 'local' } = {}) {
  const avert = [];
  if (mursEntree.length < 3) return { ...VIDE(`${mursEntree.length} mur(s) trouvé(s), il en faut 3.`), methode: 'chainage' };
  let murs = ordonnerMurs(mursEntree);
  const r = redressement === 'aucun' ? { murs, redresses: 0 } : redresserAnglesDroits(murs);
  murs = r.murs;
  const deduits = [];
  for (let i = 0; i < murs.length; i++) {
    const m = murs[i], o = murs[(i + 1) % murs.length];
    if (intersectionMurs(m, o)) continue;
    const ecart = Math.abs(m.n.x * o.a.x + m.n.z * o.a.z - m.d);
    if (ecart < 0.05 || ecart > 0.8) continue;
    const signe = (m.n.x * o.a.x + m.n.z * o.a.z - m.d) >= 0 ? 1 : -1;
    const a = { x: m.b.x, z: m.b.z }, b = { x: m.b.x + m.n.x * signe * ecart, z: m.b.z + m.n.z * signe * ecart };
    const dir = { x: m.n.x * signe, z: m.n.z * signe };
    deduits.push({ apres: i, mur: { a, b, dir, n: { x: -dir.z, z: dir.x }, d: 0, support: 0, longueur: ecart, confiance: 0.5, trouve: 'deduit' } });
  }
  for (let k = deduits.length - 1; k >= 0; k--) { const d = deduits[k]; d.mur.d = d.mur.n.x * d.mur.a.x + d.mur.n.z * d.mur.a.z; murs.splice(d.apres + 1, 0, d.mur); }
  if (deduits.length) avert.push(`${deduits.length} retour(s) de ${deduits.map((d) => Math.round(d.mur.longueur * 100) + ' cm').join(', ')} déduit(s) entre deux murs parallèles : vérifiez-le(s).`);
  const angles = [], manques = [];
  for (let i = 0; i < murs.length; i++) {
    const p = intersectionMurs(murs[i], murs[(i + 1) % murs.length]);
    if (!p) { manques.push(i); continue; }
    const loin = Math.min(Math.hypot(p.x - murs[i].b.x, p.z - murs[i].b.z), Math.hypot(p.x - murs[(i + 1) % murs.length].a.x, p.z - murs[(i + 1) % murs.length].a.z)) > 2.5;
    angles.push({ x: p.x, z: p.z, confiance: loin ? 0.3 : Math.min(murs[i].confiance, murs[(i + 1) % murs.length].confiance) });
  }
  let statut = 'ok';
  if (!manques.length && angles.length === murs.length && murs.length >= 3) {
    for (let i = 0; i < murs.length; i++) {
      const a = angles[(i - 1 + murs.length) % murs.length], b = angles[i];
      murs[i] = Object.assign({}, murs[i], { a: { x: a.x, z: a.z }, b: { x: b.x, z: b.z }, longueur: Math.hypot(b.x - a.x, b.z - a.z) });
    }
  }
  if (manques.length) { statut = 'partiel'; avert.push(`${manques.length} angle(s) introuvable(s) : deux murs consécutifs sont parallèles, il manque sans doute un mur entre eux.`); }
  if (angles.some((a) => a.confiance < 0.5)) { if (statut === 'ok') statut = 'partiel'; avert.push('Un angle est déduit loin des murs filmés : vérifiez-le.'); }
  const { aire, perimetre } = angles.length >= 3 ? aireEtPerimetre(angles) : { aire: 0, perimetre: 0 };
  return { statut, message: statut === 'ok' ? 'Pièce reconstituée.' : 'Pièce partiellement reconstituée.',
    surface_sol: +aire.toFixed(2), perimetre: +perimetre.toFixed(2), angles,
    murs: murs.map((m) => ({ a: m.a, b: m.b, longueur: +m.longueur.toFixed(2), confiance: +m.confiance.toFixed(2), trouve: m.trouve || 'image' })),
    anglesRedresses: r.redresses, deduits: deduits.length, avertissements: avert, methode: 'chainage',
    fiabilite: statut === 'ok' && !deduits.length && angles.every((a) => a.confiance >= 0.5) ? 'bonne' : 'douteuse',
    diagnostic: { murs_entree: mursEntree.length, manques: manques.length } };
}

/**
 * (i-a) LA CELLULE CONVEXE : l'intersection des demi-plans qui contiennent la trajectoire.
 * C'est la face de l'arrangement où était la caméra, dans sa version la plus simple. Juste sur une
 * pièce convexe, FAUSSE sur une pièce en L (elle coupe le retour) — c'est le prix de la simplicité,
 * et on le mesure.
 */
export function assemblerParCelluleConvexe(mursEntree, contexte, { redressement = 'local' } = {}) {
  const prep = preparerLignes(mursEntree, { redressement });
  if (!prep) return { ...VIDE('Moins de 3 murs.'), methode: 'cellule_convexe' };
  const { lignes } = prep;
  const traj = contexte.trajectoire || [];
  if (!traj.length) return { ...VIDE('Pas de trajectoire : la cellule de la caméra est indéfinie.'), methode: 'cellule_convexe' };
  const boite = boiteEnglobante({ ...contexte, murs: mursEntree });
  let poly = [{ x: boite.x0, z: boite.z0 }, { x: boite.x1, z: boite.z0 }, { x: boite.x1, z: boite.z1 }, { x: boite.x0, z: boite.z1 }];
  for (const l of lignes) {
    let plus = 0;
    for (const p of traj) if (l.n.x * p.x + l.n.z * p.z - l.rho >= 0) plus++;
    poly = clipperDemiPlan(poly, l.n.x, l.n.z, l.rho, plus >= traj.length / 2 ? 1 : -1);
  }
  if (poly.length < 3) return { ...VIDE('Cellule vide.'), methode: 'cellule_convexe' };
  return finaliser(poly.map((p, i) => ({ a: p, b: poly[(i + 1) % poly.length], idxDroite: trouverDroite(lignes, p, poly[(i + 1) % poly.length]), boite: false })),
    lignes, contexte, { methode: 'cellule_convexe', boite });
}

function trouverDroite(lignes, a, b) {
  let best = -1, bd = Infinity;
  for (let i = 0; i < lignes.length; i++) {
    const d = (Math.abs(lignes[i].n.x * a.x + lignes[i].n.z * a.z - lignes[i].rho) + Math.abs(lignes[i].n.x * b.x + lignes[i].n.z * b.z - lignes[i].rho)) / 2;
    if (d < bd) { bd = d; best = i; }
  }
  return bd < 0.02 ? best : -1;
}

/** Les droites candidates, après le redressement local (étage 6, validé) appliqué à la chaîne. */
function preparerLignes(mursEntree, { redressement = 'local', fusionEcart = 0.10, fusionAngle = 4 } = {}) {
  if (mursEntree.length < 2) return null;
  let murs = ordonnerMurs(mursEntree);
  if (redressement !== 'aucun') murs = redresserAnglesDroits(murs).murs;
  const lignes = droitesCandidates(murs, { ecart: fusionEcart, angleDeg: fusionAngle });
  if (lignes.length < 3) return null;
  return { lignes, murs };
}

/**
 * L'ESPACE découpé et étiqueté : droites candidates → arrangement → preuves → faces.
 * C'est la brique commune de l'arrangement et du contrôle du chaînage.
 */
export function analyserEspace(mursEntree, contexte, options = {}) {
  const prep = preparerLignes(mursEntree, options);
  if (!prep) return null;
  let { lignes } = prep;
  if (options.scoreMin != null) {
    scorerDroites(lignes);
    const gardees = lignes.filter((l) => l.score >= options.scoreMin);
    if (gardees.length >= 3) lignes = gardees;
  }
  if (lignes.length > (options.maxDroites || 18)) {
    scorerDroites(lignes);
    lignes = lignes.slice().sort((u, v) => v.score - u.score).slice(0, options.maxDroites || 18);
  }
  // La marge de la boîte est un A PRIORI FORT et mesuré : le pied des murs a été vu tout autour,
  // donc la pièce ne peut pas s'étendre bien au-delà des points observés. 25 cm, pas un mètre.
  const boite = boiteEnglobante({ ...contexte, murs: mursEntree }, options.marge == null ? 0.25 : options.marge);
  const arr = construireArrangement(lignes, boite);
  const preuves = preuvesEspaceLibre(lignes, contexte, options);
  const faces = etiqueterCellules(lignes, arr, preuves, boite, options);
  const cc = garderComposanteDeLaCamera(faces);
  const dedans = [...faces.values()].filter((f) => f.etiq === 'dedans');
  return { lignes, boite, arr, preuves, faces, dedans, composantes: cc.composantes,
    ecartees: cc.ecartees || [], aireDedans: dedans.reduce((a, f) => a + f.aire, 0) };
}

/**
 * (i) L'ARRANGEMENT DE DROITES + ÉTIQUETAGE PAR L'ESPACE LIBRE. Le cœur de l'expérience (g).
 */
export function assemblerParArrangement(mursEntree, contexte, options = {}) {
  const esp = analyserEspace(mursEntree, contexte, options);
  if (!esp) return { ...VIDE(`${mursEntree.length} mur(s) : il en faut 3.`), methode: 'arrangement' };
  const { lignes, boite, arr, faces, dedans } = esp;
  if (!dedans.length) return { ...VIDE('Aucune face « dedans » : pas de preuve d\'espace libre.'), methode: 'arrangement' };
  const boucles = extraireContour(arr, faces);
  if (!boucles.length) return { ...VIDE('Contour introuvable.'), methode: 'arrangement',
    diagnostic: { faces: faces.size, dedans: dedans.length } };
  // La boucle utile = celle qui ENTOURE LA TRAJECTOIRE (à défaut, la plus grande) ; les autres
  // sont les trous de la composante ou du bruit.
  const traj = contexte.trajectoire || [];
  const evaluees = boucles.map((b) => {
    const s = simplifierContour(b, options);
    const aire = s.sommets.length >= 3 ? aireEtPerimetre(s.sommets).aire : 0;
    const dedansTraj = s.sommets.length >= 3 ? traj.filter((p) => pointDansPolygone(s.sommets, p)).length : 0;
    return { b, s, aire, dedansTraj };
  }).sort((u, v) => (v.dedansTraj - u.dedansTraj) || (v.aire - u.aire));
  const gagnante = evaluees[0];
  if (gagnante.s.sommets.length < 3) return { ...VIDE('Contour dégénéré.'), methode: 'arrangement' };
  return finaliser(gagnante.s.cotes, lignes, contexte, {
    methode: 'arrangement', boite,
    diagnostic: { droites: lignes.length, faces: faces.size, dedans: dedans.length,
      aire_dedans: +esp.aireDedans.toFixed(2), composantes: esp.composantes, ecartees: esp.ecartees,
      boucles: boucles.length, autres_boucles: evaluees.slice(1).map((e) => +e.aire.toFixed(2)) },
  });
}

/**
 * (iii) LE CHAÎNAGE AVEC CONTRÔLE PAR L'ESPACE LIBRE. On garde le chaînage — il est bon quand il
 * marche — mais on le REFUSE quand son polygone contredit l'espace libre. Quatre contrôles :
 *   1. le polygone contient toute la trajectoire de la caméra ;
 *   2. il contient (à 12 cm près) au moins 85 % des points de sol observés ;
 *   3. sa surface ne s'écarte pas de plus de `tolAire` de l'aire des faces « dedans » ;
 *   4. le chaînage n'a pas laissé d'angle ouvert (`statut` déjà partiel).
 * Quand un contrôle tombe, on bascule sur l'arrangement — et on dit lequel est tombé.
 */
export function assemblerParChainageControle(mursEntree, contexte, options = {}) {
  const ch = assemblerParChainage(mursEntree, options);
  const tolAire = options.tolAire == null ? 0.15 : options.tolAire;
  const motifs = [];
  const esp = analyserEspace(mursEntree, contexte, options);
  if (ch.statut === 'echec' || ch.angles.length < 3) motifs.push('chaînage en échec');
  else {
    const traj = contexte.trajectoire || [];
    const dehors = traj.filter((p) => !pointDansPolygone(ch.angles, p)).length;
    if (traj.length && dehors / traj.length > 0.02) motifs.push(`${dehors}/${traj.length} positions de la caméra hors du polygone`);
    const pts = (contexte.pointsSol || []);
    if (pts.length) {
      const pas = Math.max(1, Math.floor(pts.length / 2000));
      let dedans = 0, total = 0;
      for (let i = 0; i < pts.length; i += pas) { total++; if (pointDansPolygone(ch.angles, pts[i]) || distanceAuContour(ch.angles, pts[i]) < 0.12) dedans++; }
      if (total && dedans / total < 0.85) motifs.push(`${Math.round(100 * dedans / total)} % des points de sol dans le polygone (< 85 %)`);
    }
    if (esp && esp.aireDedans > 0.5) {
      const ec = (ch.surface_sol - esp.aireDedans) / esp.aireDedans;
      if (Math.abs(ec) > tolAire) motifs.push(`surface ${ch.surface_sol} m² contre ${esp.aireDedans.toFixed(2)} m² d'espace libre (${(100 * ec).toFixed(0)} %)`);
    }
    // Le `statut: 'partiel'` du chaînage n'est PAS un motif de repli : il se déclenche presque
    // toujours (un angle introuvable, un angle peu sûr) et le repli devenait systématique, ce qui
    // réduisait cette variante à l'arrangement. Le repli doit venir d'une CONTRADICTION mesurée.
    if (ch.angles.length < 3) motifs.push('moins de 3 angles');
  }
  if (!motifs.length) return { ...ch, methode: 'chainage_controle', diagnostic: { ...ch.diagnostic, controle: 'passé', aire_libre: esp ? +esp.aireDedans.toFixed(2) : null } };
  const ar = assemblerParArrangement(mursEntree, contexte, options);
  if (ar.statut === 'echec') return { ...ch, methode: 'chainage_controle', statut: ch.statut === 'ok' ? 'partiel' : ch.statut,
    avertissements: [...ch.avertissements, 'Le polygone contredit l\'espace libre : ' + motifs.join(' ; ')],
    diagnostic: { ...ch.diagnostic, controle: 'échoué', motifs, repli: 'impossible' } };
  return { ...ar, methode: 'chainage_controle', diagnostic: { ...ar.diagnostic, controle: 'échoué', motifs, repli: 'arrangement' } };
}

/** Distance d'un point au contour d'un polygone. */
function distanceAuContour(poly, p) {
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ux = b.x - a.x, uz = b.z - a.z, L2 = ux * ux + uz * uz;
    let t = L2 > 1e-12 ? ((p.x - a.x) * ux + (p.z - a.z) * uz) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    d = Math.min(d, Math.hypot(p.x - (a.x + ux * t), p.z - (a.z + uz * t)));
  }
  return d;
}

// ══════════════════════════════════════════════════════════════════════════════════════════
//  6. Mise en forme commune : murs, angles, statut, avertissements
// ══════════════════════════════════════════════════════════════════════════════════════════

/** Part de la longueur du côté réellement VUE (couverte par les étendues observées de sa droite). */
function appui(cote, lignes) {
  const l = lignes[cote.idxDroite]; if (!l || !l.segments) return null;
  const t = (p) => p.x * l.dir.x + p.z * l.dir.z;
  const [u0, u1] = [t(cote.a), t(cote.b)].sort((a, b) => a - b);
  const L = u1 - u0; if (L < 1e-6) return 0;
  let vu = 0;
  for (const s of l.segments) vu += Math.max(0, Math.min(u1, s.t1) - Math.max(u0, s.t0));
  return Math.min(1, vu / L);
}

/**
 * Le résultat au format de l'appli, avec l'honnêteté de l'étage 7 : un côté posé sur le bord de la
 * boîte est un MUR MANQUANT (on le dit, on ne l'invente pas) ; un côté sans aucun appui est un
 * retour DÉDUIT (confiance basse) ; un polygone qui ne contient pas la trajectoire est refusé.
 */
function finaliser(cotes, lignes, contexte, { methode, boite, diagnostic = {} }) {
  const avert = [];
  const sommets = cotes.map((c) => c.a);
  if (sommets.length < 3) return { ...VIDE('Moins de 3 angles.'), methode };
  // Orientation trigonométrique, pour que les angles soient listés dans un ordre stable.
  if (aireSignee(sommets) < 0) { cotes = cotes.slice().reverse().map((c) => ({ ...c, a: c.b, b: c.a })); }
  const murs = [], angles = [];
  let manquants = 0, deduits = 0;
  for (let i = 0; i < cotes.length; i++) {
    const c = cotes[i], l = lignes[c.idxDroite];
    const L = Math.hypot(c.b.x - c.a.x, c.b.z - c.a.z);
    const ap = c.boite || c.idxDroite < 0 ? 0 : appui(c, lignes);
    let trouve = 'image', conf = l ? (l.confiance == null ? 1 : l.confiance) : 0.3;
    if (c.boite || c.idxDroite < 0) { trouve = 'manquant'; conf = 0; manquants++; }
    else if (ap < 0.05) { trouve = 'deduit'; conf = Math.min(conf, 0.5); deduits++; }
    else if (ap < 0.4) conf = Math.min(conf, 0.6);
    murs.push({ a: c.a, b: c.b, longueur: +L.toFixed(2), confiance: +conf.toFixed(2), trouve,
      appui: ap == null ? null : +ap.toFixed(2), droite: c.idxDroite });
    angles.push({ x: c.a.x, z: c.a.z, confiance: +conf.toFixed(2) });
  }
  const { aire, perimetre } = aireEtPerimetre(sommets);
  let statut = 'ok';
  if (manquants) { statut = 'partiel'; avert.push(`${manquants} côté(s) sans mur détecté : il manque un mur, le plan est ouvert de ce côté.`); }
  const grands = murs.filter((m) => m.trouve === 'deduit' && m.longueur > 0.8);
  if (grands.length) { statut = 'partiel'; avert.push(`${grands.length} mur(s) de ${grands.map((m) => m.longueur.toFixed(2) + ' m').join(', ')} entièrement déduit(s) : vérifiez-le(s).`); }
  else if (deduits) avert.push(`${deduits} retour(s) court(s) déduit(s) de l'intersection de deux murs : vérifiez-le(s).`);
  const traj = contexte.trajectoire || [];
  const dehors = traj.filter((p) => !pointDansPolygone(sommets, p)).length;
  if (traj.length && dehors / traj.length > 0.02) { statut = 'partiel'; avert.push(`${dehors} position(s) de la caméra tombent hors du plan : le polygone est douteux.`); }
  if (!(aire > 0.5 && aire < 400)) { statut = 'echec'; avert.push(`Surface invraisemblable (${aire.toFixed(2)} m²).`); }
  return { statut, message: statut === 'ok' ? 'Pièce reconstituée.' : 'Pièce partiellement reconstituée.',
    surface_sol: +aire.toFixed(2), perimetre: +perimetre.toFixed(2), angles, murs,
    avertissements: avert, methode,
    fiabilite: statut === 'ok' && !deduits ? 'bonne' : 'douteuse',
    diagnostic: { ...diagnostic, cotes: cotes.length, manquants, deduits, trajectoire_dehors: dehors,
      boite: boite ? { x: +(boite.x1 - boite.x0).toFixed(2), z: +(boite.z1 - boite.z0).toFixed(2) } : null } };
}

// ══════════════════════════════════════════════════════════════════════════════════════════
//  7. Entrée unique
// ══════════════════════════════════════════════════════════════════════════════════════════

export const METHODES = ['chainage', 'cellule_convexe', 'arrangement', 'chainage_controle', 'score_cellule'];

/**
 * ASSEMBLE le polygone de la pièce à partir des droites de murs candidates.
 *
 * @param murs      liste au format `metre-murs.js` : { a, b, dir, n, d, longueur, support, confiance }
 * @param contexte  { trajectoire:[{x,z}], vues:[{c:{x,z}, p:{x,z}, poids}], pointsSol:[{x,z}] }
 *                  `vues` = pour chaque point de frontière, d'où il a été vu (c'est l'espace libre).
 * @param options   { methode, redressement, seuilLibre, seuilDerriere, scoreMin, ... }
 * @returns         { statut, surface_sol, perimetre, angles, murs, avertissements, methode, diagnostic }
 */
export function assembler(murs, contexte = {}, options = {}) {
  const methode = options.methode || 'arrangement';
  if (!murs || murs.length < 3) return { ...VIDE(`${(murs || []).length} mur(s) trouvé(s), il en faut 3 : filmez le pied de chaque mur.`), methode };
  switch (methode) {
    case 'chainage': return assemblerParChainage(murs, options);
    case 'cellule_convexe': return assemblerParCelluleConvexe(murs, contexte, options);
    case 'chainage_controle': return assemblerParChainageControle(murs, contexte, options);
    case 'score_cellule': return assemblerParArrangement(murs, contexte, { scoreMin: 0.12, ...options });
    case 'arrangement':
    default: return assemblerParArrangement(murs, contexte, options);
  }
}

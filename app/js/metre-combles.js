// Combles (03/10/2026, Moctar : « les combles, en partie on devrait pouvoir
// calculer en fonction de l'arête de la hauteur des murs »). Dans des combles,
// la frontière mur/plafond d'un PIGNON n'est pas horizontale : c'est la coupe du
// toit dessinée sur le mur. Projetée sur le plan du pignon, elle donne un profil
// (u = abscisse le long du pignon, h = hauteur au-dessus du plancher) : jambettes,
// pentes, faîtage, cassures (mansarde), plafond plat. Tout type de combles se lit
// dans ce profil en comptant ses segments. On en tire la surface habitable
// (hauteur ≥ 1,80 m), les rampants, les jambettes, les pignons.
// Calculs purs, mètres. S'appuie sur le RANSAC de droites de metre-murs.js.
import { trouverMurs, fusionnerMurs } from './metre-murs.js';

export const HAUTEUR_HABITABLE = 1.80;

/**
 * Profil du toit depuis des points (u, h) lus sur un pignon. Rend
 * { segments: [{u0,h0,u1,h1,pente_deg,type}], sommets:[{u,h}], uMin, uMax } ou null
 * si moins de 2 segments exploitables. `type` : 'rampant' (pente ≥ 8°) ou 'plat'.
 */
export function profilDepuisPoints(points, { tolerance = 0.035, longueurMin = 0.3 } = {}) {
  if (points.length < 20) return null;
  // Les droites dans le plan (u, h) : on réutilise le chercheur de murs avec x = u, z = h.
  const pts = points.map((p) => ({ x: p.u, z: p.h, poids: p.poids || 1 }));
  let droites = fusionnerMurs(trouverMurs(pts, { tolerance, longueurMin, supportMin: 8, maxMurs: 8 }), { angleDeg: 3, ecart: 0.05 });
  if (droites.length < 1) return null;
  // Ordonner le long de u (par le milieu de chaque tronçon), orienter a → b dans le sens des u croissants.
  droites = droites.map((d) => (d.a.x <= d.b.x ? d : { ...d, a: d.b, b: d.a })).sort((p, q) => (p.a.x + p.b.x) - (q.a.x + q.b.x));
  // Sommets : intersection de deux droites consécutives ; si quasi parallèles, le milieu du trou.
  const sommets = [{ u: droites[0].a.x, h: droites[0].a.z }];
  for (let i = 0; i + 1 < droites.length; i++) {
    const p = droites[i], q = droites[i + 1];
    const s = intersection2D(p.a, p.b, q.a, q.b);
    if (s && s.x >= p.a.x - 0.3 && s.x <= q.b.x + 0.3) sommets.push({ u: s.x, h: s.z });
    else sommets.push({ u: (p.b.x + q.a.x) / 2, h: (p.b.z + q.a.z) / 2 });
  }
  const der = droites[droites.length - 1];
  sommets.push({ u: der.b.x, h: der.b.z });
  const segments = [];
  for (let i = 0; i + 1 < sommets.length; i++) {
    const a = sommets[i], b = sommets[i + 1];
    if (b.u - a.u < 0.05) continue;
    const pente = Math.atan2(b.h - a.h, b.u - a.u) * 180 / Math.PI;
    segments.push({ u0: a.u, h0: a.h, u1: b.u, h1: b.h, pente_deg: +pente.toFixed(1), type: Math.abs(pente) < 8 ? 'plat' : 'rampant' });
  }
  if (!segments.length) return null;
  return { segments, sommets, uMin: segments[0].u0, uMax: segments[segments.length - 1].u1 };
}

function intersection2D(a, b, c, d) {
  const ux = b.x - a.x, uz = b.z - a.z, vx = d.x - c.x, vz = d.z - c.z;
  const den = ux * vz - uz * vx; if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * vz - (c.z - a.z) * vx) / den;
  return { x: a.x + ux * t, z: a.z + uz * t };
}

/** Hauteur du profil à l'abscisse u (prolongée à plat hors des bornes). */
export function hauteurProfil(profil, u) {
  const s = profil.segments;
  if (u <= s[0].u0) return s[0].h0;
  for (const g of s) if (u <= g.u1) return g.h0 + (g.h1 - g.h0) * ((u - g.u0) / (g.u1 - g.u0));
  return s[s.length - 1].h1;
}

/**
 * Lecture du profil : type de combles, jambettes, pentes, faîtage.
 * Types : 'monopente', 'deux-pans', 'deux-pans-dissymetriques', 'mansarde', 'plafond-plat', 'inconnu'.
 */
export function lireProfil(profil) {
  const s = profil.segments;
  const rampants = s.filter((g) => g.type === 'rampant'), plats = s.filter((g) => g.type === 'plat');
  const montants = rampants.filter((g) => g.pente_deg > 0), descendants = rampants.filter((g) => g.pente_deg < 0);
  const sommet = profil.sommets.reduce((m, p) => (p.h > m.h ? p : m), profil.sommets[0]);
  const jambettes = { gauche: +Math.max(0, s[0].h0).toFixed(2), droite: +Math.max(0, s[s.length - 1].h1).toFixed(2) };
  let type = 'inconnu';
  if (rampants.length === 1) type = 'monopente';
  else if (montants.length >= 2 || descendants.length >= 2) type = 'mansarde';
  else if (montants.length === 1 && descendants.length === 1) {
    type = Math.abs(Math.abs(montants[0].pente_deg) - Math.abs(descendants[0].pente_deg)) <= 3 ? 'deux-pans' : 'deux-pans-dissymetriques';
    if (plats.some((g) => g.h0 > 1.5)) type = 'plafond-plat';
  }
  return {
    type, jambettes,
    pentes_deg: rampants.map((g) => +Math.abs(g.pente_deg).toFixed(1)),
    faitage: { hauteur: +sommet.h.toFixed(2), u: +sommet.u.toFixed(2) },
    plafond_plat: plats.filter((g) => g.h0 > 1.5).map((g) => ({ u0: +g.u0.toFixed(2), u1: +g.u1.toFixed(2), hauteur: +((g.h0 + g.h1) / 2).toFixed(2) })),
  };
}

/** Coupe un polygone {x,z} par le demi-plan { p : (p·n) ≥ d } (Sutherland–Hodgman). */
export function couperPolygone(poly, n, d) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const da = a.x * n.x + a.z * n.z - d, db = b.x * n.x + b.z * n.z - d;
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }); }
  }
  return out;
}
function aire(poly) { let a = 0; for (let i = 0; i < poly.length; i++) { const u = poly[i], v = poly[(i + 1) % poly.length]; a += u.x * v.z - v.x * u.z; } return Math.abs(a) / 2; }

/** Aire du polygone restreinte à la bande u ∈ [u0, u1] le long de l'axe `axe` (origine `origine`). */
export function aireDansBande(poly, origine, axe, u0, u1) {
  const d0 = origine.x * axe.x + origine.z * axe.z;
  let p = couperPolygone(poly, axe, d0 + u0);
  p = couperPolygone(p, { x: -axe.x, z: -axe.z }, -(d0 + u1));
  return p.length >= 3 ? aire(p) : 0;
}

/** Intervalles de u où le profil est ≥ hauteur (union d'intervalles, segment par segment). */
export function intervallesAuDessus(profil, hauteur) {
  const out = [];
  for (const g of profil.segments) {
    const a = g.h0 - hauteur, b = g.h1 - hauteur;
    let u0 = null, u1 = null;
    if (a >= 0 && b >= 0) { u0 = g.u0; u1 = g.u1; }
    else if (a < 0 && b < 0) continue;
    else { const uc = g.u0 + (g.u1 - g.u0) * (a / (a - b)); if (a >= 0) { u0 = g.u0; u1 = uc; } else { u0 = uc; u1 = g.u1; } }
    const der = out[out.length - 1];
    if (der && Math.abs(der[1] - u0) < 1e-6) der[1] = u1; else out.push([u0, u1]);
  }
  return out;
}

/**
 * Les quantités des combles. `polygone` = plan au sol {x,z} ; `pignon` = { a:{x,z}, dir:{x,z} } (le
 * mur qui porte le profil, `dir` unitaire dans le sens des u) ; `profil` = profilDepuisPoints.
 * Rend { type, jambettes, pentes_deg, faitage, surface_sol, surface_habitable, surface_rampants,
 *        surface_pignon, surface_jambettes, hauteur_max, bande_habitable: [[u0,u1]…] }.
 */
export function analyserCombles(polygone, pignon, profil, { hauteurHabitable = HAUTEUR_HABITABLE } = {}) {
  const lecture = lireProfil(profil);
  const surfaceSol = aire(polygone);
  const bandes = intervallesAuDessus(profil, hauteurHabitable);
  const surfaceHabitable = bandes.reduce((s, [u0, u1]) => s + aireDansBande(polygone, pignon.a, pignon.dir, u0, u1), 0);
  // Rampants : l'aire au sol sous chaque segment en pente, divisée par cos(pente).
  let rampants = 0;
  for (const g of profil.segments) {
    if (g.type !== 'rampant') continue;
    const horiz = aireDansBande(polygone, pignon.a, pignon.dir, g.u0, g.u1);
    rampants += horiz / Math.cos(Math.abs(g.pente_deg) * Math.PI / 180);
  }
  // Pignon : l'aire sous le profil (un pignon ; l'autre est supposé identique s'il existe).
  let pignonAire = 0;
  for (const g of profil.segments) pignonAire += (g.u1 - g.u0) * (g.h0 + g.h1) / 2;
  // Jambettes : hauteur × longueur de la pièce le long du faîtage (≈ aire au sol / largeur du profil).
  const largeur = profil.uMax - profil.uMin;
  const longueur = largeur > 0.1 ? surfaceSol / largeur : 0;
  const surfaceJambettes = (lecture.jambettes.gauche + lecture.jambettes.droite) * longueur;
  return {
    ...lecture,
    surface_sol: +surfaceSol.toFixed(2),
    surface_habitable: +surfaceHabitable.toFixed(2),
    surface_rampants: +rampants.toFixed(2),
    surface_pignon: +pignonAire.toFixed(2),
    surface_jambettes: +surfaceJambettes.toFixed(2),
    hauteur_max: lecture.faitage.hauteur,
    bande_habitable: bandes.map(([u0, u1]) => [+u0.toFixed(2), +u1.toFixed(2)]),
    largeur_profil: +largeur.toFixed(2),
  };
}

// Murs et angles depuis des POINTS AU SOL (03/10/2026, Moctar : « tout sur le
// téléphone »). Pendant le film, chaque image est découpée en sol / mur /
// plafond ; la frontière sol/mur, projetée sur le plan du sol connu (ARCore),
// donne des points au sol en mètres. Ce module en tire les droites des murs, les
// angles (intersections), et la fiabilité — sans profondeur, sans serveur.
//
// Calculs purs (node --test), repère monde WebXR : X droite, Z vers l'arrière,
// le plan du sol est XZ. Toutes les longueurs en MÈTRES.
import { intersectionMurs } from './metre-photo.js';
import { assembler } from './metre-assemblage.js';

/** Ajustement orthogonal d'une droite sur des points {x,z} : rend { c, n, d, dir } (normale n, c = centroïde, dir = direction unitaire). */
export function droiteOrthogonale(pts) {
  // (axe 2) Chaque point peut porter un `poids` (distance, angle de vue) : un point vu
  // de près et de face pèse plus qu'un point vu de loin en rasant.
  const W = pts.reduce((s, p) => s + (p.poids || 1), 0);
  const mx = pts.reduce((s, p) => s + p.x * (p.poids || 1), 0) / W, mz = pts.reduce((s, p) => s + p.z * (p.poids || 1), 0) / W;
  let sxx = 0, sxz = 0, szz = 0;
  for (const p of pts) { const w = p.poids || 1, dx = p.x - mx, dz = p.z - mz; sxx += w * dx * dx; sxz += w * dx * dz; szz += w * dz * dz; }
  const theta = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  const dir = { x: Math.cos(theta), z: Math.sin(theta) };
  const nrm = { x: -dir.z, z: dir.x };
  return { c: { x: mx, z: mz }, dir, n: nrm, d: nrm.x * mx + nrm.z * mz };
}

function distanceDroite(l, p) { return Math.abs(l.n.x * p.x + l.n.z * p.z - l.d); }
/**
 * Un trou dans un mur est-il HABITÉ ? Entre deux tronçons alignés (abscisses t0 → t1
 * le long de la droite), s'il y a des points à 8 cm – 1 m de la droite, c'est un
 * retour de cloison ou un débord, pas un meuble : les deux tronçons sont deux murs.
 */
function trouHabite(points, l, t0, t1, dMin = 0.08) {
  let n = 0;
  for (const p of points) {
    const t = (p.x - l.c.x) * l.dir.x + (p.z - l.c.z) * l.dir.z;
    if (t <= t0 + 0.05 || t >= t1 - 0.05) continue;
    const d = distanceDroite(l, p);
    if (d >= dMin && d <= 1.0 && ++n >= 6) return true;
  }
  return false;
}

/**
 * Trouve les droites de murs dans un nuage de points au sol par RANSAC puis
 * ajustement orthogonal. Un mur = au moins `supportMin` points sur au moins
 * `longueurMin` mètres, à moins de `tolerance` de la droite.
 * Rend des murs { a, b, dir, n, d, support, longueur, confiance }.
 */
export function trouverMurs(points, { tolerance = 0.04, supportMin = 10, longueurMin = 0.25, maxMurs = 16, essais = 400, graine = 7 } = {}) {
  let restants = points.slice();
  const murs = [];
  let s = graine;
  const alea = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  while (restants.length >= supportMin && murs.length < maxMurs) {
    let meilleur = null;
    for (let k = 0; k < essais; k++) {
      const i = Math.floor(alea() * restants.length), j = Math.floor(alea() * restants.length);
      if (i === j) continue;
      const p = restants[i], q = restants[j];
      const dx = q.x - p.x, dz = q.z - p.z, L = Math.hypot(dx, dz);
      if (L < 0.15) continue;
      const nrm = { x: -dz / L, z: dx / L }, d = nrm.x * p.x + nrm.z * p.z;
      let cnt = 0;
      for (const r of restants) if (Math.abs(nrm.x * r.x + nrm.z * r.z - d) <= tolerance) cnt += (r.poids || 1);
      if (!meilleur || cnt > meilleur.cnt) meilleur = { cnt, n: nrm, d };
    }
    if (!meilleur || meilleur.cnt < supportMin * 0.5) break;   // score pondéré : des points lointains (poids < 1) comptent moins
    // Inliers, puis ajustement fin et re-sélection une fois.
    let inl = restants.filter((r) => Math.abs(meilleur.n.x * r.x + meilleur.n.z * r.z - meilleur.d) <= tolerance);
    let l = droiteOrthogonale(inl);
    inl = restants.filter((r) => distanceDroite(l, r) <= tolerance);
    if (inl.length < supportMin) { restants = restants.filter((r) => !inl.includes(r)); continue; }
    l = droiteOrthogonale(inl);
    // Étendue le long de la droite, par PLAGES : les points alignés par hasard loin du
    // mur (pieds de meubles, bruit) forment des plages isolées qu'on ignore. Une plage
    // = des points espacés de moins de 30 cm. Le mur = de la première à la dernière
    // plage « sérieuse » (≥ 8 points par mètre, un mur blanc en a peu), les autres sont rendues au nuage.
    const avecT = inl.map((p) => ({ p, t: (p.x - l.c.x) * l.dir.x + (p.z - l.c.z) * l.dir.z })).sort((u, v) => u.t - v.t);
    const plages = [];
    for (const e of avecT) { const der = plages[plages.length - 1]; if (der && e.t - der.fin <= 0.3) { der.fin = e.t; der.pts.push(e.p); } else plages.push({ debut: e.t, fin: e.t, pts: [e.p] }); }
    const serieuses = plages.filter((g) => g.pts.length >= 6 && g.pts.length / Math.max(0.1, g.fin - g.debut) >= 8);
    const ids = new Set(inl);
    if (!serieuses.length) { restants = restants.filter((r) => !ids.has(r)); continue; }
    const gardes = new Set(serieuses.flatMap((g) => g.pts));
    restants = restants.filter((r) => !gardes.has(r));
    // Les plages alignées forment UN mur, sauf si le trou entre deux plages est habité
    // (retour de cloison, débord) : alors ce sont deux murs distincts sur la même droite.
    const groupes = [[serieuses[0]]];
    for (let k = 1; k < serieuses.length; k++) {
      const prec = serieuses[k - 1], cour = serieuses[k];
      // Le trou n'est « habité » que par des points nettement hors de la bande de tolérance (× 1,5).
      if (trouHabite(points, l, prec.fin, cour.debut, Math.max(0.08, tolerance * 1.5))) groupes.push([cour]); else groupes[groupes.length - 1].push(cour);
    }
    for (const grp of groupes) {
      const t0 = grp[0].debut, t1 = grp[grp.length - 1].fin, longueur = t1 - t0;
      const support = grp.reduce((c, g) => c + g.pts.length, 0);
      if (longueur < longueurMin || Math.max(...grp.map((g) => g.fin - g.debut)) < longueurMin || support < supportMin) continue;
      murs.push({
        a: { x: l.c.x + l.dir.x * t0, z: l.c.z + l.dir.z * t0 },
        b: { x: l.c.x + l.dir.x * t1, z: l.c.z + l.dir.z * t1 },
        dir: l.dir, n: l.n, d: l.d, support, longueur,
        // Confiance : assez de points (40) ET assez d'étendue (60 cm) — un mur à moitié caché par
        // un meuble reste bien déterminé si ce qu'on en voit est long et réparti.
        confiance: Math.min(1, support / 40) * Math.min(1, longueur / 0.6),
      });
    }
  }
  return murs;
}

/** Fusionne les murs quasi colinéaires (< angleDeg et < ecart mètres entre droites), en gardant l'étendue totale. */
export function fusionnerMurs(murs, { angleDeg = 5, ecart = 0.08, points = null } = {}) {
  const out = [];
  const pris = new Array(murs.length).fill(false);
  for (let i = 0; i < murs.length; i++) {
    if (pris[i]) continue;
    let groupe = [murs[i]]; pris[i] = true;
    for (let j = i + 1; j < murs.length; j++) {
      if (pris[j]) continue;
      const m = murs[i], o = murs[j];
      const cos = Math.abs(m.dir.x * o.dir.x + m.dir.z * o.dir.z);
      const ang = Math.acos(Math.min(1, cos)) * 180 / Math.PI;
      const ec = Math.abs(distanceDroite(m, o.a) + distanceDroite(m, o.b)) / 2;
      if (ang < angleDeg && ec < ecart) {
        if (points) {   // trou entre les deux tronçons habité par un retour ? alors deux murs
          const l = droiteOrthogonale([m.a, m.b, o.a, o.b]);
          const ts = [m.a, m.b, o.a, o.b].map((p) => (p.x - l.c.x) * l.dir.x + (p.z - l.c.z) * l.dir.z).sort((u, v) => u - v);
          if (trouHabite(points, l, ts[1], ts[2], Math.max(0.08, (ecart || 0.08) * 1.5))) continue;
        }
        groupe.push(o); pris[j] = true;
      }
    }
    if (groupe.length === 1) { out.push(murs[i]); continue; }
    const pts = groupe.flatMap((g) => [g.a, g.b]);
    const l = droiteOrthogonale(pts);
    const ts = pts.map((p) => (p.x - l.c.x) * l.dir.x + (p.z - l.c.z) * l.dir.z);
    const t0 = Math.min(...ts), t1 = Math.max(...ts);
    out.push({ a: { x: l.c.x + l.dir.x * t0, z: l.c.z + l.dir.z * t0 }, b: { x: l.c.x + l.dir.x * t1, z: l.c.z + l.dir.z * t1 },
      dir: l.dir, n: l.n, d: l.d, support: groupe.reduce((s, g) => s + g.support, 0), longueur: t1 - t0, confiance: Math.max(...groupe.map((g) => g.confiance)) });
  }
  return out;
}

/**
 * Ordonne les murs en les CHAÎNANT bout à bout (le bout du mur courant → le bout le
 * plus proche d'un autre mur), en retournant un mur si besoin. Un tri par angle
 * autour du centroïde se trompe dans les pièces non convexes (en L) ; le chaînage, non.
 */
export function ordonnerMurs(murs) {
  if (murs.length < 2) return murs.slice();
  const reste = murs.map((m) => ({ ...m, a: { ...m.a }, b: { ...m.b }, dir: { ...m.dir }, n: { ...m.n } })).sort((u, v) => v.longueur - u.longueur);
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

/**
 * A priori PONDÉRÉS, jamais des règles : un angle à moins de `seuilDeg` de 90°
 * est ramené à 90° (on tourne le mur suivant autour de son milieu) ; au-delà,
 * on ne touche à rien (pan coupé, pièce biaise). Rend { murs, redresses }.
 */
export function redresserAnglesDroits(mursOrdonnes, { seuilDeg = 7 } = {}) {
  const murs = mursOrdonnes.map((m) => ({ ...m, a: { ...m.a }, b: { ...m.b }, dir: { ...m.dir }, n: { ...m.n } }));
  let redresses = 0;
  for (let i = 1; i < murs.length; i++) {
    const p = murs[i - 1], m = murs[i];
    const cos = p.dir.x * m.dir.x + p.dir.z * m.dir.z;
    const ang = Math.acos(Math.max(-1, Math.min(1, Math.abs(cos)))) * 180 / Math.PI;
    if (Math.abs(ang - 90) > seuilDeg || Math.abs(ang - 90) < 1e-9) continue;
    // Direction perpendiculaire à p, du côté le plus proche de la direction actuelle de m.
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

/**
 * (2e film réel) Deux murs quasi parallèles, proches (< 30 cm) et qui se recouvrent le long de la
 * droite, c'est le MÊME mur vu deux fois (retombée de plafond, coffrage, bord de porte) : on garde
 * le plus soutenu, sinon le polygone se croise. Rend la liste épurée.
 */
export function dedoublonner(murs, { angleDeg = 10, ecart = 0.30 } = {}) {
  const garde = murs.slice().sort((u, v) => (v.support || 0) - (u.support || 0));
  const out = [];
  for (const m of garde) {
    const doublon = out.some((o) => {
      const cos = Math.abs(m.dir.x * o.dir.x + m.dir.z * o.dir.z);
      if (Math.acos(Math.min(1, cos)) * 180 / Math.PI > angleDeg) return false;
      const d = (Math.abs(o.n.x * m.a.x + o.n.z * m.a.z - o.d) + Math.abs(o.n.x * m.b.x + o.n.z * m.b.z - o.d)) / 2;
      if (d > ecart) return false;
      // Recouvrement le long de la droite de o.
      const t = (p) => (p.x - o.a.x) * o.dir.x + (p.z - o.a.z) * o.dir.z;
      const [m0, m1] = [t(m.a), t(m.b)].sort((u, v) => u - v), [o0, o1] = [t(o.a), t(o.b)].sort((u, v) => u - v);
      return Math.min(m1, o1) - Math.max(m0, o0) > 0.2;
    });
    if (!doublon) out.push(m);
  }
  return out;
}

/** Aire (lacet) et périmètre d'un polygone {x,z}. */
export function aireEtPerimetre(poly) {
  let a = 0, p = 0;
  for (let i = 0; i < poly.length; i++) {
    const u = poly[i], v = poly[(i + 1) % poly.length];
    a += u.x * v.z - v.x * u.z; p += Math.hypot(v.x - u.x, v.z - u.z);
  }
  return { aire: Math.abs(a) / 2, perimetre: p };
}

/**
 * Chaîne complète : points au sol → murs → angles → résultat.
 * `hauteurs` : liste de hauteurs mesurées (frontière mur/plafond projetée sur les murs), médiane retenue.
 * Rend un objet au format `resultat.json` de batispot-scan3d (statut, angles, murs, surface_sol, perimetre, hauteur, avertissements).
 */
export function analyserPointsSol(points, { solY = 0, hauteurs = [], options = {}, contexte = null } = {}) {
  const avert = [];
  // (04/10) L'ancien message « Trop peu de points » ne disait rien à l'artisan. Le diagnostic
  // utile (images floues, pied des murs vu ou pas, durée) est composé par `diagnosticFilm`
  // (metre-consignes.js) depuis la fiche du film ; ici on dit le geste qui manque.
  if (points.length < 60) return { statut: 'echec', message: 'Le pied des murs n\'a pas été vu assez longtemps.', angles: [], murs: [], surface_sol: 0, perimetre: 0, hauteur: null, solY, avertissements: avert };
  let murs = fusionnerMurs(trouverMurs(points, options), { points, ecart: options.ecart || 0.08, angleDeg: options.angleDeg || 5 });
  murs = dedoublonner(murs);
  if (murs.length < 3) return { statut: 'echec', message: `${murs.length} mur(s) trouvé(s), il en faut 3 : filmez le pied de chaque mur.`, angles: [], murs, surface_sol: 0, perimetre: 0, hauteur: null, solY, avertissements: avert };
  // ÉTAGE 7 — L'ASSEMBLAGE (04/10/2026, expérience (g) de ~/batispot-scan3d, portée telle quelle
  // dans `metre-assemblage.js`). Le chaînage « ordonnerMurs → intersections consécutives » referme
  // ce qu'on lui donne : il ne voit ni qu'il MANQUE un mur (une pièce à 6 murs rendue à 4, surface
  // −36 %) ni qu'il y en a TROP (7 à 10 détections pour 4 murs, surface −95 %). L'arrangement
  // partitionne le plan du sol par les droites des murs et étiquette chaque face avec une preuve
  // indépendante de la géométrie — l'espace libre vu par la caméra. Mesuré sur 84 films : angle
  // médian −59 %, erreur de surface −30 %, IoU +0,05, et plus aucun « ok » faux quand la caméra
  // sort de la pièce. 11 ms par calcul sur un A57.
  // Sans `contexte` (pas de trajectoire ni de rayons), on retombe sur le chaînage : comportement
  // d'avant, à l'octet près.
  const a = assembler(murs, contexte || {}, Object.assign({ methode: contexte ? 'arrangement' : 'chainage' }, options));
  let hauteur = null;
  if (hauteurs.length >= 3) { const h = hauteurs.slice().sort((u, v) => u - v); hauteur = h[Math.floor(h.length / 2)]; }
  else if (hauteurs.length) hauteur = hauteurs[0];
  // `detections` : les droites de murs AVANT assemblage. Le recoupement de la hauteur s'en sert
  // comme empreinte du pied des murs — un côté « déduit » ou « manquant » de l'assemblage n'a
  // jamais été vu, et admettrait des points de sol qui ne sont pas au pied d'un mur.
  return Object.assign({ anglesRedresses: 0 }, a, { solY, hauteur, detections: murs, avertissements: (a.avertissements || []).concat(avert) });
}

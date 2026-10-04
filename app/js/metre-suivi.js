// Suivi des murs pendant le film (04/10/2026, étude « balayage propre, en un seul
// passage »). Trois idées, toutes tirées de la littérature robotique :
//   1. une GRILLE D'OCCUPATION du sol (5 cm) qui garde la mémoire des points de
//      frontière : un point vu une fois ne compte pas, un point vu plusieurs fois
//      sous plusieurs angles compte (poids = confiance × 1/d², demi-vie 3 s) ;
//   2. SPLIT-AND-MERGE sur les cellules ordonnées par angle autour de l'artisan,
//      comme un scan laser : 1 780 Hz et 7 % de faux positifs chez Nguyen et al.
//      (Autonomous Robots 2007), contre 20-90 Hz et 29 % pour le RANSAC ;
//   3. un SUIVI des murs en (θ, ρ) monde avec hystérésis : un mur naît après 3
//      images qui le voient, meurt après 10 sans vote, et sa confiance monte avec
//      les votes — zéro clignotement, « un mur reconnu reste reconnu ».
// Calculs purs (node --test). Mètres, repère monde WebXR, plan du sol = XZ.
import { droiteOrthogonale, fusionnerMurs, ordonnerMurs, redresserAnglesDroits, aireEtPerimetre } from './metre-murs.js';
import { intersectionMurs } from './metre-photo.js';


/** Grille d'occupation du sol : cellules de `cellule` mètres, poids qui décroît (demi-vie en secondes). */
export class GrilleSol {
  constructor({ cellule = 0.05, demiVie = 3 } = {}) { this.cellule = cellule; this.demiVie = demiVie; this.cellules = new Map(); }
  cle(x, z) { return (Math.round(x / this.cellule)) + ',' + (Math.round(z / this.cellule)); }
  /**
   * Ajoute des points {x, z, poids?} vus à l'instant t (secondes) depuis la position `cam` {x, z}
   * du téléphone. La position de la caméra sert à la PARALLAXE (voir `actives`).
   */
  ajouter(points, t, cam = null) {
    for (const p of points) {
      const k = this.cle(p.x, p.z);
      let c = this.cellules.get(k);
      const w = p.poids == null ? 1 : p.poids;
      if (!c) { c = { x: p.x, z: p.z, poids: 0, t, vues: 0, obs: [] }; this.cellules.set(k, c); }
      else if (t > c.t) { c.poids *= Math.pow(0.5, (t - c.t) / this.demiVie); c.t = t; }
      // Position : moyenne pondérée (le centre de la cellule n'est qu'un index).
      c.x = (c.x * c.poids + p.x * w) / (c.poids + w); c.z = (c.z * c.poids + p.z * w) / (c.poids + w);
      c.poids += w; c.vues++;
      // Observations : où le point est tombé, vu d'où (au plus 8, les plus récentes).
      if (cam) { c.obs.push({ x: p.x, z: p.z, cx: cam.x, cz: cam.z }); if (c.obs.length > 8) c.obs.shift(); }
    }
  }
  /**
   * PARALLAXE (04/10, « quasi infaillible ») : un vrai pied de mur est AU SOL, donc vu depuis deux
   * positions différentes il se projette au même endroit. Le bord d'un buffet, à 40 cm du sol,
   * projeté sur le plan du sol, tombe à deux endroits différents selon d'où on le regarde.
   * Une cellule est « confirmée » si deux observations prises depuis des positions distantes
   * d'au moins `recul` coïncident à `tolerance` près. Rend true/false, ou null si on n'a pas
   * encore deux points de vue (on ne sait pas).
   */
  static parallaxe(c, { recul = 0.5, tolerance = 0.05 } = {}) {
    const o = c.obs; if (!o || o.length < 2) return null;
    let paires = 0;
    for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) {
      if (Math.hypot(o[i].cx - o[j].cx, o[i].cz - o[j].cz) < recul) continue;
      paires++;
      if (Math.hypot(o[i].x - o[j].x, o[i].z - o[j].z) <= tolerance) return true;
    }
    return paires ? false : null;
  }
  /**
   * Les cellules assez vues (poids ≥ seuil) à l'instant t, avec décroissance appliquée, et
   * qui passent la parallaxe : exclues si deux points de vue éloignés se contredisent ;
   * gardées (avec un poids réduit de moitié) tant qu'on n'a pas encore deux points de vue.
   */
  actives(t, seuil = 1.5) {
    const out = [];
    for (const [k, c] of this.cellules) {
      const p = c.poids * Math.pow(0.5, (t - c.t) / this.demiVie);
      if (p < 0.05) { this.cellules.delete(k); continue; }
      if (p < seuil) continue;
      const px = GrilleSol.parallaxe(c);
      if (px === false) continue;
      out.push({ x: c.x, z: c.z, poids: px === true ? p : p * 0.5 });
    }
    return out;
  }
}

/**
 * Split-and-merge sur des points ORDONNÉS par angle autour de `centre` : on coupe
 * récursivement là où un point s'écarte de plus de `seuil` de la corde, on garde
 * les tronçons d'au moins `nMin` points et `longueurMin` mètres, puis on fusionne
 * les voisins colinéaires. Rend des détections { a, b, dir, n, d, longueur, poids, nPoints }.
 */
export function splitAndMerge(points, centre, { seuil = 0.06, nMin = 10, longueurMin = 0.5 } = {}) {
  if (points.length < nMin) return [];
  let tri = points.map((p) => ({ ...p, ang: Math.atan2(p.z - centre.z, p.x - centre.x) })).sort((u, v) => u.ang - v.ang);
  // Séquence CIRCULAIRE : on la fait commencer au plus grand trou angulaire, sinon un mur
  // à cheval sur ±180° est coupé en deux.
  let iTrou = 0, trouMax = tri[0].ang + 2 * Math.PI - tri[tri.length - 1].ang;
  for (let i = 1; i < tri.length; i++) { const t = tri[i].ang - tri[i - 1].ang; if (t > trouMax) { trouMax = t; iTrou = i; } }
  tri = tri.slice(iTrou).concat(tri.slice(0, iTrou).map((p) => ({ ...p, ang: p.ang + 2 * Math.PI })));
  // Comme un laser : UN point par direction (secteurs de 1,5°), le plus PROCHE de l'artisan. Deux
  // lignes à la même direction (le pied du mur et le fantôme d'un meuble projeté derrière lui)
  // ne s'entremêlent plus en zigzag ; le fantôme, plus loin, est écarté.
  { const bins = new Map(); const pas = 1.5 * Math.PI / 180;
    for (const p of tri) { const b = Math.floor(p.ang / pas); const d = Math.hypot(p.x - centre.x, p.z - centre.z); const q = bins.get(b); if (!q || d < q.d) bins.set(b, { ...p, d }); }
    tri = [...bins.values()].sort((u, v) => u.ang - v.ang); }
  if (tri.length < nMin) return [];
  // Un trou angulaire > 25° ou une distance > 0,8 m entre voisins coupe la séquence.
  const sequences = [[tri[0]]];
  for (let i = 1; i < tri.length; i++) {
    const p = tri[i], q = tri[i - 1];
    if (p.ang - q.ang > 25 * Math.PI / 180 || Math.hypot(p.x - q.x, p.z - q.z) > 0.8) sequences.push([p]); else sequences[sequences.length - 1].push(p);
  }
  const segments = [];
  const couper = (seq) => {
    if (seq.length < nMin) return;
    const a = seq[0], b = seq[seq.length - 1];
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz);
    let iMax = -1, dMax = 0;
    if (L > 1e-6) {
      for (let i = 1; i < seq.length - 1; i++) {
        const p = seq[i]; const dist = Math.abs((p.x - a.x) * dz - (p.z - a.z) * dx) / L;
        if (dist > dMax) { dMax = dist; iMax = i; }
      }
    }
    if (dMax > seuil && iMax > 0) { couper(seq.slice(0, iMax + 1)); couper(seq.slice(iMax)); return; }
    segments.push(seq);
  };
  for (const s of sequences) couper(s);
  const detections = [];
  for (const seq of segments) {
    const l = droiteOrthogonale(seq);
    const ts = seq.map((p) => (p.x - l.c.x) * l.dir.x + (p.z - l.c.z) * l.dir.z);
    const t0 = Math.min(...ts), t1 = Math.max(...ts), longueur = t1 - t0;
    if (longueur < longueurMin) continue;
    detections.push({
      a: { x: l.c.x + l.dir.x * t0, z: l.c.z + l.dir.z * t0 }, b: { x: l.c.x + l.dir.x * t1, z: l.c.z + l.dir.z * t1 },
      dir: l.dir, n: l.n, d: l.d, longueur, poids: seq.reduce((s, p) => s + (p.poids || 1), 0), nPoints: seq.length,
      support: seq.length, confiance: 1,
    });
  }
  return fusionnerMurs(detections, { angleDeg: 8, ecart: 0.08 });
}

/**
 * Le suivi des murs. `maj(detections, image)` associe chaque détection à un mur
 * connu (|Δθ| < 5°, |Δρ| < 10 cm) ou en crée un ; `murs()` rend ceux qui sont
 * visibles (vus ≥ 3 images, pas perdus depuis 10) avec leur confiance.
 */
export class SuiviMurs {
  constructor({ naissance = 3, mort = 10, oubli = 60, cellule = 0.05, demiVie = 3 } = {}) {
    this.naissance = naissance; this.mort = mort; this.oubli = oubli;
    this.grille = new GrilleSol({ cellule, demiVie });
    this.suivis = []; this.image = 0;
  }
  /** Une image de plus : ses points au sol entrent dans la grille, puis détection et association. */
  ajouterImage(points, t, centre) {
    this.image++;
    this.grille.ajouter(points, t, centre);
    const actives = this.grille.actives(t);
    const detections = actives.length >= 6 ? splitAndMerge(actives, centre) : [];
    this.maj(detections);
    return detections;
  }
  maj(detections) {
    const img = this.image;
    for (const d of detections) {
      // Une détection fusionnée (fusionnerMurs) n'a que `support` : même rôle que `poids`.
      if (d.poids == null) d.poids = d.support || 1;
      // Forme CANONIQUE (θ dans [0, π), ρ signé) : (θ + π, −ρ) est la même droite. Sans ça, deux
      // murs parallèles opposés (x = +2 et x = −2) se confondaient quand leurs directions s'opposaient.
      let th = Math.atan2(d.dir.z, d.dir.x), rho = d.d;
      if (th < 0) { th += Math.PI; rho = -rho; } if (th >= Math.PI) { th -= Math.PI; rho = -rho; }
      let w = null, meilleur = Infinity;
      for (const s of this.suivis) {
        let dth = Math.abs(th - s.th), rhoS = s.rho;
        if (dth > Math.PI / 2) { dth = Math.PI - dth; rhoS = -s.rho; }   // passage par 0/π : ρ change de signe
        const drho = Math.abs(rho - rhoS);
        // Même droite ? Il faut aussi que les tronçons se recouvrent ou se touchent (sinon deux murs alignés).
        if (dth < 5 * Math.PI / 180 && drho < 0.10) {
          const [t0, t1] = etendue(s, d);
          if (t1 - t0 < s.longueur + d.longueur + 0.6) { const sc = dth + drho; if (sc < meilleur) { meilleur = sc; w = s; } }
        }
      }
      if (!w) { w = { th, rho, dir: { x: Math.cos(th), z: Math.sin(th) }, n: { x: -Math.sin(th), z: Math.cos(th) }, a: { ...d.a }, b: { ...d.b }, longueur: d.longueur, votes: 0, vues: 0, derniere: img, nee: img }; this.suivis.push(w); }
      const k = Math.min(0.5, d.poids / (d.poids + w.votes));          // gain décroissant
      // Ramener la détection du côté de w (θ proche, ρ de même signe) avant de moyenner.
      let thD = th, rhoD = rho;
      if (Math.abs(thD - w.th) > Math.PI / 2) { thD += thD < w.th ? Math.PI : -Math.PI; rhoD = -rhoD; }
      // (03/10, Dolphin) Un mur dont la distance est tenue par ≥ 2 échos concordants garde son ρ : la caméra
      // n'actualise plus que l'orientation et l'étendue (sans cela, 48 images biaisées diluaient 15 échos justes).
      w.th += k * (thD - w.th); w.rho += (w.sonarN >= 2 ? 0.05 * k : k) * (rhoD - w.rho);
      if (w.th < 0) { w.th += Math.PI; w.rho = -w.rho; } if (w.th >= Math.PI) { w.th -= Math.PI; w.rho = -w.rho; }
      w.dir = { x: Math.cos(w.th), z: Math.sin(w.th) }; w.n = { x: -w.dir.z, z: w.dir.x };
      // Étendue : union des tronçons, reprojetée sur la droite suivie.
      const [t0, t1] = etendue(w, d);
      const c = { x: w.n.x * w.rho, z: w.n.z * w.rho };
      w.a = { x: c.x + w.dir.x * t0, z: c.z + w.dir.z * t0 }; w.b = { x: c.x + w.dir.x * t1, z: c.z + w.dir.z * t1 }; w.longueur = t1 - t0;
      w.votes += d.poids; w.vues++; w.derniere = img;
    }
    for (const s of this.suivis) {
      s.confiance = Math.min(1, s.vues / this.naissance) * Math.min(1, s.votes / 120) * Math.min(1, s.longueur / 0.6);
      s.visible = s.vues >= this.naissance && img - s.derniere < this.mort;
    }
    this.suivis = this.suivis.filter((s) => img - s.derniere < this.oubli);
  }
  /**
   * Témoin de DISTANCE (03/10, sonar) : une mesure indépendante dit que la droite du mur `m` (objet rendu par
   * murs()) passe à `rhoMesure` (ρ signé, même convention que le suivi). Elle pèse `poids` votes, et le ρ
   * glisse vers elle avec un gain borné à 0,5 : forte, mais jamais seule. Rend le ρ après correction.
   */
  temoinDistance(m, rhoMesure, poids = 60) {
    const w = this.suivis.find((s) => s.a === m.a && s.b === m.b) || this.suivis.find((s) => Math.abs(s.rho - m.d) < 1e-9 && Math.abs(s.dir.x - m.dir.x) < 1e-9);
    if (!w) return null;
    // Moyenne courante des échos ; un écho à plus de 6 cm de la moyenne établie (≥ 2 échos) est ignoré — un seul
    // écho ne fait pas foi. Dès 2 échos concordants, ρ = la moyenne des échos (le son mesure la distance mieux
    // que l'image) ; au premier écho, glissement prudent.
    if (w.sonarN >= 2 && Math.abs(rhoMesure - w.sonarRho) > 0.06) { w.sonarRejets = (w.sonarRejets || 0) + 1; return w.rho; }
    w.sonarN = (w.sonarN || 0) + 1; w.sonarRho = w.sonarN === 1 ? rhoMesure : w.sonarRho + (rhoMesure - w.sonarRho) / w.sonarN;
    // (04/10) Un SEUL écho ne déplace plus rien : il est seulement enregistré. Sur le 1er film
    // réel, l'unique écho disait le mur à 69 % de la distance vue par la caméra — un faux écho
    // aurait suffi à fausser la pièce. Il faut deux échos d'accord à 6 cm près.
    if (w.sonarN >= 2) w.rho = w.sonarRho;
    w.votes += poids;
    const c = { x: w.n.x * w.rho, z: w.n.z * w.rho }, t0 = (w.a.x - c.x) * w.dir.x + (w.a.z - c.z) * w.dir.z, t1 = (w.b.x - c.x) * w.dir.x + (w.b.z - c.z) * w.dir.z;
    w.a = { x: c.x + w.dir.x * t0, z: c.z + w.dir.z * t0 }; w.b = { x: c.x + w.dir.x * t1, z: c.z + w.dir.z * t1 };
    w.sonar = w.sonarN;
    return w.rho;
  }
  /** Murs visibles, au format de metre-murs (a, b, dir, n, d, longueur, confiance, trouve). */
  murs() {
    return this.suivis.filter((s) => s.visible).map((s) => ({ a: s.a, b: s.b, dir: s.dir, n: s.n, d: s.rho, longueur: s.longueur, support: s.votes, confiance: +s.confiance.toFixed(2), trouve: 'image', vues: s.vues, sonar: s.sonar || 0 }));
  }
  /** La pièce telle qu'on la connaît maintenant : murs chaînés, angles, surface si fermée. */
  resultat() {
    let murs = this.murs();
    if (murs.length < 2) return { statut: murs.length ? 'partiel' : 'echec', murs, angles: [], surface_sol: 0, perimetre: 0, avertissements: [] };
    murs = ordonnerMurs(murs);
    const r = redresserAnglesDroits(murs); murs = r.murs;
    const angles = []; let manques = 0;
    for (let i = 0; i < murs.length; i++) {
      const p = intersectionMurs(murs[i], murs[(i + 1) % murs.length]);
      if (!p) { manques++; continue; }
      const loin = Math.min(Math.hypot(p.x - murs[i].b.x, p.z - murs[i].b.z), Math.hypot(p.x - murs[(i + 1) % murs.length].a.x, p.z - murs[(i + 1) % murs.length].a.z)) > 2.5;
      angles.push({ x: p.x, z: p.z, confiance: loin ? 0.3 : Math.min(murs[i].confiance, murs[(i + 1) % murs.length].confiance) });
    }
    const ferme = murs.length >= 3 && manques === 0 && angles.every((a) => a.confiance >= 0.3);
    // (03/10, simulation Dolphin) Pièce fermée : la longueur d'un mur est la distance entre ses deux angles,
    // pas l'étendue des points vus (qui gardait 16 cm de biais alors que les angles étaient justes).
    if (ferme) for (let i = 0; i < murs.length; i++) {
      const a = angles[(i - 1 + murs.length) % murs.length], b = angles[i];
      murs[i] = Object.assign({}, murs[i], { a: { x: a.x, z: a.z }, b: { x: b.x, z: b.z }, longueur: Math.hypot(b.x - a.x, b.z - a.z) });
    }
    const { aire, perimetre } = ferme ? aireEtPerimetre(angles) : { aire: 0, perimetre: 0 };
    return { statut: ferme ? 'ok' : 'partiel', murs, angles, surface_sol: +aire.toFixed(2), perimetre: +perimetre.toFixed(2), anglesRedresses: r.redresses, avertissements: manques ? [`${manques} angle(s) encore ouvert(s)`] : [] };
  }
}
function etendue(s, d) {
  const c = { x: s.n.x * s.rho, z: s.n.z * s.rho };
  const proj = (p) => (p.x - c.x) * s.dir.x + (p.z - c.z) * s.dir.z;
  const ts = [proj(s.a), proj(s.b), proj(d.a), proj(d.b)];
  return [Math.min(...ts), Math.max(...ts)];
}

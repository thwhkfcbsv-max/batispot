// Plan 2D cote d'une piece relevee, en SVG.
//
// POURQUOI DU SVG ET PAS LE MODELE 3D
// Ce plan finit dans le dossier client, qui s'ouvre souvent sur le telephone du
// CLIENT. Un modele 3D demande une visionneuse et ne s'imprime pas ; un SVG
// s'affiche dans n'importe quel navigateur, se colle dans un devis PDF et
// s'imprime en A4. Le modele complet reste stocke a cote pour plus tard.
//
// CONVENTION : on travaille dans le plan XZ d'ARKit (le sol), Z vers le bas de
// l'ecran. Toutes les longueurs sont en metres.

const VERT = '#228B5B';

/** Segments {a:{x,z}, b:{x,z}} quelle que soit la methode de releve. */
function segments(releve) {
  if (releve.points && releve.points.length >= 3) {
    const p = releve.points;
    return p.map((q, i) => {
      const r = p[(i + 1) % p.length];
      return { a: { x: q.x, z: q.z }, b: { x: r.x, z: r.z } };
    });
  }
  return (releve.segments || []).map((m) => {
    // Un mur RoomPlan est donne par son centre et sa direction : on remonte
    // aux deux extremites.
    const n = Math.hypot(m.dirX, m.dirZ) || 1;
    const dx = (m.dirX / n) * (m.longueur / 2);
    const dz = (m.dirZ / n) * (m.longueur / 2);
    return { a: { x: m.x - dx, z: m.z - dz }, b: { x: m.x + dx, z: m.z + dz } };
  });
}

/**
 * @param {object} releve  sortie de metre-ar.js
 * @param {{largeur?:number}} [opt]
 * @returns {string|null} SVG autonome, ou null si le releve ne permet pas de tracer
 */
export function planSVG(releve, opt = {}) {
  const segs = segments(releve);
  if (segs.length < 3) return null;

  const xs = segs.flatMap((s) => [s.a.x, s.b.x]);
  const zs = segs.flatMap((s) => [s.a.z, s.b.z]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const largeurM = Math.max(maxX - minX, 0.5);
  const hauteurM = Math.max(maxZ - minZ, 0.5);

  const W = opt.largeur || 900;
  const marge = 78;                        // place pour les cotes exterieures
  const hautTitre = 100;                   // bandeau titre + resume, et recul pour la cote du haut
  const ech = (W - 2 * marge) / largeurM;  // pixels par metre
  const H = Math.round(hauteurM * ech + marge + hautTitre);
  const X = (x) => marge + (x - minX) * ech;
  const Y = (z) => hautTitre + (z - minZ) * ech;

  // Centre du polygone : sert a pousser chaque cote vers l'EXTERIEUR, sinon
  // les etiquettes se posent sur les murs ou sortent du cadre.
  const cx = segs.reduce((a, s) => a + X(s.a.x), 0) / segs.length;
  const cy = segs.reduce((a, s) => a + Y(s.a.z), 0) / segs.length;

  const esc = (t) => String(t).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const m2 = (v) => v.toFixed(2).replace('.', ',');

  const murs = segs.map((s) => {
    const long = Math.hypot(s.b.x - s.a.x, s.b.z - s.a.z);
    const ax = X(s.a.x), ay = Y(s.a.z), bx = X(s.b.x), by = Y(s.b.z);
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    // Normale au mur, orientee vers l'exterieur (a l'oppose du centre).
    const dx = bx - ax, dy = by - ay;
    const n = Math.hypot(dx, dy) || 1;
    let nx = -dy / n, ny = dx / n;
    if ((mx + nx - cx) ** 2 + (my + ny - cy) ** 2 < (mx - cx) ** 2 + (my - cy) ** 2) {
      nx = -nx; ny = -ny;
    }
    const D = 20;                       // recul de la cote, en pixels
    const tx = mx + nx * D, ty = my + ny * D;
    // La cote se lit toujours a l'endroit : on ne renverse jamais le texte.
    let ang = Math.atan2(dy, dx) * 180 / Math.PI;
    if (ang > 90 || ang < -90) ang += 180;
    return `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="#1a1a1a" stroke-width="6" stroke-linecap="square"/>
<text x="${tx.toFixed(1)}" y="${(ty + 5).toFixed(1)}" transform="rotate(${ang.toFixed(1)} ${tx.toFixed(1)} ${(ty + 5).toFixed(1)})" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="600" fill="${VERT}">${m2(long)} m</text>`;
  }).join('\n');

  // RoomPlan ne rend PAS les murs dans l'ordre du perimetre : relier leurs
  // extremites dans l'ordre du tableau trace un polygone croise, en sablier.
  // On ne remplit donc que lorsqu'on a un contour reellement ordonne, celui du
  // releve par points. (Revue Antigravity, 07/09.)
  const remplissage = (releve.points && releve.points.length >= 3)
    ? `<polygon points="${releve.points.map((q) => `${X(q.x).toFixed(1)},${Y(q.z).toFixed(1)}`).join(' ')}" fill="${VERT}" fill-opacity="0.07"/>`
    : '';

  const infos = [];
  if (releve.surfaceSol) infos.push(`${m2(releve.surfaceSol)} m² au sol`);
  if (releve.perimetre) infos.push(`${m2(releve.perimetre)} m de périmètre`);
  if (releve.hauteurSousPlafond) {
    infos.push(`${m2(releve.hauteurSousPlafond)} m sous plafond`);
  } else if (releve.hauteurSupposee) {
    infos.push('hauteur non mesurée');
  }

  const titre = esc(releve.piece || 'Relevé de pièce');
  const methode = releve.source === 'balayage3d' ? 'Balayage 3D' : 'Métré par points';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Plan coté de ${titre}">
<rect width="${W}" height="${H}" fill="#ffffff"/>
${remplissage}
${murs}
<text x="${marge}" y="32" font-family="system-ui,sans-serif" font-size="19" font-weight="700" fill="#1a1a1a">${titre}</text>
<text x="${marge}" y="54" font-family="system-ui,sans-serif" font-size="13" fill="#555">${esc(infos.join(' · '))}</text>
<text x="${W - marge}" y="${H - 22}" text-anchor="end" font-family="system-ui,sans-serif" font-size="11" fill="#999">${methode} — BatiSpot</text>
</svg>`;
}

// Mesure par photo avec objet-repere.
//
// POURQUOI CE FICHIER EXISTE
// Une photo seule ne contient AUCUNE information d'echelle : un mur de 3 m et
// une maquette de 30 cm donnent la meme image. L'estimation IA de photos.html
// contourne ca en supposant la taille d'objets connus (une porte de 2,04 m) —
// c'est une estimation, avec 10 a 20 % d'ecart dans une piece atypique.
//
// Ici on ne suppose rien. L'artisan pose un objet dont on connait les
// dimensions exactes (feuille A4) sur le SOL, et pointe ses 4 coins. Ces 4
// correspondances suffisent a calculer l'homographie qui redresse le plan du
// sol. Tout point du sol devient alors mesurable au centimetre.
//
// LIMITE HONNETE, a afficher a l'utilisateur : la mesure n'est valable que
// pour les points situes DANS LE MEME PLAN que le repere. On mesure le sol
// avec un repere pose au sol. Un point sur un mur donnerait un resultat faux.

/** Dimensions reelles des reperes proposes, en millimetres. */
export const REPERES = {
  a4_portrait: { nom: 'Feuille A4 (portrait)', l: 210, h: 297 },
  a4_paysage:  { nom: 'Feuille A4 (paysage)',  l: 297, h: 210 },
  a3_portrait: { nom: 'Feuille A3 (portrait)', l: 297, h: 420 },
  carreau_30:  { nom: 'Carreau 30 x 30 cm',    l: 300, h: 300 },
  carreau_60:  { nom: 'Carreau 60 x 60 cm',    l: 600, h: 600 },
};

/**
 * Resout un systeme lineaire A.x = b par elimination de Gauss avec pivot
 * partiel. Ecrit a la main : aucune dependance externe, et 8 inconnues ne
 * justifient pas d'embarquer une bibliotheque d'algebre.
 * @returns {number[]|null} null si le systeme est singulier (points alignes).
 */
function resoudre(A, b) {
  const n = A.length;
  const M = A.map((ligne, i) => [...ligne, b[i]]);

  for (let col = 0; col < n; col++) {
    // Pivot partiel : indispensable ici, les coordonnees pixel peuvent varier
    // de plusieurs ordres de grandeur et une elimination naive derive.
    let max = col;
    for (let l = col + 1; l < n; l++) {
      if (Math.abs(M[l][col]) > Math.abs(M[max][col])) max = l;
    }
    if (Math.abs(M[max][col]) < 1e-10) return null;   // points degeneres
    [M[col], M[max]] = [M[max], M[col]];

    for (let l = 0; l < n; l++) {
      if (l === col) continue;
      const f = M[l][col] / M[col][col];
      for (let c = col; c <= n; c++) M[l][c] -= f * M[col][c];
    }
  }
  return M.map((ligne, i) => ligne[n] / ligne[i]);
}

/**
 * Calcule l'homographie qui envoie 4 points image sur 4 points reels.
 *
 * On cherche H (3x3, h33 = 1) telle que, en coordonnees homogenes :
 *   X = (h0.x + h1.y + h2) / (h6.x + h7.y + 1)
 *   Y = (h3.x + h4.y + h5) / (h6.x + h7.y + 1)
 * Chaque correspondance donne 2 equations lineaires en les 8 inconnues.
 *
 * @param {{x,y}[]} image  4 points cliques, en pixels
 * @param {{x,y}[]} reel   4 points correspondants, en millimetres
 * @returns {number[]|null} les 8 coefficients, ou null si les points sont mal places
 */
export function calculerHomographie(image, reel) {
  if (image.length !== 4 || reel.length !== 4) return null;
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = image[i];
    const { x: X, y: Y } = reel[i];
    A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);  b.push(X);
    A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);  b.push(Y);
  }
  return resoudre(A, b);
}

/** Projette un point image (pixels) vers le plan reel (millimetres). */
export function versReel(h, p) {
  const d = h[6] * p.x + h[7] * p.y + 1;
  return {
    x: (h[0] * p.x + h[1] * p.y + h[2]) / d,
    y: (h[3] * p.x + h[4] * p.y + h[5]) / d,
  };
}

/** Aire d'un polygone par la formule du lacet. Retourne des mm². */
export function airePolygone(points) {
  if (points.length < 3) return 0;
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

/** Longueur du contour ferme, en mm. */
export function perimetrePolygone(points) {
  if (points.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    p += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return p;
}

/**
 * Estime la fiabilite de la mesure.
 *
 * Le repere occupe une petite portion de l'image : plus il est petit, plus une
 * erreur de quelques pixels sur un coin se propage loin. On rend donc une
 * marge d'erreur plutot qu'un chiffre sec — un artisan qui chiffre sur une
 * surface fausse de 15 % perd sa marge, et il doit le savoir.
 *
 * @param {{x,y}[]} coinsImage les 4 coins du repere en pixels
 * @param {number} largeurImage
 * @param {number} hauteurImage
 */
export function fiabilite(coinsImage, largeurImage, hauteurImage) {
  const aireRepere = airePolygone(coinsImage);          // en pixels²
  const aireImage = largeurImage * hauteurImage;
  const part = aireRepere / aireImage;

  // Seuils empiriques : en dessous de 1 % de l'image, 2 px d'erreur sur un
  // coin deviennent plusieurs centimetres sur une piece de 4 m.
  if (part < 0.005) {
    return { niveau: 'faible', marge: 15,
      message: 'Le repère est trop petit dans l\'image. Rapprochez-vous ou utilisez un repère plus grand.' };
  }
  if (part < 0.02) {
    return { niveau: 'moyenne', marge: 7,
      message: 'Mesure exploitable. Pour plus de précision, rapprochez-vous du repère.' };
  }
  return { niveau: 'bonne', marge: 3,
    message: 'Bonne précision.' };
}

/** Formate une longueur en mm vers une chaine lisible en metres. */
export function formatM(mm) {
  return (mm / 1000).toFixed(2).replace('.', ',') + ' m';
}

/** Formate une aire en mm² vers des m². */
export function formatM2(mm2) {
  return (mm2 / 1e6).toFixed(2).replace('.', ',') + ' m²';
}

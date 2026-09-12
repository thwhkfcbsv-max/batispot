// Geometrie du metre AR. Volontairement separe de la page : ce sont les seuls
// calculs dont depend le chiffrage d'un devis, ils doivent rester lisibles et
// verifiables sans ouvrir 900 lignes de HTML.
//
// Toutes les longueurs sont en METRES : c'est l'unite que renvoie WebXR, on ne
// convertit nulle part pour eviter les erreurs d'echelle.

/**
 * Aire d'un polygone par la formule du lacet, projete au sol (plan XZ).
 *
 * On ignore volontairement Y (la hauteur) : les points sont poses sur le sol,
 * et un ecart de quelques millimetres en hauteur ne doit pas fausser la
 * surface. C'est aussi ce qui rend la mesure tolerante a un sol legerement
 * irregulier.
 *
 * @param {{x:number,y:number,z:number}[]} points
 * @returns {number} m²
 */
export function aireAuSol(points) {
  if (points.length < 3) return 0;
  let s = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    s += a.x * b.z - b.x * a.z;
  }
  return Math.abs(s) / 2;
}

/** Perimetre du contour ferme, au sol. @returns {number} metres */
export function perimetreAuSol(points) {
  if (points.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    p += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return p;
}

/** Distance entre deux points, au sol. @returns {number} metres */
export function distanceAuSol(a, b) {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

/**
 * Surface de murs a partir du perimetre et de la hauteur, moins les ouvertures.
 * C'est ce chiffre qui alimente un devis de peinture ou de placo.
 */
export function surfaceMurs(perimetre, hauteur, ouvertures = []) {
  const brut = perimetre * hauteur;
  const deduction = ouvertures.reduce((s, o) => s + (o.largeur * o.hauteur), 0);
  return Math.max(0, brut - deduction);
}

/**
 * Qualifie la fiabilite d'un releve.
 *
 * ⚠️ On NE compare PAS le premier et le dernier point : l'artisan pose un
 * point par angle sans revenir a son point de depart, donc cette distance est
 * un mur, pas une derive. Le controle qui faisait ca signalait toute piece
 * rectangulaire comme douteuse (attrape par les tests le 28/08).
 *
 * Le vrai signal disponible est la PERTE DE SUIVI : si ARCore a decroche
 * pendant que l'artisan posait ses points, les coordonnees d'avant et d'apres
 * ne sont plus dans le meme repere, et la surface est fausse.
 *
 * @param {number} nbPoints
 * @param {boolean} suiviPerdu  vrai si le hit-test a echoue entre deux poses
 * @param {number} aire  m²
 */
export function qualifierReleve(nbPoints, suiviPerdu, aire) {
  if (suiviPerdu) {
    return { fiable: false, message:
      "Le suivi a décroché pendant la mesure. Les points posés avant et après " +
      "ne sont plus alignés : refaites le relevé sans quitter le sol des yeux." };
  }
  if (nbPoints === 3) {
    return { fiable: true, message:
      "Trois points : la pièce est traitée comme un triangle. Ajoutez le " +
      "quatrième angle si elle est rectangulaire." };
  }
  if (aire < 1) {
    return { fiable: false, message:
      "Surface inférieure à 1 m². Les points sont probablement trop rapprochés " +
      "ou posés au mauvais endroit." };
  }
  return { fiable: true, message: '' };
}

/** Formate des metres pour l'affichage francais. */
export function fmtM(m) {
  return m.toFixed(2).replace('.', ',') + ' m';
}

/** Formate des m² pour l'affichage francais. */
export function fmtM2(m2) {
  return m2.toFixed(2).replace('.', ',') + ' m²';
}

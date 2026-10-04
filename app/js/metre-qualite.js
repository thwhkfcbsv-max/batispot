// Qualité d'une image du film (03/10/2026, axe 3 : « guider pendant le film,
// pas seulement compter »). Une image floue entre dans le calcul et tire les
// murs : on la détecte à la capture (variance du laplacien sur l'image en gris,
// sous-échantillonnée) et on la jette, avec une consigne « ralentissez ».
// Calculs purs, testables.

/**
 * Netteté d'une image RGBA : variance du laplacien sur la luminance, calculée
 * sur une grille de `pas` pixels pour rester rapide (≈ 1280×720 / 16 = 58 000
 * points). Rend un score ≥ 0 ; plus il est haut, plus l'image est nette.
 */
export function nettete(pixels, largeur, hauteur, pas = 4) {
  const lum = (x, y) => { const i = (y * largeur + x) * 4; return 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]; };
  let somme = 0, somme2 = 0, n = 0;
  for (let y = pas; y < hauteur - pas; y += pas) {
    for (let x = pas; x < largeur - pas; x += pas) {
      const l = 4 * lum(x, y) - lum(x - pas, y) - lum(x + pas, y) - lum(x, y - pas) - lum(x, y + pas);
      somme += l; somme2 += l * l; n++;
    }
  }
  if (!n) return 0;
  const m = somme / n;
  return somme2 / n - m * m;
}

/** Seuil de flou : en dessous de `seuil` (variance du laplacien), l'image est jetée. */
export function estFloue(score, seuil = 60) { return score < seuil; }

/**
 * Conseils de capture à partir de ce qu'on a accumulé : rend une liste de
 * phrases courtes (vide = tout va bien). `etat` :
 *   distanceMediane : distance médiane (m) des derniers points au sol projetés
 *   plafondRecent   : nombre de pixels mur/plafond vus dans les dernières images
 *   solComplet      : la passe du sol est faite (couverture sol pleine)
 *   flouesRecentes  : images jetées pour flou dans les dernières secondes
 */
export function conseils(etat) {
  const out = [];
  if (etat.flouesRecentes >= 2) out.push('Image floue : ralentissez le mouvement.');
  if (etat.distanceMediane != null && etat.distanceMediane > 4) out.push('Mur vu de trop loin : approchez-vous à 2 ou 3 m.');
  if (etat.solComplet && etat.plafondRecent === 0) out.push('Levez le téléphone : filmez la ligne où les murs rencontrent le plafond.');
  return out;
}

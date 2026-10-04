// Les consignes pendant le film, et le diagnostic quand le film ne donne pas de cotes
// (04/10/2026, après le 1er diagnostic de nuit sur le A57 : « les consignes à l'écran ne
// sont pas claires, on ne sait pas ce qui est pris en compte, aucun guidage », et
// « Terminer » qui répondait « Trop peu de points » sans dire quoi faire).
//
// Deux règles de l'étude du 03/10 (RoomPlan, Polycam, NN/g : « scattered dots confuse »,
// « one instruction at a time ») :
//   - UN seul message à la fois, choisi par PRIORITÉ ;
//   - impératif, court (4 mots quand c'est possible), et jamais « rien » : quand tout va
//     bien, une phrase de progression.
// Aucune technique nommée à l'écran ([[feedback_batispot_ne_pas_devoiler_la_technique]]).
//
// Fonctions PURES : l'écran passe un état, elles rendent une phrase. `node --test`.

/** Part d'images floues au-delà de laquelle on le dit tout de suite. */
export const PART_FLOUES = 0.40;
/** Vitesse de rotation du téléphone (degrés par seconde) au-delà de laquelle ça traîne. */
export const VITESSE_MAX = 70;
/** Luminance moyenne (0-255) en dessous de laquelle la pièce est trop sombre. */
export const LUMINANCE_MIN = 45;
/** Images segmentées d'affilée sans la moindre frontière sol/mur. */
export const SANS_FRONTIERE_MAX = 5;

/**
 * La consigne à afficher pendant le film. Rend { cle, texte } — `cle` sert aux tests et
 * au journal, `texte` est ce que l'artisan lit.
 *
 * `etat` :
 *   imagesRecentes  images examinées dans les dernières secondes (floues comprises)
 *   flouesRecentes  parmi elles, celles jetées pour flou
 *   vitesseAng      vitesse de rotation du téléphone, degrés/s
 *   luminance       luminance moyenne de la dernière image (0-255), ou null
 *   sansFrontiere   images d'affilée sans frontière sol/mur
 *   sansHitMs       temps (ms) sans aucune surface sous le réticule
 *   distance        distance médiane des derniers points au sol (m), ou null
 *   tangage         inclinaison du regard (radians, < 0 = vers le sol), ou null
 *   solComplet      le tour du sol est fait
 *   plafondRecent   pixels de ligne de plafond vus dans les dernières images
 *   images          images gardées depuis le début du film
 *   pieceFermee     la pièce est fermée
 *   murs            murs reconnus
 */
export function choisirConsigne(etat = {}) {
  const vues = etat.imagesRecentes || 0;
  const partFloues = vues >= 3 ? (etat.flouesRecentes || 0) / vues : 0;
  const images = etat.images || 0;
  // (04/10, film de 04h50 : le moteur n'a pas démarré et l'écran n'en disait rien) Le premier
  // message, avant tous les autres : si la reconnaissance est en panne, aucune consigne de geste
  // n'y changera rien.
  if (etat.segmenteurKo) return { cle: 'moteur', texte: 'Reconnaissance en panne : rouvrez l\'application.' };
  if (partFloues > PART_FLOUES) return { cle: 'floues', texte: 'Plus de lumière, plus lentement.' };
  if ((etat.vitesseAng || 0) > VITESSE_MAX) return { cle: 'vitesse', texte: 'Ralentissez.' };
  if (etat.luminance != null && etat.luminance < LUMINANCE_MIN) return { cle: 'lumiere', texte: 'Allumez la lumière.' };
  if ((etat.sansFrontiere || 0) >= SANS_FRONTIERE_MAX) return { cle: 'pied_des_murs', texte: 'Montrez le pied des murs.' };
  if (etat.tangage != null && etat.tangage > -0.12 && !etat.solComplet && images > 3) return { cle: 'baissez', texte: 'Baissez le téléphone.' };
  if (etat.solComplet && (etat.plafondRecent || 0) === 0 && images > 6) return { cle: 'levez', texte: 'Levez vers le plafond.' };
  if ((etat.sansHitMs || 0) > 4000) return { cle: 'sans_relief', texte: 'Visez une plinthe, un meuble.' };
  if (etat.distance != null && etat.distance < 0.8) return { cle: 'eloignez', texte: 'Éloignez-vous du mur.' };
  if (etat.distance != null && etat.distance > 4) return { cle: 'approchez', texte: 'Approchez-vous du mur.' };
  if (etat.pieceFermee) return { cle: 'fermee', texte: 'Pièce fermée. Vous pouvez arrêter.' };
  if ((etat.murs || 0) >= 1) return { cle: 'progression', texte: 'Continuez le tour.' };
  if (images >= 1) return { cle: 'progression', texte: 'Continuez le tour, lentement.' };
  return { cle: 'demarrage', texte: 'Tournez lentement sur vous-même.' };
}

/**
 * La ligne de progression, à côté de la jauge : où l'artisan en est, en mots simples.
 * `tourPct` = part de la pièce balayée (0-100).
 */
export function texteProgression({ tourPct = 0, murs = 0, pieceFermee = false, secteursVus = null, secteurs = 12 } = {}) {
  // (04/10, Moctar : « tu ne peux pas savoir en amont combien il reste à faire d'une pièce »)
  // Un POURCENTAGE DE PIÈCE est une invention : sa forme est inconnue tant qu'elle n'est pas
  // fermée. Le seul fait connu d'avance, c'est le tour — 360°, découpé en douze secteurs. On
  // dit donc ce qu'on a regardé, pas ce qu'il resterait à mesurer.
  if (pieceFermee) return 'Pièce fermée';
  // (04/10, Moctar : « pourquoi j'ai 12 directions sur 12 ? tu peux pas savoir à l'avance non
  // plus ») Le tour balayé est DÉJÀ montré par le radar ; l'écrire en chiffres laissait croire
  // que c'était fini alors qu'aucun mur n'était reconnu. On n'écrit donc que ce qui est acquis :
  // les murs. Rien tant qu'il n'y en a pas — la consigne du haut dit quoi faire.
  if (murs >= 1) return `${murs} mur${murs > 1 ? 's' : ''} reconnu${murs > 1 ? 's' : ''}`;
  return '';
}

const majuscule = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * Pourquoi ce film n'a pas donné de cotes, et quoi faire — à la place de l'ancien
 * « Trop peu de points », qui ne disait rien à l'artisan.
 *
 * `fiche` : images (gardées), floues (jetées), avecFrontiere (images où le pied des murs
 * a été vu), dureeS (durée du film en secondes), segmentation (false = indisponible).
 */
export function diagnosticFilm(fiche = {}) {
  if (fiche.segmentation === false) {
    return 'La reconnaissance des murs n\'a pas pu démarrer sur ce téléphone : le film est gardé, sans cotes.';
  }
  const gardees = fiche.images || 0, floues = fiche.floues || 0, vues = gardees + floues;
  const avecFrontiere = fiche.avecFrontiere || 0;
  const duree = Math.round(fiche.dureeS || 0);
  if (vues === 0) {
    return 'Aucune image n\'a été gardée pendant le film : ce téléphone ne donne pas l\'image de la caméra à l\'application.';
  }
  const constats = [], conseils = [];
  if (floues && floues / vues >= 0.3) {
    constats.push(`${floues} image${floues > 1 ? 's' : ''} sur ${vues} étaient floues`);
    conseils.push('plus de lumière', 'tournez plus lentement');
  }
  if (avecFrontiere === 0) {
    constats.push('le pied des murs n\'apparaît sur aucune image');
    conseils.push('montrez le pied des murs');
  } else if (avecFrontiere < 8) {
    constats.push(`le pied des murs n\'apparaît que sur ${avecFrontiere} image${avecFrontiere > 1 ? 's' : ''}`);
    conseils.push('gardez le pied des murs dans l\'image');
  }
  if (duree && duree < 20) {
    constats.push(`le film a duré ${duree} s`);
    conseils.push('faites le tour complet de la pièce');
  }
  if (!constats.length) {
    constats.push(`${gardees} image${gardees > 1 ? 's' : ''} gardée${gardees > 1 ? 's' : ''} sur ${vues}`);
    conseils.push('refaites le tour lentement, le pied des murs dans l\'image');
  }
  const uniques = [...new Set(conseils)];
  const fin = uniques.length > 1 ? uniques.slice(0, -1).join(', ') + ', et ' + uniques[uniques.length - 1] : uniques[0];
  return `${majuscule(constats.join(', '))} : ${fin}.`;
}

/** Au bout de combien de temps sans film commencé la caméra se met en veille (3 minutes). */
export const VEILLE_MS = 180000;

/**
 * La caméra doit-elle se mettre en veille ? (04/10/2026 : le module laissé ouvert fait chauffer
 * le téléphone — la caméra, la reconnaissance et le rendu tournent pour rien.) On ne coupe que
 * si RIEN n'a commencé : pas de film, aucune image gardée, aucun angle posé.
 */
export function enVeille({ filmActif = false, images = 0, points = 0, inactifMs = 0, limiteMs = VEILLE_MS } = {}) {
  if (filmActif || images > 0 || points > 0) return false;
  return inactifMs >= limiteMs;
}


/**
 * Une icône par consigne (04/10) : l'artisan reconnaît le geste avant d'avoir lu. Traits seuls,
 * 24×24, même épaisseur partout. Rendu : `d.split(' M')` → un <path> par sous-chemin.
 */
export const ICONES = {
  floues:        'M12 4v2 M12 18v2 M4 12h2 M18 12h2 M6.5 6.5l1.4 1.4 M16.1 16.1l1.4 1.4 M6.5 17.5l1.4-1.4 M16.1 7.9l1.4-1.4 M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 100-7',
  lumiere:       'M12 4v2 M12 18v2 M4 12h2 M18 12h2 M6.5 6.5l1.4 1.4 M16.1 16.1l1.4 1.4 M6.5 17.5l1.4-1.4 M16.1 7.9l1.4-1.4 M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 100-7',
  vitesse:       'M4.5 17a8 8 0 1115 0 M12 16l-3.5-4.5',
  pied_des_murs: 'M3.5 18.5h17 M7 18.5V6.5 M7 6.5h9',
  baissez:       'M12 5.5v11 M7.5 12l4.5 4.5 4.5-4.5 M4.5 20h15',
  levez:         'M12 18.5v-11 M7.5 12l4.5-4.5 4.5 4.5 M4.5 4h15',
  sans_relief:   'M12 4.5v3 M12 16.5v3 M4.5 12h3 M16.5 12h3 M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 100-7',
  eloignez:      'M12 5v14 M8.5 8.5L5 12l3.5 3.5 M15.5 8.5L19 12l-3.5 3.5',
  approchez:     'M12 5v14 M4.5 8.5L8 12l-3.5 3.5 M19.5 8.5L16 12l3.5 3.5',
  fermee:        'M5 12.5l4.5 4.5L19 7',
  moteur:        'M12 8.5v5 M12 16.5v.6 M10.3 4.3L2.6 18a1.6 1.6 0 001.4 2.4h16a1.6 1.6 0 001.4-2.4L13.7 4.3a1.6 1.6 0 00-2.8 0',
  progression:   'M19.5 12a7.5 7.5 0 11-2.2-5.3 M19.5 4v4h-4',
  demarrage:     'M19.5 12a7.5 7.5 0 11-2.2-5.3 M19.5 4v4h-4',
};

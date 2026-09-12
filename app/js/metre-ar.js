// Releve d'une piece : capture, normalisation, et passage au devis.
//
// TROIS METHODES, UN SEUL FORMAT DE SORTIE
//   1. balayage 3D (RoomPlan)  — iPhone Pro avec LiDAR. Murs, portes, fenetres
//      et ouvertures reconnus automatiquement. C'est la methode complete.
//   2. points au sol (ARKit)   — tout iPhone depuis le 6s, et Chrome Android
//      via WebXR. L'artisan pose les coins ; on en deduit le polygone.
//   3. photo + repere A4       — dernier recours, sans AR du tout.
//
// Le reste de l'appli ne doit JAMAIS savoir laquelle a tourne : elle recoit
// toujours un objet `releve` de meme forme, avec un champ `source` et un champ
// `fiabilite` pour que l'assistant puisse le dire honnetement a l'artisan.

import { aireAuSol, perimetreAuSol, distanceAuSol, surfaceMurs } from './metre-geometrie.js';

const HSP_DEFAUT = 2.5;   // hauteur sous plafond supposee, a CONFIRMER par l'artisan

/**
 * Le plugin natif, si on tourne dans l'enveloppe Capacitor.
 *
 * `Capacitor.registerPlugin` est la voie actuelle ; `Capacitor.Plugins.X` est
 * l'ancienne, qui n'est plus garantie peuplee. On tente la bonne d'abord et on
 * garde l'ancienne en secours, sans jamais laisser une exception remonter :
 * hors application native, ce module doit simplement rendre null.
 */
let _plugin;
function pluginNatif() {
  if (_plugin !== undefined) return _plugin;
  const C = globalThis.Capacitor;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) {
    _plugin = null;
    return _plugin;
  }
  try {
    _plugin = typeof C.registerPlugin === 'function'
      ? C.registerPlugin('MetreAR')
      : ((C.Plugins && C.Plugins.MetreAR) || null);
  } catch (_) {
    _plugin = (C.Plugins && C.Plugins.MetreAR) || null;
  }
  return _plugin;
}

/**
 * Ce que sait faire CET appareil. A appeler avant d'afficher un bouton :
 * on ne propose jamais un balayage a un telephone qui ne peut pas le faire.
 * @returns {Promise<{methode:string, balayage3d:boolean, libelle:string}>}
 */
export async function capacitesMetre() {
  const p = pluginNatif();
  if (p) {
    try {
      const c = await p.capacites();
      return {
        methode: c.methode,
        balayage3d: !!c.balayage3d,
        libelle: c.balayage3d
          ? 'Balayage 3D de la piece'
          : (c.methode === 'points' ? 'Metre par points au sol' : 'Non disponible sur cet appareil'),
      };
    } catch (_) { /* on retombe sur le web */ }
  }
  let xr = false;
  try {
    xr = !!(navigator.xr && await navigator.xr.isSessionSupported('immersive-ar'));
  } catch (_) { xr = false; }
  return xr
    ? { methode: 'points', balayage3d: false, libelle: 'Metre par points au sol' }
    : { methode: 'photo', balayage3d: false, libelle: 'Mesure par photo avec une feuille A4' };
}

/**
 * Lance le releve natif et rend un objet normalise.
 * @param {{mode?:'points'}} [options]
 * @returns {Promise<object|null>} null si l'artisan a annule
 */
export async function releverPiece(options = {}) {
  const p = pluginNatif();
  if (!p) throw new Error('Le metre AR demande l\'application installee.');
  const brut = await p.relever(options.mode ? { mode: options.mode } : {});
  if (!brut || brut.annule) return null;
  return brut.source === 'roomplan' ? normaliserBalayage(brut) : normaliserPoints(brut);
}

// ---------------------------------------------------------------- normalisation

function normaliserBalayage(b) {
  const hsp = b.hauteurSousPlafond || null;
  const murs = (b.murs || []).map((m) => ({
    numero: m.numero,
    longueur: m.largeur,
    hauteur: m.hauteur,
    surface: m.largeur * m.hauteur,
    fiabilite: m.fiabilite,
  }));
  const ouvertures = []
    .concat(b.portes || [], b.fenetres || [], b.ouvertures || [])
    .map((o) => ({
      genre: o.genre, largeur: o.largeur, hauteur: o.hauteur,
      surface: o.largeur * o.hauteur,
    }));
  // Perimetre : la somme des longueurs de murs. RoomPlan rend chaque mur
  // separement, on ne recalcule pas de polygone.
  const perimetre = murs.reduce((s, m) => s + m.longueur, 0);
  return {
    source: 'balayage3d',
    segments: (b.murs || []).map((m) => ({   // pour tracer le plan
      x: m.x, z: m.z, dirX: m.dirX, dirZ: m.dirZ, longueur: m.largeur,
    })),
    fiabilite: 'mesure',           // LiDAR : c'est mesure, pas estime
    surfaceSol: b.surfaceSol || null,
    perimetre,
    hauteurSousPlafond: hsp,
    hauteurSupposee: !hsp,
    murs,
    ouvertures,
    surfaceMurs: b.surfaceMurs || null,
    surfaceMursNette: b.surfaceMursNette || null,
  };
}

function normaliserPoints(b) {
  const pts = b.points || [];
  const aire = aireAuSol(pts);
  const perim = perimetreAuSol(pts);
  const hsp = b.hauteurSousPlafond || null;
  const h = hsp || HSP_DEFAUT;
  // Chaque cote du polygone est un mur.
  const murs = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const l = distanceAuSol(p, q);
    return { numero: i + 1, longueur: l, hauteur: h, surface: l * h, fiabilite: 'moyenne' };
  });
  return {
    source: 'points',
    points: pts,                    // conserves : le plan 2D se dessine avec
    // Le suivi qui decroche est la seule cause connue d'erreur grossiere :
    // on le remonte pour que l'assistant propose de recommencer.
    fiabilite: b.suiviPerdu ? 'douteuse' : 'mesure',
    surfaceSol: aire,
    perimetre: perim,
    hauteurSousPlafond: hsp,
    hauteurSupposee: !hsp,
    murs,
    ouvertures: [],                 // le mode points ne detecte pas les ouvertures
    surfaceMurs: surfaceMurs(perim, h),
    surfaceMursNette: surfaceMurs(perim, h),
  };
}

// ------------------------------------------------------- reconstruction en devis

/**
 * Traduit un releve en lignes de devis, SANS AUCUN PRIX.
 *
 * C'est la regle qui tient depuis le debut : les quantites relevent de la
 * physique et se calculent, les prix relevent du commerce et n'appartiennent
 * qu'a l'artisan. On remplit les quantites et les unites ; les prix viennent de
 * ses devis passes ou de sa saisie.
 *
 * @param {object} releve
 * @param {string[]} travaux  ex. ['peinture_murs','peinture_plafond','carrelage_sol','plinthes']
 * @returns {{lignes:object[], hypotheses:string[]}}
 */
export function releveVersDevis(releve, travaux = []) {
  const L = [];
  const hyp = [];
  const sol = releve.surfaceSol;
  const murs = releve.surfaceMursNette || releve.surfaceMurs;

  if (releve.hauteurSupposee) {
    hyp.push(`Hauteur sous plafond supposee a ${HSP_DEFAUT.toFixed(2)} m — a confirmer.`);
  }
  if (releve.source === 'points' && releve.ouvertures.length === 0) {
    hyp.push('Portes et fenetres non deduites : le metre par points ne les detecte pas.');
  }
  if (releve.fiabilite === 'douteuse') {
    hyp.push('Le suivi a decroche pendant la mesure — verifier les cotes avant d\'envoyer.');
  }

  const ajoute = (cle, designation, quantite, unite) => {
    if (!travaux.includes(cle) || !quantite || quantite <= 0) return;
    L.push({ designation, quantite: Math.round(quantite * 100) / 100, unite, origine: 'releve' });
  };

  ajoute('peinture_murs',    'Peinture murs (deux couches)',            murs, 'm2');
  ajoute('peinture_plafond', 'Peinture plafond (deux couches)',         sol,  'm2');
  ajoute('enduit_murs',      'Enduit de lissage sur murs',              murs, 'm2');
  ajoute('doublage',         'Doublage isolant sur murs',               murs, 'm2');
  ajoute('faience',          'Faience murale',                          murs, 'm2');
  ajoute('carrelage_sol',    'Carrelage au sol, pose comprise',         sol,  'm2');
  ajoute('parquet',          'Parquet, pose comprise',                  sol,  'm2');
  ajoute('ragreage',         'Ragreage du sol',                         sol,  'm2');
  ajoute('chape',            'Chape',                                   sol,  'm2');
  ajoute('depose_sol',       'Depose du revetement de sol existant',    sol,  'm2');

  if (travaux.includes('plinthes')) {
    // On retire la largeur des portes : on ne pose pas de plinthe dans une porte.
    // Une baie libre (passage sans battant) ne recoit pas plus de plinthe
    // qu'une porte : RoomPlan les distingue, le chiffrage ne doit pas.
    const passages = releve.ouvertures.filter(
      (o) => o.genre === 'porte' || o.genre === 'ouverture');
    const l = releve.perimetre - passages.reduce((s, o) => s + o.largeur, 0);
    if (passages.length === 0 && releve.source === 'points') {
      hyp.push('Plinthes calculees sur le perimetre entier : les portes n\'ont pas ete relevees.');
    }
    ajoute('plinthes', 'Plinthes', l, 'ml');
  }

  return { lignes: L, hypotheses: hyp };
}

/**
 * Le resume que l'assistant lit a l'artisan avant de poser ses questions.
 * Court : trois chiffres et les reserves, pas un rapport.
 */
export function resumeParle(releve) {
  const n = (v, u) => (v == null ? null : `${v.toFixed(2).replace('.', ',')} ${u}`);
  const bouts = [];
  if (releve.surfaceSol) bouts.push(`${n(releve.surfaceSol, 'm2')} au sol`);
  if (releve.perimetre) bouts.push(`${n(releve.perimetre, 'm')} de perimetre`);
  if (releve.hauteurSousPlafond) bouts.push(`${n(releve.hauteurSousPlafond, 'm')} sous plafond`);
  const ouv = releve.ouvertures.length;
  if (ouv) bouts.push(`${ouv} ouverture${ouv > 1 ? 's' : ''} detectee${ouv > 1 ? 's' : ''}`);
  return bouts.join(', ');
}

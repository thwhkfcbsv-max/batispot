// Métré de toiture depuis l'adresse (13/09/2026).
//
// Un couvreur ne monte pas sur le toit pour le mesurer, et aucun téléphone ne
// voit un versant depuis le sol. L'emprise du bâtiment, elle, est publique :
// la BD TOPO de l'IGN rend le polygone et sa hauteur, gratuitement, sans clé,
// et le navigateur peut l'appeler directement (CORS ouvert, vérifié le 13/09).
// Le reste est le calcul du métier : surface = emprise / cos(pente).
//
// Deux limites, à toujours dire à l'artisan : l'IGN donne l'emprise, JAMAIS
// la pente — c'est lui qui la donne, et le résultat en dépend ; et un
// bâtiment très récent peut manquer dans la base.
//
// ⚠️ La BBOX du WFS se donne en lon,lat malgré EPSG:4326 (vérifié : en
// lat,lon la requête rend zéro bâtiment, sans erreur).

const BAN = 'https://api-adresse.data.gouv.fr/search/';
const WFS = 'https://data.geopf.fr/wfs/ows';

/** Une adresse → { lon, lat, label }, ou null si la BAN ne la reconnaît pas. */
export async function geocoder(adresse) {
  const r = await fetch(`${BAN}?q=${encodeURIComponent(adresse)}&limit=1`);
  if (!r.ok) throw new Error('Le service d\'adresses ne répond pas.');
  const j = await r.json();
  const f = j.features && j.features[0];
  if (!f || (f.properties.score || 0) < 0.4) return null;
  return { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], label: f.properties.label };
}

// Projection locale en mètres autour du point : suffisante à l'échelle d'un
// bâtiment (erreur < 0,1 %), et elle donne des x,z directement utilisables par
// metre-plan.js pour dessiner l'emprise cotée.
function projecteur(lon0, lat0) {
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const kz = 110540;
  return ([lon, lat]) => ({ x: (lon - lon0) * kx, z: -(lat - lat0) * kz });
}

function aireLacet(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += a.x * b.z - b.x * a.z;
  }
  return Math.abs(s) / 2;
}

function perimetre(pts) {
  let p = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    p += Math.hypot(b.x - a.x, b.z - a.z);
  }
  return p;
}

/**
 * Les bâtiments autour d'un point, du plus proche au plus lointain.
 * Chacun : aire (m²), longueur (plus grand côté), largeur (aire / longueur),
 * hauteur IGN, usage, distance au point, et les points en mètres.
 */
export async function batimentsAutour(lon, lat, rayonM = 45) {
  const dLat = rayonM / 110540;
  const dLon = rayonM / (111320 * Math.cos((lat * Math.PI) / 180));
  const bbox = `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat},EPSG:4326`;
  const u = `${WFS}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=BDTOPO_V3:batiment`
          + `&COUNT=12&SRSNAME=EPSG:4326&OUTPUTFORMAT=application/json&BBOX=${bbox}`;
  const r = await fetch(u);
  if (!r.ok) throw new Error('La base des bâtiments de l\'IGN ne répond pas.');
  const j = await r.json();
  const proj = projecteur(lon, lat);
  const out = [];
  for (const f of j.features || []) {
    const g = f.geometry;
    const anneau = g.type === 'MultiPolygon' ? g.coordinates[0][0] : g.coordinates[0];
    if (!anneau || anneau.length < 4) continue;
    const pts = anneau.slice(0, -1).map(proj);
    const aire = aireLacet(pts);
    if (aire < 8) continue;                       // un appentis, une cabane
    let longueur = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      longueur = Math.max(longueur, Math.hypot(b.x - a.x, b.z - a.z));
    }
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;
    out.push({
      aire: +aire.toFixed(1),
      longueur: +longueur.toFixed(2),
      largeur: +(aire / longueur).toFixed(2),
      perimetre: +perimetre(pts).toFixed(2),
      hauteur: f.properties.hauteur ?? null,
      usage: f.properties.usage_1 || null,
      distance: +Math.hypot(cx, cz).toFixed(1),
      points: pts.map((p) => ({ x: +p.x.toFixed(2), y: 0, z: +p.z.toFixed(2) })),
    });
  }
  return out.sort((a, b) => a.distance - b.distance);
}

// Unités par m² : ordres de grandeur du métier, pas des prix. L'artisan
// corrige selon son fournisseur et son pureau.
export const MATERIAUX = {
  ardoise:         { libelle: 'Ardoise 32 × 22',   parM2: 22, unite: 'ardoises', entraxe: 0.27 },
  tuile_mecanique: { libelle: 'Tuile mécanique',   parM2: 13, unite: 'tuiles',   entraxe: 0.35 },
  tuile_plate:     { libelle: 'Tuile plate',       parM2: 60, unite: 'tuiles',   entraxe: 0.12 },
  tuile_canal:     { libelle: 'Tuile canal',       parM2: 40, unite: 'tuiles',   entraxe: 0 },
  zinc:            { libelle: 'Zinc à joint debout', parM2: 0, unite: '',        entraxe: 0 },
  bac_acier:       { libelle: 'Bac acier',         parM2: 0,  unite: '',         entraxe: 0 },
};

export const FORMES = { '2_pans': 'deux pans', '4_pans': 'quatre pans', '1_pan': 'un pan' };

/**
 * Le calcul du métier. Tout part de l'emprise et de la pente ; on rend aussi
 * la formule en clair, pour que l'artisan puisse la refaire de tête.
 */
export function calculerToiture({ aire, longueur, largeur, perimetre, forme = '2_pans', penteDeg, materiau = 'ardoise', debord = 0 }) {
  // Le débord : l'IGN donne la ligne des MURS, le toit dépasse de 30 à 50 cm
  // de chaque côté. Sans lui, la surface est sous-estimée de 10 à 17 %.
  // Décaler un polygone de d vers l'extérieur ajoute P·d + π·d² à son aire —
  // exact quelle que soit la forme. Longueur et largeur prennent 2d.
  const d = Math.max(0, Number(debord) || 0);
  const aireMurs = aire;
  if (d > 0) {
    const P = perimetre || 2 * (longueur + largeur);
    aire = aire + P * d + Math.PI * d * d;
    longueur = longueur + 2 * d;
    largeur = largeur + 2 * d;
  }
  const rad = (penteDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const surface = aire / cos;
  const mat = MATERIAUX[materiau] || MATERIAUX.ardoise;
  let rampant, faitage, egout, rives, aretiers = 0;

  if (forme === '1_pan') {
    rampant = largeur / cos;
    faitage = longueur;                 // l'arête haute
    egout = longueur;
    rives = 2 * rampant;
  } else if (forme === '4_pans') {
    rampant = (largeur / 2) / cos;
    faitage = Math.max(longueur - largeur, 0);
    egout = 2 * (longueur + largeur);
    rives = 0;
    aretiers = 4 * Math.hypot(rampant, largeur / 2);
  } else {                              // deux pans
    rampant = (largeur / 2) / cos;
    faitage = longueur;
    egout = 2 * longueur;
    rives = 4 * rampant;
  }

  const unites = mat.parM2 ? Math.round(surface * mat.parM2) : 0;
  const liteaux = mat.entraxe ? Math.round(surface / mat.entraxe) : 0;
  const moins5 = aire / Math.cos(((penteDeg - 5) * Math.PI) / 180);

  return {
    surface: +surface.toFixed(1),
    rampant: +rampant.toFixed(2),
    faitage: +faitage.toFixed(2),
    egout: +egout.toFixed(2),
    rives: +rives.toFixed(2),
    aretiers: +aretiers.toFixed(2),
    unites, uniteLibelle: mat.unite, materiau: mat.libelle,
    liteaux,
    penteDeg, pentePct: Math.round(Math.tan(rad) * 100),
    forme: FORMES[forme] || FORMES['2_pans'],
    debord: d, aireMurs: +aireMurs.toFixed(1), aireToit: +aire.toFixed(1),
    formule: (d > 0 ? `${aireMurs.toFixed(1).replace('.', ',')} m² d'emprise + débord ${d.toFixed(2).replace('.', ',')} m = ${aire.toFixed(1).replace('.', ',')} m², ` : `${aire.toFixed(1).replace('.', ',')} m² d'emprise `)
           + `÷ cos ${penteDeg}° = ${surface.toFixed(1).replace('.', ',')} m²`,
    surfaceSiMoins5: +moins5.toFixed(1),
  };
}

const fr = (n, d = 2) => Number(n).toFixed(d).replace('.', ',');

/**
 * Comment c'est calculé, en clair — pour le couvreur qui demande (Moctar,
 * 13/09 : « il faudra que tu puisses expliquer comment tu calcules »). Chaque
 * ligne donne la formule ET les nombres : il doit pouvoir la refaire de tête.
 */
export function expliquer(b, t) {
  const f = (n, d = 2) => Number(n).toFixed(d).replace('.', ',');
  const cos = Math.cos((t.penteDeg * Math.PI) / 180);
  const l = [
    `Emprise au sol : ${f(b.aire, 1)} m², c'est le contour des MURS dans la base de l'IGN (BD TOPO), en projection métrique. Plus grand côté ${f(b.longueur)} m, largeur ${f(b.largeur)} m (= aire ÷ longueur, exact pour un rectangle).`,
    t.debord > 0
      ? `Débord de ${f(t.debord)} m tout autour : le toit couvre ${f(t.aireToit, 1)} m² au sol (emprise + périmètre × débord + π × débord²).`
      : `Aucun débord compté : le toit est supposé s'arrêter au nu des murs. Avec 0,40 m de débord il couvrirait environ ${f(b.aire + (b.perimetre || 2 * (b.longueur + b.largeur)) * 0.4, 1)} m² au sol.`,
    `Surface de couverture = surface au sol ÷ cos(pente) : ${f(t.aireToit, 1)} ÷ cos ${t.penteDeg}° = ${f(t.aireToit, 1)} ÷ ${f(cos, 3)} = ${f(t.surface, 1)} m². Un toit à ${t.penteDeg}° fait ${f(1 / cos)} fois sa surface au sol.`,
    `Rampant (du faîtage à l'égout) = demi-largeur ÷ cos(pente) : ${f((b.largeur + 2 * t.debord) / 2)} ÷ ${f(cos, 3)} = ${f(t.rampant)} m.`,
  ];
  if (t.forme === 'deux pans') l.push(`Deux pans : faîtage = longueur ${f(t.faitage)} m ; égout = 2 × longueur = ${f(t.egout)} m ; rives = 4 rampants = ${f(t.rives)} m.`);
  else if (t.forme === 'quatre pans') l.push(`Quatre pans : faîtage = longueur − largeur = ${f(t.faitage)} m ; égout = périmètre = ${f(t.egout)} m ; arêtiers = 4 × √(rampant² + (largeur/2)²) = ${f(t.aretiers)} m.`);
  else l.push(`Un pan : rampant = largeur ÷ cos(pente) ; faîtage et égout = longueur ${f(t.faitage)} m ; rives = 2 rampants = ${f(t.rives)} m.`);
  if (t.unites) l.push(`${t.materiau} : ${t.unites.toLocaleString('fr-FR')} ${t.uniteLibelle}, à raison de ${Math.round(t.unites / t.surface)} au m² — c'est un ordre de grandeur, le pureau réel dépend de la pente et de l'exposition.`);
  l.push(`Ce que ce calcul NE sait pas : les décrochés de plan (les linéaires supposent un rectangle — ${b.points && b.points.length > 6 ? 'et ce bâtiment a ' + b.points.length + ' côtés, vérifiez faîtage et rives' : 'celui-ci en a ' + ((b.points && b.points.length) || 4)}), les noues et les lucarnes, et la précision de l'IGN (~1 m). C'est un pré-chiffrage depuis la camionnette, à confirmer sur place.`);
  return l.join('\n');
}

/** Une phrase, pour l'assistant. */
export function resumeParle(t) {
  const parts = [`${fr(t.surface, 1)} m² de couverture`, `${fr(t.faitage)} m de faîtage`, `${fr(t.egout)} m d'égout`];
  if (t.rives) parts.push(`${fr(t.rives)} m de rives`);
  if (t.aretiers) parts.push(`${fr(t.aretiers)} m d'arêtiers`);
  if (t.unites) parts.push(`environ ${t.unites.toLocaleString('fr-FR')} ${t.uniteLibelle}`);
  return parts.join(', ');
}

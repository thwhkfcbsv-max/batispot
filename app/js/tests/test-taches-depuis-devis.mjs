// Test de non-régression : « mettre un chantier au planning » doit produire des TÂCHES.
//
// Le bug d'origine (01/09/2026) : planifier_depuis_devis écrivait chantiers.date_debut,
// mais la vue journée (bsChargerJournee) ne lit QUE la table `taches`. Résultat : la date
// était bien enregistrée et le calendrier affichait « Rien de planifié ». Zéro tâche en base
// pour le chantier daté.
//
// Lancer :  node app/js/tests/test-taches-depuis-devis.mjs

import { tachesDepuisLignes, ordonnancer, delaiSuggere } from '../app-planning-engine.js';

let echecs = 0;
function verifier(nom, condition, detail) {
  if (condition) { console.log(`  ✅ ${nom}`); }
  else { console.log(`  ❌ ${nom}${detail ? ` — ${detail}` : ''}`); echecs++; }
}

// Les 6 lignes réelles du devis DEV-2026-0002 (Madame Dupont), lues en base le 01/09/2026.
const LIGNES = [
  { lot: 'Lot 01 — Préparation et protection', unit: 'forfait', quantity: 1, total_ht: 150,
    description: "Protection des sols par bâche polyane et feutre de protection, masquage des ouvrants et appareillages" },
  { lot: 'Lot 02 — Peinture', unit: 'm²', quantity: 100, total_ht: 1400,
    description: "Préparation des supports : égrenage, dépoussiérage, rebouchage des imperfections et lissage poncé" },
  { lot: 'Lot 02 — Peinture', unit: 'm²', quantity: 100, total_ht: 650,
    description: "Fourniture et application d'une sous-couche d'impression régulatrice de fond" },
  { lot: 'Lot 02 — Peinture', unit: 'm²', quantity: 100, total_ht: 1600,
    description: "Fourniture et application de peinture de finition acrylique 2 couches (aspect velours ou mat)" },
  { lot: 'Lot 03 — Menuiserie', unit: 'ml', quantity: 100, total_ht: 1500,
    description: "Fourniture et pose de plinthes en bois/médium peintes, y compris coupes d'onglets, collage ou clouage et joint acrylique de finition" },
  { lot: 'Lot 04 — Nettoyage', unit: 'forfait', quantity: 1, total_ht: 120,
    description: "Nettoyage soigné de fin de chantier, repliement des protections et évacuation des déchets" },
];

console.log('\n── Dérivation des tâches depuis les lignes du devis ──');

// Par defaut : la duree vient de la CADENCE appliquee a la quantite, jamais du prix.
const taches = tachesDepuisLignes(LIGNES);
verifier('par défaut, la durée vient de la cadence',
  taches.every((t) => t.duree_source === 'cadence'),
  `obtenu ${taches.map((t) => t.duree_source).join(', ')}`);
verifier('100 m² de sous-couche à 30 m²/h font 3,5 h', taches[2].duree_h === 3.5, `${taches[2].duree_h} h`);
verifier('100 ml de plinthes à 10 ml/h font 10 h', taches[4].duree_h === 10, `${taches[4].duree_h} h`);
verifier('un forfait de protection vaut une demi-journée', taches[0].duree_h === 3.5);
verifier('le chantier entier tient en 35 h, pas en 113',
  taches.reduce((s, t) => s + t.duree_h, 0) === 35,
  `${taches.reduce((s, t) => s + t.duree_h, 0)} h`);

// Un ouvrage inconnu ne recoit PAS de duree inventee.
verifier("un ouvrage non reconnu n'a pas de durée",
  tachesDepuisLignes([{ unit: 'u', quantity: 3, description: 'Prestation inhabituelle' }])[0].duree_h === null);

// Le calcul par le prix reste possible, mais seulement sur demande.
const parPrix = tachesDepuisLignes(LIGNES, { estimerDepuisPrix: true, tauxHoraire: 48 });
verifier('le calcul par le prix reste disponible sur demande',
  parPrix.every((t) => t.duree_source === 'prix'));

verifier('une tâche par ligne de devis', taches.length === 6, `obtenu ${taches.length}`);
verifier("l'ordre du devis est conservé", taches.every((t, i) => t.ordre === i + 1));
verifier('chaque tâche porte un titre non vide', taches.every((t) => t.titre && t.titre.trim().length > 0));
verifier('chaque tâche garde la description complète du devis',
  taches.every((t, i) => t.description === LIGNES[i].description));

// Règle B : durée = montant de la ligne ÷ taux horaire, arrondie au demi-heure.
const attendu = (ht) => Math.max(0.5, Math.round((ht / 48) * 2) / 2);
verifier('sur demande, la durée suit bien le montant et le taux horaire',
  parPrix.every((t, i) => t.duree_h === attendu(LIGNES[i].total_ht)),
  `attendu ${LIGNES.map((l) => attendu(l.total_ht)).join(', ')} — obtenu ${parPrix.map((t) => t.duree_h).join(', ')}`);

verifier('aucune durée nulle ou négative', taches.every((t) => t.duree_h > 0));

console.log('\n── L’artisan garde la main ──');

verifier("chaque tâche porte l'estimation de l'app, à part",
  taches.every((t) => t.duree_estimee_h === t.duree_h));

// L'artisan corrige : la duree retenue change, l'estimation d'origine NON.
const corrigees = taches.map((t, i) => (i === 1 ? { ...t, duree_h: 24 } : t));
const apres = ordonnancer(corrigees, '2026-09-02');
verifier("sa correction est bien prise en compte", apres[1].duree_h === 24);
verifier("notre estimation d'origine survit à sa correction",
  apres[1].duree_estimee_h === 10,
  `estimée ${apres[1].duree_estimee_h} h, retenue ${apres[1].duree_h} h`);
verifier("l'écart reste donc mesurable",
  apres[1].duree_h !== apres[1].duree_estimee_h);

console.log('\n── Délais de séchage repris de l’ordonnanceur ──');

const iSousCouche = 2, iFinition = 3;
verifier('la sous-couche porte un délai de séchage',
  taches[iSousCouche].delai_apres_h === delaiSuggere(LIGNES[iSousCouche].description)
  && taches[iSousCouche].delai_apres_h > 0,
  `obtenu ${taches[iSousCouche].delai_apres_h} h`);
verifier('la protection ne porte aucun délai', taches[0].delai_apres_h === 0);

console.log('\n── Ordonnancement ──');

const planifiees = ordonnancer(taches, '2026-09-02');

verifier('toutes les tâches reçoivent un jour', planifiees.every((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.jour)));
verifier('aucune tâche un samedi ou un dimanche',
  planifiees.every((t) => { const j = new Date(t.jour + 'T12:00:00').getDay(); return j !== 0 && j !== 6; }));
verifier('les jours ne reculent jamais',
  planifiees.every((t, i) => i === 0 || t.jour >= planifiees[i - 1].jour));
verifier('la finition ne tombe pas le même jour que la sous-couche (séchage respecté)',
  planifiees[iFinition].jour > planifiees[iSousCouche].jour,
  `sous-couche ${planifiees[iSousCouche].jour} · finition ${planifiees[iFinition].jour}`);

console.log('\n── Étalement sur plusieurs jours ──');

verifier('chaque tâche porte un jour de fin', planifiees.every((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.jour_fin)));
verifier('le jour de fin n’est jamais avant le jour de début',
  planifiees.every((t) => t.jour_fin >= t.jour));
verifier('aucune fin un samedi ou un dimanche',
  planifiees.every((t) => { const j = new Date(t.jour_fin + 'T12:00:00').getDay(); return j !== 0 && j !== 6; }));
// 29 h a 7 h/jour = plus de 4 jours ouvres : la tache NE PEUT PAS tenir sur un seul jour.
const longue = planifiees[1];
verifier('une tâche de 29 h s’étale sur plusieurs jours',
  longue.jour_fin > longue.jour,
  `du ${longue.jour} au ${longue.jour_fin} pour ${longue.duree_h} h`);
verifier('une tâche courte tient sur un seul jour',
  planifiees[0].jour_fin === planifiees[0].jour);
verifier('la tâche suivante ne démarre pas avant la fin de la précédente',
  planifiees.every((t, i) => i === 0 || t.jour >= planifiees[i - 1].jour_fin));

console.log(`\n  Chantier du ${planifiees[0].jour} au ${planifiees[planifiees.length - 1].jour_fin}`);
console.log('  ' + planifiees.map((t) =>
  `${t.jour}${t.jour_fin !== t.jour ? ' → ' + t.jour_fin : '          '}  ${String(t.duree_h).padStart(5)}h  ${t.titre}`
).join('\n  '));

console.log(echecs === 0 ? '\n✅ Tout passe.\n' : `\n❌ ${echecs} test(s) en échec.\n`);
process.exit(echecs === 0 ? 0 : 1);

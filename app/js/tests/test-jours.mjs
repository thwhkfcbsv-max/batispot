// Trait « aujourd'hui » du déroulement de chantier — jeu de test.
//
// Le bug du 15/09 : une étape au 22 septembre s'affichait sous le titre
// « AUJOURD'HUI » alors qu'on était le 15. Le trait était au bon endroit ;
// il ne portait simplement pas de date, et son style de titre de section
// lui faisait avaler le jour du dessous.
//
// Lancer :  node app/js/tests/test-jours.mjs
import { libelleAujourdhui, poserTraitIci } from '../jours.js';

let echecs = 0;
function verifier(nom, obtenu, attendu) {
  const ok = obtenu === attendu;
  console.log(ok ? `  ✅ ${nom}` : `  ❌ ${nom}\n       attendu : ${attendu}\n       obtenu  : ${obtenu}`);
  if (!ok) echecs++;
}

console.log('\n── Le libellé porte la date ──');
verifier('15 septembre', libelleAujourdhui('2026-09-15'), "aujourd'hui · 15 sept");
verifier('1er janvier',  libelleAujourdhui('2026-01-01'), "aujourd'hui · 1 janv");
verifier('4 mai',        libelleAujourdhui('2026-05-04'), "aujourd'hui · 4 mai");
verifier('31 décembre',  libelleAujourdhui('2026-12-31'), "aujourd'hui · 31 déc");

console.log('\n── Le cas du bug : le libellé ne peut plus se lire comme le jour du dessous ──');
verifier('le 15 ne dit jamais 22', libelleAujourdhui('2026-09-15').includes('22'), false);

console.log('\n── Ce qu’on refuse de deviner ──');
verifier('date vide',    libelleAujourdhui(''),          "aujourd'hui");
verifier('date absente', libelleAujourdhui(null),        "aujourd'hui");
verifier('date illisible', libelleAujourdhui('n’importe quoi'), "aujourd'hui");

console.log('\n── Le trait ne se pose QUE si une étape tombe le jour même ──');
// Le cas exact du 15/09 : chantier peinture, rien le 15, une étape le 22.
const CAS_REEL = ['2026-08-24', '2026-08-29', '2026-08-30', '2026-08-31', '2026-09-22'];
verifier('rien le 15 → aucun trait devant le 22',
  poserTraitIci(CAS_REEL, '2026-09-15', '2026-09-22'), false);
verifier('rien le 15 → aucun trait nulle part',
  CAS_REEL.some((j) => poserTraitIci(CAS_REEL, '2026-09-15', j)), false);

// Une étape tombe le jour même : le trait revient, et il se pose AVANT le
// premier jour à venir — la journée en cours reste au-dessus, elle dure encore.
const AVEC_AUJ = ['2026-09-14', '2026-09-15', '2026-09-22'];
verifier('étape le 15 → trait devant le 22',
  poserTraitIci(AVEC_AUJ, '2026-09-15', '2026-09-22'), true);
verifier('étape le 15 → pas de trait devant le 15 lui-même',
  poserTraitIci(AVEC_AUJ, '2026-09-15', '2026-09-15'), false);
verifier('étape le 15 → pas de trait devant un jour passé',
  poserTraitIci(AVEC_AUJ, '2026-09-15', '2026-09-14'), false);

console.log('\n── Ce qu’on refuse de deviner (placement) ──');
verifier('les étapes sans date ne portent jamais le trait',
  poserTraitIci(AVEC_AUJ, '2026-09-15', 'sans-date'), false);
verifier('liste absente', poserTraitIci(null, '2026-09-15', '2026-09-22'), false);
verifier('chantier vide',  poserTraitIci([], '2026-09-15', '2026-09-22'), false);

console.log(echecs ? `\n${echecs} échec(s)\n` : '\nTout passe.\n');
process.exit(echecs ? 1 : 0);

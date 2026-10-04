// Heures d'intervention — jeu de test.
//
// Une heure fausse au planning envoie un artisan chez un client au mauvais
// moment. Deux familles, la seconde compte autant que la première :
//   1. ce qu'on doit accepter — l'artisan tape « 9h30 », « 9 h 30 », « 09:30 »
//   2. ce qu'on doit REFUSER plutôt que deviner.
//
// Lancer :  node app/js/tests/test-heures.mjs

import { normaliserHeure, heureLisible } from '../heures.js';

let echecs = 0;
function verifier(nom, obtenu, attendu) {
  const ok = obtenu === attendu;
  console.log(ok ? `  ✅ ${nom}` : `  ❌ ${nom}\n       attendu : ${attendu}\n       obtenu  : ${obtenu}`);
  if (!ok) echecs++;
}

console.log('\n── Ce que l’artisan tape ──');
verifier('9',            normaliserHeure('9'),        '09:00');
verifier('9h',           normaliserHeure('9h'),       '09:00');
verifier('9h30',         normaliserHeure('9h30'),     '09:30');
verifier('9 h 30',       normaliserHeure('9 h 30'),   '09:30');
verifier('09:30',        normaliserHeure('09:30'),    '09:30');
verifier('14.15',        normaliserHeure('14.15'),    '14:15');
verifier('minuit',       normaliserHeure('0'),        '00:00');
verifier('23h59',        normaliserHeure('23h59'),    '23:59');

console.log('\n── Ce qui revient de la base (avec les secondes) ──');
verifier('14:15:00',     normaliserHeure('14:15:00'), '14:15');
verifier('08:00:00',     normaliserHeure('08:00:00'), '08:00');

console.log('\n── « À la journée » n’est pas une erreur ──');
verifier('null reste null',      normaliserHeure(null),      null);
verifier('vide reste null',      normaliserHeure(''),        null);
verifier('undefined reste null', normaliserHeure(undefined), null);

console.log('\n── ⚠️ Ce qu’on REFUSE plutôt que de deviner ──');
verifier('25 h n’existe pas',    normaliserHeure('25h'),     null);
verifier('9h70 n’existe pas',    normaliserHeure('9h70'),    null);
verifier('« matin » n’est pas une heure', normaliserHeure('matin'), null);
verifier('« 8-10 » est une plage, pas une heure', normaliserHeure('8-10'), null);
verifier('« 930 » sans séparateur : faute de frappe, pas 9 h 30', normaliserHeure('930'), null);

console.log('\n── Affichage ──');
verifier('pile',        heureLisible('14:00'),    '14 h');
verifier('et demie',    heureLisible('08:30'),    '8 h 30');
verifier('pas de zéro devant', heureLisible('09:00'), '9 h');
verifier('rien à afficher',    heureLisible(null),    '');

console.log(echecs === 0 ? '\n✅ Tout passe.\n' : `\n❌ ${echecs} test(s) en échec.\n`);
process.exit(echecs === 0 ? 0 : 1);

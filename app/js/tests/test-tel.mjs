// Numéros appelables — jeu de test.
//
// Deux familles, et la seconde compte autant que la première :
//   1. ce qu'on doit convertir
//   2. ce qu'on ne doit SURTOUT PAS réécrire — un numéro mal transformé fait
//      appeler quelqu'un d'autre.
//
// Lancer :  node app/js/tests/test-tel.mjs

import { telAppelable, hrefTel, hrefItineraire } from '../tel.js';

let echecs = 0;
function verifier(nom, obtenu, attendu) {
  const ok = obtenu === attendu;
  console.log(ok ? `  ✅ ${nom}` : `  ❌ ${nom}\n       attendu : ${attendu}\n       obtenu  : ${obtenu}`);
  if (!ok) echecs++;
}

console.log('\n── Numéros français, tels que les artisans les écrivent ──');
verifier('espaces',          telAppelable('01 48 57 22 40'), '+33148572240');
verifier('collé',            telAppelable('0148572240'),     '+33148572240');
verifier('points',           telAppelable('06.12.34.56.78'), '+33612345678');
verifier('tirets',           telAppelable('07-89-01-23-45'), '+33789012345');
verifier('mobile',           telAppelable('0612345678'),     '+33612345678');

console.log('\n── Déjà internationaux ──');
verifier('+33 espacé',       telAppelable('+33 1 48 57 22 40'), '+33148572240');
verifier('00 33',            telAppelable('0033148572240'),     '+33148572240');
verifier('33 sans +',        telAppelable('33148572240'),       '+33148572240');
verifier('étranger (+34)',   telAppelable('+34 632 784 012'),   '+34632784012');

console.log('\n── ⚠️ Ce qu’on ne doit PAS réécrire ──');
verifier('vide → rien',              telAppelable(''),           null);
verifier('null → rien',              telAppelable(null),         null);
verifier('undefined → rien',         telAppelable(undefined),    null);
verifier('espaces seuls → rien',     telAppelable('   '),        null);
verifier('texte sans chiffre → rien', telAppelable('me rappeler'), null);
// Format inconnu : on le laisse composable, sans inventer d'indicatif francais.
verifier('numéro court laissé tel quel', telAppelable('3949'),   '3949');
verifier('9 chiffres : pas de +33 deviné', telAppelable('148572240'), '148572240');
// Piège : 10 chiffres commençant par 00 n'est pas un numéro français.
verifier('0012345678 non francise', telAppelable('0012345678'),  '+12345678');

console.log('\n── hrefTel ──');
verifier('href construit',   hrefTel('01 48 57 22 40'), 'tel:+33148572240');
verifier('rien à appeler → null (pas de bouton mort)', hrefTel(''), null);

console.log('\n── hrefItineraire ──');
// Hors iOS (le cas de Node comme d'Android) : geo:, qui laisse le téléphone
// proposer Maps ET Waze.
verifier('adresse → geo:',
  hrefItineraire('12 rue Marceau, 94300 Vincennes'),
  'geo:0,0?q=12%20rue%20Marceau%2C%2094300%20Vincennes');
verifier('espaces autour', hrefItineraire('  8 av. Jean-Jaurès  '), 'geo:0,0?q=8%20av.%20Jean-Jaur%C3%A8s');
// Pas d'adresse = PAS de bouton. Un « Itinéraire » qui n'emmène nulle part
// est exactement le bug du 07/09 (il renvoyait au planning).
verifier('vide → rien',      hrefItineraire(''),        null);
verifier('null → rien',      hrefItineraire(null),      null);
verifier('undefined → rien', hrefItineraire(undefined), null);
verifier('espaces seuls → rien', hrefItineraire('   '), null);

console.log(echecs === 0 ? '\n✅ Tout passe.\n' : `\n❌ ${echecs} test(s) en échec.\n`);
process.exit(echecs === 0 ? 0 : 1);

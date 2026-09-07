// Correction de dictée métier — jeu de test.
//
// Les cas viennent du §6 de docs/lexique-devis-dictee.md, qui recense ce que les
// moteurs vocaux produisent réellement sur du vocabulaire de chantier.
//
// ⚠️ Deux familles de tests, et la seconde compte autant que la première :
//   1. ce qu'on DOIT corriger
//   2. ce qu'on ne doit SURTOUT PAS toucher — une correction silencieuse qui change
//      un métrage est pire que pas de correction du tout.
//
// Lancer :  node app/js/tests/test-dictee-btp.mjs

import { corrigerDictee, apprendreDeLaCorrection } from '../app-dictee-btp.js';

let echecs = 0;
function verifier(nom, obtenu, attendu) {
  const ok = obtenu === attendu;
  console.log(ok ? `  ✅ ${nom}` : `  ❌ ${nom}\n       attendu : « ${attendu} »\n       obtenu  : « ${obtenu} »`);
  if (!ok) echecs++;
}
const c = (s) => corrigerDictee(s).texte;

console.log('\n── Pièges de vocabulaire ──');
verifier('placard → Placo',            c('pose de placard sur ossature'), 'pose de Placo sur ossature');
verifier('ba treize → BA13',           c('cloison en ba treize'), 'cloison en BA13');
verifier('fayence → faïence',          c('fayence murale'), 'faïence murale');
verifier('sous couche → sous-couche',  c('application sous couche'), 'application sous-couche');
verifier('souscouche → sous-couche',   c('une souscouche blanche'), 'une sous-couche blanche');
verifier('cardron → quart-de-rond',    c('pose de cardron'), 'pose de quart-de-rond');
verifier('grès céram → grès cérame',   c('carrelage grès céram'), 'carrelage grès cérame');
verifier('va et vient → va-et-vient',  c('un va et vient dans le couloir'), 'un va-et-vient dans le couloir');
verifier('détu → DTU',                 c('conforme au détu'), 'conforme au DTU');
verifier('double vé cé → WC',          c('pose double vé cé suspendu'), 'pose WC suspendu');

console.log('\n── Unités (la priorité absolue) ──');
verifier('mètres carrés → m²',         c('cent mètres carrés de peinture'), '100 m² de peinture');
verifier('m 2 → m²',                   c('45 m 2 au sol'), '45 m² au sol');
verifier('mètres linéaires → ml',      c('30 mètres linéaires de plinthes'), '30 ml de plinthes');
verifier('mètres cubes → m³',          c('12 mètres cubes de gravats'), '12 m³ de gravats');
verifier('kilos → kg',                 c('25 kilos d’enduit'), '25 kg d’enduit');

console.log('\n── Le piège « mille » ──');
verifier('« 100 mille » → 100 ml',     c('100 mille de plinthes'), '100 ml de plinthes');
verifier('« cent mille euros » INTACT', c('un devis de cent mille euros'), 'un devis de cent mille euros');

console.log('\n── Nombres dits en toutes lettres ──');
verifier('deux mètres cinquante',      c('une hauteur de deux mètres cinquante'), 'une hauteur de 2,50 m');
verifier('trois virgule cinq',         c('trois virgule cinq mètres'), '3,5 mètres');

console.log('\n── ⚠️ Ce qu’on ne doit PAS toucher ──');
// ⚠️ Ce test attendait « démonter le Placo de la chambre » — l'inverse de son
// intitulé. Il verrouillait le bug : un menuisier qui dictait « pose de
// placards sur mesure » recevait « pose de Placo sur mesure », et le test
// garantissait que ça continue. Corrigé le 02/09/2026 en même temps que la
// règle : « placard » n'est converti que si la phrase porte un indice de
// plaquiste (BA13, cloison, ossature, rail, montant, hydrofuge, jointoyer...).
verifier('un placard reste un placard quand c’est un meuble',
  c('démonter le placard de la chambre'), 'démonter le placard de la chambre');
verifier('…et le devient quand le contexte est celui d’un plaquiste',
  c('démonter le placard et reposer une cloison'), 'démonter le Placo et reposer une cloison');
verifier('texte sans terme métier : intact',
  c('le client rappelle demain matin'), 'le client rappelle demain matin');
verifier('texte vide : intact', c(''), '');
verifier('un prix n’est jamais touché',
  c('le devis fait 5 962 euros TTC'), 'le devis fait 5 962 euros TTC');

console.log('\n── Les corrections sont annoncées ──');
const r = corrigerDictee('pose de fayence et souscouche');
verifier('deux corrections rapportées', String(r.corrections.length >= 2), 'true');
verifier('chacune dit avant → après',
  String(r.corrections.every((x) => x.avant && x.apres && x.type)), 'true');

console.log('\n── Apprendre de ce que l’artisan rectifie ──');
{
  // Cas 1 : il défait NOTRE correction. Signal le plus grave — la règle est fausse.
  const nous = corrigerDictee('poser de la fayence au mur');
  const l1 = apprendreDeLaCorrection(nous.texte, 'poser de la fayence au mur', nous.corrections);
  verifier('une correction défaite est vue', String(l1.length), '1');
  verifier('…et classée « annulation »', l1[0]?.origine || '—', 'annulation');

  // Cas 2 : il corrige un mot qu’on avait laissé passer → règle candidate.
  const l2 = apprendreDeLaCorrection(
    'pose de lambourde au sol', 'pose de lambourdes au sol', []);
  verifier('un mot qu’on a raté est vu', String(l2.length), '1');
  verifier('…et classé « ajout »', l2[0]?.origine || '—', 'ajout');
  verifier('le contexte est conservé',
    String(Boolean(l2[0]?.contexte?.includes('lambourdes'))), 'true');

  console.log('\n── ⚠️ Ce dont on refuse d’apprendre ──');
  verifier('texte identique : rien à apprendre',
    String(apprendreDeLaCorrection('pose de Placo', 'pose de Placo', []).length), '0');
  verifier('phrase remaniée : on s’abstient (longueurs ≠)',
    String(apprendreDeLaCorrection(
      'pose de Placo au mur', 'il faut poser du Placo sur le mur du fond', []).length), '0');
  verifier('texte vide : rien',
    String(apprendreDeLaCorrection('', 'quelque chose', []).length), '0');
}

console.log(echecs === 0 ? '\n✅ Tout passe.\n' : `\n❌ ${echecs} test(s) en échec.\n`);
process.exit(echecs === 0 ? 0 : 1);

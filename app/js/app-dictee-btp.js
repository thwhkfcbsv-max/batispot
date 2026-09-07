// BatiSpot — Correction de dictée métier.
//
// POURQUOI CE FICHIER EXISTE (01/09/2026)
//
// Le moteur de reconnaissance vocale du navigateur est gratuit, correct en français
// courant, et parfaitement ignorant du bâtiment. Il écrit « placard » quand l'artisan
// dit « Placo », « mille » quand il dit « ml », et « deux mètres cinquante » sans
// jamais produire un chiffre.
//
// Changer de moteur ne réglerait pas ça : aucun n'est entraîné sur des devis de
// rénovation française. C'est donc ICI que se trouve la valeur — pas dans le moteur,
// qui reste interchangeable et gratuit.
//
// La matière vient de docs/lexique-devis-dictee.md, ecrit le 31/08 et jamais branche.
//
// ⚠️ LA PRIORITE ABSOLUE, CE SONT LES UNITES. Le lexique le dit : « une unité mal lue
// change le montant d'un facteur 10 sans que personne le voie ». 100 m² de peinture
// facturés au mètre linéaire, c'est un devis faux qui part chez un client.
//
// Regle de conduite : on ne corrige QUE ce dont on est sur. Dans le doute on laisse
// le texte tel quel — un artisan relit une transcription approximative, il ne relit
// pas une correction silencieuse qui a change son metrage.

// ── 1. Pieges de transcription ─────────────────────────────
//
// Cas ou le moteur produit un texte PLAUSIBLE mais faux : c'est le pire cas, parce
// que rien ne signale l'erreur. Tire du §6 du lexique.
// Chaque entree : [ce que le moteur ecrit, ce que l'artisan a dit].
// Marqueurs qui rendent la lecture « plaquiste » nettement plus probable que la
// lecture « menuiserie ». Un placard ne se visse pas sur des montants et ne se
// jointoie pas a la bande.
const INDICES_PLACO =
  /\b(ba\s*-?\s*(?:13|treize)|cloisons?|doublages?|ossatures?|rails?|montants?|plaques?|hydrofuges?|jointoy\w*|bandes?\s+[àa]\s+joint|calicot|lisses?|fourrures?|placo)\b/i;

const PIEGES = [
  // Materiaux et ouvrages
  // « placard » -> « Placo » est traite a part, dans corrigerDictee : c'est la
  // seule regle dont le mot d'origine est un vrai terme d'un AUTRE metier, donc
  // la seule qui exige de regarder la phrase entiere. Voir INDICES_PLACO.
  [/\bplateaux?\b(?=\s+(?:de\s+)?\d|\s+au\s+m)/gi, 'Placo'],
  [/\bcr[ée]pis?\b(?=\s|$|,|\.)/gi,   'crépi'],
  [/\bgardes?\s+corps\b/gi,           'garde-corps'],
  [/\bba\s*-?\s*treize\b/gi,          'BA13'],
  [/\bpa\s*-?\s*13\b/gi,              'BA13'],
  [/\bba\s+13\b/gi,                   'BA13'],
  [/\b(?:ph|f|p)a[iy]ences?\b/gi,     'faïence'],
  [/\bsous\s+couches?\b/gi,           'sous-couche'],
  [/\bsouscouches?\b/gi,              'sous-couche'],
  [/\bcardrons?\b/gi,                 'quart-de-rond'],
  [/\bquart\s+de\s+ronds?\b/gi,       'quart-de-rond'],
  [/\bgr[eè]s?\s+c[ée]rams?\b/gi,     'grès cérame'],
  [/\bva\s+et\s+vient\b/gi,           'va-et-vient'],
  [/\bvas.?y\s+viens\b/gi,            'va-et-vient'],
  // Sigles que le moteur epelle
  [/\bp[eè]re\b(?=\s+(?:multicouche|tube|gaine|\d))/gi, 'PER'],
  [/\bpaires?\b(?=\s+(?:multicouche|tube))/gi,          'PER'],
  // ⚠️ Pas de \b final apres un accent : en JavaScript, \b ne connait que
  // [A-Za-z0-9_], donc « é » n'est pas une lettre et la frontiere de mot
  // n'existe pas. « double vé cé » ne matchait pas. Lookahead a la place.
  [/\bv[ée]\s*emme\s*c[ée](?![a-zà-ÿ])/gi,   'VMC'],
  [/\bdouble\s*v[ée]\s*c[ée](?![a-zà-ÿ])/gi, 'WC'],
  [/\bd[ée]tu\b/gi,                   'DTU'],
  [/\berre\s*ji\s*45\b/gi,            'RJ45'],
  [/\brj\s+45\b/gi,                   'RJ45'],
  [/\b30\s*milliamp[eè]res?\b/gi,     '30 mA'],
  [/\b30\s*m\s+a\b/gi,                '30 mA'],
];

// ── 2. Nombres dits en toutes lettres ──────────────────────
const UNITES_MOT = {
  zéro: 0, zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5,
  six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13,
  quatorze: 14, quinze: 15, seize: 16,
};
const DIZAINES_MOT = {
  vingt: 20, trente: 30, quarante: 40, cinquante: 50,
  soixante: 60, 'quatre-vingt': 80, 'quatre-vingts': 80, cent: 100, cents: 100,
};

// « deux mètres cinquante » → 2,50 m. Sans ça, l'artisan dicte une cote et il
// n'en reste aucun chiffre exploitable.
function nombresParles(txt) {
  let t = txt;

  // « trois virgule cinq » → « 3,5 ». Les deux membres peuvent etre des MOTS :
  // le moteur ne convertit pas « trois » en 3, il ecrit ce qu'il entend.
  const chiffre = (x) => {
    const k = String(x).toLowerCase();
    if (UNITES_MOT[k] != null) return UNITES_MOT[k];
    if (DIZAINES_MOT[k] != null) return DIZAINES_MOT[k];
    const n = parseInt(x, 10);
    return isNaN(n) ? null : n;
  };
  const tousMots = [...Object.keys(UNITES_MOT), ...Object.keys(DIZAINES_MOT)].join('|');
  t = t.replace(
    new RegExp(`\\b(${tousMots}|\\d+)\\s+virgule\\s+(${tousMots}|\\d+)\\b`, 'gi'),
    (m, a, b) => {
      const x = chiffre(a), y = chiffre(b);
      return (x == null || y == null) ? m : `${x},${y}`;
    }
  );

  // « deux mètres cinquante » → « 2,50 m » (la seconde partie = centimètres)
  const mots = Object.keys(UNITES_MOT).join('|');
  const diz = Object.keys(DIZAINES_MOT).join('|');
  t = t.replace(
    new RegExp(`\\b(${mots}|\\d+)\\s+m[eè]tres?\\s+(${diz}|${mots})\\b`, 'gi'),
    (m, a, b) => {
      const ent = UNITES_MOT[String(a).toLowerCase()] ?? parseInt(a, 10);
      const dec = DIZAINES_MOT[String(b).toLowerCase()] ?? UNITES_MOT[String(b).toLowerCase()];
      if (ent == null || dec == null || isNaN(ent)) return m;
      return `${ent},${String(dec).padStart(2, '0')} m`;
    }
  );

  // Nombres simples isolés devant une unité : « cinquante mètres carrés ».
  t = t.replace(
    new RegExp(`\\b(${diz}|${mots})\\s+(?=m[eè]tres?|m²|m2|ml\\b|unit[ée]s?|pi[eè]ces?|heures?|jours?)`, 'gi'),
    (m, a) => {
      const v = DIZAINES_MOT[a.toLowerCase()] ?? UNITES_MOT[a.toLowerCase()];
      return v != null ? `${v} ` : m;
    }
  );
  return t;
}

// ── 3. Unites ──────────────────────────────────────────────
//
// ⚠️ Le cas « mille » est le plus dangereux du lexique : le moteur ecrit « mille »
// quand l'artisan dit « ml ». Mais « mille » veut aussi dire 1000. On ne convertit
// donc QUE si un nombre precede — « cent mille » reste cent mille, « 100 mille »
// devient 100 ml. Dans le doute, on ne touche a rien.
const UNITES = [
  [/\bm[eè]tres?\s+carr[ée]s?\b/gi,          'm²'],
  [/\bmetre\s+carre\b/gi,                     'm²'],
  [/\bm\s*2\b/gi,                             'm²'],
  [/\bm[eè]tres?\s+cubes?\b/gi,               'm³'],
  [/\bm\s*3\b/gi,                             'm³'],
  [/\bm[eè]tres?\s+lin[ée]aires?\b/gi,        'ml'],
  [/\bm\.\s*l\.\b/gi,                         'ml'],
  [/\bm\s+lin[ée]aire\b/gi,                   'ml'],
  [/(\d)\s*mille\b/gi,                        '$1 ml'],   // gardé par le chiffre
  [/\bkilos?\b/gi,                            'kg'],
  [/\btonnes?\b/gi,                           'T'],
  [/\blitres?\b/gi,                           'L'],
  [/\bunit[ée]s?\b/gi,                        'u'],
  [/\bpi[eè]ces?\b(?=\s*$|\s*[,.])/gi,        'u'],
  [/\bau\s+forfait\b/gi,                      'forfait'],
];

// ── 4. Point d'entree ──────────────────────────────────────
//
// Renvoie le texte corrige ET la liste de ce qui a change, pour que l'artisan
// puisse voir ce qu'on a touche. Une correction invisible est une correction
// qu'on ne peut pas contester.
export function corrigerDictee(texte) {
  const original = String(texte || '');
  if (!original.trim()) return { texte: original, corrections: [] };

  let t = original;
  const corrections = [];

  const appliquer = (regles, type) => {
    for (const [motif, vers] of regles) {
      t = t.replace(motif, (m, ...args) => {
        const remplace = typeof vers === 'string'
          ? vers.replace(/\$(\d)/g, (_, n) => args[n - 1] ?? '')
          : vers;
        if (m !== remplace) corrections.push({ type, avant: m.trim(), apres: remplace.trim() });
        return remplace;
      });
    }
  };

  appliquer(PIEGES, 'vocabulaire');

  // « placard » : le seul piege ou le mot entendu appartient VRAIMENT a un
  // autre metier. La reconnaissance ne connait pas « Placo » et le rend en
  // « placard » ; mais un menuisier, lui, pose de vrais placards. On ne
  // corrigeait pas ce cas, on l'arbitrait a l'aveugle — et le menuisier
  // perdait sa prestation. Desormais on n'intervient que si la phrase porte
  // un indice de plaquiste. Dans le doute, on ne touche a rien : laisser le
  // mot que l'artisan a dit coute moins cher que lui en substituer un autre.
  if (/\bplacards?\b/i.test(t) && INDICES_PLACO.test(t)) {
    t = t.replace(/\bplacards?\b/gi, (m) => {
      corrections.push({ type: 'vocabulaire', avant: m.trim(), apres: 'Placo' });
      return 'Placo';
    });
  }

  const avantNombres = t;
  t = nombresParles(t);
  if (t !== avantNombres) corrections.push({ type: 'nombre', avant: avantNombres, apres: t });
  appliquer(UNITES, 'unité');

  // Espaces multiples laissés par les remplacements.
  t = t.replace(/[ \t]{2,}/g, ' ').trim();

  return { texte: t, corrections };
}

// ── 5. Apprendre de ce que l'artisan rectifie ──────────────
//
// Meme protocole que les cadences : on OBSERVE, on ne decide pas. Rien de ce qui
// sort d'ici ne modifie le comportement de l'app — ca alimente une table que
// Moctar relit avant qu'une regle change dans ce fichier.
//
// Les deux signaux n'ont pas la meme valeur :
//   • annulation — il remet le mot que NOUS avions change. Notre regle est fausse,
//     et elle est en train de salir des devis. C'est le signal le plus urgent.
//   • ajout      — il corrige un mot qu'on a laisse passer. C'est une regle a ecrire.
//
// Comparaison mot a mot, alignee sur la position. Un diff sophistique inventerait
// des correspondances qui n'existent pas ; ici, si l'artisan a reformule sa phrase,
// on prefere ne rien conclure plutot que d'apprendre du bruit.
export function apprendreDeLaCorrection(notreTexte, texteFinal, corrections = []) {
  const a = String(notreTexte || '').trim().split(/\s+/).filter(Boolean);
  const b = String(texteFinal  || '').trim().split(/\s+/).filter(Boolean);
  if (!a.length || !b.length) return [];
  // Longueurs differentes = phrase remaniee, pas une correction de mot. On s'abstient.
  if (a.length !== b.length) return [];

  // Ce que nous avons change, pour reconnaitre un retour en arriere.
  const nosChangements = new Map();
  for (const c of corrections) {
    if (c?.avant && c?.apres) nosChangements.set(c.apres.toLowerCase(), c.avant.toLowerCase());
  }

  const lecons = [];
  for (let i = 0; i < a.length; i++) {
    const avant = a[i], apres = b[i];
    if (avant === apres) continue;
    const revientA = nosChangements.get(avant.toLowerCase());
    lecons.push({
      avant,
      apres,
      // Il a remis exactement ce que le moteur disait avant notre passage.
      origine: revientA && revientA === apres.toLowerCase() ? 'annulation' : 'ajout',
      contexte: b.slice(Math.max(0, i - 3), i + 4).join(' '),
    });
  }
  return lecons;
}

// Les termes que l'artisan doit pouvoir voir corriger — sert aussi d'amorce de
// vocabulaire si un jour on passe sur un moteur qui accepte un lexique.
export function termesMetier() {
  return ['Placo', 'BA13', 'faïence', 'sous-couche', 'quart-de-rond', 'grès cérame',
    'va-et-vient', 'PER', 'VMC', 'WC', 'DTU', 'RJ45', 'm²', 'm³', 'ml'];
}

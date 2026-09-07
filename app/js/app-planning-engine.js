// BatiSpot Pro — Moteur de planning chantier.
//
// Trois briques, dans l'ordre où elles s'appliquent :
//   A. Enchaînement — une tâche ne démarre qu'après le délai incompressible de la
//      précédente (séchage peinture, prise d'un enduit, cure d'une chape).
//   B. Charge — additionne les heures par personne et par jour, alerte au-delà de
//      sa capacité. Deux chantiers le même jour n'est PAS une anomalie ; la
//      surcharge d'une personne l'est.
//   C. Ordre de la journée — trie les chantiers d'un même jour par trajet, au
//      départ du point de rendez-vous, pour éviter de traverser deux fois la région.
//
// Le distinguo qui porte tout : durée de TRAVAIL ≠ durée d'IMMOBILISATION. Pendant
// un séchage l'artisan n'est pas occupé, le créneau est réutilisable ailleurs.

export const HEURES_JOUR_DEFAUT = 7;      // capacité d'une personne, en heures travaillées
const DEBUT_JOURNEE_H = 8;         // 08:00

// ── Utilitaires date ───────────────────────────────────────
const AAAAMMJJ = (d) => d.toISOString().slice(0, 10);

function ajouterJoursOuvres(date, n) {
  const d = new Date(date);
  let reste = n;
  while (reste > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) reste--;
  }
  return d;
}

function estOuvre(d) {
  return d.getDay() !== 0 && d.getDay() !== 6;
}

function prochainJourOuvre(d) {
  const x = new Date(d);
  while (!estOuvre(x)) x.setDate(x.getDate() + 1);
  return x;
}

// ── A. Enchaînement avec temps de séchage ──────────────────
//
// Parcourt les tâches dans l'ordre et leur attribue un jour, en respectant
// `delai_apres_h` : si la peinture doit sécher 12 h, la couche suivante bascule
// au lendemain même s'il reste des heures disponibles aujourd'hui.
export function ordonnancer(taches, dateDebut, opts = {}) {
  const heuresJour = opts.heuresJour || HEURES_JOUR_DEFAUT;
  const liste = [...taches].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

  let jour = prochainJourOuvre(new Date(dateDebut));
  let heureCourante = DEBUT_JOURNEE_H;
  const planifiees = [];

  for (const t of liste) {
    // Sans durée, on ne peut pas caler : la tâche reste dans la liste, sans date.
    // C'est honnête — elle apparaîtra comme « à préciser » plutôt que d'occuper un
    // créneau inventé et de décaler tout ce qui suit.
    if (t.duree_h == null || t.duree_h === '') {
      planifiees.push({ ...t, jour: null, jour_fin: null, debut_h: null, fin_h: null });
      continue;
    }
    const duree = Number(t.duree_h) || 0;
    const delai = Number(t.delai_apres_h) || 0;

    // Une tâche COURTE qui ne tient plus dans la journée démarre le lendemain,
    // plutôt que d'être coupée en deux pour une heure.
    if (duree <= heuresJour && heureCourante + duree > DEBUT_JOURNEE_H + heuresJour) {
      jour = ajouterJoursOuvres(jour, 1);
      heureCourante = DEBUT_JOURNEE_H;
    }

    // Une tâche LONGUE s'étale sur plusieurs jours ouvrés — et il faut le dire.
    // Avant le 01/09, `jour` était la seule date stockée : une préparation de 29 h
    // s'affichait au 3 septembre et les 4, 5 et 8 paraissaient vides. Le client en
    // déduisait que l'artisan disparaissait une semaine. On enregistre donc aussi
    // le dernier jour réellement travaillé.
    const jourDebut = new Date(jour);
    const debutH = heureCourante;
    const restantAujourdhui = (DEBUT_JOURNEE_H + heuresJour) - heureCourante;
    let jourFin = new Date(jour);

    if (duree > restantAujourdhui) {
      const reste = duree - restantAujourdhui;
      const joursEnPlus = Math.ceil(reste / heuresJour);
      jourFin = ajouterJoursOuvres(jour, joursEnPlus);
      // Heure de sortie le dernier jour : ce qui déborde des jours pleins précédents.
      const surLeDernier = reste - (joursEnPlus - 1) * heuresJour;
      heureCourante = DEBUT_JOURNEE_H + surLeDernier;
      jour = new Date(jourFin);   // la tâche suivante enchaîne là où celle-ci finit
    } else {
      heureCourante += duree;
    }

    planifiees.push({
      ...t,
      jour: AAAAMMJJ(jourDebut),
      jour_fin: AAAAMMJJ(jourFin),
      debut_h: debutH,
      fin_h: heureCourante,
    });

    if (delai > 0) {
      // Délai incompressible. La nuit compte : une tâche finie à 14h avec 12 h de
      // séchage est reprenable le lendemain 8h (18 h écoulées). On compte donc le
      // temps réellement disponible avant chaque reprise, au lieu d'ajouter des
      // jours forfaitaires — sinon un chantier de 4 jours s'étale sur deux semaines.
      let joursAAvancer = 1;
      let couvert = (24 - heureCourante) + DEBUT_JOURNEE_H;   // jusqu'au lendemain matin
      while (couvert < delai) { joursAAvancer++; couvert += 24; }
      jour = ajouterJoursOuvres(jour, joursAAvancer);
      heureCourante = DEBUT_JOURNEE_H;
      // Le reste de la journée courante n'est PAS perdu : il reste disponible pour
      // un autre chantier (voir creneauxLibres).
    }
  }

  return planifiees;
}

// Créneaux réutilisables : ce qui reste libre chaque jour une fois les tâches posées.
// C'est là qu'on peut caser un autre chantier pendant un séchage.
export function creneauxLibres(tachesPlanifiees, opts = {}) {
  const heuresJour = opts.heuresJour || HEURES_JOUR_DEFAUT;
  const parJour = {};
  for (const t of tachesPlanifiees) {
    if (!t.jour) continue;
    if (t.mobilise_artisan === false) continue;   // un séchage n'occupe personne
    parJour[t.jour] = (parJour[t.jour] || 0) + (Number(t.duree_h) || 0);
  }
  return Object.entries(parJour)
    .map(([jour, occupe]) => ({ jour, occupe, libre: Math.max(0, heuresJour - occupe) }))
    .filter((x) => x.libre > 0.5)
    .sort((a, b) => a.jour.localeCompare(b.jour));
}

// ── B. Charge par personne ─────────────────────────────────
//
// Renvoie une alerte par personne et par jour dépassant sa capacité, en listant
// les chantiers concernés — c'est l'information qui manque à l'artisan quand il
// jongle entre plusieurs chantiers.
// `opts.nomDe(tache)` permet à l'appelant de décider QUI porte une tâche. La vue
// planning résout d'abord `assigne_id` (la FK) et ne retombe sur `assigne_a`
// qu'ensuite ; l'assistant fait pareil. Sans ce point d'extension, chacun
// réimplémentait son propre regroupement et deux écrans pouvaient annoncer deux
// verdicts différents sur le même planning. Par défaut : l'ancien comportement.
export function analyserCharge(taches, chantiersParId = {}, opts = {}) {
  const heuresJour = opts.heuresJour || HEURES_JOUR_DEFAUT;
  const nomDe = opts.nomDe || ((t) => t.assigne_a || 'Moi');
  const cumul = {};

  for (const t of taches) {
    if (!t.jour || t.mobilise_artisan === false) continue;
    const qui = nomDe(t);
    if (!qui) continue;
    const cle = `${t.jour}|${qui}`;
    if (!cumul[cle]) cumul[cle] = { jour: t.jour, personne: qui, heures: 0, chantiers: new Set() };
    cumul[cle].heures += Number(t.duree_h) || 0;
    const nom = (chantiersParId[t.chantier_id] || {}).client_name;
    if (nom) cumul[cle].chantiers.add(nom);
  }

  return Object.values(cumul)
    .map((c) => ({
      jour: c.jour,
      personne: c.personne,
      heures: Math.round(c.heures * 10) / 10,
      capacite: heuresJour,
      chantiers: [...c.chantiers],
      surcharge: c.heures > heuresJour,
    }))
    .sort((a, b) => a.jour.localeCompare(b.jour) || a.personne.localeCompare(b.personne));
}

/**
 * Les conflits, en phrases prêtes à lire ou à dire.
 *
 * UNE SEULE définition du conflit dans toute l'application : la vue Charge du
 * planning et l'assistant vocal appellent cette fonction. Si l'assistant
 * annonçait un conflit que l'écran ne montre pas (ou l'inverse), l'artisan ne
 * saurait plus lequel croire.
 *
 * Deux motifs, et seulement deux :
 *   • la même personne attendue sur plusieurs chantiers le même jour ;
 *   • un cumul d'heures au-dessus de sa capacité.
 * Deux chantiers dans une semaine n'est PAS un conflit — c'est le métier.
 *
 * @returns {{personne:string, jour:string, type:string, texte:string}[]}
 */
export function detecterConflits(taches, chantiersParId = {}, opts = {}) {
  const heuresJour = opts.heuresJour || HEURES_JOUR_DEFAUT;
  const quand = (iso) => {
    const d = new Date(iso + 'T00:00:00');
    return isNaN(d) ? iso : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  const out = [];
  for (const c of analyserCharge(taches, chantiersParId, opts)) {
    if (c.chantiers.length > 1) {
      out.push({
        personne: c.personne, jour: c.jour, type: 'multi_chantiers',
        texte: `${c.personne} est attendu sur ${c.chantiers.length} chantiers ${quand(c.jour)} : `
          + c.chantiers.join(', ') + '.',
      });
    }
    if (c.surcharge) {
      out.push({
        personne: c.personne, jour: c.jour, type: 'surcharge',
        texte: `${c.personne} cumule ${Math.round(c.heures * 10) / 10} h ${quand(c.jour)}, `
          + `au-dessus des ${heuresJour} h d'une journée.`,
      });
    }
  }
  return out;
}

// ── C. Ordre de la journée par distance ────────────────────

// Géocodage via l'API Adresse (adresse.data.gouv.fr) : gratuite, sans clé.
export async function geocoder(adresse) {
  if (!adresse) return null;
  const url = 'https://api-adresse.data.gouv.fr/search/?limit=1&q=' + encodeURIComponent(adresse);
  try {
    const r = await fetch(url);
    const j = await r.json();
    const f = (j.features || [])[0];
    if (!f) return null;
    const [lon, lat] = f.geometry.coordinates;
    return { lat, lon, label: f.properties.label };
  } catch (e) {
    return null;
  }
}

// Distance à vol d'oiseau (Haversine), en km. Suffisant pour ordonner des étapes :
// on cherche le bon ordre, pas un temps de trajet au km près.
export function distanceKm(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Ordre optimal des étapes d'une journée. 2 à 6 chantiers par jour en pratique :
// on énumère toutes les permutations jusqu'à 6 (720 cas, instantané), au-delà on
// applique « toujours le plus proche » qui reste très correct.
export function ordonnerJournee(etapes, depart) {
  const pts = etapes.filter((e) => e.coord);
  if (pts.length <= 1) return { ordre: etapes, km: 0 };

  const total = (seq) => {
    let d = 0;
    let prec = depart || seq[0].coord;
    for (const e of seq) { d += distanceKm(prec, e.coord); prec = e.coord; }
    return d;
  };

  if (pts.length <= 6) {
    let meilleur = null;
    let meilleurKm = Infinity;
    const permuter = (reste, acc) => {
      if (!reste.length) {
        const d = total(acc);
        if (d < meilleurKm) { meilleurKm = d; meilleur = [...acc]; }
        return;
      }
      for (let i = 0; i < reste.length; i++) {
        permuter(reste.filter((_, j) => j !== i), [...acc, reste[i]]);
      }
    };
    permuter(pts, []);
    return { ordre: meilleur, km: Math.round(meilleurKm * 10) / 10 };
  }

  // Plus proche voisin
  const restants = [...pts];
  const seq = [];
  let prec = depart || restants[0].coord;
  while (restants.length) {
    let iMin = 0;
    let dMin = Infinity;
    restants.forEach((e, i) => {
      const d = distanceKm(prec, e.coord);
      if (d < dMin) { dMin = d; iMin = i; }
    });
    const [choisi] = restants.splice(iMin, 1);
    seq.push(choisi);
    prec = choisi.coord;
  }
  return { ordre: seq, km: Math.round(total(seq) * 10) / 10 };
}

// Délais de séchage/prise usuels, pour pré-remplir une tâche quand l'artisan (ou
// l'assistant) ne les précise pas. Valeurs courantes de mise en oeuvre ; l'artisan
// reste libre de les ajuster, et la fiche technique du produit prime toujours.
export const DELAIS_USUELS_H = {
  'peinture_entre_couches': 12,
  'peinture_sous_couche': 12,
  'enduit_lissage': 24,
  'enduit_rebouchage': 24,
  'colle_carrelage': 24,
  'joint_carrelage': 24,
  'chape_circulation': 48,
  'chape_avant_revetement': 504,   // 3 semaines par cm, valeur type d'une chape courante
  'ragreage': 24,
  'primaire_accrochage': 4,
};

export function delaiSuggere(titre) {
  const t = (titre || '').toLowerCase();
  if (/sous.?couche|impression|primaire/.test(t)) return DELAIS_USUELS_H.peinture_sous_couche;
  if (/peinture|couche|finition/.test(t)) return DELAIS_USUELS_H.peinture_entre_couches;
  if (/enduit|ratissage|reboucha/.test(t)) return DELAIS_USUELS_H.enduit_lissage;
  if (/colle|carrelage|faience|faïence/.test(t)) return DELAIS_USUELS_H.colle_carrelage;
  if (/joint/.test(t)) return DELAIS_USUELS_H.joint_carrelage;
  if (/chape|ragrea|ragréa/.test(t)) return DELAIS_USUELS_H.ragreage;
  return 0;
}

// ── D. Du devis vers les tâches ────────────────────────────
//
// Pourquoi cette fonction existe (01/09/2026) : « mettre un chantier au planning »
// n'écrivait que `chantiers.date_debut`, alors que la vue journée ne lit que la table
// `taches`. La date partait en base et le calendrier affichait « Rien de planifié ».
//
// Les lignes du devis SONT déjà le déroulé du chantier, dans l'ordre et par lot. On en
// tire une tâche par ligne plutôt que d'inventer un découpage.
//
// ⚠️ AUCUNE DURÉE N'EST DÉDUITE DU PRIX PAR DÉFAUT (Moctar, 01/09/2026).
//
// La version précédente divisait le montant de la ligne par un taux horaire. Ça suppose
// que le prix a été construit à l'heure — or la plupart des artisans chiffrent AU MÉTRÉ
// ou AU FORFAIT. Le devis de référence lui-même est en €/m² et en forfaits : pas une
// heure nulle part. Inverser un calcul qui n'a jamais eu lieu ne produit pas une durée,
// ça produit un nombre qui a l'air d'une durée.
//
// Pour planifier, il faut une CADENCE (m²/jour), pas un prix. Elle vient de l'artisan.
// La déduction par le prix reste disponible, mais uniquement s'il la DEMANDE :
// tachesDepuisLignes(lignes, { estimerDepuisPrix: true, tauxHoraire: 48 }).

const TAUX_HORAIRE_DEFAUT = 48; // € HT/h — aligné sur tauxHoraireMo de app-knowledge-btp.js

// Coupe la description du devis à un intitulé lisible dans une case de calendrier.
function intitule(description, lot) {
  let t = String(description || '').trim();
  const coupe = t.search(/\s*[:;]|,\s|\sy compris\b/i);
  if (coupe > 12) t = t.slice(0, coupe);
  t = t.trim().replace(/[.,;:]$/, '');
  if (t.length > 70) {
    const espace = t.lastIndexOf(' ', 70);
    t = t.slice(0, espace > 30 ? espace : 70).trim() + '…';
  }
  return t || String(lot || '').replace(/^Lot\s*\d+\s*[—–-]\s*/i, '').trim() || 'Tâche';
}

// ── Cadences de pose ───────────────────────────────────────
//
// Une duree se deduit de la QUANTITE et de la NATURE du travail, pas du prix.
// 100 m² de sous-couche se peignent en un temps connu : c'est de la physique.
// Le prix, lui, est du commerce — il vient de l'artisan et de lui seul.
//
// Ces valeurs sont des CADENCES PAR DEFAUT, pour une personne. Elles servent de
// point de depart : l'artisan corrige, et ce sont ses chiffres qui font foi. Elles
// recoupent les ordres de grandeur du metier (une piece de 12-15 m² : sous-couche
// en 1 a 2 h, finition en 2 a 3 h).
//
// ⚠️ Quand l'ouvrage n'est pas reconnu, on renvoie null. On ne devine pas.
export const CADENCES = [
  // [ regex sur la description, unites acceptees, quantite par heure ]
  { motif: /sous.?couche|impression|primaire/i,                unites: ['m2','m²'], parHeure: 30 },
  { motif: /peinture|finition|couche/i,                        unites: ['m2','m²'], parHeure: 18 },
  { motif: /pr[ée]paration|[ée]grenage|reboucha|pon[çc]age|lissage|enduit|ratissage/i,
                                                               unites: ['m2','m²'], parHeure: 10 },
  { motif: /carrelage|fa[iï]ence/i,                            unites: ['m2','m²'], parHeure: 4 },
  { motif: /ragr[ée]a|chape/i,                                 unites: ['m2','m²'], parHeure: 12 },
  { motif: /parquet|sol souple|lino/i,                         unites: ['m2','m²'], parHeure: 8 },
  { motif: /placo|cloison|doublage/i,                          unites: ['m2','m²'], parHeure: 6 },
  { motif: /plinthe/i,                                         unites: ['ml','m'],  parHeure: 10 },
  // ⚠️ L'ORDRE COMPTE. « Nettoyage de fin de chantier, repliement des PROTECTIONS »
  // contient le mot protection : sans cette priorite, le nettoyage etait facture
  // comme une mise en protection. Le plus specifique passe en premier.
  { motif: /nettoyage|repli|[ée]vacuation|d[ée]chet/i,         unites: null, forfaitH: 2.5 },
  { motif: /protection|masquage|b[âa]che/i,                    unites: null, forfaitH: 3.5 },
  { motif: /d[ée]pose|d[ée]molition|d[ée]bar/i,                unites: null, forfaitH: 4 },
];

// Duree d'une ligne de devis, en heures. null si l'ouvrage n'est pas reconnu :
// mieux vaut un champ vide que l'artisan remplit qu'un nombre invente.
export function dureeSuggeree(ligne) {
  const desc = String(ligne?.description || '');
  const unite = String(ligne?.unit || '').trim().toLowerCase();
  const qte = Number(ligne?.quantity || 0);

  for (const c of CADENCES) {
    if (!c.motif.test(desc)) continue;
    if (c.forfaitH != null) return c.forfaitH;
    if (c.unites && !c.unites.includes(unite)) continue;
    if (!(qte > 0)) continue;
    // Arrondi a la demi-heure, jamais moins d'une demi-heure.
    return Math.max(0.5, Math.round((qte / c.parHeure) * 2) / 2);
  }
  return null;
}

export function tachesDepuisLignes(lignes, opts = {}) {
  const taux = Number(opts.tauxHoraire) > 0 ? Number(opts.tauxHoraire) : TAUX_HORAIRE_DEFAUT;
  const estimer = opts.estimerDepuisPrix === true;   // jamais implicite
  return (lignes || []).map((l, i) => {
    const montant = Number(l.total_ht != null ? l.total_ht
      : (Number(l.unitPrice || 0) * Number(l.quantity || 0))) || 0;
    // Par defaut : la duree vient de la CADENCE appliquee a la quantite — de la
    // physique. Elle vaut null si l'ouvrage n'est pas reconnu : dans ce cas c'est
    // l'artisan qui la donne, on n'invente pas.
    // `estimerDepuisPrix` reste disponible pour un artisan qui chiffre A L'HEURE,
    // mais ce n'est jamais le comportement par defaut.
    const parCadence = dureeSuggeree(l);
    const duree = estimer
      ? Math.max(0.5, Math.round((montant / taux) * 2) / 2)
      : parCadence;
    return {
      titre: intitule(l.description, l.lot),
      description: l.description || null,
      ordre: i + 1,
      duree_h: duree,
      // Ce que l'APP a propose. L'ecran de validation ne touche JAMAIS ce champ :
      // sans lui, la correction de l'artisan ecraserait notre estimation et on ne
      // pourrait plus mesurer si la cadence etait bonne.
      duree_estimee_h: duree,
      // D'ou vient la duree : 'cadence', 'prix', ou null si personne ne sait.
      duree_source: estimer ? 'prix' : (parCadence != null ? 'cadence' : null),
      delai_apres_h: delaiSuggere(l.description),
      mobilise_artisan: true,
      assigne_a: null,
      // Repères non enregistrés en base, utiles à l'écran de validation.
      _lot: l.lot || null,
      _montant_ht: montant,
    };
  });
}

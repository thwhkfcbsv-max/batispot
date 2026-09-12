// BatiSpot — Heures d'intervention.
//
// POURQUOI CE FICHIER (07/09/2026)
//
// Moctar : « on doit pouvoir créer des plannings avec dates OU heures, car
// certains métiers ont plusieurs interventions par jour ». Un dépannage à 8 h
// et un autre à 14 h chez deux clients différents ne sont pas la même chose
// qu'une journée de chantier.
//
// L'heure arrive écrite de six façons — « 9 », « 9h », « 9h30 », « 9 h 30 »,
// « 09:30 », et « 14:15:00 » quand elle revient de la base. Une seule forme
// part en base : HH:MM.
//
// RÈGLE DE PRUDENCE, la même que pour les numéros de téléphone (tel.js) : on
// ne convertit QUE ce qu'on reconnaît avec certitude. « matin », « 8-10 »,
// « 25h » ne deviennent pas une heure inventée — ils ne deviennent rien, et
// l'appelant redemande. Une heure fausse au planning envoie un artisan chez
// un client au mauvais moment.
//
// Fichier sans aucune dépendance, donc testable hors navigateur.

/**
 * Normalise une heure saisie librement en « HH:MM », ou `null`.
 * `null` n'est pas une erreur : c'est « à la journée », le cas majoritaire
 * d'un chantier au forfait.
 */
export function normaliserHeure(brut) {
  if (brut == null || brut === '') return null;
  const s = String(brut).trim().toLowerCase().replace(/\s+/g, '');
  // Le « h » peut rester seul (« 9h »), mais des minutes ne s'attrapent
  // JAMAIS sans séparateur : « 930 » n'est pas 9 h 30, c'est une faute de
  // frappe, et on ne devine pas une heure.
  const m = s.match(/^(\d{1,2})(?:[h:.](\d{2})?)?(?::\d{2})?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (!(h >= 0 && h <= 23) || !(min >= 0 && min <= 59)) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** « 08:30 » → « 8 h 30 » ; « 14:00 » → « 14 h ». Vide si rien à afficher. */
export function heureLisible(brut) {
  const n = normaliserHeure(brut);
  if (!n) return '';
  const [h, min] = n.split(':');
  return min === '00' ? `${Number(h)} h` : `${Number(h)} h ${min}`;
}

/**
 * Fin d'un créneau, déduite de la durée — jamais stockée : deux sources pour
 * la même information finissent toujours par diverger. Rend `null` s'il n'y a
 * pas d'heure de début, ou si la durée n'est pas exploitable.
 * Une intervention qui déborde sur le lendemain est ramenée à 23:59 : le
 * modèle ne porte qu'un jour, on ne fait pas semblant du contraire.
 */
export function heureFin(heureDebut, dureeH) {
  const debut = normaliserHeure(heureDebut);
  const duree = Number(dureeH);
  if (!debut || !Number.isFinite(duree) || duree <= 0) return null;
  const [h, min] = debut.split(':').map(Number);
  const total = h * 60 + min + Math.round(duree * 60);
  if (total >= 24 * 60) return '23:59';
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** « 8 h → 10 h 30 » pour un créneau, « » pour une étape à la journée. */
export function creneauLisible(heureDebut, dureeH) {
  const debut = heureLisible(heureDebut);
  if (!debut) return '';
  const fin = heureFin(heureDebut, dureeH);
  return fin ? `${debut} → ${heureLisible(fin)}` : debut;
}

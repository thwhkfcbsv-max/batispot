// BatiSpot — libellés de jours (15/09/2026).
//
// Le trait « aujourd'hui » du déroulement d'un chantier se pose AVANT le
// premier jour à venir (chantier.js, idée retenue avec Moctar le 08/09).
// Quand aucune étape ne tombe le jour même, ce trait se retrouve collé
// au-dessus d'un jour futur — et comme il est dessiné comme un titre de
// section (point + filet, capitales, .mq-auj), l'artisan lit « aujourd'hui
// = ce jour-là ». Moctar l'a signalé le 15/09 : une étape posée au
// 22 septembre s'affichait sous « AUJOURD'HUI ».
//
// Dater le libellé n'a pas suffi (Moctar, 15/09 15h43 : « aujourd'hui 15 sept
// et voir nettoyage le 22 sept, confusing ») : tant que le trait est dessiné
// comme un titre de rubrique, il s'approprie la ligne du dessous, datée ou non.
//
// Décision Moctar : le trait ne se pose QUE si une étape tombe le jour même.
// Dans une période creuse, il n'y a rien à mal lire parce qu'il n'y a rien.
export function libelleAujourdhui(iso) {
  const d = new Date(String(iso || '') + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return "aujourd'hui";
  const jour = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');
  return "aujourd'hui · " + jour;
}

// Le trait ne se pose que si une étape tombe le jour même — sinon il se
// retrouve collé au-dessus d'un jour futur qu'il a l'air de titrer. Et quand
// il se pose, c'est avant le premier jour À VENIR : la journée en cours reste
// au-dessus du trait, elle n'est pas finie.
export function poserTraitIci(joursPresents, cleAuj, jourCourant) {
  if (!Array.isArray(joursPresents)) return false;
  if (joursPresents.indexOf(cleAuj) === -1) return false;
  if (!jourCourant || jourCourant === 'sans-date') return false;
  return jourCourant > cleAuj;
}

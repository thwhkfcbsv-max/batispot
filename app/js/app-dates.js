// BatiSpot Pro — dates affichées, jamais écrites en dur
// Créé le 2026-08-22.
//
// Pourquoi ce fichier : « Août 2026 » était écrit en dur dans dashboard,
// finances, settings et planning. En septembre l'app aurait continué
// d'annoncer août — un chiffre juste sous une période fausse est un
// chiffre faux. Moctar l'a repéré au fait qu'août était le seul mois
// portant une majuscule : le seul écrit à la main.
//
// Usage : <span data-date="mois-annee"></span>
//   mois-annee  -> « août 2026 »
//   mois        -> « août »
//   jour-long   -> « samedi 22 août 2026 »
//   jour-court  -> « 22 août 2026 »
(function () {
  'use strict';

  // En français les mois ne prennent pas de majuscule ; on ne capitalise
  // que si le libellé commence la phrase (attribut data-capitale).
  function rendu(format, d) {
    switch (format) {
      case 'mois':       return d.toLocaleDateString('fr-FR', { month: 'long' });
      case 'jour-long':  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      case 'jour-court': return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      case 'mois-annee':
      default:           return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
  }

  function appliquer(racine) {
    const maintenant = new Date();
    (racine || document).querySelectorAll('[data-date]').forEach((el) => {
      let txt = rendu(el.dataset.date, maintenant);
      if (el.hasAttribute('data-capitale')) txt = txt.charAt(0).toUpperCase() + txt.slice(1);
      el.textContent = txt;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => appliquer());
  } else {
    appliquer();
  }
  window.bsAppliquerDates = appliquer;
})();

// ═══════════════════════════════════════════════════════════════════════════
// Rafraichissement au retour sur l'ecran.
//
// POURQUOI (03/09/2026)
// Moctar a modifie l'adresse d'un chantier, puis a regarde un autre ecran :
// l'ancienne valeur y etait encore. Il a conclu que l'enregistrement avait
// echoue — alors que la base avait bien recu la valeur.
//
// Cause : chaque ecran charge ses donnees UNE FOIS, a l'ouverture. Rien ne les
// recharge ensuite. Dans une application a onglets ou l'on passe de Devis a
// Chantier a Finances, on regarde donc en permanence des donnees figees a
// l'instant ou la page a ete ouverte. Le seul temps reel de l'app est la
// messagerie.
//
// CE QUE FAIT CE MODULE
// Il rappelle la fonction de chargement de l'ecran quand celui-ci redevient
// visible, a deux conditions :
//   - il a ete cache assez longtemps pour qu'une modification ait pu avoir
//     lieu ailleurs (seuil par defaut : 15 s) ;
//   - il n'y a pas de saisie en cours — recharger sous les doigts de
//     quelqu'un qui remplit un formulaire serait pire que le mal.
//
// CE QU'IL NE FAIT PAS
// Pas de sondage, pas de minuterie, pas d'abonnement temps reel. On ne
// rafraichit qu'au moment ou l'artisan revient regarder : c'est la seule
// seconde ou ca lui sert, et ca ne coute rien le reste du temps.
// ═══════════════════════════════════════════════════════════════════════════

(function () {
  const SEUIL_MS = 15000;
  let cacheDepuis = null;
  const abonnes = [];

  // Un formulaire en cours de saisie ne doit jamais etre rafraichi sous les
  // doigts : on perdrait ce que l'artisan est en train d'ecrire.
  function saisieEnCours() {
    const a = document.activeElement;
    if (!a) return false;
    const t = (a.tagName || '').toLowerCase();
    if (t === 'input' || t === 'textarea' || t === 'select') return true;
    if (a.isContentEditable) return true;
    // Une feuille ou une modale REELLEMENT visible compte aussi comme
    // « occupe ». ⚠️ Ne pas se fier a l'attribut style : une feuille fermee
    // garde souvent `display:none` ecrit par-dessus un `align-items:flex-end`
    // — un selecteur [style*="flex"] la croyait ouverte et bloquait TOUT
    // rafraichissement. On mesure ce qui est affiche, pas ce qui est ecrit.
    const modales = document.querySelectorAll('[role="dialog"]');
    for (const m of modales) {
      if (m.hidden) continue;
      const st = window.getComputedStyle(m);
      if (st.display !== 'none' && st.visibility !== 'hidden') return true;
    }
    return false;
  }

  function reveiller() {
    if (document.visibilityState !== 'visible') return;
    const absent = cacheDepuis ? Date.now() - cacheDepuis : 0;
    cacheDepuis = null;
    if (absent < SEUIL_MS) return;
    if (saisieEnCours()) return;
    abonnes.forEach((fn) => {
      try { fn(); } catch (e) { console.warn('[refresh]', e); }
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') cacheDepuis = Date.now();
    else reveiller();
  });

  // Retour arriere depuis le cache du navigateur : la page n'est pas
  // reexecutee, seul cet evenement le signale.
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) { cacheDepuis = Date.now() - SEUIL_MS - 1; reveiller(); }
  });

  // Enregistre une fonction de rechargement. Appelable plusieurs fois par
  // ecran si plusieurs jeux de donnees sont a rafraichir.
  window.bsRafraichirAuRetour = function (fn) {
    if (typeof fn === 'function') abonnes.push(fn);
  };
})();

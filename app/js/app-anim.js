// ═══════════════════════════════════════════════════════════════════════════
// Mouvement — les trois gestes que les écrans partagent.
//
// POURQUOI CE FICHIER (07/09/2026)
// Moctar : « rendre l'appli plus dynamique ». Ce qui manquait n'était pas de
// la décoration : c'était le sentiment que l'app répond. Trois manques
// précis, les mêmes sur tous les écrans :
//   1. l'attente est un MOT (« Chargement… ») au lieu d'être la forme de ce
//      qui arrive — l'écran paraît vide, puis tout apparaît d'un coup ;
//   2. une liste surgit au lieu de se poser ;
//   3. un montant important s'affiche déjà là, donc personne ne le regarde.
//
// Le style vit dans app.css (section « MOUVEMENT »), qui coupe tout quand le
// téléphone demande des animations réduites. Ce fichier ne fait que fabriquer
// le DOM correspondant. Rien ici n'est nécessaire à la lecture d'un écran :
// si ce script ne se charge pas, les pages fonctionnent, sans mouvement.
//
// Volontairement en script classique et non en module : il est chargé par des
// pages qui n'ont pas toutes de graphe de modules, et il ne dépend de rien.
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  /**
   * Squelette de chargement : `n` blocs à la forme de ce qui va arriver.
   * À poser à la place du « Chargement… » — jamais en plus, sinon l'écran
   * annonce deux fois la même attente.
   * @param {number} n      nombre de blocs (2 à 4 suffisent : au-delà on
   *                        promet une longueur qu'on ne connaît pas encore)
   * @param {{court?: boolean}} [opts] `court` pour des lignes de liste
   */
  function bsSquelette(n, opts) {
    const zone = document.createElement('div');
    zone.className = 'bs-skel' + (opts && opts.court ? ' bs-skel-court' : '');
    // Une attente doit s'entendre autant qu'elle se voit : un lecteur d'écran
    // ne saurait rien dire de trois rectangles gris.
    zone.setAttribute('role', 'status');
    zone.setAttribute('aria-label', 'Chargement en cours');
    const combien = Math.max(1, Math.min(Number(n) || 3, 6));
    for (let i = 0; i < combien; i++) zone.appendChild(document.createElement('i'));
    return zone;
  }

  /**
   * Pose la cascade sur une liste, et LA RETIRE une fois l'entrée jouée.
   *
   * Pourquoi la retirer : la cascade rend ses enfants transparents avant leur
   * tour (fill-mode). Tant que la classe est là, un contenu dont l'animation
   * ne démarrerait pas — parce qu'il naît dans un onglet masqué, parce qu'un
   * navigateur fait autrement — resterait invisible. Une liste illisible est
   * un bug ; une liste sans animation n'est rien du tout. Passé 600 ms
   * (240 ms de décalage + 220 ms d'animation, large), la classe n'a plus
   * aucune raison d'être et le style redevient le style normal.
   */
  function bsCascade(el) {
    if (!el) return;
    el.classList.add('bs-cascade');
    clearTimeout(el.__bsCascade);
    el.__bsCascade = setTimeout(() => el.classList.remove('bs-cascade'), 600);
  }

  /**
   * Rejoue une animation déjà posée sur un élément (changement d'onglet :
   * le contenu est remplacé, mais l'élément conteneur, lui, ne change pas —
   * sans ce redémarrage forcé, le navigateur ne rejoue rien).
   */
  function bsRejouer(el, classe) {
    if (!el) return;
    el.classList.remove(classe);
    void el.offsetWidth;          // force le recalcul : c'est ce qui rearme
    el.classList.add(classe);
    // Même filet que la cascade : la classe part une fois l'entrée jouée, pour
    // qu'aucun contenu ne puisse rester transparent si l'animation ne démarre
    // pas (élément re-masqué entre-temps, navigateur qui fait autrement).
    clearTimeout(el.__bsRejoue);
    el.__bsRejoue = setTimeout(() => el.classList.remove(classe), 400);
  }

  /**
   * Fait monter un nombre jusqu'à sa valeur. Réservé aux deux ou trois
   * chiffres qui comptent : partout ailleurs, c'est un gadget qui retarde la
   * lecture.
   *
   * Le texte final est TOUJOURS écrit, y compris si l'animation est coupée
   * (animations réduites, onglet en arrière-plan, erreur) : un montant faux
   * une fraction de seconde est un bug, pas une animation.
   */
  function bsCompteur(el, valeur, format, formatFinal) {
    if (!el) return;
    const cible = Number(valeur);
    // Deux formats : celui qui défile peut arrondir (des centimes qui
    // clignotent ne se lisent pas), celui qui se pose est le vrai — un
    // montant faux ne serait pas une animation, ce serait un bug.
    const ecrire = (v, fin) => {
      const f = (fin && typeof formatFinal === 'function') ? formatFinal : format;
      el.textContent = typeof f === 'function' ? f(v) : String(v);
    };
    const reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!Number.isFinite(cible) || reduit || typeof requestAnimationFrame !== 'function') { ecrire(cible, true); return; }

    const duree = 400;
    const depart = performance.now();
    function pas(maintenant) {
      const t = Math.min(1, (maintenant - depart) / duree);
      // Décélération : l'essentiel du chemin est fait tout de suite, la fin
      // se pose. Un compte linéaire donne l'impression d'un chargement.
      ecrire(cible * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(pas); else ecrire(cible, true);
    }
    requestAnimationFrame(pas);
  }

  window.bsSquelette = bsSquelette;
  window.bsCascade = bsCascade;
  window.bsRejouer = bsRejouer;
  window.bsCompteur = bsCompteur;
})();

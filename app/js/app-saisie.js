// BatiSpot — correcteur d'orthographe natif sur tous les champs (15/09/2026,
// Moctar : « je voudrais que le correcteur ortho auto soit présent dans tous
// les champs où on écrit »).
//
// Pourquoi ici et pas dans le HTML : l'app compte ~80 champs de saisie, dont
// beaucoup sont créés en JavaScript (étapes, lignes de devis, fils de
// discussion). Poser l'attribut à la main dans le balisage laisserait dehors
// tout ce qui naît après le chargement. Un seul endroit, plus un observateur
// pour ce qui arrive ensuite.
//
// Ce qu'on active : spellcheck (soulignement rouge), autocapitalize
// (majuscule en début de phrase) et autocorrect (correction du clavier iOS).
// Rien qui coûte un appel au serveur — c'est le clavier et le navigateur qui
// travaillent.
//
// Ce qu'on NE touche pas :
//   - un champ qui porte déjà l'attribut : une décision explicite prime
//     (ex. le code couleur #228B5B de profile-entreprise, en spellcheck=false
//     à dessein — un hexadécimal souligné en rouge n'aide personne) ;
//   - les types qui ne sont pas de la prose : email, url, mot de passe,
//     nombre, téléphone, date, code de vérification ;
//   - tout champ marqué data-sans-correction.
(function () {
  'use strict';

  var TYPES_PROSE = ['text', 'search', ''];

  function estProse(el) {
    if (el.hasAttribute('data-sans-correction')) return false;
    var tag = el.tagName;
    if (tag === 'TEXTAREA') return true;
    if (el.isContentEditable) return true;
    if (tag !== 'INPUT') return false;
    var t = (el.getAttribute('type') || '').toLowerCase();
    if (TYPES_PROSE.indexOf(t) === -1) return false;
    // inputmode dit ce que le champ attend vraiment quand le type reste
    // « text » : un montant ou un code n'est pas de la prose.
    var im = (el.getAttribute('inputmode') || '').toLowerCase();
    if (im && im !== 'text') return false;
    // Un champ d'un caractère (case OTP) ou un code court : pas de prose.
    var max = parseInt(el.getAttribute('maxlength') || '', 10);
    if (!isNaN(max) && max <= 8) return false;
    return true;
  }

  function equiper(el) {
    if (!el || el.__bsSaisie) return;
    el.__bsSaisie = true;
    if (!estProse(el)) return;
    if (!el.hasAttribute('spellcheck')) el.setAttribute('spellcheck', 'true');
    if (!el.hasAttribute('autocapitalize')) el.setAttribute('autocapitalize', 'sentences');
    if (!el.hasAttribute('autocorrect')) el.setAttribute('autocorrect', 'on');
  }

  function balayer(racine) {
    if (!racine || !racine.querySelectorAll) return;
    var champs = racine.querySelectorAll('input, textarea, [contenteditable]');
    for (var i = 0; i < champs.length; i++) equiper(champs[i]);
  }

  function demarrer() {
    balayer(document);
    if (typeof MutationObserver !== 'function') return;
    new MutationObserver(function (lots) {
      for (var i = 0; i < lots.length; i++) {
        var ajouts = lots[i].addedNodes;
        for (var j = 0; j < ajouts.length; j++) {
          var n = ajouts[j];
          if (n.nodeType !== 1) continue;
          equiper(n);
          balayer(n);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();

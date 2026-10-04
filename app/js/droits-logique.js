// Logique pure des droits d'affichage — aucune dépendance réseau, aucun DOM.
//
// POURQUOI CE FICHIER EXISTE
// La règle « qui voit quel onglet » vivait dans supabase.js (qui importe le SDK
// depuis un CDN) et dans nav-roles.js (qui manipule le DOM). Résultat : elle
// n'était testable qu'en ouvrant l'app dans un navigateur, connecté. Le jour où
// l'onglet Devis est resté visible pour un ouvrier, rien n'a pu le dire.
//
// Tout ce qui décide est ici, en fonctions pures. supabase.js et nav-roles.js
// n'en sont plus que les points d'application, et `tests/droits.test.mjs` peut
// vérifier chaque rôle sans navigateur ni base.
//
// ⚠️ Ceci reste du CONFORT D'AFFICHAGE. La sécurité est en SQL (policies RLS).
// Masquer un onglet n'a jamais protégé une donnée.

/** Droits de repli quand mes_droits() ne répond pas : un artisan seul est patron. */
export const DROITS_SOLO = {
  role: 'patron', patron: true, encadrement: true,
  voit_prix: true, voit_marges: true, voit_devis: true, entreprise: null,
};

/**
 * Surcouches d'aperçu. `patron` = aucune surcouche (ses droits réels).
 * Ces valeurs doivent rester alignées sur mes_droits() en base :
 * un compagnon n'a NI devis NI marges NI prix.
 */
export const ROLES_SIMULES = {
  patron:    null,
  chef:      { role: 'chef',      patron: false, encadrement: true,
               voit_prix: true,  voit_marges: false, voit_devis: true },
  compagnon: { role: 'compagnon', patron: false, encadrement: false,
               voit_prix: false, voit_marges: false, voit_devis: false },
};

/**
 * Applique un aperçu de rôle sur des droits réels.
 * Un seul garde-fou, et il est essentiel : **seul un patron réel peut simuler**.
 * Quelqu'un dont le compte est déjà restreint ne peut pas s'élargir l'affichage.
 *
 * @param {object} reels   droits renvoyés par mes_droits()
 * @param {string|null} simule  rôle demandé, ou null
 * @returns {object} droits à utiliser par l'interface
 */
export function appliquerSimulation(reels, simule) {
  if (!reels) return reels;
  if (!simule || reels.patron !== true) return reels;
  const surcouche = ROLES_SIMULES[simule];
  if (!surcouche) return reels;
  return { ...reels, ...surcouche, role_reel: reels.role, simule };
}

/**
 * Onglet de la barre du bas -> condition d'affichage.
 * Absent de la table = toujours visible.
 *
 * Les deux règles exigent `=== true`, jamais « différent de false » : un
 * `!== false` laisse passer un champ absent, et l'onglet réapparaîtrait en
 * silence le jour où mes_droits() cesse de renvoyer la clé.
 */
export const REGLES_ONGLETS = {
  'devis.html':    (d) => d.voit_devis === true,
  'finances.html': (d) => d.patron === true || d.voit_marges === true,
};

/**
 * @param {string} href  href de l'onglet, complet ou non ('./devis.html')
 * @param {object} droits
 * @returns {boolean} true si l'onglet doit rester affiché
 */
export function ongletVisible(href, droits) {
  const fichier = String(href || '').split('/').pop().split('?')[0];
  const regle = REGLES_ONGLETS[fichier];
  if (!regle) return true;
  if (!droits) return true;   // pas de droits connus : la base tranchera
  return regle(droits);
}

/**
 * Sections du profil réservées à l'encadrement (patron ou chef).
 * Un ouvrier n'a rien à faire dans le SIRET de l'entreprise : son profil se
 * limite à ses informations, SES documents et SON équipe.
 */
export function voitSectionsEntreprise(droits) {
  return !!droits && droits.encadrement === true;
}

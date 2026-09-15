// Filtre la barre du bas selon le rôle de l'utilisateur.
//
// POURQUOI CE FICHIER EXISTE
// La barre est codée en dur, identique sur les 11 pages : un compagnon voyait
// les onglets « Devis » et « Finances », cliquait, et tombait sur un écran de
// refus. Le commentaire de mesDroits() dans supabase.js annonçait pourtant
// l'intention — « masquer un bouton qui échouerait » — mais rien ne l'appliquait.
//
// ⚠️ Ceci est du CONFORT, pas de la sécurité. La protection réelle vient des
// policies RLS en base, qui refusent la donnée quoi qu'affiche l'écran. Masquer
// un onglet n'a jamais protégé quoi que ce soit — ça évite juste de proposer
// une porte fermée.

import { mesDroits } from './supabase.js';
import { ongletVisible } from './droits-logique.js';

export async function filtrerNavigation() {
  let droits;
  try {
    droits = await mesDroits();
  } catch (_) {
    return;   // hors ligne : on ne masque rien, la base tranchera
  }
  if (!droits) return;

  if (droits.simule) bandeauSimulation(droits);

  document.querySelectorAll('a.bn-i, a[class^="bn-i"]').forEach((a) => {
    if (!ongletVisible(a.getAttribute('href'), droits)) a.remove();
  });

  // La barre répartit ses onglets en largeur : en retirer sans rééquilibrer
  // laisse un trou. On laisse le CSS flex faire, mais on marque le compte réel
  // pour d'éventuels ajustements de style.
  const barre = document.querySelector('.bn, .bottom-nav');
  if (barre) barre.dataset.onglets = String(barre.querySelectorAll('a').length);
}

// Un mode de test invisible est un piège : on finit par croire que l'app est
// cassée. Le bandeau reste affiché tant que la simulation est active, sur
// toutes les pages, et permet d'en sortir d'un clic.
function bandeauSimulation(droits) {
  if (document.getElementById('bs-simu')) return;
  const b = document.createElement('div');
  b.id = 'bs-simu';
  b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;'
    + 'background:#B45309;color:#FFFFFF;font:600 12.5px/1.35 Inter,system-ui,sans-serif;'
    + 'padding:7px 12px;display:flex;gap:10px;align-items:center;justify-content:center;'
    + 'text-align:center;';
  const t = document.createElement('span');
  t.textContent = `Aperçu « ${droits.role} » — affichage seulement, vos droits réels n'ont pas changé`;
  const q = document.createElement('button');
  q.type = 'button';
  q.textContent = 'Quitter';
  q.style.cssText = 'background:#FFFFFF;color:#B45309;border:0;border-radius:6px;'
    + 'padding:4px 10px;font:700 12px Inter,system-ui,sans-serif;cursor:pointer;flex:none;';
  q.addEventListener('click', async () => {
    const m = await import('./supabase.js');
    m.simulerRole(null);
    location.reload();
  });
  b.append(t, q);
  document.body.prepend(b);
  // Le bandeau est en position fixe : sans décalage il masque l'en-tête.
  document.body.style.paddingTop = `${b.offsetHeight}px`;
}

// Auto-exécution : la page n'a rien à faire d'autre que charger ce module.
filtrerNavigation();

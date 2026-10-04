// Facture : ce qui est commun a l'ecran Finances, a l'assistant et a l'envoi.
//
// `lienFacture` vivait en dur dans `onPartagerPdf` (app/finances.html) et
// l'assistant en aurait fait une seconde copie : deux endroits ou changer le
// chemin du document client, donc un jour deux liens differents — dont un
// casse chez le client. Une seule composition, ici.
//
// Le document se lit par le TOKEN DU CHANTIER (`chantiers.public_token`) :
// c'est lui qui autorise la lecture cote client, pas l'identifiant de la
// facture. Sans token, il n'y a pas de lien a donner — on renvoie une chaine
// vide et l'appelant le DIT, plutot que de fabriquer une URL qui affichera
// « lien invalide » au client.
//
// La base est `APP_URL` (js/config.js), JAMAIS `location.origin` : ce lien est
// destine a un client, et en local `location.origin` vaut `localhost:8000` —
// une adresse que personne d'autre que le navigateur de l'artisan ne peut
// ouvrir. Meme regle que `lienSuivi` (js/app-actions.js).
const BASE_APP = () => (typeof window !== 'undefined'
  && window.__BATISPOT_CONFIG__ && window.__BATISPOT_CONFIG__.APP_URL)
  || 'https://batispot.pro/app';

// Composition de base : le couple (token du chantier, identifiant de facture).
// `envoyerFacture` (js/supabase.js) tient ces deux valeurs separement, avant
// d'avoir jamais construit d'objet facture — d'ou cette forme, appelee aussi
// par `lienFacture`.
export function lienFactureDepuis(token, idFacture) {
  if (!token || !idFacture) return '';
  return `${BASE_APP()}/facture-document.html`
    + `?t=${encodeURIComponent(token)}&f=${encodeURIComponent(idFacture)}`;
}

// La forme courante : une facture telle que la lisent l'ecran Finances et
// l'assistant, avec son chantier joint.
export function lienFacture(f) {
  return lienFactureDepuis(f && f.chantiers && f.chantiers.public_token, f && f.id);
}

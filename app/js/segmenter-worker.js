// Segmentation dans un WEB WORKER (04/10/2026, « plus rapide, sans commune mesure »).
// L'inférence (30 à 700 ms selon le téléphone) ne bloque plus le fil principal :
// la caméra et le viseur restent fluides pendant le film. La page envoie un
// ImageBitmap (transféré, pas copié) et reçoit les frontières, légères.
//
// Messages reçus : { type: 'charger', url, id } · { type: 'segmenter', bitmap, id }
// Messages rendus : { type: 'pret', id, fournisseur, chargement_ms, taille }
//                   { type: 'resultat', id, frontieres, temps, largeur, hauteur }
//                   { type: 'erreur', id, message }
let seg = null;

self.onmessage = async (e) => {
  const d = e.data || {};
  try {
    if (d.type === 'charger') {
      const M = await import('./segmenter.js');
      seg = await M.Segmenteur.charger(d.url);
      self.postMessage({ type: 'pret', id: d.id, fournisseur: seg.fournisseur, chargement_ms: Math.round(seg.tempsChargement || 0), taille: seg.taille });
    } else if (d.type === 'segmenter') {
      if (!seg) throw new Error('segmenteur non chargé');
      const r = await seg.segmenter(d.bitmap);
      try { d.bitmap.close(); } catch (_) {}
      // Seules les frontières voyagent (2 × ~400 points) : pas le masque ni les logits.
      self.postMessage({ type: 'resultat', id: d.id, frontieres: r.frontieres, ouvertures: r.ouvertures || [], temps: r.temps, largeur: r.largeur, hauteur: r.hauteur });
    }
  } catch (err) {
    self.postMessage({ type: 'erreur', id: d.id, message: String(err && err.message || err) });
  }
};

// sw.js — DÉSACTIVÉ le 15/08/2026 : il servait du contenu périmé (vieilles pages en cache).
// Auto-désenregistrement + purge de tous les caches → contenu toujours frais côté visiteurs.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) { try { client.navigate(client.url); } catch (e) {} }
    } catch (e) {}
  })());
});
// aucun handler fetch : toutes les requêtes vont directement au réseau

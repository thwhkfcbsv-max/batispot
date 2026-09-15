// devis/sw.js — neutralisé : auto-désenregistrement + purge caches (évite le contenu périmé)
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',(e)=>{e.waitUntil((async()=>{try{const k=await caches.keys();await Promise.all(k.map(x=>caches.delete(x)));await self.registration.unregister();const c=await self.clients.matchAll({type:'window'});for(const cl of c){try{cl.navigate(cl.url)}catch(_){}} }catch(_){}})())});

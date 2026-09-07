// Service worker BatiSpot App
// Stratégie : network-first pour HTML/JS/CSS (pour maj rapides)
//              cache-first pour assets (icons, fonts)

// A INCREMENTER a chaque changement d'un fichier de STATIC ci-dessous.
// Sans ca, l'ancien pre-cache survit : les visiteurs deja venus gardent
// l'ancien config.js / settings.html tant que le reseau ne repond pas.
// ⚠️ A INCREMENTER A CHAQUE PUBLICATION. Elle etait restee au 29/08 pendant
// que devis.html, supabase.js et app-actions.js changeaient : les artisans
// gardaient l'ancien precache. C'est le mecanisme exact de l'onglet Devis
// reste visible a un ouvrier pendant des heures.
const VERSION = 'v131-2026-09-07-mouvement';
const CACHE = `batispot-app-${VERSION}`;
const OFFLINE_PAGE = './offline.html';
const STATIC = [
  './',
  './index.html',
  './welcome.html',
  './login.html',
  './client-login.html',
  './dashboard.html',
  './client.html',
  './client-profile.html',
  './demande-devis.html',
  './chantier.html',
  './suivi.html',
  './settings.html',
  './profile.html',
  './profile-entreprise.html',
  './documents.html',
  './inscription-pro.html',
  './auth-callback.html',
  './404.html',
  './offline.html',
  './devis-document.html',
  './facture-document.html',
  './client-settings.html',
  './rejoindre.html',
  './dm.html',
  // simulator.html et simulator-screens.html ont ete RETIRES le 26/08.
  // Ce sont des outils de dev, exclus de la publication depuis aad13e8df
  // (23/08) : ils repondaient 404 en ligne et faisaient echouer tout le
  // pre-cache. Ne jamais remettre ici une ressource listee dans EXCLUS
  // de scripts/publier_site.sh.
  './manifest.json',
  './css/app.css',
  './css/simulator-screens.css',
  './js/config.js',
  './js/supabase.js',
  './js/nav-roles.js',
  './js/droits-logique.js',
  './js/metre-geometrie.js',
  './js/chantier.js',
  './js/install-prompt.js',
  './js/app-menu.js',
  './js/app-nav.js',
  './js/push-helper.js',
  // Importe par suivi.html, client.html et dashboard.html : sans lui dans le
  // precache, ces trois pages echouent a l'import quand le reseau tombe.
  './js/tel.js',
  // ⚠️ ONZE MODULES MANQUAIENT (02/09/2026), soit 264 Ko reellement charges par
  // les pages et jamais precaches. Certains en <script> statique — la page
  // mourait a froid ; d'autres en import dynamique. `devis-store.js` est le
  // pire oubli : c'est lui qui garantit l'enregistrement local d'un devis
  // quand le reseau tombe, la promesse meme de l'application sur chantier.
  './js/devis-store.js',
  './js/app-actions.js',
  './js/app-planning-engine.js',
  './js/app-alerte.js',
  './js/app-erreurs.js',
  './js/app-assistant.js',
  './js/app-knowledge-btp.js',
  './js/app-dictee-btp.js',
  './js/app-wizard.js',
  './js/app-dates.js',
  './js/app-import-devis.js',
  './js/chantier-dossier.js',
  './js/messages-directs.js',
  './js/app-barre-assistant.js',
  './js/app-anim.js',
  './fonts/inter-latin.woff2',
  './fonts/inter-latin-ext.woff2',
  './js/mq-thread.js',
  './js/photos-galerie.js',
  './js/app-demarrage.js',
  './css/photos.css',
  './css/demarrage.css',
  './js/app-dictee-serveur.js',
  // Compose le lien du document client d'une facture. Importe par
  // finances.html ET app-actions.js : sans lui, l'ecran Finances meurt a froid.
  './js/app-factures.js',
  './icons/logo.svg',
  './icons/icons.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      // addAll() est ATOMIQUE : une seule ressource en 404 rejette la
      // promesse et le cache reste VIDE. Le .catch(() => null) d'avant
      // avalait l'erreur en silence — depuis le 23/08 le pre-cache ne
      // contenait rien du tout, chaque page repartait au reseau.
      // On met en cache ressource par ressource : un echec n'annule que lui.
      Promise.all(STATIC.map((url) =>
        c.add(url).catch((err) => {
          console.warn('[sw] pre-cache ignore:', url, err && err.message);
          return null;
        })
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k.startsWith('batispot-app-')).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
     .then(() => self.clients.matchAll({ type: 'window' }))
     .then(clients => clients.forEach(c => c.postMessage({ type: 'sw-updated', version: VERSION })))
  );
});

// Permet aux pages de demander un skipWaiting (banner "Nouvelle version")
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Supabase API : toujours network
  if (url.hostname.includes('supabase')) return;

  // ⚠️ LES MODULES DU CDN — la cause n°1 des pannes hors ligne (02/09/2026).
  //
  // `app/js/supabase.js` importe supabase-js depuis esm.sh, qui le sert en une
  // chaine de 9 requetes. Aucune ne passait par ce gestionnaire : la premiere
  // branche exige `url.origin === location.origin` (faux), la seconde ne prend
  // que les images et les polices. Rien n'etait donc mis en cache.
  //
  // Consequence mesuree : hors ligne, `supabaseLoaded === false` sur TOUTES les
  // pages, meme precachees. La coquille s'affichait, les donnees jamais. Un
  // artisan dans une cage d'escalier ouvrait une application vide.
  //
  // Ces URL portent leur version (`@2.45.0`) : leur contenu ne change jamais.
  // Cache-first est donc exact, et non un pari — on ne sert jamais une version
  // perimee, et on economise 9 allers-retours a chaque chargement.
  if (url.hostname === 'esm.sh' || url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        // Une reponse opaque (statut 0) ne se relit pas : ne pas la stocker,
        // sinon on met un trou en cache pour toujours.
        if (res && res.ok) {
          const copie = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copie)).catch(() => {});
        }
        return res;
      }))
    );
    return;
  }

  // HTML/JS/CSS same-origin : network-first avec fallback offline
  // (parenthèses obligatoires : sinon précédence && > || ferait passer du cross-origin avec / final)
  if (url.origin === location.origin && (/\.(html|js|css|json|woff2)$/i.test(url.pathname) || url.pathname.endsWith('/'))) {
    const isHtml = /\.html$/i.test(url.pathname) || url.pathname.endsWith('/');
    // Réseau d'abord, SANS le couper (retour Moctar 05/09 : « des anciennes
    // versions persistent »). Avant, un AbortController tuait la requête à
    // 3 s et servait l'ancien fichier du cache : sur une 4G faible, ça
    // arrivait à chaque écran, et le cache n'était jamais rafraîchi puisque
    // la requête était morte. Maintenant : si le réseau met plus de 4 s, on
    // sert le cache pour ne pas bloquer l'artisan, MAIS la requête continue
    // en arrière-plan et remplace l'entrée du cache — le prochain écran est
    // à jour. Polices Inter incluses (même logique, elles étaient chez
    // Google et jamais en cache).
    const reseau = fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaqueredirect')) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    });
    const tropLent = new Promise((resolve) => setTimeout(() => resolve(null), 4000));
    e.waitUntil(reseau.catch(() => {}));
    // (06/09, Moctar : « réduire le temps de latence d'une fonctionnalité à
    // une autre ») : CACHE D'ABORD, rafraîchi en arrière-plan (`reseau` est
    // déjà parti et met la copie à jour pour la fois d'après). Une mise en
    // ligne change VERSION → nouveau cache + bandeau « Nouvelle version ».
    // Sans copie : réseau (4 s), puis cache approximatif (ignoreSearch : le
    // precache stocke ./css/app.css, la page demande ./css/app.css?v=…),
    // puis page hors ligne.
    e.respondWith((async () => {
      const enCache = await caches.match(req) || await caches.match(req, { ignoreSearch: true });
      if (enCache) return enCache;
      const res = await Promise.race([reseau.catch(() => null), tropLent]);
      if (res) return res;
      const tardif = await reseau.catch(() => null);
      if (tardif) return tardif;
      if (isHtml) {
        const offline = await caches.match(OFFLINE_PAGE);
        if (offline) return offline;
      }
      return new Response('', { status: 504, statusText: 'Offline and no cache available' });
    })());
  }
});

// ─────────────────────────────────────────────────────────
// Push notifications (P2.2)
// Le serveur (Edge function Supabase) envoie un push avec un payload JSON :
//   { title, body, url, tag, icon }
// Le SW affiche une notification native. Au clic → focus/ouverture de l'URL.
// ─────────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch (_) {
    // Payload non-JSON : on tente du texte
    data = { title: 'BatiSpot', body: e.data ? e.data.text() : '' };
  }
  const title = data.title || 'BatiSpot';
  const options = {
    body: data.body || '',
    icon: data.icon || '/app/icons/icon-192.png',
    badge: '/app/icons/icon-192.png',
    tag: data.tag || 'batispot-push',
    renotify: !!data.tag,
    data: { url: data.url || '/app/' },
    requireInteraction: false,
    silent: false,
  };
  // Badge sur l'icône de l'app (demande du fondateur, correctif révision
  // tâche 19, 04/09) : un point rouge, jamais un nombre précis (data.badge
  // n'existe pas côté serveur aujourd'hui — inutile d'inventer un compte).
  // Support : iOS = appli installée sur l'écran d'accueil + notifications
  // acceptées (16.4+) ; Android Chrome fonctionne directement. Sur un
  // navigateur qui ne supporte pas l'API, setAppBadge est simplement absent
  // — jamais bloquant pour l'affichage de la notification elle-même.
  e.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      if (self.navigator && self.navigator.setAppBadge) {
        return self.navigator.setAppBadge(data.badge || undefined).catch(() => {});
      }
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/app/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      // Si une fenetre BatiSpot est deja ouverte, on la focus
      for (const w of wins) {
        if (w.url.includes('/app/') && 'focus' in w) {
          w.focus();
          if ('navigate' in w) w.navigate(url);
          return;
        }
      }
      // Sinon on en ouvre une nouvelle
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

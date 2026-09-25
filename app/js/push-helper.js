// push-helper.js — helpers pour activer les notifications push.
// Fonctionne avec le backend Supabase deja en place :
//   navigateur -> subscribe-push (Edge function) -> table push_subscriptions
//   evenement  -> trigger SQL    -> send-push     -> navigateur (sw.js, evenement 'push')
//
// Usage cote page :
//   import { isPushSupported, getPushPermission, enablePush, disablePush } from './push-helper.js';
//   if (isPushSupported()) { await enablePush('pro'); }
//
// ⚠️ 04/09/2026 — enablePush() abonnait le navigateur au PushManager mais
// n'envoyait JAMAIS la subscription au backend (aucun appel a l'Edge function
// 'subscribe-push') : la table push_subscriptions restait vide quel que soit
// le nombre d'artisans qui cliquaient "Activer". C'est desormais fait ici,
// au meme endroit que l'abonnement navigateur, pour qu'aucune page appelante
// ne puisse oublier cette moitie du travail.
import { supabase, getSession } from './supabase.js';

const VAPID_PUBLIC_KEY = (window.__BATISPOT_CONFIG__ && window.__BATISPOT_CONFIG__.VAPID_PUBLIC_KEY) || '';

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPushPermission() {
  return isPushSupported() ? Notification.permission : 'unsupported';
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// Envoie la subscription au backend (table push_subscriptions, via l'Edge
// function 'subscribe-push' — voir supabase/functions/subscribe-push).
async function enregistrerAbonnementBackend(sub, role) {
  const { error } = await supabase.functions.invoke('subscribe-push', {
    body: { subscription: sub.toJSON(), role: role === 'client' ? 'client' : 'pro' },
  });
  if (error) {
    throw new Error("L'abonnement n'a pas pu etre enregistre sur le serveur. Reessayez.");
  }
}

// Demande la permission a l'OS, abonne le navigateur au push manager PUIS
// enregistre cet abonnement cote serveur (sans quoi aucun push ne peut
// jamais etre envoye a cet appareil).
// role: 'pro' (par defaut, artisan) ou 'client'.
export async function enablePush(role = 'pro') {
  if (!isPushSupported()) {
    throw new Error('Push notifications non supportees sur cet appareil.');
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('VAPID public key non configuree. Voir push-helper.js commentaires.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permission refusee. Activer les notifications dans les reglages du navigateur.');
  }
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  await enregistrerAbonnementBackend(sub, role);
  return sub;
}

// Desabonne le user du push manager ET supprime l'enregistrement cote
// backend (best-effort : la RLS de push_subscriptions limite de toute facon
// la suppression a ses propres lignes).
export async function disablePush() {
  if (!isPushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;
  const endpoint = sub.endpoint;
  const ok = await sub.unsubscribe();
  try {
    const session = await getSession();
    if (session) {
      await supabase.from('push_subscriptions').delete()
        .eq('user_id', session.user.id).eq('endpoint', endpoint);
    }
  } catch (_) { /* best-effort : l'important est le desabonnement navigateur ci-dessus */ }
  return ok;
}

export async function getCurrentSubscription() {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

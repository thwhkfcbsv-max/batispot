// BatiSpot — Correcteur d'orthographe (06/09/2026, Moctar : « mets en place un
// correcteur d'orthographe »).
//
// Un texte de l'artisan (message au client, note, fil d'équipe) est relu par le
// serveur (mode `corriger-texte` de gemini-assistant) : orthographe, accords,
// ponctuation — jamais de reformulation. Le résultat revient ICI et remplace le
// champ ; l'artisan relit et envoie lui-même. Le mode est journalisé et soumis
// aux quotas comme les autres.
import { getSession } from './supabase.js';

export async function corrigerTexte(texte) {
  const t = String(texte || '').trim();
  if (!t) return { texte: '', nb_corrections: 0 };
  if (t.length > 4000) throw new Error('Texte trop long pour une correction en une fois (4 000 caractères maximum).');
  const cfg = window.__BATISPOT_CONFIG__ || {};
  const url = (cfg.SUPABASE_URL || 'https://cisniwhaiydazdpzvino.supabase.co') + '/functions/v1/gemini-assistant';
  const session = await getSession();
  const jeton = session && session.access_token;
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.SUPABASE_ANON_KEY) headers.apikey = cfg.SUPABASE_ANON_KEY;
  headers.authorization = 'Bearer ' + (jeton || cfg.SUPABASE_ANON_KEY || '');
  const ctrl = new AbortController();
  const killer = setTimeout(() => ctrl.abort(), 20000);
  let r;
  try {
    r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ mode: 'corriger-texte', prompt: t }), signal: ctrl.signal });
  } catch (_) {
    clearTimeout(killer);
    throw new Error('Pas de réseau : la correction a besoin d’une connexion.');
  }
  clearTimeout(killer);
  let j = {};
  try { j = await r.json(); } catch (_) {}
  if (r.status === 429) throw new Error('Le budget du jour est atteint : la correction revient demain.');
  if (!r.ok || j.error) throw new Error('La correction a échoué. Réessayez.');
  // Le serveur rend le JSON du modèle (voir STRUCTURED_MODES) : soit déjà
  // analysé, soit en texte.
  let out = j.data || j.result || j.json || null;
  if (!out && typeof j.text === 'string') { try { out = JSON.parse(j.text); } catch (_) { out = null; } }
  if (!out || typeof out.texte !== 'string') throw new Error('Réponse illisible : rien n’a été modifié.');
  return { texte: out.texte, nb_corrections: Number(out.nb_corrections) || 0 };
}

// Messagerie directe entre collègues (conversation privée à deux).
//
// POURQUOI CE FICHIER EXISTE
// messages.html n'affichait que le fil d'équipe collectif (table `messages`,
// visible_client = false). Le fondateur veut aussi qu'un artisan puisse
// écrire à UN collègue précis, en privé — table dédiée `messages_directs`
// (voir supabase-messages-directs-2026-09-04.sql), séparée du fil de groupe.
//
// Toutes les requêtes de la messagerie directe vivent ici, pas dans
// js/supabase.js (un autre agent y travaille en parallèle) : ce module
// importe simplement `supabase` depuis ./supabase.js, comme n'importe quel
// script de page.
//
// ⚠️ La sécurité réelle est en RLS (policies messages_directs_select/insert/
// update + trigger messages_directs_garde_maj). Rien ici ne protège quoi que
// ce soit — ça évite seulement de proposer une porte fermée.

import { supabase, getSession, mesDroits, listMembres, ROLE_LABEL } from './supabase.js';

/**
 * Les personnes qu'on peut contacter en message direct : le patron en
 * premier si je suis un compagnon (il n'a pas de ligne dans membres_equipe —
 * mon_role() y retombe sur 'patron' par défaut, donc son identité vient de
 * patron_identite(), une RPC dédiée), puis mes collègues actifs, puis les
 * invités en attente (grisés, sans lien).
 *
 * @returns {Promise<{monId: string, droits: object, contacts: Array}>}
 *   contacts[i] = { userId: string|null, nom: string, roleLabel: string,
 *                    enAttente: boolean, estPatron: boolean }
 */
export async function listContacts() {
  const session = await getSession();
  const monId = session ? session.user.id : null;
  const droits = await mesDroits();

  const contacts = [];

  if (droits && droits.patron !== true) {
    // Je suis un compagnon/chef : le patron est un contact, mais il n'a pas
    // de ligne membres_equipe. Une entreprise mono-artisan qui invite son
    // premier collègue peut ne pas avoir de pro_profiles rempli — dans ce
    // cas patron_identite() renvoie quand même une ligne (nom de repli
    // "Votre patron"), sauf échec réseau où l'écran reste utilisable sans.
    try {
      const { data, error } = await supabase.rpc('patron_identite');
      if (!error && data && data.length) {
        contacts.push({
          userId: data[0].user_id,
          nom: data[0].nom,
          roleLabel: ROLE_LABEL.patron,
          enAttente: false,
          estPatron: true,
        });
      }
    } catch (_) { /* écran utilisable sans le patron en tête de liste */ }
  }

  const membres = await listMembres();
  membres
    .filter((m) => m.statut !== 'inactif' && m.user_id !== monId)
    .forEach((m) => {
      const nom = [m.prenom, m.nom].filter(Boolean).join(' ').trim() || m.email || 'Collègue';
      contacts.push({
        userId: m.user_id || null,
        nom,
        roleLabel: ROLE_LABEL[m.role] || m.role,
        enAttente: m.statut !== 'actif' || !m.user_id,
        estPatron: false,
      });
    });

  return { monId, droits, contacts };
}

/**
 * Aperçu de toutes mes conversations directes en UNE requête (jamais une par
 * collègue) : les 300 derniers messages où je suis expéditeur ou
 * destinataire, groupés par interlocuteur. `nonLu` vaut true si AU MOINS UN
 * message reçu de cet interlocuteur, dans cette fenêtre, n'a pas lu_le — pas
 * seulement le dernier, sinon répondre à un vieux message non lu ferait
 * disparaître la pastille sans que ce message-là ait été lu.
 *
 * `nb` compte ces messages non lus, pour la pastille de la liste des fils
 * (tâche 24) : un artisan veut voir « 3 » et pas seulement « il y a du
 * nouveau ». Le compte est borné par la fenêtre de 300 messages ci-dessous,
 * ce qui est très au-delà de ce qu'une pastille doit afficher.
 *
 * @param {string} monId
 * @returns {Promise<Map<string, {dernier: object, nonLu: boolean, nb: number}>>}
 */
export async function apercuConversations(monId) {
  const parContact = new Map();
  if (!monId) return parContact;

  const { data, error } = await supabase
    .from('messages_directs')
    .select('id, de_user_id, a_user_id, content, created_at, lu_le')
    .or(`de_user_id.eq.${monId},a_user_id.eq.${monId}`)
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;

  for (const m of data || []) {
    const autre = m.de_user_id === monId ? m.a_user_id : m.de_user_id;
    let entree = parContact.get(autre);
    if (!entree) {
      // `data` est trié created_at desc : la première ligne rencontrée pour
      // cet interlocuteur est forcément la plus récente.
      entree = { dernier: m, nonLu: false, nb: 0 };
      parContact.set(autre, entree);
    }
    if (m.a_user_id === monId && !m.lu_le) { entree.nonLu = true; entree.nb += 1; }
  }

  return parContact;
}

/**
 * Le fil complet d'une conversation à deux, dans l'ordre chronologique.
 * @param {string} monId
 * @param {string} avecId
 */
export async function listThread(monId, avecId) {
  const { data, error } = await supabase
    .from('messages_directs')
    .select('*')
    .or(`and(de_user_id.eq.${monId},a_user_id.eq.${avecId}),and(de_user_id.eq.${avecId},a_user_id.eq.${monId})`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Envoie un message direct. `pro_id` doit être celui de MA propre équipe
 * (mon_entreprise() côté base, exposé ici par mesDroits().entreprise) — la
 * policy messages_directs_insert le revérifie de toute façon, ceci ne fait
 * qu'éviter un aller-retour voué à l'échec.
 * @param {string} aUserId
 * @param {string} contenu
 */
export async function envoyerDirect(aUserId, contenu) {
  const session = await getSession();
  const droits = await mesDroits();
  const { data, error } = await supabase
    .from('messages_directs')
    .insert({
      pro_id: droits.entreprise,
      de_user_id: session.user.id,
      a_user_id: aUserId,
      content: contenu,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Marque comme lus tous les messages reçus de `avecId` pas encore lu_le.
 * Le trigger messages_directs_garde_maj n'autorise QUE ce champ à changer —
 * inutile donc de sélectionner puis ré-écrire ligne par ligne, un seul
 * UPDATE filtré suffit et reste conforme à la garde côté base.
 */
// Modifier / supprimer MON message direct tant que l'autre ne l'a pas lu
// (Moctar 06/09). Droits en base : politiques *_expediteur + garde_maj.
export async function modifierMessageDirect(id, content) {
  const { data, error } = await supabase
    .from('messages_directs').update({ content }).eq('id', id).is('lu_le', null).select();
  if (error) throw error;
  if (!data || !data.length) throw new Error('Ce message a déjà été lu : il ne peut plus être modifié.');
  return data[0];
}
export async function supprimerMessageDirect(id) {
  const { data, error } = await supabase
    .from('messages_directs').delete().eq('id', id).is('lu_le', null).select('id');
  if (error) throw error;
  if (!data || !data.length) throw new Error('Ce message a déjà été lu : il ne peut plus être supprimé.');
}

export async function marquerLu(monId, avecId) {
  const { error } = await supabase
    .from('messages_directs')
    .update({ lu_le: new Date().toISOString() })
    .eq('a_user_id', monId)
    .eq('de_user_id', avecId)
    .is('lu_le', null);
  if (error) throw error;
}

/**
 * Temps réel sur une conversation précise. Le filtre serveur ne peut porter
 * que sur une colonne (ici a_user_id, mon propre id — je reçois le nouveau
 * message) ; le tri "est-ce bien cette conversation" se fait ensuite côté
 * client, même motif que suivreMessagesEquipe() dans supabase.js.
 * @param {string} monId
 * @param {string} avecId
 * @param {(msg: object) => void} onMessage
 */
export function suivreThread(monId, avecId, onMessage) {
  return supabase
    .channel(`dm:${monId}:${avecId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages_directs', filter: `a_user_id=eq.${monId}` },
      (payload) => { if (payload.new && payload.new.de_user_id === avecId) onMessage(payload.new); })
    .subscribe();
}

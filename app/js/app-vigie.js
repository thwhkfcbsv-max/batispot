/* BatiSpot — signalement des tentatives de connexion REFUSEES.
 *
 * POURQUOI CE FICHIER EXISTE. Les inscriptions sont fermees depuis le
 * 05/09/2026 (`disable_signup`). Un e-mail inconnu qui demande un lien magique
 * ou cree un compte recoit « Signups not allowed » — et cote serveur, il ne
 * reste RIEN qui dise QUI a essaye :
 *   - `auth.audit_log_entries` est vide (mesure : count = 0, Supabase la purge) ;
 *   - les logs Auth gardent ~48 h et ne contiennent pas l'e-mail tente
 *     ({"error_code":"...","path":"/signup","remote_addr":"..."} et c'est tout).
 * Le navigateur, lui, connait l'adresse : il vient de la poster. C'est donc ici
 * qu'on la capture, et nulle part ailleurs.
 *
 * CE QU'IL NE FAIT PAS. Il n'envoie pas d'e-mail et n'affiche rien. Il POSTE
 * une ligne dans `tentatives_connexion` via l'Edge Function
 * `journal-connexions`. C'est `scripts/vigie_connexions.py` qui relit et alerte,
 * une seule fois par adresse et par jour.
 *
 * IL NE DOIT JAMAIS CASSER L'ECRAN. Tout est avale : l'utilisateur a deja une
 * erreur devant les yeux, on ne va pas lui en ajouter une.
 */
(function () {
  'use strict';

  // Une meme adresse refusee trois fois d'affilee (l'artisan reessaie) ne doit
  // pas produire trois lignes : on borne cote client AUSSI, avant meme le quota
  // serveur — c'est ce qui evite de bruler le quota de quelqu'un d'autre.
  var deja = {};
  var MAX_PAR_SESSION = 5;
  var envoyees = 0;

  /** Vrai quand le message d'erreur Supabase signifie « ce compte n'existe pas
   *  / les inscriptions sont fermees ». C'est le seul cas qui interesse la
   *  vigie : un mot de passe faux sur un compte connu n'est pas une intrusion. */
  function estRefusInscription(message) {
    return /signups? not allowed|user not found|email not confirmed|not allowed for this instance/i
      .test(String(message || ''));
  }

  /**
   * @param {{email:string, source:string, motif?:string, detail?:string}} info
   */
  function bsJournaliserTentative(info) {
    try {
      info = info || {};
      var email = String(info.email || '').trim().toLowerCase();
      if (!email || email.indexOf('@') < 0) return;
      if (envoyees >= MAX_PAR_SESSION) return;
      var cle = email + '|' + (info.motif || '');
      if (deja[cle]) return;
      deja[cle] = true;
      envoyees++;

      var cfg = window.__BATISPOT_CONFIG__ || {};
      if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
      fetch(cfg.SUPABASE_URL + '/functions/v1/journal-connexions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          apikey: cfg.SUPABASE_ANON_KEY,
          authorization: 'Bearer ' + cfg.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: email,
          source: info.source || 'inconnue',
          motif: info.motif || 'signup_ferme',
          detail: String(info.detail || '').slice(0, 200),
        }),
      }).catch(function () { /* silence : jamais au detriment de l'ecran */ });
    } catch (_) { /* idem */ }
  }

  window.bsJournaliserTentative = bsJournaliserTentative;
  window.bsEstRefusInscription = estRefusInscription;
})();

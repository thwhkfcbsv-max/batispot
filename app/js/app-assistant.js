// BatiSpot Pro — Assistant Vocal & BTP Flottant (Module Interactif Complet)
// Intègre : Caméra/Photo Studio, Recherche Devis réels, Dictée vocale native, Planning, Scan OCR

(function() {
  'use strict';

  // Jeton de la session en cours, lu la ou supabase-js le range.
  // Ce fichier est un script classique, pas un module : il ne peut pas importer
  // le client. On lit donc directement le stockage, en tolerant l'absence de
  // session (chatbot public) et un contenu inattendu.
  // Expose globalement : app/devis.html en a besoin pour son appel a
  // generate-quote, et c'est un script classique lui aussi.
  function bsJetonSession() {
    try {
      const cfg = window.__BATISPOT_CONFIG__ || {};
      const ref = String(cfg.SUPABASE_URL || '').match(/https:\/\/([^.]+)\./);
      if (!ref) return null;
      const brut = localStorage.getItem('sb-' + ref[1] + '-auth-token');
      if (!brut) return null;
      const s = JSON.parse(brut);
      const jeton = s && (s.access_token || (s.currentSession && s.currentSession.access_token));
      if (!jeton) return null;
      // Un jeton expire vaut moins que rien : le serveur le refuserait et on
      // perdrait la reponse. On retombe alors sur la cle anonyme.
      const exp = s.expires_at || (s.currentSession && s.currentSession.expires_at);
      if (exp && Number(exp) * 1000 < Date.now()) return null;
      return jeton;
    } catch (_) {
      return null;
    }
  }

  window.bsJetonSession = bsJetonSession;

  // ── Boucle de retour du journal assistant (05/09/2026) ─────────────────────
  // Le serveur journalise chaque echange (table `assistant_log`) et renvoie
  // l'id de la ligne dans `log_id`. Ce qu'il ne peut PAS savoir, c'est si
  // l'artisan a valide ou refuse l'action proposee — or c'est le seul signal
  // qui distingue « l'assistant a compris » de « l'assistant s'est trompe ».
  // Un outil propose souvent et refuse souvent est un outil mal declenche.
  //
  // Fail-silent, sans exception : rien ici ne doit jamais gener l'artisan. Si
  // l'appel echoue, la ligne reste simplement `valide = null` et la revue du
  // lundi la compte comme « sans retour ».
  function bsAstMarquerValidation(logId, valide) {
    try {
      if (!logId) return;
      const cfg = window.__BATISPOT_CONFIG__ || {};
      const jeton = bsJetonSession();
      // Sans session verifiee, la RPC refuse (elle compare `auth.uid()` au
      // proprietaire de la ligne) : inutile de partir.
      if (!jeton || !cfg.SUPABASE_ANON_KEY) return;
      const url = (cfg.SUPABASE_URL || 'https://cisniwhaiydazdpzvino.supabase.co')
        + '/rest/v1/rpc/assistant_log_valider';
      fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          apikey: cfg.SUPABASE_ANON_KEY,
          authorization: 'Bearer ' + jeton,
        },
        body: JSON.stringify({ p_id: logId, p_valide: !!valide }),
        keepalive: true,
      }).catch(function () { /* fail-silent */ });
    } catch (_) { /* fail-silent */ }
  }

  // Injecter CSS de l'assistant si absent
  const styleId = 'bs-assistant-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .bs-assistant-fab {
        position: fixed;
        /* La nav du bas fait 60px + la zone sure (barre d'accueil iPhone) : sans
           env(), le bouton passait derriere la barre et sortait de l'ecran. */
        bottom: calc(74px + env(safe-area-inset-bottom, 0px));
        right: 16px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #228B5B;
        box-shadow: 0 4px 16px rgba(11,168,92,0.28);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #FFFFFF;
        cursor: pointer;
        z-index: 990;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
        -webkit-tap-highlight-color: transparent;
      }
      /* Au-dela de la largeur de l'app (480px centres), on garde le bouton dans la
         colonne au lieu de le coller au bord de l'ecran. */
      @media (min-width: 520px) {
        .bs-assistant-fab { right: calc(50% - 240px + 16px); }
      }
      .bs-assistant-fab:active {
        transform: scale(0.92);
      }
      .bs-assistant-fab svg {
        width: 24px;
        height: 24px;
        color: #FFFFFF;
      }

      /* Modal Bottom Sheet */
      .bs-ast-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 1000;
        display: none;
        opacity: 0;
        transition: opacity 0.25s ease;
      }
      .bs-ast-overlay.open {
        display: flex;
        opacity: 1;
        align-items: flex-end;
        justify-content: center;
      }
      /* Bande de la couleur de la feuille SOUS le calque : couvre l'espace
         entre la feuille et le clavier pendant l'animation, sans agrandir le
         calque lui-même (voir calerSurZoneVisible). */
      .bs-ast-overlay.open.bs-ast-sans-nav::after {
        content: ''; position: absolute; left: 0; right: 0; top: 100%; height: 160px;
        background: #F4F7F5; pointer-events: none;
      }
      .bs-ast-sheet {
        width: 100%;
        max-width: 500px;
        /* iPhone : 90dvh seul laissait le bas de la feuille (le champ de
           saisie) sous la barre d'accueil ou la barre Safari — Moctar, 04/09 :
           « quand je clique sur l'assistant il dépasse de l'écran ». On borne
           à la hauteur réellement visible (svh) et on réserve la zone de
           sécurité en bas. */
        max-height: min(90dvh, calc(100svh - 12px));
        padding-bottom: env(safe-area-inset-bottom, 0px);
        box-sizing: border-box;
        background: #FFFFFF !important;
        color: #1C2B22 !important;
        border-radius: 24px 24px 0 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
        transform: translateY(100%);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .bs-ast-overlay.open .bs-ast-head { padding-top: calc(14px + env(safe-area-inset-top, 0px)); }
      .bs-ast-overlay.open .bs-ast-sheet {
        transform: translateY(0);
        /* (06/09, Moctar) « l'assistant devrait prendre le téléphone entier
           en s'ouvrant, pas la moitié » : la feuille remplit le calque, qui
           lui-même s'arrête au-dessus de la barre du bas (calerSurZoneVisible)
           pour que le menu reste visible. */
        height: 100%;
        max-height: none !important;
        border-radius: 0;
      }

      /* Header Sheet */
      .bs-ast-head {
        padding: 14px 18px;
        background: #FFFFFF !important;
        border-bottom: 1.5px solid #E7EEEA !important;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .bs-ast-title {
        font-size: 15px;
        font-weight: 900;
        color: #1C2B22 !important;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      /* (06/09, Moctar) le bouton flottant étoile ouvre le mode IA ; ce bouton
         ramène au mode fonctionnalités. Les deux modes, un seul switch. */
      .bs-ast-close {
        background: none;
        border: none;
        display: inline-flex; align-items: center; gap: 6px;
        font-size: 12.5px; font-weight: 800; letter-spacing: 0;
        color: #5A7268;
        cursor: pointer;
        padding: 7px 11px;
        border-radius: 999px;
        -webkit-tap-highlight-color: transparent;
      }
      body.bs-ast-ouvert .bs-assistant-fab { display: none !important; }

      /* Action Bar */
      .bs-ast-actions-bar {
        display: flex;
        gap: 8px;
        padding: 10px 16px;
        background: #FFFFFF !important;
        border-bottom: 1px solid #E7EEEA !important;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .bs-ast-actions-bar::-webkit-scrollbar { display: none; }
      .bs-ast-act-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 10px;
        background: #FFFFFF !important;
        border: 1.5px solid #D3E3DA !important;
        color: #1C2B22 !important;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
        white-space: nowrap;
        text-decoration: none;
        transition: all 0.15s;
        font-family: inherit;
      }
      .bs-ast-act-btn:hover, .bs-ast-act-btn:active {
        background: #228B5B !important;
        border-color: #228B5B !important;
        color: #FFFFFF !important;
      }

      /* Chat Messages */
      .bs-ast-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        /* 220px de base, mais compressible : clavier ouvert sur Android, la
           zone visible peut descendre sous 400px — un minimum rigide faisait
           dépasser l'en-tête par le haut (retour Moctar 05/09). */
        flex: 1 1 220px;
        min-height: 0;
        background: #FFFFFF !important;
      }
      .bs-ast-msg {
        max-width: 88%;
        padding: 12px 16px;
        border-radius: 14px;
        font-size: 13.5px;
        line-height: 1.5;
      }
      .bs-ast-msg.bot {
        align-self: flex-start;
        background: #F7FBF8 !important;
        color: #1C2B22 !important;
        border: 1.5px solid #E7EEEA !important;
        border-bottom-left-radius: 4px;
      }
      /* Habillage vert (retour Moctar 04/09 : la fenêtre était trop blanche) */
      .bs-ast-sheet { background: #F4F7F5 !important; }
      .bs-ast-head { background: #228B5B !important; color: #fff !important; border-bottom: 0 !important; }
      .bs-ast-head .bs-ast-title, .bs-ast-head * { color: #fff !important; }
      .bs-ast-close { background: rgba(255,255,255,.18) !important; color: #fff !important; border: 0 !important; }
      .bs-ast-msg.bot { background: #E6F4EC !important; color: #1C2B22 !important; border: 1px solid #CFE8DA !important; }
      .bs-ast-msg.user { background: #228B5B !important; color: #fff !important; border: 0 !important; }
      .bs-ast-input-bar { background: #fff !important; border-top: 1px solid #DCE6E0 !important; }
      .bs-ast-send, .bs-ast-mic, .bs-ast-cam-btn { background: #228B5B !important; color: #fff !important; border: 0 !important; }
      /* Attente : trois points qui montent et redescendent (Moctar 06/09 :
         « je réfléchis… » statique donnait une impression de lenteur). */
      .bs-ast-attente { display: inline-flex; align-items: center; gap: 5px; height: 18px; padding: 2px 4px; }
      .bs-ast-attente i { width: 7px; height: 7px; border-radius: 50%; background: #228B5B; display: block; opacity: .35; animation: bsAstPoint 1.2s ease-in-out infinite; }
      .bs-ast-attente i:nth-child(2) { animation-delay: .2s; }
      .bs-ast-attente i:nth-child(3) { animation-delay: .4s; }
      @keyframes bsAstPoint { 0%, 80%, 100% { transform: translateY(0) scale(.85); opacity: .35; } 40% { transform: translateY(-4px) scale(1.1); opacity: 1; } }
      @media (prefers-reduced-motion: reduce) { .bs-ast-attente i { animation: none; opacity: .7; } }
      .bs-ast-chip { background: #E6F4EC !important; color: #1B7049 !important; border: 0 !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; height: 36px !important; line-height: 1 !important; padding: 0 12px !important; white-space: nowrap; font-weight: 700 !important; }
      .bs-ast-chips { display: flex !important; gap: 6px !important; align-items: center !important; padding: 6px 0 !important; overflow-x: auto; scrollbar-width: none; }
      .bs-ast-chips::-webkit-scrollbar { display: none; }
      .bs-ast-act-btn { background: #fff !important; color: #1B7049 !important; border: 1.5px solid #CFE8DA !important; }
      .bs-ast-act-btn svg { stroke: #1B7049 !important; }
      .bs-ast-act-btn:active, .bs-ast-act-btn.on, .bs-ast-act-btn[aria-pressed="true"] { background: #228B5B !important; color: #fff !important; border-color: #228B5B !important; }
      .bs-ast-act-btn:active svg, .bs-ast-act-btn.on svg { stroke: #fff !important; }
      .bs-ast-card-btn { background: #228B5B !important; color: #fff !important; }
      .bs-ast-card-result { border: 1px solid #CFE8DA !important; background: #fff !important; }
      .bs-ast-msg.user {
        align-self: flex-end;
        background: #228B5B !important;
        color: #FFFFFF !important;
        border-bottom-right-radius: 4px;
      }

      /* Interactive Action Cards inside Chat */
      .bs-ast-card-result {
        background: #FFFFFF !important;
        border: 1.5px solid #D3E3DA !important;
        border-radius: 12px;
        padding: 12px 14px;
        margin-top: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        color: #1C2B22 !important;
      }
      .bs-ast-card-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        background: #228B5B !important;
        color: #FFFFFF !important;
        padding: 10px;
        border-radius: 8px;
        font-weight: 800;
        font-size: 13px;
        text-decoration: none;
        margin-top: 8px;
        border: none;
        cursor: pointer;
        box-sizing: border-box;
      }

      /* Quick Chips */
      .bs-ast-chips {
        display: flex;
        gap: 6px;
        overflow-x: auto;
        padding: 6px 16px 10px;
        scrollbar-width: none;
        background: #FFFFFF !important;
      }
      .bs-ast-chips::-webkit-scrollbar { display: none; }
      .bs-ast-chip {
        white-space: nowrap;
        background: #FFFFFF !important;
        border: 1.5px solid #D3E3DA !important;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        color: #3D5A4E !important;
        cursor: pointer;
        font-family: inherit;
      }
      .bs-ast-chip:hover {
        border-color: #228B5B !important;
        color: var(--t1) !important;
      }

      /* Input Bar */
      .bs-ast-input-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: #FFFFFF !important;
        border-top: 1.5px solid #E7EEEA !important;
      }
      .bs-ast-input {
        flex: 1 1 0;
        /* Android (retour Moctar 05/09) : sans min-width:0, la largeur
           intrinsèque de l'<input> (≈ 20 caractères) l'emporte sur flex:1 et
           pousse le bouton Envoyer hors de l'écran sur un téléphone étroit. */
        min-width: 0;
        width: 0;
        padding: 10px 14px;
        border: 1.5px solid #D3E3DA !important;
        border-radius: 12px;
        font-size: 16px;
        outline: none;
        font-family: inherit;
        background: #FFFFFF !important;
        color: #1C2B22 !important;
      }
      .bs-ast-input:focus {
        border-color: #228B5B !important;
      }
      .bs-ast-cam-btn, .bs-ast-mic, .bs-ast-send {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        border: 1.5px solid #D3E3DA;
        background: #FFFFFF;
        color: #1C2B22;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        flex-shrink: 0;
      }
      .bs-ast-send {
        background: #228B5B !important;
        border-color: #228B5B !important;
        color: #FFFFFF !important;
      }
      /* Micro à maintenir : plein pendant l'écoute, halo d'invitation
         quand « Dicter un devis » vient d'ouvrir la feuille. */
      .bs-ast-mic.listening { background: #1B7049 !important; box-shadow: 0 0 0 5px rgba(34,139,91,.22); }
      @keyframes bsMicInvite { 0%,100% { box-shadow: 0 0 0 0 rgba(34,139,91,.35); } 50% { box-shadow: 0 0 0 9px rgba(34,139,91,0); } }
      .bs-ast-mic-invite { animation: bsMicInvite 1.2s ease-out 3; }
      @media (prefers-reduced-motion: reduce) { .bs-ast-mic-invite { animation: none; } }
`;
    document.head.appendChild(style);
  }

  function initAssistantUI() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.bs-ast-act-btn'); if (!b) return;
      document.querySelectorAll('.bs-ast-act-btn.on').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
    }, true);
    if (document.getElementById('bsAssistantBtn')) return;

    // Bouton Etoile Flottant
    const fab = document.createElement('button');
    fab.className = 'bs-assistant-fab';
    fab.id = 'bsAssistantBtn';
    fab.setAttribute('aria-label', "Ouvrir l'Assistant BatiSpot");
    
    fab.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"/></svg>';


    // Input file cache pour la camera / photo
    const hiddenFileInput = document.createElement('input');
    hiddenFileInput.type = 'file';
    hiddenFileInput.accept = 'image/*';
    // Android (Moctar, 05/09 : « photo dans l'assistant n'ouvre pas
    // l'appareil photo ») : sans `capture`, Android ouvre un sélecteur de
    // fichiers, pas l'appareil ; et un input en display:none n'est pas
    // toujours déclenchable par un clic programmé. Caméra arrière demandée,
    // champ présent mais invisible.
    hiddenFileInput.setAttribute('capture', 'environment');
    hiddenFileInput.style.cssText = 'position:absolute;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    hiddenFileInput.id = 'bsAstPhotoUpload';
    document.body.appendChild(hiddenFileInput);

    // Modal Drawer
    const overlay = document.createElement('div');
    overlay.className = 'bs-ast-overlay';
    overlay.id = 'bsAstOverlay';
    overlay.innerHTML = `
      <div class="bs-ast-sheet" id="bsAstSheet">
        <div class="bs-ast-head">
          <div class="bs-ast-title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"/></svg> Assistant BatiSpot
          </div>
          <button class="bs-ast-close" id="bsAstClose" aria-label="Revenir à l’écran précédent"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>Retour</button>
        </div>

        <!-- Action Bar avec icones directes -->
        <div class="bs-ast-actions-bar">
          <button class="bs-ast-act-btn" id="btnActPhoto">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            Photo Métré
          </button>
          <a class="bs-ast-act-btn" href="/app/devis.html">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Mes Devis
          </a>
          <a class="bs-ast-act-btn" href="/app/planning.html">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Planning
          </a>
          <button class="bs-ast-act-btn" id="btnActOcr">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="6" y1="16" x2="12" y2="16"/></svg>
            Scanner un ticket
          </button>
        </div>

        <div class="bs-ast-messages" id="bsAstMessages">
          <div class="bs-ast-msg bot">
            Bonjour ! Je suis votre assistant chantier. Vous pouvez me demander vos devis récents, dicter une prestation à la voix ou prendre une photo pour calculer un métré.
          </div>
        </div>

        <div class="bs-ast-chips" id="bsAstChips">
          <button class="bs-ast-chip" data-q="Ouvre mon dernier devis">Ouvrir dernier devis</button>
          <button class="bs-ast-chip" data-q="Chiffrer une rénovation peinture salon 30m²">Chiffrer Peinture 30m²</button>
          <button class="bs-ast-chip" data-q="Quelles sont les règles de TVA pour une rénovation ?">Règles de TVA</button>
          <button class="bs-ast-chip" data-q="Calculer métré d'une pièce 4m par 5m hauteur 2.5m">Calcul Métré 20m²</button>
        </div>

        <div class="bs-ast-input-bar">
          <button class="bs-ast-cam-btn" id="bsAstCam" title="Prendre une photo de chantier">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </button>
          <button class="bs-ast-mic" id="bsAstMic" title="Dicter à voix haute">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
          </button>
          <input name="bs-ast-q" data-lpignore="true" enterkeyhint="send" autocapitalize="sentences" autocomplete="off" type="text" class="bs-ast-input" id="bsAstInput" placeholder="Posez une question ou dictez..."><!-- (06/09, Moctar, Android) autocomplete=off + nom neutre : décourage la barre de remplissage automatique du clavier (clé / carte / position) ; enterkeyhint=send : la touche Aller devient Envoyer -->
          <button class="bs-ast-send" id="bsAstSend" aria-label="Envoyer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(overlay);

    // ── La feuille suit la zone RÉELLEMENT visible ─────────────────────────
    // Android (Moctar, 05/09 : « l'assistant sort de l'écran ») : quand le
    // clavier s'ouvre, Chrome ne réduit pas la fenêtre de mise en page, il
    // réduit seulement la zone visible (visualViewport) et la fait défiler
    // jusqu'au champ. Un calque `position:fixed; inset:0` reste donc à la
    // taille de l'écran complet : la feuille, bornée à 90 % de cette hauteur,
    // dépasse par le haut (en-tête coupé) pendant que le bas suit le clavier.
    // Le seul repère fiable est visualViewport : on cale le calque dessus
    // (haut + hauteur) tant que la feuille est ouverte, on relâche à la
    // fermeture. iOS a le même mécanisme, les valeurs y sont aussi justes.
    // Couleur du haut de l'écran (barre d'état Android en appli installée,
    // barre d'adresse Chrome) : vert du bandeau quand la conversation est
    // ouverte, BLANC sinon. Moctar (06/09) : « quand je quitte l'assistant et
    // reviens sur Devis, le bandeau vert persiste » — la page quittée avec la
    // conversation ouverte laissait le vert : on remet le blanc en quittant la
    // page et au chargement de la suivante, quoi qu'il arrive.
    function bsAstCouleurHaut(ouvert) {
      try {
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
        meta.content = ouvert ? '#228B5B' : '#FFFFFF';
      } catch (_) {}
    }
    bsAstCouleurHaut(false);
    window.addEventListener('pagehide', () => bsAstCouleurHaut(false));
    window.addEventListener('pageshow', () => bsAstCouleurHaut(overlay.classList.contains('open')));
    const sheetEl = document.getElementById('bsAstSheet');
    function calerSurZoneVisible() {
      const vv = window.visualViewport;
      if (!vv || !overlay.classList.contains('open')) return;
      overlay.style.top = Math.max(0, vv.offsetTop) + 'px';
      // BUG v96→v102 (Moctar, 06/09 : « l'assistant ne s'ouvre pas
      // correctement ») : le calque faisait vv.height + 120 px « pour que le
      // fond descende sous le clavier », mais la feuille est alignée sur le
      // BAS du calque (align-items:flex-end) — donc 120 px de feuille, puces
      // et champ de saisie compris, étaient toujours sous l'écran, clavier
      // ou pas. Mesuré en prod : écran 844 px, calque 964 px, champ à 910 px.
      // Le calque prend EXACTEMENT la zone visible ; la bande sous le clavier
      // pendant l'animation est couverte par ::after (CSS ci-dessus).
      // La barre du bas reste visible et cliquable sous la feuille (Moctar,
      // 06/09 : « qui laisse en bas le bandeau menu apparaître ») : le calque
      // s'arrête au-dessus d'elle. Sans barre (page sans nav), plein écran.
      const nav = document.querySelector('.bn, .bottom-nav');
      let navH = 0;
      if (nav) {
        const r = nav.getBoundingClientRect();
        // Seulement si la barre est réellement posée en bas de la zone visible.
        if (r.height > 0 && Math.abs(r.bottom - (vv.offsetTop + vv.height)) < 4) navH = Math.round(r.height);
      }
      overlay.style.height = Math.max(180, Math.round(vv.height) - navH) + 'px';
      // La bande sous le calque ne sert que quand la barre du bas n'y est
      // pas (clavier ouvert) — sinon elle la recouvrirait.
      overlay.classList.toggle('bs-ast-sans-nav', navH === 0);
      overlay.style.bottom = 'auto';
      sheetEl.style.maxHeight = '';
    }
    function relacherZoneVisible() {
      overlay.style.top = ''; overlay.style.height = ''; overlay.style.bottom = '';
      sheetEl.style.maxHeight = '';
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', calerSurZoneVisible);
      window.visualViewport.addEventListener('scroll', calerSurZoneVisible);
      // Un seul point d'entrée quel que soit l'appelant qui ouvre/ferme
      // (FAB, barre, carte « propose », outils) : on observe la classe.
      try {
        new MutationObserver(function () {
          const ouvert = overlay.classList.contains('open');
          document.body.classList.toggle('bs-ast-ouvert', ouvert);
          // (06/09, Moctar) le haut de l'écran (barre d'état Android / iOS
          // en appli installée) prend le vert du bandeau « Assistant
          // BatiSpot » quand il est ouvert, et redevient blanc, la couleur
          // dominante des écrans, quand il se ferme.
          bsAstCouleurHaut(ouvert);
          if (ouvert) calerSurZoneVisible();
          else relacherZoneVisible();
        }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
      } catch (_) { /* sans observateur : la feuille garde son CSS */ }
    }

    // Event Listeners UI
    const input = document.getElementById('bsAstInput');
    const sendBtn = document.getElementById('bsAstSend');
    const micBtn = document.getElementById('bsAstMic');
    const camBtn = document.getElementById('bsAstCam');
    const messages = document.getElementById('bsAstMessages');
    const closeBtn = document.getElementById('bsAstClose');

    fab.addEventListener('click', () => {
      overlay.classList.add('open');
      if (typeof window.bsAssistantOuvrirSaisie === 'function') { window.bsAssistantOuvrirSaisie(''); return; }
      setTimeout(() => input.focus(), 150);
    });

    // Fermer le panneau doit AUSSI couper le micro (01/09). Avant, seule la classe
    // `open` etait retiree : la dictee continuait a tourner derriere un panneau
    // ferme, sans rien a l'ecran pour le signaler. Un micro ouvert qu'on ne voit
    // pas est pire qu'un micro qu'on oublie d'eteindre.
    // Barre de statut Android = couleur du bandeau de l'assistant (#228B5B)
    // tant que la feuille est ouverte (retour Moctar 06/09 : deux verts
    // superposes en haut de l'ecran). L'ouverture se fait a plusieurs
    // endroits : on observe la classe `open` plutot que chaque appelant.
    (function synchroniserBarreStatut() {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta'); meta.name = 'theme-color'; meta.content = '#FFFFFF';
        document.head.appendChild(meta);
      }
      let couleurPage = meta.getAttribute('content') || '#FFFFFF';
      let ouvert = false;
      const appliquer = () => {
        const estOuvert = overlay.classList.contains('open');
        if (estOuvert === ouvert) return;
        ouvert = estOuvert;
        if (ouvert) {
          couleurPage = meta.getAttribute('content') || couleurPage; meta.setAttribute('content', '#228B5B');
          // (06/09, vitesse) : on chauffe le contexte de l'artisan dès l'ouverture,
          // pendant qu'il tape — la première question part sans attendre la collecte.
          try { if (typeof bsContexteDonnees === 'function') bsContexteDonnees().catch(() => {}); } catch (_) {}
        }
        else meta.setAttribute('content', couleurPage);
      };
      try { new MutationObserver(appliquer).observe(overlay, { attributes: true, attributeFilter: ['class'] }); } catch (_) {}
      appliquer();
    })();

    function fermerAssistant() {
      try { couperDictee(); } catch (_) {}
      overlay.classList.remove('open');
    }
    closeBtn.addEventListener('click', fermerAssistant);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) fermerAssistant();
    });

    // Camera / Photo Trigger
    function triggerCamera(actionName) {
      hiddenFileInput.dataset.action = actionName || 'metre';
      // Témoin lu au démarrage par app-barre-assistant.js (reprisePhoto) :
      // si Android tue la page pendant la caméra, on revient ICI.
      try {
        localStorage.setItem('bs_photo_en_cours', JSON.stringify({ url: location.href, action: hiddenFileInput.dataset.action, t: Date.now() }));
      } catch (_) {}
      hiddenFileInput.click();
    }
    const photoRevenue = () => { try { localStorage.removeItem('bs_photo_en_cours'); } catch (_) {} };
    hiddenFileInput.addEventListener('change', photoRevenue);
    hiddenFileInput.addEventListener('cancel', photoRevenue);
    // Le sélecteur de fichiers ne rend pas toujours `cancel` (Android) :
    // le retour au premier plan sans fichier vaut annulation.
    window.addEventListener('focus', () => { setTimeout(() => { if (!hiddenFileInput.files || !hiddenFileInput.files.length) photoRevenue(); }, 1500); });
    camBtn.addEventListener('click', () => triggerCamera('metre'));
    document.getElementById('btnActPhoto').addEventListener('click', () => triggerCamera('metre'));
    document.getElementById('btnActOcr').addEventListener('click', () => triggerCamera('ocr'));

    // Annulation du sélecteur (l'artisan ferme la caméra sans prendre de photo) :
    // l'événement `change` ne part jamais. Sans ce `cancel`, un crochet
    // « après métré » resterait armé jusqu'à sa péremption et l'artisan
    // n'aurait RIEN — ni caméra, ni devis, ni explication.
    hiddenFileInput.addEventListener('cancel', () => {
      if (hiddenFileInput.dataset.action !== 'ocr') bsDeclencherApresMetre(null, 'annule');
    });

    hiddenFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const act = hiddenFileInput.dataset.action || 'metre';
      const imgUrl = URL.createObjectURL(file);

      const uMsg = document.createElement('div');
      uMsg.className = 'bs-ast-msg user';
      uMsg.innerHTML = `<img src="${imgUrl}" style="width:100%;max-width:200px;border-radius:8px;display:block;margin-bottom:6px;"><span>Photo analysée (${file.name})</span>`;
      messages.appendChild(uMsg);
      messages.scrollTop = messages.scrollHeight;

      const bMsg = document.createElement('div');
      bMsg.className = 'bs-ast-msg bot';
      bMsg.textContent = act === 'ocr' ? "Lecture du ticket en cours…" : "Analyse de la photo en cours…";
      messages.appendChild(bMsg);
      messages.scrollTop = messages.scrollHeight;

      // Avant : un setTimeout(700) affichait un ticket « Point.P Levallois,
      // 411,00 € TTC » et un métré « 22.4 m² » ÉCRITS EN DUR — l'artisan
      // photographiait le sien et lisait les chiffres d'un autre, présentés
      // comme les siens. Le bouton d'enregistrement était un alert().
      //
      // Les modes serveur existaient pourtant déjà. Ils sont appelés pour de
      // vrai ici, via app-photo-ia.js. Règle de fer, la même que partout
      // ailleurs dans l'app : ce qui s'affiche vient du serveur, ou rien.
      (async () => {
        const ia = await import('./app-photo-ia.js');
        try {
          if (act === 'ocr') {
            const { data, fichierReduit } = await ia.lireTicketIA(file);
            bsAfficherTicket(bMsg, data, fichierReduit);
          } else {
            const { data } = await ia.estimerPieceIA(file);
            bsAfficherMetre(bMsg, data);
          }
        } catch (err) {
          const { message } = ia.messageEchecPhoto(err, act === 'ocr' ? 'ticket' : 'metre');
          bMsg.textContent = message;
          // Photo ratée ou serveur muet : on désarme le crochet « après métré »
          // (voir bsDeclencherApresMetre) plutôt que de le laisser attendre une
          // mesure qui n'arrivera pas.
          if (act !== 'ocr') bsDeclencherApresMetre(null);
        }
        messages.scrollTop = messages.scrollHeight;
      })();
    });

    // Récapitulatif d'une action proposée, avec Valider / Annuler.
    // C'est le maillon qui manquait : le serveur renvoyait déjà des propositions
    // d'action, mais aucune interface ne les présentait — l'assistant disait
    // « validez ci-dessous » sans qu'il y ait quoi que ce soit à valider.

// Affichage d'un ticket RÉELLEMENT lu par `ocr-receipt`.
//
// Tout est construit noeud par noeud, jamais par innerHTML : `supplier` vient
// d'une photo passée par un modèle, c'est une donnée non maîtrisée. Un nom de
// fournisseur contenant du balisage deviendrait une injection dans le chat.
function bsAfficherTicket(bMsg, d, fichierReduit) {
  bMsg.textContent = '';
  const euros = (v) => (v == null || v === '') ? null
    : Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

  const titre = document.createElement('strong');
  titre.textContent = d.supplier ? `Ticket lu : ${d.supplier}` : 'Ticket lu';
  bMsg.appendChild(titre);

  // Une valeur absente ne s'invente pas et ne s'affiche pas : la ligne
  // disparaît, plutôt que de montrer un « 0,00 € » qui se lirait comme un fait.
  const ligne = (etiquette, valeur) => {
    if (valeur == null) return;
    const l = document.createElement('div');
    l.textContent = `• ${etiquette} : ${valeur}`;
    bMsg.appendChild(l);
  };
  ligne('Date', d.date || null);
  ligne('Montant HT', euros(d.totalHT));
  ligne('TVA', d.vatRate != null ? `${d.vatRate} %` : null);
  ligne('Total TTC', euros(d.totalTTC));
  if (Array.isArray(d.items) && d.items.length) {
    ligne('Articles', d.items.map((i) => i && i.name).filter(Boolean).join(', ') || null);
  }
  if (d.confidence) ligne('Confiance', String(d.confidence));

  // Le rattachement à un chantier n'est pas un détail : une dépense orpheline
  // n'entre dans la marge d'aucun chantier. C'est précisément ce qui manquait
  // quand la confirmation était un window.confirm() fermé.
  const carte = document.createElement('div');
  carte.className = 'bs-ast-card-result';
  const consigne = document.createElement('div');
  consigne.style.cssText = 'font-size:12px;color:var(--t1);font-weight:700;margin-bottom:6px;';
  consigne.textContent = 'Rattacher à un chantier :';
  const select = document.createElement('select');
  select.style.cssText = 'width:100%;padding:6px;border:1.5px solid #D3E3DA;border-radius:8px;font-size:16px;margin-bottom:6px;';
  const attente = document.createElement('option');
  attente.textContent = 'Chargement…';
  select.appendChild(attente);
  const bouton = document.createElement('button');
  bouton.className = 'bs-ast-card-btn';
  bouton.type = 'button';
  bouton.textContent = 'Enregistrer dans mes dépenses';
  bouton.disabled = true;
  carte.append(consigne, select, bouton);
  bMsg.appendChild(carte);

  import('./supabase.js').then(async (m) => {
    let chantiers = [];
    try { chantiers = await m.listChantiers(); } catch (_) { /* traité juste après */ }
    select.textContent = '';
    if (!chantiers.length) {
      const o = document.createElement('option');
      o.textContent = 'Aucun chantier — créez-en un d’abord';
      select.appendChild(o);
      return;                       // sans chantier, on n'enregistre pas
    }
    for (const c of chantiers) {
      const o = document.createElement('option');
      o.value = c.id;
      // Même libellé que le planning (`nomChantier`) : un chantier se reconnaît
      // au nom de son client, pas à son UUID.
      o.textContent = c.client_name || c.adresse || 'Chantier';
      select.appendChild(o);
    }
    bouton.disabled = false;
  });

  bouton.addEventListener('click', async () => {
    bouton.disabled = true;
    bouton.textContent = 'Enregistrement…';
    try {
      // Le justificatif : la photo était lue puis jetée. On la conserve — c'est
      // ce que le comptable réclame. Un échec de dépôt ne doit pas faire perdre
      // la dépense elle-même : on l'enregistre sans.
      let justificatif = null;
      try {
        const sb = await import('./supabase.js');
        if (typeof sb.uploadJustificatif === 'function') {
          justificatif = await sb.uploadJustificatif(fichierReduit);
        }
      } catch (eUp) { console.warn('[depense] justificatif non conservé', eUp); }

      const mod = await import('./app-actions.js');
      const res = await mod.executerAction('enregistrer_depense', {
        fournisseur: d.supplier,
        date_achat: d.date,
        categorie: (d.category || 'Materiaux').split(' ')[0].replace('é', 'e'),
        montant_ht: d.totalHT,
        tva: d.vatRate,
        montant_ttc: d.totalTTC,
        designation: Array.isArray(d.items) ? d.items.map((i) => i && i.name).filter(Boolean).join(', ') : null,
        items: Array.isArray(d.items) ? d.items : null,
        source: 'ocr',
        confiance_ocr: d.confidence,
        chantier_id: select.value,
        justificatif_path: justificatif,
      });
      carte.textContent = '';
      const ok = document.createElement('div');
      ok.style.cssText = 'font-size:12.5px;color:var(--t1);font-weight:700;';
      // Le message vient du serveur : c'est lui qui sait ce qui a été écrit.
      ok.textContent = (res && res.message) || 'Dépense enregistrée.';
      carte.appendChild(ok);
    } catch (e) {
      bouton.disabled = false;
      bouton.textContent = 'Réessayer l’enregistrement';
      const err = document.createElement('div');
      err.style.cssText = 'font-size:12px;color:#B45309;margin-top:6px;';
      err.textContent = "Enregistrement impossible pour le moment. La dépense n'a pas été enregistrée.";
      carte.appendChild(err);
      if (typeof window.bsSignalerPanne === 'function') {
        window.bsSignalerPanne({ action: 'enregistrement depense', mode: 'enregistrer_depense',
          code: 'ecriture', detail: String((e && e.message) || e) });
      }
    }
  });
}

// Affichage d'un métré RÉELLEMENT estimé par `scan-room-photo`.
//
// On montre ce que le serveur a renvoyé, et rien de plus. Pas de surface
// murale « déduite », pas d'estimation de pots de peinture : dériver des
// quantités ici reviendrait à réinventer des règles de métré qui vivent dans
// le socle, et qu'on a déjà vues partir en vrille (la règle « 3 × S » était
// fausse). L'application des cotes se fait dans l'écran Métré, qui sait les
// écrire dans les bons champs.
function bsAfficherMetre(bMsg, d) {
  bMsg.textContent = '';
  const titre = document.createElement('strong');
  titre.textContent = 'Estimation depuis votre photo';
  bMsg.appendChild(titre);

  const ligne = (t) => { const l = document.createElement('div'); l.textContent = t; bMsg.appendChild(l); };
  const nb = (v, n = 2) => Number(v).toFixed(n);

  ligne(`• ${d.typePiece || 'Pièce'} · environ ${nb(d.surfaceEstimeeM2, 1)} m²`);
  if (d.hauteurSousPlafondM) ligne(`• Hauteur sous plafond ≈ ${nb(d.hauteurSousPlafondM)} m`);
  if (d.longueurEstimeeM && d.largeurEstimeeM) {
    ligne(`• Longueur ≈ ${nb(d.longueurEstimeeM)} m · Largeur ≈ ${nb(d.largeurEstimeeM)} m`);
  } else {
    ligne('• Longueur et largeur non déductibles de la photo.');
  }
  if (Array.isArray(d.referencesUtilisees) && d.referencesUtilisees.length) {
    ligne(`• Repères utilisés : ${d.referencesUtilisees.join(', ')}`);
  }
  ligne(`• Confiance : ${d.confiance || 'inconnue'}`);

  // L'avertissement du serveur n'est pas décoratif : une estimation par photo
  // n'est pas un métré. Il reste affiché en toutes lettres.
  const avert = document.createElement('div');
  avert.style.cssText = 'font-size:11.5px;color:#B45309;margin-top:6px;';
  avert.textContent = d.avertissement || 'Estimation à confirmer sur place avant tout devis.';
  bMsg.appendChild(avert);

  const carte = document.createElement('div');
  carte.className = 'bs-ast-card-result';
  const lien = document.createElement('a');
  lien.className = 'bs-ast-card-btn';
  lien.href = './photos.html';
  lien.textContent = 'Ouvrir le métré pour appliquer ces cotes →';
  carte.appendChild(lien);
  bMsg.appendChild(carte);

  // Crochet « après métré » (05/09/2026, outil devis_depuis_photo).
  //
  // Un outil de l'assistant (app-actions.js) peut poser window.bsApresMetre
  // AVANT d'ouvrir l'appareil photo, pour enchaîner sur le métré qui arrive :
  // « fais-moi un devis peinture de cette pièce en photo » = une photo, puis un
  // chiffrage, sans que l'artisan redicte ses cotes. Le crochet reçoit l'objet
  // du serveur TEL QUEL — rien n'est dérivé ici, c'est l'affaire du socle.
  //
  // Il se déclenche APRÈS l'affichage : une erreur dans le crochet ne doit
  // jamais effacer un métré déjà rendu à l'écran. C'est au crochet de se
  // retirer lui-même (il n'est appelé qu'une fois par métré).
  bsDeclencherApresMetre(d);
}

// Appelle le crochet posé par devis_depuis_photo, s'il y en a un. `metre` vaut
// null quand la photo n'a pas pu être exploitée (serveur indisponible, photo
// illisible, hors ligne) : le crochet doit alors se retirer sans rien envoyer,
// sinon il resterait armé et partirait sur la photo suivante, qui n'est pas
// celle qu'on avait demandée.
function bsDeclencherApresMetre(metre, raison) {
  if (typeof window.bsApresMetre !== 'function') return;
  try {
    window.bsApresMetre(metre, raison);
  } catch (e) {
    // Avaler l'erreur sans trace, c'est le silence pour l'artisan ET pour nous.
    console.warn('[assistant] crochet après métré en erreur', e);
    window.bsApresMetre = null;
  }
}

// Libelle du bouton d'une reponse d'action. Il disait toujours « Ouvrir → »,
// sans jamais dire vers QUOI : sur une reponse de marge, l'artisan ne savait
// pas qu'il allait tomber sur ses graphiques. Nommer la destination, c'est ce
// qui transforme un lien en invitation.
function bsLibelleLien(href) {
  const h = String(href || '');
  if (h.indexOf('finances') >= 0) return 'Voir mes finances →';
  if (h.indexOf('planning') >= 0) return 'Ouvrir le planning →';
  if (h.indexOf('chantier') >= 0) return 'Ouvrir le chantier →';
  if (h.indexOf('facture') >= 0) return 'Voir la facture →';
  if (h.indexOf('devis') >= 0) return 'Ouvrir le devis →';
  if (h.indexOf('equipe') >= 0) return 'Voir mon équipe →';
  if (h.indexOf('coffre') >= 0) return 'Ouvrir le coffre-fort →';
  if (h.indexOf('photos') >= 0) return 'Ouvrir les photos →';
  return 'Ouvrir →';
}

    // `logId` : id de la ligne d'`assistant_log` ecrite par le serveur pour CET
    // echange (champ `log_id` de la reponse). Sert uniquement a dire ensuite si
    // l'artisan a valide ou refuse. Absent = rien a marquer, tout marche pareil.
    // ── 2e tour : le résultat d'un outil de LECTURE repart au modèle, qui
    // répond en français (brique 1 du palier connaissance, 06/09/2026). Deux
    // tours de synthèse maximum par question. Un échec ici n'enlève rien :
    // la carte brute reste affichée.
    // Indicateur d'attente animé (3 points), remplacé par la réponse dès
    // qu'elle arrive (textContent / innerHTML écrasent le nœud).
    window.bsAstPointsAttente = function () {
      const w = document.createElement('span');
      w.className = 'bs-ast-attente';
      w.setAttribute('role', 'status');
      w.setAttribute('aria-label', 'L’assistant réfléchit');
      for (let k = 0; k < 3; k++) w.appendChild(document.createElement('i'));
      return w;
    };

    async function bsAstSynthetiser(question, nom, params, res, messages, profondeur, signature, bMsg, carte) {
      if (!question || profondeur > 1) return;
      // (06/09, Moctar : « on a 2 réponses ici ») — UNE seule bulle : la
      // synthèse remplace la carte brute dans la bulle qui l'a portée. Le
      // texte d'annonce (« Je vous propose l'action… ») est masqué pendant
      // l'attente et ne revient que si la synthèse échoue (repli).
      let bulle = null, intro = null, attente = null;
      const enPlace = !!(bMsg && carte && carte.parentNode === bMsg);
      if (enPlace) {
        intro = document.createElement('span');
        while (bMsg.firstChild && bMsg.firstChild !== carte) intro.appendChild(bMsg.firstChild);
        intro.hidden = true;
        attente = window.bsAstPointsAttente();
        bMsg.insertBefore(intro, carte);
        bMsg.insertBefore(attente, carte);
      } else {
        bulle = document.createElement('div');
        bulle.className = 'bs-ast-msg bot';
        bulle.replaceChildren(window.bsAstPointsAttente());
        messages.appendChild(bulle);
      }
      messages.scrollTop = messages.scrollHeight;
      const repli = () => {
        if (enPlace) { if (attente) attente.remove(); if (intro) intro.hidden = false; }
        else if (bulle) bulle.remove();
      };
      try {
        const cfg = window.__BATISPOT_CONFIG__ || {};
        const url = (cfg.SUPABASE_URL || 'https://cisniwhaiydazdpzvino.supabase.co') + '/functions/v1/gemini-assistant';
        const headers = { 'Content-Type': 'application/json' };
        if (cfg.SUPABASE_ANON_KEY) headers['apikey'] = cfg.SUPABASE_ANON_KEY;
        headers['authorization'] = 'Bearer ' + (bsJetonSession() || cfg.SUPABASE_ANON_KEY || '');
        const context = await bsContexteDonnees();
        // L'historique SANS le dernier échange : la question repart en prompt,
        // suivie de l'appel d'outil et de son résultat.
        const hist = bsAstHistorique.slice();
        if (hist.length >= 2 && hist[hist.length - 2].role === 'user' && hist[hist.length - 2].content === question.slice(0, 2000)) hist.splice(-2, 2);
        const resultat = { message: res && res.message, data: res && res.data };
        const ctrl = new AbortController();
        const killer = setTimeout(() => ctrl.abort(), 45000);
        const r = await fetch(url, { method: 'POST', headers, signal: ctrl.signal, body: JSON.stringify({
          mode: 'artisan-assistant', prompt: question, messages: hist, context,
          contexte_ecran: bsAstContexteEcran(),
          tool_result: { name: nom, args: params || {}, result: resultat, thought_signature: (typeof signature === 'string' && signature) ? signature : null },
        }) });
        clearTimeout(killer);
        const j = await r.json().catch(() => ({}));
        const txt = (j && j.text) || '';
        if (!r.ok || !txt) { repli(); return; }
        bsAstHistPush('model', txt);
        const safe = txt.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        let cible;
        if (enPlace) {
          attente.remove();
          intro.remove();
          const syn = document.createElement('span');
          syn.innerHTML = safe.replace(/\n/g, '<br>');
          bMsg.insertBefore(syn, carte);
          // On garde les boutons utiles de la carte (« Ouvrir », « Envoyer au
          // client »…), on retire la liste brute.
          carte.querySelectorAll('.bs-ast-card-btn').forEach((btn) => { btn.style.marginTop = '8px'; bMsg.appendChild(btn); });
          carte.remove();
          cible = bMsg;
        } else {
          bulle.innerHTML = safe.replace(/\n/g, '<br>');
          cible = bulle;
        }
        messages.scrollTop = messages.scrollHeight;
        if (j.actionProposal) bsAstRendreProposition(j.actionProposal, cible, messages, j.log_id, question, profondeur + 1);
      } catch (_) {
        repli();
      }
    }

    async function bsAstRendreProposition(proposition, bMsg, messages, logId, question, profondeur) {
      const nom = proposition.action;
      const carte = document.createElement('div');
      carte.className = 'bs-ast-card-result';

      // Une simple consultation (lister les devis, détailler les finances…) n'écrit
      // rien : on affiche le résultat directement, sans faire cliquer l'artisan.
      try {
        const mod = await import('./app-actions.js');

        // Le prompt d'outils du serveur déclare encore des actions sans exécutant
        // côté client (generer_document, envoyer_dossier). Le parcours était :
        // l'assistant annonce « je vous prépare l'attestation », affiche « Valider »,
        // et le clic renvoie une erreur rouge. On ne propose plus de valider ce que
        // l'application ne sait pas faire — on le dit franchement.
        if (!mod.actionDisponible(nom)) {
          const bloc = document.createElement('div');
          bloc.style.cssText = 'font-size:12.5px;color:#5A7268;margin-top:6px;';
          bloc.textContent = "Je ne sais pas encore faire cela dans l'application : "
            + "rien n'a été créé ni envoyé. Vous pouvez le faire vous-même depuis "
            + "l'écran concerné.";
          carte.appendChild(bloc);
          bMsg.appendChild(carte);
          messages.scrollTop = messages.scrollHeight;
          return;
        }

        // Navigation (ouvrir_ecran, prendre_photo) : exécution immédiate comme
        // une lecture, elle aussi sans carte Valider — elle ne modifie rien,
        // elle déplace seulement l'artisan.
        if (mod.estLecture(nom) || mod.estNavigation(nom)) {
          const res = await mod.executerAction(nom, proposition.params);
          const bloc = document.createElement('div');
          bloc.style.cssText = 'font-size:12.5px;color:#1C2B22;white-space:pre-line;margin-top:6px;';
          bloc.textContent = res.message;
          carte.appendChild(bloc);
          if (res.lien) {
            const lien = document.createElement('a');
            lien.className = 'bs-ast-card-btn';
            lien.href = res.lien;
            lien.textContent = res.libelle_lien || bsLibelleLien(res.lien);
            // Lien externe (WhatsApp, cartes…) : dans l'application dédiée, pas
            // à la place de l'appli.
            if (/^https?:\/\//i.test(res.lien) && !res.lien.startsWith(location.origin)) { lien.target = '_blank'; lien.rel = 'noopener'; }
            lien.style.marginTop = '8px';
            carte.appendChild(lien);
          }
          // Geste utilisateur (05/09/2026). Un input[type=file].click() lancé
          // depuis cette continuation async — après l'aller-retour réseau vers
          // le modèle — n'a plus d'activation utilisateur transitoire :
          // Chrome et Safari l'ignorent SANS erreur, et l'artisan lit
          // « prenez la photo » devant un écran qui ne bouge pas. Ce bouton
          // rend le clic à l'artisan, et le message est déjà affiché quand
          // l'appareil photo s'ouvre.
          if (res.geste && res.geste.photo) {
            const geste = document.createElement('button');
            geste.type = 'button';
            geste.className = 'bs-ast-card-btn';
            geste.style.cssText = 'margin-top:8px;border:0;font:inherit;cursor:pointer;';
            geste.textContent = res.geste.libelle || 'Prendre la photo';
            geste.addEventListener('click', () => {
              if (typeof window.bsAssistantOuvrirPhoto === 'function') {
                window.bsAssistantOuvrirPhoto(res.geste.photo);
              }
            });
            carte.appendChild(geste);
          }
          // Même raison, autre cible (05/09/2026, partager_devis /
          // partager_facture) : `window.open` lancé depuis cette continuation
          // asynchrone est bloqué SANS ERREUR par Chrome et Safari. L'exécutant
          // tente quand même l'ouverture ; ce bouton est le chemin sûr, parce
          // qu'il part d'un appui réel. Un `<a target=_blank>` plutôt qu'un
          // bouton : pas de JS, et l'artisan peut l'ouvrir comme il veut.
          if (res.geste && res.geste.url && /^https?:\/\//i.test(res.geste.url)) {
            const ouvrir = document.createElement('a');
            ouvrir.className = 'bs-ast-card-btn';
            ouvrir.href = res.geste.url;
            ouvrir.target = '_blank';
            ouvrir.rel = 'noopener noreferrer';
            ouvrir.style.marginTop = '8px';
            ouvrir.textContent = res.geste.libelle || 'Ouvrir';
            carte.appendChild(ouvrir);
          }
          bMsg.appendChild(carte);
          messages.scrollTop = messages.scrollHeight;
          // Lecture seulement (pas la navigation) : le résultat repart au
          // modèle pour une vraie réponse.
          if (mod.estLecture(nom)) bsAstSynthetiser(question, nom, proposition.params, res, messages, profondeur || 0, proposition.thought_signature, bMsg, carte);
          return;
        }
      } catch (err) {
        const bloc = document.createElement('div');
        bloc.style.cssText = 'font-size:12.5px;color:#B91C1C;margin-top:6px;';
        bloc.textContent = (err && err.message) || "Je n'ai pas pu récupérer l'information.";
        carte.appendChild(bloc);
        bMsg.appendChild(carte);
        messages.scrollTop = messages.scrollHeight;
        return;
      }

      // Certaines actions (supprimer_chantier, supprimer_etape…) sont
      // irréversibles : un simple clic ne suffit pas comme confirmation.
      // La carte passe en rouge et le bouton n'exécute qu'après un appui
      // maintenu d'une seconde entière — un clic accidentel ne suffit plus.
      const mod = await import('./app-actions.js');
      const destructif = mod.estDestructif(nom);
      if (destructif) carte.classList.add('danger');

      const resume = document.createElement('div');
      resume.style.cssText = 'font-size:12px;color:var(--t1);font-weight:700;margin-bottom:6px;';
      resume.textContent = proposition.resume_humain || 'Action proposée';
      carte.appendChild(resume);

      // Ce que le CODE fera d'une remise dictée (creer_devis, modifier_devis) :
      // écrit par la fonction qui l'appliquera, jamais laissé au seul
      // `resume_humain` du modèle. Une remise annoncée là et jamais posée est
      // exactement le bug réparé le 05/09/2026.
      const detail = (typeof mod.detailProposition === 'function')
        ? mod.detailProposition(nom, proposition.params) : '';
      if (detail) {
        const precision = document.createElement('div');
        precision.style.cssText = 'font-size:11px;color:var(--t1);margin-bottom:6px;';
        precision.textContent = detail;
        carte.appendChild(precision);
      }

      // Le message qui va partir, visible et modifiable AVANT Valider.
      let zoneMessage = null;
      if (typeof mod.apercuMessage === 'function') {
        try {
          const ap = await mod.apercuMessage(nom, proposition.params);
          if (ap && ap.texte) {
            const lab = document.createElement('div');
            lab.style.cssText = 'font-size:11px;color:#5A7268;margin:2px 0 4px;';
            lab.textContent = ap.titre || 'Message qui sera envoyé';
            zoneMessage = document.createElement('textarea');
            zoneMessage.className = 'bs-ast-apercu-ta';
            zoneMessage.value = ap.texte;
            zoneMessage.rows = Math.min(8, Math.max(3, ap.texte.split('\n').length + 1));
            zoneMessage.setAttribute('aria-label', 'Message à envoyer, modifiable');
            carte.appendChild(lab);
            carte.appendChild(zoneMessage);
          }
        } catch (_) { zoneMessage = null; }
      }

      const rappel = document.createElement('div');
      rappel.style.cssText = 'font-size:11px;color:#5A7268;margin-bottom:8px;';
      rappel.textContent = destructif
        ? 'Action irréversible. Maintenez le bouton une seconde pour confirmer.'
        : "Rien n'est enregistré tant que vous n'avez pas validé.";
      carte.appendChild(rappel);

      const LIBELLE_SUPPRIMER = 'Supprimer définitivement';

      const valider = document.createElement('button');
      valider.className = 'bs-ast-card-btn bs-ast-valider';
      valider.type = 'button';
      valider.textContent = destructif ? LIBELLE_SUPPRIMER : 'Valider';
      if (destructif) valider.style.touchAction = 'none';

      const annuler = document.createElement('button');
      annuler.className = 'bs-ast-card-btn';
      annuler.type = 'button';
      annuler.style.cssText = 'background:#FFFFFF;color:#5A7268;border:1px solid #D3E3DA;';
      annuler.textContent = 'Annuler';

      const etat = document.createElement('div');
      // `pre-line` : le compte rendu d'une écriture est MULTILIGNE (résumé des
      // lignes, totaux, avertissements). Sans lui, tout se collait en un pavé
      // où l'écart de total se perdait au milieu d'une phrase.
      etat.style.cssText = 'font-size:12px;margin-top:8px;white-space:pre-line;';

      annuler.addEventListener('click', () => {
        valider.remove(); annuler.remove();
        etat.style.color = '#5A7268';
        etat.textContent = "Annulé. Rien n'a été enregistré.";
        // Un refus est l'information la plus utile du journal : c'est un cas ou
        // l'assistant a propose quelque chose que l'artisan ne voulait pas.
        bsAstMarquerValidation(logId, false);
      });

      let enCours = false;
      async function bsAstExecuter() {
        if (enCours) return;
        enCours = true;
        // Marque au CLIC, pas apres l'ecriture. Ce qu'on mesure ici est le
        // jugement de l'artisan sur la proposition (« oui, c'est bien ce que je
        // demandais »), pas la reussite technique de l'action : une ecriture qui
        // echoue ensuite est un bug d'execution, pas une incomprehension, et les
        // pannes ont deja leur journal (`erreurs_front`).
        bsAstMarquerValidation(logId, true);
        valider.disabled = true; annuler.disabled = true;
        etat.style.color = '#5A7268';
        etat.textContent = destructif ? 'Suppression…' : 'Enregistrement…';
        try {
          if (zoneMessage) {
            const t = zoneMessage.value.trim();
            if (!t) { throw new Error('Le message est vide.'); }
            proposition.params = Object.assign({}, proposition.params || {}, { message: t });
            zoneMessage.disabled = true;
          }
          const res = await mod.executerAction(nom, proposition.params);
          valider.remove(); annuler.remove();
          etat.style.color = 'var(--t1)';
          etat.textContent = res.message;
          // L'écran qui a demandé l'action (fiche chantier, planning…) se met
          // à jour sans rechargement : il écoute cet événement.
          try { document.dispatchEvent(new CustomEvent('bs:action-executee', { detail: { action: nom, params: proposition.params, res } })); } catch (_) {}
          // Une action peut avoir réussi ET devoir alerter : un avenant dont le
          // total HT a bougé d'un montant que les consignes n'expliquent pas
          // (voir controlerEcartTotal, devis-store.js). Le texte de l'alerte
          // s'affiche EN ROUGE, sous les deux totaux qui lui servent d'ancre —
          // le message vert seul laissait passer « 5 % » appliqué à 50 %.
          if (res.alerte) {
            const rouge = document.createElement('div');
            rouge.style.cssText = 'font-size:12px;color:#B91C1C;font-weight:700;margin-top:8px;';
            rouge.textContent = res.alerte;
            carte.appendChild(rouge);
          }
          if (res.lien) {
            const lien = document.createElement('a');
            lien.className = 'bs-ast-card-btn';
            lien.href = res.lien;
            lien.textContent = res.libelle_lien || bsLibelleLien(res.lien);
            // Lien externe (WhatsApp, cartes…) : dans l'application dédiée, pas
            // à la place de l'appli.
            if (/^https?:\/\//i.test(res.lien) && !res.lien.startsWith(location.origin)) { lien.target = '_blank'; lien.rel = 'noopener'; }
            lien.style.marginTop = '8px';
            carte.appendChild(lien);
          }
          // Message au client rédigé par l'assistant (preparer_relance) :
          // « Envoyer au client » ici même, après relecture (Moctar, 06/09).
          if (res.geste && res.geste.envoyer_client) {
            const g = res.geste.envoyer_client;
            const env = document.createElement('button');
            env.type = 'button';
            env.className = 'bs-ast-card-btn';
            env.style.cssText = 'margin-top:8px;border:0;font:inherit;cursor:pointer;';
            env.textContent = 'Envoyer au client' + (g.client_name ? ' (' + g.client_name + ')' : '');
            env.addEventListener('click', async () => {
              env.disabled = true;
              env.textContent = 'Envoi…';
              try {
                const r2 = await mod.envoyerAuClient({ chantier_id: g.chantier_id, texte: g.texte });
                env.textContent = 'Envoyé au client';
                etat.textContent = (r2 && r2.message) || 'Message envoyé au client.';
                try { document.dispatchEvent(new CustomEvent('bs:action-executee', { detail: { action: 'envoyer_au_client', params: g, res: r2 } })); } catch (_) {}
              } catch (e2) {
                env.disabled = false;
                env.textContent = 'Envoyer au client';
                etat.style.color = '#B91C1C';
                etat.textContent = (e2 && e2.message) || "L'envoi a échoué. Rien n'est parti.";
              }
            });
            carte.appendChild(env);
          }
          // Suites logiques d'une action (06/09, Moctar : après une étape
          // ajoutée, proposer le devis supplémentaire, les fournitures, le
          // conseil matériaux) : un bouton par suite, l'artisan choisit.
          if (res.geste && Array.isArray(res.geste.suites) && res.geste.suites.length) {
            const rangee = document.createElement('div');
            rangee.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;';
            res.geste.suites.slice(0, 4).forEach((su) => {
              const b = document.createElement('button');
              b.type = 'button';
              b.className = 'bs-ast-chip';
              b.textContent = su.libelle || su.question || su.outil;
              b.addEventListener('click', () => {
                if (su.outil && typeof window.bsAssistantProposer === 'function') {
                  window.bsAssistantProposer(su.outil, su.params || {}, su.texte || su.libelle, su.resume || su.libelle);
                } else if (su.question) {
                  sendMessage(su.question);
                }
              });
              rangee.appendChild(b);
            });
            carte.appendChild(rangee);
          }
        } catch (err) {
          enCours = false;
          valider.disabled = false; annuler.disabled = false;
          etat.style.color = '#B91C1C';
          etat.textContent = (err && err.message)
            || (destructif ? "La suppression a échoué." : "L'enregistrement a échoué.");
          if (destructif) valider.textContent = LIBELLE_SUPPRIMER;
        }
        messages.scrollTop = messages.scrollHeight;
      }

      if (destructif) {
        // Séquence : pointerdown (ou maintien clavier sur Entrée/Espace)
        // démarre un minuteur de 1000 ms qui exécute à échéance ; tout
        // relâchement ou sortie du pointeur/focus avant l'échéance annule
        // le minuteur et rend le libellé initial. touch-action:none empêche
        // le défilement tactile de voler le geste de maintien. Un second
        // pointerdown/keydown pendant un maintien en cours est ignoré : il
        // ne doit jamais écraser le minuteur en cours ni en poser un second
        // (sinon bsAstExecuter() serait invoqué deux fois).
        let minuteur = null;
        const demarrerMaintien = (ev) => {
          if (valider.disabled || minuteur != null) return;
          ev.preventDefault();
          valider.textContent = 'Maintenez…';
          minuteur = setTimeout(() => {
            minuteur = null;
            bsAstExecuter();
          }, 1000);
        };
        const annulerMaintien = () => {
          if (minuteur == null) return;
          clearTimeout(minuteur);
          minuteur = null;
          valider.textContent = LIBELLE_SUPPRIMER;
        };
        valider.addEventListener('pointerdown', demarrerMaintien);
        valider.addEventListener('pointerup', annulerMaintien);
        valider.addEventListener('pointerleave', annulerMaintien);
        valider.addEventListener('pointercancel', annulerMaintien);
        // Clavier : Entrée/Espace maintenus 1 s équivalent au maintien
        // pointeur. Aucun listener 'click' n'est posé sur ce bouton, donc
        // un clic synthétique (ou Entrée relâchée trop tôt) n'exécute rien.
        valider.addEventListener('keydown', (ev) => {
          if (ev.repeat) return;
          if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'Spacebar') return;
          demarrerMaintien(ev);
        });
        valider.addEventListener('keyup', (ev) => {
          if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'Spacebar') return;
          annulerMaintien();
        });
        valider.addEventListener('blur', annulerMaintien);
      } else {
        valider.addEventListener('click', bsAstExecuter);
      }

      carte.appendChild(valider);
      carte.appendChild(annuler);
      carte.appendChild(etat);
      bMsg.appendChild(carte);
      messages.scrollTop = messages.scrollHeight;
    }

    // Appel du vrai assistant (Edge Function Gemini) pour toute question, sans
    // exception : chiffrage, planning, finances, chantiers, questions ouvertes.
    // Mémoire de conversation. Chaque question partait seule : l'artisan qui
    // enchaînait « et pour la semaine prochaine ? » recevait une réponse hors
    // sujet, parce que le modèle n'avait jamais vu la question d'avant. Le
    // serveur lit `messages` depuis toujours (gemini-assistant/index.ts:1011),
    // c'est le client qui ne les envoyait pas.
    // 12 tours max : le serveur refuse au-delà (`historique_trop_long`).
    let bsAstHistorique = [];
    function bsAstHistPush(role, texte) {
      const t = String(texte == null ? '' : texte).trim();
      if (!t) return;
      bsAstHistorique.push({ role: role === 'user' ? 'user' : 'model', content: t.slice(0, 2000) });
      if (bsAstHistorique.length > 12) bsAstHistorique = bsAstHistorique.slice(-12);
    }

    // Données réelles de l'artisan envoyées avec chaque question : le serveur
    // (gemini-assistant/index.ts) attend `context.devis[]` et `.chantiers[]`
    // pour répondre avec des chiffres vrais au lieu de renvoyer vers un outil.
    // Cache 60 s : un artisan qui enchaîne plusieurs questions ne redéclenche
    // pas une lecture localStorage + 2 requêtes réseau à chaque tour.
    // Écran courant : page, chantier ou devis ouvert (URL), et les manques
    // déjà suggérés dans cette session (sessionStorage), pour que le modèle
    // ne répète jamais la même suggestion.
    function bsContexteEcranBrut() {
      const q = new URLSearchParams(location.search);
      const page = (location.pathname.split('/').pop() || '').replace('.html', '');
      const out = { page };
      const id = q.get('id') || q.get('chantier');
      if (id && /^[0-9a-f-]{20,}$/i.test(id)) {
        if (page === 'chantier' || page === 'equipe' || q.get('chantier')) out.chantier_id = id;
        else if (page === 'devis') out.devis_id = id;
      }
      return out;
    }
    const CLE_SUGG = 'bs_manques_suggeres';
    function bsManquesSuggeres() {
      try { return JSON.parse(sessionStorage.getItem(CLE_SUGG) || '[]'); } catch (_) { return []; }
    }
    function bsNoterManquesSuggeres(liste) {
      try {
        const deja = new Set(bsManquesSuggeres());
        (liste || []).forEach((m) => deja.add(m));
        sessionStorage.setItem(CLE_SUGG, JSON.stringify([...deja]));
      } catch (_) {}
    }
    // Une page peut définir son propre window.bsContexteEcran (chantier.js :
    // onglet, nom du client) : on le fusionne au lieu de l'écraser.
    function bsAstContexteEcran() {
      let page = {};
      try {
        if (typeof window.bsContexteEcran === 'function' && window.bsContexteEcran !== bsAstContexteEcran) page = window.bsContexteEcran() || {};
      } catch (_) {}
      return { ...bsContexteEcranBrut(), ...page, manques_deja_suggeres: bsManquesSuggeres() };
    }
    if (typeof window.bsContexteEcran !== 'function') window.bsContexteEcran = bsAstContexteEcran;

    let bsCtxCache = { at: 0, val: null };
    async function bsContexteDonnees() {
      if (Date.now() - bsCtxCache.at < 60000 && bsCtxCache.val) return bsCtxCache.val;
      const out = { devis: [], chantiers: [] };
      try {
        const store = await import('./devis-store.js');
        // `completerQuote` complète les champs manquants d'un devis local
        // (status par défaut 'attente'/'Brouillon') sans jamais inventer de
        // chiffre. Le champ qui distingue « envoyé » de « brouillon » est
        // `statusLabel`, pas `status` : au niveau UI, `status` ne vaut que
        // 'attente' | 'signe' | 'termine' (voir UI_VERS_BASE dans
        // devis-store.js) — c'est devis.html qui filtre sur `statusLabel`
        // ('Envoyé au client', 'Brouillon', 'Refusé', 'Expiré') pour les
        // mêmes écrans, donc c'est la valeur de vérité à reprendre ici.
        out.devis = store.lireLocal().slice(0, 20).map((e) => {
          const q = store.completerQuote(e.quote || {});
          let statut = 'brouillon';
          if (q.status === 'signe') statut = 'accepte';
          else if (q.statusLabel === 'Envoyé au client') statut = 'envoye';
          else if (q.statusLabel) statut = q.statusLabel;
          return { numero: q.id, client: q.client || '', ttc: Number(q.totTtc) || 0, statut };
        });
      } catch (_) {}
      try {
        const sb = await import('./supabase.js');
        // allSettled : un échec de l'une des deux requêtes ne doit pas priver
        // l'assistant du contexte que l'autre a réussi à récupérer.
        const [chsR, profR] = await Promise.allSettled([sb.listChantiers(), sb.getMyProfile()]);
        const chs = chsR.status === 'fulfilled' ? chsR.value : null;
        const prof = profR.status === 'fulfilled' ? profR.value : null;
        // Colonnes réelles de la table `chantiers` (supabase-schema.sql) :
        // client_name, status, adresse, date_debut — pas `client`/`statut`/`address`.
        out.chantiers = (chs || []).slice(0, 20).map((c) => ({
          id: c.id, client: c.client_name, statut: c.status, date_debut: c.date_debut, adresse: c.adresse,
        }));
        // `pro_profiles.display_name` porte le nom de l'entreprise (pas de
        // colonne `entreprise` : vérifié dans supabase-schema.sql).
        if (prof && prof.display_name) out.entreprise = prof.display_name;
        // Manières de l'assistant (Mon entreprise › Réglages) : forme seulement.
        if (prof) out.style = { tutoiement: !!prof.style_tutoiement, longueur: prof.style_longueur === 'detaille' ? 'detaille' : 'court', notes: (prof.style_notes || '').slice(0, 240) };
        // ── Ce qui MANQUE chez cet artisan (couche 2 du plan « assistant qui
        // se comprend », Moctar 06/09 : « s'il n'a pas rempli certains
        // éléments, l'assistant lui suggère : pensez à faire ça, vous aurez
        // des analyses plus précises »). Calculé ici, avec ce que l'appli a
        // déjà sous la main ; le serveur le met dans le prompt, le modèle en
        // glisse UNE, jamais la même deux fois (voir bsContexteEcran).
        const manques = [];
        if (prof && (prof.taux_horaire_ttc == null || Number(prof.taux_horaire_ttc) <= 0)) manques.push('taux_horaire');
        // La grille n'est hydratée depuis le cloud que sur Devis et Mon
        // entreprise : ailleurs, « vide » ne voudrait rien dire.
        try {
          const pg = bsContexteEcranBrut().page;
          if (pg === 'devis' || pg === 'profile-entreprise') {
            const grille = (window.BtpPriceGridManager && window.BtpPriceGridManager.getGrid && window.BtpPriceGridManager.getGrid()) || [];
            if (!grille.length) manques.push('grille_prix_vide');
          }
        } catch (_) {}
        try {
          const mat = await import('./app-materiaux.js');
          const pa = await mat.chargerPrixAchat();
          if (!pa || !pa.length) manques.push('prix_achat');
        } catch (_) {}
        try {
          if (typeof sb.coffreDocsExpirants === 'function') {
            const proches = await sb.coffreDocsExpirants(60);
            if ((proches || []).some((d) => d.categorie === 'decennale')) manques.push('decennale_expire_bientot');
          }
        } catch (_) {}
        const ecran = bsContexteEcranBrut();
        if (ecran.chantier_id) {
          try {
            const taches = await sb.listTachesChantier(ecran.chantier_id);
            if (!taches || !taches.length) manques.push('chantier_sans_etapes');
            else if (taches.some((t) => t.duree_h == null && !t.jour)) manques.push('etapes_sans_duree');
            const ch = (out.chantiers || []).find((c) => c.id === ecran.chantier_id);
            if (ch && !ch.date_debut) manques.push('chantier_sans_date_debut');
          } catch (_) {}
        }
        out.manques = manques;
      } catch (_) {}
      bsCtxCache = { at: Date.now(), val: out };
      return out;
    }
    window.bsContexteDonnees = bsContexteDonnees;

    async function bsAstAskLLM(question, bMsg, messages) {
      // L'artisan DIT que quelque chose ne marche pas. C'est la moitie du
      // probleme que la machine ne voit pas : une panne silencieuse (401, 500)
      // n'atteint jamais l'assistant, mais une confusion ou un blocage, elle,
      // s'exprime ici — et se perdait dans la conversation.
      if (typeof window.bsEstUnePlainte === 'function' && window.bsEstUnePlainte(question)
          && typeof window.bsSignalerPlainte === 'function') {
        window.bsSignalerPlainte({
          message: question,
          contexte: bsAstHistorique.slice(-4).map(function (m) {
            return (m.role === 'user' ? 'artisan' : 'assistant') + ' : ' + m.content;
          }).join(' | '),
        });
      }
      const cfg = window.__BATISPOT_CONFIG__ || {};
      const url = (cfg.SUPABASE_URL || 'https://cisniwhaiydazdpzvino.supabase.co') + '/functions/v1/gemini-assistant';
      bMsg.replaceChildren(window.bsAstPointsAttente());
      // Données réelles de l'artisan (devis, chantiers, entreprise) : sans elles
      // le serveur n'a rien à citer et répond « données non transmises » ou
      // doit appeler un outil pour la moindre question chiffrée.
      const context = await bsContexteDonnees();
      // Le budget de 25 s ne couvre que l'appel Gemini : la collecte ci-dessus
      // (cache froid, jusqu'à 15 s par requête) ne doit pas le consommer, sinon
      // le fetch peut partir avec un signal déjà abandonné.
      const ctrl = new AbortController();
      const killer = setTimeout(() => ctrl.abort(), 25000);
      try {
        const headers = { 'content-type': 'application/json' };
        if (cfg.SUPABASE_ANON_KEY) {
          headers['apikey'] = cfg.SUPABASE_ANON_KEY;
          // On envoyait la cle anonyme comme jeton : cote serveur l'artisan
          // etait donc indistinguable d'un visiteur, et les modes couteux
          // (image, outils) restaient ouverts a tous. Le garde EXIGER_JWT_APP
          // ne pouvait pas etre active sans casser l'assistant.
          // On envoie le vrai jeton de session quand il existe, la cle anonyme
          // sinon (chatbot public du site).
          headers['authorization'] = 'Bearer ' + (bsJetonSession() || cfg.SUPABASE_ANON_KEY);
        }
        const r = await fetch(url, {
          method: 'POST',
          headers,
          // `messages` = les tours PRÉCÉDENTS seulement ; `question` est le tour
          // courant et serait compté deux fois s'il y figurait aussi.
          body: JSON.stringify({
            mode: 'artisan-assistant',
            prompt: question,
            messages: bsAstHistorique.slice(),
            context,
            // (06/09, vitesse) : réponse en flux — les premiers mots s'affichent
            // pendant que le modèle écrit ; `fin` porte le JSON classique.
            stream: true,
            // `window.bsContexteEcran` n'existe pas encore (tâche à venir) : on
            // retombe sur la page courante, déjà utile pour situer la question.
            contexte_ecran: bsAstContexteEcran(),
          }),
          signal: ctrl.signal,
        });
        // Une fois envoyés, les manques comptent comme suggérés : le modèle a
        // eu l'occasion de le dire une fois, il ne le redira pas.
        if (r.ok && context && Array.isArray(context.manques)) bsNoterManquesSuggeres(context.manques);
        // Quota/plafond (429) : le serveur renvoie un `text` pense pour le chatbot
        // PUBLIC du site (« laissez-nous votre email »), absurde pour un artisan
        // deja connecte. On lit `error` (cf. supabase/functions/gemini-assistant/
        // index.ts) et on ecrit nous-memes le bon message plutot que d'afficher
        // celui du serveur tel quel.
        if (r.status === 429) {
          let j429 = null;
          try { j429 = await r.json(); } catch (_) { /* corps non JSON */ }
          const err429 = j429 && j429.error;
          if (err429 === 'plafond_cout' || err429 === 'quota_global') {
            bMsg.innerHTML = "Le budget IA du jour est atteint. L'assistant revient demain matin ; vos écrans restent utilisables à la main.";
            return;
          }
          if (err429 === 'quota_atteint') {
            // QUOTA_ARTISAN_JOUR (supabase/functions/gemini-assistant/index.ts, l.86) :
            // 200 demandes/jour par defaut.
            bMsg.innerHTML = "Vous avez atteint votre quota d'aujourd'hui (200 demandes). Reprise demain.";
            return;
          }
          // Code 429 inconnu : on ne sait pas ce que c'est, on le traite comme les
          // autres echecs plus bas (message generique + alerte equipe).
          throw new Error('http_429_' + (err429 || 'inconnu'));
        }
        if (!r.ok) throw new Error('http_' + r.status);
        let j = null;
        if ((r.headers.get('content-type') || '').includes('text/event-stream') && r.body) {
          // Flux SSE : deltas affichés au fil de l'eau (texte échappé), puis `fin`.
          const reader = r.body.getReader();
          const dec = new TextDecoder();
          let tampon = '', enCours = '', affiche = false;
          const zone = document.createElement('span');
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            tampon += dec.decode(value, { stream: true });
            let idx;
            while ((idx = tampon.indexOf('\n')) >= 0) {
              const ligne = tampon.slice(0, idx).trim(); tampon = tampon.slice(idx + 1);
              if (!ligne.startsWith('data:')) continue;
              let ev = null; try { ev = JSON.parse(ligne.slice(5).trim()); } catch (_) { continue; }
              if (ev && typeof ev.delta === 'string') {
                enCours += ev.delta;
                if (!affiche) { bMsg.replaceChildren(zone); affiche = true; }
                zone.textContent = enCours;
                messages.scrollTop = messages.scrollHeight;
              } else if (ev && ev.fin) {
                j = ev.fin;
              }
            }
          }
          if (!j) throw new Error('stream_sans_fin');
          if (j.error) throw new Error(String(j.error));
        } else {
          j = await r.json();
        }
        const txt = (j && (j.text || (j.data && j.data.text))) || '';
        if (!txt) throw new Error('empty');
        // On n'enregistre que les échanges réussis : un appel en erreur laisserait
        // une question sans réponse dans l'historique, que le modèle relirait.
        bsAstHistPush('user', question);
        bsAstHistPush('model', txt);
        // Échappement avant rendu : la sortie du modèle n'est jamais du HTML de confiance
        // (une injection de prompt pourrait sinon faire exécuter du script).
        const safe = txt.replace(/[&<>"']/g, (c) => (
          { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
        bMsg.innerHTML = safe.replace(/\n/g, '<br>');
        // L'assistant a proposé une action : on affiche le récapitulatif à valider.
        // Rien n'est écrit tant que l'artisan n'a pas cliqué (verrou d'action).
        if (j && j.actionProposal) bsAstRendreProposition(j.actionProposal, bMsg, messages, j.log_id, question, 0);
      } catch (e) {
        // Repli honnête : on n'invente pas de réponse, on oriente vers les écrans.
        if (typeof window.bsSignalerPanne === 'function') {
          window.bsSignalerPanne({ action: 'assistant', mode: 'artisan-assistant',
            code: (e && e.name === 'AbortError') ? 'timeout' : 'appel',
            detail: String((e && e.message) || e) });
        }
        bMsg.innerHTML = "L'assistant ne répond pas pour l'instant. Réessayez dans un instant ; si ça persiste, l'équipe est prévenue automatiquement."
          + '<div class="bs-ast-card-result">'
          + '<a class="bs-ast-card-btn" href="/app/planning.html">Voir mon planning →</a>'
          + '<a class="bs-ast-card-btn" href="/app/devis.html">Ouvrir mes devis →</a>'
          + '</div>';
      } finally {
        clearTimeout(killer);
        messages.scrollTop = messages.scrollHeight;
      }
    }

    // Envoi de message intelligent
    async function sendMessage(text) {
      let q = (text || input.value || '').trim();
      if (!q) return;
      // Correction metier AVANT tout traitement : le moteur du navigateur ecrit
      // « placard » pour Placo et « mille » pour ml. Une unite mal lue change le
      // montant d'un facteur 10 sans que personne le voie.
      try {
        const dict = await import('./app-dictee-btp.js');
        const r = dict.corrigerDictee(q);
        if (r.corrections.length) {
          console.info('[dictée] corrigé :', r.corrections.map((c) => `${c.avant} → ${c.apres}`).join(', '));
          q = r.texte;
        }
      } catch (_) { /* la correction est un bonus, jamais un bloquant */ }
      // Le texte part : on ferme la dictee ici, sinon elle le reecrit dans le
      // champ et l'arret suivant l'envoie en double. (No-op si on n'ecoute pas,
      // donc pas de recursion quand l'appel vient justement de recog.onend.)
      couperDictee();
      input.value = '';

      // Message utilisateur
      const uMsg = document.createElement('div');
      uMsg.className = 'bs-ast-msg user';
      uMsg.textContent = q;
      messages.appendChild(uMsg);
      messages.scrollTop = messages.scrollHeight;

      // Réponse bot (chargement)
      const bMsg = document.createElement('div');
      bMsg.className = 'bs-ast-msg bot';
      bMsg.textContent = 'Analyse de votre demande...';
      messages.appendChild(bMsg);
      messages.scrollTop = messages.scrollHeight;

      // Tout texte non vide part au LLM. Il n'y a plus de routeur scripté
      // ici : des raccourcis par mots-clés répondaient avec des montants
      // codés en dur pour la peinture et la salle de bain, plus un bouton
      // de rechargement dans l'éditeur — un catalogue déguisé, interdit par
      // la règle fondatrice (les prix sont ceux de l'artisan, jamais les
      // nôtres) et par `_shared/outils-assistant.ts` (« aucun barème, aucun
      // prix »). Le cadrage BTP (hors-sujet, etc.) est géré par le socle
      // serveur.
      bsAstAskLLM(q, bMsg, messages);
    }

    sendBtn.addEventListener('click', () => sendMessage());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    document.querySelectorAll('.bs-ast-chip').forEach(chip => {
      chip.addEventListener('click', () => sendMessage(chip.dataset.q));
    });

    // ── Reconnaissance Vocale Native Mobile (Web Speech API) ──
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recog = null;
    let isListening = false;
    // Coupe la dictee sans rien envoyer. Reassignee plus bas quand la
    // reconnaissance vocale est disponible ; no-op sinon.
    let couperDictee = () => {};

    if (SR) {
      try {
        recog = new SR();
        recog.lang = 'fr-FR';
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        recog.continuous = !isIOS;
        recog.interimResults = true;

        // Meme bug que dans devis.html : la boucle repartait de resultIndex
        // et ecrasait le champ, donc chaque segment fige par le moteur
        // effacait la phrase precedente. On accumule les segments figes et
        // on n'affiche le provisoire qu'a leur suite.
        // Declare AVANT les gestionnaires qui s'en servent : couperDictee, onerror
        // et onend le lisent tous pour rendre au champ son libelle d'origine.
        const placeholderInit = input.getAttribute('placeholder') || 'Posez votre question...';
        let dicteeFigee = '';
        let envoiFait = false;   // le texte est deja parti : onend ne renvoie pas

        // ⚠️ Vider le champ n'ARRETE PAS la dictee. `dicteeFigee` garde la
        // phrase deja dite : au prochain onresult le champ est reecrit avec le
        // texte qui venait de partir, et onend l'envoie une seconde fois.
        // Meme double-envoi que dans app/devis.html — corrige le 31/08.
        couperDictee = () => {
          if (!isListening) return;
          isListening = false;
          envoiFait = true;
          dicteeFigee = '';
          micBtn.classList.remove('listening');
          // Le champ doit cesser d'annoncer l'ecoute EN MEME TEMPS que le micro
          // s'arrete. Avant le 01/09 la remise a zero n'existait que dans onerror,
          // qui ne se declenche pas de facon fiable apres un abort() selon le
          // navigateur : le micro etait bien coupe, mais « Je vous ecoute... »
          // restait affiche et l'artisan croyait qu'il tournait encore.
          input.placeholder = placeholderInit;
          // abort() et non stop() : `stop()` finalise la session et delivre
          // encore un dernier onresult, qui reecrit dans le champ la phrase
          // qu'on vient d'envoyer (« le texte reste dans la barre », 31/08).
          // Ici l'instance `recog` est REUTILISEE d'une dictee a l'autre : on
          // ne peut pas debrancher ses gestionnaires comme dans devis.html,
          // c'est le garde `if (!isListening)` de onresult qui protege.
          try { recog.abort(); } catch (_) { try { recog.stop(); } catch (_) {} }
        };

        recog.onstart = () => {
          dicteeFigee = input.value ? input.value.replace(/\s+$/, '') + ' ' : '';
          // SEUL endroit autorise a annoncer l'ecoute : ici, le micro tourne
          // vraiment. Les appelants ne doivent jamais le promettre avant.
          input.placeholder = 'Je vous écoute...';
        };
        recog.onresult = (e) => {
          // La dictee a ete coupee par un envoi : ce resultat est le tardillon
          // d'une session morte, il ne doit surtout pas reecrire dans le champ.
          if (!isListening) return;
          let provisoire = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const segment = e.results[i];
            // Android redit toute la phrase a chaque resultat final : coller
            // les morceaux produit « est-ce queest-ce que tu... » (vu le 31/08
            // sur l'ecran Devis). On n'ajoute que ce qui n'est pas deja la.
            if (segment.isFinal) {
              const t = segment[0].transcript.trim();
              const dejaLa = dicteeFigee.trim().toLowerCase();
              const ajout = t.toLowerCase();
              if (!t) { /* rien */ }
              else if (dejaLa.endsWith(ajout)) { /* deja pris en compte */ }
              else if (ajout.startsWith(dejaLa) && dejaLa) dicteeFigee = t + ' ';
              else dicteeFigee += t + ' ';
            } else provisoire = segment[0].transcript;
          }
          input.value = (dicteeFigee + provisoire).replace(/\s+/g, ' ').trimStart();
          // Champ monoligne : sans ca, la vue reste sur le debut de la phrase
          // et l'artisan dicte a l'aveugle des qu'il depasse la largeur.
          try { input.selectionStart = input.selectionEnd = input.value.length;
                input.scrollLeft = input.scrollWidth; } catch (_) {}
        };

        recog.onerror = (e) => {
          console.warn('[BatiSpot Voice]', e.error);
          micBtn.classList.remove('listening');
          isListening = false;
          // L'erreur ne partait QU'EN CONSOLE : l'artisan voyait « Je vous
          // ecoute... » sans que rien ne se passe, et un micro refuse par le
          // navigateur restait totalement invisible.
          if (e.error === 'not-allowed') {
            input.placeholder = "Micro refusé — autorisez-le dans votre navigateur";
          } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
            input.placeholder = "La dictée s'est interrompue — réessayez";
          } else {
            input.placeholder = placeholderInit;
          }
        };

        recog.onend = () => {
          micBtn.classList.remove('listening');
          isListening = false;
          // onend est le SEUL gestionnaire garanti a chaque fin de dictee, quelle
          // qu'en soit la cause. C'est donc ici que le champ cesse d'annoncer
          // l'ecoute — pas seulement dans onerror.
          if (input.placeholder === 'Je vous écoute...') input.placeholder = placeholderInit;
          // Le texte est deja parti par un envoi manuel (Entree ou bouton
          // Envoyer) : surtout ne pas l'envoyer une seconde fois.
          if (envoiFait) { envoiFait = false; return; }
          if (input.value.trim().length > 2) {
            sendMessage();
          }
        };


        // Demarre la dictee et dit HONNETEMENT si elle a demarre.
        // Ne jamais annoncer « je vous ecoute » depuis l'appelant : seul
        // recog.onstart sait que le micro tourne vraiment.
        function demarrerDicteeAssistant() {
          if (isListening) return true;
          input.value = '';
          try {
            recog.start();
            micBtn.classList.add('listening');
            isListening = true;
            return true;
          } catch (err) {
            console.warn('Speech start error', err);
            input.placeholder = "Le micro n'a pas pu démarrer — réessayez";
            return false;
          }
        }

        micBtn.addEventListener('click', () => {
          if (window.__bsMicServeurBranche) return;   // le maintien (dictée serveur) a pris le bouton
          if (isListening) {
            recog.stop();
            micBtn.classList.remove('listening');
            isListening = false;
          } else {
            demarrerDicteeAssistant();
          }
        });

        // API publique : ouvrir l'assistant ET lancer la dictee DANS le geste
        // reel de l'utilisateur.
        //
        // dashboard.html faisait btnAssistant.click() puis, 250 ms plus tard,
        // mic.click(). Les navigateurs mobiles refusent d'ouvrir un micro sur
        // un clic simule differe : recog.start() echouait en silence et le
        // bouton « Activite du mois » ne faisait rien (signale le 31/08).
        // Ici tout se passe dans la meme pile d'appel que le vrai clic.
        window.bsAssistantDicter = function () {
          overlay.classList.add('open');
          return demarrerDicteeAssistant();
        };
      } catch (err) {
        console.warn('Speech init failed', err);
      }
    } else {
      micBtn.style.opacity = '0.5';
      micBtn.title = 'Reconnaissance vocale non supportée sur ce navigateur';
    }

    // ── Micro de la feuille = dictée serveur « maintenir pour dicter » ────
    // Même moteur que la barre du haut (app-dictee-serveur.js, module ES).
    // Ce fichier est un script classique : le module expose un brancheur
    // dans window.bsBrancherMicServeur, ou appelle bsAssistantMicServeurPret()
    // s'il arrive après nous. Dans les deux cas : le bouton devient un
    // bouton à maintenir, le texte transcrit part comme une question, et le
    // clic Web Speech est neutralisé (window.__bsMicServeurBranche).
    function brancherMicServeur(brancher) {
      if (window.__bsMicServeurBranche || typeof brancher !== 'function') return;
      try {
        const phAvant = input.placeholder;
        brancher(micBtn, {
          contexte: 'assistant',
          texteAvant: () => input.value,
          onDebut: () => { micBtn.classList.add('listening'); input.placeholder = 'Je vous écoute… relâchez pour envoyer'; },
          onAttente: () => { input.placeholder = 'Je transcris…'; },
          onFin: (res) => {
            micBtn.classList.remove('listening'); input.placeholder = phAvant;
            const texte = res && typeof res.texte === 'string' ? res.texte.trim() : '';
            if (texte) sendMessage(texte);
          },
          onErreur: (msg) => { micBtn.classList.remove('listening'); input.placeholder = msg || phAvant; },
        });
        micBtn.style.touchAction = 'none';
        micBtn.title = 'Maintenir pour dicter';
        micBtn.style.opacity = '';
        window.__bsMicServeurBranche = true;
      } catch (e) { console.warn('[assistant] micro serveur non branché', e); }
    }
    window.bsAssistantMicServeurPret = brancherMicServeur;
    if (typeof window.bsBrancherMicServeur === 'function') brancherMicServeur(window.bsBrancherMicServeur);

    // « Dicter un devis » (écran Devis) : on amène l'artisan DANS l'assistant
    // (Moctar, 05/09 : « dicter seul n'a pas d'utilité »). L'assistant dit
    // quoi faire, le micro à maintenir est sous le pouce, et c'est
    // creer_devis qui fera le devis à partir de ce qui est dicté.
    window.bsAssistantDicterDevis = function () {
      overlay.classList.add('open');
      const bMsg = document.createElement('div');
      bMsg.className = 'bs-ast-msg bot';
      bMsg.textContent = window.__bsMicServeurBranche
        ? 'Décrivez les travaux : maintenez le micro, parlez, relâchez. Je prépare le devis avec vos prix, vous le relisez avant tout envoi.'
        : 'Décrivez les travaux : appuyez sur le micro et parlez, ou écrivez. Je prépare le devis avec vos prix, vous le relisez avant tout envoi.';
      messages.appendChild(bMsg);
      messages.scrollTop = messages.scrollHeight;
      micBtn.classList.add('bs-ast-mic-invite');
      setTimeout(() => micBtn.classList.remove('bs-ast-mic-invite'), 4000);
    };

    // API publique pour la carte « L'assistant propose » (bas de page) : ouvrir
    // le panneau et envoyer une question telle quelle, ou ouvrir directement le
    // sélecteur photo. Les chips vivent en dehors de ce module (elles sont
    // injectées par page) ; ce sont les deux seuls points d'entrée dont elles
    // ont besoin, plutôt que de rouvrir tout l'état interne du panneau.
    window.bsAssistantEnvoyerQuestion = function (question) {
      const q = String(question == null ? '' : question).trim();
      if (!q) return;
      overlay.classList.add('open');
      sendMessage(q);
    };
    window.bsAssistantOuvrirPhoto = function (actionName) {
      overlay.classList.add('open');
      triggerCamera(actionName || 'metre');
    };
    // Ouvrir la conversation avec le clavier dans SON champ, sans rien
    // envoyer. Demande Moctar (05/09) : « quand je clique sur la fenêtre de
    // conversation je veux que ça ouvre l'assistant, pour qu'on voie ce qu'on
    // tape ». La barre du haut (app-barre-assistant.js) délègue ici dès le
    // toucher ; le texte déjà tapé, s'il y en a, suit.
    // Puces de la feuille = les questions les plus logiques POUR CET ÉCRAN
    // (mêmes propositions que la carte du bas, calculées sur les vraies
    // données de la page). Sans suggestion, les puces d'origine restent.
    const chipsZone = document.getElementById('bsAstChips');
    const chipsOrigine = chipsZone ? chipsZone.innerHTML : '';
    let chipsContexteIntro = false;
    // (06/09, Moctar) « enlever les suggestions en bas ; elles interviennent
    // lors de l'échange » : la rangée de puces n'apparaît qu'à partir de la
    // première réponse de l'assistant (le message d'accueil ne compte pas).
    function bsAstMajVisibilitePuces() {
      if (!chipsZone) return;
      chipsZone.hidden = messages.querySelectorAll('.bs-ast-msg').length <= 1;
    }
    try { new MutationObserver(bsAstMajVisibilitePuces).observe(messages, { childList: true }); } catch (_) {}
    function bsAstPucesContextuelles() {
      if (!chipsZone) return;
      bsAstMajVisibilitePuces();
      let sugg = typeof window.bsAssistantSuggestionsCourantes === 'function' ? window.bsAssistantSuggestionsCourantes() : null;
      // Écrans qui dessinent leur propre carte « L'assistant propose »
      // (tableau de bord, messages, devis…) : on relit leurs puces dans la
      // page, et un tap dans la feuille déclenche la puce d'origine.
      if (!sugg || !sugg.length) {
        const dom = [...document.querySelectorAll('.mq-assist .mq-chip, .mq-assist button, #bsAssistSuggestions .ui-chip')]
          .filter((el) => el.textContent.trim());
        sugg = dom.map((el) => ({ label: el.textContent.trim(), action: () => el.click() }));
      }
      if (!sugg.length) { chipsZone.innerHTML = chipsOrigine; chipsZone.querySelectorAll('.bs-ast-chip').forEach((c) => c.addEventListener('click', () => sendMessage(c.dataset.q))); return; }
      chipsZone.replaceChildren();
      sugg.slice(0, 4).forEach((s) => {
        const c = document.createElement('button');
        c.type = 'button'; c.className = 'bs-ast-chip'; c.textContent = s.label;
        c.addEventListener('click', () => {
          if (typeof s.action === 'function') { s.action(); return; }
          if (s.photo) { triggerCamera('metre'); return; }
          sendMessage(s.question || s.label);
        });
        chipsZone.appendChild(c);
      });
      if (!chipsContexteIntro) {
        chipsContexteIntro = true;
        const ctx = (typeof window.bsContexteEcran === 'function' && window.bsContexteEcran()) || {};
        // Le message générique d'accueil disparaît : une seule phrase, la bonne.
        const accueil = messages.querySelector('.bs-ast-msg.bot');
        if (accueil && messages.children.length === 1) accueil.remove();
        const b = document.createElement('div');
        b.className = 'bs-ast-msg bot';
        const ex = sugg.slice(0, 3).map((s) => s.label).join(' · ');
        b.textContent = (ctx.chantier_client ? `Chantier de ${ctx.chantier_client}. ` : '') + `Que voulez-vous faire ? Par exemple : ${ex}. Dites-le-moi, ou touchez une proposition.`;
        messages.appendChild(b);
        messages.scrollTop = messages.scrollHeight;
      }
    }
    // L'assistant ouvre la conversation EN POSANT sa question (Moctar, 05/09 :
    // « l'artisan veut parler à quelqu'un d'intelligent ») : pas de phrase
    // fabriquée dans la bouche de l'artisan.
    window.bsAssistantDemander = function (texteBot) {
      overlay.classList.add('open');
      bsAstPucesContextuelles();
      const t = String(texteBot == null ? '' : texteBot).trim();
      if (t) {
        const b = document.createElement('div');
        b.className = 'bs-ast-msg bot';
        b.textContent = t;
        messages.appendChild(b);
        messages.scrollTop = messages.scrollHeight;
        bsAstHistPush('model', t);
      }
      input.focus();
    };
    // Une action décidée par un BOUTON de l'appli (pas par le modèle) : on
    // ouvre la conversation, on montre la demande et la carte Valider de
    // l'outil voulu, directement. (06/09, Moctar : « Planifier les étapes
    // depuis le devis ouvre l'assistant puis ne crée rien » — le modèle
    // répondait par une simple recherche du chantier au lieu d'enchaîner.)
    window.bsAssistantProposer = function (action, params, texte, resume) {
      overlay.classList.add('open');
      if (texte) {
        const uMsg = document.createElement('div');
        uMsg.className = 'bs-ast-msg user';
        uMsg.textContent = String(texte);
        messages.appendChild(uMsg);
      }
      const bMsg = document.createElement('div');
      bMsg.className = 'bs-ast-msg bot';
      bMsg.textContent = 'Voici ce que je vous propose. Vérifiez, puis validez.';
      messages.appendChild(bMsg);
      messages.scrollTop = messages.scrollHeight;
      bsAstRendreProposition({ action, params: params || {}, resume_humain: resume || ('Action proposée : ' + action), requires_confirmation: true }, bMsg, messages, null);
    };
    window.bsAssistantOuvrirSaisie = function (texte) {
      overlay.classList.add('open');
      bsAstPucesContextuelles();
      const t = String(texte == null ? '' : texte);
      if (t) input.value = t;
      input.focus();
      try { input.setSelectionRange(input.value.length, input.value.length); } catch (_) {}
    };
    // Écrire une ligne dans le fil SANS interroger le modèle. Sert aux chemins
    // d'échec d'un outil qui a promis quelque chose (devis_depuis_photo) :
    // photo annulée, métré illisible, demande périmée. Un devis promis puis
    // abandonné en silence, c'est un artisan qui attend pour rien.
    window.bsAssistantDireBot = function (texte) {
      const t = String(texte == null ? '' : texte).trim();
      if (!t) return;
      overlay.classList.add('open');
      const bMsg = document.createElement('div');
      bMsg.className = 'bs-ast-msg bot';
      bMsg.textContent = t;
      messages.appendChild(bMsg);
      messages.scrollTop = messages.scrollHeight;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAssistantUI);
  } else {
    initAssistantUI();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Carte contextuelle « L'assistant propose »
  //
  // Avant : l'artisan devait penser à ouvrir l'assistant lui-même. La promesse
  // du fondateur (« toujours là, propose avant qu'on demande ») exige l'inverse
  // : une carte visible en bas de chaque écran, avec 2-3 suggestions qui
  // collent à ce que cet écran-là permet de faire. Un clic ouvre le panneau
  // existant et pose la question — rien de plus : c'est le même assistant, la
  // même validation avant écriture, juste un raccourci vers lui.
  // ─────────────────────────────────────────────────────────────────────────

  function bsPageKey() {
    try {
      const chemin = String(window.location.pathname || '');
      const base = chemin.split('/').pop() || '';
      return base.toLowerCase();
    } catch (_) {
      return '';
    }
  }

  // ── Contexte d'écran (task 5) ───────────────────────────────────────────
  // `bsAstAskLLM` envoie `window.bsContexteEcran()` au serveur à chaque
  // question, pour que le prompt sache ce que l'artisan a sous les yeux
  // (« ce chantier », « ce devis »…) sans le lui redemander. Les écrans à
  // état (chantier.js, devis.html, finances.html, planning.html, dm.html,
  // equipe.html, photos.html, profile-entreprise.html) posent LEUR PROPRE
  // fonction, plus précise, avant que l'artisan pose une question — voir
  // chacun de ces fichiers. Celle-ci n'est que le défaut pour les écrans qui
  // n'ont rien de plus à dire que « je suis sur telle page ».
  // `bsPageKey()` renvoie le nom de fichier brut (« profile-entreprise.html »,
  // « dashboard.html »…), pas les clés normalisées attendues par le serveur
  // (voir la liste dans la doc de tâche) : cette table ne couvre que les cas
  // où retirer simplement « .html » ne suffit pas.
  const BS_PAGE_KEY_MAP = {
    'dashboard.html': 'chantiers',
    'profile-entreprise.html': 'entreprise',
  };
  function bsContexteEcranParDefaut() {
    const brut = bsPageKey();
    return { page: BS_PAGE_KEY_MAP[brut] || brut.replace(/\.html$/, '') };
  }
  if (typeof window.bsContexteEcran !== 'function') {
    window.bsContexteEcran = bsContexteEcranParDefaut;
  }

  // Pages CLIENT : jamais de carte « propose » — l'assistant qu'elle ouvrirait
  // est celui de l'artisan (devis, planning, dépenses...), pas quelque chose
  // qu'un client de l'artisan doit voir. En pratique ce script n'est déjà pas
  // chargé sur ces pages-là ; ce garde est une ceinture de sécurité si un jour
  // il l'était par erreur.
  function bsEstPageClient() {
    const k = bsPageKey();
    return k.indexOf('client') === 0 || k === 'demande-devis.html' || k === 'suivi.html';
  }

  const BS_SUGGESTIONS_PAR_PAGE = {
    'devis.html': [
      { label: 'Relancer un devis en attente' },
      { label: 'Planifier un devis signé' },
      { label: 'Devis depuis une photo', photo: true },
    ],
    'dashboard.html': [
      { label: 'Où en est mon prochain chantier ?' },
      { label: 'Qui travaille demain ?' },
      { label: "Photo d'avancement" },
    ],
    'chantier.html': [
      { label: 'Décaler la prochaine étape' },
      { label: 'Prévenir le client' },
      { label: 'Ajouter une étape' },
    ],
    'planning.html': [
      { label: 'Planifier un devis signé' },
      { label: 'Qui est libre vendredi ?' },
      { label: 'Décaler une étape' },
    ],
    'photos.html': [
      { label: 'Envoyer les photos au client' },
      { label: 'Devis depuis cette photo', photo: true },
    ],
    'finances.html': [
      { label: 'Relancer une facture à encaisser' },
      { label: 'Facture de solde' },
      { label: 'Export pour le comptable' },
    ],
    'equipe.html': [
      { label: 'Ajouter un compagnon' },
      { label: 'Charge de la semaine' },
    ],
  };

  // Écrans sans logique métier propre à eux (réglages, profil, coffre-fort,
  // analyses, métré) : même socle de suggestions génériques. `welcome.html`
  // (accueil du tout premier lancement) n'a pas de table dédiée dans la
  // maquette non plus — il rejoint ce même groupe plutôt que de rester nu.
  const BS_SUGGESTIONS_GENERIQUES = [
    { label: 'Importer mes devis' },
    { label: 'Que peux-tu faire pour moi ?' },
  ];
  const BS_PAGES_GENERIQUES = new Set([
    'settings.html', 'profile.html', 'profile-entreprise.html',
    'coffre.html', 'analyses.html', 'metre.html',
  ]);

  function bsSuggestionsPourPage() {
    // Hook page : si la page a posé window.bsSuggestions AVANT ce point (donc
    // avant DOMContentLoaded, puisque c'est là que ce rendu s'exécute), elle
    // remplace entièrement la table statique.
    if (Array.isArray(window.bsSuggestions) && window.bsSuggestions.length) {
      return window.bsSuggestions
        .filter((s) => s && s.label)
        .map((s) => ({ label: String(s.label), question: String(s.question || s.label), action: typeof s.action === 'function' ? s.action : null, photo: !!s.photo }));
    }
    const cle = bsPageKey();
    const table = BS_SUGGESTIONS_PAR_PAGE[cle]
      || (BS_PAGES_GENERIQUES.has(cle) ? BS_SUGGESTIONS_GENERIQUES : null);
    if (!table) return null;
    return table.map((s) => ({ label: s.label, question: s.question || s.label, photo: !!s.photo }));
  }

  // Le conteneur principal de chaque écran — même logique de résolution que
  // js/app-nav.js (findMount), pour que la carte et la nav retombent toujours
  // dans le même parent et gardent un ordre cohérent entre elles.
  function bsTrouverMount() {
    return document.querySelector('.app-shell')
      || document.querySelector('.phone-screen')
      || document.querySelector('main');
  }

  function bsConstruireCarteSuggestions(suggestions) {
    const carte = document.createElement('div');
    carte.className = 'ui-assist';
    carte.id = 'bsAssistSuggestions';
    // Padding-bottom généreux : la carte est le dernier élément avant la nav
    // (sticky) et peut se retrouver dans la même bande verticale que le bouton
    // flottant (fixe, ~74-124px du bas). Sans cette marge, le dernier chip se
    // fait grignoter par le FAB sur les écrans courts.
    carte.style.margin = '12px 16px calc(84px + env(safe-area-inset-bottom, 0px))';

    const entete = document.createElement('div');
    entete.className = 'h';
    entete.textContent = "L'assistant propose";
    // Toucher l'en-tête = ouvrir la conversation (Moctar, 05/09).
    entete.style.cursor = 'pointer';
    entete.setAttribute('role', 'button');
    entete.setAttribute('aria-label', "Ouvrir l'assistant");
    entete.addEventListener('click', () => {
      if (typeof window.bsAssistantOuvrirSaisie === 'function') window.bsAssistantOuvrirSaisie('');
    });
    carte.appendChild(entete);

    const chips = document.createElement('div');
    chips.className = 'ui-chips';
    suggestions.slice(0, 3).forEach((s) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ui-chip';
      chip.textContent = s.label;
      chip.addEventListener('click', () => {
        // Action locale posée par la page (ex. ouvrir un groupe d'équipe) :
        // pas de question au modèle, on exécute et c'est tout.
        if (typeof s.action === 'function') { s.action(); return; }
        if (s.photo) {
          if (typeof window.bsAssistantOuvrirPhoto === 'function') window.bsAssistantOuvrirPhoto('metre');
        } else if (typeof window.bsAssistantEnvoyerQuestion === 'function') {
          window.bsAssistantEnvoyerQuestion(s.question || s.label);
        }
      });
      chips.appendChild(chip);
    });
    carte.appendChild(chips);
    return carte;
  }

  function bsInsererCarte(carte) {
    // La page a déjà sa propre carte « L'assistant propose » (maquette) : on n'en ajoute pas une seconde.
    if (document.querySelector('.mq-assist')) return;
    // Si la page construit sa carte plus tard (rendu asynchrone), la nôtre s'efface.
    try {
      new MutationObserver(function (_, obs) {
        if (document.querySelector('.mq-assist')) {
          const g = document.getElementById('bsAssistSuggestions'); if (g) g.remove(); obs.disconnect();
        }
      }).observe(document.body, { childList: true, subtree: true });
    } catch (_) {}
    const mount = bsTrouverMount();
    if (!mount) return;
    const ancienne = document.getElementById('bsAssistSuggestions');
    if (ancienne) ancienne.remove();
    // La nav (js/app-nav.js) peut déjà exister (chargée avant ce script) ou pas
    // encore (chargée après, elle s'ajoute alors en dernier — donc après la
    // carte, sans rien à faire ici). Dans les deux cas la carte finit juste
    // avant la nav, jamais après.
    const nav = mount.querySelector('nav.bn');
    if (nav) {
      mount.insertBefore(carte, nav);
    } else {
      mount.appendChild(carte);
    }
  }

  function bsAssistantRendreSuggestions() {
    if (bsEstPageClient()) return;
    const suggestions = bsSuggestionsPourPage();
    if (!suggestions || !suggestions.length) return;
    bsInsererCarte(bsConstruireCarteSuggestions(suggestions));
  }

  // Exposé dès l'évaluation du script : une page qui pose window.bsSuggestions
  // APRÈS le premier rendu (ex. suggestions calculées depuis une réponse
  // serveur) doit pouvoir redemander un rendu sans recharger la page.
  window.bsAssistantRafraichirSuggestions = bsAssistantRendreSuggestions;
  // Les mêmes suggestions servent aux puces de la feuille quand elle s'ouvre
  // depuis le bouton du haut (Moctar, 05/09 : « selon l'endroit où il est
  // cliqué, pose la question ou les questions les plus logiques »).
  window.bsAssistantSuggestionsCourantes = function () { try { return bsEstPageClient() ? null : bsSuggestionsPourPage(); } catch (_) { return null; } };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bsAssistantRendreSuggestions);
  } else {
    bsAssistantRendreSuggestions();
  }
})();

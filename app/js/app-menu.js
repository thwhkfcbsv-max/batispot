// BatiSpot Pro — Menu Latéral & Tiroir Unifié
//
// Réplique exacte de la maquette 10 · Menu (ANALYSE_APP_2026-09-03_maquette.html) :
// une liste .mq-menu (classes mq- portées dans css/app.css), l'en-tête garde
// le logo officiel existant. Contenu réel uniquement — aucun prix, aucune
// techno IA, aucun texte en dur pour ce qui dépend de la base (voir
// actualiserDonneesMenu ci-dessous).
(function() {
  'use strict';

  // Injecter styles du drawer (l'enveloppe — overlay, panneau, en-tête — reste
  // inchangée ; le CONTENU de la liste vient des classes mq- de css/app.css).
  const styleId = 'bs-drawer-menu-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .bs-drawer-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 2000;
        display: none;
        opacity: 0;
        transition: opacity 0.22s ease;
      }
      .bs-drawer-overlay.open {
        display: flex;
        opacity: 1;
        justify-content: flex-end;
      }
      .bs-drawer-panel {
        width: 85%;
        max-width: 340px;
        height: 100%;
        background: #FFFFFF;
        box-shadow: -6px 0 25px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        box-sizing: border-box;
      }
      .bs-drawer-overlay.open .bs-drawer-panel {
        transform: translateX(0);
      }
      .bs-drawer-header {
        padding: 16px;
        border-bottom: 1.5px solid #E7EEEA;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .bs-drawer-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
    `;
    document.head.appendChild(style);
  }

  // Injecter structure DOM du Drawer
  function initDrawer() {
    if (document.getElementById('bsDrawerOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'bsDrawerOverlay';
    overlay.className = 'bs-drawer-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) closeAppDrawer(); };

    overlay.innerHTML = `
      <div class="bs-drawer-panel" onclick="event.stopPropagation()">
        <div class="bs-drawer-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <!-- Logo officiel (degrade #228B5B -> #4CAF82, wordmark noir, bulle PRO)
                 — inchange, c'est l'en-tete de la maquette 10. -->
            <svg width="150" height="36" viewBox="0 0 200 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="BatiSpot Pro">
              <defs>
                <linearGradient id="lg-pro-menu" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#228B5B"/>
                  <stop offset="100%" stop-color="#4CAF82"/>
                </linearGradient>
              </defs>
              <rect width="40" height="40" rx="10" y="4" fill="url(#lg-pro-menu)"/>
              <path d="M20 12 L10 20 L10 32 L30 32 L30 20 Z" fill="none" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
              <rect x="17" y="24" width="6" height="8" rx="1" fill="white" opacity="0.95"/>
              <text x="48" y="31" font-family="Inter,system-ui,sans-serif" font-weight="900" font-size="23" fill="#0A1D14" letter-spacing="-0.5">BatiSpot</text>
              <rect x="146" y="14" width="46" height="20" rx="6" fill="#228B5B"/>
              <text x="169" y="28" font-family="Inter,system-ui,sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">PRO</text>
            </svg>
          </div>
          <button type="button" onclick="closeAppDrawer()" style="background:none;border:none;cursor:pointer;color:#5A7268;padding:6px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="bs-drawer-body">
          <!-- Liste, réplique exacte de la maquette 10 (classes mq-menu / css/app.css).
               Parrainage omis : aucune page n'existe pour cette destination. -->
          <div class="mq-menu">
            <!-- (06/09 13h, Moctar) titres seuls, sur UNE ligne : plus de
                 sous-titres à droite (ils faisaient passer « Mon entreprise »
                 sur deux lignes), et « Analyses » retiré du menu — la page
                 reste accessible depuis Finances (sous-onglet). -->
            <a href="./profile-entreprise.html"><i class="bs-ico" data-ico="building"></i>Mon entreprise</a>
            <a href="./equipe.html"><i class="bs-ico" data-ico="users"></i>Mon équipe</a>
            <a href="./coffre.html"><i class="bs-ico" data-ico="lock"></i>Coffre-fort</a>
            <a href="./dashboard.html?guides=1" id="mqGuides"><i class="bs-ico" data-ico="help"></i>Aide et guides</a>
            <a href="#" id="mqDeconnexion" style="color:#DC2626;"><i class="bs-ico" data-ico="logout" style="background:#FEF2F2;color:#DC2626;"></i>Déconnexion</a>
          </div>

          <!-- Alerte décennale : uniquement si une vraie date d'expiration
               existe (document coffre catégorie « decennale », expire_le dans
               les 60 jours). Jamais de texte en dur — voir actualiserAlerteDecennale. -->
          <div class="mq-box" id="mqAlerteDecennale" hidden style="font-size:12.5px;font-weight:700;color:#B45309;"></div>
        </div>
      </div>
    `;
    if (window.bsRemplirIcones) window.bsRemplirIcones();
    document.body.appendChild(overlay);

    // Sur le tableau de bord, la feuille s'ouvre sur place ; ailleurs, le
    // lien mène au tableau de bord qui l'ouvre (?guides=1, app-demarrage.js).
    document.getElementById('mqGuides').addEventListener('click', (e) => {
      if (typeof window.bsDemarrageOuvrir !== 'function') return;
      e.preventDefault();
      closeAppDrawer();
      window.bsDemarrageOuvrir();
    });

    document.getElementById('mqDeconnexion').addEventListener('click', (e) => {
      e.preventDefault();
      import('./supabase.js').then((m) => m.signOut()).catch(() => {
        try { localStorage.clear(); } catch (err) { /* rien de plus a faire */ }
        location.href = './index.html';
      });
    });
  }

  // ── Données réelles de la liste ──────────────────────────────────────────
  // Depuis le 06/09 (titres seuls), la seule donnée vivante du tiroir est
  // l'alerte décennale, recalculée à chaque ouverture.

  // Alerte décennale : SEULE catégorie ciblée (pas RC Pro/URSSAF/fiscale ici,
  // c'est spécifiquement l'alerte décennale de la maquette). Fenêtre de 60
  // jours, identique à coffre.html (coffreDocsExpirants).
  async function actualiserAlerteDecennale() {
    const box = document.getElementById('mqAlerteDecennale');
    if (!box) return;
    try {
      const { coffreDocsExpirants } = await import('./supabase.js');
      const proches = await coffreDocsExpirants(60);
      const decennale = (proches || []).find((d) => d.categorie === 'decennale' && d.expire_le);
      if (!decennale) { box.hidden = true; box.replaceChildren(); return; }
      const jours = Math.ceil((new Date(decennale.expire_le) - new Date()) / 86400000);
      box.replaceChildren();
      const texte = document.createElement('span');
      texte.textContent = jours > 0
        ? `⚠ Décennale : expire dans ${jours} jour${jours > 1 ? 's' : ''}. `
        : '⚠ Décennale : attestation expirée. ';
      const lien = document.createElement('a');
      lien.href = './coffre.html';
      lien.style.color = '#228B5B';
      lien.style.fontWeight = '800';
      lien.textContent = 'Mettre à jour ›';
      box.append(texte, lien);
      box.hidden = false;
    } catch (e) {
      box.hidden = true;
    }
  }

  function actualiserDonneesMenu() {
    actualiserAlerteDecennale();
  }

  window.openAppDrawer = function() {
    initDrawer();
    const ov = document.getElementById('bsDrawerOverlay');
    if (ov) ov.classList.add('open');
    actualiserDonneesMenu();
  };

  window.closeAppDrawer = function() {
    const ov = document.getElementById('bsDrawerOverlay');
    if (ov) ov.classList.remove('open');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDrawer);
  } else {
    initDrawer();
  }
})();

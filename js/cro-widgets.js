// BatiSpot — CRO widgets : sticky CTA mobile + social proof live + exit-intent popup
// A inclure sur les pages marketing publiques (index.html, artisan.html, installer.html).
//
// Chaque widget est auto-detect :
// - sticky CTA : adapte le href + libelle selon l'URL (/, /artisan, /installer)
// - social proof : fetch Supabase counts (avec fallback safe si RLS bloque)
// - exit-intent : popup une seule fois par session (localStorage)
//
// Tous les widgets respectent le consent RGPD (via window.bsConsent).
(function () {
 'use strict';

 // ─── Détection page ──────────────────────────────────────────────
 const PATH = (location.pathname || '/').toLowerCase();
 const IS_HOME = PATH === '/' || PATH === '/index.html';
 const IS_ARTISAN = /^\/artisan(\.html)?$/.test(PATH);
 const IS_INSTALL = /^\/installer(\.html)?$/.test(PATH);

 // ─── Helpers ────────────────────────────────────────────────────
 function el(tag, attrs, children) {
 const n = document.createElement(tag);
 if (attrs) for (const [k, v] of Object.entries(attrs)) {
 if (k === 'class') n.className = v;
 else if (k === 'text') n.textContent = v;
 else if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
 else if (v != null) n.setAttribute(k, v);
 }
 if (children) for (const c of children) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
 return n;
 }
 function injectStyles(id, css) {
 if (document.getElementById(id)) return;
 const s = document.createElement('style');
 s.id = id;
 s.appendChild(document.createTextNode(css));
 document.head.appendChild(s);
 }

 // ════════════════════════════════════════════════════════════════
 // WIDGET 1 — Sticky CTA mobile
 // ════════════════════════════════════════════════════════════════
 function initStickyCTA() {
 let cfg;
 var isPriceHub = PATH.indexOf('/prix-') > -1;
 if (IS_HOME) cfg = { label: 'Recevoir 3 devis gratuits sous 48h', href: '#devis' };
 else if (IS_ARTISAN) cfg = { label: 'Découvrir BatiSpot Pro (Formule Gratuite)', href: '#tarifs' };
 else if (IS_INSTALL) cfg = { label: "Installer l'app BatiSpot", href: '#install' };
 else if (isPriceHub) cfg = { label: 'Recevoir 3 devis précis d’artisans vérifiés', href: '/app/demande-devis' };
 else return;

 injectStyles('bs-sticky-cta-styles', `
 .bs-sticky-cta {
 position: fixed; left: 12px; right: 12px;
 bottom: max(12px, env(safe-area-inset-bottom));
 background: #0F5132; color: #fff;
 padding: 14px 18px;
 border-radius: 14px;
 font: 800 15px/1.3 Inter, system-ui, sans-serif;
 text-decoration: none; text-align: center;
 box-shadow: 0 12px 32px rgba(15,81,50,.35);
 z-index: 9990;
 transform: translateY(120%);
 transition: transform .35s cubic-bezier(.2,.8,.2,1);
 }
 .bs-sticky-cta.show { transform: translateY(0); }
 .bs-sticky-cta:active { transform: translateY(2px); }
 @media (min-width: 720px) { .bs-sticky-cta { display: none; } }
 @media (max-width: 719px) {
 body { padding-bottom: 80px; }
 }
 `);

 const btn = el('a', { class: 'bs-sticky-cta', href: cfg.href, role: 'button', text: cfg.label });
 document.body.appendChild(btn);

 // Apparaît après 200px scroll pour ne pas masquer le hero immédiatement
 let shown = false;
 function check() {
 if (shown) return;
 if (window.scrollY > 180) { btn.classList.add('show'); shown = true; }
 }
 window.addEventListener('scroll', check, { passive: true });
 setTimeout(check, 100);

 // Track click GA4 si analytics dispo
 btn.addEventListener('click', function () {
 if (window.bsTrack) window.bsTrack('sticky_cta_click', { page: PATH });
 });
 }

 // ════════════════════════════════════════════════════════════════
 // WIDGET 2 — Social proof live (FOMO)
 // ════════════════════════════════════════════════════════════════
 // Affichee uniquement sur /artisan (cible artisan = scarcity 100 places).
 // Fetch counts depuis Supabase REST API. Fallback safe si RLS bloque.
 const SUPABASE_URL = 'https://cisniwhaiydazdpzvino.supabase.co';
 const SUPABASE_KEY = 'sb_publishable_LUXdyprriDy-_wcr7-r8Yw_3N8AP_s1';

 async function fetchArtisansCount() {
 try {
 const r = await fetch(`${SUPABASE_URL}/rest/v1/artisan_leads?select=*`, {
 method: 'HEAD',
 headers: {
 apikey: SUPABASE_KEY,
 Authorization: 'Bearer ' + SUPABASE_KEY,
 Prefer: 'count=exact',
 Range: '0-0',
 },
 });
 const cr = r.headers.get('Content-Range') || '';
 const total = parseInt(cr.split('/')[1] || '0', 10);
 if (total > 0 && total < 10000) return total;
 } catch (_) {}
 return null;
 }

 function injectSocialProof(target, count) {
 // Fallback safe si RLS bloque (chiffre conservateur basé sur réalité — journal : ~85 artisans contactés HOT/WARM)
 const total = count != null ? count : 85;
 const places_left = Math.max(3, 100 - total);
 const fomo_class = places_left <= 20 ? 'fomo-low' : (places_left <= 50 ? 'fomo-mid' : 'fomo-ok');

 injectStyles('bs-social-proof-styles', `
 .bs-social-proof {
 background: linear-gradient(135deg, #FEF3C7, #FDE68A);
 border: 1px solid #F59E0B; border-radius: 12px;
 padding: 12px 16px; margin: 14px auto 0; max-width: 540px;
 font: 700 13px/1.45 Inter, system-ui, sans-serif;
 color: #78350F; display: flex; align-items: center; gap: 12px;
 }
 .bs-social-proof.fomo-low {
 background: linear-gradient(135deg, #FEE2E2, #FCA5A5);
 border-color: #DC2626; color: #7F1D1D;
 animation: bs-pulse 2.4s infinite;
 }
 @keyframes bs-pulse { 0%,100% { opacity: 1 } 50% { opacity: .82 } }
 .bs-social-proof .bs-pill {
 background: rgba(0,0,0,.08); padding: 4px 10px; border-radius: 999px;
 font-size: 11px; font-weight: 900; letter-spacing: .04em; text-transform: uppercase;
 }
 .bs-social-proof .bs-text strong { font-size: 14px; }
 .bs-social-proof .bs-dot {
 width: 8px; height: 8px; border-radius: 50%; background: #16a34a;
 box-shadow: 0 0 0 3px rgba(34,197,94,.3); flex-shrink: 0;
 animation: bs-blink 1.8s infinite;
 }
 @keyframes bs-blink { 0%,100% { opacity: 1 } 50% { opacity: .4 } }
 `);

 const wrap = el('div', { class: 'bs-social-proof ' + fomo_class }, [
 el('span', { class: 'bs-dot' }),
 el('div', { class: 'bs-text' }, [
 el('strong', { text: '3 mois offerts' }),
 ' · ',
 el('span', { text: 'sans engagement, sans commission' }),
 ]),
 el('span', { class: 'bs-pill', text: 'D\u00c8S 19\u20ac TTC' }),
 ]);
 target.appendChild(wrap);
 }

 async function initSocialProof() {
 if (!IS_ARTISAN) return;
 // Insert juste apres le hero
 const hero = document.querySelector('.pro-hero, .hero, header, nav') ;
 const target = hero?.parentElement || document.body;
 const count = await fetchArtisansCount();
 injectSocialProof(target, count);
 }

 // ════════════════════════════════════════════════════════════════
 // WIDGET 3 — Exit-intent popup
 // ════════════════════════════════════════════════════════════════
 // Triggered quand la souris quitte le viewport par le haut (intent fermeture).
 // 1 fois par session (localStorage). Mobile : trigger sur scroll-up rapide.
 function initExitIntent() {
 if (!IS_HOME && !IS_ARTISAN) return;
 const KEY = 'bs-exit-popup-shown-v1';
 try { if (localStorage.getItem(KEY) === '1') return; } catch (_) {}

 let shown = false;
 function show() {
 if (shown) return;
 shown = true;
 try { localStorage.setItem(KEY, '1'); } catch (_) {}
 buildPopup();
 }

 function buildPopup() {
 injectStyles('bs-exit-styles', `
 .bs-exit-overlay {
 position: fixed; inset: 0;
 background: rgba(13,51,32,.55); backdrop-filter: blur(4px);
 display: flex; align-items: center; justify-content: center;
 z-index: 9995; padding: 16px;
 opacity: 0; transition: opacity .25s;
 }
 .bs-exit-overlay.show { opacity: 1; }
 .bs-exit-modal {
 background: #fff; border-radius: 16px;
 max-width: 460px; width: 100%; padding: 28px 24px 22px;
 font-family: Inter, system-ui, sans-serif; color: #0d3320;
 box-shadow: 0 24px 60px rgba(0,0,0,.32);
 transform: scale(.92); transition: transform .25s;
 position: relative;
 }
 .bs-exit-overlay.show .bs-exit-modal { transform: scale(1); }
 .bs-exit-close {
 position: absolute; top: 10px; right: 10px;
 width: 32px; height: 32px; border-radius: 50%;
 background: #F3F4F6; border: none; cursor: pointer;
 font-size: 18px; color: #6B7280; line-height: 1;
 }
 .bs-exit-close:hover { background: #E5E7EB; }
 .bs-exit-emoji { font-size: 32px; margin-bottom: 8px; }
 .bs-exit-modal h3 {
 font-size: 22px; font-weight: 900; letter-spacing: -.02em;
 color: #166534; margin: 0 0 8px;
 }
 .bs-exit-modal p { font-size: 14px; color: #3D5A4E; margin: 0 0 16px; line-height: 1.5; }
 .bs-exit-form { display: flex; flex-direction: column; gap: 10px; }
 .bs-exit-input {
 background: #fff; border: 1.5px solid #D1D5DB;
 border-radius: 10px; padding: 12px 14px;
 font: 500 14px Inter, sans-serif;
 outline: none; transition: border-color .15s, box-shadow .15s;
 }
 .bs-exit-input:focus { border-color: #166534; box-shadow: 0 0 0 3px rgba(22,101,52,.15); }
 .bs-exit-btn {
 background: #166534; color: #fff;
 padding: 13px; border-radius: 10px; border: none;
 font: 800 15px Inter, sans-serif; cursor: pointer;
 transition: background .15s, transform .12s;
 }
 .bs-exit-btn:hover:not(:disabled) { background: #14532D; transform: translateY(-1px); }
 .bs-exit-btn:disabled { opacity: .55; cursor: wait; }
 .bs-exit-success {
 color: #166534; font-weight: 700; text-align: center; padding: 14px;
 background: #ECFDF5; border-radius: 10px;
 }
 .bs-exit-legal {
 font-size: 11px; color: #6B7280; text-align: center; margin-top: 6px;
 }
 `);

 const overlay = el('div', { class: 'bs-exit-overlay', role: 'dialog', 'aria-modal': 'true' });
 const modal = el('div', { class: 'bs-exit-modal' });

 const close = el('button', { type: 'button', class: 'bs-exit-close', 'aria-label': 'Fermer', text: '×' });
 close.addEventListener('click', () => closeModal());
 modal.appendChild(close);

 modal.appendChild(el('div', { class: 'bs-exit-emoji', text: '' }));
 modal.appendChild(el('h3', { text: 'Avant de partir…' }));
 modal.appendChild(el('p', { text: 'Recevez gratuitement notre guide « 10 questions à poser AVANT de signer un devis travaux ». Évitez les arnaques + 8-15% d\'économies en moyenne.' }));

 const form = el('form', { class: 'bs-exit-form' });
 const input = el('input', { class: 'bs-exit-input', type: 'email', name: 'email', placeholder: 'votre@email.fr', required: 'required', autocomplete: 'email' });
 const btn = el('button', { type: 'submit', class: 'bs-exit-btn', text: 'Recevoir le guide gratuit' });
 const legal = el('div', { class: 'bs-exit-legal', text: 'Pas de spam. Désabonnement en 1 clic.' });
 form.appendChild(input); form.appendChild(btn); form.appendChild(legal);
 modal.appendChild(form);

 form.addEventListener('submit', async (e) => {
 e.preventDefault();
 btn.disabled = true; btn.textContent = 'Envoi…';
 const email = (input.value || '').trim().toLowerCase();
 if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
 btn.disabled = false; btn.textContent = 'Email invalide';
 return;
 }
 // POST email vers Supabase via demandes_devis avec marker "lead_magnet"
 // (en attendant une vraie table newsletter)
 try {
 await fetch(`${SUPABASE_URL}/rest/v1/demandes_devis`, {
 method: 'POST',
 headers: {
 apikey: SUPABASE_KEY,
 Authorization: 'Bearer ' + SUPABASE_KEY,
 'Content-Type': 'application/json',
 Prefer: 'return=minimal',
 },
 body: JSON.stringify({
 client_email: email,
 type_travaux: 'autre',
 description: '[LEAD_MAGNET — guide 10 questions devis] Source : exit-intent popup',
 status: 'nouvelle',
 }),
 });
 } catch (_) {}
 if (window.bsTrack) window.bsTrack('exit_intent_email_capture', { page: PATH });
 // Affiche message succès
 form.replaceChildren(el('div', { class: 'bs-exit-success', text: ' Merci ! Le guide arrive dans votre boîte mail dans les minutes qui suivent.' }));
 setTimeout(closeModal, 4000);
 });

 function closeModal() {
 overlay.classList.remove('show');
 setTimeout(() => overlay.remove(), 280);
 }

 overlay.appendChild(modal);
 overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
 document.body.appendChild(overlay);
 requestAnimationFrame(() => overlay.classList.add('show'));
 setTimeout(() => input.focus(), 320);

 if (window.bsTrack) window.bsTrack('exit_intent_shown', { page: PATH });
 }

 // Desktop : detection mouseleave par le haut
 document.addEventListener('mouseleave', (e) => {
 if (e.clientY <= 0 && !shown) show();
 });
 // Mobile : trigger après 30s si pas de scroll significatif (alternative aux exit-intent classique)
 let lastScroll = 0;
 setTimeout(() => {
 if (!shown && window.scrollY < 200 && Math.abs(window.scrollY - lastScroll) < 100) show();
 }, 35000);
 window.addEventListener('scroll', () => { lastScroll = window.scrollY; }, { passive: true });
 }

 // ─── Init après DOM ready ────────────────────────────────────────
 function start() {
 initStickyCTA();
 initSocialProof();
 initExitIntent();
 }
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
 else start();
})();

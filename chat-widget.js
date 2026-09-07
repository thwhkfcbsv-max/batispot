// chat-widget.js — Assistant BatiSpot (LLM Gemini) flottant pour les pages de contenu.
// v6 · 20/08/2026 · remplace le no-op "Sophie retirée". Même contrat que l'assistant d'accueil
// (index.html) : edge function gemini-assistant + capture lead notify-admin + demandes_devis.
// Chargé en lazy (1er scroll/clic ou 5 s) par le loader inline des pages — zéro impact perf initial.
(function () {
  "use strict";
  // Gardes : ne pas doubler l'assistant inline de la home, ni s'injecter deux fois.
  if (window.__bsChatWidget) return;
  if (document.getElementById("pchat")) return;      // home = assistant inline déjà présent
  if (document.getElementById("bs-chat-btn")) return;
  window.__bsChatWidget = true;

  var SB = "https://cisniwhaiydazdpzvino.supabase.co";
  var K  = "sb_publishable_LUXdyprriDy-_wcr7-r8Yw_3N8AP_s1"; // clé PUBLISHABLE (publique par design)
  var FN = SB + "/functions/v1/gemini-assistant";

  // ── Tracking GA4 (via bsTrack ; consent.js bloque tant que "Accepter" pas cliqué) ─
  function track(name, params) {
    try {
      if (window.bsTrack) window.bsTrack(name, params || {});
      else if (window.gtag) window.gtag("event", name, params || {});
    } catch (e) {}
  }
  function tp(extra) {
    return Object.assign({ location: "widget", page_path: (location.pathname || "").slice(0, 80) }, extra || {});
  }

  // ── Styles autonomes (aucune dépendance CSS externe) ─────────────────────────
  var css = ""
    + "#bs-chat-btn{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:60px;height:60px;border:0;border-radius:50%;"
    + "background:#0F5132;color:#fff;cursor:pointer;box-shadow:0 8px 24px rgba(15,81,50,.35);display:flex;align-items:center;"
    + "justify-content:center;transition:transform .15s ease}"
    + "#bs-chat-btn:hover{transform:scale(1.06)}"
    + "#bs-chat-btn svg{width:28px;height:28px}"
    + "#bs-chat-btn .bs-dot{position:absolute;top:2px;right:2px;width:12px;height:12px;border-radius:50%;background:#22C55E;border:2px solid #fff}"
    + "#bs-chat-bubble{position:fixed;right:20px;bottom:92px;z-index:2147483000;width:370px;max-width:calc(100vw - 32px);height:520px;"
    + "max-height:calc(100vh - 120px);background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.22);display:none;"
    + "flex-direction:column;overflow:hidden;font-family:inherit}"
    + "#bs-chat-bubble.open{display:flex}"
    + ".bs-chat-head{background:#0F5132;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}"
    + ".bs-chat-head .t{font-weight:800;font-size:15px;line-height:1.2}"
    + ".bs-chat-head .s{font-size:11px;opacity:.85;font-weight:600}"
    + ".bs-chat-head .bs-close{margin-left:auto;background:transparent;border:0;color:#fff;font-size:22px;cursor:pointer;line-height:1;padding:0 4px}"
    + ".bs-chat-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#F6FAF8}"
    + ".bs-msg{max-width:82%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}"
    + ".bs-msg.bot{align-self:flex-start;background:#fff;border:1px solid #E4EDE8;color:#14261E;border-bottom-left-radius:4px}"
    + ".bs-msg.me{align-self:flex-end;background:#0F5132;color:#fff;border-bottom-right-radius:4px}"
    + ".bs-chat-form{display:flex;gap:8px;padding:12px;border-top:1px solid #EEF3F1;background:#fff}"
    + ".bs-chat-form input.bs-in{flex:1;border:1px solid #E4EDE8;border-radius:10px;padding:11px 13px;font-family:inherit;font-size:14px}"
    + ".bs-chat-form input.bs-in:focus{outline:none;border-color:#0D9488}"
    + ".bs-chat-form button{width:46px;flex:none;border:0;border-radius:10px;background:#0F5132;color:#fff;font-size:1.15rem;font-weight:800;cursor:pointer}"
    + ".bs-chat-note{font-size:11px;color:#6b7d74;text-align:center;padding:0 12px 10px;background:#fff}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // ── DOM ──────────────────────────────────────────────────────────────────────
  var btn = document.createElement("button");
  btn.id = "bs-chat-btn"; btn.type = "button"; btn.setAttribute("aria-label", "Ouvrir l'assistant BatiSpot");
  btn.innerHTML = '<span class="bs-dot"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
    + 'stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>';

  var panel = document.createElement("div");
  panel.id = "bs-chat-bubble";
  panel.innerHTML = ''
    + '<div class="bs-chat-head"><div><div class="t">Assistant BatiSpot</div><div class="s">Devis gratuit · Artisans vérifiés</div></div>'
    + '<button class="bs-close" type="button" aria-label="Fermer">&times;</button></div>'
    + '<div class="bs-chat-log" id="bs-chat-log"></div>'
    + '<form class="bs-chat-form" id="bs-chat-form" autocomplete="on">'
    + '<input type="text" id="bs-chat-hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0">'
    + '<input class="bs-in" id="bs-chat-in" autocomplete="off" placeholder="Votre réponse…" aria-label="Votre réponse" required>'
    + '<button type="submit" aria-label="Envoyer">&rarr;</button></form>'
    + '<p class="bs-chat-note">Données sécurisées · Aucun engagement · Gratuit</p>';

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  var log = panel.querySelector("#bs-chat-log");
  var form = panel.querySelector("#bs-chat-form");
  var input = panel.querySelector("#bs-chat-in");
  var hp = panel.querySelector("#bs-chat-hp");

  // ── État conversation (identique à l'assistant d'accueil) ────────────────────
  var okEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
  var reEmail = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/, reTel = /(?:\+33|0033|0)\s?[1-9](?:[\s.\-]?[0-9]{2}){4}/;
  var history = [], userMsgs = [], d = { travaux: "", cp: "", prenom: "", tel: "", email: "" };
  var sending = false, captured = false, greeted = false;
  // Message d'indisponibilite : jamais reinjecte dans l'historique du modele.
  var UNAVAILABLE = "L'assistant est momentanement indisponible, je ne peux pas repondre a votre question. Ecrivez-nous a contact@batispot.pro ou laissez-nous votre demande sur batispot.pro/demande-devis : nous vous repondons directement.";
  var GREET = "Bonjour, je suis l'assistant BatiSpot. Dites-moi ce que vous souhaitez réaliser : je vous oriente et je vous mets en relation avec des artisans vérifiés près de chez vous.";
  var offScopeRegex = /(?:dauphin|baleine|poisson|océan|ocean|hameçon|hamecon|recette|cuisine|blague|joke|politique|jeu de rôle|roleplay|chante|poème|poeme|qui a gagné|météo du monde)/i;

  function add(c, t) {
    var el = document.createElement("div");
    el.className = "bs-msg " + c; el.textContent = t;
    log.appendChild(el); log.scrollTop = log.scrollHeight; return el;
  }
  function extract(txt) {
    userMsgs.push(txt);
    var m = txt.match(reEmail); if (m && okEmail(m[0])) d.email = m[0].trim().toLowerCase();
    var p = txt.match(reTel); if (p) d.tel = p[0];
    var cp = txt.match(/\b\d{5}\b/); if (cp) d.cp = cp[0];
    if (!d.travaux) d.travaux = txt.slice(0, 300);
  }
  function capture() {
    if (captured) return; captured = true;
    var attr = (window.bsAttr ? window.bsAttr() : {});
    var desc = userMsgs.join(" | ").slice(0, 900);
    var page = (location.pathname || "").slice(0, 60);
    track("assistant_lead_captured", tp({ lead_source: "assistant_contenu" }));
    try {
      fetch(SB + "/functions/v1/notify-admin", {
        method: "POST",
        headers: { "apikey": K, "authorization": "Bearer " + K, "content-type": "application/json" },
        body: JSON.stringify({
          subject: "Nouveau lead CONTENU (assistant) — " + (d.travaux || "travaux").slice(0, 50) + " — " + (d.cp || "") + " [" + page + "]",
          data: Object.assign({ prenom: d.prenom || "", nom: "", telephone: d.tel || "", email: d.email || "",
            type_travaux: (d.travaux || "").slice(0, 120), code_postal: d.cp || "", description: desc,
            source: "assistant contenu", page: page }, attr),
          reply_to: d.email || undefined
        })
      });
    } catch (e) {}
    fetch(SB + "/rest/v1/demandes_devis", {
      method: "POST",
      headers: { "apikey": K, "authorization": "Bearer " + K, "content-type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify(Object.assign({}, attr, {
        client_id: null, adresse: "Non précisée",
        client_name: ((d.prenom || "").trim() || ((d.email || "").split("@")[0]) || "Client"),
        client_email: (d.email || "").trim().toLowerCase() || null,
        client_phone: (d.tel || "").trim() || null,
        code_postal: (d.cp || "").trim() || null,
        type_travaux: (d.travaux || "").slice(0, 120) || null,
        description: desc || null, budget_estime: null
      }))
    }).then(function (r) { if (r.ok && window.fbq) window.fbq("track", "Lead"); else captured = false; })
      .catch(function () { captured = false; });
  }
  function converse() {
    var lastUserMsg = history.length ? history[history.length - 1].content : "";
    if (offScopeRegex.test(lastUserMsg)) {
      var ref = "Je suis l'Assistant BatiSpot dédié exclusivement à vos projets de travaux et de rénovation de l'habitat. Je ne peux pas répondre sur ce sujet, mais si vous avez un projet de travaux à réaliser, dites-moi tout et je vous trouve les meilleurs artisans vérifiés !";
      setTimeout(function () { add("bot", ref); history.push({ role: "model", content: ref }); input.focus(); }, 350);
      return;
    }
    var typing = add("bot", "…"); sending = true;
    // Panne assistant : on affiche un echec honnete et on ne pousse JAMAIS
    // ce texte dans `history` (sinon le modele croit l'avoir dit au tour suivant).
    function fail() {
      typing.textContent = UNAVAILABLE;
      log.scrollTop = log.scrollHeight;
      sending = false; input.focus();
      // La capture du lead, elle, est une operation reelle : on la garde.
      if (d.email && d.tel) capture();
    }
    fetch(FN, { method: "POST", headers: { "content-type": "application/json", "apikey": K, "authorization": "Bearer " + K },
      body: JSON.stringify({ mode: "site-bot-client", messages: history }) })
      .then(function (r) {
        if (!r.ok) return null;                       // 429/500/502 -> pas de reponse modele
        return r.json().catch(function () { return null; });
      })
      .then(function (j) {
        var t = j && (j.text || (j.data && j.data.text));
        if (typeof t !== "string" || !t.trim()) { fail(); return; }   // corps sans `text` = panne
        t = t.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
        if (!t) { fail(); return; }
        typing.textContent = t; log.scrollTop = log.scrollHeight;
        history.push({ role: "model", content: t }); sending = false; input.focus();
        if (d.email && d.tel) capture();
      })
      .catch(fail);
  }

  function openPanel() {
    panel.classList.add("open");
    if (!greeted) { greeted = true; add("bot", GREET); history.push({ role: "model", content: GREET }); track("assistant_opened", tp()); }
    setTimeout(function () { input.focus(); }, 50);
  }
  function closePanel() { panel.classList.remove("open"); }

  btn.addEventListener("click", function () { panel.classList.contains("open") ? closePanel() : openPanel(); });
  panel.querySelector(".bs-close").addEventListener("click", closePanel);
  form.addEventListener("submit", function (e) {
    e.preventDefault(); if (sending) return;
    var val = input.value.trim(); if (!val) return; if (hp && hp.value) return;
    add("me", val); extract(val); track("assistant_message_sent", tp({ message_index: userMsgs.length }));
    history.push({ role: "user", content: val }); input.value = ""; converse();
  });
})();

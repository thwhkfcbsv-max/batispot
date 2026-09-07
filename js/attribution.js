/* BatiSpot — Système d'Attribution & Tracking Universel 2026 (SEO, LLMs, Social, Ads, Direct)
   Stocke au premier hit et enrichit au fil de la navigation :
   - Détection automatique de la source (Google, ChatGPT, Perplexity, TikTok, Insta, Facebook, Direct...)
   - Capture intégrale des UTMs (source, medium, campaign, content, term) et click IDs (gclid, fbclid, ttclid)
   - Persistance multi-pages dans localStorage ('bs_attr_v1')
   - Exposé globalement via window.bsAttr() pour tous les formulaires, leads et analytics.
*/
(function () {
  'use strict';
  var KEY = 'bs_attr_v1';

  function parseParams() {
    try {
      var p = new URLSearchParams(location.search);
      return {
        utm_source: p.get('utm_source'),
        utm_medium: p.get('utm_medium'),
        utm_campaign: p.get('utm_campaign'),
        utm_content: p.get('utm_content'),
        utm_term: p.get('utm_term'),
        gclid: p.get('gclid'),
        fbclid: p.get('fbclid'),
        ttclid: p.get('ttclid')
      };
    } catch (_) {
      return {};
    }
  }

  function detectChannel(referrer, params) {
    var ref = (referrer || '').toLowerCase();
    
    // 0. Trafic Interne (Équipe / Admin / Dev)
    if (localStorage.getItem('bs_internal') === '1' || location.pathname.indexOf('/admin') > -1 || location.pathname.indexOf('/crm') > -1 || location.pathname.indexOf('/dashboard') > -1) {
      return { channel: 'Trafic Interne (Équipe)', source: 'team_internal', medium: 'admin' };
    }

    // 1. Paid Ads via click IDs ou UTM paid
    if (params.gclid || params.utm_medium === 'cpc' || params.utm_medium === 'ad' || params.utm_medium === 'ads') {
      return { channel: 'Google Ads', source: 'google_ads', medium: 'cpc' };
    }
    if (params.fbclid || params.ttclid || params.utm_medium === 'paid_social') {
      return { channel: 'Paid Social', source: params.utm_source || 'social_ads', medium: 'paid' };
    }

    // 2. UTM explicites
    if (params.utm_source) {
      return {
        channel: 'Campagne Trackée',
        source: params.utm_source,
        medium: params.utm_medium || 'custom'
      };
    }

    // 3. IA & LLMs (GEO)
    if (ref.indexOf('chatgpt.com') > -1 || ref.indexOf('openai.com') > -1) {
      return { channel: 'IA Search', source: 'chatgpt', medium: 'llm' };
    }
    if (ref.indexOf('perplexity.ai') > -1) {
      return { channel: 'IA Search', source: 'perplexity', medium: 'llm' };
    }
    if (ref.indexOf('claude.ai') > -1 || ref.indexOf('anthropic.com') > -1) {
      return { channel: 'IA Search', source: 'claude', medium: 'llm' };
    }
    if (ref.indexOf('gemini.google.com') > -1) {
      return { channel: 'IA Search', source: 'gemini', medium: 'llm' };
    }
    if (ref.indexOf('copilot.microsoft.com') > -1) {
      return { channel: 'IA Search', source: 'copilot', medium: 'llm' };
    }

    // 4. Réseaux Sociaux Organiques
    if (ref.indexOf('tiktok.com') > -1) {
      return { channel: 'Social Organique', source: 'tiktok', medium: 'social' };
    }
    if (ref.indexOf('instagram.com') > -1) {
      return { channel: 'Social Organique', source: 'instagram', medium: 'social' };
    }
    if (ref.indexOf('facebook.com') > -1 || ref.indexOf('fb.com') > -1) {
      return { channel: 'Social Organique', source: 'facebook', medium: 'social' };
    }
    if (ref.indexOf('linkedin.com') > -1) {
      return { channel: 'Social Organique', source: 'linkedin', medium: 'social' };
    }
    if (ref.indexOf('youtube.com') > -1 || ref.indexOf('youtu.be') > -1) {
      return { channel: 'Social Organique', source: 'youtube', medium: 'social' };
    }
    if (ref.indexOf('twitter.com') > -1 || ref.indexOf('t.co') > -1 || ref.indexOf('x.com') > -1) {
      return { channel: 'Social Organique', source: 'twitter_x', medium: 'social' };
    }
    if (ref.indexOf('whatsapp.com') > -1) {
      return { channel: 'Social Organique', source: 'whatsapp', medium: 'social' };
    }

    // 5. Moteurs de Recherche (SEO Organique)
    if (ref.indexOf('google.') > -1 || ref.indexOf('android-app://com.google') > -1) {
      return { channel: 'SEO Organique', source: 'google', medium: 'organic' };
    }
    if (ref.indexOf('bing.com') > -1) {
      return { channel: 'SEO Organique', source: 'bing', medium: 'organic' };
    }
    if (ref.indexOf('yahoo.') > -1) {
      return { channel: 'SEO Organique', source: 'yahoo', medium: 'organic' };
    }
    if (ref.indexOf('duckduckgo.com') > -1) {
      return { channel: 'SEO Organique', source: 'duckduckgo', medium: 'organic' };
    }
    if (ref.indexOf('qwant.com') > -1 || ref.indexOf('ecosia.org') > -1) {
      return { channel: 'SEO Organique', source: 'moteur_alternatif', medium: 'organic' };
    }

    // 6. Referral tiers
    if (ref && ref.indexOf('batispot.pro') === -1 && ref.indexOf('localhost') === -1) {
      try {
        var refHost = new URL(ref).hostname;
        return { channel: 'Sites Référents', source: refHost, medium: 'referral' };
      } catch (_) {
        return { channel: 'Sites Référents', source: 'external_site', medium: 'referral' };
      }
    }

    // 7. Direct
    return { channel: 'Trafic Direct', source: 'direct', medium: 'none' };
  }

  var params = parseParams();
  var rawReferrer = document.referrer || null;
  var stored = null;

  try {
    stored = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch (_) {}

  var autoDetect = detectChannel(rawReferrer, params);

  if (!stored) {
    // First touch recording
    stored = {
      channel: autoDetect.channel,
      source: params.utm_source || autoDetect.source,
      medium: params.utm_medium || autoDetect.medium,
      campaign: params.utm_campaign || null,
      content: params.utm_content || null,
      term: params.utm_term || null,
      gclid: params.gclid || null,
      fbclid: params.fbclid || null,
      ttclid: params.ttclid || null,
      referrer: rawReferrer,
      landing_page: (location.pathname + location.search).slice(0, 300) || '/',
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      visits_count: 1
    };
    try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch (_) {}
  } else {
    // Update last touch if new UTM / ad parameter arrives
    stored.last_seen = new Date().toISOString();
    stored.visits_count = (stored.visits_count || 1) + 1;

    if (params.utm_source || params.gclid || params.fbclid || (rawReferrer && autoDetect.channel !== 'Trafic Direct' && rawReferrer.indexOf('batispot.pro') === -1)) {
      stored.last_channel = autoDetect.channel;
      stored.last_source = params.utm_source || autoDetect.source;
      stored.last_medium = params.utm_medium || autoDetect.medium;
      stored.last_campaign = params.utm_campaign || null;
    }
    try { localStorage.setItem(KEY, JSON.stringify(stored)); } catch (_) {}
  }

  // Exposition universelle pour Supabase, formulaires et analytics
  window.bsAttr = function () {
    var geo = (window.bsGetGeo ? window.bsGetGeo() : {});
    return {
      channel: stored.channel || 'Trafic Direct',
      utm_source: stored.source || 'direct',
      utm_medium: stored.medium || 'none',
      utm_campaign: stored.campaign || null,
      utm_content: stored.content || null,
      utm_term: stored.term || null,
      gclid: stored.gclid || null,
      fbclid: stored.fbclid || null,
      referrer: stored.referrer || null,
      landing_page: stored.landing_page || null,
      first_seen: stored.first_seen || null,
      visits_count: stored.visits_count || 1,
      client_ip: geo.ip || null,
      geo_city: geo.city || null,
      geo_postal: geo.postal || null,
      geo_region: geo.region || null,
      geo_country: geo.country || null,
      geo_org: geo.org || null,
      is_idf: geo.is_idf || false
    };
  };

})();

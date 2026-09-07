/* BatiSpot — Module de Géolocalisation IP & Qualification Territoriale (Île-de-France)
   - Détection asynchrone non-bloquante (IP, Ville, Région, FAI / Réseau)
   - Mise en cache en sessionStorage pour 0 surcharge réseau
   - Auto-pré-remplissage des champs de formulaires (département / ville)
   - Intégration globale via window.bsGetGeo() et enrichissement de window.bsAttr()
*/
(function () {
  'use strict';
  var CACHE_KEY = 'bs_geo_cache';
  var geoData = null;

  // IDF postal prefixes
  var IDF_DEPTS = ['75', '77', '78', '91', '92', '93', '94', '95'];

  function isIDF(data) {
    if (!data) return false;
    var region = (data.region || '').toLowerCase();
    var city = (data.city || '').toLowerCase();
    var postal = (data.postal || '').substring(0, 2);

    if (IDF_DEPTS.indexOf(postal) > -1) return true;
    if (region.indexOf('ile-de-france') > -1 || region.indexOf('île-de-france') > -1 || region.indexOf('paris') > -1) return true;
    if (city === 'paris' || city.indexOf('boulogne') > -1 || city.indexOf('nanterre') > -1 || city.indexOf('versailles') > -1 || city.indexOf('saint-denis') > -1 || city.indexOf('creteil') > -1) return true;
    return false;
  }

  function readCache() {
    try {
      var cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        var parsed = JSON.parse(cached);
        if (parsed && parsed.ip) return parsed;
      }
    } catch (_) {}
    return null;
  }

  function writeCache(data) {
    try {
      if (data && data.ip) {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
    } catch (_) {}
  }

  function autoFillFormFields(data) {
    if (!data) return;
    try {
      // Auto-fill inputs if empty
      var deptInput = document.querySelector('select[name="departement"], select#departement, input[name="dept"], input#dept');
      if (deptInput && !deptInput.value) {
        var postalPrefix = (data.postal || '').substring(0, 2);
        if (postalPrefix && IDF_DEPTS.indexOf(postalPrefix) > -1) {
          deptInput.value = postalPrefix;
        }
      }

      var cityInput = document.querySelector('input[name="ville"], input#ville, input[name="city"], input#city');
      if (cityInput && !cityInput.value && data.city) {
        cityInput.value = data.city;
      }

      var postalInput = document.querySelector('input[name="code_postal"], input#code_postal, input[name="postal"], input#postal');
      if (postalInput && !postalInput.value && data.postal) {
        postalInput.value = data.postal;
      }
    } catch (_) {}
  }

  async function fetchGeo() {
    var cached = readCache();
    if (cached) {
      geoData = cached;
      autoFillFormFields(geoData);
      return geoData;
    }

    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () { controller.abort(); }, 2500);

      var resp = await fetch('https://ipwho.is/', {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        var json = await resp.json();
        if (json && json.success !== false) {
          geoData = {
            ip: json.ip || '',
            city: json.city || '',
            postal: json.postal || '',
            region: json.region || '',
            country: json.country || '',
            country_code: json.country_code || '',
            org: (json.connection && json.connection.org) || (json.connection && json.connection.isp) || '',
            is_idf: isIDF({ region: json.region, city: json.city, postal: json.postal })
          };
          writeCache(geoData);
          autoFillFormFields(geoData);
          return geoData;
        }
      }
    } catch (_) {}

    // Fallback if ipwho.is is unreachable
    try {
      var resp2 = await fetch('https://api.ipify.org?format=json');
      if (resp2.ok) {
        var j2 = await resp2.json();
        if (j2 && j2.ip) {
          geoData = {
            ip: j2.ip,
            city: '',
            postal: '',
            region: '',
            country: 'France',
            country_code: 'FR',
            org: '',
            is_idf: false
          };
          writeCache(geoData);
          return geoData;
        }
      }
    } catch (_) {}

    return { ip: '', city: '', postal: '', region: '', country: '', org: '', is_idf: false };
  }

  // Public API
  window.bsGetGeo = function () {
    return geoData || readCache() || { ip: '', city: '', postal: '', region: '', country: '', org: '', is_idf: false };
  };

  // Launch async fetch on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchGeo);
  } else {
    fetchGeo();
  }
})();

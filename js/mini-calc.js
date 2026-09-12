/* BatiSpot — Mini-Calculateur Interactif In-Page (SEO Dwell Time & Conversion Booster) */
(function() {
  'use strict';

  function initCalculators() {
    var calcs = document.querySelectorAll('.bs-mini-calc');
    calcs.forEach(function(calc) {
      if (calc.dataset.calcInit) return;
      calc.dataset.calcInit = 'true';

      var basePriceMin = parseFloat(calc.dataset.priceMin || '30');
      var basePriceMax = parseFloat(calc.dataset.priceMax || '55');
      var unit = calc.dataset.unit || 'm²';

      var slider = calc.querySelector('.calc-slider');
      var valDisplay = calc.querySelector('.calc-val-display');
      var resMin = calc.querySelector('.calc-res-min');
      var resMax = calc.querySelector('.calc-res-max');
      var selectQuality = calc.querySelector('.calc-quality');

      function update() {
        if (!slider || !valDisplay || !resMin || !resMax) return;
        var qty = parseFloat(slider.value);
        valDisplay.textContent = qty + ' ' + unit;

        var mult = 1.0;
        if (selectQuality) {
          mult = parseFloat(selectQuality.value || '1.0');
        }

        var totalMin = Math.round(qty * basePriceMin * mult);
        var totalMax = Math.round(qty * basePriceMax * mult);

        resMin.textContent = totalMin.toLocaleString('fr-FR') + ' €';
        resMax.textContent = totalMax.toLocaleString('fr-FR') + ' € TTC';
      }

      if (slider) slider.addEventListener('input', update);
      if (selectQuality) selectQuality.addEventListener('change', update);
      update();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculators);
  } else {
    initCalculators();
  }
})();

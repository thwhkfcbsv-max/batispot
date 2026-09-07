// BatiSpot — Import d'anciens devis / factures vers la grille de prix de l'artisan
//
// Ecrit le 31/08/2026. Remplace la maquette BtpCrmImporter livree le 22/08, qui
// ignorait le fichier depose et renvoyait cinq lignes ecrites en dur avec
// "18 tarifs extraits" et "taux horaire 46,50 EUR/h" — trois chiffres qui ne
// venaient d'aucun document.
//
// Trois regles tenues ici, dans cet ordre :
//   1. le fichier part vraiment au serveur (mode parse-devis de gemini-assistant) ;
//   2. aucun prix non lu n'est presente comme lu — un champ vide reste vide ;
//   3. rien n'entre dans la grille sans un clic explicite de l'artisan.
// Un artisan qui chiffre sur des prix qui ne sont pas les siens perd de l'argent
// sur chaque chantier : c'est exactement ce que coutait la maquette.
//
// Monte par : profile.html (emplacement principal) et le wizard d'accueil.
// Dependances : app-knowledge-btp.js (BtpPriceGridManager), app-assistant.js
// (bsJetonSession), config.js (__BATISPOT_CONFIG__).

(function () {
  'use strict';

  // Le serveur normalise en ASCII ("m2", "m3") ; la grille de l'artisan affiche
  // "m²" partout depuis toujours. Sans cette conversion on creerait des doublons :
  // "Peinture murs" en m² d'un cote, en m2 de l'autre.
  var UNITE_LISIBLE = { m2: 'm²', m3: 'm³' };

  var COULEUR_CONFIANCE = { haute: '#0F5132', moyenne: '#92400E', faible: '#9A3412' };
  var FOND_CONFIANCE = { haute: '#DCFCE7', moyenne: '#FEF3C7', faible: '#FFEDD5' };

  function notifier(msg, alerte) {
    if (typeof window.showToast === 'function') window.showToast(msg, !!alerte);
  }

  // Une photo de devis prise au telephone fait 4 a 8 Mo : au-dela de la limite
  // serveur. On la reduit avant l'envoi, en gardant assez de definition pour que
  // les chiffres restent lisibles (1600 px de large).
  async function reduireImage(file) {
    if (!file.type || file.type.indexOf('image/') !== 0) return file;
    try {
      var bitmap = await createImageBitmap(file);
      var largeur = Math.min(1600, bitmap.width);
      var ratio = largeur / bitmap.width;
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * ratio);
      canvas.height = Math.round(bitmap.height * ratio);
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      var blob = await new Promise(function (res) { canvas.toBlob(res, 'image/jpeg', 0.85); });
      bitmap.close();
      canvas.width = canvas.height = 0;
      if (blob) return new File([blob], 'devis.jpg', { type: 'image/jpeg' });
    } catch (e) {
      // HEIC non decodable, ou memoire insuffisante : on envoie le fichier brut
      // plutot que de bloquer l'artisan.
      console.warn('[import-devis] reduction impossible, envoi brut', e);
    }
    return file;
  }

  function enBase64(f) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).replace(/^data:[^;]+;base64,/, '')); };
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  }

  async function lireDocument(fichier, achatPrompt) {
    var cfg = window.__BATISPOT_CONFIG__ || {};
    var url = (cfg.SUPABASE_URL || 'https://cisniwhaiydazdpzvino.supabase.co')
      + '/functions/v1/gemini-assistant';
    var jwt = (typeof window.bsJetonSession === 'function') ? window.bsJetonSession() : null;
    var headers = { 'content-type': 'application/json' };
    if (cfg.SUPABASE_ANON_KEY) headers['apikey'] = cfg.SUPABASE_ANON_KEY;
    headers['authorization'] = 'Bearer ' + (jwt || cfg.SUPABASE_ANON_KEY || '');

    // 60 s : lire un devis PDF prend du temps, mais pas l'infini. Sans delai,
    // « Lecture du document en cours… » resterait affiche pour toujours.
    var r = await (window.bsFetchAvecDelai || fetch)(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        mode: 'parse-devis',
        prompt: (achatPrompt
          ? "Lis cette FACTURE FOURNISSEUR (négoce, grande surface) et extrais les prix d'achat HT unitaires tels qu'écrits, ligne par ligne. Ne garde que les fournitures et matériaux."
          : "Lis ce devis ou cette facture et extrais les prix de vente de l'artisan."),
        image: { data: await enBase64(fichier), mimeType: fichier.type || 'application/pdf' },
      }),
    }, 60000);
    var j = await r.json();
    return (j && j.data) || null;
  }

  /**
   * Monte l'interface d'import dans `conteneur`.
   * @param {HTMLElement} conteneur
   * @param {{onImport?: function(number): void, compact?: boolean}} [opts]
   */
  function monter(conteneur, opts) {
    if (!conteneur) return null;
    opts = opts || {};
    // cible 'achat' (04/09) : facture FOURNISSEUR → table artisan_prix_achat
    // (marge), au lieu de la grille de prix de vente. Même lecture serveur.
    var achat = opts.cible === 'achat';
    var lignes = [];

    conteneur.innerHTML = ''
      + '<div style="background:#FAFDFB;border:1.5px solid #228B5B;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px;">'
      + '  <strong style="font-size:13px;color:#0F5132;">' + (achat ? 'Récupérer mes prix d\'achat depuis une facture fournisseur' : 'Importez vos devis ou prenez-les en photo') + '</strong>'
      + '  <p style="font-size:12px;color:#3D5A4E;margin:0;line-height:1.45;">'
      + (achat
          ? '    Déposez une facture de votre négoce ou de votre grande surface (Point.P, Cedeo, Rexel, Leroy Merlin…). Les prix d\'achat qui y sont écrits vous sont proposés&nbsp;: vous cochez ceux que vous gardez. Ils servent à calculer votre marge, jamais à écrire votre devis.'
          : '    Déposez vos devis ou factures déjà faits, un par un ou plusieurs, en PDF ou en photo : un seul devis'
          + '    ne contient pas tous vos prix. Ceux qui y sont écrits vous sont proposés&nbsp;: vous cochez ceux que vous gardez.'
          + '    Rien n\'entre dans votre grille sans votre validation.')
      + '  </p>'
      + '  <input type="file" data-bs="fichier" accept="application/pdf,image/*" multiple style="display:none;">'
      + '  <button type="button" data-bs="choisir" class="btn-act primary" style="font-size:12px;padding:10px;min-height:44px;box-sizing:border-box;background:#228B5B;">' + (achat ? 'Choisir une facture fournisseur (PDF ou photo)' : 'Importer mes devis (PDF ou photos)') + '</button>'
      + '  <div data-bs="statut" style="display:none;font-size:12px;color:#3D5A4E;background:#FFFFFF;border:1px solid #E7EEEA;border-radius:8px;padding:9px 10px;line-height:1.45;white-space:pre-line;"></div>'
      + '</div>'
      + '<div data-bs="resultats" style="display:none;flex-direction:column;gap:8px;margin-top:10px;">'
      + '  <div style="display:flex;justify-content:space-between;align-items:center;">'
      + '    <span style="font-size:12px;color:#5A7268;">Prix lus sur le document&nbsp;:</span>'
      + '    <button type="button" data-bs="tout" style="background:none;border:none;color:#0F5132;cursor:pointer;font-size:11px;font-weight:800;">Tout cocher / décocher</button>'
      + '  </div>'
      + '  <div data-bs="lignes" style="display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto;padding-right:2px;"></div>'
      + '  <button type="button" data-bs="valider" class="btn-act primary" style="font-size:12px;padding:10px;min-height:44px;box-sizing:border-box;background:#228B5B;">' + (achat ? 'Enregistrer ces prix d\'achat' : 'Ajouter les prix cochés à ma grille') + '</button>'
      + '</div>';

    var q = function (nom) { return conteneur.querySelector('[data-bs="' + nom + '"]'); };
    var elFichier = q('fichier'), elStatut = q('statut'),
        elResultats = q('resultats'), elLignes = q('lignes');

    function statut(texte, erreur) {
      elStatut.style.display = 'block';
      elStatut.style.color = erreur ? '#9A3412' : '#3D5A4E';
      elStatut.style.borderColor = erreur ? '#FDBA74' : '#E7EEEA';
      elStatut.style.background = erreur ? '#FFF7ED' : '#FFFFFF';
      elStatut.textContent = texte;
    }

    function rendre() {
      elLignes.innerHTML = '';
      var grille = (!achat && window.BtpPriceGridManager && window.BtpPriceGridManager.getGrid()) || [];

      lignes.forEach(function (l, i) {
        // Si ce libelle existe deja dans la grille, on montre le prix actuel :
        // l'artisan doit voir ce qu'il remplace avant de cocher.
        var existant = grille.find(function (x) {
          return x && String(x.label).toLowerCase() === l.label.toLowerCase();
        });
        var div = document.createElement('div');
        div.style.cssText = 'background:#FFFFFF;border:1px solid #E7EEEA;border-radius:8px;padding:8px 10px;display:flex;gap:8px;align-items:flex-start;';

        var coche = document.createElement('input');
        coche.type = 'checkbox';
        coche.checked = l.coche;
        coche.style.cssText = 'margin-top:3px;width:16px;height:16px;accent-color:#228B5B;flex-shrink:0;';
        coche.addEventListener('change', function () { l.coche = coche.checked; });

        var milieu = document.createElement('div');
        milieu.style.cssText = 'flex:1;min-width:0;';
        var titre = document.createElement('strong');
        titre.style.cssText = 'font-size:12px;color:#1C2B22;display:block;line-height:1.3;';
        titre.textContent = l.label;
        var meta = document.createElement('span');
        meta.style.cssText = 'font-size:10.5px;color:#5A7268;';
        meta.textContent = l.categorie;
        var badge = document.createElement('span');
        badge.style.cssText = 'font-size:10px;font-weight:800;color:' + (COULEUR_CONFIANCE[l.confiance] || '#92400E')
          + ';background:' + (FOND_CONFIANCE[l.confiance] || '#FEF3C7') + ';padding:1px 6px;border-radius:5px;margin-left:4px;';
        badge.textContent = 'lecture ' + l.confiance;
        milieu.appendChild(titre); milieu.appendChild(meta); milieu.appendChild(badge);

        if (existant) {
          var remp = document.createElement('span');
          remp.style.cssText = 'font-size:10.5px;color:#9A3412;display:block;margin-top:2px;';
          remp.textContent = 'Remplacera votre prix actuel : '
            + Number(existant.price).toFixed(2) + ' € / ' + existant.unit;
          milieu.appendChild(remp);
        }
        if (l.prix === null) {
          var vide = document.createElement('span');
          vide.style.cssText = 'font-size:10.5px;color:#9A3412;display:block;margin-top:2px;';
          vide.textContent = "Prix non lisible sur le document — saisissez-le pour l'ajouter";
          milieu.appendChild(vide);
        }

        var droite = document.createElement('div');
        droite.style.cssText = 'display:flex;align-items:center;gap:3px;flex-shrink:0;';
        var champ = document.createElement('input');
        champ.type = 'number'; champ.step = '0.01'; champ.min = '0';
        champ.value = (l.prix !== null) ? l.prix : '';
        champ.placeholder = '—';
        champ.style.cssText = 'width:68px;font-size:16px;font-weight:800;text-align:right;padding:5px 6px;border:1px solid #D3E3DA;border-radius:6px;color:#0F5132;';
        champ.addEventListener('change', function () {
          var n = parseFloat(champ.value);
          l.prix = (n > 0) ? n : null;
          // Un prix efface decoche la ligne : on n'enregistre jamais un vide.
          if (l.prix === null) { l.coche = false; coche.checked = false; }
        });
        var unite = document.createElement('span');
        unite.style.cssText = 'font-size:10.5px;color:#5A7268;';
        unite.textContent = '€/' + l.unit;
        droite.appendChild(champ); droite.appendChild(unite);

        div.appendChild(coche); div.appendChild(milieu); div.appendChild(droite);
        elLignes.appendChild(div);
      });

      elResultats.style.display = 'flex';
    }

    q('choisir').addEventListener('click', function () { elFichier.click(); });

    q('tout').addEventListener('click', function () {
      // On ne coche que ce qui a un prix : cocher une ligne vide ne produirait rien.
      var cible = !lignes.some(function (l) { return l.coche; });
      lignes.forEach(function (l) { l.coche = cible && l.prix !== null; });
      rendre();
    });

    q('valider').addEventListener('click', function () {
      var retenues = lignes.filter(function (l) { return l.coche && l.prix !== null; });
      if (!retenues.length) { notifier('Cochez au moins un prix à ajouter.', true); return; }
      // Source "Saisie Artisan" : c'est ce qui declenche la remontee vers la table
      // artisan_prix, donc ces tarifs suivent l'artisan s'il change de telephone.
      if (achat) {
        import('./app-materiaux.js').then(async function (mod) {
          var n = 0;
          for (var i = 0; i < retenues.length; i++) {
            try { await mod.enregistrerPrixAchat({ label: retenues[i].label, unit: retenues[i].unit, prix: retenues[i].prix, source: 'facture' }); n++; }
            catch (e) { console.warn('[prix achat]', e); }
          }
          lignes = [];
          elResultats.style.display = 'none';
          statut(n + ' prix d\'achat enregistrés.');
          notifier(n + ' prix d\'achat enregistré(s). Ils serviront à calculer vos marges.');
          if (typeof opts.onImport === 'function') opts.onImport(n);
        }).catch(function (e) { notifier('Enregistrement impossible : ' + (e.message || e), true); });
        return;
      }
      retenues.forEach(function (l) {
        window.BtpPriceGridManager.addOrUpdateItem(
          null, l.label, l.unit, l.prix, l.categorie, 'Saisie Artisan');
      });
      lignes = [];
      elResultats.style.display = 'none';
      statut(retenues.length + ' prix ajoutés à votre grille.');
      notifier(retenues.length + ' tarif(s) ajouté(s) à votre grille de prix.');
      if (typeof opts.onImport === 'function') opts.onImport(retenues.length);
    });

    // (06/09, Moctar) « il faut pouvoir aller chercher plusieurs devis, dans
    // ses fichiers, Drive ou iOS » : l'input est `multiple`, le sélecteur du
    // téléphone (Fichiers / iCloud / Google Drive / Android) rend plusieurs
    // fichiers, lus un par un ; les prix de tous les documents s'additionnent
    // dans une seule liste à cocher (un libellé + unité déjà vu n'est pas
    // dupliqué). Un document illisible n'arrête pas les autres.
    elFichier.addEventListener('change', async function (ev) {
      var files = Array.prototype.slice.call((ev.target.files || []), 0, 20);
      if (!files.length) return;
      ev.target.value = ''; // permet de re-selectionner le meme fichier apres une erreur

      elResultats.style.display = 'none';
      lignes = [];
      var vus = {};
      var nbDocs = 0, nbIllisibles = 0, tropLourds = 0, echecs = 0;
      var avert = [];
      var tauxHoraire = null;

      for (var k = 0; k < files.length; k++) {
        var file = files[k];
        statut(files.length > 1
          ? 'Lecture du document ' + (k + 1) + ' sur ' + files.length + '…'
          : 'Lecture du document en cours…');

        var fichier = await reduireImage(file);

        // Le serveur refuse au-dela d'environ 1,1 Mo (MAX_IMAGE_B64). On le dit
        // plutot que de laisser tomber un 413 opaque.
        if (fichier.size > 1100000) { tropLourds++; continue; }

        try {
          var d = await lireDocument(fichier, achat);
          if (!d || d.documentLisible === false || !Array.isArray(d.lignes) || !d.lignes.length) {
            nbIllisibles++;
            if (d && Array.isArray(d.avertissements)) avert = avert.concat(d.avertissements);
            continue;
          }
          nbDocs++;
          if (typeof d.tauxHoraireHT === 'number' && d.tauxHoraireHT > 0 && tauxHoraire === null) tauxHoraire = d.tauxHoraireHT;
          if (Array.isArray(d.avertissements)) avert = avert.concat(d.avertissements);
          d.lignes.filter(function (l) { return l && l.label; }).forEach(function (l) {
            var unit = UNITE_LISIBLE[l.unit] || l.unit || 'u';
            var cle = (String(l.label).trim().toLowerCase() + '|' + unit);
            if (vus[cle]) return;
            vus[cle] = true;
            var prixLu = (typeof l.prixUnitaireHT === 'number' && l.prixUnitaireHT > 0);
            lignes.push({
              id: 'imp_' + lignes.length,
              label: String(l.label).slice(0, 120),
              unit: unit,
              prix: prixLu ? l.prixUnitaireHT : null,
              categorie: l.categorie || 'Général',
              confiance: l.confiance || 'moyenne',
              // Une ligne sans prix lu n'est jamais cochee d'office : l'artisan doit
              // saisir le chiffre lui-meme, sinon on lui ferait valider un vide.
              coche: prixLu,
            });
          });
        } catch (e) {
          console.warn('[import-devis]', e);
          echecs++;
          if (typeof window.bsSignalerPanne === 'function') {
            window.bsSignalerPanne({ action: 'import ancien devis', mode: 'parse-devis',
              code: (e && e.delaiDepasse) ? 'delai_depasse' : 'lecture',
              detail: String((e && e.message) || e) });
          }
        }
      }

      if (!lignes.length) {
        var pourquoi = [];
        if (tropLourds) pourquoi.push(tropLourds + ' fichier(s) trop lourd(s) : envoyez une seule page à la fois, ou prenez-la en photo.');
        if (nbIllisibles) pourquoi.push("Aucun prix n'a pu être lu sur " + nbIllisibles + ' document(s). Réessayez avec une page plus nette, ou ajoutez vos tarifs à la main dans votre grille.');
        if (echecs) pourquoi.push('La lecture de ' + echecs + ' document(s) a échoué. Vérifiez votre connexion et réessayez.');
        if (avert.length) pourquoi.push(avert.join(' · '));
        statut(pourquoi.join('\n') || "Aucun prix n'a pu être lu.", true);
        return;
      }

      var nbLus = lignes.filter(function (l) { return l.prix !== null; }).length;
      var txt = nbLus + ' prix lus sur ' + (nbDocs > 1 ? nbDocs + ' documents.' : 'ce document.');
      if (lignes.length > nbLus) {
        txt += ' ' + (lignes.length - nbLus)
          + ' ligne(s) trouvée(s) sans prix lisible — à compléter à la main.';
      }
      if (tauxHoraire !== null) txt += ' Taux horaire lu : ' + tauxHoraire.toFixed(2) + ' € HT/h.';
      if (tropLourds || nbIllisibles || echecs) {
        var manques = [];
        if (tropLourds) manques.push(tropLourds + ' trop lourd(s)');
        if (nbIllisibles) manques.push(nbIllisibles + ' sans prix lisible');
        if (echecs) manques.push(echecs + ' en échec');
        txt += ' Non lus : ' + manques.join(', ') + '.';
      }
      if (avert.length) txt += '\n⚠ ' + avert.slice(0, 4).join(' · ');
      statut(txt);
      rendre();
    });

    return { rendre: rendre };
  }

  window.BsImportDevis = { monter: monter };
})();

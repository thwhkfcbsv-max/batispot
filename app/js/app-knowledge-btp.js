// BatiSpot Pro — Module de Connaissances BTP & Moteur d Auto-Apprentissage
// Piliers 1, 2 et 3 : Ordres de grandeur de repli, Normes DTU, Memoire Adaptative

(function() {
  'use strict';

  // PILIER 1 : ORDRES DE GRANDEUR DE REPLI (figes, saisis a la main)
  //
  // ATTENTION — ce ne sont PAS des catalogues fournisseurs. Aucun de ces prix
  // n'a ete releve chez Tollens, Point.P ou Cedeo : ils ont ete tapes une fois
  // et n'ont pas bouge depuis. Le commentaire disait « CATALOGUES FOURNISSEURS
  // REELS BTP 2026 », ce qui etait faux et invitait a s'y fier.
  //
  // Ils ne servent QU'AU REPLI HORS LIGNE, quand gemini-assistant est
  // injoignable (artisan en sous-sol, reseau coupe). Dans ce cas l'ecran doit
  // annoncer une estimation, jamais un devis ferme : l'artisan hors reseau ne
  // peut rien verifier.
  //
  // Les noms de marques et d'enseignes ont ete retires des libelles le 31/08 :
  // un peintre qui achete chez Zolpan recevait un devis nommant « Tollens
  // IdroTop » et « Fournitures Point.P », a des prix qui n'etaient pas les
  // siens. Le champ `fournisseur` reste vide pour la meme raison.
  const CATALOGUES_BTP = {
    peinture: {
      fournisseur: "",
      produits: [
        { ref: "TOL-IMP-01", nom: "Sous-couche d impression universelle", puAchatHt: 12.00, unite: "L", rendementM2L: 10, prixFournitureM2: 1.20 },
        { ref: "TOL-VEL-02", nom: "Peinture acrylique finition velours (2 couches)", puAchatHt: 18.00, unite: "L", rendementM2L: 5, prixFournitureM2: 3.60 },
        { ref: "TOU-END-03", nom: "Enduit de rebouchage & lissage (sac 15 kg)", puAchatHt: 28.50, unite: "sac", rendementM2Sac: 12, prixFournitureM2: 2.38 },
        { ref: "PRO-MSK-04", nom: "Protection de chantier : polyane 80u + ruban masquage", puAchatHt: 35.00, unite: "forfait", forfaitChantier: 35.00 }
      ],
      poseM2Ht: 28.00,
      dtu: "DTU 59.1 — Travaux de peinture des batiments (humidite support < 5%)"
    },
    carrelage: {
      fournisseur: "",
      produits: [
        { ref: "PTP-CER-01", nom: "Gres cerame rectifie 60x60 emaille R10", puAchatHt: 24.50, unite: "m2", prixFournitureM2: 24.50 },
        { ref: "PRX-COL-02", nom: "Colle C2S1 deformable (sac 25 kg)", puAchatHt: 22.00, unite: "sac", rendementM2Sac: 5, prixFournitureM2: 4.40 },
        { ref: "PRX-JNT-03", nom: "Joint hydrofuge fin haute resistance 2-10 mm", puAchatHt: 14.00, unite: "sac", rendementM2Sac: 10, prixFournitureM2: 1.40 },
        { ref: "WEB-RAG-04", nom: "Ragreage autolissant fibre P4 (sac 25 kg)", puAchatHt: 26.00, unite: "sac", rendementM2Sac: 4, prixFournitureM2: 6.50 },
        { ref: "SPC-ETA-05", nom: "Systeme d Etancheite Liquide sous Carrelage (SPEC / SEL)", puAchatHt: 85.00, unite: "kit 10m2", prixFournitureM2: 8.50 }
      ],
      poseM2Ht: 45.00,
      dtu: "DTU 52.2 — Pose collee des revetements ceramiques et analogues"
    },
    plomberie_sdb: {
      fournisseur: "",
      produits: [
        { ref: "CED-REC-01", nom: "Receveur resine extra-plat antiderapant PN24 90x120", puAchatHt: 280.00, unite: "u", prixFournitureU: 280.00 },
        { ref: "GRO-COL-02", nom: "Colonne de douche thermostatique", puAchatHt: 195.00, unite: "u", prixFournitureU: 195.00 },
        { ref: "PAR-VTR-03", nom: "Paroi fixe verre securit 8 mm anticalcaire 120x200", puAchatHt: 220.00, unite: "u", prixFournitureU: 220.00 },
        { ref: "GEB-BAT-04", nom: "Bati-support WC suspendu 12 cm", puAchatHt: 240.00, unite: "u", prixFournitureU: 240.00 },
        { ref: "PER-TUB-05", nom: "Tubage PER gaine multicouche & raccords a sertir", puAchatHt: 65.00, unite: "forfait", forfaitChantier: 65.00 }
      ],
      poseForfaitHt: 950.00,
      dtu: "DTU 60.1 — Plomberie sanitaire et evacuations interieures"
    },
    electricite: {
      fournisseur: "",
      produits: [
        { ref: "LEG-TAB-01", nom: "Tableau de distribution 4 rangees 18 modules", puAchatHt: 380.00, unite: "u", prixFournitureU: 380.00 },
        { ref: "LEG-DIF-02", nom: "Interrupteurs differentiels 30 mA Type A / AC 40A-63A", puAchatHt: 165.00, unite: "lot", prixFournitureU: 165.00 },
        { ref: "LEG-DIS-03", nom: "Disjoncteurs divisionnaires Phase+Neutre 10A/16A/20A/32A", puAchatHt: 120.00, unite: "lot 10u", prixFournitureU: 120.00 },
        { ref: "DOX-APP-04", nom: "Appareillage mural complet (prises + inters)", puAchatHt: 145.00, unite: "lot", prixFournitureU: 145.00 },
        { ref: "CAB-RO2-05", nom: "Cables R2V / H07VU 1.5mm2, 2.5mm2, 6mm2 et gaines ICTA", puAchatHt: 180.00, unite: "lot", prixFournitureU: 180.00 }
      ],
      poseForfaitHt: 1450.00,
      dtu: "Norme NF C 15-100 — Installations electriques basse tension"
    }
  };

  // ── OUVRAGES FACTURES A L'UNITE ───────────────────────────────────────────
  //
  // « 3 prises et un va-et-vient » ne produisait RIEN : le moteur ne savait
  // lire que des surfaces. Or l'unite est, avec le m2, l'unite la plus
  // frequente en renovation (cf. docs/lexique-devis-dictee.md §3).
  //
  // `tarif` nomme la cle de p.tarifsPersonnalises quand le prix appartient
  // VRAIMENT a l'artisan. Quand il vaut null, on reconnait l'ouvrage mais on
  // ne le chiffre pas : on remonte une demande de tarif precise. Mettre ici un
  // prix de catalogue fournisseur reviendrait a facturer au nom de l'artisan
  // des montants qui ne sont pas les siens.
  //
  // ⚠️ « douche » est volontairement ABSENT : le mot route deja vers le lot
  // salle de bain au m2. L'ajouter ici casserait un chemin qui marche.
  const OUVRAGES_UNITAIRES = [
    { cle: 'wc',            label: 'WC suspendu (pose)',            motif: /\b(?:wc|w\.c\.|toilettes?|cuvettes?)\b/gi,                       tarif: 'pose_wc_suspendu' },
    { cle: 'tableau',       label: 'Tableau electrique (remplacement)', motif: /\btableaux?\s+(?:electriques?|elec)\b|\btableaux?\b/gi,       tarif: 'remplacement_tableau_elec' },
    { cle: 'prise',         label: 'Prise de courant',              motif: /\bprises?\b/gi,                                                  tarif: null },
    { cle: 'interrupteur',  label: 'Interrupteur',                  motif: /\binterrupteurs?\b/gi,                                           tarif: null },
    { cle: 'va_et_vient',   label: 'Va-et-vient',                   motif: /\bva[-\s]?et[-\s]?vients?\b/gi,                                  tarif: null },
    { cle: 'point_lumineux',label: 'Point lumineux',                motif: /\bpoints?\s+lumineux\b|\bdcl\b/gi,                               tarif: null },
    { cle: 'spot',          label: 'Spot encastre',                 motif: /\bspots?\b/gi,                                                   tarif: null },
    { cle: 'applique',      label: 'Applique',                      motif: /\bappliques?\b/gi,                                               tarif: null },
    { cle: 'radiateur',     label: 'Radiateur',                     motif: /\bradiateurs?\b/gi,                                              tarif: null },
    { cle: 'seche_serv',    label: 'Seche-serviettes',              motif: /\bs[eè]che[-\s]?serviettes?\b/gi,                                 tarif: null },
    { cle: 'lavabo',        label: 'Lavabo / vasque',               motif: /\blavabos?\b|\bvasques?\b|\blave[-\s]?mains?\b/gi,                tarif: null },
    { cle: 'baignoire',     label: 'Baignoire',                     motif: /\bbaignoires?\b/gi,                                              tarif: null },
    { cle: 'receveur',      label: 'Receveur de douche',            motif: /\breceveurs?\b|\bbacs?\s+[aà]\s+douche\b/gi,                      tarif: null },
    { cle: 'robinetterie',  label: 'Robinetterie / mitigeur',       motif: /\bmitigeurs?\b|\brobinets?\b|\brobinetterie\b/gi,                 tarif: null },
    { cle: 'chauffe_eau',   label: 'Chauffe-eau / ballon',          motif: /\bchauffe[-\s]?eaux?\b|\bballons?\b|\bcumulus\b/gi,               tarif: null },
    { cle: 'fenetre',       label: 'Fenetre',                       motif: /\bfen[eê]tres?\b|\bch[aâ]ssis\b/gi,                               tarif: null },
    { cle: 'porte',         label: 'Porte / bloc-porte',            motif: /\bportes?\b|\bblocs?[-\s]?portes?\b/gi,                           tarif: null },
    { cle: 'volet',         label: 'Volet',                         motif: /\bvolets?\b/gi,                                                   tarif: null },
    { cle: 'velux',         label: 'Fenetre de toit',               motif: /\bvelux\b|\bfen[eê]tres?\s+de\s+toit\b/gi,                        tarif: null },
    { cle: 'vmc',           label: 'VMC',                           motif: /\bvmc\b/gi,                                                      tarif: null },
    { cle: 'poele',         label: 'Poele / insert',                motif: /\bpo[eê]les?\b|\binserts?\b/gi,                                   tarif: null },
    { cle: 'portail',       label: 'Portail / portillon',           motif: /\bportails?\b|\bportillons?\b/gi,                                 tarif: null },
    { cle: 'daaf',          label: 'Detecteur de fumee',            motif: /\bd[ée]tecteurs?\s+de\s+fum[ée]e\b|\bdaaf\b/gi,                   tarif: null },
    { cle: 'visiophone',    label: 'Interphone / visiophone',       motif: /\bvisiophones?\b|\binterphones?\b/gi,                             tarif: null },
    { cle: 'borne_irve',    label: 'Borne de recharge',             motif: /\bbornes?\s+de\s+recharge\b|\birve\b/gi,                          tarif: null }
  ];

  // Nombres dictes en toutes lettres. Une dictee dit « trois prises » bien
  // plus souvent que « 3 prises ».
  const NOMBRES_LETTRES = {
    'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5, 'six': 6,
    'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10, 'onze': 11, 'douze': 12,
    'treize': 13, 'quatorze': 14, 'quinze': 15, 'seize': 16, 'vingt': 20
  };

  // PILIER 3 : MOTEUR D AUTO-APPRENTISSAGE DE L ARTISAN (ArtisanLearner)
  const LEARNER_STORAGE_KEY = 'batispot_artisan_profile_learned_v2';

  const defaultArtisanProfile = {
    tauxHoraireMo: 48.00,
    margeCiblePourcent: 55.0,
    fournisseurPrefere: "",
    remiseMateriauxNegociee: 15.0,
    tarifsPersonnalises: {
      peinture_m2_pose: 28.00,
      carrelage_m2_pose: 45.00,
      // Seul tarif au METRE LINEAIRE dont on dispose. Repris de la grille de
      // l'artisan (devis/js/pricing-peinture.js : « Peinture plinthes », 6 EUR
      // HT/ml). C'est un tarif de PEINTURE de plinthes, pas de fourniture-pose
      // — on ne s'en sert donc que pour ce cas precis.
      plinthes_ml_peinture: 6.00,
      parquet_m2_pose: 24.00,
      pose_wc_suspendu: 320.00,
      remplacement_tableau_elec: 1200.00
    },
    reglesApprises: [
      "Application automatique de la TVA 10% sur les logements de plus de 2 ans",
      "Fourniture colle C2S1 et primaire inclus dans les poses carrelage",
      "Calcul des fournitures peinture sur base de 2 couches"
    ]
  };

  window.ArtisanLearner = {
    getProfile() {
      try {
        const saved = localStorage.getItem(LEARNER_STORAGE_KEY);
        if (saved) {
          return Object.assign({}, defaultArtisanProfile, JSON.parse(saved));
        }
      } catch (e) {
        console.warn("Erreur lecture profil artisan:", e);
      }
      return Object.assign({}, defaultArtisanProfile);
    },

    saveProfile(profile) {
      try {
        localStorage.setItem(LEARNER_STORAGE_KEY, JSON.stringify(profile));
      } catch (e) {
        console.warn("Erreur sauvegarde profil artisan:", e);
      }
    },

    learnRule(consigneText) {
      const p = this.getProfile();
      const txt = consigneText.toLowerCase();

      const thMatch = txt.match(/(\d{2,3})\s*(?:€|euros?)\s*(?:\/|\s*par\s*)h/i);
      if (thMatch) {
        p.tauxHoraireMo = parseFloat(thMatch[1]);
        p.reglesApprises.push(`Taux horaire main d'oeuvre ajuste a ${p.tauxHoraireMo.toFixed(2)} € HT/h`);
      }

      const margeMatch = txt.match(/(\d{2})\s*%\s*(?:de\s*)?marge/i);
      if (margeMatch) {
        p.margeCiblePourcent = parseFloat(margeMatch[1]);
        p.reglesApprises.push(`Marge cible nette ajustee a ${p.margeCiblePourcent.toFixed(1)}%`);
      }

      const carrelMatch = txt.match(/carrelage.*?(\d{2,3})\s*(?:€|euros?)/i);
      if (carrelMatch) {
        p.tarifsPersonnalises.carrelage_m2_pose = parseFloat(carrelMatch[1]);
        p.reglesApprises.push(`Tarif pose carrelage personnalise a ${p.tarifsPersonnalises.carrelage_m2_pose.toFixed(2)} € HT/m2`);
      }

      const peintMatch = txt.match(/peinture.*?(\d{2,3})\s*(?:€|euros?)/i);
      if (peintMatch) {
        p.tarifsPersonnalises.peinture_m2_pose = parseFloat(peintMatch[1]);
        p.reglesApprises.push(`Tarif peinture personnalise a ${p.tarifsPersonnalises.peinture_m2_pose.toFixed(2)} € HT/m2`);
      }

      if (p.reglesApprises.length > 10) {
        p.reglesApprises = p.reglesApprises.slice(-10);
      }

      this.saveProfile(p);
      return p;
    },

    // Reconnait une quantite dictee et SON UNITE. Rend {valeur, unite} ou null.
    //
    // Il existait trois regex identiques `(?:m2|m²)` recopiees dans devis.html
    // (lignes 1895 / 2270 / 2788). Elles ne connaissaient QUE le metre carre :
    // « 100 metres lineaires » ne correspondait a rien, donc aucune quantite
    // n'etait detectee et rien ne se chiffrait (signale par Moctar le 31/08).
    // Un seul extracteur partage ici, pour que la prochaine unite ajoutee le
    // soit a UN endroit et pas a trois.
    extraireQuantite(texte) {
      const q = String(texte || '').toLowerCase();
      const NOMBRE = '(\\d{1,4}(?:[.,]\\d{1,2})?)';

      // Le lineaire se teste EN PREMIER : « metres lineaires » ne doit jamais
      // tomber dans une regle de metre carre.
      const ml = q.match(new RegExp(NOMBRE + '\\s*(?:m\\.?l\\.?\\b|m[èe]tres?\\s+lin[ée]aires?\\b|m\\s+lin[ée]aires?\\b)', 'i'));
      if (ml) return { valeur: parseFloat(ml[1].replace(',', '.')), unite: 'ml' };

      const m2 = q.match(new RegExp(NOMBRE + '\\s*(?:m²|m2\\b|m[èe]tres?\\s+carr[ée]s?\\b)', 'i'));
      if (m2) return { valeur: parseFloat(m2[1].replace(',', '.')), unite: 'm2' };

      return null;
    },

    // Ouvrages factures au metre lineaire (plinthes, corniches...).
    estOuvrageLineaire(texte) {
      return /plinthe|corniche|cimaise|moulure|gorge/i.test(String(texte || ''));
    },

    // Reconnait les ouvrages comptes A L'UNITE et leur quantite.
    // Rend [{cle, label, quantite, tarif}] — tarif null = reconnu mais non
    // chiffrable (voir OUVRAGES_UNITAIRES).
    extraireOuvragesUnitaires(texte) {
      const t = String(texte || '');
      const trouves = [];
      for (const o of OUVRAGES_UNITAIRES) {
        const re = new RegExp(o.motif.source, 'gi');
        let m, total = 0, vu = false;
        while ((m = re.exec(t)) !== null) {
          vu = true;
          total += this._quantiteAvant(t, m.index);
        }
        if (vu && total > 0) trouves.push({ cle: o.cle, label: o.label, quantite: total, tarif: o.tarif, motifSource: o.motif.source });
      }
      return trouves;
    },

    // Nombre qui precede l'ouvrage : « 3 prises », « trois prises ».
    // Sans nombre trouve on rend 1 — la valeur la plus prudente. On ne devine
    // JAMAIS une quantite : c'est elle qui porte le montant.
    _quantiteAvant(texte, index) {
      const avant = texte.slice(Math.max(0, index - 24), index).toLowerCase();
      const chiffre = avant.match(/(\d{1,3})\D{0,12}$/);
      if (chiffre) return parseInt(chiffre[1], 10);
      const mots = avant.trim().split(/[\s,''\-]+/);
      for (let i = mots.length - 1; i >= 0 && i >= mots.length - 2; i--) {
        if (NOMBRES_LETTRES[mots[i]] != null) return NOMBRES_LETTRES[mots[i]];
      }
      return 1;
    },

    // Chiffrage A L'UNITE. Ne facture que les ouvrages dont le tarif appartient
    // reellement a l'artisan ; les autres remontent dans `tarifsManquants` pour
    // que l'assistant pose une question PRECISE (« tu factures combien la pose
    // d'une prise ? ») au lieu de rendre un blanc ou d'inventer un montant.
    // Cherche dans LA GRILLE DE L'ARTISAN un tarif a l'unite pour cet ouvrage.
    //
    // ⚠️ On ne retient QUE les lignes dont la source est une SOURCE ARTISAN
    // (voir SOURCES_ARTISAN) — celles qu'il a saisies, corrigees ou dictees. Les 10 entrees livrees
    // par defaut portent `source: 'Catalogue BatiSpot'` (receveur 540 EUR,
    // tableau 1350 EUR...) : ce sont des prix de catalogue, pas les siens, et
    // les facturer en son nom est exactement ce qu'interdit la regle du 31/08.
    // Un artisan qui n'a rien saisi obtient donc toujours « tarif manquant »,
    // et c'est le comportement correct.
    _tarifArtisanPourOuvrage(ouvrage) {
      if (!window.BtpPriceGridManager || !ouvrage || !ouvrage.motifSource) return null;
      let grille = [];
      try { grille = window.BtpPriceGridManager.getGrid() || []; } catch (_) { return null; }
      let re;
      try { re = new RegExp(ouvrage.motifSource, 'i'); } catch (_) { return null; }

      for (const item of grille) {
        if (!item || !window.BtpPriceGridManager.estPrixArtisan(item.source)) continue;
        const unite = String(item.unit || '').toLowerCase();
        if (unite !== 'u' && unite !== 'unité' && unite !== 'unite') continue;
        const prix = parseFloat(item.price);
        if (!(prix > 0)) continue;
        if (re.test(String(item.label || ''))) return { prix: prix, label: item.label };
      }
      return null;
    },

    chiffrerUnitaire(texte) {
      const p = this.getProfile();
      const ouvrages = this.extraireOuvragesUnitaires(texte);
      if (!ouvrages.length) return null;

      const lignesDetail = [];
      const tarifsManquants = [];
      for (const o of ouvrages) {
        let pu = o.tarif ? parseFloat(p.tarifsPersonnalises[o.tarif]) : NaN;
        let desig = o.label;
        // Repli sur la grille de l'artisan : c'est elle qui debloque les
        // ouvrages sans tarif code en dur, avec SES prix.
        if (!(pu > 0)) {
          const g = this._tarifArtisanPourOuvrage(o);
          if (g) { pu = g.prix; desig = g.label; }
        }
        if (pu > 0) {
          lignesDetail.push({
            desig: desig,
            qte: `${o.quantite} u`,
            pu: pu,
            tot: Math.round(o.quantite * pu * 100) / 100
          });
        } else {
          tarifsManquants.push({ cle: o.cle, label: o.label, quantite: o.quantite });
        }
      }

      const totalHt = Math.round(lignesDetail.reduce((a, l) => a + l.tot, 0) * 100) / 100;
      if (!(totalHt > 0)) {
        // Rien de chiffrable, mais on a bien COMPRIS la demande : on remonte
        // quand meme ce qu'il manque pour que l'assistant sache quoi demander.
        return { titre: '', unite: 'u', quantite: null, surface: null, lignesDetail: [], totalHt: 0, tarifsManquants: tarifsManquants };
      }

      const tvaRate = 10;
      const tvaMontant = Math.round((totalHt * tvaRate / 100) * 100) / 100;
      return {
        titre: lignesDetail.length === 1 ? lignesDetail[0].desig : `Travaux a l'unite (${lignesDetail.length} postes)`,
        unite: 'u',
        quantite: null,
        surface: null,
        fournisseur: p.fournisseurPrefere || "",
        fournituresHt: 0,
        mainOeuvreHt: totalHt,
        totalHt: totalHt,
        tvaRate: tvaRate,
        tvaMontant: tvaMontant,
        totalTtc: Math.round((totalHt + tvaMontant) * 100) / 100,
        acompte30: Math.round(((totalHt + tvaMontant) * 0.30) * 100) / 100,
        margeEstimeePourcent: p.margeCiblePourcent,
        margeMontant: totalHt,
        lignesDetail: lignesDetail,
        tarifsManquants: tarifsManquants,
        dtuNorme: ""
      };
    },

    chiffrerChantier(typeTravaux, surfaceM2, options = {}) {
      const p = this.getProfile();

      // La quantite arrive soit en nombre (historique = m2), soit en objet
      // {valeur, unite}. On ne CONVERTIT JAMAIS un metre lineaire en metre
      // carre : une plinthe ne se chiffre pas a la surface, et traiter 100 ml
      // comme 100 m2 sortirait un devis faux en silence — exactement le defaut
      // des 20 m2 par defaut corrige le 29/08.
      if (surfaceM2 && typeof surfaceM2 === 'object') {
        const val = parseFloat(surfaceM2.valeur);
        if (!(val > 0)) return null;
        if (surfaceM2.unite === 'ml') return this._chiffrerLineaire(p, String(typeTravaux || ''), val);
        surfaceM2 = val;   // m2 : on retombe sur le chemin historique, inchange
      }

      // Pas de surface = pas de chiffrage. Cette fonction repliait sur 20 m2
      // quand l'appelant ne fournissait rien : elle sortait alors un devis
      // complet, avec un total, calcule sur une surface que personne n'avait
      // mesuree — et sans le dire. La surface est la seule quantite qui porte
      // tout le montant ; l'inventer en silence est le pire cas possible.
      // Le correctif avait ete fait le 29/08 sur UN des appelants (devis.html)
      // mais le defaut vivait aussi ici et dans bsChiffrerTexte. Corrige ici,
      // a la source, pour que tous les appelants en beneficient.
      const s = parseFloat(surfaceM2);
      if (!(s > 0)) return null;
      let result = {
        titre: "",
        surface: s,
        fournisseur: "",
        fournituresHt: 0,
        mainOeuvreHt: 0,
        totalHt: 0,
        tvaRate: 10,
        tvaMontant: 0,
        totalTtc: 0,
        acompte30: 0,
        margeEstimeePourcent: p.margeCiblePourcent,
        margeMontant: 0,
        lignesDetail: [],
        dtuNorme: ""
      };

      const t = typeTravaux.toLowerCase();

      if (t.includes("peint") || t.includes("tollens") || t.includes("mur") || t.includes("plafond")) {
        const cat = CATALOGUES_BTP.peinture;
        result.titre = `Travaux de Peinture & Preparations (${s.toFixed(1)} m2)`;
        result.fournisseur = cat.fournisseur;
        result.dtu = cat.dtu;

        const coutFournitureM2 = 1.20 + 3.60 + 2.38;
        result.fournituresHt = Math.round((s * coutFournitureM2 + 35.00) * 100) / 100;
        
        const tarifPose = p.tarifsPersonnalises.peinture_m2_pose || cat.poseM2Ht;
        result.mainOeuvreHt = Math.round((s * tarifPose) * 100) / 100;

        result.lignesDetail = [
          { desig: "Preparation des fonds, poncage, rebouchage et impression", qte: `${s.toFixed(1)} m2`, pu: 14.50, tot: s * 14.50 },
          { desig: "Application 2 couches finition velours (teinte au choix)", qte: `${s.toFixed(1)} m2`, pu: 18.00, tot: s * 18.00 },
          { desig: "Protection soignee des sols, plinthes et evacuation des dechets", qte: "1 forfait", pu: 95.00, tot: 95.00 }
        ];
      }
      else if (t.includes("carrel") || t.includes("sol") || t.includes("faience")) {
        const cat = CATALOGUES_BTP.carrelage;
        result.titre = `Fourniture & Pose de Carrelage Gres Cerame 60x60 (${s.toFixed(1)} m2)`;
        result.fournisseur = cat.fournisseur;
        result.dtu = cat.dtu;

        const coutFournitureM2 = 24.50 + 4.40 + 1.40;
        result.fournituresHt = Math.round((s * coutFournitureM2) * 100) / 100;
        
        const tarifPose = p.tarifsPersonnalises.carrelage_m2_pose || cat.poseM2Ht;
        result.mainOeuvreHt = Math.round((s * tarifPose) * 100) / 100;

        result.lignesDetail = [
          { desig: "Primaire d accroche et ragreage autolissant fibre P4", qte: `${s.toFixed(1)} m2`, pu: 18.00, tot: s * 18.00 },
          { desig: "Fourniture et pose collee carrelage gres cerame 60x60 R10 (colle C2S1)", qte: `${s.toFixed(1)} m2`, pu: 48.00, tot: s * 48.00 },
          { desig: "Realisation des joints hydrofuges fins haute resistance et plinthes assorties", qte: `${s.toFixed(1)} m2`, pu: 12.50, tot: s * 12.50 }
        ];
      }
      else if (t.includes("sdb") || t.includes("bain") || t.includes("douche")) {
        const cat = CATALOGUES_BTP.plomberie_sdb;
        result.titre = `Renovation Complete Salle de Bain & Douche Italienne (${s.toFixed(1)} m2)`;
        result.fournisseur = cat.fournisseur;
        result.dtu = cat.dtu;

        result.fournituresHt = 280 + 195 + 220 + 65;
        result.mainOeuvreHt = 1450.00;

        result.lignesDetail = [
          { desig: "Depose de l ancien equipement sanitaire et evacuation gravats", qte: "1 ens.", pu: 380.00, tot: 380.00 },
          { desig: "Fourniture et pose receveur resine extra-plat 90x120 + bonde grand debit", qte: "1 u", pu: 540.00, tot: 540.00 },
          { desig: "Colonne thermostatique + paroi verre securit 8 mm anticalcaire", qte: "1 ens.", pu: 680.00, tot: 680.00 },
          { desig: "Faience murale grand format + etancheite sous carrelage SPEC", qte: `${s.toFixed(1)} m2`, pu: 65.00, tot: s * 65.00 }
        ];
      }
      else {
        result.titre = `Travaux de Renovation Generale (${s.toFixed(1)} m2)`;
        result.fournisseur = "";
        result.dtu = "Regles professionnelles et normes DTU en vigueur";
        result.fournituresHt = Math.round(s * 18.00);
        result.mainOeuvreHt = Math.round(s * 42.00);
        result.lignesDetail = [
          { desig: "Preparation des supports et deposes prealables", qte: "1 forfait", pu: 250.00, tot: 250.00 },
          { desig: "Fourniture et mise en oeuvre des ouvrages selon regles de l art", qte: `${s.toFixed(1)} m2`, pu: 55.00, tot: s * 55.00 }
        ];
      }

      result.totalHt = result.lignesDetail.reduce((acc, l) => acc + l.tot, 0);
      result.tvaMontant = Math.round((result.totalHt * (result.tvaRate / 100)) * 100) / 100;
      result.totalTtc = Math.round((result.totalHt + result.tvaMontant) * 100) / 100;
      result.acompte30 = Math.round((result.totalTtc * 0.30) * 100) / 100;
      result.margeMontant = Math.round((result.totalHt - result.fournituresHt) * 100) / 100;
      result.margeEstimeePourcent = Math.round(((result.margeMontant / result.totalHt) * 100) * 10) / 10;

      return result;
    },

    // Chiffrage au METRE LINEAIRE.
    //
    // ⚠️ On ne chiffre ici QUE ce dont on a reellement le prix de l'artisan :
    // la PEINTURE de plinthes. Pour une fourniture-pose de plinthes, aucun
    // tarif au ml ne nous appartient — en inventer un serait exactement le
    // defaut corrige le 31/08 (« les prix de l'ARTISAN, jamais un catalogue »).
    // Dans ce cas on rend null, et c'est le modele qui demande son tarif.
    _chiffrerLineaire(p, typeTravaux, ml) {
      const t = typeTravaux.toLowerCase();
      if (!this.estOuvrageLineaire(t)) return null;
      if (!/peint|laqu|vernis/i.test(t)) return null;

      const tarif = p.tarifsPersonnalises.plinthes_ml_peinture || 6.00;
      const totalHt = Math.round(ml * tarif * 100) / 100;
      if (!(totalHt > 0)) return null;

      const tvaRate = 10;
      const tvaMontant = Math.round((totalHt * tvaRate / 100) * 100) / 100;
      return {
        titre: `Peinture de plinthes (${ml.toFixed(1)} ml)`,
        quantite: ml,
        unite: 'ml',
        surface: null,          // ce n'est PAS une surface : ne pas l'afficher en m2
        fournisseur: p.fournisseurPrefere || "",
        fournituresHt: 0,       // aucun cout fourniture connu : on n'en invente pas
        mainOeuvreHt: totalHt,
        totalHt: totalHt,
        tvaRate: tvaRate,
        tvaMontant: tvaMontant,
        totalTtc: Math.round((totalHt + tvaMontant) * 100) / 100,
        acompte30: Math.round(((totalHt + tvaMontant) * 0.30) * 100) / 100,
        margeEstimeePourcent: p.margeCiblePourcent,
        margeMontant: totalHt,
        lignesDetail: [
          { desig: "Peinture de plinthes (preparation, egrenage et 2 couches)", qte: `${ml.toFixed(1)} ml`, pu: tarif, tot: totalHt }
        ],
        dtuNorme: ""
      };
    }
  };


})();


  // PILIER 4 : GESTIONNAIRE DE GRILLE TARIFAIRE PERSONNALISÉE
  const PRICE_GRID_STORAGE_KEY = 'batispot_artisan_price_grid_v1';

  // Sources qui font d'une ligne un prix DE L'ARTISAN — la liste de reference
  // de toute l'application (app-actions.js, devis.html, app-import-devis.js s'y
  // referent). « Saisie Artisan » : tapee ou importee par lui. « Ajuste
  // manuellement » : une ligne du catalogue qu'il a corrigee, donc devenue
  // sienne. « Assistant » (05/09/2026) : un prix qu'il a DICTE a l'assistant,
  // qui n'en invente jamais aucun. « Catalogue BatiSpot » n'y est pas et n'y
  // sera jamais : ce sont les 10 lignes livrees avec l'application.
  const SOURCES_ARTISAN = ['Saisie Artisan', 'Ajusté manuellement', 'Assistant'];
  function estPrixArtisan(source) { return SOURCES_ARTISAN.indexOf(source) !== -1; }

  const DEFAULT_PRICE_GRID = [
    { id: "peinture_murs", label: "Peinture murs, 2 couches finition velours", unit: "m²", price: 32.50, category: "Peinture", source: "Catalogue BatiSpot" },
    { id: "peinture_plafond", label: "Peinture plafond, mat sans traces", unit: "m²", price: 38.00, category: "Peinture", source: "Catalogue BatiSpot" },
    { id: "ratissage_enduit", label: "Ratissage et lissage, 2 passes", unit: "m²", price: 24.00, category: "Préparation", source: "Catalogue BatiSpot" },
    { id: "carrelage_sol", label: "Pose collée carrelage grès cérame 60x60", unit: "m²", price: 48.00, category: "Carrelage", source: "Catalogue BatiSpot" },
    { id: "faience_murale", label: "Pose Faïence Murale & joints hydrofuges", unit: "m²", price: 55.00, category: "Carrelage", source: "Catalogue BatiSpot" },
    { id: "ragreage_p4", label: "Ragréage autolissant fibré P4", unit: "m²", price: 18.00, category: "Préparation", source: "Catalogue BatiSpot" },
    { id: "receveur_douche", label: "Fourniture & pose receveur résine 90x120 extra-plat", unit: "u", price: 540.00, category: "Plomberie", source: "Catalogue BatiSpot" },
    { id: "depose_sanitaire", label: "Dépose sanitaire / baignoire et évacuation déchetterie", unit: "forfait", price: 380.00, category: "Démolition", source: "Catalogue BatiSpot" },
    { id: "tableau_electrique", label: "Remplacement tableau électrique, 4 rangées", unit: "u", price: 1350.00, category: "Électricité", source: "Catalogue BatiSpot" },
    { id: "parquet_flottant", label: "Pose Parquet contrecollé / stratifié avec sous-couche", unit: "m²", price: 28.00, category: "Sol", source: "Catalogue BatiSpot" }
  ];

  // ── Synchronisation des prix de l'artisan avec la base ────────────────────
  // Jusqu'ici tout vivait en localStorage : l'artisan perdait ses tarifs en
  // changeant de telephone ou en vidant son cache. On lui demandait de saisir
  // une donnee qu'on ne savait pas garder.
  //
  // Seules SES lignes voyagent (source « Saisie Artisan ») : le catalogue par
  // defaut reste dans le code, il ne lui appartient pas.
  //
  // Ce fichier est un script classique : on parle a l'API REST directement,
  // avec le jeton de session expose par app-assistant.js. Tout echec est
  // silencieux et non bloquant — un artisan sur chantier, sans reseau, doit
  // pouvoir continuer a chiffrer.
  function bsPrixEndpoint() {
    const cfg = window.__BATISPOT_CONFIG__ || {};
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return null;
    const jwt = (typeof window.bsJetonSession === 'function') ? window.bsJetonSession() : null;
    if (!jwt) return null; // pas de session : on reste en local, sans bruit
    return {
      url: cfg.SUPABASE_URL + '/rest/v1/artisan_prix',
      headers: {
        apikey: cfg.SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + jwt,
        'Content-Type': 'application/json',
      },
    };
  }

  async function bsPrixTirerDuCloud() {
    const e = bsPrixEndpoint();
    if (!e) return null;
    try {
      const r = await fetch(e.url + '?select=label,unit,price,categorie', { headers: e.headers });
      if (!r.ok) return null;
      const rows = await r.json();
      return Array.isArray(rows) ? rows : null;
    } catch (_) { return null; }
  }

  async function bsPrixPousserAuCloud(item) {
    const e = bsPrixEndpoint();
    if (!e || !item || !item.label) return false;
    try {
      // on_conflict sur (user_id,label) : on met a jour au lieu de dupliquer.
      const r = await fetch(e.url + '?on_conflict=user_id,label', {
        method: 'POST',
        headers: Object.assign({}, e.headers, { Prefer: 'resolution=merge-duplicates' }),
        body: JSON.stringify({
          label: String(item.label).slice(0, 120),
          unit: item.unit || 'u',
          price: Number(item.price),
          categorie: item.category || item.categorie || null,
        }),
      });
      return r.ok;
    } catch (_) { return false; }
  }

  window.BtpPriceGridManager = {
    SOURCES_ARTISAN: SOURCES_ARTISAN,
    estPrixArtisan: estPrixArtisan,

    getGrid() {
      const saved = localStorage.getItem(PRICE_GRID_STORAGE_KEY);
      if (!saved) {
        localStorage.setItem(PRICE_GRID_STORAGE_KEY, JSON.stringify(DEFAULT_PRICE_GRID));
        return DEFAULT_PRICE_GRID;
      }
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_PRICE_GRID;
      }
    },

    saveGrid(grid) {
      localStorage.setItem(PRICE_GRID_STORAGE_KEY, JSON.stringify(grid));
    },

    addOrUpdateItem(id, label, unit, price, category = "Général", source = "Saisie Artisan") {
      // Ce que l'artisan saisit part aussi en base, pour survivre au changement
      // d'appareil. Sans reseau, la copie locale suffit et la remontee se fera
      // a la prochaine saisie.
      if (estPrixArtisan(source)) {
        bsPrixPousserAuCloud({ label, unit, price, category });
      }
      const grid = this.getGrid();
      const existing = grid.find(item => item.id === id || item.label.toLowerCase() === label.toLowerCase());
      if (existing) {
        existing.price = parseFloat(price);
        existing.unit = unit;
        existing.source = source;
      } else {
        grid.push({
          id: id || "item_" + Date.now(),
          label: label,
          unit: unit,
          price: parseFloat(price),
          category: category,
          source: source
        });
      }
      this.saveGrid(grid);
      return grid;
    },

    deleteItem(id) {
      let grid = this.getGrid();
      grid = grid.filter(item => item.id !== id);
      this.saveGrid(grid);
      return grid;
    }
  };

  // Au chargement, on ramene les prix stockes en base et on les fusionne dans
  // la copie locale. C'est ce qui fait qu'un artisan qui change de telephone
  // retrouve ses tarifs. En cas d'echec — pas de session, pas de reseau — on
  // ne fait rien et l'app continue sur la copie locale.
  // Differe au DOMContentLoaded : ce fichier est charge AVANT
  // app-assistant.js, qui expose bsJetonSession. Sans ce report,
  // l'hydratation partirait sans jeton et ne ramenerait rien.
  async function bsHydraterPrixArtisan() {
    try {
      const distants = await bsPrixTirerDuCloud();
      if (!distants || !distants.length) return;
      const grille = window.BtpPriceGridManager.getGrid() || [];
      let change = false;
      for (const d of distants) {
        if (!d || !d.label || !(Number(d.price) > 0)) continue;
        const existant = grille.find(function (x) {
          return x && String(x.label).toLowerCase() === String(d.label).toLowerCase();
        });
        if (existant) {
          // La base fait autorite : c'est elle qui a survecu au changement
          // d'appareil, pas le localStorage de celui-ci.
          if (Number(existant.price) !== Number(d.price) || !estPrixArtisan(existant.source)) {
            existant.price = Number(d.price);
            existant.unit = d.unit || existant.unit;
            // Une source artisan deja posee ('Assistant', 'Ajuste manuellement')
            // est PLUS precise que ce que la base sait dire : on la garde.
            if (!estPrixArtisan(existant.source)) existant.source = 'Saisie Artisan';
            change = true;
          }
        } else {
          grille.push({
            id: 'cloud_' + String(d.label).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40),
            label: d.label, unit: d.unit || 'u', price: Number(d.price),
            category: d.categorie || 'Général', source: 'Saisie Artisan',
          });
          change = true;
        }
      }
      if (change) window.BtpPriceGridManager.saveGrid(grille);
    } catch (_) { /* silencieux : ne jamais empecher l'app de demarrer */ }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bsHydraterPrixArtisan, { once: true });
  } else {
    bsHydraterPrixArtisan();
  }

  // PILIER 5 : IMPORT D'ANCIENS DEVIS / FACTURES
  //
  // window.BtpCrmImporter SUPPRIME le 31/08. Ce n'etait pas un moteur d'import :
  // parsePreviousQuotes() ignorait le fichier recu et renvoyait cinq lignes
  // ecrites en dur, plus "18 tarifs extraits", un taux horaire de 46,50 EUR/h et
  // une marge de 54,2 % — trois chiffres qui ne venaient d'aucun document. Le
  // bloc d'interface qui l'appelait avait ete retire le 22/08, mais la fonction
  // restait chargee sur toutes les pages de l'app.
  //
  // L'import reel vit desormais dans devis.html (bsImporterAncienDevis) et
  // s'appuie sur le mode serveur parse-devis de l'Edge Function gemini-assistant.
  // Il ne renvoie que des prix effectivement lus sur le document, et n'ecrit
  // dans la grille qu'apres validation ligne a ligne par l'artisan.

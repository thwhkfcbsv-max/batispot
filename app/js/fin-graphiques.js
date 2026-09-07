// ═══════════════════════════════════════════════════════════════════════════
// Graphiques Finances — dessin pur, sans acces aux donnees.
//
// POURQUOI CE MODULE (02/09/2026)
// Les memes graphiques sont rendus a deux endroits : deplies sous les tuiles
// de l'ecran Finances, et en pleine page sur analyses.html. Les ecrire deux
// fois, c'est se garantir qu'une correction n'atterrira que d'un cote — le
// motif qui a deja coute cher ici (un correctif applique a un seul appelant).
//
// Chaque fonction recoit ses DONNEES et son ELEMENT CIBLE. Aucune ne va
// chercher quoi que ce soit toute seule : les pages restent maitresses de ce
// qu'elles chargent.
//
// REGLE QUI NE BOUGE PAS : une fonction qui n'a rien d'honnete a montrer
// renvoie `false` et ne dessine rien. Elle n'invente jamais un zero.
// ═══════════════════════════════════════════════════════════════════════════

const SVGNS = 'http://www.w3.org/2000/svg';

// Palette categorielle passee au controle daltonisme + contraste sur fond
// blanc. Le vert de marque garde le premier poste, presque toujours le plus
// gros. Ne pas y ajouter une 7e teinte : au-dela, les parts se confondent.
export const COULEURS = ['#228B5B', '#0891B2', '#C2410C', '#7C3AED', '#A16207', '#BE185D'];

export const eur = (n) => (Number(n) || 0).toLocaleString('fr-FR', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
});

function el(nom, attrs, texte) {
  const n = document.createElementNS(SVGNS, nom);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (texte != null) n.textContent = texte;
  return n;
}

function vider(n) { while (n.firstChild) n.removeChild(n.firstChild); }

// ── Courbe : signe contre depenses, six mois glissants ─────────────────────
export function courbe(svg, mois, opts = {}) {
  if (!svg || !mois || mois.length < 2) return false;   // un point ne fait pas une courbe
  vider(svg);
  const max = Math.max(...mois.map((m) => Math.max(m.signe, m.depense)));
  // Une courbe plate a zero se lit comme une activite nulle, alors qu'il n'y a
  // que l'absence de donnees. On prefere ne rien dessiner.
  if (!(max > 0)) return false;

  const H = opts.hauteur || 176;
  const L = opts.largeur || 340;
  svg.setAttribute('viewBox', `0 0 ${L} ${H}`);
  const X0 = 40, X1 = L - 8, Y0 = 16, Y1 = H - 46;
  const x = (i) => X0 + (i * (X1 - X0)) / (mois.length - 1);
  const y = (v) => Y1 - (v / max) * (Y1 - Y0);

  // Arrondir systematiquement au millier affichait « 2k / 1k / 1k / 0k » chez
  // un artisan a 2 178 EUR : deux graduations identiques et un zero deguise.
  const graduation = (v) => {
    if (v <= 0) return '0';
    if (max >= 10000) return Math.round(v / 1000) + 'k';
    if (max >= 2000) return (Math.round(v / 100) / 10).toFixed(1).replace('.', ',') + 'k';
    return String(Math.round(v / 10) * 10);
  };
  for (let g = 0; g <= 3; g++) {
    const yy = Y0 + (g * (Y1 - Y0)) / 3;
    svg.appendChild(el('line', { x1: X0, y1: yy, x2: X1, y2: yy, stroke: '#EEF3F0', 'stroke-width': 1 }));
    svg.appendChild(el('text', { x: X0 - 6, y: yy + 3.5, 'text-anchor': 'end', 'font-size': 9, fill: '#5A7268' },
      graduation((max * (3 - g)) / 3)));
  }

  svg.appendChild(el('path', {
    d: 'M' + mois.map((m, i) => `${x(i)},${y(m.signe)}`).join(' L') + ` L${X1},${Y1} L${X0},${Y1} Z`,
    fill: COULEURS[0], opacity: '0.08',
  }));
  [['signe', COULEURS[0]], ['depense', COULEURS[2]]].forEach(([cle, couleur]) => {
    svg.appendChild(el('path', {
      d: 'M' + mois.map((m, i) => `${x(i)},${y(m[cle])}`).join(' L'),
      fill: 'none', stroke: couleur, 'stroke-width': 2,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    }));
    const d = mois.length - 1;
    svg.appendChild(el('circle', {
      cx: x(d), cy: y(mois[d][cle]), r: 4, fill: '#FFFFFF', stroke: couleur, 'stroke-width': 2.5,
    }));
  });

  // Axe des abscisses : on n'affiche PAS tous les labels.
  //
  // A treize mois ou onze semaines sur 292 px utiles, ils se chevauchaient et
  // devenaient illisibles. On calcule combien en tiennent, et on n'en garde
  // qu'un sur N — en gardant toujours le PREMIER et le DERNIER, qui bornent
  // la lecture. Les points intermediaires restent traces, seul l'etiquetage
  // s'allege.
  const largeurUtile = X1 - X0;
  const largeurLabel = mois[0].label.length > 4 ? 34 : 26;   // « 31/08 » vs « août »
  const tiennent = Math.max(2, Math.floor(largeurUtile / largeurLabel));
  const pasLabel = Math.ceil(mois.length / tiennent);

  mois.forEach((m, i) => {
    const dernier = i === mois.length - 1;
    const garde = dernier || i % pasLabel === 0;
    if (!garde) return;
    // Si l'avant-dernier retenu tombe trop pres du dernier, on le saute :
    // deux etiquettes collees valent moins qu'une seule lisible.
    if (!dernier && (mois.length - 1 - i) < pasLabel * 0.6) return;
    svg.appendChild(el('text', {
      x: x(i), y: Y1 + 18,
      'text-anchor': dernier ? 'end' : (i === 0 ? 'start' : 'middle'),
      'font-size': 9.5, fill: '#5A7268',
    }, m.label));
  });

  // Reperes discrets sous CHAQUE point, meme non etiquete : la position reste
  // lisible sans encombrer.
  if (mois.length > tiennent) {
    mois.forEach((m, i) => {
      svg.appendChild(el('line', {
        x1: x(i), y1: Y1, x2: x(i), y2: Y1 + 3.5,
        stroke: '#D3E3DA', 'stroke-width': 1,
      }));
    });
  }
  // La derniere tranche est souvent incomplete : sans ce mot, un artisan lit
  // une chute d'activite le 2 du mois. On ne l'affiche que si la periode va
  // bien jusqu'a aujourd'hui.
  if (opts.derniereIncomplete) {
    svg.appendChild(el('text', {
      x: X1, y: Y1 + 34, 'text-anchor': 'end', 'font-size': 8.5, fill: '#5A7268', 'font-style': 'italic',
    }, opts.derniereIncomplete));
  }
  return true;
}

// ── Camembert : depenses par poste ─────────────────────────────────────────
export function postes(svg, liste, dep) {
  if (!svg || !liste) return false;
  vider(svg); vider(liste);

  const parPoste = new Map();
  (dep || []).forEach((d) => {
    const nom = (d.categorie || 'Autre').trim() || 'Autre';
    parPoste.set(nom, (parPoste.get(nom) || 0) + (Number(d.montant_ht) || 0));
  });
  let parts = [...parPoste.entries()].map(([nom, montant]) => ({ nom, montant }))
    .filter((p) => p.montant > 0).sort((a, b) => b.montant - a.montant);
  const total = parts.reduce((s, p) => s + p.montant, 0);
  if (!parts.length || !(total > 0)) return false;

  // Au-dela de six parts, les tranches deviennent indistinguables : on
  // regroupe plutot que de sortir une septieme couleur.
  if (parts.length > 6) {
    const reste = parts.slice(5).reduce((s, p) => s + p.montant, 0);
    parts = parts.slice(0, 5).concat([{ nom: 'Autres', montant: reste }]);
  }

  const R = 58, C = 2 * Math.PI * R;
  svg.setAttribute('viewBox', '0 0 150 150');
  const g = el('g', { transform: 'translate(75,75) rotate(-90)', fill: 'none', 'stroke-width': 21 });
  let offset = 0;
  parts.forEach((p, i) => {
    const part = (p.montant / total) * C;
    const trait = Math.max(part - 2, 0.6);   // 2px de respiration entre les parts
    g.appendChild(el('circle', {
      r: R, stroke: COULEURS[i % COULEURS.length],
      'stroke-dasharray': `${trait} ${C - trait}`, 'stroke-dashoffset': -offset,
    }));
    offset += part;
  });
  svg.appendChild(g);
  svg.appendChild(el('text', { x: 75, y: 71, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: '#1C2B22' },
    Math.round(total).toLocaleString('fr-FR')));
  svg.appendChild(el('text', { x: 75, y: 87, 'text-anchor': 'middle', 'font-size': 10, fill: '#5A7268' }, 'euros HT'));

  // La couleur n'est jamais la seule information : chaque part est nommee et
  // chiffree a cote.
  parts.forEach((p, i) => {
    const l = document.createElement('div');
    l.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12.5px;';
    const pastille = document.createElement('i');
    pastille.style.cssText = `width:10px;height:10px;border-radius:3px;flex:none;background:${COULEURS[i % COULEURS.length]}`;
    const nom = document.createElement('span');
    nom.style.cssText = 'flex:1;color:#3D5A4E;'; nom.textContent = p.nom;
    const val = document.createElement('strong');
    val.style.cssText = 'color:#1C2B22;font-variant-numeric:tabular-nums;'; val.textContent = eur(p.montant);
    l.append(pastille, nom, val);
    liste.appendChild(l);
  });
  return true;
}

// ── Marge par chantier ─────────────────────────────────────────────────────
export function marges(zone, acceptes, dep, limite = 5) {
  if (!zone) return false;
  vider(zone);

  // Meme regle que le compteur : seuls les chantiers qui ont A LA FOIS un
  // devis accepte et des depenses rattachees. Sans depense, on afficherait
  // 100 % de marge, et ce serait faux.
  const parChantier = new Map();
  (acceptes || []).forEach((d) => {
    if (!d.chantier_id) return;
    const e = parChantier.get(d.chantier_id)
      || { nom: (d.chantiers && d.chantiers.client_name) || 'Chantier', ca: 0, dep: 0 };
    e.ca += Number(d.total_ht) || 0;
    parChantier.set(d.chantier_id, e);
  });
  (dep || []).forEach((x) => {
    if (!x.chantier_id || !parChantier.has(x.chantier_id)) return;
    parChantier.get(x.chantier_id).dep += Number(x.montant_ht) || 0;
  });

  const lignes = [...parChantier.values()]
    .filter((c) => c.ca > 0 && c.dep > 0)
    .map((c) => ({ ...c, taux: Math.round(((c.ca - c.dep) / c.ca) * 100) }))
    .sort((a, b) => b.taux - a.taux).slice(0, limite);
  if (!lignes.length) return false;

  lignes.forEach((c) => {
    // Seuil a 20 % : en dessous, la marge est signalee. C'est un repere
    // visuel, pas un jugement comptable.
    const alerte = c.taux < 20;
    const bloc = document.createElement('div');
    const haut = document.createElement('div');
    haut.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:12.5px;margin-bottom:6px;';
    const nom = document.createElement('span');
    nom.style.color = '#3D5A4E'; nom.textContent = c.nom;
    const val = document.createElement('strong');
    val.style.cssText = `color:${alerte ? '#B45309' : '#0F5132'};font-variant-numeric:tabular-nums;`;
    val.textContent = `${c.taux} %`;
    haut.append(nom, val);
    const piste = document.createElement('div');
    piste.style.cssText = 'height:8px;background:#EEF3F0;border-radius:99px;overflow:hidden;';
    const jauge = document.createElement('div');
    jauge.style.cssText = `height:100%;border-radius:99px;background:${alerte ? '#B45309' : COULEURS[0]};`
      + `width:${Math.max(Math.min(c.taux, 100), 0)}%;`;
    piste.appendChild(jauge);
    bloc.append(haut, piste);
    zone.appendChild(bloc);
  });
  return true;
}

// ── Entonnoir des devis ────────────────────────────────────────────────────
// Le seul bloc qui parle des le premier devis, sans attendre aucun ticket.
export function devis(zone, kpis, liste) {
  if (!zone) return false;
  vider(zone); if (kpis) vider(kpis);
  if (!liste || !liste.length) return false;

  const compte = (st) => liste.filter((d) => d.status === st).length;
  // Ici la couleur porte un JUGEMENT (accepte / refuse), pas une identite :
  // ce sont donc les couleurs de STATUT de l'app, jamais celles du camembert.
  const etapes = [
    { cle: 'brouillon', lib: 'brouillons', couleur: '#5A7268' },
    { cle: 'envoye', lib: 'envoyés', couleur: '#0891B2' },
    { cle: 'accepte', lib: 'acceptés', couleur: '#15803D' },
    { cle: 'refuse', lib: 'refusés', couleur: '#DC2626' },
    { cle: 'expire', lib: 'expirés', couleur: '#B45309' },
  ].map((e) => ({ ...e, n: compte(e.cle) })).filter((e) => e.n > 0);
  const max = Math.max(...etapes.map((e) => e.n), 1);

  etapes.forEach((e) => {
    const l = document.createElement('div');
    l.style.cssText = 'display:flex;align-items:center;gap:10px;';
    const barre = document.createElement('div');
    barre.style.cssText = `height:26px;border-radius:7px;background:${e.couleur};color:#FFF;`
      + 'display:flex;align-items:center;padding:0 9px;font-size:12.5px;font-weight:800;'
      + `min-width:32px;width:${Math.max((e.n / max) * 60, 11)}%;`;
    barre.textContent = String(e.n);
    const lib = document.createElement('span');
    lib.style.cssText = 'font-size:12.5px;color:#3D5A4E;'; lib.textContent = e.lib;
    l.append(barre, lib);
    zone.appendChild(l);
  });

  if (kpis) {
    const tuile = (libelle, valeur, detail) => {
      const b = document.createElement('div');
      b.className = 'fin-box';
      const v = document.createElement('span');
      v.className = 'fin-val'; v.style.color = '#0F5132'; v.textContent = valeur;
      const l = document.createElement('span');
      l.className = 'fin-lbl'; l.textContent = libelle;
      b.append(v, l);
      if (detail) {
        const d = document.createElement('span');
        d.style.cssText = 'font-size:10.5px;color:#5A7268;'; d.textContent = detail;
        b.appendChild(d);
      }
      return b;
    };
    // Le taux ne se calcule que sur les devis REELLEMENT TRANCHES : compter
    // les brouillons et les envoyes en attente le ferait chuter sans raison.
    const tranches = compte('accepte') + compte('refuse') + compte('expire');
    if (tranches > 0) {
      kpis.appendChild(tuile('Taux d’acceptation',
        Math.round((compte('accepte') / tranches) * 100) + ' %',
        `${compte('accepte')} sur ${tranches} tranchés`));
    }
    // Un brouillon jamais envoye, c'est du travail deja fait qui ne rapporte
    // rien : l'information la plus actionnable de l'ecran.
    if (compte('brouillon') > 0) {
      kpis.appendChild(tuile('Jamais envoyés', String(compte('brouillon')), 'à relancer'));
    }
  }
  return true;
}

// ── Signe par client ───────────────────────────────────────────────────────
export function clients(zone, badge, acceptes, limite = 6) {
  if (!zone) return false;
  vider(zone);

  const parClient = new Map();
  (acceptes || []).forEach((d) => {
    const nom = (d.chantiers && d.chantiers.client_name) || 'Client non nommé';
    parClient.set(nom, (parClient.get(nom) || 0) + (Number(d.total_ttc) || 0));
  });
  const liste = [...parClient.entries()].map(([nom, montant]) => ({ nom, montant }))
    .filter((c) => c.montant > 0).sort((a, b) => b.montant - a.montant).slice(0, limite);
  if (!liste.length) return false;

  const total = liste.reduce((s, c) => s + c.montant, 0);
  if (badge) badge.textContent = `${liste.length} client(s) · ${eur(total)}`;
  const max = liste[0].montant;

  // Une seule teinte qui palit : les clients n'ont pas d'identite a retenir,
  // ce qu'on compare est une grandeur. Le camembert des postes reste ainsi le
  // seul bloc colore de l'ecran.
  liste.forEach((c, i) => {
    const bloc = document.createElement('div');
    const haut = document.createElement('div');
    haut.style.cssText = 'display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:12.5px;margin-bottom:6px;';
    const nom = document.createElement('span');
    nom.style.color = '#3D5A4E'; nom.textContent = c.nom;
    const val = document.createElement('strong');
    val.style.cssText = 'color:#1C2B22;font-variant-numeric:tabular-nums;'; val.textContent = eur(c.montant);
    haut.append(nom, val);
    const piste = document.createElement('div');
    piste.style.cssText = 'height:8px;background:#EEF3F0;border-radius:99px;overflow:hidden;';
    const jauge = document.createElement('div');
    jauge.style.cssText = `height:100%;border-radius:99px;background:${COULEURS[0]};`
      + `opacity:${Math.max(1 - i * 0.14, 0.4)};width:${Math.max((c.montant / max) * 100, 3)}%;`;
    piste.appendChild(jauge);
    bloc.append(haut, piste);
    zone.appendChild(bloc);
  });

  // Un client qui pese plus de 40 % du signe, c'est une dependance. Un artisan
  // ne la calcule jamais lui-meme.
  const part = Math.round((liste[0].montant / total) * 100);
  if (liste.length > 1 && part >= 40) {
    const note = document.createElement('p');
    note.style.cssText = 'font-size:11.5px;color:#B45309;margin:2px 0 0;font-weight:600;';
    note.textContent = `${liste[0].nom} représente ${part} % de votre signé sur la période.`;
    zone.appendChild(note);
  }
  return true;
}

// ── Serie temporelle SUR LA PERIODE CHOISIE ────────────────────────────────
//
// Avant, la courbe etait figee sur six mois glissants — a cote d'un filtre de
// periode, ca n'avait aucun sens : on choisissait « ce mois » et la courbe
// montrait toujours la meme chose.
//
// Elle suit maintenant le filtre, avec un decoupage adapte a la duree :
//   - jusqu'a ~10 semaines  -> par SEMAINE  (un mois seul aurait 1 point)
//   - au-dela               -> par MOIS
// Renvoie aussi un `pas` pour que la page puisse titrer honnetement.
export function serie(tousDevis, toutesDepenses, dateAchat, d1, d2) {
  const jours = Math.max(1, Math.round((d2 - d1) / 86400000));
  const parSemaine = jours <= 70;
  const points = [];

  const sommeSigne = (a, b) => (tousDevis || [])
    .filter((q) => q.status === 'accepte')
    .filter((q) => { const t = new Date(q.accepted_at || q.created_at); return t >= a && t < b; })
    .reduce((s, q) => s + (Number(q.total_ttc) || 0), 0);
  const sommeDep = (a, b) => (toutesDepenses || [])
    .filter((x) => { const t = dateAchat ? dateAchat(x) : new Date(x.date_achat); return t >= a && t < b; })
    .reduce((s, x) => s + (Number(x.montant_ttc) || Number(x.montant_ht) || 0), 0);

  if (parSemaine) {
    // On demarre au lundi qui precede, pour que les semaines soient entieres.
    const debut = new Date(d1);
    const decalage = (debut.getDay() + 6) % 7;
    debut.setDate(debut.getDate() - decalage);
    debut.setHours(0, 0, 0, 0);
    for (let t = new Date(debut); t < d2; t.setDate(t.getDate() + 7)) {
      const fin = new Date(t); fin.setDate(fin.getDate() + 7);
      points.push({
        label: `${String(t.getDate()).padStart(2, '0')}/${String(t.getMonth() + 1).padStart(2, '0')}`,
        signe: sommeSigne(new Date(t), fin), depense: sommeDep(new Date(t), fin),
      });
    }
  } else {
    for (let t = new Date(d1.getFullYear(), d1.getMonth(), 1); t < d2; t.setMonth(t.getMonth() + 1)) {
      const fin = new Date(t.getFullYear(), t.getMonth() + 1, 1);
      points.push({
        label: t.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
        signe: sommeSigne(new Date(t), fin), depense: sommeDep(new Date(t), fin),
      });
    }
  }
  // Un seul point ne fait pas une courbe : on n'en dessine pas.
  return { points, pas: parSemaine ? 'semaine' : 'mois' };
}

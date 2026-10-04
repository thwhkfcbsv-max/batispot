// Lire une facture électronique reçue — Factur-X, CII ou UBL (13/09/2026).
//
// POURQUOI
// Depuis le 01/09/2026 les fournisseurs de l'artisan lui envoient des factures
// électroniques. Le PDF qu'il reçoit N'EST PAS un PDF ordinaire : il porte, caché
// à l'intérieur, un fichier XML qui dit tout — le fournisseur, les lignes, la TVA,
// l'échéance. Ce module l'extrait et le traduit, pour qu'une facture fournisseur
// devienne une dépense sans que l'artisan tape un chiffre.
//
// Ça marche quelle que soit la plateforme de l'artisan, et même s'il n'en a pas :
// le fichier est dans sa boîte mail, il le dépose, on le lit. C'est le seul chemin
// qui ne dépend d'aucun contrat.
//
// TROIS CHOIX ASSUMÉS
// 1. Pas de bibliothèque PDF. On ne cherche pas à afficher le PDF, seulement à en
//    extraire une pièce jointe. On décompresse donc tous ses flux et on garde celui
//    qui contient une facture. Brutal, mais court, sans dépendance, et insensible
//    aux variantes de structure PDF (xref classique ou flux d'objets).
// 2. Pas de DOMParser. Un lecteur XML de cinquante lignes, qui ignore les préfixes
//    de namespace (`rsm:`, `ram:`, `cbc:`…) — c'est exactement ce qui casse le plus
//    souvent quand un émetteur change ses préfixes, et ils en ont le droit.
// 3. On ne recalcule RIEN. Les totaux sont ceux du fournisseur. Si sa somme est
//    fausse, c'est SA facture qui est fausse : on le signale (`incoherences`), on ne
//    la corrige pas en silence.

// ── Lecteur XML minimal, sans namespaces ────────────────────────────────────
// Rend un arbre { nom, attrs, enfants, texte }. `nom` est le nom LOCAL : pour
// <ram:SellerTradeParty> c'est 'SellerTradeParty'.
function parserXML(src) {
  const racine = { nom: '#racine', attrs: {}, enfants: [], texte: '' };
  const pile = [racine];
  const jeton = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<\/\s*([^\s>]+)\s*>|<([^\s/>!?]+)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>|([^<]+)/g;
  let m;
  while ((m = jeton.exec(src)) !== null) {
    const [tout, cdata, fermant, ouvrant, attrsBruts, autoFerme, texte] = m;
    const sommet = pile[pile.length - 1];
    if (cdata !== undefined) { sommet.texte += cdata; continue; }
    if (texte !== undefined) { sommet.texte += texte; continue; }
    if (fermant !== undefined) { if (pile.length > 1) pile.pop(); continue; }
    if (ouvrant === undefined) continue;       // commentaire, instruction
    const noeud = { nom: local(ouvrant), attrs: attributs(attrsBruts || ''), enfants: [], texte: '' };
    sommet.enfants.push(noeud);
    if (!autoFerme) pile.push(noeud);
  }
  return racine;
}

const local = (n) => (n.includes(':') ? n.slice(n.indexOf(':') + 1) : n);

function attributs(src) {
  const out = {};
  const re = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(src)) !== null) out[local(m[1])] = deséchapper(m[3] ?? m[4] ?? '');
  return out;
}

const deséchapper = (s) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&amp;/g, '&');

// ── Navigation ──────────────────────────────────────────────────────────────
/** Premier descendant au chemin donné : ch(racine, 'ExchangedDocument', 'ID'). */
function ch(noeud, ...noms) {
  let n = noeud;
  for (const nom of noms) {
    if (!n) return null;
    n = n.enfants.find((e) => e.nom === nom) || null;
  }
  return n;
}
/** Tous les enfants directs portant ce nom, au bout du chemin. */
function tous(noeud, ...noms) {
  const dernier = noms.pop();
  const parent = noms.length ? ch(noeud, ...noms) : noeud;
  return parent ? parent.enfants.filter((e) => e.nom === dernier) : [];
}
/** Premier descendant de ce nom à N'IMPORTE QUELLE profondeur. À n'utiliser que
 *  là où le nom est sans ambiguïté dans tout le document. */
function profond(noeud, nom) {
  if (!noeud) return null;
  for (const e of noeud.enfants) {
    if (e.nom === nom) return e;
    const t = profond(e, nom);
    if (t) return t;
  }
  return null;
}
const txt = (n) => (n ? deséchapper(n.texte).trim() : '');
const nb = (n) => { const v = parseFloat(txt(n)); return Number.isFinite(v) ? v : null; };

/** AAAAMMJJ (CII, format 102) ou AAAA-MM-JJ (UBL) → AAAA-MM-JJ. */
function date(v) {
  const s = String(v || '').trim();
  let m = /^(\d{4})-?(\d{2})-?(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// ── Extraction du XML enfoui dans un PDF ────────────────────────────────────

/** Reconnaître une facture demande DEUX marques, pas une. Un PDF/A-3 Factur-X
 *  porte ses métadonnées XMP dans un flux qui annonce lui aussi
 *  `CrossIndustryDocument` : chercher ce seul mot renvoyait les métadonnées à la
 *  place de la facture. Vérifié sur un PDF produit par une plateforme agréée le
 *  13/09/2026 — c'est le piège numéro un de ce format. */
function estUneFacture(t) {
  if (!t || t.length < 300) return false;
  const cii = /CrossIndustry(Invoice|Document)/.test(t) && t.includes('ExchangedDocument');
  const ubl = /<[^>]*:?(Invoice|CreditNote)[\s>]/.test(t) && t.includes('AccountingSupplierParty');
  return cii || ubl;
}

/** @param {Uint8Array} octets @returns {Promise<string|null>} */
export async function extraireXML(octets) {
  const brut = new TextDecoder('latin1').decode(octets);
  // Cas facile : un XML déposé tel quel.
  if (!brut.startsWith('%PDF')) {
    const t = new TextDecoder('utf-8').decode(octets);
    return estUneFacture(t) ? t : null;
  }

  // Repérer les flux. Le mot « stream » apparaît aussi par hasard dans les
  // données binaires d'une image compressée : on n'accepte que ceux qui suivent
  // immédiatement la fermeture d'un dictionnaire (`>>`), ce qui est la seule
  // forme légale. Sans ce garde-fou les bornes glissaient et on décompressait
  // un morceau d'image.
  const debuts = [];
  const re = /(>>|\])\s*stream(\r\n|\r|\n)/g;
  let m;
  while ((m = re.exec(brut)) !== null) {
    const debut = m.index + m[0].length;
    const fin = brut.indexOf('endstream', debut);
    if (fin > debut) debuts.push({ debut, longueur: fin - debut, entete: brut.slice(Math.max(0, m.index - 700), m.index) });
  }

  // La pièce jointe est déclarée `/Type /EmbeddedFile`, souvent avec son nom.
  // On l'essaie d'abord ; l'ordre n'exclut rien, il évite juste de tout tenter.
  const poids = (c) => (/EmbeddedFile/.test(c.entete) ? 0 : (/factur-x\.xml|zugferd-invoice\.xml|xrechnung\.xml/i.test(c.entete) ? 1 : 2));
  debuts.sort((a, b) => poids(a) - poids(b) || a.longueur - b.longueur);

  for (const c of debuts) {
    const tranche = octets.subarray(c.debut, c.debut + c.longueur);
    const compresse = /FlateDecode/.test(c.entete);
    const essais = compresse
      ? [() => dégonfler(tranche), () => new TextDecoder('utf-8').decode(tranche)]
      : [() => new TextDecoder('utf-8').decode(tranche), () => dégonfler(tranche)];
    for (const essai of essais) {
      const texte = await essai();
      if (estUneFacture(texte)) return texte;
    }
  }
  return null;
}

/** FlateDecode. Un flux PDF est en général au format zlib, parfois en deflate nu
 *  (producteurs approximatifs) : on essaie les deux et on avale l'échec. */
async function dégonfler(octets) {
  for (const format of ['deflate', 'deflate-raw']) {
    try {
      const flux = new Blob([octets]).stream().pipeThrough(new DecompressionStream(format));
      return await new Response(flux).text();
    } catch (_) { /* flux non compressé ou tronqué : on essaie l'autre */ }
  }
  return null;
}

// ── Traduction ──────────────────────────────────────────────────────────────
const TYPES = { 380: 'facture', 381: 'avoir', 384: 'facture rectificative', 386: 'acompte', 389: 'autofacture' };

export function lireXML(xml) {
  const doc = parserXML(xml);
  const cii = ch(doc, 'CrossIndustryInvoice') || ch(doc, 'CrossIndustryDocument');
  if (cii) return lireCII(cii);
  const ubl = ch(doc, 'Invoice') || ch(doc, 'CreditNote');
  if (ubl) return lireUBL(ubl);
  throw new Error("Ce fichier n'est pas une facture électronique reconnue (ni Factur-X/CII, ni UBL).");
}

function partieCII(p) {
  if (!p) return {};
  const adr = ch(p, 'PostalTradeAddress');
  const tvaNum = tous(p, 'SpecifiedTaxRegistration')
    .map((r) => ch(r, 'ID')).find((i) => i && i.attrs.schemeID === 'VA');
  // Les identifiants français vivent à DEUX endroits, et les codes ISO 6523 sont
  // faciles à inverser : 0002 = SIREN (9 chiffres), 0009 = SIRET (14). Vérifié le
  // 13/09/2026 sur une facture émise par une plateforme agréée — elle met le SIRET
  // en `GlobalID schemeID="0009"` et le SIREN en `SpecifiedLegalOrganization/ID
  // schemeID="0002"`. On lit les deux, et on se fie à la LONGUEUR plutôt qu'au
  // schéma déclaré : c'est le seul critère qu'un émetteur ne peut pas se tromper.
  const ids = [ch(p, 'SpecifiedLegalOrganization', 'ID'), ...tous(p, 'GlobalID'), ...tous(p, 'ID')]
    .map((n) => txt(n).replace(/\s/g, '')).filter((v) => /^\d{9}(\d{5})?$/.test(v));
  const siret = ids.find((v) => v.length === 14) || null;
  const siren = ids.find((v) => v.length === 9) || (siret ? siret.slice(0, 9) : null);
  return {
    nom: txt(ch(p, 'Name')) || txt(ch(p, 'SpecifiedLegalOrganization', 'TradingBusinessName')),
    siret,
    siren,
    tva: txt(tvaNum) || null,
    adresse: [txt(ch(adr, 'LineOne')), txt(ch(adr, 'LineTwo'))].filter(Boolean).join(', ') || null,
    cp: txt(ch(adr, 'PostcodeCode')) || null,
    ville: txt(ch(adr, 'CityName')) || null,
    pays: txt(ch(adr, 'CountryID')) || null,
    email: txt(ch(p, 'DefinedTradeContact', 'EmailURIUniversalCommunication', 'URIID')) || null,
  };
}

function lireCII(r) {
  const entete = ch(r, 'ExchangedDocument');
  const tx = ch(r, 'SupplyChainTradeTransaction');
  const accord = ch(tx, 'ApplicableHeaderTradeAgreement');
  const regl = ch(tx, 'ApplicableHeaderTradeSettlement');
  const som = ch(regl, 'SpecifiedTradeSettlementHeaderMonetarySummation');
  const typeCode = txt(ch(entete, 'TypeCode'));

  const f = {
    format: 'CII',
    profil: txt(ch(r, 'ExchangedDocumentContext', 'GuidelineSpecifiedDocumentContextParameter', 'ID')) || null,
    numero: txt(ch(entete, 'ID')) || null,
    typeCode, type: TYPES[typeCode] || 'document',
    dateEmission: date(txt(ch(entete, 'IssueDateTime', 'DateTimeString'))),
    dateEcheance: date(txt(ch(regl, 'SpecifiedTradePaymentTerms', 'DueDateDateTime', 'DateTimeString'))),
    fournisseur: partieCII(ch(accord, 'SellerTradeParty')),
    client: partieCII(ch(accord, 'BuyerTradeParty')),
    devise: txt(ch(regl, 'InvoiceCurrencyCode')) || 'EUR',
    totalHT: nb(ch(som, 'TaxBasisTotalAmount')),
    totalLignes: nb(ch(som, 'LineTotalAmount')),
    totalTVA: nb(ch(som, 'TaxTotalAmount')),
    totalTTC: nb(ch(som, 'GrandTotalAmount')),
    dejaPaye: nb(ch(som, 'TotalPrepaidAmount')),
    aPayer: nb(ch(som, 'DuePayableAmount')),
    tva: tous(regl, 'ApplicableTradeTax').map((t) => ({
      categorie: txt(ch(t, 'CategoryCode')) || null,
      taux: nb(ch(t, 'RateApplicablePercent')),
      base: nb(ch(t, 'BasisAmount')),
      montant: nb(ch(t, 'CalculatedAmount')),
      motifExoneration: txt(ch(t, 'ExemptionReason')) || null,
    })),
    reglement: {
      conditions: txt(ch(regl, 'SpecifiedTradePaymentTerms', 'Description')) || null,
      iban: txt(profond(ch(regl, 'SpecifiedTradeSettlementPaymentMeans'), 'IBANID')) || null,
      reference: txt(ch(regl, 'PaymentReference')) || null,
    },
    notes: tous(entete, 'IncludedNote').map((n) => txt(ch(n, 'Content'))).filter(Boolean),
    lignes: tous(tx, 'IncludedSupplyChainTradeLineItem').map((l) => {
      const q = ch(l, 'SpecifiedLineTradeDelivery', 'BilledQuantity');
      const rl = ch(l, 'SpecifiedLineTradeSettlement');
      return {
        numero: txt(ch(l, 'AssociatedDocumentLineDocument', 'LineID')) || null,
        designation: txt(ch(l, 'SpecifiedTradeProduct', 'Name')) || null,
        quantite: nb(q),
        unite: uniteLisible(q && q.attrs.unitCode),
        pu: nb(ch(l, 'SpecifiedLineTradeAgreement', 'NetPriceProductTradePrice', 'ChargeAmount')),
        tauxTVA: nb(ch(rl, 'ApplicableTradeTax', 'RateApplicablePercent')),
        montantHT: nb(ch(rl, 'SpecifiedTradeSettlementLineMonetarySummation', 'LineTotalAmount')),
      };
    }),
  };
  return finir(f);
}

function partieUBL(p) {
  if (!p) return {};
  const adr = ch(p, 'PostalAddress');
  // UBL disperse les identifiants sur trois emplacements : PartyLegalEntity pour
  // le SIREN, PartyIdentification pour le SIRET, EndpointID pour l'adresse de
  // routage. Constaté le 13/09/2026 sur un UBL PEPPOL BIS 3.0 émis par une
  // plateforme agréée, qui met le SIRET en `PartyIdentification/ID schemeID="0009"`
  // — lire seulement CompanyID rendait le SIRET vide.
  const ids = [ch(p, 'PartyLegalEntity', 'CompanyID'), ch(p, 'PartyIdentification', 'ID'), ch(p, 'EndpointID')]
    .map((n) => txt(n).replace(/\s/g, '')).filter((v) => /^\d{9}(\d{5})?$/.test(v));
  const siret = ids.find((v) => v.length === 14) || null;
  const siren = ids.find((v) => v.length === 9) || (siret ? siret.slice(0, 9) : null);
  return {
    nom: txt(ch(p, 'PartyLegalEntity', 'RegistrationName')) || txt(ch(p, 'PartyName', 'Name')),
    siret,
    siren,
    tva: txt(ch(p, 'PartyTaxScheme', 'CompanyID')) || null,
    adresse: [txt(ch(adr, 'StreetName')), txt(ch(adr, 'AdditionalStreetName'))].filter(Boolean).join(', ') || null,
    cp: txt(ch(adr, 'PostalZone')) || null,
    ville: txt(ch(adr, 'CityName')) || null,
    pays: txt(ch(adr, 'Country', 'IdentificationCode')) || null,
    email: txt(ch(p, 'Contact', 'ElectronicMail')) || null,
  };
}

function lireUBL(r) {
  const tot = ch(r, 'LegalMonetaryTotal');
  const typeCode = txt(ch(r, 'InvoiceTypeCode')) || txt(ch(r, 'CreditNoteTypeCode')) || '380';
  const f = {
    format: 'UBL',
    profil: txt(ch(r, 'CustomizationID')) || null,
    numero: txt(ch(r, 'ID')) || null,
    typeCode, type: TYPES[typeCode] || 'document',
    dateEmission: date(txt(ch(r, 'IssueDate'))),
    dateEcheance: date(txt(ch(r, 'DueDate'))) || date(txt(ch(r, 'PaymentMeans', 'PaymentDueDate'))),
    fournisseur: partieUBL(ch(r, 'AccountingSupplierParty', 'Party')),
    client: partieUBL(ch(r, 'AccountingCustomerParty', 'Party')),
    devise: txt(ch(r, 'DocumentCurrencyCode')) || 'EUR',
    totalLignes: nb(ch(tot, 'LineExtensionAmount')),
    totalHT: nb(ch(tot, 'TaxExclusiveAmount')),
    totalTVA: nb(ch(r, 'TaxTotal', 'TaxAmount')),
    totalTTC: nb(ch(tot, 'TaxInclusiveAmount')),
    dejaPaye: nb(ch(tot, 'PrepaidAmount')),
    aPayer: nb(ch(tot, 'PayableAmount')),
    tva: tous(ch(r, 'TaxTotal') || r, 'TaxSubtotal').map((t) => ({
      categorie: txt(ch(t, 'TaxCategory', 'ID')) || null,
      taux: nb(ch(t, 'TaxCategory', 'Percent')),
      base: nb(ch(t, 'TaxableAmount')),
      montant: nb(ch(t, 'TaxAmount')),
      motifExoneration: txt(ch(t, 'TaxCategory', 'TaxExemptionReason')) || null,
    })),
    reglement: {
      conditions: txt(ch(r, 'PaymentTerms', 'Note')) || null,
      iban: txt(ch(r, 'PaymentMeans', 'PayeeFinancialAccount', 'ID')) || null,
      reference: txt(ch(r, 'PaymentMeans', 'PaymentID')) || null,
    },
    notes: tous(r, 'Note').map(txt).filter(Boolean),
    lignes: tous(r, 'InvoiceLine').concat(tous(r, 'CreditNoteLine')).map((l) => {
      const q = ch(l, 'InvoicedQuantity') || ch(l, 'CreditedQuantity');
      return {
        numero: txt(ch(l, 'ID')) || null,
        designation: txt(ch(l, 'Item', 'Name')) || null,
        quantite: nb(q),
        unite: uniteLisible(q && q.attrs.unitCode),
        pu: nb(ch(l, 'Price', 'PriceAmount')),
        tauxTVA: nb(ch(l, 'Item', 'ClassifiedTaxCategory', 'Percent')),
        montantHT: nb(ch(l, 'LineExtensionAmount')),
      };
    }),
  };
  return finir(f);
}

// UN/ECE Rec. 20 → ce qu'un artisan dit. Le code inconnu est rendu tel quel,
// jamais masqué : mieux vaut « H87 » affiché que l'unité inventée.
const UNITES = { MTK: 'm²', MTR: 'ml', MTQ: 'm³', LTR: 'L', KGM: 'kg', TNE: 't',
                 HUR: 'h', DAY: 'jour', C62: 'u', H87: 'u', EA: 'u', SET: 'jeu',
                 NAR: 'u', ZZ: 'forfait', LS: 'forfait', KWH: 'kWh' };
const uniteLisible = (c) => (c ? (UNITES[c] || c) : null);

/** Contrôles de cohérence. On les SIGNALE : une facture fournisseur incohérente
 *  est un problème à voir, pas à réparer dans notre dos. Tolérance 1 centime par
 *  ligne de TVA — l'arrondi légal se fait avant la somme. */
function finir(f) {
  const inc = [];
  const proche = (a, b, tol) => a == null || b == null || Math.abs(a - b) <= tol;
  const tolTVA = Math.max(0.01, (f.tva?.length || 1) * 0.01);
  if (!proche(f.totalHT, f.totalLignes, 0.01) && f.totalLignes != null) {
    inc.push(`total HT ${f.totalHT} ≠ somme des lignes ${f.totalLignes}`);
  }
  const sommeTVA = (f.tva || []).reduce((s, t) => s + (t.montant || 0), 0);
  if (f.tva?.length && !proche(f.totalTVA, sommeTVA, tolTVA)) {
    inc.push(`TVA annoncée ${f.totalTVA} ≠ ventilation ${sommeTVA.toFixed(2)}`);
  }
  if (!proche(f.totalTTC, (f.totalHT || 0) + (f.totalTVA || 0), 0.02)) {
    inc.push(`TTC ${f.totalTTC} ≠ HT + TVA`);
  }
  f.incoherences = inc;
  // Un avoir (381) porte des montants positifs dans le XML : c'est le TYPE qui
  // dit le sens. Le signaler évite de créditer une dépense par erreur.
  f.sens = f.typeCode === '381' ? 'avoir' : 'facture';
  return f;
}

/** Point d'entrée : un File du navigateur, un Blob, un ArrayBuffer, ou du XML. */
export async function lire(entree) {
  let octets;
  if (typeof entree === 'string') return lireXML(entree);
  if (entree instanceof Uint8Array) octets = entree;
  else if (entree instanceof ArrayBuffer) octets = new Uint8Array(entree);
  else octets = new Uint8Array(await entree.arrayBuffer());
  const xml = await extraireXML(octets);
  if (!xml) {
    throw new Error('Ce PDF ne contient pas de facture électronique — c\'est un PDF ordinaire. '
      + 'Photographiez-le plutôt, je lirai les montants dessus.');
  }
  return lireXML(xml);
}

export const _test = { parserXML, ch, tous, date, uniteLisible };

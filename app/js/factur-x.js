// Factur-X — le jumeau lisible par machine de la facture (13/09/2026).
//
// POURQUOI
// Au 1er septembre 2027, une TPE devra ÉMETTRE ses factures en électronique.
// Une facture électronique n'est pas un PDF : c'est un PDF qui porte, attaché
// à l'intérieur, un XML structuré que les logiciels lisent. Ce module produit
// ce XML. Le PDF et l'envoi viennent après, et ne dépendent pas de lui.
//
// LE PROFIL : EN16931.
// J'avais choisi BASIC le 13/09 en supposant qu'EN16931 demandait des champs
// qu'on n'a pas. Le vrai destinataire a tranché autrement : envoyé à une
// plateforme agréée, le fichier est revenu
//   [XSD_ERROR] flavor : 'urn:factur-x.eu:1p0:basic' is not supported
// Seuls EN16931, EXTENDED et PEPPOL_BIS_3 passent. Ce n'est donc pas un choix :
// c'est le seul profil que le réseau français accepte pour une facture de
// détail. Ne pas revenir à BASIC « pour simplifier » — ça ne partirait pas.
//
// CE QU'IL FAUT SAVOIR AVANT DE TOUCHER À CE FICHIER
// - L'ordre des balises est IMPOSÉ par le schéma. Une balise juste, au mauvais
//   endroit, fait échouer la validation. Ne pas réorganiser « pour lire mieux ».
// - Les montants ont DEUX décimales, le prix unitaire QUATRE. L'arrondi se fait
//   à la ligne AVANT d'additionner, sinon les totaux ne retombent pas.
// - Les dates sont en AAAAMMJJ, format="102".
// - ISO 6523 : schemeID="0002" = SIREN (9 chiffres), schemeID="0009" = SIRET (14).
//   J'avais écrit l'inverse. Vérifié le 13/09/2026 sur une facture émise par une
//   plateforme agréée : elle met le SIRET en `GlobalID schemeID="0009"` et le
//   SIREN en `SpecifiedLegalOrganization/ID schemeID="0002"`. Un SIRET annoncé
//   sous 0002 est une erreur sémantique qu'un validateur peut refuser.
//   schemeID="VA" = numéro de TVA intracommunautaire.
// - Le fichier attaché au PDF doit s'appeler exactement `factur-x.xml`.
//
// Référence : Factur-X 1.09.2 (FNFE-MPE), aligné ZUGFeRD 2.5.2. Exemple BASIC
// officiel relu le 13/09/2026.

export const PROFIL = 'urn:cen.eu:en16931:2017';
export const NOM_FICHIER = 'factur-x.xml';

// 380 = facture, 381 = avoir. Un avoir est une facture de sens inverse : même
// structure, montants positifs, c'est le TypeCode qui dit son sens.
const TYPE_FACTURE = '380';
const TYPE_AVOIR = '381';

// Catégories de TVA (UNCL5305). L'artisan en franchise (art. 293 B) est en `E`,
// exonéré — pas en `Z` (taux zéro), qui est autre chose et ferait mentir la
// facture. La sous-traitance en autoliquidation est en `AE`.
const CAT_NORMALE = 'S';
const CAT_EXONEREE = 'E';
const CAT_AUTOLIQUIDATION = 'AE';

const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const m2 = (n) => (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const m4 = (n) => (Math.round((Number(n) || 0) * 10000) / 10000).toFixed(4);
const qte = (n) => (Math.round((Number(n) || 0) * 10000) / 10000).toFixed(4);

/** AAAAMMJJ, le seul format que le schéma accepte (format="102"). */
function jour(d) {
  if (!d) return null;
  const x = d instanceof Date ? d : new Date(String(d).length <= 10 ? String(d) + 'T12:00:00' : d);
  if (isNaN(x.getTime())) return null;
  return `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, '0')}${String(x.getDate()).padStart(2, '0')}`;
}

/** SIRET/SIREN : on ne garde que les chiffres, et on ne rend que ce qui est plausible. */
function siret(v) {
  const s = String(v || '').replace(/\D/g, '');
  return (s.length === 14 || s.length === 9) ? s : null;
}

// Une adresse française tapée à la main : « 12 rue Hoche, 93500 Pantin ».
// On en tire le code postal et la commune ; le reste est la voie. Approximatif
// par nature, mais le schéma n'exige que le pays — le reste améliore la fiche.
function adresse(brut) {
  const t = String(brut || '').trim();
  const m = t.match(/(.*?)[\s,]*\b(\d{5})\b[\s,]*(.*)$/);
  if (!m) return { voie: t, cp: null, ville: null };
  return { voie: m[1].replace(/[,\s]+$/, '').trim(), cp: m[2], ville: m[3].trim() || null };
}

function categorieTva(taux, opts) {
  if (opts && opts.autoliquidation) return CAT_AUTOLIQUIDATION;
  if (!(Number(taux) > 0)) return CAT_EXONEREE;
  return CAT_NORMALE;
}

/**
 * Les lignes, normalisées depuis `factures.lines` (le même format que les
 * devis : description, quantity, unit, unitPrice, vatRate, total_ht).
 */
function normaliserLignes(lines, tauxDefaut) {
  return (lines || []).map((l, i) => {
    const q = Number(l.quantity ?? l.qte ?? 1) || 0;
    const pu = Number(l.unitPrice ?? l.pu ?? l.prix_ht ?? 0) || 0;
    // Le taux PAR LIGNE est exigé par EN16931. Or les lignes réellement stockées
    // par BatiSpot ne le portent pas : une ligne en base ressemble à
    //   { unit, quantity, unitPrice, description }
    // et la TVA ne vit qu'au niveau de la facture (`total_tva`). Sans repli, le
    // XML annonçait 0 % sur chaque ligne pendant que le total portait de la TVA —
    // une facture qui se contredit elle-même, rejetée à l'envoi. Vu le 13/09/2026
    // en regardant les vraies lignes, pas un jeu de test.
    const brut = l.vatRate ?? l.tva ?? l.taux_tva;
    let taux = brut == null || brut === '' ? Number(tauxDefaut) : Number(brut);
    if (!Number.isFinite(taux)) taux = 0;
    if (taux > 0 && taux <= 1) taux = taux * 100;          // 0,10 se dit aussi 10
    const ht = l.total_ht != null ? Number(l.total_ht) : q * pu;
    return {
      rang: i + 1,
      designation: String(l.description || l.designation || l.desig || 'Prestation').slice(0, 500),
      quantite: q,
      unite: uniteUNECE(l.unit || l.unite),
      pu,
      taux,
      // Arrondi À LA LIGNE : c'est ce que le schéma additionne ensuite.
      ht: Math.round(ht * 100) / 100,
    };
  });
}

// Codes d'unité UN/ECE Rec.20. Un artisan écrit « m² », « ml », « u », « h ».
const UNITES = { 'm2': 'MTK', 'm²': 'MTK', 'm3': 'MTQ', 'm³': 'MTQ', 'm': 'MTR', 'ml': 'MTR',
                 'u': 'C62', 'unite': 'C62', 'unité': 'C62', 'ens': 'C62', 'forfait': 'C62',
                 'h': 'HUR', 'heure': 'HUR', 'j': 'DAY', 'jour': 'DAY', 'kg': 'KGM', 'l': 'LTR',
                 'pce': 'H87', 'piece': 'H87', 'pièce': 'H87' };
function uniteUNECE(u) {
  return UNITES[String(u || '').trim().toLowerCase()] || 'C62';
}

// Taux légaux français (métropole et DOM). Une déduction qui ne tombe PAS sur
// l'un d'eux n'est pas un taux : c'est le signe que la facture mélange plusieurs
// taux, et dans ce cas on refuse de deviner.
const TAUX_LEGAUX = [20, 13, 10, 8.5, 5.5, 2.1, 0];

/** Déduit le taux unique d'une facture à partir de ses totaux. Rend `null` si le
 *  résultat ne tombe pas sur un taux légal — deux taux mélangés, par exemple.
 *  C'est volontaire : mieux vaut le dire à l'artisan que signer un chiffre faux. */
export function tauxDeduit(totalHT, totalTVA) {
  const ht = Number(totalHT);
  const tva = Number(totalTVA);
  if (!Number.isFinite(ht) || !Number.isFinite(tva) || ht <= 0) return null;
  const brut = (tva / ht) * 100;
  const proche = TAUX_LEGAUX.find((t) => Math.abs(brut - t) < 0.15);
  return proche === undefined ? null : proche;
}

/** L'adresse électronique de routage (BT-34 / BT-49) et le contact humain sont
 *  DEUX choses, au même endroit du schéma — et je les avais confondues.
 *
 *  `URIUniversalCommunication/URIID` n'est pas un e-mail de contact : c'est
 *  l'adresse par laquelle la plateforme TROUVE le destinataire dans l'annuaire.
 *  Son `schemeID` doit venir de la liste CEF EAS. J'y avais mis l'e-mail avec
 *  schemeID="SMTP", qui n'est pas dans cette liste : la plateforme a répondu
 *    [BR-CL-25] Endpoint identifier scheme identifier MUST belong to the CEF EAS code list
 *  En France l'adresse de routage est le SIRET, sous EAS 0009.
 *
 *  L'e-mail, lui, vit dans `DefinedTradeContact/EmailURIUniversalCommunication`,
 *  qui se place AVANT l'adresse postale. L'ordre est imposé par le schéma.
 */
function contactPartie(p, email) {
  if (!email) return;
  p('        <ram:DefinedTradeContact>');
  p('          <ram:EmailURIUniversalCommunication>');
  p(`            <ram:URIID>${esc(email)}</ram:URIID>`);
  p('          </ram:EmailURIUniversalCommunication>');
  p('        </ram:DefinedTradeContact>');
}

function adresseRoutage(p, siretPartie) {
  if (!siretPartie || siretPartie.length !== 14) return;
  p('        <ram:URIUniversalCommunication>');
  p(`          <ram:URIID schemeID="0009">${siretPartie}</ram:URIID>`);
  p('        </ram:URIUniversalCommunication>');
}

/** Les identifiants légaux d'une partie. L'ORDRE est imposé par le schéma :
 *  GlobalID vient AVANT Name, SpecifiedLegalOrganization APRÈS. C'est pour ça
 *  que le GlobalID est écrit par l'appelant avant le Name, et que cette fonction
 *  ne pose que la partie qui suit. */
function identifiantsPartie(p, id) {
  if (!id) return;
  const siren = id.length === 14 ? id.slice(0, 9) : id;
  p('        <ram:SpecifiedLegalOrganization>');
  p(`          <ram:ID schemeID="0002">${siren}</ram:ID>`);
  p('        </ram:SpecifiedLegalOrganization>');
}

/** Le SIRET, qui se déclare en GlobalID et doit précéder le Name. */
function globalIdPartie(p, id) {
  if (id && id.length === 14) p(`        <ram:GlobalID schemeID="0009">${id}</ram:GlobalID>`);
}

/**
 * Construit le XML Factur-X, profil EN16931.
 *
 * @param {object} f        la facture : numero, type, date_emission, date_echeance, lines, totaux, notes
 * @param {object} vendeur  le profil de l'artisan : display_name, siret, address, tva_intracom, forme_juridique, capital, rcs, iban
 * @param {object} acheteur le client : nom, adresse, siret ou siren, tva, email, est_pro
 * @param {object} [opts]   { autoliquidation:boolean, devise:'EUR', tauxTva:number }
 *   `tauxTva` est le repli appliqué aux lignes qui n'en portent pas — à calculer
 *   avec `tauxDeduit(total_ht, total_tva)` et à NE PAS inventer.
 * @returns {string} le XML
 */
export function construireXML(f, vendeur, acheteur, opts = {}) {
  const devise = opts.devise || 'EUR';
  const lignes = normaliserLignes(f.lines, opts.tauxTva);
  const estAvoir = String(f.type || '') === 'avoir';

  // Les totaux se recalculent depuis les lignes plutôt que d'être recopiés :
  // une facture dont les totaux ne retombent pas est REJETÉE par la plateforme,
  // et mieux vaut s'en apercevoir ici que chez le client.
  const parTaux = new Map();
  let totalHT = 0;
  for (const l of lignes) {
    totalHT += l.ht;
    const cat = categorieTva(l.taux, opts);
    const cle = `${cat}|${l.taux}`;
    parTaux.set(cle, (parTaux.get(cle) || 0) + l.ht);
  }
  totalHT = Math.round(totalHT * 100) / 100;

  let totalTVA = 0;
  const ventilation = [];
  for (const [cle, base] of parTaux) {
    const [cat, tauxS] = cle.split('|');
    const taux = Number(tauxS);
    const montant = cat === CAT_NORMALE ? Math.round(base * taux) / 100 : 0;
    totalTVA += montant;
    ventilation.push({ cat, taux, base: Math.round(base * 100) / 100, montant });
  }
  totalTVA = Math.round(totalTVA * 100) / 100;
  const totalTTC = Math.round((totalHT + totalTVA) * 100) / 100;

  const va = adresse(vendeur.address);
  const aa = adresse(acheteur.adresse);
  const vSiret = siret(vendeur.siret);
  const aSiret = siret(acheteur.siret || acheteur.siren);

  const dateEmission = jour(f.date_emission || f.created_at) || jour(new Date());
  const dateEcheance = jour(f.date_echeance);

  // Mentions légales portées par le XML, chacune sous son code de sujet.
  // REG = forme juridique et capital · ABL = RCS · PMD = pénalités de retard
  // · PMT = indemnité de recouvrement · AAB = escompte. Les trois dernières
  // sont obligatoires sur une facture française : elles voyagent ici aussi,
  // pas seulement sur le PDF.
  const notes = [];
  const identite = [vendeur.forme_juridique, vendeur.capital ? `au capital de ${vendeur.capital}` : null]
    .filter(Boolean).join(' ');
  if (identite) notes.push({ c: `${vendeur.display_name || ''} ${identite}`.trim(), s: 'REG' });
  if (vendeur.rcs) notes.push({ c: `RCS ${vendeur.rcs}`, s: 'ABL' });
  notes.push({ c: "Taux de pénalités de retard : trois fois le taux d'intérêt légal.", s: 'PMD' });
  notes.push({ c: 'Indemnité forfaitaire pour frais de recouvrement : 40 euros.', s: 'PMT' });
  notes.push({ c: "Pas d'escompte pour paiement anticipé.", s: 'AAB' });
  if (opts.autoliquidation) notes.push({ c: 'Autoliquidation de la TVA — art. 283, 2 nonies du CGI.', s: 'AAI' });
  if (ventilation.some((v) => v.cat === CAT_EXONEREE)) {
    notes.push({ c: 'TVA non applicable, art. 293 B du CGI.', s: 'AAI' });
  }
  if (f.objet) notes.push({ c: String(f.objet).slice(0, 500), s: 'AAI' });

  const L = [];
  const p = (s) => L.push(s);

  p('<?xml version="1.0" encoding="UTF-8"?>');
  p('<rsm:CrossIndustryInvoice'
    + ' xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"'
    + ' xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"'
    + ' xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"'
    + ' xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"'
    + ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">');

  // ── Contexte : quel profil ────────────────────────────────────────────
  p('  <rsm:ExchangedDocumentContext>');
  p('    <ram:GuidelineSpecifiedDocumentContextParameter>');
  p(`      <ram:ID>${PROFIL}</ram:ID>`);
  p('    </ram:GuidelineSpecifiedDocumentContextParameter>');
  p('  </rsm:ExchangedDocumentContext>');

  // ── L'en-tête du document ─────────────────────────────────────────────
  p('  <rsm:ExchangedDocument>');
  p(`    <ram:ID>${esc(f.numero)}</ram:ID>`);
  p(`    <ram:TypeCode>${estAvoir ? TYPE_AVOIR : TYPE_FACTURE}</ram:TypeCode>`);
  p('    <ram:IssueDateTime>');
  p(`      <udt:DateTimeString format="102">${dateEmission}</udt:DateTimeString>`);
  p('    </ram:IssueDateTime>');
  for (const n of notes) {
    p('    <ram:IncludedNote>');
    p(`      <ram:Content>${esc(n.c)}</ram:Content>`);
    p(`      <ram:SubjectCode>${n.s}</ram:SubjectCode>`);
    p('    </ram:IncludedNote>');
  }
  p('  </rsm:ExchangedDocument>');

  p('  <rsm:SupplyChainTradeTransaction>');

  // ── Les lignes ────────────────────────────────────────────────────────
  for (const l of lignes) {
    const cat = categorieTva(l.taux, opts);
    p('    <ram:IncludedSupplyChainTradeLineItem>');
    p('      <ram:AssociatedDocumentLineDocument>');
    p(`        <ram:LineID>${l.rang}</ram:LineID>`);
    p('      </ram:AssociatedDocumentLineDocument>');
    p('      <ram:SpecifiedTradeProduct>');
    p(`        <ram:Name>${esc(l.designation)}</ram:Name>`);
    p('      </ram:SpecifiedTradeProduct>');
    p('      <ram:SpecifiedLineTradeAgreement>');
    p('        <ram:NetPriceProductTradePrice>');
    p(`          <ram:ChargeAmount>${m4(l.pu)}</ram:ChargeAmount>`);
    p('        </ram:NetPriceProductTradePrice>');
    p('      </ram:SpecifiedLineTradeAgreement>');
    p('      <ram:SpecifiedLineTradeDelivery>');
    p(`        <ram:BilledQuantity unitCode="${l.unite}">${qte(l.quantite)}</ram:BilledQuantity>`);
    p('      </ram:SpecifiedLineTradeDelivery>');
    p('      <ram:SpecifiedLineTradeSettlement>');
    p('        <ram:ApplicableTradeTax>');
    p('          <ram:TypeCode>VAT</ram:TypeCode>');
    p(`          <ram:CategoryCode>${cat}</ram:CategoryCode>`);
    p(`          <ram:RateApplicablePercent>${m2(cat === CAT_NORMALE ? l.taux : 0)}</ram:RateApplicablePercent>`);
    p('        </ram:ApplicableTradeTax>');
    p('        <ram:SpecifiedTradeSettlementLineMonetarySummation>');
    p(`          <ram:LineTotalAmount>${m2(l.ht)}</ram:LineTotalAmount>`);
    p('        </ram:SpecifiedTradeSettlementLineMonetarySummation>');
    p('      </ram:SpecifiedLineTradeSettlement>');
    p('    </ram:IncludedSupplyChainTradeLineItem>');
  }

  // ── Qui vend, qui achète ──────────────────────────────────────────────
  p('    <ram:ApplicableHeaderTradeAgreement>');
  p('      <ram:SellerTradeParty>');
  globalIdPartie(p, vSiret);
  p(`        <ram:Name>${esc(vendeur.display_name || 'Entreprise')}</ram:Name>`);
  identifiantsPartie(p, vSiret);
  contactPartie(p, vendeur.email);
  p('        <ram:PostalTradeAddress>');
  if (va.cp) p(`          <ram:PostcodeCode>${esc(va.cp)}</ram:PostcodeCode>`);
  if (va.voie) p(`          <ram:LineOne>${esc(va.voie)}</ram:LineOne>`);
  if (va.ville) p(`          <ram:CityName>${esc(va.ville)}</ram:CityName>`);
  p('          <ram:CountryID>FR</ram:CountryID>');
  p('        </ram:PostalTradeAddress>');
  adresseRoutage(p, vSiret);
  if (vendeur.tva_intracom) {
    p('        <ram:SpecifiedTaxRegistration>');
    p(`          <ram:ID schemeID="VA">${esc(String(vendeur.tva_intracom).replace(/\s/g, ''))}</ram:ID>`);
    p('        </ram:SpecifiedTaxRegistration>');
  }
  p('      </ram:SellerTradeParty>');

  p('      <ram:BuyerTradeParty>');
  globalIdPartie(p, aSiret);
  p(`        <ram:Name>${esc(acheteur.nom || 'Client')}</ram:Name>`);
  // Le SIRET de l'acheteur n'existe que s'il est professionnel. Un particulier
  // n'en a pas, et sa facture relève du e-reporting, pas de la transmission.
  identifiantsPartie(p, aSiret);
  contactPartie(p, acheteur.email);
  p('        <ram:PostalTradeAddress>');
  if (aa.cp) p(`          <ram:PostcodeCode>${esc(aa.cp)}</ram:PostcodeCode>`);
  if (aa.voie) p(`          <ram:LineOne>${esc(aa.voie)}</ram:LineOne>`);
  if (aa.ville) p(`          <ram:CityName>${esc(aa.ville)}</ram:CityName>`);
  p('          <ram:CountryID>FR</ram:CountryID>');
  p('        </ram:PostalTradeAddress>');
  adresseRoutage(p, aSiret);
  if (acheteur.tva) {
    p('        <ram:SpecifiedTaxRegistration>');
    p(`          <ram:ID schemeID="VA">${esc(String(acheteur.tva).replace(/\s/g, ''))}</ram:ID>`);
    p('        </ram:SpecifiedTaxRegistration>');
  }
  p('      </ram:BuyerTradeParty>');
  p('    </ram:ApplicableHeaderTradeAgreement>');

  // ── La livraison. Vide chez un artisan : la prestation est faite sur
  //    place, il n'y a ni bon de livraison ni adresse distincte. La balise
  //    reste, le schéma l'exige. ───────────────────────────────────────────
  p('    <ram:ApplicableHeaderTradeDelivery/>');

  // ── Le règlement ──────────────────────────────────────────────────────
  p('    <ram:ApplicableHeaderTradeSettlement>');
  p(`      <ram:InvoiceCurrencyCode>${devise}</ram:InvoiceCurrencyCode>`);
  if (vendeur.iban) {
    p('      <ram:SpecifiedTradeSettlementPaymentMeans>');
    p('        <ram:TypeCode>30</ram:TypeCode>');            // 30 = virement
    p('        <ram:PayeePartyCreditorFinancialAccount>');
    p(`          <ram:IBANID>${esc(String(vendeur.iban).replace(/\s/g, ''))}</ram:IBANID>`);
    p('        </ram:PayeePartyCreditorFinancialAccount>');
    p('      </ram:SpecifiedTradeSettlementPaymentMeans>');
  }
  for (const v of ventilation) {
    p('      <ram:ApplicableTradeTax>');
    p(`        <ram:CalculatedAmount>${m2(v.montant)}</ram:CalculatedAmount>`);
    p('        <ram:TypeCode>VAT</ram:TypeCode>');
    if (v.cat === CAT_EXONEREE) p('        <ram:ExemptionReason>TVA non applicable, art. 293 B du CGI</ram:ExemptionReason>');
    if (v.cat === CAT_AUTOLIQUIDATION) p('        <ram:ExemptionReason>Autoliquidation — art. 283, 2 nonies du CGI</ram:ExemptionReason>');
    p(`        <ram:BasisAmount>${m2(v.base)}</ram:BasisAmount>`);
    p(`        <ram:CategoryCode>${v.cat}</ram:CategoryCode>`);
    p(`        <ram:RateApplicablePercent>${m2(v.cat === CAT_NORMALE ? v.taux : 0)}</ram:RateApplicablePercent>`);
    p('      </ram:ApplicableTradeTax>');
  }
  if (dateEcheance) {
    p('      <ram:SpecifiedTradePaymentTerms>');
    p('        <ram:DueDateDateTime>');
    p(`          <udt:DateTimeString format="102">${dateEcheance}</udt:DateTimeString>`);
    p('        </ram:DueDateDateTime>');
    p('      </ram:SpecifiedTradePaymentTerms>');
  }
  p('      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>');
  p(`        <ram:LineTotalAmount>${m2(totalHT)}</ram:LineTotalAmount>`);
  p(`        <ram:TaxBasisTotalAmount>${m2(totalHT)}</ram:TaxBasisTotalAmount>`);
  p(`        <ram:TaxTotalAmount currencyID="${devise}">${m2(totalTVA)}</ram:TaxTotalAmount>`);
  p(`        <ram:GrandTotalAmount>${m2(totalTTC)}</ram:GrandTotalAmount>`);
  p(`        <ram:DuePayableAmount>${m2(totalTTC)}</ram:DuePayableAmount>`);
  p('      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>');
  p('    </ram:ApplicableHeaderTradeSettlement>');

  p('  </rsm:SupplyChainTradeTransaction>');
  p('</rsm:CrossIndustryInvoice>');

  return L.join('\n');
}

/**
 * Ce qui manque pour qu'une facture soit émettable. On le dit AVANT d'envoyer :
 * une facture rejetée par la plateforme revient à l'artisan sans explication.
 * @returns {string[]} les manques, en clair
 */
export function verifier(f, vendeur, acheteur, opts = {}) {
  const manques = [];
  // La TVA par ligne : exigée par EN16931, absente des lignes de BatiSpot. Si
  // l'appelant n'a pas pu la déduire des totaux, la facture mélange des taux et
  // personne ne peut trancher à sa place.
  const lignesSansTaux = (f.lines || []).filter((l) => l.vatRate == null && l.tva == null && l.taux_tva == null);
  if (lignesSansTaux.length && opts.tauxTva == null && Number(f.total_tva) > 0) {
    manques.push('le taux de TVA de chaque ligne — la facture en mélange plusieurs, '
      + 'je ne peux pas le déduire du total');
  }
  if (!f.numero) manques.push('le numéro de la facture');
  if (!f.date_emission && !f.created_at) manques.push("la date d'émission");
  if (!(f.lines || []).length) manques.push('les lignes de la facture');
  if (!siret(vendeur.siret)) manques.push('votre SIRET (Mon entreprise)');
  if (!vendeur.display_name) manques.push('le nom de votre entreprise');
  if (!adresse(vendeur.address).cp) manques.push('votre adresse complète avec le code postal');
  if (!acheteur.nom) manques.push('le nom du client');
  // Le SIRET du client n'est exigé que s'il est professionnel : c'est la clé
  // qui permet à la plateforme de le trouver dans l'annuaire. Un particulier
  // n'en a pas — sa facture relève du e-reporting.
  if (acheteur.est_pro && !siret(acheteur.siret || acheteur.siren)) {
    manques.push(`le SIRET de ${acheteur.nom || 'votre client'} (obligatoire entre professionnels)`);
  }
  return manques;
}

export const _test = { adresse, jour, siret, uniteUNECE, normaliserLignes };

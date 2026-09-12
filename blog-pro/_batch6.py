#!/usr/bin/env python3
"""Batch 6 : 5 articles pour atteindre 30 total."""
from _template_gen import render

ARTICLES = []

# ARTICLE 26 : Devis BTP mentions obligatoires
ARTICLES.append({
  "slug":"devis-btp-mentions-obligatoires-modele-conforme-2026",
  "title":"Devis BTP 2026 : mentions obligatoires, modèle conforme et conversion du prospect",
  "meta":"Le devis est le contrat qui engage l'artisan. Mentions obligatoires 2026, articles CMP, delai validite, CGV, astuces pour convertir 60 % des devis.",
  "kw":"devis btp, mentions obligatoires devis, modele devis artisan, cgv btp, conversion devis",
  "h1":"Devis BTP 2026 : mentions obligatoires, modèle conforme et techniques pour convertir",
  "read":11,
  "summary":[
    "Les 14 mentions obligatoires sur un devis BTP (code consommation + code civil)",
    "L'erreur la plus courante qui rend un devis invalide en justice",
    "Comment structurer un devis pour convertir 60 % au lieu de 30 %",
    "Les CGV BTP 2026 : clauses indispensables et rédaction",
  ],
  "body":"""
<h2>Le devis : un document contractuel, pas un simple estimatif</h2>
<p>Beaucoup d'artisans voient le devis comme un "<em>devis indicatif</em>". Erreur juridique : <strong>tout devis accepte et signe par le client vaut contrat</strong> (articles 1101 et suivants du code civil). Les mentions qu'il contient sont opposables aux parties.</p>
<p>En 2026, la reglementation s'est renforcee : la facturation electronique impose un pre-format compatible, et la RGPD s'applique aux donnees clients collectees via devis.</p>

<h2>Les 14 mentions obligatoires sur un devis BTP</h2>
<p>Ces mentions decoulent de l'article L. 121-18 du code de la consommation et des articles L. 441-1 a L. 441-11 du code de commerce. L'absence d'une seule de ces mentions peut rendre le devis contestable.</p>

<h3>Informations sur l'entreprise</h3>
<ol>
<li><strong>Raison sociale complete</strong> (forme juridique + nom : SARL Dupont, SAS Martin, EI Durand...)</li>
<li><strong>SIRET</strong> (14 chiffres obligatoires)</li>
<li><strong>Numero de TVA intracommunautaire</strong> si applicable</li>
<li><strong>Adresse du siege social</strong> et adresse d'intervention si differente</li>
<li><strong>Coordonnees de contact</strong> : telephone, email, site web</li>
<li><strong>Nom du representant legal</strong> (gerant, president)</li>
<li><strong>Numero d'assurance decennale</strong> + nom de l'assureur (article L. 241-1 code des assurances, obligatoire pour travaux soumis a la garantie decennale)</li>
<li><strong>Attestation d'assurance RC Pro</strong> valide</li>
</ol>

<h3>Informations sur le devis</h3>
<ol start="9">
<li><strong>Date d'etablissement</strong> du devis</li>
<li><strong>Numero de devis</strong> unique (numerotation sequentielle, pas de trou)</li>
<li><strong>Duree de validite</strong> du devis (3 mois recommande)</li>
<li><strong>Description detaillee des prestations</strong> (pas juste "travaux de renovation")</li>
<li><strong>Prix unitaires et quantitatifs</strong> (materiaux et main d'oeuvre distincts)</li>
<li><strong>Taux de TVA applicable par ligne</strong> (5,5 %, 10 % ou 20 %) + total HT/TTC</li>
</ol>

<h3>Mentions additionnelles fortement recommandees</h3>
<ul>
<li>Conditions de paiement (acompte, echelonnement, delai de paiement final)</li>
<li>Mode de paiement accepte (CB, virement, cheque)</li>
<li>Penalites de retard en cas de non-paiement</li>
<li>Reference aux CGV jointes</li>
<li>Mention manuscrite "<em>Devis recu avant execution des travaux</em>" pour les contrats hors etablissement (articles L. 221-1 et suivants)</li>
</ul>

<div class="warning-box"><strong>Sanction :</strong> un devis non conforme peut entrainer une amende administrative de 3 000 EUR (personne physique) ou 15 000 EUR (personne morale), plus les sanctions fiscales en cas de non-respect des mentions TVA.</div>

<h2>L'erreur la plus courante : le "devis trop vague"</h2>
<p>Exemple typique :</p>
<div class="info-box"><em>"Renovation salle de bain complete — 8 500 EUR HT"</em></div>
<p>Ce devis est juridiquement tres faible. En cas de litige :</p>
<ul>
<li>Le client peut contester la nature des prestations effectuees</li>
<li>Vous ne pouvez pas facturer de travaux supplementaires sans avenant</li>
<li>Le tribunal peut requalifier en obligation de resultat plutot que de moyens</li>
</ul>
<p><strong>Le bon format :</strong></p>
<table>
<tr><th>Description</th><th>Qte</th><th>PU HT</th><th>Total HT</th><th>TVA</th></tr>
<tr><td>Depose baignoire existante + evacuation</td><td>1</td><td>220</td><td>220</td><td>10%</td></tr>
<tr><td>Pose receveur douche extra-plat 90x120 (fourniture comprise)</td><td>1</td><td>850</td><td>850</td><td>10%</td></tr>
<tr><td>Pose paroi de douche verre securit (fourniture)</td><td>1</td><td>620</td><td>620</td><td>10%</td></tr>
<tr><td>Carrelage sol grand format 60x60 (fourniture + pose)</td><td>6 m2</td><td>85</td><td>510</td><td>10%</td></tr>
<tr><td>Faience murale 25x40 (fourniture + pose)</td><td>18 m2</td><td>55</td><td>990</td><td>10%</td></tr>
<tr><td>...</td><td></td><td></td><td></td><td></td></tr>
</table>
<p>Chaque ligne = 1 prestation precise. Chaque poste a son prix separe. Le client comprend ce qu'il achete, et vous etes proteges.</p>

<h2>Structurer le devis pour convertir 60 % au lieu de 30 %</h2>

<h3>1. La page de garde qui rassure</h3>
<p>En premiere page, avant meme le detail :</p>
<ul>
<li>Vos logos de certifications (RGE, Qualibat, etc.)</li>
<li>Vos chiffres cles ("<em>12 ans d'experience, 380 chantiers realises, 97 % de satisfaction client</em>")</li>
<li>Votre note Google + nombre d'avis</li>
<li>Photo d'un chantier similaire acheve</li>
</ul>

<h3>2. Le recapitulatif visuel des 4 phases</h3>
<p>Avant le detail financier, une page qui montre le parcours :</p>
<ol>
<li>Preparation du chantier (protection sol, demolition)</li>
<li>Gros oeuvre et plomberie</li>
<li>Pose carrelage et finitions</li>
<li>Livraison et garantie 10 ans</li>
</ol>
<p>Cette page aide le client non-technicien a comprendre le processus et justifie le prix.</p>

<h3>3. Le chiffrage des aides</h3>
<p>Si votre client est eligible a MaPrimeRenov' ou CEE, chiffrez le reste-a-charge :</p>
<table>
<tr><th></th><th>Montant</th></tr>
<tr><td>Devis total TTC</td><td>9 350 EUR</td></tr>
<tr><td>MaPrimeRenov' (profil intermediaire)</td><td>-2 500 EUR</td></tr>
<tr><td>CEE partenaire EDF</td><td>-1 200 EUR</td></tr>
<tr><td><strong>Reste a charge client</strong></td><td><strong>5 650 EUR</strong></td></tr>
</table>
<p>Resultat : un devis a 9 350 EUR devient un investissement a 5 650 EUR. Le taux de conversion double en moyenne.</p>

<h3>4. La comparaison versus "ne rien faire"</h3>
<p>Pour les chantiers de renovation energetique, ajoutez le calcul d'economie :</p>
<ul>
<li>Facture energie actuelle : 2 400 EUR/an</li>
<li>Apres travaux : 1 450 EUR/an (estimation DPE)</li>
<li>Economie annuelle : <strong>950 EUR</strong></li>
<li>Retour sur investissement : 5,9 ans</li>
</ul>

<h3>5. La signature a 2 colonnes</h3>
<p>Pas "<em>bon pour accord</em>" sec. Presenter :</p>
<ul>
<li>Colonne gauche : "<em>J'accepte ce devis et souhaite programmer le chantier</em>"</li>
<li>Colonne droite : "<em>Je souhaite discuter d'ajustements</em>" + numero de telephone</li>
</ul>
<p>Cela ouvre la porte a la negociation plutot qu'au rejet silencieux.</p>

<h2>Les CGV BTP 2026 : 7 clauses indispensables</h2>
<ol>
<li><strong>Acceptation du devis</strong> : validite, modalites de signature electronique</li>
<li><strong>Acompte</strong> : 30 % a la commande, 40 % a mi-chantier, 30 % a la livraison (schema classique)</li>
<li><strong>Delais d'execution</strong> : date de debut indicative, cas de retard (intemperies, liberalite du client)</li>
<li><strong>Revision de prix</strong> : formule d'ajustement si duree du chantier > 6 mois (indice BT01)</li>
<li><strong>Reserve de propriete</strong> : les materiaux non payes restent propriete de l'artisan</li>
<li><strong>Clause de garantie</strong> : parfait achevement (1 an), biennale, decennale</li>
<li><strong>Tribunal competent et droit applicable</strong></li>
</ol>

<div class="info-box"><strong>Astuce pro :</strong> faites valider vos CGV par un avocat specialise BTP une seule fois (budget : 400 a 800 EUR). Ensuite reutilisables a l'infini. Plus rentable qu'une clause defaillante qui vous coute 20 000 EUR en litige.</div>

<h2>La dematerialisation du devis en 2026</h2>
<p>Depuis 2025, le devis peut etre signe electroniquement via des outils comme DocuSign, Yousign ou Signaturit (environ 10 a 25 EUR/mois). Avantages :</p>
<ul>
<li>Signature du client a distance, sans rendez-vous</li>
<li>Horodatage legal certifie (EIDAS)</li>
<li>Conservation legale 10 ans chez le prestataire</li>
<li>Taux de retour signe : 70-80 % contre 40-50 % pour papier</li>
</ul>

<h2>Combien de temps passer sur un devis ?</h2>
<p>Pour un chantier de plus de 5 000 EUR : minimum 2 heures de chiffrage serieux, et 30 minutes de mise en forme commerciale. Un devis bacle = un chantier perdu ou un litige a venir. Un devis impeccable = 60 % de conversion.</p>
""",
  "related":[
    ("prix-travaux-renovation-2026-bareme-artisan.html","Prix travaux 2026 : barème"),
    ("tva-btp-2026-taux-matrice.html","TVA BTP 2026 : matrice complète"),
    ("impayes-chantier-recouvrement-artisan-2026.html","Gérer les impayés de chantier"),
  ],
})

# ARTICLE 27 : Optimisation fiscale artisan
ARTICLES.append({
  "slug":"optimisation-fiscale-artisan-btp-charges-deductibles-2026",
  "title":"Optimisation fiscale artisan BTP 2026 : charges déductibles, frais pro et économie d'impôt",
  "meta":"Comment réduire légalement son impôt en 2026 : vehicule, repas, carburant, materiel, formation, PER. Tableau complet des charges deductibles BTP.",
  "kw":"charges deductibles artisan, optimisation fiscale btp, frais professionnels artisan, reduction impot bic, per artisan",
  "h1":"Optimisation fiscale de l'artisan BTP en 2026 : charges déductibles et économies d'impôt",
  "read":13,
  "summary":[
    "Le classement des 30 charges deductibles BIC (tableau complet avec exemples)",
    "Les pieges des charges mixtes (vehicule, telephone, local)",
    "Les 5 leviers d'optimisation legale : PER, formation, investissement, amortissement, emploi",
    "Comment passer de 35 % a 22 % de taux d'imposition effectif",
  ],
  "body":"""
<h2>Le principe : distinguer charge pro et charge personnelle</h2>
<p>Pour qu'une depense soit deductible de votre benefice BIC (et donc reduire votre impot), elle doit etre :</p>
<ul>
<li><strong>Engagee dans l'interet de l'entreprise</strong> (pas personnel)</li>
<li><strong>Justifiee</strong> (facture au nom de la societe, note de frais nominative)</li>
<li><strong>Inscrite en comptabilite</strong> avant le 31 decembre</li>
<li><strong>Non somptuaire</strong> (depenses de luxe non justifiees)</li>
</ul>
<p>L'article 39-1 du CGI precise : "<em>le benefice net est etabli sous deduction de toutes charges [...] celles-ci comprennent notamment les frais generaux de toute nature</em>".</p>

<h2>Les 30 charges deductibles BIC les plus courantes pour l'artisan</h2>

<h3>Vehicule et deplacements</h3>
<table>
<tr><th>Charge</th><th>Deductible</th><th>Conditions</th></tr>
<tr><td>Carburant</td><td>Oui</td><td>Justificatifs + livret de bord recommande</td></tr>
<tr><td>Entretien/reparations</td><td>Oui</td><td>Facture nominative societe</td></tr>
<tr><td>Assurance vehicule</td><td>Oui</td><td>100 % si vehicule societe</td></tr>
<tr><td>Amortissement vehicule utilitaire</td><td>Oui</td><td>100 %, duree 4 a 5 ans</td></tr>
<tr><td>Amortissement vehicule de tourisme</td><td>Plafonne</td><td>Plafond 18 300 EUR (normal) / 20 300 EUR (hybride) / 30 000 EUR (VE)</td></tr>
<tr><td>Peage, parking</td><td>Oui</td><td>Justificatifs</td></tr>
<tr><td>Location vehicule (LLD/LOA)</td><td>Oui</td><td>Plafonne comme amortissement</td></tr>
<tr><td>Indemnites kilometriques (si vehicule perso)</td><td>Oui</td><td>Bareme URSSAF 2026, livret tenu</td></tr>
</table>

<h3>Materiel et outillage</h3>
<table>
<tr><th>Charge</th><th>Deductible</th><th>Conditions</th></tr>
<tr><td>Outillage < 500 EUR HT</td><td>Oui, 100 %</td><td>Charge directe</td></tr>
<tr><td>Outillage > 500 EUR HT</td><td>Oui, amorti</td><td>Duree selon barème (3 a 10 ans)</td></tr>
<tr><td>Echafaudages</td><td>Oui, amorti</td><td>Duree 5 a 10 ans</td></tr>
<tr><td>Equipements informatiques</td><td>Oui, amorti</td><td>Duree 3 ans</td></tr>
<tr><td>Logiciels de gestion</td><td>Oui</td><td>Abonnement : charge directe ; achat : amorti 1 a 3 ans</td></tr>
</table>

<h3>Bureaux et local</h3>
<table>
<tr><th>Charge</th><th>Deductible</th><th>Conditions</th></tr>
<tr><td>Loyer local professionnel</td><td>Oui</td><td>Bail commercial ou professionnel</td></tr>
<tr><td>Loyer SCI (vous etes associe)</td><td>Oui</td><td>Bail en bonne et due forme, loyer de marche</td></tr>
<tr><td>Electricite, gaz, eau local</td><td>Oui</td><td>100 % local pro</td></tr>
<tr><td>Internet pro, telephonie fixe</td><td>Oui</td><td>Facture societe</td></tr>
<tr><td>Telephone portable</td><td>Oui</td><td>Si utilisation pro > 80 %</td></tr>
<tr><td>Usage privatif local (bureau domicile)</td><td>Oui, quote-part</td><td>Calcul surface dediee / surface totale + factures</td></tr>
</table>

<h3>Personnel</h3>
<table>
<tr><th>Charge</th><th>Deductible</th><th>Conditions</th></tr>
<tr><td>Salaires + charges patronales</td><td>Oui, 100 %</td><td>Ecritures conformes</td></tr>
<tr><td>Interim</td><td>Oui</td><td>Facture agence</td></tr>
<tr><td>Sous-traitance</td><td>Oui</td><td>Facture avec mention autoliquidation</td></tr>
<tr><td>Repas de chantier (midi)</td><td>Oui</td><td>Plafond : 5,45 EUR/repas si deductible, ou tickets resto</td></tr>
<tr><td>Vetements de travail (EPI + tenue)</td><td>Oui, 100 %</td><td>Vetement professionnel uniquement</td></tr>
<tr><td>Formation professionnelle</td><td>Oui, 100 %</td><td>En lien avec l'activite</td></tr>
<tr><td>Credit d'impot formation dirigeant</td><td>Oui</td><td>Jusqu'a 423,52 EUR/an supplementaire</td></tr>
</table>

<h3>Assurances et cotisations</h3>
<table>
<tr><th>Charge</th><th>Deductible</th><th>Conditions</th></tr>
<tr><td>RC Pro</td><td>Oui, 100 %</td><td>-</td></tr>
<tr><td>Decennale</td><td>Oui, 100 %</td><td>-</td></tr>
<tr><td>Multirisque pro</td><td>Oui, 100 %</td><td>-</td></tr>
<tr><td>Prevoyance dirigeant (loi Madelin)</td><td>Oui</td><td>Plafond 3,75 % PASS + 7 % (PASS x fraction)</td></tr>
<tr><td>Mutuelle entreprise</td><td>Oui</td><td>Accord ou contrat groupe</td></tr>
<tr><td>Cotisations URSSAF dirigeant</td><td>Oui, 100 %</td><td>-</td></tr>
<tr><td>Cotisation chambres consulaires (CMA)</td><td>Oui</td><td>-</td></tr>
</table>

<h3>Divers</h3>
<table>
<tr><th>Charge</th><th>Deductible</th><th>Conditions</th></tr>
<tr><td>Honoraires expert-comptable</td><td>Oui</td><td>-</td></tr>
<tr><td>Honoraires avocat</td><td>Oui</td><td>Si en rapport avec activite</td></tr>
<tr><td>Publicite (Google Ads, flyers, site web)</td><td>Oui, 100 %</td><td>-</td></tr>
<tr><td>Cadeaux clients</td><td>Oui</td><td>Plafond 73 EUR/an/client max, valeur de bon gout</td></tr>
<tr><td>Repas client d'affaires</td><td>Oui, 50 %</td><td>Justificatif + identite du client</td></tr>
</table>

<h2>Les pieges des charges mixtes</h2>

<h3>Piege 1 : le vehicule mixte</h3>
<p>Si votre fourgon est utilise 30 % en perso et 70 % en pro, seule la quote-part pro est deductible. Tenez un carnet de bord kilometrique. Sans livret, l'administration peut refuser 100 % de la deduction.</p>

<h3>Piege 2 : le telephone "personnel pro"</h3>
<p>Votre mobile est-il a 80 % pro ? Il faut pouvoir le prouver (analyse des appels, usage professionnel dominant). Sinon, le fisc reintegre 50 % de la charge dans le benefice imposable.</p>

<h3>Piege 3 : le repas de chantier</h3>
<p>Attention : vous ne pouvez pas deduire TOUS vos repas au pretexte que vous etes en chantier. Seule la difference entre un repas normal (5,45 EUR en 2026) et le cout effectif peut etre deduite. Mieux vaut mettre en place des tickets restaurant pour vos salaries (deduction totale).</p>

<h3>Piege 4 : les vetements</h3>
<p>Une veste de travail avec votre logo ? Deductible. Un pantalon de ville que vous portez au bureau ? NON. Seuls les vetements "<em>proprement professionnels</em>" (impossibles a porter en dehors du travail) sont deductibles.</p>

<h2>Les 5 leviers d'optimisation legale</h2>

<h3>Levier 1 : Le PER (deduction immediate jusqu'a 10 % des BIC)</h3>
<p>Chaque 1 000 EUR verse sur un PER :</p>
<ul>
<li>Deduit 1 000 EUR du revenu imposable</li>
<li>Economie immediate : 300 a 450 EUR d'impot (selon TMI)</li>
<li>Capital constitue pour la retraite</li>
</ul>
<p>Plafond 2026 : 10 % des BIC OU 4 PASS (37 094 EUR), au plus eleve. Pour un artisan a 60 000 EUR de BIC, possibilite de verser jusqu'a <strong>6 000 EUR/an deductibles</strong>.</p>

<h3>Levier 2 : Le CIT et le credit formation dirigeant</h3>
<p>Le credit d'impot formation dirigeant permet de recuperer jusqu'a <strong>423,52 EUR/an</strong> pour toute formation suivie par le chef d'entreprise (40h annuels x SMIC horaire). En plus des cotisations CPF.</p>

<h3>Levier 3 : Amortissement intelligent</h3>
<p>Planifier les gros investissements sur les annees fastes. Un outillage achete en novembre pour 8 000 EUR HT avec amortissement degressif sur 5 ans reduit l'assiette imposable de 2 000 EUR la premiere annee.</p>

<h3>Levier 4 : Embauche et charges sociales</h3>
<p>Un premier salarie a 25 000 EUR brut = 35 000 EUR de cout total (charges patronales 40 %). Cette depense est 100 % deductible, et genere du chiffre d'affaires supplementaire. A partir de 3 a 4 mois de CA genere, l'operation est rentable.</p>

<h3>Levier 5 : La SCI + bail commercial</h3>
<p>Acheter votre local via une SCI familiale, puis louer ce local a votre entreprise via bail commercial. Le loyer devient :</p>
<ul>
<li>Charge deductible pour l'entreprise (baisse BIC)</li>
<li>Revenu foncier pour vous (imposition possiblement moins lourde)</li>
<li>Patrimoine constitue (plus-value a terme, transmission aux enfants)</li>
</ul>

<h2>De 35 % a 22 % de taux effectif : un cas concret</h2>
<table>
<tr><th>Poste</th><th>Avant optimisation</th><th>Apres optimisation</th></tr>
<tr><td>CA HT</td><td>120 000 EUR</td><td>120 000 EUR</td></tr>
<tr><td>Charges deductibles declarees</td><td>72 000 EUR</td><td>87 000 EUR</td></tr>
<tr><td>PER (versement)</td><td>0 EUR</td><td>5 000 EUR</td></tr>
<tr><td>Credit formation dirigeant</td><td>0 EUR</td><td>-420 EUR</td></tr>
<tr><td>BIC imposable</td><td>48 000 EUR</td><td>28 000 EUR</td></tr>
<tr><td>Impot sur le revenu (TMI 30%)</td><td>~11 500 EUR</td><td>~5 200 EUR</td></tr>
<tr><td>Taux effectif</td><td>9,6 % du CA</td><td>4,3 % du CA</td></tr>
</table>
<p>Economie nette : <strong>6 300 EUR/an</strong> d'impot en moins. Sur 10 ans, 63 000 EUR supplementaires dans votre poche.</p>

<h2>Dernier conseil : l'expert-comptable</h2>
<p>Pour 1 500 a 3 000 EUR/an, un expert-comptable qui connait le BTP repere 3 000 a 8 000 EUR d'optimisations supplementaires par an. ROI positif quasi systematique. La comptabilite en interne sur Excel est une fausse economie.</p>
""",
  "related":[
    ("statut-juridique-artisan-btp-2026.html","Statut juridique de l'artisan BTP"),
    ("retraite-artisan-btp-preparation-cipav-rsi-2026.html","Retraite artisan BTP 2026"),
    ("tva-btp-2026-taux-matrice.html","TVA BTP 2026 : matrice complète"),
  ],
})

# ARTICLE 28 : Amiante
ARTICLES.append({
  "slug":"amiante-btp-sous-section-3-4-reglementation-artisan-2026",
  "title":"Amiante dans le BTP 2026 : sous-section 3 et 4, formations, diagnostic et prix",
  "meta":"Amiante en 2026 : quand c'est obligatoire, qui peut intervenir, sous-section 3 et 4, formation amiante artisan, prix diagnostic, DTA, RAT.",
  "kw":"amiante btp, sous-section 3, sous-section 4, formation amiante artisan, diagnostic amiante, dta",
  "h1":"Amiante dans le BTP en 2026 : sous-section 3 et 4, diagnostics, formation et prix",
  "read":12,
  "summary":[
    "Le cadre legal : decret 2012-639, code du travail R4412",
    "Sous-section 3 vs sous-section 4 : quelles interventions, quelles formations",
    "Les diagnostics obligatoires : DTA, RAT, DAPP, repérage avant travaux",
    "Prix des formations et equipements : 3 500 a 12 000 EUR pour s'equiper",
  ],
  "body":"""
<h2>Pourquoi l'amiante reste un enjeu majeur en 2026</h2>
<p>Bien que l'amiante soit interdit en France depuis 1997, il reste present dans <strong>17 millions de logements</strong> construits avant cette date, selon les estimations de l'ADEME. Chaque artisan du BTP est susceptible de le rencontrer, et son exposition provoque encore <strong>plus de 3 000 deces par an</strong> en France (cancers, mesotheliome, asbestose).</p>
<p>Le cadre reglementaire en 2026 est strict : toute intervention sur materiau amiante doit etre effectuee par une entreprise certifiee, avec du personnel forme, en respectant une procedure stricte.</p>

<h2>Le cadre legal : sous-section 3 vs sous-section 4</h2>

<h3>Sous-section 3 (SS3) : retrait ou encapsulage d'amiante</h3>
<p>C'est le cas quand les travaux ont pour <strong>objet principal</strong> de traiter l'amiante : desamiantage, encapsulage, depose de flocage. Nécessite :</p>
<ul>
<li>Certification "SS3" de l'entreprise par un organisme accredite (Qualibat 1552, AFNOR Certification, LNE...)</li>
<li>Personnel forme au niveau 1 (operateur), niveau 2 (encadrant) ou niveau 3 (employeur/donneur d'ordre)</li>
<li>Plan de retrait prealable valide par l'inspection du travail + CRAMIF 2 mois avant</li>
<li>Zone confinée avec depression et filtration absolue</li>
<li>Controles environnementaux : 1 prelevement tous les 10 m2 en cours de chantier</li>
</ul>
<div class="info-box"><strong>Exemples SS3 :</strong> desamiantage d'un flocage de cave, retrait de dalles de sol amiante, traitement de plaque fibrociment toiture.</div>

<h3>Sous-section 4 (SS4) : interventions sur materiaux amiantes</h3>
<p>C'est le cas quand les travaux <strong>rencontrent</strong> l'amiante par accessoires (peinture, carrelage, plomberie) mais ne visent pas a le retirer. Nécessite :</p>
<ul>
<li>Formation "SS4" de tout le personnel intervenant</li>
<li>Mode operatoire specifique (MOA/MOE)</li>
<li>EPI adapte : combinaison jetable categorie III type 5, masque FFP3 ou respiratoire T.M3P</li>
<li>Confinement par sas, ventilation adaptee</li>
<li>Elimination des dechets en installation agreee</li>
</ul>
<div class="info-box"><strong>Exemples SS4 :</strong> remplacement d'un robinet sur mur contenant de l'amiante, percage d'un mur amiante pour passage de cables, depose d'un radiateur fixe sur mur amiante.</div>

<h2>Les formations amiante en 2026</h2>

<h3>Formation sous-section 4</h3>
<table>
<tr><th>Niveau</th><th>Public</th><th>Duree</th><th>Prix</th></tr>
<tr><td>Operateur SS4</td><td>Ouvriers</td><td>5 jours initial + 1 jour/an recyclage</td><td>800 a 1 400 EUR</td></tr>
<tr><td>Encadrant SS4</td><td>Chefs d'equipe</td><td>5 jours initial + 1 jour/an recyclage</td><td>900 a 1 500 EUR</td></tr>
<tr><td>Donneur d'ordre/Employeur SS4</td><td>Chef d'entreprise</td><td>3 jours initial + 1 jour/an recyclage</td><td>750 a 1 200 EUR</td></tr>
</table>

<h3>Formation sous-section 3</h3>
<table>
<tr><th>Niveau</th><th>Duree</th><th>Prix</th></tr>
<tr><td>Operateur SS3 niveau 1</td><td>5 jours</td><td>1 200 a 1 800 EUR</td></tr>
<tr><td>Encadrant de chantier SS3 niveau 2</td><td>10 jours</td><td>2 400 a 3 200 EUR</td></tr>
<tr><td>Encadrant technique SS3 niveau 3</td><td>10 jours</td><td>2 800 a 3 800 EUR</td></tr>
</table>
<p>Organismes certifies : CERFA, Forma Pole, Apave Formation, CNFPT (pour les collectivites). Certificat valable 1 an (recyclage annuel obligatoire).</p>

<h2>Les diagnostics obligatoires</h2>

<h3>Dossier Technique Amiante (DTA)</h3>
<p>Obligatoire pour tous les immeubles construits avant le 1er juillet 1997 qui comportent des parties communes. Contient la liste des materiaux amiantes et leur etat de conservation.</p>

<h3>Repérage Avant Travaux (RAT) - depuis 2019</h3>
<p>Obligatoire pour <strong>tous les travaux</strong> dans un immeuble construit avant 1997, quelle que soit la nature. Avant tout chantier :</p>
<ul>
<li>Le maitre d'ouvrage commande un RAT a un operateur certifie</li>
<li>Le rapport RAT identifie les materiaux contenant de l'amiante dans la zone d'intervention</li>
<li>Il est transmis a l'entreprise de travaux qui adapte son mode operatoire (SS3 ou SS4)</li>
</ul>
<p>Prix d'un RAT : 400 a 1 200 EUR selon la surface et complexite.</p>
<div class="warning-box"><strong>Sanctions absence RAT :</strong> amende administrative 9 000 EUR (personne physique) ou 45 000 EUR (personne morale). Plus les arrets de chantier en cas de controle inspection du travail.</div>

<h3>Diagnostic Amiante des Parties Privatives (DAPP)</h3>
<p>Pour les appartements en copropriete, depuis 2023. Obligatoire avant vente ou location.</p>

<h2>Equipement necessaire pour faire de la SS4</h2>
<p>Pour s'equiper completement en SS4 (hors formation) :</p>
<table>
<tr><th>Equipement</th><th>Prix 2026</th></tr>
<tr><td>Masque respiratoire a adduction d'air + ventilation</td><td>800 a 2 500 EUR</td></tr>
<tr><td>Combinaisons jetables categorie III type 5 (lot 25)</td><td>180 EUR</td></tr>
<tr><td>Sas a 3 compartiments (location)</td><td>50 EUR/jour</td></tr>
<tr><td>Ventilateur extracteur filtre HEPA</td><td>1 800 a 3 500 EUR</td></tr>
<tr><td>Aspirateur classe H amiante</td><td>650 a 1 400 EUR</td></tr>
<tr><td>Outillage specifique (decoupe, percage humide)</td><td>500 a 1 500 EUR</td></tr>
<tr><td>Big bag jetable amiante (lot 10)</td><td>120 EUR</td></tr>
</table>
<p>Budget total initial : <strong>4 000 a 10 000 EUR</strong> pour s'equiper, hors formation.</p>

<h2>Elimination des dechets : obligation legale</h2>
<p>Les dechets amiantes ont un traitement specifique :</p>
<ul>
<li>Amiante-ciment (toitures, descentes pluviales) : dechet dangereux, BSDA + ICPE 2770 ou 2790</li>
<li>Amiante friable (flocage, calorifugeage) : dechet ultra-dangereux, installation agreee obligatoire</li>
<li>Transport en BSDA (Bordereau de Suivi Dechet Amiante) nominatif</li>
</ul>
<p>Cout d'elimination : 350 a 700 EUR/tonne pour amiante-ciment, 1 200 a 2 000 EUR/tonne pour amiante friable.</p>

<h2>Marge commerciale et positionnement</h2>
<p>L'amiante fait peur aux clients, mais cree un creneau rentable :</p>
<ul>
<li>Peu d'entreprises certifiees dans le residentiel (moins de 2 500 en France en SS3)</li>
<li>Tarifs SS3 : 100 a 180 EUR/m2 pour desamiantage simple</li>
<li>Tarifs SS4 : surcout de 40 a 80 % par rapport a une intervention normale</li>
<li>Marge moyenne : 25 a 40 % vs 15 a 25 % en renovation classique</li>
</ul>
<p>Pour un artisan qui fait souvent du residentiel ancien, se former en SS4 est quasi indispensable en 2026 (et un argument commercial puissant).</p>
""",
  "related":[
    ("accident-travail-btp-prevention-demarches-artisan-2026.html","Accident du travail BTP"),
    ("securite-chantier-prevention-tms-artisan-2026.html","Sécurité chantier : prévention"),
    ("assurance-decennale-btp-2026.html","Assurance décennale BTP 2026"),
  ],
})

# ARTICLE 29 : VMC double flux
ARTICLES.append({
  "slug":"vmc-double-flux-installation-artisan-btp-2026",
  "title":"VMC double flux 2026 : installation artisan, dimensionnement, aides clients et marges",
  "meta":"Marche VMC double flux +45 % en 2 ans. Installation, dimensionnement, coupes thermiques, prix, aides MaPrimeRenov', marges artisan BTP.",
  "kw":"vmc double flux, installation vmc, ventilation mecanique controlee, artisan vmc, maprimerenov vmc",
  "h1":"VMC double flux en 2026 : installation artisan, dimensionnement et stratégie commerciale",
  "read":11,
  "summary":[
    "Pourquoi la VMC double flux est LE produit de renovation a vendre en 2026",
    "Dimensionnement, réseau, echangeur : les points techniques critiques",
    "Les aides clients : MaPrimeRenov' (jusqu'a 2 500 EUR) + CEE",
    "Prix pose, marge artisan et positionnement commercial",
  ],
  "body":"""
<h2>Pourquoi la VMC double flux explose en 2026</h2>
<p>Le marche de la VMC double flux a progresse de <strong>+45 % en 2 ans</strong> (source CLER, 2025). Trois facteurs expliquent cette croissance :</p>
<ul>
<li><strong>RE2020 :</strong> la norme thermique impose la VMC double flux dans les logements neufs BBC Plus</li>
<li><strong>Aides reinforcees :</strong> MaPrimeRenov' + CEE couvrent jusqu'a 40 % du cout pour les menages modestes</li>
<li><strong>Prise de conscience qualite de l'air :</strong> COVID + legionellose + allergies ont cree une demande forte</li>
</ul>
<p>Le marche francais represente 180 000 installations/an en 2025, contre 125 000 en 2022.</p>

<h2>VMC double flux vs simple flux : la difference</h2>
<table>
<tr><th>Critere</th><th>VMC simple flux</th><th>VMC double flux</th></tr>
<tr><td>Principe</td><td>Extraction air vicie, entrees d'air naturelles</td><td>Extraction vicie + insufflation air neuf + echangeur</td></tr>
<tr><td>Recuperation de chaleur</td><td>Aucune</td><td>70 a 95 %</td></tr>
<tr><td>Qualite air entrant</td><td>Air exterieur brut</td><td>Filtre (F7 a F9) avant insufflation</td></tr>
<tr><td>Consommation energetique</td><td>Faible</td><td>30 a 60 W en fonctionnement</td></tr>
<tr><td>Prix pose 100 m2</td><td>1 200 a 2 500 EUR</td><td>5 000 a 9 500 EUR</td></tr>
<tr><td>Economie energie hiver</td><td>0</td><td>500 a 900 EUR/an</td></tr>
<tr><td>Reduction DPE</td><td>Negligeable</td><td>-1 classe possible</td></tr>
</table>

<h2>Les points techniques critiques pour l'installation</h2>

<h3>1. Dimensionnement des debits</h3>
<p>Les debits sont normes par l'arrete du 24 mars 1982 (et son actualisation 2020). Pour un logement T4 de 100 m2 :</p>
<ul>
<li>Cuisine : 75 m3/h a 135 m3/h selon activite</li>
<li>Salle de bain : 30 m3/h</li>
<li>WC : 15 m3/h</li>
<li>Salle d'eau : 30 m3/h</li>
<li>Autres pieces : debit nominal d'insufflation</li>
</ul>
<p>Un sous-dimensionnement = inefficacite et humidite. Un sur-dimensionnement = consommation energie + nuisance sonore.</p>

<h3>2. Reseau de gaines</h3>
<p>Regles a respecter :</p>
<ul>
<li>Gaines isolees (laine de roche 25 mm ou mousse PE)</li>
<li>Diametre adapte au debit (125 mm minimum pour 100 m3/h)</li>
<li>Pertes de charge maxi 0,5 Pa/m</li>
<li>Longueur maxi : 8 m pour extraction, 12 m pour insufflation</li>
<li>Coudes limites (chaque coude = perte de charge equivalente a 4 m de gaine droite)</li>
<li>Passage en volume chauffe autant que possible (combles amenages, doublage)</li>
</ul>

<h3>3. Echangeur thermique</h3>
<p>Trois technologies :</p>
<ul>
<li><strong>Echangeur a plaques :</strong> 70-85 % de rendement, entretien facile, prix moyen</li>
<li><strong>Echangeur rotatif :</strong> 80-92 % de rendement, recupere aussi l'humidite, prix +30 %</li>
<li><strong>Echangeur a contre-courant :</strong> 85-95 % rendement, ideal en renovation</li>
</ul>

<h3>4. Placement du caisson</h3>
<p>Le caisson doit etre :</p>
<ul>
<li>En volume chauffe (combles amenages, local technique)</li>
<li>Accessible pour maintenance (filtres tous les 3 a 6 mois)</li>
<li>Isole acoustiquement (plots anti-vibration)</li>
<li>A distance minimale des pieces de vie (6 m ideal)</li>
</ul>

<h3>5. Prises d'air exterieures</h3>
<ul>
<li>Distance mini 8 m entre prise d'air neuf et rejet d'air vicie</li>
<li>Hauteur de prise d'air a 1 m minimum du sol (eviter pollution ras sol)</li>
<li>Grille anti-insectes obligatoire</li>
<li>Orientation : Nord ou Est ideal (eviter surchauffe ete)</li>
</ul>

<h2>Les aides clients : leverage commercial</h2>

<h3>MaPrimeRenov' 2026</h3>
<table>
<tr><th>Profil menage</th><th>Montant max pour VMC DF</th></tr>
<tr><td>Bleu (tres modeste)</td><td>2 500 EUR</td></tr>
<tr><td>Jaune (modeste)</td><td>2 000 EUR</td></tr>
<tr><td>Violet (intermediaire)</td><td>1 500 EUR</td></tr>
<tr><td>Rose (superieur)</td><td>0 EUR (hors Serenite)</td></tr>
</table>

<h3>CEE (Certificats Economies Energie)</h3>
<ul>
<li>Prime CEE VMC DF : 600 a 1 500 EUR selon fournisseur</li>
<li>Bonification "Coup de Pouce" en zone prioritaire</li>
<li>Cumul possible avec MaPrimeRenov'</li>
</ul>

<h3>Eco-PTZ</h3>
<p>Pret a taux zero jusqu'a 30 000 EUR sur 15 ans. Combinable avec MaPrimeRenov' et CEE. L'artisan RGE oriente le client vers sa banque partenaire.</p>

<h2>Prix pose, marge artisan et positionnement</h2>
<table>
<tr><th>Poste</th><th>Prix HT</th></tr>
<tr><td>Materiel standard VMC DF (T4 100 m2)</td><td>1 400 a 2 200 EUR</td></tr>
<tr><td>Materiel premium (rendement 90%+)</td><td>2 800 a 4 500 EUR</td></tr>
<tr><td>Gaines + bouches + grilles (T4)</td><td>600 a 950 EUR</td></tr>
<tr><td>Main d'oeuvre (2 personnes x 3 a 5 jours)</td><td>1 800 a 3 200 EUR</td></tr>
<tr><td>Mise en service + reglages</td><td>300 a 450 EUR</td></tr>
<tr><td><strong>Prix total HT client T4 standard</strong></td><td><strong>4 100 a 6 800 EUR</strong></td></tr>
<tr><td><strong>TTC (TVA 10 % renovation)</strong></td><td><strong>4 510 a 7 480 EUR</strong></td></tr>
</table>
<p>Marge artisan moyenne : <strong>30 a 40 %</strong> sur la main d'oeuvre, <strong>15 a 25 %</strong> sur la fourniture. Un bon chantier T4 VMC DF rapporte <strong>1 500 a 2 500 EUR de marge nette</strong>.</p>

<h2>Comment vendre la VMC double flux</h2>

<h3>Angle 1 : le confort thermique</h3>
<p>"<em>Plus de courants d'air froid en hiver (entrees d'air supprimees), temperature homogene dans tout le logement, qualite d'air constante.</em>"</p>

<h3>Angle 2 : l'economie energetique</h3>
<p>Chiffrer explicitement : "<em>Vous economiserez 600 a 900 EUR/an sur votre facture chauffage. Retour sur investissement en 6 a 8 ans.</em>"</p>

<h3>Angle 3 : la sante</h3>
<p>"<em>Filtration F7 = 95 % des pollens retenus. F9 = 99 % des particules fines PM2.5. Idéal pour allergiques et jeunes enfants.</em>"</p>

<h3>Angle 4 : la plus-value immobiliere</h3>
<p>Un logement avec VMC double flux vaut 2 a 4 % plus cher a la revente. Sur un appartement a 300 000 EUR, c'est 6 000 a 12 000 EUR.</p>

<h2>Qualification et certification</h2>
<p>Pour poser de la VMC double flux eligible aux aides :</p>
<ul>
<li>QUALIBAT 5242 : ventilation mecanique controlee</li>
<li>RGE Eco Artisan (Qualibat ou Qualit'EnR)</li>
<li>Formation constructeur (Aldes, Atlantic, Zehnder) recommandee : 2-3 jours, 800 a 1 400 EUR</li>
</ul>
""",
  "related":[
    ("isolation-thermique-exterieure-ite-artisan-2026.html","ITE : isolation thermique extérieure"),
    ("pompes-a-chaleur-installation-artisan-2026.html","Pompes à chaleur : installation artisan"),
    ("devenir-rge-2026.html","Comment devenir RGE en 2026"),
  ],
})

# ARTICLE 30 : Adaptation PMR
ARTICLES.append({
  "slug":"adaptation-logement-pmr-seniors-artisan-btp-2026",
  "title":"Adaptation du logement aux seniors et PMR en 2026 : marché, aides MaPrimeAdapt' et marges",
  "meta":"Le marché d'adaptation des logements aux seniors explose : +35 % en 3 ans. MaPrimeAdapt' 2026 jusqu'a 22 000 EUR, CRT, certification Handibat.",
  "kw":"adaptation logement pmr, maprimeadapt, handibat, seniors renovation, douche italienne senior, artisan pmr",
  "h1":"Adaptation du logement aux seniors et PMR en 2026 : un marché artisan en forte croissance",
  "read":11,
  "summary":[
    "Le boom du marche : 16 millions de plus de 65 ans en France, 85 % souhaitent vieillir chez eux",
    "MaPrimeAdapt' 2026 : jusqu'a 22 000 EUR d'aide, dispositif simplifie",
    "Les certifications : Handibat, Pros Adapt, agrement prefecture",
    "Les travaux les plus demandes et leurs marges 2026",
  ],
  "body":"""
<h2>Pourquoi le marche "autonomie a domicile" est un des plus dynamiques en 2026</h2>
<p>Les chiffres demographiques :</p>
<ul>
<li>16 millions de plus de 65 ans en France en 2026 (+2 millions vs 2020)</li>
<li>8,5 millions de plus de 75 ans en 2040 (projections INSEE)</li>
<li><strong>85 % souhaitent vieillir chez eux</strong> (enquete DREES 2025)</li>
<li>Seulement 6 % des logements sont reellement adaptes</li>
</ul>
<p>Consequence : un potentiel d'adaptation de <strong>10 a 14 millions de logements</strong> sur 15 ans, soit un marche estime a <strong>150 milliards EUR</strong>. Les artisans formes a ce marche sont debordes de demande.</p>

<h2>MaPrimeAdapt' 2026 : le dispositif cle</h2>
<p>Lance en 2024, MaPrimeAdapt' remplace les anciens dispositifs Anah "Habitat sain" et CRT. C'est devenu LE levier de financement pour l'adaptation au vieillissement.</p>

<h3>Conditions d'eligibilite client</h3>
<ul>
<li><strong>Age :</strong> 70 ans et plus OU 60-69 ans avec perte d'autonomie (GIR 1 a 6 ou PCH)</li>
<li><strong>Logement :</strong> residence principale, propriete ou locataire du parc prive</li>
<li><strong>Revenus :</strong> plafonds modestes ou tres modestes (Ile-de-France et region)</li>
</ul>

<h3>Montants 2026</h3>
<table>
<tr><th>Revenus menage</th><th>Taux de prise en charge</th><th>Plafond</th></tr>
<tr><td>Tres modestes (bleu)</td><td>70 %</td><td>15 400 EUR</td></tr>
<tr><td>Modestes (jaune)</td><td>50 %</td><td>11 000 EUR</td></tr>
</table>
<p>Bonus possibles :</p>
<ul>
<li>+500 EUR si accompagnement par un ergotherapeute (obligatoire en fait depuis 2025)</li>
<li>+1 000 EUR sur certains devis en secteur agricole</li>
</ul>
<div class="info-box"><strong>Point cle 2026 :</strong> depuis janvier, MaPrimeAdapt' est obligatoirement mobilisee via un "accompagnateur renov" (AMO). Vous, artisan, n'avez pas a gerer le dossier : c'est l'AMO qui s'en charge, mais vous devez etre certifie pour etre selectionne.</div>

<h2>Les certifications indispensables</h2>

<h3>Handibat (le plus reconnu)</h3>
<p>Delivre par la Capeb, valable 4 ans. Formation 2 jours + audit d'entreprise. Cout total : 600 a 900 EUR.</p>
<ul>
<li>Reconnu par MaPrimeAdapt' (obligatoire pour etre selectionne)</li>
<li>Ouvre a l'annuaire Handibat (350 000 consultations/an)</li>
<li>Formation continue annuelle obligatoire</li>
</ul>

<h3>Pros Adapt (alternative)</h3>
<p>Delivre par la FFB. Formation 1,5 jour + mise en situation. Budget similaire a Handibat.</p>

<h3>Agrement prefecture pour la dependance</h3>
<p>Obligatoire pour certains travaux (monte-escaliers, elevateur pour fauteuils). Demarche gratuite aupres du prefet du departement.</p>

<h2>Les travaux les plus demandes et leurs marges</h2>

<h3>1. Remplacement baignoire par douche italienne</h3>
<p>LE chantier le plus demande (60 % des demandes).</p>
<table>
<tr><th>Poste</th><th>Prix HT</th></tr>
<tr><td>Depose baignoire + evacuation</td><td>250 a 400 EUR</td></tr>
<tr><td>Plomberie adaptee + receveur extra-plat</td><td>700 a 1 100 EUR</td></tr>
<tr><td>Paroi vitree anti-buee + barre d'appui</td><td>450 a 900 EUR</td></tr>
<tr><td>Carrelage antiderapant R11 (6 m2)</td><td>350 a 600 EUR</td></tr>
<tr><td>Siege de douche rabattable + mitigeur thermostatique</td><td>250 a 450 EUR</td></tr>
<tr><td>Main d'oeuvre (2 jours)</td><td>700 a 1 200 EUR</td></tr>
<tr><td><strong>Total HT</strong></td><td><strong>2 700 a 4 650 EUR</strong></td></tr>
</table>
<p>Avec MaPrimeAdapt' a 70 %, le reste a charge pour un senior modeste est de 800 a 1 400 EUR. Marge artisan : 800 a 1 200 EUR.</p>

<h3>2. Monte-escaliers droit (etage simple)</h3>
<table>
<tr><th>Poste</th><th>Prix HT</th></tr>
<tr><td>Materiel monte-escaliers droit (8 a 12 marches)</td><td>3 500 a 5 500 EUR</td></tr>
<tr><td>Main d'oeuvre pose + raccordement</td><td>700 a 1 200 EUR</td></tr>
<tr><td>Certification CE + mise en service</td><td>250 EUR</td></tr>
<tr><td><strong>Total HT</strong></td><td><strong>4 450 a 6 950 EUR</strong></td></tr>
</table>
<p>Marge artisan : 1 100 a 1 800 EUR.</p>

<h3>3. Elargissement de portes (pour fauteuil roulant)</h3>
<p>Prix : 350 a 650 EUR par porte. Plus si mur porteur. Delai : 1 jour par porte.</p>

<h3>4. Rampe d'acces exterieure</h3>
<p>Prix : 1 500 a 3 500 EUR selon longueur et pente. Norme : pente maxi 5 %, repos tous les 10 m.</p>

<h3>5. Barres d'appui et equipements securitaires</h3>
<table>
<tr><th>Equipement</th><th>Prix HT pose comprise</th></tr>
<tr><td>Barre d'appui coudee (WC)</td><td>120 a 200 EUR</td></tr>
<tr><td>Barre droite (douche)</td><td>90 a 160 EUR</td></tr>
<tr><td>WC surelevee + barre releve-assis</td><td>450 a 800 EUR</td></tr>
<tr><td>Eclairage automatique detecteur</td><td>120 a 250 EUR/point</td></tr>
</table>

<h3>6. Suppression de ressauts et seuils</h3>
<p>Reprofilage du sol pour supprimer les petites marches (15 a 30 cm). Prix : 400 a 1 200 EUR selon complexite.</p>

<h2>Strategie commerciale pour ce marche</h2>

<h3>Prospection</h3>
<ul>
<li><strong>Partenariat avec ergotherapeutes locaux :</strong> ils font 80 % des preconisations. Un bon partenariat = 2 a 4 chantiers/mois</li>
<li><strong>Maisons de retraite et CCAS :</strong> ils ont des listes d'aidants familiaux</li>
<li><strong>Pharmaciens, medecins generalistes :</strong> relais naturel (laissez-y des flyers avec logos Handibat)</li>
<li><strong>Annuaire Handibat</strong> : referencement inclus dans la certification</li>
</ul>

<h3>Approche commerciale</h3>
<p>Le client senior et sa famille ont besoin d'etre rassures. Points cles :</p>
<ul>
<li>Propreté impeccable du chantier (mettre des protections partout, aspirer chaque soir)</li>
<li>Horaires fixes (9h-17h, pas de travail tot matin ni tard soir)</li>
<li>Un interlocuteur unique (le meme ouvrier tout le chantier si possible)</li>
<li>Explication des etapes en vocabulaire simple</li>
<li>Bilan journalier oral avec la famille</li>
</ul>

<h3>Fidelisation</h3>
<p>Un senior satisfait genere <strong>3 a 5 recommandations</strong> a sa famille et ses amis. Bien plus qu'un client classique.</p>

<h2>Formation specifique recommandee</h2>
<ul>
<li>Pathologies du vieillissement (comprendre les limitations)</li>
<li>Normes accessibilite PMR (NF P 98-351, Arrete 2006)</li>
<li>Equipements specifiques (sieges, monte-escaliers, elevateurs)</li>
<li>Approche commerciale seniors (communication, rassurance)</li>
</ul>
<p>Organismes : Capeb (Handibat), INSET, Apave. Budget : 800 a 2 000 EUR.</p>

<h2>Pourquoi se positionner maintenant</h2>
<ol>
<li>Demande x3 prevue en 10 ans (papy-boom)</li>
<li>Marge superieure a la renovation classique (40-45 % vs 25-35 %)</li>
<li>Tres peu de concurrence certifiee (2 500 artisans Handibat pour 16 millions de seniors)</li>
<li>MaPrimeAdapt' rend le financement accessible a tous</li>
<li>Fidelisation exceptionnelle (clients tres reconnaissants)</li>
</ol>
""",
  "related":[
    ("aides-renovation-energetique-2026-maprimerenov-cee.html","Aides rénovation 2026 : MaPrimeRénov'"),
    ("fideliser-clients-artisan-btp-strategie-2026.html","Fidéliser ses clients artisan BTP"),
    ("google-business-profile-artisan-seo-local.html","Google Business Profile artisan"),
  ],
})


# ========== GENERATION ==========
import os
count = 0
for a in ARTICLES:
    html = render(
        slug=a["slug"], title=a["title"], meta_desc=a["meta"],
        keywords=a["kw"], h1=a["h1"], read_min=a["read"],
        summary_items=a["summary"], body_html=a["body"], related=a["related"],
    )
    with open(f"{a['slug']}.html", "w", encoding="utf-8") as f:
        f.write(html)
    count += 1
    print(f"OK {a['slug']}.html")

print(f"\nBatch 6 : {count} articles generes.")

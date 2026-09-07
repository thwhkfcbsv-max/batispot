#!/usr/bin/env python3
"""Batch 7 : 5 articles pour atteindre 40 total.
1. Autoliquidation TVA sous-traitance BTP
2. Garanties BTP (parfait achevement, bon fonctionnement, decennale)
3. Chiffrer un devis : taux horaire, marge, coefficient
4. Chantier en site occupe : renovation client present
5. Formation continue BTP : CPF, Constructys, FAFCEA
"""
from _template_gen import render

ARTICLES = []

# ARTICLE 31 : AUTOLIQUIDATION TVA SOUS-TRAITANCE BTP
ARTICLES.append({
  "slug": "autoliquidation-tva-sous-traitance-btp-2026",
  "title": "Autoliquidation TVA sous-traitance BTP 2026 : qui paye, quand, comment facturer",
  "meta": "Autoliquidation TVA 2026 : regime obligatoire en sous-traitance BTP. Qui est concerne, mentions sur facture, CA3, exemples chiffres et piege a eviter.",
  "kw": "autoliquidation tva, tva sous-traitance btp, mention facture autoliquidation, ca3 btp, article 283-2 nonies",
  "h1": "Autoliquidation TVA en sous-traitance BTP : le guide complet 2026",
  "read": 10,
  "summary": [
    "Quand l'autoliquidation est obligatoire (et quand elle ne l'est pas)",
    "La mention EXACTE a faire figurer sur la facture (sinon sanction)",
    "Comment declarer sur le CA3 : cases a remplir cote sous-traitant et cote donneur d'ordre",
    "Le piege des travaux de sous-traitance en dehors des locaux : un cas qui coute cher",
  ],
  "body": """
<h2>Pourquoi l'autoliquidation existe</h2>
<p>Avant 2014, le sous-traitant facturait la TVA au donneur d'ordre, qui la deduisait. Resultat : certaines entreprises encaissaient la TVA puis disparaissaient avant de la reverser au fisc. Pour couper ce circuit de fraude, l'article 283-2 nonies du CGI a instaure <strong>l'autoliquidation obligatoire</strong> en sous-traitance BTP : c'est le donneur d'ordre qui collecte ET deduit la TVA, le sous-traitant ne la facture plus.</p>
<p>En 2026, le dispositif concerne plus de 280 000 entreprises BTP et represente environ 18 milliards d'euros de TVA auto-liquidee par an.</p>

<h2>Qui est concerne ?</h2>
<h3>Les 3 conditions cumulatives</h3>
<ol>
<li><strong>Travaux immobiliers</strong> : construction, renovation, reparation, entretien, demolition, installation d'equipements fixes (chauffage, plomberie, electricite, menuiserie posee). Sont <em>exclus</em> les travaux sur biens meubles (machines industrielles) et les simples livraisons de materiaux sans pose.</li>
<li><strong>Relation de sous-traitance</strong> : le donneur d'ordre a un contrat client avec un maitre d'ouvrage, et il sous-traite tout ou partie. Le sous-traitant travaille pour un autre professionnel, pas directement pour le client final.</li>
<li><strong>Donneur d'ordre assujetti a la TVA en France</strong> : si le donneur d'ordre est un particulier ou une entite non assujettie, l'autoliquidation ne s'applique pas.</li>
</ol>

<h3>Cas concrets</h3>
<table>
<tr><th>Situation</th><th>Autoliquidation ?</th></tr>
<tr><td>Plombier (sous-traitant) pour un electricien (donneur d'ordre) sur chantier client</td><td><strong>OUI</strong></td></tr>
<tr><td>Peintre travaillant directement pour un particulier</td><td>NON (relation directe, pas de sous-traitance)</td></tr>
<tr><td>Menuisier sous-traitant pour une societe civile immobiliere (SCI) assujettie</td><td>OUI</td></tr>
<tr><td>Carreleur sous-traitant pour une SCI <em>non</em> assujettie</td><td>NON (donneur d'ordre non assujetti)</td></tr>
<tr><td>Entreprise vendant uniquement du materiel sans pose a un BE</td><td>NON (livraison sans travaux immobiliers)</td></tr>
<tr><td>Nettoyage de chantier (sous-traite)</td><td>OUI (considere comme travaux immobiliers lies)</td></tr>
<tr><td>Location de grue ou echafaudage avec operateur</td><td>OUI si pose/demontage inclus</td></tr>
</table>

<h2>La mention obligatoire sur la facture</h2>
<div class="warning-box"><strong>Attention :</strong> l'omission de la mention "<em>Autoliquidation</em>" sur la facture entraine une amende de <strong>5 % du montant non mentionne</strong> (article 1737 du CGI), avec un minimum de 15 EUR par facture.</div>

<p>La facture du sous-traitant doit obligatoirement comporter :</p>
<ol>
<li>Le prix <strong>Hors Taxes</strong> uniquement (aucune ligne TVA)</li>
<li>La mention exacte : <strong>"Autoliquidation de la TVA par le preneur - Article 283-2 nonies du CGI"</strong></li>
<li>Le total <strong>Net a payer HT</strong></li>
</ol>

<div class="info-box"><strong>Exemple de facture correcte :</strong><br>
Prestation de carrelage : 3 500,00 EUR HT<br>
Total HT : 3 500,00 EUR<br>
<em>Autoliquidation de la TVA par le preneur - Article 283-2 nonies du CGI</em><br>
Net a payer : 3 500,00 EUR</div>

<h2>Declaration sur le CA3</h2>
<h3>Cote sous-traitant</h3>
<p>Le sous-traitant ne facture pas de TVA mais doit declarer le <strong>chiffre d'affaires HT en case E2</strong> ("Autres operations non imposables") de son CA3 mensuel ou trimestriel.</p>

<h3>Cote donneur d'ordre</h3>
<p>Le donneur d'ordre doit simultanement :</p>
<ul>
<li>Collecter la TVA : ligne <strong>3B</strong> (achats de prestations de services pour lesquelles la TVA est due par le preneur)</li>
<li>Deduire cette meme TVA : ligne <strong>20</strong> (TVA deductible sur autres biens et services)</li>
</ul>
<p>L'operation est fiscalement neutre si le donneur d'ordre a un droit a deduction complet. Mais s'il exerce une activite partiellement exoneree, il supportera la TVA non deductible.</p>

<h2>Le piege qui coute cher : les travaux hors chantier</h2>
<p>L'administration fiscale considere qu'un travail realise <strong>en atelier</strong> et simplement livre sur chantier (exemple : fabrication d'une cuisine sur mesure en atelier, installee ensuite) ne releve pas toujours de l'autoliquidation.</p>
<p>Point de vigilance : si la <strong>pose</strong> est comprise dans la prestation, l'autoliquidation s'applique sur la totalite (fabrication + pose). Si la facturation separe fabrication (vente de bien) et pose (prestation), seule la pose est autoliquidee.</p>
<div class="warning-box"><strong>Exemple de requalification :</strong> en 2024, une entreprise de menuiserie a ete redressee pour 47 000 EUR. Elle avait autoliquide la totalite d'une facture fabrication + pose d'escaliers, alors que le contrat avec son donneur d'ordre mentionnait deux prestations distinctes. Le fisc a requalifie la partie "fabrication" en vente de bien, donc TVA facturee classiquement.</div>

<h2>Sous-traitance en cascade</h2>
<p>Si un sous-traitant de rang 1 confie une partie des travaux a un sous-traitant de rang 2, <strong>l'autoliquidation s'applique a chaque niveau de la chaine</strong>, a condition que chaque donneur d'ordre soit assujetti a la TVA en France.</p>
<p>Exemple :</p>
<ul>
<li>Entreprise A (entreprise generale) a un contrat avec un promoteur</li>
<li>A sous-traite a B (second oeuvre)</li>
<li>B sous-traite a C (carrelage)</li>
</ul>
<p>C facture a B en autoliquidation. B facture a A en autoliquidation. A facture au promoteur avec TVA classique (relation directe, pas de sous-traitance).</p>

<h2>Ce qu'il faut retenir</h2>
<ol>
<li>Autoliquidation = obligatoire des que la relation est de sous-traitance avec donneur d'ordre assujetti TVA</li>
<li>La facture doit mentionner l'article 283-2 nonies du CGI, sinon 5 % d'amende</li>
<li>Cote sous-traitant : declaration en case E2 du CA3, pas de TVA collectee</li>
<li>Cote donneur d'ordre : collecte en ligne 3B, deduction en ligne 20 (neutre)</li>
<li>Attention aux contrats mixtes fabrication + pose separes, risque de requalification</li>
</ol>
""",
  "related": [
    ("devis-btp-mentions-obligatoires-modele-conforme-2026.html", "Devis BTP : mentions obligatoires 2026"),
    ("sous-traitance-btp-contrat-obligations-artisan-2026.html", "Sous-traitance BTP : contrat et obligations"),
    ("tva-btp-2026-taux-matrice.html", "TVA BTP 2026 : taux et matrice"),
  ],
})


# ARTICLE 32 : GARANTIES BTP
ARTICLES.append({
  "slug": "garanties-btp-parfait-achevement-bon-fonctionnement-decennale",
  "title": "Garanties BTP : parfait achevement, bon fonctionnement, decennale - le guide 2026",
  "meta": "Les 3 garanties legales BTP : 1 an (parfait achevement), 2 ans (bon fonctionnement), 10 ans (decennale). Points de depart, obligations, jurisprudences 2026.",
  "kw": "garanties btp, garantie parfait achevement, garantie bon fonctionnement biennale, garantie decennale, reception chantier",
  "h1": "Les 3 garanties legales en BTP : parfait achevement, bon fonctionnement et decennale",
  "read": 11,
  "summary": [
    "Les 3 garanties qui courent en parallele apres la reception - chacune a sa logique",
    "La piege numero 1 : confondre garantie biennale et decennale sur un equipement",
    "La date qui change tout : la reception avec ou sans reserves",
    "Les jurisprudences recentes qui ont etendu le champ de la decennale",
  ],
  "body": """
<h2>La reception : point de depart de toutes les garanties</h2>
<p>La <strong>reception des travaux</strong> est l'acte par lequel le maitre d'ouvrage declare accepter l'ouvrage, avec ou sans reserves (article 1792-6 du code civil). C'est le signal de depart de l'ensemble des garanties legales.</p>
<p>Sans reception formelle (PV signe par les deux parties), les garanties ne courent pas, mais la responsabilite contractuelle reste pleinement engagee. En pratique, l'absence de reception est desastreuse pour l'artisan : aucune protection dans le temps.</p>

<div class="info-box"><strong>Reception tacite :</strong> la jurisprudence admet une reception tacite lorsque le maitre d'ouvrage prend possession de l'ouvrage et paye le solde sans contester. Mais cette situation laisse une zone grise : mieux vaut toujours formaliser un PV de reception.</div>

<h2>Garantie 1 : Parfait achevement (1 an)</h2>
<h3>Fondement</h3>
<p>Article 1792-6 du code civil. Duree : <strong>1 an a compter de la reception</strong>.</p>

<h3>Ce qu'elle couvre</h3>
<ul>
<li>Tous les desordres signales lors de la reception (reserves)</li>
<li>Tous les desordres apparus pendant l'annee suivante, quelle que soit leur gravite</li>
<li>Les malfaçons, defauts de finition, non-conformites au contrat</li>
</ul>

<h3>Qui elle engage</h3>
<p>Uniquement l'<strong>entrepreneur qui a realise les travaux</strong>. Pas les autres intervenants (architecte, bureau d'etudes).</p>

<h3>Mise en oeuvre</h3>
<p>Le maitre d'ouvrage adresse une mise en demeure par LRAR a l'entreprise, qui doit intervenir dans un delai raisonnable. A defaut, le maitre d'ouvrage peut faire executer les travaux par un tiers au frais de l'entreprise defaillante, apres autorisation du juge.</p>

<h2>Garantie 2 : Bon fonctionnement (biennale, 2 ans)</h2>
<h3>Fondement</h3>
<p>Article 1792-3 du code civil. Duree : <strong>2 ans minimum a compter de la reception</strong>.</p>

<h3>Ce qu'elle couvre</h3>
<p>Les <strong>elements d'equipement dissociables</strong> de l'ouvrage : ce sont les equipements qui peuvent etre retires, demontes ou remplaces sans deterioration de la structure (gros oeuvre ou second oeuvre qui forme un tout indivisible).</p>

<table>
<tr><th>Equipement</th><th>Garantie</th></tr>
<tr><td>Volet roulant, store</td><td>Biennale (dissociable)</td></tr>
<tr><td>Radiateur electrique fixe mural</td><td>Biennale</td></tr>
<tr><td>Chaudiere (sauf si integree a l'immeuble)</td><td>Biennale</td></tr>
<tr><td>Climatisation reversible</td><td>Biennale</td></tr>
<tr><td>Lave-vaisselle encastre</td><td>Biennale</td></tr>
<tr><td>Systeme VMC</td><td>Biennale (mais certaines juridictions l'ont requalifie en decennal)</td></tr>
<tr><td>Pompe a chaleur geothermique (avec forage)</td><td>Decennale (indissociable)</td></tr>
</table>

<div class="warning-box"><strong>Piege numero 1 :</strong> de nombreux artisans croient qu'un defaut sur un equipement de chauffage releve toujours de la biennale. Faux : si le dysfonctionnement de l'equipement rend l'ouvrage <em>impropre a sa destination</em> (maison devenue inhabitable l'hiver), le juge peut requalifier en decennale. Exemple : Cass. civ. 3e, 11 mai 2016, pompe a chaleur defaillante = decennale.</div>

<h2>Garantie 3 : Decennale (10 ans)</h2>
<h3>Fondement</h3>
<p>Article 1792 du code civil. Duree : <strong>10 ans a compter de la reception</strong>. <strong>Assurance obligatoire</strong> pour les entreprises BTP (article L. 241-1 du code des assurances).</p>

<h3>Ce qu'elle couvre</h3>
<p>Les desordres qui :</p>
<ol>
<li>Compromettent la <strong>solidite</strong> de l'ouvrage, OU</li>
<li>Rendent l'ouvrage <strong>impropre a sa destination</strong> (impossible d'habiter, d'utiliser normalement)</li>
</ol>
<p>Elle s'applique aux elements constitutifs de l'ouvrage et aux elements d'equipement qui font <strong>indissociablement corps</strong> avec les ouvrages de viabilite, fondations, ossature, clos et couvert.</p>

<h3>Exemples de desordres decennaux</h3>
<ul>
<li>Infiltration d'eau repetee par toiture mal isolee</li>
<li>Affaissement de dallage, fissures structurelles</li>
<li>Charpente s'effondrant partiellement</li>
<li>Humidite chronique rendant une piece inhabitable</li>
<li>Defaut d'etancheite d'une terrasse</li>
<li>Panneaux photovoltaiques integres au toit (jurisprudence constante depuis 2015)</li>
</ul>

<h3>La presomption de responsabilite</h3>
<p>La decennale est presomptive : l'entrepreneur est presume responsable, sauf a prouver une cause etrangere (force majeure, faute de la victime, fait d'un tiers imprevisible). Cette presomption est tres difficile a combattre en pratique.</p>

<h2>Jurisprudences recentes qui ont etendu la decennale</h2>
<ul>
<li><strong>Cass. civ. 3e, 15 juin 2022</strong> : des panneaux photovoltaiques mal installes causant une surchauffe de toiture relevent de la decennale, meme si l'equipement lui-meme est dissociable, des lors que le defaut impacte l'ouvrage.</li>
<li><strong>Cass. civ. 3e, 18 janvier 2023</strong> : une pompe a chaleur produisant un bruit excessif rend l'ouvrage impropre a sa destination = decennale.</li>
<li><strong>Cass. civ. 3e, 9 novembre 2023</strong> : l'isolation thermique insuffisante entrainant une consommation 3 fois superieure aux calculs reglementaires = decennale.</li>
</ul>

<h2>Le cumul des trois garanties</h2>
<p>Pendant la premiere annee apres reception, <strong>les trois garanties s'appliquent simultanement</strong>. Le maitre d'ouvrage peut choisir laquelle invoquer. Le choix importe :</p>
<ul>
<li>Parfait achevement = l'entrepreneur doit intervenir, pas son assureur</li>
<li>Biennale = reparation de l'equipement, obligation limitee</li>
<li>Decennale = mise en jeu de l'assurance DO du maitre d'ouvrage ou de l'assurance RC Decennale de l'entrepreneur</li>
</ul>

<h2>Points de vigilance pour l'artisan</h2>
<ol>
<li><strong>Toujours obtenir un PV de reception signe</strong>, meme pour de petits chantiers</li>
<li>Conserver le PV de reception <strong>pendant au moins 10 ans + 2 ans</strong> (delai d'action apres expiration)</li>
<li>Verifier annuellement que l'attestation d'assurance decennale est en cours de validite</li>
<li>Mentionner l'assurance decennale (assureur + numero) sur chaque devis et facture</li>
<li>En cas de desordre signale par le client : ne jamais ignorer, toujours repondre par ecrit dans les 15 jours</li>
</ol>

<div class="warning-box"><strong>Sanction penale :</strong> l'article L. 243-3 du code des assurances sanctionne le defaut d'assurance decennale de <strong>75 000 EUR d'amende et 6 mois de prison</strong>. Verification simple : demander chaque annee le nouvel avis d'echeance a l'assureur.</div>
""",
  "related": [
    ("assurance-decennale-btp-2026.html", "Assurance decennale BTP : guide 2026"),
    ("accident-travail-btp-prevention-demarches-artisan-2026.html", "Accident du travail BTP"),
    ("impayes-chantier-recouvrement-artisan-2026.html", "Impayes de chantier"),
  ],
})


# ARTICLE 33 : CHIFFRER UN DEVIS BTP
ARTICLES.append({
  "slug": "chiffrer-devis-btp-taux-horaire-marge-coefficient-2026",
  "title": "Chiffrer un devis BTP en 2026 : taux horaire, coefficient, marge - la methode",
  "meta": "Calculer un prix de vente juste en BTP : taux horaire reel par metier, coefficient de marge, formule de calcul, outils et pieges les plus courants en 2026.",
  "kw": "chiffrer devis btp, taux horaire artisan btp, coefficient marge btp, calculer prix de vente btp, methode de chiffrage",
  "h1": "Chiffrer un devis BTP en 2026 : taux horaire, coefficient et marge - la methode complete",
  "read": 12,
  "summary": [
    "Le taux horaire reel par metier en 2026 (et pourquoi 45 EUR/h est souvent un piege)",
    "Le coefficient multiplicateur : la formule qui fait la difference entre benef et perte",
    "Comment calculer les temps improductifs (deplacement, devis, administratif) qui mangent 35 % du temps",
    "Les 5 erreurs de chiffrage les plus frequentes qui coutent 10-15 % de marge",
  ],
  "body": """
<h2>Pourquoi 80 % des artisans chiffrent mal</h2>
<p>La majorite des artisans BTP calculent leur prix de vente a l'intuition ou en s'alignant sur les devis de la concurrence. Resultat : ils travaillent a perte sans s'en rendre compte sur certains chantiers, compensent avec les marges des autres et se retrouvent a 2-3 % de marge nette reelle au lieu des 8-12 % cibles.</p>
<p>Le chiffrage rigoureux repose sur 3 briques : <strong>taux horaire reel</strong>, <strong>coefficient materiaux</strong>, <strong>marge nette cible</strong>. Si l'un de ces elements est faux, tout l'equilibre economique de l'entreprise l'est.</p>

<h2>Calculer son taux horaire reel</h2>
<p>Le taux horaire reel, c'est le cout de <strong>une heure d'activite productive</strong> pour l'entreprise. Il ne se resume PAS au salaire horaire charges du salarie ou du gerant.</p>

<h3>Formule de calcul</h3>
<div class="info-box"><strong>Taux horaire reel = (Charges fixes annuelles + Remuneration dirigeant + Charges sociales) / Nombre d'heures productives annuelles</strong></div>

<h3>Les charges fixes annuelles (hors materiaux)</h3>
<table>
<tr><th>Poste</th><th>Fourchette annuelle (artisan seul)</th></tr>
<tr><td>Assurance decennale + RC Pro</td><td>2 500 - 4 500 EUR</td></tr>
<tr><td>Vehicule utilitaire (leasing + carburant + entretien + assurance)</td><td>7 500 - 10 500 EUR</td></tr>
<tr><td>Outillage (amortissement + renouvellement)</td><td>2 000 - 4 500 EUR</td></tr>
<tr><td>Local (loyer + charges + electricite)</td><td>4 000 - 9 000 EUR</td></tr>
<tr><td>Telephone + internet + logiciels</td><td>1 200 - 2 400 EUR</td></tr>
<tr><td>Expert-comptable</td><td>1 800 - 3 000 EUR</td></tr>
<tr><td>Formation continue</td><td>800 - 1 500 EUR</td></tr>
<tr><td>Fournitures, EPI, petit outillage consommable</td><td>1 500 - 3 000 EUR</td></tr>
<tr><td>Cotisations pro (CMA, organisations)</td><td>400 - 800 EUR</td></tr>
<tr><td><strong>Total charges fixes</strong></td><td><strong>21 700 - 39 200 EUR</strong></td></tr>
</table>

<h3>Heures productives annuelles</h3>
<p>Une semaine a 35 h ne donne pas 35 h productives. Le calcul realiste :</p>
<ul>
<li>52 semaines - 5 semaines de conges payes - 2 semaines de RTT/feries = <strong>45 semaines</strong></li>
<li>45 x 35 h = 1 575 h theoriques</li>
<li>Moins 35 % de temps improductif (deplacements, devis, administratif, relances, formation) = <strong>1 024 h productives reelles</strong></li>
</ul>

<div class="warning-box"><strong>Point critique :</strong> le temps improductif varie de 25 % (artisan tres organise) a 45 % (artisan debutant ou en phase de developpement). Mesurer ce temps pendant 3 mois avec un simple chrono est l'exercice le plus rentable que vous puissiez faire.</div>

<h3>Exemple complet - Plombier artisan seul</h3>
<ul>
<li>Charges fixes : 28 000 EUR/an</li>
<li>Remuneration nette dirigeant souhaitee : 2 800 EUR/mois = 33 600 EUR/an</li>
<li>Charges sociales TNS : 42 % de la remuneration = 14 112 EUR</li>
<li><strong>Total a couvrir : 75 712 EUR/an</strong></li>
<li>Heures productives : 1 024</li>
<li><strong>Taux horaire reel de facturation : 75 712 / 1 024 = 74 EUR/h HT</strong></li>
</ul>

<div class="info-box">C'est pour cela que facturer 45 EUR/h est souvent une voie vers la faillite. Un artisan qui facture 45 EUR/h realise en moyenne 34 EUR/h apres charges, soit 2 800 EUR/mois de revenu brut... pour 55 heures de travail par semaine.</div>

<h2>Calculer la marge sur les materiaux</h2>
<h3>Pourquoi appliquer un coefficient</h3>
<p>Les materiaux representent 40 a 65 % du prix de vente selon les metiers. Sans coefficient, l'artisan travaille en realite sans remuneration sur la gestion (commande, transport, stockage, casse, avances de tresorerie).</p>

<h3>Coefficient multiplicateur recommande</h3>
<table>
<tr><th>Metier</th><th>Coefficient sur materiaux</th></tr>
<tr><td>Plomberie</td><td>1,35 a 1,50</td></tr>
<tr><td>Electricite</td><td>1,30 a 1,45</td></tr>
<tr><td>Plomberie-chauffage (avec equipements complexes)</td><td>1,40 a 1,65</td></tr>
<tr><td>Peinture</td><td>1,40 a 1,70</td></tr>
<tr><td>Platrerie / isolation</td><td>1,35 a 1,50</td></tr>
<tr><td>Menuiserie</td><td>1,50 a 1,80 (selon fabrication sur mesure ou non)</td></tr>
<tr><td>Carrelage / faience</td><td>1,45 a 1,60</td></tr>
<tr><td>Maçonnerie gros oeuvre</td><td>1,25 a 1,40</td></tr>
</table>

<p>Exemple : un robinet achete 85 EUR HT devrait etre facture 85 x 1,40 = 119 EUR HT. L'ecart de 34 EUR couvre le temps de selection, de commande, de transport, le stockage eventuel, l'avance de tresorerie et la marge de l'entreprise.</p>

<h2>Formule finale de chiffrage</h2>
<div class="info-box"><strong>Prix HT = (Heures productives x Taux horaire reel) + (Materiaux HT x Coefficient) + (Sous-traitance x 1,10 a 1,15)</strong></div>

<h3>Exemple - Renovation salle de bain</h3>
<table>
<tr><th>Poste</th><th>Calcul</th><th>Montant HT</th></tr>
<tr><td>Main d'oeuvre</td><td>48 h x 74 EUR</td><td>3 552 EUR</td></tr>
<tr><td>Materiaux (receveur, paroi, carrelage, faience, tuyauterie, robinetterie)</td><td>1 850 EUR x 1,45</td><td>2 683 EUR</td></tr>
<tr><td>Sous-traitance electricite (IRVE, ventilation)</td><td>420 EUR x 1,12</td><td>470 EUR</td></tr>
<tr><td><strong>Sous-total HT</strong></td><td></td><td><strong>6 705 EUR</strong></td></tr>
<tr><td>Marge de securite 5 % (aleas)</td><td></td><td>335 EUR</td></tr>
<tr><td><strong>Prix de vente HT final</strong></td><td></td><td><strong>7 040 EUR</strong></td></tr>
<tr><td>TVA 10 %</td><td></td><td>704 EUR</td></tr>
<tr><td><strong>Total TTC</strong></td><td></td><td><strong>7 744 EUR</strong></td></tr>
</table>

<h2>Les 5 erreurs qui couuttent 10-15 % de marge</h2>
<ol>
<li><strong>Sous-estimer le temps de pose.</strong> Multiplier la duree theorique par 1,2 pour les chantiers en renovation (decouvertes impromptues, adaptations).</li>
<li><strong>Oublier le temps de preparation.</strong> Chargement du vehicule, trajets entre fournisseur et chantier, 1-2 h par jour de chantier.</li>
<li><strong>Ne pas facturer les deplacements.</strong> Un chantier a 45 km vous coute 15-20 EUR de carburant AR + 2 h de conduite, soit ~150 EUR de cout reel. Ligne dediee dans le devis.</li>
<li><strong>Oublier les consommables.</strong> Joints, vis, fixations, silicones : 3-5 % du cout materiaux, souvent oublies.</li>
<li><strong>Ne pas prevoir les aleas.</strong> Ajouter 5-8 % de marge de securite, surtout en renovation.</li>
</ol>

<h2>Controler sa rentabilite apres chantier</h2>
<p>Un devis bien chiffre ne sert a rien si on ne controle pas ex-post. Methode simple :</p>
<ol>
<li>Noter le temps reel passe (chrono ou application)</li>
<li>Noter les materiaux reellement consommes</li>
<li>Calculer : Marge = (Prix de vente HT) - (Temps reel x Taux horaire reel) - (Materiaux reels x Coefficient reel)</li>
<li>Si marge < 8 %, identifier le poste qui a derape et ajuster sur le prochain devis similaire</li>
</ol>

<div class="warning-box"><strong>Objectif de marge nette :</strong> viser <strong>10-15 % de marge nette</strong> apres toutes charges et retribution. En dessous de 8 %, le moindre impaye ou alea met l'entreprise en deficit annuel.</div>
""",
  "related": [
    ("devis-btp-mentions-obligatoires-modele-conforme-2026.html", "Devis BTP : mentions obligatoires"),
    ("prix-travaux-renovation-2026-bareme-artisan.html", "Prix travaux renovation 2026"),
    ("logiciels-gestion-btp-comparatif-artisan-2026.html", "Logiciels gestion BTP"),
  ],
})


# ARTICLE 34 : CHANTIER EN SITE OCCUPE
ARTICLES.append({
  "slug": "chantier-site-occupe-renovation-client-present-methodologie-2026",
  "title": "Chantier en site occupe : renover sans faire fuir les occupants (methode complete)",
  "meta": "Chantier en site occupe : comment travailler en presence du client, gerer poussiere/bruit/planning, preserver la relation et facturer le surcout. Methode 2026.",
  "kw": "chantier site occupe, renovation site occupe, chantier avec client present, travailler en presence occupants, chantier en milieu occupe",
  "h1": "Chantier en site occupe : la methodologie pour renover sans faire fuir les occupants",
  "read": 11,
  "summary": [
    "Pourquoi 70 % des chantiers residentiels se deroulent desormais en site occupe",
    "La charte site occupe : les 7 engagements qui changent tout",
    "Comment facturer legitimement un surcout de 15-25 % pour la contrainte occupation",
    "Les 4 erreurs qui explosent une relation client en 48h",
  ],
  "body": """
<h2>Le site occupe est devenu la norme</h2>
<p>En 2015, moins de 40 % des renovations etaient realisees avec les occupants sur place. En 2026, ce chiffre depasse <strong>70 %</strong>. La raison est structurelle : les menages n'ont plus les moyens de se reloger temporairement, le cout moyen d'un hebergement alternatif (Airbnb 1 mois) atteint 2 500-3 500 EUR a Paris et 1 500-2 200 EUR en province.</p>
<p>Pour l'artisan, travailler en site occupe transforme fondamentalement la gestion du chantier. Les contraintes operationnelles s'ajoutent aux contraintes techniques, et la satisfaction client devient aussi importante que la qualite d'execution.</p>

<h2>Les specificites du site occupe</h2>
<h3>Contraintes qui modifient le chantier</h3>
<ul>
<li><strong>Bruit :</strong> plage horaire limitee (9 h - 12 h / 14 h - 18 h en general), outillage bruyant interdit le matin tot et le soir</li>
<li><strong>Poussiere :</strong> protections intensives, aspiration a la source obligatoire, nettoyage quotidien</li>
<li><strong>Acces :</strong> couloirs partages, escaliers, presence d'animaux ou d'enfants</li>
<li><strong>Continuite des usages :</strong> au moins une piece d'eau et une cuisine fonctionnelles chaque soir</li>
<li><strong>Securite :</strong> pas de chute d'outils, pas de cables au sol, installation electrique securisee en permanence</li>
<li><strong>Planning :</strong> interruption le weekend ou sur demande du client</li>
<li><strong>Psychologique :</strong> presence constante d'observateurs, tensions potentielles</li>
</ul>

<h3>Impact sur le temps de chantier</h3>
<p>Un chantier en site occupe prend <strong>20 a 35 % de temps en plus</strong> qu'un chantier equivalent en site vide. Ce surcout doit etre integre au chiffrage, et non absorbe en marge.</p>

<table>
<tr><th>Tache</th><th>Surcout temps site occupe</th></tr>
<tr><td>Mise en protection matinale (bâches, films, ruban)</td><td>+30 a 45 min/jour</td></tr>
<tr><td>Nettoyage fin de journee approfondi</td><td>+30 a 60 min/jour</td></tr>
<tr><td>Plage horaire reduite (6 h utiles au lieu de 8 h)</td><td>-25 % de productivite</td></tr>
<tr><td>Gestion des interactions client (questions, ajustements)</td><td>+20 a 40 min/jour</td></tr>
<tr><td>Adaptations de chantier imprevues</td><td>+10-15 % du temps total</td></tr>
</table>

<h2>La charte site occupe : 7 engagements cles</h2>
<p>Remettre au client une charte ecrite des l'accord sur le devis desamorce 90 % des tensions ulterieures.</p>

<h3>1. Horaires de travail</h3>
<p>Debut 9 h, pause dejeuner 12 h - 14 h, fin 18 h. Pas de travaux le samedi sauf accord prealable. Equipements bruyants (perforateur, disqueuse) interdits avant 10 h et apres 17 h.</p>

<h3>2. Protections</h3>
<p>Bâches plastique sur tous les meubles et sols non concernes. Films auto-collants sur moquettes. Sas plastique a double-face pour les zones poussiereuses. Aspirateurs a filtre HEPA pour tout decoupe, percage, poncage.</p>

<h3>3. Nettoyage quotidien</h3>
<p>Chantier range et aspire chaque soir. Outils regroupes dans un coin clairement identifie. Declarer la piece "habitable" en moins de 5 min par l'occupant.</p>

<h3>4. Continuite des usages essentiels</h3>
<p>Au moins une salle de bain fonctionnelle, l'electricite operationnelle, l'eau chaude disponible, la cuisine accessible. Si coupure necessaire, pre-annoncer 48 h a l'avance.</p>

<h3>5. Communication quotidienne</h3>
<p>Point de 5 minutes chaque matin (ce qui va se passer aujourd'hui) et chaque soir (ce qui a ete fait, ce qui reste, points d'attention). Interlocuteur unique cote entreprise.</p>

<h3>6. Securite enfants / animaux</h3>
<p>Outils toujours ranges, produits dangereux en caisse fermee a cle, portes de chantier fermees en permanence, fils electriques systematiquement surleves.</p>

<h3>7. Respect de la vie privee</h3>
<p>Pas de photos sans autorisation, pas de telephone / musique audible, tenue vestimentaire correcte, WC prive des occupants non utilise (prevoir WC de chantier mobile si absence de WC invites).</p>

<h2>Le chiffrage specifique site occupe</h2>
<p>Le devis doit integrer explicitement un surcout chantier en site occupe, reparti ainsi :</p>
<ul>
<li>Ligne "<strong>Majoration chantier en site occupe : +15 a 25 %</strong>" sur le total main d'oeuvre</li>
<li>Ligne "<strong>Protections renforcees (baches, films, sas) : forfait 150-350 EUR</strong>"</li>
<li>Ligne "<strong>Nettoyage quotidien approfondi : 25 EUR/jour</strong>"</li>
<li>Ligne eventuelle "<strong>Location materiel silencieux ou faible poussiere : surcout X EUR</strong>"</li>
</ul>

<p>Le client qui voit ces lignes detaillees comprend la logique. Le client qui recoit un devis global 15 % plus cher sans explication conteste.</p>

<h2>Les 4 erreurs qui explosent une relation en 48 h</h2>
<h3>Erreur 1 : Sous-estimer la poussiere</h3>
<p>Decouper un element de platre sans aspiration a la source laisse un nuage de poussiere qui met 4 jours a se deposer dans tout le logement. Le client retrouvera de la poussiere dans son lit et sa cuisine pendant une semaine. <strong>Aspirateur a filtre HEPA obligatoire sur toute decoupe</strong>, non negociable.</p>

<h3>Erreur 2 : Laisser un chantier sale le soir</h3>
<p>Rentrer a 17 h 55 et partir en laissant des gravats, des outils au sol et la poussiere non aspiree = tension maximale. Planifier 30 min de nettoyage dans chaque journee.</p>

<h3>Erreur 3 : Ne pas pre-annoncer les coupures</h3>
<p>Couper l'eau ou l'electricite sans previenir place le client en situation de gestion de crise (bebe, personne agee, teletravail). Communication ecrite 48 h avant + rappel verbal le matin meme.</p>

<h3>Erreur 4 : Avoir plusieurs interlocuteurs</h3>
<p>L'occupant demande une modification a l'un des compagnons, qui acquiesce, puis l'artisan principal refuse le lendemain. Resultat : conflit. <strong>Un seul interlocuteur habilite a prendre des decisions</strong>, tous les autres renvoient systematiquement a lui.</p>

<h2>Les benefices du site occupe pour l'artisan</h2>
<p>Malgre les contraintes, le site occupe presente des avantages :</p>
<ul>
<li><strong>Paiement plus regulier :</strong> occupants presents = plus d'acompte et de paiement echelonne respecte</li>
<li><strong>Moins de vol de chantier</strong> (fleau sur chantiers vides)</li>
<li><strong>Decision client plus rapide</strong> sur les ajustements techniques (peut voir et arbitrer immediatement)</li>
<li><strong>Bouche-a-oreille puissant :</strong> un voisin qui voit un chantier discipline en site occupe vous recommande</li>
</ul>

<h2>Modele de charte site occupe a remettre au client</h2>
<div class="info-box">
<strong>Engagement BatiSpot - Chantier en site occupe</strong><br><br>
Nous nous engageons a :<br>
&bull; Travailler aux horaires convenus (9 h-12 h / 14 h-18 h, hors samedi)<br>
&bull; Proteger meubles, sols et acces par baches et films<br>
&bull; Nettoyer et ranger le chantier chaque soir<br>
&bull; Assurer en permanence l'eau chaude, l'electricite et une salle d'eau<br>
&bull; Pre-annoncer 48h avant toute coupure<br>
&bull; Tenir un point oral de 5 min matin et soir avec vous<br>
&bull; Respecter strictement la vie privee (pas de photos, pas de musique)<br><br>
Vous vous engagez a :<br>
&bull; Liberer les pieces chantier (meubles et effets personnels) la veille au soir<br>
&bull; Signaler par ecrit toute remarque dans la journee (pas par oral en fin de chantier)<br>
&bull; Permettre l'acces pour les livraisons planifiees<br>
&bull; Ne pas demander de modifications hors devis sans avenant ecrit
</div>
""",
  "related": [
    ("securite-chantier-prevention-tms-artisan-2026.html", "Securite chantier et prevention TMS"),
    ("adaptation-logement-pmr-seniors-artisan-btp-2026.html", "Adaptation logement PMR et seniors"),
    ("devis-btp-mentions-obligatoires-modele-conforme-2026.html", "Devis BTP mentions obligatoires"),
  ],
})


# ARTICLE 35 : FORMATION CONTINUE BTP
ARTICLES.append({
  "slug": "formation-continue-btp-cpf-constructys-fafcea-2026",
  "title": "Formation continue BTP 2026 : CPF, Constructys, FAFCEA - tous les dispositifs",
  "meta": "Financer sa formation ou celle de ses salaries en BTP : CPF, OPCO Constructys, FAFCEA, FIF-PL. Plafonds 2026, procedures, formations eligibles.",
  "kw": "formation continue btp, cpf btp, constructys opco, fafcea formation artisan, financement formation btp",
  "h1": "Formation continue BTP 2026 : financer ses qualifications avec CPF, Constructys et FAFCEA",
  "read": 10,
  "summary": [
    "Les 4 dispositifs de financement accessibles aux artisans et leurs salaries",
    "Les enveloppes annuelles 2026 (CPF 500 EUR, FAFCEA 2 000 EUR, Constructys plafonds)",
    "Les formations strategiques qui paient immediatement : RGE, Qualibat, amiante SS4, echafaudage",
    "La demarche administrative complete : quelles pieces, quel delai, qui contacter",
  ],
  "body": """
<h2>Pourquoi la formation continue est vitale dans le BTP</h2>
<p>Le BTP est soumis a une reglementation qui evolue chaque annee : RE2020 a venir 2028, amiante SS3/SS4, echafaudage R408, habilitation electrique, reglementation gaz, nouvelles certifications RGE, BIM. Un artisan qui ne se forme pas perd acces a des marches entiers en 3-5 ans.</p>
<p>En 2026, les dispositifs de financement sont plus accessibles qu'il y a 10 ans : le CPF a remplace le DIF, les OPCO remplacent les OPCA, et les FAF (Fonds d'Assurance Formation) sont dedies aux travailleurs non-salaries.</p>

<h2>Les 4 dispositifs de financement</h2>

<h3>1. CPF - Compte Personnel de Formation</h3>
<p>Pour qui : salaries et travailleurs independants, une personne = un CPF.</p>

<p><strong>Alimentation 2026 :</strong></p>
<ul>
<li>500 EUR/an pour un salarie a temps plein, plafonne a 5 000 EUR</li>
<li>800 EUR/an pour un salarie non qualifie (sans CAP/BEP), plafonne a 8 000 EUR</li>
<li>Pour l'independant : 500 EUR/an des que l'activite depasse 12 mois</li>
</ul>

<p><strong>Utilisation :</strong> uniquement pour formations <strong>certifiantes ou qualifiantes</strong> inscrites au RNCP ou au Repertoire Specifique. A demander sur <a href="https://moncompteformation.gouv.fr">moncompteformation.gouv.fr</a>.</p>

<p><strong>Formations BTP eligibles CPF :</strong></p>
<ul>
<li>CAP, BEP, Bac Pro BTP en formation continue</li>
<li>Habilitation electrique (B0, BR, BC)</li>
<li>CACES (engins de chantier, nacelles)</li>
<li>SS4 amiante sous-section 4</li>
<li>Permis poids lourd</li>
<li>Certifications RGE qualifications (Qualibat, Qualit'EnR)</li>
</ul>

<div class="info-box"><strong>Reste a charge en 2026 :</strong> depuis 2024, le beneficiaire paye 100 EUR de reste a charge par formation CPF (sauf demandeur d'emploi). Ce reste a charge est pris en charge par l'employeur en cas d'abondement CPF dans le cadre du plan de developpement des competences.</div>

<h3>2. FAFCEA - Fonds d'Assurance Formation des Chefs d'Entreprise Artisanale</h3>
<p>Pour qui : <strong>chef d'entreprise artisanal inscrit au Repertoire des Metiers</strong>, conjoint collaborateur ou associe. Pas les salaries.</p>

<p><strong>Plafond annuel 2026 :</strong> jusqu'a <strong>2 000 EUR/an</strong> par beneficiaire, remboursement de 100 % du cout pedagogique dans la limite du plafond.</p>

<p><strong>Formations eligibles :</strong></p>
<ul>
<li>Gestion d'entreprise, comptabilite</li>
<li>Commercial, developpement d'activite</li>
<li>Formations techniques metier (actualisation, specialisation)</li>
<li>Informatique, logiciels metier, BIM</li>
<li>Langues etrangeres</li>
<li>Permis et habilitations</li>
</ul>

<p><strong>Demarche :</strong></p>
<ol>
<li>Choisir une formation aupres d'un organisme agree (numero de declaration d'activite)</li>
<li>Telecharger le formulaire de demande de prise en charge sur fafcea.com</li>
<li>Joindre : devis de l'organisme, programme detaille, attestation d'inscription au Repertoire des Metiers</li>
<li>Envoyer AVANT le debut de la formation (demande sous 30 jours max apres debut ou rejet)</li>
<li>Delai de reponse : 4 a 8 semaines</li>
</ol>

<h3>3. Constructys - OPCO du BTP</h3>
<p>Pour qui : <strong>salaries des entreprises BTP</strong>. L'OPCO Constructys couvre 200 000 entreprises et 1,5 million de salaries BTP en 2026.</p>

<p><strong>Financement :</strong></p>
<ul>
<li>Plan de developpement des competences : prise en charge des formations salariales selon taille d'entreprise</li>
<li>Alternance : prise en charge integrale des contrats d'apprentissage et professionnalisation</li>
<li>Pro-A (reconversion interne) : financement jusqu'a 100 % du cout pedagogique</li>
<li>Pour les entreprises de moins de 11 salaries : prise en charge a 100 % des formations metier obligatoires</li>
</ul>

<p><strong>Formations strategiques Constructys :</strong></p>
<ul>
<li>Montage-demontage echafaudages R408</li>
<li>Conduite d'engins (CACES)</li>
<li>Amiante SS3 (encapsulage, retrait)</li>
<li>Travail en hauteur</li>
<li>Sauveteur-secouriste du travail (SST)</li>
<li>Prevention des risques chimiques</li>
</ul>

<p><strong>Demarche :</strong> contact direct avec le conseiller Constructys de sa region via <a href="https://www.constructys.fr">constructys.fr</a>. Devis a faire valider AVANT debut de la formation.</p>

<h3>4. FIF-PL - Fonds Interprofessionnel de Formation des Professions Liberales</h3>
<p>Pour qui : architectes, maitres d'oeuvre, bureaux d'etudes en statut liberal (BNC). Pas les artisans BTP inscrits au Repertoire des Metiers.</p>

<p><strong>Plafond 2026 :</strong> 1 200 EUR/an en formation individuelle, plafonne a 400 EUR/jour.</p>

<h2>Tableau synthese - Quel dispositif pour qui</h2>
<table>
<tr><th>Statut</th><th>Dispositif principal</th><th>Dispositif complementaire</th><th>Plafond total/an</th></tr>
<tr><td>Chef d'entreprise artisanale BTP</td><td>FAFCEA (2 000 EUR)</td><td>CPF (500 EUR)</td><td>2 500 EUR</td></tr>
<tr><td>Conjoint collaborateur artisan</td><td>FAFCEA (2 000 EUR)</td><td>CPF (500 EUR)</td><td>2 500 EUR</td></tr>
<tr><td>Gerant TNS (SARL, EURL)</td><td>FAFCEA (2 000 EUR)</td><td>CPF (500 EUR)</td><td>2 500 EUR</td></tr>
<tr><td>Salarie BTP d'une entreprise</td><td>Constructys (via employeur)</td><td>CPF (500-800 EUR)</td><td>Variable</td></tr>
<tr><td>Apprenti BTP</td><td>Constructys (integral)</td><td>-</td><td>Prise en charge totale</td></tr>
<tr><td>Architecte / BE liberal</td><td>FIF-PL (1 200 EUR)</td><td>CPF (500 EUR)</td><td>1 700 EUR</td></tr>
</table>

<h2>Les 7 formations les plus rentables pour un artisan BTP en 2026</h2>

<h3>1. Qualibat RGE (amenagement + isolation)</h3>
<p>Duree : 3-5 jours. Cout : 1 500-2 500 EUR. Finance par FAFCEA + CPF. <strong>ROI : acces MaPrimeRenov' = +40 % de demandes en 12 mois</strong>.</p>

<h3>2. Amiante SS4 (intervention occasionnelle)</h3>
<p>Duree : 2 jours. Cout : 800-1 200 EUR. Finance par FAFCEA ou Constructys. <strong>Obligatoire pour toute intervention sur bati ancien (avant 1997)</strong>.</p>

<h3>3. Habilitation electrique (BR + BC)</h3>
<p>Duree : 2-3 jours. Cout : 450-700 EUR. Finance par FAFCEA. <strong>Obligatoire pour travaux d'electricite des 2022, rappel tous les 3 ans</strong>.</p>

<h3>4. Echafaudage R408 (montage-demontage)</h3>
<p>Duree : 2 jours. Cout : 400-550 EUR. Finance par Constructys (salaries) ou FAFCEA (patrons). Obligatoire des que chantier necessite acces en hauteur.</p>

<h3>5. BIM - Modelisation numerique</h3>
<p>Duree : 5-8 jours. Cout : 2 500-4 500 EUR. Finance par FAFCEA + CPF. Pertinent pour entreprises souhaitant travailler avec promoteurs et marches publics.</p>

<h3>6. Gestion d'entreprise artisanale (comptabilite, fiscalite)</h3>
<p>Duree : 3-5 jours. Cout : 900-1 500 EUR. Integralement finance par FAFCEA. <strong>ROI tres eleve : 2-5 % de marge supplementaire</strong> par meilleure gestion.</p>

<h3>7. Commercial et relation client BTP</h3>
<p>Duree : 3-5 jours. Cout : 1 000-1 800 EUR. Finance par FAFCEA. Souvent sous-estime, mais converit 30 % de devis en plus pour les artisans formes.</p>

<h2>Erreurs de procedure qui font rejeter 40 % des dossiers</h2>
<ol>
<li><strong>Demande apres le debut de formation :</strong> tout FAFCEA ou Constructys refuse une prise en charge demandee apres debut. Delai de securite : 45 jours avant.</li>
<li><strong>Organisme non certifie Qualiopi :</strong> depuis 2022, seuls les organismes Qualiopi sont eligibles. Verifier le logo sur le devis.</li>
<li><strong>Programme insuffisamment detaille :</strong> un programme vague (< 10 lignes) est rejete. Exiger un programme detaille avec objectifs, competences cibles, modalites d'evaluation.</li>
<li><strong>Attestation de Repertoire des Metiers manquante :</strong> piece obligatoire FAFCEA, a telecharger sur le compte CMA.</li>
<li><strong>Plafond deja consomme :</strong> verifier son plafond annuel restant avant de reserver une formation.</li>
</ol>

<h2>Le budget formation 2026 recommande</h2>
<div class="info-box">
<strong>Pour un artisan seul :</strong> 2 000-2 500 EUR de formation par an, couvert integralement par FAFCEA + CPF. Objectif : une formation technique + une formation gestion chaque annee.<br><br>
<strong>Pour une entreprise de 3-5 salaries :</strong> 2 % de la masse salariale en formation (obligation legale pour entreprises > 10 salaries mais bonne pratique generale), soit 3 000-6 000 EUR par an. Essentiellement finance par Constructys.
</div>
""",
  "related": [
    ("devenir-rge-2026.html", "Devenir RGE en 2026"),
    ("qualibat-qualifelec-qualigaz-guide-qualifications-btp-2026.html", "Qualibat, Qualifelec, Qualigaz"),
    ("amiante-btp-sous-section-3-4-reglementation-artisan-2026.html", "Amiante SS3 SS4 reglementation"),
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

print(f"\nBatch 7 : {count} articles generes.")

#!/usr/bin/env python3
"""Batch 3 : 5 articles - Qualifications, ITE, PAC, Recruter CDI, BIM."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _template_gen import render

OUT = os.path.dirname(__file__)

# ============ ARTICLE 11 : QUALIBAT vs QUALIFELEC vs QUALIGAZ ============
a_body = """
<p>Beaucoup d'artisans confondent les qualifications. Qualibat, Qualifelec, Qualigaz, QualiPAC, Qualit'EnR, Qualisol, RGE&hellip; Ce sont des certifications <strong>differentes</strong>, delivrees par des organismes <strong>differents</strong>, pour des metiers <strong>differents</strong>. Choisir la bonne = acceder aux marches, aux aides et aux garanties.</p>

<p>Ce guide les deminique toutes et indique celle qui correspond a votre metier en 2026.</p>

<h2>Vue d'ensemble des qualifications BTP en France</h2>

<table><thead><tr><th>Organisme</th><th>Metiers couverts</th><th>RGE possible</th></tr></thead><tbody>
<tr><td><strong>Qualibat</strong></td><td>Tous metiers (generaliste)</td><td>Oui</td></tr>
<tr><td><strong>Qualifelec</strong></td><td>Electriciens, courant faible</td><td>Oui (Qualifelec ENR)</td></tr>
<tr><td><strong>Qualigaz</strong></td><td>Installation gaz</td><td>Non (certification securite)</td></tr>
<tr><td><strong>QualiPAC</strong></td><td>Pompes a chaleur</td><td>Oui (delivre par Qualit'EnR)</td></tr>
<tr><td><strong>Qualit'EnR</strong></td><td>Energies renouvelables thermiques</td><td>Oui (QualiPAC, QualiBois, Qualisol, QualiPV)</td></tr>
<tr><td><strong>Certibat</strong></td><td>Audit et diagnostic</td><td>Oui</td></tr>
<tr><td><strong>OPQBI / OPQIBI</strong></td><td>Bureau d'etudes, ingenieurs</td><td>Oui</td></tr>
<tr><td><strong>Cequami / CERQUAL</strong></td><td>Maisons individuelles</td><td>Oui</td></tr>
</tbody></table>

<p><strong>Important :</strong> &laquo; RGE &raquo; n'est pas une certification en soi, c'est un <strong>statut</strong> accorde lorsqu'on a une qualification de l'un des organismes ci-dessus repondant au cahier des charges RGE.</p>

<h2>Qualibat : le generaliste (metiers de la maconnerie a la couverture)</h2>

<p>Organisme le plus connu. Qualifie <strong>520 specialites</strong> reparties en 4 niveaux : <strong>probatoire, confirme, qualifie, certifie</strong>.</p>

<h3>Grands groupes de qualifications</h3>
<ul>
<li><strong>VRD et terrassement</strong> : 1000-1300</li>
<li><strong>Maconnerie</strong> : 2100-2300</li>
<li><strong>Charpente et couverture</strong> : 2300-2500</li>
<li><strong>Metallerie et serrurerie</strong> : 4400</li>
<li><strong>Peinture et revetement</strong> : 6100</li>
<li><strong>Menuiserie</strong> : 4300</li>
<li><strong>Efficacite energetique</strong> : 8000-8700 (eligibles RGE)</li>
</ul>

<h3>Cout et renouvellement Qualibat</h3>
<p>Premiere qualification : 350-900 EUR + cotisation annuelle 180-600 EUR (selon taille entreprise). Valable 4 ans, renouvellement avec audit chantier sur place tous les 4 ans.</p>

<h2>Qualifelec : les electriciens</h2>

<p>Concurrent direct de Qualibat pour les electriciens. Propose 4 grands domaines :</p>
<ul>
<li><strong>Electricite generale</strong> (logement, tertiaire, industrie)</li>
<li><strong>Courant faible</strong> (reseaux, fibre, securite)</li>
<li><strong>ENR electriques</strong> (photovoltaique, bornes VE, domotique)</li>
<li><strong>Grands travaux</strong> (collectif, industriel, public)</li>
</ul>

<p>Qualifelec ENR = equivalent RGE pour installations photovoltaiques et bornes de recharge. Indispensable pour faire beneficier le client des aides.</p>

<h2>Qualigaz : obligation securite, pas RGE</h2>

<p>Qualification qui certifie votre conformite aux normes de securite gaz. <strong>Obligatoire</strong> pour :</p>
<ul>
<li>Installations gaz nouvelles</li>
<li>Modifications d'installations existantes</li>
<li>Certificat de conformite avant mise en service</li>
</ul>

<p>Sans Qualigaz (ou equivalent PG, ACS) : vous n'avez pas le droit d'intervenir sur des installations gaz. Cout : 400-800 EUR/an.</p>

<h2>Qualit'EnR : les ENR thermiques</h2>

<p>Regroupe 4 sous-qualifications, toutes RGE :</p>
<ul>
<li><strong>QualiPAC</strong> : pompes a chaleur (air/eau, eau/eau, geothermique, air/air)</li>
<li><strong>QualiBois</strong> : chaudieres biomasse, poeles granules, inserts</li>
<li><strong>Qualisol</strong> : chauffe-eau solaire, systemes solaires combines</li>
<li><strong>QualiPV</strong> : panneaux photovoltaiques raccordes reseau</li>
</ul>

<h3>Cout Qualit'EnR</h3>
<ul>
<li>Formation initiale (RGE) : 1 000-2 000 EUR par qualif</li>
<li>Cotisation annuelle : 500 EUR par qualif</li>
<li>Audit de chantier obligatoire (tous les 4 ans) : 250-500 EUR</li>
</ul>

<h2>Comment choisir sa ou ses qualifications</h2>

<h3>Plombier-chauffagiste</h3>
<ul>
<li>Base : Qualibat 5211 (plomberie) + 5311 (chauffage central)</li>
<li>RGE : QualiPAC (si PAC) + QualiBois (si bois) + Qualisol (si solaire)</li>
<li>Gaz : Qualigaz obligatoire</li>
</ul>

<h3>Electricien</h3>
<ul>
<li>Base : Qualifelec Electricite Generale</li>
<li>RGE : Qualifelec ENR (si photovoltaique ou bornes VE)</li>
</ul>

<h3>Maconnerie / gros oeuvre</h3>
<ul>
<li>Qualibat 2100-2300 selon specialite</li>
<li>Qualibat 7141 pour isolation thermique par l'exterieur (ITE) = RGE</li>
</ul>

<h3>Peintre / revetements</h3>
<ul>
<li>Qualibat 6111-6181</li>
<li>RGE : Qualibat 7131 si isolation des murs par l'interieur (ITI)</li>
</ul>

<h3>Couvreur / charpentier</h3>
<ul>
<li>Qualibat 2311-2391</li>
<li>RGE : Qualibat 7132 (isolation combles) + QualiPV (si solaire integre)</li>
</ul>

<h2>Le processus complet de qualification</h2>

<ol>
<li><strong>Dossier administratif</strong> : Kbis, RC Pro, decennale, diplomes, attestations fiscales</li>
<li><strong>Dossier professionnel</strong> : 3-5 references chantiers recents (photos, devis, attestations client)</li>
<li><strong>Justification competences</strong> : diplomes dirigeants + salaries + formations continues</li>
<li><strong>Depot</strong> en ligne (mon.qualibat.com ou autre selon organisme)</li>
<li><strong>Examen par commission</strong> : 2-4 mois</li>
<li><strong>Audit chantier</strong> (pour RGE) : un auditeur independant visite un chantier</li>
<li><strong>Delivrance</strong> du certificat</li>
</ol>

<h2>Combien ca rapporte vraiment ?</h2>

<p>Une qualification RGE represente en moyenne <strong>25-40 % de CA supplementaire</strong> pour un artisan du batiment. Explication :</p>
<ul>
<li>Acces aux marches MaPrimeRenov' et CEE (82 % du marche renovation energetique)</li>
<li>Credibilite aupres des clients particuliers et syndics</li>
<li>Possibilite de repondre aux marches publics avec criteres environnementaux</li>
<li>Partenariats avec fournisseurs et ensembliers (Viessmann, Daikin, etc.)</li>
</ul>

<h2>Combien ca coute tous frais compris</h2>

<table><thead><tr><th>Qualification</th><th>Cout total initial</th><th>Cotisation annuelle</th></tr></thead><tbody>
<tr><td>Qualibat (1 qualif)</td><td>500-1 200 EUR</td><td>300-600 EUR</td></tr>
<tr><td>Qualifelec</td><td>600-900 EUR</td><td>400-500 EUR</td></tr>
<tr><td>Qualigaz PG</td><td>400-800 EUR</td><td>150-300 EUR</td></tr>
<tr><td>Qualit'EnR (QualiPAC, etc.)</td><td>1 500-2 500 EUR</td><td>500 EUR</td></tr>
<tr><td><strong>Pack complet plombier chauffagiste RGE</strong></td><td><strong>2 500-4 000 EUR</strong></td><td><strong>950-1 400 EUR</strong></td></tr>
</tbody></table>

<h2>Les 3 erreurs a eviter</h2>

<h3>1. Prendre plusieurs qualifications redondantes</h3>
<p>Un plombier chauffagiste n'a pas besoin a la fois de Qualibat ET Qualit'EnR pour la meme activite. Choisir l'organisme le plus adapte (Qualit'EnR est plus specialise en ENR).</p>

<h3>2. Ne pas renouveler a temps</h3>
<p>Retard de renouvellement = perte du statut RGE, les chantiers en cours perdent leur eligibilite aux aides. Marquer le renouvellement 6 mois avant l'echeance.</p>

<h3>3. Oublier de former les salaries</h3>
<p>La qualification concerne l'entreprise, mais les audits verifient que les operationnels ont bien les competences. Un chantier realise par un apprenti non forme peut faire perdre la qualification.</p>

<h2>En resume</h2>
<ul>
<li>Qualibat = generaliste, Qualifelec = electriciens, Qualit'EnR = ENR thermique, Qualigaz = securite gaz.</li>
<li>RGE = statut obtenu via une qualification de l'un de ces organismes.</li>
<li>Plombier chauffagiste : Qualibat + Qualit'EnR + Qualigaz (pack complet).</li>
<li>Cout 2 500-4 000 EUR initial + ~1 000 EUR/an, rentable des la premiere annee.</li>
<li>Renouvellement tous les 4 ans avec audit chantier sur place.</li>
</ul>
"""

a = render(
    slug="qualibat-qualifelec-qualigaz-guide-qualifications-btp-2026",
    title="Qualibat, Qualifelec, Qualigaz, Qualit'EnR : guide des qualifications BTP 2026",
    meta_desc="Quelle qualification pour quel metier ? Qualibat, Qualifelec, Qualigaz, Qualit'EnR : organismes, couts, procedure, rentabilite. Guide complet pour artisan BTP en 2026.",
    keywords="Qualibat qualifications, Qualifelec ENR, Qualigaz PG, Qualit EnR QualiPAC, certifications artisan BTP",
    h1="Qualibat, Qualifelec, Qualigaz : guide complet 2026",
    read_min=8,
    summary_items=[
        "Tableau des 8 organismes et ce qu'ils qualifient",
        "Quelle qualification choisir selon votre metier",
        "Processus complet : dossier, audit, delivrance",
        "Cout total : 2 500-4 000 EUR pour un pack complet",
        "Les 3 erreurs qui font perdre la qualification",
    ],
    body_html=a_body,
    related=[
        ("/blog-pro/devenir-rge-2026.html", "Comment devenir RGE en 2026"),
        ("/blog-pro/aides-renovation-energetique-2026-maprimerenov-cee.html", "Aides renovation 2026"),
    ],
)
with open(os.path.join(OUT, "qualibat-qualifelec-qualigaz-guide-qualifications-btp-2026.html"), "w") as f:
    f.write(a)


# ============ ARTICLE 12 : ITE ISOLATION THERMIQUE EXTERIEURE ============
a_body = """
<p>L'Isolation Thermique par l'Exterieur (ITE) est <strong>le marche BTP le plus dynamique</strong> en 2026. Moyenne : <strong>25 000 EUR</strong> par maison individuelle, plus pour un immeuble collectif. 380 000 chantiers ITE prevus en 2026 rien que sur maisons individuelles.</p>

<p>Ce guide couvre les 3 techniques principales, la tarification realiste, les aides du client, et les erreurs techniques qui annulent la decennale.</p>

<h2>Les 3 techniques principales d'ITE</h2>

<h3>1. Enduit sur polystyrene (le plus frequent)</h3>
<ul>
<li>Isolant : polystyrene expanse (PSE) graphite, R = 3,7 a 5,0 selon epaisseur</li>
<li>Fixation : collage + chevillage mecanique</li>
<li>Finition : sous-enduit arme + enduit de finition (teinte au choix)</li>
<li>Cout pose HT : 120-180 EUR/m<sup>2</sup> (moyenne 150 EUR)</li>
<li>Marge artisan : 18-28 %</li>
</ul>

<h3>2. Bardage rapporte</h3>
<ul>
<li>Isolant : laine de roche, PSE ou fibre de bois</li>
<li>Ossature metal ou bois sur lames d'air</li>
<li>Bardage : PVC, composite, bois, metal, terre cuite</li>
<li>Cout pose HT : 180-280 EUR/m<sup>2</sup> (moyenne 220 EUR)</li>
<li>Aspect moderne, durabilite 30-50 ans</li>
</ul>

<h3>3. Vetureou vetage</h3>
<ul>
<li>Panneaux prefabriques avec isolant + finition integres</li>
<li>Pose rapide (gain 40 % vs enduit)</li>
<li>Cout HT : 150-220 EUR/m<sup>2</sup></li>
<li>Plus frequent en renovation collective et tertiaire</li>
</ul>

<h2>Chiffrage moyen d'un chantier ITE</h2>

<p>Maison individuelle 110 m<sup>2</sup> habitable, facade totale a isoler = 140 m<sup>2</sup>.</p>

<table><thead><tr><th>Poste</th><th>Cout HT</th></tr></thead><tbody>
<tr><td>Echafaudage (location 3 semaines)</td><td>1 400 EUR</td></tr>
<tr><td>Isolant PSE 140 mm + colles</td><td>3 800 EUR</td></tr>
<tr><td>Sous-enduit + armature</td><td>2 200 EUR</td></tr>
<tr><td>Enduit de finition teinte</td><td>1 800 EUR</td></tr>
<tr><td>Appuis de fenetres, linteaux, profils</td><td>900 EUR</td></tr>
<tr><td>Main d'oeuvre (150h a 35 EUR/h)</td><td>5 250 EUR</td></tr>
<tr><td><strong>Sous-total HT</strong></td><td><strong>15 350 EUR</strong></td></tr>
<tr><td>Marge 25 %</td><td>3 838 EUR</td></tr>
<tr><td><strong>Prix client HT</strong></td><td><strong>19 188 EUR</strong></td></tr>
<tr><td>TVA 5,5 %</td><td>1 055 EUR</td></tr>
<tr><td><strong>Prix TTC</strong></td><td><strong>20 243 EUR</strong></td></tr>
</tbody></table>

<h2>Aides client 2026 (exemple maison 140 m<sup>2</sup> murs, revenus modestes)</h2>

<ul>
<li>MaPrimeRenov' bleu : 60 EUR/m<sup>2</sup> * 140 = <strong>8 400 EUR</strong></li>
<li>CEE Standard : 25 EUR/m<sup>2</sup> * 140 = <strong>3 500 EUR</strong></li>
<li>TVA 5,5 % deja comprise</li>
<li><strong>Total aides : 11 900 EUR</strong></li>
<li><strong>Reste a charge : 8 343 EUR</strong></li>
</ul>

<p>Amortissement energetique : -40 % sur facture chauffage (economie ~900 EUR/an), retour sur investissement 9 ans.</p>

<h2>Les 6 pieges techniques qui annulent la decennale</h2>

<h3>1. Ne pas traiter les ponts thermiques</h3>
<p>Oublier appuis de fenetres, retours d'embrasures, liaisons plancher/mur = ponts thermiques non traites = RT non atteinte = decennale refusee en cas de litige.</p>

<h3>2. Isolant sous-dimensionne</h3>
<p>Pour RGE et MaPrimeRenov' : resistance R &ge; 3,7 m<sup>2</sup>.K/W. PSE 120 mm insuffisant. PSE 140 mm minimum.</p>

<h3>3. Humidite en paroi</h3>
<p>Verifier et traiter l'humidite AVANT isolation. Isoler un mur humide emprisonne l'eau, fait pourrir le support, fissure les enduits a 2-3 ans.</p>

<h3>4. Negliger la ventilation</h3>
<p>ITE + maison isolee = accumulation d'humidite interieure. VMC hygro B minimum indispensable. L'artisan ITE a l'obligation d'alerter le client si ventilation insuffisante.</p>

<h3>5. Mauvaise fixation sur supports specifiques</h3>
<p>Mur en pierre, parpaing creux, beton cellulaire : chevilles specifiques obligatoires. Chevilles classiques = decollement apres 2-3 ans.</p>

<h3>6. Oublier le pare-pluie</h3>
<p>En bardage : pare-pluie obligatoire entre isolant et lames d'air. Omission = humidite dans isolant = moisissure, perte performance.</p>

<h2>Qualifications requises</h2>
<ul>
<li><strong>Qualibat 7141</strong> (ITE sous enduit) = RGE</li>
<li><strong>Qualibat 7142</strong> (ITE avec bardage rapporte) = RGE</li>
<li>Formation specifique fabricant souvent demandee (Sto, Weber, ParexGroup)</li>
</ul>

<h2>Fournisseurs partenaires</h2>
<ul>
<li><strong>Sto</strong> (leader europeen, haut de gamme)</li>
<li><strong>Weber (Saint-Gobain)</strong> : large gamme, reseau fort</li>
<li><strong>ParexGroup</strong> : francais, rapport qualite-prix</li>
<li><strong>Knauf</strong> : systemes complets</li>
<li><strong>BASF / Sopremaindustrie</strong> : produits techniques</li>
</ul>

<p>La plupart offrent formations gratuites (1-2 jours) + garantie decennale systeme si vous utilisez leurs produits integraux.</p>

<h2>Organisation chantier standard</h2>
<ol>
<li>Jour 1 : montage echafaudage, protection des abords</li>
<li>Jour 2-3 : preparation supports (nettoyage, reparation, primaire)</li>
<li>Jour 4-7 : pose isolant (collage, chevillage)</li>
<li>Jour 8-9 : sous-enduit arme, traitement des points singuliers</li>
<li>Jour 10-13 : 2 passes d'enduit de finition</li>
<li>Jour 14-15 : finitions, demontage echafaudage, nettoyage</li>
</ol>

<p>Duree moyenne : <strong>2-3 semaines pour maison 100-130 m<sup>2</sup></strong>.</p>

<h2>Arguments commerciaux aupres du client</h2>

<ul>
<li>Economies chauffage <strong>30-40 %</strong> des la premiere annee</li>
<li>Valorisation immobiliere <strong>+10-15 %</strong> a la revente (DPE ameliore)</li>
<li>Confort d'ete (moins de chaleur) : +1 classe DPE garantie</li>
<li>Duree de vie <strong>30-50 ans</strong> selon systeme</li>
<li>Aides 2026 couvrent jusqu'a 70 % du cout pour menages modestes</li>
</ul>

<h2>En resume</h2>
<ul>
<li>Marche ITE = 380 000 chantiers maisons ind. en 2026, ticket moyen 25 kEUR.</li>
<li>Enduit sur PSE = plus frequent, 120-180 EUR/m<sup>2</sup>.</li>
<li>Aides 2026 : jusqu'a 70 % du cout couvert pour menages modestes.</li>
<li>Qualifications Qualibat 7141 ou 7142 obligatoires pour RGE.</li>
<li>Attention ponts thermiques, humidite, ventilation = sinon decennale refusee.</li>
</ul>
"""

a = render(
    slug="isolation-thermique-exterieure-ite-artisan-2026",
    title="ITE en 2026 : marche, prix, techniques et pieges pour artisan BTP",
    meta_desc="Isolation Thermique par l'Exterieur (ITE) : 380 000 chantiers prevus 2026. Les 3 techniques, prix 150-220 EUR/m2, aides jusqu'a 70 %, 6 pieges qui annulent la decennale.",
    keywords="ITE isolation exterieure, PSE artisan, bardage rapporte, Qualibat 7141, isolation facade renovation",
    h1="ITE en 2026 : marche, prix, techniques et pieges",
    read_min=9,
    summary_items=[
        "Les 3 techniques principales et leurs differences de prix",
        "Chiffrage detaille d'un chantier maison 140 m2",
        "Aides 2026 : jusqu'a 70 % de reste a charge couvert",
        "Les 6 pieges techniques qui annulent la decennale",
        "Qualifications Qualibat 7141/7142 et formations fabricant",
    ],
    body_html=a_body,
    related=[
        ("/blog-pro/devenir-rge-2026.html", "Comment devenir RGE en 2026"),
        ("/blog-pro/aides-renovation-energetique-2026-maprimerenov-cee.html", "Aides renovation energetique 2026"),
    ],
)
with open(os.path.join(OUT, "isolation-thermique-exterieure-ite-artisan-2026.html"), "w") as f:
    f.write(a)


# ============ ARTICLE 13 : POMPES A CHALEUR ============
a_body = """
<p>La pompe a chaleur air/eau est <strong>le produit phare du marche renovation energetique</strong> en 2026. Le Plan France Relance et la fin progressive des chaudieres a fioul et gaz (interdites a l'installation neuve depuis 2024) ont propulse ce segment a <strong>1,2 million d'unites installees par an</strong>.</p>

<p>Ce guide couvre le choix technique, les criteres de dimensionnement, les erreurs d'installation qui plombent votre decennale, et la rentabilite metier.</p>

<h2>Les 4 types de PAC a connaitre</h2>

<table><thead><tr><th>Type</th><th>COP moyen</th><th>Prix fourni/pose</th><th>Marche</th></tr></thead><tbody>
<tr><td><strong>Air/air (climatisation)</strong></td><td>3,0 - 3,8</td><td>3 000 - 8 000 EUR</td><td>Climatisation + petit chauffage</td></tr>
<tr><td><strong>Air/eau</strong></td><td>3,5 - 4,5</td><td>9 000 - 16 000 EUR</td><td>Chauffage + ECS (le plus frequent)</td></tr>
<tr><td><strong>Eau/eau (aquathermie)</strong></td><td>4,5 - 5,2</td><td>14 000 - 22 000 EUR</td><td>Haute performance, forage requis</td></tr>
<tr><td><strong>Sol/eau (geothermique)</strong></td><td>4,5 - 5,5</td><td>18 000 - 30 000 EUR</td><td>Terrain large, gros budgets</td></tr>
</tbody></table>

<p>La <strong>PAC air/eau</strong> represente 78 % du marche 2026. Focus.</p>

<h2>Dimensionnement : ne pas surdimensionner</h2>

<p>Regle cle : la PAC doit couvrir <strong>80-90 % des besoins annuels</strong>, pas 100 %. Surdimensionner = marches/arrets frequents = COP reel abaisse + usure compresseur.</p>

<h3>Methode rapide de dimensionnement</h3>
<p>Puissance en kW = <strong>surface habitable (m<sup>2</sup>) / 20</strong> (maison RT2012) ou <strong>/ 12</strong> (maison non isolee).</p>

<p>Exemple : maison RT2012 de 110 m<sup>2</sup> = 5,5 kW -&gt; PAC 6 kW. Maison ancienne 130 m<sup>2</sup> = 10,8 kW -&gt; PAC 11 kW.</p>

<div class="info-box"><strong>Bonne pratique :</strong> demander un bilan thermique RT ou une etude thermique simplifiee avant installation. 200-400 EUR, integre dans le prix du chantier, evite 3 sinistres sur 10.</div>

<h2>Les 8 erreurs d'installation qui causent des sinistres</h2>

<h3>1. Unite exterieure mal positionnee</h3>
<p>Proche mur mitoyen = bruit de voisinage (litige civil frequent). Au sol sans drainage = givre, casse hiver. Sous fenetre de chambre = nuisances sonores.</p>

<p>Regles : 1 m mini de mur mitoyen, socle sureleve, orientation hors vents dominants, espace libre 1,5 m devant le ventilateur.</p>

<h3>2. Sous-dimensionnement du circuit hydraulique</h3>
<p>Radiateurs existants trop petits = basses temperatures insuffisantes = inconfort. Calcul emetteurs obligatoire, souvent ajout de radiateurs ou passage au plancher chauffant.</p>

<h3>3. Ne pas realiser le purge et equilibrage</h3>
<p>Circuit non equilibre = ecarts temperature entre pieces, cyclages. Doit etre fait et documente.</p>

<h3>4. Omission ballon tampon</h3>
<p>Sur circuits courts ou plancher chauffant, un ballon tampon 50-100 L stabilise le fonctionnement, prolonge duree de vie.</p>

<h3>5. Regulation inadaptee</h3>
<p>Thermostat simple = cycles trop courts. Regulation sur sonde exterieure obligatoire. Programmation fine (nuit, jours feries, absence).</p>

<h3>6. Mauvaise evacuation condensats</h3>
<p>Condensation sur unite exterieure en hiver = risque de glace sur trottoir / allee. Evacuation vers bac ou descente pluviale obligatoire.</p>

<h3>7. Manque d'isolation tuyauterie</h3>
<p>Tuyauterie de liaison entre interieure et exterieure doit etre isolee (epaisseur &ge; 13 mm laine elastomere). Sans isolation = perte 15-25 % de COP.</p>

<h3>8. Declaration F-Gaz oubliee</h3>
<p>Les PAC contiennent fluide frigorigene (R32, R290, R454B). Declaration obligatoire sous SYDEREP pour chantiers professionnels. Amende 3 000-15 000 EUR en cas de controle.</p>

<h2>Choix de la marque : criteres</h2>

<ul>
<li><strong>Daikin</strong> : leader europeen, large gamme, SAV dense, un peu cher</li>
<li><strong>Atlantic / Thermor</strong> : francais, produits adaptes renovation, bon rapport qualite-prix</li>
<li><strong>Panasonic / Mitsubishi</strong> : innovation technique, fluides R290 (environnement)</li>
<li><strong>Viessmann</strong> : premium, haute performance, garantie 10 ans</li>
<li><strong>Bosch</strong> : domotique integree, connection internet</li>
<li><strong>Hitachi</strong> : gros debits, tertiaire</li>
</ul>

<h2>Marge et rentabilite metier</h2>

<p>Chantier moyen PAC air/eau 12 kW avec ECS, maison 110 m<sup>2</sup> :</p>

<table><thead><tr><th>Poste</th><th>Cout artisan</th></tr></thead><tbody>
<tr><td>Achat PAC (prix pro)</td><td>6 500 EUR HT</td></tr>
<tr><td>Accessoires (ballon, vases, circuits)</td><td>1 800 EUR HT</td></tr>
<tr><td>Main d'oeuvre (3 jours 2 techniciens)</td><td>1 680 EUR</td></tr>
<tr><td><strong>Cout total</strong></td><td><strong>9 980 EUR HT</strong></td></tr>
<tr><td>Prix client HT</td><td>13 300 EUR HT</td></tr>
<tr><td>Prix client TTC (5,5 %)</td><td>14 032 EUR TTC</td></tr>
<tr><td><strong>Marge artisan</strong></td><td><strong>3 320 EUR (25 %)</strong></td></tr>
</tbody></table>

<h2>Qualifications requises</h2>
<ul>
<li><strong>QualiPAC Chauffage et ECS</strong> (delivre par Qualit'EnR)</li>
<li>Formation initiale RGE (3-5 jours, 1 200-1 800 EUR)</li>
<li>Attestation de capacite fluides frigorigenes (categorie I si &gt; 30 kW, IV pour moins)</li>
<li>Certification SYDEREP pour declaration fluides</li>
</ul>

<h2>Entretien annuel : source de recurrent</h2>

<p>Depuis 2020, entretien annuel obligatoire pour PAC &gt; 4 kW. Clients captifs si vous proposez contrat d'entretien :</p>
<ul>
<li>150-250 EUR/an par installation</li>
<li>100 clients = 15-25 kEUR de CA recurrent annuel</li>
<li>Contact regulier pour revente SAV, accessoires, upgrade</li>
</ul>

<h2>En resume</h2>
<ul>
<li>PAC air/eau = 78 % du marche 2026, ticket moyen 13-16 kEUR TTC.</li>
<li>Dimensionnement 80-90 % des besoins, pas 100 %.</li>
<li>Unite exterieure : 1 m min du mur mitoyen, socle sureleve, orientation etudiee.</li>
<li>Regulation sur sonde exterieure + ballon tampon si plancher chauffant.</li>
<li>QualiPAC + attestation fluides obligatoires. Marge 20-30 %.</li>
<li>Entretien annuel = CA recurrent 150-250 EUR/client/an.</li>
</ul>
"""

a = render(
    slug="pompes-a-chaleur-installation-artisan-2026",
    title="Pompes a chaleur en 2026 : choix, dimensionnement, erreurs et marge",
    meta_desc="PAC air/eau : marche 1,2 million d'unites/an en 2026. Les 4 types, dimensionnement, 8 erreurs d'installation, marque a choisir, marge artisan 20-30 %. Guide pro.",
    keywords="pompe a chaleur installation, PAC air eau dimensionnement, QualiPAC artisan, choix marque PAC, entretien PAC annuel",
    h1="Pompes a chaleur 2026 : choix, pose, marge artisan",
    read_min=9,
    summary_items=[
        "Les 4 types de PAC et leurs specificites",
        "Methode de dimensionnement (80-90 % des besoins)",
        "Les 8 erreurs d'installation qui causent des sinistres",
        "Comparatif marques (Daikin, Atlantic, Viessmann, etc.)",
        "Marge artisan sur PAC air/eau : 20-30 % sur 14 kEUR TTC",
    ],
    body_html=a_body,
    related=[
        ("/blog-pro/energies-renouvelables-secteur-croissance-btp.html", "Energies renouvelables : secteur en croissance"),
        ("/blog-pro/devenir-rge-2026.html", "Comment devenir RGE en 2026"),
    ],
)
with open(os.path.join(OUT, "pompes-a-chaleur-installation-artisan-2026.html"), "w") as f:
    f.write(a)


# ============ ARTICLE 14 : RECRUTER UN SALARIE CDI ============
a_body = """
<p>Un artisan qui passe de solo a 2-3 salaries <strong>multiplie son CA par 2,5 en 18 mois en moyenne</strong>. Mais 60 % de ceux qui tentent le pas echouent : mauvais profil recrute, obligations RH sous-estimees, charge administrative non anticipee.</p>

<p>Ce guide donne la procedure complete pour recruter votre premier CDI en BTP, avec les aides 2026, les pieges et le vrai cout.</p>

<h2>Avant de recruter : 3 questions a se poser</h2>

<h3>1. Ai-je 18 mois de tresorerie pour couvrir ce salaire ?</h3>
<p>Salaire ouvrier qualifie BTP = 1 800-2 400 EUR brut/mois (selon region et metier). Charges patronales : 30-42 %. Cout employeur mensuel : <strong>2 340-3 400 EUR</strong>. Ajouter vehicule (400 EUR), outillage (150 EUR), formation (50 EUR), pauses (50 EUR) : environ <strong>3 000-4 000 EUR/mois reel</strong>.</p>

<h3>2. Est-ce que ma pipeline de chantiers suit ?</h3>
<p>Il faut <strong>12 mois de chantiers previsibles</strong> (pas juste esperes). Verifier le carnet de commandes, les devis signes, les chantiers en stand-by.</p>

<h3>3. Suis-je pret a consacrer 5-8h/semaine a la gestion RH ?</h3>
<p>Planning chantiers, entretiens, formations, administratif, paie : le solo doit assumer la partie dirigeante en plus de la technique.</p>

<h2>Quel profil recruter en premier</h2>

<p>Regle pragmatique : <strong>un profil qui fait ce que VOUS faites deja moins bien</strong>.</p>

<table><thead><tr><th>Si vous etes...</th><th>Recruter...</th></tr></thead><tbody>
<tr><td>Tres technique, peu commercial</td><td>Aide-technique polyvalent + vous deleguez les devis</td></tr>
<tr><td>Bon commercial, moins technique</td><td>Ouvrier qualifie experimente, vous gardez la relation client</td></tr>
<tr><td>Complet mais debordee</td><td>Aide ouvrier (apprenti ou junior) pour les taches chronophages</td></tr>
<tr><td>Grosse pipeline tertiaire</td><td>Ouvrier qualifie + vous devenez conducteur de travaux</td></tr>
</tbody></table>

<h2>Ou trouver de bons candidats</h2>

<ul>
<li><strong>Pole emploi / France Travail</strong> : 40 % des recrutements BTP, aides embauche integrees</li>
<li><strong>Indeed, HelloWork, Jooble</strong> : 500-2 000 CV par annonce, filtrage requis</li>
<li><strong>Capeb, FFB</strong> : CV-theque adherents, candidats motives</li>
<li><strong>LinkedIn</strong> : surtout pour postes a responsabilite (chef d'equipe, conducteur de travaux)</li>
<li><strong>Apprentis sortis de CFA</strong> : souvent le meilleur ratio motivation/cout</li>
<li><strong>Cooptation equipe</strong> : prime 300-1 000 EUR par recrutement reussi via un salarie</li>
</ul>

<h2>Entretien : 5 questions qui revelent le bon profil</h2>

<ol>
<li>&laquo; Raconte-moi ton dernier chantier difficile : qu'as-tu fait ? &raquo; (revele autonomie et resolution de problemes)</li>
<li>&laquo; Qu'est-ce qui te fait perdre ton temps sur un chantier ? &raquo; (revele organisation)</li>
<li>&laquo; Comment tu reagis quand un client change d'avis en cours ? &raquo; (revele posture commerciale)</li>
<li>&laquo; Quel est ton meilleur chantier et pourquoi ? &raquo; (revele motivation intrinseque)</li>
<li>&laquo; Dans 3 ans, ou te vois-tu ? &raquo; (revele vision et risque de depart)</li>
</ol>

<p>Test pratique d'1 journee sur chantier reel = meilleur indicateur. Paye comme une intermission (environ 150 EUR).</p>

<h2>Le contrat : CDI, CDD ou interim ?</h2>

<table><thead><tr><th>Type</th><th>Avantages</th><th>Inconvenients</th></tr></thead><tbody>
<tr><td>CDI</td><td>Engagement mutuel, aides embauche, stabilite</td><td>Difficile a rompre, cout licenciement</td></tr>
<tr><td>CDD</td><td>Flexibilite, motif clair (chantier, remplacement)</td><td>Prime precarite 10 %, limite 18 mois</td></tr>
<tr><td>Interim</td><td>Besoin ponctuel, pas de paperasse, pas d'engagement</td><td>+30-40 % cout horaire, pas de fidelisation</td></tr>
</tbody></table>

<p>Recommandation : <strong>periode d'essai stricte (2 mois renouvelable)</strong> pour verifier la compatibilite avant de s'engager definitivement.</p>

<h2>Aides a l'embauche 2026</h2>

<h3>Aide a l'embauche des jeunes &lt; 26 ans</h3>
<p>Selon les contrats, jusqu'a <strong>4 000 EUR</strong> pour un jeune sans qualif, 2 000 EUR pour un jeune avec qualif.</p>

<h3>Emploi franc</h3>
<p>Pour embauche d'habitants de QPV (Quartiers Prioritaires de la Politique de la Ville) : <strong>5 000 EUR la premiere annee, 2 500 EUR les 2 annees suivantes</strong>.</p>

<h3>Travailleur handicape (AGEFIPH)</h3>
<p>Prime a l'insertion durable : <strong>jusqu'a 5 000 EUR</strong>. Amenagement poste subventionne.</p>

<h3>Contrat unique d'insertion (CUI-CIE)</h3>
<p>Prise en charge de <strong>47-95 % du SMIC</strong> par France Travail pendant 6-24 mois pour les publics eloignes de l'emploi.</p>

<h3>Reductions cotisations patronales</h3>
<p>Reduction Fillon (renommee reduction generale) : diminue les cotisations URSSAF sur les salaires jusqu'a 1,6 SMIC. <strong>Environ 5 500 EUR de reduction/an</strong> pour un salarie au SMIC.</p>

<h2>Demarche administrative d'embauche (45 minutes)</h2>

<ol>
<li><strong>DPAE</strong> (Declaration Prealable A l'Embauche) : sur urssaf.fr, max 8 jours avant debut contrat</li>
<li><strong>Contrat de travail</strong> ecrit (obligatoire en CDI temps partiel, CDD, apprentissage ; recommande en CDI temps plein)</li>
<li><strong>Registre du personnel</strong> : livre legal, tenu a jour manuellement</li>
<li><strong>Affiliation medecine du travail</strong> : visite d'embauche sous 3 mois</li>
<li><strong>Mutuelle d'entreprise</strong> (obligatoire depuis 2016) : 30-60 EUR/mois, cofinance 50 % employeur</li>
<li><strong>Affiliation retraite complementaire</strong> : automatique</li>
<li><strong>Declaration prevoyance</strong> (obligatoire en BTP) : CNP Assurances, AG2R La Mondiale, ou autre</li>
<li><strong>Fiche de paie</strong> chaque mois : Silae, Payfit, expert-comptable (cout 25-50 EUR/paie)</li>
</ol>

<h2>Les 6 erreurs qui font echouer les premieres embauches</h2>

<h3>1. Embaucher &laquo; en urgence &raquo;</h3>
<p>Recruter parce que submerge = mauvais choix. Prendre 2-3 semaines pour bien recruter.</p>

<h3>2. Ne pas formaliser contrat et fiche de poste</h3>
<p>Sans ecrit = litiges garantis sur horaires, missions, remuneration.</p>

<h3>3. Oublier la formation integration</h3>
<p>Premiers 1-2 mois : vous accompagnez chaque chantier au debut. Pas 5 jours. 4-8 semaines selon complexite.</p>

<h3>4. Mal payer</h3>
<p>Payer sous le marche = turnover a 6 mois. Benchmark via l'Observatoire Metiers BTP.</p>

<h3>5. Ne pas deleguer apres avoir recrute</h3>
<p>Le piege classique : vous embauchez, puis vous refaites tout derriere lui par peur. Il demotivate, part. Accepter 85 % de qualite au lieu de 100 %.</p>

<h3>6. Negliger les cotisations BTP</h3>
<p>Caisse conges payes BTP (CIBTP) + PRO BTP (prevoyance sante) : specifiques au secteur. Cotisations 5-8 % additionnelles du brut. Oubli = redressement 3 ans en arriere.</p>

<h2>Cout reel mensuel d'un premier salarie (simulation)</h2>

<table><thead><tr><th>Poste</th><th>Montant</th></tr></thead><tbody>
<tr><td>Salaire brut (ouvrier qualifie)</td><td>2 100 EUR</td></tr>
<tr><td>Charges patronales (~38 %)</td><td>798 EUR</td></tr>
<tr><td>Mutuelle entreprise 50 %</td><td>30 EUR</td></tr>
<tr><td>Prevoyance CIBTP</td><td>85 EUR</td></tr>
<tr><td>Congespayes BTP</td><td>168 EUR (8 %)</td></tr>
<tr><td>Amortissement vehicule + carburant</td><td>400 EUR</td></tr>
<tr><td>Outillage, EPI, formation</td><td>200 EUR</td></tr>
<tr><td><strong>Cout employeur mensuel</strong></td><td><strong>3 781 EUR</strong></td></tr>
<tr><td>- Reduction Fillon (env)</td><td>- 440 EUR</td></tr>
<tr><td><strong>Cout net mensuel</strong></td><td><strong>3 341 EUR</strong></td></tr>
</tbody></table>

<p>A faire generer au minimum <strong>6 000-7 000 EUR</strong> de CA/mois au salarie pour que l'embauche soit rentable.</p>

<h2>En resume</h2>
<ul>
<li>Cout reel mensuel premier salarie : 3 300-4 000 EUR tout compris.</li>
<li>18 mois de tresorerie + pipeline 12 mois requis avant d'embaucher.</li>
<li>Aides 2026 : jeunes, QPV, TH, reduction Fillon (jusqu'a 6 kEUR/an cumules).</li>
<li>Profil a recruter = celui qui fait ce que vous faites le moins bien.</li>
<li>Formalisation du contrat et des missions = non negociable.</li>
<li>Objectif : 6-7 kEUR de CA/mois par salarie pour etre rentable.</li>
</ul>
"""

a = render(
    slug="recruter-premier-salarie-cdi-artisan-btp-2026",
    title="Recruter votre premier salarie CDI en BTP : cout reel, aides et procedure",
    meta_desc="Passer de solo a premier salarie CDI en 2026 : cout mensuel 3 300-4 000 EUR tout compris, aides (jusqu'a 6 kEUR/an), procedure administrative, 6 erreurs a eviter.",
    keywords="embaucher CDI artisan, cout salarie BTP, aide embauche France Travail, reduction Fillon, CIBTP PRO BTP",
    h1="Recruter votre premier CDI en BTP : cout, aides, procedure",
    read_min=10,
    summary_items=[
        "Les 3 questions cles avant de recruter",
        "Quel profil recruter en fonction de vos points faibles",
        "Les 5 aides 2026 qui reduisent le cout de 25-40 %",
        "Cout mensuel reel : 3 300-4 000 EUR tout compris",
        "Les 6 erreurs qui font echouer les premieres embauches",
    ],
    body_html=a_body,
    related=[
        ("/blog-pro/embaucher-apprenti-artisan-btp-2026.html", "Embaucher un apprenti BTP"),
        ("/blog-pro/statut-juridique-artisan-btp-2026.html", "Quel statut juridique choisir"),
    ],
)
with open(os.path.join(OUT, "recruter-premier-salarie-cdi-artisan-btp-2026.html"), "w") as f:
    f.write(a)


# ============ ARTICLE 15 : BIM POUR ARTISAN ============
a_body = """
<p>Le BIM (Building Information Modeling) est souvent vu comme un truc de bureaux d'etudes. Erreur strategique : en 2026, <strong>78 % des appels d'offres publics &gt; 1 MEUR imposent le BIM</strong>, et les bailleurs sociaux s'y mettent aussi pour la renovation collective. Un artisan qui sait lire et travailler en BIM decroche des chantiers inaccessibles aux autres.</p>

<p>Ce guide explique ce que c'est concretement, les outils gratuits ou abordables, et le plan pour s'y mettre en moins de 3 mois sans recrutement.</p>

<h2>Le BIM en 2 minutes</h2>

<p>Le BIM est une <strong>maquette numerique 3D</strong> du batiment, contenant non seulement la geometrie mais aussi :</p>
<ul>
<li>Les composants (murs, portes, radiateurs, luminaires) avec leur reference fabricant</li>
<li>Les performances techniques (isolation, resistance, norme)</li>
<li>Les liens entre elements (si le mur bouge, la fenetre suit)</li>
<li>Les informations de maintenance (date de pose, garantie, fiche technique)</li>
</ul>

<p>Concretement : au lieu de manipuler 50 plans 2D qui ne se parlent pas, vous avez UNE maquette centrale, coherente et partagee.</p>

<h2>Les 3 niveaux BIM</h2>

<h3>Niveau 1 : lecture et extraction</h3>
<p>Vous recevez une maquette IFC (format standard), vous l'ouvrez, vous extrayez les quantitifs (metres de cloison, m<sup>2</sup> de carrelage) pour chiffrer. <strong>C'est l'etape accessible a tout artisan en 2026.</strong></p>

<h3>Niveau 2 : modification</h3>
<p>Vous modifiez la maquette pour integrer votre lot (ex : un electricien ajoute les cheminements). Requiert un logiciel payant (Revit, Archicad) et 2-3 jours de formation.</p>

<h3>Niveau 3 : production native</h3>
<p>Vous produisez vos plans et votre DOE (Dossier des Ouvrages Executes) directement en BIM. Ressource pour PME BTP structurees, pas pour TPE solo.</p>

<h2>Les outils gratuits pour lire un BIM</h2>

<ul>
<li><strong>BIMvision</strong> (gratuit) : ouvre les fichiers IFC, fait des extractions basiques</li>
<li><strong>SolibriOffice</strong> (version gratuite limitee) : visualisation avancee, conflits detectes</li>
<li><strong>FZK Viewer</strong> (open source) : Windows uniquement, fonctionnel</li>
<li><strong>usBIM.viewer+</strong> (gratuit basique, payant 290 EUR/an pour version complete) : edition et export</li>
</ul>

<h2>Les outils payants abordables</h2>

<table><thead><tr><th>Logiciel</th><th>Prix 2026</th><th>Usage</th></tr></thead><tbody>
<tr><td>Sketchup Pro</td><td>340 EUR/an</td><td>Modelisation simple, export IFC</td></tr>
<tr><td>Archicad Solo</td><td>180 EUR/mois</td><td>BIM complet PME</td></tr>
<tr><td>Revit LT</td><td>450 EUR/an</td><td>Revit simplifie</td></tr>
<tr><td>Plancal Nova / Fisa</td><td>1 200-3 000 EUR/an</td><td>BIM specifique fluides CVC/plomberie</td></tr>
<tr><td>AllPlan</td><td>150 EUR/mois</td><td>BIM structurel maconnerie</td></tr>
</tbody></table>

<h2>Formats a connaitre</h2>
<ul>
<li><strong>IFC</strong> (.ifc) : format standard ouvert, echange entre logiciels</li>
<li><strong>BCF</strong> (.bcf) : fichier de commentaires / problemes sur la maquette</li>
<li><strong>RVT</strong> (.rvt) : natif Revit</li>
<li><strong>PLN</strong> (.pln) : natif Archicad</li>
</ul>

<p>Format a toujours exiger du client : <strong>IFC2x3 ou IFC4</strong>, lisible par tous.</p>

<h2>Applications concretes pour un artisan</h2>

<h3>1. Chiffrer un chantier 3x plus vite</h3>
<p>Avec un BIM, extraire les quantitifs en 20 minutes au lieu de 3h en manuel :</p>
<ul>
<li>Metre lineaire de cloisons par type</li>
<li>Nombre de portes par dimension</li>
<li>m<sup>2</sup> de carrelage par piece</li>
<li>Metres de reseau electrique / plomberie</li>
</ul>

<h3>2. Detecter les conflits avant chantier</h3>
<p>Quand vous recevez une maquette, les conflits entre lots (tuyauterie qui passe dans une poutre) se voient en 3D. Signaler avant le chantier = gain de temps enorme en execution.</p>

<h3>3. Preparer pose sur chantier</h3>
<p>Exporter des vues 3D de chaque piece pour vos compagnons. Plus efficace qu'un plan 2D avec 15 annotations.</p>

<h3>4. Documenter le DOE</h3>
<p>En fin de chantier, documenter ce qui a ete pose (references, photos, dates). Le maitre d'ouvrage le demande de plus en plus.</p>

<h2>Plan de montee en competence 3 mois</h2>

<table><thead><tr><th>Mois</th><th>Actions</th></tr></thead><tbody>
<tr><td>1</td><td>Telecharger BIMvision, s'entrainer sur fichiers IFC publics (Open BIM Database). 4-6h d'apprentissage.</td></tr>
<tr><td>2</td><td>Extraire des quantitifs sur 2-3 maquettes reelles. Reponse simulee a un appel d'offres BIM.</td></tr>
<tr><td>3</td><td>Ajouter mention &laquo; Lecture maquette BIM - compatible IFC &raquo; dans son memoire technique pour marches publics. 1re reponse sur AO BIM.</td></tr>
</tbody></table>

<h2>Formations disponibles</h2>
<ul>
<li><strong>AFPA, CESI</strong> : 3-5 jours, 1 200-2 500 EUR, finance par OPCO EP</li>
<li><strong>YouTube + OpenBIM</strong> : gratuit, bon pour auto-apprentissage</li>
<li><strong>Formations editeurs</strong> (Sketchup, Archicad) : 500-1 200 EUR, ciblees</li>
<li><strong>CAPEB / FFB</strong> : formations adherents sur BIM artisan (subventionnees 50-80 %)</li>
</ul>

<h2>Ce que ca change pour decrocher des marches</h2>

<ul>
<li>Mention &laquo; compatible BIM &raquo; dans le memoire technique : <strong>+5-15 points</strong> sur les marches qui integrent le critere</li>
<li>Acces aux marches publics &gt; 1 MEUR</li>
<li>Contrats avec bailleurs sociaux et promoteurs (ils integrent de plus en plus le BIM)</li>
<li>Differenciation forte vis-a-vis des concurrents TPE qui ne s'y sont pas mis</li>
</ul>

<h2>Erreurs frequentes</h2>

<ul>
<li><strong>Vouloir tout faire en BIM d'un coup</strong> : commencer par la lecture, progresser vers la modification si besoin</li>
<li><strong>Prendre un logiciel trop lourd</strong> pour ses besoins (Revit pour faire du quantitatif = surpuissance)</li>
<li><strong>Ne pas former l'equipe</strong> : un artisan BIM seul dans une equipe qui ne comprend pas = inefficace</li>
<li><strong>Sous-estimer la plus-value commerciale</strong> : clients serieux preferent un artisan BIM meme en renovation classique</li>
</ul>

<h2>En resume</h2>
<ul>
<li>BIM = maquette 3D + donnees techniques partagees. Standard croissant des 2026.</li>
<li>Lecture IFC accessible a tout artisan avec outils gratuits (BIMvision, usBIM).</li>
<li>Gain chiffrage 3x plus rapide, detection de conflits avant chantier, DOE simplifie.</li>
<li>78 % des AO publics &gt; 1 MEUR imposent le BIM : acces a nouveau marche.</li>
<li>Plan 3 mois accessible sans recrutement avec formations OPCO EP.</li>
</ul>
"""

a = render(
    slug="bim-maquette-numerique-artisan-btp-2026",
    title="BIM pour artisan BTP en 2026 : comment s'y mettre en 3 mois",
    meta_desc="BIM artisan : 78 % des AO publics &gt; 1 MEUR l'imposent en 2026. Comment lire et exploiter une maquette IFC sans logiciel cher. Plan 3 mois pour monter en competence.",
    keywords="BIM artisan, maquette numerique BTP, IFC extraction quantitatifs, formation BIM TPE, Revit LT Archicad",
    h1="BIM pour artisan BTP : comment s'y mettre en 3 mois",
    read_min=8,
    summary_items=[
        "Comprendre BIM en 2 minutes (concret, pas theorique)",
        "Les 3 niveaux BIM et lequel vise un artisan TPE",
        "Outils gratuits (BIMvision, usBIM) pour commencer",
        "Applications concretes : chiffrage 3x plus rapide, detection de conflits",
        "Plan 3 mois pour monter en competence sans recruter",
    ],
    body_html=a_body,
    related=[
        ("/blog-pro/repondre-marches-publics-btp-artisan.html", "Repondre aux marches publics"),
        ("/blog-pro/nouvelles-exigences-reglementaires-btp-2026.html", "Nouvelles exigences reglementaires BTP"),
    ],
)
with open(os.path.join(OUT, "bim-maquette-numerique-artisan-btp-2026.html"), "w") as f:
    f.write(a)


print("Batch 3 : 5 articles generes.")
for slug in ["qualibat-qualifelec-qualigaz-guide-qualifications-btp-2026", "isolation-thermique-exterieure-ite-artisan-2026",
             "pompes-a-chaleur-installation-artisan-2026", "recruter-premier-salarie-cdi-artisan-btp-2026",
             "bim-maquette-numerique-artisan-btp-2026"]:
    print(f"- {slug}.html")

#!/usr/bin/env python3
"""Batch 4 : Photovoltaique, Bornes VE, Gestion chantier, Logiciels gestion, Reseaux sociaux."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _template_gen import render

OUT = os.path.dirname(__file__)

# ============ ARTICLE 16 : PHOTOVOLTAIQUE ============
a_body = """
<p>Le photovoltaique residentiel a passe la barre des <strong>270 000 installations/an</strong> en France en 2025 et devrait depasser <strong>350 000 en 2026</strong>. Prix des panneaux en baisse de 18 % sur 3 ans, aides maintenues, autoconsommation plebiscitee : le marche est en plein boom. Un artisan qui s'y met aujourd'hui capte un segment rentable avec peu de concurrence locale.</p>

<p>Ce guide couvre les configurations, les aides 2026, les erreurs qui plombent la production et les marges reelles metier.</p>

<h2>Les 3 types d'installation residentielle</h2>

<h3>1. Autoconsommation avec vente du surplus</h3>
<p>Le plus frequent en 2026 (85 % des installations residentielles). Le client consomme directement l'electricite produite par le soleil, revend le surplus a EDF OA (0,127 EUR/kWh en 2026 pour &lt; 9 kWc).</p>

<h3>2. Autoconsommation totale (batterie)</h3>
<p>Stockage dans une batterie lithium (Tesla Powerwall, Huawei LUNA, Sonnen). Permet de consommer la nuit sa production du jour. Rentabilite a 12-15 ans, mais independance energetique.</p>

<h3>3. Revente totale</h3>
<p>Tarif garanti 20 ans pour installations &lt; 9 kWc. Moins rentable aujourd'hui car tarif bas, quasi disparu.</p>

<h2>Chiffrage d'une installation 6 kWc (18 panneaux)</h2>

<table><thead><tr><th>Poste</th><th>Cout HT</th></tr></thead><tbody>
<tr><td>18 panneaux monocristallins 400 Wc (Longi, JA Solar, Trina)</td><td>2 700 EUR</td></tr>
<tr><td>Onduleur hybride 6 kW (SolarEdge, Huawei, Fronius)</td><td>1 400 EUR</td></tr>
<tr><td>Structure de fixation rail + crochets</td><td>600 EUR</td></tr>
<tr><td>Cables DC/AC, protections, coffret</td><td>400 EUR</td></tr>
<tr><td>Main d'oeuvre (2 techniciens x 1,5 jour)</td><td>1 200 EUR</td></tr>
<tr><td><strong>Total cout HT</strong></td><td><strong>6 300 EUR</strong></td></tr>
<tr><td>Marge 25 %</td><td>1 575 EUR</td></tr>
<tr><td>Prix client HT</td><td>7 875 EUR</td></tr>
<tr><td>Prix client TTC (10 % jusqu'a 3 kWc, 20 % au-dela)</td><td>8 821 EUR</td></tr>
</tbody></table>

<h2>Aides 2026 pour le client</h2>

<h3>Prime a l'autoconsommation</h3>
<p>Versee sur 5 ans (20 % a la mise en service, 20 %/an les 4 annees suivantes).</p>

<table><thead><tr><th>Puissance</th><th>Prime totale</th></tr></thead><tbody>
<tr><td>&le; 3 kWc</td><td>310 EUR/kWc soit 930 EUR max</td></tr>
<tr><td>3-9 kWc</td><td>230 EUR/kWc soit jusqu'a 2 070 EUR</td></tr>
<tr><td>9-36 kWc</td><td>190 EUR/kWc</td></tr>
<tr><td>36-100 kWc</td><td>80 EUR/kWc</td></tr>
</tbody></table>

<h3>TVA reduite 10 %</h3>
<p>Sur installations &le; 3 kWc. Au-dela, 20 %. Certains fabricants poussent des configurations 2,99 kWc pour rester sous le seuil.</p>

<h3>Tarif de rachat EDF OA</h3>
<p>Garanti 20 ans pour le surplus injecte reseau. En 2026 : 0,127 EUR/kWh pour &le; 9 kWc, 0,105 EUR/kWh pour 9-100 kWc.</p>

<h3>Aides locales</h3>
<ul>
<li>IDF : 500-1 500 EUR selon commune</li>
<li>Grand Est : cheque Climaxion jusqu'a 3 000 EUR</li>
<li>Bretagne : prime autoconsommation 1 000 EUR</li>
</ul>

<h2>Rentabilite client (installation 6 kWc a Paris)</h2>

<ul>
<li>Production annuelle : 6 800 kWh (1 130 kWh/kWc moyen France)</li>
<li>Economie autoconsommation (60 % de la prod) : 850 EUR/an</li>
<li>Revente surplus (40 % * 0,127) : 345 EUR/an</li>
<li>Prime autoconsommation lissee : 410 EUR/an les 5 premieres annees</li>
<li><strong>Gain annuel : 1 200-1 600 EUR</strong></li>
<li>Cout net (8 800 - 1 200 aides) : 7 600 EUR</li>
<li><strong>Retour sur investissement : 5,5 a 7 ans</strong></li>
<li>Duree de vie panneaux : 25-30 ans</li>
</ul>

<h2>Les 6 erreurs techniques qui plombent la production</h2>

<h3>1. Mauvaise orientation / inclinaison</h3>
<p>Ideal : plein sud, 30-35 %. Un toit nord = production 40 % plus faible. Un toit plat : pose avec lests et inclinaison 10-15 degres.</p>

<h3>2. Ombrage non anticipe</h3>
<p>Arbre, cheminee, antenne : l'ombre d'un element de 5 % de la surface cumulee reduit la production de 30 %. Utiliser un sun-path-finder ou simuler sur PVGIS.</p>

<h3>3. Cablage DC trop long ou section insuffisante</h3>
<p>Chute de tension en courant continu &gt; 2 % = perte de production. Calcul section selon longueur et courant.</p>

<h3>4. Onduleur surdimensionne</h3>
<p>Onduleur 8 kW pour 6 kWc de panneaux = bouddha fonctionne jamais a pleine charge = rendement maximal jamais atteint. Ratio optimal 0,85-0,95.</p>

<h3>5. Fixation mal etudiee selon toiture</h3>
<p>Tuiles canal, ardoise, bac acier, tole ondulee, toit plat : chaque support a ses crochets / rails. Mauvais choix = fuite en 2-3 ans et sinistre decennale.</p>

<h3>6. Monitoring absent</h3>
<p>Sans monitoring (Solaredge, Fronius Solar.Web, Huawei FusionSolar), le client ne voit pas si un panneau panne. Perte moyenne 8-15 % sur 10 ans. Monitoring = obligatoire.</p>

<h2>Qualifications et demarches</h2>
<ul>
<li><strong>Qualifelec SPV1 ou SPV2</strong> (RGE) : obligatoire pour que le client touche la prime.</li>
<li><strong>QualiPV</strong> (Qualit'EnR) : alternative electricien.</li>
<li><strong>Convention CONSUEL</strong> : visa conformite electrique avant mise en service reseau.</li>
<li><strong>Declaration prealable de travaux</strong> en mairie (DP) obligatoire, 1 mois.</li>
<li><strong>Convention d'autoconsommation et de vente</strong> (CAE) avec Enedis et EDF OA.</li>
</ul>

<h2>Marques recommandees</h2>

<table><thead><tr><th>Composant</th><th>Marques referentes 2026</th></tr></thead><tbody>
<tr><td>Panneaux (monocristallin)</td><td>JA Solar, Longi, Trina, Jinko (haut de gamme : SunPower, REC)</td></tr>
<tr><td>Onduleurs string</td><td>SolarEdge, Fronius, SMA, Huawei</td></tr>
<tr><td>Micro-onduleurs</td><td>Enphase IQ8 (panneau par panneau, meilleur rendement si ombrage)</td></tr>
<tr><td>Batteries</td><td>Tesla Powerwall, Huawei LUNA, BYD Premium HVS</td></tr>
</tbody></table>

<h2>Marge et competitivite metier</h2>

<p>Marche tres concurrentiel avec des pure players (Otovo, EDF ENR, Engie Mypower). Un artisan local gagne sur :</p>
<ul>
<li>Proximite (interventions SAV rapides)</li>
<li>Sur-mesure (adaptation toiture complexe)</li>
<li>Bouche-a-oreille local</li>
<li>Marge 20-28 % sur 7-10 kEUR TTC = 1 800-2 800 EUR par chantier</li>
</ul>

<p>Un artisan electricien RGE bien implante peut faire 40-80 installations/an en solo = <strong>80 a 220 kEUR de CA additionnel</strong>.</p>

<h2>En resume</h2>
<ul>
<li>Marche 350 000 installations residentielles prevues 2026.</li>
<li>Configuration standard 6 kWc : 8 800 EUR TTC, ROI 5,5-7 ans client.</li>
<li>Qualifelec SPV + CONSUEL + declaration DP = pre-requis administratifs.</li>
<li>Attention orientation, ombrage, cablage DC, choix onduleur, fixation, monitoring.</li>
<li>Marge 20-28 % par chantier, 40-80 chantiers/an possibles en artisan solo RGE.</li>
</ul>
"""

a = render(
    slug="photovoltaique-installation-artisan-btp-2026",
    title="Photovoltaique 2026 : installation, aides, rentabilite et erreurs — guide artisan",
    meta_desc="Photovoltaique residentiel 2026 : 350 000 installations/an. Chiffrage 6 kWc, aides autoconsommation, TVA reduite, tarif EDF OA, 6 erreurs techniques, marques recommandees.",
    keywords="photovoltaique artisan, autoconsommation 2026, Qualifelec SPV, onduleur solaire, CONSUEL PV",
    h1="Photovoltaique 2026 : installation, aides et rentabilite",
    read_min=9,
    summary_items=[
        "Les 3 types d'installation (autoconso, surplus, revente totale)",
        "Chiffrage detaille 6 kWc : 8 800 EUR TTC, marge 25 %",
        "Aides 2026 : prime autoconsommation, TVA 10 %, tarif EDF OA",
        "Les 6 erreurs techniques qui plombent la production",
        "Marques onduleurs, panneaux, batteries a connaitre",
    ],
    body_html=a_body,
    related=[
        ("/blog-pro/energies-renouvelables-secteur-croissance-btp.html", "Energies renouvelables : secteur en croissance"),
        ("/blog-pro/devenir-rge-2026.html", "Comment devenir RGE en 2026"),
    ],
)
with open(os.path.join(OUT, "photovoltaique-installation-artisan-btp-2026.html"), "w") as f:
    f.write(a)


# ============ ARTICLE 17 : BORNES DE RECHARGE VE ============
a_body = """
<p>Avec <strong>1,2 million de voitures electriques et hybrides rechargeables</strong> en circulation en France en 2026, le marche des bornes de recharge domestiques explose : <strong>480 000 points installes en 2025</strong>, projection 650 000 en 2026. C'est un relais de croissance ideal pour les electriciens qui connaissent la tension et la puissance.</p>

<p>Ce guide couvre les types de bornes, la pose, les aides 2026, les qualifications requises et la marge artisan reelle.</p>

<h2>Les 3 types de bornes residentielles</h2>

<table><thead><tr><th>Type</th><th>Puissance</th><th>Temps de charge</th><th>Cout fourni+pose</th></tr></thead><tbody>
<tr><td>Prise renforcee (Green'Up)</td><td>2,3 kW</td><td>~20h pour 100 %</td><td>350-700 EUR</td></tr>
<tr><td>Borne murale 7 kW monophase</td><td>7,4 kW</td><td>6-8h</td><td>1 200-1 800 EUR</td></tr>
<tr><td>Borne murale 11 kW ou 22 kW triphase</td><td>11-22 kW</td><td>2-4h</td><td>1 800-3 200 EUR</td></tr>
</tbody></table>

<p>La <strong>borne 7 kW</strong> est le choix dominant (65 % du marche) : suffisant pour recharge nocturne, pas besoin de changer l'abonnement EDF.</p>

<h2>Chiffrage d'une installation standard (borne 7 kW, 10 m de cable)</h2>

<table><thead><tr><th>Poste</th><th>Cout HT</th></tr></thead><tbody>
<tr><td>Borne 7 kW (Schneider, Wallbox, Legrand, Hager)</td><td>480 EUR</td></tr>
<tr><td>Cable RO2V 3G6 (10 m) + protections</td><td>150 EUR</td></tr>
<tr><td>Disjoncteur differentiel 30 mA type A</td><td>55 EUR</td></tr>
<tr><td>Main d'oeuvre (pose + declaration)</td><td>280 EUR</td></tr>
<tr><td><strong>Total cout HT</strong></td><td><strong>965 EUR</strong></td></tr>
<tr><td>Marge 25 %</td><td>241 EUR</td></tr>
<tr><td>Prix client HT</td><td>1 206 EUR</td></tr>
<tr><td>Prix client TTC (5,5 %)</td><td>1 273 EUR</td></tr>
</tbody></table>

<h2>Aides client 2026</h2>

<h3>Credit d'impot (CITE VE)</h3>
<p>75 % du cout TTC plafonne a 500 EUR par point de charge (residence principale, proprietaires et locataires). Versement l'annee suivante via declaration IR.</p>

<h3>Prime Advenir (bornes en copropriete)</h3>
<p>50 % du cout plafonne a 960 EUR par point pour installations en parking d'immeuble collectif. Versement rapide sur devis.</p>

<h3>TVA 5,5 %</h3>
<p>Applicable aux residences principales et secondaires de +2 ans (attestation Cerfa classique).</p>

<h3>Aides locales</h3>
<ul>
<li>IDF : 500 EUR/point</li>
<li>Metropole de Lyon : 300 EUR</li>
<li>Marseille : 400 EUR</li>
</ul>

<h2>Qualifications requises</h2>
<ul>
<li><strong>Qualifelec IRVE</strong> (Infrastructure Recharge Vehicule Electrique) obligatoire des 3,7 kW. 2 niveaux :
  <ul>
    <li>IRVE <strong>niveau 1</strong> : bornes &le; 22 kW residentiel</li>
    <li>IRVE <strong>niveau 2</strong> : bornes publiques et copropriete</li>
  </ul>
</li>
<li><strong>Habilitation electrique</strong> BR/BC minimum</li>
<li><strong>Formation fabricant</strong> (Schneider, Wallbox, etc.) souvent exigee pour garantie</li>
</ul>

<p>Formation initiale IRVE : 2-3 jours, 900-1 800 EUR, cofinance OPCO.</p>

<h2>Les 5 erreurs techniques qui causent sinistres</h2>

<h3>1. Omettre le differential 30 mA type A obligatoire</h3>
<p>Obligatoire depuis 2017. Un type AC ne protege pas contre les courants continus parasites qu'un VE genere.</p>

<h3>2. Sous-dimensionner le cable d'alimentation</h3>
<p>7,4 kW a 32 A exige cable 3G6 jusqu'a 18 m. Au-dela, 3G10. Mauvais calcul = echauffement, risque incendie.</p>

<h3>3. Ne pas installer de contacteur heures creuses</h3>
<p>Client paye plus cher. Pilotage HC automatique integre dans bornes modernes ou via contacteur externe.</p>

<h3>4. Mauvais emplacement</h3>
<p>Exterieur : indice IP54 minimum. Interieur garage : IP21. Hauteur : 80-140 cm du sol. Protection contre les chocs si zone de manoeuvre.</p>

<h3>5. Oublier la declaration Enedis</h3>
<p>Obligatoire au-dela de 6 kW additionnels. Enedis verifie que le poste de distribution peut absorber. Delai 2-4 semaines.</p>

<h2>Bornes en copropriete : un marche specifique</h2>

<p>Le &laquo; droit a la prise &raquo; (loi LOM 2019) garantit a chaque coproprietaire le droit d'installer une borne sur son emplacement. Vote AG non requis si financement individuel.</p>

<p>Marche specifique :</p>
<ul>
<li>Forfait cable dedie (depuis le compteur principal copro ou a titre individuel)</li>
<li>Infrastructure mutualisee (tableau commun, gestion badges, facturation individuelle)</li>
<li>Aide Advenir jusqu'a 960 EUR/point</li>
<li>Tickets moyens 2 000-4 500 EUR par appartement</li>
</ul>

<h2>Marques a connaitre</h2>

<ul>
<li><strong>Schneider EVlink</strong> : leader francais, gamme large, SAV</li>
<li><strong>Legrand Green'Up Premium</strong> : integration domotique</li>
<li><strong>Hager Witty</strong> : rapport qualite-prix, install simple</li>
<li><strong>Wallbox Pulsar Plus</strong> : design, app mobile</li>
<li><strong>ABB Terra AC</strong> : haut de gamme, fiabilite industrielle</li>
<li><strong>ZE Charge, Sowatt</strong> : solutions low-cost</li>
</ul>

<h2>Modele economique du SAV</h2>
<p>Les bornes ont une durabilite de 10-15 ans mais avec les montees en version firmware, les changements de cable, les problemes d'application, elles generent un recurrent :</p>
<ul>
<li>Contrat d'entretien annuel : 80-150 EUR/borne</li>
<li>Depannage sur site : 120-200 EUR/intervention</li>
<li>Remplacement module cable : 250-400 EUR</li>
</ul>

<p>Base installee de 100 bornes = CA recurrent 8-15 kEUR/an.</p>

<h2>En resume</h2>
<ul>
<li>Marche 650 000 bornes/an en 2026, ticket 1 200-3 000 EUR TTC.</li>
<li>Borne 7 kW = choix dominant, marge artisan 20-25 %.</li>
<li>Qualifelec IRVE obligatoire des 3,7 kW.</li>
<li>Credit impot 75 % jusqu'a 500 EUR + Advenir copro + TVA 5,5 %.</li>
<li>Differential 30 mA type A + cable adapte + declaration Enedis = incontournables.</li>
<li>Copropriete = marche sous-exploite, marges plus larges.</li>
</ul>
"""

a = render(
    slug="bornes-recharge-ve-installation-artisan-btp-2026",
    title="Bornes de recharge VE 2026 : installation, aides, Qualifelec IRVE — guide artisan",
    meta_desc="Bornes recharge VE : marche 650 000 installations 2026. Chiffrage 7 kW, credit impot 75 %, Qualifelec IRVE obligatoire, 5 erreurs techniques, marches copropriete Advenir.",
    keywords="borne recharge VE, Qualifelec IRVE, installation wallbox, credit impot borne VE, Advenir copropriete",
    h1="Bornes de recharge VE 2026 : installation et aides",
    read_min=8,
    summary_items=[
        "Les 3 types de bornes (prise renforcee, 7 kW, 22 kW)",
        "Chiffrage detaille : 1 273 EUR TTC, marge 25 %",
        "Aides 2026 : credit impot 75 %, Advenir copro, TVA 5,5 %",
        "Les 5 erreurs techniques a eviter",
        "Marche specifique copropriete et droit a la prise",
    ],
    body_html=a_body,
    related=[
        ("/blog-pro/energies-renouvelables-secteur-croissance-btp.html", "Energies renouvelables : secteur en croissance"),
        ("/blog-pro/qualibat-qualifelec-qualigaz-guide-qualifications-btp-2026.html", "Qualibat, Qualifelec, Qualigaz"),
    ],
)
with open(os.path.join(OUT, "bornes-recharge-ve-installation-artisan-btp-2026.html"), "w") as f:
    f.write(a)


# ============ ARTICLE 18 : GESTION CHANTIER ============
a_body = """
<p>Un artisan passe en moyenne <strong>9 heures par semaine</strong> a gerer l'administratif de ses chantiers : planning, commandes, releves, pointages, reclamations. C'est <strong>18 % du temps utile</strong>. Les bons outils et les bons reflexes font tomber ca a 4-5h/semaine. Soit <strong>l'equivalent d'un demi-jour par semaine a facturer en plus</strong>.</p>

<p>Ce guide donne les methodes concretes de pilotage chantier qui marchent pour TPE et PME du batiment.</p>

<h2>Les 5 phases d'un chantier bien pilote</h2>

<h3>1. Planification amont (5-10 jours avant debut)</h3>
<ul>
<li>Devis detaille signe client</li>
<li>Commande materiel avec delais confirmes</li>
<li>Convocation equipes sur planning</li>
<li>Protection abords, bennes, echafaudages commandes</li>
<li>Dossier administratif : DP, DC, DT-DICT (si VRD)</li>
</ul>

<h3>2. Demarrage (jour J)</h3>
<ul>
<li>Etat des lieux avec photos horodatees</li>
<li>Installation chantier : cloture, sanitaires, stockage materiel</li>
<li>Point securite avec l'equipe (EPI, risques specifiques)</li>
<li>Confirmation du planning avec client</li>
</ul>

<h3>3. Execution</h3>
<ul>
<li>Pointage journalier (heures ouvertes, qui a fait quoi)</li>
<li>Reunion de chantier hebdo avec client (15 min, photos, avancement)</li>
<li>Releve des avenants (modifications client)</li>
<li>Validation des livraisons fournisseurs</li>
</ul>

<h3>4. Reception</h3>
<ul>
<li>PV de reception signe par client (avec ou sans reserves)</li>
<li>Documents remis : DOE simplifie, factures de garantie, notices</li>
<li>Leve des reserves sous 3 mois max</li>
<li>Facture solde</li>
</ul>

<h3>5. SAV</h3>
<ul>
<li>Garantie parfait achevement : 1 an</li>
<li>Garantie biennale : 2 ans (equipements dissociables)</li>
<li>Decennale : 10 ans (solidite et destination)</li>
<li>Rappel automatique client 6 mois / 2 ans (fidelisation)</li>
</ul>

<h2>Outils d'organisation</h2>

<h3>Planning visuel</h3>
<ul>
<li><strong>Tableau blanc physique</strong> dans l'atelier : 50-100 EUR, marche bien si TPE &lt; 3 ouvriers</li>
<li><strong>Google Calendar + Sheets</strong> : gratuit, partage equipe, suffisant TPE</li>
<li><strong>Trello, Notion</strong> : kanban par chantier, gratuit en base</li>
<li><strong>Asana, Monday</strong> : pilotage multi-projets, 10-20 EUR/user/mois</li>
</ul>

<h3>Pointage des heures</h3>
<ul>
<li><strong>Feuille papier</strong> + saisie Excel : 0 cout, 5 min/ouvrier/jour</li>
<li><strong>Staffelio, Timmi</strong> : pointage sur smartphone, 6-12 EUR/user/mois</li>
<li><strong>Skello, Combo</strong> : generalistes, bon pour 5+ salaries</li>
</ul>

<h3>Suivi chantier specifique BTP</h3>
<ul>
<li><strong>Tolteck</strong> : devis + suivi + facturation, 29 EUR/mois</li>
<li><strong>Batimax, Batiscript</strong> : dedie BTP avec attachments</li>
<li><strong>Onaya BTP, Labosoft</strong> : ERP batiment pour PME</li>
<li><strong>PlanRadar, Fieldwire</strong> : suivi mobile (photos, pins sur plan)</li>
</ul>

<h2>Check-list visite chantier (15 min)</h2>

<ol>
<li>Photos d'avancement (minimum 10 par visite)</li>
<li>Conformite aux plans / devis</li>
<li>Securite (EPI, balisage, signalisation)</li>
<li>Proprete / range (impact sur relation client)</li>
<li>Point avec chef d'equipe (avance, retards, besoins)</li>
<li>Verification qualite (finitions, tolerances)</li>
<li>Avenants client a valider / signer</li>
<li>Commandes materiel restants</li>
</ol>

<h2>Gestion des livraisons materiel</h2>

<p>80 % des retards chantier proviennent de problemes de livraison :</p>
<ul>
<li>Articles manquants</li>
<li>Mauvaises references</li>
<li>Materiel endommage non controle a reception</li>
<li>Delais fournisseur non respectes</li>
</ul>

<p>Bonnes pratiques :</p>
<ul>
<li>Commande avec BL detaille a valider des reception</li>
<li>Stock tampon pour consommables critiques (pattes, vis, cables)</li>
<li>Fournisseurs secondaires identifies pour urgences</li>
<li>Suivi commandes dans un tableau dedie (date commande / prevue / recue)</li>
</ul>

<h2>Les 5 pieges organisationnels</h2>

<h3>1. Ne pas planifier les avenants</h3>
<p>Client qui demande &laquo; juste une petite chose en plus &raquo; = 2h perdues non facturees. Regle : tout avenant ecrit, signe, avant execution.</p>

<h3>2. Reunion de chantier non tenue</h3>
<p>Chantier &gt; 2 semaines sans point client formel = malentendu garanti. 15 min/semaine suffit.</p>

<h3>3. Sous-estimer les temps morts</h3>
<p>Trajets, pauses, attentes livraison, conditions meteo : prevoir 15-25 % de temps mort dans le chiffrage initial. Pas 0 %.</p>

<h3>4. Pas de documentation photographique</h3>
<p>En cas de litige, les photos horodatees font foi. Minimum : avant chantier, etapes cles, reception.</p>

<h3>5. Facturation decalee</h3>
<p>Facturer 1 mois apres fin de chantier = 1 mois de tresorerie perdue + risque impaye. Facturer le solde le jour de la reception.</p>

<h2>KPI a suivre chaque mois</h2>

<table><thead><tr><th>KPI</th><th>Objectif</th></tr></thead><tbody>
<tr><td>Respect du planning (delai prevu / realise)</td><td>&ge; 90 %</td></tr>
<tr><td>Respect du budget (cout prevu / realise)</td><td>&ge; 95 %</td></tr>
<tr><td>Taux de reception au 1er essai</td><td>&ge; 80 %</td></tr>
<tr><td>Taux d'avenants signes vs executes</td><td>100 %</td></tr>
<tr><td>Delai de facturation (fin chantier / date facture)</td><td>&le; 5 jours</td></tr>
<tr><td>Delai de paiement client</td><td>&le; 30 jours</td></tr>
</tbody></table>

<h2>En resume</h2>
<ul>
<li>Planification amont + reunion hebdo client = -30 % de litiges et retards.</li>
<li>Outil de pointage digital (6-12 EUR/user/mois) = ROI immediat.</li>
<li>Photos horodatees obligatoires : protection en cas de litige.</li>
<li>Avenants = contrat ecrit systematique, pas d'oral.</li>
<li>Facturation solde le jour de la reception, pas apres.</li>
<li>Suivi mensuel des 6 KPI = pilotage de la rentabilite reelle.</li>
</ul>
"""

a = render(
    slug="gestion-chantier-pilotage-artisan-btp-2026",
    title="Gestion et pilotage de chantier en 2026 : methodes pour artisan BTP",
    meta_desc="Comment gagner 4-5h/semaine sur la gestion chantier : planning, pointage, reunion hebdo, KPI, outils (Tolteck, PlanRadar, Google Calendar). Guide artisan BTP.",
    keywords="gestion chantier BTP, pilotage chantier artisan, logiciel suivi chantier, planning chantier, pointage heures BTP",
    h1="Gestion de chantier en 2026 : methodes pour artisan",
    read_min=8,
    summary_items=[
        "Les 5 phases d'un chantier bien pilote",
        "Outils de pointage, planning, suivi (de gratuit a 30 EUR/mois)",
        "Check-list visite chantier en 15 min",
        "Les 5 pieges organisationnels a eviter",
        "6 KPI a suivre chaque mois pour piloter la rentabilite",
    ],
    body_html=a_body,
    related=[
        ("/blog-pro/impayes-chantier-recouvrement-artisan-2026.html", "Impayes chantier : procedure complete"),
        ("/blog-pro/repondre-marches-publics-btp-artisan.html", "Repondre aux marches publics"),
    ],
)
with open(os.path.join(OUT, "gestion-chantier-pilotage-artisan-btp-2026.html"), "w") as f:
    f.write(a)


# ============ ARTICLE 19 : LOGICIELS GESTION BTP ============
a_body = """
<p>Le marche des logiciels de gestion pour artisans BTP a explose entre 2022 et 2026 : de 8 acteurs majeurs a <strong>plus de 40 solutions</strong> actives. Difficile de s'y retrouver. Trop cher = gaspillage. Trop leger = vous perdez 1h/jour. Mal choisi = vous changez dans 6 mois.</p>

<p>Ce guide compare les logiciels en 2026 par segment (solo, TPE, PME), par fonction (devis, facturation, comptabilite, chantier), et donne les criteres de selection.</p>

<h2>La carte des segments</h2>

<table><thead><tr><th>Profil</th><th>Solution recommandee</th><th>Budget mensuel</th></tr></thead><tbody>
<tr><td>Micro-entrepreneur solo</td><td>Facture.net, Abby, Tiime Start</td><td>0-20 EUR</td></tr>
<tr><td>TPE 1-5 salaries</td><td>Tolteck, Chantier.io, Evoliz</td><td>30-80 EUR</td></tr>
<tr><td>TPE/PME specialisee BTP</td><td>Batappli, Batimax, Proginov</td><td>80-250 EUR</td></tr>
<tr><td>PME &gt; 10 salaries</td><td>Onaya, Codial, Sage Batiment</td><td>250-700 EUR</td></tr>
<tr><td>Gros chantiers / multi-sites</td><td>Obat, Eveco, Oracle Primavera</td><td>700-2 500 EUR</td></tr>
</tbody></table>

<h2>Les fonctions attendues en 2026</h2>

<h3>Devis et facturation</h3>
<ul>
<li>Bibliotheque articles pre-renseignee (prix materiaux, main d'oeuvre)</li>
<li>Calcul automatique TVA (5,5 / 10 / 20 %) + attestation Cerfa</li>
<li>Signature electronique integree (Yousign, DocuSign)</li>
<li>Relance automatique des devis non signes</li>
<li>Generation facture Factur-X compatible 2026</li>
</ul>

<h3>Suivi chantier</h3>
<ul>
<li>Planning Gantt ou vue calendrier</li>
<li>Pointage mobile des heures par ouvrier</li>
<li>Photos horodatees avec geolocalisation</li>
<li>Gestion des avenants et reserves</li>
</ul>

<h3>Facturation et comptabilite</h3>
<ul>
<li>Export expert-comptable (FEC)</li>
<li>Relance automatique factures</li>
<li>Rapprochement bancaire</li>
<li>Tableau de bord marges, tresorerie</li>
</ul>

<h3>CRM client</h3>
<ul>
<li>Historique interactions (appels, mails, devis)</li>
<li>Segmentation clients (particuliers, syndics, entreprises)</li>
<li>Relance SAV annuelle</li>
</ul>

<h2>Comparatif detaille des 6 solutions phares</h2>

<h3>Tolteck</h3>
<ul>
<li><strong>Points forts :</strong> ergonomique, focus artisan solo-TPE, devis jusqu'a facture en 5 min, app mobile</li>
<li><strong>Limite :</strong> comptabilite limitee, pas de gestion stock avancee</li>
<li><strong>Prix :</strong> 29 EUR/mois (Solo), 49 EUR/mois (Pro), 99 EUR/mois (Premium)</li>
<li><strong>Ideal pour :</strong> TPE 1-5 salaries qui veulent devis/facture pro</li>
</ul>

<h3>Batappli</h3>
<ul>
<li><strong>Points forts :</strong> specialise BTP, bibliotheque articles pre-construite, Batichiffrage integre</li>
<li><strong>Limite :</strong> interface datee, courbe d'apprentissage</li>
<li><strong>Prix :</strong> a partir de 59 EUR/mois/user</li>
<li><strong>Ideal pour :</strong> PME BTP qui font beaucoup de devis detailles</li>
</ul>

<h3>Evoliz</h3>
<ul>
<li><strong>Points forts :</strong> generaliste, interface moderne, tarif abordable, export comptable</li>
<li><strong>Limite :</strong> pas de gestion chantier specifique</li>
<li><strong>Prix :</strong> 24 EUR/mois (Pro), 39 EUR/mois (Expert)</li>
<li><strong>Ideal pour :</strong> solos et TPE polyvalents, pas 100 % BTP</li>
</ul>

<h3>Chantier.io</h3>
<ul>
<li><strong>Points forts :</strong> focus chantier, photos, pointage mobile ouvriers, planning temps reel</li>
<li><strong>Limite :</strong> part devis/facture basique, complementaire d'un autre outil</li>
<li><strong>Prix :</strong> 35 EUR/mois (5 users), 75 EUR (illimite)</li>
<li><strong>Ideal pour :</strong> combiner avec Evoliz ou Tolteck pour le devis/facture</li>
</ul>

<h3>Onaya BTP</h3>
<ul>
<li><strong>Points forts :</strong> ERP complet BTP, bibliotheque Batichiffrage integree, multi-sites, modules sur mesure</li>
<li><strong>Limite :</strong> cher, formation necessaire, pas adapte TPE</li>
<li><strong>Prix :</strong> 200-700 EUR/mois selon modules</li>
<li><strong>Ideal pour :</strong> PME 10-50 salaries BTP qui veulent une solution unique</li>
</ul>

<h3>Obat</h3>
<ul>
<li><strong>Points forts :</strong> moderne, API ouverte, mobile first, integration Factur-X native</li>
<li><strong>Limite :</strong> recent (2023), ecosysteme en construction</li>
<li><strong>Prix :</strong> a partir de 89 EUR/mois</li>
<li><strong>Ideal pour :</strong> PME digitalisees qui veulent du SaaS recent et evolutif</li>
</ul>

<h2>Criteres de selection (dans l'ordre)</h2>

<ol>
<li><strong>Segment</strong> : TPE solo ne prend pas Onaya. PME 15 salaries ne prend pas Facture.net.</li>
<li><strong>Accompagnement</strong> : formation, SAV francais, hotline. Cher mais essentiel la 1re annee.</li>
<li><strong>Mobilite</strong> : app mobile pour saisir heures et photos sur chantier.</li>
<li><strong>Export comptable</strong> : FEC, compatibilite Sage/Cegid/Agiris.</li>
<li><strong>Factur-X et facture electronique 2026</strong> : indispensable en 2026.</li>
<li><strong>Integration SMS/email</strong> : relance automatique devis/factures.</li>
<li><strong>Essai gratuit 30 jours</strong> : toujours prendre, tester sur 3-5 chantiers reels.</li>
</ol>

<h2>Couts caches a anticiper</h2>
<ul>
<li><strong>Formation initiale</strong> : 500-2 500 EUR (finance OPCO)</li>
<li><strong>Migration donnees</strong> depuis ancien logiciel : 300-1 500 EUR</li>
<li><strong>Personnalisation</strong> (modeles devis, mentions) : 200-500 EUR</li>
<li><strong>Modules complementaires</strong> : signature electronique, ERP stocks</li>
<li><strong>Hotline / SAV</strong> : souvent facture en option</li>
</ul>

<h2>Erreurs a eviter</h2>

<h3>1. Choisir sur le tarif uniquement</h3>
<p>Economie de 20 EUR/mois = 240 EUR/an. Mais un outil mal adapte fait perdre 1h/jour = 5 kEUR/an.</p>

<h3>2. Migrer trop vite</h3>
<p>Ne jamais migrer en pleine periode forte. Attendre un creux (aout, fevrier) pour laisser temps d'apprentissage.</p>

<h3>3. Ne pas former l'equipe</h3>
<p>Logiciel puissant mais sous-utilise = ROI zero. Former minimum 1 journee chaque utilisateur.</p>

<h3>4. Garder le papier en parallele</h3>
<p>&laquo; Je double pour etre sur &raquo; = double temps, double erreurs. Choisir un outil, l'adopter, fermer le papier.</p>

<h2>Combien investir dans le digital ?</h2>

<p>Regle empirique : <strong>1 a 2,5 % du CA en logiciels et digital</strong> pour un artisan BTP bien outille.</p>
<ul>
<li>CA 60 kEUR : 50-125 EUR/mois</li>
<li>CA 150 kEUR : 130-300 EUR/mois</li>
<li>CA 500 kEUR : 400-1000 EUR/mois</li>
</ul>

<p>En dessous : vous perdez du temps. Au-dessus : vous investissez dans des fonctionnalites non utiles.</p>

<h2>En resume</h2>
<ul>
<li>Solo / micro : Facture.net ou Tolteck Solo (0-30 EUR/mois).</li>
<li>TPE 1-5 salaries : Tolteck Pro ou Evoliz (30-80 EUR).</li>
<li>PME BTP : Batappli, Onaya, Obat (80-700 EUR).</li>
<li>Toujours verifier : Factur-X compatible 2026, app mobile, export FEC.</li>
<li>Investir 1-2,5 % du CA en outils digitaux : ROI immediat.</li>
</ul>
"""

a = render(
    slug="logiciels-gestion-btp-comparatif-artisan-2026",
    title="Logiciels gestion BTP 2026 : quel outil choisir selon votre profil",
    meta_desc="Comparatif des logiciels de gestion BTP en 2026 : Tolteck, Batappli, Evoliz, Onaya, Obat. Prix, fonctions, criteres de choix pour artisan solo, TPE ou PME.",
    keywords="logiciel gestion BTP, Tolteck avis, Batappli prix, Evoliz artisan, ERP batiment, logiciel devis facture BTP",
    h1="Logiciels gestion BTP 2026 : comparatif par profil",
    read_min=9,
    summary_items=[
        "La carte des segments : quel outil pour quel profil",
        "Les fonctions essentielles en 2026 (Factur-X, signature, mobile)",
        "Comparatif detaille de 6 logiciels phares (prix, forces, limites)",
        "7 criteres de selection par ordre d'importance",
        "Couts caches et erreurs a eviter en migration",
    ],
    body_html=a_body,
    related=[
        ("/blog-pro/facture-electronique-obligatoire-artisan-btp-2026.html", "Facture electronique obligatoire"),
        ("/blog-pro/gestion-chantier-pilotage-artisan-btp-2026.html", "Gestion de chantier en 2026"),
    ],
)
with open(os.path.join(OUT, "logiciels-gestion-btp-comparatif-artisan-2026.html"), "w") as f:
    f.write(a)


# ============ ARTICLE 20 : RESEAUX SOCIAUX POUR ARTISAN ============
a_body = """
<p>65 % des particuliers qui cherchent un artisan le trouvent sur Google. Mais 23 % le trouvent via les reseaux sociaux (Instagram, Facebook, TikTok), et c'est un segment en croissance rapide. Pour un artisan, les reseaux sociaux servent 3 choses : <strong>credibilite visuelle</strong>, <strong>bouche-a-oreille digital</strong>, <strong>acquisition gratuite de leads locaux</strong>.</p>

<p>Ce guide donne la strategie concrete pour chaque reseau, avec des exemples et un calendrier realiste de 30 min/jour.</p>

<h2>Les 4 reseaux utiles pour un artisan BTP</h2>

<table><thead><tr><th>Reseau</th><th>Audience type</th><th>Format fort</th><th>Effort/j</th></tr></thead><tbody>
<tr><td><strong>Instagram</strong></td><td>25-55 ans, particuliers renovation</td><td>Photo avant/apres + Reels</td><td>10 min</td></tr>
<tr><td><strong>Facebook</strong></td><td>35-65 ans, locaux, groupes</td><td>Post + Groupes communautes</td><td>5 min</td></tr>
<tr><td><strong>TikTok</strong></td><td>20-40 ans, viralite</td><td>Videos courtes techniques</td><td>15 min</td></tr>
<tr><td><strong>LinkedIn</strong></td><td>Pro BTP, syndics, promoteurs</td><td>Post long + photos chantier</td><td>5 min</td></tr>
</tbody></table>

<p>Pour commencer : <strong>Instagram + Facebook</strong>. TikTok et LinkedIn en 2e temps.</p>

<h2>Instagram : le reseau n&deg;1 pour artisan en 2026</h2>

<h3>Quoi poster</h3>
<ul>
<li><strong>Avant / apres</strong> (la mine d'or) : meme cadrage, transformation visible</li>
<li>Processus : video acceleree x4-x8 d'une pose</li>
<li>Portrait equipe (humanisation)</li>
<li>Explication technique en story (courte, 15-30 sec)</li>
<li>Temoignage client (photo + 2-3 phrases)</li>
<li>Citations devant chantier livre</li>
</ul>

<h3>Hashtags locaux efficaces</h3>
<p>Combinaison 1 large + 3-5 locaux + 2-3 metier :</p>
<ul>
<li>#artisan #batiment #renovation (larges, 1 par post)</li>
<li>#paris #parisien #ile-de-france #paris15 (locaux, 3-5)</li>
<li>#plombier #chauffagiste #renovationenergetique (metier)</li>
</ul>

<h3>Frequence</h3>
<ul>
<li><strong>Mini :</strong> 3 posts / semaine + 1 story / jour</li>
<li><strong>Ideal :</strong> 1 post / jour + 2-3 stories / jour + 1 Reel / semaine</li>
</ul>

<h3>Optimisation bio Instagram</h3>
<ul>
<li>Nom : &laquo; Plombier Paris 15 - Jean Dupont &raquo; (inclure metier + zone)</li>
<li>Bio : 3 lignes claires (specialites, zone, CTA)</li>
<li>Lien : Linktree ou directement site</li>
<li>CTA contact : appel, mail, WhatsApp boutons actifs</li>
</ul>

<h2>Facebook : les groupes locaux valent de l'or</h2>

<p>Sur Facebook, les Pages Pro ont une visibilite organique ridicule (3-8 %). Mais les <strong>groupes locaux</strong> (ex : &laquo; Entraide et bons plans Paris 15 &raquo;, &laquo; Habitants de Bordeaux &raquo;) ont des taux d'engagement enormes.</p>

<h3>Strategie Facebook 2026</h3>
<ul>
<li>Rejoindre 10-15 groupes locaux de votre zone d'intervention</li>
<li>Participer aux discussions sans spam (conseils gratuits)</li>
<li>Repondre aux demandes &laquo; je cherche un artisan &raquo; (tres frequentes)</li>
<li>Page Pro pour credibilite (liens depuis Google, profil)</li>
<li>Partage ponctuel d'avant-apres sur la Page</li>
</ul>

<h3>Annonces Facebook Ads pour artisan</h3>
<p>Tres efficace pour generer des leads locaux :</p>
<ul>
<li>Budget 5-20 EUR/jour</li>
<li>Ciblage geographique (rayon 15 km)</li>
<li>Ciblage demographique (proprietaires, 40-65 ans)</li>
<li>Format : video avant/apres + formulaire contact Facebook natif</li>
<li>ROI moyen : 1 devis 3-7 EUR, 1 chantier 50-150 EUR de pub</li>
</ul>

<h2>TikTok : explosion sur creneau artisan en 2026</h2>

<p>Contrairement aux idees recues, TikTok marche tres bien pour les artisans. Contenu apprecie :</p>
<ul>
<li><strong>Astuces techniques</strong> (&laquo; Comment poser un WC en 30 secondes &raquo;)</li>
<li><strong>Astuces clients</strong> (&laquo; 3 choses a verifier avant de signer un devis &raquo;)</li>
<li><strong>Chantiers satisfaisants</strong> (poses visuelles accelerees)</li>
<li><strong>Ratage drole</strong> (autoderision, bug de chantier)</li>
</ul>

<h3>Structure d'une video TikTok qui marche</h3>
<ol>
<li>Hook des 3 premieres secondes (question, interrogation, &laquo; tu vas pas en croire tes yeux &raquo;)</li>
<li>Livraison utilite ou surprise (avant/apres, technique, blague)</li>
<li>Conclusion concrete + call to action (&laquo; suivez-moi pour plus d'astuces &raquo;)</li>
</ol>

<p>Viralite potentielle : 1 video sur 50-100 peut atteindre 50 000-500 000 vues. Effet cumule enorme.</p>

<h2>LinkedIn : pour le BTP pro</h2>

<p>LinkedIn marche si vous ciblez des syndics, promoteurs, architectes, bailleurs sociaux. Pas pour le B2C particulier.</p>

<h3>Quoi poster sur LinkedIn</h3>
<ul>
<li>Chantiers tertiaires livres</li>
<li>Point technique sur une reglementation</li>
<li>Temoignage d'un syndic ou gestionnaire client</li>
<li>Reflexion marche (secteur, aides, evolutions)</li>
</ul>

<h2>Calendrier 30 min/jour</h2>

<table><thead><tr><th>Jour</th><th>Action</th><th>Temps</th></tr></thead><tbody>
<tr><td>Lundi</td><td>Photo avant/apres Insta + Facebook Page + LinkedIn</td><td>15 min</td></tr>
<tr><td>Mardi</td><td>Story technique Insta + 1 video TikTok</td><td>20 min</td></tr>
<tr><td>Mercredi</td><td>Reponses dans 3 groupes Facebook locaux</td><td>15 min</td></tr>
<tr><td>Jeudi</td><td>Reel Instagram + LinkedIn</td><td>25 min</td></tr>
<tr><td>Vendredi</td><td>Story temoignage client Insta + post FB</td><td>15 min</td></tr>
<tr><td>Weekend</td><td>Prise de photos/videos sur chantier en cours</td><td>5 min/jour</td></tr>
</tbody></table>

<h2>Outils gratuits pour creer du contenu</h2>
<ul>
<li><strong>Canva</strong> (gratuit) : templates reseaux sociaux, retouche, carrousels</li>
<li><strong>CapCut</strong> (gratuit) : montage video pour Reels et TikTok</li>
<li><strong>Unfold</strong> : templates stories Instagram</li>
<li><strong>Later, Buffer</strong> : planification multi-reseaux (gratuit jusqu'a 10 posts/mois)</li>
</ul>

<h2>Les 5 erreurs a eviter</h2>

<h3>1. Mettre que des photos de chantier</h3>
<p>Le public veut aussi vous voir, vous et votre equipe. 70 % chantiers / 30 % humain.</p>

<h3>2. Ne pas repondre aux messages</h3>
<p>Un DM Instagram ou Messenger sans reponse = client perdu et effet nefaste (&laquo; il ne repond meme pas &raquo;).</p>

<h3>3. Spammer les groupes avec des pubs</h3>
<p>&laquo; Plombier pas cher 06.XX.XX.XX.XX &raquo; copie-colle = ban du groupe. Apporter de la valeur d'abord.</p>

<h3>4. Ne pas jamais varier les formats</h3>
<p>Seules photos statiques = algorithm freine. Melanger photo + video + carrousel + story.</p>

<h3>5. Viser le national</h3>
<p>Vous etes local. Parlez local. Un artisan de Bordeaux n'a aucun interet a avoir 100k abonnes a Paris ou Lyon.</p>

<h2>ROI realiste en 6 mois</h2>

<p>Effort : 30 min/jour, 5 jours/semaine = 10-12h/mois.</p>

<ul>
<li><strong>Mois 1-3 :</strong> construction audience, 200-500 abonnes Insta, 2-5 leads/mois</li>
<li><strong>Mois 4-6 :</strong> 800-2 500 abonnes, 6-15 leads/mois</li>
<li><strong>Mois 12 :</strong> 2 000-8 000 abonnes, 12-35 leads/mois</li>
</ul>

<p>Valeur : 1 lead qualifie = 80-300 EUR. Investissement temps recupere des le mois 3.</p>

<h2>En resume</h2>
<ul>
<li>Instagram + Facebook = combo de base. TikTok/LinkedIn en 2e temps.</li>
<li>30 min/jour suffisent. Rituel 5 jours/semaine.</li>
<li>Format gagnant : avant/apres + stories + Reels.</li>
<li>Hashtags locaux 3-5 + metier 2-3 + large 1.</li>
<li>Outils gratuits : Canva, CapCut, Later pour planifier.</li>
<li>ROI : 12-35 leads/mois apres 12 mois de pratique reguliere.</li>
</ul>
"""

a = render(
    slug="reseaux-sociaux-artisan-btp-strategie-2026",
    title="Reseaux sociaux pour artisan BTP 2026 : Instagram, Facebook, TikTok, LinkedIn",
    meta_desc="Instagram, Facebook, TikTok, LinkedIn : la strategie concrete pour artisan BTP 2026. 30 min/jour, hashtags locaux, Reels, groupes Facebook. 12-35 leads/mois apres 1 an.",
    keywords="Instagram artisan BTP, Facebook groupes locaux artisan, TikTok batiment, LinkedIn artisan, contenu reseaux sociaux BTP",
    h1="Reseaux sociaux pour artisan BTP : strategie 2026",
    read_min=9,
    summary_items=[
        "Les 4 reseaux utiles et pour quel objectif",
        "Instagram : formats gagnants, hashtags locaux, bio optimisee",
        "Facebook : puissance des groupes locaux + strategie Ads",
        "TikTok 2026 : pourquoi c'est devenu incontournable",
        "Calendrier 30 min/jour et ROI realiste en 12 mois",
    ],
    body_html=a_body,
    related=[
        ("/blog-pro/google-business-profile-artisan-seo-local.html", "SEO local : top 3 Google Maps"),
        ("/blog-pro/nouvelles-attentes-clients-btp-2026.html", "Les nouvelles attentes des clients BTP"),
    ],
)
with open(os.path.join(OUT, "reseaux-sociaux-artisan-btp-strategie-2026.html"), "w") as f:
    f.write(a)


print("Batch 4 : 5 articles generes.")
for slug in ["photovoltaique-installation-artisan-btp-2026", "bornes-recharge-ve-installation-artisan-btp-2026",
             "gestion-chantier-pilotage-artisan-btp-2026", "logiciels-gestion-btp-comparatif-artisan-2026",
             "reseaux-sociaux-artisan-btp-strategie-2026"]:
    print(f"- {slug}.html")

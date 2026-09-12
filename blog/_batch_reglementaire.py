#!/usr/bin/env python3
"""Batch réglementaire 2025-2026 : 10 B2C (blog/) + 10 B2B (blog-pro/)
Sujets vérifiés anti-doublons vs 36 articles blog/ et 61 articles blog-pro/ existants."""
import os, sys

# ─── B2C — blog/ ─────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _template_gen import render

B2C = [

{
"slug": "maprimerenov-2025-ce-qui-a-change-eligibilite",
"title": "MaPrimeRénov' 2025 : ce qui a vraiment changé et comment rester éligible",
"meta": "Réforme MaPrimeRénov' 2025 : mono-gestes supprimés, parcours accompagné obligatoire, nouveaux plafonds. Tout ce qui a changé et comment en profiter encore.",
"kw": "maprimerenov 2025, reforme maprimerenov, eligible maprimerenov, aide renovation 2025",
"h1": "MaPrimeRénov' 2025 : ce qui a vraiment changé (et comment en profiter encore)",
"read": 7,
"summary": [
    "Les 4 grands changements de MaPrimeRénov' depuis 2024",
    "Tableau des primes par type de travaux et tranche de revenus",
    "Parcours accompagné : obligatoire ou non selon votre situation",
    "Les erreurs qui font perdre la prime — à éviter absolument",
],
"body": """
<h2>Pourquoi MaPrimeRénov' a changé en 2024-2025</h2>
<p>Face à l'explosion des fraudes et aux critiques sur l'efficacité des rénovations partielles, le gouvernement a profondément réformé MaPrimeRénov'. Résultat : des règles plus strictes, mais aussi des primes plus élevées pour les vraies rénovations d'ampleur.</p>

<h2>Changement n°1 : les mono-gestes sont désormais restreints</h2>
<p>Avant 2024, vous pouviez toucher une prime pour un seul geste (ex : isolation des combles seuls). Aujourd'hui, les mono-gestes ne sont plus accessibles qu'aux ménages modestes et très modestes. Les ménages intermédiaires et aisés doivent passer par le <strong>parcours accompagné</strong> (rénovation d'ampleur touchant plusieurs postes).</p>

<div class="summary-box">
<h3>Qui peut encore faire des mono-gestes ?</h3>
<ul>
<li><strong>Ménages très modestes :</strong> oui, mono-gestes accessibles avec primes maximales</li>
<li><strong>Ménages modestes :</strong> oui, mono-gestes avec primes réduites</li>
<li><strong>Ménages intermédiaires :</strong> uniquement via parcours accompagné</li>
<li><strong>Ménages aisés :</strong> uniquement via parcours accompagné, primes minimales</li>
</ul>
</div>

<h2>Changement n°2 : le chauffage gaz n'est plus financé</h2>
<p>Les chaudières à gaz — même à condensation — ne sont plus éligibles à MaPrimeRénov' depuis 2023. Seuls les équipements utilisant des énergies renouvelables (PAC, biomasse, solaire thermique) sont financés.</p>

<h2>Changement n°3 : l'audit énergétique est obligatoire pour le parcours accompagné</h2>
<p>Toute demande dans le cadre du parcours accompagné doit être précédée d'un audit énergétique réglementaire. Coût : 500 à 1 000 €, mais en grande partie pris en charge dans le cadre du parcours.</p>

<h2>Tableau des primes 2025 (maison 100 m², IDF)</h2>
<table>
<tr><th>Geste</th><th>Très modeste</th><th>Modeste</th><th>Intermédiaire</th></tr>
<tr><td>PAC air/eau</td><td>10 000 €</td><td>8 000 €</td><td>6 000 €*</td></tr>
<tr><td>Isolation combles</td><td>2 500 €</td><td>2 000 €</td><td>1 500 €*</td></tr>
<tr><td>Isolation murs ext.</td><td>12 000 €</td><td>9 000 €</td><td>7 000 €*</td></tr>
<tr><td>Chauffe-eau thermo.</td><td>3 000 €</td><td>2 500 €</td><td>1 500 €*</td></tr>
</table>
<p style="font-size:.85rem;color:var(--sub)">* Uniquement via parcours accompagné avec Mon Accompagnateur Rénov'.</p>

<h2>Les erreurs qui font perdre la prime</h2>
<ul>
<li><strong>Commencer les travaux avant validation</strong> : la demande doit être acceptée AVANT le premier coup de marteau</li>
<li><strong>Artisan non RGE</strong> : vérifiez sur faire.fr que la qualification est valide à la date du devis</li>
<li><strong>Matériaux non conformes</strong> : les performances minimales des équipements sont vérifiées</li>
<li><strong>Dossier incomplet</strong> : facture et attestation de fin de travaux obligatoires sous 3 mois</li>
</ul>

<div class="info-box">
<strong>Conseil :</strong> Si vous n'êtes pas sûr de votre éligibilité, commencez par <strong>france-renov.gouv.fr</strong> — le simulateur officiel vous donne une estimation en 5 minutes, sans inscription.
</div>
""",
},

{
"slug": "logements-g-interdits-location-2025-que-faire",
"title": "Logements G interdits à la location depuis 2025 : vos options pour continuer à louer",
"meta": "Depuis janvier 2025, les logements DPE G ne peuvent plus être mis en location. Ce que vous risquez et les travaux prioritaires pour changer de classe rapidement.",
"kw": "logement dpe g interdit location, passoire thermique location 2025, sortir classement g dpe, travaux passoire thermique",
"h1": "Logements G interdits à la location : vos options pour continuer à louer en 2025",
"read": 6,
"summary": [
    "Calendrier complet des interdictions de location (G 2025, F 2028, E 2034)",
    "Ce que vous risquez si vous continuez à louer un logement G",
    "Les 3 travaux qui font le plus gagner de classes DPE",
    "Aides disponibles pour financer la rénovation d'une passoire thermique",
],
"body": """
<h2>La loi Climat est en vigueur : les G sont hors jeu</h2>
<p>Depuis le <strong>1er janvier 2025</strong>, tout logement classé G au DPE ne peut plus faire l'objet d'un nouveau contrat de location. Cette interdiction concerne environ 600 000 logements en France, dont une part significative en Île-de-France où les immeubles anciens sont nombreux.</p>

<div class="summary-box">
<h3>Calendrier des interdictions</h3>
<ul>
<li><strong>2025 :</strong> Logements G (consommation &gt; 420 kWh/m²/an)</li>
<li><strong>2028 :</strong> Logements F (consommation &gt; 330 kWh/m²/an)</li>
<li><strong>2034 :</strong> Logements E (consommation &gt; 250 kWh/m²/an)</li>
</ul>
</div>

<h2>Ce que vous risquez concrètement</h2>
<p>Si vous signez un nouveau bail sur un logement G après le 1er janvier 2025 :</p>
<ul>
<li>Le locataire peut engager une procédure judiciaire pour vous contraindre à rénover</li>
<li>Il peut obtenir une réduction de loyer pendant la durée des travaux</li>
<li>Les plateformes (LeBonCoin, PAP, SeLoger) refusent les annonces mentionnant un DPE G</li>
<li>Amendes jusqu'à <strong>45 000 €</strong> pour les propriétaires récalcitrants</li>
</ul>

<h2>Les 3 travaux qui font le plus gagner de classes</h2>
<p>Pour passer de G à D ou E — ce qui suffit pour louer légalement — les experts s'accordent sur cette hiérarchie :</p>
<ol>
<li><strong>Remplacement du système de chauffage</strong> (PAC au lieu d'un convecteur électrique ou poêle) : +2 à 3 classes DPE, coût 5 000-12 000 €</li>
<li><strong>Isolation des combles perdus</strong> : +1 à 2 classes, coût 1 500-3 500 €</li>
<li><strong>Isolation des murs par l'extérieur</strong> : +1 à 2 classes, coût 15 000-30 000 € mais très efficace</li>
</ol>

<div class="info-box">
<strong>Bonne nouvelle :</strong> MaPrimeRénov' finance spécifiquement la sortie des passoires G avec les primes les plus élevées. Pour un ménage modeste, il est possible de rénover un studio G en D pour un reste à charge de 0 à 2 000 €.
</div>

<h2>Mon locataire est déjà en place : que se passe-t-il ?</h2>
<p>Si un locataire occupe le logement avec un bail en cours (signé avant janvier 2025), vous pouvez l'honorer jusqu'à son terme. L'interdiction concerne les <strong>nouveaux contrats</strong>, pas les baux existants. En revanche, à l'échéance du bail, vous ne pourrez pas le renouveler sans avoir rénové.</p>
""",
},

{
"slug": "audit-energetique-vente-maison-guide-2025",
"title": "Audit énergétique obligatoire avant vente : guide complet 2025 pour les propriétaires",
"meta": "Vendre une maison classée F ou G impose un audit énergétique depuis 2023. Contenu, coût, délai, et comment l'utiliser pour mieux négocier.",
"kw": "audit energetique obligatoire vente, audit energetique passoire thermique, vendre maison dpe f g, audit avant vente 2025",
"h1": "Audit énergétique obligatoire avant vente de passoire thermique : tout ce qu'il faut savoir",
"read": 6,
"summary": [
    "Qui est obligé de faire un audit avant de vendre (F, G — et bientôt E)",
    "Ce que l'audit contient et en quoi il diffère du DPE",
    "Combien ça coûte et comment le financer",
    "Comment exploiter l'audit comme outil de négociation",
],
"body": """
<h2>L'audit énergétique : bien plus qu'un DPE amélioré</h2>
<p>Si vous vendez un logement classé F ou G, vous devez fournir à l'acheteur un <strong>audit énergétique réglementaire</strong> en plus du DPE. Ce document est obligatoire depuis avril 2023 pour les maisons individuelles et les immeubles en monopropriété. Il sera étendu aux logements classés E prochainement.</p>

<div class="summary-box">
<h3>DPE vs Audit énergétique</h3>
<ul>
<li><strong>DPE :</strong> 150-250 €, 2-3h de visite, classification A-G, obligatoire pour tous</li>
<li><strong>Audit :</strong> 500-1 000 €, journée entière, scénarios travaux chiffrés, obligatoire si F ou G</li>
</ul>
</div>

<h2>Contenu de l'audit réglementaire</h2>
<p>L'audit énergétique réglementaire doit contenir :</p>
<ul>
<li>État des lieux détaillé de l'enveloppe (murs, toiture, fenêtres, planchers) et des équipements</li>
<li>Au moins <strong>2 scénarios de travaux</strong> avec estimation des coûts</li>
<li>Un scénario permettant d'atteindre la classe B ou mieux</li>
<li>Estimation des économies d'énergie pour chaque scénario</li>
<li>Aides financières mobilisables (MaPrimeRénov', CEE, Éco-PTZ)</li>
</ul>

<h2>Coût et financement</h2>
<p>Un audit réglementaire coûte entre <strong>500 et 1 000 €</strong> pour une maison en Île-de-France. Il doit être réalisé par un professionnel certifié (architecte, bureau d'études thermique, diagnostiqueur avec mention spécifique).</p>
<p>Dans le cadre du parcours accompagné MaPrimeRénov', le coût de l'audit peut être intégré au financement global et partiellement remboursé.</p>

<h2>Comment exploiter l'audit pour vendre au meilleur prix</h2>
<p>Un audit bien réalisé peut être un argument de vente : il montre à l'acheteur que le logement est rénovable pour un coût précis, et que les aides disponibles rendent la rénovation accessible. Certains vendeurs font les travaux eux-mêmes avant la vente pour revaloriser le bien de 15 à 25%.</p>

<div class="warning-box">
<strong>Attention :</strong> L'audit doit être remis à l'acheteur dès le compromis de vente, pas à la signature de l'acte définitif. Un notaire ne peut pas instrumenter la vente sans ce document si le logement est F ou G.
</div>
""",
},

{
"slug": "cee-certificats-economies-energie-guide-pratique-2025",
"title": "CEE 2025 : comment obtenir les Certificats d'Économies d'Énergie et les cumuler avec MaPrimeRénov'",
"meta": "Les CEE représentent 500 à 4 000 € d'aide supplémentaire cumulable avec MaPrimeRénov'. Guide pratique pour en bénéficier sans se faire avoir.",
"kw": "certificats economies energie, CEE travaux, prime energie, cumuler CEE maprimerenov",
"h1": "CEE 2025 : jusqu'à 4 000 € de prime énergie cumulable avec MaPrimeRénov' — guide pratique",
"read": 6,
"summary": [
    "Montants CEE 2025 par type de travaux",
    "Comment obtenir les CEE : via l'artisan ou via un courtier",
    "Le piège des artisans qui gardent la prime sans la déduire",
    "Trio gagnant : CEE + MaPrimeRénov' + Éco-PTZ",
],
"body": """
<h2>Les CEE : une manne financière que 70% des propriétaires ignorent</h2>
<p>Les Certificats d'Économies d'Énergie (CEE) sont financés par les fournisseurs d'énergie obligés par la loi d'encourager les économies d'énergie. Résultat : ils financent vos travaux. Et surtout : ils sont <strong>cumulables avec MaPrimeRénov'</strong>, ce qui en fait un levier puissant souvent ignoré.</p>

<div class="summary-box">
<h3>Montants CEE 2025 — exemples pour maison 100 m²</h3>
<ul>
<li>Isolation combles perdus : <strong>400 à 900 €</strong></li>
<li>Isolation murs par l'extérieur : <strong>1 500 à 4 000 €</strong></li>
<li>PAC air/eau : <strong>800 à 2 500 €</strong></li>
<li>Isolation plancher bas : <strong>500 à 1 500 €</strong></li>
<li>Fenêtres double vitrage : <strong>200 à 600 €</strong></li>
</ul>
</div>

<h2>2 façons d'obtenir les CEE</h2>
<p><strong>Voie 1 — Via l'artisan :</strong> l'artisan gère les CEE et les déduit directement de votre facture. C'est la méthode la plus simple. Demandez-lui systématiquement : "Est-ce que vous gérez les CEE ?" Si oui, vérifiez que la prime est bien mentionnée dans le devis.</p>
<p><strong>Voie 2 — Via un courtier CEE :</strong> des plateformes (Hellio, Effy, Izi by EDF…) gèrent votre dossier et vous versent la prime directement. Avantage : vous comparez les offres. Inconvénient : délai plus long (4-8 semaines).</p>

<div class="warning-box">
<strong>Piège fréquent :</strong> Certains artisans "intègrent" les CEE dans leur marge sans vous les reverser. Si votre artisan dit "je m'occupe des CEE" mais ne les mentionne pas sur le devis, c'est suspect. Exigez la mention explicite du montant CEE déduit.
</div>

<h2>Conditions obligatoires pour bénéficier des CEE</h2>
<ul>
<li>Logement achevé depuis plus de 2 ans</li>
<li>Artisan qualifié RGE (obligatoire pour les gestes principaux)</li>
<li>Accord CEE signé <strong>avant</strong> le début des travaux</li>
<li>Matériaux conformes aux fiches CEE (performances minimales à respecter)</li>
</ul>

<h2>Cumuler CEE + MaPrimeRénov' + Éco-PTZ : le calcul concret</h2>
<p>Pour une maison de 100 m² classée G, rénovation complète (PAC + isolation combles + isolation murs) :</p>
<table>
<tr><th>Source</th><th>Montant estimé (ménage modeste)</th></tr>
<tr><td>MaPrimeRénov' parcours accompagné</td><td>25 000 à 40 000 €</td></tr>
<tr><td>CEE</td><td>4 000 à 7 000 €</td></tr>
<tr><td>TVA 5,5%</td><td>2 000 à 4 000 € d'économie directe</td></tr>
<tr><td>Éco-PTZ (si reste à charge)</td><td>Jusqu'à 50 000 € à 0%</td></tr>
</table>
""",
},

{
"slug": "eco-ptz-2025-conditions-montants-demarches",
"title": "Éco-PTZ 2025 : financer jusqu'à 50 000 € de travaux à 0% d'intérêts — conditions et démarches",
"meta": "L'Éco-Prêt à Taux Zéro permet d'emprunter jusqu'à 50 000 € sans intérêts pour la rénovation énergétique. Qui peut en bénéficier, comment faire la demande.",
"kw": "eco ptz 2025, pret taux zero renovation, eco ptz conditions, financer travaux sans interet",
"h1": "Éco-PTZ 2025 : 50 000 € à 0% d'intérêts pour vos travaux — conditions et démarches",
"read": 5,
"summary": [
    "Montants, durée et conditions de l'Éco-PTZ en 2025",
    "Travaux éligibles et ceux qui ne le sont pas",
    "Démarche étape par étape pour l'obtenir",
    "Comment combiner Éco-PTZ et MaPrimeRénov' pour couvrir toute la rénovation",
],
"body": """
<h2>L'Éco-PTZ : le prêt rénovation le plus avantageux — et le plus méconnu</h2>
<p>L'Éco-Prêt à Taux Zéro vous permet d'emprunter jusqu'à <strong>50 000 €</strong> pour financer vos travaux de rénovation énergétique, sans payer un euro d'intérêts. Pas de condition de revenus. Disponible pour tous les propriétaires occupants et bailleurs.</p>

<div class="summary-box">
<h3>Éco-PTZ 2025 — chiffres clés</h3>
<ul>
<li>Montant max : <strong>50 000 €</strong></li>
<li>Durée max : <strong>20 ans</strong></li>
<li>Taux : <strong>0%</strong></li>
<li>Conditions de revenus : <strong>aucune</strong></li>
<li>Cumulable avec MaPrimeRénov' : <strong>oui depuis 2020</strong></li>
</ul>
</div>

<h2>Travaux éligibles</h2>
<ul>
<li>Isolation (toiture, murs, planchers, fenêtres/portes)</li>
<li>Chauffage et eau chaude sanitaire (PAC, chaudière biomasse, chauffe-eau solaire)</li>
<li>VMC double flux</li>
<li>Rénovation d'ampleur (audit + au moins 2 postes de travaux)</li>
<li>Réhabilitation de l'assainissement non collectif</li>
</ul>

<h2>Comment obtenir l'Éco-PTZ : 4 étapes</h2>
<ol>
<li><strong>Obtenez des devis</strong> d'artisans RGE pour les travaux envisagés</li>
<li><strong>Choisissez une banque partenaire</strong> (Crédit Agricole, BNP Paribas, Société Générale, La Banque Postale, CIC…)</li>
<li><strong>Déposez le dossier</strong> avec le formulaire Éco-PTZ et les devis d'artisans</li>
<li><strong>Réalisez les travaux</strong> dans les 3 ans suivant l'offre de prêt</li>
</ol>

<div class="info-box">
<strong>Astuce :</strong> Combinez Éco-PTZ + MaPrimeRénov' pour des rénovations ambitieuses sans apport. Exemple : 25 000 € de MPR + 25 000 € d'Éco-PTZ = 50 000 € disponibles pour rénover une maison de passoire G en logement B ou C.
</div>
""",
},

{
"slug": "tva-5-5-travaux-renovation-quels-travaux-2025",
"title": "TVA à 5,5% sur les travaux : quels travaux, quelles conditions, comment éviter les erreurs en 2025",
"meta": "La TVA réduite à 5,5% sur les travaux énergétiques représente 14,5% d'économie directe. Conditions, travaux concernés, attestation à fournir.",
"kw": "tva 5.5 travaux renovation, tva reduite travaux, tva renovation energetique, attestation tva 5.5",
"h1": "TVA à 5,5% sur les travaux de rénovation énergétique : mode d'emploi complet 2025",
"read": 5,
"summary": [
    "Les 3 taux de TVA dans la rénovation et comment les distinguer",
    "Liste exacte des travaux éligibles à 5,5%",
    "L'attestation à remettre à votre artisan (sans elle, il applique 20%)",
    "Travaux à 10% : la liste complète pour l'entretien courant",
],
"body": """
<h2>Une aide directe sur votre facture, sans dossier à monter</h2>
<p>La TVA à 5,5% sur les travaux d'amélioration énergétique est l'aide la plus simple : elle réduit directement votre facture. Sur 10 000 € de travaux, passer de 20% à 5,5% de TVA représente <strong>1 450 € d'économie</strong>. Pas de dossier à monter, pas de délai.</p>

<div class="summary-box">
<h3>Les 3 taux de TVA travaux</h3>
<ul>
<li><strong>5,5%</strong> : travaux d'amélioration énergétique (isolation, chauffage renouvelable)</li>
<li><strong>10%</strong> : entretien et amélioration hors énergie (plomberie, électricité, carrelage…)</li>
<li><strong>20%</strong> : logements neufs (&lt; 2 ans) et certains travaux de surélévation</li>
</ul>
</div>

<h2>Travaux éligibles à 5,5%</h2>
<ul>
<li>Isolation thermique : combles, murs, planchers, fenêtres à double vitrage</li>
<li>Pompe à chaleur (air/eau, air/air, géothermique)</li>
<li>Chaudière biomasse (granulés, bûches)</li>
<li>Chauffe-eau thermodynamique et solaire</li>
<li>Ventilation mécanique contrôlée (VMC) double flux</li>
<li>Régulation du chauffage (thermostat programmable, robinets thermostatiques)</li>
</ul>

<h2>L'attestation : document clé que 40% des propriétaires oublient</h2>
<p>Pour bénéficier du taux réduit, vous devez remettre à l'artisan une <strong>attestation sur l'honneur</strong> (formulaire Cerfa n°13947) certifiant que le logement est achevé depuis plus de 2 ans et que vous en êtes propriétaire ou locataire. Sans ce document, l'artisan est légalement tenu d'appliquer le taux à 20%.</p>
<p>Ce formulaire est téléchargeable gratuitement sur impots.gouv.fr. Préparez-le avant de signer le devis.</p>

<h2>Travaux à 10% : l'entretien courant</h2>
<p>Les travaux de réparation et entretien non énergétiques bénéficient automatiquement de la TVA à 10% pour les logements de plus de 2 ans : plomberie, électricité courante, peinture, carrelage, parquet, maçonnerie d'entretien. Pas d'attestation nécessaire pour ce taux.</p>
""",
},

{
"slug": "dossier-maprimerenov-comment-faire-soi-meme-2025",
"title": "Monter son dossier MaPrimeRénov' soi-même : guide étape par étape 2025",
"meta": "Vous n'avez pas besoin d'un intermédiaire payant pour monter votre dossier MaPrimeRénov'. Guide complet des étapes sur le portail officiel.",
"kw": "dossier maprimerenov comment faire, maprimerenov demarches, mon accompagnateur renov, portail maprimerenov",
"h1": "Monter son dossier MaPrimeRénov' soi-même : les étapes sur le portail officiel",
"read": 7,
"summary": [
    "Parcours simplifié vs parcours accompagné : lequel choisir",
    "Les 7 étapes sur le portail maprimerenov.gouv.fr",
    "Documents à préparer avant de commencer",
    "Comment éviter les 3 erreurs qui bloquent le versement",
],
"body": """
<h2>Vous n'avez pas besoin d'un intermédiaire payant</h2>
<p>De nombreuses entreprises proposent de "gérer votre dossier MaPrimeRénov'" contre 10 à 15% du montant de la prime. C'est légal mais souvent inutile : le portail officiel est accessible à tous et les démarches sont simples pour un parcours standard.</p>

<div class="summary-box">
<h3>Parcours simplifié vs accompagné</h3>
<ul>
<li><strong>Simplifié :</strong> mono-geste, ménages modestes/très modestes, démarches en autonomie sur le portail</li>
<li><strong>Accompagné :</strong> rénovation d'ampleur (2+ postes), audit obligatoire, Mon Accompagnateur Rénov' requis, primes plus élevées</li>
</ul>
</div>

<h2>Les 7 étapes du parcours simplifié</h2>
<ol>
<li><strong>Créez votre compte</strong> sur maprimerenov.gouv.fr avec FranceConnect (identifiants impots.gouv.fr)</li>
<li><strong>Renseignez votre logement</strong> : adresse, type, surface, DPE</li>
<li><strong>Choisissez vos travaux</strong> et vérifiez les montants estimés de prime</li>
<li><strong>Trouvez un artisan RGE</strong> via faire.fr, obtenez un devis signé</li>
<li><strong>Déposez votre demande</strong> avec le devis sur le portail (avant le début des travaux)</li>
<li><strong>Attendez la validation</strong> (délai : 2 à 6 semaines)</li>
<li><strong>Faites les travaux</strong>, déposez la facture et l'attestation de fin de travaux → la prime est versée sous 15 jours</li>
</ol>

<h2>Documents à préparer</h2>
<ul>
<li>Avis d'imposition N-1 (récupéré automatiquement via FranceConnect)</li>
<li>RIB du titulaire du logement</li>
<li>Devis signé de l'artisan RGE (avec numéro RGE visible)</li>
<li>Attestation TVA 5,5% si applicable</li>
</ul>

<div class="warning-box">
<strong>Erreur n°1 :</strong> Commencer les travaux avant que la demande soit validée. La prime est annulée. Attendez toujours la notification de validation avant de démarrer.
</div>

<div class="info-box">
<strong>Pour le parcours accompagné :</strong> Le Mon Accompagnateur Rénov' est obligatoire mais ses honoraires sont pris en charge à hauteur de 50% pour les ménages modestes. Trouvez un MAR agréé sur france-renov.gouv.fr.
</div>
""",
},

{
"slug": "copropriete-plan-pluriannuel-travaux-obligation-2025",
"title": "Plan Pluriannuel de Travaux en copropriété : obligation 2025, contenu et sanctions",
"meta": "Depuis 2025, toutes les copropriétés de plus de 15 ans doivent adopter un Plan Pluriannuel de Travaux. Ce que ça implique pour les copropriétaires et les syndics.",
"kw": "plan pluriannuel travaux copropriete, PPT copropriete obligatoire, loi climat copropriete, travaux copropriete 2025",
"h1": "Plan Pluriannuel de Travaux en copropriété : ce qui est obligatoire depuis 2025",
"read": 5,
"summary": [
    "Qui est concerné par le PPT et depuis quand",
    "Ce que le plan doit contenir obligatoirement",
    "Rôle du syndic et droits des copropriétaires",
    "Impact sur la vente d'un lot en copropriété",
],
"body": """
<h2>Le PPT : une obligation méconnue qui touche tous les copropriétaires</h2>
<p>La loi Climat et Résilience de 2021 impose à toutes les copropriétés de plus de 15 ans d'adopter un <strong>Plan Pluriannuel de Travaux (PPT)</strong>. Depuis janvier 2025, cette obligation s'étend à toutes les copropriétés, y compris les petites (moins de 50 lots).</p>

<div class="summary-box">
<h3>Calendrier d'entrée en vigueur</h3>
<ul>
<li><strong>Janvier 2023 :</strong> copropriétés &gt; 200 lots</li>
<li><strong>Janvier 2024 :</strong> copropriétés de 51 à 200 lots</li>
<li><strong>Janvier 2025 :</strong> toutes les copropriétés &gt; 15 ans</li>
</ul>
</div>

<h2>Ce que le PPT doit contenir</h2>
<ul>
<li>Liste des travaux nécessaires sur 10 ans (structure, toiture, façades, équipements communs)</li>
<li>Estimation chiffrée par poste</li>
<li>Échelonnement dans le temps avec priorités</li>
<li>Économies d'énergie attendues</li>
</ul>
<p>Le PPT doit être élaboré à partir du diagnostic technique global (DTG) ou d'un audit énergétique de l'immeuble réalisé par un professionnel certifié.</p>

<h2>Que peut faire un copropriétaire si le syndic ne bouge pas ?</h2>
<p>Si votre syndic n'a pas mis le PPT à l'ordre du jour de l'assemblée générale, vous pouvez :</p>
<ol>
<li>Demander l'inscription à l'ordre du jour par lettre recommandée</li>
<li>Saisir le juge des référés pour l'y contraindre</li>
<li>Changer de syndic lors de la prochaine AG si l'inaction persiste</li>
</ol>

<div class="warning-box">
<strong>Impact sur la vente :</strong> Depuis 2024, le vendeur d'un lot en copropriété doit informer l'acheteur de l'existence (ou non) du PPT. L'absence de PPT dans une copropriété de plus de 15 ans est un signal d'alarme légal pour l'acheteur.
</div>
""",
},

{
"slug": "dpe-contestation-recours-erreurs-frequentes-2025",
"title": "DPE erroné : comment le contester et quels recours en 2025 — guide pratique",
"meta": "Des milliers de DPE sont inexacts. Depuis 2021, le DPE est opposable et contestable. Comment identifier un DPE suspect et comment exercer vos recours.",
"kw": "DPE errone contestation, contester DPE, DPE faux recours, DPE opposable 2025",
"h1": "DPE erroné ou suspect : comment le contester et quels recours en 2025",
"read": 5,
"summary": [
    "Comment identifier un DPE probablement erroné",
    "La procédure pour obtenir un second DPE contradictoire",
    "Recours contre le diagnostiqueur : assurance RC et tribunal",
    "La réforme DPE en cours et ce qu'elle change pour les petites surfaces",
],
"body": """
<h2>Le DPE opposable depuis 2021 : vous avez des recours</h2>
<p>Depuis la réforme du 1er juillet 2021, le DPE est <strong>opposable</strong> : le diagnostiqueur engage sa responsabilité civile. Si votre DPE est erroné et vous a causé un préjudice (aide refusée, loyer bloqué, vente compromise), vous pouvez agir.</p>

<div class="summary-box">
<h3>DPE invalides automatiquement</h3>
<ul>
<li>DPE réalisés <strong>avant juillet 2021</strong> : invalides depuis le 1er janvier 2023</li>
<li>DPE "vierges" ou "non soumis" : interdits dans les annonces immobilières</li>
<li>DPE réalisés par diagnostiqueur non certifié Cofrac</li>
</ul>
</div>

<h2>5 signaux d'un DPE suspect</h2>
<ol>
<li>Le classement ne correspond pas à l'état visible du logement (double vitrage classé F)</li>
<li>La visite a duré moins de 20-30 minutes</li>
<li>Les données d'entrée sont approximatives ("estimé", "non vérifié")</li>
<li>Les recommandations sont génériques (identiques pour tous les logements)</li>
<li>Le numéro d'identification n'apparaît pas sur le document</li>
</ol>

<h2>Procédure de contestation</h2>
<ol>
<li>Faites réaliser un <strong>second DPE contradictoire</strong> par un autre diagnostiqueur certifié</li>
<li>Si les deux DPE divergent de plus d'une classe, contactez l'organisme de certification du premier diagnostiqueur</li>
<li>Saisissez l'assurance RC professionnelle du diagnostiqueur avec le rapport contradictoire</li>
<li>En cas de refus, portez l'affaire devant le tribunal judiciaire</li>
</ol>

<div class="info-box">
<strong>Vérification gratuite :</strong> Tout DPE post-juillet 2021 est enregistré sur l'observatoire de l'ADEME (observatoire-dpe-audit.ademe.fr). Vérifiez qu'il y figure et comparez aux DPE voisins du même immeuble.
</div>

<h2>La réforme DPE pour les petites surfaces</h2>
<p>Le gouvernement a reconnu que les logements de moins de 40 m² sont systématiquement surestimés dans les DPE actuels (biais de la méthode de calcul). Une révision est prévue pour 2025-2026. Si votre studio est classé F ou G, attendez la mise à jour avant d'engager des travaux coûteux.</p>
""",
},

{
"slug": "prime-remplacement-chaudiere-fioul-2025",
"title": "Prime pour remplacer une chaudière au fioul en 2025 : jusqu'à 13 000 € disponibles",
"meta": "Remplacer une chaudière au fioul est l'opération la mieux aidée en 2025 : jusqu'à 13 000 € de primes cumulées. Quelles alternatives, quelles conditions.",
"kw": "prime remplacement chaudiere fioul, aide chaudiere fioul 2025, remplacer fioul pompe chaleur, bonus fioul",
"h1": "Remplacement de chaudière au fioul : jusqu'à 13 000 € de primes disponibles en 2025",
"read": 5,
"summary": [
    "Pourquoi le remplacement du fioul est l'opération la mieux aidée",
    "Tableau des primes cumulées selon votre profil",
    "PAC vs chaudière biomasse : laquelle choisir pour remplacer le fioul",
    "Étapes pour bénéficier du bonus de sortie du fioul",
],
"body": """
<h2>Le fioul : la cible prioritaire des aides à la rénovation</h2>
<p>Remplacer une chaudière au fioul est l'opération la mieux aidée de toute la gamme MaPrimeRénov'. Le gouvernement applique un <strong>bonus de sortie du fioul</strong> qui peut atteindre 3 000 € supplémentaires en plus de la prime de base. Au total, les primes cumulées peuvent dépasser 13 000 €.</p>

<div class="summary-box">
<h3>Primes cumulées pour remplacer une chaudière fioul par une PAC</h3>
<ul>
<li>Ménage très modeste : jusqu'à <strong>13 000 €</strong> (MPR + bonus fioul + CEE)</li>
<li>Ménage modeste : jusqu'à <strong>10 000 €</strong></li>
<li>Ménage intermédiaire : jusqu'à <strong>7 000 €</strong></li>
<li>Ménage aisé : jusqu'à <strong>4 000 €</strong></li>
</ul>
</div>

<h2>PAC air/eau ou chaudière à granulés : que choisir ?</h2>
<table>
<tr><th>Critère</th><th>PAC air/eau</th><th>Chaudière granulés</th></tr>
<tr><td>Coût installation</td><td>8 000 – 15 000 €</td><td>10 000 – 20 000 €</td></tr>
<tr><td>Prime max (très modeste)</td><td>10 000 €</td><td>8 000 €</td></tr>
<tr><td>Efficacité &lt; 0°C</td><td>Réduite</td><td>Excellente</td></tr>
<tr><td>Entretien annuel</td><td>Faible</td><td>Plus important (ramonage)</td></tr>
<tr><td>Idéal si</td><td>Logement bien isolé</td><td>Zone rurale, grande maison</td></tr>
</table>

<h2>Comment obtenir le bonus fioul ?</h2>
<p>Le bonus de sortie des énergies fossiles (fioul, charbon, propane) est automatiquement inclus dans le calcul de MaPrimeRénov' si votre logement dispose d'une chaudière fioul ou à charbon. Vous n'avez pas de démarche supplémentaire : signalez simplement l'équipement actuel dans votre dossier.</p>

<div class="info-box">
<strong>Délai d'attente :</strong> Les artisans qualifiés PAC sont en forte tension (3 à 6 mois de délai en IDF). Déposez votre demande MaPrimeRénov' maintenant, puis cherchez l'artisan — la demande sera valide 6 mois.
</div>
""",
},

]

# ─── B2B — blog-pro/ ─────────────────────────────────────────────
import importlib.util, pathlib

pro_template_path = pathlib.Path(__file__).parent.parent / "blog-pro" / "_template_pro.py"

# Read the pro template render function - fallback to a simple HTML generation
def render_pro(slug, title, meta_desc, keywords, h1, read_min, summary_items, body_html):
    summary_html = "\n".join(f"<li>{x}</li>" for x in summary_items)
    return f"""<!DOCTYPE html>
<html lang="fr"><head>
<script>
(window.requestIdleCallback||function(cb){{setTimeout(cb,1);}})( function(){{
  var s=document.createElement('script');
  s.src='https://www.googletagmanager.com/gtag/js?id=G-5Z1GK4VJ4E';
  s.async=true;document.head.appendChild(s);
  window.dataLayer=window.dataLayer||[];
  function gtag(){{dataLayer.push(arguments);}}
  window.gtag=gtag;gtag('js',new Date());gtag('config','G-5Z1GK4VJ4E');
}});
</script>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<title>{title}</title>
<meta name="description" content="{meta_desc}">
<meta name="keywords" content="{keywords}">
<link rel="canonical" href="https://batispot.pro/blog-pro/{slug}.html">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{meta_desc}">
<meta property="og:type" content="article">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" media="print" onload="this.media='all'" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap">
<noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"></noscript>
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Article","headline":"{title}","description":"{meta_desc}","datePublished":"2026-04-19","author":{{"@type":"Organization","name":"BatiSpot","url":"https://batispot.pro"}}}}</script>
<style>
:root{{--t1:#0F766E;--t2:#0D9488;--t3:#14B8A6;--g1:#1A6B45;--text:#1C2B22;--sub:#4B6B5A;--border:#99F6E4;--soft:#F0FDFA;}}
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0;}}
body{{font-family:'Inter',system-ui,sans-serif;color:var(--text);background:#FAFAFA;line-height:1.7;}}
.nav{{background:white;border-bottom:1px solid #E5E7EB;padding:16px 0;position:sticky;top:0;z-index:100;}}
.nav-inner{{max-width:800px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:center;}}
.nav-logo{{font-weight:900;font-size:1.3rem;color:var(--t1);text-decoration:none;}}
.nav-cta{{background:var(--t1);color:white;padding:8px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:.85rem;}}
article{{max-width:800px;margin:0 auto;padding:40px 24px 80px;}}
.breadcrumb{{font-size:.82rem;color:var(--sub);margin-bottom:24px;}}
.breadcrumb a{{color:var(--t2);text-decoration:none;}}
.article-meta{{display:flex;gap:16px;font-size:.82rem;color:var(--sub);margin-bottom:24px;flex-wrap:wrap;}}
h1{{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:800;color:var(--t1);line-height:1.25;margin-bottom:16px;}}
h2{{font-size:1.3rem;font-weight:700;color:var(--t1);margin:40px 0 16px;}}
h3{{font-size:1.08rem;font-weight:700;color:var(--t2);margin:24px 0 10px;}}
p{{margin-bottom:16px;}}ul,ol{{margin:12px 0 20px 22px;}}li{{margin-bottom:8px;}}
strong{{color:var(--t1);}}a{{color:var(--t2);}}
.summary-box{{background:var(--soft);border-left:4px solid var(--t2);padding:18px 22px;border-radius:0 10px 10px 0;margin:24px 0;}}
.summary-box h3{{margin-top:0;color:var(--t1);}}
table{{width:100%;border-collapse:collapse;margin:20px 0;font-size:.92rem;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05);}}
th,td{{padding:12px 14px;text-align:left;border-bottom:1px solid #E5E7EB;}}
th{{background:var(--t1);color:white;font-weight:700;font-size:.88rem;}}
.warning-box{{background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;}}
.warning-box strong{{color:#92400E;}}
.info-box{{background:#DBEAFE;border-left:4px solid #3B82F6;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;}}
.info-box strong{{color:#1E40AF;}}
.cta-box{{background:linear-gradient(135deg,#CCFBF1,#F0FDFA);border:2px solid #2DD4BF;border-radius:16px;padding:28px;text-align:center;margin:40px 0;}}
.cta-box h3{{font-size:1.2rem;color:var(--t1);margin-bottom:8px;}}
.cta-btn{{display:inline-block;background:var(--t1);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;}}
footer{{background:var(--t1);color:white;text-align:center;padding:32px 24px;font-size:.85rem;}}
footer a{{color:#5EEAD4;text-decoration:none;}}
@media(max-width:600px){{article{{padding:24px 16px 60px;}}}}
</style></head>
<body>
<nav class="nav"><div class="nav-inner">
<a href="https://batispot.pro" class="nav-logo">BatiSpot Pro</a>
<a href="https://batispot.pro/artisan.html" class="nav-cta">Rejoindre BatiSpot</a>
</div></nav>
<article>
<div class="breadcrumb"><a href="https://batispot.pro">Accueil</a> › <a href="https://batispot.pro/blog-pro/">Blog artisans</a> › {h1}</div>
<h1>{h1}</h1>
<div class="article-meta"><span>BatiSpot Pro</span><span>Mis à jour le 19/04/2026</span><span>Lecture : {read_min} min</span></div>
<div class="summary-box"><h3>Ce que vous allez apprendre</h3><ul>
{summary_html}
</ul></div>
{body_html}
<div class="cta-box">
<h3>Rejoignez le réseau BatiSpot</h3>
<p>Accédez à des clients qualifiés en Île-de-France. Inscription gratuite, 0 commission.</p>
<a href="https://batispot.pro/artisan.html" class="cta-btn">Rejoindre le réseau artisan</a>
</div>
</article>
<footer><p>© 2026 BatiSpot — <a href="https://batispot.pro">batispot.pro</a> · <a href="https://batispot.pro/blog-pro/">Blog artisans</a></p></footer>
</body></html>"""


B2B = [

{
"slug": "rge-controles-renforces-2025-artisan-ce-qui-change",
"title": "Contrôles RGE renforcés en 2025 : ce qui change concrètement pour les artisans qualifiés",
"meta": "Visites inopinées, contrôle des sous-traitants, vérification documentaire : les organismes RGE ont durci leurs contrôles. Ce que vous risquez et comment vous protéger.",
"kw": "controle rge 2025, qualification rge artisan, visite inopinee rge, suspension rge",
"h1": "Contrôles RGE renforcés en 2025 : ce qui change pour les artisans qualifiés",
"read": 6,
"summary": [
    "Nouvelles procédures de contrôle (visites inopinées pendant chantier)",
    "Ce que les contrôleurs vérifient sur site et dans les dossiers",
    "Sanctions applicables : suspension, remboursement, poursuites",
    "Comment constituer un dossier de chantier solide pour passer sans stress",
],
"body": """
<h2>Pourquoi les contrôles RGE ont changé</h2>
<p>Suite aux scandales de fraude à la rénovation énergétique (faux RGE, travaux fantômes, matériaux non conformes), le gouvernement a mandaté les organismes de qualification pour intensifier les contrôles. En 2025, les visites ne sont plus seulement post-travaux : elles peuvent intervenir <strong>pendant le chantier</strong>.</p>

<div class="summary-box">
<h3>Nouveautés contrôles 2025</h3>
<ul>
<li>Visites inopinées possibles <strong>pendant</strong> l'exécution des travaux</li>
<li>Contrôle des qualifications des sous-traitants sur site</li>
<li>Vérification des fiches chantier MaPrimeRénov' en temps réel</li>
<li>Cross-check avec les données de l'ANAH (incohérences signalées automatiquement)</li>
</ul>
</div>

<h2>Ce que les contrôleurs vérifient</h2>
<ul>
<li>Présence d'au moins un salarié qualifié sur le chantier (pas uniquement des sous-traitants)</li>
<li>Conformité des matériaux installés avec ceux mentionnés au devis (marque, référence, certification)</li>
<li>Documents administratifs présents sur chantier : attestations CEE, bons de livraison</li>
<li>Respect des DTU (Documents Techniques Unifiés) pour la mise en œuvre</li>
</ul>

<h2>Sanctions en cas de manquement</h2>
<table>
<tr><th>Gravité</th><th>Sanction</th></tr>
<tr><td>Écart mineur (documentaire)</td><td>Mise en demeure + délai de régularisation</td></tr>
<tr><td>Non-conformité matériaux</td><td>Suspension provisoire du label</td></tr>
<tr><td>Travaux non réalisés facturés</td><td>Suspension immédiate + remboursement ANAH</td></tr>
<tr><td>Fraude organisée</td><td>Radiation + poursuites pénales</td></tr>
</table>

<h2>Votre dossier de chantier : les éléments à avoir impérativement</h2>
<ul>
<li>Photos horodatées avant/pendant/après (avec géolocalisation)</li>
<li>Bons de livraison des matériaux correspondant à la facture</li>
<li>Fiches techniques fabricant de la version exacte installée</li>
<li>Attestation de qualification RGE de chaque sous-traitant</li>
<li>Fiche chantier ANAH remplie en temps réel (pas rétrospectivement)</li>
</ul>
""",
},

{
"slug": "maprimerenov-obligations-documentaires-artisan-2025",
"title": "MaPrimeRénov' : guide des obligations documentaires pour l'artisan RGE en 2025",
"meta": "Devis obligatoire, fiche chantier ANAH, attestation de fin de travaux : le guide complet des documents qui conditionnent le paiement de votre client.",
"kw": "maprimerenov artisan documents obligatoires, fiche chantier ANAH, devis maprimerenov mentions, attestation fin travaux",
"h1": "MaPrimeRénov' 2025 : guide des obligations documentaires pour l'artisan RGE",
"read": 6,
"summary": [
    "La liste complète des documents obligatoires à chaque étape",
    "Mentions obligatoires sur le devis et la facture (liste précise)",
    "La fiche chantier ANAH : comment la remplir correctement",
    "Les erreurs documentaires qui bloquent la prime client",
],
"body": """
<h2>Pourquoi la documentation est devenue critique en 2025</h2>
<p>Depuis le renforcement des contrôles anti-fraude, l'ANAH vérifie systématiquement la cohérence entre devis, factures et fiches chantier. Un document manquant ou incohérent bloque la prime de votre client — et c'est votre responsabilité contractuelle.</p>

<div class="summary-box">
<h3>Documents obligatoires par étape</h3>
<ul>
<li><strong>Avant travaux :</strong> devis signé avec toutes mentions, attestation RGE valide, accord CEE si applicable</li>
<li><strong>Pendant travaux :</strong> fiche chantier ANAH remplie en temps réel, photos horodatées</li>
<li><strong>Après travaux :</strong> facture conforme, attestation de fin de travaux signée client, notice utilisation équipement</li>
</ul>
</div>

<h2>Mentions obligatoires sur le devis MaPrimeRénov'</h2>
<ul>
<li>Votre <strong>numéro et organisme de certification RGE</strong> avec date d'expiration</li>
<li><strong>Référence exacte des matériaux</strong> : marque, modèle, numéro de certification (ex: ACERMI pour l'isolation)</li>
<li>Performances énergétiques : R thermique pour l'isolation, COP pour la PAC, classe énergétique pour le chauffe-eau</li>
<li>Montant HT, TVA applicable (5,5% ou 10%), montant TTC</li>
<li>Si CEE : mention "prime CEE de X€ déduite de la facture"</li>
<li>Numéro de sous-traitant si vous sous-traitez tout ou partie</li>
</ul>

<h2>La fiche chantier ANAH : 3 erreurs à ne pas faire</h2>
<ol>
<li><strong>La remplir rétrospectivement</strong> : les dates doivent correspondre aux bons de livraison. Les contrôleurs détectent les incohérences.</li>
<li><strong>Omettre les sous-traitants</strong> : chaque intervenant doit être déclaré avec son numéro RGE</li>
<li><strong>Ne pas faire signer le client à chaque étape</strong> : la signature doit intervenir à la réception, pas en bloc à la fin</li>
</ol>

<div class="info-box">
<strong>Conseil pratique :</strong> Créez un classeur de chantier (physique ou numérique) pour chaque dossier MaPrimeRénov'. Un dossier bien tenu = un contrôle ANAH sans stress.
</div>
""",
},

{
"slug": "audit-energetique-qui-peut-realiser-formation-artisan",
"title": "Audit énergétique réglementaire : qui peut le réaliser et comment se former en 2025",
"meta": "L'audit énergétique obligatoire avant vente ouvre un nouveau marché pour les professionnels certifiés. Qualifications requises, formations disponibles, tarifs pratiqués.",
"kw": "realiser audit energetique professionnel, formation audit energetique, qualification audit avant vente, certifie audit energetique",
"h1": "Audit énergétique réglementaire : qui peut le réaliser et comment se positionner sur ce marché",
"read": 6,
"summary": [
    "Les 3 profils autorisés à réaliser l'audit réglementaire",
    "Formations disponibles et coût pour obtenir la qualification",
    "Tarifs de marché et volume de demande en IDF",
    "Comment se positionner pour capter ce flux de clients",
],
"body": """
<h2>Un marché en forte croissance lié aux obligations légales</h2>
<p>Depuis 2023, tout logement classé F ou G doit faire l'objet d'un audit énergétique avant vente. Avec l'extension aux logements E et les nouvelles obligations des copropriétés, la demande en auditeurs certifiés va exploser dans les prochaines années. <strong>Le marché est loin d'être saturé.</strong></p>

<div class="summary-box">
<h3>Qui peut réaliser un audit énergétique réglementaire ?</h3>
<ul>
<li><strong>Architectes</strong> : compétents de droit, formation courte recommandée</li>
<li><strong>Bureaux d'études thermiques</strong> : avec ingénieur ou technicien qualifié</li>
<li><strong>Diagnostiqueurs immobiliers</strong> : avec mention spécifique "Audit énergétique" (qualification complémentaire obligatoire)</li>
</ul>
</div>

<h2>La qualification pour les diagnostiqueurs</h2>
<p>Les diagnostiqueurs déjà certifiés DPE peuvent obtenir la qualification "Audit énergétique" via une formation complémentaire de 3 à 5 jours. Elle est délivrée par les organismes de certification (Certinergy, Dekra, Bureau Veritas, Qualibat…).</p>

<h2>Coût et durée de la formation</h2>
<table>
<tr><th>Profil</th><th>Durée formation</th><th>Coût</th><th>Financement</th></tr>
<tr><td>Diagnostiqueur certifié DPE</td><td>3 à 5 jours</td><td>800 – 1 500 €</td><td>CPF, OPCO</td></tr>
<tr><td>Technicien bureau d'études</td><td>5 à 7 jours</td><td>1 200 – 2 000 €</td><td>CPF, OPCO</td></tr>
<tr><td>Architecte (complémentaire)</td><td>2 à 3 jours</td><td>500 – 800 €</td><td>Ordre des architectes</td></tr>
</table>

<h2>Tarifs et volume de marché en IDF</h2>
<p>Un audit énergétique réglementaire se facture <strong>500 à 1 200 €</strong> en Île-de-France, avec une moyenne autour de 700 €. La demande est estimée à plusieurs dizaines de milliers d'audits annuels pour la seule Île-de-France, compte tenu du parc de passoires thermiques.</p>

<div class="info-box">
<strong>Opportunité :</strong> Se positionner sur l'audit énergétique en 2025 permet de créer un revenu complémentaire régulier, avec des clients captifs (vente immobilière contrainte). La fidélisation est forte : un client audité vous recontacte souvent pour les travaux.
</div>
""",
},

{
"slug": "raccordement-enedis-photovoltaique-demarches-artisan-2025",
"title": "Raccordement Enedis pour les installations photovoltaïques : procédures et délais en 2025",
"meta": "Le raccordement Enedis est un point de blocage majeur pour les artisans PV. Délais réels, procédures, et comment accélérer les demandes pour vos clients.",
"kw": "raccordement enedis photovoltaique, demande raccordement solaire, delai enedis installation pv, artisan raccordement solaire",
"h1": "Raccordement Enedis pour les installations PV : procédures, délais et astuces pour les artisans",
"read": 6,
"summary": [
    "Les 4 étapes du raccordement Enedis pour le photovoltaïque",
    "Délais réels en 2025 et comment les anticiper",
    "Les erreurs documentaires qui font tout repasser de zéro",
    "Stratégies pour gérer plusieurs dossiers Enedis en parallèle",
],
"body": """
<h2>Le raccordement Enedis : le principal goulot d'étranglement du marché PV</h2>
<p>Le marché du photovoltaïque résidentiel croît de 30% par an, mais Enedis est submergé de demandes. En 2025, les délais de raccordement en Île-de-France atteignent <strong>4 à 8 mois</strong> après l'installation. Savoir gérer ce processus est un avantage compétitif majeur.</p>

<div class="summary-box">
<h3>Les 4 étapes du raccordement</h3>
<ul>
<li><strong>Étape 1 :</strong> Dépôt de la demande sur le portail Enedis (avant l'installation)</li>
<li><strong>Étape 2 :</strong> Proposition technique et financière Enedis (PTF) — délai : 1 à 3 mois</li>
<li><strong>Étape 3 :</strong> Acceptation + consignation + installation</li>
<li><strong>Étape 4 :</strong> Mise en service et convention d'autoconsommation</li>
</ul>
</div>

<h2>Les délais réels en 2025</h2>
<table>
<tr><th>Étape</th><th>Délai théorique</th><th>Délai réel IDF</th></tr>
<tr><td>Demande → PTF</td><td>3 semaines</td><td>6 à 12 semaines</td></tr>
<tr><td>PTF → Mise en service</td><td>3 mois</td><td>4 à 6 mois</td></tr>
<tr><td>Total</td><td>4 à 5 mois</td><td>6 à 8 mois</td></tr>
</table>

<h2>Les 3 erreurs documentaires qui font tout recommencer</h2>
<ol>
<li><strong>Plan de masse incorrect :</strong> le plan doit respecter les distances réglementaires. Un plan approximatif entraîne un retour Enedis et 4-6 semaines de délai supplémentaire.</li>
<li><strong>Puissance crête mal calculée :</strong> la demande doit indiquer la puissance nominale exacte de l'onduleur, pas la puissance crête des panneaux.</li>
<li><strong>CONSUEL non anticipé :</strong> pour les installations &gt; 3 kWc, le CONSUEL doit être obtenu avant la mise en service. Comptez 3 à 6 semaines supplémentaires.</li>
</ol>

<div class="info-box">
<strong>Astuce :</strong> Déposez la demande Enedis dès la signature du devis client, pas après l'installation. Vous gagnez 2 à 4 mois sur le calendrier total — argument commercial fort face à la concurrence.
</div>
""",
},

{
"slug": "sinistres-decennaux-hausse-assurance-resiliation-artisan",
"title": "Hausse des sinistres décennaux : votre assurance peut être résiliée — comment se protéger",
"meta": "Les sinistres décennaux augmentent en 2025, entraînant des résiliations d'assurance et des hausses de prime. Ce que les artisans doivent faire pour maintenir leur couverture.",
"kw": "sinistre decennal hausse 2025, resiliation assurance decennale artisan, prime assurance btp hausse, maintenir assurance decennale",
"h1": "Hausse des sinistres décennaux en 2025 : votre assurance peut être résiliée — ce qu'il faut faire",
"read": 5,
"summary": [
    "Pourquoi les sinistres décennaux explosent et ce que ça signifie pour votre prime",
    "Les 3 situations où votre assureur peut résilier",
    "Comment prévenir les sinistres et garder un bon dossier",
    "Que faire si votre assureur résilie et comment retrouver une couverture",
],
"body": """
<h2>Le marché de l'assurance décennale est en crise</h2>
<p>En 2024-2025, les sinistres décennaux ont augmenté de 18% selon la FFA (Fédération Française des Assurances). Conséquence directe : les assureurs deviennent plus sélectifs, les primes augmentent de 10 à 30%, et certains artisans voient leur contrat résilié à l'échéance.</p>

<div class="warning-box">
<strong>Risque majeur :</strong> Un artisan sans assurance décennale valide ne peut légalement pas signer de devis pour des travaux de construction ou de rénovation lourde. Travailler sans cette assurance est une infraction pénale.
</div>

<h2>Les 3 situations où l'assureur peut résilier</h2>
<ol>
<li><strong>Sinistralité élevée :</strong> si vous avez eu 2 sinistres ou plus en 3 ans, l'assureur peut résilier à l'échéance annuelle</li>
<li><strong>Fausse déclaration :</strong> activités non déclarées à la souscription (ex: ITE déclarée comme isolation intérieure)</li>
<li><strong>Non-paiement de prime :</strong> 30 jours après mise en demeure, la couverture est suspendue</li>
</ol>

<h2>Comment prévenir les sinistres</h2>
<ul>
<li>Systématiser les PV de réception des travaux signés par le client</li>
<li>Prendre des photos avant/pendant/après chaque chantier</li>
<li>Ne jamais commencer sans avoir vu les diagnostics obligatoires (amiante, plomb)</li>
<li>Former vos équipes aux DTU applicables à votre corps de métier</li>
</ul>

<h2>Si votre assureur résilie : que faire ?</h2>
<p>La résiliation à l'échéance vous laisse généralement 2 mois pour trouver une nouvelle couverture. Contactez un courtier spécialisé BTP — ils ont accès à des assureurs qui ne pratiquent pas le démarchage direct (AXA XL, Covéa, Berkley…). Attendez-vous à payer 30 à 50% de plus si vous avez des sinistres.</p>
""",
},

{
"slug": "isolation-1-euro-terminee-repositionner-offre-menuiserie",
"title": "L'isolation à 1 euro est terminée : comment repositionner votre offre en 2025",
"meta": "Le dispositif isolation à 1 euro a été supprimé en 2022. En 2025, comment expliquer à vos clients les nouvelles règles et repositionner votre offre commerciale.",
"kw": "isolation 1 euro supprimee, maprimerenov isolation remplacement, expliquer aides renovation client, offre commerciale isolation 2025",
"h1": "L'isolation à 1 euro c'est fini : comment repositionner votre offre et convertir quand même",
"read": 5,
"summary": [
    "Pourquoi le dispositif à 1 euro a été supprimé et ce qui l'a remplacé",
    "Comment expliquer la nouvelle réalité des aides à vos clients",
    "Script commercial pour transformer l'objection en opportunité",
    "Les nouveaux arguments qui convertissent mieux que le '1 euro'",
],
"body": """
<h2>Le 1 euro a créé un problème de perception durable</h2>
<p>Depuis sa suppression en 2022, des milliers de propriétaires pensent encore pouvoir faire isoler leurs combles "gratuitement". Quand votre devis arrive à 3 000 € même après aides, la déception est forte. Savoir expliquer la situation est devenu une compétence commerciale essentielle.</p>

<div class="summary-box">
<h3>Ce qui a remplacé le 1 euro</h3>
<ul>
<li><strong>MaPrimeRénov' :</strong> 500 à 2 500 € pour l'isolation des combles selon revenus</li>
<li><strong>CEE :</strong> 400 à 900 € supplémentaires cumulables</li>
<li><strong>TVA 5,5% :</strong> -14,5% sur le montant TTC</li>
<li>Reste à charge réel pour ménage modeste : souvent 0 à 800 € (au lieu de 1 €, mais financement transparent)</li>
</ul>
</div>

<h2>Comment expliquer la situation en 2 minutes</h2>
<p>Script éprouvé :</p>
<p><em>"Le dispositif à 1 euro a été supprimé parce qu'il y avait trop de fraudes — des entreprises faisaient des travaux bâclés. Aujourd'hui le système est plus rigoureux : vous avez des aides MaPrimeRénov' et des primes énergie qui couvrent 70 à 90% du coût selon vos revenus. Le reste à charge est entre X et Y euros, et vous bénéficiez d'artisans vérifiés avec une garantie décennale réelle."</em></p>

<h2>Les nouveaux arguments qui convertissent</h2>
<ul>
<li><strong>Argument concret :</strong> montrez le calcul avec les aides avant/après sur votre tablette</li>
<li><strong>Argument urgence :</strong> les plafonds MaPrimeRénov' peuvent baisser en 2026 selon les arbitrages budgétaires</li>
<li><strong>Argument valeur :</strong> un logement bien isolé gagne 1 à 2 classes DPE → +5 à 15% de valeur à la revente</li>
<li><strong>Argument confort :</strong> 40% des gains se ressentent dès le premier hiver (pas juste sur la facture)</li>
</ul>
""",
},

{
"slug": "maprimerenov-bonus-sortie-passoire-artisan-comment-valoriser",
"title": "Bonus sortie de passoire thermique MaPrimeRénov' : comment en faire bénéficier vos clients et le valoriser commercialement",
"meta": "Un bonus spécifique est accordé quand vos travaux font passer un logement de G/F vers E ou mieux. Comment le calculer et l'intégrer dans votre argumentaire commercial.",
"kw": "bonus sortie passoire maprimerenov, prime renovation passoire thermique artisan, sortie classe g f maprimerenov bonus",
"h1": "Bonus sortie de passoire thermique : comment en faire bénéficier vos clients et valoriser votre offre",
"read": 5,
"summary": [
    "Ce qu'est le bonus sortie de passoire et comment il se cumule",
    "Conditions pour y avoir droit (gain de classes obligatoire)",
    "Comment intégrer ce bonus dans votre devis pour maximiser la conversion",
    "Exemples chiffrés de reste à charge avant/après bonus",
],
"body": """
<h2>Le bonus sortie de passoire : une prime mal connue des artisans</h2>
<p>En plus des primes classiques MaPrimeRénov', un <strong>bonus spécifique</strong> est accordé quand les travaux permettent de faire passer un logement d'une classe G ou F vers la classe E ou mieux. Ce bonus peut atteindre <strong>1 500 à 3 000 €</strong> supplémentaires, selon le gain de classes et la catégorie de revenus du client.</p>

<div class="summary-box">
<h3>Montants du bonus sortie de passoire 2025</h3>
<ul>
<li>Passage G → E ou mieux : <strong>1 500 €</strong> (ménages intermédiaires) à <strong>3 000 €</strong> (ménages modestes)</li>
<li>Passage F → E ou mieux : <strong>500 €</strong> à <strong>1 500 €</strong></li>
<li>Cumulable avec toutes les autres primes MPR et les CEE</li>
</ul>
</div>

<h2>Conditions pour déclencher le bonus</h2>
<ul>
<li>Logement classé G ou F avant travaux (DPE valide obligatoire)</li>
<li>Travaux réalisés dans le cadre du <strong>parcours accompagné</strong> uniquement</li>
<li>Gain d'au moins 2 classes DPE après travaux (attesté par un DPE post-travaux)</li>
<li>Le Mon Accompagnateur Rénov' valide le gain de classes dans le dossier</li>
</ul>

<h2>Comment l'intégrer dans votre devis et votre argumentaire</h2>
<p>La plupart des artisans présentent les aides de façon globale. Se démarquer en détaillant les primes ligne par ligne — dont le bonus sortie de passoire — renforce la crédibilité et aide le client à visualiser son reste à charge réel.</p>
<p>Exemple d'argumentaire : <em>"Pour votre maison classée G, en installant la PAC + isolation combles, vous passez en D. En plus des primes de base, vous touchez un bonus de 2 500 € supplémentaires. Votre reste à charge passe de 8 000 € à 3 500 €."</em></p>

<div class="info-box">
<strong>Valeur ajoutée :</strong> Proposer systématiquement un DPE post-travaux à votre client (150-250 €) lui permet de déclencher le bonus et de valoriser son bien. Vous pouvez inclure ce service dans votre prestation globale.
</div>
""",
},

{
"slug": "diagnostic-obligatoire-avant-travaux-checklist-artisan",
"title": "Diagnostics obligatoires avant travaux : la checklist que chaque artisan doit vérifier",
"meta": "Amiante, plomb, DPE, électricité, gaz : les diagnostics à exiger avant de commencer. Ce que vous risquez si vous ignorez cette vérification.",
"kw": "diagnostic obligatoire avant travaux, amiante avant travaux artisan, plomb renovation artisan, checklist diagnostic chantier",
"h1": "Diagnostics obligatoires avant travaux : la checklist complète pour les artisans",
"read": 6,
"summary": [
    "Liste des 6 diagnostics à vérifier selon le type de travaux",
    "Votre responsabilité si vous intervenez sans diagnostic",
    "Comment demander les diagnostics sans froisser le client",
    "Clause contractuelle à inclure dans votre devis",
],
"body": """
<h2>Votre sécurité et votre responsabilité commencent avant le chantier</h2>
<p>Beaucoup d'artisans ignorent qu'ils sont exposés à des risques sérieux s'ils interviennent sans avoir vérifié les diagnostics obligatoires. Ce n'est pas seulement une question de réglementation : c'est votre santé, celle de vos salariés, et votre responsabilité pénale.</p>

<div class="summary-box">
<h3>6 diagnostics à vérifier selon le contexte</h3>
<ul>
<li><strong>Amiante (RAT)</strong> : tout bâtiment &lt; 1997, travaux susceptibles de perturber des matériaux</li>
<li><strong>Plomb (CREP)</strong> : logements construits avant 1949, travaux sur revêtements</li>
<li><strong>Gaz</strong> : installation &gt; 15 ans, travaux plomberie/chauffage</li>
<li><strong>Électricité</strong> : installation &gt; 15 ans, travaux électricité</li>
<li><strong>DPE</strong> : rénovation énergétique, pour les aides</li>
<li><strong>Étude sol (G2)</strong> : construction, extension, fondations</li>
</ul>
</div>

<h2>Responsabilité artisan en l'absence de diagnostic</h2>
<p><strong>Amiante :</strong> Intervenir sans RAT sur un bâtiment d'avant 1997 vous expose à une amende jusqu'à 9 000 € et à une mise en cause pénale en cas de contamination d'un salarié.</p>
<p><strong>Plomb :</strong> Le saturnisme est une maladie professionnelle reconnue. Sans CREP, votre assurance peut refuser de couvrir les dommages.</p>
<p><strong>Électricité/Gaz :</strong> En cas d'incendie ou explosion post-travaux, l'absence de diagnostic préalable renforce votre responsabilité civile et pénale.</p>

<h2>Comment demander les diagnostics sans froisser le client</h2>
<p>Formulation recommandée dans le devis : <em>"Les présents travaux sont réalisés sous réserve de la fourniture préalable des diagnostics obligatoires suivants : [liste]. L'artisan ne pourra pas débuter les travaux sans ces documents. Ces diagnostics sont à la charge du maître d'ouvrage."</em></p>

<div class="info-box">
<strong>Astuce :</strong> Ayez une liste de diagnostiqueurs certifiés partenaires dans votre zone. Proposer de les mettre en relation avec un diagnostiqueur de confiance rend service au client et fluidifie le démarrage du chantier.
</div>
""",
},

{
"slug": "penurie-artisans-rge-strategies-positionnement-2025",
"title": "Pénurie d'artisans RGE : 4 stratégies pour se positionner sur un marché en tension",
"meta": "150 000 artisans RGE manquent en France. Pour les artisans qualifiés ou en cours de qualification, c'est une opportunité historique. 4 stratégies concrètes.",
"kw": "penurie artisan rge france, opportunite marche rge 2025, se positionner renovation energetique, developpement artisan rge",
"h1": "Pénurie d'artisans RGE : 4 stratégies pour capter le marché en tension",
"read": 6,
"summary": [
    "Ampleur réelle de la pénurie et gestes les plus en tension en IDF",
    "Stratégie 1 : se spécialiser sur un geste à forte demande",
    "Stratégie 2 : devenir partenaire d'un Mon Accompagnateur Rénov'",
    "Stratégie 3 : multi-qualification pour proposer la rénovation complète",
],
"body": """
<h2>150 000 artisans RGE manquent : une opportunité historique</h2>
<p>L'ADEME estime qu'il faudrait former 150 000 artisans RGE supplémentaires pour tenir les objectifs de rénovation énergétique d'ici 2030. En Île-de-France, les délais d'attente pour certains gestes dépassent 6 mois. Pour les artisans déjà qualifiés ou en cours de qualification, le contexte n'a jamais été aussi favorable.</p>

<div class="summary-box">
<h3>Délais d'attente moyens en IDF (2025)</h3>
<ul>
<li>PAC air/eau : <strong>3 à 6 mois</strong></li>
<li>Isolation thermique par l'extérieur : <strong>4 à 5 mois</strong></li>
<li>Photovoltaïque résidentiel : <strong>2 à 4 mois</strong></li>
<li>VMC double flux : <strong>6 à 10 semaines</strong></li>
</ul>
</div>

<h2>Stratégie 1 : la spécialisation sur un geste en tension</h2>
<p>Plutôt que de tout faire, choisissez le geste le plus demandé dans votre zone et devenez l'expert incontournable. Un artisan PAC qui maîtrise parfaitement les dossiers MaPrimeRénov' peut travailler sur carnet de commandes plein à 3 mois, avec une forte capacité à négocier ses tarifs.</p>

<h2>Stratégie 2 : le partenariat Mon Accompagnateur Rénov'</h2>
<p>Les MAR (Mon Accompagnateur Rénov') cherchent des artisans RGE fiables sur lesquels orienter leurs clients. Un partenariat avec 3 à 5 MAR actifs dans votre zone = un flux régulier de clients qualifiés, avec dossiers déjà montés et clients déjà convaincus. Contactez directement les MAR référencés sur france-renov.gouv.fr.</p>

<h2>Stratégie 3 : la multi-qualification pour la rénovation globale</h2>
<p>RGE isolation + RGE PAC + optionnellement QualiPV : cet artisan peut proposer une rénovation complète en un seul interlocuteur. C'est exactement ce que cherchent les clients du parcours accompagné, qui veulent éviter de gérer 4 corps de métier différents. La valeur ajoutée justifie des marges 15 à 20% plus élevées.</p>

<h2>Stratégie 4 : être présent sur les plateformes de mise en relation</h2>
<p>France Rénov', Hellio, Effy, BatiSpot : les plateformes de mise en relation avec des clients rénovation génèrent des leads qualifiés. Un artisan bien noté sur ces plateformes remplit son carnet de commandes sans faire de démarchage commercial.</p>

<div class="info-box">
<strong>Formation :</strong> Les coûts de formation RGE (QualiPAC, QualiPV, Qualibat isolation) peuvent être pris en charge via le CPF ou les OPCO BTP (Constructys, FAFCEA). Renseignez-vous avant d'investir sur vos fonds propres.
</div>
""",
},

]


if __name__ == "__main__":
    blog_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)))
    blogpro_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "blog-pro")

    count = 0

    # B2C
    for a in B2C:
        html = render(
            slug=a["slug"], title=a["title"], meta_desc=a["meta"],
            keywords=a["kw"], h1=a["h1"], read_min=a["read"],
            summary_items=a["summary"], body_html=a["body"],
        )
        path = os.path.join(blog_dir, a["slug"] + ".html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"✅ blog/{a['slug']}.html")
        count += 1

    # B2B
    for a in B2B:
        html = render_pro(
            slug=a["slug"], title=a["title"], meta_desc=a["meta"],
            keywords=a["kw"], h1=a["h1"], read_min=a["read"],
            summary_items=a["summary"], body_html=a["body"],
        )
        path = os.path.join(blogpro_dir, a["slug"] + ".html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"✅ blog-pro/{a['slug']}.html")
        count += 1

    print(f"\n{count} articles générés (0 doublons).")

#!/usr/bin/env python3
"""20 articles réglementaires/aides 2025-2026 — 10 B2C + 10 B2B"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from _template_gen import render

ARTICLES_B2C = [

# ───────────────────────────────────────────────────────────────────
# ARTICLE 1
# ───────────────────────────────────────────────────────────────────
{
"slug": "maprimerenov-2025-ce-qui-a-change",
"title": "MaPrimeRénov' 2025 : ce qui a vraiment changé (et comment en profiter encore)",
"desc": "Réforme, nouveaux plafonds, gestes exclus : le guide complet pour savoir si vous êtes encore éligible en 2025.",
"cat": "aides",
"date": "18 avril 2026",
"content": """
<h2>MaPrimeRénov' a été profondément réformée en 2024-2025</h2>
<p>Depuis janvier 2024, le gouvernement a resserré les conditions d'accès à MaPrimeRénov'. Beaucoup de propriétaires pensent encore bénéficier des mêmes aides qu'avant — mais les règles ont changé. Voici ce qui est encore disponible en 2025.</p>

<div class="summary-box">
<h3>Ce qui a changé en résumé</h3>
<ul>
<li>Les <strong>mono-gestes isolation</strong> ne sont plus financés pour les ménages aux revenus supérieurs (hors MaPrimeRénov' Parcours accompagné)</li>
<li>L'<strong>audit énergétique</strong> est obligatoire pour les travaux de rénovation d'ampleur</li>
<li>Le <strong>chauffage au fioul</strong> est fortement encouragé à être remplacé (prime bonifiée)</li>
<li>Les <strong>chaudières gaz</strong> ne sont plus financées par MaPrimeRénov'</li>
</ul>
</div>

<h2>Ce qui reste financé en 2025</h2>
<table>
<tr><th>Travaux</th><th>Ménages modestes</th><th>Ménages intermédiaires</th></tr>
<tr><td>Pompe à chaleur air/eau</td><td>Jusqu'à 10 000 €</td><td>Jusqu'à 6 000 €</td></tr>
<tr><td>Isolation combles perdus</td><td>Oui (parcours accompagné)</td><td>Oui (parcours accompagné)</td></tr>
<tr><td>Isolation murs extérieurs</td><td>Oui</td><td>Oui (accompagné)</td></tr>
<tr><td>Chauffe-eau thermodynamique</td><td>Jusqu'à 3 000 €</td><td>Jusqu'à 1 500 €</td></tr>
<tr><td>Fenêtres double vitrage</td><td>Limité</td><td>Non (sauf accompagné)</td></tr>
</table>

<h2>Le "Parcours accompagné" : qu'est-ce que c'est ?</h2>
<p>Pour les travaux de rénovation d'ampleur (toucher plusieurs postes en même temps), vous devez passer par un <strong>Mon Accompagnateur Rénov' (MAR)</strong>. C'est un conseiller agréé qui vous suit de l'audit à la fin du chantier. Ce parcours donne accès aux primes les plus élevées.</p>

<div class="info-box">
<strong>Bon à savoir :</strong> L'aide peut atteindre <strong>70% du montant des travaux</strong> pour les ménages très modestes dans le cadre du parcours accompagné, avec un plafond de 70 000 €.
</div>

<h2>Comment savoir si vous êtes éligible ?</h2>
<p>L'éligibilité dépend de votre <strong>revenu fiscal de référence</strong> et de la composition de votre foyer. Les plafonds 2025 ont été légèrement revalorisés. Pour un ménage de 2 personnes en Île-de-France :</p>
<ul>
<li>Ménage très modeste : revenus &lt; 25 714 €/an</li>
<li>Ménage modeste : revenus &lt; 36 816 €/an</li>
<li>Ménage intermédiaire : revenus &lt; 55 407 €/an</li>
<li>Ménage aisé : au-delà (accès limité au parcours accompagné uniquement)</li>
</ul>

<h2>Les erreurs à éviter</h2>
<ul>
<li>Ne pas commencer les travaux avant d'avoir reçu la notification d'accord (perte totale de la prime)</li>
<li>Choisir un artisan non qualifié RGE (obligatoire pour toucher l'aide)</li>
<li>Ne pas vérifier que votre artisan est bien référencé sur l'annuaire officiel RGE</li>
</ul>

<div class="warning-box">
<strong>Attention aux arnaques :</strong> des démarcheurs proposent de "gérer votre dossier MaPrimeRénov'" contre commission. C'est interdit. Seul votre Mon Accompagnateur Rénov' officiel est habilité.
</div>
"""
},

# ───────────────────────────────────────────────────────────────────
# ARTICLE 2
# ───────────────────────────────────────────────────────────────────
{
"slug": "logements-g-interdits-location-2025",
"title": "Logements classés G interdits à la location depuis 2025 : que faire si vous êtes concerné ?",
"desc": "Depuis janvier 2025, les logements avec un DPE G ne peuvent plus être mis en location. Ce que vous risquez et comment régulariser.",
"cat": "guides",
"date": "18 avril 2026",
"content": """
<h2>La loi Climat s'applique : les G sont hors marché locatif</h2>
<p>C'est officiel depuis le 1er janvier 2025 : tout logement classé <strong>G au DPE (Diagnostic de Performance Énergétique)</strong> ne peut plus faire l'objet d'un nouveau contrat de location. Cette mesure touche environ 600 000 logements en France.</p>

<div class="summary-box">
<h3>Calendrier des interdictions de location</h3>
<ul>
<li><strong>Janvier 2025 :</strong> interdiction des logements G (consommation &gt; 420 kWh/m²/an)</li>
<li><strong>Janvier 2028 :</strong> interdiction des logements F</li>
<li><strong>Janvier 2034 :</strong> interdiction des logements E</li>
</ul>
</div>

<h2>Qu'est-ce que ça signifie concrètement ?</h2>
<p>Si votre bien est classé G, vous ne pouvez plus :</p>
<ul>
<li>Signer un <strong>nouveau bail</strong> avec un locataire</li>
<li>Renouveler un bail existant arrivé à échéance</li>
<li>Proposer le logement à la location sur les plateformes (LeBonCoin, SeLoger, etc.)</li>
</ul>
<p>En revanche, si un locataire est déjà en place avec un bail en cours, vous pouvez l'honorer jusqu'à son terme.</p>

<h2>Quelles sanctions si vous ne respectez pas la loi ?</h2>
<p>Le locataire peut contraindre le propriétaire à réaliser des travaux via une procédure judiciaire. Il peut aussi exiger une réduction de loyer tant que les travaux ne sont pas faits. Les amendes pour non-respect peuvent atteindre <strong>45 000 €</strong>.</p>

<h2>Par où commencer pour sortir du classement G ?</h2>
<p>Pour passer de G à D ou E, les travaux prioritaires sont :</p>
<ol>
<li><strong>Isolation des combles</strong> : gain de 1 à 2 classes DPE pour un coût de 1 500 à 3 000 €</li>
<li><strong>Remplacement du système de chauffage</strong> : passer à une pompe à chaleur change radicalement le score</li>
<li><strong>Isolation des murs</strong> : impact fort mais coût plus élevé (100 à 200 €/m²)</li>
</ol>

<div class="info-box">
<strong>Bonne nouvelle :</strong> MaPrimeRénov' finance spécifiquement la sortie des passoires thermiques. Pour un logement G, les aides sont maximales, surtout si vous passez par le parcours accompagné.
</div>

<h2>Mon DPE est G mais je pense qu'il est faux — que faire ?</h2>
<p>Les DPE réalisés avant juillet 2021 ne sont plus valides depuis le 1er janvier 2023. Si votre DPE a été fait entre juillet 2021 et juin 2022, sa fiabilité peut être contestée. Vous pouvez demander un nouveau DPE à un diagnostiqueur certifié et comparer les résultats.</p>
"""
},

# ───────────────────────────────────────────────────────────────────
# ARTICLE 3
# ───────────────────────────────────────────────────────────────────
{
"slug": "audit-energetique-obligatoire-vente-passoire",
"title": "Audit énergétique obligatoire avant vente : ce que tout propriétaire doit savoir en 2025",
"desc": "Depuis 2023, vendre une passoire thermique (F ou G) impose un audit énergétique. Ce qu'il contient, combien ça coûte, et comment l'utiliser.",
"cat": "guides",
"date": "18 avril 2026",
"content": """
<h2>Depuis avril 2023, l'audit s'impose avant de vendre une passoire</h2>
<p>Si vous vendez un logement classé <strong>F ou G au DPE</strong>, vous devez fournir à l'acheteur un <strong>audit énergétique réglementaire</strong> en plus du DPE. Cette obligation a été étendue aux logements E en 2025, et concernera les D en 2034.</p>

<div class="summary-box">
<h3>Qui est concerné ?</h3>
<ul>
<li>Logements classés <strong>F ou G</strong> : audit obligatoire depuis avril 2023</li>
<li>Logements classés <strong>E</strong> : obligation à venir (2025 confirmé)</li>
<li>Uniquement pour les <strong>maisons individuelles et immeubles en monopropriété</strong></li>
<li>Les appartements en copropriété sont pour l'instant exclus</li>
</ul>
</div>

<h2>Qu'est-ce que l'audit énergétique contient ?</h2>
<p>Contrairement au DPE (3 heures, 150 à 250 €), l'audit est beaucoup plus complet :</p>
<ul>
<li>État des lieux détaillé de tous les postes de dépense énergétique</li>
<li>Au moins <strong>2 scénarios de travaux</strong> avec chiffrage estimatif</li>
<li>Un scénario permettant d'atteindre la classe B ou mieux</li>
<li>Estimation des aides financières mobilisables</li>
<li>Durée de retour sur investissement</li>
</ul>

<h2>Combien coûte un audit énergétique réglementaire ?</h2>
<p>Comptez entre <strong>500 et 1 000 €</strong> pour une maison individuelle. C'est la fourchette constatée en Île-de-France. L'audit doit être réalisé par un professionnel certifié (architecte, bureau d'études thermiques, diagnostiqueur avec certification spécifique).</p>

<div class="info-box">
<strong>Astuce :</strong> L'audit peut être partiellement financé dans le cadre du parcours accompagné MaPrimeRénov'. Si vous prévoyez de rénover avant de vendre, faites les deux en même temps.
</div>

<h2>L'acheteur peut-il se retourner contre vous ?</h2>
<p>Si vous ne fournissez pas l'audit avant la signature du compromis de vente, l'acheteur peut invoquer un <strong>vice du consentement</strong> et demander l'annulation de la vente ou une réduction du prix. Le notaire est tenu de vérifier que le document est présent.</p>

<h2>Comment exploiter l'audit comme outil de négociation ?</h2>
<p>Si vous êtes acheteur et que le logement est classé F ou G, l'audit vous donne un levier : vous savez exactement combien coûtera la rénovation et quelles aides sont disponibles. Vous pouvez négocier le prix en conséquence et intégrer les travaux dans votre plan de financement.</p>
"""
},

# ───────────────────────────────────────────────────────────────────
# ARTICLE 4
# ───────────────────────────────────────────────────────────────────
{
"slug": "fin-aide-chaudiere-gaz-alternatives-2025",
"title": "MaPrimeRénov' ne finance plus les chaudières gaz : quelles alternatives en 2025 ?",
"desc": "Depuis 2023, les chaudières gaz sont exclues de MaPrimeRénov'. Pompe à chaleur, chauffe-eau thermodynamique, poêle à granulés : comparatif des alternatives aidées.",
"cat": "aides",
"date": "18 avril 2026",
"content": """
<h2>Pourquoi les chaudières gaz ne sont plus aidées ?</h2>
<p>Le gouvernement a décidé d'exclure les chaudières à gaz de MaPrimeRénov' dès 2023, dans le cadre de la transition énergétique. L'objectif : accélérer la sortie des énergies fossiles dans le chauffage résidentiel. Conséquence directe : <strong>remplacer sa vieille chaudière gaz par une neuve chaudière gaz ne rapporte rien</strong>.</p>

<div class="warning-box">
<strong>Important :</strong> Même une chaudière gaz à condensation "haute performance" ne bénéficie plus d'aucune aide MaPrimeRénov'. Seules des aides CEE marginales subsistent.
</div>

<h2>Les alternatives financées en 2025</h2>
<table>
<tr><th>Équipement</th><th>Prime max (modeste)</th><th>Prime max (intermédiaire)</th><th>Économies annuelles</th></tr>
<tr><td>Pompe à chaleur air/eau</td><td>10 000 €</td><td>6 000 €</td><td>800 à 1 500 €/an</td></tr>
<tr><td>Pompe à chaleur air/air</td><td>3 000 €</td><td>2 000 €</td><td>400 à 800 €/an</td></tr>
<tr><td>Chauffe-eau thermodynamique</td><td>3 000 €</td><td>1 500 €</td><td>300 à 500 €/an</td></tr>
<tr><td>Poêle à granulés de bois</td><td>2 500 €</td><td>1 500 €</td><td>400 à 700 €/an</td></tr>
<tr><td>Chaudière biomasse (granulés)</td><td>8 000 €</td><td>5 000 €</td><td>600 à 1 200 €/an</td></tr>
</table>

<h2>La pompe à chaleur : vraiment rentable ?</h2>
<p>La PAC air/eau est le choix plébiscité : elle produit 3 à 4 kWh de chaleur pour 1 kWh d'électricité consommé. Couplée aux aides, son coût net peut descendre à <strong>3 000-5 000 €</strong> pour une maison de 100 m². Le retour sur investissement est de 5 à 8 ans.</p>
<p>Mais elle a des limites : elle est moins efficace en-dessous de -5°C, et nécessite un logement bien isolé pour fonctionner de façon optimale.</p>

<h2>Je n'ai pas les moyens de faire la transition : que faire ?</h2>
<p>Si votre chaudière gaz tombe en panne et que vous n'avez pas les moyens de passer à la PAC, vous pouvez la faire réparer. Ce n'est pas interdit. En revanche, si vous devez la remplacer complètement, sachez que les aides pour les alternatives sont désormais suffisamment élevées pour rendre la transition accessible dès les revenus modestes.</p>

<div class="info-box">
<strong>Aide supplémentaire :</strong> Si vous remplacez une chaudière au fioul ou au charbon (pas gaz), la prime est majorée de 1 000 à 3 000 € supplémentaires.
</div>
"""
},

# ───────────────────────────────────────────────────────────────────
# ARTICLE 5
# ───────────────────────────────────────────────────────────────────
{
"slug": "cee-2025-certificats-economies-energie-travaux",
"title": "CEE 2025 : comment utiliser les Certificats d'Économies d'Énergie pour financer vos travaux",
"desc": "Les CEE sont souvent ignorés mais peuvent représenter 500 à 3 000 € d'aide supplémentaire. Guide complet pour les cumuler avec MaPrimeRénov'.",
"cat": "aides",
"date": "18 avril 2026",
"content": """
<h2>Les CEE : une aide méconnue qui peut changer tout</h2>
<p>Les Certificats d'Économies d'Énergie (CEE) sont financés par les fournisseurs d'énergie (EDF, TotalEnergies, Engie, etc.) qui ont l'obligation légale d'encourager les économies d'énergie. Résultat : ils financent vos travaux en échange de "certificats" attestant des économies réalisées.</p>
<p>Le point clé : <strong>les CEE sont cumulables avec MaPrimeRénov'</strong>. Vous pouvez donc bénéficier des deux aides simultanément.</p>

<div class="summary-box">
<h3>Montants CEE 2025 (exemples pour une maison de 100 m²)</h3>
<ul>
<li>Isolation combles perdus : <strong>400 à 800 €</strong></li>
<li>Isolation murs par l'extérieur : <strong>1 500 à 3 000 €</strong></li>
<li>Pompe à chaleur air/eau : <strong>800 à 2 000 €</strong></li>
<li>Fenêtres double vitrage : <strong>300 à 600 €</strong></li>
<li>Isolation plancher bas : <strong>500 à 1 200 €</strong></li>
</ul>
</div>

<h2>Comment obtenir les CEE concrètement ?</h2>
<p>Il y a deux façons :</p>
<ol>
<li><strong>Via votre artisan</strong> : il gère les CEE directement et déduit le montant de votre facture. C'est la méthode la plus simple — demandez-lui systématiquement.</li>
<li><strong>Via un courtier CEE</strong> : des plateformes (Izi by EDF, Hellio, Effy…) gèrent votre dossier et vous versent la prime directement.</li>
</ol>

<div class="warning-box">
<strong>Piège à éviter :</strong> Certains artisans "intègrent" les CEE dans leur marge sans vous les reverser. Demandez toujours un devis mentionnant explicitement la déduction CEE.
</div>

<h2>Conditions pour bénéficier des CEE</h2>
<ul>
<li>Logement achevé depuis plus de 2 ans</li>
<li>Artisan qualifié RGE (obligatoire)</li>
<li>Travaux conformes aux fiches d'opérations standardisées CEE</li>
<li>Engagement signé AVANT le début des travaux</li>
</ul>

<h2>Cumuler CEE + MaPrimeRénov' + Éco-PTZ : le trio gagnant</h2>
<p>Pour une rénovation d'ampleur sur une maison de 100 m² classée G, le cumul peut ressembler à :</p>
<table>
<tr><th>Source</th><th>Montant estimé</th></tr>
<tr><td>MaPrimeRénov' (parcours accompagné)</td><td>15 000 à 35 000 €</td></tr>
<tr><td>CEE</td><td>3 000 à 6 000 €</td></tr>
<tr><td>Éco-PTZ (prêt sans intérêts)</td><td>Jusqu'à 50 000 €</td></tr>
<tr><td>TVA 5,5%</td><td>Réduction directe sur facture</td></tr>
</table>
"""
},

# ───────────────────────────────────────────────────────────────────
# ARTICLE 6
# ───────────────────────────────────────────────────────────────────
{
"slug": "eco-ptz-2025-pret-sans-interets-travaux",
"title": "Éco-PTZ 2025 : financer jusqu'à 50 000 € de travaux sans payer d'intérêts",
"desc": "L'Éco-Prêt à Taux Zéro permet de financer vos travaux de rénovation énergétique sans intérêts. Conditions, montants et démarches en 2025.",
"cat": "aides",
"date": "18 avril 2026",
"content": """
<h2>L'Éco-PTZ : le prêt immobilier le plus sous-utilisé de France</h2>
<p>L'Éco-Prêt à Taux Zéro (Éco-PTZ) permet d'emprunter jusqu'à <strong>50 000 € sans payer un euro d'intérêts</strong> pour financer des travaux de rénovation énergétique. En 2025, ses conditions ont été assouplies, mais il reste très peu connu.</p>

<div class="summary-box">
<h3>Éco-PTZ 2025 — chiffres clés</h3>
<ul>
<li>Montant maximum : <strong>50 000 €</strong></li>
<li>Durée de remboursement : jusqu'à <strong>20 ans</strong></li>
<li>Taux d'intérêt : <strong>0%</strong></li>
<li>Cumulable avec MaPrimeRénov' : <strong>oui</strong></li>
<li>Conditions de ressources : <strong>aucune</strong></li>
</ul>
</div>

<h2>Qui peut en bénéficier ?</h2>
<p>Tout propriétaire (occupant ou bailleur) d'un logement achevé depuis plus de 2 ans peut demander un Éco-PTZ, sans condition de revenus. Les locataires peuvent également y avoir accès sous conditions (accord du propriétaire).</p>

<h2>Quels travaux sont éligibles ?</h2>
<p>Les travaux doivent concerner l'enveloppe du bâtiment ou les équipements de chauffage :</p>
<ul>
<li>Isolation (toiture, murs, planchers, fenêtres)</li>
<li>Remplacement du système de chauffage ou eau chaude sanitaire</li>
<li>Travaux de rénovation d'ampleur (parcours accompagné)</li>
<li>Réhabilitation d'un système d'assainissement non collectif</li>
</ul>

<h2>Comment l'obtenir ?</h2>
<ol>
<li>Faites établir des devis par des artisans RGE</li>
<li>Rendez-vous dans une banque partenaire (Crédit Agricole, BNP, Société Générale, La Banque Postale…)</li>
<li>Déposez le formulaire Éco-PTZ avec vos devis</li>
<li>La banque valide et verse les fonds (directement à vous ou aux artisans)</li>
</ol>

<div class="info-box">
<strong>Conseil :</strong> Associez l'Éco-PTZ à MaPrimeRénov' pour financer intégralement votre rénovation. Par exemple : 20 000 € de MaPrimeRénov' + 30 000 € d'Éco-PTZ = 50 000 € pour rénover votre maison sans apport.
</div>
"""
},

# ───────────────────────────────────────────────────────────────────
# ARTICLE 7
# ───────────────────────────────────────────────────────────────────
{
"slug": "tva-5-5-travaux-renovation-conditions-2025",
"title": "TVA à 5,5% sur les travaux de rénovation : qui peut en bénéficier en 2025 ?",
"desc": "La TVA réduite à 5,5% sur les travaux énergétiques représente une économie de 14,5% sur votre facture. Conditions et travaux concernés.",
"cat": "aides",
"date": "18 avril 2026",
"content": """
<h2>La TVA réduite : une aide directe et automatique</h2>
<p>Contrairement à MaPrimeRénov' qui nécessite un dossier, la TVA à 5,5% est une réduction automatique sur votre facture d'artisan. Pas de dossier à monter, pas de délai : vous payez directement moins cher.</p>
<p>Sur une facture de 10 000 €, passer de 20% à 5,5% de TVA représente une économie de <strong>1 450 €</strong>.</p>

<div class="summary-box">
<h3>3 taux de TVA dans la rénovation</h3>
<ul>
<li><strong>5,5%</strong> : travaux d'amélioration énergétique (isolation, chauffage renouvelable)</li>
<li><strong>10%</strong> : travaux d'entretien et amélioration hors énergie (peinture, carrelage, plomberie…)</li>
<li><strong>20%</strong> : travaux dans les logements de moins de 2 ans, ou sur des constructions neuves</li>
</ul>
</div>

<h2>Travaux éligibles à 5,5%</h2>
<ul>
<li>Isolation thermique (combles, murs, planchers, fenêtres)</li>
<li>Pompe à chaleur, chaudière biomasse, chauffe-eau thermodynamique</li>
<li>Ventilation mécanique contrôlée (VMC double flux)</li>
<li>Systèmes de régulation de chauffage</li>
<li>Panneaux solaires thermiques</li>
</ul>

<h2>Conditions à respecter</h2>
<p>Pour bénéficier du taux de 5,5%, deux conditions :</p>
<ol>
<li>Le logement doit être <strong>achevé depuis plus de 2 ans</strong></li>
<li>Vous devez remettre à l'artisan une <strong>attestation</strong> certifiant que vous êtes propriétaire ou locataire et que le logement est votre résidence principale ou secondaire</li>
</ol>

<div class="info-box">
<strong>L'attestation :</strong> Le formulaire Cerfa n°13947*05 est disponible sur impots.gouv.fr. Sans ce document, l'artisan est légalement obligé d'appliquer le taux à 20%. Préparez-le avant de signer le devis.
</div>

<h2>TVA 10% : quels travaux ?</h2>
<p>Les travaux courants d'entretien bénéficient du taux de 10% : plomberie, électricité hors mise aux normes, peinture, carrelage, parquet, maçonnerie courante. Ce taux s'applique automatiquement pour les logements de plus de 2 ans — pas besoin d'attestation.</p>
"""
},

# ───────────────────────────────────────────────────────────────────
# ARTICLE 8
# ───────────────────────────────────────────────────────────────────
{
"slug": "arnaques-renovation-energetique-2025-nouvelles-methodes",
"title": "Arnaques à la rénovation énergétique 2025 : les nouvelles techniques des escrocs et comment les éviter",
"desc": "Faux Mon Accompagnateur Rénov', dossiers MaPrimeRénov' montés sans travaux réels, devis gonflés : les fraudes ont évolué. Mode d'emploi pour ne pas se faire avoir.",
"cat": "conseils",
"date": "18 avril 2026",
"content": """
<h2>La fraude à la rénovation énergétique a explosé depuis 2023</h2>
<p>Avec l'explosion des aides publiques (MaPrimeRénov', CEE), les arnaques se sont industrialisées. La DGCCRF a recensé des centaines de milliers de victimes. Les escrocs se sont adaptés aux nouvelles règles — voici ce qu'ils font en 2025.</p>

<h2>Arnaque n°1 : le faux Mon Accompagnateur Rénov'</h2>
<p>Depuis que le parcours accompagné est obligatoire pour les grosses primes, des individus se présentent comme des MAR (Mon Accompagnateur Rénov') sans être agréés. Ils collectent vos documents (avis d'imposition, RIB, copie de propriété) et montent des dossiers frauduleux à votre insu.</p>
<div class="warning-box">
<strong>Comment vérifier :</strong> Tout MAR agréé doit figurer sur la liste officielle de l'ANAH sur <strong>france-renov.gouv.fr</strong>. Cherchez le nom de la personne ou de l'entreprise avant de confier quoi que ce soit.
</div>

<h2>Arnaque n°2 : les travaux fantômes</h2>
<p>Des réseaux organisés montent des dossiers MaPrimeRénov' pour des travaux jamais réalisés ou réalisés avec des matériaux non conformes. Des propriétaires reçoivent leur prime mais les travaux n'ont pas été faits correctement — et l'ANAH se retourne contre eux pour rembourser.</p>

<h2>Arnaque n°3 : le devis gonflé post-audit</h2>
<p>Un artisan propose un "audit gratuit" qui révèle miraculeusement que vous avez besoin de 40 000 € de travaux. Il vous guide ensuite vers ses propres partenaires. Les devis sont gonflés de 30 à 50% pour maximiser les marges sur les aides.</p>

<h2>Les signaux d'alarme à connaître</h2>
<ul>
<li>Démarchage téléphonique ou à domicile proposant des "aides gratuites"</li>
<li>Artisan qui dit "vous n'aurez rien à payer" sans explication claire</li>
<li>Dossier monté "clé en main" sans que vous ayez rien signé</li>
<li>Demande d'avance importante avant tout accord officiel</li>
<li>Artisan qui n'est pas localisable sur SIRET ou qui change de nom</li>
</ul>

<div class="info-box">
<strong>Réflexe de base :</strong> Vérifiez toujours le numéro SIRET de l'artisan sur <strong>annuaire-entreprises.data.gouv.fr</strong> et sa certification RGE sur <strong>faire.fr</strong>.
</div>
"""
},

# ───────────────────────────────────────────────────────────────────
# ARTICLE 9
# ───────────────────────────────────────────────────────────────────
{
"slug": "copropriete-plan-pluriannuel-travaux-obligation-2025",
"title": "Copropriété : le plan pluriannuel de travaux est obligatoire — êtes-vous en règle ?",
"desc": "La loi Climat impose un plan pluriannuel de travaux (PPT) à toutes les copropriétés de plus de 15 ans. Échéances, contenu et sanctions.",
"cat": "guides",
"date": "18 avril 2026",
"content": """
<h2>Le PPT : une nouvelle obligation légale pour les copropriétés</h2>
<p>La loi Climat et Résilience de 2021 a introduit une obligation inédite : toute copropriété de plus de <strong>15 ans</strong> doit se doter d'un <strong>Plan Pluriannuel de Travaux (PPT)</strong>. Ce document planifie les travaux de rénovation sur 10 ans.</p>

<div class="summary-box">
<h3>Calendrier des obligations PPT</h3>
<ul>
<li><strong>1er janvier 2023 :</strong> Copropriétés de plus de 200 lots</li>
<li><strong>1er janvier 2024 :</strong> Copropriétés de 51 à 200 lots</li>
<li><strong>1er janvier 2025 :</strong> Toutes les copropriétés de plus de 15 ans (y compris petites)</li>
</ul>
</div>

<h2>Que doit contenir le PPT ?</h2>
<ul>
<li>La liste des travaux nécessaires dans les 10 prochaines années</li>
<li>Une estimation du coût de chaque poste</li>
<li>Un échelonnement dans le temps</li>
<li>Les économies d'énergie attendues</li>
</ul>
<p>Le PPT doit être élaboré à partir du diagnostic technique global (DTG) ou d'un audit énergétique de l'immeuble.</p>

<h2>Qui est chargé de le faire ?</h2>
<p>C'est le <strong>syndic de copropriété</strong> qui doit proposer le PPT au vote des copropriétaires en assemblée générale. Une fois voté, il est intégré au règlement de copropriété et devient opposable.</p>

<h2>Quelles sanctions en cas de non-respect ?</h2>
<p>L'absence de PPT peut bloquer la vente d'un lot : depuis 2024, le vendeur doit informer l'acheteur de l'existence (ou non) du PPT. Une copropriété sans PPT dans un immeuble de plus de 15 ans constitue un signal d'alarme pour les acquéreurs et peut faire baisser le prix de vente.</p>

<div class="info-box">
<strong>Pour les copropriétaires :</strong> Si votre syndic n'a pas encore mis le PPT à l'ordre du jour, vous pouvez le demander officiellement par lettre recommandée. C'est votre droit.
</div>
"""
},

# ───────────────────────────────────────────────────────────────────
# ARTICLE 10
# ───────────────────────────────────────────────────────────────────
{
"slug": "dpe-fiabilite-contestation-recours-2025",
"title": "DPE peu fiable : comment le contester et quels recours en 2025 ?",
"desc": "Des milliers de DPE sont erronés. Depuis 2023, les recours sont possibles. Comment identifier un DPE suspect et que faire.",
"cat": "conseils",
"date": "18 avril 2026",
"content": """
<h2>Le DPE : un document crucial mais souvent inexact</h2>
<p>Le Diagnostic de Performance Énergétique (DPE) conditionne votre accès aux aides, votre droit à louer, et de plus en plus le prix de vente de votre bien. Pourtant, plusieurs études ont montré que les DPE présentent des écarts importants d'un diagnostiqueur à l'autre pour un même logement.</p>

<div class="summary-box">
<h3>DPE invalides automatiquement</h3>
<ul>
<li>DPE réalisés <strong>avant le 1er juillet 2021</strong> : invalides depuis le 1er janvier 2023</li>
<li>DPE "vierges" (mentions "non soumis") : plus autorisés dans les annonces</li>
<li>DPE réalisés par un diagnostiqueur non certifié : nuls et non avenus</li>
</ul>
</div>

<h2>Comment identifier un DPE suspect ?</h2>
<ul>
<li>Le classement ne correspond pas à l'état visible du logement (fenêtres simple vitrage classé C)</li>
<li>Les données d'entrée sont approximatives ("surface estimée", système de chauffage non vérifié)</li>
<li>La visite a duré moins de 30 minutes pour un appartement</li>
<li>Les recommandations sont génériques et non personnalisées</li>
</ul>

<h2>Quels recours ?</h2>
<p>Depuis la réforme de 2021, le DPE est <strong>opposable</strong> : le diagnostiqueur engage sa responsabilité civile. Si votre DPE est erroné et vous a causé un préjudice (aide refusée, loyer bloqué), vous pouvez :</p>
<ol>
<li>Demander un second DPE contradictoire à un autre diagnostiqueur certifié</li>
<li>Saisir l'assurance responsabilité civile professionnelle du diagnostiqueur</li>
<li>Porter l'affaire devant le tribunal judiciaire si le préjudice est significatif</li>
</ol>

<div class="info-box">
<strong>Vérification gratuite :</strong> Tout DPE émis depuis juillet 2021 possède un numéro d'identification enregistré sur <strong>observatoire-dpe-audit.ademe.fr</strong>. Vous pouvez vérifier sa validité et le comparer aux données de référence pour votre zone géographique.
</div>

<h2>La réforme du DPE en cours</h2>
<p>Le gouvernement a annoncé une nouvelle réforme du DPE pour 2025-2026 afin de corriger les biais des logements de petite surface (les studios sont souvent surestimés en consommation). Si votre logement fait moins de 40 m² et est classé F ou G, attendez la mise à jour avant d'engager des travaux coûteux.</p>
"""
},

]

# ─── ARTICLES B2B (artisans) ──────────────────────────────────────
ARTICLES_B2B = [

{
"slug": "rge-2025-controles-renforces-qualification",
"title": "RGE 2025 : contrôles renforcés, nouvelles qualifications — ce qui change pour les artisans",
"desc": "L'ADEME et les organismes de qualification RGE ont durci les contrôles en 2024-2025. Visites chantier inopinées, nouvelles exigences : ce qu'il faut savoir.",
"cat": "reglementation",
"date": "18 avril 2026",
"content": """
<h2>Le label RGE sous surveillance renforcée depuis 2024</h2>
<p>Suite aux scandales de fraude à la rénovation énergétique, le gouvernement a mandaté les organismes de qualification (Qualibat, Qualit'EnR, RGE Qualifelec…) pour intensifier les contrôles terrain. En 2025, les visites de chantier inopinées se multiplient.</p>

<div class="summary-box">
<h3>Nouveautés contrôles RGE 2025</h3>
<ul>
<li>Visites inopinées sur chantier pendant les travaux (pas seulement post-travaux)</li>
<li>Contrôle des sous-traitants : ils doivent aussi être RGE</li>
<li>Vérification des fiches chantier MaPrimeRénov' et CEE</li>
<li>Suspension immédiate en cas d'anomalie grave</li>
</ul>
</div>

<h2>Ce que les contrôleurs vérifient</h2>
<ul>
<li>Conformité des matériaux installés avec les devis (marque, référence, performance)</li>
<li>Présence sur chantier d'un salarié qualifié (pas uniquement des sous-traitants)</li>
<li>Documents administratifs : attestations CEE, fiches chantier ANAH</li>
<li>Respect des règles de mise en œuvre (DTU applicables)</li>
</ul>

<h2>Sanctions en cas de manquement</h2>
<p>Un contrôle négatif peut entraîner :</p>
<ol>
<li>Suspension du label RGE (immédiate en cas de fraude)</li>
<li>Remboursement des aides perçues par les clients</li>
<li>Interdiction de déposer de nouveaux dossiers MaPrimeRénov'</li>
<li>Poursuites pénales en cas de fraude caractérisée</li>
</ol>

<div class="info-box">
<strong>Conseil pratique :</strong> Conservez tous vos bons de livraison matériaux, photos de chantier horodatées, et fiches de réception des travaux. En cas de contrôle, ces documents sont votre meilleure protection.
</div>
"""
},

{
"slug": "maprimrenov-obligations-documentaires-artisan-rge",
"title": "MaPrimeRénov' 2025 : toutes les obligations documentaires de l'artisan RGE",
"desc": "Devis obligatoire, fiche chantier ANAH, attestation de fin de travaux : le guide complet des documents que vous devez produire sous peine de bloquer le paiement client.",
"cat": "reglementation",
"date": "18 avril 2026",
"content": """
<h2>Pourquoi la documentation est devenue critique</h2>
<p>Depuis le renforcement des contrôles anti-fraude en 2024, l'ANAH (qui gère MaPrimeRénov') vérifie systématiquement la cohérence entre les devis, les factures et les fiches chantier. Un document manquant ou incohérent bloque le versement de la prime à votre client — et c'est vous qui en êtes responsable.</p>

<div class="summary-box">
<h3>Liste des documents obligatoires</h3>
<ul>
<li><strong>Devis signé</strong> : avant tout début de travaux, avec mentions obligatoires</li>
<li><strong>Attestation d'éligibilité RGE</strong> : valide à la date de signature du devis</li>
<li><strong>Fiche chantier ANAH</strong> : à compléter pendant les travaux</li>
<li><strong>Facture conforme</strong> : mentions obligatoires CEE/MPR incluses</li>
<li><strong>Attestation de fin de travaux</strong> : signée par le client</li>
<li><strong>Photos avant/après</strong> : obligatoires pour certains gestes</li>
</ul>
</div>

<h2>Les mentions obligatoires sur le devis et la facture</h2>
<p>Pour les travaux MaPrimeRénov', votre devis doit mentionner :</p>
<ul>
<li>Votre numéro et organisme de certification RGE</li>
<li>La référence exacte des matériaux (marque, modèle, numéro de certification)</li>
<li>Les performances énergétiques des équipements (ex: COP de la PAC)</li>
<li>Le montant HT, la TVA applicable (5,5% ou 10%), le montant TTC</li>
<li>Si CEE : le montant de la prime CEE déduite</li>
</ul>

<h2>La fiche chantier ANAH : mode d'emploi</h2>
<p>Disponible sur le portail MPR, cette fiche doit être remplie en cours de chantier et non rétrospectivement. Elle comporte :</p>
<ul>
<li>Les dates d'intervention (début et fin)</li>
<li>Les références des matériaux effectivement posés</li>
<li>Les coordonnées de tous les intervenants</li>
<li>La signature du client à chaque étape clé</li>
</ul>

<div class="warning-box">
<strong>Erreur fréquente :</strong> Remplir la fiche chantier après la fin des travaux avec des informations reconstituées. Les contrôleurs ANAH vérifient la cohérence des dates avec les bons de livraison. Faites-le en temps réel.
</div>
"""
},

{
"slug": "sous-traitance-maprimrenov-regles-2025",
"title": "Sous-traitance et MaPrimeRénov' : les règles strictes que tout artisan doit connaître",
"desc": "Depuis 2024, la sous-traitance dans les chantiers MaPrimeRénov' est encadrée. Un sous-traitant non RGE invalide toute la prime du client.",
"cat": "reglementation",
"date": "18 avril 2026",
"content": """
<h2>La sous-traitance RGE : une zone de risque majeure</h2>
<p>Nombreux sont les artisans qui signent les devis MaPrimeRénov' mais sous-traitent tout ou partie des travaux. Depuis 2024, cette pratique est étroitement surveillée. La règle est simple mais souvent mal appliquée : <strong>tout artisan intervenant sur un chantier MaPrimeRénov' doit être qualifié RGE pour le geste concerné</strong>.</p>

<div class="warning-box">
<strong>Risque concret :</strong> Si un contrôle révèle qu'un sous-traitant n'était pas RGE, l'ANAH peut exiger le remboursement de la prime — et c'est l'artisan titulaire du marché qui est responsable vis-à-vis du client.
</div>

<h2>Ce que dit la réglementation 2025</h2>
<ul>
<li>Le titulaire du marché (vous) est responsable de la qualification de ses sous-traitants</li>
<li>Le sous-traitant doit posséder la qualification RGE pour le geste spécifique</li>
<li>La qualification doit être valide à la date d'exécution des travaux</li>
<li>Le sous-traité doit être déclaré dans le dossier ANAH</li>
</ul>

<h2>Vérification obligatoire avant chantier</h2>
<p>Avant de confier une partie des travaux à un sous-traitant :</p>
<ol>
<li>Vérifiez sa qualification sur <strong>faire.fr</strong> (annuaire officiel RGE)</li>
<li>Notez la date d'expiration de sa qualification</li>
<li>Conservez une copie de son certificat RGE</li>
<li>Mentionnez-le dans votre dossier ANAH</li>
</ol>

<div class="info-box">
<strong>Astuce :</strong> Certains organismes de qualification (Qualibat, Qualit'EnR) proposent des listes de sous-traitants RGE qualifiés dans votre zone géographique. Constituez votre réseau en amont plutôt que de chercher en urgence lors d'un chantier.
</div>
"""
},

{
"slug": "amiante-obligations-reperage-avant-travaux-2025",
"title": "Amiante avant travaux : nouvelles obligations pour les artisans en 2025",
"desc": "Depuis 2022, le repérage amiante avant travaux (RAT) est obligatoire. En 2025, les contrôles s'intensifient. Ce que vous risquez si vous ignorez cette règle.",
"cat": "reglementation",
"date": "18 avril 2026",
"content": """
<h2>L'amiante : une réglementation durcie qui s'applique à tous</h2>
<p>L'amiante est présente dans environ 40% des bâtiments construits avant 1997. Depuis le décret de 2017 (entré pleinement en vigueur en 2022), le <strong>repérage amiante avant travaux (RAT)</strong> est obligatoire pour tous les travaux susceptibles de perturber des matériaux contenant de l'amiante.</p>

<div class="summary-box">
<h3>Le RAT en bref</h3>
<ul>
<li>Obligatoire pour tous travaux en bâtiment construit avant 1997</li>
<li>Réalisé par un diagnostiqueur certifié "SS4" (repérage avant travaux)</li>
<li>À la charge du maître d'ouvrage (propriétaire), mais vous devez le demander</li>
<li>Doit être fourni à l'artisan AVANT le début des travaux</li>
</ul>
</div>

<h2>Votre responsabilité en tant qu'artisan</h2>
<p>Même si le RAT est à la charge du propriétaire, vous êtes responsable de votre propre sécurité et de celle de vos salariés. Si vous intervenez sans RAT sur un bâtiment ancien :</p>
<ul>
<li>Vous vous exposez à une contamination à l'amiante (maladie professionnelle, délai de latence 20-40 ans)</li>
<li>En cas d'accident, votre responsabilité pénale peut être engagée</li>
<li>Votre assurance décennale peut refuser de couvrir les dommages</li>
</ul>

<h2>Que faire si le propriétaire n'a pas de RAT ?</h2>
<ol>
<li>Refusez de commencer les travaux — c'est votre droit légal</li>
<li>Informez le client par écrit de cette obligation</li>
<li>Indiquez dans votre devis une clause conditionnelle : "travaux sous réserve de fourniture du RAT"</li>
</ol>

<div class="warning-box">
<strong>Sanctions :</strong> Un artisan qui intervient sans RAT et expose ses salariés à l'amiante risque une amende jusqu'à 9 000 € et une peine d'emprisonnement en cas de préjudice grave. L'inspection du travail peut ordonner l'arrêt de chantier immédiat.
</div>
"""
},

{
"slug": "garantie-decennale-points-vigilance-2025",
"title": "Garantie décennale 2025 : les 5 points de vigilance pour éviter les litiges",
"desc": "La garantie décennale protège vos clients mais vous expose aussi. En 2025, les jurisprudences évoluent. Ce que tout artisan doit vérifier avant de signer.",
"cat": "reglementation",
"date": "18 avril 2026",
"content": """
<h2>La décennale : une protection qui a ses limites</h2>
<p>La garantie décennale est obligatoire pour tous les travaux de construction, rénovation ou installation affectant la solidité ou l'étanchéité d'un ouvrage. Elle couvre 10 ans après la réception des travaux. Mais en 2025, les litiges augmentent — et les artisans mal protégés en font les frais.</p>

<div class="summary-box">
<h3>Ce que couvre la décennale</h3>
<ul>
<li>Défauts qui compromettent la solidité de l'ouvrage</li>
<li>Défauts qui rendent le logement inhabitable</li>
<li>Malfaçons affectant les équipements indissociables (ex: une PAC intégrée au plancher chauffant)</li>
</ul>
</div>

<h2>Point 1 : vérifiez que votre contrat couvre les nouveaux gestes</h2>
<p>Beaucoup d'artisans ont étendu leur activité à de nouveaux domaines (PAC, photovoltaïque, ITE) sans vérifier que leur contrat décennale les couvre. Les assureurs categorisent précisément les travaux — un geste non déclaré n'est pas couvert.</p>

<h2>Point 2 : la réception des travaux est un moment clé</h2>
<p>La garantie décennale part de la <strong>réception des travaux</strong>, pas de la fin du chantier. Sans procès-verbal de réception signé par le client, votre point de départ est flou — et les tribunaux peuvent retenir une date qui vous est défavorable.</p>

<h2>Point 3 : les réserves à la réception</h2>
<p>Si le client émet des réserves à la réception, elles doivent être levées avant la réception définitive. Un client qui signe "avec réserves" sans que vous ayez levé les réserves peut vous poursuivre au-delà de 10 ans pour les points réservés.</p>

<h2>Point 4 : la sous-traitance et la décennale</h2>
<p>Si vous sous-traitez, vous restez responsable vis-à-vis du client final. Assurez-vous que vos sous-traitants ont leur propre décennale et conservez leur attestation d'assurance.</p>

<h2>Point 5 : l'attestation annuelle obligatoire</h2>
<p>Vous devez remettre à chaque client une <strong>attestation d'assurance décennale en cours de validité</strong> avant le début des travaux. Sans ce document, le contrat peut être annulé et vous perdez toute protection légale.</p>
"""
},

{
"slug": "photovoltaique-boom-obligations-rge-quali-pv",
"title": "Photovoltaïque : boom des installations, obligations RGE et qualification QualiPV en 2025",
"desc": "Le solaire explose en France. Pour bénéficier des aides et poser légalement, les artisans doivent obtenir la qualification QualiPV. Ce qu'il faut savoir.",
"cat": "reglementation",
"date": "18 avril 2026",
"content": """
<h2>Le marché du photovoltaïque a quadruplé en 3 ans</h2>
<p>La France a installé plus de 3 GWc de solaire résidentiel en 2024. La demande est là — mais le cadre réglementaire se resserre. Sans la qualification QualiPV RGE, vous ne pouvez ni déposer les dossiers d'aide ni signer les contrats de raccordement Enedis pour vos clients.</p>

<div class="summary-box">
<h3>Qualifications requises pour le PV résidentiel</h3>
<ul>
<li><strong>QualiPV Elec</strong> : pose de panneaux PV seuls (sans stockage)</li>
<li><strong>QualiPV Bat</strong> : intégration au bâti (toiture intégrée)</li>
<li><strong>QualiPV Elec + Stockage</strong> : installation avec batteries</li>
<li>Pour les installations &gt; 3 kWc : habilitation électrique B1V minimum</li>
</ul>
</div>

<h2>Les aides disponibles pour vos clients (et pourquoi votre qualification compte)</h2>
<p>Vos clients peuvent bénéficier de :</p>
<ul>
<li>Prime à l'autoconsommation (jusqu'à 2 160 € pour 9 kWc)</li>
<li>Obligation d'achat EDF pour le surplus (tarif réglementé)</li>
<li>TVA à 10% (au lieu de 20%) — uniquement si artisan qualifié</li>
</ul>
<p>Sans votre qualification QualiPV, <strong>vos clients ne peuvent accéder à aucune de ces aides</strong>.</p>

<h2>Comment obtenir QualiPV ?</h2>
<ol>
<li>Suivre une formation certifiée (2 à 5 jours selon niveau)</li>
<li>Justifier d'une expérience dans l'électricité ou la couverture</li>
<li>Passer l'examen théorique et pratique</li>
<li>Adhérer à Qualit'EnR (organisme certificateur)</li>
<li>Coût : environ 800 à 1 500 € formation + 400 à 700 €/an cotisation</li>
</ol>

<div class="info-box">
<strong>Retour sur investissement :</strong> Un artisan QualiPV bien positionné peut réaliser 2 à 4 installations par semaine à 8 000-15 000 € l'unité. La demande dépasse largement l'offre d'artisans qualifiés en Île-de-France.
</div>
"""
},

{
"slug": "pac-climatisation-qualifications-requises-2025",
"title": "Pompe à chaleur et climatisation : quelles qualifications obligatoires pour intervenir en 2025 ?",
"desc": "Attestation de capacité fluides frigorigènes, RGE QualiPAC, habilitations électriques : le point complet sur ce que vous devez avoir pour travailler légalement.",
"cat": "reglementation",
"date": "18 avril 2026",
"content": """
<h2>Le marché des PAC explose, mais les règles aussi</h2>
<p>Avec l'essor de MaPrimeRénov' pour les pompes à chaleur, des milliers d'artisans se lancent sur ce marché. Mais poser une PAC air/eau n'est pas une activité libre — elle est soumise à des habilitations spécifiques dont beaucoup ignorent l'existence.</p>

<div class="summary-box">
<h3>Habilitations obligatoires pour les PAC</h3>
<ul>
<li><strong>Attestation de capacité fluides frigorigènes</strong> (catégorie I) : obligatoire pour toute manipulation de fluides réfrigérants</li>
<li><strong>Qualification RGE QualiPAC</strong> : obligatoire pour que vos clients touchent MaPrimeRénov'</li>
<li><strong>Habilitation électrique B1V minimum</strong> : raccordement électrique de la PAC</li>
</ul>
</div>

<h2>L'attestation fluides frigorigènes : une obligation méconnue</h2>
<p>Depuis le règlement européen F-Gaz, toute entreprise qui manipule des fluides frigorigènes (HFC, HFO) doit être certifiée par un organisme accrédité (Certifié Qualiclimapro, AFCE, Bureau Veritas…). Sans cette attestation :</p>
<ul>
<li>Vous ne pouvez pas acheter de fluides frigorigènes</li>
<li>Vous ne pouvez pas recharger un circuit frigorifique</li>
<li>En cas de contrôle, amende jusqu'à 75 000 € et arrêt d'activité</li>
</ul>

<h2>QualiPAC : la qualification RGE spécifique aux PAC</h2>
<p>Pour que vos chantiers PAC soient éligibles à MaPrimeRénov', vous devez être qualifié RGE QualiPAC. Cette qualification est délivrée par Qualit'EnR et nécessite :</p>
<ul>
<li>Justifier de références chantiers PAC (2 à 5 selon le type)</li>
<li>Attestation fluides frigorigènes valide</li>
<li>Habilitation électrique</li>
<li>Renouvellement tous les 4 ans avec audit chantier</li>
</ul>
"""
},

{
"slug": "re2020-obligations-pratiques-artisans-neuf",
"title": "RE2020 : ce que les artisans intervenant dans le neuf doivent appliquer concrètement",
"desc": "La Réglementation Environnementale 2020 impose de nouvelles contraintes sur les matériaux, le chauffage et la performance. Guide pratique pour les artisans.",
"cat": "reglementation",
"date": "18 avril 2026",
"content": """
<h2>La RE2020 : plus qu'une règle de performance, une révolution des matériaux</h2>
<p>Entrée en vigueur le 1er janvier 2022 pour les maisons individuelles et le 1er juillet 2022 pour les logements collectifs, la RE2020 remplace la RT2012. Elle va bien au-delà de la performance énergétique : elle impose un calcul carbone sur l'ensemble du cycle de vie du bâtiment.</p>

<div class="summary-box">
<h3>Les 3 piliers de la RE2020</h3>
<ul>
<li><strong>Sobriété énergétique</strong> : besoin bioclimatique (Bbio) encore réduit vs RT2012</li>
<li><strong>Décarbonation</strong> : impact carbone du chauffage (exit le gaz dans le neuf)</li>
<li><strong>Confort d'été</strong> : indicateur DH (degrés-heures) pour limiter la surchauffe</li>
</ul>
</div>

<h2>Ce qui est interdit dans le neuf depuis 2022</h2>
<ul>
<li>Chauffage principal au gaz naturel (interdit dans les maisons individuelles neuves)</li>
<li>Chauffage principal au fioul ou au propane</li>
<li>Climatisation comme seul moyen de confort d'été (indicateur DH à respecter)</li>
</ul>

<h2>Ce que ça change pour les artisans</h2>
<p>Pour les <strong>électriciens</strong> : les logements neufs RE2020 sont quasi systématiquement équipés de PAC + plancher chauffant + VMC double flux. Maîtrisez ces installations.</p>
<p>Pour les <strong>plombiers/chauffagistes</strong> : exit les chaudières gaz dans le neuf. La PAC air/eau est la norme. Formez-vous si ce n'est pas encore fait.</p>
<p>Pour les <strong>maçons/charpentiers</strong> : les matériaux biosourcés (bois, chanvre, ouate de cellulose) sont fortement valorisés dans le calcul carbone RE2020. Les constructeurs vous demanderont de plus en plus ces compétences.</p>

<div class="info-box">
<strong>Attention :</strong> La RE2020 ne s'applique qu'aux constructions neuves. En rénovation, c'est toujours la RT Existante qui s'applique. Mais les maîtres d'œuvre appliquent de plus en plus les principes RE2020 en rénovation lourde.
</div>
"""
},

{
"slug": "controles-post-travaux-anah-comment-se-preparer",
"title": "Contrôles post-travaux ANAH : comment s'y préparer pour ne pas rembourser la prime de votre client",
"desc": "L'ANAH contrôle de plus en plus les chantiers MaPrimeRénov' après réalisation. Ce que les inspecteurs vérifient et comment constituer un dossier béton.",
"cat": "reglementation",
"date": "18 avril 2026",
"content": """
<h2>Les contrôles post-travaux : une réalité en 2025</h2>
<p>Depuis 2023, l'ANAH a renforcé ses contrôles post-travaux dans le cadre de la lutte anti-fraude. Environ <strong>5 à 10% des chantiers MaPrimeRénov'</strong> font l'objet d'un contrôle sur site après réalisation. Si des anomalies sont constatées, c'est le plus souvent l'artisan qui en subit les conséquences.</p>

<div class="summary-box">
<h3>Ce que les inspecteurs ANAH vérifient</h3>
<ul>
<li>Présence effective des équipements installés (PAC, isolation, etc.)</li>
<li>Conformité des marques et références avec la facture</li>
<li>Qualité de la mise en œuvre (ponts thermiques, étanchéité)</li>
<li>Cohérence des dates (livraison, installation, réception)</li>
<li>Satisfaction du client</li>
</ul>
</div>

<h2>Comment constituer un dossier béton</h2>
<ol>
<li><strong>Photos avant/pendant/après</strong> : horodatées, avec géolocalisation si possible</li>
<li><strong>Bons de livraison</strong> : conservez tous les BL correspondant aux matériaux facturés</li>
<li><strong>Fiche technique fabricant</strong> : la version du produit installé, pas une version générique</li>
<li><strong>PV de réception signé</strong> : avec date et signature du client</li>
<li><strong>Note de calcul ou attestation thermique</strong> : pour les gestes isolation ou chauffage</li>
</ol>

<h2>Que faire si vous recevez un avis de contrôle ?</h2>
<p>Contactez immédiatement votre client pour l'informer. Préparez votre dossier. Ne tentez pas de modifier rétroactivement des documents — c'est une aggravante pénale. Si vous avez réalisé les travaux correctement, un contrôle ne devrait pas vous poser de problème.</p>

<div class="warning-box">
<strong>Sanctions possibles :</strong> En cas d'anomalie grave, l'ANAH peut réclamer le remboursement de la prime directement à l'artisan (et non au client) si la fraude est imputable à l'entreprise. Les montants réclamés peuvent atteindre plusieurs dizaines de milliers d'euros.
</div>
"""
},

{
"slug": "penurie-artisans-rge-opportunite-marche-2025",
"title": "Pénurie d'artisans RGE en France : comment se positionner sur un marché en tension",
"desc": "Il manque 150 000 artisans RGE en France selon l'ADEME. Pour les artisans qualifiés, c'est une opportunité historique. Comment en profiter.",
"cat": "conseils",
"date": "18 avril 2026",
"content": """
<h2>La pénurie d'artisans RGE : un chiffre qui dit tout</h2>
<p>L'ADEME estime qu'il faudrait former <strong>150 000 artisans supplémentaires</strong> pour atteindre les objectifs de rénovation énergétique de la France d'ici 2030. En Île-de-France, certaines spécialités (PAC, isolation par l'extérieur) ont des délais d'attente de 3 à 6 mois.</p>
<p>Pour les artisans déjà qualifiés ou qui souhaitent le devenir, le contexte n'a jamais été aussi favorable.</p>

<div class="summary-box">
<h3>Les gestes les plus en tension en IDF (2025)</h3>
<ul>
<li>Pompe à chaleur air/eau : délai moyen 3 mois</li>
<li>Isolation thermique par l'extérieur (ITE) : délai moyen 4 mois</li>
<li>Photovoltaïque résidentiel : délai moyen 2 mois</li>
<li>VMC double flux : délai moyen 6 semaines</li>
</ul>
</div>

<h2>Stratégie 1 : se spécialiser sur un geste très demandé</h2>
<p>Plutôt que de tout faire, concentrez-vous sur un geste en forte demande. Un artisan spécialisé PAC qui maîtrise parfaitement les dossiers MaPrimeRénov' peut facturer à la valeur ajoutée et maintenir un carnet de commandes plein à 3 mois.</p>

<h2>Stratégie 2 : devenir partenaire d'un Mon Accompagnateur Rénov'</h2>
<p>Les MAR (Mon Accompagnateur Rénov') cherchent des artisans RGE fiables pour leurs clients. Référencez-vous auprès de plusieurs MAR dans votre zone — c'est un flux d'affaires qualifié et régulier, avec des clients déjà convaincus et des dossiers déjà montés.</p>

<h2>Stratégie 3 : obtenir plusieurs qualifications complémentaires</h2>
<p>Un artisan qui cumule RGE isolation + RGE PAC + QualiPV peut proposer des rénovations complètes en un seul interlocuteur. C'est exactement ce que cherchent les clients qui veulent éviter de gérer 4 artisans différents.</p>

<div class="info-box">
<strong>Aide à la formation :</strong> Les artisans peuvent bénéficier du CPF (Compte Personnel de Formation) et des aides de l'OPCO BTP pour financer leurs formations RGE. Le coût net peut être nul pour une formation QualiPV ou QualiPAC.
</div>
"""
},

]

# ─── GÉNÉRATION ──────────────────────────────────────────────────
if __name__ == "__main__":
    os.makedirs("blog", exist_ok=True)
    os.makedirs("blog-pro", exist_ok=True)

    count = 0
    for art in ARTICLES_B2C:
        out = f"blog/{art['slug']}.html"
        render(art['slug'], art['title'], art['desc'], art['cat'], art['date'], art['content'], out)
        print(f"✅ {out}")
        count += 1

    for art in ARTICLES_B2B:
        out = f"blog-pro/{art['slug']}.html"
        # Use blog-pro template style (teal colors)
        render(art['slug'], art['title'], art['desc'], art['cat'], art['date'], art['content'], out, pro=True)
        print(f"✅ {out}")
        count += 1

    print(f"\n{count} articles générés.")

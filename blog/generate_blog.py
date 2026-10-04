"""
BatiSpot — Générateur de blog SEO automatisé
Génère des articles HTML optimisés pour les recherches artisan + ville.
Publie dans /blog/ avec un index auto-généré.

Usage :
  python3 generate_blog.py                # génère tous les articles manquants
  python3 generate_blog.py --index-only   # re-génère juste l'index
"""

import os
import sys
import json
import re
from datetime import datetime

BASE_DIR = os.path.dirname(__file__)
SITE_DIR = os.path.dirname(BASE_DIR)

ARTICLES = [
    {
        "slug": "trouver-plombier-paris",
        "title": "Comment trouver un plombier de confiance à Paris en 2026",
        "meta_description": "Vous cherchez un plombier fiable à Paris ? Découvrez nos conseils pour trouver un plombier certifié, les tarifs moyens et comment obtenir un devis gratuit.",
        "h1": "Trouver un plombier de confiance à Paris : le guide complet",
        "ville": "Paris",
        "metier": "plombier",
        "keywords": ["plombier paris", "plombier paris pas cher", "plombier urgence paris", "devis plombier paris"],
        "sections": [
            {
                "h2": "Pourquoi est-ce si difficile de trouver un bon plombier à Paris ?",
                "content": """<p>À Paris, la demande en plomberie est massive : fuites, chauffe-eau en panne, rénovation de salle de bain... Pourtant, trouver un artisan fiable reste un casse-tête. Entre les arnaques au dépannage d'urgence et les devis opaques, les Parisiens perdent en moyenne <strong>3 heures</strong> à chercher le bon professionnel.</p>
<p>Les plateformes classiques facturent une commission aux artisans (parfois jusqu'à 20%), ce qui gonfle vos devis. Résultat : vous payez plus cher, et l'artisan gagne moins.</p>"""
            },
            {
                "h2": "Les tarifs moyens d'un plombier à Paris en 2026",
                "content": """<p>Voici les fourchettes de prix constatées à Paris et en Île-de-France :</p>
<table style="width:100%;border-collapse:collapse;margin:20px 0;">
<tr style="background:#F0FDF4;"><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Intervention</th><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Tarif moyen</th></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Dépannage fuite simple</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">150 — 300 €</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Remplacement chauffe-eau</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">800 — 1 500 €</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Rénovation salle de bain complète</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">5 000 — 15 000 €</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Débouchage canalisation</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">100 — 250 €</td></tr>
<tr><td style="padding:10px;">Installation robinetterie</td><td style="padding:10px;">80 — 200 €</td></tr>
</table>
<p><strong>Conseil :</strong> demandez toujours au moins 2 devis avant de vous engager. Sur BatiSpot, les artisans sont vérifiés et vous recevez des devis sous 24h.</p>"""
            },
            {
                "h2": "5 critères pour choisir son plombier à Paris",
                "content": """<ol>
<li><strong>Vérifiez l'assurance décennale</strong> — Obligatoire pour tout artisan du bâtiment. Elle vous protège pendant 10 ans en cas de malfaçon.</li>
<li><strong>Demandez le numéro SIRET</strong> — Un professionnel sérieux est immatriculé. Vous pouvez vérifier sur societe.com ou infogreffe.fr.</li>
<li><strong>Exigez un devis écrit</strong> — Avant toute intervention, un devis détaillé est obligatoire pour les travaux dépassant 150 €.</li>
<li><strong>Consultez les avis clients</strong> — Google, Pages Jaunes, BatiSpot... Les retours d'expérience sont votre meilleur allié.</li>
<li><strong>Méfiez-vous des urgences</strong> — Les "dépanneurs 24h" qui ne donnent pas de devis avant intervention sont souvent les plus chers.</li>
</ol>"""
            },
            {
                "h2": "Comment obtenir un devis plombier gratuit à Paris",
                "content": """<p>Avec <strong>BatiSpot</strong>, c'est simple :</p>
<ol>
<li>Décrivez votre projet de plomberie (fuite, rénovation, installation...)</li>
<li>Recevez jusqu'à 3 devis d'artisans vérifiés dans votre arrondissement</li>
<li>Comparez et choisissez librement — <strong>c'est 100% gratuit et sans engagement</strong></li>
</ol>
<p>Nos plombiers partenaires à Paris sont tous assurés (décennale + RC Pro) et leurs documents sont vérifiés par notre équipe avant activation de leur profil.</p>"""
            },
        ],
    },
    {
        "slug": "trouver-electricien-paris",
        "title": "Électricien à Paris : comment trouver un pro fiable et au bon prix",
        "meta_description": "Besoin d'un électricien à Paris ? Tarifs moyens 2026, critères de choix, normes NF C 15-100. Obtenez un devis gratuit d'électriciens certifiés.",
        "h1": "Électricien à Paris : guide pour trouver le bon artisan",
        "ville": "Paris",
        "metier": "électricien",
        "keywords": ["electricien paris", "electricien paris pas cher", "devis electricien paris", "mise aux normes electrique paris"],
        "sections": [
            {
                "h2": "Pourquoi faire appel à un électricien certifié à Paris",
                "content": """<p>L'électricité n'est pas un domaine où l'on improvise. À Paris, les immeubles anciens (haussmanniens, années 60-70) ont souvent des installations vétustes qui ne respectent plus la norme <strong>NF C 15-100</strong>.</p>
<p>Un électricien qualifié vous garantit :</p>
<ul>
<li>Une installation conforme et sécurisée</li>
<li>Un <strong>certificat de conformité Consuel</strong> obligatoire pour les nouvelles installations</li>
<li>Une assurance décennale en cas de problème</li>
</ul>
<p>Attention : un électricien non certifié peut mettre votre logement en danger et annuler votre assurance habitation en cas de sinistre.</p>"""
            },
            {
                "h2": "Tarifs électricien à Paris : combien ça coûte en 2026",
                "content": """<table style="width:100%;border-collapse:collapse;margin:20px 0;">
<tr style="background:#F0FDF4;"><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Travaux</th><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Tarif moyen</th></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Remplacement tableau électrique</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">800 — 2 000 €</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Mise aux normes appartement</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">3 000 — 8 000 €</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Installation prise / interrupteur</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">50 — 120 €</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Dépannage panne électrique</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">100 — 250 €</td></tr>
<tr><td style="padding:10px;">Rénovation complète (appartement 60m²)</td><td style="padding:10px;">5 000 — 12 000 €</td></tr>
</table>"""
            },
            {
                "h2": "Mise aux normes électriques : est-ce obligatoire ?",
                "content": """<p>La mise aux normes n'est <strong>pas obligatoire</strong> pour un logement existant, sauf dans trois cas :</p>
<ul>
<li><strong>Vente du bien</strong> : le diagnostic électrique est obligatoire si l'installation a plus de 15 ans</li>
<li><strong>Rénovation lourde</strong> : si vous modifiez l'installation, elle doit respecter la norme actuelle</li>
<li><strong>Location</strong> : le logement doit répondre aux critères de décence (pas de fils apparents, disjoncteur fonctionnel)</li>
</ul>
<p>Dans tous les cas, une installation aux normes valorise votre bien et réduit les risques d'incendie de <strong>70%</strong>.</p>"""
            },
            {
                "h2": "Trouver un électricien vérifié à Paris avec BatiSpot",
                "content": """<p>Sur BatiSpot, chaque électricien partenaire est vérifié :</p>
<ul>
<li>Assurance décennale et RC Pro contrôlées</li>
<li>Kbis ou extrait D1 vérifié</li>
<li>Avis clients consultables</li>
</ul>
<p>Décrivez votre projet, recevez des devis sous 24h, comparez et choisissez. <strong>C'est gratuit pour les particuliers.</strong></p>"""
            },
        ],
    },
    {
        "slug": "renovation-maison-bordeaux-guide",
        "title": "Rénovation maison à Bordeaux : prix, artisans et conseils 2026",
        "meta_description": "Projet de rénovation à Bordeaux ? Guide complet : prix au m², artisans recommandés, aides financières. Obtenez des devis gratuits d'artisans vérifiés.",
        "h1": "Rénovation maison à Bordeaux : le guide complet 2026",
        "ville": "Bordeaux",
        "metier": "rénovation",
        "keywords": ["renovation maison bordeaux", "artisan renovation bordeaux", "devis renovation bordeaux", "prix renovation m2 bordeaux"],
        "sections": [
            {
                "h2": "Bordeaux : une ville en plein boom de la rénovation",
                "content": """<p>Avec son classement UNESCO et l'arrivée de la LGV, Bordeaux a vu son marché immobilier exploser. Résultat : de nombreux propriétaires rénovent pour valoriser leur bien ou améliorer leur confort.</p>
<p>Les échoppes bordelaises, les immeubles en pierre de taille du centre-ville et les maisons des quartiers comme <strong>Chartrons, Bastide ou Caudéran</strong> représentent un patrimoine à entretenir avec des artisans qualifiés.</p>"""
            },
            {
                "h2": "Prix de la rénovation au m² à Bordeaux en 2026",
                "content": """<table style="width:100%;border-collapse:collapse;margin:20px 0;">
<tr style="background:#F0FDF4;"><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Type de rénovation</th><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Prix au m²</th></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Rafraîchissement (peinture, sols)</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">200 — 500 €/m²</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Rénovation intermédiaire</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">500 — 1 000 €/m²</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Rénovation lourde (structure, électricité, plomberie)</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">1 000 — 1 800 €/m²</td></tr>
<tr><td style="padding:10px;">Rénovation échoppe bordelaise complète</td><td style="padding:10px;">1 200 — 2 200 €/m²</td></tr>
</table>
<p>Pour une échoppe de 80m² en rénovation complète, prévoyez un budget de <strong>96 000 à 176 000 €</strong>. D'où l'importance de comparer plusieurs devis.</p>"""
            },
            {
                "h2": "Les aides à la rénovation disponibles en Gironde",
                "content": """<p>Plusieurs dispositifs peuvent réduire votre facture :</p>
<ul>
<li><strong>MaPrimeRénov'</strong> — Jusqu'à 90% des travaux d'isolation et de chauffage selon vos revenus</li>
<li><strong>Éco-PTZ</strong> — Prêt à taux zéro jusqu'à 50 000 € pour les travaux énergétiques</li>
<li><strong>Aides de Bordeaux Métropole</strong> — Programme local de rénovation thermique</li>
<li><strong>TVA réduite 5,5%</strong> — Sur les travaux d'amélioration énergétique (au lieu de 10%)</li>
<li><strong>CEE (Certificats d'Économie d'Énergie)</strong> — Primes versées par les fournisseurs d'énergie</li>
</ul>
<p><strong>Important :</strong> pour bénéficier de MaPrimeRénov' et de l'éco-PTZ, vos artisans doivent être certifiés <strong>RGE</strong> (Reconnu Garant de l'Environnement).</p>"""
            },
            {
                "h2": "Trouver des artisans de confiance à Bordeaux",
                "content": """<p>Bordeaux regorge d'artisans compétents, mais comment s'assurer de leur sérieux ?</p>
<p>Sur <strong>BatiSpot</strong>, les artisans bordelais sont vérifiés : assurance décennale, Kbis, certifications RGE. Vous décrivez votre projet et recevez des devis personnalisés sous 24h, gratuitement et sans engagement.</p>
<p>Que ce soit pour rénover votre échoppe à Chartrons ou refaire la toiture de votre maison à Mérignac, nos artisans partenaires couvrent toute la Gironde.</p>"""
            },
        ],
    },
    {
        "slug": "artisan-maconnerie-paris-ile-de-france",
        "title": "Maçon à Paris et Île-de-France : tarifs, conseils et devis gratuit",
        "meta_description": "Besoin d'un maçon en Île-de-France ? Tarifs 2026 pour murs, fondations, extension. Trouvez un maçon vérifié et obtenez un devis gratuit sur BatiSpot.",
        "h1": "Maçon à Paris et en Île-de-France : guide et tarifs 2026",
        "ville": "Paris",
        "metier": "maçon",
        "keywords": ["macon paris", "macon ile de france", "devis maconnerie paris", "prix macon m2"],
        "sections": [
            {
                "h2": "Quand faire appel à un maçon en Île-de-France",
                "content": """<p>Le maçon est l'artisan du gros œuvre. En Île-de-France, les interventions les plus fréquentes sont :</p>
<ul>
<li><strong>Extension de maison</strong> — Très demandée en banlieue (92, 93, 94) où les terrains permettent de s'agrandir</li>
<li><strong>Ouverture de mur porteur</strong> — Populaire dans les appartements parisiens pour créer des espaces ouverts</li>
<li><strong>Ravalement de façade</strong> — Obligatoire tous les 10 ans à Paris (arrêté préfectoral)</li>
<li><strong>Réparation de fissures</strong> — Fréquent sur les constructions anciennes en Île-de-France</li>
<li><strong>Construction de mur de clôture</strong> — Courante en grande couronne</li>
</ul>"""
            },
            {
                "h2": "Tarifs maçonnerie en Île-de-France 2026",
                "content": """<table style="width:100%;border-collapse:collapse;margin:20px 0;">
<tr style="background:#F0FDF4;"><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Travaux</th><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Tarif moyen</th></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Ouverture mur porteur</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">2 500 — 6 000 €</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Extension 20m²</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">30 000 — 60 000 €</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Ravalement façade (immeuble)</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">40 — 120 €/m²</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Construction mur parpaing</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">50 — 80 €/m²</td></tr>
<tr><td style="padding:10px;">Dalle béton</td><td style="padding:10px;">50 — 100 €/m²</td></tr>
</table>
<p>Les prix en Île-de-France sont <strong>15 à 30% plus élevés</strong> qu'en province, en raison du coût de la main-d'œuvre et des contraintes logistiques urbaines.</p>"""
            },
            {
                "h2": "Ouverture de mur porteur à Paris : ce qu'il faut savoir",
                "content": """<p>C'est l'un des travaux les plus demandés à Paris. Avant de vous lancer :</p>
<ol>
<li><strong>Étude de structure obligatoire</strong> — Un bureau d'études doit valider la faisabilité (500 — 1 500 €)</li>
<li><strong>Accord de copropriété</strong> — En immeuble, un vote en AG est nécessaire</li>
<li><strong>Déclaration préalable</strong> — Si la façade est modifiée, une déclaration en mairie est requise</li>
<li><strong>Assurance décennale du maçon</strong> — Indispensable : l'ouverture d'un mur porteur engage la structure pour 10 ans</li>
</ol>
<p>Ne confiez jamais ce type de travaux à un artisan non assuré. Sur BatiSpot, tous les maçons partenaires ont une décennale vérifiée.</p>"""
            },
            {
                "h2": "Obtenir un devis maçonnerie gratuit en Île-de-France",
                "content": """<p>Décrivez votre projet sur BatiSpot : type de travaux, surface, adresse. Vous recevrez des devis personnalisés de maçons vérifiés dans votre département (75, 77, 78, 91, 92, 93, 94, 95).</p>
<p><strong>Gratuit, sans engagement, sans commission.</strong> Nos artisans partenaires sont tous assurés et immatriculés.</p>"""
            },
        ],
    },
    {
        "slug": "peintre-batiment-bordeaux",
        "title": "Peintre en bâtiment à Bordeaux : tarifs et devis gratuit 2026",
        "meta_description": "Cherchez un peintre en bâtiment à Bordeaux ? Prix au m², conseils pour choisir et devis gratuits d'artisans vérifiés en Gironde.",
        "h1": "Peintre en bâtiment à Bordeaux : prix et artisans vérifiés",
        "ville": "Bordeaux",
        "metier": "peintre",
        "keywords": ["peintre bordeaux", "peintre batiment bordeaux", "devis peinture bordeaux", "prix peinture m2"],
        "sections": [
            {
                "h2": "Pourquoi faire appel à un peintre professionnel à Bordeaux",
                "content": """<p>La peinture semble simple, mais un résultat professionnel fait toute la différence. À Bordeaux, les particularités architecturales (moulures, pierres apparentes, façades classées) demandent un savoir-faire spécifique.</p>
<p>Un peintre professionnel vous apporte :</p>
<ul>
<li>Une <strong>préparation des supports</strong> adaptée (enduit, ponçage, sous-couche)</li>
<li>Le choix des <strong>peintures adaptées</strong> à votre environnement (humidité, luminosité)</li>
<li>Une <strong>finition impeccable</strong> et durable</li>
<li>Le respect des <strong>délais et du budget</strong> annoncés</li>
</ul>"""
            },
            {
                "h2": "Prix peinture au m² à Bordeaux en 2026",
                "content": """<table style="width:100%;border-collapse:collapse;margin:20px 0;">
<tr style="background:#F0FDF4;"><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Type de peinture</th><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Prix au m²</th></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Peinture murs (standard)</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">20 — 35 €/m²</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Peinture plafond</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">25 — 40 €/m²</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Peinture décorative / effet</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">40 — 80 €/m²</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Ravalement façade (peinture)</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">30 — 60 €/m²</td></tr>
<tr><td style="padding:10px;">Laquage boiseries / moulures</td><td style="padding:10px;">35 — 70 €/m²</td></tr>
</table>
<p>Pour un appartement de 70m² à Bordeaux (murs + plafonds), comptez entre <strong>2 800 et 5 600 €</strong> tout compris.</p>"""
            },
            {
                "h2": "Comment choisir son peintre à Bordeaux",
                "content": """<ol>
<li><strong>Demandez des photos de réalisations</strong> — Un bon peintre a un portfolio</li>
<li><strong>Vérifiez les assurances</strong> — RC Pro au minimum, décennale si travaux de façade</li>
<li><strong>Comparez au moins 3 devis</strong> — Les écarts de prix peuvent aller du simple au triple</li>
<li><strong>Attention aux prix trop bas</strong> — Peinture bas de gamme, pas de préparation des murs, sous-traitance</li>
</ol>"""
            },
            {
                "h2": "Devis peintre gratuit à Bordeaux et en Gironde",
                "content": """<p>Sur <strong>BatiSpot</strong>, décrivez votre projet de peinture (intérieure, extérieure, surface) et recevez des devis de peintres vérifiés à Bordeaux, Mérignac, Pessac, Talence et toute la Gironde.</p>
<p>C'est <strong>gratuit, rapide et sans engagement</strong>.</p>"""
            },
        ],
    },
    {
        "slug": "carreleur-paris-devis",
        "title": "Carreleur à Paris : prix pose carrelage et devis gratuit 2026",
        "meta_description": "Prix pose carrelage à Paris par un professionnel. Tarifs au m², conseils de pose, devis gratuit de carreleurs vérifiés en Île-de-France.",
        "h1": "Carreleur à Paris : tarifs de pose et devis gratuit",
        "ville": "Paris",
        "metier": "carreleur",
        "keywords": ["carreleur paris", "prix pose carrelage paris", "devis carreleur paris", "carreleur ile de france"],
        "sections": [
            {
                "h2": "Prix de la pose de carrelage à Paris en 2026",
                "content": """<table style="width:100%;border-collapse:collapse;margin:20px 0;">
<tr style="background:#F0FDF4;"><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Type de pose</th><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Prix au m² (pose seule)</th></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Carrelage sol standard</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">35 — 55 €/m²</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Carrelage grand format (60x60+)</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">45 — 70 €/m²</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Faïence murale salle de bain</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">40 — 65 €/m²</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Mosaïque</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">60 — 100 €/m²</td></tr>
<tr><td style="padding:10px;">Pose en diagonale / motifs</td><td style="padding:10px;">50 — 80 €/m²</td></tr>
</table>
<p>Ces prix n'incluent pas la fourniture des carreaux. Le coût total (fourniture + pose) pour une salle de bain de 6m² à Paris se situe entre <strong>1 200 et 3 000 €</strong>.</p>"""
            },
            {
                "h2": "Quel carrelage choisir pour votre projet",
                "content": """<ul>
<li><strong>Grès cérame</strong> — Le plus résistant, idéal pour sols à fort passage. Prix : 20-60 €/m²</li>
<li><strong>Faïence</strong> — Pour les murs, large choix de motifs. Prix : 15-50 €/m²</li>
<li><strong>Pierre naturelle</strong> — Luxueux mais exigeant en entretien. Prix : 40-150 €/m²</li>
<li><strong>Carreaux de ciment</strong> — Très tendance à Paris pour le style ancien. Prix : 50-120 €/m²</li>
</ul>
<p>Votre carreleur peut vous conseiller sur le meilleur rapport qualité/prix selon votre usage et votre budget.</p>"""
            },
            {
                "h2": "Trouver un carreleur vérifié à Paris",
                "content": """<p>Sur <strong>BatiSpot</strong>, les carreleurs parisiens sont vérifiés (décennale, Kbis, références). Décrivez votre projet — sol, mur, surface, type de carreaux — et recevez des devis personnalisés sous 24h.</p>
<p><strong>Gratuit et sans engagement pour les particuliers.</strong></p>"""
            },
        ],
    },
    {
        "slug": "couvreur-bordeaux-toiture",
        "title": "Couvreur à Bordeaux : réparation toiture, prix et devis 2026",
        "meta_description": "Besoin d'un couvreur à Bordeaux ? Tarifs réparation et réfection toiture en Gironde, tuiles canal, devis gratuit d'artisans certifiés.",
        "h1": "Couvreur à Bordeaux : tarifs toiture et artisans vérifiés",
        "ville": "Bordeaux",
        "metier": "couvreur",
        "keywords": ["couvreur bordeaux", "reparation toiture bordeaux", "prix toiture bordeaux", "devis couvreur gironde"],
        "sections": [
            {
                "h2": "Les spécificités de la toiture à Bordeaux",
                "content": """<p>La Gironde a ses particularités en matière de couverture. Les <strong>tuiles canal</strong> (ou tuiles romanes) sont traditionnelles dans la région bordelaise, contrairement à l'ardoise que l'on trouve davantage dans le nord de la France.</p>
<p>Le climat océanique bordelais (pluies fréquentes, tempêtes hivernales) met les toitures à rude épreuve. Les interventions les plus courantes :</p>
<ul>
<li>Remplacement de tuiles cassées après tempête</li>
<li>Traitement anti-mousse et nettoyage</li>
<li>Réfection de la zinguerie (gouttières, noues)</li>
<li>Isolation sous toiture (performance énergétique)</li>
<li>Réfection complète de couverture</li>
</ul>"""
            },
            {
                "h2": "Prix des travaux de toiture à Bordeaux 2026",
                "content": """<table style="width:100%;border-collapse:collapse;margin:20px 0;">
<tr style="background:#F0FDF4;"><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Intervention</th><th style="padding:12px;text-align:left;border-bottom:2px solid #BBF7D0;">Tarif moyen</th></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Réparation fuite / tuiles</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">250 — 800 €</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Nettoyage + traitement anti-mousse</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">15 — 30 €/m²</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Réfection complète (tuiles canal)</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">80 — 150 €/m²</td></tr>
<tr><td style="padding:10px;border-bottom:1px solid #E5E7EB;">Remplacement gouttières</td><td style="padding:10px;border-bottom:1px solid #E5E7EB;">30 — 60 €/ml</td></tr>
<tr><td style="padding:10px;">Isolation sous rampants</td><td style="padding:10px;">40 — 80 €/m²</td></tr>
</table>"""
            },
            {
                "h2": "Devis couvreur gratuit en Gironde",
                "content": """<p>Les travaux de toiture nécessitent impérativement un artisan avec <strong>assurance décennale</strong>. Une fuite mal réparée peut causer des dégâts considérables.</p>
<p>Sur <strong>BatiSpot</strong>, trouvez un couvreur vérifié à Bordeaux, Mérignac, Pessac, Gradignan ou partout en Gironde. Devis gratuit sous 24h, sans engagement.</p>"""
            },
        ],
    },
    {
        "slug": "devis-travaux-gratuit-paris",
        "title": "Devis travaux gratuit à Paris : comparez les artisans en 2 minutes",
        "meta_description": "Obtenez un devis travaux gratuit à Paris. Comparez jusqu'à 3 artisans vérifiés pour votre projet : plomberie, électricité, rénovation, peinture.",
        "h1": "Devis travaux gratuit à Paris : la méthode simple",
        "ville": "Paris",
        "metier": "tous corps",
        "keywords": ["devis travaux paris", "devis gratuit artisan paris", "comparer artisans paris", "travaux paris devis"],
        "sections": [
            {
                "h2": "Pourquoi comparer les devis est essentiel à Paris",
                "content": """<p>À Paris, les écarts de prix entre artisans peuvent aller <strong>du simple au triple</strong> pour le même travail. Un remplacement de chauffe-eau peut vous coûter 800 € chez un plombier et 1 800 € chez un autre.</p>
<p>La comparaison de devis vous permet de :</p>
<ul>
<li>Identifier le <strong>juste prix</strong> pour votre projet</li>
<li>Détecter les devis gonflés ou incomplets</li>
<li>Choisir l'artisan qui correspond le mieux à vos attentes</li>
<li>Négocier en connaissance de cause</li>
</ul>"""
            },
            {
                "h2": "Comment obtenir un devis gratuit sur BatiSpot",
                "content": """<ol>
<li><strong>Décrivez votre projet</strong> — Type de travaux, surface, localisation, urgence</li>
<li><strong>Recevez des devis</strong> — Jusqu'à 3 artisans vérifiés vous contactent sous 24h</li>
<li><strong>Comparez et choisissez</strong> — Librement, sans engagement, sans frais</li>
</ol>
<p>C'est <strong>100% gratuit</strong> pour les particuliers. BatiSpot se rémunère via un abonnement payé par les artisans partenaires — jamais par une commission sur vos travaux.</p>"""
            },
            {
                "h2": "Tous les corps de métier disponibles à Paris",
                "content": """<p>Sur BatiSpot, trouvez des artisans vérifiés pour tous vos projets :</p>
<ul>
<li><strong>Plomberie</strong> — Fuite, chauffe-eau, salle de bain</li>
<li><strong>Électricité</strong> — Mise aux normes, tableau, dépannage</li>
<li><strong>Maçonnerie</strong> — Mur porteur, extension, ravalement</li>
<li><strong>Peinture</strong> — Intérieure, extérieure, décoration</li>
<li><strong>Carrelage</strong> — Sol, mur, salle de bain</li>
<li><strong>Menuiserie</strong> — Fenêtres, portes, placards</li>
<li><strong>Toiture</strong> — Réparation, réfection, isolation</li>
<li><strong>Isolation</strong> — Combles, murs, planchers</li>
</ul>
<p>Chaque artisan est vérifié : assurance décennale, Kbis, pièce d'identité.</p>"""
            },
        ],
    },
]


def generate_article_html(article):
    date_str = datetime.now().strftime("%Y-%m-%d")
    date_display = datetime.now().strftime("%d/%m/%Y")

    sections_html = ""
    for s in article["sections"]:
        sections_html += f"""
      <h2>{s["h2"]}</h2>
      {s["content"]}
"""

    keywords_meta = ", ".join(article["keywords"])

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
  <title>{article["title"]}</title>
  <meta name="description" content="{article["meta_description"]}">
  <meta name="keywords" content="{keywords_meta}">
  <link rel="canonical" href="https://batispot.pro/blog/{article["slug"]}.html">
  <meta property="og:title" content="{article["title"]}">
  <meta property="og:description" content="{article["meta_description"]}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://batispot.pro/blog/{article["slug"]}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{article["title"]}",
    "description": "{article["meta_description"]}",
    "datePublished": "{date_str}",
    "dateModified": "{date_str}",
    "author": {{
      "@type": "Organization",
      "name": "BatiSpot",
      "url": "https://batispot.pro"
    }},
    "publisher": {{
      "@type": "Organization",
      "name": "BatiSpot",
      "url": "https://batispot.pro"
    }}
  }}
  </script>
  <style>
    :root {{
      --g1: #0F5132;
      --g2: #166534;
      --t2: #0D9488;
      --t1: #0F766E;
      --text: #1C2B22;
      --sub: #4B6B5A;
      --border: #BBF7D0;
    }}
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    html {{ scroll-behavior: smooth; }}
    body {{
      font-family: 'Inter', system-ui, sans-serif;
      color: var(--text);
      background: #FAFAFA;
      line-height: 1.7;
    }}
    .nav {{
      background: white;
      border-bottom: 1px solid #E5E7EB;
      padding: 16px 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }}
    .nav-inner {{
      max-width: 800px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .nav-logo {{
      font-weight: 900;
      font-size: 1.3rem;
      color: var(--g1);
      text-decoration: none;
    }}
    .nav-logo span {{ color: var(--g2); opacity: .85; }}
    .nav-cta {{
      background: var(--t2);
      color: white;
      padding: 8px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: .85rem;
      transition: background .2s;
    }}
    .nav-cta:hover {{ background: var(--t1); }}
    article {{
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }}
    .breadcrumb {{
      font-size: .82rem;
      color: var(--sub);
      margin-bottom: 24px;
    }}
    .breadcrumb a {{ color: var(--t2); text-decoration: none; }}
    .breadcrumb a:hover {{ text-decoration: underline; }}
    .article-meta {{
      display: flex;
      gap: 16px;
      font-size: .82rem;
      color: var(--sub);
      margin-bottom: 24px;
    }}
    h1 {{
      font-size: clamp(1.6rem, 4vw, 2.2rem);
      font-weight: 800;
      color: var(--g1);
      line-height: 1.25;
      margin-bottom: 16px;
    }}
    h2 {{
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--g1);
      margin: 36px 0 16px;
    }}
    p {{ margin-bottom: 16px; font-size: 1rem; }}
    ul, ol {{ margin: 12px 0 20px 20px; }}
    li {{ margin-bottom: 8px; }}
    table {{ font-size: .92rem; }}
    .cta-box {{
      background: linear-gradient(135deg, #E6F7ED, #F0FDF4);
      border: 2px solid #59C794;
      border-radius: 16px;
      padding: 28px;
      text-align: center;
      margin: 40px 0;
    }}
    .cta-box h3 {{
      font-size: 1.2rem;
      color: var(--g1);
      margin-bottom: 8px;
    }}
    .cta-box p {{ color: var(--sub); margin-bottom: 16px; }}
    .cta-btn {{
      display: inline-block;
      background: var(--t2);
      color: white;
      padding: 14px 32px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      font-size: 1rem;
      box-shadow: 0 4px 12px rgba(13,148,136,.3);
      transition: background .2s, transform .15s;
    }}
    .cta-btn:hover {{ background: var(--t1); transform: translateY(-2px); }}
    .footer-blog {{
      background: var(--g1);
      color: white;
      text-align: center;
      padding: 32px 24px;
      font-size: .85rem;
    }}
    .footer-blog a {{ color: #4CAF82; text-decoration: none; }}
    @media (max-width: 600px) {{
      article {{ padding: 24px 16px 60px; }}
      table {{ font-size: .82rem; }}
    }}
  </style>
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <a href="https://batispot.pro" class="nav-logo">Bati<span>Spot</span></a>
      <a href="https://batispot.pro/artisan" class="nav-cta">Devis gratuit</a>
    </div>
  </nav>

  <article>
    <div class="breadcrumb">
      <a href="https://batispot.pro">Accueil</a> &rsaquo;
      <a href="https://batispot.pro/blog/">Blog</a> &rsaquo;
      {article["title"][:50]}...
    </div>

    <h1>{article["h1"]}</h1>
    <div class="article-meta">
      <span>Par l'equipe BatiSpot</span>
      <span>{date_display}</span>
      <span>{article["ville"]}</span>
    </div>

    {sections_html}

    <div class="cta-box">
      <h3>Vous avez un projet de travaux ?</h3>
      <p>Recevez des devis gratuits d'artisans verifies dans votre zone. Sans engagement, sans commission.</p>
      <a href="https://batispot.pro/#devis" class="cta-btn">Obtenir mes devis gratuits &rarr;</a>
    </div>
  </article>

  <footer class="footer-blog">
    <p>&copy; 2026 <a href="https://batispot.pro">BatiSpot</a> — La plateforme des artisans du batiment</p>
  </footer>
</body>
</html>"""


def generate_index_html(articles):
    cards = ""
    for a in articles:
        cards += f"""
      <a href="{a["slug"]}.html" class="blog-card">
        <div class="blog-card-tag">{a["ville"]} · {a["metier"].title()}</div>
        <h2>{a["title"]}</h2>
        <p>{a["meta_description"]}</p>
        <span class="blog-card-link">Lire l'article &rarr;</span>
      </a>"""

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/svg+xml" href="../favicon.svg">
  <title>Blog BatiSpot — Conseils travaux, tarifs artisans et guides</title>
  <meta name="description" content="Blog BatiSpot : guides pratiques, tarifs artisans 2026, conseils travaux pour Paris, Bordeaux et toute la France. Trouvez le bon artisan au bon prix.">
  <link rel="canonical" href="https://batispot.pro/blog/">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {{
      --g1: #0F5132;
      --g2: #166534;
      --t2: #0D9488;
      --t1: #0F766E;
      --text: #1C2B22;
      --sub: #4B6B5A;
      --border: #BBF7D0;
    }}
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Inter', system-ui, sans-serif;
      color: var(--text);
      background: #FAFAFA;
      line-height: 1.6;
    }}
    .nav {{
      background: white;
      border-bottom: 1px solid #E5E7EB;
      padding: 16px 0;
      position: sticky;
      top: 0;
      z-index: 100;
    }}
    .nav-inner {{
      max-width: 960px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .nav-logo {{
      font-weight: 900;
      font-size: 1.3rem;
      color: var(--g1);
      text-decoration: none;
    }}
    .nav-logo span {{ color: var(--g2); opacity: .85; }}
    .nav-cta {{
      background: var(--t2);
      color: white;
      padding: 8px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 700;
      font-size: .85rem;
    }}
    .hero {{
      background: linear-gradient(135deg, #0F5132, #166534);
      color: white;
      text-align: center;
      padding: 56px 24px;
    }}
    .hero h1 {{
      font-size: clamp(1.6rem, 4vw, 2.4rem);
      font-weight: 900;
      margin-bottom: 12px;
      color: white;
    }}
    .hero p {{ color: rgba(255,255,255,.75); font-size: 1.05rem; }}
    .container {{
      max-width: 960px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }}
    .blog-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }}
    .blog-card {{
      background: white;
      border: 1.5px solid #E5E7EB;
      border-radius: 14px;
      padding: 24px;
      text-decoration: none;
      color: var(--text);
      transition: border-color .2s, box-shadow .2s, transform .15s;
    }}
    .blog-card:hover {{
      border-color: var(--t2);
      box-shadow: 0 8px 24px rgba(13,148,136,.12);
      transform: translateY(-3px);
    }}
    .blog-card-tag {{
      font-size: .75rem;
      font-weight: 700;
      color: var(--t2);
      text-transform: uppercase;
      letter-spacing: .05em;
      margin-bottom: 10px;
    }}
    .blog-card h2 {{
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--g1);
      margin-bottom: 8px;
      line-height: 1.35;
    }}
    .blog-card p {{
      font-size: .87rem;
      color: var(--sub);
      margin-bottom: 12px;
      line-height: 1.5;
    }}
    .blog-card-link {{
      font-size: .85rem;
      font-weight: 600;
      color: var(--t2);
    }}
    .footer-blog {{
      background: var(--g1);
      color: white;
      text-align: center;
      padding: 32px 24px;
      font-size: .85rem;
    }}
    .footer-blog a {{ color: #4CAF82; text-decoration: none; }}
  </style>
</head>
<body>
  <nav class="nav">
    <div class="nav-inner">
      <a href="https://batispot.pro" class="nav-logo">Bati<span>Spot</span></a>
      <a href="https://batispot.pro/artisan" class="nav-cta">Devis gratuit</a>
    </div>
  </nav>

  <div class="hero">
    <h1>Blog BatiSpot</h1>
    <p>Guides pratiques, tarifs artisans et conseils travaux pour Paris, Bordeaux et toute la France.</p>
  </div>

  <div class="container">
    <div class="blog-grid">
      {cards}
    </div>
  </div>

  <footer class="footer-blog">
    <p>&copy; 2026 <a href="https://batispot.pro">BatiSpot</a> — La plateforme des artisans du batiment</p>
  </footer>
</body>
</html>"""


def main():
    index_only = "--index-only" in sys.argv

    if not index_only:
        for article in ARTICLES:
            filepath = os.path.join(BASE_DIR, f"{article['slug']}.html")
            if os.path.exists(filepath):
                print(f"  [skip] {article['slug']}.html (existe deja)")
                continue
            html = generate_article_html(article)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"  [new]  {article['slug']}.html")

    index_path = os.path.join(BASE_DIR, "index.html")
    index_html = generate_index_html(ARTICLES)
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_html)
    print(f"\n  Index: {index_path}")
    print(f"  Total: {len(ARTICLES)} articles")


if __name__ == "__main__":
    main()

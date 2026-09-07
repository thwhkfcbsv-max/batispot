#!/usr/bin/env python3
"""Batch 2 : 5 articles - SEO local, Aides clients, Facture electronique, Securite, Apprenti."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _template_gen import render

OUT = os.path.dirname(__file__)

# ============ ARTICLE 6 : SEO LOCAL / GOOGLE BUSINESS ============
a6_body = """
<p>87 % des particuliers qui cherchent un artisan passent par <strong>Google Maps</strong>. Pas le site web, pas les annuaires, pas l'Instagram : <strong>Maps</strong>. Quand un proprietaire tape &laquo; plombier 92 &raquo; ou &laquo; electricien Paris 15 &raquo;, les 3 premiers resultats du &laquo; pack local &raquo; (les 3 fiches avec etoiles) recoivent <strong>65 a 80 % des clics</strong>.</p>

<p>Ce guide montre comment decrocher l'une de ces 3 places en 2026, sans budget publicitaire, en 30 jours.</p>

<h2>Ce qu'est vraiment Google Business Profile (ex-My Business)</h2>

<p>GBP est la fiche gratuite que Google associe a votre entreprise. Elle agrege :</p>
<ul>
<li>Votre nom, zone d'intervention, telephone, site web</li>
<li>Vos horaires</li>
<li>Vos photos de chantiers</li>
<li>Vos avis clients et votre note moyenne</li>
<li>Vos posts (actu, offres, photos)</li>
<li>Les questions posees par les internautes</li>
</ul>

<p>C'est 100 % gratuit, officiel, et c'est l'element le plus puissant du SEO local en 2026.</p>

<h2>Les 3 criteres que Google evalue pour le ranking</h2>

<table><thead><tr><th>Critere</th><th>Poids</th><th>Ce que c'est</th></tr></thead><tbody>
<tr><td><strong>Pertinence</strong></td><td>25 %</td><td>Vos categories, mots-cles, services listes correspondent a la recherche</td></tr>
<tr><td><strong>Proximite</strong></td><td>35 %</td><td>Distance entre vous et la personne qui cherche</td></tr>
<tr><td><strong>Notoriete</strong></td><td>40 %</td><td>Note moyenne, nombre d'avis, frequence de mise a jour, activite globale</td></tr>
</tbody></table>

<p>La proximite est geographique (vous ne pouvez pas la truquer) mais les deux autres se travaillent.</p>

<h2>Setup en 5 etapes (2 heures)</h2>

<h3>1. Creer ou revendiquer votre fiche</h3>
<p>Sur <strong>business.google.com</strong>. Choisir le type &laquo; prestataire se deplacant &raquo; (pas &laquo; commerce avec adresse &raquo;) pour ne pas afficher votre adresse personnelle. Indiquer votre zone d'intervention (ex : &laquo; 75, 92, 93 &raquo;).</p>

<h3>2. Verification (24-48h)</h3>
<p>Google envoie un code par SMS, appel telephonique, ou courrier postal. Courrier = 5 a 14 jours. SMS / appel = instantane, a privilegier.</p>

<h3>3. Renseigner TOUTES les sections</h3>
<ul>
<li>Categorie principale : la plus precise (&laquo; Plombier &raquo; plutot que &laquo; Entrepreneur &raquo;)</li>
<li>Categories secondaires (3-9 max) : &laquo; Chauffagiste, Depannage urgence, Installation PAC, &raquo;</li>
<li>Services : liste detaillee (50+ services possibles, Google pondere plus fort les fiches completes)</li>
<li>Horaires precis, y compris urgences 24/7 si applicable</li>
<li>Lien vers site web (avec tracking UTM pour mesurer le trafic)</li>
<li>Description (750 caracteres) avec mots-cles naturels</li>
</ul>

<h3>4. Ajouter des photos (minimum 20)</h3>
<p>Types de photos a prevoir :</p>
<ul>
<li><strong>Equipe</strong> : vous, votre equipe sur chantier (visages, pas que les mains)</li>
<li><strong>Avant/apres</strong> : meme cadrage, transformation visible (mine d'or SEO)</li>
<li><strong>Vehicule</strong> : camionnette siglee (credibilite)</li>
<li><strong>Outillage</strong> : signe de professionnalisme</li>
<li><strong>Diplomes, certifications</strong> : Qualibat, RGE, QualiPAC affiches</li>
</ul>

<div class="info-box"><strong>Astuce :</strong> une photo par semaine minimum. Google valorise fortement la frequence de mise a jour (impact sur &laquo; notoriete &raquo;). 2 minutes de travail = grosse difference.</div>

<h3>5. Planifier les posts</h3>
<p>Google Posts : 1 a 3 par semaine. Types :</p>
<ul>
<li>Actualites (nouveau chantier livre, photo avant/apres)</li>
<li>Offres (&laquo; 10 % sur prestation isolation jusqu'a fin avril &raquo;)</li>
<li>Nouveautes (nouvelle certification RGE, nouveau service)</li>
<li>Evenements (journee portes ouvertes, participation salon local)</li>
</ul>

<h2>Les avis : moteur numero 1 du SEO local</h2>

<p><strong>Chiffre cle :</strong> une fiche avec 27+ avis et une note &ge; 4,3 surpasse une fiche sans avis <strong>meme si cette derniere est plus proche geographiquement</strong>.</p>

<h3>Comment collecter des avis rapidement</h3>
<ol>
<li>Fin de chantier, client satisfait : &laquo; Si ca vous a plu, 30 secondes pour un avis Google, ca m'aide enormement. &raquo;</li>
<li>Envoyer le <strong>lien court direct</strong> (g.page/r/VOTRE_ID/review) par SMS</li>
<li>Ne jamais acheter d'avis (Google detecte et supprime, risque suspension)</li>
<li>Repondre a <strong>100 %</strong> des avis (positifs comme negatifs) dans les 48h</li>
</ol>

<h3>Reponse type aux avis negatifs</h3>
<div class="info-box">
<p>&laquo; Bonjour [Prenom], je suis vraiment desole de cette experience. [Reformulation courte du probleme]. C'est eloigne de notre standard habituel. J'aimerais comprendre ce qui s'est passe et vous proposer une solution. Merci de m'appeler au 06 XX XX XX XX pour que je revienne vers vous personnellement. &raquo;</p>
</div>

<p>Regles : assumer, proposer contact offline, ne pas argumenter publiquement. Les lecteurs ulterieurs voient plus votre reaction que l'avis lui-meme.</p>

<h2>Optimisation du site web pour SEO local</h2>

<p>Votre GBP seul ne suffit pas. Il faut un site avec :</p>
<ul>
<li><strong>NAP coherent</strong> (Name, Address, Phone) identique partout : site, GBP, annuaires. Google fait des correlations.</li>
<li><strong>Pages par zone</strong> : &laquo; Plombier Boulogne-Billancourt &raquo;, &laquo; Plombier Issy-les-Moulineaux &raquo; (une par commune cible).</li>
<li><strong>Pages par service</strong> : &laquo; Depannage chaudiere &raquo;, &laquo; Installation PAC &raquo;, &laquo; Recherche de fuite &raquo;.</li>
<li><strong>Schema markup LocalBusiness</strong> (code JSON-LD).</li>
<li><strong>Formulaire de contact rapide</strong> en haut de chaque page.</li>
</ul>

<h2>Annuaires professionnels (citations)</h2>

<p>Google considere les annuaires comme un signal de confiance. Inscrivez-vous sur :</p>
<ul>
<li><strong>PagesJaunes.fr</strong> (le plus fort)</li>
<li><strong>Societe.com</strong> (fait automatiquement apres creation Kbis)</li>
<li><strong>Le Bonleboncoin</strong> (avec vrai profil pro)</li>
<li><strong>TrustedShops, Avis-Verifies</strong> (si vous facturez &gt; 10 kEUR/mois)</li>
<li><strong>Annuaires metiers</strong> : capeb.fr, ffbatiment.fr (acces via adhesion)</li>
<li><strong>Annuaires locaux</strong> : celui de votre CCI, de votre mairie, de votre association commercante</li>
</ul>

<p>Important : <strong>toujours la meme adresse, le meme numero, le meme nom exactement</strong>. &laquo; SARL Dupont &raquo; et &laquo; Dupont SARL &raquo; sont vus comme 2 entreprises differentes.</p>

<h2>Mesurer les resultats</h2>

<p>Dans GBP, statistiques disponibles :</p>
<ul>
<li>Vues de votre fiche (recherche / Maps separement)</li>
<li>Clics vers site</li>
<li>Appels directs depuis la fiche</li>
<li>Demandes d'itineraire</li>
<li>Messages</li>
</ul>

<p><strong>Objectif 3 mois :</strong> 300+ vues/semaine, 15+ actions/semaine (appel + clic site + itineraire).</p>

<h2>Les 5 erreurs qui plombent votre ranking</h2>

<h3>1. Bourrer la description de mots-cles</h3>
<p>&laquo; plombier Paris plombier 75 plombier pas cher plombier urgence &raquo; = penalise. Ecrire naturellement, Google detecte le keyword stuffing.</p>

<h3>2. Multiples fiches pour la meme adresse</h3>
<p>Une fiche par entite juridique (Kbis). Creer 5 fiches &laquo; Plombier Paris 15, Plombier Paris 16 &raquo; pour la meme SARL = suspension de toutes.</p>

<h3>3. Changer le nom officiel pour y glisser un mot-cle</h3>
<p>&laquo; SARL Dupont Plomberie Chauffage Urgence Paris &raquo; au lieu de &laquo; SARL Dupont &raquo; = violation des conditions Google. Sanction visible en 24-72h.</p>

<h3>4. Ne pas repondre aux avis</h3>
<p>Ne pas repondre = signal d'inactivite pour Google. Repondre meme aux avis 5 etoiles avec un court &laquo; Merci beaucoup [Prenom], au plaisir de revenir ! &raquo;.</p>

<h3>5. Horaires incorrects</h3>
<p>Si vous fermez un dimanche mais que la fiche indique ouvert, Google penalise apres quelques signalements (bouton &laquo; Suggerer une modification &raquo;).</p>

<h2>Calendrier 30 jours pour passer au top 3 local</h2>

<table><thead><tr><th>Semaine</th><th>Actions</th></tr></thead><tbody>
<tr><td>1</td><td>Creation / verification fiche, 20 photos, 10 services, description. Inscription sur 5 annuaires.</td></tr>
<tr><td>2</td><td>Demander 5 avis a anciens clients (SMS avec lien direct). 2 posts Google. Ajouter pages ville sur site.</td></tr>
<tr><td>3</td><td>Collecte avis (viser 10 cumules). Schema markup LocalBusiness. 3 nouvelles photos.</td></tr>
<tr><td>4</td><td>15 avis cumules, note &ge; 4,3. Post hebdo regulier. Annuaires complementaires.</td></tr>
</tbody></table>

<h2>En resume</h2>
<ul>
<li>Google Business Profile = levier n&deg;1 de l'artisan en 2026. Gratuit, puissant, sous-utilise par 60 % des concurrents.</li>
<li>Notoriete (avis) = 40 % du ranking. Viser 20+ avis et note &ge; 4,3.</li>
<li>Completer 100 % des sections, ajouter photos regulierement, poster chaque semaine.</li>
<li>NAP coherent partout (site, GBP, annuaires) : meme nom, meme adresse, meme telephone.</li>
<li>Repondre a 100 % des avis dans les 48h, meme les positifs.</li>
</ul>
"""

a6 = render(
    slug="google-business-profile-artisan-seo-local",
    title="SEO local artisan 2026 : top 3 Google Maps en 30 jours — guide complet",
    meta_desc="Comment apparaitre dans le top 3 Google Maps quand un client cherche un artisan dans votre zone. Setup GBP, avis, annuaires, criteres de ranking 2026. Plan 30 jours actionnable.",
    keywords="Google Business Profile artisan, SEO local BTP, fiche Google Maps plombier, avis clients artisan, ranking local artisan",
    h1="SEO local artisan 2026 : comment passer top 3 Google Maps",
    read_min=9,
    summary_items=[
        "Les 3 criteres que Google pondere pour le ranking local",
        "Setup Google Business Profile en 5 etapes (2 heures)",
        "Comment collecter des avis rapidement sans acheter",
        "Modele de reponse aux avis negatifs qui renforce la credibilite",
        "Calendrier 30 jours pour decrocher le top 3 local",
    ],
    body_html=a6_body,
    related=[
        ("/blog-pro/nouvelles-attentes-clients-btp-2026.html", "Les nouvelles attentes des clients BTP en 2026"),
        ("/blog-pro/devenir-rge-2026.html", "Comment devenir RGE en 2026"),
    ],
)
with open(os.path.join(OUT, "google-business-profile-artisan-seo-local.html"), "w") as f:
    f.write(a6)


# ============ ARTICLE 7 : AIDES ANAH 2026 ============
a7_body = """
<p>En 2026, les aides a la renovation energetique restent le principal moteur de demande pour les artisans du batiment. <strong>MaPrimeRenov' a evolue</strong>, les <strong>CEE (Certificats d'Economie d'Energie) ont ete recentres</strong>, et de nouveaux dispositifs sont apparus. Un artisan qui connait mieux ces aides que ses concurrents gagne 25-40 % de chantiers supplementaires.</p>

<p>Ce guide donne l'etat des lieux complet des aides 2026, qui peut en beneficier et comment cela simplifie ou complique votre travail de devis.</p>

<h2>MaPrimeRenov' 2026 : les 2 parcours</h2>

<h3>Parcours Geste (mono-geste)</h3>
<p>Aide versee pour UN geste de renovation (isolation toiture, changement chauffage, etc.). Conditions :</p>
<ul>
<li>Logement de +15 ans (auparavant 2 ans)</li>
<li>Residence principale</li>
<li>Artisan <strong>RGE qualifie</strong> (sans exception)</li>
<li>Montant variable selon geste et revenus (barème bleu / jaune / violet / rose)</li>
</ul>

<h3>Parcours Accompagne (renovation globale)</h3>
<p>Pour travaux multiples (ex : isolation + chauffage + ventilation). Obligatoire :</p>
<ul>
<li>Audit energetique realise par un auditeur independant (2 classes DPE de gain minimum)</li>
<li>Mon Accompagnateur Renov' (MAR) = un tiers certifie qui pilote le projet</li>
<li>Au moins 2 gestes dont un sur le chauffage ou l'isolation structurelle</li>
<li>Aide jusqu'a 70 % du cout des travaux pour les revenus les plus modestes</li>
</ul>

<h2>Bareme 2026 (plafonds principaux)</h2>

<table><thead><tr><th>Geste</th><th>Bleu (tres modeste)</th><th>Jaune (modeste)</th><th>Violet (intermediaire)</th><th>Rose (aise)</th></tr></thead><tbody>
<tr><td>PAC air/eau</td><td>5 000 EUR</td><td>4 000 EUR</td><td>3 000 EUR</td><td>0 EUR</td></tr>
<tr><td>PAC geothermique</td><td>11 000 EUR</td><td>9 000 EUR</td><td>6 000 EUR</td><td>0 EUR</td></tr>
<tr><td>Chaudiere biomasse</td><td>7 500 EUR</td><td>6 000 EUR</td><td>3 500 EUR</td><td>0 EUR</td></tr>
<tr><td>Isolation toiture (m<sup>2</sup>)</td><td>25 EUR</td><td>20 EUR</td><td>15 EUR</td><td>0 EUR</td></tr>
<tr><td>Isolation murs ext (m<sup>2</sup>)</td><td>75 EUR</td><td>60 EUR</td><td>40 EUR</td><td>15 EUR</td></tr>
<tr><td>Audit energetique</td><td>500 EUR</td><td>400 EUR</td><td>300 EUR</td><td>0 EUR</td></tr>
</tbody></table>

<p>Seuils 2026 : bleu (revenu fiscal ref &lt; 21 805 EUR pour 1 pers en IDF), jaune (&lt; 26 532), violet (&lt; 37 226), rose (&ge; 37 226).</p>

<h2>CEE (Certificats d'Economie d'Energie) : l'aide cumulable</h2>

<p>Finance par les fournisseurs d'energie (TotalEnergies, EDF, Engie, etc.) qui ont l'obligation de financer des travaux d'economie d'energie. Cumulables avec MaPrimeRenov'.</p>

<h3>Fonctionnement</h3>
<ol>
<li>Le client signe un devis avec vous</li>
<li>Il fait sa demande CEE <strong>AVANT</strong> signature (obligation legale, erreur frequente)</li>
<li>Un obliige (fournisseur d'energie ou delegataire) valide le dossier</li>
<li>Apres travaux realises par RGE, la prime CEE est versee (par cheque, virement, bon d'achat)</li>
</ol>

<p>Montant typique : <strong>2 500-4 500 EUR</strong> pour une PAC air/eau, <strong>15-25 EUR/m<sup>2</sup></strong> pour isolation toiture.</p>

<h3>Coup de pouce Chauffage 2026</h3>
<p>Bonus CEE majore pour remplacement d'une vieille chaudiere gaz ou fioul par PAC ou chaudiere biomasse. Jusqu'a 5 000 EUR supplementaires pour les menages modestes.</p>

<h2>Eco-PTZ (Eco-pret a taux zero)</h2>

<p>Pret sans interet pour financer la part non subventionnee. En 2026 :</p>
<ul>
<li>Plafond : <strong>50 000 EUR</strong></li>
<li>Duree : jusqu'a 20 ans</li>
<li>Travaux eligibles : meme liste que MaPrimeRenov'</li>
<li>Cumul possible : MaPrimeRenov' + CEE + Eco-PTZ + TVA 5,5 %</li>
</ul>

<h2>TVA reduite 5,5 % : le meilleur reflexe</h2>

<p>Meme si votre client ne beneficie d'aucune aide, la TVA a 5,5 % (vs 20 %) sur renovation energetique est <strong>automatique</strong>. Sur une PAC a 10 kEUR TTC : gain client de 1 450 EUR immediat (vs 20 %).</p>

<p>Comme vu dans notre article TVA, attestation Cerfa obligatoire. Ne jamais oublier.</p>

<h2>Aides locales (regions, departements, communes)</h2>

<p>Souvent cumulables avec les aides nationales. Exemples 2026 :</p>
<ul>
<li><strong>IDF</strong> : aide regionale 1 500-3 000 EUR pour isolation + PAC</li>
<li><strong>Paris</strong> : plan Eco-Logis&prime;, jusqu'a 4 000 EUR</li>
<li><strong>Lyon</strong> : Ecoreno'v, 1 000-5 000 EUR</li>
<li><strong>Occitanie</strong> : Eco-Cheque Logement 1 500 EUR</li>
</ul>

<p>Plateforme officielle : <strong>france-renov.gouv.fr</strong> (simulation + recherche par code postal).</p>

<h2>Ce que cela signifie pour votre devis</h2>

<p>Un devis moderne artisan doit :</p>
<ul>
<li>Separer clairement <strong>main-d'oeuvre / fourniture / TVA</strong></li>
<li>Mentionner les <strong>criteres de performance</strong> eligibles aux aides (COP de la PAC, resistance thermique R de l'isolant, etc.)</li>
<li>Indiquer le <strong>montant estimatif des aides</strong> deductibles (a titre indicatif)</li>
<li>Noter votre <strong>numero RGE</strong> et la compagnie certificatrice</li>
<li>Laisser le client faire sa demande AVANT signature (ligne en bas : &laquo; Signature apres validation des aides &raquo;)</li>
</ul>

<div class="warning-box"><strong>Erreur frequente :</strong> signer le devis avant la demande CEE fait perdre l'eligibilite au client. L'ADEME conseille : devis signe &laquo; sous reserve d'obtention des aides &raquo; + signature definitive apres validation.</div>

<h2>Avance des aides : le probleme de la tresorerie client</h2>

<p>Probleme connu : le client touche l'aide <strong>apres</strong> avoir paye la facture. Il doit avancer la tresorerie, ce qui bloque 40 % des projets.</p>

<h3>Solutions 2026</h3>
<ul>
<li><strong>Mandat d'aide pour les revenus bleu/jaune</strong> : vous percevez directement MaPrimeRenov' (signe par le client). Facture diminuee d'autant.</li>
<li><strong>Avance de CEE</strong> par l'oblige : certains financeurs avancent la prime, vous facturez diminue.</li>
<li><strong>Financement travaux</strong> (Sofinco, Cetelem, Cofidis, etc.) : le client rembourse sur 12-120 mois. Vous etes paye integralement par le financeur.</li>
<li><strong>Eco-PTZ</strong> via banque partenaire.</li>
</ul>

<h2>Simulation client : 120 m<sup>2</sup>, chaudiere fioul &rarr; PAC + isolation combles</h2>

<table><thead><tr><th>Poste</th><th>Montant TTC</th><th>Aide</th></tr></thead><tbody>
<tr><td>PAC air/eau 14 kW</td><td>13 500 EUR</td><td>MPR bleu 5 000 EUR + CEE 4 200 EUR + coup de pouce 2 500 EUR = 11 700 EUR</td></tr>
<tr><td>Isolation combles 80 m<sup>2</sup></td><td>3 200 EUR</td><td>MPR bleu 2 000 EUR + CEE 1 600 EUR = 3 200 EUR</td></tr>
<tr><td><strong>Total</strong></td><td><strong>16 700 EUR</strong></td><td><strong>-14 900 EUR d'aides</strong></td></tr>
<tr><td><strong>Reste a charge client</strong></td><td></td><td><strong>1 800 EUR</strong></td></tr>
</tbody></table>

<p>Hypotheses : menage bleu (revenu &lt; 21,8 kEUR), logement +15 ans. Economie gaz/fioul : ~1 400 EUR/an. Amortissement : 1,3 annee.</p>

<h2>Former votre equipe aux aides</h2>

<p>Un artisan qui connait les aides mieux que le client ferme 60 % plus de devis. Ressources :</p>
<ul>
<li>Formation MAR (Mon Accompagnateur Renov') : 2 500-5 000 EUR, mais permet devenir prestataire officiel</li>
<li>Webinaires ADEME (gratuits, 1h/mois)</li>
<li>Formations CAPEB / FFB (subventionnees pour adherents)</li>
</ul>

<h2>En resume</h2>
<ul>
<li>MaPrimeRenov' + CEE + TVA 5,5 % = jusqu'a 90 % du cout couvert pour menages modestes.</li>
<li>RGE obligatoire pour beneficier des aides principales. Pas de RGE = pas d'aide = chantier perdu.</li>
<li>Demande CEE AVANT signature du devis. Ordre inverse = ineligibilite.</li>
<li>Integrer simulation des aides au devis augmente le taux de conversion de 25-40 %.</li>
<li>Mandat client pour percevoir directement les aides = enlever le frein de tresorerie.</li>
</ul>
"""

a7 = render(
    slug="aides-renovation-energetique-2026-maprimerenov-cee",
    title="MaPrimeRenov', CEE, TVA 5,5 % : guide des aides 2026 pour artisans BTP",
    meta_desc="Etat complet des aides a la renovation energetique en 2026 : MaPrimeRenov' (2 parcours), CEE, coup de pouce, TVA 5,5 %, Eco-PTZ. Baremes, cumul, simulation chiffree.",
    keywords="MaPrimeRenov 2026, CEE artisan, aides renovation energetique, RGE obligations, parcours accompagne MAR",
    h1="Aides renovation energetique 2026 : le guide artisan complet",
    read_min=10,
    summary_items=[
        "MaPrimeRenov' 2026 : les 2 parcours et les seuils de revenus",
        "CEE : comment faire la demande et le cumul avec MaPrimeRenov'",
        "TVA 5,5 %, Eco-PTZ, aides locales : les autres leviers",
        "Impact sur votre devis : ce que le client attend de vous en 2026",
        "Simulation concrete : 16 700 EUR de travaux, 14 900 EUR d'aides",
    ],
    body_html=a7_body,
    related=[
        ("/blog-pro/devenir-rge-2026.html", "Comment devenir RGE en 2026"),
        ("/blog-pro/tva-btp-2026-taux-matrice.html", "TVA BTP 2026 : matrice des taux"),
    ],
)
with open(os.path.join(OUT, "aides-renovation-energetique-2026-maprimerenov-cee.html"), "w") as f:
    f.write(a7)


# ============ ARTICLE 8 : FACTURE ELECTRONIQUE ============
a8_body = """
<p>A partir du <strong>1er septembre 2026</strong>, toutes les entreprises francaises, y compris les artisans BTP, devront <strong>recevoir des factures electroniques</strong>. Et au <strong>1er septembre 2027</strong>, meme les micro-entrepreneurs devront <strong>emettre des factures electroniques</strong>. Plus de PDF attache au mail, plus de papier : un format structure obligatoire.</p>

<p>Ce guide explique ce que vous devez changer <strong>des maintenant</strong> pour ne pas etre pris de court.</p>

<h2>Calendrier officiel (decret de septembre 2026)</h2>

<table><thead><tr><th>Date</th><th>Reception obligatoire</th><th>Emission obligatoire</th></tr></thead><tbody>
<tr><td>1er septembre 2026</td><td><strong>Toutes entreprises</strong> (y compris TPE et micro)</td><td>Grandes entreprises + ETI</td></tr>
<tr><td>1er septembre 2027</td><td>Toutes entreprises</td><td><strong>PME + TPE + micro-entrepreneurs</strong></td></tr>
</tbody></table>

<p>Donc en 2026, meme si vous ne devez pas encore emettre en electronique, vous devez deja recevoir vos factures fournisseurs en electronique.</p>

<h2>Ce qui change concretement</h2>

<h3>Fin du PDF par mail</h3>
<p>Un PDF envoye en piece jointe ne sera plus une facture valide en B2B. Il faudra passer par une <strong>Plateforme de Dematerialisation Partenaire (PDP)</strong> ou le <strong>Portail Public de Facturation (PPF)</strong> (Chorus Pro etendu).</p>

<h3>Format structure</h3>
<p>La facture sera soit :</p>
<ul>
<li><strong>Factur-X</strong> : PDF avec un fichier XML embarque (la vue humaine + la donnee machine)</li>
<li><strong>UBL</strong> ou <strong>CII</strong> : XML pur (plus pour B2B grandes entreprises)</li>
</ul>

<h3>e-reporting des donnees de transaction</h3>
<p>En plus de la facture, vous devrez transmettre a l'administration fiscale :</p>
<ul>
<li>Montant des ventes B2C (particuliers) de chaque periode</li>
<li>Montant des ventes hors UE et UE</li>
<li>Donnees de paiement (date encaissement)</li>
</ul>

<div class="info-box"><strong>Impact :</strong> la DGFiP aura connaissance de votre CA quasi temps reel, ce qui devrait supprimer progressivement la declaration TVA (CA3) pour les petites entreprises.</div>

<h2>Les PDP : comment choisir</h2>

<p>Une Plateforme de Dematerialisation Partenaire est un intermediaire agree par l'Etat qui emet, recoit et transmet vos factures en toute securite. Tarifs 2026 :</p>

<table><thead><tr><th>PDP</th><th>Tarif mensuel</th><th>Specificites</th></tr></thead><tbody>
<tr><td>Docaposte (La Poste)</td><td>12-25 EUR/mois</td><td>Large couverture, SAV telephonique</td></tr>
<tr><td>Sellsy</td><td>29 EUR/mois</td><td>CRM + facturation integre</td></tr>
<tr><td>Pennylane</td><td>24 EUR/mois</td><td>Comptabilite + PDP</td></tr>
<tr><td>QuickBooks, Sage</td><td>15-30 EUR/mois</td><td>Comptabilite + PDP integres</td></tr>
<tr><td>Portail Public (PPF)</td><td>Gratuit</td><td>Interface basique, moins ergonomique</td></tr>
</tbody></table>

<p>Pour un artisan solo ou TPE : <strong>PPF gratuit suffit</strong> au debut, ou un PDP gratuit pour micro-entrepreneur (Evoliz, QuickBooks Solo, Tiime Start).</p>

<h2>Mentions obligatoires de la facture electronique</h2>

<p>Memes mentions qu'une facture papier + 4 nouvelles :</p>
<ol>
<li><strong>SIREN</strong> du client (obligatoire meme pour les tres petites PME)</li>
<li><strong>Adresse de livraison</strong> (si differente de l'adresse de facturation)</li>
<li><strong>Option sur paiement de la TVA sur les debits</strong> (oui/non)</li>
<li><strong>Categorie de l'operation</strong> (biens, services, mixte)</li>
</ol>

<p>Toutes les mentions habituelles restent obligatoires : numero facture, date, montant HT/TVA/TTC, delai de paiement, conditions, etc.</p>

<h2>Ce que vous devez faire avant septembre 2026</h2>

<ol>
<li><strong>Inscrire votre entreprise au PPF</strong> (ou PDP choisi). Inscription gratuite sur <strong>portail-facturation.gouv.fr</strong>.</li>
<li><strong>Declarer votre adresse electronique de reception</strong> (email ou API).</li>
<li><strong>Mettre a jour votre logiciel de facturation</strong> (Tiime, Facture.net, Abby, Evoliz) : les principaux sont deja compatibles. Verifiez la mention &laquo; compatible Factur-X &raquo;.</li>
<li><strong>Collecter les SIREN de vos clients B2B</strong> (obligatoire). Ajouter une case &laquo; SIREN &raquo; au formulaire devis / contrat.</li>
<li><strong>Tester l'envoi d'une facture</strong> via le PPF sur un client volontaire des que disponible.</li>
</ol>

<h2>Cas particulier du micro-entrepreneur</h2>

<p>Meme si l'emission n'est obligatoire qu'en septembre 2027, des septembre 2026 vous pouvez recevoir des factures d'achat en electronique que vous devrez integrer a votre comptabilite.</p>

<p>Solutions simples pour micro :</p>
<ul>
<li><strong>Abby</strong> (gratuit jusqu'a 25 factures/mois) : conforme facture electronique</li>
<li><strong>Facture.net</strong> (gratuit) : export Factur-X disponible</li>
<li><strong>QuickBooks Solo</strong> (14 EUR/mois) : tout-en-un TPE</li>
</ul>

<h2>Impact sur votre tresorerie</h2>

<p>La facture electronique avec e-reporting accelere la detection des retards de paiement. L'administration pourra declencher <strong>automatiquement</strong> les penalites et interets si le client ne paie pas dans les delais legaux.</p>

<p>Cote positif : les grandes entreprises (qui sont soumises a l'emission des le 1er septembre 2026) devront vous payer plus vite (delai moyen prevu en baisse de 52 a 38 jours selon la Banque de France).</p>

<h2>Les amendes prevues</h2>
<ul>
<li>Absence de facture electronique (quand obligatoire) : <strong>15 EUR par facture</strong>, plafonnee a 15 000 EUR/an</li>
<li>e-reporting manquant : <strong>250 EUR par transmission</strong>, plafonnee a 15 000 EUR/an</li>
<li>Mauvaise transmission SIREN : <strong>15 EUR par erreur</strong></li>
</ul>

<p>Sanctions doucement pour la premiere annee, puis montee en regime.</p>

<h2>Les opportunites cachees</h2>

<h3>Reduction comptable</h3>
<p>Integration automatique dans votre comptabilite. Gain : <strong>2-4h/mois</strong> sur saisie manuelle. Votre expert-comptable peut baisser ses honoraires de 15-25 %.</p>

<h3>Suppression de la declaration TVA</h3>
<p>A terme (2028-2030), les entreprises qui emettent 100 % en electronique pourraient ne plus avoir a faire de CA3. Le fisc utilisera directement les donnees.</p>

<h3>Acceleration du recouvrement</h3>
<p>Moins de &laquo; je n'ai jamais recu la facture &raquo; puisque la transmission PPF a un accuse de reception legal.</p>

<h2>Checklist action des aujourd'hui</h2>
<ul>
<li>Ajouter case &laquo; SIREN &raquo; et &laquo; email facturation &raquo; sur vos devis</li>
<li>Choisir votre PDP (ou PPF par defaut)</li>
<li>Mettre a jour votre logiciel de facturation</li>
<li>S'inscrire au PPF (gratuit, 10 minutes)</li>
<li>Former votre collaborateur administratif (ou vous-meme) aux bases</li>
</ul>

<h2>En resume</h2>
<ul>
<li>Reception obligatoire : 1er septembre 2026 pour toutes les entreprises.</li>
<li>Emission obligatoire : 1er septembre 2027 pour les TPE et micro.</li>
<li>Format : Factur-X (PDF + XML), UBL ou CII via PDP ou PPF.</li>
<li>Cout : gratuit via PPF, ou 12-30 EUR/mois via PDP avec fonctions avancees.</li>
<li>SIREN de vos clients B2B obligatoire des maintenant pour la transition.</li>
</ul>
"""

a8 = render(
    slug="facture-electronique-obligatoire-artisan-btp-2026",
    title="Facture electronique obligatoire : ce qui change pour les artisans en 2026-2027",
    meta_desc="Facture electronique obligatoire : calendrier precis (sept 2026 reception / sept 2027 emission), format Factur-X, PDP, PPF, amendes. Tout ce qu'un artisan doit preparer.",
    keywords="facture electronique 2026, Factur-X artisan, PDP PPF BTP, Chorus Pro extension, e-reporting TPE",
    h1="Facture electronique obligatoire : le calendrier 2026-2027",
    read_min=8,
    summary_items=[
        "Calendrier officiel : reception 2026, emission 2027",
        "Formats Factur-X, UBL, CII : ce qu'il faut choisir",
        "PDP vs PPF : comparatif des plateformes en 2026",
        "Ce qu'il faut preparer des maintenant (5 etapes)",
        "Amendes prevues et opportunites (reduction comptable, CA3)",
    ],
    body_html=a8_body,
    related=[
        ("/blog-pro/tva-btp-2026-taux-matrice.html", "TVA BTP 2026 : matrice des taux"),
        ("/blog-pro/nouvelles-exigences-reglementaires-btp-2026.html", "Nouvelles exigences reglementaires BTP 2026"),
    ],
)
with open(os.path.join(OUT, "facture-electronique-obligatoire-artisan-btp-2026.html"), "w") as f:
    f.write(a8)


# ============ ARTICLE 9 : SECURITE CHANTIER / TMS ============
a9_body = """
<p>Dans le BTP, 1 artisan sur 4 aura un <strong>accident du travail</strong> dans les 10 annees qui viennent. Le BTP totalise <strong>2,5 fois plus d'accidents graves</strong> que la moyenne des autres secteurs. Et surtout, <strong>85 % des arrets longs viennent de TMS (Troubles Musculo-Squelettiques)</strong> lies a des gestes mal executes ou a du port de charges excessif.</p>

<p>Un accident, c'est 3-6 mois d'arret, potentiellement une invalidite, et <strong>la fin d'une activite independante</strong> pour beaucoup. Ce guide donne les 10 regles operationnelles qui divisent les risques par 5.</p>

<h2>Les 3 causes d'accident graves (statistiques AT-MP 2025)</h2>

<table><thead><tr><th>Cause</th><th>% accidents graves</th><th>Temps moyen d'arret</th></tr></thead><tbody>
<tr><td>Chutes (echafaudage, echelle, toiture)</td><td>32 %</td><td>89 jours</td></tr>
<tr><td>Manutention / TMS (dos, epaules)</td><td>41 %</td><td>56 jours</td></tr>
<tr><td>Outils manuels et electroportatifs</td><td>14 %</td><td>22 jours</td></tr>
<tr><td>Ecrasements / collisions chantier</td><td>8 %</td><td>118 jours</td></tr>
<tr><td>Autres (electrisation, brulures, produits chimiques)</td><td>5 %</td><td>45 jours</td></tr>
</tbody></table>

<h2>Les 10 regles operationnelles</h2>

<h3>1. Prevenir les chutes (la cause n&deg;1)</h3>
<ul>
<li><strong>Echafaudage &gt; 3 m</strong> : obligatoire. Plus jamais d'echelle sur toiture.</li>
<li><strong>Harnais et longe</strong> sur toit pente &gt; 15 % ou a plus de 3 m de hauteur.</li>
<li><strong>Plinthes et garde-corps</strong> sur echafaudages (hauteur 1 m min, plinthe 15 cm).</li>
<li><strong>Ne JAMAIS travailler seul sur toiture</strong>, meme une minute.</li>
</ul>

<h3>2. Port de charges : la bonne posture</h3>
<ul>
<li>Maximum <strong>25 kg pour homme, 15 kg pour femme</strong> (code du travail)</li>
<li>Au-dela : a deux, ou diable, ou transpalette</li>
<li>Flechir les genoux, pas le dos. Charge pres du corps.</li>
<li>Tourner avec les pieds, pas la colonne.</li>
<li>Pause de 5 min apres 20 min de port repete</li>
</ul>

<h3>3. EPI a TOUJOURS porter</h3>
<ul>
<li><strong>Casque</strong> : sur chantier des qu'il y a hauteur ou chute d'objet possible</li>
<li><strong>Chaussures de securite</strong> S3 ou S5 : semelle antiperforation + coque</li>
<li><strong>Gants</strong> adaptes au metier (cuir pour maconnerie, nitrile pour chimique, anti-coupure)</li>
<li><strong>Lunettes de protection</strong> : des qu'il y a projection (meulage, percage, decoupe)</li>
<li><strong>Masque FFP2 ou FFP3</strong> pour poussieres silice, amiante, laine de verre</li>
<li><strong>Bouchons / casque anti-bruit</strong> au-dela de 80 dB (disqueuse, percussion)</li>
</ul>

<h3>4. Outils electroportatifs : les 4 reflexes</h3>
<ol>
<li>Toujours debrancher avant changement d'accessoire (meule, foret)</li>
<li>Ne jamais desactiver les protections (capot de disqueuse, carter scie)</li>
<li>Verification visuelle du cable avant chaque utilisation</li>
<li>Ne jamais utiliser sur surface humide sans disjoncteur 30 mA</li>
</ol>

<h3>5. Amiante : obligatoire sous-section 4 (sous-traitance reparation)</h3>
<p>Avant tout chantier dans un batiment construit avant 1997, demander au client le <strong>DTA (Dossier Technique Amiante)</strong>. Si presence ou doute : formation SS4 obligatoire, EPI specifiques, balisage, declaration prealable.</p>

<h3>6. Plomb : encore present en renovation</h3>
<p>Peintures anterieures a 1950. Grattage, ponçage, demontage = exposition respiratoire et cutanee. Formation prealable, masque ventile, decontamination.</p>

<h3>7. Produits chimiques : 4 regles</h3>
<ul>
<li>Lire la FDS (Fiche de Donnees de Securite) avant usage</li>
<li>Ventilation systematique si local ferme</li>
<li>Ne jamais melanger deux produits sans verifier compatibilite</li>
<li>Stockage separe des incompatibles (acide / base / oxydant)</li>
</ul>

<h3>8. Manutention : investir dans l'aide mecanique</h3>
<p>Prix vs retour investissement :</p>
<ul>
<li>Diable monte-escalier : 180-400 EUR = +5 ans de carriere</li>
<li>Transpalette manuel : 150-300 EUR</li>
<li>Exosquelette passif (Hilti, Laevo) : 1 500-3 500 EUR</li>
<li>Tire-palan electrique : 250-600 EUR</li>
</ul>

<h3>9. Organisation chantier</h3>
<ul>
<li>Plan de prevention ecrit obligatoire si intervention coordonnee avec d'autres entreprises</li>
<li>Balisage des zones dangereuses (tranchees, zone de chute d'objets)</li>
<li>Acces propre et ordonne (80 % des chutes a plain-pied proviennent d'encombrement)</li>
<li>Eclairage suffisant (mini 200 lux zone travail)</li>
</ul>

<h3>10. Hygiene et pause</h3>
<ul>
<li>Hydratation : 1,5 L d'eau / 8h chantier, plus en ete</li>
<li>Pause de 15 min toutes les 2h30</li>
<li>Repas hors du chantier (poussiere, chimique)</li>
<li>Changer les vetements contamines avant de rentrer (amiante, plomb, silice)</li>
</ul>

<h2>Formations obligatoires 2026</h2>

<table><thead><tr><th>Formation</th><th>Duree</th><th>Cout</th><th>Renouvelable</th></tr></thead><tbody>
<tr><td>SST (Sauveteur Secouriste Travail)</td><td>2 jours</td><td>200-400 EUR</td><td>Tous les 2 ans</td></tr>
<tr><td>Amiante SS4</td><td>2 jours</td><td>450-900 EUR</td><td>Tous les 3 ans</td></tr>
<tr><td>Travail en hauteur</td><td>1-2 jours</td><td>250-500 EUR</td><td>Selon employeur</td></tr>
<tr><td>CACES (engins de chantier)</td><td>3-5 jours</td><td>600-1200 EUR</td><td>Tous les 5-10 ans</td></tr>
<tr><td>Electricite H0B0 (non-electricien)</td><td>1 jour</td><td>180-350 EUR</td><td>Tous les 3 ans</td></tr>
</tbody></table>

<p>Plupart sont financables par les OPCO (OPCO EP pour BTP) avec pret zero reste a charge.</p>

<h2>Document Unique d'Evaluation des Risques (DUER)</h2>

<p>Obligatoire des le premier salarie (meme apprenti). Redige et mis a jour annuellement par l'employeur. Identifie :</p>
<ul>
<li>Les risques presents dans l'activite (liste par poste)</li>
<li>Les mesures prises pour les prevenir</li>
<li>Les equipements de protection fournis</li>
</ul>

<p>En cas d'accident : <strong>absence de DUER = faute inexcusable presque automatique</strong>, indemnites 50-100 % plus elevees a charge de l'employeur.</p>

<h2>Maladies professionnelles specifiques BTP</h2>
<ul>
<li><strong>Tableau n&deg;57</strong> : affections periarticulaires (TMS epaules, coudes, poignets)</li>
<li><strong>Tableau n&deg;69</strong> : vibrations mecaniques (syndrome main-bras)</li>
<li><strong>Tableau n&deg;97</strong> : affections lombaires chroniques</li>
<li><strong>Tableau n&deg;42</strong> : surdite professionnelle</li>
<li><strong>Tableau n&deg;30</strong> : affections amiante (mesothelome, asbestose)</li>
</ul>

<p>Une maladie professionnelle reconnue donne droit a indemnisation CPAM, possiblement a retraite anticipee, et permet de changer de poste ou de metier.</p>

<h2>Aides financieres a la prevention</h2>

<ul>
<li><strong>Aide financiere simplifiee BTP</strong> (CARSAT) : jusqu'a 50 % du cout des equipements anti-chute (echafaudages, lignes de vie)</li>
<li><strong>TMS Pros</strong> : diagnostic gratuit + subvention 50 % pour materiel ergonomique</li>
<li><strong>Contrat de prevention OPPBTP</strong> : pour entreprises &lt; 50 salaries, cofinancement formations</li>
</ul>

<h2>En resume</h2>
<ul>
<li>Chutes et TMS = 73 % des accidents graves. Prevention focus la.</li>
<li>EPI : casque, chaussures S3/S5, gants, lunettes, masque FFP2+. Jamais d'exception.</li>
<li>Echafaudage des 3 m, harnais sur toiture pente. Pas d'echelle &laquo; juste 2 min &raquo;.</li>
<li>Formations SST + SS4 indispensables. Financement OPCO disponible.</li>
<li>DUER obligatoire des le premier salarie. Absence = risque juridique majeur.</li>
<li>Aides CARSAT et OPPBTP financent 50 % des equipements de prevention.</li>
</ul>
"""

a9 = render(
    slug="securite-chantier-prevention-tms-artisan-2026",
    title="Securite chantier et prevention TMS : 10 regles pour un artisan qui dure",
    meta_desc="Accident du travail BTP : 73 % des arrets viennent des chutes et TMS. 10 regles operationnelles, EPI obligatoires, formations, DUER et aides CARSAT pour diviser les risques par 5.",
    keywords="securite chantier BTP, TMS artisan, EPI obligatoires BTP, DUER artisan, formations securite BTP, amiante SS4",
    h1="Securite chantier et prevention TMS : 10 regles pour durer",
    read_min=10,
    summary_items=[
        "Les 3 causes des accidents graves (chutes, TMS, outils)",
        "Les 10 regles operationnelles qui divisent les risques par 5",
        "EPI obligatoires par metier et normes 2026",
        "Formations indispensables (SST, SS4, hauteur) et cout",
        "Aides CARSAT et OPPBTP qui financent 50 % du materiel",
    ],
    body_html=a9_body,
    related=[
        ("/blog-pro/assurance-decennale-btp-2026.html", "Assurance decennale BTP 2026"),
        ("/blog-pro/statut-juridique-artisan-btp-2026.html", "Quel statut choisir en 2026"),
    ],
)
with open(os.path.join(OUT, "securite-chantier-prevention-tms-artisan-2026.html"), "w") as f:
    f.write(a9)


# ============ ARTICLE 10 : EMBAUCHER APPRENTI ============
a10_body = """
<p>En 2026, un apprenti BTP coute en moyenne <strong>3 800 EUR/an</strong> a l'artisan une fois toutes les aides deduites. Contre 28 000-38 000 EUR pour un salarie junior en CDI. Pour la plupart des artisans qui n'osent pas embaucher, l'apprentissage est le levier le plus malin pour structurer son equipe.</p>

<p>Ce guide donne toute la procedure, les aides 2026, les pieges des contrats, et comment trouver un bon apprenti.</p>

<h2>Le contrat d'apprentissage en 2 minutes</h2>

<ul>
<li>Contrat de travail entre <strong>16 et 29 ans</strong> (ou plus si travailleur handicape, projet de creation)</li>
<li>Alternance : 1 semaine entreprise / 1 semaine CFA (ou 2/1, 3/1 selon formation)</li>
<li>Duree : 1 a 3 ans selon le diplome prepare</li>
<li>L'apprenti prepare un diplome (CAP, BP, Bac Pro, BTS, licence pro, master)</li>
<li>Vous etes son <strong>maitre d'apprentissage</strong> : experience &ge; 1 an dans le metier + diplome equivalent</li>
</ul>

<h2>Remuneration 2026 (bareme legal)</h2>

<table><thead><tr><th>Age</th><th>Annee 1</th><th>Annee 2</th><th>Annee 3</th></tr></thead><tbody>
<tr><td>16-17 ans</td><td>27 % SMIC (486 EUR/mois)</td><td>39 % SMIC (703 EUR)</td><td>55 % SMIC (991 EUR)</td></tr>
<tr><td>18-20 ans</td><td>43 % SMIC (775 EUR)</td><td>51 % SMIC (919 EUR)</td><td>67 % SMIC (1 207 EUR)</td></tr>
<tr><td>21-25 ans</td><td>53 % SMIC (955 EUR)</td><td>61 % SMIC (1 099 EUR)</td><td>78 % SMIC (1 405 EUR)</td></tr>
<tr><td>26 ans et +</td><td>100 % SMIC (1 802 EUR)</td><td>100 % SMIC</td><td>100 % SMIC</td></tr>
</tbody></table>

<p>SMIC mensuel 2026 : 1 802 EUR brut. Pourcentages du minimum. Vous pouvez payer plus (c'est un argument pour attirer un bon apprenti).</p>

<h2>Aides 2026 : ce qui rend l'apprentissage ultra rentable</h2>

<h3>Aide unique aux employeurs</h3>
<p><strong>6 000 EUR</strong> la premiere annee du contrat. Versee par France Travail, mensuellement (500 EUR/mois). Conditions :</p>
<ul>
<li>Entreprise &lt; 250 salaries</li>
<li>Contrat d'une duree minimale de 12 mois</li>
<li>Diplome de niveau &le; Bac+5 (tous les CAP et BP sont eligibles)</li>
</ul>

<h3>Exoneration de cotisations patronales</h3>
<p>Zero cotisation patronale sur la remuneration de l'apprenti (hors ATMP) pour les entreprises &lt; 11 salaries. Au-dela : reduction Fillon classique.</p>

<h3>Credit d'impot apprentissage</h3>
<p>Supprime en 2020, mais certaines regions le maintiennent ou compensent (Hauts-de-France, Grand Est, Bretagne) : 1 000-1 600 EUR de bonus regional.</p>

<h3>Prime d'embauche de l'apprenti (Travailleurs handicapes)</h3>
<p>Jusqu'a <strong>10 000 EUR</strong> supplementaires si l'apprenti est travailleur handicape (AGEFIPH). Cumulable avec l'aide unique.</p>

<h2>Simulation cout reel annee 1 (apprenti CAP, 18 ans)</h2>

<table><thead><tr><th>Poste</th><th>Montant</th></tr></thead><tbody>
<tr><td>Salaire brut annuel (775 EUR * 12)</td><td>9 300 EUR</td></tr>
<tr><td>Cotisations patronales (entreprise &lt; 11 sal.)</td><td>~350 EUR (ATMP)</td></tr>
<tr><td><strong>Cout employeur brut</strong></td><td><strong>9 650 EUR</strong></td></tr>
<tr><td>- Aide unique France Travail</td><td>- 6 000 EUR</td></tr>
<tr><td>- Bonus regional (variable)</td><td>- 0 a 1 500 EUR</td></tr>
<tr><td><strong>Cout net reel</strong></td><td><strong>2 150 a 3 650 EUR/an</strong></td></tr>
</tbody></table>

<p>Soit moins de <strong>300 EUR/mois</strong> pour un apprenti a temps plein sur vos chantiers, avec un potentiel de CDI en fin de parcours.</p>

<h2>Ou trouver un bon apprenti</h2>

<ul>
<li><strong>CFA BTP</strong> : le plus fiable. CFA du BTP d'IDF, CFA BTP de votre departement. Ils ont des bases de candidats motives.</li>
<li><strong>Job d'ete + PFMP</strong> : proposer un stage d'ete ou periode de formation en milieu pro. Permet de tester avant d'embaucher.</li>
<li><strong>ApprentissageFr.fr</strong> : plateforme nationale, candidatures directes.</li>
<li><strong>Alternance.gouv.fr</strong> : jobboard officiel (inscription gratuite comme entreprise).</li>
<li><strong>Ecoles de la 2e chance, missions locales</strong> : ciblent les jeunes motives sortis du systeme scolaire.</li>
<li><strong>Ressource invisible</strong> : les enfants et cousins de vos clients particuliers (bouche-a-oreille efficace).</li>
</ul>

<h2>Procedure d'embauche (45 min)</h2>

<ol>
<li>Selection du candidat (entretiens, test pratique 1-2 jours conseille)</li>
<li>Determiner le CFA avec l'apprenti (il doit s'y inscrire)</li>
<li>Remplir le <strong>Cerfa FA13</strong> (contrat d'apprentissage) avec l'apprenti et ses parents si mineur</li>
<li>Transmettre le contrat a l'<strong>OPCO EP</strong> (OPCO des TPE du batiment)</li>
<li>L'OPCO a 20 jours pour valider. Silence = accord.</li>
<li>L'apprenti passe sa visite medicale (2 mois)</li>
<li>Vous beneficiez de l'aide unique a partir du mois suivant l'embauche</li>
</ol>

<h2>Les 5 pieges a eviter</h2>

<h3>1. Ne pas etre maitre d'apprentissage qualifie</h3>
<p>Vous devez avoir le diplome meme niveau que l'apprenti prepare (ou +1) OU 2 ans d'experience dans le metier si diplome &le; niv 3. Sans cela, contrat refuse par l'OPCO.</p>

<h3>2. Ne pas laisser de temps a la formation</h3>
<p>L'apprenti doit passer <strong>400 heures minimum/an au CFA</strong> (CAP). Ce temps est considere comme du travail effectif et paye par vous (mais les aides le couvrent).</p>

<h3>3. Faire faire du &laquo; beurre &raquo; a l'apprenti</h3>
<p>Il doit apprendre son metier, pas transporter des sacs de ciment toute la journee. L'inspection du travail peut rompre le contrat et imposer des penalites si tache non en rapport avec le diplome prepare.</p>

<h3>4. Oublier la visite medicale</h3>
<p>Obligatoire dans les 2 mois. Absence = sanction penale et prolongation de la peri priode de renonciation.</p>

<h3>5. Rupture pendant la periode d'essai</h3>
<p>Periode d'essai : <strong>45 jours en entreprise</strong>. Apres, rupture uniquement pour faute grave ou d'un commun accord. Eviter les contrats &laquo; je verrai bien &raquo;.</p>

<h2>Fin du contrat : deux scenarios</h2>

<h3>Scenario 1 : Embauche en CDI</h3>
<p>L'apprenti a ete forme par vous, connait vos chantiers et clients. Le recruter en CDI est le ROI maximal de l'apprentissage. En moyenne, 57 % des apprentis BTP sont embauches par leur maitre d'apprentissage.</p>

<h3>Scenario 2 : Fin de contrat sans embauche</h3>
<p>L'apprenti quitte. Pas d'indemnite de licenciement (contrat a duree determinee). Vous pouvez reprendre un apprenti avec les memes aides.</p>

<h2>Temoignage chiffre (exemple concret)</h2>

<p>Jean, 34 ans, plombier chauffagiste en Seine-Saint-Denis, 90 kEUR CA en solo. A embauche Kevin (19 ans, CAP installateur thermique) en septembre 2024 pour 2 ans.</p>

<ul>
<li>Cout net annee 1 : 2 900 EUR apres aides</li>
<li>Cout net annee 2 : 3 600 EUR</li>
<li>CA genere par Kevin sur 2 ans : ~45 000 EUR additionnels</li>
<li>Embauche en CDI a fin septembre 2026 : salarie qualifie operationnel des le jour 1</li>
</ul>

<h2>En resume</h2>
<ul>
<li>Apprentissage = levier n&deg;1 pour structurer son equipe a moindre cout.</li>
<li>Cout net pour l'employeur : 2 000-4 000 EUR/an grace aux aides.</li>
<li>Aide unique 6 000 EUR/an + exoneration cotisations patronales + bonus region.</li>
<li>Embauche via CFA BTP, plateforme alternance.gouv.fr, missions locales.</li>
<li>57 % des apprentis BTP sont embauches en CDI a la fin : ROI enorme.</li>
<li>Cerfa FA13 + OPCO EP = 45 min de procedure administrative.</li>
</ul>
"""

a10 = render(
    slug="embaucher-apprenti-artisan-btp-2026",
    title="Embaucher un apprenti en 2026 : aides, cout reel et procedure pour artisan BTP",
    meta_desc="Apprenti BTP : moins de 300 EUR/mois grace aux aides 2026. Procedure complete, bareme, aide unique 6 000 EUR, Cerfa FA13, CFA. Eviter 5 pieges qui font refuser le contrat.",
    keywords="embaucher apprenti BTP, aide unique apprentissage 2026, CFA batiment, maitre apprentissage, alternance BTP",
    h1="Embaucher un apprenti BTP en 2026 : cout reel et procedure",
    read_min=9,
    summary_items=[
        "Bareme de remuneration legal 2026 par age et annee",
        "Les 4 aides qui rendent l'apprentissage quasi gratuit",
        "Simulation chiffree : moins de 300 EUR/mois tout compris",
        "Procedure d'embauche en 45 minutes",
        "Les 5 pieges qui font annuler le contrat par l'OPCO",
    ],
    body_html=a10_body,
    related=[
        ("/blog-pro/statut-juridique-artisan-btp-2026.html", "Quel statut juridique choisir en 2026"),
        ("/blog-pro/securite-chantier-prevention-tms-artisan-2026.html", "Securite chantier et prevention TMS"),
    ],
)
with open(os.path.join(OUT, "embaucher-apprenti-artisan-btp-2026.html"), "w") as f:
    f.write(a10)


print("Batch 2 : 5 articles generes.")
for slug in ["google-business-profile-artisan-seo-local", "aides-renovation-energetique-2026-maprimerenov-cee",
             "facture-electronique-obligatoire-artisan-btp-2026", "securite-chantier-prevention-tms-artisan-2026",
             "embaucher-apprenti-artisan-btp-2026"]:
    print(f"- {slug}.html")

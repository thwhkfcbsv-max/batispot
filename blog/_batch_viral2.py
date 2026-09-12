#!/usr/bin/env python3
"""Batch viral 2 : 10 articles client B2C (droits, negociation, decryptage)."""
from _template_gen import render

ARTICLES = []

# 11
ARTICLES.append({
  "slug": "refuser-chantier-80-pourcents-mes-droits",
  "title": "J'ai refuse mon chantier a 80 pourcents d'avancement : mes droits (guide 2026)",
  "meta": "Malfacon, retard, materiaux non conformes : comment refuser officiellement un chantier en cours et bloquer les paiements. Procedure, delais, textes 2026.",
  "kw": "refuser chantier, malfacon chantier droits, bloquer paiement artisan, litige travaux renovation",
  "h1": "Refuser un chantier a 80 pourcents : procedure legale et droits 2026",
  "read": 6,
  "summary": [
    "Les 4 motifs legaux pour refuser la reception d'un chantier",
    "La procedure LRAR et les delais a respecter",
    "Comment bloquer le solde tant que les reserves ne sont pas levees",
    "Recours en cas d'echec de l'artisan : decennale, biennale, garantie parfait achevement",
  ],
  "body": """
<p>Chantier de renovation salle de bain : a 80 pourcents d'avancement, vous constatez une infiltration, un carrelage mal pose, et des finitions absentes. L'artisan exige le solde de 30 pourcents avant de corriger. Que faire ?</p>

<h2>Les 4 motifs legaux pour refuser une reception</h2>

<h3>1. La malfacon visible</h3>
<p>Defaut apparent sur l'ouvrage (carrelage descell, peinture mal appliquee, joint d'etanche manquant). Article 1792 du Code civil : l'artisan a une obligation de resultat, pas seulement de moyens.</p>

<h3>2. La non-conformite au devis</h3>
<p>Le materiel pose ne correspond pas a ce qui etait prevu (ex: carrelage generique au lieu du modele specifie). Meme argument si les dimensions different.</p>

<h3>3. Le retard grave</h3>
<p>Le chantier depasse de plus de 30 pourcents le delai inscrit au devis sans justification ecrite. Exemple : devis 15 jours, chantier a 25 jours sans information de l'artisan.</p>

<h3>4. L'inachevement</h3>
<p>Des postes prevus au devis ne sont pas realises (ex: plinthes non posees, raccord electrique manquant, test de mise en service non fait).</p>

<h2>La procedure pas-a-pas</h2>

<h3>Etape 1 : le constat ecrit (J0)</h3>
<p>Prenez 20 a 50 photos datees (smartphone avec horodatage active). Listez chaque reserve de maniere factuelle (pas d'appreciation subjective).</p>

<h3>Etape 2 : LRAR a l'artisan (J0 + J2)</h3>
<p>Envoyez une Lettre Recommandee avec Accuse de Reception dans les 48h. Mention obligatoire : "Je reserve mon droit a la reception de l'ouvrage en raison des malfacons suivantes". Liste detaillee + photos + delai de reprise (15 jours ouvres).</p>

<div class="info-box"><strong>Modele LRAR :</strong> "Monsieur, je vous signifie mon refus de reception concernant les travaux realises au [adresse]. Les reserves suivantes sont constatees : [liste]. Vous disposez d'un delai de 15 jours ouvres pour la reprise de ces malfacons. A defaut, je saisirai [huissier/conciliateur/tribunal]. Cordialement."</div>

<h3>Etape 3 : bloquer le solde (immediatement)</h3>
<p>Le solde (derniers 10-30 pourcents) n'est du QU'APRES reception sans reserve. Vous avez le droit legal de <strong>consigner le solde aupres de la Caisse des Depots</strong> le temps du litige (article 1792-1 du Code civil). Formulaire sur <a href="https://www.consignations.caissedesdepots.fr">consignations.caissedesdepots.fr</a>.</p>

<h3>Etape 4 : constat d'huissier (J+15 si pas de reprise)</h3>
<p>Si l'artisan n'a pas repris les malfacons dans 15 jours, demandez un constat d'huissier (120-300 EUR). Il officialise la situation et aura une valeur de preuve en justice.</p>

<h3>Etape 5 : conciliation (J+30)</h3>
<p>Saisie gratuite d'un conciliateur de justice via <a href="https://www.conciliateurs.fr">conciliateurs.fr</a>. Taux de reussite : 55 pourcents. Delai moyen : 2-4 semaines. Obligatoire avant tribunal judiciaire pour les litiges inferieurs a 5 000 EUR.</p>

<h3>Etape 6 : tribunal judiciaire (J+60+)</h3>
<p>Dernier recours. Procedure au fond peut durer 12-24 mois. Privilegiez le <strong>refere expertise</strong> (delai 2-4 mois) si le probleme est technique : un expert judiciaire est nomme, son rapport servira de base a l'indemnisation.</p>

<h2>Les 3 garanties a activer</h2>

<h3>1. Garantie de parfait achevement (1 an)</h3>
<p>L'artisan doit reprendre tous les defauts signales pendant l'annee qui suit la reception. Article 1792-6 du Code civil. Gratuite, pas de franchise.</p>

<h3>2. Garantie biennale (2 ans)</h3>
<p>Couvre les equipements dissociables (robinetterie, radiateur, cuisine, chaudiere). Demander la reparation ou le remplacement dans les 2 ans.</p>

<h3>3. Garantie decennale (10 ans)</h3>
<p>Couvre tout ce qui compromet la solidite de l'ouvrage ou le rend impropre a sa destination (etancheite toiture, gros oeuvre, reseaux encastres). Activee sur declaration de sinistre aupres de l'assurance de l'artisan. Si artisan en liquidation, l'assurance paie quand meme.</p>

<h2>Le piege a eviter : la reception tacite</h2>
<div class="warning-box"><strong>Attention :</strong> si vous prenez possession de l'ouvrage (ex: vous commencez a utiliser la salle de bain, vous installez vos meubles), le tribunal peut considerer que vous avez "accepte tacitement" la reception. Vos recours seront limites. Restez hors de la zone contestee jusqu'a la reprise des malfacons.</div>

<h2>Que faire si l'artisan fait faillite</h2>
<p>Declarez votre creance au mandataire judiciaire dans les 2 mois de la publication au BODACC. Parallelement, activez la decennale de l'artisan : l'assurance paie meme si l'entreprise est liquidee. Demandez l'attestation d'assurance que vous aviez collectee avant signature (d'ou l'importance de la garder).</p>

<div class="info-box"><strong>BatiSpot :</strong> nous selectionnons uniquement des artisans avec decennale verifiee et etablie depuis minimum 3 ans. En cas de litige, notre equipe vous oriente sur la procedure.</div>
""",
  "related": [
    ("/blog/7-arnaques-renovation-2026.html", "Les 7 arnaques renovation 2026"),
    ("/blog/acompte-artisan-30-pourcents-maximum-legal.html", "Acompte artisan : 30% max legal"),
  ],
})

# 12
ARTICLES.append({
  "slug": "activer-decennale-artisan-ferme",
  "title": "Activer la decennale quand l'artisan a ferme : procedure 2026",
  "meta": "L'artisan est en liquidation ou a disparu, mais vous decouvrez une malfacon. Comment activer sa decennale 10 ans apres : procedure, delais, frais 2026.",
  "kw": "decennale artisan ferme, activer decennale, artisan liquidation malfacon, assurance decennale recours",
  "h1": "Activer la decennale quand l'artisan a ferme : la procedure 2026",
  "read": 5,
  "summary": [
    "La decennale couvre meme si l'entreprise a ete liquidee",
    "Comment retrouver l'assureur 5 ou 10 ans apres",
    "Les 3 types de sinistre couverts par la decennale",
    "Les delais a respecter pour ne pas perdre ses droits",
  ],
  "body": """
<p>Votre cuisine a ete posee en 2020 par un artisan qui a depuis ferme son entreprise. En 2025, une fuite d'eau revele que l'evacuation mal posee a pourri le plancher. Vous pensez etre seul face au probleme. Faux.</p>

<h2>Bonne nouvelle : la decennale survit a la disparition de l'artisan</h2>
<p>La loi Spinetta (1978) impose a tout artisan du BTP de souscrire une assurance decennale AVANT le debut du chantier. Cette assurance est souscrite au profit du <strong>beneficiaire de l'ouvrage</strong> (vous, maitre d'ouvrage), et elle couvre les sinistres <strong>meme si l'entreprise n'existe plus</strong>.</p>

<h2>Les 3 sinistres couverts par la decennale</h2>

<h3>1. Les dommages qui compromettent la solidite</h3>
<p>Exemples : effondrement d'un plancher, fissure structurelle, affaissement de terrasse, toiture qui cede. Tout ce qui met en danger la structure du bati.</p>

<h3>2. Les dommages qui rendent l'ouvrage impropre a sa destination</h3>
<p>Exemples : infiltration chronique qui empeche l'usage, defaut d'etancheite grave, reseau eau qui contamine, isolation inefficace au point de rendre un logement invivable.</p>

<h3>3. Les equipements indissociables</h3>
<p>Equipements <strong>integres</strong> au bati (chaudiere encastree, carrelage scell, faux-plafond maconne). A ne pas confondre avec les equipements dissociables (frigo, lave-linge, radiateur electrique branchable) qui relevent de la biennale (2 ans).</p>

<h2>Comment retrouver l'assureur de l'artisan disparu</h2>

<h3>Methode 1 : le devis d'origine</h3>
<p>Tout devis BTP valide contient la mention obligatoire "Assurance decennale X, contrat numero Y". Ressortez votre devis, facture ou contrat. L'assureur y est indique. Envoyez une declaration de sinistre en LRAR directement a cet assureur.</p>

<h3>Methode 2 : le fichier central des assureurs</h3>
<p>Si vous n'avez pas garde le devis, saisissez la <strong>Federation Francaise de l'Assurance (FFA)</strong>. Sur presentation de preuve de l'identite de l'artisan (SIRET), la FFA peut vous orienter vers l'assureur d'origine. <a href="https://www.ffa-assurance.fr">ffa-assurance.fr</a> - mediation en 6-10 semaines.</p>

<h3>Methode 3 : le mandataire judiciaire</h3>
<p>Si l'entreprise est en liquidation, le mandataire judiciaire nomme par le tribunal a acces aux contrats d'assurance souscrits. Contactez le tribunal de commerce de la ville du siege social.</p>

<h2>La procedure de declaration de sinistre</h2>

<h3>1. LRAR a l'assureur dans les 5 jours</h3>
<p>Delai legal : 5 jours ouvres apres decouverte du sinistre. Liste precise des desordres, photos datees, devis d'expertise si deja fait.</p>

<h3>2. Expertise contradictoire</h3>
<p>L'assureur mandate un expert dans les 30 jours. Vous pouvez assister a la visite. En desaccord, vous pouvez nommer votre propre expert aux frais de l'assureur (article L. 124-1 du Code des assurances).</p>

<h3>3. Devis de reparation</h3>
<p>L'expert chiffre les travaux de reprise. L'assureur propose une indemnisation. Vous pouvez accepter, negocier, ou saisir le tribunal en cas de refus manifeste.</p>

<h3>4. Versement</h3>
<p>Delai legal : 3 mois apres acceptation. Franchise typique : 0-1 500 EUR selon contrat.</p>

<h2>Les delais critiques a connaitre</h2>
<table>
<tr><th>Delai</th><th>Consequence</th></tr>
<tr><td>5 jours apres decouverte</td><td>Declaration de sinistre a l'assureur (LRAR)</td></tr>
<tr><td>10 ans apres reception du chantier</td><td>Expiration de la decennale (forclusion)</td></tr>
<tr><td>2 mois apres refus</td><td>Recours devant le tribunal</td></tr>
<tr><td>2 ans apres reception</td><td>Biennale (equipements dissociables)</td></tr>
<tr><td>1 an apres reception</td><td>Parfait achevement</td></tr>
</table>

<h2>Cas particulier : plusieurs entreprises</h2>
<p>Si votre renovation impliquait plusieurs corps de metier (plombier + electricien + maconnerie) et que le sinistre vient de l'interaction, declarer a chaque decennale. Les assureurs negocient entre eux la repartition de l'indemnisation.</p>

<h2>Frais et cout de la procedure</h2>
<ul>
<li>Declaration initiale : gratuite (simple LRAR)</li>
<li>Expert de votre partie : 800-2 500 EUR (remboursable)</li>
<li>Huissier pour constat : 120-300 EUR</li>
<li>Avocat si tribunal : 2 000-5 000 EUR forfait</li>
</ul>
<p>Cout total moyen pour activer une decennale : <strong>300 a 1 500 EUR</strong>, tous recuperables en cas de victoire. Utile si le prejudice depasse 8 000 EUR.</p>

<div class="info-box"><strong>BatiSpot :</strong> pour chaque artisan de notre reseau, nous archivons le contrat d'assurance decennale au moment de l'activation du profil. Meme 8 ans apres, vous retrouvez toutes les donnees en un clic.</div>
""",
  "related": [
    ("/blog/refuser-chantier-80-pourcents-mes-droits.html", "Refuser un chantier en cours"),
    ("/assurance-dommages-ouvrage-obligatoire.html", "Assurance dommages-ouvrage obligatoire"),
  ],
})

# 13
ARTICLES.append({
  "slug": "caution-bancaire-maprimrenov-qui-demande",
  "title": "Caution bancaire MaPrimeRenov' : qui peut vous la demander et pourquoi",
  "meta": "Depuis 2026, certains artisans exigent une caution bancaire pour MaPrimeRenov'. Est-ce legal ? Qui peut demander ? Comment se proteger.",
  "kw": "caution bancaire maprimrenov, caution artisan renovation, refus caution artisan, mandataire maprimrenov",
  "h1": "Caution bancaire MaPrimeRenov' : est-ce legal en 2026 ?",
  "read": 5,
  "summary": [
    "Qui peut exiger une caution pour MaPrimeRenov' en 2026",
    "Les 2 mecanismes : mandat de representation ou avance artisan",
    "Les risques en cas de signature d'une caution trop large",
    "Comment ne pas avoir besoin de caution du tout",
  ],
  "body": """
<p>Vous signez un devis de 18 000 EUR pour une isolation + PAC. L'artisan vous dit : "MaPrimeRenov' vous donne 7 500 EUR, je la touche en votre nom, mais je demande une caution bancaire au cas ou le dossier ne passe pas". Est-ce legal ?</p>

<h2>Les 2 mecanismes MaPrimeRenov' 2026</h2>

<h3>Mecanisme 1 : paiement direct au menage</h3>
<p>Vous payez l'artisan en totalite (ou en jalons), puis l'Anah vous verse la prime sur votre compte 3-6 semaines apres la fin des travaux.</p>
<ul>
<li>Avantage : aucune caution requise, vous gardez le controle</li>
<li>Inconvenient : vous devez avancer 100 pourcents du cout</li>
</ul>

<h3>Mecanisme 2 : mandat de representation a l'artisan</h3>
<p>Vous signez un mandat autorisant l'artisan a percevoir directement MaPrimeRenov' en votre nom. Vous ne payez que le reste a charge (ex: 10 500 EUR sur un devis de 18 000 EUR).</p>
<ul>
<li>Avantage : pas besoin d'avancer la prime</li>
<li>Inconvenient : certains artisans demandent une caution en garantie</li>
</ul>

<h2>Pourquoi l'artisan demande une caution</h2>
<p>Si le dossier MaPrimeRenov' est refuse apres la fin du chantier (RGE expire, DPE non fourni, revenus mal declares), l'artisan n'est pas paye des 7 500 EUR. Il vous reclame alors le complement. Si vous refusez, il active la caution.</p>

<h2>La caution bancaire : definition</h2>
<p>Une <strong>caution bancaire</strong> est un engagement de votre banque a payer l'artisan si vous ne payez pas, sous certaines conditions. Elle coute generalement 1.5-3 pourcents du montant par an, et bloque une partie de votre epargne ou de votre ligne de credit.</p>

<h2>Est-ce legal ?</h2>
<p>Oui, dans certaines conditions. Une caution bancaire pour securiser un paiement indirect (via mandataire) est juridiquement valide, a condition que :</p>
<ol>
<li>Le mandat est clairement explique et accepte</li>
<li>La caution ne depasse pas le montant susceptible d'etre refuse (prime MaPrimeRenov')</li>
<li>La caution est limitee en duree (6 mois apres fin du chantier max)</li>
<li>Le client est informe de son droit a une caution personnelle moins couteuse</li>
</ol>

<h2>Les 3 signaux d'alarme</h2>

<div class="warning-box">
<p><strong>1. La caution depasse le montant de la prime.</strong> Si l'artisan demande 15 000 EUR de caution pour une prime de 7 500 EUR, c'est abusif.</p>
<p><strong>2. La caution est "a premier demande" sans conditions.</strong> Cela signifie que l'artisan peut activer la caution sans prouver le refus de l'Anah. Exigez une caution "conditionnelle" activable uniquement sur production d'une notification de refus.</p>
<p><strong>3. La caution est illimitee en duree.</strong> Fixez une duree maximale (6 mois apres fin du chantier).</p>
</div>

<h2>Les alternatives a la caution bancaire</h2>

<h3>1. Garantie personnelle (simple)</h3>
<p>Vous signez un engagement personnel de paiement en cas de refus de la prime. Sans garantie bancaire, donc sans cout. L'artisan devra vous assigner au tribunal en cas de refus de paiement.</p>

<h3>2. Retenue de garantie</h3>
<p>Au moment du solde, vous retenez 10-15 pourcents du montant total pendant 6 mois, duree d'instruction de l'Anah. Si la prime tombe, vous liberez la retenue.</p>

<h3>3. Mieux preparer le dossier avec l'artisan</h3>
<p>90 pourcents des refus MaPrimeRenov' sont evitables si le dossier est bien prepare a la signature : RGE verifie, revenus exacts, travaux eligibles, DPE post-travaux anticipe. Demandez a l'artisan une charte de conformite.</p>

<h2>Que faire si un artisan refuse sans caution bancaire</h2>
<p>Changez d'artisan. Les artisans serieux proposent le mecanisme 1 (paiement direct au menage) OU acceptent une retenue de garantie sans passer par une caution bancaire. Exiger une caution bancaire est un signal de frilosite (pas forcement malhonnete, mais defavorable).</p>

<h2>Le cout reel d'une caution bancaire</h2>
<table>
<tr><th>Montant garanti</th><th>Duree</th><th>Frais approx.</th></tr>
<tr><td>5 000 EUR</td><td>6 mois</td><td>80-150 EUR</td></tr>
<tr><td>10 000 EUR</td><td>6 mois</td><td>150-300 EUR</td></tr>
<tr><td>15 000 EUR</td><td>1 an</td><td>300-550 EUR</td></tr>
<tr><td>25 000 EUR</td><td>1 an</td><td>500-900 EUR</td></tr>
</table>

<div class="info-box"><strong>BatiSpot :</strong> nos artisans partenaires acceptent majoritairement le mecanisme 1 (paiement menage). Nous vous aidons a preparer votre dossier MaPrimeRenov' avant signature pour eviter tout refus.</div>
""",
  "related": [
    ("/blog/maprimrenov-refuse-5-motifs.html", "MaPrimeRenov' refusee : les 5 motifs"),
    ("/blog/acompte-artisan-30-pourcents-maximum-legal.html", "Acompte artisan : 30% max legal"),
  ],
})

# 14
ARTICLES.append({
  "slug": "3-phrases-qui-font-fuir-artisans-serieux",
  "title": "Les 3 phrases qui font fuir les artisans serieux (et comment les eviter)",
  "meta": "Sans le savoir, certaines phrases lors du 1er contact eliminent les meilleurs artisans. Les 3 erreurs a eviter et les formulations qui fonctionnent en 2026.",
  "kw": "bien contacter artisan, premier contact artisan, artisan refuse devis, comment parler a artisan",
  "h1": "Les 3 phrases qui font fuir les artisans serieux",
  "read": 4,
  "summary": [
    "Les 3 formulations qui eliminent 80 pourcents des bons artisans des le 1er contact",
    "Pourquoi un bon artisan a le choix et privilegie les clients preparens",
    "Les 4 phrases qui font dire OUI au 1er rendez-vous",
    "Le timing ideal pour poser les questions budget",
  ],
  "body": """
<p>Vous avez appele 12 artisans, 9 n'ont jamais rappele, 3 ont envoye un devis decevant. Vous pensez manquer de chance. En realite, vos 3 premieres phrases au telephone ont elimine la majorite des bons artisans avant meme d'ouvrir un dossier.</p>

<h2>Pourquoi les meilleurs artisans ont le choix</h2>
<p>Un artisan BTP serieux (RGE, avis 4.5+, decennale solide) recoit en moyenne 8-15 sollicitations par semaine. Il ne peut en traiter que 4-6. Il selectionne. Les clients "a probleme" sont filtres des le 1er appel.</p>

<h2>Phrase 1 : "Combien vous prenez pour ..." (elimine 80 pourcents)</h2>
<p>Demander un prix au telephone sans visite technique est un signal fort de client inexperimente. Le bon artisan sait qu'aucun devis serieux ne peut etre donne sans mesurer le chantier. Les artisans qui repondent "450 EUR le m2" au telephone sont souvent les moins competents : ils font du volume, pas de la qualite.</p>

<div class="info-box"><strong>A la place, dites :</strong> "Je souhaite refaire [type de chantier]. Pouvez-vous passer voir pour un devis detaille ? Quand etes-vous disponible cette semaine ?"</div>

<h2>Phrase 2 : "Mon budget, c'est..." trop tot</h2>
<p>Annoncer un budget au 1er appel ferme les options. L'artisan va caler son devis sur votre budget, pas sur vos besoins reels. Si vous dites "budget max 10 000 EUR", vous recevez un devis a 9 800 EUR quels que soient vos besoins reels. Si votre chantier vaut en realite 6 500 EUR, vous avez paye 3 300 EUR de trop.</p>

<div class="info-box"><strong>A la place, dites :</strong> "Je voudrais un devis detaille avec le chiffrage par poste, ensuite on discutera des options."</div>

<h2>Phrase 3 : "J'ai deja deux autres devis plus bas" au 1er appel</h2>
<p>Menacer l'artisan des le 1er contact le repousse. Il sait que si vous l'avez appele, c'est qu'aucun des 2 autres ne convenait. Il va faire un devis rapide "pour la forme" sans s'investir. Resultat : un devis moyen qui ne vous apportera rien.</p>

<div class="info-box"><strong>A la place, dites :</strong> "Je fais une selection de 3 artisans, sur criteres qualite, serieux et prix. J'aimerais que vous en fassiez partie."</div>

<h2>Les 4 phrases qui font dire OUI</h2>

<h3>1. Mentionner la source de recommandation</h3>
<p>"Mon voisin Monsieur Dupont (ou le syndic, ou Google) vous a recommande". L'artisan sait que vous n'etes pas un appel froid. Taux de reponse : +60 pourcents.</p>

<h3>2. Indiquer que la decision n'est pas immediate</h3>
<p>"Je prepare mon chantier pour mai, j'ai le temps de choisir". L'artisan comprend que vous n'etes pas presse et valorisez la qualite plutot que la disponibilite immediate.</p>

<h3>3. Montrer que vous avez fait votre travail</h3>
<p>"J'ai regarde les tarifs, je sais que ce chantier vaut entre X et Y. Je cherche la meilleure proposition dans cette fourchette". Vous signalez que vous n'etes ni radin ni na&iuml;f.</p>

<h3>4. Proposer un rendez-vous concret</h3>
<p>"Quand etes-vous disponible pour venir voir ? Je peux me liberer samedi matin ou jeudi soir". Vous eliminez l'etape "on se rappellera" qui tue 40 pourcents des mises en relation.</p>

<h2>Le timing ideal pour poser les questions budget</h2>
<table>
<tr><th>Moment</th><th>Ce qu'il faut demander</th></tr>
<tr><td>1er appel</td><td>Disponibilite, delai, processus (rien sur le prix)</td></tr>
<tr><td>Visite sur site</td><td>Fourchette indicative, options, variantes</td></tr>
<tr><td>Reception devis</td><td>Detail par poste, materiaux, delais, garanties</td></tr>
<tr><td>Negociation</td><td>Rabais, paiement echelonne, group&eacute; avec voisins</td></tr>
<tr><td>Signature</td><td>Acompte, planning, penalites de retard</td></tr>
</table>

<h2>Les 3 questions qui valorisent le bon artisan</h2>
<ol>
<li>"Combien d'annees d'experience avez-vous sur ce type de chantier ?"</li>
<li>"Avez-vous des photos de chantiers similaires deja realises ?"</li>
<li>"Puis-je contacter un de vos anciens clients pour un retour d'experience ?"</li>
</ol>
<p>Un artisan qui hesite sur ces 3 questions n'est pas au niveau. Un artisan qui repond naturellement avec des references concretes est un bon.</p>

<div class="info-box"><strong>BatiSpot :</strong> nous presentons votre projet aux artisans partenaires de maniere optimisee. Les artisans savent que vous etes verifie et prepare. Taux de reponse : 95 pourcents sous 24h.</div>
""",
  "related": [
    ("/blog/negocier-devis-4-postes.html", "Negocier un devis : les 4 postes ou gagner 15%"),
    ("/blog/pourquoi-voisins-paient-moins-cher-meme-renovation.html", "Pourquoi vos voisins paient moins cher"),
  ],
})

# 15
ARTICLES.append({
  "slug": "negocier-devis-4-postes",
  "title": "Negocier un devis travaux : 4 postes ou vous pouvez gagner 15 pourcents",
  "meta": "Materiaux, main d'oeuvre, deplacement, honoraires : les 4 postes negociables d'un devis travaux. Les phrases qui fonctionnent et celles qui bloquent.",
  "kw": "negocier devis travaux, reduire prix artisan, negociation devis renovation, prix artisan negociable",
  "h1": "Negocier un devis : 4 postes ou vous pouvez gagner jusqu'a 15 pourcents",
  "read": 5,
  "summary": [
    "Les 4 postes d'un devis qui sont negociables en pratique",
    "Ceux qui ne le sont pas (et pourquoi insister est contre-productif)",
    "Les 5 phrases de negociation qui fonctionnent",
    "Le seuil au-dela duquel vous perdez la confiance de l'artisan",
  ],
  "body": """
<p>Contrairement a l'automobile, un devis BTP n'est pas fixe. Il est construit sur des choix (materiaux, main d'oeuvre, deplacement) qui peuvent etre ajustes si vous savez comment discuter. Sur un devis de 15 000 EUR, negocier correctement permet d'economiser 1 500-2 500 EUR sans perdre en qualite.</p>

<h2>Les 4 postes negociables</h2>

<h3>Poste 1 : les materiaux (jusqu'a 20 pourcents)</h3>
<p>Les artisans appliquent une marge de 15-25 pourcents sur les materiaux fournis. Sur un chantier ou les materiaux representent 40 pourcents du total (cas frequent en SDB ou cuisine), c'est 6-10 pourcents du devis global qui est negociable.</p>
<div class="info-box"><strong>Levier :</strong> proposez de fournir vous-meme les materiaux (Leroy Merlin Pro, Point.P particuliers). L'artisan facture uniquement sa pose, sans marge materiaux. Economie : 800-1 500 EUR sur un chantier moyen.</div>
<p><strong>Attention :</strong> l'artisan decline la garantie sur les piecs que vous fournissez. Gardez tickets et references.</p>

<h3>Poste 2 : le deplacement et forfait (jusqu'a 100 pourcents)</h3>
<p>Le "forfait deplacement" (80-250 EUR) est souvent negociable si vous etes dans la zone habituelle de l'artisan. S'il intervient dans votre quartier chaque semaine, le deplacement n'est pas un cout reel pour lui.</p>
<div class="info-box"><strong>Phrase :</strong> "Je vois que vous avez d'autres chantiers dans le quartier. Pouvez-vous supprimer le forfait deplacement dans le contexte d'un chantier local ?"</div>

<h3>Poste 3 : les honoraires maitrise d'oeuvre (jusqu'a 40 pourcents)</h3>
<p>Si l'artisan inclut 10-12 pourcents d'honoraires pour le suivi, ce poste est negociable si vous acceptez de piloter certaines decisions vous-meme (choix materiaux, relances sous-traitants, presence sur chantier les matins).</p>

<h3>Poste 4 : les options et variantes (100 pourcents chaque)</h3>
<p>Chaque option peut etre retiree ou modifiee. Exemples : meuble double vasque au lieu de simple vasque (+600 EUR), robinetterie encastree au lieu de mitigeur standard (+400 EUR), seche-serviettes electrique premium (+350 EUR vs. basique). Hierarchisez vos priorites et coupez le non-essentiel.</p>

<h2>Les 3 postes NON negociables</h2>

<h3>La main d'oeuvre pure</h3>
<p>Un electricien facture 38-55 EUR/h a Paris. Descendre sous 35 EUR = travail au noir ou ouvrier non declare. Eviter a tout prix (assurance decennale non valide).</p>

<h3>L'assurance et garanties</h3>
<p>Les cotisations decennale + RC Pro coutent 800-2 500 EUR par an a l'artisan. Integrees dans le prix global, elles sont repartries sur chaque chantier. Les negocier, c'est supprimer votre protection juridique.</p>

<h3>Les normes et obligations</h3>
<p>Mise aux normes NF C 15-100, attestation Q18 pour soudures, consuel pour electricite neuve : ces postes legaux ne sont pas optionnels. Un artisan qui accepte de les retirer est dangereux.</p>

<h2>Les 5 phrases de negociation qui fonctionnent</h2>
<ol>
<li><strong>"J'ai trois autres devis sur ce chantier, tous dans la fourchette [X-Y] EUR. Pouvez-vous vous aligner ?"</strong> - Fonctionne si votre fourchette est realiste.</li>
<li><strong>"Je peux signer cette semaine si vous m'accordez une remise de X pourcents"</strong> - La signature rapide a de la valeur pour l'artisan.</li>
<li><strong>"Je suis flexible sur la date de demarrage. Si vous avez un creneau libre, je peux m'adapter"</strong> - Remplir un creneau vaut bien 5-8 pourcents.</li>
<li><strong>"J'accepte de regler en trois jalons au lieu de cinq"</strong> - La simplification administrative est un levier indirect.</li>
<li><strong>"Je laisserai un avis Google detaille et une photo du rendu"</strong> - Pour les artisans avec peu d'avis, c'est un atout marketing.</li>
</ol>

<h2>Le seuil a ne pas franchir</h2>
<div class="warning-box"><strong>Ne descendez jamais au-dela de 15 pourcents du devis initial.</strong> Au-dela, l'artisan va rogner sur les materiaux ou les heures. Vous paierez l'economie en avenants, retards, ou malfacons. Entre 8 et 15 pourcents, c'est la zone optimale : l'artisan conserve sa marge mais accepte de la reduire.</div>

<h2>Le rabais pour paiement comptant</h2>
<p>Attention : un artisan qui accepte une remise contre un paiement en especes (sans facture) pratique le travail dissimule. Vous perdez la decennale, le droit au credit d'impots, et la garantie juridique. <strong>A eviter absolument</strong>.</p>

<h2>Le piege du sur-engagement</h2>
<p>Si votre negociation fait hesiter l'artisan sur la rentabilite du chantier, il va soit refuser, soit accepter a contrecoeur. Dans le second cas, vous aurez un artisan demotive, qui fera le minimum syndical. Le bon niveau de negociation est celui qui lui permet encore de bien travailler.</p>

<div class="info-box"><strong>BatiSpot :</strong> nos artisans partenaires pratiquent des prix de marche competitifs des le 1er devis. Pas besoin de marchander a +20 pourcents pour obtenir un prix juste.</div>
""",
  "related": [
    ("/blog/3-phrases-qui-font-fuir-artisans-serieux.html", "Les 3 phrases qui font fuir les artisans serieux"),
    ("/blog/pourquoi-voisins-paient-moins-cher-meme-renovation.html", "Pourquoi vos voisins paient moins cher"),
  ],
})

# 16
ARTICLES.append({
  "slug": "chantier-copropriete-qui-paie-quoi-2026",
  "title": "Chantier en copropriete : qui paie quoi en 2026 (tableau complet)",
  "meta": "Ravalement, toiture, parties communes, travaux privatifs : la repartition detaillee des couts en copropriete. Quotes-parts, PPT, charges speciales 2026.",
  "kw": "copropriete travaux qui paie, charges copropriete travaux, ppt copropriete, tantiemes travaux",
  "h1": "Chantier en copropriete : qui paie quoi ? Le tableau complet 2026",
  "read": 6,
  "summary": [
    "La difference entre parties privatives et communes (vraies et fausses)",
    "Le calcul des quotes-parts par type de travaux",
    "Le PPT (plan pluriannuel de travaux) obligatoire 2026 et son financement",
    "Les travaux que vous pouvez refuser de payer",
  ],
  "body": """
<p>Vous recevez un proces-verbal d'assemblee generale : 85 000 EUR de travaux votes, votre quote-part serait de 8 400 EUR. Comment verifier que le calcul est correct ? Et quels sont les travaux que vous pouvez refuser de financer ?</p>

<h2>Parties privatives vs. parties communes</h2>

<h3>Parties privatives : vous seul payez</h3>
<ul>
<li>L'interieur de votre appartement (sols, murs, peinture)</li>
<li>Votre plomberie apres le compteur</li>
<li>Vos menuiseries (fenetres, portes palieres)</li>
<li>Vos equipements dedies (chaudiere individuelle, cumulus)</li>
</ul>

<h3>Parties communes generales : tous les coproprietaires paient</h3>
<ul>
<li>Facade exterieure (hors menuiseries)</li>
<li>Toiture, charpente</li>
<li>Hall, escaliers, ascenseur</li>
<li>Colonnes d'eau et de chauffage collectives</li>
<li>Elements structurels (murs porteurs, planchers)</li>
</ul>

<h3>Parties communes speciales : seuls certains paient</h3>
<p>Exemples :</p>
<ul>
<li>Ascenseur : les lots du RDC ne paient pas (reglement).</li>
<li>Chauffage collectif : seuls les lots raccordes.</li>
<li>Terrasse privative en partie commune : seul l'usager paie.</li>
</ul>

<h2>Le calcul des quotes-parts</h2>

<h3>Principe general</h3>
<p>Votre quote-part est proportionnelle a vos <strong>tantiemes</strong> (millie&egrave;mes de copropriete), indiques sur votre reglement de copropriete ou etat descriptif de division.</p>
<p>Formule : Cout total x (vos tantiemes / 10 000)</p>

<h3>Exemples</h3>
<table>
<tr><th>Chantier</th><th>Cout total</th><th>Vos tantiemes</th><th>Votre part</th></tr>
<tr><td>Ravalement facade</td><td>120 000 EUR</td><td>850/10 000</td><td>10 200 EUR</td></tr>
<tr><td>Refection toiture</td><td>85 000 EUR</td><td>850/10 000</td><td>7 225 EUR</td></tr>
<tr><td>Renovation hall + palier</td><td>32 000 EUR</td><td>850/10 000</td><td>2 720 EUR</td></tr>
<tr><td>Remplacement ascenseur</td><td>55 000 EUR</td><td>1 100/10 000 (ascenseur)</td><td>6 050 EUR</td></tr>
</table>

<h2>Le PPT : obligatoire depuis 2023</h2>
<p>La loi Climat et Resilience (2021) a impose le <strong>Plan Pluriannuel de Travaux (PPT)</strong> pour les copropriete de plus de 15 ans. Applicable progressivement :</p>
<ul>
<li>Copropriete plus de 200 lots : oblige depuis le 01/01/2023</li>
<li>Copropriete plus de 50 lots : depuis le 01/01/2024</li>
<li>Copropriete de moins de 50 lots : depuis le 01/01/2025</li>
</ul>
<p>Le PPT liste les travaux a realiser sur 10 ans avec budget indicatif. Il doit etre actualise tous les 10 ans.</p>

<h2>Le fonds travaux : 5 pourcents minimum</h2>
<p>Chaque copropriete doit constituer un <strong>fonds travaux</strong> alimente par une cotisation annuelle d'au moins 5 pourcents du budget previsionnel (ou 2.5 pourcents si petite copropriete). Ce fonds finance les travaux du PPT.</p>

<h2>Les travaux que vous pouvez refuser</h2>

<h3>Travaux non votes en AG</h3>
<p>Tout appel de fonds doit etre vote en AG (majorite selon type). Si le syndic procede a un appel de fonds sans vote, vous pouvez refuser et exiger le remboursement.</p>

<h3>Travaux voluptuaires imposes</h3>
<p>Si la majorite impose des travaux purement esthetiques (ex: pose de carreaux de luxe dans le hall) sans utilite ni urgence, un coproprietaire peut contester en justice. Delai : 2 mois apres le PV.</p>

<h3>Erreur de quote-part</h3>
<p>Si le reglement de copropriete a une erreur sur vos tantiemes (cas frequent apres division de lots), vous pouvez demander une regularisation. Procedure : expertise geometre + AG speciale.</p>

<h2>Les travaux eligibles a MaPrimeRenov' Copro</h2>
<p>Depuis 2024, la copropriete peut beneficier de <strong>MaPrimeRenov' Copro</strong> pour les travaux d'ampleur dans les parties communes (isolation, chaudiere collective, ravalement isolant).</p>
<ul>
<li>Plafond : 25 pourcents du cout eligible, max 3 750 EUR par logement</li>
<li>Bonus 500 EUR/logement si sortie de passoire thermique</li>
<li>Bonus 500 EUR/logement si gain 2 classes DPE</li>
</ul>
<p>Exemple concret : ravalement isolant ITE de 150 000 EUR pour 12 logements, aide MaPrimeRenov' Copro : 37 500 EUR (3 125 EUR par logement en moyenne). Reste a charge par coproprietaire : 9 375 EUR au lieu de 12 500 EUR.</p>

<h2>Les delais de paiement</h2>
<table>
<tr><th>Echeance</th><th>Quand</th></tr>
<tr><td>1er appel (acompte)</td><td>30-60 jours apres vote AG</td></tr>
<tr><td>2e appel (avancement)</td><td>A mi-chantier</td></tr>
<tr><td>Solde</td><td>A reception des travaux</td></tr>
<tr><td>Regularisation annuelle</td><td>Avec les comptes annuels</td></tr>
</table>

<h2>Que faire si vous ne pouvez pas payer</h2>
<p>Le syndic peut vous proposer un <strong>etalement</strong> (jusqu'a 10 mensualites sans frais dans la plupart des cas). Au-dela, vous pouvez demander un <strong>credit collectif de copropriete</strong> si l'AG l'a vote. Taux moyen : 3.5-5 pourcents sur 7-15 ans.</p>
<p>En derniere extremite, l'Anah peut accorder une <strong>aide locataires</strong> ou subvention exceptionnelle sous conditions de ressources.</p>

<div class="info-box"><strong>BatiSpot :</strong> pour les travaux privatifs en copropriete (cuisine, salle de bain, peinture), obtenez 3 devis d'artisans verifies en 24h, sans passer par le syndic.</div>
""",
  "related": [
    ("/renovation-copropriete-aides-2026.html", "Renovation copropriete aides 2026"),
    ("/blog/maprimrenov-refuse-5-motifs.html", "MaPrimeRenov' refusee : les 5 motifs"),
  ],
})

# 17
ARTICLES.append({
  "slug": "passoire-thermique-g-vendre-renover-louer",
  "title": "Passoire thermique G : vendre, renover ou louer ? Le comparatif 2026",
  "meta": "Logement DPE G : interdit de location depuis 2025. Les 3 options (vendre, renover, louer vide) detailles avec chiffrage fiscal et strategique 2026.",
  "kw": "passoire thermique G vendre, logement G renovation, interdiction location G, dpe G strategie",
  "h1": "Passoire thermique G : vendre, renover ou louer ? Comparatif chiffre 2026",
  "read": 7,
  "summary": [
    "Les 3 strategies principales et leur rentabilite sur 10 ans",
    "Le calendrier des interdictions de location DPE (F en 2028, E en 2034)",
    "Le piege de la vente avec decote DPE : -18 pourcents en moyenne",
    "Quand la renovation vaut le coup (seuil : 25 000 EUR)",
  ],
  "body": """
<p>Depuis le 1er janvier 2025, les logements classes G (passoires thermiques) sont <strong>interdits a la location nouvelle</strong>. Pour les bails en cours, pas de renouvellement ni de revision du loyer. A partir du 1er janvier 2028, ce sera le cas des F. Et en 2034, les E.</p>
<p>Si vous etes proprietaire d'un logement G, vous avez 3 options. Laquelle choisir ?</p>

<h2>Option 1 : Vendre en l'etat</h2>

<h3>La realite du marche</h3>
<p>Selon les donnees des notaires de France (2025), la decote moyenne pour un logement DPE G est de <strong>18 pourcents</strong> vs. un logement classe C dans la meme localisation. Cette decote est croissante : 11 pourcents en 2022, 15 pourcents en 2024, 18 pourcents en 2025.</p>

<h3>Exemple chiffre</h3>
<table>
<tr><th>Situation</th><th>Prix</th></tr>
<tr><td>Appartement 60m2 Paris 15e DPE C</td><td>720 000 EUR</td></tr>
<tr><td>Meme appartement DPE G</td><td>590 000 EUR</td></tr>
<tr><td>Decote en valeur</td><td>-130 000 EUR (-18%)</td></tr>
</table>

<h3>Avantages / Inconvenients</h3>
<ul>
<li><strong>+</strong> Liquidite immediate</li>
<li><strong>+</strong> Pas de stress chantier</li>
<li><strong>-</strong> Perte de 18 pourcents vs. prix possible apres renovation</li>
<li><strong>-</strong> Plus-value fiscale si residence secondaire</li>
</ul>

<h2>Option 2 : Renover pour sortir de G</h2>

<h3>Le budget moyen pour passer de G a D</h3>
<p>Sortir de G (etiquette 421 kWh/m2/an et plus) pour atteindre D (230-330 kWh/m2/an) sur un appartement 60m2 necessite typiquement :</p>
<ul>
<li>Isolation murs donnant sur exterieur : 4 000-8 000 EUR</li>
<li>Changement menuiseries : 6 000-12 000 EUR</li>
<li>Remplacement chauffage (PAC ou chaudiere condensation) : 8 000-14 000 EUR</li>
<li>VMC hygro : 1 500-3 000 EUR</li>
<li>Audit energetique obligatoire : 800 EUR</li>
</ul>
<p>Budget total : <strong>20 000-38 000 EUR TTC</strong>. Avec MaPrimeRenov' Parcours Accompagne + CEE : reste a charge 9 000-18 000 EUR selon revenus.</p>

<h3>Gain sur le prix de vente</h3>
<p>Apres renovation et obtention DPE D, le prix de vente remonte entre -5 et +2 pourcents vs. DPE C de reference. Soit, sur l'exemple 60m2 Paris :</p>
<ul>
<li>Vente avant : 590 000 EUR (DPE G)</li>
<li>Cout renovation : 28 000 EUR (budget typique) - aides 12 000 EUR = 16 000 EUR</li>
<li>Vente apres : 690 000 EUR (DPE D)</li>
<li><strong>Gain net : 690 000 - 590 000 - 16 000 = 84 000 EUR</strong></li>
</ul>

<h3>Avantages / Inconvenients</h3>
<ul>
<li><strong>+</strong> Valorisation du bien</li>
<li><strong>+</strong> Possibilite de louer en parallele pendant 2-3 ans</li>
<li><strong>-</strong> 6-10 mois de chantier</li>
<li><strong>-</strong> Risque technique et financier</li>
<li><strong>-</strong> Besoin de tresorerie d'avance</li>
</ul>

<h2>Option 3 : Louer vide (sortir du meuble)</h2>

<h3>Ce qui change en 2026</h3>
<p>L'interdiction de location s'applique aux <strong>nouveaux baux</strong> (y compris locations meublees et saisonnieres). Si vous avez un bail en cours signe avant 2025, il continue SAUF en cas de :</p>
<ul>
<li>Fin de bail avec nouveau locataire</li>
<li>Demande de revision de loyer</li>
<li>Passage meuble vers vide ou inversement</li>
</ul>

<h3>Louer vide longue duree pour contourner</h3>
<p>La location vide longue duree de residence principale beneficie d'un regime transitoire : jusqu'a fin 2027, les baux G existants peuvent etre renouveles sans obligation de renovation prealable. Apres 2028, applicable aussi aux F.</p>

<h3>Avantages / Inconvenients</h3>
<ul>
<li><strong>+</strong> Maintient de revenus locatifs</li>
<li><strong>+</strong> Evite la vente a decote</li>
<li><strong>-</strong> Duree limitee : au mieux 3 ans</li>
<li><strong>-</strong> Decote de loyer vs. marche (environ -12 pourcents)</li>
<li><strong>-</strong> Report du probleme, pas une solution durable</li>
</ul>

<h2>Le comparatif sur 10 ans (appartement 60m2 Paris)</h2>
<table>
<tr><th>Strategie</th><th>Gain ou perte 10 ans</th></tr>
<tr><td>Vendre maintenant</td><td>-130 000 EUR (decote) + reinvestissement</td></tr>
<tr><td>Renover + vendre dans 2 ans</td><td>+84 000 EUR net</td></tr>
<tr><td>Renover + garder 10 ans + vendre</td><td>+115 000 EUR (valorisation + loyers)</td></tr>
<tr><td>Louer 3 ans + vendre DPE G en 2028</td><td>-145 000 EUR (decote accrue)</td></tr>
<tr><td>Ne rien faire + interdiction location</td><td>-60 000 a -100 000 EUR (vacance + maintenance)</td></tr>
</table>

<h2>Le seuil de rentabilite de la renovation</h2>
<p>La renovation vaut le coup si le cout TOTAL apres aides reste inferieur a <strong>20-25 pourcents de la decote DPE</strong>. Formule simplifiee :</p>
<p><strong>Rentabilite = (Gain de valorisation - Cout net renovation) / Cout net renovation</strong></p>
<p>Sur l'exemple Paris : (130 000 - 16 000) / 16 000 = <strong>7.1 x</strong>. Tres rentable.</p>
<p>En zone rurale, avec un prix au m2 de 1 500 EUR, le calcul peut devenir defavorable : la decote en valeur absolue est faible, mais les travaux sont presque aussi chers.</p>

<h2>Les aides specifiques G-F</h2>
<ul>
<li><strong>MaPrimeRenov' Parcours Accompagne</strong> : bonus 10 pourcents pour sortie de G/F</li>
<li><strong>Eco-PTZ</strong> : jusqu'a 50 000 EUR a taux zero</li>
<li><strong>CEE renforces</strong> : +30 pourcents pour sortie de passoire</li>
<li><strong>Deficit foncier double</strong> : 10 700 EUR/an jusqu'a fin 2026 pour bailleurs</li>
</ul>

<div class="info-box"><strong>BatiSpot :</strong> nos artisans partenaires realisent des renovations energetiques completes avec audit + DPE initial + DPE post-travaux integres. Vous sortez de G en 4-8 mois avec reste a charge optimise.</div>
""",
  "related": [
    ("/blog/maprimrenov-refuse-5-motifs.html", "MaPrimeRenov' refusee : les 5 motifs"),
    ("/dpe-passoire-thermique-que-faire.html", "DPE passoire thermique : que faire"),
  ],
})

# 18
ARTICLES.append({
  "slug": "vrai-cout-pac-air-eau",
  "title": "Le vrai cout d'une PAC air-eau (hors pubs mensongeres) en 2026",
  "meta": "Une PAC air-eau ne coute pas 1 EUR. Les vrais prix 2026 par puissance, le detail du devis, les aides, et le reste a charge realiste.",
  "kw": "prix pac air eau, cout reel pompe a chaleur, devis pac air eau, reste a charge pac",
  "h1": "Le vrai cout d'une PAC air-eau en 2026 (hors promesses marketing)",
  "read": 6,
  "summary": [
    "Les fourchettes de prix par puissance en 2026 (8 a 22 kW)",
    "Le detail du devis : unite, ballon, radiateurs, plancher chauffant",
    "Les aides reelles et le reste a charge typique par profil",
    "Les erreurs de dimensionnement qui coutent 35 pourcents en plus",
  ],
  "body": """
<p>"PAC a 1 EUR avec aides gouvernementales" : cette promesse existe depuis 2015 et elle est toujours fausse en 2026. Le vrai cout d'une PAC air-eau correctement installee va de 9 500 EUR TTC pour une petite puissance a 22 000 EUR TTC pour une grande maison. Les aides couvrent 35-75 pourcents selon revenus, pas 100 pourcents.</p>

<h2>Les fourchettes de prix 2026</h2>
<table>
<tr><th>Puissance</th><th>Pour quel logement</th><th>Prix TTC installe</th></tr>
<tr><td>8 kW</td><td>Appartement T3-T4 (60-90m2)</td><td>9 500-13 500 EUR</td></tr>
<tr><td>11 kW</td><td>Maison 110-140m2 bien isolee</td><td>12 500-16 500 EUR</td></tr>
<tr><td>14 kW</td><td>Maison 140-180m2 moyennement isolee</td><td>14 500-19 500 EUR</td></tr>
<tr><td>18 kW</td><td>Maison 180-240m2 ou ancien mal isole</td><td>17 000-22 500 EUR</td></tr>
<tr><td>22 kW</td><td>Tres grande maison, piscine, peu isolee</td><td>21 000-27 000 EUR</td></tr>
</table>

<h2>Le detail d'un devis type (PAC 11 kW maison 120m2)</h2>
<table>
<tr><th>Poste</th><th>Prix HT</th></tr>
<tr><td>Unite exterieure PAC 11 kW (marque qualite : Atlantic, Daikin, De Dietrich)</td><td>4 800 EUR</td></tr>
<tr><td>Unite interieure (module hydraulique)</td><td>1 200 EUR</td></tr>
<tr><td>Ballon tampon 50L</td><td>450 EUR</td></tr>
<tr><td>Ballon d'eau chaude integre ou separe 200L</td><td>1 100 EUR</td></tr>
<tr><td>Radiateurs basse temperature (8 unites)</td><td>2 400 EUR</td></tr>
<tr><td>Raccordements hydrauliques, vase expansion, soupape</td><td>650 EUR</td></tr>
<tr><td>Circuit frigorifique (pre-charge, connexion, mise en service)</td><td>480 EUR</td></tr>
<tr><td>Electricite puissance 3 kVA, disjoncteur dedie</td><td>380 EUR</td></tr>
<tr><td>Support anti-vibratile et chape si besoin</td><td>350 EUR</td></tr>
<tr><td>Depose ancien systeme (chaudiere gaz ou fioul)</td><td>580 EUR</td></tr>
<tr><td>Main d'oeuvre pose (3-5 jours)</td><td>2 800 EUR</td></tr>
<tr><td>Main d'oeuvre mise en service et tests</td><td>420 EUR</td></tr>
<tr><td>Sous-total HT</td><td>15 610 EUR</td></tr>
<tr><td>TVA 5.5%</td><td>859 EUR</td></tr>
<tr><td><strong>Total TTC</strong></td><td><strong>16 469 EUR</strong></td></tr>
</table>

<h2>Les aides 2026</h2>
<table>
<tr><th>Dispositif</th><th>Conditions</th><th>Montant typique</th></tr>
<tr><td>MaPrimeRenov'</td><td>RGE QualiPAC, logement plus de 15 ans</td><td>2 000-5 000 EUR selon revenus</td></tr>
<tr><td>CEE (prime energie)</td><td>Cumulable</td><td>2 500-4 500 EUR</td></tr>
<tr><td>TVA 5.5 pourcents</td><td>Au lieu de 20%</td><td>Economie 2 500-3 500 EUR</td></tr>
<tr><td>Eco-PTZ</td><td>Taux 0 sur 20 ans</td><td>Jusqu'a 15 000 EUR</td></tr>
<tr><td>Aides locales (region, departement)</td><td>Variable</td><td>0-2 000 EUR</td></tr>
</table>

<h2>Le reste a charge par profil de revenus</h2>
<p>PAC 11 kW a 16 500 EUR TTC :</p>
<ul>
<li><strong>Revenus tres modestes (MaPrimeRenov' Bleu)</strong> : aides 9 500 EUR, reste 7 000 EUR</li>
<li><strong>Revenus modestes (MaPrimeRenov' Jaune)</strong> : aides 7 000 EUR, reste 9 500 EUR</li>
<li><strong>Revenus intermediaires (MaPrimeRenov' Violet)</strong> : aides 5 500 EUR, reste 11 000 EUR</li>
<li><strong>Revenus superieurs (MaPrimeRenov' Rose)</strong> : aides 3 000 EUR, reste 13 500 EUR</li>
</ul>

<h2>Les erreurs de dimensionnement (surcout 25-40 pourcents)</h2>

<h3>Sur-dimensionnement</h3>
<p>Installer 14 kW pour une maison qui en necessite 10 kW. Consequence : la PAC demarre-arrete en permanence (cycling), usure prematuree, bruit, consommation electrique +20 pourcents. Economie du devis : 1 500 EUR. Surcout vie : 2 000 EUR.</p>

<h3>Sous-dimensionnement</h3>
<p>Installer 8 kW alors qu'il en faut 11. L'appoint electrique (resistance) se declenche en hiver : facture EDF qui explose. Difference : 800-1 500 EUR/an de chauffage en plus.</p>

<div class="warning-box"><strong>Le piege du "devis rapide" :</strong> certains artisans proposent une PAC sans audit thermique prealable. Resultat : 1 chantier sur 3 est mal dimensionne. Exigez un bilan thermique avant signature (cout 250-500 EUR, souvent inclus par les bons artisans).</div>

<h2>Les PAC a fuir en 2026</h2>
<ul>
<li>PAC air-air presentee comme "air-eau" (pas les memes aides)</li>
<li>PAC chinoise sans garantie longue duree (duree de vie 5-8 ans au lieu de 15+)</li>
<li>PAC sans ballon tampon (cycling, usure prematuree)</li>
<li>PAC mise en "tout ou rien" au lieu de modulation</li>
</ul>

<h2>Duree de vie et cout d'entretien</h2>
<ul>
<li>Duree de vie moyenne : 15-20 ans (marques qualite), 8-12 ans (entree de gamme)</li>
<li>Entretien obligatoire annuel par pro (si gaz R32) : 150-250 EUR/an</li>
<li>Remplacement fluide frigorigene tous les 5-10 ans : 300-600 EUR</li>
<li>Remplacement unite exterieure apres 15-20 ans : 2 500-4 500 EUR</li>
</ul>
<p>Cout total de possession sur 15 ans : <strong>19 000-24 000 EUR</strong> pour une PAC 11 kW (achat + entretien). Chauffage electrique equivalent : 27 000-34 000 EUR (facture EDF plus elevee). Gain net : 5 000-10 000 EUR.</p>

<div class="info-box"><strong>BatiSpot :</strong> nos artisans partenaires RGE QualiPAC realisent un audit thermique inclus dans le devis PAC. Dimensionnement optimise, materiel fiable, aides calculees avec precision.</div>
""",
  "related": [
    ("/guide-installation-pompe-a-chaleur-idf.html", "Guide installation PAC Ile-de-France"),
    ("/blog/devis-chauffe-eau-anormal-reconnaitre.html", "Devis chauffe-eau anormal : reconnaitre"),
  ],
})

# 19
ARTICLES.append({
  "slug": "acompte-artisan-30-pourcents-maximum-legal",
  "title": "Acompte artisan : 30 pourcents maximum, meme si le devis dit 50 pourcents",
  "meta": "La loi, la jurisprudence et les chartes RGE plafonnent l'acompte artisan a 30 pourcents en 2026. Comment refuser un acompte de 50 pourcents sans perdre le chantier.",
  "kw": "acompte artisan maximum, pourcentage acompte travaux, acompte 50 pourcents refuser, acompte rge",
  "h1": "Acompte artisan : 30 pourcents maximum en 2026 (meme si le devis dit plus)",
  "read": 4,
  "summary": [
    "La loi n'impose pas de plafond, mais la jurisprudence limite a 30 pourcents",
    "Les chartes RGE et MaPrimeRenov' plafonnent officiellement a 30 pourcents",
    "Les cas ou un acompte plus eleve peut se justifier",
    "Comment refuser un acompte abusif sans perdre le chantier",
  ],
  "body": """
<p>L'artisan vient signer et demande 50 pourcents d'acompte sur un devis de 18 000 EUR. Soit 9 000 EUR avant le premier coup de marteau. Vous hesitez. Est-ce normal ? Non. La norme actuelle en 2026 est 30 pourcents maximum.</p>

<h2>Ce que dit la loi</h2>

<h3>Aucun plafond legal explicite</h3>
<p>Le Code de la consommation ne fixe pas de plafond legal d'acompte pour les travaux BTP (contrairement aux services payants a l'avance, plafonnes a 30 pourcents par l'article L. 114-1). Les parties sont libres de negocier.</p>

<h3>La jurisprudence limite a 30 pourcents</h3>
<p>Plusieurs arrets de cour d'appel (Paris 2018, Lyon 2020, Bordeaux 2022) considerent qu'un acompte superieur a 30 pourcents cree une <strong>obligation disproportionnee</strong> pour le client, notamment si l'artisan n'apporte aucune preuve de necessite (commande materiel specifique, etc.).</p>

<h3>Les chartes RGE plafonnent a 30 pourcents</h3>
<p>La charte qualite RGE 2026 (signee par les artisans certifies) impose : "L'acompte demande ne doit pas exceder 30 pourcents du montant du devis. Un acompte superieur ne peut etre demande qu'avec justification ecrite et accord express du client."</p>
<p>MaPrimeRenov' Parcours Accompagne 2026 retient la meme regle : un acompte superieur a 30 pourcents peut invalider le dossier.</p>

<h2>Les 4 motifs qui peuvent justifier plus de 30 pourcents</h2>

<h3>1. Materiel sur mesure paye d'avance</h3>
<p>Exemple : menuiserie sur mesure fabriquee a la commande, cuisine sur mesure. L'artisan doit commander et payer avant de livrer. Un acompte de 40-50 pourcents est defendable, a condition d'etre formalise separement (tranche "materiel" vs. tranche "main d'oeuvre").</p>

<h3>2. Chantier long avec achats etales</h3>
<p>Exemple : renovation complete avec plusieurs lots (electricite, plomberie, menuiserie). L'artisan peut demander 30 pourcents a la signature + 20 pourcents a commande materiel. Total atteint 50 pourcents mais en 2 tranches distinctes.</p>

<h3>3. Chantier eloigne</h3>
<p>Si l'artisan doit se deplacer loin (plus de 80 km), un acompte renforce couvre les frais de mobilisation. Typiquement : 35-40 pourcents. Rare en Ile-de-France.</p>

<h3>4. Client nouveau sans references</h3>
<p>Si vous etes un nouveau client sans historique, l'artisan peut demander un acompte plus eleve pour se proteger. C'est psychologique, pas legal. Vous pouvez refuser en mettant en avant vos references bancaires (RIB, releve bancaire).</p>

<h2>Comment refuser un acompte abusif</h2>

<h3>Phrase 1 : la regle RGE</h3>
<p>"J'ai verifie la charte RGE 2026, elle plafonne l'acompte a 30 pourcents. Merci de modifier le devis en consequence."</p>

<h3>Phrase 2 : proposition alternative</h3>
<p>"Je peux vous proposer 30 pourcents a la signature, 40 pourcents a mi-chantier, 30 pourcents a la reception. Cela vous couvre tout au long du chantier."</p>

<h3>Phrase 3 : la clause de materiel separe</h3>
<p>"Si vous devez commander du materiel specifique d'avance, ajoutons une tranche 'materiel' clairement identifiee. Je peux regler ce materiel directement a votre fournisseur par virement pour vous decharger."</p>

<h2>Le paiement directement au fournisseur : l'astuce gagnante</h2>
<p>Pour des achats importants (chaudiere 4 500 EUR, cuisine 8 000 EUR), vous pouvez regler directement le fournisseur (Point.P, Cedeo, IKEA Pro) sur presentation du bon de commande signe. L'artisan n'a pas besoin d'avance de tresorerie. Votre acompte tombe mecaniquement a 15-20 pourcents.</p>

<h2>Les signaux d'alarme</h2>
<div class="warning-box">
<p><strong>Acompte 50 pourcents + paiement en especes :</strong> fuyez. Probable travail dissimule ou escroquerie.</p>
<p><strong>Acompte 60 pourcents + urgence artificielle :</strong> l'artisan insiste pour signer aujourd'hui avec 60 pourcents d'acompte. C'est un pattern connu d'escroqueries. Changez d'artisan.</p>
<p><strong>Acompte 70 pourcents avec promesse de debut "la semaine prochaine" :</strong> jamais. Attendez de voir le chantier demarre avant de depasser 30 pourcents.</p>
</div>

<h2>Le bon contrat de paiement</h2>
<table>
<tr><th>Jalon</th><th>Paiement</th><th>Conditions</th></tr>
<tr><td>Signature</td><td>30%</td><td>Acompte de reservation</td></tr>
<tr><td>Debut effectif du chantier</td><td>20%</td><td>Ouverture de chantier constatee</td></tr>
<tr><td>Mi-chantier</td><td>30%</td><td>Avancement 50% constate (PV ou photos)</td></tr>
<tr><td>Fin des travaux avant reception</td><td>15%</td><td>Chantier termine, avant reception</td></tr>
<tr><td>Reception sans reserve</td><td>5%</td><td>Solde final</td></tr>
</table>

<h2>Le recours si vous avez deja paye un acompte trop eleve</h2>
<p>Si vous avez signe avec 50 pourcents d'acompte et que l'artisan ne demarre pas, vous avez plusieurs leviers :</p>
<ol>
<li>LRAR de mise en demeure de commencer les travaux sous 15 jours</li>
<li>Si pas de reaction : resolution du contrat + demande de remboursement integral</li>
<li>Saisine du tribunal de proximite si le montant depasse 5 000 EUR</li>
<li>Signalement DGCCRF si schema d'abus repete</li>
</ol>

<div class="info-box"><strong>BatiSpot :</strong> nos artisans partenaires respectent la regle des 30 pourcents d'acompte. Contrats clairs, jalons definis, pas de demande abusive.</div>
""",
  "related": [
    ("/blog/refuser-chantier-80-pourcents-mes-droits.html", "Refuser un chantier en cours"),
    ("/blog/caution-bancaire-maprimrenov-qui-demande.html", "Caution bancaire MaPrimeRenov'"),
  ],
})

# 20
ARTICLES.append({
  "slug": "combien-temps-renover-t3-planning-reel",
  "title": "Combien de temps pour renover un T3 : planning reel par phase (2026)",
  "meta": "Un T3 60m2 renove en 3 semaines ? Faux. Le vrai planning phase par phase, avec duree realiste, retards typiques et comment accelerer.",
  "kw": "duree renovation t3, planning renovation appartement, temps travaux renovation, combien temps renover",
  "h1": "Combien de temps pour renover un T3 ? Planning reel 2026 phase par phase",
  "read": 6,
  "summary": [
    "Le planning realiste d'un T3 en renovation complete : 12 a 16 semaines",
    "Pourquoi les artisans annoncent 6 semaines et livrent en 14",
    "Les 5 retards les plus frequents (et comment les eviter)",
    "Comment reduire le planning de 30 pourcents avec une bonne preparation",
  ],
  "body": """
<p>"Rassurez-vous, je vous fais la renovation complete en 6 semaines". 6 mois apres, votre T3 n'est toujours pas livre. 8 chantiers sur 10 depassent le delai annonce de 40-80 pourcents. Voici le planning reel 2026.</p>

<h2>Le vrai planning T3 60m2 renovation complete</h2>
<table>
<tr><th>Phase</th><th>Duree reelle</th><th>Intervenants</th></tr>
<tr><td>Conception et permis</td><td>3-6 semaines</td><td>Architecte ou maitre d'oeuvre, mairie</td></tr>
<tr><td>Selection artisans et devis</td><td>2-4 semaines</td><td>Vous, 4-6 artisans</td></tr>
<tr><td>Demolition et depose</td><td>3-5 jours</td><td>Maconnerie generaliste</td></tr>
<tr><td>Gros oeuvre et structure</td><td>5-10 jours</td><td>Macon, charpentier si besoin</td></tr>
<tr><td>Electricite passage cables</td><td>4-6 jours</td><td>Electricien</td></tr>
<tr><td>Plomberie passage canalisations</td><td>4-7 jours</td><td>Plombier</td></tr>
<tr><td>Isolation et cloisons</td><td>5-8 jours</td><td>Platrier, isolateur</td></tr>
<tr><td>Fenetres et menuiseries</td><td>2-3 jours</td><td>Menuisier</td></tr>
<tr><td>Pose chape et ragreage</td><td>1 jour + 7 jours de sechage</td><td>Carreleur</td></tr>
<tr><td>Carrelage et faience</td><td>5-8 jours</td><td>Carreleur</td></tr>
<tr><td>Finitions electricite / plomberie</td><td>3-5 jours</td><td>Electricien, plombier</td></tr>
<tr><td>Cuisine et salle de bain (pose)</td><td>3-5 jours</td><td>Cuisiniste, plombier</td></tr>
<tr><td>Sols (parquet, stratif&eacute;)</td><td>3-5 jours</td><td>Parqueteur</td></tr>
<tr><td>Peinture</td><td>5-8 jours</td><td>Peintre</td></tr>
<tr><td>Reception et reserves</td><td>1-2 semaines</td><td>Vous + chaque artisan</td></tr>
<tr><td><strong>TOTAL</strong></td><td><strong>12-16 semaines</strong></td><td></td></tr>
</table>

<h2>Pourquoi les artisans annoncent 6 semaines</h2>
<p>L'artisan calcule le chantier en <strong>jours homme effectifs</strong>. Un T3 a 45-55 jours de travail cumules. Sur 5 jours ouvres par semaine, c'est mathematiquement 9-11 semaines. Mais il oublie :</p>
<ul>
<li>Le sechage des chapes et enduits (12-18 jours totaux)</li>
<li>Les delais entre les corps de metier (1-3 jours entre chaque)</li>
<li>Les retards de livraison materiaux (2-6 jours par poste)</li>
<li>Les imprevus structurels (1 chantier sur 3)</li>
<li>Les validations client (choix materiaux, couleurs, positions)</li>
</ul>

<h2>Les 5 retards les plus frequents</h2>

<h3>1. Les imprevus structurels (1 a 3 semaines)</h3>
<p>Mur porteur non prevu, poutre a renforcer, plancher affaisse. Decouverts en demolition, ils stoppent tout le reste. Solution : audit structurel prealable (500-1 200 EUR) avant signature.</p>

<h3>2. Les retards fournisseurs (1 a 4 semaines)</h3>
<p>Carrelage rupture de stock, cuisine retardee, chauffe-eau en reapprovisionnement. Solution : commander tous les materiaux strategiques 4 semaines avant demarrage, pas au jour J.</p>

<h3>3. Les conflits de planning entre artisans (1 a 2 semaines)</h3>
<p>Electricien passe en 4 jours, puis plombier 4 jours, mais ils veulent intervenir simultanement car ils le peuvent physiquement. En pratique, conflit sur le passage des gaines. Solution : planning pilote (par vous ou maitre d'oeuvre).</p>

<h3>4. Les validations client qui trainent (3 jours a 2 semaines)</h3>
<p>L'artisan attend votre validation de la couleur du carrelage, du modele de robinetterie, de la position des prises. Chaque validation en retard de 3 jours x 5 validations = 15 jours de perdus. Solution : decider AVANT demarrage sur 90 pourcents des choix.</p>

<h3>5. Les reserves en reception (1 a 3 semaines)</h3>
<p>Reception officielle : vous trouvez 8-15 reserves (joints, peinture, finitions). Reprise : 3-10 jours + nouvelle visite. Solution : faire une pre-reception informelle 3 jours avant la reception officielle, pour anticiper.</p>

<h2>Comment reduire le planning de 30 pourcents</h2>

<h3>1. Tout decider avant demarrage</h3>
<p>Couleurs, materiaux, modeles, marques : tout fige par ecrit avant le premier coup de marteau. Gain : 10-15 jours.</p>

<h3>2. Choisir un maitre d'oeuvre unique</h3>
<p>Un seul interlocuteur pilote tous les artisans. Les conflits de planning disparaissent. Gain : 7-10 jours. Cout : 8-12 pourcents du devis.</p>

<h3>3. Acheter les materiaux strategiques en amont</h3>
<p>Cuisine commandee 8 semaines avant pose, chaudiere 6 semaines avant, carrelage 4 semaines avant. Gain : 10-14 jours.</p>

<h3>4. Prevoir un appartement temporaire</h3>
<p>Si vous habitez sur place pendant les travaux, vous bloquez certaines phases (demolition, passage cables). En liberant le chantier 100 pourcents, gain 7-12 jours.</p>

<h3>5. Poser une penalite de retard</h3>
<p>Inscrire au devis : "Chaque jour de retard apres [date] donne lieu a une penalite de 50-150 EUR/jour". Effet dissuasif reel. Gain : 5-8 jours.</p>

<h2>Planning optimise T3 60m2 (10 semaines)</h2>
<table>
<tr><th>Semaine</th><th>Activite</th></tr>
<tr><td>S1</td><td>Demolition, depose, gros oeuvre</td></tr>
<tr><td>S2-3</td><td>Electricite passage + plomberie passage</td></tr>
<tr><td>S4</td><td>Isolation, cloisons, menuiseries</td></tr>
<tr><td>S5</td><td>Chape et sechage</td></tr>
<tr><td>S6-7</td><td>Carrelage, faience</td></tr>
<tr><td>S8</td><td>Cuisine, salle de bain, finitions electricite/plomberie</td></tr>
<tr><td>S9</td><td>Peinture, sols</td></tr>
<tr><td>S10</td><td>Finitions, reception, reserves</td></tr>
</table>

<h2>Penalites de retard : quels montants legaux</h2>
<p>Les penalites sont libres contractuellement. Usage : 50-150 EUR/jour pour un chantier residentiel, 0.2-0.5 pourcents du montant total par jour de retard. Plafond jurisprudentiel : 10-15 pourcents du devis global.</p>

<div class="info-box"><strong>BatiSpot :</strong> nos artisans partenaires fournissent un planning detaille phase par phase avec engagement de delai. Retards moyens : moins de 8 pourcents, vs. 40 pourcents sur la moyenne du marche.</div>
""",
  "related": [
    ("/blog/renovation-60m2-paris-vrai-cout-2026.html", "Renovation 60m2 Paris : vrai cout 2026"),
    ("/duree-travaux-renovation-planning-type.html", "Duree travaux renovation : planning type"),
  ],
})

# Generate
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _template_gen import render

count = 0
for a in ARTICLES:
    html = render(
        slug=a["slug"],
        title=a["title"],
        meta_desc=a["meta"],
        keywords=a["kw"],
        h1=a["h1"],
        read_min=a["read"],
        summary_items=a["summary"],
        body_html=a["body"],
        related=a.get("related"),
    )
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), a["slug"] + ".html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    count += 1

print(f"Batch viral 2 : {count} articles generes.")

#!/usr/bin/env python3
"""Batch 1 : 5 articles experts - Fiscalite, Decennale, Statut juridique, Marches publics, Impayes."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _template_gen import render

OUT = os.path.dirname(__file__)

# ============ ARTICLE 1 : TVA BTP ============
a1_body = """
<p>La TVA dans le BTP est une jungle. <strong>Trois taux cohabitent (5,5 %, 10 %, 20 %)</strong> selon la nature des travaux, l'age du logement et le type de client. Une erreur de taux = redressement avec majoration, ou pire, refacturation au client six mois apres le chantier.</p>

<p>Ce guide donne la matrice complete 2026 et les pieges concrets que l'URSSAF et la DGFiP sanctionnent le plus souvent.</p>

<h2>Les 3 taux de TVA applicables au BTP</h2>

<table><thead><tr><th>Taux</th><th>Travaux concernes</th><th>Conditions</th></tr></thead><tbody>
<tr><td><strong>5,5 %</strong></td><td>Renovation energetique (isolation, PAC, chaudiere biomasse, VMC double flux, fenetres classe A)</td><td>Logement &gt; 2 ans, usage d'habitation principal ou secondaire</td></tr>
<tr><td><strong>10 %</strong></td><td>Renovation courante (peinture, carrelage, plomberie, electricite, petite maconnerie, pose sanitaire)</td><td>Logement &gt; 2 ans, usage d'habitation</td></tr>
<tr><td><strong>20 %</strong></td><td>Construction neuve, extension &gt; 10 % surface, local commercial, agrandissement de plus de 9 m<sup>2</sup></td><td>Tout le reste (par defaut)</td></tr>
</tbody></table>

<h2>TVA 5,5 % : les travaux eligibles en 2026</h2>

<p>La liste officielle est dans l'annexe IV du CGI et a ete mise a jour en janvier 2026. Travaux concernes :</p>
<ul>
<li><strong>Isolation thermique</strong> des murs, combles, planchers bas, toitures</li>
<li><strong>Pompes a chaleur</strong> air/eau, eau/eau, geothermique (COP &ge; 3,4 pour air/eau)</li>
<li><strong>Chaudieres</strong> a biomasse, condensation gaz tres haute performance</li>
<li><strong>Chauffe-eau solaire</strong>, thermodynamique</li>
<li><strong>VMC double flux</strong> (recuperation &ge; 85 %)</li>
<li><strong>Fenetres et portes</strong> a Uw &le; 1,3 W/m<sup>2</sup>.K (depuis janvier 2026)</li>
<li><strong>Regulation et programmation</strong> du chauffage (thermostats connectes eligibles sous conditions)</li>
</ul>

<div class="warning-box"><strong>Piege frequent :</strong> la main-d'oeuvre ET les fournitures doivent etre facturees par <strong>le meme artisan</strong> pour beneficier du 5,5 %. Si le client achete la PAC chez un fournisseur et vous ne posez que la main-d'oeuvre, <strong>vous devez facturer a 20 %</strong> la pose seule.</div>

<h2>TVA 10 % : travaux de renovation courants</h2>

<p>Tout ce qui ameliore, transforme, amenage ou entretient un logement de plus de 2 ans, sans toucher a la performance energetique. Exemples :</p>
<ul>
<li>Peinture, revetements sols et murs</li>
<li>Plomberie (remplacement sanitaire, robinetterie)</li>
<li>Electricite courante (remise aux normes, ajout de prises)</li>
<li>Menuiserie interieure</li>
<li>Pose de cuisine amenagee (mais pas les electromenagers &mdash; 20 %)</li>
</ul>

<h3>Attestation client obligatoire</h3>
<p>Pour facturer a 10 % ou 5,5 %, vous devez <strong>faire signer au client une attestation</strong> (formulaire <strong>Cerfa n&deg;1300*04</strong> ou <strong>1301*04</strong>). Sans cette attestation, en cas de controle, vous etes redresse : l'administration vous reclame la difference de TVA + penalites.</p>

<div class="info-box"><strong>Bon reflexe :</strong> agrafer l'attestation signee au devis accepte et la conserver 5 ans. En cas de controle, elle protege l'artisan (le client devient responsable de la fausse declaration s'il a menti sur l'age du logement).</div>

<h2>TVA 20 % : cas ou vous devez l'appliquer</h2>

<p>Par defaut, toute prestation BTP est a 20 %. Vous passez a 10 % ou 5,5 % <strong>uniquement</strong> si vous pouvez justifier que :</p>
<ol>
<li>Le logement a plus de 2 ans <strong>au moment du debut des travaux</strong></li>
<li>Il est a usage d'habitation (principal ou secondaire, pas locatif professionnel)</li>
<li>Les travaux sont dans la liste eligible</li>
<li>L'attestation est signee par le client</li>
</ol>

<p>Cas ou le 20 % s'impose meme si les autres criteres sont remplis :</p>
<ul>
<li>Construction ou extension de plus de 10 % de la surface</li>
<li>Surelevation portant la surface totale au-dela de 9 m<sup>2</sup></li>
<li>Travaux sur local commercial, bureaux, industrie</li>
<li>Pose d'equipements electromenagers, alarmes, piscines hors-sol, abris de jardin &lt; 20 m<sup>2</sup></li>
<li>Terrassement, travaux d'espaces verts non lies a une construction</li>
</ul>

<h2>Les 5 erreurs qui entrainent un redressement</h2>

<h3>1. Appliquer 5,5 % sur des travaux non eligibles</h3>
<p>Exemple : remplacement d'une fenetre qui n'atteint pas le Uw &le; 1,3 depuis janvier 2026. L'ancien seuil de 1,6 n'est plus valide. Verifier la fiche technique avant de facturer.</p>

<h3>2. Oublier l'attestation Cerfa</h3>
<p>Un controleur fiscal qui arrive 3 ans apres le chantier demandera les attestations. Si elles manquent : TVA redressee au taux normal + interets de retard + majoration 10 a 40 %.</p>

<h3>3. Facturer 10 % sur un logement neuf</h3>
<p>&laquo; Neuf &raquo; au sens fiscal = logement acheve depuis moins de 2 ans. Un logement livre en mars 2024 est &laquo; neuf &raquo; jusqu'en mars 2026. Toute intervention = 20 %.</p>

<h3>4. Melanger main-d'oeuvre et fournitures du client</h3>
<p>Si le client fournit le materiel (ex : achete sa PAC chez Leroy Merlin) et vous n'installez que, <strong>toute la prestation passe a 20 %</strong>. Vous ne pouvez facturer 5,5 % que si <strong>vous</strong> vendez ET installez le materiel.</p>

<h3>5. Ne pas distinguer travaux d'entretien et ameliorations</h3>
<p>Ramonage, entretien chaudiere, debouchage canalisation = <strong>20 %</strong> par defaut (prestation de services courante), sauf dans le cadre d'un contrat d'entretien lie a une chaudiere performante installee par le meme artisan (10 %). Verifier au cas par cas.</p>

<h2>Modele de ligne TVA sur facture</h2>

<table><thead><tr><th>Prestation</th><th>Montant HT</th><th>TVA</th><th>TTC</th></tr></thead><tbody>
<tr><td>Depose ancienne chaudiere</td><td>180 EUR</td><td>5,5 %</td><td>189,90 EUR</td></tr>
<tr><td>Fourniture PAC air/eau 8 kW (COP 4,2)</td><td>7 200 EUR</td><td>5,5 %</td><td>7 596 EUR</td></tr>
<tr><td>Pose PAC et raccordements</td><td>1 800 EUR</td><td>5,5 %</td><td>1 899 EUR</td></tr>
<tr><td>Ajout d'une prise electrique cuisine</td><td>90 EUR</td><td>10 %</td><td>99 EUR</td></tr>
<tr><td><strong>Total</strong></td><td><strong>9 270 EUR</strong></td><td></td><td><strong>9 783,90 EUR</strong></td></tr>
</tbody></table>

<p>La facture doit <strong>detailler chaque ligne avec son taux</strong>. Un total global avec &laquo; TVA 5,5 % &raquo; sans ventilation est irregulier.</p>

<h2>Auto-liquidation TVA : cas BTP entre pro</h2>

<p>Quand vous sous-traitez (ou etes sous-traitant) dans le batiment pour un chantier entre professionnels assujettis, c'est le <strong>preneur</strong> (le donneur d'ordre) qui declare la TVA, pas vous. La mention obligatoire sur la facture : <strong>&laquo; Autoliquidation &raquo;</strong>. Vous facturez HT.</p>

<p>Cela concerne les sous-traitants Batiment qui facturent a un entrepreneur principal lui-meme assujetti. Regle CGI article 283-2 nonies.</p>

<h2>Quand facturer a 0 % (export / DOM-TOM)</h2>
<ul>
<li><strong>Exports UE entre assujettis</strong> : 0 % avec mention &laquo; Exoneration TVA art. 262 ter I du CGI &raquo; et numero TVA intracommunautaire du client</li>
<li><strong>DOM</strong> (Guadeloupe, Martinique, Reunion) : taux reduit 8,5 % (ou 2,10 %) selon la nature</li>
<li><strong>Guyane et Mayotte</strong> : exoneration TVA (pas de TVA locale)</li>
</ul>

<h2>Franchise en base (micro-entrepreneur)</h2>

<p>En micro-entreprise, tant que vous etes sous les seuils (<strong>36 800 EUR services, 91 900 EUR ventes</strong> en 2026), vous ne facturez <strong>pas de TVA</strong>. Mention obligatoire : &laquo; TVA non applicable, art. 293 B du CGI &raquo;.</p>

<p><strong>Piege :</strong> vous ne pouvez pas recuperer la TVA sur vos achats. Sur gros investissements (camionnette, machine), ca represente 20 % de perte. Dans certains cas, il vaut mieux opter pour le reel (TVA facturee au client, TVA recuperee sur achats).</p>

<h2>En resume</h2>
<ul>
<li><strong>Par defaut = 20 %</strong>. Les taux reduits sont l'exception qui exige des justificatifs.</li>
<li><strong>Attestation Cerfa signee par le client, conservee 5 ans</strong> : non negociable pour 5,5 % et 10 %.</li>
<li>Verifier systematiquement l'age du logement (factures, compromis, taxe fonciere) avant de facturer a taux reduit.</li>
<li>Sous-traitance BTP = autoliquidation, facture HT.</li>
<li>En cas de doute : facturer a 20 %, le client pourra reclamer le degrevement.</li>
</ul>
"""

a1 = render(
    slug="tva-btp-2026-taux-matrice",
    title="TVA BTP 2026 : matrice des taux 5,5 %, 10 %, 20 % et pieges — guide artisan",
    meta_desc="Quel taux de TVA appliquer sur vos chantiers ? 5,5 %, 10 % ou 20 % : la matrice complete, les travaux eligibles, les attestations Cerfa et les 5 erreurs qui entrainent un redressement.",
    keywords="TVA BTP, TVA 5.5 renovation, TVA 10 travaux, attestation TVA Cerfa, autoliquidation BTP",
    h1="TVA BTP 2026 : matrice des taux et pieges a eviter",
    read_min=8,
    summary_items=[
        "La matrice complete : quel taux pour quel type de travaux",
        "Les criteres precis pour 5,5 % (renovation energetique) et 10 % (renovation courante)",
        "Les 5 erreurs qui entrainent un redressement fiscal",
        "Modele de facture avec ventilation des taux",
        "Autoliquidation BTP entre pro, franchise micro-entrepreneur, DOM-TOM",
    ],
    body_html=a1_body,
    related=[
        ("/blog-pro/devenir-rge-2026.html", "Comment devenir RGE en 2026 : etapes et cout reel"),
        ("/blog-pro/nouvelles-exigences-reglementaires-btp-2026.html", "Les nouvelles exigences reglementaires BTP 2026"),
    ],
)
with open(os.path.join(OUT, "tva-btp-2026-taux-matrice.html"), "w") as f:
    f.write(a1)


# ============ ARTICLE 2 : DECENNALE ============
a2_body = """
<p>L'assurance decennale est <strong>obligatoire pour tous les artisans du batiment</strong> qui realisent des travaux de construction ou de renovation. Pas une option. Pas un luxe. <strong>Article 1792 du Code civil</strong>. Travailler sans est un delit (6 mois de prison et 75 000 EUR d'amende, meme si vous etes micro-entrepreneur).</p>

<p>Ce guide donne le vrai cout 2026, les pieges des contrats, et comment choisir un assureur qui paie vraiment en cas de sinistre.</p>

<h2>Ce que couvre (vraiment) la decennale</h2>

<p>Tous les dommages qui compromettent <strong>la solidite de l'ouvrage</strong> ou le rendent <strong>impropre a sa destination</strong>, pendant 10 ans apres la reception. Exemples concrets :</p>
<ul>
<li>Fissure importante dans un mur porteur</li>
<li>Infiltration dans la toiture qui rend une piece inhabitable</li>
<li>Effondrement d'un plancher</li>
<li>Defaut d'etancheite d'une terrasse accessible</li>
<li>Defaillance grave d'une installation de chauffage central (PAC mal dimensionnee)</li>
<li>Deficit d'isolation rendant le logement non conforme aux normes de l'epoque</li>
</ul>

<h2>Ce que la decennale NE couvre PAS</h2>
<ul>
<li><strong>Defauts esthetiques</strong> (peinture qui s'ecaille) : c'est la garantie de parfait achevement (1 an)</li>
<li><strong>Equipements dissociables</strong> (lave-vaisselle encastre, climatiseur) : garantie biennale (2 ans)</li>
<li>Usure normale, manque d'entretien par le client</li>
<li>Travaux exclus de votre contrat (ex : si vous etes electricien et vous faites de la plomberie non declaree)</li>
</ul>

<h2>Combien ca coute en 2026 (prix reels marche)</h2>

<table><thead><tr><th>Metier</th><th>CA annuel &lt; 80 kEUR</th><th>CA 80-200 kEUR</th><th>CA &gt; 200 kEUR</th></tr></thead><tbody>
<tr><td>Peintre / revetements</td><td>600-900 EUR</td><td>1 200-1 800 EUR</td><td>2 500-3 500 EUR</td></tr>
<tr><td>Electricien</td><td>1 100-1 500 EUR</td><td>1 800-2 500 EUR</td><td>3 500-5 000 EUR</td></tr>
<tr><td>Plombier / chauffagiste</td><td>1 200-1 600 EUR</td><td>2 000-2 800 EUR</td><td>4 000-5 500 EUR</td></tr>
<tr><td>Maconnerie / gros oeuvre</td><td>1 800-2 500 EUR</td><td>3 000-4 500 EUR</td><td>6 000-9 000 EUR</td></tr>
<tr><td>Couvreur / charpentier</td><td>2 000-2 800 EUR</td><td>3 500-5 000 EUR</td><td>7 000-11 000 EUR</td></tr>
<tr><td>Terrassement / TP</td><td>2 500-3 500 EUR</td><td>4 500-6 500 EUR</td><td>9 000-14 000 EUR</td></tr>
</tbody></table>

<p>Prix indicatifs marche francais 2026, franchise standard 1 500-3 000 EUR, sans antecedent sinistre.</p>

<h2>Les 6 pieges des contrats decennale</h2>

<h3>1. Activites declarees trop etroites</h3>
<p>Vous etes declare &laquo; peintre &raquo;. Vous faites un chantier ou vous refaites les joints de salle de bain en meme temps. Sinistre sur les joints = <strong>non couvert</strong>. La decennale couvre <strong>uniquement</strong> les activites explicitement declarees. Faites mettre a jour votre contrat des que vous diversifiez.</p>

<h3>2. Plafond de garantie insuffisant</h3>
<p>Le plafond standard est souvent 1-2 MEUR par sinistre. Pour chantiers tertiaires, bureaux ou collectif : insuffisant. Un artisan qui pose une charpente mal ancree sur un immeuble de 6 appartements peut declencher un sinistre de 5 MEUR (reconstruction).</p>

<h3>3. Franchise cachee en cas de sous-traitance</h3>
<p>Si vous sous-traitez a un non-assure, certains contrats annulent la garantie. Verifier <strong>l'article Sous-traitance</strong> de votre contrat avant toute sous-traitance.</p>

<h3>4. Non-declaration des apprentis / interimaires</h3>
<p>Un apprenti non declare qui cause un dommage = sinistre non indemnise sur la partie main-d'oeuvre non declaree.</p>

<h3>5. Travaux hors zone geographique</h3>
<p>Beaucoup de contrats limitent a la France metropolitaine. Un chantier en Guadeloupe ou Belgique = non couvert sauf extension.</p>

<h3>6. Resiliation en cas de sinistre</h3>
<p>Certains assureurs resilient a la premiere declaration de sinistre (meme si vous n'etes pas fautif). Le contrat suivant coute 2 a 3 fois plus cher. Privilegier assureurs BTP specialises (MAAF Pro, AXA Professionnels, SMA BTP, Groupama Batiment, L'Auxiliaire) plutot que generalistes.</p>

<h2>Documents a fournir pour souscrire</h2>
<ul>
<li>Kbis ou extrait K (pour micro-entrepreneur)</li>
<li>Qualifications professionnelles (diplomes, certifications Qualibat, QualiPAC, etc.)</li>
<li>Liste detaillee des activites exercees</li>
<li>Declaration de CA previsionnel et par activite</li>
<li>Historique assurance sur 5 ans (declaration de sinistralite)</li>
<li>Coordonnees bancaires pour prelevement</li>
</ul>

<h2>Preuve d'assurance : obligation du client</h2>

<p>A chaque devis, vous devez indiquer :</p>
<ul>
<li>Nom de la compagnie d'assurance</li>
<li>Numero de contrat</li>
<li>Plafond de garantie</li>
<li>Activites couvertes</li>
</ul>

<p>Un <strong>artisan qui ne peut pas justifier de sa decennale sur demande est en infraction</strong>. Le client peut refuser le chantier et saisir la DGCCRF.</p>

<div class="info-box"><strong>Bon reflexe :</strong> joindre une copie de votre attestation d'assurance (actualisee chaque annee) avec le devis. Cela rassure le client et ferme la porte a un contentieux futur sur ce point.</div>

<h2>Que faire en cas de sinistre ?</h2>

<ol>
<li><strong>Declaration a votre assureur dans les 5 jours ouvres</strong> (lettre recommandee + mail)</li>
<li>Conserver toutes les preuves : photos, devis, factures, correspondance client</li>
<li>Ne pas reconnaitre votre responsabilite avant l'expertise</li>
<li>L'assureur mandate un <strong>expert</strong> qui visite le chantier</li>
<li>Si responsabilite confirmee : l'assureur indemnise le client (ou prend en charge les reparations)</li>
<li>Votre franchise (1 500-5 000 EUR generalement) reste a votre charge</li>
</ol>

<h2>Dommage-Ouvrage (DO) : l'obligation du maitre d'ouvrage</h2>

<p>Le <strong>client</strong> (pas l'artisan) doit souscrire une DO avant le debut des travaux. Elle permet une indemnisation rapide sans attendre le proces en responsabilite. En pratique, 80 % des particuliers ne la prennent pas (trop chere, entre 2 et 5 % du cout des travaux).</p>

<p>Consequence : en cas de sinistre, le client attaque directement votre decennale, et le proces peut durer 3 a 5 ans. D'ou l'importance d'un assureur qui gere bien le contentieux.</p>

<h2>Micro-entrepreneur : les memes obligations</h2>
<p>La simplification du regime micro ne s'applique PAS a la decennale. Le micro-entrepreneur en BTP doit avoir la meme assurance qu'une SARL, avec des primes souvent a peine plus basses (les assureurs evaluent sur le CA reel, pas le statut).</p>

<h2>Comment faire baisser sa prime</h2>
<ul>
<li><strong>Franchise plus elevee</strong> : passer de 1 500 a 3 000 EUR peut baisser la prime de 15-25 %</li>
<li><strong>Regrouper avec la RC Pro</strong> : pack &laquo; RC + decennale &raquo; chez un meme assureur = reduction 10-20 %</li>
<li><strong>Absence de sinistre sur 3-5 ans</strong> : bonus progressif jusqu'a -30 %</li>
<li><strong>Qualifications professionnelles reconnues</strong> (Qualibat, RGE) : tarifs preferentiels chez SMA BTP et L'Auxiliaire</li>
<li><strong>Paiement annuel plutot que mensuel</strong> : -5 % chez la plupart des assureurs</li>
</ul>

<h2>En resume</h2>
<ul>
<li>Decennale = <strong>obligation legale sous peine de prison</strong>. Pas une option.</li>
<li>Entre 600 EUR et 14 000 EUR/an selon metier et CA.</li>
<li>Declarer <strong>toutes</strong> les activites exercees, y compris les extras occasionnels.</li>
<li>Verifier plafond de garantie, franchise, clauses sous-traitance et geographie.</li>
<li>Mentionner assureur et numero de contrat sur chaque devis (obligation legale).</li>
<li>Assureurs BTP specialises (SMA BTP, L'Auxiliaire) &gt; generalistes en cas de sinistre.</li>
</ul>
"""

a2 = render(
    slug="assurance-decennale-btp-2026",
    title="Assurance decennale BTP 2026 : prix reels, pieges et comment choisir — guide artisan",
    meta_desc="Prix reel de la decennale en 2026 par metier, les 6 pieges des contrats, et comment choisir un assureur qui paie. Obligations legales, franchise, sous-traitance, indemnisation.",
    keywords="assurance decennale BTP, prix decennale artisan, decennale plombier electricien, SMA BTP, Auxiliaire decennale",
    h1="Assurance decennale BTP 2026 : prix, pieges, et comment choisir",
    read_min=9,
    summary_items=[
        "Ce que la decennale couvre et NE couvre pas vraiment",
        "Prix reel 2026 par metier et par tranche de CA",
        "Les 6 pieges de contrats qui annulent la garantie",
        "Comment reagir en cas de sinistre (procedure en 6 etapes)",
        "5 leviers concrets pour faire baisser la prime",
    ],
    body_html=a2_body,
    related=[
        ("/blog-pro/tva-btp-2026-taux-matrice.html", "TVA BTP 2026 : matrice des taux et pieges"),
        ("/blog-pro/nouvelles-exigences-reglementaires-btp-2026.html", "Les nouvelles exigences reglementaires BTP 2026"),
    ],
)
with open(os.path.join(OUT, "assurance-decennale-btp-2026.html"), "w") as f:
    f.write(a2)


# ============ ARTICLE 3 : STATUT JURIDIQUE ============
a3_body = """
<p>Micro-entrepreneur, EURL, SASU, SARL, SAS&hellip; Le statut juridique que vous choisissez determine <strong>combien vous allez payer de cotisations, d'impots, ce que vous gardez en net, et votre capacite a embaucher ou recuperer la TVA</strong>. Changer en cours de route coute cher.</p>

<p>Ce guide compare les 5 statuts les plus frequents en BTP, avec des chiffres reels simulation 60 kEUR CA.</p>

<h2>Micro-entrepreneur (auto-entrepreneur) : pour qui ?</h2>

<p><strong>A retenir :</strong> simplicite maximale, plafond CA 77 700 EUR en 2026 (services BTP), cotisations sur CA brut (21,2 %), pas de TVA sous 36 800 EUR, pas de comptabilite complexe.</p>

<h3>Avantages</h3>
<ul>
<li>Creation gratuite en 10 min sur autoentrepreneur.urssaf.fr</li>
<li>Declaration mensuelle ou trimestrielle du CA</li>
<li>Cotisations proportionnelles : pas de CA = pas de cotisations</li>
<li>Impot sur revenu libre (versement liberatoire 1,7 % si revenu N-2 &lt; 27 478 EUR)</li>
</ul>

<h3>Inconvenients</h3>
<ul>
<li><strong>Plafond CA etroit</strong> : 77 700 EUR services, au-dela basculement oblige</li>
<li><strong>Pas de recuperation TVA</strong> si sous le seuil de franchise (-20 % sur achats)</li>
<li><strong>Pas de charges deductibles</strong> : vous payez sur le CA, pas sur le benefice</li>
<li>Difficulte a obtenir un pret bancaire (pas de bilan comptable)</li>
<li>Retraite plafonnee (cotisations faibles = pension faible)</li>
</ul>

<div class="warning-box"><strong>Piege :</strong> en BTP, vous avez souvent beaucoup d'achats (materiel, carburant, outillage). Sur un CA de 60 kEUR avec 25 kEUR d'achats, le micro vous coute plus cher en cotisations que l'EURL au reel.</div>

<h2>EURL (Entreprise Unipersonnelle a Responsabilite Limitee)</h2>

<p><strong>A retenir :</strong> version 1 associe de la SARL. Cotisations TNS (travailleur non salarie) sur le benefice, pas sur le CA. TVA des le debut si option. Plafond CA illimite.</p>

<h3>Avantages</h3>
<ul>
<li>Responsabilite limitee au capital social (protection patrimoine personnel)</li>
<li>Cotisations sur <strong>benefice net</strong>, pas le CA (beaucoup moins cher des qu'il y a des charges)</li>
<li>Recuperation TVA sur tous les achats</li>
<li>Pas de plafond de CA</li>
<li>Facilite a obtenir pret bancaire (bilan comptable)</li>
</ul>

<h3>Inconvenients</h3>
<ul>
<li>Creation : environ 300-500 EUR (greffe, annonce legale, statuts)</li>
<li>Comptabilite complete obligatoire (expert-comptable 900-1 500 EUR/an)</li>
<li>Cotisations minimales meme si pas de benefice (environ 1 200 EUR/an)</li>
<li>Retrait possible en remuneration ou dividende, chacun avec sa fiscalite</li>
</ul>

<h2>SASU (Societe par Actions Simplifiee Unipersonnelle)</h2>

<p><strong>A retenir :</strong> le president est assimile-salarie (regime general securite sociale), pas TNS. Cotisations plus elevees mais meilleure protection sociale. Dividendes non soumis aux cotisations sociales.</p>

<h3>Avantages</h3>
<ul>
<li>Regime general (meme couverture maladie qu'un salarie)</li>
<li>Dividendes non soumis aux cotisations sociales (juste 30 % de flat tax)</li>
<li>Facilite a faire entrer un associe ou vendre l'entreprise</li>
<li>Image plus corporate (interessant si vous visez les marches publics ou B2B)</li>
</ul>

<h3>Inconvenients</h3>
<ul>
<li>Cotisations salarie sur remuneration : environ 82 % de charges sur net (vs ~45 % en EURL)</li>
<li>Pas d'indemnites chomage (sauf rare cas ARCE)</li>
<li>Comptabilite et frais creation identiques a EURL</li>
</ul>

<h2>SARL / SAS (plusieurs associes)</h2>

<p>Pour qui veut s'associer avec un collegue artisan, ou fait entrer un conjoint dans le capital. Regime fiscal et social similaire a EURL (SARL) ou SASU (SAS), mais avec plusieurs parts/actions. Cout de creation legerement superieur (600-900 EUR).</p>

<h2>Simulation chiffree : CA 60 kEUR, charges 25 kEUR</h2>

<table><thead><tr><th>Statut</th><th>Cotisations</th><th>Impot</th><th>Net disponible</th></tr></thead><tbody>
<tr><td>Micro-entrepreneur</td><td>12 720 EUR (21,2 % sur 60 k)</td><td>1 020 EUR (1,7 % libératoire)</td><td><strong>21 260 EUR</strong></td></tr>
<tr><td>EURL a l'IR</td><td>12 950 EUR (TNS sur benefice 35 k)</td><td>2 180 EUR (IR tranche 11 %)</td><td><strong>19 870 EUR</strong></td></tr>
<tr><td>EURL a l'IS (remu 24 kEUR + div 8 kEUR)</td><td>10 880 EUR (TNS sur 24 k) + IS 15 %</td><td>~3 200 EUR (IS + flat tax div)</td><td><strong>20 920 EUR</strong></td></tr>
<tr><td>SASU (remu 24 kEUR + div 8 kEUR)</td><td>19 680 EUR (assimile salarie)</td><td>~3 200 EUR</td><td><strong>12 120 EUR</strong></td></tr>
</tbody></table>

<p>Hypotheses simplifiees. Micro-entrepreneur gagne le plus en net si peu de charges. EURL a l'IS rentable sur CA eleve + charges importantes.</p>

<div class="info-box"><strong>Regle de bascule :</strong> en dessous de 50 kEUR CA avec peu de charges, micro est optimal. Entre 50 et 100 kEUR avec charges &gt; 30 % du CA, passer en EURL. Au-dela de 100 kEUR ou si vous visez l'embauche, EURL ou SASU.</div>

<h2>Embauche du premier salarie : quel statut ?</h2>

<p>En micro-entrepreneur, embaucher est possible mais cher (charges salariales a 100 % sur votre dos, pas de recuperation TVA sur son salaire indirect). <strong>Des que vous embauchez, basculer en EURL ou SARL</strong> est fiscalement optimal.</p>

<h2>Recuperation TVA : quand c'est interessant</h2>

<p>En BTP, les achats representent souvent 20 a 40 % du CA. Sans TVA recuperable (micro-entrepreneur sous franchise), vous perdez 20 % sur chaque achat. Exemple : camionnette neuve 25 000 EUR HT = 5 000 EUR de TVA non recuperee si micro.</p>

<p>Basculer en EURL ou opter pour la TVA (meme en micro-entrepreneur, c'est possible des creation) <strong>devient rentable des que les achats deductibles depassent 10 000 EUR/an</strong>.</p>

<h2>Chronologie type : evolution du statut</h2>
<ol>
<li><strong>Annee 1-2</strong> : Micro-entrepreneur pour tester le marche. Coeur metier, pas d'embauche, CA &lt; 50 kEUR.</li>
<li><strong>Annee 2-3</strong> : Basculement en EURL a l'IS des que CA &gt; 60 kEUR et charges &gt; 25 %. Remuneration optimisee + dividendes.</li>
<li><strong>Annee 4-5</strong> : Passage SARL/SAS si embauche d'un salarie ou associe, ou ouverture capital pour financer un gros chantier.</li>
</ol>

<h2>Erreurs frequentes</h2>
<ul>
<li><strong>Rester en micro trop longtemps</strong> : a partir de 70 kEUR CA avec charges, vous perdez 3-5 kEUR/an vs une EURL.</li>
<li><strong>Choisir SASU par defaut parce que &laquo; c'est moderne &raquo;</strong> : pour un artisan solo BTP, l'EURL est quasi toujours plus avantageuse (charges sociales 40 % plutot que 82 %).</li>
<li><strong>Ne pas anticiper la TVA</strong> : franchir le seuil des 36 800 EUR en cours d'annee sans option TVA = retroactivite sur les factures non TVAisees.</li>
<li><strong>Rediger les statuts soi-meme</strong> : 50 EUR d'economie sur les statuts peuvent couter 5 000 EUR d'avocat si litige avec un associe ou un fisc.</li>
</ul>

<h2>En resume</h2>
<ul>
<li><strong>Micro-entrepreneur</strong> : idéal démarrage, pas de charges, CA &lt; 50 kEUR.</li>
<li><strong>EURL a l'IS</strong> : statut le plus rentable pour un artisan solo avec charges &gt; 25 % et CA 60-150 kEUR.</li>
<li><strong>SASU</strong> : uniquement si protection sociale salarie cruciale (couverture maladie, retraite).</li>
<li><strong>SARL/SAS</strong> : si embauche ou association.</li>
<li>Ne jamais choisir un statut sans simulation chiffree sur votre CA previsionnel.</li>
</ul>
"""

a3 = render(
    slug="statut-juridique-artisan-btp-2026",
    title="Micro, EURL, SASU ou SARL : quel statut choisir en 2026 pour un artisan BTP ?",
    meta_desc="Comparaison chiffree des 5 statuts juridiques pour artisan BTP en 2026. Cotisations, TVA, impot, embauche : quel statut paie le plus en net selon votre CA et vos charges.",
    keywords="statut juridique artisan, EURL SASU BTP, micro entrepreneur batiment, creer entreprise BTP, auto entrepreneur plafond",
    h1="Micro, EURL, SASU ou SARL : quel statut choisir en 2026 ?",
    read_min=10,
    summary_items=[
        "Comparatif des 5 statuts : avantages et inconvenients concrets",
        "Simulation chiffree CA 60 kEUR : qui gagne le plus en net",
        "Regle de bascule : quand passer de micro a EURL, puis a SARL/SAS",
        "Embauche, TVA, pret bancaire : quel statut le permet",
        "Erreurs frequentes qui coutent 3 a 5 kEUR/an",
    ],
    body_html=a3_body,
    related=[
        ("/blog-pro/tva-btp-2026-taux-matrice.html", "TVA BTP 2026 : matrice des taux et pieges"),
        ("/blog-pro/assurance-decennale-btp-2026.html", "Assurance decennale BTP 2026 : prix et pieges"),
    ],
)
with open(os.path.join(OUT, "statut-juridique-artisan-btp-2026.html"), "w") as f:
    f.write(a3)


# ============ ARTICLE 4 : MARCHES PUBLICS ============
a4_body = """
<p>En 2026, les marches publics representent <strong>136 milliards d'euros de travaux</strong> en France. Les collectivites (communes, departements, regions), les bailleurs sociaux et les etablissements publics (hopitaux, ecoles, universites) achetent massivement des prestations BTP. Pourtant, <strong>moins de 12 % des PME du batiment repondent regulierement</strong>.</p>

<p>Le principal frein : la peur de la complexite administrative. Ce guide demontre que 80 % des marches ne sont pas si complexes, et detaille la procedure complete pour decrocher votre premier contrat public.</p>

<h2>Les 3 types de marches accessibles aux artisans</h2>

<h3>1. MAPA (Marche a Procedure Adaptee) : sous 143 000 EUR HT (seuil 2026)</h3>
<p>C'est le plus frequent et le plus accessible. Procedure simplifiee, delais courts, peu de documents. <strong>Ideal pour premiere reponse.</strong> Exemples : refection peinture d'une ecole communale, plomberie mairie, electricite centre de loisirs.</p>

<h3>2. Appel d'offres ouvert : au-dela de 143 000 EUR HT</h3>
<p>Procedure formalisee avec DCE (Dossier de Consultation des Entreprises) complet, cahier des charges techniques, memoire technique exige. Delai minimum 30 jours.</p>

<h3>3. Marches subsequents (accord-cadre)</h3>
<p>Vous etes pre-selectionne pour une duree (1-4 ans), puis les marches sont attribues au fil de l'eau parmi les attributaires. Exemple : accord-cadre peinture d'une ville pour 4 ans, marches a bons de commande au besoin.</p>

<h2>Ou trouver les marches ?</h2>

<table><thead><tr><th>Plateforme</th><th>Acces</th><th>Utilite</th></tr></thead><tbody>
<tr><td><strong>boamp.fr</strong></td><td>Gratuit</td><td>Bulletin officiel, tous les marches &gt; 90 kEUR HT</td></tr>
<tr><td><strong>marches-publics.gouv.fr (PLACE)</strong></td><td>Gratuit</td><td>Plateforme unifiee de l'Etat</td></tr>
<tr><td><strong>e-marchespublics.com</strong></td><td>Abonnement 50 EUR/mois</td><td>Agrege collectivites locales, alertes personnalisees</td></tr>
<tr><td><strong>achatpublic.com</strong></td><td>Freemium</td><td>Alertes metier, simulateur de MAPA</td></tr>
<tr><td><strong>Site de chaque collectivite</strong></td><td>Gratuit</td><td>Marches locaux, MAPA &lt; 90 kEUR parfois publies uniquement ici</td></tr>
</tbody></table>

<div class="info-box"><strong>Bon reflexe :</strong> s'abonner aux alertes de votre departement + 3 departements voisins, sur les codes CPV (Common Procurement Vocabulary) correspondant a votre activite. Ex : 45441000 (vitrerie), 45311000 (electricite batiment), 45330000 (plomberie).</div>

<h2>Le dossier de candidature : ce qu'il faut prevoir</h2>

<h3>Documents administratifs obligatoires</h3>
<ul>
<li>DC1 (lettre de candidature) et DC2 (declaration du candidat) - formulaires gratuits</li>
<li>Kbis ou D1 (moins de 3 mois)</li>
<li>Attestations fiscales et sociales (URSSAF, DGFiP) - moins de 6 mois</li>
<li>RIB professionnel</li>
<li>Attestation assurance decennale et RC Pro en cours de validite</li>
<li>CV detaille du dirigeant + formations</li>
<li>References de 3-5 chantiers similaires (max 5 ans)</li>
</ul>

<h3>Memoire technique (coeur de la reponse)</h3>
<p>C'est le document qui fait gagner ou perdre le marche. Il detaille :</p>
<ul>
<li>Comprehension du besoin (reformulation du cahier des charges)</li>
<li>Moyens humains affectes (combien de personnes, quelles qualifications)</li>
<li>Moyens materiels (camion, outillage, echafaudage, grue, etc.)</li>
<li>Planning previsionnel detaille</li>
<li>Demarche qualite, securite, environnement (SME, ISO, certifications)</li>
<li>Gestion des dechets (BSD, plan de tri, bordereaux)</li>
<li>References pertinentes avec photos</li>
</ul>

<h2>Les criteres d'attribution (sur 100 points)</h2>

<p>Lisez la grille. Elle est toujours dans l'AAPC (Avis d'Appel Public a la Concurrence). Criteres types :</p>
<ul>
<li><strong>Prix : 40-60 %</strong></li>
<li><strong>Valeur technique : 30-50 %</strong> (memoire technique + moyens)</li>
<li><strong>Delai d'execution : 0-15 %</strong></li>
<li><strong>Demarche environnementale : 0-20 %</strong> (depuis 2024, obligatoire sur marches &gt; 1 MEUR)</li>
</ul>

<div class="warning-box"><strong>Erreur frequente :</strong> miser tout sur le prix. Sur un MAPA de 80 kEUR, etre 3 % moins cher mais avoir un memoire technique generique vous fera perdre face a quelqu'un 2 % plus cher mais avec memoire sur-mesure.</div>

<h2>Comment repondre sur le plan materiel</h2>

<p>Les marches publics se deposent <strong>exclusivement sur plateforme electronique</strong> (PLACE ou equivalent). Vous avez besoin :</p>
<ol>
<li><strong>Certificat electronique</strong> (eIDAS qualifie) : 60-120 EUR/an chez Certinomis, ChamberSign ou Certeurope. Indispensable pour signer les offres.</li>
<li><strong>Compte sur la plateforme</strong> (inscription gratuite)</li>
<li><strong>Ordinateur avec Java et navigateur compatible</strong> (certaines plateformes anciennes)</li>
</ol>

<p>Le delai de depot est strict : <strong>une minute de retard = offre rejetee</strong>. Prevoir la veille pour le depot.</p>

<h2>Pricing : comment etablir un prix competitif</h2>

<p>Le BPU (Bordereau des Prix Unitaires) est souvent fourni. Vous remplissez les prix unitaires, la collectivite applique ses quantites. Regles :</p>
<ul>
<li>Ne jamais laisser une ligne vide (exclusion immediate)</li>
<li>Ne pas mettre 0,01 EUR sur une ligne secondaire pour gagner (risque &laquo; offre anormalement basse &raquo;)</li>
<li>Inclure deplacement, installation chantier, protection, nettoyage dans le prix global</li>
<li>Marge souvent reduite (5-12 %) compensee par volume et regularite</li>
</ul>

<h2>Apres depot : delai de notification</h2>
<ul>
<li>MAPA : 2-6 semaines apres cloture</li>
<li>Appel d'offres ouvert : 4-8 semaines</li>
<li>Accord-cadre : 2-4 mois</li>
</ul>

<p>Si non retenu, demander le <strong>&laquo; courrier de rejet motive &raquo;</strong> : il vous dit pourquoi vous avez perdu (points prix, technique, delai). Precieux pour la prochaine fois.</p>

<h2>Execution du marche : les pieges</h2>

<h3>1. Retenue de garantie 5 %</h3>
<p>Par defaut, 5 % de chaque facture est retenu pendant un an apres reception. Possibilite de la remplacer par une caution bancaire (gratuite mais demande bancaire).</p>

<h3>2. Penalites de retard</h3>
<p>Souvent 1/1000 du marche par jour de retard. Sur un chantier de 80 kEUR, 1 jour de retard = 80 EUR. Plafond 10 %. Planifier large, pas juste.</p>

<h3>3. Delai de paiement</h3>
<p>Le delai legal est 30 jours pour les collectivites, 50 jours pour l'Etat. <strong>Interets de retard automatiques</strong> si depassement (taux BCE + 8 %), a exiger via lettre recommandee si oubli.</p>

<h3>4. PV de reception avec reserves</h3>
<p>Si le maitre d'ouvrage met des reserves, vous avez 3 mois pour lever. Ne jamais refuser de signer le PV sous pretexte des reserves : cela bloque tout le reglement.</p>

<h2>Premier marche : strategie rapide</h2>
<ol>
<li>Chercher un MAPA &lt; 50 kEUR dans votre commune ou EPCI (grande chance d'etre le seul candidat local)</li>
<li>Appeler le service marches avant de repondre pour signifier votre interet (autorise)</li>
<li>Memoire technique concret, pas de generalites (photos chantiers personnels, pas de stock photos)</li>
<li>Prix 5-8 % sous votre tarif particulier (la collectivite ne marchande pas apres)</li>
<li>Deposer 24h avant l'heure limite (eviter bug plateforme dernier moment)</li>
</ol>

<h2>En resume</h2>
<ul>
<li>MAPA sous 143 kEUR = procedure accessible a tout artisan serieux.</li>
<li>Prix : 40-60 % de la note. Memoire technique : 30-50 %. Ne negliger ni l'un ni l'autre.</li>
<li>Certificat electronique et compte plateforme = pre-requis techniques.</li>
<li>Courrier de rejet motive = pepite d'apprentissage, toujours demander.</li>
<li>Marges reduites (5-12 %) mais flux regulier, clients payeurs et excellente reference pour le prive.</li>
</ul>
"""

a4 = render(
    slug="repondre-marches-publics-btp-artisan",
    title="Repondre aux marches publics en 2026 : guide pour artisan BTP",
    meta_desc="Comment repondre aux marches publics quand on est artisan BTP : ou les trouver, les documents, le memoire technique, le prix et les pieges d'execution. Premier marche en 3 mois.",
    keywords="marches publics artisan, MAPA BTP, BOAMP, memoire technique marche public, certificat electronique marche public",
    h1="Repondre aux marches publics en 2026 : guide artisan BTP",
    read_min=11,
    summary_items=[
        "Les 3 types de marches publics accessibles et leurs seuils",
        "Les 5 plateformes ou trouver les appels d'offres",
        "Le dossier de candidature : documents et memoire technique",
        "Comment pricer sans perdre au piege de l'offre anormalement basse",
        "Strategie pour decrocher votre premier marche en 3 mois",
    ],
    body_html=a4_body,
    related=[
        ("/blog-pro/tva-btp-2026-taux-matrice.html", "TVA BTP 2026 : matrice des taux et pieges"),
        ("/blog-pro/assurance-decennale-btp-2026.html", "Assurance decennale BTP 2026 : prix et pieges"),
    ],
)
with open(os.path.join(OUT, "repondre-marches-publics-btp-artisan.html"), "w") as f:
    f.write(a4)


# ============ ARTICLE 5 : IMPAYES ============
a5_body = """
<p>Les impayes chantier sont le cauchemar numero 1 des artisans. En 2026, <strong>entre 15 et 22 % des TPE du batiment</strong> deposent le bilan a cause d'un ou deux gros impayes. Un client qui ne paie pas n'est pas un probleme de tresorerie temporaire : c'est une menace existentielle.</p>

<p>Ce guide donne la procedure complete pour recuperer votre du, du premier rappel amiable a la procedure judiciaire, avec les delais et les couts reels.</p>

<h2>Prevenir : les reflexes avant chantier</h2>

<h3>1. Acompte obligatoire (30 %) a la commande</h3>
<p>Tout devis signe sans acompte est un pari. Minimum 30 % pour particuliers, parfois 40 % pour chantiers &gt; 10 kEUR. Justification : &laquo; cela couvre la commande de materiel et les frais de demarrage. &raquo;</p>

<h3>2. Echelonnement des paiements sur gros chantiers</h3>
<ul>
<li>30 % a la signature du devis</li>
<li>30 % au demarrage des travaux</li>
<li>30 % a mi-chantier</li>
<li>10 % a la reception avec leve de reserves</li>
</ul>
<p>Cela limite votre expo max a 10 % du chantier et force le client a avancer au fur et a mesure.</p>

<h3>3. Verification solvabilite clients B2B</h3>
<p>Avant d'accepter un devis &gt; 5 kEUR a une entreprise, verifier :</p>
<ul>
<li><strong>Societe.com</strong> ou <strong>Infogreffe</strong> : date de creation, dirigeant, bilans deposes</li>
<li><strong>Annonces legales BODACC</strong> : pas de procedure collective en cours</li>
<li><strong>Cocolis</strong> ou <strong>ellisphere</strong> : note de solvabilite (5-15 EUR le rapport)</li>
</ul>

<h3>4. Devis et CGV beton</h3>
<p>Le devis doit mentionner : delai de paiement (30 jours par defaut), taux d'interet de retard (taux BCE + 10 points minimum), indemnite forfaitaire 40 EUR en cas de retard (loi Warsmann 2026 toujours en vigueur), clause de reserve de propriete sur materiel.</p>

<h2>Chronologie du recouvrement : les 6 etapes</h2>

<table><thead><tr><th>Etape</th><th>Delai</th><th>Cout</th><th>Taux succes</th></tr></thead><tbody>
<tr><td>1. Appel et mail de relance</td><td>J+5 apres echeance</td><td>0 EUR</td><td>50-60 %</td></tr>
<tr><td>2. Mise en demeure LRAR</td><td>J+15</td><td>6 EUR</td><td>+20-25 %</td></tr>
<tr><td>3. Injonction de payer</td><td>J+30-45</td><td>35 EUR</td><td>+10-15 %</td></tr>
<tr><td>4. Assignation au fond</td><td>J+60-90</td><td>500-1500 EUR</td><td>+5-10 %</td></tr>
<tr><td>5. Execution (huissier)</td><td>J+120-180</td><td>10-15 % du recouvre</td><td>depend solvabilite</td></tr>
<tr><td>6. Procedure collective</td><td>J+365+</td><td>0 EUR, mais on recupere peu</td><td>5-15 %</td></tr>
</tbody></table>

<h2>Etape 1 : Relance amiable (obligatoire)</h2>

<p>Le lendemain de l'echeance, mail + SMS : &laquo; Bonjour, je n'ai pas recu le reglement de la facture F-2026-045 de 2 450 EUR echue hier. Erreur administrative ? &raquo;</p>
<p>Ton neutre, assume qu'il y a un oubli. 50 % des cas se resolvent ici. Si sans reponse apres 3 jours : appel telephonique direct.</p>

<h2>Etape 2 : Mise en demeure par LRAR</h2>

<p>Modele simple mais efficace :</p>
<div class="info-box">
<p><strong>Madame / Monsieur,</strong></p>
<p>Malgre mes relances des [dates], votre facture n&deg; F-XXXX du XX/XX/2026 d'un montant de XXXX EUR TTC, echue le XX/XX/2026, reste impayee.</p>
<p>Je vous mets en demeure de proceder a son reglement sous <strong>8 jours</strong> a compter de la reception de la presente, soit avant le XX/XX/2026.</p>
<p>A defaut, je me reserve le droit d'engager toute procedure utile, notamment une injonction de payer, avec les frais et interets de retard a votre charge au taux de XX % (taux BCE + 10 points) + indemnite forfaitaire de 40 EUR (article L441-10 du Code de commerce).</p>
<p>Je reste disponible pour convenir d'un echeancier amiable si necessaire.</p>
<p>Cordialement,</p>
</div>

<p>Envoyer en LRAR (6 EUR). Conserver accuse de reception. 70 a 80 % de succes cumulatif apres cette etape.</p>

<h2>Etape 3 : Injonction de payer</h2>

<p>Si la LRAR n'aboutit pas, procedure judiciaire simplifiee :</p>
<ul>
<li>Creances <strong>certaine, liquide, exigible</strong> : injonction de payer devant tribunal de commerce (B2B) ou tribunal judiciaire (particulier).</li>
<li>Formulaire <strong>Cerfa 12948*06</strong>, cout 35 EUR + copie des factures + LRAR impayee.</li>
<li>Juge rend une ordonnance sans audience (&laquo; ordonnance d'injonction &raquo;).</li>
<li>L'ordonnance est signifiee par huissier (cout 60-80 EUR, a votre charge initialement, recupere sur le client).</li>
<li>Client a <strong>1 mois pour contester</strong>. S'il ne conteste pas, l'ordonnance devient definitive et vaut titre executoire.</li>
</ul>

<h2>Etape 4 : Assignation au fond (si contestation)</h2>

<p>Si le client conteste, il faut passer au fond avec avocat. Cout 500-1500 EUR en premiere instance. Rentable uniquement au-dela de 3-4 kEUR de dette.</p>

<h2>Etape 5 : Execution (huissier)</h2>

<p>Avec un titre executoire, l'huissier peut :</p>
<ul>
<li>Saisir le compte bancaire du debiteur</li>
<li>Saisir les creances sur tiers (ex : son propre client)</li>
<li>Saisir des biens mobiliers (vehicule, matos)</li>
<li>Inscription d'hypotheque sur bien immobilier (si dette &gt; 5 kEUR)</li>
</ul>
<p>Le cout d'huissier (10-15 % du montant recouvre) est a la charge du debiteur si procedure reussie, sinon a la votre.</p>

<h2>Cas specifique : client en procedure collective</h2>

<p>Si le client est en redressement ou liquidation, vous devez <strong>declarer votre creance</strong> au mandataire judiciaire dans les 2 mois suivant la publication au BODACC. Formulaire simple + copie factures. Sans declaration : creance perdue.</p>

<p>Taux de recuperation moyen : 5-15 % en liquidation, 40-70 % en redressement.</p>

<h2>Outils pour automatiser</h2>
<ul>
<li><strong>Sellsy, Tiime, Facture.net</strong> : relances automatiques par mail</li>
<li><strong>Societes de recouvrement</strong> (Intrum, Coface, Direct Recouvrement) : commission 12-25 % sur montant recupere, interessant si vous n'avez pas le temps</li>
<li><strong>Factor</strong> (affacturage) : vous cedez la creance des facturation, recuperez 90 % immediatement, le factor gere le recouvrement. Commission 1-3 % + interets. Interessant pour gros comptes recurrents.</li>
</ul>

<h2>Retention de garantie legale (particulier)</h2>

<p>Le client particulier peut legalement retenir jusqu'a <strong>5 % du chantier pendant 1 an</strong> pour garantir la levee des reserves. Mentionne au devis, conteste sur LR si pas de reserve objective. Apres 1 an, droit automatique au paiement, avec interets de retard si non regle.</p>

<h2>Les 3 signaux d'alerte avant de continuer un chantier</h2>
<ol>
<li>Retards repetes sur les acomptes intermediaires</li>
<li>Demandes de reductions de prix en cours de chantier sans justification</li>
<li>Contact direct du client coupe (ne repond plus aux mails/appels plusieurs jours)</li>
</ol>
<p>En presence de ces 3 signaux : <strong>stop chantier, envoi de mise en demeure preventive, reprise uniquement sur regularisation.</strong> Le Code civil autorise l'exception d'inexecution.</p>

<h2>En resume</h2>
<ul>
<li>Prevention : acompte 30 %, echelonnement, CGV blindees, solvabilite verifiee.</li>
<li>Procedure : relance -&gt; mise en demeure LRAR -&gt; injonction de payer -&gt; execution huissier.</li>
<li>Injonction de payer : 35 EUR, 60 % de reussite en 45 jours pour B2B.</li>
<li>Declarer creances en procedure collective sous 2 mois.</li>
<li>Stop chantier legal en cas de non-paiement des echeances intermediaires.</li>
</ul>
"""

a5 = render(
    slug="impayes-chantier-recouvrement-artisan-2026",
    title="Impayes chantier : la procedure complete de recouvrement pour artisan BTP (2026)",
    meta_desc="Comment recuperer un impaye chantier en 2026 : relance amiable, mise en demeure, injonction de payer, execution huissier. Delais, couts, taux de succes par etape.",
    keywords="impaye chantier artisan, injonction de payer BTP, mise en demeure client, recouvrement facture BTP, retention garantie 5%",
    h1="Impayes chantier : la procedure complete de recouvrement",
    read_min=10,
    summary_items=[
        "4 reflexes pour prevenir un impaye avant le chantier",
        "La chronologie complete : 6 etapes du recouvrement avec delais et couts",
        "Modele de mise en demeure qui fait payer 70 % des clients",
        "Injonction de payer : 35 EUR, procedure simple, 60 % de succes",
        "3 signaux qui doivent vous faire arreter un chantier immediatement",
    ],
    body_html=a5_body,
    related=[
        ("/blog-pro/statut-juridique-artisan-btp-2026.html", "Quel statut juridique choisir en 2026 ?"),
        ("/blog-pro/repondre-marches-publics-btp-artisan.html", "Repondre aux marches publics en 2026"),
    ],
)
with open(os.path.join(OUT, "impayes-chantier-recouvrement-artisan-2026.html"), "w") as f:
    f.write(a5)

print("Batch 1 : 5 articles generes avec succes.")
print("- tva-btp-2026-taux-matrice.html")
print("- assurance-decennale-btp-2026.html")
print("- statut-juridique-artisan-btp-2026.html")
print("- repondre-marches-publics-btp-artisan.html")
print("- impayes-chantier-recouvrement-artisan-2026.html")

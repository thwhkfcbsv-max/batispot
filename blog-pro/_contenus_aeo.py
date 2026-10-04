#!/usr/bin/env python3
"""
Ecrit les six articles AEO depuis marketing/articles.json.

POURQUOI CE PILOTE. `_gen_articles_2026-09.py` sait assembler une page (en-tete,
schema Article + FAQPage, nav, bandeau, pied) mais sa liste ARTICLES etait vide.
Il ne manquait que le contenu. Le voici, ecrit et verifie ailleurs.

LE CTA NE POINTE PAS VERS /artisan. Cette page est un stub de redirection : elle
renvoyait l'artisan sur l'accueil, dont la premiere ligne s'adresse aux
particuliers. Corrige le 15/09, mais autant eviter le rebond — on pointe
directement sur la page pro qui convertit.
"""
import json, sys
from html import escape
from pathlib import Path

ICI = Path(__file__).resolve().parent
sys.path.insert(0, str(ICI))
import importlib.util
spec = importlib.util.spec_from_file_location("gen", ICI / "_gen_articles_2026-09.py")
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)

SRC = Path.home() / 'batispot-llm' / 'marketing' / 'articles.json'
ARTS = json.loads(SRC.read_text(encoding='utf-8'))
DATE, DATE_FR = "2026-09-16", "16 septembre 2026"

# Un CTA par article, accroche a SA douleur — pas un slogan generique.
CTA = {
 1: ("Les heures en plus, notees quand elles arrivent",
     "Sur le chantier, dictez ce qui vient de changer : l'heure supplementaire, le materiau "
     "casse, l'imprevu. C'est consigne, date, et cela remonte dans la facture au lieu de se "
     "perdre entre le camion et le bureau."),
 2: ("Le devis part avant que vous demarriez le camion",
     "Dictez l'ouvrage a voix haute en sortant du chantier, ou photographiez la piece. Le devis "
     "revient chiffre ligne par ligne, a valider et a envoyer. La soiree reste libre."),
 4: ("Le dossier de reception, complet, en un envoi",
     "PV de reception, facture de solde, photos avant-apres : l'application dit ce qui manque "
     "avant que vous envoyiez, et fait signer le client sur l'ecran."),
 5: ("L'avenant signe avant de poser le premier coup",
     "Photographiez l'imprevu, ajoutez la ligne au devis, faites signer du bout du doigt. "
     "Deux minutes sur place valent mieux qu'un litige a la facture."),
 6: ("La relance partie sans y penser",
     "L'application sait quelles factures ont depasse leur delai et ecrit la relance : ferme "
     "sur le fond, correcte sur la forme. Vous relisez, vous envoyez."),
 8: ("Votre taux horaire, calcule sur vos chiffres",
     "Prix d'achat, temps passe, charges : la marge prevue et la marge reelle s'affichent "
     "chantier par chantier. Vous voyez ou vous travaillez a perte, avant de re-signer pareil."),
}

def bloc_cta(rang):
    t, p = CTA[rang]
    return (f'<div class="cta-box"><h3>{escape(t)}</h3><p>{escape(p)}</p>'
            f'<a href="https://batispot.pro/application-devis-gratuite" class="cta-btn">'
            f'Essayer BatiSpot Pro</a></div>')

def bloc_sources(a):
    s = a.get('sources') or []
    if not s: return ""
    li = "".join(
        f'<li>{escape(x.get("quoi",""))} — '
        + (f'<a href="{escape(x["url"])}" rel="nofollow noopener" target="_blank">{escape(x.get("texte",""))}</a>'
           if str(x.get("url","")).startswith("http") else escape(x.get("texte","")))
        + '</li>' for x in s)
    av = a.get('a_verifier') or []
    note = ('<p><em>Points que nous n\'avons pas pu trancher sur un texte officiel : '
            + escape(" ; ".join(av)) + '.</em></p>') if av else ''
    return ('\n<h2>Sources</h2>\n<p>Chaque chiffre de cet article a ete confronte au texte '
            f'qui le porte, le {DATE_FR}.</p>\n<ul>' + li + '</ul>\n' + note)

# Maillage : chaque article pointe vers les deux suivants dans la liste.
def lies(i):
    out = []
    for k in (1, 2):
        b = ARTS[(i + k) % len(ARTS)]
        out.append((b['titre'], f"https://batispot.pro/blog-pro/{b['slug']}"))
    return out

ecrits = []
for i, a in enumerate(ARTS):
    d = dict(a)
    d['date'], d['date_fr'] = DATE, DATE_FR
    d['corps'] = a['corps'] + bloc_sources(a)
    d['faq'] = [tuple(x) for x in a.get('faq', [])]
    d['cta'] = bloc_cta(a['douleur_rang'])
    d['lies'] = lies(i)
    d.setdefault('lecture', 8)
    html = gen.page(d)
    p = ICI / f"{a['slug']}.html"
    p.write_text(html, encoding='utf-8')
    ecrits.append((a['slug'], len(html)))
    print(f"  ✅ {a['slug']}.html — {len(html):,} o")

print(f"\n{len(ecrits)} articles ecrits dans blog-pro/")

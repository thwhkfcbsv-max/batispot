#!/usr/bin/env python3
"""Générateur des articles blog-pro (artisans) — vague septembre 2026.

Pourquoi ce script plutôt que 10 fichiers HTML écrits à la main : les 155 articles
existants partagent exactement le même squelette (en-tête analytics, CSS, nav,
bandeau de capture, pied de page). Le recopier à la main, c'est dix occasions de
laisser passer une balise non fermée ou un canonical faux. Ici les morceaux sont
lus depuis `_parts/`, extraits d'un article de référence, et seul le CONTENU change.

Nouveauté par rapport aux articles existants : un schéma FAQPage est ajouté quand
l'article porte une section « Questions fréquentes ». C'est ce qui déclenche les
questions dépliables dans Google, et aucun article du blog ne l'avait.

    python3 _gen_articles_2026-09.py          # écrit les fichiers
    python3 _gen_articles_2026-09.py --check  # vérifie sans écrire
"""
import json
import re
import sys
from html import escape
from pathlib import Path

ICI = Path(__file__).resolve().parent
PARTS = ICI / "_parts"
DOMAINE = "https://batispot.pro"
DOSSIER = "blog-pro"

HEAD_TOP = (PARTS / "head_top.html").read_text(encoding="utf-8")
CSS = (PARTS / "css.html").read_text(encoding="utf-8")
NAV = (PARTS / "nav.html").read_text(encoding="utf-8")
LM = (PARTS / "lm.html").read_text(encoding="utf-8")
BANNER = (PARTS / "banner.html").read_text(encoding="utf-8")
FOOT = (PARTS / "foot.html").read_text(encoding="utf-8")


def page(a):
    """Assemble un article complet à partir de sa définition."""
    url = f"{DOMAINE}/{DOSSIER}/{a['slug']}"
    titre = a["titre"]
    desc = a["description"]

    schemas = [{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": titre,
        "description": desc,
        "author": {"@type": "Organization", "name": "BatiSpot"},
        "publisher": {
            "@type": "Organization",
            "name": "BatiSpot",
            "logo": {"@type": "ImageObject", "url": f"{DOMAINE}/favicon.png"},
        },
        "datePublished": a["date"],
        "dateModified": a["date"],
        "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "inLanguage": "fr-FR",
    }]
    if a.get("faq"):
        schemas.append({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": q,
                    "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", r)},
                }
                for q, r in a["faq"]
            ],
        })

    faq_html = ""
    if a.get("faq"):
        faq_html = "\n<h2>Questions fréquentes</h2>\n" + "\n".join(
            f"<h3>{escape(q)}</h3>\n<p>{r}</p>" for q, r in a["faq"]
        )

    lies = "".join(
        f'<li><a href="{h}">{escape(t)}</a></li>' for t, h in a.get("lies", [])
    )
    lies_html = f'<div class="related"><h3>À lire aussi</h3><ul>{lies}</ul></div>\n' if lies else ""

    sommaire = "".join(f"<li>{escape(x)}</li>" for x in a["sommaire"])

    return (
        "<!DOCTYPE html>\n<html lang=\"fr\"><head>\n"
        + HEAD_TOP
        + f"<title>{escape(titre)}</title>\n"
        + f'<meta name="description" content="{escape(desc)}">\n'
        + f'<meta name="keywords" content="{escape(a["mots_cles"])}">\n'
        + f'<link rel="canonical" href="{url}">\n'
        + f'<meta property="og:title" content="{escape(titre)}">'
        + f'<meta property="og:description" content="{escape(desc)}">\n'
        + '<meta property="og:type" content="article">\n'
        + f'<meta property="og:image" content="{DOMAINE}/og/{DOSSIER}_{a["slug"]}.png" />'
        + f'<meta property="og:url" content="{url}" />\n'
        + '<meta name="twitter:card" content="summary_large_image">\n'
        + '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">\n'
        + "".join(
            '<script type="application/ld+json">' + json.dumps(s, ensure_ascii=False) + "</script>\n"
            for s in schemas
        )
        + CSS
        + "\n</head>\n"
        + NAV
        + "<article>\n"
        + f'<div class="breadcrumb"><a href="{DOMAINE}">Accueil</a> &rsaquo; '
        + f'<a href="{DOMAINE}/{DOSSIER}/">Blog Artisans</a> &rsaquo; {escape(a["fil"])}</div>\n'
        + f"<h1>{escape(a['h1'])}</h1>\n"
        + f'<div class="article-meta"><span>Par l\'équipe BatiSpot</span>'
        + f'<span>Mis à jour le {a["date_fr"]}</span><span>Lecture : {a["lecture"]} min</span></div>\n'
        + f'<div class="summary-box"><h3>Ce que vous allez apprendre</h3><ul>{sommaire}</ul></div>\n\n'
        + a["corps"].strip()
        + "\n"
        + faq_html
        + "\n"
        + a.get("cta", "")
        + "\n"
        + lies_html
        + LM
        + BANNER
        + FOOT
    )


def cta(titre, texte):
    return (
        f'<div class="cta-box"><h3>{escape(titre)}</h3><p>{escape(texte)}</p>'
        f'<a href="{DOMAINE}/artisan" class="cta-btn">Essayer BatiSpot Pro</a></div>'
    )


# ═══════════════════════════════════════════════════════════════════════════
# Les articles. Un dictionnaire par article ; le contenu est écrit à la main,
# les faits chiffrés sont vérifiés (sources citées dans le texte).
# ═══════════════════════════════════════════════════════════════════════════
ARTICLES = []  # rempli par _contenus.py

if __name__ == "__main__":
    from _contenus import ARTICLES as A
    check = "--check" in sys.argv
    for a in A:
        html = page(a)
        # contrôles bloquants : pas d'article publié à moitié
        assert html.count("<article>") == 1, a["slug"]
        assert html.rstrip().endswith("</body></html>"), a["slug"]
        assert "  " not in a["titre"], a["slug"]
        assert len(a["description"]) <= 160, (a["slug"], len(a["description"]))
        assert 55 <= len(a["titre"]) <= 70, (a["slug"], len(a["titre"]))
        if not check:
            (ICI / f"{a['slug']}.html").write_text(html, encoding="utf-8")
        print(f"{'✓' if check else '→'} {a['slug']}.html  ({len(html) // 1000} ko, titre {len(a['titre'])} car.)")
    print(f"{len(A)} articles {'vérifiés' if check else 'écrits'}.")

#!/usr/bin/env python3
"""Generateur articles blog client (B2C). Template HTML commun + contenu par article."""
import os

CSS = """<style>
:root{--g1:#0F5132;--g2:#166534;--t2:#0D9488;--t1:#0F766E;--text:#1C2B22;--sub:#4B6B5A;--border:#BBF7D0;--soft:#F0FDF4;}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}html{scroll-behavior:smooth;}
body{font-family:'Inter',system-ui,sans-serif;color:var(--text);background:#FAFAFA;line-height:1.7;}
.nav{background:white;border-bottom:1px solid #E5E7EB;padding:16px 0;position:sticky;top:0;z-index:100;}
.nav-inner{max-width:800px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:center;}
.nav-logo{font-weight:900;font-size:1.3rem;color:var(--g1);text-decoration:none;}
.nav-logo span{color:var(--g2);opacity:.85;}
.nav-cta{background:var(--g2);color:white;padding:8px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:.85rem;}
.nav-cta:hover{background:var(--g1);}
article{max-width:800px;margin:0 auto;padding:40px 24px 80px;}
.breadcrumb{font-size:.82rem;color:var(--sub);margin-bottom:24px;}
.breadcrumb a{color:var(--t2);text-decoration:none;}
.article-meta{display:flex;gap:16px;font-size:.82rem;color:var(--sub);margin-bottom:24px;flex-wrap:wrap;}
h1{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:800;color:var(--g1);line-height:1.25;margin-bottom:16px;}
h2{font-size:1.3rem;font-weight:700;color:var(--g1);margin:40px 0 16px;padding-top:8px;}
h3{font-size:1.08rem;font-weight:700;color:var(--g2);margin:24px 0 10px;}
p{margin-bottom:16px;font-size:1rem;}
ul,ol{margin:12px 0 20px 22px;}li{margin-bottom:8px;}
strong{color:var(--g1);}a{color:var(--t2);}
.summary-box{background:var(--soft);border-left:4px solid var(--g2);padding:18px 22px;border-radius:0 10px 10px 0;margin:24px 0;}
.summary-box h3{margin-top:0;color:var(--g1);}
.summary-box ul{margin:8px 0 0 20px;}.summary-box li{margin-bottom:4px;}
table{width:100%;border-collapse:collapse;margin:20px 0;font-size:.92rem;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.05);}
th,td{padding:12px 14px;text-align:left;border-bottom:1px solid #E5E7EB;}
th{background:var(--g1);color:white;font-weight:700;font-size:.88rem;}
tr:last-child td{border-bottom:none;}tr:nth-child(even) td{background:#FAFAFA;}
.warning-box{background:#FEF3C7;border-left:4px solid #F59E0B;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;font-size:.95rem;}
.warning-box strong{color:#92400E;}
.info-box{background:#DBEAFE;border-left:4px solid #3B82F6;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;font-size:.95rem;}
.info-box strong{color:#1E40AF;}
.cta-box{background:linear-gradient(135deg,#E6F7ED,#F0FDF4);border:2px solid #59C794;border-radius:16px;padding:28px;text-align:center;margin:40px 0;}
.cta-box h3{font-size:1.2rem;color:var(--g1);margin-bottom:8px;}
.cta-box p{color:var(--sub);margin-bottom:16px;}
.cta-btn{display:inline-block;background:var(--g2);color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;box-shadow:0 4px 12px rgba(22,101,52,.3);}
.cta-btn:hover{background:var(--g1);transform:translateY(-2px);}
.related{margin:50px 0 20px;padding:24px;background:white;border-radius:12px;border:1px solid #E5E7EB;}
.related h3{color:var(--g1);margin-bottom:14px;font-size:1.08rem;}
.related ul{margin:0 0 0 18px;}.related a{font-weight:500;}
.footer-blog{background:var(--g1);color:white;text-align:center;padding:32px 24px;font-size:.85rem;}
.footer-blog a{color:#4CAF82;text-decoration:none;}
@media(max-width:600px){article{padding:24px 16px 60px;}table{font-size:.82rem;}th,td{padding:10px 8px;}}
</style>"""

NAV = """<nav class="nav"><div class="nav-inner">
<a href="https://batispot.pro" class="nav-logo">Bati<span>Spot</span></a>
<a href="https://batispot.pro" class="nav-cta">Obtenir un devis gratuit</a>
</div></nav>"""

FOOTER_CTA = """<div class="cta-box">
<h3>Recevez 3 devis d'artisans verifies sous 24h</h3>
<p>Devis gratuits, sans engagement. Artisans RGE/Qualibat verifies par notre equipe.</p>
<a href="https://batispot.pro" class="cta-btn">Demander mes devis gratuits</a>
</div>"""

FOOTER_BLOG = """<footer class="footer-blog">
<p>&copy; 2026 BatiSpot &mdash; <a href="https://batispot.pro">batispot.pro</a> &middot;
<a href="https://batispot.pro/blog/">Blog</a> &middot;
<a href="https://batispot.pro/simulateur-aides.html">Simulateur aides</a> &middot;
<a href="https://batispot.pro/estimateur.html">Estimateur travaux</a></p>
</footer>"""

def render(slug, title, meta_desc, keywords, h1, read_min, summary_items, body_html, related=None, og_title=None):
    og_title = og_title or title
    related_html = ""
    if related:
        items = "\n".join(f'<li><a href="{r[0]}">{r[1]}</a></li>' for r in related)
        related_html = f'<div class="related"><h3>A lire aussi</h3><ul>{items}</ul></div>'
    summary_html = "\n".join(f"<li>{x}</li>" for x in summary_items)
    return f"""<!DOCTYPE html>
<html lang="fr"><head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-5Z1GK4VJ4E"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','G-5Z1GK4VJ4E');</script>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
<title>{title}</title>
<meta name="description" content="{meta_desc}">
<meta name="keywords" content="{keywords}">
<link rel="canonical" href="https://batispot.pro/blog/{slug}.html">
<meta property="og:title" content="{og_title}"><meta property="og:description" content="{meta_desc}">
<meta property="og:type" content="article"><meta property="og:url" content="https://batispot.pro/blog/{slug}.html">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Article","headline":"{og_title}","description":"{meta_desc}","datePublished":"2026-04-19","dateModified":"2026-04-19","author":{{"@type":"Organization","name":"BatiSpot","url":"https://batispot.pro"}},"publisher":{{"@type":"Organization","name":"BatiSpot","url":"https://batispot.pro"}}}}</script>
{CSS}</head>
<body>{NAV}
<article>
<div class="breadcrumb"><a href="https://batispot.pro">Accueil</a> &rsaquo; <a href="https://batispot.pro/blog/">Blog</a> &rsaquo; {h1}</div>
<h1>{h1}</h1>
<div class="article-meta"><span>Par l'equipe BatiSpot</span><span>Mis a jour le 19/04/2026</span><span>Lecture : {read_min} min</span></div>
<div class="summary-box"><h3>Ce que vous allez apprendre</h3><ul>
{summary_html}
</ul></div>
{body_html}
{FOOTER_CTA}
{related_html}
</article>
{FOOTER_BLOG}
</body></html>"""

if __name__ == "__main__":
    print("Use render() from another script.")

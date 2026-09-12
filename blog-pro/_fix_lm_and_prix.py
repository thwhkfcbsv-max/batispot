#!/usr/bin/env python3
"""
Fix 3 issues across all blog-pro and blog articles:
1. Logo lead magnet : &#9733; → house SVG (charte graphique)
2. Supprimer mentions "Pack fondateur 149 EUR..."
3. UX téléchargement : message success plus clair + bouton re-télécharger
"""
import os, re, glob

HOUSE_SVG = '<svg width="14" height="14" viewBox="0 0 48 48" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M24 12L8 24v12h10V28h12v12h10V24Z"/></svg>'

OLD_BADGE_PATTERNS = [
    r'<div class="lm-badge">&#9733; Guide gratuit</div>',
    r'<div class="lm-badge"><svg[^<]*</svg>\s*Guide gratuit</div>',
]
NEW_BADGE = f'<div class="lm-badge">{HOUSE_SVG} Guide gratuit</div>'

PRIX_PATTERNS = [
    r'<p>BatiSpot Pro\s*:\s*39\s*EUR/mois[^<]*149\s*EUR[^<]*</p>\s*',
    r'<p>BatiSpot Pro\s*:\s*39\s*EUR/mois[^<]*149\s*EUR[^<]*\.</p>\s*',
]

OLD_SUCCESS_MSG = r'<div class="lm-success-msg">Votre PDF se t&#233;l&#233;charge\. Vous recevrez aussi nos prochains guides par email\.</div>'
NEW_SUCCESS_MSG = '''<div class="lm-success-msg">Dans la boîte d'impression qui s'ouvre → choisissez <strong>Enregistrer en PDF</strong>. Vous recevrez aussi nos prochains conseils par email.</div>
    <button onclick="window.print()" style="margin-top:14px;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:white;padding:10px 20px;border-radius:8px;font-size:.85rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Télécharger à nouveau</button>'''

dirs = [
    '/Users/moctar/Desktop/batispot-site/blog-pro',
    '/Users/moctar/Desktop/batispot-site/blog',
]

fixed_logo = 0
fixed_prix = 0
fixed_ux = 0
files_changed = []

for d in dirs:
    for path in glob.glob(os.path.join(d, '*.html')):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content

        # 1. Logo badge
        new_content = content.replace('&#9733; Guide gratuit</div>', f'{HOUSE_SVG} Guide gratuit</div>')
        if new_content != content:
            fixed_logo += 1
            content = new_content

        # 2. Supprimer ligne prix 149 EUR
        for pat in PRIX_PATTERNS:
            new_content = re.sub(pat, '', content, flags=re.IGNORECASE)
            if new_content != content:
                fixed_prix += 1
                content = new_content
                break

        # 3. UX success message
        new_content = re.sub(OLD_SUCCESS_MSG, NEW_SUCCESS_MSG, content)
        if new_content != content:
            fixed_ux += 1
            content = new_content

        if content != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            files_changed.append(os.path.basename(path))

print(f"Logo fixes   : {fixed_logo}")
print(f"Prix 149 EUR : {fixed_prix}")
print(f"UX download  : {fixed_ux}")
print(f"Fichiers modifiés : {len(files_changed)}")

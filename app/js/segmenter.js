/**
 * BatiSpot — segmentation sémantique d'intérieur dans le navigateur (onnxruntime-web, WebGPU puis repli WASM).
 *
 * Module ES sans dépendance hors onnxruntime-web (CDN épinglé ci-dessous).
 *
 *   import { Segmenteur } from './segmenter.js';
 *   const seg = await Segmenteur.charger('onnx/seaformer-S_832x384_fp16.onnx'); // { fournisseurs: ['webgpu','wasm'] }
 *   seg.taille     // { h, w } lus dans le modèle (832×384 portrait, 512×512 carré…) ; l'image source est ÉTIRÉE dedans
 *   const r   = await seg.segmenter(imageElement);                             // ou ImageBitmap, canvas, vidéo
 *   r.classes      // Int32Array h×w : 0 autre, 1 sol, 2 mur, 3 plafond, 4 porte, 5 fenêtre
 *   r.frontieres   // { solMur: [[u,v],…], murPlafond: [[u,v],…] } en pixels de l'image SOURCE (sous-pixel en v)
 *   r.temps        // { pre, inference, post } en ms ; r.fournisseur = 'webgpu' | 'wasm'
 *   seg.dessiner(r, canvas)  // masque coloré + frontières (rouge sol/mur, magenta mur/plafond)
 *
 * Entrée du modèle : `image` float32 1×3×H×W, RGB 0–255 (la normalisation ADE20K est dans le graphe).
 * Sorties : `logits` 1×150×H/8×W/8, `logits6` 1×6×H×W, `classes` int32 1×H×W.
 */

const VERSION_ORT = '1.30.0';
// (04/10, 05h15) RETOUR AU CDN pour le MOTEUR, après trois films du A57 sans une seule image
// analysée (« no available backend found … initWasm() failed »). En l'hébergeant chez nous le
// 03/10 j'avais écarté les variantes `jspi` du moteur, que celui-ci réclame malgré tout au
// démarrage : elles rendaient 404 et l'initialisation échouait définitivement. Le MODÈLE, lui,
// reste chez nous — c'est lui qui a de la valeur. Le dossier `vendor/ort/` est conservé : on y
// reviendra quand la pile complète aura été vérifiée SUR UN TÉLÉPHONE, pas seulement sur Mac.
const CDN_ORT = `https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/${VERSION_ORT}/`;
const LOCAL_ORT = new URL('./vendor/ort/', import.meta.url).href;
// ort.webgpu.min.mjs contient WebGPU + WASM ; les .wasm sont chargés depuis le même dossier.
const ort = await import(`${CDN_ORT}ort.webgpu.min.mjs`);
ort.env.wasm.wasmPaths = CDN_ORT;

export const CLASSES = ['autre', 'sol', 'mur', 'plafond', 'porte', 'fenetre'];
export const COULEURS = [[90, 90, 90], [170, 110, 60], [120, 170, 230], [240, 220, 120], [60, 190, 90], [60, 220, 220]];
export const SOL = 1, MUR = 2, PLAFOND = 3, PORTE = 4, FENETRE = 5;

export class Segmenteur {
  /**
   * @param {string} urlModele  chemin/URL du .onnx (entrée fixe 1×3×H×W, lue au chargement)
   * @param {object} [options]
   * @param {string[]} [options.fournisseurs=['webgpu','wasm']]  ordre d'essai des moteurs
   * @param {number} [options.fils]  nombre de fils WASM (défaut : min(4, cœurs)) ; 1 si la page n'est pas cross-origin isolated
   */
  static async charger(urlModele, options = {}) {
    const fournisseurs = options.fournisseurs || ['webgpu', 'wasm'];
    // (04/10, film de 04h50 : « no available backend found, previous call to initWasm() failed »)
    // Le moteur n'accepte PLUSIEURS FILS que si la page est « cross-origin isolated » (en-têtes
    // COOP/COEP), ce que GitHub Pages n'envoie pas : SharedArrayBuffer est alors absent et
    // l'initialisation échoue définitivement. Un seul fil tant qu'on n'est pas isolé.
    const isole = typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated;
    ort.env.wasm.numThreads = options.fils || (isole ? Math.min(4, navigator.hardwareConcurrency || 1) : 1);
    const octets = new Uint8Array(await (await fetch(urlModele)).arrayBuffer());
    let derniereErreur = null;
    for (const f of fournisseurs) {
      if (f === 'webgpu' && !navigator.gpu) { derniereErreur = new Error('WebGPU absent'); continue; }
      try {
        const t0 = performance.now();
        const session = await ort.InferenceSession.create(octets, {
          executionProviders: [f],
          graphOptimizationLevel: 'all',
        });
        const s = new Segmenteur(session, f, urlModele);
        s.tempsChargement = performance.now() - t0;
        s.octets = octets.byteLength;
        return s;
      } catch (e) {
        // (04/10) Si NOTRE moteur refuse de démarrer sur ce téléphone, on retente une fois depuis
        // le CDN : mieux vaut un métré qui marche qu'une indépendance qui laisse l'artisan sans
        // cotes. Le cas est journalisé (`replis`) pour qu'on le voie et qu'on le corrige chez nous.
        if (f === 'wasm' && !Segmenteur._repli && /initWasm|backend|wasm|fetch|network/i.test(String(e && e.message || e))) {
          try {
            Segmenteur._repli = true;
            ort.env.wasm.wasmPaths = LOCAL_ORT;            // CDN injoignable : notre copie, en secours
            const session = await ort.InferenceSession.create(octets, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
            const s2 = new Segmenteur(session, 'wasm (repli local)', urlModele);
            s2.tempsChargement = 0; s2.octets = octets.byteLength; s2.repli = true;
            return s2;
          } catch (e2) { ort.env.wasm.wasmPaths = CDN_ORT; }
        }
        derniereErreur = e;
        console.warn(`Segmenteur : ${f} indisponible (${e.message}), repli`);
      }
    }
    throw derniereErreur || new Error('aucun moteur disponible');
  }

  constructor(session, fournisseur, url) {
    this.session = session;
    this.fournisseur = fournisseur;
    this.url = url;
    // Forme d'entrée lue dans le modèle : [1, 3, H, W]. Repli 512² si les métadonnées manquent.
    const dims = session.inputMetadata?.[0]?.shape;
    const h = Array.isArray(dims) && typeof dims[2] === 'number' ? dims[2] : 512;
    const w = Array.isArray(dims) && typeof dims[3] === 'number' ? dims[3] : h;
    this.taille = { h, w };
    this.entree = session.inputNames[0];
    this._canvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(w, h)
      : Object.assign(document.createElement('canvas'), { width: w, height: h });
    this._ctx = this._canvas.getContext('2d', { willReadFrequently: true });
    this._tampon = new Float32Array(3 * h * w);
    this.versionOrt = VERSION_ORT;
  }

  /** Prépare le tenseur 1×3×H×W (RGB 0–255) depuis n'importe quelle source dessinable. L'image est ÉTIRÉE en H×W. */
  preparer(source) {
    const { h, w } = this.taille;
    const largeur = source.naturalWidth || source.videoWidth || source.width;
    const hauteur = source.naturalHeight || source.videoHeight || source.height;
    this._ctx.drawImage(source, 0, 0, w, h);
    const px = this._ctx.getImageData(0, 0, w, h).data;
    const n = h * w, t = this._tampon;
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      t[i] = px[j];
      t[n + i] = px[j + 1];
      t[2 * n + i] = px[j + 2];
    }
    return { tenseur: new ort.Tensor('float32', t, [1, 3, h, w]), largeur, hauteur };
  }

  /** Segmente une image. Retourne classes (Int32Array h×w), logits6 (Float32Array 6×h×w), frontières, temps. */
  async segmenter(source) {
    const t0 = performance.now();
    const { tenseur, largeur, hauteur } = this.preparer(source);
    const t1 = performance.now();
    const sortie = await this.session.run({ [this.entree]: tenseur });
    const t2 = performance.now();
    const classes = sortie.classes.data instanceof Int32Array ? sortie.classes.data : Int32Array.from(sortie.classes.data, Number);
    const logits6 = sortie.logits6.data;
    const frontieres = {
      solMur: this.frontiere(classes, logits6, SOL, MUR, largeur, hauteur),
      murPlafond: this.frontiere(classes, logits6, PLAFOND, MUR, largeur, hauteur, true),
    };
    const ouvertures = this.ouvertures(classes, frontieres, largeur, hauteur);
    const t3 = performance.now();
    return {
      classes, logits6, taille: this.taille, largeur, hauteur, frontieres, ouvertures,
      fournisseur: this.fournisseur,
      temps: { pre: t1 - t0, inference: t2 - t1, post: t3 - t2, total: t3 - t0 },
    };
  }

  /**
   * Frontière entre la classe `bas` (en dessous) et `haut` (au-dessus), colonne par colonne.
   * Pour sol/mur : plus longue plage verticale de `sol` dans la colonne, son bord supérieur, avec `mur` juste au-dessus.
   * Pour mur/plafond (inverse=true) : plus longue plage de `plafond`, son bord inférieur, avec `mur` juste en dessous.
   * v est affiné au sous-pixel par le zéro de (logit_bas − logit_haut). Coordonnées en pixels de l'image source.
   * @returns {Array<[number, number]>} liste de [u, v] (v = -1 : pas de frontière dans cette colonne)
   */
  frontiere(classes, logits6, bas, haut, largeur, hauteur, inverse = false, marge = 4) {
    const { h: H, w: W } = this.taille, n = H * W, pts = new Array(W);
    const sx = largeur / W, sy = hauteur / H;
    for (let u = 0; u < W; u++) {
      let meilleur = -1, longMax = 0, v = 0;
      while (v < H) {
        if (classes[v * W + u] === bas) {
          const d = v;
          while (v < H && classes[v * W + u] === bas) v++;
          if (v - d > longMax) { longMax = v - d; meilleur = inverse ? v - 1 : d; }
        } else v++;
      }
      if (meilleur < 0) { pts[u] = [(u + 0.5) * sx, -1]; continue; }
      // la classe `haut` doit occuper au moins la moitié des `marge` pixels de l'autre côté
      let ok = 0, tot = 0;
      for (let k = 1; k <= marge; k++) {
        const vv = inverse ? meilleur + k : meilleur - k;
        if (vv < 0 || vv >= H) break;
        tot++; if (classes[vv * W + u] === haut) ok++;
      }
      if (!tot || ok * 2 < tot) { pts[u] = [(u + 0.5) * sx, -1]; continue; }
      // affinage sous-pixel : s = logit_bas − logit_haut change de signe entre les deux pixels frontière
      const vb = meilleur, vh = inverse ? meilleur + 1 : meilleur - 1;
      let vf = vb + 0.5;
      if (vh >= 0 && vh < H) {
        const sb = logits6[bas * n + vb * W + u] - logits6[haut * n + vb * W + u];
        const sh = logits6[bas * n + vh * W + u] - logits6[haut * n + vh * W + u];
        if (sb > 0 && sh < 0) vf = vb + 0.5 + (vh - vb) * (sb / (sb - sh));
      }
      pts[u] = [(u + 0.5) * sx, vf * sy];
    }
    return pts;
  }

  /**
   * Portes et fenêtres (04/10) : par colonne, la classe dominante au-dessus de la frontière
   * sol/mur (sur 12 lignes du modèle) ; les colonnes « porte » ou « fenêtre » consécutives
   * forment une ouverture, avec le bas et le haut de la zone (en pixels de l'image SOURCE).
   * Rend [{ u0, u1, type: 'porte'|'fenetre', vBas, vHaut, largeurPx }], ≥ 12 colonnes modèle.
   */
  ouvertures(classes, frontieres, largeur, hauteur) {
    const { h: H, w: W } = this.taille, sx = largeur / W, sy = hauteur / H;
    const colonnes = new Array(W).fill(0);
    for (let u = 0; u < W; u++) {
      const f = frontieres.solMur[u]; const vf = f && f[1] >= 0 ? Math.round(f[1] / sy) : H - 1;
      let nP = 0, nF = 0, nM = 0;
      for (let k = 2; k <= 14; k++) { const v = vf - k; if (v < 0) break; const c = classes[v * W + u]; if (c === PORTE) nP++; else if (c === FENETRE) nF++; else if (c === MUR) nM++; }
      colonnes[u] = nP >= 7 ? PORTE : (nF >= 7 ? FENETRE : 0);
    }
    // Fenêtres sans frontière sol visible (elles sont en hauteur) : colonne « fenêtre » si ≥ 10 % de la colonne.
    for (let u = 0; u < W; u++) if (!colonnes[u]) { let nF = 0; for (let v = 0; v < H; v++) if (classes[v * W + u] === FENETRE) nF++; if (nF >= H * 0.1) colonnes[u] = FENETRE; }
    const out = [];
    let u = 0;
    while (u < W) {
      if (!colonnes[u]) { u++; continue; }
      const type = colonnes[u]; let u1 = u; while (u1 + 1 < W && colonnes[u1 + 1] === type) u1++;
      if (u1 - u + 1 >= 12) {
        let vMin = H, vMax = -1;
        for (let c = u; c <= u1; c++) for (let v = 0; v < H; v++) if (classes[v * W + c] === type) { if (v < vMin) vMin = v; if (v > vMax) vMax = v; }
        out.push({ u0: (u + 0.5) * sx, u1: (u1 + 0.5) * sx, type: type === PORTE ? 'porte' : 'fenetre', vBas: (vMax + 0.5) * sy, vHaut: (vMin + 0.5) * sy, largeurPx: (u1 - u + 1) * sx });
      }
      u = u1 + 1;
    }
    return out;
  }

  /** Dessine image + masque (alpha) + frontières dans un canvas 2D aux dimensions de la source. */
  dessiner(resultat, canvas, source = null, alpha = 0.5) {
    const { classes, taille: { h, w }, largeur, hauteur, frontieres } = resultat;
    canvas.width = largeur; canvas.height = hauteur;
    const ctx = canvas.getContext('2d');
    if (source) ctx.drawImage(source, 0, 0, largeur, hauteur);
    const masque = new ImageData(w, h);
    for (let i = 0; i < h * w; i++) {
      const c = COULEURS[classes[i]] || COULEURS[0];
      masque.data[4 * i] = c[0]; masque.data[4 * i + 1] = c[1]; masque.data[4 * i + 2] = c[2];
      masque.data[4 * i + 3] = Math.round(255 * alpha);
    }
    const tmp = this._canvas; this._ctx.putImageData(masque, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, largeur, hauteur);
    ctx.imageSmoothingEnabled = true;
    const trace = (pts, couleur) => {
      ctx.strokeStyle = couleur; ctx.lineWidth = Math.max(2, largeur / 400); ctx.beginPath();
      let ouvert = false;
      for (const [u, v] of pts) {
        if (v < 0) { ouvert = false; continue; }
        if (!ouvert) { ctx.moveTo(u, v); ouvert = true; } else ctx.lineTo(u, v);
      }
      ctx.stroke();
    };
    trace(frontieres.solMur, '#ff2828');
    trace(frontieres.murPlafond, '#ff00ff');
  }

  /** Part de chaque classe (0–1) dans le masque. */
  static parts(classes) {
    const n = new Array(CLASSES.length).fill(0);
    for (let i = 0; i < classes.length; i++) n[classes[i]]++;
    return Object.fromEntries(CLASSES.map((c, i) => [c, n[i] / classes.length]));
  }

  libérer() { return this.session.release(); }
}

// Lecture de photo par l'IA : ticket de caisse et métré de pièce.
//
// POURQUOI CE FICHIER EXISTE
// Les deux modes serveur (`ocr-receipt`, `scan-room-photo`) existent depuis
// longtemps et marchent. Mais l'assistant flottant, lui, ne les appelait pas :
// il affichait un résultat ÉCRIT EN DUR derrière un setTimeout(700) — un ticket
// « Point.P Levallois, 411,00 € TTC » et un métré « 22.4 m² » qui ne venaient
// d'aucune photo. L'artisan photographiait SON ticket et lisait les chiffres
// de quelqu'un d'autre, présentés comme les siens. Le bouton « Enregistrer
// dans mes dépenses » était un alert() : rien n'était enregistré.
//
// Le code réel vivait dans photos.html. Le recopier dans l'assistant aurait
// créé un jumeau : la prochaine correction n'en aurait touché qu'un. D'où ce
// module — il porte l'appel réseau et la lecture de la réponse, une seule fois.
// L'affichage reste chez l'appelant, qui seul sait à quoi ressemble son écran.
//
// CE QUE CE MODULE NE FAIT PAS : il n'écrit rien. Il rapporte ce que le serveur
// a lu. L'enregistrement d'une dépense passe par `executerAction`, après que
// l'artisan a validé — proposer puis écrire sur son clic, jamais l'inverse.

const URL_DEFAUT = 'https://cisniwhaiydazdpzvino.supabase.co';
const DELAI_MS = 60000;

/**
 * Réduit une photo avant envoi. Une photo de téléphone moderne pèse plusieurs
 * mégaoctets ; l'envoyer entière coûte du temps et des tokens pour rien.
 * En cas d'échec (HEIC indécodable, mémoire courte), on renvoie le fichier brut
 * plutôt que de bloquer l'artisan.
 */
export async function reduirePourAnalyse(file, maxDim = 1600, qualite = 0.8) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  try {
    // { imageOrientation: 'from-image' } explicite : sans lui, certains
    // moteurs decodent le buffer brut du capteur et ignorent la balise EXIF
    // Orientation, ce qui fait pivoter une photo prise en portrait avant
    // meme qu'elle n'atteigne le serveur d'analyse.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * ratio);
    const h = Math.round(bitmap.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
    bitmap.close && bitmap.close();       // libère le décodage plein format tout de suite
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', qualite));
    canvas.width = canvas.height = 0;     // libère le buffer du canvas
    if (blob) return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  } catch (e) {
    console.warn('[app-photo-ia] réduction impossible, envoi du fichier brut', e);
  }
  return file;
}

function enBase64(f) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).replace(/^data:[^;]+;base64,/, ''));
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

/**
 * Appel brut à gemini-assistant.
 *
 * Le jeton de SESSION, pas la clé anonyme : en production `EXIGER_JWT_APP`
 * vaut 1 et `ocr-receipt` n'est pas dans `MODES_APP_ANON_OK`. Avec la clé anon
 * le serveur répondait 401, et l'artisan lisait « Ticket illisible » alors que
 * sa photo était parfaite. C'est ce qui a laissé la table `depenses` vide.
 *
 * Le code HTTP doit survivre au catch : c'est lui qui distingue une photo floue
 * (200 mais rien de lisible) d'une panne serveur (401, 500). Sans lui, une
 * panne ressemble à une photo ratée — côté artisan comme dans les logs.
 */
async function appeler(mode, fichierReduit, prompt) {
  const cfg = window.__BATISPOT_CONFIG__ || {};
  const url = (cfg.SUPABASE_URL || URL_DEFAUT) + '/functions/v1/gemini-assistant';
  const jwt = (typeof window.bsJetonSession === 'function') ? window.bsJetonSession() : null;

  const headers = { 'content-type': 'application/json' };
  if (cfg.SUPABASE_ANON_KEY) headers['apikey'] = cfg.SUPABASE_ANON_KEY;
  headers['authorization'] = 'Bearer ' + (jwt || cfg.SUPABASE_ANON_KEY || '');

  const corps = {
    mode,
    image: { data: await enBase64(fichierReduit), mimeType: fichierReduit.type || 'image/jpeg' },
  };
  if (prompt) corps.prompt = prompt;

  const r = await (window.bsFetchAvecDelai || fetch)(url, {
    method: 'POST', headers, body: JSON.stringify(corps),
  }, DELAI_MS);

  if (!r.ok) { const err = new Error('http_' + r.status); err.statusHttp = r.status; throw err; }
  const j = await r.json();
  return (j && j.data) || null;
}

/**
 * Lit un ticket de caisse ou une facture fournisseur.
 * @returns {Promise<{data: object, fichierReduit: File}>} `data` porte
 *   supplier, date, totalHT, totalTTC, vatRate, items[], category, confidence.
 * @throws Error avec `.statusHttp` (panne serveur) ou message `illisible`.
 */
export async function lireTicketIA(file) {
  const fichierReduit = await reduirePourAnalyse(file);
  const data = await appeler('ocr-receipt', fichierReduit,
    'Extrais les donnees de ce ticket de caisse ou facture fournisseur.');
  // Un ticket sans montant n'est pas un ticket lu : mieux vaut le dire que
  // d'afficher une dépense à zéro que l'artisan croirait enregistrée.
  if (!data || !(data.totalTTC || data.totalHT)) throw new Error('illisible');
  return { data, fichierReduit };
}

/**
 * Estime les dimensions d'une pièce à partir d'une photo.
 * @returns {Promise<{data: object, fichierReduit: File}>} `data` porte
 *   surfaceEstimeeM2, largeurEstimeeM, longueurEstimeeM, hauteurSousPlafondM,
 *   typePiece, confiance, referencesUtilisees[], avertissement.
 * @throws Error avec `.statusHttp` (panne serveur) ou message `illisible`.
 */
export async function estimerPieceIA(file) {
  const fichierReduit = await reduirePourAnalyse(file);
  const data = await appeler('scan-room-photo', fichierReduit, null);
  if (!data || !data.surfaceEstimeeM2) throw new Error('illisible');
  return { data, fichierReduit };
}

/**
 * Message à montrer à l'artisan quand la lecture échoue.
 *
 * Une panne serveur n'est pas une photo ratée. Les confondre pousse l'artisan
 * à reprendre dix fois une photo parfaite, puis à abandonner en silence —
 * et personne n'est prévenu. On distingue les deux, et on remonte la panne.
 */
export function messageEchecPhoto(e, quoi) {
  const panne = !!(e && (e.statusHttp || e.delaiDepasse));
  // Un fetch qui n'atteint jamais le serveur (TypeError « Failed to fetch »
  // sur Chrome, « Load failed » sur Safari) n'est ni une photo ratee ni une
  // panne serveur : c'est l'absence de reseau sur le chantier. Sans cette
  // distinction, l'artisan hors couverture lisait « photo illisible » sans
  // savoir qu'il suffit de reessayer une fois connecte.
  const horsLigne = !panne && (
    (typeof navigator !== 'undefined' && navigator.onLine === false)
    || e instanceof TypeError
  );
  const sujet = quoi === 'ticket' ? 'Lecture du ticket' : 'Estimation';
  const message = panne
    ? `${sujet} indisponible pour le moment. Ce n'est pas votre photo — nous sommes prévenus.`
    : horsLigne
      ? `Pas de connexion. Réessayez une fois connecté — ${quoi === 'ticket' ? 'le ticket' : 'la photo'} n'a pas été envoyé${quoi === 'ticket' ? '' : 'e'}.`
      : (quoi === 'ticket'
          ? 'Ticket illisible. Réessayez avec une photo plus nette, ou saisissez la dépense à la main.'
          : 'Photo illisible pour l’estimation. Reprenez avec la pièce plus dégagée (porte ou fenêtre visible), ou saisissez les cotes à la main.');

  if (typeof window.bsSignalerPanne === 'function') {
    window.bsSignalerPanne({
      action: quoi === 'ticket' ? 'scan de ticket' : 'estimation par photo',
      mode: quoi === 'ticket' ? 'ocr-receipt' : 'scan-room-photo',
      code: (e && e.statusHttp) || (e && e.delaiDepasse ? 'delai_depasse' : 'lecture'),
      detail: String((e && e.message) || e),
    });
  }
  return { message, panne };
}

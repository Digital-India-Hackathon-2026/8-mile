import { createWorker } from 'tesseract.js';

/**
 * Document number patterns.
 *
 * UDYAM is the honest hero here: it has a genuinely public, checkable format
 * (UDYAM-XX-00-0000000), so format validation is real, not theatre.
 *
 * PEHCHAN card numbering is not publicly documented in a machine-checkable
 * spec, so we validate shape only and say so. Do not claim more than this on
 * stage -- a judge who knows the space will catch it.
 */
const PATTERNS = {
  UDYAM: {
    regex: /UDYAM[-\s]?([A-Z]{2})[-\s]?(\d{2})[-\s]?(\d{7})/i,
    label: 'Udyam Registration',
    strict: true,
  },
  GI: {
    regex: /\bGI[\s\-:]*(?:application|reg(?:istration)?)?[\s\-:]*(?:no\.?|number)?[\s\-:]*(\d{2,5})\b/i,
    label: 'GI Certificate',
    strict: true,
  },
  PEHCHAN: {
    // shape-only: keyword nearby + an 8-20 char alphanumeric token
    regex: /(?:pehchan|pehchaan|artisan\s*(?:id|card)|handicrafts?\s*artisan)[\s\S]{0,60}?\b([A-Z0-9]{8,20})\b/i,
    label: 'Pehchan Artisan Card',
    strict: false,
  },
};

/** Extract the strongest document signal we can find in raw OCR text. */
export function parseDocument(rawText) {
  const text = (rawText || '').replace(/\s+/g, ' ').trim();

  for (const [docType, def] of Object.entries(PATTERNS)) {
    const m = text.match(def.regex);
    if (m) {
      const number =
        docType === 'UDYAM' ? `UDYAM-${m[1].toUpperCase()}-${m[2]}-${m[3]}` : m[1].toUpperCase();
      return {
        docType,
        docNumber: number,
        formatValid: true,
        strictFormat: def.strict,
        label: def.label,
      };
    }
  }
  return { docType: null, docNumber: null, formatValid: false, strictFormat: false, label: null };
}

/**
 * Pull a craft/GI claim out of the document text by scanning for any known GI
 * name. We pass the registry in rather than importing it, so this stays a pure
 * text function and is trivially unit-testable.
 */
export function extractGiClaim(rawText, registry) {
  const text = (rawText || '').toLowerCase();
  let best = null;
  for (const entry of registry) {
    const needles = [entry.gi, ...entry.aliases].map((s) => s.toLowerCase());
    for (const n of needles) {
      if (text.includes(n)) {
        // prefer the longest match -- "pochampally ikat" beats "pochampally"
        if (!best || n.length > best.needle.length) best = { needle: n, gi: entry.gi };
      }
    }
  }
  return best ? best.gi : null;
}

/** Real OCR via tesseract.js. Accepts a Buffer or a file path. */
export async function runOcr(input) {
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(input);
    return { text: data.text || '', confidence: Math.round(data.confidence || 0) };
  } finally {
    await worker.terminate();
  }
}

/**
 * Mock mode. OCR_MODE=mock skips tesseract entirely and reads the "document"
 * from an uploaded .txt or from a canned fixture. This exists because tesseract
 * on a cold container can take 10-20s and you do not want that on stage.
 */
export async function runMockOcr(input, hint = '') {
  const canned = `GOVERNMENT OF INDIA
MINISTRY OF TEXTILES
OFFICE OF THE DEVELOPMENT COMMISSIONER (HANDICRAFTS)
PEHCHAN ARTISAN IDENTITY CARD
Artisan ID: TS0714829366
Name: ${hint || 'Demo Artisan'}
Craft: Pochampally Ikat
UDYAM-TS-05-0043921
District: Yadadri Bhuvanagiri   State: Telangana`;

  const text = Buffer.isBuffer(input) && input.length < 5000 ? input.toString('utf8') : canned;
  return { text, confidence: 92 };
}

export async function ocr(input, { mode = 'ocr', hint = '' } = {}) {
  return mode === 'mock' ? runMockOcr(input, hint) : runOcr(input);
}

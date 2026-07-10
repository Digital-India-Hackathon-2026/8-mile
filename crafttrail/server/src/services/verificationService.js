import { GI_REGISTRY, findGi, giMatchesDistrict } from '../data/giRegistry.js';
import { ocr, parseDocument, extractGiClaim } from './ocrService.js';
import AuditLog from '../models/AuditLog.js';

/**
 * TIER 1 -- document-first, fully automated, zero human effort.
 *
 * Pipeline:  image -> OCR -> document number + format -> GI claim
 *            -> cross-check GI against the artisan's declared district
 *
 * This is the piece that works live on day one. It cannot prove an artisan is
 * real; it can prove a claim is internally consistent with the GI registry.
 * Say exactly that when a judge asks.
 */
export async function runTier1({ fileBuffer, artisan, mode = 'ocr' }) {
  const { text, confidence } = await ocr(fileBuffer, { mode, hint: artisan.name });

  const doc = parseDocument(text);
  const claimedGi = extractGiClaim(text, GI_REGISTRY) || artisan.claimedGi || null;
  const giEntry = findGi(claimedGi);
  const districtCheck = giMatchesDistrict(giEntry, artisan.district, artisan.state);

  const reasons = [];
  if (!doc.formatValid) reasons.push('No recognisable Pehchan / GI / Udyam number found');
  else if (doc.strictFormat) reasons.push(`${doc.label} number format valid`);
  else reasons.push(`${doc.label} number shape accepted (no public checksum spec)`);

  if (!giEntry) reasons.push(`Craft claim "${claimedGi || 'none'}" not found in GI registry`);
  else reasons.push(districtCheck.reason);

  // PASS requires BOTH a parseable document AND a GI/district match.
  // Neither alone is sufficient -- that is the whole point of layering.
  const status = doc.formatValid && districtCheck.match ? 'PASS' : 'FAIL';

  const tier1 = {
    status,
    docType: doc.docType,
    docNumber: doc.docNumber,
    formatValid: doc.formatValid,
    claimedGi: giEntry ? giEntry.gi : claimedGi,
    giFound: Boolean(giEntry),
    giDistrictMatch: districtCheck.match,
    reason: reasons.join(' · '),
    ocrConfidence: confidence,
    rawText: text.slice(0, 2000),
    checkedAt: new Date(),
  };

  await AuditLog.create({
    actorType: 'SYSTEM',
    artisan: artisan._id,
    action: 'TIER1_CHECK',
    detail: {
      status,
      docType: doc.docType,
      giDistrictMatch: districtCheck.match,
      ocrConfidence: confidence,
    },
  });

  return tier1;
}

/**
 * Trust score, 0-100. Deliberately weighted so that no single layer can carry
 * an artisan to a high badge on its own.
 *
 *   Tier 1  max 40  (document parse 20 + GI/district cross-check 20)
 *   Tier 2  max 35  (institutional endorsements, 20 for the first, 15 for a second)
 *   Tier 3  max 25  (rating quality scaled by review volume)
 *
 * A forged document alone caps at 40. One bribed verifier caps at 60.
 * Only sustained real tourist visits push you past that.
 */
export function computeTrustScore(verification) {
  const t1 = verification?.tier1 || {};
  const t2 = verification?.tier2 || {};
  const t3 = verification?.tier3 || {};

  let score = 0;

  if (t1.formatValid) score += 20;
  if (t1.giDistrictMatch) score += 20;

  const endorsements = (t2.endorsements || []).length;
  if (endorsements >= 1) score += 20;
  if (endorsements >= 2) score += 15;

  const { reviewCount = 0, avgRating = 0 } = t3;
  if (reviewCount > 0) {
    const quality = avgRating / 5; // 0..1
    const volume = Math.min(reviewCount / 10, 1); // saturates at 10 reviews
    score += Math.round(25 * quality * volume);
  }

  return Math.min(100, score);
}

export function tier2Status(endorsementCount) {
  if (endorsementCount >= 2) return 'CORROBORATED';
  if (endorsementCount === 1) return 'PARTIAL';
  return 'NONE';
}

/** Human-facing badge, derived -- never stored, so it can never drift. */
export function badgeFor(artisan) {
  const s = artisan.trustScore || 0;
  const t1 = artisan.verification?.tier1?.status;
  if (t1 !== 'PASS') return { label: 'Unverified', level: 0 };
  if (s >= 75) return { label: 'Community Verified', level: 3 };
  if (s >= 55) return { label: 'Institution Corroborated', level: 2 };
  return { label: 'Document Verified', level: 1 };
}

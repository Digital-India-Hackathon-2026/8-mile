import { shortCode, hmac } from '../utils/ids.js';
import Certificate from '../models/Certificate.js';
import { badgeFor } from './verificationService.js';

/**
 * The "Digital Handshake".
 *
 * We do not use a blockchain and we should not say we do. We HMAC-sign a
 * canonical JSON payload with a server secret. Anyone can call
 * /api/certificates/:code/verify and get back "signature valid / tampered".
 * That delivers the actual property a tourist wants -- "this was issued by
 * CraftTrail and has not been edited" -- with none of the hand-waving.
 */

function canonical(payload) {
  // stable key order so the signature is reproducible
  return JSON.stringify(payload, Object.keys(payload).sort());
}

export function signPayload(payload) {
  return hmac(canonical(payload), process.env.CERT_SIGNING_SECRET || 'dev');
}

export async function issueCertificate({ booking, artisan, cluster }) {
  const code = shortCode(8);
  const badge = badgeFor(artisan);

  const snapshot = {
    artisanName: artisan.name,
    craft: artisan.craft,
    giTag: artisan.verification?.tier1?.claimedGi || artisan.claimedGi || '',
    clusterName: cluster?.name || '',
    district: artisan.district,
    state: artisan.state,
    tier1Status: artisan.verification?.tier1?.status || 'PENDING',
    trustScoreAtIssue: artisan.trustScore || 0,
    heritageNote: cluster?.heritageNote || '',
    imageUrl: cluster?.imageUrl || '',
  };

  const payload = {
    code,
    touristName: booking.tourist.name,
    artisanName: snapshot.artisanName,
    craft: snapshot.craft,
    giTag: snapshot.giTag,
    district: snapshot.district,
    state: snapshot.state,
    issuedAt: new Date().toISOString(),
  };

  const signature = signPayload(payload);

  const cert = await Certificate.create({
    code,
    booking: booking._id,
    artisan: artisan._id,
    snapshot: { ...snapshot, badge: badge.label },
    touristName: booking.tourist.name,
    issuedAt: payload.issuedAt,
    signature,
  });

  return cert;
}

/** Recompute the signature from stored fields and compare. Tamper-evident. */
export function verifyCertificate(cert) {
  const payload = {
    code: cert.code,
    touristName: cert.touristName,
    artisanName: cert.snapshot.artisanName,
    craft: cert.snapshot.craft,
    giTag: cert.snapshot.giTag,
    district: cert.snapshot.district,
    state: cert.snapshot.state,
    issuedAt: new Date(cert.issuedAt).toISOString(),
  };
  const expected = signPayload(payload);
  return { valid: expected === cert.signature, expected };
}

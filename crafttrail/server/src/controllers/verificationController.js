import Artisan from '../models/Artisan.js';
import Verifier from '../models/Verifier.js';
import Cluster from '../models/Cluster.js';
import AuditLog from '../models/AuditLog.js';
import {
  runTier1,
  computeTrustScore,
  tier2Status,
  badgeFor,
} from '../services/verificationService.js';

/** POST /api/artisans  -- onboarding, pre-verification */
export async function createArtisan(req, res, next) {
  try {
    const { name, phone, craft, claimedGi, district, state, lat, lng, clusterId, bio, upiId } =
      req.body;

    if (!name || !phone || !craft || !district || !state || lat == null || lng == null) {
      return res.status(400).json({ error: 'name, phone, craft, district, state, lat, lng required' });
    }

    const artisan = await Artisan.create({
      name,
      phone,
      craft,
      claimedGi: claimedGi || null,
      district,
      state,
      bio: bio || '',
      upiId: upiId || null,
      cluster: clusterId || null,
      location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
    });

    await AuditLog.create({
      actorType: 'ARTISAN',
      actorId: artisan._id,
      artisan: artisan._id,
      action: 'ARTISAN_REGISTERED',
      detail: { claimedGi, district, state },
    });

    res.status(201).json(artisan);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Phone already registered' });
    next(err);
  }
}

/**
 * POST /api/artisans/:id/verify   (multipart: field "document")
 *
 * Tier 1. Upload -> OCR -> format check -> GI/district cross-check -> badge.
 * Returns the full reasoning chain, not just a boolean, because the whole
 * pitch is that this system is legible rather than a black box.
 */
export async function verifyTier1(req, res, next) {
  try {
    const artisan = await Artisan.findById(req.params.id);
    if (!artisan) return res.status(404).json({ error: 'Artisan not found' });
    if (!req.file) return res.status(400).json({ error: 'document file required' });

    const mode = process.env.OCR_MODE === 'mock' ? 'mock' : 'ocr';
    const tier1 = await runTier1({ fileBuffer: req.file.buffer, artisan, mode });

    artisan.verification.tier1 = tier1;
    if (tier1.claimedGi) artisan.claimedGi = tier1.claimedGi;
    artisan.trustScore = computeTrustScore(artisan.verification);
    await artisan.save();

    res.json({
      artisanId: artisan._id,
      tier1: { ...tier1, rawText: undefined },
      trustScore: artisan.trustScore,
      badge: badgeFor(artisan),
      // spell out the ceiling, so nobody oversells a document-only badge
      note:
        tier1.status === 'PASS'
          ? 'Document verified. Trust score is capped at 40 until an institution corroborates.'
          : 'Verification failed. See reason for the exact check that did not pass.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/artisans/:id/endorse   { verifierId, note }
 * Tier 2. An SHG / cooperative / CSC operator vouches for a real human.
 */
export async function endorseTier2(req, res, next) {
  try {
    const { verifierId, note } = req.body;
    const [artisan, verifier] = await Promise.all([
      Artisan.findById(req.params.id),
      Verifier.findById(verifierId),
    ]);

    if (!artisan) return res.status(404).json({ error: 'Artisan not found' });
    if (!verifier || !verifier.active) return res.status(404).json({ error: 'Verifier not found' });

    const already = artisan.verification.tier2.endorsements.some(
      (e) => String(e.verifier) === String(verifier._id)
    );
    if (already) return res.status(409).json({ error: 'Verifier has already endorsed this artisan' });

    artisan.verification.tier2.endorsements.push({ verifier: verifier._id, note: note || '' });
    artisan.verification.tier2.status = tier2Status(artisan.verification.tier2.endorsements.length);
    if (!artisan.managedBy) artisan.managedBy = verifier._id;
    artisan.trustScore = computeTrustScore(artisan.verification);
    await artisan.save();

    verifier.endorsementCount += 1;
    await verifier.save();

    await AuditLog.create({
      actorType: 'VERIFIER',
      actorId: verifier._id,
      artisan: artisan._id,
      action: 'TIER2_ENDORSEMENT',
      detail: { verifierName: verifier.name, verifierType: verifier.type, note },
    });

    res.json({
      artisanId: artisan._id,
      tier2Status: artisan.verification.tier2.status,
      endorsements: artisan.verification.tier2.endorsements.length,
      trustScore: artisan.trustScore,
      badge: badgeFor(artisan),
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/artisans/:id/audit -- the trail that makes corruption detectable */
export async function auditTrail(req, res, next) {
  try {
    const logs = await AuditLog.find({ artisan: req.params.id }).sort({ at: -1 }).limit(50);
    res.json({ count: logs.length, logs });
  } catch (err) {
    next(err);
  }
}

/** GET /api/verifiers?district= */
export async function listVerifiers(req, res, next) {
  try {
    const q = { active: true };
    if (req.query.district) q.district = req.query.district;
    res.json(await Verifier.find(q).sort({ accuracyRating: -1 }));
  } catch (err) {
    next(err);
  }
}

/** GET /api/clusters */
export async function listClusters(_req, res, next) {
  try {
    res.json(await Cluster.find().sort({ significance: -1 }));
  } catch (err) {
    next(err);
  }
}

/** GET /api/crafts -- populates the "Interested in" filter. Derived, never hardcoded. */
export async function listCrafts(_req, res, next) {
  try {
    const crafts = await Cluster.distinct('craft');
    res.json({ crafts: crafts.sort() });
  } catch (err) {
    next(err);
  }
}

/** GET /api/states -- for the state picker, with a cluster count each. */
export async function listStates(_req, res, next) {
  try {
    const rows = await Cluster.aggregate([
      { $group: { _id: '$state', clusters: { $sum: 1 }, crafts: { $addToSet: '$craft' } } },
      { $project: { _id: 0, state: '$_id', clusters: 1, craftCount: { $size: '$crafts' } } },
      { $sort: { state: 1 } },
    ]);
    res.json({ states: rows });
  } catch (err) {
    next(err);
  }
}

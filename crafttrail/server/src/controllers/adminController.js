import Artisan from '../models/Artisan.js';
import Cluster from '../models/Cluster.js';
import Verifier from '../models/Verifier.js';
import Booking from '../models/Booking.js';
import AuditLog from '../models/AuditLog.js';
import { GI_REGISTRY, findGi, giMatchesDistrict } from '../data/giRegistry.js';
import { computeTrustScore, tier2Status, badgeFor } from '../services/verificationService.js';

/**
 * The admin console exists because artisans do not sign up.
 *
 * NGOs and cluster development offices collect artisan records on paper. A state
 * tourism officer enters them here. That is the actual chain of custody in the
 * original proposal, and it is why there is no artisan-facing dashboard.
 */

/** GET /api/admin/artisans?state=&status=&q=&page= */
export async function listArtisans(req, res, next) {
  try {
    const { state, status, q, page = 1, limit = 25 } = req.query;
    const filter = {};
    if (state) filter.state = state;
    if (status) filter['verification.tier1.status'] = status;
    if (q) filter.name = new RegExp(q, 'i');

    const skip = (Number(page) - 1) * Number(limit);
    const [rows, total] = await Promise.all([
      Artisan.find(filter).populate('cluster', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Artisan.countDocuments(filter),
    ]);

    res.json({
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      artisans: rows.map((a) => ({
        id: a._id,
        name: a.name,
        craft: a.craft,
        claimedGi: a.claimedGi,
        cluster: a.cluster?.name,
        district: a.district,
        state: a.state,
        tier1: a.verification.tier1.status,
        trustScore: a.trustScore,
        badge: badgeFor(a),
        availability: a.availability.state,
        isDemo: a.isDemo,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/artisans
 * Runs the real GI/district cross-check on submission. An officer entering a
 * mismatched claim sees it fail immediately, with the reason -- which is the
 * point. This is data entry with a conscience, not a form.
 */
export async function createArtisan(req, res, next) {
  try {
    const { name, phone, craft, claimedGi, clusterId, district, state, lat, lng, bio, upiId, workshop, languages } = req.body;

    if (!name || !phone || !craft || !district || !state) {
      return res.status(400).json({ error: 'Name, phone, craft, district and state are required' });
    }

    let coords = [Number(lng), Number(lat)];
    let cluster = null;
    if (clusterId) {
      cluster = await Cluster.findById(clusterId);
      if (!cluster) return res.status(400).json({ error: 'That cluster does not exist' });
      if (Number.isNaN(coords[0]) || Number.isNaN(coords[1])) coords = cluster.location.coordinates;
    }
    if (Number.isNaN(coords[0]) || Number.isNaN(coords[1])) {
      return res.status(400).json({ error: 'Provide coordinates, or pick a cluster to inherit them' });
    }

    const giEntry = findGi(claimedGi);
    const check = giMatchesDistrict(giEntry, district, state);

    const tier1 = {
      status: giEntry && check.match ? 'PASS' : 'FAIL',
      docType: null,
      docNumber: null,
      formatValid: false,
      claimedGi: giEntry ? giEntry.gi : claimedGi || null,
      giFound: Boolean(giEntry),
      giDistrictMatch: check.match,
      reason: `Entered by tourism department · ${giEntry ? check.reason : `Craft claim "${claimedGi || 'none'}" not in GI registry`} · Awaiting credential upload`,
      ocrConfidence: 0,
      rawText: '',
      checkedAt: new Date(),
    };

    const verification = { tier1, tier2: { endorsements: [], status: 'NONE' }, tier3: { reviewCount: 0, avgRating: 0 } };

    const artisan = await Artisan.create({
      name, phone, craft,
      claimedGi: claimedGi || null,
      bio: bio || '',
      languages: languages?.length ? languages : ['Hindi'],
      cluster: cluster?._id || null,
      district, state,
      location: { type: 'Point', coordinates: coords },
      verification,
      // No document uploaded yet, so formatValid is false and the score reflects it.
      trustScore: computeTrustScore(verification),
      workshop: workshop || {},
      upiId: upiId || null,
      isDemo: false,
    });

    await AuditLog.create({
      actorType: 'VERIFIER',
      actorId: req.user._id,
      artisan: artisan._id,
      action: 'ARTISAN_ADDED_BY_ADMIN',
      detail: { by: req.user.email, tier1: tier1.status, reason: tier1.reason },
    });

    res.status(201).json({
      artisan: { id: artisan._id, name: artisan.name, trustScore: artisan.trustScore, badge: badgeFor(artisan) },
      tier1,
      note:
        tier1.status === 'PASS'
          ? 'Craft matches the GI district. Upload the Pehchan or Udyam card to complete Tier 1.'
          : 'This record will stay unverified until the GI claim matches the district.',
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'An artisan with that phone number already exists' });
    next(err);
  }
}

/** PATCH /api/admin/artisans/:id */
export async function updateArtisan(req, res, next) {
  try {
    const allowed = ['name', 'craft', 'bio', 'languages', 'upiId', 'workshop', 'availability'];
    const artisan = await Artisan.findById(req.params.id);
    if (!artisan) return res.status(404).json({ error: 'Artisan not found' });

    for (const k of allowed) if (req.body[k] !== undefined) artisan[k] = req.body[k];
    await artisan.save();

    await AuditLog.create({
      actorType: 'VERIFIER', actorId: req.user._id, artisan: artisan._id,
      action: 'ARTISAN_UPDATED_BY_ADMIN', detail: { by: req.user.email, fields: Object.keys(req.body) },
    });

    res.json({ artisan: { id: artisan._id, name: artisan.name, trustScore: artisan.trustScore } });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/artisans/:id */
export async function deleteArtisan(req, res, next) {
  try {
    const artisan = await Artisan.findById(req.params.id);
    if (!artisan) return res.status(404).json({ error: 'Artisan not found' });

    const live = await Booking.countDocuments({ artisan: artisan._id, status: { $in: ['PENDING', 'CONFIRMED'] } });
    if (live > 0) {
      return res.status(409).json({
        error: `${artisan.name} has ${live} booking${live === 1 ? '' : 's'} still open. Cancel those first.`,
      });
    }

    await artisan.deleteOne();
    await AuditLog.create({
      actorType: 'VERIFIER', actorId: req.user._id,
      action: 'ARTISAN_REMOVED_BY_ADMIN', detail: { by: req.user.email, name: artisan.name },
    });
    res.json({ removed: artisan.name });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/stats -- the console's header row */
export async function stats(_req, res, next) {
  try {
    const [artisans, verified, demo, clusters, verifiers, bookings] = await Promise.all([
      Artisan.countDocuments(),
      Artisan.countDocuments({ 'verification.tier1.status': 'PASS' }),
      Artisan.countDocuments({ isDemo: true }),
      Cluster.countDocuments(),
      Verifier.countDocuments({ active: true }),
      Booking.countDocuments(),
    ]);
    res.json({
      artisans, verified, demo,
      realArtisans: artisans - demo,
      failedTier1: artisans - verified,
      clusters, verifiers, bookings,
      giProducts: GI_REGISTRY.length,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/audit -- everything, newest first */
export async function fullAudit(req, res, next) {
  try {
    const logs = await AuditLog.find().sort({ at: -1 }).limit(Number(req.query.limit || 60));
    res.json({ count: logs.length, logs });
  } catch (err) {
    next(err);
  }
}

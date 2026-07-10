import Cluster from '../models/Cluster.js';
import Artisan from '../models/Artisan.js';
import { haversineKm, discoveryScore } from '../utils/haversine.js';
import { badgeFor } from '../services/verificationService.js';

/**
 * GET /api/discover?lat=&lng=&radiusKm=&limit=
 *
 * The core product. Given where a tourist is standing, return the craft
 * clusters they did not know existed, ranked by proximity AND cultural
 * significance. Radius defaults generously (150km) precisely because Bagru is
 * 30km from Jaipur and Raghurajpur is 50km from Bhubaneswar -- a 5km radius
 * would return nothing and prove the point.
 */
export async function discover(req, res, next) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radiusKm = Number(req.query.radiusKm || 150);
    const limit = Number(req.query.limit || 40);
    const sort = req.query.sort || 'relevance';
    const crafts = req.query.crafts ? req.query.crafts.split(',').map((c) => c.trim()).filter(Boolean) : [];
    const state = req.query.state || null;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng are required numbers' });
    }

    const origin = [lng, lat];

    // Geo query first, so the 2dsphere index does the heavy lifting.
    // Craft/state filtering happens in memory afterwards on a small result set.
    const geoFilter = {
      location: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: origin },
          $maxDistance: radiusKm * 1000,
        },
      },
    };
    if (state) geoFilter.state = state;
    if (crafts.length) geoFilter.craft = { $in: crafts };

    const clusters = await Cluster.find(geoFilter).limit(limit);

    const clusterIds = clusters.map((c) => c._id);
    const artisans = await Artisan.find({ cluster: { $in: clusterIds } }).select(
      'name craft cluster trustScore verification.tier1.status availability location photos workshop isDemo'
    );

    const byCluster = artisans.reduce((acc, a) => {
      const k = String(a.cluster);
      (acc[k] ||= []).push(a);
      return acc;
    }, {});

    const results = clusters
      .map((c) => {
        const distanceKm = haversineKm(origin, c.location.coordinates);
        const members = byCluster[String(c._id)] || [];
        return {
          id: c._id,
          name: c.name,
          craft: c.craft,
          giTag: c.giTag,
          district: c.district,
          state: c.state,
          coordinates: c.location.coordinates,
          significance: c.significance,
          heritageNote: c.heritageNote,
          description: c.description,
          imageUrl: c.imageUrl,
          odopProduct: c.odopProduct,
          distanceKm: Number(distanceKm.toFixed(1)),
          score: discoveryScore({ distanceKm, significance: c.significance }),
          artisanCount: members.length,
          availableNow: members.filter((a) => a.availability.state === 'AVAILABLE').length,
          artisans: members.map((a) => ({
            id: a._id,
            name: a.name,
            craft: a.craft,
            trustScore: a.trustScore,
            badge: badgeFor(a),
            availability: a.availability.state,
            priceInr: a.workshop?.priceInr || 0,
            photo: a.photos?.[0] || null,
            isDemo: a.isDemo,
            // needed to pin individual artisans, not just the cluster centroid
            coordinates: a.location?.coordinates || null,
          })),
        };
      });

    // Three orderings. `relevance` is proximity blended with cultural
    // significance -- the only one that surfaces a village you cannot name.
    const SORTS = {
      relevance: (a, b) => b.score - a.score,
      distance: (a, b) => a.distanceKm - b.distanceKm,
      availability: (a, b) => b.availableNow - a.availableNow || b.score - a.score,
    };
    results.sort(SORTS[sort] || SORTS.relevance);

    res.json({
      origin: { lat, lng },
      radiusKm,
      sort,
      crafts,
      state,
      count: results.length,
      // the money line: how many of these would a tourist never have searched for?
      unknownUnknowns: results.filter((r) => r.distanceKm > 10).length,
      clusters: results,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/discover/artisans/:id */
export async function artisanDetail(req, res, next) {
  try {
    const a = await Artisan.findById(req.params.id)
      .populate('cluster')
      .populate('verification.tier2.endorsements.verifier', 'name type district accuracyRating')
      .populate('managedBy', 'name type phone');

    if (!a) return res.status(404).json({ error: 'Artisan not found' });

    res.json({
      ...a.toObject(),
      badge: badgeFor(a),
      // never leak the raw OCR dump to the public endpoint
      verification: {
        ...a.verification.toObject(),
        tier1: { ...a.verification.tier1.toObject(), rawText: undefined },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/discover/search?q=&state=&craft=&page=&limit=
 *
 * Searches artisans DIRECTLY — does not require cluster membership.
 * This makes all seeded/vault-created artisans discoverable.
 */
export async function searchArtisans(req, res, next) {
  try {
    const q     = (req.query.q     || '').trim();
    const state = (req.query.state || '').trim();
    const craft = (req.query.craft || '').trim();
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(40, parseInt(req.query.limit || '20'));

    const filter = {};
    if (state) filter.state = new RegExp(state, 'i');
    if (craft) filter.craft = new RegExp(craft, 'i');
    if (q) {
      filter.$or = [
        { name:     new RegExp(q, 'i') },
        { craft:    new RegExp(q, 'i') },
        { district: new RegExp(q, 'i') },
        { bio:      new RegExp(q, 'i') },
        { claimedGi: new RegExp(q, 'i') },
      ];
    }

    const [artisans, total] = await Promise.all([
      Artisan.find(filter)
        .select('name craft district state trustScore verification.tier1.status availability location photos workshop bio claimedGi isDemo awards certificates')
        .sort({ trustScore: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Artisan.countDocuments(filter),
    ]);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      artisans: artisans.map(a => ({
        id:           a._id,
        name:         a.name,
        craft:        a.craft,
        district:     a.district,
        state:        a.state,
        bio:          a.bio,
        claimedGi:    a.claimedGi,
        trustScore:   a.trustScore,
        badge:        badgeFor(a),
        availability: a.availability?.state,
        priceInr:     a.workshop?.priceInr || 0,
        photo:        a.photos?.[0] || null,
        isDemo:       a.isDemo,
        coordinates:  a.location?.coordinates || null,
        hasAwards:    (a.awards?.length || 0) > 0,
        hasCerts:     (a.certificates?.length || 0) > 0,
      })),
    });
  } catch (err) {
    next(err);
  }
}

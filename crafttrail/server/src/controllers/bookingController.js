import Booking from '../models/Booking.js';
import Artisan from '../models/Artisan.js';
import Verifier from '../models/Verifier.js';
import Review from '../models/Review.js';
import Certificate from '../models/Certificate.js';
import AuditLog from '../models/AuditLog.js';
import {
  createEscrow,
  verifyQrToken,
  settleEscrow,
  qrDataUrl,
  shares,
} from '../services/paymentService.js';
import { issueCertificate, verifyCertificate } from '../services/certificateService.js';
import { computeTrustScore } from '../services/verificationService.js';
import { sendWhatsApp, bookingNotification } from '../services/whatsappService.js';

/**
 * POST /api/bookings
 * Tourist requests a visit. Nothing is ever shown as "confirmed" here --
 * that only happens when the artisan (or their institution proxy) says yes.
 */
export async function requestBooking(req, res, next) {
  try {
    const { artisanId, tourist, date, slot, partySize, message } = req.body;
    if (!artisanId || !tourist?.name || !tourist?.email || !date) {
      return res.status(400).json({ error: 'artisanId, tourist{name,email}, date required' });
    }

    const artisan = await Artisan.findById(artisanId);
    if (!artisan) return res.status(404).json({ error: 'Artisan not found' });
    if (artisan.availability.state === 'UNAVAILABLE') {
      return res.status(409).json({ error: 'Artisan is currently not accepting visits' });
    }

    const size = Number(partySize || 1);
    const booking = await Booking.create({
      artisan: artisan._id,
      tourist,
      date: new Date(date),
      slot: slot || '',
      partySize: size,
      message: message || '',
      amountInr: (artisan.workshop?.priceInr || 0) * size,
      status: 'PENDING',
    });

    // notify the artisan over the channel they already use
    await sendWhatsApp(
      artisan.phone,
      bookingNotification({
        artisanName: artisan.name,
        touristName: tourist.name,
        date: booking.date,
        partySize: size,
      })
    );

    res.status(201).json({
      booking,
      status: 'PENDING',
      note: 'Request sent to the artisan. Confirmed within 24 hours before any slot is locked.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/bookings/:id/confirm   { via: 'WHATSAPP' | 'INSTITUTION_PROXY' | 'MANUAL' }
 * Artisan (or proxy) accepts -> escrow is created and the money is HELD.
 */
export async function confirmBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate('artisan');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'PENDING') {
      return res.status(409).json({ error: `Booking is already ${booking.status}` });
    }

    const artisan = booking.artisan;
    const verifier = artisan.managedBy ? await Verifier.findById(artisan.managedBy) : null;

    booking.status = 'CONFIRMED';
    booking.confirmedVia = req.body.via || 'MANUAL';
    booking.payment = createEscrow({ booking, artisan, verifier });
    await booking.save();

    const qr = await qrDataUrl(
      JSON.stringify({ escrowId: booking.payment.escrowId, bookingId: String(booking._id), token: booking.payment.qrToken })
    );

    res.json({
      bookingId: booking._id,
      status: booking.status,
      escrow: {
        escrowId: booking.payment.escrowId,
        status: booking.payment.status,
        amountInr: booking.amountInr,
        upiIntent: booking.payment.upiIntent, // real, scannable
        split: booking.payment.split,
        sharePct: shares,
      },
      workshopQr: qr, // artisan displays this at the workshop
      note: 'Funds held in escrow. Released only when the QR is scanned at the workshop.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/bookings/:id/complete   { qrToken }
 *
 * The QR is scanned on site. Escrow settles and splits 95/5 in one call.
 * A certificate is minted immediately -- the shareable moment happens while
 * the tourist is still standing in the workshop, which is the whole idea.
 */
export async function completeBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: 'artisan',
      populate: { path: 'cluster' },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'CONFIRMED') {
      return res.status(409).json({ error: `Cannot complete a ${booking.status} booking` });
    }

    const ok = verifyQrToken({
      escrowId: booking.payment.escrowId,
      bookingId: String(booking._id),
      token: req.body.qrToken,
    });
    if (!ok) return res.status(400).json({ error: 'Invalid QR token for this booking' });

    booking.payment = settleEscrow(booking.payment.toObject());
    booking.status = 'COMPLETED';

    const cert = await issueCertificate({
      booking,
      artisan: booking.artisan,
      cluster: booking.artisan.cluster,
    });
    booking.certificateCode = cert.code;
    await booking.save();

    await AuditLog.create({
      actorType: 'SYSTEM',
      artisan: booking.artisan._id,
      action: 'ESCROW_SETTLED',
      detail: { escrowId: booking.payment.escrowId, split: booking.payment.split },
    });

    res.json({
      bookingId: booking._id,
      status: 'COMPLETED',
      settlement: {
        artisanInr: booking.payment.split.artisanInr,
        artisanUpi: booking.payment.split.artisanUpi,
        institutionInr: booking.payment.split.institutionInr,
        institutionUpi: booking.payment.split.institutionUpi,
        settledAt: booking.payment.settledAt,
      },
      certificate: {
        code: cert.code,
        url: `${process.env.CLIENT_URL || ''}/cert/${cert.code}`,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/certificates/:code -- public, this is the shareable page's data */
export async function getCertificate(req, res, next) {
  try {
    const cert = await Certificate.findOne({ code: req.params.code });
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    const { valid } = verifyCertificate(cert);
    res.json({ ...cert.toObject(), signatureValid: valid, artisanProfileUrl: `/artisan/${cert.artisan}` });
  } catch (err) {
    next(err);
  }
}

/** GET /api/certificates/:code/verify -- the tamper check, callable by anyone */
export async function verifyCertificateRoute(req, res, next) {
  try {
    const cert = await Certificate.findOne({ code: req.params.code });
    if (!cert) return res.status(404).json({ valid: false, error: 'Certificate not found' });
    const { valid } = verifyCertificate(cert);
    res.json({
      code: cert.code,
      valid,
      issuedAt: cert.issuedAt,
      issuer: 'CraftTrail',
      method: 'HMAC-SHA256 over canonical payload',
      message: valid
        ? 'Signature matches. This certificate was issued by CraftTrail and has not been altered.'
        : 'Signature mismatch. This record has been altered.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/bookings/:id/review
 * Tier 3. Rates the artisan AND the verifier who endorsed them.
 */
export async function leaveReview(req, res, next) {
  try {
    const { rating, verifierRating, text, authenticityConfirmed } = req.body;
    const booking = await Booking.findById(req.params.id).populate('artisan');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'COMPLETED') {
      return res.status(409).json({ error: 'Only completed visits can be reviewed' });
    }

    const artisan = booking.artisan;
    const verifierId = artisan.verification.tier2.endorsements[0]?.verifier || null;

    const review = await Review.create({
      booking: booking._id,
      artisan: artisan._id,
      verifier: verifierId,
      rating: Number(rating),
      verifierRating: verifierRating ? Number(verifierRating) : null,
      authenticityConfirmed: authenticityConfirmed !== false,
      text: text || '',
      touristName: booking.tourist.name,
    });

    // recompute tier 3 rollup
    const all = await Review.find({ artisan: artisan._id });
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    artisan.verification.tier3 = { reviewCount: all.length, avgRating: Number(avg.toFixed(2)) };
    artisan.trustScore = computeTrustScore(artisan.verification);
    await artisan.save();

    // the coupling that makes a bribed verifier expensive
    if (verifierId && verifierRating) {
      const v = await Verifier.findById(verifierId);
      if (v) {
        const total = v.accuracyRating * v.ratingCount + Number(verifierRating);
        v.ratingCount += 1;
        v.accuracyRating = Number((total / v.ratingCount).toFixed(2));
        await v.save();
      }
    }

    res.status(201).json({ review, artisanTrustScore: artisan.trustScore });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'This booking is already reviewed' });
    next(err);
  }
}

/** GET /api/bookings/:id */
export async function getBooking(req, res, next) {
  try {
    const b = await Booking.findById(req.params.id).populate('artisan', 'name craft phone');
    if (!b) return res.status(404).json({ error: 'Booking not found' });
    res.json(b);
  } catch (err) {
    next(err);
  }
}

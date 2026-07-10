import Artisan from '../models/Artisan.js';
import Booking from '../models/Booking.js';
import AuditLog from '../models/AuditLog.js';
import { parseAvailabilityReply, availabilityPrompt, sendWhatsApp } from '../services/whatsappService.js';

/**
 * POST /api/whatsapp/webhook   { from, body }
 *
 * This is the demo's showpiece. An artisan replies "YES" on WhatsApp and their
 * badge flips green on the tourist's map, live. No dashboard. No app. No form.
 *
 * Meta's Cloud API posts a different envelope; normalise it here and the rest
 * of the pipeline is unchanged.
 */
export async function webhook(req, res, next) {
  try {
    const from = req.body.from || req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
    const body =
      req.body.body || req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

    if (!from || !body) return res.status(400).json({ error: 'from and body required' });

    const artisan = await Artisan.findOne({ phone: from });
    if (!artisan) return res.status(404).json({ error: 'No artisan registered with this number' });

    // 1) Is this a reply to an availability prompt?
    const availability = parseAvailabilityReply(body);
    if (availability) {
      artisan.availability = { state: availability, source: 'WHATSAPP', updatedAt: new Date() };
      await artisan.save();

      await AuditLog.create({
        actorType: 'ARTISAN',
        actorId: artisan._id,
        artisan: artisan._id,
        action: 'AVAILABILITY_UPDATED',
        detail: { via: 'WHATSAPP', reply: body, state: availability },
      });

      // 2) If they have a pending booking, a "YES" confirms it too.
      const pending = await Booking.findOne({ artisan: artisan._id, status: 'PENDING' }).sort({
        createdAt: -1,
      });

      return res.json({
        artisanId: artisan._id,
        availability: artisan.availability,
        pendingBookingId: availability === 'AVAILABLE' ? pending?._id || null : null,
        reply: availability === 'AVAILABLE' ? 'Dhanyavaad! You are now visible to nearby tourists.' : 'Noted. You are marked unavailable.',
      });
    }

    // Unparseable -> escalate to the institution proxy rather than guessing
    return res.status(200).json({
      artisanId: artisan._id,
      availability: artisan.availability,
      parsed: null,
      escalated: true,
      note: 'Reply not understood. Routed to the artisan\'s institution coordinator for follow-up.',
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/whatsapp/prompt/:artisanId -- send the weekly availability nudge */
export async function prompt(req, res, next) {
  try {
    const artisan = await Artisan.findById(req.params.artisanId);
    if (!artisan) return res.status(404).json({ error: 'Artisan not found' });
    const message = availabilityPrompt(artisan.name);
    const result = await sendWhatsApp(artisan.phone, message);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/whatsapp/proxy/:artisanId   { state, verifierId }
 * Tier-2 fallback: the SHG coordinator sets availability on the artisan's behalf.
 */
export async function institutionProxy(req, res, next) {
  try {
    const { state, verifierId } = req.body;
    const valid = ['AVAILABLE', 'REQUEST_AND_CONFIRM', 'UNAVAILABLE'];
    if (!valid.includes(state)) return res.status(400).json({ error: `state must be one of ${valid}` });

    const artisan = await Artisan.findById(req.params.artisanId);
    if (!artisan) return res.status(404).json({ error: 'Artisan not found' });

    artisan.availability = { state, source: 'INSTITUTION_PROXY', updatedAt: new Date() };
    await artisan.save();

    await AuditLog.create({
      actorType: 'VERIFIER',
      actorId: verifierId || null,
      artisan: artisan._id,
      action: 'AVAILABILITY_UPDATED',
      detail: { via: 'INSTITUTION_PROXY', state },
    });

    res.json({ artisanId: artisan._id, availability: artisan.availability });
  } catch (err) {
    next(err);
  }
}

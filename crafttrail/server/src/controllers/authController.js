import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });

/** POST /api/auth/register */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are all required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password needs at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: 'tourist' });
    res.status(201).json({ token: sign(user._id), user: user.toPublic() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'An account already exists with that email' });
    }
    next(err);
  }
}

/**
 * POST /api/auth/login
 * The same message for a missing account and a wrong password. Distinguishing
 * them hands an attacker a working email-address oracle.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    const ok = user && (await user.comparePassword(password));
    if (!ok) return res.status(401).json({ error: 'Email or password is incorrect' });

    res.json({ token: sign(user._id), user: user.toPublic() });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me */
export async function me(req, res) {
  res.json({ user: req.user.toPublic() });
}

/** PATCH /api/auth/me  { name?, interests?, homeCity?, prefs? } */
export async function updateMe(req, res, next) {
  try {
    const { name, interests, homeCity, prefs } = req.body;
    if (name && name.trim()) req.user.name = name.trim();
    if (Array.isArray(interests)) req.user.interests = interests;
    if (homeCity) req.user.homeCity = homeCity;
    if (prefs) req.user.prefs = { ...req.user.prefs.toObject?.() ?? req.user.prefs, ...prefs };
    await req.user.save();
    res.json({ user: req.user.toPublic() });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me/bookings -- powers Bookings and Places visited in the sidebar */
export async function myBookings(req, res, next) {
  try {
    const bookings = await Booking.find({ 'tourist.email': req.user.email })
      .populate({ path: 'artisan', select: 'name craft district state location cluster', populate: { path: 'cluster', select: 'name' } })
      .sort({ date: -1 });

    const now = new Date();
    res.json({
      upcoming: bookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED' && b.date >= now),
      past: bookings.filter((b) => b.status === 'COMPLETED'),
      cancelled: bookings.filter((b) => b.status === 'CANCELLED'),
      // "Places visited" is derived, not a second store that can drift
      visited: bookings
        .filter((b) => b.status === 'COMPLETED' && b.artisan)
        .map((b) => ({
          artisanId: b.artisan._id,
          artisanName: b.artisan.name,
          craft: b.artisan.craft,
          cluster: b.artisan.cluster?.name,
          district: b.artisan.district,
          state: b.artisan.state,
          coordinates: b.artisan.location?.coordinates,
          date: b.date,
          certificateCode: b.certificateCode,
        })),
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/me/password  { currentPassword, newPassword } */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password needs at least 8 characters' });
    }
    const user = await User.findById(req.user._id).select('+passwordHash');
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/auth/me — permanently removes the account */
export async function deleteAccount(req, res, next) {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

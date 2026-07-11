// server/src/routes/authRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js'; // adjust path if your middleware lives elsewhere

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password, provider: 'local' });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register failed:', err);
    res.status(500).json({ error: 'Could not create account.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Could not sign in.' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing Google credential.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        email,
        name,
        avatar: picture,
        googleId,
        provider: 'google',
      });
    }

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    console.error('Google auth failed:', err);
    res.status(401).json({ error: 'Invalid Google token.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    console.error('Fetch /me failed:', err);
    res.status(500).json({ error: 'Could not load account.' });
  }
});

// PATCH /api/auth/me
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const allowed = ['name', 'craftInterests', 'avatar'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.userId, patch, { new: true });
    res.json({ user });
  } catch (err) {
    console.error('Update /me failed:', err);
    res.status(500).json({ error: 'Could not update account.' });
  }
});

// POST /api/auth/me/password
router.post('/me/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('Change password failed:', err);
    res.status(500).json({ error: 'Could not change password.' });
  }
});

// DELETE /api/auth/me
router.delete('/me', requireAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete account failed:', err);
    res.status(500).json({ error: 'Could not delete account.' });
  }
});

// GET /api/auth/me/bookings
router.get('/me/bookings', requireAuth, async (req, res) => {
  try {
    // Adjust to your real Booking model — placeholder shape shown
    const Booking = (await import('../models/Booking.js')).default;
    const bookings = await Booking.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    console.error('Fetch bookings failed:', err);
    res.status(500).json({ error: 'Could not load bookings.' });
  }
});

export default router;
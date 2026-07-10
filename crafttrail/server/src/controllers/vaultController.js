/**
 * vaultController.js
 * Hidden admin vault — full artisan profile management
 * Routes are only reachable via /guildmaster (not linked anywhere in public UI)
 */
import Artisan from '../models/Artisan.js';
import User    from '../models/User.js';
import jwt     from 'jsonwebtoken';
import bcrypt  from 'bcryptjs';

const JWT_SECRET  = process.env.JWT_SECRET  || 'crafttrail-secret';
const VAULT_TOKEN = process.env.VAULT_TOKEN || 'vault'; // header name check

/* ── Vault auth middleware ─────────────────────────────────────── */
export function requireVault(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Vault access denied' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired vault token' });
  }
}

/* ── Login ────────────────────────────────────────────────────── */
export async function vaultLogin(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, name: user.name, email: user.email });
  } catch (err) { next(err); }
}

/* ── List all artisans ────────────────────────────────────────── */
export async function vaultListArtisans(req, res, next) {
  try {
    const { search = '', state = '', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (state)  filter.state = new RegExp(state, 'i');
    if (search) filter.$or = [
      { name:  new RegExp(search, 'i') },
      { craft: new RegExp(search, 'i') },
    ];
    const [artisans, total] = await Promise.all([
      Artisan.find(filter)
        .select('name craft district state trustScore isDemo photos verificationDocs certificates awards productHistory createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Artisan.countDocuments(filter),
    ]);
    res.json({ artisans, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
}

/* ── Get single artisan (full vault view) ─────────────────────── */
export async function vaultGetArtisan(req, res, next) {
  try {
    const a = await Artisan.findById(req.params.id).populate('cluster', 'name craft');
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json(a);
  } catch (err) { next(err); }
}

/* ── Create artisan ───────────────────────────────────────────── */
export async function vaultCreateArtisan(req, res, next) {
  try {
    const artisan = new Artisan(req.body);
    await artisan.save();
    res.status(201).json(artisan);
  } catch (err) { next(err); }
}

/* ── Update basic profile ─────────────────────────────────────── */
export async function vaultUpdateArtisan(req, res, next) {
  try {
    const ALLOWED = ['name','bio','craft','district','state','languages','phone',
                     'claimedGi','upiId','isDemo','workshop','availability'];
    const update = {};
    ALLOWED.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    const a = await Artisan.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json(a);
  } catch (err) { next(err); }
}

/* ── Add verification document ───────────────────────────────── */
export async function vaultAddDoc(req, res, next) {
  try {
    const { label, docType, note } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!fileUrl) return res.status(400).json({ error: 'File required' });

    const a = await Artisan.findByIdAndUpdate(
      req.params.id,
      { $push: { verificationDocs: { label, docType, note, fileUrl } } },
      { new: true }
    );
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json({ verificationDocs: a.verificationDocs });
  } catch (err) { next(err); }
}

export async function vaultDeleteDoc(req, res, next) {
  try {
    const a = await Artisan.findByIdAndUpdate(
      req.params.id,
      { $pull: { verificationDocs: { _id: req.params.docId } } },
      { new: true }
    );
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json({ verificationDocs: a.verificationDocs });
  } catch (err) { next(err); }
}

/* ── Add certificate ─────────────────────────────────────────── */
export async function vaultAddCertificate(req, res, next) {
  try {
    const { title, issuedBy, issuedDate, description } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const a = await Artisan.findByIdAndUpdate(
      req.params.id,
      { $push: { certificates: { title, issuedBy, issuedDate, description, fileUrl } } },
      { new: true }
    );
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json({ certificates: a.certificates });
  } catch (err) { next(err); }
}

export async function vaultDeleteCertificate(req, res, next) {
  try {
    const a = await Artisan.findByIdAndUpdate(
      req.params.id,
      { $pull: { certificates: { _id: req.params.certId } } },
      { new: true }
    );
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json({ certificates: a.certificates });
  } catch (err) { next(err); }
}

/* ── Add award ───────────────────────────────────────────────── */
export async function vaultAddAward(req, res, next) {
  try {
    const { title, year, awardedBy, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const a = await Artisan.findByIdAndUpdate(
      req.params.id,
      { $push: { awards: { title, year, awardedBy, description, imageUrl } } },
      { new: true }
    );
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json({ awards: a.awards });
  } catch (err) { next(err); }
}

export async function vaultDeleteAward(req, res, next) {
  try {
    const a = await Artisan.findByIdAndUpdate(
      req.params.id,
      { $pull: { awards: { _id: req.params.awardId } } },
      { new: true }
    );
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json({ awards: a.awards });
  } catch (err) { next(err); }
}

/* ── Add product history entry ───────────────────────────────── */
export async function vaultAddProduct(req, res, next) {
  try {
    const { productName, category, year, description, priceInr, soldTo } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const a = await Artisan.findByIdAndUpdate(
      req.params.id,
      { $push: { productHistory: { productName, category, year, description, priceInr, soldTo, imageUrl } } },
      { new: true }
    );
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json({ productHistory: a.productHistory });
  } catch (err) { next(err); }
}

export async function vaultDeleteProduct(req, res, next) {
  try {
    const a = await Artisan.findByIdAndUpdate(
      req.params.id,
      { $pull: { productHistory: { _id: req.params.productId } } },
      { new: true }
    );
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json({ productHistory: a.productHistory });
  } catch (err) { next(err); }
}

/* ── Delete artisan ───────────────────────────────────────────── */
export async function vaultDeleteArtisan(req, res, next) {
  try {
    const a = await Artisan.findByIdAndDelete(req.params.id);
    if (!a) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Artisan permanently deleted', id: req.params.id });
  } catch (err) { next(err); }
}

/* ── Stats dashboard ─────────────────────────────────────────── */
export async function vaultStats(req, res, next) {
  try {
    const [total, verified, demo, withDocs, withCerts, withAwards] = await Promise.all([
      Artisan.countDocuments(),
      Artisan.countDocuments({ trustScore: { $gte: 60 } }),
      Artisan.countDocuments({ isDemo: true }),
      Artisan.countDocuments({ 'verificationDocs.0': { $exists: true } }),
      Artisan.countDocuments({ 'certificates.0': { $exists: true } }),
      Artisan.countDocuments({ 'awards.0': { $exists: true } }),
    ]);
    res.json({ total, verified, demo, withDocs, withCerts, withAwards });
  } catch (err) { next(err); }
}

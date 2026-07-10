import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sign in to continue' });

  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ error: 'Sign in to continue' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Sign in to continue' });
  }
}

/** Admin-only. Runs after requireAuth. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'This area is for tourism department staff' });
  }
  next();
}

/** Attaches req.user when a valid token is present, but never blocks. */
export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    req.user = await User.findById(id);
  } catch {
    /* an invalid token is the same as no token, not an error */
  }
  next();
}

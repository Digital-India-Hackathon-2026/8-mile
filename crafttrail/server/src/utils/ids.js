import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no O/0/I/1 ambiguity

export function shortCode(len = 8) {
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function hmac(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

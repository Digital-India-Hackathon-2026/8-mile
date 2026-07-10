/**
 * WhatsApp availability -- the piece that proves artisans never touch a dashboard.
 *
 * For the hackathon this is a webhook that accepts {from, body} and flips the
 * artisan's availability badge. Point Meta's Cloud API (or Twilio) at
 * POST /api/whatsapp/webhook and it works unchanged -- the parsing below is the
 * only logic that matters, and it is real.
 *
 * Multilingual by necessity, not decoration: a Bagru block printer replies in
 * Hindi, a Pochampally weaver in Telugu.
 */

const YES = [
  'yes', 'y', 'haan', 'han', 'ha', 'ji', 'ji haan', 'ok', 'okay', 'available',
  'हाँ', 'हां', 'जी', 'अवश्य',
  'అవును', 'సరే',
  'ஆம்', 'சரி',
  'હા',
];

const NO = [
  'no', 'n', 'nahi', 'nahin', 'not available', 'busy', 'closed',
  'नहीं', 'नही',
  'కాదు', 'లేదు',
  'இல்லை',
  'ના',
];

const norm = (s = '') => s.toLowerCase().trim().replace(/[.!?,]/g, '');

/** Returns 'AVAILABLE' | 'UNAVAILABLE' | null (unparseable -> ask a human). */
export function parseAvailabilityReply(body) {
  const n = norm(body);
  if (!n) return null;
  if (YES.some((k) => n === k || n.startsWith(k + ' '))) return 'AVAILABLE';
  if (NO.some((k) => n === k || n.startsWith(k + ' '))) return 'UNAVAILABLE';
  return null;
}

/** The outbound nudge. Kept to one question with two words as the answer. */
export function availabilityPrompt(artisanName) {
  return `Namaste ${artisanName} 🙏\nCraftTrail: Any visitors welcome this week?\nReply YES or NO.\n(हाँ / नहीं)`;
}

export function bookingNotification({ artisanName, touristName, date, partySize }) {
  const d = new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${artisanName} 🙏\n${touristName} wants to visit on ${d} (${partySize} people).\nReply YES to confirm, NO to decline.`;
}

/**
 * Stub sender. Swap for the Meta Cloud API call; signature stays identical.
 * Logged so the demo can show the outbound message without a live number.
 */
export async function sendWhatsApp(to, message) {
  console.log(`[whatsapp -> ${to}]\n${message}\n`);
  return { ok: true, to, message, delivered: 'simulated' };
}

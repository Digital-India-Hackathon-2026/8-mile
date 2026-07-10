import { useState } from 'react';
import { api } from '../lib/api.js';
import './WhatsAppSim.css';

const SUGGESTIONS = ['YES', 'हाँ', 'అవును', 'NO', 'kya matlab bhai'];

/**
 * The showpiece. Type a reply as the artisan; their badge flips on the map,
 * live. No dashboard, no app, no form. Real rural India runs on this thread.
 *
 * Points at the same POST /api/whatsapp/webhook that Meta's Cloud API would.
 * Swapping the simulator for a real number changes nothing behind it.
 */
export default function WhatsAppSim({ artisan, onChanged }) {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState([
    { from: 'us', text: `Namaste ${artisan.name} 🙏\nCraftTrail: Any visitors welcome this week?\nReply YES or NO. (हाँ / नहीं)` },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (text) => {
    const body = (text ?? draft).trim();
    if (!body) return;
    setThread((t) => [...t, { from: 'them', text: body }]);
    setDraft('');
    setBusy(true);
    try {
      const r = await api.whatsapp(artisan.phone, body);
      const reply = r.parsed === null
        ? 'Reply not understood. Routed to your cooperative coordinator.'
        : r.reply;
      setThread((t) => [...t, { from: 'us', text: reply }]);
      onChanged?.();
    } catch (e) {
      setThread((t) => [...t, { from: 'us', text: `⚠ ${e.message}` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wa card">
      <button className="wa__toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="eyebrow">Artisan's phone</span>
        <span className="mono wa__chev">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="wa__body">
          <p className="wa__intro">
            {artisan.name} never logs in. Availability arrives over the channel they already use.
          </p>

          <div className="wa__thread">
            {thread.map((m, i) => (
              <div key={i} className={`bubble bubble--${m.from}`}>{m.text}</div>
            ))}
            {busy && <div className="bubble bubble--us"><span className="spinner" /></div>}
          </div>

          <div className="wa__chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" disabled={busy} onClick={() => send(s)}>{s}</button>
            ))}
          </div>

          <div className="wa__compose">
            <input
              className="input"
              value={draft}
              placeholder="Reply as the artisan…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="btn" disabled={busy || !draft.trim()} onClick={() => send()}>Send</button>
          </div>

          <p className="wa__fine">
            Posts to the same webhook Meta's Cloud API would. Unparseable replies escalate to the
            cooperative rather than guessing.
          </p>
        </div>
      )}
    </div>
  );
}

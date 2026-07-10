import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { inr, todayPlus } from '../lib/format.js';
import './BookingPanel.css';

/**
 * The whole loop, in one panel: request → confirm → escrow held → QR scanned
 * at the workshop → 95/5 split → certificate minted.
 *
 * Deliberately never shows "Confirmed" until the artisan has actually said yes.
 * A request-and-confirm default that lies is worse than no booking at all.
 */
export default function BookingPanel({ artisan, onChanged }) {
  const { user } = useAuth();
  const loc = useLocation();
  const [step, setStep] = useState('idle'); // idle | form | pending | confirmed | done
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    partySize: 1,
    date: todayPlus(3),
    message: '',
  });

  const [booking, setBooking] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [qr, setQr] = useState(null);
  const [result, setResult] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const unavailable = artisan.availability.state === 'UNAVAILABLE';
  const total = artisan.workshop.priceInr * Number(form.partySize || 1);

  const guard = async (fn) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    guard(async () => {
      const r = await api.book({
        artisanId: artisan._id,
        tourist: { name: form.name, email: form.email },
        date: form.date,
        partySize: Number(form.partySize),
        message: form.message,
      });
      setBooking(r.booking);
      setStep('pending');
    });

  const confirm = (via) =>
    guard(async () => {
      const r = await api.confirm(booking._id, via);
      setEscrow(r.escrow);
      setQr(r.workshopQr);
      setStep('confirmed');
      onChanged?.();
    });

  const complete = () =>
    guard(async () => {
      const b = await api.booking(booking._id);
      const r = await api.complete(booking._id, b.payment.qrToken);
      setResult(r);
      setStep('done');
    });

  if (unavailable) {
    return (
      <div className="bp">
        <p className="bp__closed">
          Not hosting visits right now. You can still send a request — it reaches the artisan's
          cooperative, who will reply within 24 hours.
        </p>
      </div>
    );
  }

  /*
    Browsing is public; booking is not. The artisan is a real person who is
    about to open their workshop to a stranger, and they are entitled to know
    who that stranger is.
  */
  if (!user) {
    return (
      <div className="bp">
        <Link className="btn btn-primary bp__cta" to="/signin" state={{ from: loc.pathname }}>
          Sign in to request a visit
        </Link>
        <p className="bp__fine">
          {artisan.name} sees your name when you ask to come. Browsing needs no account; knocking
          on someone's door does.
        </p>
      </div>
    );
  }

  return (
    <div className="bp">
      {err && <div className="notice notice-bad bp__err">{err}</div>}

      {step === 'idle' && (
        <button className="btn btn-primary bp__cta" onClick={() => setStep('form')}>
          Request a visit
        </button>
      )}

      {step === 'form' && (
        <div className="bp__form">
          <div className="field">
            <label htmlFor="bp-name">Your name</label>
            <input id="bp-name" className="input" value={form.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label htmlFor="bp-email">Email</label>
            <input id="bp-email" className="input" type="email" value={form.email} onChange={set('email')} />
          </div>
          <div className="bp__two">
            <div className="field">
              <label htmlFor="bp-date">Date</label>
              <input id="bp-date" className="input" type="date" value={form.date} onChange={set('date')} />
            </div>
            <div className="field">
              <label htmlFor="bp-size">People</label>
              <input
                id="bp-size"
                className="input"
                type="number"
                min="1"
                max={artisan.workshop.capacity}
                value={form.partySize}
                onChange={set('partySize')}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="bp-msg">Anything the artisan should know</label>
            <textarea id="bp-msg" className="textarea" value={form.message} onChange={set('message')} />
          </div>

          <div className="bp__total">
            <span>Total</span>
            <strong className="mono">{inr(total)}</strong>
          </div>

          <button
            className="btn btn-primary bp__cta"
            disabled={busy || !form.name || !form.email}
            onClick={submit}
          >
            {busy ? <span className="spinner" /> : 'Send request'}
          </button>
          <p className="bp__fine">
            Nothing is charged yet. The artisan confirms first.
          </p>
        </div>
      )}

      {step === 'pending' && (
        <div className="bp__state">
          <span className="eyebrow">Awaiting the artisan</span>
          <p className="bp__msg">
            A WhatsApp message just went to {artisan.name}. Nothing is booked until they reply.
          </p>
          <div className="bp__actions">
            <button className="btn" disabled={busy} onClick={() => confirm('WHATSAPP')}>
              Artisan replied YES
            </button>
            <button className="btn" disabled={busy} onClick={() => confirm('INSTITUTION_PROXY')}>
              Cooperative confirmed
            </button>
          </div>
          <p className="bp__fine">
            Two paths, because a 55-year-old block printer may never open a dashboard. Their SHG can
            confirm on their behalf.
          </p>
        </div>
      )}

      {step === 'confirmed' && escrow && (
        <div className="bp__state">
          <span className="eyebrow">Escrow held · {escrow.escrowId}</span>

          <div className="split">
            <div className="split__bar">
              <span className="split__a" style={{ width: `${escrow.sharePct.ARTISAN_SHARE}%` }} />
              <span className="split__i" style={{ width: `${escrow.sharePct.INSTITUTION_SHARE}%` }} />
            </div>
            <div className="split__rows">
              <div>
                <span className="split__key">Artisan · {escrow.sharePct.ARTISAN_SHARE}%</span>
                <span className="mono split__val">{inr(escrow.split.artisanInr)}</span>
              </div>
              <div>
                <span className="split__key">Cooperative · {escrow.sharePct.INSTITUTION_SHARE}%</span>
                <span className="mono split__val">{inr(escrow.split.institutionInr)}</span>
              </div>
            </div>
          </div>

          {qr && <img className="bp__qr" src={qr} alt="Workshop QR code" />}
          <p className="bp__fine">
            The artisan displays this at the workshop. Money moves only when it is scanned — so a
            no-show cannot strand the payment, and a claimed visit that never happened cannot
            release it.
          </p>

          <button className="btn btn-primary bp__cta" disabled={busy} onClick={complete}>
            {busy ? <span className="spinner" /> : 'Scan at the workshop'}
          </button>
        </div>
      )}

      {step === 'done' && result && (
        <div className="bp__state">
          <span className="eyebrow">Settled</span>
          <p className="bp__settled mono">
            {inr(result.settlement.artisanInr)} → {result.settlement.artisanUpi || 'artisan'}
            <br />
            {inr(result.settlement.institutionInr)} → {result.settlement.institutionUpi || 'cooperative'}
          </p>
          <Link className="btn btn-primary bp__cta" to={`/cert/${result.certificate.code}`}>
            Open your certificate
          </Link>
          <p className="bp__fine">
            Issued while you are still standing in the workshop. That is the point.
          </p>
        </div>
      )}
    </div>
  );
}

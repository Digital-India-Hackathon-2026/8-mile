import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { useTheme } from '../lib/theme.jsx';
import { api } from '../lib/api.js';
import { THEMES, TYPEFACES } from '../lib/constants.js';
import { shortDate, inr } from '../lib/format.js';
import './Sidebar.css';

const TABS = [
  { key: 'profile',    label: 'Profile' },
  { key: 'edit',       label: 'Edit Profile' },
  { key: 'bookings',   label: 'Bookings' },
  { key: 'visited',    label: 'Places visited' },
  { key: 'appearance', label: 'Appearance' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const [tab, setTab] = useState('profile');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  // Esc closes. Any drawer that traps you is a broken drawer.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !user || data) return;
    api.myBookings().then(setData).catch((e) => setErr(e.message));
  }, [open, user, data]);

  if (!open) return null;

  return (
    <>
      <div className="sb__scrim" onClick={onClose} aria-hidden="true" />
      <aside className="sb" role="dialog" aria-label="Your account">
        <header className="sb__head">
          <div>
            <p className="sb__name">{user?.name || 'Guest'}</p>
            <p className="sb__email mono">{user?.email || 'Not signed in'}</p>
          </div>
          <button className="sb__x" onClick={onClose} aria-label="Close">×</button>
        </header>

        {!user && (
          <div className="sb__body">
            <p className="sb__guest">
              Browsing works without an account. Booking a visit does not.
            </p>
            <Link className="btn btn-primary sb__wide" to="/signup" onClick={onClose}>Create an account</Link>
            <Link className="btn sb__wide" to="/signin" onClick={onClose}>Sign in</Link>
            <hr className="sb__rule" />
            <Appearance />
          </div>
        )}

        {user && (
          <>
            <nav className="sb__tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  className={`sb__tab ${tab === t.key ? 'is-on' : ''}`}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            <div className="sb__body">
              {err && <div className="notice notice-bad">{err}</div>}

              {tab === 'profile' && (
                <div className="sb__stack">
                  <Row k="Name" v={user.name} />
                  <Row k="Email" v={user.email} />
                  <Row k="Role" v={user.role === 'admin' ? 'Tourism department' : 'Traveller'} />
                  <Row k="Home city" v={user.homeCity?.name || 'Not set'} />
                  <Row k="Following" v={user.interests?.length ? `${user.interests.length} crafts` : 'No crafts yet'} />
                  {isAdmin && (
                    <Link className="btn sb__wide" to="/admin" onClick={onClose}>Open admin console</Link>
                  )}
                  <button className="btn sb__wide" onClick={() => { logout(); onClose(); }}>Sign out</button>
                </div>
              )}

              {tab === 'edit' && (
                <EditProfile onClose={onClose} />
              )}

              {tab === 'bookings' && (
                <Bookings data={data} onClose={onClose} />
              )}

              {tab === 'visited' && (
                <Visited data={data} onClose={onClose} />
              )}

              {tab === 'appearance' && <Appearance />}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

/* ── EditProfile ──────────────────────────────────────────────────── */
function EditProfile({ onClose }) {
  const { user, updatePrefs, changePassword, deleteAccount, logout } = useAuth();
  const navigate = useNavigate();

  // Username change
  const [name, setName] = useState(user?.name || '');
  const [nameMsg, setNameMsg] = useState(null);
  const [nameBusy, setNameBusy] = useState(false);

  // Password change
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwBusy, setPwBusy] = useState(false);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delMsg, setDelMsg] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  const saveName = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === user.name) return;
    setNameBusy(true);
    setNameMsg(null);
    try {
      await updatePrefs({ name: name.trim() });
      setNameMsg({ ok: true, text: 'Username updated successfully!' });
    } catch (err) {
      setNameMsg({ ok: false, text: err.message });
    } finally {
      setNameBusy(false);
    }
  };

  const savePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ ok: false, text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwMsg({ ok: false, text: 'New password must be at least 8 characters.' });
      return;
    }
    setPwBusy(true);
    setPwMsg(null);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwMsg({ ok: true, text: 'Password changed successfully!' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMsg({ ok: false, text: err.message });
    } finally {
      setPwBusy(false);
    }
  };

  const doDelete = async () => {
    if (deleteConfirm.toLowerCase() !== 'delete') {
      setDelMsg({ ok: false, text: 'Type "delete" to confirm.' });
      return;
    }
    setDelBusy(true);
    setDelMsg(null);
    try {
      await deleteAccount();
      onClose();
      navigate('/', { replace: true });
    } catch (err) {
      setDelMsg({ ok: false, text: err.message });
      setDelBusy(false);
    }
  };

  return (
    <div className="sb__stack">
      {/* ── Change username ─────────────────────────── */}
      <div className="ep__section">
        <span className="eyebrow ep__eyebrow">Change username</span>
        <form onSubmit={saveName} className="ep__form">
          <div className="field">
            <label htmlFor="ep-name">Display name</label>
            <input
              id="ep-name"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              disabled={nameBusy}
            />
          </div>
          {nameMsg && (
            <div className={`notice ${nameMsg.ok ? '' : 'notice-bad'} ep__msg`}>
              {nameMsg.text}
            </div>
          )}
          <button
            className="btn btn-primary sb__wide"
            disabled={nameBusy || !name.trim() || name.trim() === user?.name}
          >
            {nameBusy ? <span className="spinner" /> : 'Save name'}
          </button>
        </form>
      </div>

      <hr className="sb__rule" />

      {/* ── Change password ─────────────────────────── */}
      <div className="ep__section">
        <span className="eyebrow ep__eyebrow">Change password</span>
        <form onSubmit={savePw} className="ep__form">
          <div className="field">
            <label htmlFor="ep-cur-pw">Current password</label>
            <input
              id="ep-cur-pw"
              className="input"
              type="password"
              autoComplete="current-password"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              disabled={pwBusy}
            />
          </div>
          <div className="field">
            <label htmlFor="ep-new-pw">New password</label>
            <input
              id="ep-new-pw"
              className="input"
              type="password"
              autoComplete="new-password"
              value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              disabled={pwBusy}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="field">
            <label htmlFor="ep-confirm-pw">Confirm new password</label>
            <input
              id="ep-confirm-pw"
              className="input"
              type="password"
              autoComplete="new-password"
              value={pwForm.confirmPassword}
              onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              disabled={pwBusy}
            />
          </div>
          {pwMsg && (
            <div className={`notice ${pwMsg.ok ? '' : 'notice-bad'} ep__msg`}>
              {pwMsg.text}
            </div>
          )}
          <button
            className="btn btn-primary sb__wide"
            disabled={pwBusy || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword}
          >
            {pwBusy ? <span className="spinner" /> : 'Change password'}
          </button>
        </form>
      </div>

      <hr className="sb__rule" />

      {/* ── Delete account ──────────────────────────── */}
      <div className="ep__section ep__section--danger">
        <span className="eyebrow ep__eyebrow ep__eyebrow--danger">Danger zone</span>
        {!showDelete ? (
          <button
            className="btn ep__delete-btn"
            onClick={() => setShowDelete(true)}
          >
            🗑 Delete my account
          </button>
        ) : (
          <div className="ep__delete-box">
            <p className="ep__delete-warn">
              This is <strong>permanent</strong>. Your account, bookings, and all data
              will be deleted. This cannot be undone.
            </p>
            <div className="field">
              <label htmlFor="ep-del-confirm">Type <strong>delete</strong> to confirm</label>
              <input
                id="ep-del-confirm"
                className="input ep__delete-input"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="delete"
                disabled={delBusy}
              />
            </div>
            {delMsg && (
              <div className={`notice ${delMsg.ok ? '' : 'notice-bad'} ep__msg`}>
                {delMsg.text}
              </div>
            )}
            <div className="ep__delete-actions">
              <button
                className="btn ep__delete-confirm"
                onClick={doDelete}
                disabled={delBusy || deleteConfirm.toLowerCase() !== 'delete'}
              >
                {delBusy ? <span className="spinner" /> : 'Permanently delete'}
              </button>
              <button
                className="btn sb__wide"
                onClick={() => { setShowDelete(false); setDeleteConfirm(''); setDelMsg(null); }}
                disabled={delBusy}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Row = ({ k, v }) => (
  <div className="sb__row">
    <span className="sb__k">{k}</span>
    <span className="sb__v">{v}</span>
  </div>
);

function Bookings({ data, onClose }) {
  if (!data) return <Loading />;
  const { upcoming = [], past = [] } = data;

  if (!upcoming.length && !past.length) {
    return (
      <Empty
        title="No bookings yet"
        body="Find a workshop you like and request a visit. The artisan confirms before anything is charged."
        cta="Explore nearby crafts"
        to="/home"
        onClose={onClose}
      />
    );
  }

  return (
    <div className="sb__stack">
      {upcoming.length > 0 && <span className="eyebrow">Upcoming</span>}
      {upcoming.map((b) => (
        <div className="bk" key={b._id}>
          <div className="bk__top">
            <strong>{b.artisan?.name}</strong>
            <span className={`bk__status bk__status--${b.status.toLowerCase()}`}>{b.status.toLowerCase()}</span>
          </div>
          <p className="bk__meta mono">{shortDate(b.date)} · {b.artisan?.craft} · {inr(b.amountInr)}</p>
        </div>
      ))}

      {past.length > 0 && <span className="eyebrow" style={{ marginTop: 8 }}>Completed</span>}
      {past.map((b) => (
        <div className="bk" key={b._id}>
          <div className="bk__top">
            <strong>{b.artisan?.name}</strong>
            {b.certificateCode && (
              <Link className="bk__cert mono" to={`/cert/${b.certificateCode}`} onClick={onClose}>
                certificate →
              </Link>
            )}
          </div>
          <p className="bk__meta mono">{shortDate(b.date)} · {b.artisan?.craft}</p>
        </div>
      ))}
    </div>
  );
}

function Visited({ data, onClose }) {
  if (!data) return <Loading />;
  const visited = data.visited || [];

  if (!visited.length) {
    return (
      <Empty
        title="Nowhere yet"
        body="Every completed workshop lands here, with the certificate you were given on the spot."
        cta="Find a craft village"
        to="/home"
        onClose={onClose}
      />
    );
  }

  const states = [...new Set(visited.map((v) => v.state))];
  return (
    <div className="sb__stack">
      <p className="sb__count">
        <strong>{visited.length}</strong> workshop{visited.length === 1 ? '' : 's'} across{' '}
        <strong>{states.length}</strong> state{states.length === 1 ? '' : 's'}
      </p>
      {visited.map((v) => (
        <Link className="vs" key={v.artisanId + v.date} to={`/artisan/${v.artisanId}`} onClick={onClose}>
          <div>
            <strong>{v.cluster || v.district}</strong>
            <p className="vs__meta">{v.craft} · {v.artisanName}</p>
          </div>
          <span className="mono vs__date">{shortDate(v.date)}</span>
        </Link>
      ))}
    </div>
  );
}

function Appearance() {
  const { theme, typeface, setTheme, setTypeface } = useTheme();
  return (
    <div className="sb__stack">
      <span className="eyebrow">Colour</span>
      <div className="sw">
        {THEMES.map((t) => (
          <button
            key={t.key}
            className={`sw__item ${theme === t.key ? 'is-on' : ''}`}
            onClick={() => setTheme(t.key)}
            aria-pressed={theme === t.key}
          >
            <span className="sw__chips">
              {t.swatch.map((c) => <span key={c} style={{ background: c }} />)}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      <span className="eyebrow" style={{ marginTop: 10 }}>Type</span>
      <div className="tf">
        {TYPEFACES.map((t) => (
          <button
            key={t.key}
            className={`tf__item ${typeface === t.key ? 'is-on' : ''}`}
            onClick={() => setTypeface(t.key)}
            aria-pressed={typeface === t.key}
            data-type-preview={t.key}
          >
            <span className="tf__label">{t.label}</span>
            <span className="tf__note mono">{t.note}</span>
          </button>
        ))}
      </div>

      <p className="sb__fine">
        Certificates always look the same to everyone, whatever you pick here. A shared
        proof of authenticity that changes appearance is not proof of anything.
      </p>
    </div>
  );
}

const Loading = () => (
  <div className="sb__loading"><span className="spinner" /> Loading…</div>
);

const Empty = ({ title, body, cta, to, onClose }) => (
  <div className="sb__empty">
    <h3>{title}</h3>
    <p>{body}</p>
    <Link className="btn btn-primary sb__wide" to={to} onClick={onClose}>{cta}</Link>
  </div>
);

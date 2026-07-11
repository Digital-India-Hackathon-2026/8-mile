import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import './Auth.css';

/**
 * Name, email, password. Nothing else.
 *
 * Craft interests are chosen on /home once the account exists. Every extra
 * field on a signup form costs users, and interests are more useful when the
 * person can see what the options actually look like on a map.
 */
export default function SignUp() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const short = form.password.length > 0 && form.password.length < 8;
  const ready = form.name && form.email && form.password.length >= 8;

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await register(form);
      nav('/home', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="au">
      <div className="au__box">
        <header className="au__head">
          <h1>Join CraftTrail</h1>
          <p>Free. Takes a minute. Needed only when you book a visit.</p>
        </header>

        <div className="au__card card">
          {err && <div className="notice notice-bad au__err">{err}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="su-name">Your name</label>
              <input id="su-name" className="input" autoComplete="name" value={form.name} onChange={set('name')} />
              <p className="au__hint">The artisan sees this when you request a visit.</p>
            </div>
            <div className="field">
              <label htmlFor="su-email">Email</label>
              <input id="su-email" className="input" type="email" autoComplete="email"
                value={form.email} onChange={set('email')} />
            </div>
            <div className="field">
              <label htmlFor="su-pw">Password</label>
              <input id="su-pw" className="input" type="password" autoComplete="new-password"
                value={form.password} onChange={set('password')} />
              <p className="au__hint" style={short ? { color: 'var(--accent)' } : undefined}>
                {short ? `${8 - form.password.length} more characters needed` : 'At least 8 characters.'}
              </p>
            </div>

            <button className="btn btn-primary au__wide" disabled={busy || !ready}>
              {busy ? <span className="spinner" /> : 'Create account'}
            </button>
          </form>
        </div>

        <p className="au__alt">
          Already have one? <Link to="/signin">Log in</Link>
        </p>
      </div>
    </div>
  );
}
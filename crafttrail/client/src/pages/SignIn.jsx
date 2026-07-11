import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import './Auth.css';

export default function SignIn() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const user = await login(form);
      nav(loc.state?.from || (user.role === 'admin' ? '/admin' : '/home'), { replace: true });
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
          <h1>Welcome back</h1>
          <p>Sign in to book workshops and keep your places visited.</p>
        </header>

        <div className="au__card card">
          {err && <div className="notice notice-bad au__err">{err}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="si-email">Email</label>
              <input id="si-email" className="input" type="email" autoComplete="email"
                value={form.email} onChange={set('email')} />
            </div>
            <div className="field">
              <label htmlFor="si-pw">Password</label>
              <input id="si-pw" className="input" type="password" autoComplete="current-password"
                value={form.password} onChange={set('password')} />
            </div>

            <button className="btn btn-primary au__wide" disabled={busy || !form.email || !form.password}>
              {busy ? <span className="spinner" /> : 'Sign in'}
            </button>
          </form>

          <div className="au__demo">
            <strong>Tourism department?</strong> Sign in with the seeded admin account —{' '}
            <code>admin@crafttrail.gov.in</code> — to open the console where artisan records
            collected by NGOs are entered.
          </div>
        </div>

        <p className="au__alt">
          No account? <Link to="/signup">Join free</Link>
        </p>
      </div>
    </div>
  );
}
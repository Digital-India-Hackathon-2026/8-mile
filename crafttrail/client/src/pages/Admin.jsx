import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import './Admin.css';

/**
 * The console exists because artisans do not sign up.
 *
 * NGOs and cluster development offices collect records on paper. A state
 * tourism officer enters them here. The GI/district cross-check runs on submit,
 * so an officer typing "Pochampally Ikat, Jaipur" is told immediately, and
 * exactly, why that cannot be verified. Data entry with a conscience.
 */
export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState({ state: '', status: '', q: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);

  const blank = {
    name: '', phone: '', craft: '', claimedGi: '', clusterId: '',
    district: '', state: '', lat: '', lng: '', bio: '', upiId: '',
    workshop: { title: '', durationMins: 90, priceInr: 0, capacity: 4 },
  };
  const [form, setForm] = useState(blank);

  const load = () => {
    api.admin.stats().then(setStats).catch((e) => setErr(e.message));
    api.admin.artisans({ ...filter, limit: 15 }).then((d) => setRows(d.artisans)).catch(() => {});
  };

  useEffect(() => { api.admin.clusters().then(setClusters).catch(() => {}); }, []);
  useEffect(load, [filter.state, filter.status, filter.q]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Picking a cluster fills district, state, coordinates and the GI claim.
  // An officer should not have to know that Bagru is in Jaipur district.
  const pickCluster = (id) => {
    const c = clusters.find((x) => x._id === id);
    if (!c) return setForm({ ...form, clusterId: '' });
    setForm({
      ...form,
      clusterId: id,
      district: c.district,
      state: c.state,
      craft: c.craft,
      claimedGi: c.giTag || '',
      lat: c.location.coordinates[1],
      lng: c.location.coordinates[0],
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null); setResult(null);
    try {
      const r = await api.admin.create(form);
      setResult(r);
      setForm(blank);
      load();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Remove ${name}? This cannot be undone.`)) return;
    try {
      await api.admin.remove(id);
      load();
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const states = [...new Set(clusters.map((c) => c.state))].sort();

  return (
    <div className="ad shell">
      <header className="ad__head">
        <div>
          <span className="eyebrow">Tourism department console</span>
          <h1>Artisan records</h1>
          <p className="ad__sub">
            Signed in as {user?.email}. Records arrive from NGOs and cluster development offices.
            Artisans themselves never sign in.
          </p>
        </div>
      </header>

      {err && <div className="notice notice-bad ad__err">{err}</div>}

      {stats && (
        <div className="ad__stats">
          <Stat v={stats.artisans} l="artisans" />
          <Stat v={stats.verified} l="passed Tier 1" tone="live" />
          <Stat v={stats.failedTier1} l="failed Tier 1" tone="accent" />
          <Stat v={stats.realArtisans} l="entered by staff" />
          <Stat v={stats.demo} l="demo profiles" tone="dim" />
          <Stat v={stats.clusters} l="clusters" />
          <Stat v={stats.giProducts} l="GI products checked" />
        </div>
      )}

      <div className="ad__grid">
        <section className="card ad__form">
          <span className="eyebrow">Add an artisan</span>
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="ad-cluster">Cluster</label>
              <select id="ad-cluster" className="select" value={form.clusterId} onChange={(e) => pickCluster(e.target.value)}>
                <option value="">Select a cluster…</option>
                {clusters.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} — {c.district}, {c.state}</option>
                ))}
              </select>
              <p className="ad__hint">Fills district, state, craft, GI claim and coordinates.</p>
            </div>

            <div className="ad__two">
              <div className="field">
                <label htmlFor="ad-name">Name</label>
                <input id="ad-name" className="input" value={form.name} onChange={set('name')} />
              </div>
              <div className="field">
                <label htmlFor="ad-phone">Phone (WhatsApp)</label>
                <input id="ad-phone" className="input" placeholder="+9198…" value={form.phone} onChange={set('phone')} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="ad-gi">GI claim</label>
              <input id="ad-gi" className="input" value={form.claimedGi} onChange={set('claimedGi')} />
              <p className="ad__hint">Checked against the district on submit. A mismatch will not verify.</p>
            </div>

            <div className="ad__two">
              <div className="field">
                <label htmlFor="ad-district">District</label>
                <input id="ad-district" className="input" value={form.district} onChange={set('district')} />
              </div>
              <div className="field">
                <label htmlFor="ad-state">State</label>
                <input id="ad-state" className="input" value={form.state} onChange={set('state')} />
              </div>
            </div>

            <div className="ad__two">
              <div className="field">
                <label htmlFor="ad-price">Workshop price (₹)</label>
                <input id="ad-price" className="input" type="number" min="0"
                  value={form.workshop.priceInr}
                  onChange={(e) => setForm({ ...form, workshop: { ...form.workshop, priceInr: Number(e.target.value) } })} />
              </div>
              <div className="field">
                <label htmlFor="ad-upi">Artisan UPI</label>
                <input id="ad-upi" className="input" placeholder="name@upi" value={form.upiId} onChange={set('upiId')} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="ad-bio">Notes from the field record</label>
              <textarea id="ad-bio" className="textarea" value={form.bio} onChange={set('bio')} />
            </div>

            <button className="btn btn-primary ad__wide" disabled={busy || !form.name || !form.phone || !form.district}>
              {busy ? <span className="spinner" /> : 'Add artisan'}
            </button>
          </form>

          {result && (
            <div className={`notice ${result.tier1.status === 'PASS' ? '' : 'notice-bad'} ad__result`}>
              <strong>{result.tier1.status === 'PASS' ? 'GI claim matches the district.' : 'GI claim does not match.'}</strong>
              <p className="mono">{result.tier1.reason}</p>
              <p>{result.note}</p>
            </div>
          )}
        </section>

        <section className="ad__table">
          <div className="ad__filters">
            <input className="input" placeholder="Search by name…" value={filter.q}
              onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
            <select className="select" value={filter.state} onChange={(e) => setFilter({ ...filter, state: e.target.value })}>
              <option value="">All states</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="select" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">Any status</option>
              <option value="PASS">Passed Tier 1</option>
              <option value="FAIL">Failed Tier 1</option>
            </select>
          </div>

          <div className="ad__rows">
            {rows.length === 0 && <p className="ad__none">No artisans match that filter.</p>}
            {rows.map((a) => (
              <div className="arow" key={a.id}>
                <div className="arow__main">
                  <div className="arow__top">
                    <strong>{a.name}</strong>
                    {a.isDemo && <span className="arow__demo mono">demo</span>}
                    <span className={`arow__t1 arow__t1--${a.tier1.toLowerCase()}`}>{a.tier1}</span>
                  </div>
                  <p className="arow__meta mono">{a.craft} · {a.cluster || a.district}, {a.state} · trust {a.trustScore}</p>
                </div>
                <button className="arow__del" onClick={() => remove(a.id, a.name)} aria-label={`Remove ${a.name}`}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <p className="ad__fine">
            Removing an artisan with open bookings is refused. Cancel those first — silently
            orphaning a confirmed workshop is worse than an error message.
          </p>
        </section>
      </div>
    </div>
  );
}

const Stat = ({ v, l, tone }) => (
  <div className={`stat ${tone ? `stat--${tone}` : ''}`}>
    <span className="stat__v">{v}</span>
    <span className="stat__l">{l}</span>
  </div>
);

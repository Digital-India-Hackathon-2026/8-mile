import { useState, useEffect, useCallback } from 'react';
import './Guildmaster.css';

const API = 'http://localhost:5000/api/vault';
const SERVER = 'http://localhost:5000';

/* ── Helpers ─────────────────────────────────────────────────────── */
const VAULT_KEY = 'crafttrail_vault_token';
const vaultToken = () => localStorage.getItem(VAULT_KEY);

async function vaultFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const t = vaultToken();
  if (t) headers['Authorization'] = `Bearer ${t}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

/* ── Tabs ─────────────────────────────────────────────────────────── */
const TABS = ['Overview', 'Documents', 'Certificates', 'Awards', 'Products'];

/* ═══════════════════════════════════════════════════════════════════
   VAULT LOGIN SCREEN
═══════════════════════════════════════════════════════════════════ */
function VaultLogin({ onLogin }) {
  const [email, setEmail]   = useState('');
  const [pass,  setPass]    = useState('');
  const [err,   setErr]     = useState('');
  const [busy,  setBusy]    = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const d = await vaultFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      localStorage.setItem(VAULT_KEY, d.token);
      onLogin(d);
    } catch (ex) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="gm-login">
      <div className="gm-login__box">
        <div className="gm-login__emblem">🔐</div>
        <h1 className="gm-login__title">CraftTrail Vault</h1>
        <p className="gm-login__sub">Restricted access — authorised administrators only</p>
        <form className="gm-login__form" onSubmit={submit}>
          <div className="gm-field">
            <label>Admin Email</label>
            <input
              type="email" value={email} required autoComplete="username"
              onChange={e => setEmail(e.target.value)} placeholder="admin@crafttrail.in"
            />
          </div>
          <div className="gm-field">
            <label>Password</label>
            <input
              type="password" value={pass} required autoComplete="current-password"
              onChange={e => setPass(e.target.value)} placeholder="••••••••••••"
            />
          </div>
          {err && <div className="gm-login__err">{err}</div>}
          <button className="gm-login__btn" disabled={busy}>
            {busy ? 'Verifying…' : 'Enter Vault →'}
          </button>
        </form>
        <p className="gm-login__notice">
          🛡 All activity in this portal is logged. Unauthorised access is a criminal offence.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ARTISAN DETAIL PANEL
═══════════════════════════════════════════════════════════════════ */
function ArtisanVaultDetail({ artisanId, onBack, onRefresh }) {
  const [a,       setA]       = useState(null);
  const [tab,     setTab]     = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setA(await vaultFetch(`/artisans/${artisanId}`)); }
    catch (ex) { setMsg({ text: ex.message, ok: false }); }
    finally { setLoading(false); }
  }, [artisanId]);

  useEffect(() => { load(); }, [load]);

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const post = async (path, body) => {
    const res = await vaultFetch(`/artisans/${artisanId}${path}`, {
      method: 'POST', body: JSON.stringify(body),
    });
    await load(); onRefresh?.();
    return res;
  };

  const del = async (path) => {
    if (!window.confirm('Delete this entry?')) return;
    await vaultFetch(`/artisans/${artisanId}${path}`, { method: 'DELETE' });
    await load(); onRefresh?.();
    flash('Deleted');
  };

  const uploadFile = async (path, formData) => {
    const headers = {};
    const t = vaultToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
    const res = await fetch(`${API}/artisans/${artisanId}${path}`, {
      method: 'POST', headers, body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    await load(); onRefresh?.();
    return data;
  };

  if (loading) return <div className="gm-loading">Loading artisan…</div>;
  if (!a) return null;

  return (
    <div className="gm-detail">
      <button className="gm-back" onClick={onBack}>← Back to list</button>

      {msg && <div className={`gm-msg ${msg.ok ? 'gm-msg--ok' : 'gm-msg--err'}`}>{msg.text}</div>}

      {/* Header */}
      <div className="gm-detail__head">
        <div className="gm-detail__avatar">{a.name?.[0]?.toUpperCase()}</div>
        <div>
          <h2 className="gm-detail__name">{a.name}</h2>
          <p className="gm-detail__meta">{a.craft} · {a.district}, {a.state}</p>
          <div className="gm-detail__badges">
            <span className={`gm-badge ${a.trustScore >= 60 ? 'gm-badge--green' : 'gm-badge--yellow'}`}>
              Trust {a.trustScore}/100
            </span>
            {a.isDemo && <span className="gm-badge gm-badge--gray">Demo Profile</span>}
            <span className="gm-badge gm-badge--blue">{a.verificationDocs?.length || 0} docs</span>
            <span className="gm-badge gm-badge--purple">{a.certificates?.length || 0} certs</span>
            <span className="gm-badge gm-badge--orange">{a.awards?.length || 0} awards</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="gm-tabs">
        {TABS.map(t => (
          <button key={t} className={`gm-tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────── */}
      {tab === 'Overview' && (
        <OverviewTab a={a} flash={flash} onSaved={load} />
      )}

      {/* ── Verification Documents ───────────────────────────────── */}
      {tab === 'Documents' && (
        <DocsTab docs={a.verificationDocs || []} onUpload={uploadFile} onDelete={del} flash={flash} />
      )}

      {/* ── Certificates ─────────────────────────────────────────── */}
      {tab === 'Certificates' && (
        <CertsTab certs={a.certificates || []} onAdd={post} onUpload={uploadFile} onDelete={del} flash={flash} />
      )}

      {/* ── Awards ───────────────────────────────────────────────── */}
      {tab === 'Awards' && (
        <AwardsTab awards={a.awards || []} onAdd={post} onDelete={del} flash={flash} />
      )}

      {/* ── Product History ──────────────────────────────────────── */}
      {tab === 'Products' && (
        <ProductsTab products={a.productHistory || []} onAdd={post} onDelete={del} flash={flash} />
      )}
    </div>
  );
}

/* ── Overview tab ────────────────────────────────────────────────── */
function OverviewTab({ a, flash, onSaved }) {
  const [form, setForm] = useState({
    name: a.name, bio: a.bio, craft: a.craft,
    district: a.district, state: a.state,
    phone: a.phone, languages: (a.languages||[]).join(', '),
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await vaultFetch(`/artisans/${a._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...form, languages: form.languages.split(',').map(s=>s.trim()) }),
      });
      flash('Profile updated');
      onSaved();
    } catch (ex) { flash(ex.message, false); }
    finally { setBusy(false); }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({...p, [k]: e.target.value})) });

  return (
    <div className="gm-form-grid">
      <div className="gm-field"><label>Full Name</label><input {...f('name')} /></div>
      <div className="gm-field"><label>Craft</label><input {...f('craft')} /></div>
      <div className="gm-field"><label>Phone</label><input {...f('phone')} /></div>
      <div className="gm-field"><label>District</label><input {...f('district')} /></div>
      <div className="gm-field"><label>State</label><input {...f('state')} /></div>
      <div className="gm-field"><label>Languages (comma separated)</label><input {...f('languages')} /></div>
      <div className="gm-field gm-field--full"><label>Bio</label>
        <textarea rows={4} {...f('bio')} />
      </div>
      <div className="gm-field gm-field--full">
        <button className="gm-btn gm-btn--primary" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : '💾 Save Profile'}
        </button>
      </div>
    </div>
  );
}

/* ── Docs tab ────────────────────────────────────────────────────── */
function DocsTab({ docs, onUpload, onDelete, flash }) {
  const [label, setLabel]   = useState('');
  const [docType, setType]  = useState('other');
  const [note, setNote]     = useState('');
  const [file, setFile]     = useState(null);
  const [busy, setBusy]     = useState(false);

  const submit = async () => {
    if (!file || !label) return flash('File and label required', false);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('label', label);
      fd.append('docType', docType); fd.append('note', note);
      await onUpload('/docs', fd);
      flash('Document uploaded'); setLabel(''); setNote(''); setFile(null);
    } catch (ex) { flash(ex.message, false); }
    finally { setBusy(false); }
  };

  return (
    <div className="gm-tab-body">
      <div className="gm-section-title">Upload Verification Document</div>
      <div className="gm-form-grid">
        <div className="gm-field"><label>Label</label>
          <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. Pehchan Card" />
        </div>
        <div className="gm-field"><label>Type</label>
          <select value={docType} onChange={e=>setType(e.target.value)}>
            <option value="pehchan">Pehchan Card</option>
            <option value="gi">GI Certificate</option>
            <option value="udyam">Udyam Registration</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="gm-field gm-field--full"><label>Note</label>
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note" />
        </div>
        <div className="gm-field gm-field--full">
          <label>File (PDF / Image)</label>
          <input type="file" accept=".pdf,image/*" onChange={e=>setFile(e.target.files[0])} />
        </div>
        <div className="gm-field gm-field--full">
          <button className="gm-btn gm-btn--primary" onClick={submit} disabled={busy}>
            {busy ? 'Uploading…' : '📎 Upload Document'}
          </button>
        </div>
      </div>

      <div className="gm-section-title" style={{marginTop:24}}>Stored Documents ({docs.length})</div>
      <div className="gm-cards">
        {docs.length === 0 && <p className="gm-empty">No documents yet.</p>}
        {docs.map(d => (
          <div key={d._id} className="gm-card">
            <div className="gm-card__icon">📄</div>
            <div className="gm-card__info">
              <strong>{d.label}</strong>
              <span>{d.docType} · {d.note}</span>
              {d.fileUrl && <a href={`${SERVER}${d.fileUrl}`} target="_blank" rel="noreferrer" className="gm-link">View file ↗</a>}
            </div>
            <button className="gm-card__del" onClick={()=>onDelete(`/docs/${d._id}`)}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Certs tab ───────────────────────────────────────────────────── */
function CertsTab({ certs, onAdd, onUpload, onDelete, flash }) {
  const [form, setForm] = useState({ title:'', issuedBy:'', issuedDate:'', description:'' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const f = k => ({ value:form[k], onChange:e=>setForm(p=>({...p,[k]:e.target.value})) });

  const submit = async () => {
    if (!form.title) return flash('Title required', false);
    setBusy(true);
    try {
      if (file) {
        const fd = new FormData();
        Object.entries(form).forEach(([k,v])=>fd.append(k,v));
        fd.append('file', file);
        await onUpload('/certificates', fd);
      } else {
        await onAdd('/certificates', form);
      }
      flash('Certificate added'); setForm({title:'',issuedBy:'',issuedDate:'',description:''}); setFile(null);
    } catch (ex) { flash(ex.message, false); }
    finally { setBusy(false); }
  };

  return (
    <div className="gm-tab-body">
      <div className="gm-section-title">Add Certificate</div>
      <div className="gm-form-grid">
        <div className="gm-field"><label>Title</label><input {...f('title')} placeholder="National Crafts Award 2023" /></div>
        <div className="gm-field"><label>Issued By</label><input {...f('issuedBy')} placeholder="Ministry of Textiles" /></div>
        <div className="gm-field"><label>Issue Date</label><input type="date" {...f('issuedDate')} /></div>
        <div className="gm-field gm-field--full"><label>Description</label><textarea rows={3} {...f('description')} /></div>
        <div className="gm-field gm-field--full"><label>Certificate File (optional)</label>
          <input type="file" accept=".pdf,image/*" onChange={e=>setFile(e.target.files[0])} />
        </div>
        <div className="gm-field gm-field--full">
          <button className="gm-btn gm-btn--primary" onClick={submit} disabled={busy}>
            {busy ? 'Adding…' : '🏅 Add Certificate'}
          </button>
        </div>
      </div>
      <div className="gm-section-title" style={{marginTop:24}}>Certificates ({certs.length})</div>
      <div className="gm-cards">
        {certs.length === 0 && <p className="gm-empty">No certificates yet.</p>}
        {certs.map(c => (
          <div key={c._id} className="gm-card">
            <div className="gm-card__icon">🏅</div>
            <div className="gm-card__info">
              <strong>{c.title}</strong>
              <span>{c.issuedBy} · {c.issuedDate ? new Date(c.issuedDate).getFullYear() : ''}</span>
              {c.fileUrl && <a href={`${SERVER}${c.fileUrl}`} target="_blank" rel="noreferrer" className="gm-link">View ↗</a>}
            </div>
            <button className="gm-card__del" onClick={()=>onDelete(`/certificates/${c._id}`)}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Awards tab ──────────────────────────────────────────────────── */
function AwardsTab({ awards, onAdd, onDelete, flash }) {
  const [form, setForm] = useState({ title:'', year: new Date().getFullYear(), awardedBy:'', description:'' });
  const [busy, setBusy] = useState(false);
  const f = k => ({ value:form[k], onChange:e=>setForm(p=>({...p,[k]:e.target.value})) });

  const submit = async () => {
    if (!form.title) return flash('Title required', false);
    setBusy(true);
    try {
      await onAdd('/awards', form);
      flash('Award added'); setForm({title:'',year:new Date().getFullYear(),awardedBy:'',description:''});
    } catch (ex) { flash(ex.message, false); }
    finally { setBusy(false); }
  };

  return (
    <div className="gm-tab-body">
      <div className="gm-section-title">Add Award</div>
      <div className="gm-form-grid">
        <div className="gm-field"><label>Award Title</label><input {...f('title')} placeholder="Shilp Guru, Padma Shri…" /></div>
        <div className="gm-field"><label>Year</label><input type="number" {...f('year')} /></div>
        <div className="gm-field"><label>Awarded By</label><input {...f('awardedBy')} placeholder="Govt. of India" /></div>
        <div className="gm-field gm-field--full"><label>Description</label><textarea rows={3} {...f('description')} /></div>
        <div className="gm-field gm-field--full">
          <button className="gm-btn gm-btn--primary" onClick={submit} disabled={busy}>
            {busy ? 'Adding…' : '🏆 Add Award'}
          </button>
        </div>
      </div>
      <div className="gm-section-title" style={{marginTop:24}}>Awards ({awards.length})</div>
      <div className="gm-cards">
        {awards.length === 0 && <p className="gm-empty">No awards yet.</p>}
        {awards.map(aw => (
          <div key={aw._id} className="gm-card">
            <div className="gm-card__icon">🏆</div>
            <div className="gm-card__info">
              <strong>{aw.title}</strong>
              <span>{aw.awardedBy} · {aw.year}</span>
            </div>
            <button className="gm-card__del" onClick={()=>onDelete(`/awards/${aw._id}`)}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Products tab ────────────────────────────────────────────────── */
function ProductsTab({ products, onAdd, onDelete, flash }) {
  const [form, setForm] = useState({ productName:'', category:'', year: new Date().getFullYear(), description:'', priceInr:0, soldTo:'' });
  const [busy, setBusy] = useState(false);
  const f = k => ({ value:form[k], onChange:e=>setForm(p=>({...p,[k]:e.target.value})) });

  const submit = async () => {
    if (!form.productName) return flash('Product name required', false);
    setBusy(true);
    try {
      await onAdd('/products', form);
      flash('Product added'); setForm({productName:'',category:'',year:new Date().getFullYear(),description:'',priceInr:0,soldTo:''});
    } catch (ex) { flash(ex.message, false); }
    finally { setBusy(false); }
  };

  return (
    <div className="gm-tab-body">
      <div className="gm-section-title">Add Product / Sale Record</div>
      <div className="gm-form-grid">
        <div className="gm-field"><label>Product Name</label><input {...f('productName')} placeholder="Pochampally Ikat Saree" /></div>
        <div className="gm-field"><label>Category</label><input {...f('category')} placeholder="Saree, Toy, Pottery…" /></div>
        <div className="gm-field"><label>Year</label><input type="number" {...f('year')} /></div>
        <div className="gm-field"><label>Price (₹)</label><input type="number" {...f('priceInr')} /></div>
        <div className="gm-field"><label>Sold To / Exhibition</label><input {...f('soldTo')} placeholder="Buyer name or event" /></div>
        <div className="gm-field gm-field--full"><label>Description</label><textarea rows={3} {...f('description')} /></div>
        <div className="gm-field gm-field--full">
          <button className="gm-btn gm-btn--primary" onClick={submit} disabled={busy}>
            {busy ? 'Adding…' : '📦 Add Product Record'}
          </button>
        </div>
      </div>
      <div className="gm-section-title" style={{marginTop:24}}>Product History ({products.length})</div>
      <div className="gm-cards">
        {products.length === 0 && <p className="gm-empty">No product records yet.</p>}
        {products.map(p => (
          <div key={p._id} className="gm-card">
            <div className="gm-card__icon">📦</div>
            <div className="gm-card__info">
              <strong>{p.productName}</strong>
              <span>{p.category} · {p.year} · ₹{(p.priceInr||0).toLocaleString()}</span>
              {p.soldTo && <span className="gm-sold">→ {p.soldTo}</span>}
            </div>
            <button className="gm-card__del" onClick={()=>onDelete(`/products/${p._id}`)}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN GUILDMASTER PAGE
═══════════════════════════════════════════════════════════════════ */
export default function Guildmaster() {
  const [admin,      setAdmin]      = useState(() => {
    const t = localStorage.getItem(VAULT_KEY);
    return t ? { token: t } : null;
  });
  const [artisans,   setArtisans]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const loadArtisans = useCallback(async (p = page, s = search) => {
    setLoading(true);
    try {
      const d = await vaultFetch(`/artisans?page=${p}&limit=15&search=${encodeURIComponent(s)}`);
      setArtisans(d.artisans);
      setTotalPages(d.pages);
    } catch {}
    finally { setLoading(false); }
  }, [page, search]);

  const loadStats = useCallback(async () => {
    try { setStats(await vaultFetch('/stats')); } catch {}
  }, []);

  useEffect(() => {
    if (!admin) return;
    loadArtisans(1, '');
    loadStats();
  }, [admin]);

  const logout = () => {
    localStorage.removeItem(VAULT_KEY);
    setAdmin(null);
  };

  if (!admin) return <VaultLogin onLogin={setAdmin} />;
  if (selected) return (
    <ArtisanVaultDetail
      artisanId={selected}
      onBack={() => { setSelected(null); loadArtisans(); }}
      onRefresh={loadStats}
    />
  );

  return (
    <div className="gm">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="gm-sidebar">
        <div className="gm-sidebar__brand">
          <span className="gm-sidebar__lock">🔐</span>
          <div>
            <div className="gm-sidebar__title">CraftTrail Vault</div>
            <div className="gm-sidebar__sub">Admin Portal</div>
          </div>
        </div>

        {stats && (
          <div className="gm-sidebar__stats">
            {[
              ['Total Artisans', stats.total, '#6c63ff'],
              ['Verified (60+)', stats.verified, '#27ae60'],
              ['Demo Profiles', stats.demo, '#e67e22'],
              ['With Docs',     stats.withDocs, '#3498db'],
              ['With Certs',    stats.withCerts,'#9b59b6'],
              ['With Awards',   stats.withAwards,'#f39c12'],
            ].map(([label, val, color]) => (
              <div key={label} className="gm-sidebar__stat">
                <span className="gm-sidebar__stat-num" style={{color}}>{val}</span>
                <span className="gm-sidebar__stat-label">{label}</span>
              </div>
            ))}
          </div>
        )}

        <button className="gm-sidebar__logout" onClick={logout}>Sign Out →</button>
      </aside>

      {/* ── Main area ────────────────────────────────────────────── */}
      <main className="gm-main">
        <div className="gm-main__top">
          <div>
            <h1 className="gm-main__title">Artisan Registry</h1>
            <p className="gm-main__sub">Full profile management — documents, certificates, awards & product history</p>
          </div>
          <button className="gm-btn gm-btn--primary" onClick={() => setShowCreate(true)}>
            + New Artisan Profile
          </button>
        </div>

        {/* Search */}
        <div className="gm-search-row">
          <input
            className="gm-search"
            placeholder="🔍  Search by name or craft…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); loadArtisans(1, e.target.value); }}
          />
        </div>

        {/* Artisan table */}
        {loading ? (
          <div className="gm-loading">Loading artisans…</div>
        ) : (
          <div className="gm-table-wrap">
            <table className="gm-table">
              <thead>
                <tr>
                  <th>Artisan</th><th>Craft</th><th>Location</th>
                  <th>Trust</th><th>Docs</th><th>Certs</th><th>Awards</th><th></th>
                </tr>
              </thead>
              <tbody>
                {artisans.length === 0 && (
                  <tr><td colSpan={8} className="gm-empty">No artisans found.</td></tr>
                )}
                {artisans.map(a => (
                  <tr key={a._id} className="gm-table__row" onClick={() => setSelected(a._id)}>
                    <td>
                      <div className="gm-table__name-cell">
                        <div className="gm-table__avatar">{a.name?.[0]?.toUpperCase()}</div>
                        <span>{a.name}</span>
                      </div>
                    </td>
                    <td>{a.craft}</td>
                    <td className="gm-dim">{a.district}, {a.state}</td>
                    <td>
                      <span className={`gm-badge ${a.trustScore >= 60 ? 'gm-badge--green' : 'gm-badge--yellow'}`}>
                        {a.trustScore}
                      </span>
                    </td>
                    <td className="gm-center">{a.verificationDocs?.length || 0}</td>
                    <td className="gm-center">{a.certificates?.length || 0}</td>
                    <td className="gm-center">{a.awards?.length || 0}</td>
                    <td><button className="gm-btn gm-btn--ghost">Manage →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="gm-pagination">
              <button disabled={page <= 1} onClick={() => { setPage(p => p-1); loadArtisans(page-1); }}>← Prev</button>
              <span>Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => { setPage(p => p+1); loadArtisans(page+1); }}>Next →</button>
            </div>
          </div>
        )}
      </main>

      {/* Create artisan modal */}
      {showCreate && <CreateArtisanModal onClose={()=>setShowCreate(false)} onCreated={()=>{loadArtisans();loadStats();setShowCreate(false);}} />}
    </div>
  );
}

/* ── Create Artisan Modal ─────────────────────────────────────────── */
function CreateArtisanModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name:'', craft:'', phone:'', district:'', state:'', bio:'',
    languages:'Hindi', lat:'', lng:'',
  });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const f = k => ({ value:form[k], onChange:e=>setForm(p=>({...p,[k]:e.target.value})) });

  const submit = async () => {
    if (!form.name || !form.craft || !form.phone || !form.lat || !form.lng)
      return setErr('Name, craft, phone, lat and lng are required');
    setBusy(true); setErr('');
    try {
      await vaultFetch('/artisans', {
        method:'POST',
        body: JSON.stringify({
          ...form,
          languages: form.languages.split(',').map(s=>s.trim()),
          location: { type:'Point', coordinates:[parseFloat(form.lng), parseFloat(form.lat)] },
        }),
      });
      onCreated();
    } catch (ex) { setErr(ex.message); setBusy(false); }
  };

  return (
    <div className="gm-modal-overlay" onClick={onClose}>
      <div className="gm-modal" onClick={e=>e.stopPropagation()}>
        <div className="gm-modal__head">
          <h3>Create Artisan Profile</h3>
          <button className="gm-modal__close" onClick={onClose}>×</button>
        </div>
        <div className="gm-form-grid">
          <div className="gm-field"><label>Full Name *</label><input {...f('name')} /></div>
          <div className="gm-field"><label>Craft *</label><input {...f('craft')} /></div>
          <div className="gm-field"><label>Phone *</label><input {...f('phone')} /></div>
          <div className="gm-field"><label>District *</label><input {...f('district')} /></div>
          <div className="gm-field"><label>State *</label><input {...f('state')} /></div>
          <div className="gm-field"><label>Languages</label><input {...f('languages')} /></div>
          <div className="gm-field"><label>Latitude *</label><input {...f('lat')} placeholder="e.g. 17.385" /></div>
          <div className="gm-field"><label>Longitude *</label><input {...f('lng')} placeholder="e.g. 78.486" /></div>
          <div className="gm-field gm-field--full"><label>Bio</label><textarea rows={3} {...f('bio')} /></div>
        </div>
        {err && <div className="gm-msg gm-msg--err">{err}</div>}
        <div className="gm-modal__foot">
          <button className="gm-btn" onClick={onClose}>Cancel</button>
          <button className="gm-btn gm-btn--primary" onClick={submit} disabled={busy}>
            {busy ? 'Creating…' : 'Create Artisan'}
          </button>
        </div>
      </div>
    </div>
  );
}

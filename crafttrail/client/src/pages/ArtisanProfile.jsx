import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import TrustLadder from '../components/TrustLadder.jsx';
import Badge from '../components/Badge.jsx';
import AvailabilityPill from '../components/AvailabilityPill.jsx';
import BookingPanel from '../components/BookingPanel.jsx';
import WhatsAppSim from '../components/WhatsAppSim.jsx';
import RagChatbot from '../components/RagChatbot.jsx';
import ArtisanImageUpload from '../components/ArtisanImageUpload.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { inr, shortDate } from '../lib/format.js';
import './ArtisanProfile.css';

export default function ArtisanProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [a, setA]             = useState(null);
  const [audit, setAudit]     = useState([]);
  const [err, setErr]         = useState(null);
  const [saved,   setSaved]   = useState(false);
  const [visited, setVisited] = useState(false);
  const [actBusy, setActBusy] = useState(false);

  const load = () =>
    api
      .artisan(id)
      .then(setA)
      .catch((e) => setErr(e.message));

  useEffect(() => {
    load();
    api.audit(id).then((d) => setAudit(d.logs)).catch(() => {});
    // Load saved/visited status for logged-in users
    if (user) {
      api('/me/saved').then(d => {
        setSaved(d.saved?.some(a => a._id === id));
        setVisited(d.visited?.some(a => a._id === id));
      }).catch(() => {});
    }
  }, [id, user]);

  const toggleSave = async () => {
    if (!user || actBusy) return;
    setActBusy(true);
    try {
      if (saved) {
        await api.delete(`/me/saved/${id}`);
        setSaved(false);
      } else {
        await api.post(`/me/saved/${id}`);
        setSaved(true);
      }
    } catch {}
    setActBusy(false);
  };

  const markVisited = async () => {
    if (!user || actBusy || visited) return;
    setActBusy(true);
    try {
      await api.post(`/me/visited/${id}`);
      setVisited(true);
    } catch {}
    setActBusy(false);
  };

  if (err) return <div className="shell pad"><div className="notice notice-bad">{err}</div></div>;
  if (!a) return <div className="shell pad"><span className="spinner" /></div>;

  const t1 = a.verification.tier1;
  const endorsements = a.verification.tier2.endorsements || [];
  const passed = t1.status === 'PASS';

  return (
    <div className="shell profile">
      <Link to="/" className="back mono">← back to the map</Link>

      <div className="profile__grid">
        <main>
          <header className="ph">
            <div className="ph__row">
              <h1>{a.name}</h1>
              <Badge badge={a.badge} />
            </div>
            <p className="ph__craft">{a.craft}</p>
            <p className="ph__where mono">
              {a.cluster?.name} · {a.district}, {a.state}
            </p>
            <div className="ph__meta">
              <AvailabilityPill state={a.availability.state} source={a.availability.source} />
              <span className="ph__dot">·</span>
              <span className="ph__langs">{a.languages.join(', ')}</span>
            </div>

            {/* Save & Visited actions */}
            {user && (
              <div className="ph__actions">
                <button
                  className={`ph__action-btn ${saved ? 'is-saved' : ''}`}
                  onClick={toggleSave}
                  disabled={actBusy}
                  title={saved ? 'Remove from saved' : 'Save this artisan'}
                >
                  {saved ? '🔖 Saved' : '🔖 Save'}
                </button>
                <button
                  className={`ph__action-btn ${visited ? 'is-visited' : ''}`}
                  onClick={markVisited}
                  disabled={actBusy || visited}
                  title={visited ? 'Already marked as visited' : 'Mark as visited'}
                >
                  {visited ? '✅ Visited' : '📍 Mark Visited'}
                </button>
              </div>
            )}
          </header>

          <p className="ph__bio">{a.bio}</p>

          {a.cluster?.heritageNote && (
            <blockquote className="heritage">
              {a.cluster.heritageNote}
              <cite className="mono">{a.cluster.name}</cite>
            </blockquote>
          )}

          {/*
            The reasoning chain, not a green tick. If Tier 1 failed, we show
            exactly which check failed and why. That transparency IS the pitch.
          */}
          <section className="panel">
            <span className="eyebrow">Tier 1 — what the document check found</span>
            <div className={`chain ${passed ? '' : 'is-failed'}`}>
              <Check ok={t1.formatValid} label="Document number readable">
                {t1.docType ? `${t1.docType} · ${t1.docNumber}` : 'No recognisable card number'}
              </Check>
              <Check ok={t1.giFound} label="Craft found in GI registry">
                {t1.claimedGi || 'No craft claim detected'}
              </Check>
              <Check ok={t1.giDistrictMatch} label="Craft registered to this district">
                {t1.giDistrictMatch
                  ? `${a.district}, ${a.state}`
                  : t1.reason.split('·').pop().trim()}
              </Check>
            </div>
            <p className="chain__foot">
              OCR confidence {t1.ocrConfidence}% · checked {t1.checkedAt ? shortDate(t1.checkedAt) : '—'}
            </p>
            {!passed && (
              <div className="notice notice-bad" style={{ marginTop: 12 }}>
                This artisan is not verified. Tier 1 proves a claim is consistent with the GI
                registry — it cannot be bought, and it cannot be argued with.
              </div>
            )}
          </section>

          <section className="panel">
            <span className="eyebrow">Tier 2 — who vouched, in person</span>
            {endorsements.length === 0 ? (
              <p className="muted">
                No institution has corroborated this artisan yet. Their score is capped at 40.
              </p>
            ) : (
              <ul className="endorsers">
                {endorsements.map((e, i) => (
                  <li key={i}>
                    <div>
                      <strong>{e.verifier?.name}</strong>
                      <span className="mono etype">{e.verifier?.type?.replace('_', ' ')}</span>
                    </div>
                    <span className="mono erate">
                      verifier accuracy {e.verifier?.accuracyRating}/5
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <span className="eyebrow">Audit trail</span>
            <ul className="audit">
              {audit.slice(0, 6).map((l) => (
                <li key={l._id}>
                  <span className="mono audit__t">{shortDate(l.at)}</span>
                  <span className="audit__a">{l.action.replaceAll('_', ' ').toLowerCase()}</span>
                  <span className="mono audit__by">{l.actorType.toLowerCase()}</span>
                </li>
              ))}
              {audit.length === 0 && <li className="muted">No entries yet.</li>}
            </ul>
          </section>
        </main>

        <aside className="profile__side">
          <div className="card pad-card">
            <TrustLadder artisan={a} />
          </div>

          {a.workshop?.priceInr > 0 && (
            <div className="card pad-card">
              <span className="eyebrow">Workshop</span>
              <h3 className="ws__title">{a.workshop.title}</h3>
              <p className="ws__meta mono">
                {a.workshop.durationMins} min · up to {a.workshop.capacity} people
              </p>
              <p className="ws__price">{inr(a.workshop.priceInr)}<span> per person</span></p>
              <BookingPanel artisan={a} onChanged={load} />
            </div>
          )}

          <WhatsAppSim artisan={a} onChanged={load} />

          {/* Artisan Photos — workplace & product images */}
          <div className="card pad-card">
            <ArtisanImageUpload artisanId={a._id} existingPhotos={a.photos || []} />
          </div>

          {/* AI Chatbot — powered by RAG (Groq + ChromaDB) */}
          <div className="card pad-card">
            <span className="eyebrow" style={{ display: 'block', marginBottom: 12 }}>Ask CraftBot about this artisan</span>
            <div style={{ height: 460 }}>
              <RagChatbot
                artisanName={a.name}
                context={`Artisan: ${a.name}\nCraft: ${a.craft}\nLocation: ${a.cluster?.name || ''}, ${a.district}, ${a.state}\nBio: ${a.bio || ''}\nAvailability: ${a.availability?.state || ''}\nTrust score: ${a.trustScore}/100\nHeritage: ${a.cluster?.heritageNote || ''}\nWorkshop: ${a.workshop?.title || 'N/A'}, ${a.workshop?.durationMins || ''}min, ₹${a.workshop?.priceInr || 'N/A'} per person\nLanguages: ${a.languages?.join(', ') || ''}`}
              />
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}

function Check({ ok, label, children }) {
  return (
    <div className={`check ${ok ? 'is-ok' : 'is-no'}`}>
      <span className="check__mark">{ok ? '✓' : '✕'}</span>
      <div>
        <div className="check__label">{label}</div>
        <div className="check__val mono">{children}</div>
      </div>
    </div>
  );
}

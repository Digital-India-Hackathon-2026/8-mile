import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapView from '../components/MapView.jsx';
import StateDetailModal from '../components/StateDetailModal.jsx';
import RagChatbot from '../components/RagChatbot.jsx';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { CITIES, FACTS, TIERS } from '../lib/constants.js';
import './Landing.css';

const STATES = [
  { key: 'telangana', name: 'Telangana',        craft: 'Pochampally Ikat & Gadwal sarees',     swatch: 'ikat' },
  { key: 'ap',        name: 'Andhra Pradesh',    craft: 'Kalamkari & Kondapalli toys',           swatch: 'kalamkari' },
  { key: 'rajasthan', name: 'Rajasthan',         craft: 'Block printing & Blue pottery',         swatch: 'blockprint' },
  { key: 'gujarat',   name: 'Gujarat',           craft: 'Bandhani & Patola weaving',             swatch: 'bandhani' },
  { key: 'karnataka', name: 'Karnataka',         craft: 'Mysore silk & Channapatna toys',        swatch: 'silk' },
  { key: 'tn',        name: 'Tamil Nadu',        craft: 'Kanchipuram silk & Bronze casting',     swatch: 'bronze' },
  { key: 'wb',        name: 'West Bengal',       craft: 'Kantha embroidery & Terracotta',        swatch: 'kantha' },
  { key: 'odisha',    name: 'Odisha',            craft: 'Pattachitra & Sambalpuri Ikat',         swatch: 'pattachitra' },
  { key: 'up',        name: 'Uttar Pradesh',     craft: 'Banarasi silk & Chikankari',            swatch: 'chikankari' },
  { key: 'mp',        name: 'Madhya Pradesh',    craft: 'Gond art & Chanderi weaving',           swatch: 'gond' },
  { key: 'bihar',     name: 'Bihar',             craft: 'Madhubani painting & Sikki grass craft',swatch: 'madhubani' },
  { key: 'assam',     name: 'Assam',             craft: 'Muga silk & Bamboo crafts',             swatch: 'muga' },
  { key: 'kerala',    name: 'Kerala',            craft: 'Coir weaving & Aranmula mirrors',       swatch: 'coir' },
  { key: 'jk',        name: 'Jammu & Kashmir',   craft: 'Pashmina & Papier-mâché',               swatch: 'pashmina' },
  { key: 'punjab',    name: 'Punjab',            craft: 'Phulkari embroidery & Punjabi Jutti',   swatch: 'phulkari' },
  { key: 'hp',        name: 'Himachal Pradesh',  craft: 'Kullu shawls & Chamba Rumal',           swatch: 'kullu' },
];

function HandloomIllustration() {
  return (
    <svg viewBox="0 0 400 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of a handloom weaving a saree">
      <defs>
        <linearGradient id="fabricGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0492e" />
          <stop offset="100%" stopColor="#a83c24" />
        </linearGradient>
      </defs>

      <rect x="30" y="40" width="340" height="18" rx="4" fill="#1f2a44" />
      <rect x="30" y="300" width="340" height="18" rx="4" fill="#1f2a44" />
      <rect x="30" y="40" width="18" height="278" rx="4" fill="#1f2a44" />
      <rect x="352" y="40" width="18" height="278" rx="4" fill="#1f2a44" />

      <rect x="55" y="52" width="290" height="10" rx="5" fill="#3a4568" />
      <rect x="55" y="298" width="290" height="10" rx="5" fill="#3a4568" />

      {Array.from({ length: 27 }).map((_, i) => (
        <line key={i} x1={58 + i * 11} y1={62} x2={58 + i * 11} y2={298} stroke="#e4dcc8" strokeWidth="1.4" />
      ))}

      <rect x="55" y="230" width="290" height="68" fill="url(#fabricGrad)" />
      <rect x="55" y="210" width="290" height="14" fill="#1f2a44" />
      <rect x="55" y="196" width="290" height="10" fill="#c8a24a" />
      <rect x="55" y="180" width="290" height="12" fill="#c0492e" opacity="0.85" />

      {Array.from({ length: 13 }).map((_, i) => (
        <path key={i} d={`M ${70 + i * 22} 296 l 8 -12 l 8 12 z`} fill="#c8a24a" />
      ))}

      <rect x="48" y="150" width="304" height="8" rx="3" fill="#3a4568" />

      <ellipse cx="200" cy="154" rx="26" ry="7" fill="#8a3320" transform="rotate(-6 200 154)" />
      <ellipse cx="200" cy="154" rx="18" ry="3.5" fill="#c8a24a" transform="rotate(-6 200 154)" />

      <circle cx="20" cy="330" r="16" fill="#c0492e" />
      <circle cx="20" cy="330" r="16" fill="none" stroke="#1f2a44" strokeWidth="2" />
      <path d="M 20 330 Q 40 310 60 320" stroke="#c8a24a" strokeWidth="2" fill="none" />

      <circle cx="380" cy="330" r="16" fill="#c8a24a" />
      <circle cx="380" cy="330" r="16" fill="none" stroke="#1f2a44" strokeWidth="2" />
      <path d="M 380 330 Q 360 310 340 320" stroke="#c0492e" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Login-gated state card carousel */
function ShopByState({ user, onStateClick }) {
  const loop = [...STATES, ...STATES];

  return (
    <section className="lp__states">
      <div className="shell lp__statesHead">
        <span className="eyebrow">Shop by state</span>
        <h2>Every region weaves differently.</h2>
        {user ? (
          <div className="lp__states-unlocked">
            <span className="lp__unlock-badge">✅ Logged in — Click any state to explore heritage + AI chatbot</span>
          </div>
        ) : (
          <p className="lp__lede">Click a state to explore its heritage details.</p>
        )}
      </div>

      <div className="states-viewport">
        <div className="states-track">
          {loop.map((s, i) => {
            const cardUniqueId = `${s.key}-${i}`;
            return (
              <article
                className={`state-card swatch--${s.swatch} ${user ? 'is-unlocked' : ''}`}
                key={cardUniqueId}
                onClick={() => onStateClick(s.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onStateClick(s.key)}
                aria-label={`Explore ${s.name} heritage`}
              >
                <div className="state-card__pattern" aria-hidden="true" />
                <div className="state-card__label">
                  <span className="state-card__name">{s.name}</span>
                  <span className="state-card__craft">{s.craft}</span>
                </div>
                {user ? (
                  <div className="state-card__ai-hint" aria-hidden="true">
                    🤖 AI Guide
                  </div>
                ) : (
                  <div className="state-card__login-hint" aria-hidden="true">
                    🔒 Sign in to explore
                  </div>
                )}
              </article>
            );
          })}

        </div>
      </div>
    </section>
  );
}

/** Floating RAG chat button for the landing page */
function FloatingRagBot() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 800, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
      {open && (
        <div style={{ width: 360, height: 520, borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.28)', animation: 'cbot-panel-in 0.25s cubic-bezier(0.22,1,0.36,1)' }}>
          <RagChatbot />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close CraftBot' : 'Open CraftBot'}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg,#c0492e,#8f2c1b)',
            border: 'none', cursor: 'pointer', color: '#fff',
            fontSize: open ? '1.4rem' : '1.6rem',
            boxShadow: '0 4px 20px rgba(192,73,46,0.45)',
            display: 'grid', placeItems: 'center',
            transition: 'transform 0.2s, background 0.2s',
          }}
        >
          {open ? '×' : '🤖'}
        </button>
        <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#888' }}>
          CraftBot AI
        </span>
      </div>
    </div>
  );
}

/** Login-required modal — shows inline before redirect */
function LoginPromptModal({ stateName, onClose, onContinue }) {
  return (
    <div className="lpm__overlay" onClick={onClose}>
      <div className="lpm__box" onClick={e => e.stopPropagation()}>
        <button className="lpm__close" onClick={onClose}>×</button>
        <div className="lpm__icon">🔐</div>
        <h3>Sign in to explore {stateName}</h3>
        <p>Discover {stateName}'s heritage crafts, culture, GI-tagged products, and chat with our AI guide — all after a quick sign-in.</p>
        <div className="lpm__actions">
          <button className="btn btn-primary lpm__wide" onClick={onContinue}>
            Sign in &amp; explore {stateName} →
          </button>
          <Link className="btn lpm__wide" to="/signup" onClick={onClose}>
            Create free account
          </Link>
        </div>
        <p className="lpm__fine">Free account. Takes 30 seconds. No spam ever.</p>
      </div>
    </div>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [city] = useState(CITIES[0]);
  const [clusters, setClusters] = useState([]);
  const [crafts, setCrafts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // State modal state
  const [loginPrompt, setLoginPrompt] = useState(null);   // { key, name } while showing login gate
  const [activeState, setActiveState]  = useState(null);  // key while showing detail modal

  useEffect(() => {
    api.discover({ lat: city.lat, lng: city.lng, radiusKm: 150 })
      .then((d) => setClusters(d.clusters))
      .catch(() => setClusters([]));
    api.crafts().then((d) => setCrafts(d.crafts)).catch(() => {});
  }, [city]);

  // Request real GPS location for the landing map
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}  // silently ignore denied — the map works without it
    );
  }, []);

  // After login, reopen the pending state if saved
  useEffect(() => {
    if (!user) return;
    const pending = sessionStorage.getItem('crafttrail_pending_state');
    if (pending) {
      sessionStorage.removeItem('crafttrail_pending_state');
      setActiveState(pending);
    }
  }, [user]);

  const handleStateClick = useCallback((stateKey) => {
    if (user) {
      // Logged in — open detail modal immediately
      setActiveState(stateKey);
    } else {
      // Not logged in — show login prompt
      const s = STATES.find(s => s.key === stateKey);
      setLoginPrompt({ key: stateKey, name: s?.name || stateKey });
    }
  }, [user]);

  const handleLoginContinue = useCallback(() => {
    if (!loginPrompt) return;
    // Save the state key so we can reopen after login
    sessionStorage.setItem('crafttrail_pending_state', loginPrompt.key);
    navigate('/signin', { state: { from: '/' } });
    setLoginPrompt(null);
  }, [loginPrompt, navigate]);

  if (loading) return null;

  return (
    <div className="lp">
      <section className="lp__hero shell">
        <div className="lp__copy">
          <span className="eyebrow">India's craft clusters, made findable</span>
          <h1>
            You are thirty kilometres from a village that has been
            printing cloth for <span className="script">three hundred years</span>.
          </h1>
          <p className="lp__sub">
            You have never heard of Bagru. That is not your fault — a search engine only
            finds what you can already name. CraftTrail shows you the craft villages around
            you, tells you who is verified, and lets you knock on the door.
          </p>

          <div className="lp__cta">
            {user ? (
              <>
                <Link className="btn btn-primary" to="/home">Explore craft clusters</Link>
                <Link className="btn" to="/discover">Discover map</Link>
              </>
            ) : (
              <>
                <Link className="btn btn-primary" to="/signup">Create an account</Link>
                <Link className="btn" to="/discover">Look around first</Link>
              </>
            )}
          </div>
          {!user && (
            <p className="lp__fine">
              Browsing needs no account. Booking a visit does — the artisan deserves to know
              who is coming.
            </p>
          )}
          {user && (
            <p className="lp__fine lp__fine--welcome">
              Welcome back! Click any state card below to explore its heritage &amp; chat with the AI guide.
            </p>
          )}
        </div>

        <div className="lp__loom card">
          <HandloomIllustration />
          <p className="lp__maphint mono">A saree, mid-weave — Bagru handloom cluster</p>
        </div>
      </section>

      <section className="lp__facts">
        <div className="shell lp__factrow">
          {FACTS.map((f) => (
            <div className="fact" key={f.label}>
              <span className="fact__v">{f.value}</span>
              <span className="fact__l">{f.label}</span>
            </div>
          ))}
        </div>
        <p className="shell lp__factnote">
          The Government of India issues Pehchan cards, protects 500+ GI products and maps
          744 clusters. None of it is exposed to the people who would visit.
        </p>
      </section>

      <section className="lp__mapsection">
        <div className="shell lp__mapsectionHead">
          <span className="eyebrow">What's actually near you</span>
          <h2>The map is real, not decoration.</h2>
          <p className="lp__lede">
            Every pin below is a documented cluster within reach of {city.name}.
            {userLocation && ' 🔵 Blue dot = your location.'}
          </p>
        </div>

        <div className="lp__map card lp__map--full">
          <MapView
            origin={{ lat: city.lat, lng: city.lng }}
            radiusKm={150}
            clusters={clusters}
            activeId={null}
            onSelect={() => {}}
            userLocation={userLocation}
            portraitMobile
          />
          <p className="lp__maphint mono">
            {clusters.length
              ? `${clusters.length} clusters within 150 km of ${city.name}`
              : 'Start the API and run npm run seed to populate the map'}
          </p>
        </div>
      </section>

      <ShopByState user={user} onStateClick={handleStateClick} />

      <section className="lp__trust shell">
        <span className="eyebrow">How a badge is earned</span>
        <h2>Trust you can <span className="script">take apart</span>.</h2>
        <p className="lp__lede">
          Three layers, each with a ceiling the one below cannot break through. Every artisan
          profile shows you the reasoning, not a green tick.
        </p>

        <div className="tiers">
          {TIERS.map((t, i) => (
            <article className="tier" key={t.key}>
              <span className="tier__cap mono">{t.ceilingAt}</span>
              <h3>{t.name}</h3>
              <p className="tier__detail">{t.detail}</p>
              <p className="tier__ceiling mono">
                {i < 2 ? t.ceiling : 'Real visits only.'}
              </p>
            </article>
          ))}
        </div>
      </section>

      {crafts.length > 0 && (
        <section className="lp__crafts shell">
          <span className="eyebrow">Every tradition has a district</span>
          <h2>Explore by craft</h2>
          <div className="chips">
            {crafts.slice(0, 14).map((c) => (
              <Link key={c} className="chip" to={`/discover?crafts=${encodeURIComponent(c)}`}>{c}</Link>
            ))}
          </div>
        </section>
      )}

      <section className="lp__artisans shell">
        <div className="artcard card">
          <div>
            <span className="eyebrow">For cluster offices and NGOs</span>
            <h2>Artisans never sign up.</h2>
            <p className="lp__lede">
              A block printer in Bagru is not going to manage a dashboard. Field records collected
              by NGOs and cluster offices are entered by state tourism staff, and availability
              arrives over WhatsApp — the channel artisans already use.
            </p>
          </div>
          <div className="artcard__facts">
            <div><strong>95%</strong><span>of every booking reaches the artisan</span></div>
            <div><strong>5%</strong><span>sustains the SHG that vouched for them</span></div>
            <div><strong>0</strong><span>apps an artisan has to install</span></div>
          </div>
        </div>
      </section>

      <footer className="lp__foot">
        <div className="shell lp__footin">
          <div>
            <p className="lp__brand">CraftTrail</p>
            <p className="lp__tagline">Built for the Digital India hackathon. Honest about what is real.</p>
          </div>
          <nav className="lp__links">
            <Link to="/discover">Discover</Link>
            <Link to="/signin">Log in</Link>
            <Link to="/signup">Join free</Link>
          </nav>
        </div>
      </footer>

      {/* ── Login prompt modal ───────────────────────────────────────── */}
      {loginPrompt && (
        <LoginPromptModal
          stateName={loginPrompt.name}
          onClose={() => setLoginPrompt(null)}
          onContinue={handleLoginContinue}
        />
      )}

      {/* ── State detail modal (shown after login) ───────────────────── */}
      {activeState && (
        <StateDetailModal
          stateKey={activeState}
          onClose={() => setActiveState(null)}
        />
      )}

      {/* ── Floating global AI chatbot (RAG) ─────────────────────────── */}
      <FloatingRagBot />
    </div>
  );
}
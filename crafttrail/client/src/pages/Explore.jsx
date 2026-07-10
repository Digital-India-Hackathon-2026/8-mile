import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import MapView from '../components/MapView.jsx';
import ArtisanCard from '../components/ArtisanCard.jsx';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { CITIES, SORTS } from '../lib/constants.js';
import { locate, nearestCity } from '../lib/geo.js';
import { firstName } from '../lib/format.js';
import './Explore.css';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * One component, two routes.
 *
 *   /discover  personalised={false}  public, browsable, no account
 *   /home      personalised={true}   welcome card, saved interests, geolocation
 *
 * Now fetches BOTH cluster-based artisans (nearby) AND standalone artisans
 * (seeded / vault-created) so all artisans appear in the list and on the map.
 */
export default function Explore({ personalised = false }) {
  const { user, updatePrefs } = useAuth();
  const [params, setParams] = useSearchParams();

  const [city, setCity] = useState(CITIES[0]);
  const [locating, setLocating] = useState(personalised);
  const [locNote, setLocNote] = useState(null);

  const [radiusKm, setRadiusKm] = useState(150);
  const [sort, setSort] = useState('relevance');
  const [searchQ, setSearchQ] = useState('');
  const [interests, setInterests] = useState(() => {
    const q = params.get('crafts');
    return q ? q.split(',') : [];
  });

  const [allCrafts, setAllCrafts] = useState([]);
  const [states, setStates] = useState([]);
  const [data, setData] = useState(null);               // cluster-based result
  const [standaloneArtisans, setStandaloneArtisans] = useState([]); // direct search
  const [activeId, setActiveId] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.crafts().then((d) => setAllCrafts(d.crafts)).catch(() => {});
    api.states().then((d) => setStates(d.states)).catch(() => {});
  }, []);

  // Location resolution: saved home city → geolocation → Jaipur.
  useEffect(() => {
    if (!personalised) return;
    let dead = false;

    if (user?.homeCity?.lat) {
      setCity(user.homeCity);
      setLocating(false);
      return () => { dead = true; };
    }
    if (user?.interests?.length && !interests.length) setInterests(user.interests);

    locate().then((pos) => {
      if (dead) return;
      if (pos) {
        const near = nearestCity(pos);
        setCity(near);
        updatePrefs?.({ homeCity: near }).catch(() => {});
      } else {
        setLocNote('We could not read your location, so we started in Jaipur. Pick a city below.');
      }
      setLocating(false);
    });
    return () => { dead = true; };
  }, [personalised, user]);

  // Fetch cluster-based artisans (geo query)
  useEffect(() => {
    let dead = false;
    setLoading(true);
    setErr(null);
    api
      .discover({ lat: city.lat, lng: city.lng, radiusKm, crafts: interests, sort })
      .then((d) => !dead && setData(d))
      .catch((e) => !dead && setErr(e.message))
      .finally(() => !dead && setLoading(false));
    return () => { dead = true; };
  }, [city, radiusKm, interests, sort]);

  // Fetch standalone artisans using /discover/search (no cluster required)
  useEffect(() => {
    let dead = false;
    const qs = new URLSearchParams({ limit: '40', q: searchQ });
    if (city.state) qs.set('state', city.state);
    if (interests.length === 1) qs.set('craft', interests[0]);

    fetch(`${BASE}/discover/search?${qs}`)
      .then(r => r.json())
      .then(d => !dead && setStandaloneArtisans(d.artisans || []))
      .catch(() => {});
    return () => { dead = true; };
  }, [city, interests, searchQ]);

  const toggleCraft = useCallback(
    (craft) => {
      const next = interests.includes(craft) ? interests.filter((c) => c !== craft) : [...interests, craft];
      setInterests(next);
      setParams(next.length ? { crafts: next.join(',') } : {}, { replace: true });
      if (user) updatePrefs?.({ interests: next }).catch(() => {});
    },
    [interests, user, setParams, updatePrefs]
  );

  // Flatten cluster.artisans into one ranked list for the right column.
  const clusterArtisans = useMemo(() => {
    if (!data) return [];
    const rows = data.clusters.flatMap((c) => (c.artisans || []).map((a) => ({ artisan: a, cluster: c })));
    if (sort === 'distance') rows.sort((x, y) => x.cluster.distanceKm - y.cluster.distanceKm);
    else if (sort === 'availability') {
      const rank = { AVAILABLE: 0, REQUEST_AND_CONFIRM: 1, UNAVAILABLE: 2 };
      rows.sort((x, y) => rank[x.artisan.availability] - rank[y.artisan.availability] || y.artisan.trustScore - x.artisan.trustScore);
    } else rows.sort((x, y) => y.cluster.score - x.cluster.score || y.artisan.trustScore - x.artisan.trustScore);
    return rows;
  }, [data, sort]);

  // Standalone artisans — those NOT already shown via a cluster
  const clusterArtisanIds = useMemo(
    () => new Set(clusterArtisans.map(r => String(r.artisan.id))),
    [clusterArtisans]
  );
  const extraArtisans = useMemo(
    () => standaloneArtisans.filter(a => !clusterArtisanIds.has(String(a.id))),
    [standaloneArtisans, clusterArtisanIds]
  );

  const totalArtisans = clusterArtisans.length + extraArtisans.length;
  const empty = !loading && !err && totalArtisans === 0;
  const emptyBecauseFilter = empty && interests.length > 0;
  const emptyBecauseNoSeed = empty && interests.length === 0 && radiusKm >= 150;

  return (
    <div className="ex">
      <header className="ex__head shell">
        {personalised && user ? (
          <div className="welcome card">
            <span className="eyebrow">Welcome back</span>
            <h1>
              Hello, <span className="script">{firstName(user.name)}</span>
            </h1>
            <p className="welcome__sub">
              {locating ? 'Finding where you are…' : `Places you can visit around ${city.name}.`}
            </p>
          </div>
        ) : (
          <div className="ex__intro">
            <span className="eyebrow">Standing in {city.name}</span>
            <h1>
              {loading ? '—' : data?.unknownUnknowns ?? 0} craft villages within {radiusKm} km
              you would never have <span className="script">searched for</span>.
            </h1>
          </div>
        )}

        {locNote && <div className="notice ex__locnote">{locNote}</div>}

        <div className="ex__controls">
          <label className="ctl">
            <span className="eyebrow">State</span>
            <select
              className="select"
              value={city.name}
              onChange={(e) => {
                const c = CITIES.find((x) => x.name === e.target.value);
                setCity(c);
                if (user) updatePrefs?.({ homeCity: c }).catch(() => {});
              }}
            >
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} — {c.state}
                </option>
              ))}
            </select>
          </label>

          {/* ── Artisan Search Box ─────────────────────────────────── */}
          <label className="ctl">
            <span className="eyebrow">Search Artisan</span>
            <input
              type="text"
              className="select"
              placeholder="Name, craft, district…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              style={{ fontFamily: 'inherit' }}
            />
          </label>

          <label className="ctl">
            <span className="eyebrow">Sort by</span>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </label>

          <label className="ctl ctl--radius">
            <span className="eyebrow">Radius · {radiusKm} km</span>
            <input type="range" min="25" max="500" step="25" value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))} />
          </label>
        </div>

        {allCrafts.length > 0 && (
          <div className="ex__interests">
            <span className="eyebrow">Interested in</span>
            <div className="ex__chips">
              {allCrafts.map((c) => (
                <button
                  key={c}
                  className={`ichip ${interests.includes(c) ? 'is-on' : ''}`}
                  aria-pressed={interests.includes(c)}
                  onClick={() => toggleCraft(c)}
                >
                  {c}
                </button>
              ))}
              {interests.length > 0 && (
                <button className="ichip ichip--clear" onClick={() => { setInterests([]); setParams({}, { replace: true }); }}>
                  Clear {interests.length}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="ex__board shell">
        <div className="ex__map card">
          {data && (
            <MapView
              origin={{ lat: city.lat, lng: city.lng }}
              radiusKm={radiusKm}
              clusters={data.clusters}
              standaloneArtisans={extraArtisans}
              activeId={activeId}
              onSelect={setActiveId}
              showArtisans
              onArtisan={setActiveId}
            />
          )}
        </div>

        <aside className="ex__list">
          <div className="ex__count">
            {loading ? (
              <span className="ex__loading"><span className="spinner" /> Ranking by distance and significance…</span>
            ) : (
              <span>
                <strong>{totalArtisans}</strong> artisan{totalArtisans === 1 ? '' : 's'} ·{' '}
                <strong>{data?.clusters.length ?? 0}</strong> cluster{data?.clusters.length === 1 ? '' : 's'}
                {interests.length > 0 && ` · ${interests.length} craft${interests.length === 1 ? '' : 's'} you follow`}
                {extraArtisans.length > 0 && ` · ${extraArtisans.length} independent artisan${extraArtisans.length === 1 ? '' : 's'}`}
              </span>
            )}
          </div>

          {err && (
            <div className="notice notice-bad">
              Cannot reach the API. Start the server on port 5000, then reload. <br />
              <span className="mono">{err}</span>
            </div>
          )}

          {emptyBecauseNoSeed && (
            <div className="notice notice-bad">
              No artisans found. Try widening the radius or searching by name.
            </div>
          )}

          {emptyBecauseFilter && (
            <div className="notice">
              Nothing nearby matches those crafts. Clear the filter, or widen the radius — the real
              clusters are usually 30–60 km outside the city.
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-sm" onClick={() => { setInterests([]); setParams({}, { replace: true }); }}>
                  Clear filter
                </button>
              </div>
            </div>
          )}

          {/* Cluster-linked artisans */}
          {!loading &&
            clusterArtisans.map(({ artisan, cluster }) => (
              <ArtisanCard
                key={artisan.id}
                artisan={artisan}
                cluster={cluster}
                active={activeId === artisan.id || activeId === cluster.id}
                onHover={setActiveId}
              />
            ))}

          {/* Standalone artisans (seeded / vault-created, no cluster) */}
          {extraArtisans.length > 0 && (
            <>
              {clusterArtisans.length > 0 && (
                <div className="ex__divider">
                  <span>Independent Artisans</span>
                </div>
              )}
              {extraArtisans.map((artisan) => (
                <ArtisanCard
                  key={artisan.id}
                  artisan={artisan}
                  cluster={null}
                  active={activeId === artisan.id}
                  onHover={setActiveId}
                />
              ))}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

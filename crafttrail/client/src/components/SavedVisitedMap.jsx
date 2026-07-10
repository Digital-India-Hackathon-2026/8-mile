import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayerGroup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import './SavedVisitedMap.css';

const INDIA_CENTER = [22.5, 82.5];
const SERVER = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function SavedVisitedMap() {
  const [data,    setData]    = useState({ saved: [], visited: [] });
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all'); // 'all' | 'saved' | 'visited'

  useEffect(() => {
    api('/me/saved')
      .then(setData)
      .catch(() => setData({ saved: [], visited: [] }))
      .finally(() => setLoading(false));
  }, []);

  const savedIds   = new Set(data.saved.map(a => a._id));
  const visitedIds = new Set(data.visited.map(a => a._id));

  // Merge & deduplicate
  const all = [
    ...data.visited.map(a => ({ ...a, status: 'visited' })),
    ...data.saved
      .filter(a => !visitedIds.has(a._id))
      .map(a => ({ ...a, status: 'saved' })),
  ];

  const shown = filter === 'all'
    ? all
    : all.filter(a => a.status === filter);

  const totalSaved   = data.saved.length;
  const totalVisited = data.visited.length;

  if (loading) {
    return (
      <div className="svm__loading">
        <div className="svm__spinner" />
        <span>Loading your craft journey map…</span>
      </div>
    );
  }

  return (
    <div className="svm">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="svm__header">
        <div className="svm__header-left">
          <h2 className="svm__title">🗺️ My Craft Journey</h2>
          <p className="svm__sub">Your saved and visited artisan locations across India</p>
        </div>
        <div className="svm__stats">
          <div className="svm__stat">
            <span className="svm__stat-num" style={{ color: '#e67e22' }}>{totalSaved}</span>
            <span className="svm__stat-label">Saved</span>
          </div>
          <div className="svm__stat">
            <span className="svm__stat-num" style={{ color: '#27ae60' }}>{totalVisited}</span>
            <span className="svm__stat-label">Visited</span>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────── */}
      <div className="svm__filters">
        {[['all', '🌐 All'], ['saved', '🔖 Saved'], ['visited', '✅ Visited']].map(([val, label]) => (
          <button
            key={val}
            className={`svm__filter-btn ${filter === val ? 'is-active' : ''}`}
            onClick={() => setFilter(val)}
          >
            {label}
          </button>
        ))}
      </div>

      {all.length === 0 ? (
        <div className="svm__empty">
          <div className="svm__empty-icon">📍</div>
          <h3>No locations yet</h3>
          <p>Explore artisans and save or visit them — they'll appear here on your personal craft journey map!</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
            Explore India's Crafts
          </Link>
        </div>
      ) : (
        <div className="svm__body">
          {/* ── Leaflet Map ─────────────────────────────────────── */}
          <div className="svm__map-wrap">
            <MapContainer
              center={INDIA_CENTER}
              zoom={5}
              className="svm__map"
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Saved artisans — orange circles */}
              <LayerGroup>
                {(filter === 'all' || filter === 'saved') &&
                  data.saved
                    .filter(a => a.location?.coordinates?.length === 2)
                    .map(a => (
                      <CircleMarker
                        key={`saved-${a._id}`}
                        center={[a.location.coordinates[1], a.location.coordinates[0]]}
                        radius={10}
                        pathOptions={{ color: '#e67e22', fillColor: '#f39c12', fillOpacity: 0.85, weight: 2 }}
                      >
                        <Popup className="svm__popup">
                          <div className="svm__popup-content">
                            {a.photos?.[0] && (
                              <img
                                src={a.photos[0].startsWith('http') ? a.photos[0] : `${SERVER}${a.photos[0]}`}
                                alt={a.name}
                                className="svm__popup-img"
                              />
                            )}
                            <div className="svm__popup-tag svm__popup-tag--saved">🔖 Saved</div>
                            <strong className="svm__popup-name">{a.name}</strong>
                            <span className="svm__popup-craft">{a.craft}</span>
                            <span className="svm__popup-loc">📍 {a.district}, {a.state}</span>
                            <Link to={`/artisan/${a._id}`} className="svm__popup-link">View Profile →</Link>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))
                }
              </LayerGroup>

              {/* Visited artisans — green circles */}
              <LayerGroup>
                {(filter === 'all' || filter === 'visited') &&
                  data.visited
                    .filter(a => a.location?.coordinates?.length === 2)
                    .map(a => (
                      <CircleMarker
                        key={`visited-${a._id}`}
                        center={[a.location.coordinates[1], a.location.coordinates[0]]}
                        radius={12}
                        pathOptions={{ color: '#27ae60', fillColor: '#2ecc71', fillOpacity: 0.9, weight: 2.5 }}
                      >
                        <Popup className="svm__popup">
                          <div className="svm__popup-content">
                            {a.photos?.[0] && (
                              <img
                                src={a.photos[0].startsWith('http') ? a.photos[0] : `${SERVER}${a.photos[0]}`}
                                alt={a.name}
                                className="svm__popup-img"
                              />
                            )}
                            <div className="svm__popup-tag svm__popup-tag--visited">✅ Visited</div>
                            <strong className="svm__popup-name">{a.name}</strong>
                            <span className="svm__popup-craft">{a.craft}</span>
                            <span className="svm__popup-loc">📍 {a.district}, {a.state}</span>
                            <Link to={`/artisan/${a._id}`} className="svm__popup-link">View Profile →</Link>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))
                }
              </LayerGroup>
            </MapContainer>

            {/* Legend */}
            <div className="svm__legend">
              <div className="svm__legend-item">
                <span className="svm__legend-dot" style={{ background: '#f39c12' }} />
                Saved
              </div>
              <div className="svm__legend-item">
                <span className="svm__legend-dot" style={{ background: '#2ecc71' }} />
                Visited
              </div>
            </div>
          </div>

          {/* ── Artisan list sidebar ─────────────────────────────── */}
          <div className="svm__list">
            {shown.map(a => (
              <Link key={a._id} to={`/artisan/${a._id}`} className="svm__list-item">
                <div
                  className="svm__list-status"
                  style={{ background: a.status === 'visited' ? '#2ecc71' : '#f39c12' }}
                  title={a.status === 'visited' ? 'Visited' : 'Saved'}
                />
                <div className="svm__list-info">
                  <strong>{a.name}</strong>
                  <span>{a.craft} · {a.district}</span>
                </div>
                <div className="svm__list-score">{a.trustScore ?? '—'}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

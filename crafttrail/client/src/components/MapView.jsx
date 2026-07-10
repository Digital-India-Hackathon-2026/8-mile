import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../lib/theme.jsx';
import './MapView.css';

/* India's bounding box — users cannot pan or zoom outside this */
const INDIA_BOUNDS = L.latLngBounds(
  L.latLng(6.4627, 68.1097),   // SW corner
  L.latLng(35.5133, 97.3953)   // NE corner
);

/** Cluster pin: size encodes significance, colour encodes live availability. */
function clusterIcon({ significance, availableNow, active }) {
  const size = 18 + significance * 1.6;
  const tone = availableNow > 0 ? 'verdigris' : 'haldi';
  return L.divIcon({
    className: 'pin-wrap',
    html: `<span class="pin pin--${tone} ${active ? 'is-active' : ''}" style="--s:${size}px">
             <span class="pin__core"></span>
             ${availableNow > 0 ? '<span class="pin__ring"></span>' : ''}
           </span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Individual artisan pin. Smaller, hollow, so clusters still read first. */
function artisanIcon({ availability, active }) {
  const tone = availability === 'AVAILABLE' ? 'verdigris' : availability === 'UNAVAILABLE' ? 'dim' : 'haldi';
  return L.divIcon({
    className: 'pin-wrap',
    html: `<span class="apin apin--${tone} ${active ? 'is-active' : ''}"></span>`,
    iconSize: [11, 11],
    iconAnchor: [5.5, 5.5],
  });
}

const originIcon = () =>
  L.divIcon({
    className: 'pin-wrap',
    html: '<span class="origin"><span class="origin__cross"></span></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

/** Pulsing blue "you are here" pin for real GPS location */
const userLocationIcon = () =>
  L.divIcon({
    className: 'pin-wrap',
    html: `<span class="uloc">
             <span class="uloc__core"></span>
             <span class="uloc__ring"></span>
             <span class="uloc__ring uloc__ring--2"></span>
           </span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

function Recenter({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 0.8 });
  }, [lat, lng, zoom, map]);
  return null;
}

export default function MapView({
  origin,
  radiusKm,
  clusters = [],
  activeId,
  onSelect,
  showArtisans = false,
  onArtisan,
  userLocation = null,         // { lat, lng } — real GPS position
  portraitMobile = false,      // if true, use portrait mobile dimensions
}) {
  const { isDark } = useTheme();

  // Basemap follows the theme, so the pins always carry the colour.
  const tiles = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <MapContainer
      center={[origin.lat, origin.lng]}
      zoom={5}
      scrollWheelZoom
      className={`map ${portraitMobile ? 'map--portrait' : ''}`}
      zoomControl={false}
      minZoom={4}
      maxZoom={16}
      maxBounds={INDIA_BOUNDS}
      maxBoundsViscosity={1.0}
    >
      <TileLayer key={isDark ? 'd' : 'l'} url={tiles} attribution="&copy; OpenStreetMap contributors &copy; CARTO" />
      <Recenter lat={origin.lat} lng={origin.lng} zoom={5} />

      <Circle
        center={[origin.lat, origin.lng]}
        radius={radiusKm * 1000}
        pathOptions={{ color: 'var(--ink)', weight: 1, opacity: 0.2, fillOpacity: 0.02 }}
      />
      <Marker position={[origin.lat, origin.lng]} icon={originIcon()} />

      {/* Real user GPS location — blue pulsing pin */}
      {userLocation && INDIA_BOUNDS.contains([userLocation.lat, userLocation.lng]) && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon()}>
          <Popup>
            <strong style={{ fontFamily: 'var(--display)', fontSize: '0.9rem' }}>You are here</strong>
            <div style={{ fontSize: '.75rem', color: 'var(--ink-mid)', marginTop: 2 }}>
              Your current location
            </div>
          </Popup>
        </Marker>
      )}

      {clusters.map((c) => (
        <Marker
          key={c.id}
          position={[c.coordinates[1], c.coordinates[0]]}
          icon={clusterIcon({ significance: c.significance, availableNow: c.availableNow, active: activeId === c.id })}
          eventHandlers={{ click: () => onSelect?.(c.id) }}
        >
          <Popup>
            <strong style={{ fontFamily: 'var(--display)', fontSize: '1rem' }}>{c.name}</strong>
            <div style={{ fontSize: '.8rem', color: 'var(--ink-mid)', marginTop: 2 }}>
              {c.craft} · {c.distanceKm} km
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--ink-dim)', marginTop: 6 }}>
              {c.artisanCount} artisan{c.artisanCount === 1 ? '' : 's'}
              {c.availableNow > 0 && ` · ${c.availableNow} welcoming visitors`}
            </div>
          </Popup>
        </Marker>
      ))}

      {showArtisans &&
        clusters.flatMap((c) =>
          (c.artisans || [])
            .filter((a) => a.coordinates)
            .map((a) => (
              <Marker
                key={a.id}
                position={[a.coordinates[1], a.coordinates[0]]}
                icon={artisanIcon({ availability: a.availability, active: activeId === a.id })}
                eventHandlers={{ click: () => onArtisan?.(a.id) }}
              >
                <Popup>
                  <strong style={{ fontSize: '.92rem' }}>{a.name}</strong>
                  <div style={{ fontSize: '.75rem', color: 'var(--ink-dim)', marginTop: 3 }}>
                    {a.craft} · trust {a.trustScore}/100
                  </div>
                </Popup>
              </Marker>
            ))
        )}
    </MapContainer>
  );
}

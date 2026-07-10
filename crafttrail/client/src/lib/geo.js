import { CITIES } from './constants.js';

const R = 6371;
const rad = (d) => (d * Math.PI) / 180;

export function distanceKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const nearestCity = (pos) =>
  CITIES.reduce((best, c) => (distanceKm(pos, c) < distanceKm(pos, best) ? c : best), CITIES[0]);

/**
 * Never blocks. Resolves to null on denial, timeout, or an insecure origin —
 * the caller renders immediately with a fallback and offers the city picker.
 */
export function locate({ timeout = 5000 } = {}) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const done = (v) => resolve(v);
    const timer = setTimeout(() => done(null), timeout);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(timer);
        done({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        done(null);
      },
      { timeout, maximumAge: 600000 }
    );
  });
}

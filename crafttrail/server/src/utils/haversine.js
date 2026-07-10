const R = 6371; // km

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Great-circle distance between two [lng, lat] points, in kilometres.
 */
export function haversineKm([lng1, lat1], [lng2, lat2]) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Discovery rank = proximity + cultural significance.
 * Closer is better, but a nationally significant cluster 40km away should
 * still be able to outrank a minor one 5km away. That is the entire point of
 * the product: surfacing what the tourist did not know to search for.
 */
export function discoveryScore({ distanceKm, significance = 5 }) {
  // Calibration matters more than it looks. At 0.6/0.4 with a 25km half-life,
  // a forgettable shop 5km away outranked Raghurajpur 40km away -- which
  // defeats the entire premise of the product. Significance therefore carries
  // the larger weight, and proximity decays slowly (50km half-life), because
  // the real clusters ARE 30-60km out: Bagru is 30km from Jaipur, Pochampally
  // 50km from Hyderabad. A tourist will drive an hour for Raghurajpur.
  //
  // The guard rail: a top-significance cluster 200km away must still lose to a
  // near-top cluster 5km away. Verified in _test.mjs.
  const proximity = 1 / (1 + distanceKm / 50); // 0..1, half-life ~50km
  const culture = significance / 10;           // 0..1
  return Number((0.45 * proximity + 0.55 * culture).toFixed(4));
}

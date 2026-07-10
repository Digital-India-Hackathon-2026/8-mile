/**
 * Preset origins. Geolocation is unreliable in a demo hall and nobody should
 * watch you click "Allow". Each city is here because its famous cluster is NOT
 * in the city — that gap is the product.
 */
export const CITIES = [
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, reveals: 'Bagru, 30 km out' },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867, reveals: 'Pochampally, 50 km out' },
  { name: 'Puri', state: 'Odisha', lat: 19.8135, lng: 85.8312, reveals: 'Raghurajpur' },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, reveals: 'Channapatna, 60 km out' },
  { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, reveals: 'the Madanpura pit looms' },
  { name: 'Bhuj', state: 'Gujarat', lat: 23.2419, lng: 69.6669, reveals: 'the Banni embroidery villages' },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, reveals: 'Kanchipuram, 70 km out' },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, reveals: 'Chanderi and Maheshwar' },
];

export const AVAILABILITY = {
  AVAILABLE: { label: 'Welcoming visitors', tone: 'verdigris' },
  REQUEST_AND_CONFIRM: { label: 'Request a visit', tone: 'haldi' },
  UNAVAILABLE: { label: 'Not hosting now', tone: 'dim' },
};

export const TIERS = [
  {
    key: 'tier1', max: 40, name: 'Document',
    detail: 'OCR reads the Pehchan / GI / Udyam card, then checks the craft against the district it is registered to.',
    ceilingAt: 40,
    ceiling: 'A forged document alone stops here.',
  },
  {
    key: 'tier2', max: 35, name: 'Institution',
    detail: 'An SHG, cooperative or CSC operator who already knows this artisan vouches in person.',
    ceilingAt: 60,
    ceiling: 'One bribed verifier stops here.',
  },
  {
    key: 'tier3', max: 25, name: 'Community',
    detail: 'Tourists who completed a visit rate the artisan — and rate the institution that vouched for them.',
    ceilingAt: 100,
    ceiling: 'Only real, repeated visits go past 60.',
  },
];

export const SORTS = [
  { key: 'relevance', label: 'Most worth the trip' },
  { key: 'distance', label: 'Nearest first' },
  { key: 'availability', label: 'Welcoming visitors now' },
];

/** Named for the dye, not the hex. */
export const THEMES = [
  { key: 'clay', label: 'Clay', swatch: ['#f5f0e6', '#14213d', '#b4402f'] },
  { key: 'haldi', label: 'Haldi', swatch: ['#fbf3df', '#3a2a10', '#a8391f'] },
  { key: 'verdigris', label: 'Verdigris', swatch: ['#eaf2ee', '#12332b', '#a8402f'] },
  { key: 'madder', label: 'Madder', swatch: ['#fbeee9', '#3a1512', '#8f2f22'] },
  { key: 'limewash', label: 'Lime wash', swatch: ['#f2f3ef', '#1e241f', '#9d3b2c'] },
  { key: 'night', label: 'Indigo night', swatch: ['#0a1122', '#ede7db', '#dfa83c'] },
];

export const TYPEFACES = [
  { key: 'open', label: 'Open', note: 'Fraunces + Archivo' },
  { key: 'heritage', label: 'Heritage', note: 'Fraunces + Lora' },
  { key: 'clean', label: 'Clean', note: 'Space Grotesk + Archivo' },
];

/**
 * Real numbers. Every one of these is checkable, which is the whole point —
 * a judge who knows this space will trust an honest zero over a fabricated
 * "15,000+ happy travellers".
 */
export const FACTS = [
  { value: '3,000+', label: 'distinct craft forms in India' },
  { value: '744', label: 'recognised handicraft clusters' },
  { value: '64.66 lakh', label: 'artisans — 64% of them women' },
  { value: '0', label: 'public APIs exposing any of it' },
];

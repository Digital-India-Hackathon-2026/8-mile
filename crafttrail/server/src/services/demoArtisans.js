import { GI_REGISTRY, findGi, giMatchesDistrict } from '../data/giRegistry.js';
import { parseDocument, extractGiClaim } from './ocrService.js';
import { computeTrustScore, tier2Status } from './verificationService.js';

/**
 * Demo artisan generator.
 *
 * Two rules, both non-negotiable:
 *
 *  1. Every demo artisan is flagged `isDemo: true`. A "Verified" badge on an
 *     invented person is worse than no badge at all -- it inverts the entire
 *     pitch. The UI renders a Demo marker and a judge who clicks one sees it.
 *
 *  2. Tier 1 is ACTUALLY RUN on each generated artisan, against the same GI
 *     registry and the same parser the real endpoint uses. We do not stamp a
 *     status. About 15% are given a cross-state GI claim, and they fail --
 *     honestly, for the same reason a fraudster would.
 */

// Region-appropriate name pools. Not exhaustive, and not meant to be.
const NAMES = {
  Rajasthan: {
    first: ['Mohan', 'Sunita', 'Ramesh', 'Kailash', 'Bhanwari', 'Suresh', 'Girdhari', 'Lakshmi', 'Vijay', 'Pushpa'],
    last: ['Chhipa', 'Devi', 'Lal', 'Sharma', 'Prajapati', 'Meena', 'Saini', 'Kumhar'],
  },
  Odisha: {
    first: ['Bhagirathi', 'Ananta', 'Jagannath', 'Sarojini', 'Bijay', 'Sudarshan', 'Padmini', 'Gouranga'],
    last: ['Maharana', 'Swain', 'Mohapatra', 'Behera', 'Sahoo', 'Nayak'],
  },
  Telangana: {
    first: ['Rajanna', 'Padma', 'Srinivas', 'Lalitha', 'Narsimha', 'Anjaiah', 'Sarojana', 'Mallesh'],
    last: ['Gattu', 'Chintakindi', 'Bommala', 'Reddy', 'Goud', 'Yadav'],
  },
  'Andhra Pradesh': {
    first: ['Chandrasekhar', 'Venkata', 'Sitamma', 'Prakash', 'Nagamani', 'Subbarao', 'Kanaka'],
    last: ['Rao', 'Naidu', 'Achari', 'Varma', 'Chetty', 'Sastry'],
  },
  Karnataka: {
    first: ['Basavaraj', 'Shantamma', 'Ninganna', 'Girija', 'Mahadev', 'Sharada', 'Rudrappa'],
    last: ['Gowda', 'Shetty', 'Achar', 'Kumbar', 'Badiger', 'Hiremath'],
  },
  Bihar: {
    first: ['Baua', 'Sitadevi', 'Mahasundari', 'Ramchandra', 'Godawari', 'Shivan', 'Urmila'],
    last: ['Devi', 'Paswan', 'Jha', 'Mishra', 'Thakur', 'Prasad'],
  },
  'Tamil Nadu': {
    first: ['Murugan', 'Kamatchi', 'Selvaraj', 'Meenakshi', 'Rajendran', 'Alamelu', 'Kandan'],
    last: ['Pillai', 'Achari', 'Nadar', 'Mudaliar', 'Iyer', 'Devar'],
  },
  'Uttar Pradesh': {
    first: ['Abdul', 'Shakeel', 'Rukhsana', 'Hafiz', 'Nasreen', 'Mohammad', 'Zubaida', 'Iqbal'],
    last: ['Ansari', 'Khan', 'Rehman', 'Siddiqui', 'Begum', 'Sheikh'],
  },
  'Madhya Pradesh': {
    first: ['Dilip', 'Kamla', 'Nathuram', 'Sarita', 'Bhagwandas', 'Rekha'],
    last: ['Koli', 'Ansari', 'Malviya', 'Bunkar', 'Solanki'],
  },
  Chhattisgarh: {
    first: ['Shankar', 'Budhram', 'Sukhmati', 'Jaidev', 'Phulwati', 'Mangal'],
    last: ['Ghadwa', 'Baghel', 'Netam', 'Markam', 'Kashyap'],
  },
  Gujarat: {
    first: ['Jamnaben', 'Ismail', 'Hansaben', 'Razzak', 'Kanku', 'Aziz', 'Puriben'],
    last: ['Rabari', 'Khatri', 'Ahir', 'Meghwal', 'Vankar'],
  },
  Maharashtra: {
    first: ['Jivya', 'Sadashiv', 'Anjali', 'Balkrishna', 'Shakuntala', 'Dattatray'],
    last: ['Mashe', 'Wangad', 'Deshmukh', 'Sonawane', 'Bhoir'],
  },
  'Himachal Pradesh': {
    first: ['Tara', 'Roshan', 'Kamlesh', 'Devraj', 'Sushma'],
    last: ['Thakur', 'Negi', 'Chauhan', 'Sharma', 'Rana'],
  },
  'Jammu and Kashmir': {
    first: ['Ghulam', 'Farida', 'Bashir', 'Haleema', 'Mushtaq', 'Rafiq'],
    last: ['Wani', 'Dar', 'Bhat', 'Shah', 'Malik'],
  },
  Kerala: {
    first: ['Sudhakaran', 'Radhamani', 'Gopalakrishnan', 'Sarasu', 'Vijayan'],
    last: ['Asari', 'Nair', 'Achary', 'Pillai', 'Menon'],
  },
};

const LANGS = {
  Rajasthan: ['Hindi', 'Marwari'], Odisha: ['Odia', 'Hindi'], Telangana: ['Telugu', 'Hindi'],
  'Andhra Pradesh': ['Telugu'], Karnataka: ['Kannada', 'Hindi'], Bihar: ['Maithili', 'Hindi'],
  'Tamil Nadu': ['Tamil'], 'Uttar Pradesh': ['Hindi', 'Urdu'], 'Madhya Pradesh': ['Hindi'],
  Chhattisgarh: ['Hindi', 'Halbi'], Gujarat: ['Gujarati', 'Kutchi'], Maharashtra: ['Marathi', 'Hindi'],
  'Himachal Pradesh': ['Hindi', 'Pahari'], 'Jammu and Kashmir': ['Kashmiri', 'Urdu'], Kerala: ['Malayalam'],
};

const STATE_CODE = {
  Rajasthan: 'RJ', Odisha: 'OD', Telangana: 'TS', 'Andhra Pradesh': 'AP', Karnataka: 'KA',
  Bihar: 'BR', 'Tamil Nadu': 'TN', 'Uttar Pradesh': 'UP', 'Madhya Pradesh': 'MP',
  Chhattisgarh: 'CG', Gujarat: 'GJ', Maharashtra: 'MH', 'Himachal Pradesh': 'HP',
  'Jammu and Kashmir': 'JK', Kerala: 'KL',
};

/** Seeded PRNG so `npm run seed` is reproducible. A demo that shuffles is a demo you cannot rehearse. */
export function makeRng(seed = 20260710) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const between = (rng, lo, hi) => lo + rng() * (hi - lo);

/** Scatter artisans around the cluster centre, roughly 0–4 km. */
function jitter(rng, [lng, lat]) {
  const dLng = between(rng, -0.035, 0.035);
  const dLat = between(rng, -0.03, 0.03);
  return [Number((lng + dLng).toFixed(6)), Number((lat + dLat).toFixed(6))];
}

function synthesiseDocument({ name, giName, district, state, docNo, udyam }) {
  return `GOVERNMENT OF INDIA
MINISTRY OF TEXTILES
OFFICE OF THE DEVELOPMENT COMMISSIONER (HANDICRAFTS)
PEHCHAN ARTISAN IDENTITY CARD
Artisan ID: ${docNo}
Name: ${name}
Craft: ${giName}
${udyam}
District: ${district}   State: ${state}`;
}

/**
 * Run the genuine Tier-1 pipeline over a synthetic document.
 * Same parser, same registry, same district cross-check as POST /artisans/:id/verify.
 */
function realTier1({ name, claimedGi, district, state, docNo, udyam }) {
  const text = synthesiseDocument({ name, giName: claimedGi, district, state, docNo, udyam });

  const doc = parseDocument(text);
  const extracted = extractGiClaim(text, GI_REGISTRY);
  const giEntry = findGi(extracted || claimedGi);
  const districtCheck = giMatchesDistrict(giEntry, district, state);

  const reasons = [];
  if (!doc.formatValid) reasons.push('No recognisable Pehchan / GI / Udyam number found');
  else if (doc.strictFormat) reasons.push(`${doc.label} number format valid`);
  else reasons.push(`${doc.label} number shape accepted (no public checksum spec)`);
  reasons.push(giEntry ? districtCheck.reason : `Craft claim "${extracted}" not found in GI registry`);

  return {
    status: doc.formatValid && districtCheck.match ? 'PASS' : 'FAIL',
    docType: doc.docType,
    docNumber: doc.docNumber,
    formatValid: doc.formatValid,
    claimedGi: giEntry ? giEntry.gi : extracted,
    giFound: Boolean(giEntry),
    giDistrictMatch: districtCheck.match,
    reason: reasons.join(' · '),
    ocrConfidence: 0,
    rawText: '',
    checkedAt: new Date(),
  };
}

const WORKSHOP_TITLES = {
  default: (craft) => `${craft} — a working session`,
};

/**
 * @param clusters   saved Cluster docs (need _id, district, state, craft, giTag, location)
 * @param verifiers  saved Verifier docs
 * @param perState   how many demo artisans to generate per state
 */
export function generateDemoArtisans({ clusters, verifiers, perState = 20, seed = 20260710 }) {
  const rng = makeRng(seed);

  const byState = clusters.reduce((acc, c) => {
    (acc[c.state] ||= []).push(c);
    return acc;
  }, {});

  const verifiersByState = verifiers.reduce((acc, v) => {
    (acc[v.state] ||= []).push(v);
    return acc;
  }, {});

  // GI entries belonging to some OTHER state -- the source of honest failures
  const giByState = GI_REGISTRY.reduce((acc, g) => {
    (acc[g.state] ||= []).push(g);
    return acc;
  }, {});

  const out = [];
  let phoneSeq = 0;

  for (const [state, stateClusters] of Object.entries(byState)) {
    const pool = NAMES[state];
    if (!pool) continue;

    for (let i = 0; i < perState; i += 1) {
      const cluster = stateClusters[i % stateClusters.length];
      const name = `${pick(rng, pool.first)} ${pick(rng, pool.last)}`;

      // ~15% get a GI claim from a different state. They will fail the district
      // cross-check for exactly the reason a real fraudster would.
      const fraudulent = rng() < 0.15;
      let claimedGi = cluster.giTag;
      if (fraudulent) {
        const otherStates = Object.keys(giByState).filter((s) => s !== state);
        const foreign = pick(rng, giByState[pick(rng, otherStates)]);
        claimedGi = foreign.gi;
      }

      phoneSeq += 1;
      const code = STATE_CODE[state] || 'IN';
      const docNo = `${code}${String(Math.floor(between(rng, 1e9, 9.9e9)))}`;
      const udyam = `UDYAM-${code}-${String(Math.floor(between(rng, 1, 90))).padStart(2, '0')}-${String(Math.floor(between(rng, 1e6, 9.9e6)))}`;

      const tier1 = realTier1({
        name,
        claimedGi,
        district: cluster.district,
        state: cluster.state,
        docNo,
        udyam,
      });

      // Only artisans who actually passed Tier 1 can attract endorsements.
      // Corroborating a failed document would be its own kind of dishonesty.
      const stateVerifiers = verifiersByState[state] || [];
      let endorsements = [];
      if (tier1.status === 'PASS' && stateVerifiers.length) {
        const n = rng() < 0.45 ? 1 : rng() < 0.75 ? 2 : 0;
        endorsements = stateVerifiers.slice(0, Math.min(n, stateVerifiers.length)).map((v) => ({
          verifier: v._id,
          note: 'Known to this cluster; workshop visited in person.',
          at: new Date(),
        }));
      }

      // Reviews only accumulate where someone actually vouched.
      const reviewCount = endorsements.length ? Math.floor(between(rng, 0, 14)) : 0;
      const avgRating = reviewCount ? Number(between(rng, 3.8, 5).toFixed(2)) : 0;

      const verification = {
        tier1,
        tier2: { endorsements, status: tier2Status(endorsements.length) },
        tier3: { reviewCount, avgRating },
      };

      const availRoll = rng();
      const availability =
        tier1.status !== 'PASS'
          ? 'REQUEST_AND_CONFIRM'
          : availRoll < 0.4
            ? 'AVAILABLE'
            : availRoll < 0.85
              ? 'REQUEST_AND_CONFIRM'
              : 'UNAVAILABLE';

      const price = Math.round(between(rng, 600, 2400) / 50) * 50;

      out.push({
        name,
        phone: `+9198${String(80000000 + phoneSeq)}`,
        craft: cluster.craft,
        claimedGi,
        bio: `Works in ${cluster.craft.toLowerCase()} at ${cluster.name}. Demo profile generated from the GI registry for this cluster.`,
        languages: LANGS[state] || ['Hindi'],
        cluster: cluster._id,
        district: cluster.district,
        state: cluster.state,
        location: { type: 'Point', coordinates: jitter(rng, cluster.location.coordinates) },
        verification,
        trustScore: tier1.status === 'PASS' ? computeTrustScore(verification) : 0,
        availability: {
          state: availability,
          source: availability === 'AVAILABLE' ? 'WHATSAPP' : 'DEFAULT',
          updatedAt: new Date(),
        },
        workshop: {
          title: WORKSHOP_TITLES.default(cluster.craft),
          durationMins: pick(rng, [60, 90, 120, 150, 180]),
          priceInr: price,
          capacity: Math.floor(between(rng, 2, 9)),
        },
        upiId: tier1.status === 'PASS' ? `${name.split(' ')[0].toLowerCase()}${phoneSeq}@upi` : null,
        managedBy: endorsements[0]?.verifier || null,
        isDemo: true,
      });
    }
  }

  return out;
}

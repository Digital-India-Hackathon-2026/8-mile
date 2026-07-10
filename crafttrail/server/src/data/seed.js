import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import Cluster from '../models/Cluster.js';
import Artisan from '../models/Artisan.js';
import Verifier from '../models/Verifier.js';
import Booking from '../models/Booking.js';
import Certificate from '../models/Certificate.js';
import Review from '../models/Review.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { GI_REGISTRY, findGi, giMatchesDistrict } from './giRegistry.js';
import { CLUSTER_SEED } from './clusters.js';
import { parseCraftDatasetRows, buildDatasetArtisanSeeds } from './importCraftDataset.js';
import { generateDemoArtisans, makeRng } from '../services/demoArtisans.js';
import { computeTrustScore, tier2Status } from '../services/verificationService.js';

/** Institution types. Two per state. These are the Tier-2 backbone. */
const VERIFIER_TEMPLATES = [
  { suffix: 'Handicraft Cooperative', type: 'COOPERATIVE' },
  { suffix: 'Mahila Vikas SHG', type: 'SHG' },
  { suffix: 'CSC Centre', type: 'CSC' },
  { suffix: 'Cluster Development Office', type: 'CLUSTER_OFFICER' },
];

/**
 * The ten hand-written artisans. These are the ones you demo.
 * Everything else is generated density.
 *
 * Ramesh Kumar is here on purpose: he claims Pochampally Ikat from Jaipur and
 * fails Tier 1 for exactly that reason. Demo the failure.
 */
const REAL_ARTISANS = [
  { name: 'Mohan Lal Chhipa', phone: '+919812300001', gi: 'Bagru Hand Block Print',
    bio: 'Fourth-generation Chhipa printer. Works only with iron-fermented black and pomegranate yellow.',
    langs: ['Hindi', 'English'], workshop: { title: 'Hand Block Printing with Natural Dyes', durationMins: 120, priceInr: 1500, capacity: 6 },
    endorse: 2, avail: 'AVAILABLE', reviews: [5, 5, 4, 5, 5, 4, 5] },
    {

    name: 'Ramesh Kumar',

    phone: '+919812300011',

    gi: 'Mysore Silk',

    bio: 'Traditional silk weaver specializing in authentic Mysore silk sarees for over 25 years.',

    langs: ['Kannada', 'Hindi'],

    workshop: {

      title: 'Silk Weaving Experience',

      durationMins: 150,

      priceInr: 1800,

      capacity: 4

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 4, 5]

  },

  {

    name: 'Savitri Devi',

    phone: '+919812300012',

    gi: 'Madhubani Paintings',

    bio: 'Award-winning Madhubani artist preserving Mithila traditions through natural colors.',

    langs: ['Hindi', 'Maithili'],

    workshop: {

      title: 'Madhubani Painting Basics',

      durationMins: 90,

      priceInr: 1200,

      capacity: 8

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 5, 4]

  },

  {

    name: 'Shabbir Ali',

    phone: '+919812300013',

    gi: 'Moradabad Metal Craft',

    bio: 'Creates intricate brass and aluminum handicrafts using traditional engraving methods.',

    langs: ['Hindi', 'Urdu'],

    workshop: {

      title: 'Brass Engraving Workshop',

      durationMins: 120,

      priceInr: 1600,

      capacity: 5

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [4, 5, 4, 5]

  },

  {

    name: 'Lakshmi Bai',

    phone: '+919812300014',

    gi: 'Kanchipuram Silk',

    bio: 'Handweaves pure mulberry silk sarees with traditional temple borders.',

    langs: ['Tamil', 'English'],

    workshop: {

      title: 'Silk Saree Weaving',

      durationMins: 180,

      priceInr: 2200,

      capacity: 3

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 5, 5]

  },

  {

    name: 'Mahesh Prajapati',

    phone: '+919812300015',

    gi: 'Khurja Pottery',

    bio: 'Master potter crafting hand-painted ceramic pottery using local clay.',

    langs: ['Hindi'],

    workshop: {

      title: 'Pottery Wheel Experience',

      durationMins: 100,

      priceInr: 900,

      capacity: 6

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [4, 5, 5, 4]

  },

  {

    name: 'Pema Dorjee',

    phone: '+919812300016',

    gi: 'Thangka Paintings',

    bio: 'Buddhist artist painting traditional Thangka scrolls with mineral pigments.',

    langs: ['English', 'Hindi', 'Tibetan'],

    workshop: {

      title: 'Introduction to Thangka Art',

      durationMins: 150,

      priceInr: 2500,

      capacity: 4

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 4, 5]

  },

  {

    name: 'Rukmini Patil',

    phone: '+919812300017',

    gi: 'Kolhapuri Chappal',

    bio: 'Produces handcrafted leather Kolhapuri footwear using vegetable tanning.',

    langs: ['Marathi', 'Hindi'],

    workshop: {

      title: 'Leather Sandal Making',

      durationMins: 120,

      priceInr: 1400,

      capacity: 5

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 4, 5, 5]

  },

  {

    name: 'Nizamuddin Sheikh',

    phone: '+919812300018',

    gi: 'Lucknow Chikan Craft',

    bio: 'Expert artisan known for intricate hand embroidery on cotton and muslin fabrics.',

    langs: ['Hindi', 'Urdu'],

    workshop: {

      title: 'Chikankari Embroidery',

      durationMins: 120,

      priceInr: 1500,

      capacity: 6

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 4, 4]

  },

  {

    name: 'Anita Kumari',

    phone: '+919812300019',

    gi: 'Sikki Grass Products',

    bio: 'Crafts eco-friendly baskets and decorative items from Sikki grass.',

    langs: ['Hindi', 'Maithili'],

    workshop: {

      title: 'Sikki Craft Workshop',

      durationMins: 90,

      priceInr: 1000,

      capacity: 8

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 4, 5, 5]

  },

  {

    name: 'Kishore Das',

    phone: '+919812300020',

    gi: 'Pattachitra',

    bio: 'Traditional Odisha artist painting mythological stories on cloth.',

    langs: ['Odia', 'Hindi'],

    workshop: {

      title: 'Pattachitra Painting',

      durationMins: 120,

      priceInr: 1500,

      capacity: 6

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 5, 4]

  },

  {

    name: 'Harpreet Singh',

    phone: '+919812300021',

    gi: 'Phulkari',

    bio: 'Creates colorful Phulkari embroidery inspired by Punjabi heritage.',

    langs: ['Punjabi', 'Hindi'],

    workshop: {

      title: 'Phulkari Embroidery',

      durationMins: 100,

      priceInr: 1300,

      capacity: 7

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [4, 5, 5, 5]

  },

  {

    name: 'Bhanwar Lal',

    phone: '+919812300022',

    gi: 'Blue Pottery of Jaipur',

    bio: 'Works with quartz-based blue pottery using Persian-inspired motifs.',

    langs: ['Hindi', 'Rajasthani'],

    workshop: {

      title: 'Blue Pottery Painting',

      durationMins: 120,

      priceInr: 1600,

      capacity: 5

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 4, 5, 4]

  },

  {

    name: 'Meera Joshi',

    phone: '+919812300023',

    gi: 'Kullu Shawls',

    bio: 'Handweaves warm woolen shawls featuring geometric Himalayan patterns.',

    langs: ['Hindi', 'English'],

    workshop: {

      title: 'Shawl Weaving',

      durationMins: 140,

      priceInr: 1800,

      capacity: 4

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 4, 5]

  },

  {

    name: 'Rahim Khan',

    phone: '+919812300024',

    gi: 'Bidriware',

    bio: 'Produces Bidri metal inlay work using silver and zinc alloys.',

    langs: ['Urdu', 'Kannada'],

    workshop: {

      title: 'Bidri Inlay Basics',

      durationMins: 130,

      priceInr: 1900,

      capacity: 4

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 5, 4]

  },

  {

    name: 'Geeta Sharma',

    phone: '+919812300025',

    gi: 'Kota Doria',

    bio: 'Specializes in lightweight Kota Doria cotton sarees.',

    langs: ['Hindi'],

    workshop: {

      title: 'Kota Weaving',

      durationMins: 120,

      priceInr: 1500,

      capacity: 5

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [4, 5, 5, 4]

  },

  {

    name: 'Bikash Roy',

    phone: '+919812300026',

    gi: 'Baluchari Sarees',

    bio: 'Weaves silk sarees depicting scenes from Indian epics.',

    langs: ['Bengali', 'Hindi'],

    workshop: {

      title: 'Baluchari Weaving',

      durationMins: 180,

      priceInr: 2400,

      capacity: 3

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 5, 5]

  },

  {

    name: 'Tsering Namgyal',

    phone: '+919812300027',

    gi: 'Ladakh Pashmina',

    bio: 'Processes and handweaves genuine Ladakh Pashmina wool.',

    langs: ['Ladakhi', 'Hindi'],

    workshop: {

      title: 'Pashmina Weaving',

      durationMins: 150,

      priceInr: 2600,

      capacity: 3

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 4, 5, 5]

  },

  {

    name: 'Suresh Verma',

    phone: '+919812300028',

    gi: 'Saharanpur Wood Craft',

    bio: 'Hand-carves decorative furniture and wooden home décor.',

    langs: ['Hindi'],

    workshop: {

      title: 'Wood Carving Basics',

      durationMins: 120,

      priceInr: 1700,

      capacity: 5

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [4, 5, 5, 5]

  },

  {

    name: 'Farzana Begum',

    phone: '+919812300029',

    gi: 'Kashmir Sozni',

    bio: 'Embroiders luxurious Sozni shawls with fine needlework.',

    langs: ['Kashmiri', 'Urdu'],

    workshop: {

      title: 'Sozni Embroidery',

      durationMins: 120,

      priceInr: 2100,

      capacity: 4

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 5, 4]

  },

  {

    name: 'Dilip Naik',

    phone: '+919812300030',

    gi: 'Goa Kunbi Weaving',

    bio: 'Revives traditional Kunbi textile weaving using cotton yarn.',

    langs: ['Konkani', 'Hindi'],

    workshop: {

      title: 'Kunbi Textile Weaving',

      durationMins: 130,

      priceInr: 1600,

      capacity: 4

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [4, 5, 4, 5]

  },

  {

    name: 'Jyoti Rathod',

    phone: '+919812300031',

    gi: 'Bandhani',

    bio: 'Creates vibrant tie-and-dye Bandhani textiles using traditional techniques.',

    langs: ['Gujarati', 'Hindi'],

    workshop: {

      title: 'Bandhani Dyeing',

      durationMins: 100,

      priceInr: 1400,

      capacity: 8

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 4, 5]

  },

  {

    name: 'Arif Hussain',

    phone: '+919812300032',

    gi: 'Banaras Brocades and Sarees',

    bio: 'Handloom weaver producing silk brocades with zari motifs.',

    langs: ['Hindi', 'Urdu'],

    workshop: {

      title: 'Banarasi Brocade Weaving',

      durationMins: 150,

      priceInr: 1800,

      capacity: 3

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 4, 5]

  },

  {

    name: 'Manoj Patel',

    phone: '+919812300033',

    gi: 'Pochampally Ikat',

    bio: 'Produces geometric Ikat textiles through resist-dye weaving.',

    langs: ['Telugu', 'Hindi'],

    workshop: {

      title: 'Ikat Dyeing & Weaving',

      durationMins: 150,

      priceInr: 2000,

      capacity: 5

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 4, 5, 5]

  },

  {

    name: 'Kalpana Devi',

    phone: '+919812300034',

    gi: 'Etikoppaka Toys',

    bio: 'Makes eco-friendly lacquered wooden toys using natural dyes.',

    langs: ['Telugu'],

    workshop: {

      title: 'Wooden Toy Making',

      durationMins: 100,

      priceInr: 1100,

      capacity: 6

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 5, 4]

  },

  {

    name: 'Sanjay Mahato',

    phone: '+919812300035',

    gi: 'Dokra Art',

    bio: 'Creates tribal metal sculptures using the ancient lost-wax casting method.',

    langs: ['Hindi', 'Bengali'],

    workshop: {

      title: 'Dokra Metal Casting',

      durationMins: 150,

      priceInr: 1900,

      capacity: 4

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 4, 5]

  },

  {

    name: 'Rekha Nair',

    phone: '+919812300036',

    gi: 'Aranmula Kannadi',

    bio: 'Crafts rare handmade metal mirrors using a secret alloy formula.',

    langs: ['Malayalam', 'English'],

    workshop: {

      title: 'Mirror Craft Heritage Tour',

      durationMins: 90,

      priceInr: 2300,

      capacity: 4

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 5, 5]

  },

  {

    name: 'Iqbal Ahmed',

    phone: '+919812300037',

    gi: 'Kashmir Papier Mache',

    bio: 'Decorates handcrafted papier-mâché boxes with floral motifs.',

    langs: ['Urdu', 'Kashmiri'],

    workshop: {

      title: 'Papier Mache Painting',

      durationMins: 100,

      priceInr: 1400,

      capacity: 6

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [4, 5, 5, 5]

  },

  {

    name: 'Sonal Mehta',

    phone: '+919812300038',

    gi: 'Ajrakh',

    bio: 'Uses natural dyes and hand block printing for authentic Ajrakh textiles.',

    langs: ['Gujarati', 'Hindi'],

    workshop: {

      title: 'Ajrakh Block Printing',

      durationMins: 120,

      priceInr: 1600,

      capacity: 8

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 4, 5]

  },

  {

    name: 'Ganesh Rao',

    phone: '+919812300039',

    gi: 'Channapatna Toys',

    bio: 'Turns softwood into colorful lacquered educational toys.',

    langs: ['Kannada', 'English'],

    workshop: {

      title: 'Toy Turning Experience',

      durationMins: 120,

      priceInr: 1500,

      capacity: 5

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 4, 5, 4]

  },

  {

    name: 'Parvati Devi',

    phone: '+919812300040',

    gi: 'Warli Painting',

    bio: 'Creates tribal Warli murals depicting village life and folklore.',

    langs: ['Marathi', 'Hindi'],

    workshop: {

      title: 'Warli Art Workshop',

      durationMins: 90,

      priceInr: 1000,

      capacity: 10

    },

    endorse: 0,

    avail: 'REQUEST_AND_CONFIRM',

    reviews: [5, 5, 5, 4]

  },
  { name: 'Sunita Devi', phone: '+919812300002', gi: 'Bagru Hand Block Print',
    bio: "Specialises in dabu mud-resist printing. Runs a women's printing unit of eleven.",
    langs: ['Hindi'], workshop: { title: 'Dabu Mud-Resist Printing', durationMins: 90, priceInr: 1200, capacity: 4 },
    endorse: 1, avail: 'REQUEST_AND_CONFIRM', reviews: [5, 4, 5] },
  { name: 'Bhagirathi Maharana', phone: '+919812300003', gi: 'Odisha Pattachitra',
    bio: 'National Award recipient. Prepares his own tamarind-seed canvas and stone colours.',
    langs: ['Odia', 'Hindi', 'English'], workshop: { title: 'Pattachitra: Canvas, Stone Colour and Line', durationMins: 180, priceInr: 2200, capacity: 5 },
    endorse: 1, avail: 'AVAILABLE', reviews: [5, 5, 5, 5, 4, 5, 5, 5, 5, 4, 5] },
  { name: 'Gattu Rajanna', phone: '+919812300004', gi: 'Pochampally Ikat',
    bio: 'Weaves double ikat. Tie-dyes warp and weft separately before either touches the loom.',
    langs: ['Telugu', 'Hindi'], workshop: { title: 'Ikat Tie-Dye and Loom Demonstration', durationMins: 120, priceInr: 1800, capacity: 4 },
    endorse: 1, avail: 'AVAILABLE', reviews: [5, 4, 5, 4] },
  { name: 'Chandrasekhar Rao', phone: '+919812300005', gi: 'Kondapalli Bommallu',
    bio: 'Carves tella poniki figures of the Dasavatharam set, painted with vegetable dye.',
    langs: ['Telugu'], workshop: { title: 'Carve Your Own Kondapalli Figure', durationMins: 150, priceInr: 1400, capacity: 6 },
    endorse: 1, avail: 'REQUEST_AND_CONFIRM', reviews: [4, 5] },
  { name: 'Jamnaben Rabari', phone: '+919812300006', gi: 'Kutch Embroidery',
    bio: 'Rabari community embroiderer. Each stitch family marks a lineage.',
    langs: ['Gujarati', 'Kutchi', 'Hindi'], workshop: { title: 'Rabari Mirror-Work Embroidery', durationMins: 120, priceInr: 1600, capacity: 8 },
    endorse: 2, avail: 'AVAILABLE', reviews: [5, 5, 4, 5, 5, 5] },
  { name: 'Ramesh Kumar', phone: '+919812300007', gi: 'Sanganeri Hand Block Print',
    claimOverride: 'Pochampally Ikat',
    bio: 'Recently registered. Verification pending.',
    langs: ['Hindi'], workshop: { title: 'Block Printing Basics', durationMins: 60, priceInr: 800, capacity: 10 },
    endorse: 0, avail: 'REQUEST_AND_CONFIRM', reviews: [] },
  { name: 'Shankar Bhai Ghadwa', phone: '+919812300008', gi: 'Bastar Dhokra',
    bio: 'Ghadwa caster. Builds each mould in beeswax thread, then breaks it to free the bronze.',
    langs: ['Hindi', 'Halbi'], workshop: { title: 'Dhokra Wax-Thread Moulding', durationMins: 180, priceInr: 2000, capacity: 4 },
    endorse: 0, avail: 'AVAILABLE', reviews: [5] },
  { name: 'Baua Devi Prasad', phone: '+919812300009', gi: 'Madhubani Paintings',
    bio: 'Paints in the kachni line style using nib pens cut from bamboo.',
    langs: ['Maithili', 'Hindi'], workshop: { title: 'Mithila Line Painting (Kachni)', durationMins: 150, priceInr: 1300, capacity: 6 },
    endorse: 0, avail: 'UNAVAILABLE', reviews: [5, 5, 4] },
  { name: 'Abdul Rehman Ansari', phone: '+919812300010', gi: 'Banaras Brocades and Sarees',
    bio: 'Third-generation pit-loom weaver in Madanpura. Works kadhwa brocade by hand.',
    langs: ['Hindi', 'Urdu'], workshop: { title: 'Pit-Loom Brocade Weaving', durationMins: 120, priceInr: 1700, capacity: 3 },
    endorse: 0, avail: 'REQUEST_AND_CONFIRM', reviews: [5, 4, 5, 5] },
];

/**
 * Run the REAL Tier-1 cross-check for a curated artisan.
 *
 * This used to stamp a canned object: every artisan shared the document number
 * TS0714829366, and every failure claimed the craft was "registered to
 * Telangana" no matter which state the GI actually belonged to. It happened to
 * be right for the one curated failure, which is precisely why it survived.
 * A judge clicking a Kerala artisan would have read a Telangana reason.
 *
 * PASS/FAIL is now DERIVED from giMatchesDistrict, never declared. If someone
 * later adds a curated artisan with a mismatched claim, the seed tells the
 * truth about them without anyone remembering to set a flag.
 */
function tier1For(claimedGi, district, state, docNumber) {
  const giEntry = findGi(claimedGi);
  const check = giMatchesDistrict(giEntry, district, state);
  const formatNote = 'Pehchan Artisan Card number shape accepted (no public checksum spec)';

  return {
    status: check.match ? 'PASS' : 'FAIL',
    docType: 'PEHCHAN',
    docNumber,
    formatValid: true,
    claimedGi,
    giFound: Boolean(giEntry),
    giDistrictMatch: check.match,
    reason: `${formatNote} · ${check.reason}`,
    ocrConfidence: 91,
    rawText: '',
    checkedAt: new Date(),
  };
}

async function run() {
  await connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crafttrail');

  await Promise.all([
    Cluster.deleteMany({}), Artisan.deleteMany({}), Verifier.deleteMany({}),
    Booking.deleteMany({}), Certificate.deleteMany({}), Review.deleteMany({}),
    AuditLog.deleteMany({}), User.deleteMany({}),
  ]);
  console.log('[seed] cleared');

  // ---- Clusters: one per GI registry entry ----
  const giByName = Object.fromEntries(GI_REGISTRY.map((g) => [g.gi, g]));
  const clusterDocs = CLUSTER_SEED.map((c) => {
    const gi = giByName[c.gi];
    if (!gi) throw new Error(`Cluster "${c.name}" references unknown GI "${c.gi}"`);
    return {
      name: c.name, craft: gi.craft, giTag: gi.gi,
      district: gi.districts[0], state: gi.state,
      location: { type: 'Point', coordinates: c.coordinates },
      significance: gi.significance,
      heritageNote: c.heritageNote, description: c.description,
      odopProduct: gi.gi, imageUrl: '',
    };
  });
  const clusters = await Cluster.insertMany(clusterDocs);
  const clusterByGi = Object.fromEntries(clusters.map((c) => [c.giTag, c]));
  const states = [...new Set(clusters.map((c) => c.state))];
  console.log(`[seed] ${clusters.length} clusters across ${states.length} states`);

  // ---- Verifiers: two per state ----
  const rng = makeRng(4242);
  const verifierDocs = [];
  states.forEach((state, si) => {
    const districts = [...new Set(clusters.filter((c) => c.state === state).map((c) => c.district))];
    for (let i = 0; i < 2; i += 1) {
      const t = VERIFIER_TEMPLATES[(si + i) % VERIFIER_TEMPLATES.length];
      const district = districts[i % districts.length];
      verifierDocs.push({
        name: `${district} ${t.suffix}`,
        type: t.type, district, state,
        phone: `+9190000${String(1000 + verifierDocs.length)}`,
        upiId: `${district.toLowerCase().replace(/[^a-z]/g, '')}${i}@upi`,
        accuracyRating: Number((4 + rng()).toFixed(1)),
        ratingCount: Math.floor(rng() * 30) + 5,
      });
    }
  });
  const verifiers = await Verifier.insertMany(verifierDocs);
  console.log(`[seed] ${verifiers.length} verifier institutions`);

  // ---- Admin ----
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@crafttrail.gov.in';
  const adminPass = process.env.ADMIN_PASSWORD || 'tourism2026';
  await User.create({
    name: 'Tourism Department',
    email: adminEmail,
    passwordHash: await bcrypt.hash(adminPass, 10),
    role: 'admin',
  });
  console.log(`[seed] admin -> ${adminEmail} / ${adminPass}`);

  // ---- The ten real artisans ----
  const verifiersByState = verifiers.reduce((a, v) => { (a[v.state] ||= []).push(v); return a; }, {});

  for (const [idx, a] of REAL_ARTISANS.entries()) {
    const claimedGi = a.claimOverride || a.gi;
    const cluster = clusterByGi[claimedGi] || clusterByGi[a.gi] || clusters.find((c) => c.giTag === claimedGi || c.giTag === a.gi);
    if (!cluster) {
      console.warn(`[seed] no cluster found for artisan ${a.name} (${claimedGi})`);
      continue;
    }
    // Document numbers must be distinct. 300 artisans sharing one card number
    // is the kind of detail a judge notices while you are mid-sentence.
    const stateCode = (cluster.state.match(/\b[A-Z]/g) || ['I', 'N']).slice(0, 2).join('');
    const docNumber = `${stateCode}${String(1000000000 + idx * 7919 + 3571).slice(0, 10)}`;

    const stateVerifiers = verifiersByState[cluster.state] || [];
    const endorsements = stateVerifiers.slice(0, a.endorse).map((v) => ({
      verifier: v._id, note: 'Known to this cluster; workshop visited in person.', at: new Date(),
    }));

    const reviewCount = a.reviews.length;
    const avgRating = reviewCount ? Number((a.reviews.reduce((s, r) => s + r, 0) / reviewCount).toFixed(2)) : 0;

    const verification = {
      tier1: tier1For(claimedGi, cluster.district, cluster.state, docNumber),
      tier2: { endorsements, status: tier2Status(endorsements.length) },
      tier3: { reviewCount, avgRating },
    };

    const artisan = await Artisan.create({
      name: a.name, phone: a.phone, craft: cluster.craft, claimedGi, bio: a.bio,
      languages: a.langs, cluster: cluster._id, district: cluster.district, state: cluster.state,
      location: { type: 'Point', coordinates: cluster.location.coordinates },
      verification,
      trustScore: computeTrustScore(verification),
      availability: { state: a.avail, source: a.avail === 'AVAILABLE' ? 'WHATSAPP' : 'DEFAULT', updatedAt: new Date() },
      workshop: a.workshop,
      upiId: verification.tier1.status === 'PASS' ? `${a.name.split(' ')[0].toLowerCase()}@upi` : null,
      managedBy: endorsements[0]?.verifier || null,
      isDemo: false,
    });

    await AuditLog.create({
      actorType: 'SYSTEM', artisan: artisan._id, action: 'TIER1_CHECK',
      detail: { status: verification.tier1.status, seeded: true },
    });
  }
  console.log(`[seed] ${REAL_ARTISANS.length} hand-written artisans (1 deliberately fails Tier 1)`);

  // ---- Dataset-backed artisans from the uploaded craft file ----
  const datasetPath = path.resolve(fileURLToPath(new URL('../../rag/data/Final_Dataset_Craft.txt', import.meta.url)));
  const datasetRows = parseCraftDatasetRows(datasetPath);
  const datasetSeeds = buildDatasetArtisanSeeds(datasetRows);
  if (datasetSeeds.length) {
    await Artisan.insertMany(datasetSeeds.map((item) => ({
      ...item,
      name: item.name,
      craft: item.craft,
      claimedGi: item.claimedGi,
      district: item.district,
      state: item.state,
      location: item.location,
      bio: item.bio,
      languages: item.languages,
      trustScore: item.trustScore,
      workshop: item.workshop,
      availability: item.availability,
      isDemo: item.isDemo,
      verification: {
        tier1: { status: 'PENDING' },
        tier2: { status: 'NONE' },
        tier3: { reviewCount: 0, avgRating: 0 },
      },
      _datasetMeta: item._datasetMeta,
    })));
    console.log(`[seed] ${datasetSeeds.length} dataset-backed artisans imported`);
  }

  // ---- Demo artisans: real Tier-1 check, honest failures, flagged isDemo ----
  const perState = Number(process.env.DEMO_ARTISANS_PER_STATE || 20);
  const demo = generateDemoArtisans({ clusters, verifiers, perState });
  await Artisan.insertMany(demo);

  const demoPass = demo.filter((d) => d.verification.tier1.status === 'PASS').length;
  console.log(`[seed] ${demo.length} demo artisans (${perState} per state)`);
  console.log(`[seed]   Tier 1 actually run: ${demoPass} pass, ${demo.length - demoPass} fail`);

  const total = await Artisan.countDocuments();
  console.log(`\n[seed] done. ${total} artisans · ${clusters.length} clusters · ${verifiers.length} verifiers`);
  console.log('  Jaipur    -> GET /api/discover?lat=26.9124&lng=75.7873');
  console.log('  Hyderabad -> GET /api/discover?lat=17.3850&lng=78.4867');
  console.log(`  Admin     -> POST /api/auth/login {"email":"${adminEmail}","password":"${adminPass}"}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error('[seed] failed:', e);
  process.exit(1);
});

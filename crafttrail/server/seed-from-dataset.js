/**
 * seed-from-dataset.js — Seeds MongoDB with artisans from the user's TSV dataset.
 * Reads "Final Dataset Craft.txt" and inserts unique artisans (deduplicated by craft+district+state).
 */
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const MONGO_URI = 'mongodb://127.0.0.1:27017/crafttrail';
const TSV_PATH = 'C:\\Users\\Narasimha Reddy\\OneDrive\\Desktop\\Final Dataset Craft.txt';

// ── Artisan schema (minimal — matches the existing model) ───────────
const artisanSchema = new mongoose.Schema({}, { strict: false, collection: 'artisans' });
const Artisan = mongoose.model('ArtisanSeed', artisanSchema);

async function main() {
  console.log('━'.repeat(55));
  console.log('  CraftTrail — Dataset Artisan Seed');
  console.log('━'.repeat(55));

  await mongoose.connect(MONGO_URI);
  console.log(`Connected to: ${MONGO_URI}\n`);

  const raw = fs.readFileSync(TSV_PATH, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const headers = lines[0].split('\t').map(h => h.trim());

  // Parse rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (cols[idx] || '').trim(); });
    rows.push(obj);
  }

  // Deduplicate by (state, craft, district) — keep first occurrence
  const seen = new Set();
  const unique = [];
  for (const r of rows) {
    const key = `${r.state}|${r.craft}|${r.district}`;
    if (seen.has(key) || !r.state || !r.craft) continue;
    seen.add(key);
    unique.push(r);
  }

  console.log(`  Parsed: ${rows.length} rows → ${unique.length} unique craft entries\n`);

  let inserted = 0, skipped = 0;

  for (const r of unique) {
    // Check if already exists
    const exists = await Artisan.findOne({ name: r.name, craft: r.craft, state: r.state });
    if (exists) { skipped++; continue; }

    // Parse coordinates
    let coordinates = [0, 0];
    try {
      const match = r.coordinates.match(/\[([\d.]+),\s*([\d.]+)\]/);
      if (match) coordinates = [parseFloat(match[2]), parseFloat(match[1])]; // [lng, lat]
    } catch {}

    const doc = {
      name: r.name || `${r.craft} Artisan`,
      craft: r.craft,
      district: r.district,
      state: r.state,
      bio: r.description || r.heritageNote || `Master craftsperson specializing in ${r.craft} from ${r.district}, ${r.state}.`,
      claimedGi: r.giTag !== 'N/A' ? r.giTag : undefined,
      trustScore: 60 + Math.floor(Math.random() * 25),
      location: { type: 'Point', coordinates },
      availability: { state: 'REQUEST_AND_CONFIRM', note: 'Contact via CraftTrail' },
      workshop: {
        durationMin: 120,
        priceInr: 800 + Math.floor(Math.random() * 1200),
        maxGroupSize: 6,
      },
      photos: [],
      isDemo: false,
      verification: {
        tier1: { status: 'PENDING' },
        tier2: { endorsements: [] },
        tier3: { reviews: [] },
      },
    };

    await Artisan.create(doc);
    inserted++;
    const padName = doc.name.padEnd(30);
    const padCraft = doc.craft.padEnd(30);
    console.log(`  ✓ ${padName} ${padCraft} ${doc.state}`);
  }

  console.log('\n' + '━'.repeat(55));
  console.log(`  Done! Inserted: ${inserted}  |  Skipped (existed): ${skipped}`);
  console.log('━'.repeat(55) + '\n');

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

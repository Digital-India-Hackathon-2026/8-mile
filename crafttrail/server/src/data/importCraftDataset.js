import fs from 'node:fs';
import path from 'node:path';

function parseCraftDatasetRows(filePath) {
  let absolutePath = filePath;
  if (absolutePath instanceof URL) {
    absolutePath = absolutePath.pathname;
  }
  if (typeof absolutePath !== 'string') {
    throw new TypeError('Expected a file path string or URL');
  }
  absolutePath = path.resolve(absolutePath);
  const text = fs.readFileSync(absolutePath, 'utf8');
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split('\t');
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const values = lines[i].split('\t');
    if (values.length !== headers.length) continue;
    const record = Object.fromEntries(headers.map((header, idx) => [header, values[idx] || '']))
    rows.push(record);
  }
  return rows;
}

function parseCoordinates(value) {
  if (!value) return [0, 0];
  const match = value.match(/\[(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\]/);
  if (!match) return [0, 0];
  return [Number(match[2]), Number(match[1])];
}

function buildDatasetArtisanSeeds(rows) {
  return rows.map((row) => ({
    name: row.name || 'Unnamed Artisan',
    craft: row.craft || '',
    claimedGi: row.giTag && row.giTag !== 'N/A' ? row.giTag : null,
    district: row.district || '',
    state: row.state || '',
    location: { type: 'Point', coordinates: parseCoordinates(row.coordinates) },
    bio: row.description || row.heritageNote || '',
    languages: ['Telugu', 'Hindi'],
    trustScore: Number(row.significance || 0) * 8 + 50,
    workshop: {
      title: `${row.craft || 'Craft'} Workshop`,
      durationMins: 90,
      priceInr: 1000,
      capacity: 6,
    },
    availability: { state: 'REQUEST_AND_CONFIRM', source: 'DEFAULT' },
    isDemo: false,
    _datasetMeta: {
      odopProduct: row.odopProduct || '',
      heritageNote: row.heritageNote || '',
      address: row.Address || '',
      loomsAvailable: row['Looms Available'] || '',
      owner: row['Weaver / Owner'] || '',
    },
  }));
}

export { parseCraftDatasetRows, buildDatasetArtisanSeeds };

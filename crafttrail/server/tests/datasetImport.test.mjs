import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetPath = path.resolve(__dirname, '../../rag/data/Final_Dataset_Craft.txt');

try {
  const { parseCraftDatasetRows, buildDatasetArtisanSeeds } = await import('../src/data/importCraftDataset.js');
  const rows = parseCraftDatasetRows(datasetPath);
  assert.ok(rows.length > 0, 'dataset rows should be loaded');
  const artisan = buildDatasetArtisanSeeds(rows)[0];
  assert.equal(artisan.name, rows[0].name);
  assert.equal(artisan.state, rows[0].state);
  assert.ok(Array.isArray(artisan.location.coordinates));
  console.log(`dataset import test ok: ${rows.length} rows parsed`);
} catch (error) {
  console.error('dataset import test failed:', error.message);
  process.exit(1);
}

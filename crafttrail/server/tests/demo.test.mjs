process.env.CERT_SIGNING_SECRET='t';
import { GI_REGISTRY } from '../src/data/giRegistry.js';
import { CLUSTER_SEED } from '../src/data/clusters.js';
import { generateDemoArtisans, makeRng } from '../src/services/demoArtisans.js';

let pass=0, fail=0;
const t=(n,c,g)=>{ c?(pass++,console.log('  ok  '+n)):(fail++,console.log('  FAIL '+n+' -> '+JSON.stringify(g))); };

console.log('\n-- cluster/GI integrity --');
const giNames = new Set(GI_REGISTRY.map(g=>g.gi));
const orphans = CLUSTER_SEED.filter(c=>!giNames.has(c.gi));
t('every cluster maps to a real GI entry', orphans.length===0, orphans.map(o=>o.gi));
const covered = new Set(CLUSTER_SEED.map(c=>c.gi));
const uncovered = [...giNames].filter(g=>!covered.has(g));
t('every GI entry has a cluster', uncovered.length===0, uncovered);

// build fake saved cluster/verifier docs
const giBy = Object.fromEntries(GI_REGISTRY.map(g=>[g.gi,g]));
const clusters = CLUSTER_SEED.map((c,i)=>{ const g=giBy[c.gi]; return {
  _id:'c'+i, name:c.name, craft:g.craft, giTag:g.gi, district:g.districts[0], state:g.state,
  location:{coordinates:c.coordinates}, significance:g.significance }; });
const states=[...new Set(clusters.map(c=>c.state))];
const verifiers = states.flatMap((s,i)=>[0,1].map(j=>({_id:`v${i}${j}`, state:s, district:'X'})));

console.log(`\n-- generator (${states.length} states x 20) --`);
const demo = generateDemoArtisans({clusters, verifiers, perState:20});
t('20 per state', demo.length === states.length*20, demo.length);
t('every artisan flagged isDemo', demo.every(d=>d.isDemo===true));
t('every artisan has a cluster', demo.every(d=>d.cluster));
t('coords are [lng,lat] numbers', demo.every(d=>d.location.coordinates.length===2 && d.location.coordinates.every(Number.isFinite)));

const passers = demo.filter(d=>d.verification.tier1.status==='PASS');
const failers = demo.filter(d=>d.verification.tier1.status==='FAIL');
t('some genuinely PASS', passers.length>0, passers.length);
t('some genuinely FAIL', failers.length>0, failers.length);
t('failures are 5-30% (not stamped)', failers.length/demo.length>0.05 && failers.length/demo.length<0.30, (failers.length/demo.length*100).toFixed(1)+'%');

// The core honesty claim: failures fail because of a real district mismatch
t('every FAIL has giDistrictMatch=false', failers.every(d=>d.verification.tier1.giDistrictMatch===false));
t('every FAIL cites a real registry reason', failers.every(d=>/registered to|not a registered district|not found in GI registry/.test(d.verification.tier1.reason)));
t('every PASS has giDistrictMatch=true', passers.every(d=>d.verification.tier1.giDistrictMatch===true));
t('every PASS parsed a document number', passers.every(d=>d.verification.tier1.formatValid===true && d.verification.tier1.docNumber));
t('UDYAM parsed over PEHCHAN (strict format wins)', passers.every(d=>d.verification.tier1.docType==='UDYAM'), passers[0]?.verification.tier1.docType);

console.log('\n-- trust score integrity --');
t('failed Tier1 => trustScore 0', failers.every(d=>d.trustScore===0));
t('no demo artisan exceeds 100', demo.every(d=>d.trustScore<=100));
t('unendorsed passers cap at 40', passers.filter(d=>d.verification.tier2.endorsements.length===0).every(d=>d.trustScore===40));
t('no FAIL carries endorsements', failers.every(d=>d.verification.tier2.endorsements.length===0));
t('no FAIL carries reviews', failers.every(d=>d.verification.tier3.reviewCount===0));
t('no FAIL is marked AVAILABLE', failers.every(d=>d.availability.state!=='AVAILABLE'));
t('failed artisans have no UPI id', failers.every(d=>d.upiId===null));

console.log('\n-- reproducibility --');
const a = generateDemoArtisans({clusters, verifiers, perState:5});
const b = generateDemoArtisans({clusters, verifiers, perState:5});
t('seeded RNG is deterministic', JSON.stringify(a.map(x=>x.name))===JSON.stringify(b.map(x=>x.name)));
t('phones unique', new Set(demo.map(d=>d.phone)).size === demo.length);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);

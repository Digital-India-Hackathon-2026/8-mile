process.env.CERT_SIGNING_SECRET = 'testsecret';
process.env.ARTISAN_SHARE = '95';
process.env.INSTITUTION_SHARE = '5';

const { haversineKm, discoveryScore } = await import('../src/utils/haversine.js');
const { findGi, giMatchesDistrict, GI_REGISTRY } = await import('../src/data/giRegistry.js');
const { parseDocument, extractGiClaim } = await import('../src/services/ocrService.js');
const { computeTrustScore, badgeFor } = await import('../src/services/verificationService.js');
const { splitAmount, buildUpiIntent, verifyQrToken } = await import('../src/services/paymentService.js');
const { parseAvailabilityReply } = await import('../src/services/whatsappService.js');
const { hmac } = await import('../src/utils/ids.js');

let pass = 0, fail = 0;
const t = (name, cond, got) => { cond ? (pass++, console.log(`  ok  ${name}`)) : (fail++, console.log(`  FAIL ${name} -> ${JSON.stringify(got)}`)); };

console.log('\n-- Haversine / discovery --');
const jaipur = [75.7873, 26.9124], bagru = [75.545, 26.8125];
const d = haversineKm(jaipur, bagru);
t('Jaipur->Bagru ~30km', d > 25 && d < 35, d.toFixed(1));
const nearMinor = discoveryScore({ distanceKm: 5, significance: 4 });
const farMajor  = discoveryScore({ distanceKm: 40, significance: 10 });
t('significant-far outranks minor-near', farMajor > nearMinor, { nearMinor, farMajor });
const absurdFar = discoveryScore({ distanceKm: 200, significance: 10 });
const goodNear  = discoveryScore({ distanceKm: 5, significance: 9 });
t('guard: sig-10 @200km still loses to sig-9 @5km', goodNear > absurdFar, { absurdFar, goodNear });

console.log('\n-- GI registry --');
t('alias lookup: "pochampally"', findGi('pochampally')?.gi === 'Pochampally Ikat');
t('noisy OCR: "POCHAMPALLY IKKAT "', findGi('POCHAMPALLY IKKAT ')?.gi === 'Pochampally Ikat');
t('unknown claim -> null', findGi('Definitely Not A Craft') === null);
t('correct district passes', giMatchesDistrict(findGi('Bagru'), 'Jaipur', 'Rajasthan').match === true);
const wrong = giMatchesDistrict(findGi('Pochampally Ikat'), 'Jaipur', 'Rajasthan');
t('wrong state FAILS (the demo case)', wrong.match === false, wrong.reason);
const wrongDist = giMatchesDistrict(findGi('Bidriware'), 'Mysuru', 'Karnataka');
t('right state, wrong district FAILS', wrongDist.match === false, wrongDist.reason);

console.log('\n-- OCR parsing --');
const udyam = parseDocument('Some noise UDYAM-TS-05-0043921 more noise');
t('UDYAM strict format parsed', udyam.docType === 'UDYAM' && udyam.strictFormat === true, udyam);
t('UDYAM normalised', udyam.docNumber === 'UDYAM-TS-05-0043921', udyam.docNumber);
const peh = parseDocument('PEHCHAN ARTISAN IDENTITY CARD Artisan ID: TS0714829366');
t('Pehchan shape-only parsed', peh.docType === 'PEHCHAN' && peh.strictFormat === false, peh);
t('garbage -> no doc', parseDocument('hello world').formatValid === false);
t('GI claim extracted from text', extractGiClaim('craft: Pochampally Ikat weaving', GI_REGISTRY) === 'Pochampally Ikat');
t('longest-match wins', extractGiClaim('bagru hand block print', GI_REGISTRY) === 'Bagru Hand Block Print');

console.log('\n-- Trust score ceilings --');
const docOnly = computeTrustScore({ tier1: { formatValid: true, giDistrictMatch: true }, tier2: {}, tier3: {} });
t('forged doc alone caps at 40', docOnly === 40, docOnly);
const oneVerifier = computeTrustScore({ tier1: { formatValid: true, giDistrictMatch: true }, tier2: { endorsements: [1] }, tier3: {} });
t('one bribed verifier caps at 60', oneVerifier === 60, oneVerifier);
const full = computeTrustScore({ tier1: { formatValid: true, giDistrictMatch: true }, tier2: { endorsements: [1,2] }, tier3: { reviewCount: 10, avgRating: 5 } });
t('full stack = 100', full === 100, full);
t('failed tier1 -> Unverified badge', badgeFor({ trustScore: 90, verification: { tier1: { status: 'FAIL' } } }).label === 'Unverified');
t('tier1 pass, low score -> Document Verified', badgeFor({ trustScore: 40, verification: { tier1: { status: 'PASS' } } }).label === 'Document Verified');

console.log('\n-- Payment split --');
const s = splitAmount(1500);
t('1500 -> 1425 / 75', s.artisanInr === 1425 && s.institutionInr === 75, s);
const odd = splitAmount(1499);
t('no rupee lost on odd amounts', odd.artisanInr + odd.institutionInr === 1499, odd);
const intent = buildUpiIntent({ payeeVpa: 'crafttrail@upi', payeeName: 'CraftTrail Escrow', amountInr: 1500, note: 'CraftTrail ESC_ABC' });
t('UPI intent is a real upi:// URI', intent.startsWith('upi://pay?') && intent.includes('am=1500.00') && intent.includes('cu=INR'), intent);
const tok = hmac('ESC_X:bk1', 'testsecret');
t('valid QR token accepted', verifyQrToken({ escrowId: 'ESC_X', bookingId: 'bk1', token: tok }) === true);
t('forged QR token rejected', verifyQrToken({ escrowId: 'ESC_X', bookingId: 'bk1', token: 'deadbeef' }) === false);

console.log('\n-- WhatsApp parsing --');
t('"YES"', parseAvailabilityReply('YES') === 'AVAILABLE');
t('"haan ji"', parseAvailabilityReply('haan ji') === 'AVAILABLE');
t('Hindi "हाँ"', parseAvailabilityReply('हाँ') === 'AVAILABLE');
t('Telugu "అవును"', parseAvailabilityReply('అవును') === 'AVAILABLE');
t('"nahi"', parseAvailabilityReply('nahi') === 'UNAVAILABLE');
t('gibberish -> null (escalate)', parseAvailabilityReply('kya matlab bhai') === null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

# CraftTrail — Backend (Phase 1)

Node + Express + MongoDB. Implements all five pillars server-side.

## Setup (Windows)

```bash
cd server
npm install
copy .env.example .env      # then edit MONGO_URI + secrets
npm run seed                # 15 clusters, 6 verifiers, 10 artisans
npm run dev                 # http://localhost:5000
npm test                    # 31 logic tests, no DB needed
```

Need Mongo? Either install MongoDB Community locally, or use a free Atlas
cluster and paste the SRV string into `MONGO_URI`. Atlas is faster to get going
and survives your laptop rebooting at 3am mid-hackathon.

**Set `OCR_MODE=mock` before you demo.** Tesseract on a cold start takes 10–20
seconds. Mock mode returns a canned Pehchan document instantly. Switch to
`OCR_MODE=ocr` when you want to show real OCR on a real photo — just do it
*before* the judges are watching the spinner.

## API

### Pillar 1 — Discovery
| Method | Route | Notes |
|---|---|---|
| GET | `/api/discover?lat=&lng=&radiusKm=150` | Proximity + significance ranked. Returns `unknownUnknowns` count. |
| GET | `/api/discover/artisans/:id` | Full profile, badge, endorsements. Raw OCR text is stripped. |
| GET | `/api/clusters` | All clusters. |

### Pillar 2 — Verification
| Method | Route | Notes |
|---|---|---|
| POST | `/api/artisans` | Onboard, pre-verification. |
| POST | `/api/artisans/:id/verify` | **Tier 1.** multipart field `document`. Returns the full reasoning chain. |
| POST | `/api/artisans/:id/endorse` | **Tier 2.** `{ verifierId, note }` |
| GET | `/api/artisans/:id/audit` | The append-only trail. |
| GET | `/api/verifiers?district=` | SHGs / cooperatives / CSCs. |

### Pillar 3 — Booking & availability
| Method | Route | Notes |
|---|---|---|
| POST | `/api/bookings` | Always creates `PENDING`. Never shows a false confirm. |
| POST | `/api/bookings/:id/confirm` | Creates the escrow hold, returns a scannable QR. |
| POST | `/api/whatsapp/webhook` | `{ from, body }`. "YES" flips the badge live. |
| POST | `/api/whatsapp/prompt/:artisanId` | Send the weekly nudge. |
| POST | `/api/whatsapp/proxy/:artisanId` | Institution sets availability on the artisan's behalf. |

### Pillars 5 → 4 — Settle, then mint
| Method | Route | Notes |
|---|---|---|
| POST | `/api/bookings/:id/complete` | `{ qrToken }` → escrow settles 95/5 **and** the certificate is issued in the same call. |
| GET | `/api/certificates/:code` | Public certificate data. |
| GET | `/api/certificates/:code/verify` | Tamper check. Callable by anyone. |
| POST | `/api/bookings/:id/review` | **Tier 3.** Rates the artisan *and* the verifier. |

## Three things to say precisely on stage

**1. Tier 1 does not prove an artisan is real.** It proves a claim is
*internally consistent with the GI registry*. Seeded artisan `Ramesh Kumar`
claims Pochampally Ikat from Jaipur and fails for exactly that reason — demo
him. That failure is the feature.

**2. The certificate is not a blockchain.** It is an HMAC-SHA256 signature over
a canonical payload. `GET /api/certificates/:code/verify` returns
`valid: true/false`. That gives a tourist the property they actually want —
"issued by CraftTrail, not altered" — with no hand-waving.

**3. The escrow is simulated; the UPI intent is not.** `upi://pay?...` is a real
URI any UPI app will open. The hold/split/settle lives in our DB because real
escrow needs a PA licence or a partner. The `payment.split` schema maps 1:1 onto
Razorpay Route, so going live is a service swap, not a rewrite.

## Trust score ceilings (the part judges probe)

```
Tier 1  max 40   document parse 20 + GI/district cross-check 20
Tier 2  max 35   first endorsement 20, second 15
Tier 3  max 25   avgRating × review volume, saturating at 10 reviews
```

A forged document alone caps at **40**. One bribed verifier caps at **60**.
Only sustained real tourist visits get you past that. Nothing else in the
system can be bought.

## Seed demo coordinates

```
Jaipur     lat=26.9124 lng=75.7873   → surfaces Bagru at ~30km
Hyderabad  lat=17.3850 lng=78.4867   → surfaces Pochampally at ~50km
Puri       lat=19.8135 lng=85.8312   → surfaces Raghurajpur
```

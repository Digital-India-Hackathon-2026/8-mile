# CraftTrail

**Location-aware craft discovery with verified artisan access.**

A tourist in Jaipur has no way to learn that Bagru — a 300-year-old natural-dye
block-printing village — sits 30 km away. Search engines only find what you can
already name. That is the problem CraftTrail solves, and it is not a search
problem.

MERN. Node + Express + MongoDB, React + Vite + Leaflet.

---

## Run it

Two terminals.

```bash
# 1 — API
cd server
npm install
copy .env.example .env        # macOS/Linux: cp
npm run seed                  # 15 clusters, 6 verifier institutions, 10 artisans
npm run dev                   # :5000
npm test                      # 31 logic tests, no database needed

# 2 — client
cd client
npm install
copy .env.example .env
npm run dev                   # :5173
```

MongoDB: install Community Edition locally, or point `MONGO_URI` at a free Atlas
cluster. Atlas is faster to set up and survives your laptop rebooting at 3am.

**Set `OCR_MODE=mock` before you present.** Tesseract on a cold start takes
10–20 seconds and the judges will watch the spinner. Switch to `OCR_MODE=ocr`
when you want to show real OCR on a real photograph.

---

## The five pillars, and where each one lives

| Pillar | Backend | Frontend |
|---|---|---|
| 1 · Discovery | `GET /api/discover` — Haversine + significance ranking | `pages/Discover.jsx` |
| 2 · Verification | `services/verificationService.js`, `data/giRegistry.js` | `components/TrustLadder.jsx` |
| 3 · Booking & availability | `controllers/whatsappController.js` | `components/WhatsAppSim.jsx` |
| 4 · Digital authenticity | `services/certificateService.js` | `pages/Certificate.jsx` |
| 5 · UPI escrow split | `services/paymentService.js` | `components/BookingPanel.jsx` |

---

## Demo script — seven minutes

**1. Open on Jaipur.** The headline is generated, not written: *"There are 2
craft villages within 150 km you would never have searched for."* That number
comes from `unknownUnknowns` in the API response. Drag the radius slider down to
25 km and watch it hit zero — the real clusters are all outside the city. That
gap *is* the product.

**2. Open Mohan Lal Chhipa.** The trust ladder is on the right. Do not describe
it — point at the two hairlines. *40: a forged document alone stops here.
60: one bribed verifier stops here.* Three layers, each with a ceiling the layer
below cannot break through.

**3. Now open Ramesh Kumar** (Sanganer cluster). He fails. The reasoning chain
shows exactly which check killed him: he claims Pochampally Ikat while
registered in Jaipur, and Pochampally Ikat is a Telangana GI. **Demo the
failure.** A map where every artisan is green proves nothing.

**4. Expand "Artisan's phone".** Type `हाँ`. Mohan's availability flips to
*Welcoming visitors*, live. He never opened an app. That webhook is the same one
Meta's Cloud API posts to.

**5. Request a visit.** Note the state says *Awaiting the artisan* — never
"Confirmed". Confirm as the artisan, or as the cooperative on their behalf.

**6. Escrow.** ₹1,500 held. The bar shows 95/5. Scan the QR → settled →
₹1,425 to Mohan, ₹75 to the Bagru cooperative that vouched for him.

**7. The certificate opens while you are still standing in the workshop.** The
seal says *Signature verified*, and anyone can re-check it at
`/api/certificates/:code/verify`.

---

## What is real, and what is not

Say these precisely. A judge who knows this space will ask, and an honest answer
is worth more than an over-promise.

**Tier 1 does not prove an artisan is real.** It proves a claim is *internally
consistent with the GI registry*. That is a genuine, automated, un-bribable
check — and it is all it is.

**The certificate is not a blockchain.** It is HMAC-SHA256 over a canonical
payload, with a public verify endpoint. That gives a tourist the property they
actually want — *issued by CraftTrail, unaltered since* — with no hand-waving.
Do not say "blockchain" on stage.

**The escrow is simulated; the UPI intent is not.** `upi://pay?...` is a real
URI any UPI app will open. The hold/split/settle lives in MongoDB, because real
escrow needs a payment-aggregator licence or a partner. The `payment.split`
schema maps 1:1 onto Razorpay Route — going live is a service swap, not a
rewrite.

**Government data is still not API-accessible.** Tier 1 works on user-supplied
documents precisely because the National Artisan Portal is gated behind
Aadhaar/OTP. A post-hackathon MoU upgrades Tier 1 from OCR to live lookup. That
is on the roadmap slide, not in the demo.

**Tier 2 is a data model, not a network.** Six seeded institutions exist and the
endorsement endpoint works. Recruiting actual SHGs is the hard part, and it is
roadmap. Say so.

---

## Trust score

```
Tier 1  max 40   document parse 20 + GI/district cross-check 20
Tier 2  max 35   first endorsement 20, second independent endorsement 15
Tier 3  max 25   avgRating × review volume, saturating at 10 reviews
```

Forge a document: **40**. Bribe one verifier: **60**. Nothing else in the system
can be bought — the remaining 40 requires real tourists completing real visits,
and their reviews rate the verifier as well as the artisan. A verifier who lies
loses accuracy rating, stops receiving bookings, and stops earning their 5%.

---

## Design

The palette is an indigo vat — the fermented dye bath Bagru's dabu printing
depends on. Deep indigo is the ground, undyed resist-cream is the ink, madder
red and haldi yellow are the two accents, and verdigris (oxidised Dhokra bronze)
carries *available now*. The certificate is the only screen that inverts to
cream, because it is the one artifact a tourist will screenshot, and it should
read as paper rather than as a UI card.

Fraunces / Archivo / IBM Plex Mono.

---

## Known gaps

- No auth. Anyone can call `/endorse`. Fine for 24 hours; not fine for a pilot.
- Certificates are not rendered to PDF. The page is the artifact.
- Review submission has a backend endpoint but no UI yet.
- Cluster imagery is unset; `imageUrl` is wired through and empty.

---

# v2 — auth, admin intake, demo data

## What changed

**Light ground, indigo ink.** The palette inverted. Six themes live on
`<html data-theme>`: `clay` (default), `limewash`, `haldi`, `verdigris`,
`madder`, `night`. Three type pairings live on `<html data-type>`: `heritage`,
`clean`, `open`. Both persist to the user record. The certificate is exempt —
a shared certificate must look identical to everyone who opens the link.

**Artisans never sign in.** There are exactly two roles, `tourist` and `admin`.
NGOs and cluster offices collect artisan records on paper; a state tourism
officer enters them through `/admin`. This is why there is no artisan signup,
and why the WhatsApp availability flow exists at all.

**Seeded data.** 28 clusters across all 15 states in the GI registry, 2 verifier
institutions per state, 10 hand-written featured artisans, and 300 generated
demo artisans — 20 per state. Every demo artisan is built from a real cluster,
real craft, real district and real GI tag, carries `isDemo: true`, and is run
through the **actual** Tier-1 cross-check. About 11% fail, across 12 states,
for the same reason a real fraudster would: their GI claim belongs to another
state.

Default admin: `admin@crafttrail.gov.in` (override with `ADMIN_EMAIL` /
`ADMIN_PASSWORD` before seeding).

## Auth boundaries

| Public | Requires an account | Admin only |
|---|---|---|
| Landing, map, `/discover` | Booking | `/admin` |
| Artisan profiles | Reviews | Adding artisans |
| `/cert/:code` — always | Saved interests, themes | Tier-1 / Tier-2 verification |

The landing map is fully browsable signed-out. That is the hook; a signup wall
in front of a discovery product kills the thing that makes it work.

## Known gaps in v2

- `POST /bookings/:id/confirm` and `/complete` are unauthenticated, so the
  WhatsApp and QR simulations work without a login. Fine for a demo; **not fine
  for a pilot.** Gate them before any real money moves.
- `myBookings` matches on `tourist.email` rather than a `user` ObjectId ref.
  Two accounts sharing an email would see each other's bookings.
- Six font families are loaded to serve three type pairings. Page weight cost.
- No PDF certificate export.

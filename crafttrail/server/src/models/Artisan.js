import mongoose from 'mongoose';

const tier1Schema = new mongoose.Schema(
  {
    status: { type: String, enum: ['PENDING', 'PASS', 'FAIL'], default: 'PENDING' },
    docType: { type: String, enum: ['PEHCHAN', 'GI', 'UDYAM', null], default: null },
    docNumber: { type: String, default: null },
    formatValid: { type: Boolean, default: false },
    claimedGi: { type: String, default: null },
    giFound: { type: Boolean, default: false },
    giDistrictMatch: { type: Boolean, default: false },
    reason: { type: String, default: '' },
    ocrConfidence: { type: Number, default: 0 },
    rawText: { type: String, default: '' },
    checkedAt: { type: Date, default: null },
  },
  { _id: false }
);

const tier2Schema = new mongoose.Schema(
  {
    endorsements: [
      {
        verifier: { type: mongoose.Schema.Types.ObjectId, ref: 'Verifier' },
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ['NONE', 'PARTIAL', 'CORROBORATED'], default: 'NONE' },
  },
  { _id: false }
);

const tier3Schema = new mongoose.Schema(
  {
    reviewCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
  },
  { _id: false }
);

const artisanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    phone: { type: String, unique: true, sparse: true },
    craft: { type: String, required: true },
    claimedGi: { type: String, default: null },
    bio: { type: String, default: '' },
    languages: { type: [String], default: ['Hindi'] },
    photos: { type: [String], default: [] },

    cluster: { type: mongoose.Schema.Types.ObjectId, ref: 'Cluster' },
    district: { type: String, required: true },
    state: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },

    verification: {
      tier1: { type: tier1Schema, default: () => ({}) },
      tier2: { type: tier2Schema, default: () => ({}) },
      tier3: { type: tier3Schema, default: () => ({}) },
    },
    trustScore: { type: Number, default: 0 }, // 0..100, recomputed on change

    availability: {
      state: {
        type: String,
        enum: ['AVAILABLE', 'REQUEST_AND_CONFIRM', 'UNAVAILABLE'],
        default: 'REQUEST_AND_CONFIRM',
      },
      source: {
        type: String,
        enum: ['WHATSAPP', 'INSTITUTION_PROXY', 'DEFAULT'],
        default: 'DEFAULT',
      },
      updatedAt: { type: Date, default: Date.now },
    },

    workshop: {
      title: { type: String, default: '' },
      durationMins: { type: Number, default: 90 },
      priceInr: { type: Number, default: 0 },
      capacity: { type: Number, default: 4 },
    },

    // artisan's own UPI -- receives ARTISAN_SHARE at settlement
    upiId: { type: String, default: null },
    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Verifier', default: null },

    isDemo: { type: Boolean, default: false, index: true },

    /* ── Vault fields (managed via hidden admin portal) ─────────── */
    verificationDocs: [{
      label:      { type: String },        // e.g. "Pehchan Card", "GI Certificate"
      fileUrl:    { type: String },        // /uploads/...
      docType:    { type: String },        // 'pehchan' | 'gi' | 'udyam' | 'other'
      uploadedAt: { type: Date, default: Date.now },
      note:       { type: String, default: '' },
    }],

    certificates: [{
      title:       { type: String },       // e.g. "National Crafts Award 2022"
      issuedBy:    { type: String },       // e.g. "Ministry of Textiles"
      issuedDate:  { type: Date },
      fileUrl:     { type: String },
      description: { type: String, default: '' },
    }],

    awards: [{
      title:       { type: String },       // e.g. "Shilp Guru"
      year:        { type: Number },
      awardedBy:   { type: String },
      description: { type: String, default: '' },
      imageUrl:    { type: String, default: '' },
    }],

    productHistory: [{
      productName:  { type: String },
      category:     { type: String },      // e.g. "Saree", "Toy", "Pottery"
      year:         { type: Number },
      description:  { type: String, default: '' },
      priceInr:     { type: Number, default: 0 },
      soldTo:       { type: String, default: '' },   // buyer / exhibition
      imageUrl:     { type: String, default: '' },
    }],
  },
  { timestamps: true }
);

artisanSchema.index({ location: '2dsphere' });

export default mongoose.model('Artisan', artisanSchema);

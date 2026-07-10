import mongoose from 'mongoose';

/**
 * The "Digital Handshake" artifact. Not a blockchain -- an HMAC-signed record.
 * Anyone can hit /api/certificates/:code/verify and confirm the payload was
 * issued by us and has not been edited. That is the honest version of the
 * tamper-evidence claim, and it is fully buildable today.
 */
const certificateSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'Artisan', required: true },

    // denormalised snapshot -- a certificate must stay true even if the
    // artisan later edits their profile
    snapshot: {
      artisanName: String,
      craft: String,
      giTag: String,
      clusterName: String,
      district: String,
      state: String,
      tier1Status: String,
      trustScoreAtIssue: Number,
      heritageNote: String,
      imageUrl: String,
    },

    touristName: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    signature: { type: String, required: true }, // HMAC-SHA256 of canonical payload
  },
  { timestamps: true }
);

export default mongoose.model('Certificate', certificateSchema);

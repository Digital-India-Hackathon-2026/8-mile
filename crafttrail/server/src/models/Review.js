import mongoose from 'mongoose';

/**
 * Tier 3. Note that a review rates BOTH the artisan and (optionally) the
 * Tier-2 verifier who endorsed them. That coupling is what makes a bribed
 * verifier expensive: their accuracy rating decays and they stop earning.
 */
const reviewSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'Artisan', required: true, index: true },
    verifier: { type: mongoose.Schema.Types.ObjectId, ref: 'Verifier', default: null },

    rating: { type: Number, min: 1, max: 5, required: true },
    authenticityConfirmed: { type: Boolean, default: true },
    verifierRating: { type: Number, min: 1, max: 5, default: null },

    text: { type: String, default: '' },
    photos: { type: [String], default: [] },
    touristName: { type: String, default: 'Anonymous' },
  },
  { timestamps: true }
);

export default mongoose.model('Review', reviewSchema);

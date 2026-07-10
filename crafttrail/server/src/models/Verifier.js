import mongoose from 'mongoose';

/**
 * A Tier-2 institution: SHG, cooperative, CSC operator, or cluster development
 * officer. Deliberately NOT our own field staff -- these already exist, already
 * have local knowledge, and are already accountable to their community.
 * Critically, they are themselves rated and audited (Tier 3 rates verifiers).
 */
const verifierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['SHG', 'COOPERATIVE', 'CSC', 'CLUSTER_OFFICER'],
      required: true,
    },
    district: { type: String, required: true },
    state: { type: String, required: true },
    phone: { type: String, required: true },
    upiId: { type: String, default: null }, // receives the institution share
    endorsementCount: { type: Number, default: 0 },
    // reputation of the verifier itself -- a bribed verifier decays here
    accuracyRating: { type: Number, default: 5, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Verifier', verifierSchema);

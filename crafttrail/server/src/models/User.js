import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Two roles only.
 *
 *  tourist -- books visits, saves interests, leaves reviews
 *  admin   -- state tourism officer. Enters artisan records that NGOs and
 *             cluster offices have collected on paper.
 *
 * There is deliberately no `artisan` role. Artisans never sign in. That is the
 * whole premise of the WhatsApp-first availability model: a 55-year-old block
 * printer in Bagru is not going to manage a dashboard, so we do not build one
 * and then pretend they will.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['tourist', 'admin'], default: 'tourist' },

    interests: { type: [String], default: [] },
    homeCity: {
      name: String,
      lat: Number,
      lng: Number,
      state: String,
    },
    savedArtisans:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artisan' }],
    visitedArtisans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artisan' }],
    // appearance is persisted so the choice survives a device change
    prefs: {
      theme: { type: String, default: 'clay' },
      typeface: { type: String, default: 'classic' },
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    interests: this.interests,
    homeCity: this.homeCity,
    savedArtisans: this.savedArtisans,
    visitedArtisans: this.visitedArtisans,
    prefs: this.prefs,
  };
};

export default mongoose.model('User', userSchema);

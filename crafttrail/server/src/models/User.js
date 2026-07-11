// server/src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // Not required — Google-authenticated users have no password.
      // Enforced conditionally below instead of at the schema level.
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    savedArtisans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artisan' }],
    visitedArtisans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artisan' }],
  },
  { timestamps: true }
);

// Password is required only for local (email/password) accounts.
userSchema.pre('validate', function (next) {
  if (this.provider === 'local' && !this.password) {
    this.invalidate('password', 'Password is required for email sign-up.');
  }
  next();
});

// Hash password before saving, but only if it's set and was modified.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false); // Google-only account, no password to check
  return bcrypt.compare(candidate, this.password);
};

// Never send the hash to the client.
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Public representation of user (for API responses)
userSchema.methods.toPublic = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    provider: this.provider,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
import mongoose from 'mongoose';

/**
 * Escrow lifecycle:
 *   PENDING  -> tourist requested, artisan has not confirmed
 *   CONFIRMED-> artisan (or their institution proxy) said yes; money is HELD
 *   COMPLETED-> QR scanned at the workshop, escrow SETTLED and split
 *   CANCELLED-> refunded / released
 */
const bookingSchema = new mongoose.Schema(
  {
    artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'Artisan', required: true, index: true },
    tourist: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    date: { type: Date, required: true },
    slot: { type: String, default: '' }, // "10:00-11:30"
    partySize: { type: Number, default: 1 },
    message: { type: String, default: '' },

    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    confirmedVia: {
      type: String,
      enum: ['WHATSAPP', 'INSTITUTION_PROXY', 'MANUAL', null],
      default: null,
    },

    amountInr: { type: Number, required: true },
    payment: {
      escrowId: { type: String, default: null },
      status: {
        type: String,
        enum: ['NONE', 'HELD', 'SETTLED', 'REFUNDED'],
        default: 'NONE',
      },
      upiIntent: { type: String, default: null },
      qrToken: { type: String, default: null },
      split: {
        artisanInr: { type: Number, default: 0 },
        institutionInr: { type: Number, default: 0 },
        artisanUpi: { type: String, default: null },
        institutionUpi: { type: String, default: null },
      },
      settledAt: { type: Date, default: null },
    },

    certificateCode: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Booking', bookingSchema);

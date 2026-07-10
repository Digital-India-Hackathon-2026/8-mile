import mongoose from 'mongoose';

/** Append-only trail. Every verification action is attributable and reversible. */
const auditLogSchema = new mongoose.Schema(
  {
    actorType: { type: String, enum: ['SYSTEM', 'VERIFIER', 'TOURIST', 'ARTISAN'], required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    artisan: { type: mongoose.Schema.Types.ObjectId, ref: 'Artisan', index: true },
    action: { type: String, required: true },
    detail: { type: mongoose.Schema.Types.Mixed, default: {} },
    at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.model('AuditLog', auditLogSchema);

import mongoose from 'mongoose';

const clusterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    craft: { type: String, required: true },
    giTag: { type: String, default: null },
    district: { type: String, required: true },
    state: { type: String, required: true },
    // GeoJSON: [longitude, latitude] -- note the order, it bites everyone once
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    significance: { type: Number, min: 1, max: 10, default: 5 },
    heritageNote: { type: String, default: '' },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    odopProduct: { type: String, default: null },
  },
  { timestamps: true }
);

clusterSchema.index({ location: '2dsphere' });

export default mongoose.model('Cluster', clusterSchema);

import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  imagePublicId: { type: String, required: true } // ✅ NEW FIELD
}, {
  timestamps: true
});

export const Event = mongoose.model('Event', eventSchema);
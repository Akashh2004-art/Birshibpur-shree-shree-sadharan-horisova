import mongoose, { Document, Schema } from 'mongoose';

// Interface for Gallery document
export interface IGallery extends Document {
  _id: string;
  url: string;
  title: string;
  category: 'মন্দির' | 'অনুষ্ঠান' | 'ঠাকুর' | 'দৈনন্দিন';
  type: 'image' | 'video';
  uploadDate: Date;
  fileSize?: number;
  filename: string;
  mimetype: string;
  cloudinaryId?: string; // ✅ Cloudinary public_id for deletion
  uploadedBy?: mongoose.Types.ObjectId;
}

// Gallery Schema
const gallerySchema = new Schema<IGallery>({
  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['মন্দির', 'অনুষ্ঠান', 'ঠাকুর', 'দৈনন্দিন'],
  },
  type: {
    type: String,
    required: true,
    enum: ['image', 'video'],
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  fileSize: {
    type: Number,
  },
  filename: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String, // ✅ Store Cloudinary public_id for deletion
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
});

// Index for faster queries
gallerySchema.index({ category: 1, uploadDate: -1 });
gallerySchema.index({ type: 1 });
gallerySchema.index({ cloudinaryId: 1 }); // ✅ Index for Cloudinary ID

export const Gallery = mongoose.model<IGallery>('Gallery', gallerySchema);
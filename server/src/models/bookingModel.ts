import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  userPhone: string;
  serviceId: number;
  serviceName: string;
  date: Date;
  time: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  userPhone: {
    type: String,
    required: true,
    trim: true
  },
  serviceId: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ date: 1, time: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ serviceId: 1 });

// Prevent duplicate bookings for same user, service, date and time
bookingSchema.index(
  { userId: 1, serviceId: 1, date: 1, time: 1 },
  { 
    unique: true,
    partialFilterExpression: { status: { $ne: 'rejected' } }
  }
);

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
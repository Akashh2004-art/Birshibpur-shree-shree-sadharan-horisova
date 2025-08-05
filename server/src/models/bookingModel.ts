import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  serviceId: number;
  serviceName: string;
  date: Date;
  time: string;
  people: number;
  message?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  cancellationReason?: string;
}

const bookingSchema = new Schema<IBooking>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  serviceId: {
    type: Number,
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    validate: {
      validator: function(value: Date) {
        // Date should be at least tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return value >= tomorrow;
      },
      message: 'Booking date must be at least tomorrow'
    }
  },
  time: {
    type: String,
    required: true
  },
  people: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  confirmedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Admin'
  },
  confirmedAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ date: 1, time: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ email: 1 });

// Virtual for checking if booking is upcoming
bookingSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date();
});

// Pre-save middleware to validate service capacity
bookingSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('date') || this.isModified('time') || this.isModified('serviceId')) {
    // Check if there are already bookings for the same service, date, and time
    const existingBookings = await Booking.find({
      serviceId: this.serviceId,
      date: this.date,
      time: this.time,
      status: { $in: ['pending', 'confirmed'] },
      _id: { $ne: this._id }
    });

    const totalPeople = existingBookings.reduce((sum, booking) => sum + booking.people, 0) + this.people;
    
    // Service capacity limits (should match frontend data)
    const serviceCapacity: { [key: number]: number } = {
      1: 20, // নিত্য পূজা
      2: 30, // বিশেষ অর্চনা
      3: 50  // সত্যনারায়ণ পূজা
    };

    if (totalPeople > (serviceCapacity[this.serviceId] || 20)) {
      const error = new Error(`Service capacity exceeded. Maximum ${serviceCapacity[this.serviceId]} people allowed.`);
      return next(error);
    }
  }
  next();
});

// Static method to get user's current active booking
bookingSchema.statics.getCurrentBooking = function(userId: string) {
  return this.findOne({
    userId,
    status: { $in: ['pending', 'confirmed'] },
    date: { $gte: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to check if user can book (no pending bookings)
bookingSchema.statics.canUserBook = async function(userId: string) {
  const pendingBooking = await this.findOne({
    userId,
    status: 'pending'
  });
  return !pendingBooking;
};

// Instance method to confirm booking
bookingSchema.methods.confirm = function(adminId: string) {
  this.status = 'confirmed';
  this.confirmedBy = adminId;
  this.confirmedAt = new Date();
  return this.save();
};

// Instance method to cancel booking
bookingSchema.methods.cancel = function(reason?: string) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  return this.save();
};

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
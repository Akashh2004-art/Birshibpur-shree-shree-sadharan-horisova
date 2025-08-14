import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  firebaseUID?: string;
  authProvider: 'email' | 'phone' | 'google';
  isVerified: boolean;
  religion?: string; // Optional field, no default
  otp?: string; // OTP সংরক্ষণের জন্য
  otpExpires?: Date; // OTP মেয়াদ শেষ হওয়ার সময়
  role?: 'admin' | 'user'; // Optional field, no default
  status?: 'active' | 'inactive'; // Optional field, no default
  photoURL?: string; // For Google users
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    firebaseUID: {
      type: String,
      trim: true,
    },
    authProvider: {
      type: String,
      enum: ['email', 'phone', 'google'],
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // This is okay to keep as default
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    photoURL: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ firebaseUID: 1 });
userSchema.index({ authProvider: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  firebaseUID?: string;
  authProvider: 'email' | 'phone' | 'google';
  isVerified: boolean;
  religion?: string;
  otp?: string; // OTP সংরক্ষণের জন্য
  otpExpires?: Date; // OTP মেয়াদ শেষ হওয়ার সময়
  role: 'admin' | 'user'; // নতুনভাবে ভূমিকা যোগ
  status: 'active' | 'inactive'; // নতুনভাবে স্ট্যাটাস যোগ
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
      default: false,
    },
    religion: {
      type: String,
      trim: true,
      default: 'Hindu',
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user', // ডিফল্ট ভূমিকা ইউজার
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active', // ডিফল্ট স্ট্যাটাস অ্যাকটিভ
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>('User', userSchema);

export default User;
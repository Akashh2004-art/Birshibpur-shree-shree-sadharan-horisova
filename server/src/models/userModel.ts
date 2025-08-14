import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email?: string;
  phone?: string;
  password?: string; // Optional for Google users
  firebaseUID?: string;
  authProvider: 'email' | 'phone' | 'google';
  isVerified: boolean;
  isAdmin: boolean; // Added for admin functionality
  photoURL?: string; // For Google users
  // Removed religion, role, status, otp, otpExpires - not needed for Google auth
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      required: function() {
        // Name required for Google users, optional for others
        return this.authProvider === 'google';
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      required: function() {
        // Email required for Google and email auth
        return this.authProvider === 'google' || this.authProvider === 'email';
      }
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      // Optional for all auth types
    },
    password: {
      type: String,
      required: function() {
        // Password NOT required for Google users
        return this.authProvider !== 'google';
      }
    },
    firebaseUID: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Allows null values to be non-unique
      required: function() {
        // Firebase UID required only for Google auth
        return this.authProvider === 'google';
      }
    },
    authProvider: {
      type: String,
      enum: ['email', 'phone', 'google'],
      required: true,
      default: 'email'
    },
    isVerified: {
      type: Boolean,
      default: function() {
        // Google users are auto-verified
        return this.authProvider === 'google';
      }
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    photoURL: {
      type: String,
      trim: true,
    }
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
userSchema.index({ isAdmin: 1 });

// Compound index for Google users
userSchema.index({ firebaseUID: 1, authProvider: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
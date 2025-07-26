import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IAdmin extends Document {
  firebaseUID: string;
  displayName: string;
  email: string;
  password?: string;
  role: 'admin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>({
  firebaseUID: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin',
    required: true
  }
}, {
  timestamps: true
});


// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  try {
    const admin = this;
    
    // Only hash the password if it has been modified (or is new)
    if (!admin.isModified('password')) {
      return next();
    }
    
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    if (admin.password) {
      const hashedPassword = await bcrypt.hash(admin.password, salt);
      admin.password = hashedPassword;
      console.log('Password hashed successfully');
    }
    
    next();
  } catch (error) {
    console.error('Error in password hashing:', error);
    next(error as Error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password || '');
  } catch (error) {
    return false;
  }
};

const Admin = mongoose.model<IAdmin>('Admin', adminSchema);
export default Admin;
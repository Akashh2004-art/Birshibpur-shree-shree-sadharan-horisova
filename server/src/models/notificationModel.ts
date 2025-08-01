import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  // ✅ NEW: Email tracking fields
  emailCount?: number; // How many emails were sent
  eventTitle?: string; // Event title for event notifications
  action?: 'created' | 'updated' | 'deleted'; // Action type for events
}

const NotificationSchema: Schema = new Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['signup', 'event', 'booking', 'donation', 'system'] // Define allowed types
  },
  message: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  // ✅ NEW: Email tracking fields
  emailCount: {
    type: Number,
    default: 0,
    min: 0
  },
  eventTitle: {
    type: String,
    trim: true
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted']
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for better performance
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ read: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
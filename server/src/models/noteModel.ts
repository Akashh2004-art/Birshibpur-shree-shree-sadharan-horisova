import mongoose, { Document, Schema } from 'mongoose';

// Note interface
export interface INote extends Document {
  _id: string;
  date: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Note Schema
const noteSchema: Schema = new Schema(
  {
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxLength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create and export the Note model
const Note = mongoose.model<INote>('Note', noteSchema);
export default Note;
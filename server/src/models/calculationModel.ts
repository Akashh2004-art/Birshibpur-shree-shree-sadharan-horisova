import mongoose, { Schema, Document } from 'mongoose';

// Interface for calculation items
interface ICalculationItem {
  id: string;
  name: string;
  amount: number;
}

// Interface for calculation document
interface ICalculation extends Document {
  date: string;
  title: string;
  items: ICalculationItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for calculation items
const calculationItemSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false });

// Schema for calculations
const calculationSchema: Schema = new Schema({
  date: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  items: {
    type: [calculationItemSchema],
    required: true,
    validate: {
      validator: function(items: ICalculationItem[]) {
        return items.length > 0;
      },
      message: 'At least one calculation item is required'
    }
  },
  total: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'calculations'
});

// Index for better query performance
calculationSchema.index({ createdAt: -1 });
calculationSchema.index({ date: -1 });
calculationSchema.index({ title: 'text' });

// Pre-save middleware to calculate total
calculationSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.total = this.items.reduce((sum: number, item: ICalculationItem) => {
      return sum + (item.amount || 0);
    }, 0);
  }
  next();
});

// Export the model
const Calculation = mongoose.model<ICalculation>('Calculation', calculationSchema);

export { Calculation, ICalculation, ICalculationItem };
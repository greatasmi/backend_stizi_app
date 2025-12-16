import mongoose, { Document, Schema } from 'mongoose';

export interface IStamp extends Document {
  name: string;
  description: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  qrCode: string;
  imageUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  collectedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const stampSchema = new Schema<IStamp>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  qrCode: {
    type: String,
    required: true,
    unique: true,
  },
  imageUrl: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collectedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

stampSchema.index({ location: '2dsphere' });

export default mongoose.model<IStamp>('Stamp', stampSchema);
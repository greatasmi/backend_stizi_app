import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  phoneNumber: string;
  name?: string;
  email?: string;
  password?: string;
  otp?: string;
  otpExpiry?: Date;
  isVerified: boolean;
  stamps: mongoose.Types.ObjectId[];
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    minlength: 6,
  },
  otp: String,
  otpExpiry: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },
  stamps: [{
    type: Schema.Types.ObjectId,
    ref: 'Stamp',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
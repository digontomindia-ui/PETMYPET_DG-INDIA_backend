import { model, Schema } from 'mongoose';
import { ROLES } from '../../common/constants/roles.js';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { USER_MODEL_NAME } from './user.constants.js';
import type { IAddress, IUser, IUserPreferences } from './user.types.js';

const addressSchema = new Schema<IAddress>(
  {
    label: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const preferencesSchema = new Schema<IUserPreferences>(
  {
    language: { type: String, default: 'en' },
    smsNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    role: { type: String, enum: Object.values(ROLES), required: true, default: ROLES.USER },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    avatarUrl: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    addresses: { type: [addressSchema], default: [] },
    preferences: { type: preferencesSchema, default: () => ({}) },
    deviceTokens: { type: [String], default: [] },
  },
  { timestamps: true },
);

// Partial unique indexes so uniqueness only applies to active (non-soft-deleted) accounts,
// allowing an email/phone to be reused once the original account is deleted.
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ role: 1 });
userSchema.index({ 'addresses.location': '2dsphere' });

userSchema.plugin(softDeletePlugin);

export const UserModel = model<IUser>(USER_MODEL_NAME, userSchema);

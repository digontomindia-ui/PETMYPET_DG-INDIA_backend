import { model, Schema } from 'mongoose';
import { ROLES } from '../../common/constants/roles.js';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { USER_MODEL_NAME } from './user.constants.js';
import type { IAddress, IEmergencyContact, IUser, IUserPreferences } from './user.types.js';

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

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    role: { type: String, enum: Object.values(ROLES), required: true, default: ROLES.USER },
    // Not required: an account created via phone+OTP (the end-user app's actual LogIn
    // screen — it never collects a name) only gets one once "Your Profile" onboarding
    // runs PUT /users/me. Defaults to '' rather than being left unset so PublicUser.name
    // can stay a plain `string`, matching every other consumer of this field.
    name: { type: String, trim: true, maxlength: 120, default: '' },
    // Not required, and no default — must be genuinely absent (not '') for phone-only
    // accounts so the sparse-style unique index below doesn't collide across them.
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    // Not required: phone+OTP accounts have no password until/unless the user later sets
    // one. `select: false` already hides it by default; login methods must null-check it.
    passwordHash: { type: String, select: false, default: null },
    avatarUrl: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    identityVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    addresses: { type: [addressSchema], default: [] },
    preferences: { type: preferencesSchema, default: () => ({}) },
    deviceTokens: { type: [String], default: [] },
    // Onboarding "Preferences" screen fields — separate from `preferences` above since
    // those are notification toggles, not service/contact info.
    serviceInterests: { type: [String], default: [] },
    emergencyContact: { type: emergencyContactSchema, default: null },
    // No `default: null` here on purpose — a sparse unique index only excludes documents
    // where the field is genuinely absent, not ones explicitly set to null. Leaving it
    // unset until referral.service.ts lazily generates one keeps the index sparse in practice.
    referralCode: { type: String },
    referredBy: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, default: null },
  },
  { timestamps: true },
);

// Partial unique indexes so uniqueness only applies to active (non-soft-deleted) accounts,
// allowing an email/phone to be reused once the original account is deleted.
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false, email: { $exists: true } } },
);
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ role: 1 });
userSchema.index({ 'addresses.location': '2dsphere' });
userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });

userSchema.plugin(softDeletePlugin);

export const UserModel = model<IUser>(USER_MODEL_NAME, userSchema);

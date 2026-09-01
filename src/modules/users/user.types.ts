import type { HydratedDocument, Types } from 'mongoose';
import type { Role } from '../../common/constants/roles.js';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';

export interface IAddress {
  _id: Types.ObjectId;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  isDefault: boolean;
}

export interface IUserPreferences {
  language: string;
  smsNotifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface IEmergencyContact {
  name: string;
  phone: string;
}

export interface IUser extends SoftDeletable {
  _id: Types.ObjectId;
  role: Role;
  name: string;
  email: string | null;
  phone: string;
  passwordHash: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  /** No real identity-verification flow exists yet (no KYC/ID-upload for end users) — this
   * stays false until one is built; admins can flip it manually in the meantime. */
  identityVerified: boolean;
  isBlocked: boolean;
  addresses: Types.DocumentArray<IAddress>;
  preferences: IUserPreferences;
  deviceTokens: string[];
  serviceInterests: string[];
  emergencyContact: IEmergencyContact | null;
  referralCode: string | null;
  referredBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

export interface PublicUser {
  id: string;
  role: Role;
  name: string;
  email: string | null;
  phone: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isBlocked: boolean;
  addresses: IAddress[];
  preferences: IUserPreferences;
  serviceInterests: string[];
  emergencyContact: IEmergencyContact | null;
  referralCode: string | null;
  createdAt: Date;
  updatedAt: Date;
}

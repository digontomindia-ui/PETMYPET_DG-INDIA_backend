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

export interface IUser extends SoftDeletable {
  _id: Types.ObjectId;
  role: Role;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isBlocked: boolean;
  addresses: Types.DocumentArray<IAddress>;
  preferences: IUserPreferences;
  deviceTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

export interface PublicUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isBlocked: boolean;
  addresses: IAddress[];
  preferences: IUserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

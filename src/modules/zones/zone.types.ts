import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type { WEEKDAYS } from './zone.constants.js';

export type Weekday = (typeof WEEKDAYS)[number];

export interface IWorkingHours {
  day: Weekday;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface ICity extends SoftDeletable {
  _id: Types.ObjectId;
  name: string;
  state: string;
  country: string;
  isActive: boolean;
  workingHours: IWorkingHours[];
  createdAt: Date;
  updatedAt: Date;
}

export type CityDocument = HydratedDocument<ICity>;

export interface IZone extends SoftDeletable {
  _id: Types.ObjectId;
  name: string;
  cityId: Types.ObjectId;
  center: { type: 'Point'; coordinates: [number, number] };
  radiusMeters: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ZoneDocument = HydratedDocument<IZone>;

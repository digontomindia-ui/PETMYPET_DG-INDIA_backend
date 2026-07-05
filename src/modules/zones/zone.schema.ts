import { model, Schema } from 'mongoose';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { CITY_MODEL_NAME, WEEKDAYS, ZONE_MODEL_NAME } from './zone.constants.js';
import type { ICity, IWorkingHours, IZone } from './zone.types.js';

const workingHoursSchema = new Schema<IWorkingHours>(
  {
    day: { type: String, enum: WEEKDAYS, required: true },
    openTime: { type: String, default: '09:00' },
    closeTime: { type: String, default: '21:00' },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false },
);

const citySchema = new Schema<ICity>(
  {
    name: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'India' },
    isActive: { type: Boolean, default: true },
    workingHours: { type: [workingHoursSchema], default: [] },
  },
  { timestamps: true },
);

citySchema.index(
  { name: 1, state: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
citySchema.plugin(softDeletePlugin);

export const CityModel = model<ICity>(CITY_MODEL_NAME, citySchema);

const zoneSchema = new Schema<IZone>(
  {
    name: { type: String, required: true, trim: true },
    cityId: { type: Schema.Types.ObjectId, ref: CITY_MODEL_NAME, required: true },
    center: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    radiusMeters: { type: Number, required: true, min: 100, default: 5000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

zoneSchema.index({ center: '2dsphere' });
zoneSchema.index({ cityId: 1, isActive: 1 });
zoneSchema.plugin(softDeletePlugin);

export const ZoneModel = model<IZone>(ZONE_MODEL_NAME, zoneSchema);

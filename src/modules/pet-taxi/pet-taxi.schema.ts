import { model, Schema } from 'mongoose';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { PET_MODEL_NAME } from '../pets/pet.constants.js';
import {
  PET_TAXI_MODEL_NAME,
  PET_TAXI_STATUSES,
  PET_TAXI_TRIP_TYPES,
} from './pet-taxi.constants.js';
import type { IPetTaxiBooking } from './pet-taxi.types.js';

const petTaxiBookingSchema = new Schema<IPetTaxiBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    tripType: { type: String, enum: Object.values(PET_TAXI_TRIP_TYPES), required: true },
    petIds: {
      type: [{ type: Schema.Types.ObjectId, ref: PET_MODEL_NAME }],
      required: true,
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: 'At least one pet is required',
      },
    },
    pickupAddress: { type: String, required: true, minlength: 1, maxlength: 500 },
    dropAddress: { type: String, required: true, minlength: 1, maxlength: 500 },
    pickupDate: { type: Date, required: true },
    pickupTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: Object.values(PET_TAXI_STATUSES),
      default: PET_TAXI_STATUSES.PENDING,
    },
    cancellationReason: { type: String, default: null },
  },
  { timestamps: true },
);

petTaxiBookingSchema.index({ userId: 1, createdAt: -1 });
petTaxiBookingSchema.plugin(softDeletePlugin);

export const PetTaxiBookingModel = model<IPetTaxiBooking>(
  PET_TAXI_MODEL_NAME,
  petTaxiBookingSchema,
);

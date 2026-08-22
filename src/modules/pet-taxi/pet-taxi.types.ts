import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type { PetTaxiStatus, PetTaxiTripType } from './pet-taxi.constants.js';

export interface IPetTaxiBooking extends SoftDeletable {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tripType: PetTaxiTripType;
  petIds: Types.ObjectId[];
  pickupAddress: string;
  dropAddress: string;
  pickupDate: Date;
  pickupTime: string;
  price: number;
  currency: string;
  status: PetTaxiStatus;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PetTaxiBookingDocument = HydratedDocument<IPetTaxiBooking>;

import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type {
  RelocationStatus,
  TimeSlot,
  TransportType,
} from './pet-relocation.constants.js';

export interface IRelocationRequest extends SoftDeletable {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  petId: Types.ObjectId;
  originAddress: string;
  destinationAddress: string;
  relocationDate: Date;
  transportType: TransportType;
  preferredTimeSlot: TimeSlot;
  status: RelocationStatus;
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RelocationRequestDocument = HydratedDocument<IRelocationRequest>;

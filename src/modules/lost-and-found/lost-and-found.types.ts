import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type {
  ApprovalStatus,
  LostAndFoundStatus,
  LostAndFoundType,
} from './lost-and-found.constants.js';

export interface ILostAndFoundPost extends SoftDeletable {
  _id: Types.ObjectId;
  reporterId: Types.ObjectId;
  type: LostAndFoundType;
  petName: string;
  species: string;
  breed: string;
  description: string;
  photoUrls: string[];
  lastSeenLocation: { type: 'Point'; coordinates: [number, number] } | null;
  contactPhone: string;
  status: LostAndFoundStatus;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type LostAndFoundDocument = HydratedDocument<ILostAndFoundPost>;

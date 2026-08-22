import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type { ApplicationStatus, PetType } from './pet-insurance.constants.js';

export interface IInsuranceApplication extends SoftDeletable {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  petName: string;
  petType: PetType;
  petAge: string;
  petBreed: string;
  previousIllness: boolean;
  illnessDocumentUrls: string[];
  previousSurgery: boolean;
  vaccinated: boolean;
  vaccinationDocumentUrls: string[];
  status: ApplicationStatus;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type InsuranceApplicationDocument = HydratedDocument<IInsuranceApplication>;

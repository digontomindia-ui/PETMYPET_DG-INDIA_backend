import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type { PetGender, PetSpecies } from './pet.constants.js';

export interface IMedicalRecord {
  _id: Types.ObjectId;
  title: string;
  description: string;
  fileUrl: string | null;
  providerId: Types.ObjectId | null;
  recordedAt: Date;
}

export interface IVaccination {
  _id: Types.ObjectId;
  name: string;
  administeredAt: Date;
  expiresAt: Date | null;
  certificateUrl: string | null;
  providerId: Types.ObjectId | null;
}

export interface IPet extends SoftDeletable {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  species: PetSpecies;
  breed: string;
  gender: PetGender;
  dateOfBirth: Date | null;
  weightKg: number | null;
  avatarUrl: string | null;
  notes: string;
  medicalRecords: Types.DocumentArray<IMedicalRecord>;
  vaccinations: Types.DocumentArray<IVaccination>;
  createdAt: Date;
  updatedAt: Date;
}

export type PetDocument = HydratedDocument<IPet>;

export interface PublicPet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  gender: PetGender;
  dateOfBirth: Date | null;
  weightKg: number | null;
  avatarUrl: string | null;
  notes: string;
  medicalRecords: IMedicalRecord[];
  vaccinations: IVaccination[];
  createdAt: Date;
}

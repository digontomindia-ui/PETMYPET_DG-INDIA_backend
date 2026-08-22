import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type { CompanionActivityLevel, PetGender, PetSpecies } from './pet.constants.js';

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

export interface ICompanionGetsAlongWith {
  dogs: boolean;
  cats: boolean;
  kids: boolean;
  families: boolean;
}

export interface ICompanionProfile {
  isEnabled: boolean;
  bio: string;
  personalityTraits: string[];
  interests: string[];
  lookingFor: string[];
  activityLevel: CompanionActivityLevel;
  temperament: string;
  getsAlongWith: ICompanionGetsAlongWith;
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
  companionProfile: ICompanionProfile | null;
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
  companionProfile: ICompanionProfile | null;
  createdAt: Date;
}

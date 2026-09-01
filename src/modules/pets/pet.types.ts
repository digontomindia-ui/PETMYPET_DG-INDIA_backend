import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type {
  CompanionActivityLevel,
  GetsAlongWithStatus,
  PetActivityType,
  PetGender,
  PetSpecies,
} from './pet.constants.js';

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

export interface IPetActivity {
  _id: Types.ObjectId;
  type: PetActivityType;
  title: string;
  location: string | null;
  occurredAt: Date;
}

export interface ICompanionGetsAlongWith {
  dogs: GetsAlongWithStatus;
  cats: GetsAlongWithStatus;
  kids: GetsAlongWithStatus;
  families: GetsAlongWithStatus;
}

export interface ICompanionProfile {
  isEnabled: boolean;
  bio: string;
  personalityTraits: string[];
  interests: string[];
  lookingFor: string[];
  activityLevel: CompanionActivityLevel;
  temperament: string;
  neutered: boolean;
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
  /** Extra photos for the companion detail page's gallery. */
  galleryUrls: string[];
  notes: string;
  medicalRecords: Types.DocumentArray<IMedicalRecord>;
  vaccinations: Types.DocumentArray<IVaccination>;
  /** Manually logged by the owner — "Recent Activities" on the companion detail page. */
  activities: Types.DocumentArray<IPetActivity>;
  companionProfile: ICompanionProfile | null;
  /** Companion-profile page views by other users. Only incremented via
   * GET /pet-companion/pets/:id, never by the owner's own /pets/:id. */
  viewCount: number;
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
  galleryUrls: string[];
  notes: string;
  medicalRecords: IMedicalRecord[];
  vaccinations: IVaccination[];
  activities: IPetActivity[];
  companionProfile: ICompanionProfile | null;
  createdAt: Date;
}

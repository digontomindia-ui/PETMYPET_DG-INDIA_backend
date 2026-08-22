import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { ROLES } from '../../common/constants/roles.js';
import { COMPANION_ACTIVITY_LEVELS, GETS_ALONG_WITH_STATUS } from './pet.constants.js';
import { petRepository } from './pet.repository.js';
import { toPublicPet } from './pet.mapper.js';
import type {
  AddMedicalRecordInput,
  AddVaccinationInput,
  CreatePetInput,
  UpdateCompanionProfileInput,
  UpdatePetInput,
} from './pet.dto.js';
import type { PetDocument } from './pet.types.js';

async function requireOwnedPet(petId: string, userId: string, role: string): Promise<PetDocument> {
  const pet = await petRepository.findById(petId);
  if (!pet) throw AppError.notFound('Pet not found');
  if (pet.ownerId.toString() !== userId && role !== ROLES.SUPER_ADMIN) {
    throw AppError.forbidden('You do not have access to this pet');
  }
  return pet;
}

export const petService = {
  async create(ownerId: string, input: CreatePetInput) {
    const pet = await petRepository.create({ ...input, ownerId: new Types.ObjectId(ownerId) });
    return toPublicPet(pet);
  },

  async listMine(ownerId: string) {
    const pets = await petRepository.findByOwner(ownerId);
    return pets.map(toPublicPet);
  },

  async getById(petId: string, userId: string, role: string) {
    const pet = await requireOwnedPet(petId, userId, role);
    return toPublicPet(pet);
  },

  async update(petId: string, userId: string, role: string, input: UpdatePetInput) {
    const pet = await requireOwnedPet(petId, userId, role);
    Object.assign(pet, input);
    await pet.save();
    return toPublicPet(pet);
  },

  async remove(petId: string, userId: string, role: string): Promise<void> {
    const pet = await requireOwnedPet(petId, userId, role);
    await pet.softDelete();
  },

  async addMedicalRecord(
    petId: string,
    userId: string,
    role: string,
    input: AddMedicalRecordInput,
  ) {
    const pet = await requireOwnedPet(petId, userId, role);
    pet.medicalRecords.push({
      title: input.title,
      description: input.description,
      fileUrl: input.fileUrl ?? null,
      providerId: null,
      recordedAt: new Date(),
    });
    await pet.save();
    return toPublicPet(pet);
  },

  async addVaccination(petId: string, userId: string, role: string, input: AddVaccinationInput) {
    const pet = await requireOwnedPet(petId, userId, role);
    pet.vaccinations.push({
      name: input.name,
      administeredAt: input.administeredAt,
      expiresAt: input.expiresAt ?? null,
      certificateUrl: input.certificateUrl ?? null,
      providerId: null,
    });
    await pet.save();
    return toPublicPet(pet);
  },

  async removeMedicalRecord(petId: string, userId: string, role: string, recordId: string) {
    const pet = await requireOwnedPet(petId, userId, role);
    const record = pet.medicalRecords.id(recordId);
    if (!record) throw AppError.notFound('Medical record not found');
    record.deleteOne();
    await pet.save();
    return toPublicPet(pet);
  },

  async removeVaccination(petId: string, userId: string, role: string, recordId: string) {
    const pet = await requireOwnedPet(petId, userId, role);
    const record = pet.vaccinations.id(recordId);
    if (!record) throw AppError.notFound('Vaccination not found');
    record.deleteOne();
    await pet.save();
    return toPublicPet(pet);
  },

  async updateCompanionProfile(
    petId: string,
    userId: string,
    role: string,
    input: UpdateCompanionProfileInput,
  ) {
    const pet = await requireOwnedPet(petId, userId, role);
    const existing = pet.companionProfile;
    pet.companionProfile = {
      isEnabled: input.isEnabled ?? existing?.isEnabled ?? false,
      bio: input.bio ?? existing?.bio ?? '',
      personalityTraits: input.personalityTraits ?? existing?.personalityTraits ?? [],
      interests: input.interests ?? existing?.interests ?? [],
      lookingFor: input.lookingFor ?? existing?.lookingFor ?? [],
      activityLevel: input.activityLevel ?? existing?.activityLevel ?? COMPANION_ACTIVITY_LEVELS.MEDIUM,
      temperament: input.temperament ?? existing?.temperament ?? '',
      neutered: input.neutered ?? existing?.neutered ?? false,
      getsAlongWith: {
        dogs: input.getsAlongWith?.dogs ?? existing?.getsAlongWith?.dogs ?? GETS_ALONG_WITH_STATUS.YES,
        cats: input.getsAlongWith?.cats ?? existing?.getsAlongWith?.cats ?? GETS_ALONG_WITH_STATUS.YES,
        kids: input.getsAlongWith?.kids ?? existing?.getsAlongWith?.kids ?? GETS_ALONG_WITH_STATUS.YES,
        families:
          input.getsAlongWith?.families ?? existing?.getsAlongWith?.families ?? GETS_ALONG_WITH_STATUS.YES,
      },
    };
    await pet.save();
    return toPublicPet(pet);
  },
};

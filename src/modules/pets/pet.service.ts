import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { ROLES } from '../../common/constants/roles.js';
import { petRepository } from './pet.repository.js';
import { toPublicPet } from './pet.mapper.js';
import type {
  AddMedicalRecordInput,
  AddVaccinationInput,
  CreatePetInput,
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
};

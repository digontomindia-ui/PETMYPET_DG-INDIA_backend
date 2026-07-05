import type { PetDocument, PublicPet } from './pet.types.js';

export function toPublicPet(pet: PetDocument): PublicPet {
  return {
    id: pet._id.toString(),
    ownerId: pet.ownerId.toString(),
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    gender: pet.gender,
    dateOfBirth: pet.dateOfBirth,
    weightKg: pet.weightKg,
    avatarUrl: pet.avatarUrl,
    notes: pet.notes,
    medicalRecords: pet.medicalRecords,
    vaccinations: pet.vaccinations,
    createdAt: pet.createdAt,
  };
}

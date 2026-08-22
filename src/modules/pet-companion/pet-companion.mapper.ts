import type { IPet } from '../pets/pet.types.js';
import type { IPetMatch } from './pet-companion.types.js';

/** Accepts the plain lean pet doc since candidates are fetched via `.lean()` for the feed. */
export function toCandidatePetDto(pet: IPet, distanceMeters: number | null, ownerName: string) {
  return {
    id: pet._id.toString(),
    ownerId: pet.ownerId.toString(),
    ownerName,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    gender: pet.gender,
    dateOfBirth: pet.dateOfBirth,
    weightKg: pet.weightKg,
    avatarUrl: pet.avatarUrl,
    companionProfile: pet.companionProfile,
    distanceMeters,
  };
}

export function toLikeReceivedDto(pet: IPet, action: string, swipedAt: Date) {
  return {
    id: pet._id.toString(),
    ownerId: pet.ownerId.toString(),
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    avatarUrl: pet.avatarUrl,
    action,
    swipedAt,
  };
}

export function toMatchDto(
  match: IPetMatch,
  otherPet: Pick<IPet, '_id' | 'name' | 'avatarUrl' | 'breed'> | null,
) {
  return {
    matchId: match._id.toString(),
    otherPet: otherPet
      ? {
          id: otherPet._id.toString(),
          name: otherPet.name,
          avatarUrl: otherPet.avatarUrl,
          breed: otherPet.breed,
        }
      : null,
    chatRoomId: match.chatRoomId ? match.chatRoomId.toString() : null,
    matchedAt: match.matchedAt,
  };
}

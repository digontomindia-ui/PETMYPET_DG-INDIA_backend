import type { Types } from 'mongoose';
import type { IPet } from '../pets/pet.types.js';
import type { IPetMatch } from './pet-companion.types.js';

interface CompanionVerification {
  mobileVerified: boolean;
  identityVerified: boolean;
  vaccinationVerified: boolean;
  locationVerified: boolean;
}

export interface CompanionReview {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  authorName: string;
  authorAvatarUrl: string | null;
}

export function toCompanionProfileDto(
  pet: IPet,
  owner: { _id: { toString(): string }; name: string; isVerified: boolean; identityVerified: boolean; addresses: { isDefault: boolean }[] },
  likesCount: number,
  recentReviews: CompanionReview[],
  isOwnPet: boolean,
) {
  const verification: CompanionVerification = {
    mobileVerified: owner.isVerified,
    identityVerified: owner.identityVerified,
    vaccinationVerified: pet.vaccinations.length > 0,
    locationVerified: owner.addresses.some((address) => address.isDefault),
  };

  return {
    id: pet._id.toString(),
    ownerId: pet.ownerId.toString(),
    ownerName: owner.name,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    gender: pet.gender,
    dateOfBirth: pet.dateOfBirth,
    weightKg: pet.weightKg,
    avatarUrl: pet.avatarUrl,
    galleryUrls: pet.galleryUrls,
    activities: pet.activities.map((activity) => ({
      id: activity._id.toString(),
      type: activity.type,
      title: activity.title,
      location: activity.location,
      occurredAt: activity.occurredAt,
    })),
    companionProfile: pet.companionProfile,
    likesCount,
    viewCount: pet.viewCount,
    verification,
    isOwnPet,
    recentReviews: recentReviews.map((review) => ({
      id: review._id.toString(),
      userId: review.userId.toString(),
      authorName: review.authorName,
      authorAvatarUrl: review.authorAvatarUrl,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    })),
  };
}

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

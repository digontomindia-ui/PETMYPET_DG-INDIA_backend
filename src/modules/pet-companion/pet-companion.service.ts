import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { ROLES } from '../../common/constants/roles.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { petRepository } from '../pets/pet.repository.js';
import { PetModel } from '../pets/pet.schema.js';
import { UserModel } from '../users/user.schema.js';
import { chatService } from '../chat/chat.service.js';
import { petMatchRepository, petSwipeRepository } from './pet-companion.repository.js';
import { toCandidatePetDto, toLikeReceivedDto, toMatchDto } from './pet-companion.mapper.js';
import { DEFAULT_DISCOVER_RADIUS_METERS, LIKE_ACTIONS, SWIPE_ACTIONS } from './pet-companion.constants.js';
import type { DiscoverQuery, PetIdQuery, SwipeInput } from './pet-companion.dto.js';
import type { IPet, PetDocument } from '../pets/pet.types.js';

const EARTH_RADIUS_METERS = 6_378_100;

async function requireOwnedPet(petId: string, userId: string, role: string): Promise<PetDocument> {
  const pet = await petRepository.findById(petId);
  if (!pet) throw AppError.notFound('Pet not found');
  if (pet.ownerId.toString() !== userId && role !== ROLES.SUPER_ADMIN) {
    throw AppError.forbidden('You do not have access to this pet');
  }
  return pet;
}

/** Stores match pairs in canonical (lexicographically smaller id first) order. */
function canonicalPair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA];
}

function haversineMeters(
  [lng1, lat1]: [number, number],
  [lng2, lat2]: [number, number],
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

export const petCompanionService = {
  /**
   * Pet has no location of its own, so the discovery feed resolves each candidate pet's
   * location via its owner's default address:
   *  1. `$geoWithin`/`$centerSphere` on `User.addresses` (matched to the isDefault address
   *     specifically, via $elemMatch) finds nearby owners.
   *  2. Their eligible pets (companion profile enabled, not the caller's own, not already
   *     swiped by the caller's pet) are fetched and paired back up with the distance of
   *     their owner's default address, then paginated in-memory.
   */
  async discover(userId: string, role: string, query: DiscoverQuery) {
    const pet = await requireOwnedPet(query.petId, userId, role);
    const { page, limit, skip } = parsePagination(query);

    const lat = Number(query.lat);
    const lng = Number(query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw AppError.badRequest('lat and lng must be valid numbers');
    }
    const radiusMeters = query.radiusMeters
      ? Number(query.radiusMeters)
      : DEFAULT_DISCOVER_RADIUS_METERS;
    const radiusRadians = radiusMeters / EARTH_RADIUS_METERS;

    const nearbyOwners = await UserModel.find({
      addresses: {
        $elemMatch: {
          isDefault: true,
          location: { $geoWithin: { $centerSphere: [[lng, lat], radiusRadians] } },
        },
      },
    })
      .select('_id addresses')
      .lean();

    const distanceByOwnerId = new Map<string, number>();
    for (const owner of nearbyOwners) {
      const defaultAddress = owner.addresses.find((address) => address.isDefault);
      if (!defaultAddress) continue;
      distanceByOwnerId.set(
        owner._id.toString(),
        haversineMeters([lng, lat], defaultAddress.location.coordinates),
      );
    }

    if (distanceByOwnerId.size === 0) {
      return { pets: [], total: 0, page, limit };
    }

    const alreadySwiped = await petSwipeRepository.findMany({ swiperPetId: query.petId });
    const excludedPetIds = alreadySwiped.map((swipe) => swipe.targetPetId);

    const candidates = await PetModel.find({
      ownerId: { $in: [...distanceByOwnerId.keys()], $ne: pet.ownerId },
      _id: { $nin: excludedPetIds },
      'companionProfile.isEnabled': true,
    }).lean<IPet[]>();

    const sorted = candidates
      .map((candidate) => ({
        candidate,
        distanceMeters: distanceByOwnerId.get(candidate.ownerId.toString()) ?? null,
      }))
      .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));

    const page_ = sorted.slice(skip, skip + limit);
    const pets = page_.map(({ candidate, distanceMeters }) =>
      toCandidatePetDto(candidate, distanceMeters),
    );

    return { pets, total: sorted.length, page, limit };
  },

  async swipe(userId: string, role: string, input: SwipeInput) {
    if (input.swiperPetId === input.targetPetId) {
      throw AppError.badRequest('Cannot swipe on the same pet');
    }
    const swiperPet = await requireOwnedPet(input.swiperPetId, userId, role);
    const targetPet = await petRepository.findById(input.targetPetId);
    if (!targetPet) throw AppError.notFound('Target pet not found');

    await petSwipeRepository.upsertSwipe(input.swiperPetId, input.targetPetId, input.action);

    if (input.action === SWIPE_ACTIONS.PASS) {
      return { matched: false as const };
    }

    const reciprocal = await petSwipeRepository.findOne({
      swiperPetId: input.targetPetId,
      targetPetId: input.swiperPetId,
      action: { $in: LIKE_ACTIONS },
    });
    if (!reciprocal) {
      return { matched: false as const };
    }

    const [petAId, petBId] = canonicalPair(input.swiperPetId, input.targetPetId);
    let match = await petMatchRepository.findByCanonicalPair(petAId, petBId);
    if (!match) {
      const room = await chatService.createOrGetRoom(swiperPet.ownerId.toString(), {
        participantId: targetPet.ownerId.toString(),
      });
      match = await petMatchRepository.create({
        petAId: new Types.ObjectId(petAId),
        petBId: new Types.ObjectId(petBId),
        chatRoomId: new Types.ObjectId(room.id),
        matchedAt: new Date(),
      });
    }

    return {
      matched: true as const,
      matchId: match._id.toString(),
      chatRoomId: match.chatRoomId ? match.chatRoomId.toString() : null,
    };
  },

  async likesReceived(userId: string, role: string, query: PetIdQuery) {
    await requireOwnedPet(query.petId, userId, role);
    const { page, limit, skip } = parsePagination(query);

    const [likeSwipes, matches] = await Promise.all([
      petSwipeRepository.findMany(
        { targetPetId: query.petId, action: { $in: LIKE_ACTIONS } },
        { sort: { createdAt: -1 } },
      ),
      petMatchRepository.findMany({
        $or: [{ petAId: query.petId }, { petBId: query.petId }],
      }),
    ]);

    const matchedPetIds = new Set(
      matches
        .flatMap((match) => [match.petAId.toString(), match.petBId.toString()])
        .filter((id) => id !== query.petId),
    );

    const pending = likeSwipes.filter((swipe) => !matchedPetIds.has(swipe.swiperPetId.toString()));
    const total = pending.length;
    const pageItems = pending.slice(skip, skip + limit);

    const likerPets = await PetModel.find({
      _id: { $in: pageItems.map((swipe) => swipe.swiperPetId) },
    }).lean<IPet[]>();
    const likerPetsById = new Map(likerPets.map((pet) => [pet._id.toString(), pet]));

    const pets = pageItems
      .map((swipe) => {
        const likerPet = likerPetsById.get(swipe.swiperPetId.toString());
        if (!likerPet) return null;
        return toLikeReceivedDto(likerPet, swipe.action, swipe.createdAt);
      })
      .filter((dto): dto is NonNullable<typeof dto> => dto !== null);

    return { pets, total, page, limit };
  },

  async matches(userId: string, role: string, query: PetIdQuery) {
    await requireOwnedPet(query.petId, userId, role);
    const { page, limit, skip } = parsePagination(query);

    const filter = { $or: [{ petAId: query.petId }, { petBId: query.petId }] };
    const [items, total] = await Promise.all([
      petMatchRepository.findMany(filter, { sort: { matchedAt: -1 }, skip, limit }),
      petMatchRepository.count(filter),
    ]);

    const otherPetIds = items.map((match) =>
      match.petAId.toString() === query.petId ? match.petBId : match.petAId,
    );
    const otherPets = await PetModel.find({ _id: { $in: otherPetIds } })
      .select('name avatarUrl breed')
      .lean<Pick<IPet, '_id' | 'name' | 'avatarUrl' | 'breed'>[]>();
    const otherPetsById = new Map(otherPets.map((pet) => [pet._id.toString(), pet]));

    const matches = items.map((match) => {
      const otherId =
        match.petAId.toString() === query.petId ? match.petBId.toString() : match.petAId.toString();
      return toMatchDto(match, otherPetsById.get(otherId) ?? null);
    });

    return { matches, total, page, limit };
  },
};

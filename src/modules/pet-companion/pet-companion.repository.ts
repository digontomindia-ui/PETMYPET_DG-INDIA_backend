import { Types } from 'mongoose';
import { BaseRepository } from '../../common/repositories/base.repository.js';
import { PetMatchModel, PetSwipeModel, PetWishlistModel } from './pet-companion.schema.js';
import type { SwipeAction } from './pet-companion.constants.js';
import type { IPetMatch, IPetSwipe, PetSwipeDocument } from './pet-companion.types.js';

export class PetSwipeRepository extends BaseRepository<IPetSwipe> {
  constructor() {
    super(PetSwipeModel);
  }

  /** Upserts the swipe so re-swiping the same target updates the action instead of throwing. */
  async upsertSwipe(
    swiperPetId: string,
    targetPetId: string,
    action: SwipeAction,
  ): Promise<PetSwipeDocument> {
    return this.model
      .findOneAndUpdate(
        { swiperPetId, targetPetId },
        { $set: { action } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }
}

export class PetMatchRepository extends BaseRepository<IPetMatch> {
  constructor() {
    super(PetMatchModel);
  }

  async findByCanonicalPair(petAId: string, petBId: string) {
    return this.model.findOne({ petAId, petBId }).exec();
  }
}

export const petSwipeRepository = new PetSwipeRepository();
export const petMatchRepository = new PetMatchRepository();

export const petWishlistRepository = {
  async getOrCreate(userId: string) {
    const existing = await PetWishlistModel.findOne({ userId }).exec();
    if (existing) return existing;
    return PetWishlistModel.create({ userId, petIds: [] });
  },

  async add(userId: string, petId: string): Promise<void> {
    await PetWishlistModel.updateOne(
      { userId },
      { $addToSet: { petIds: new Types.ObjectId(petId) } },
      { upsert: true },
    ).exec();
  },

  async remove(userId: string, petId: string): Promise<void> {
    await PetWishlistModel.updateOne({ userId }, { $pull: { petIds: petId } }).exec();
  },
};

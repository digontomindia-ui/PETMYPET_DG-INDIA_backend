import { model, Schema } from 'mongoose';
import { PET_MODEL_NAME } from '../pets/pet.constants.js';
import { CHAT_ROOM_MODEL_NAME } from '../chat/chat.constants.js';
import { PET_MATCH_MODEL_NAME, PET_SWIPE_MODEL_NAME, SWIPE_ACTIONS } from './pet-companion.constants.js';
import type { IPetMatch, IPetSwipe } from './pet-companion.types.js';

const petSwipeSchema = new Schema<IPetSwipe>(
  {
    swiperPetId: { type: Schema.Types.ObjectId, ref: PET_MODEL_NAME, required: true },
    targetPetId: { type: Schema.Types.ObjectId, ref: PET_MODEL_NAME, required: true },
    action: { type: String, enum: Object.values(SWIPE_ACTIONS), required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// A pet can't swipe the same target twice — re-swiping upserts the existing record instead.
petSwipeSchema.index({ swiperPetId: 1, targetPetId: 1 }, { unique: true });
petSwipeSchema.index({ targetPetId: 1, action: 1 });

export const PetSwipeModel = model<IPetSwipe>(PET_SWIPE_MODEL_NAME, petSwipeSchema);

const petMatchSchema = new Schema<IPetMatch>({
  petAId: { type: Schema.Types.ObjectId, ref: PET_MODEL_NAME, required: true },
  petBId: { type: Schema.Types.ObjectId, ref: PET_MODEL_NAME, required: true },
  chatRoomId: { type: Schema.Types.ObjectId, ref: CHAT_ROOM_MODEL_NAME, default: null },
  matchedAt: { type: Date, default: () => new Date() },
});

// petAId/petBId are always stored in canonical (lexicographically smaller id first) order,
// so a single unique index can answer "is there a match between X and Y" without checking
// both orderings.
petMatchSchema.index({ petAId: 1, petBId: 1 }, { unique: true });

export const PetMatchModel = model<IPetMatch>(PET_MATCH_MODEL_NAME, petMatchSchema);

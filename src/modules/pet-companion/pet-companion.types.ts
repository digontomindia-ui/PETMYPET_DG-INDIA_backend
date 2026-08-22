import type { HydratedDocument, Types } from 'mongoose';
import type { SwipeAction } from './pet-companion.constants.js';

export interface IPetSwipe {
  _id: Types.ObjectId;
  swiperPetId: Types.ObjectId;
  targetPetId: Types.ObjectId;
  action: SwipeAction;
  createdAt: Date;
}

export type PetSwipeDocument = HydratedDocument<IPetSwipe>;

export interface IPetMatch {
  _id: Types.ObjectId;
  petAId: Types.ObjectId;
  petBId: Types.ObjectId;
  chatRoomId: Types.ObjectId | null;
  matchedAt: Date;
}

export type PetMatchDocument = HydratedDocument<IPetMatch>;

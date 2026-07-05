import type { HydratedDocument, Types } from 'mongoose';

export interface IReview {
  _id: Types.ObjectId;
  bookingId: Types.ObjectId;
  userId: Types.ObjectId;
  providerId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
}

export type ReviewDocument = HydratedDocument<IReview>;

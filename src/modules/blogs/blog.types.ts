import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';

export interface IBlog extends SoftDeletable {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  title: string;
  slug: string;
  content: string;
  coverImageUrl: string | null;
  tags: string[];
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type BlogDocument = HydratedDocument<IBlog>;

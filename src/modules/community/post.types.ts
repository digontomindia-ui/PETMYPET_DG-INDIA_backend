import type { HydratedDocument, Types } from 'mongoose';
import type { SoftDeletable } from '../../common/database/plugins/soft-delete.plugin.js';
import type { ReportStatus } from './post.constants.js';

export interface IPost extends SoftDeletable {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PostDocument = HydratedDocument<IPost>;

export interface IComment {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  createdAt: Date;
}

export type CommentDocument = HydratedDocument<IComment>;

export interface ILike {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

export type LikeDocument = HydratedDocument<ILike>;

export interface IBookmark {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
}

export type BookmarkDocument = HydratedDocument<IBookmark>;

export interface IReport {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
}

export type ReportDocument = HydratedDocument<IReport>;

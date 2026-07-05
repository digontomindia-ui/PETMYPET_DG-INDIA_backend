import { model, Schema } from 'mongoose';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import {
  BOOKMARK_MODEL_NAME,
  COMMENT_MODEL_NAME,
  LIKE_MODEL_NAME,
  POST_MODEL_NAME,
  REPORT_MODEL_NAME,
  REPORT_STATUSES,
} from './post.constants.js';
import type { IBookmark, IComment, ILike, IPost, IReport } from './post.types.js';

const postSchema = new Schema<IPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    content: { type: String, required: true, maxlength: 5000 },
    mediaUrls: { type: [String], default: [] },
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    isApproved: { type: Boolean, default: true },
  },
  { timestamps: true },
);

postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ content: 'text' });
postSchema.plugin(softDeletePlugin);

export const PostModel = model<IPost>(POST_MODEL_NAME, postSchema);

const commentSchema = new Schema<IComment>({
  postId: { type: Schema.Types.ObjectId, ref: POST_MODEL_NAME, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  content: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: () => new Date() },
});

commentSchema.index({ postId: 1, createdAt: -1 });

export const CommentModel = model<IComment>(COMMENT_MODEL_NAME, commentSchema);

const likeSchema = new Schema<ILike>({
  postId: { type: Schema.Types.ObjectId, ref: POST_MODEL_NAME, required: true },
  userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const LikeModel = model<ILike>(LIKE_MODEL_NAME, likeSchema);

const bookmarkSchema = new Schema<IBookmark>({
  postId: { type: Schema.Types.ObjectId, ref: POST_MODEL_NAME, required: true },
  userId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

bookmarkSchema.index({ postId: 1, userId: 1 }, { unique: true });

export const BookmarkModel = model<IBookmark>(BOOKMARK_MODEL_NAME, bookmarkSchema);

const reportSchema = new Schema<IReport>({
  postId: { type: Schema.Types.ObjectId, ref: POST_MODEL_NAME, required: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
  reason: { type: String, required: true, maxlength: 1000 },
  status: { type: String, enum: Object.values(REPORT_STATUSES), default: REPORT_STATUSES.PENDING },
  createdAt: { type: Date, default: () => new Date() },
});

reportSchema.index({ status: 1, createdAt: 1 });

export const ReportModel = model<IReport>(REPORT_MODEL_NAME, reportSchema);

import { model, Schema } from 'mongoose';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { USER_MODEL_NAME } from '../users/user.constants.js';
import { BLOG_MODEL_NAME } from './blog.constants.js';
import type { IBlog } from './blog.types.js';

const blogSchema = new Schema<IBlog>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: USER_MODEL_NAME, required: true },
    title: { type: String, required: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    content: { type: String, required: true },
    coverImageUrl: { type: String, default: null },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

blogSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
blogSchema.index({ isPublished: 1, publishedAt: -1 });
blogSchema.index({ title: 'text', content: 'text' });
blogSchema.plugin(softDeletePlugin);

export const BlogModel = model<IBlog>(BLOG_MODEL_NAME, blogSchema);

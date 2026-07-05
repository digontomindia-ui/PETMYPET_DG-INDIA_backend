import { model, Schema } from 'mongoose';
import { PROVIDER_TYPES } from '../../common/constants/roles.js';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { CATEGORY_MODEL_NAME } from './category.constants.js';
import type { ICategory } from './category.types.js';

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '', maxlength: 1000 },
    iconUrl: { type: String, default: null },
    providerTypes: { type: [String], enum: Object.values(PROVIDER_TYPES), default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.plugin(softDeletePlugin);

export const CategoryModel = model<ICategory>(CATEGORY_MODEL_NAME, categorySchema);

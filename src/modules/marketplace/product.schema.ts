import { model, Schema } from 'mongoose';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { PROVIDER_MODEL_NAME } from '../providers/provider.constants.js';
import { PRODUCT_CATEGORIES, PRODUCT_MODEL_NAME } from './product.constants.js';
import type { IProduct } from './product.types.js';

const productSchema = new Schema<IProduct>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: PROVIDER_MODEL_NAME, default: null },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 3000 },
    category: { type: String, enum: Object.values(PRODUCT_CATEGORIES), required: true },
    price: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, required: true, trim: true, uppercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ sku: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.plugin(softDeletePlugin);

export const ProductModel = model<IProduct>(PRODUCT_MODEL_NAME, productSchema);

import { model, Schema } from 'mongoose';
import { softDeletePlugin } from '../../common/database/plugins/soft-delete.plugin.js';
import { PROVIDER_MODEL_NAME } from '../providers/provider.constants.js';
import { CATEGORY_MODEL_NAME } from '../categories/category.constants.js';
import { SERVICE_MODEL_NAME } from './service.constants.js';
import type { IService } from './service.types.js';

const serviceSchema = new Schema<IService>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: PROVIDER_MODEL_NAME, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: CATEGORY_MODEL_NAME, required: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, default: '', maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: null, min: 0 },
    durationMinutes: { type: Number, required: true, min: 5 },
    images: { type: [String], default: [] },
    addOnCatalog: {
      type: [
        {
          name: { type: String, required: true, trim: true, maxlength: 100 },
          price: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

serviceSchema.index({ providerId: 1, categoryId: 1 });
serviceSchema.index({ name: 'text', description: 'text' });
serviceSchema.plugin(softDeletePlugin);

export const ServiceModel = model<IService>(SERVICE_MODEL_NAME, serviceSchema);

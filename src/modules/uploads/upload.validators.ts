import { z } from 'zod';
import { UPLOAD_CATEGORIES } from './upload.constants.js';

export const uploadFileSchema = z.object({
  category: z.enum(Object.values(UPLOAD_CATEGORIES) as [string, ...string[]]),
});

export const deleteUploadSchema = z.object({
  publicId: z.string().min(1),
  resourceType: z.enum(['image', 'video', 'raw']).default('image'),
});

import type { z } from 'zod';
import type { deleteUploadSchema, uploadFileSchema } from './upload.validators.js';

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type DeleteUploadInput = z.infer<typeof deleteUploadSchema>;

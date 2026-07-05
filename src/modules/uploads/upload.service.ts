import { AppError } from '../../common/errors/app-error.js';
import { deleteAsset, uploadBuffer } from '../../common/integrations/cloudinary.js';
import {
  ALLOWED_MIME_TYPES_BY_CATEGORY,
  MAX_UPLOAD_SIZE_BYTES,
  UPLOAD_FOLDERS,
  type UploadCategory,
} from './upload.constants.js';

export const uploadService = {
  async uploadFile(file: Express.Multer.File, category: UploadCategory) {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw AppError.badRequest(
        `File exceeds the maximum allowed size of ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB`,
      );
    }
    if (!ALLOWED_MIME_TYPES_BY_CATEGORY[category].includes(file.mimetype)) {
      throw AppError.badRequest(
        `Unsupported file type "${file.mimetype}" for category ${category}`,
      );
    }

    const result = await uploadBuffer(file.buffer, UPLOAD_FOLDERS[category]);
    return {
      url: result.url,
      publicId: result.publicId,
      resourceType: result.resourceType,
      bytes: result.bytes,
      format: result.format,
    };
  },

  async deleteFile(publicId: string, resourceType: string): Promise<void> {
    await deleteAsset(publicId, resourceType);
  },
};

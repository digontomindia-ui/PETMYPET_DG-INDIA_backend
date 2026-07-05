import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { uploadController } from './upload.controller.js';
import { MAX_UPLOAD_SIZE_BYTES } from './upload.constants.js';
import { deleteUploadSchema, uploadFileSchema } from './upload.validators.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
});

export const uploadRoutes = Router();

/**
 * @openapi
 * /uploads:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload a file to Cloudinary (multipart/form-data, field name "file")
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               category:
 *                 type: string
 *                 enum: [AVATAR, PET_PHOTO, KYC_DOCUMENT, PROVIDER_PORTFOLIO, COMMUNITY_POST, PRODUCT, BANNER, CHAT_ATTACHMENT, LOST_AND_FOUND, SUPPORT_TICKET]
 *     responses:
 *       201: { description: File uploaded }
 */
uploadRoutes.post(
  '/',
  authenticate,
  upload.single('file'),
  validate({ body: uploadFileSchema }),
  uploadController.upload,
);

/**
 * @openapi
 * /uploads:
 *   delete:
 *     tags: [Uploads]
 *     summary: Delete a previously uploaded Cloudinary asset by publicId
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: File deleted }
 */
uploadRoutes.delete(
  '/',
  authenticate,
  validate({ body: deleteUploadSchema }),
  uploadController.remove,
);

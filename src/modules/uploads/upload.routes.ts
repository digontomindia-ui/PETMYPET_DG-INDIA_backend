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
 *             required: [file, category]
 *             properties:
 *               file: { type: string, format: binary }
 *               category:
 *                 type: string
 *                 enum: [AVATAR, PET_PHOTO, KYC_DOCUMENT, PROVIDER_PORTFOLIO, COMMUNITY_POST, PRODUCT, BANNER, CHAT_ATTACHMENT, LOST_AND_FOUND, SUPPORT_TICKET]
 *           example:
 *             category: AVATAR
 *     responses:
 *       201:
 *         description: File uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: File uploaded
 *               data:
 *                 url: "https://res.cloudinary.com/patmypets/image/upload/v1699999999/avatars/ananya.jpg"
 *                 publicId: "patmypets/avatars/ananya_qk3f8x"
 *                 resourceType: image
 *                 bytes: 184320
 *                 format: jpg
 *       400:
 *         description: Validation error (missing file or unsupported type/size/category)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: No file was uploaded. Use the "file" form field.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [publicId]
 *             properties:
 *               publicId: { type: string }
 *               resourceType: { type: string, enum: [image, video, raw], default: image }
 *           example:
 *             publicId: "patmypets/avatars/ananya_qk3f8x"
 *             resourceType: image
 *     responses:
 *       200:
 *         description: File deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: File deleted
 *               data: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "publicId: String must contain at least 1 character(s)"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 */
uploadRoutes.delete(
  '/',
  authenticate,
  validate({ body: deleteUploadSchema }),
  uploadController.remove,
);

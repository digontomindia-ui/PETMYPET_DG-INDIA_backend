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

uploadRoutes.post(
  '/',
  authenticate,
  upload.single('file'),
  validate({ body: uploadFileSchema }),
  uploadController.upload,
);

uploadRoutes.delete(
  '/',
  authenticate,
  validate({ body: deleteUploadSchema }),
  uploadController.remove,
);

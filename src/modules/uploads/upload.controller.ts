import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { uploadService } from './upload.service.js';
import type { DeleteUploadInput, UploadFileInput } from './upload.dto.js';
import type { UploadCategory } from './upload.constants.js';

export const uploadController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw AppError.badRequest('No file was uploaded. Use the "file" form field.');
    const { category } = req.body as UploadFileInput;
    const result = await uploadService.uploadFile(req.file, category as UploadCategory);
    sendSuccess(res, HTTP_STATUS.CREATED, result, 'File uploaded');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const { publicId, resourceType } = req.body as DeleteUploadInput;
    await uploadService.deleteFile(publicId, resourceType);
    sendSuccess(res, HTTP_STATUS.OK, null, 'File deleted');
  }),
};

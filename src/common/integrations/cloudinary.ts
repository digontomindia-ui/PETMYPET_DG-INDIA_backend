import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format: string;
}

export async function uploadBuffer(buffer: Buffer, folder: string): Promise<UploadResult> {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw AppError.internal('Cloudinary is not configured');
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error || !result) {
          reject(new Error(error?.message ?? 'Cloudinary upload failed'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          bytes: result.bytes,
          format: result.format,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteAsset(publicId: string, resourceType = 'image'): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export { cloudinary };

import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf',
};

function storageHost(): string {
  return env.BUNNY_STORAGE_REGION
    ? `${env.BUNNY_STORAGE_REGION}.storage.bunnycdn.com`
    : 'storage.bunnycdn.com';
}

function assertConfigured(): void {
  if (!env.BUNNY_STORAGE_ZONE || !env.BUNNY_STORAGE_API_KEY || !env.BUNNY_PULL_ZONE_HOSTNAME) {
    throw AppError.internal('Bunny CDN is not configured');
  }
}

function resolveExtension(originalName: string, mimeType: string): string {
  const fromName = originalName.includes('.') ? originalName.split('.').pop() : undefined;
  return (fromName || MIME_TO_EXTENSION[mimeType] || 'bin').toLowerCase();
}

function resolveResourceType(mimeType: string): string {
  return mimeType.startsWith('image/') ? 'image' : 'raw';
}

export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format: string;
}

/** publicId is the file's path within the storage zone (folder + generated name + extension) —
 * it doubles as what deleteAsset needs, mirroring how Cloudinary's publicId worked before it. */
export async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  originalName: string,
  mimeType: string,
): Promise<UploadResult> {
  assertConfigured();

  const extension = resolveExtension(originalName, mimeType);
  const publicId = `${folder}/${randomUUID()}.${extension}`;

  const response = await fetch(`https://${storageHost()}/${env.BUNNY_STORAGE_ZONE}/${publicId}`, {
    method: 'PUT',
    headers: {
      AccessKey: env.BUNNY_STORAGE_API_KEY,
      'Content-Type': 'application/octet-stream',
    },
    body: buffer,
  });
  if (!response.ok) {
    throw new Error(`Bunny CDN upload failed: ${response.status} ${await response.text()}`);
  }

  return {
    url: `https://${env.BUNNY_PULL_ZONE_HOSTNAME}/${publicId}`,
    publicId,
    resourceType: resolveResourceType(mimeType),
    bytes: buffer.byteLength,
    format: extension,
  };
}

export async function deleteAsset(publicId: string): Promise<void> {
  assertConfigured();

  const response = await fetch(`https://${storageHost()}/${env.BUNNY_STORAGE_ZONE}/${publicId}`, {
    method: 'DELETE',
    headers: { AccessKey: env.BUNNY_STORAGE_API_KEY },
  });
  // Deleting an already-gone file is a no-op from the caller's point of view.
  if (!response.ok && response.status !== 404) {
    throw new Error(`Bunny CDN delete failed: ${response.status} ${await response.text()}`);
  }
}

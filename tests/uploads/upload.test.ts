import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));
vi.mock('../../src/common/integrations/cloudinary.js', () => ({
  uploadBuffer: vi.fn((_buffer: Buffer, folder: string) =>
    Promise.resolve({
      url: `https://res.cloudinary.com/demo/image/upload/${folder}/mock.jpg`,
      publicId: `${folder}/mock`,
      resourceType: 'image',
      bytes: 1234,
      format: 'jpg',
    }),
  ),
  deleteAsset: vi.fn(() => Promise.resolve(undefined)),
}));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify } = await import('../helpers/auth.js');
const cloudinary = await import('../../src/common/integrations/cloudinary.js');

describe('uploads', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an unauthenticated upload', async () => {
    await request(app)
      .post('/api/v1/uploads')
      .field('category', 'AVATAR')
      .attach('file', Buffer.from('fake-image-bytes'), 'photo.jpg')
      .expect(401);
  });

  it('uploads a valid image and returns the Cloudinary result', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });

    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .field('category', 'AVATAR')
      .attach('file', Buffer.from('fake-image-bytes'), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.url).toContain('patmypets/avatars');
    expect(cloudinary.uploadBuffer).toHaveBeenCalledWith(expect.any(Buffer), 'patmypets/avatars');
  });

  it('rejects a file type not allowed for the category', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });

    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .field('category', 'AVATAR')
      .attach('file', Buffer.from('%PDF-1.4 fake pdf'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(400);
    expect(cloudinary.uploadBuffer).not.toHaveBeenCalled();
  });

  it('allows a PDF for a document-friendly category like KYC_DOCUMENT', async () => {
    const provider = await signupAndVerify(app, { role: 'SERVICE_PROVIDER' });

    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${provider.tokens.accessToken}`)
      .field('category', 'KYC_DOCUMENT')
      .attach('file', Buffer.from('%PDF-1.4 fake pdf'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(201);
  });

  it('rejects an upload with no category field', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });

    const res = await request(app)
      .post('/api/v1/uploads')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .attach('file', Buffer.from('fake-image-bytes'), {
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(400);
  });

  it('deletes an uploaded asset by publicId', async () => {
    const user = await signupAndVerify(app, { role: 'USER' });

    const res = await request(app)
      .delete('/api/v1/uploads')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ publicId: 'patmypets/avatars/mock', resourceType: 'image' });

    expect(res.status).toBe(200);
    expect(cloudinary.deleteAsset).toHaveBeenCalledWith('patmypets/avatars/mock', 'image');
  });
});

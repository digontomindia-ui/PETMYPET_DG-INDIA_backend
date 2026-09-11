import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));
vi.mock('../../src/common/integrations/bunny-cdn.js', () => ({
  uploadBuffer: vi.fn((_buffer: Buffer, folder: string) =>
    Promise.resolve({
      url: `https://patmypets.b-cdn.net/${folder}/mock.jpg`,
      publicId: `${folder}/mock.jpg`,
      resourceType: 'image',
      bytes: 1234,
      format: 'jpg',
    }),
  ),
  deleteAsset: vi.fn(() => Promise.resolve(undefined)),
}));

const { createApp } = await import('../../src/app.js');
const { signupAndVerify } = await import('../helpers/auth.js');
const bunnyCdn = await import('../../src/common/integrations/bunny-cdn.js');

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

  it('uploads a valid image and returns the Bunny CDN result', async () => {
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
    expect(bunnyCdn.uploadBuffer).toHaveBeenCalledWith(
      expect.any(Buffer),
      'patmypets/avatars',
      'photo.jpg',
      'image/jpeg',
    );
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
    expect(bunnyCdn.uploadBuffer).not.toHaveBeenCalled();
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
    expect(bunnyCdn.deleteAsset).toHaveBeenCalledWith('patmypets/avatars/mock');
  });
});

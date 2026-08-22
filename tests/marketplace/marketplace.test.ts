import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/common/integrations/mailer.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../../src/common/integrations/sms.js', () => ({ sendSms: vi.fn() }));

const { createApp } = await import('../../src/app.js');
const { createAdmin, signupAndVerify } = await import('../helpers/auth.js');
const { walletService } = await import('../../src/modules/wallet/wallet.service.js');
const { WALLET_TRANSACTION_REASONS } = await import('../../src/modules/wallet/wallet.constants.js');

async function createProduct(
  app: Awaited<ReturnType<typeof createApp>>,
  adminToken: string,
  overrides: Record<string, unknown> = {},
) {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Premium Dog Food 5kg',
      category: 'FOOD',
      price: 500,
      stock: 10,
      sku: `SKU-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      ...overrides,
    })
    .expect(201);
  return res.body.data as { id: string; stock: number };
}

const shippingAddress = {
  addressLine1: '221B Baker Street',
  city: 'Mumbai',
  state: 'MH',
  postalCode: '400001',
};

describe('marketplace', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches products and rejects a non-owning provider from editing them', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.accessToken);

    const searchRes = await request(app).get('/api/v1/products?category=FOOD');
    expect(searchRes.status).toBe(200);
    const foundProducts = searchRes.body.data as { id: string }[];
    expect(foundProducts.some((p) => p.id === product.id)).toBe(true);

    const provider = await signupAndVerify(app, { role: 'SERVICE_PROVIDER' });
    await request(app)
      .post('/api/v1/providers/me')
      .set('Authorization', `Bearer ${provider.tokens.accessToken}`)
      .send({
        providerType: 'PHARMACY',
        businessName: 'Pharmacy Co',
        address: 'Somewhere',
        coordinates: [72.8, 19.0],
        zoneIds: [],
        workingHours: [],
        metadata: { pharmacy: { licenseNumber: 'LIC-1' } },
      })
      .expect(201);

    const editAttempt = await request(app)
      .put(`/api/v1/products/${product.id}`)
      .set('Authorization', `Bearer ${provider.tokens.accessToken}`)
      .send({ price: 1 });
    expect(editAttempt.status).toBe(403);
  });

  it('manages cart and wishlist', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.accessToken, { price: 250 });
    const user = await signupAndVerify(app, { role: 'USER' });

    const addRes = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ productId: product.id, quantity: 2 });
    expect(addRes.status).toBe(201);
    expect(addRes.body.data.subtotal).toBe(500);
    expect(addRes.body.data.totalAmount).toBe(540);

    const updateRes = await request(app)
      .put(`/api/v1/cart/items/${product.id}`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ quantity: 1 });
    expect(updateRes.body.data.subtotal).toBe(250);
    expect(updateRes.body.data.totalAmount).toBe(290);

    await request(app)
      .post(`/api/v1/wishlist/${product.id}`)
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .expect(201);

    const wishlist = await request(app)
      .get('/api/v1/wishlist')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(wishlist.body.data.products).toHaveLength(1);
  });

  it('places a wallet order, decrements stock, and refunds on admin cancellation', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.accessToken, { price: 300, stock: 5 });
    const user = await signupAndVerify(app, { role: 'USER' });
    await walletService.credit(user.user.id, 1000, WALLET_TRANSACTION_REASONS.TOPUP);

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ productId: product.id, quantity: 2 })
      .expect(201);

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ shippingAddress, paymentMethod: 'WALLET' });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.totalAmount).toBe(640);
    expect(orderRes.body.data.deliveryFee).toBe(40);
    expect(orderRes.body.data.discountAmount).toBe(0);
    expect(orderRes.body.data.paymentStatus).toBe('PAID');
    const orderId = orderRes.body.data.id as string;

    const balance = await walletService.getBalance(user.user.id);
    expect(balance.balance).toBe(360);

    const productAfter = await request(app).get(`/api/v1/products/${product.id}`);
    expect(productAfter.body.data.stock).toBe(3);

    const cartAfter = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`);
    expect(cartAfter.body.data.items).toHaveLength(0);

    await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'CANCELLED' })
      .expect(200);

    const balanceAfterRefund = await walletService.getBalance(user.user.id);
    expect(balanceAfterRefund.balance).toBe(1000);

    const productAfterCancel = await request(app).get(`/api/v1/products/${product.id}`);
    expect(productAfterCancel.body.data.stock).toBe(5);
  });

  it('rejects a wallet order with insufficient funds and restores stock', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.accessToken, { price: 1000, stock: 3 });
    const user = await signupAndVerify(app, { role: 'USER' });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ productId: product.id, quantity: 1 })
      .expect(201);

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ shippingAddress, paymentMethod: 'WALLET' });
    expect(orderRes.status).toBe(400);

    const productAfter = await request(app).get(`/api/v1/products/${product.id}`);
    expect(productAfter.body.data.stock).toBe(3);
  });

  it('places a cash-on-delivery order and lets an admin mark it paid on delivery', async () => {
    const admin = await createAdmin(app);
    const product = await createProduct(app, admin.accessToken, { price: 200, stock: 4 });
    const user = await signupAndVerify(app, { role: 'USER' });

    await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ productId: product.id, quantity: 1 })
      .expect(201);

    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${user.tokens.accessToken}`)
      .send({ shippingAddress, paymentMethod: 'CASH_ON_DELIVERY' });
    expect(orderRes.status).toBe(201);
    expect(orderRes.body.data.paymentStatus).toBe('PENDING');
    const orderId = orderRes.body.data.id as string;

    const markPaidRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/mark-cod-paid`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(markPaidRes.status).toBe(200);
    expect(markPaidRes.body.data.paymentStatus).toBe('PAID');
  });
});

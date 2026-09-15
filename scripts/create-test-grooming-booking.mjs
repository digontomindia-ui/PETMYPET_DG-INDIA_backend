// Creates a fresh grooming booking for phone ending 9876543210, dropped straight into
// ON_THE_WAY (skips the real accept/on-the-way calls) so the owner app immediately shows
// otpStart and the provider app can call POST /bookings/:id/otp/start right away.
//
// Usage: MONGO_URI="<uri>" node scripts/create-test-grooming-booking.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

await mongoose.connect(uri);
const db = mongoose.connection.db;

const user = await db.collection('users').findOne({ phone: { $regex: '9876543210$' } });
if (!user) throw new Error('User with phone ending 9876543210 not found');

const provider = await db
  .collection('providers')
  .findOne({ providerType: 'GROOMER', kycStatus: 'APPROVED', isActive: true });
if (!provider) throw new Error('No approved, active GROOMER provider found');

const service = await db
  .collection('services')
  .findOne({ providerId: provider._id, isActive: true });
if (!service) throw new Error(`Provider ${provider._id} has no active service`);

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const scheduledStart = new Date(Date.now() + 60 * 60 * 1000);
const scheduledEnd = new Date(scheduledStart.getTime() + service.durationMinutes * 60_000);
const commissionPercent = provider.commissionPercent ?? 15;
const netPrice = service.price;
const commissionAmount = Math.round(netPrice * (commissionPercent / 100) * 100) / 100;
const providerPayoutAmount = Math.round((netPrice - commissionAmount) * 100) / 100;
const otpStart = genOtp();
const otpEnd = genOtp();

const booking = {
  userId: user._id,
  petId: null,
  providerId: provider._id,
  serviceId: service._id,
  zoneId: provider.zoneIds?.[0] ?? null,
  scheduledStart,
  scheduledEnd,
  status: 'ON_THE_WAY',
  otpStart,
  otpStartVerifiedAt: null,
  otpEnd,
  otpEndVerifiedAt: null,
  price: service.price,
  currency: 'INR',
  couponCode: null,
  discountAmount: 0,
  commissionPercent,
  commissionAmount,
  providerPayoutAmount,
  paymentStatus: 'PENDING',
  paymentId: null,
  cancelledBy: null,
  cancellationReason: null,
  notes: '',
  addOns: [],
  durationDays: null,
  dropOffTime: null,
  pickupTime: null,
  consultationMode: null,
  providerNotes: '',
  photos: [],
  progressUpdates: [],
  walkStats: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const result = await db.collection('bookings').insertOne(booking);

console.log(`Created booking ${result.insertedId.toString()}`);
console.log(`  provider: ${provider.businessName || provider._id} (${provider._id})`);
console.log(`  service:  ${service.name} (${service.durationMinutes} min, ₹${service.price})`);
console.log(`  status:   ON_THE_WAY`);
console.log(`  otpStart: ${otpStart}  (owner app GET /bookings/:id shows this now)`);
console.log(`  otpEnd:   ${otpEnd}  (shows once otpStart is verified)`);
console.log(
  `\nTo continue for real: log into that GROOMER provider's app, POST /api/v1/bookings/${result.insertedId}/otp/start with { code: "${otpStart}" } → status becomes STARTED and otpEnd shows on the owner side.`,
);

await mongoose.disconnect();

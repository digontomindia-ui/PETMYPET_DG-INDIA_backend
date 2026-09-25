// One-off fix for the "madhab clinic" provider-app account: it was stuck mid-onboarding
// (placeholder address/location, no zone) and had no bookings scheduled for today, so
// GET /home showed "Pending onboarding" + empty todays_overview/lab_report/inventory_alerts.
// This sets a real address/zone and adds two ACTIVE_STATUSES bookings scheduled today.
// Usage: MONGO_URI="<uri>" node scripts/fix-madhab.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

await mongoose.connect(uri);
const db = mongoose.connection.db;

const provider = await db.collection('providers').findOne({
  businessName: { $regex: 'madhab', $options: 'i' },
});
if (!provider) throw new Error('madhab clinic provider not found');

const zone = await db.collection('zones').findOne({ name: 'Koramangala' });
if (!zone) throw new Error('Koramangala zone not found');

await db.collection('providers').updateOne(
  { _id: provider._id },
  {
    $set: {
      address: '221B, 80 Feet Road, Koramangala, Bengaluru, Karnataka 560034',
      location: { type: 'Point', coordinates: zone.center.coordinates },
      zoneIds: [zone._id],
      updatedAt: new Date(),
    },
  },
);
console.log('Provider address/location/zoneIds updated.');

const service = await db.collection('services').findOne({ providerId: provider._id });
if (!service) throw new Error('no service found for madhab clinic');

const customer = await db.collection('users').findOne({ role: 'USER' });
if (!customer) throw new Error('no USER-role account found to book with');
const pet = await db.collection('pets').findOne({ ownerId: customer._id });

function buildBooking({ status, scheduledStart }) {
  const scheduledEnd = new Date(scheduledStart.getTime() + (service.durationMinutes ?? 90) * 60_000);
  const commissionPercent = provider.commissionPercent ?? 15;
  const price = service.price ?? 499;
  const commissionAmount = Math.round(price * (commissionPercent / 100) * 100) / 100;
  const providerPayoutAmount = Math.round((price - commissionAmount) * 100) / 100;
  return {
    userId: customer._id,
    petId: pet?._id ?? null,
    providerId: provider._id,
    serviceId: service._id,
    zoneId: zone._id,
    scheduledStart,
    scheduledEnd,
    status,
    otpStart: genOtp(),
    otpStartVerifiedAt: null,
    otpEnd: genOtp(),
    otpEndVerifiedAt: null,
    price,
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
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const now = new Date();
const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
const inFourHours = new Date(now.getTime() + 4 * 60 * 60 * 1000);

const docs = [
  buildBooking({ status: 'STARTED', scheduledStart: new Date(now.getTime() - 20 * 60 * 1000) }),
  buildBooking({ status: 'ACCEPTED', scheduledStart: inTwoHours }),
  buildBooking({ status: 'ACCEPTED', scheduledStart: inFourHours }),
];

const result = await db.collection('bookings').insertMany(docs);
console.log(`Inserted ${result.insertedCount} bookings scheduled today.`);

await mongoose.disconnect();

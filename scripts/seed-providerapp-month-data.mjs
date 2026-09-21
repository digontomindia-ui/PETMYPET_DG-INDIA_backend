// Frontend needs a full month of data per test provider-app account to build against —
// one ACCEPTED booking (from seed-providerapp-test-sessions.mjs) isn't enough for
// calendars, earnings charts, or history lists. This adds, per test account:
//   - ~14 COMPLETED + PAID bookings spread across the past 30 days (createdAt-based,
//     drives earningsByDay / revenue charts / total_bookings / case mix)
//   - ~10 upcoming bookings spread across the next 30 days, mixed PENDING/ACCEPTED/ON_THE_WAY
//     (drives calendars, todays_overview, pending_booking_requests)
//   - 1 STARTED booking today (drives "active session" / occupied-kennel counts)
// Not idempotent by design — re-run to layer on more history if needed.
//
// Usage: MONGO_URI="<uri>" node scripts/seed-providerapp-month-data.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

const PHONES = ['9609226659', '8537094497', '9609226651', '9609226652', '9609226653', '9609226654'];
const DAY_MS = 24 * 60 * 60 * 1000;

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function randomTimeOnDay(dayOffset) {
  const base = new Date();
  base.setHours(9 + Math.floor(Math.random() * 8), Math.random() < 0.5 ? 0 : 30, 0, 0);
  return new Date(base.getTime() + dayOffset * DAY_MS);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;

const customer = await db.collection('users').findOne({ role: 'USER' });
if (!customer) throw new Error('No USER-role account found to book with');
const pet = await db.collection('pets').findOne({ ownerId: customer._id });

function buildBooking({ provider, service, status, paymentStatus, scheduledStart, createdAt }) {
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
    zoneId: provider.zoneIds?.[0] ?? null,
    scheduledStart,
    scheduledEnd,
    status,
    otpStart: genOtp(),
    otpStartVerifiedAt: status === 'COMPLETED' ? scheduledStart : null,
    otpEnd: genOtp(),
    otpEndVerifiedAt: status === 'COMPLETED' ? scheduledEnd : null,
    price,
    currency: 'INR',
    couponCode: null,
    discountAmount: 0,
    commissionPercent,
    commissionAmount,
    providerPayoutAmount,
    paymentStatus,
    paymentId: paymentStatus === 'PAID' ? `seed_pay_${Math.random().toString(36).slice(2, 10)}` : null,
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
    createdAt,
    updatedAt: createdAt,
  };
}

for (const phone of PHONES) {
  const user = await db.collection('users').findOne({ phone: { $regex: `${phone}$` } });
  if (!user) { console.log(`${phone}: no user`); continue; }
  const provider = await db.collection('providers').findOne({ userId: user._id });
  if (!provider) { console.log(`${phone}: no provider`); continue; }
  const service = await db.collection('services').findOne({ providerId: provider._id });
  if (!service) { console.log(`${phone}: no service, run seed-providerapp-test-sessions.mjs first`); continue; }

  const docs = [];

  // Past 30 days: completed + paid, drives earnings/revenue/history.
  for (let i = 1; i <= 14; i++) {
    const dayOffset = -Math.ceil((i / 14) * 30);
    const scheduledStart = randomTimeOnDay(dayOffset);
    docs.push(
      buildBooking({
        provider,
        service,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        scheduledStart,
        createdAt: scheduledStart,
      }),
    );
  }

  // Next 30 days: upcoming, mixed statuses, drives calendars/pending lists.
  const upcomingStatuses = ['PENDING', 'ACCEPTED', 'ACCEPTED', 'ON_THE_WAY'];
  for (let i = 1; i <= 10; i++) {
    const dayOffset = Math.ceil((i / 10) * 30);
    const scheduledStart = randomTimeOnDay(dayOffset);
    docs.push(
      buildBooking({
        provider,
        service,
        status: upcomingStatuses[i % upcomingStatuses.length],
        paymentStatus: 'PENDING',
        scheduledStart,
        createdAt: new Date(),
      }),
    );
  }

  // Today: one STARTED session (active session / occupied kennel).
  const startedToday = randomTimeOnDay(0);
  startedToday.setHours(new Date().getHours(), new Date().getMinutes() - 20, 0, 0);
  docs.push(
    buildBooking({
      provider,
      service,
      status: 'STARTED',
      paymentStatus: 'PENDING',
      scheduledStart: startedToday,
      createdAt: new Date(),
    }),
  );

  const result = await db.collection('bookings').insertMany(docs);
  console.log(`${phone} (${provider.providerType}): inserted ${result.insertedCount} bookings`);
}

await mongoose.disconnect();

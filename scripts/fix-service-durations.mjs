// One-off fixes, safe to re-run.
//
// Usage:
//   MONGO_URI="<uri>" node scripts/fix-service-durations.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

await mongoose.connect(uri);
const db = mongoose.connection.db;

// --- 1. Bump any service still below the 90-minute minimum (MIN_BOOKING_DURATION_MINUTES) ---

const belowMinimum = { durationMinutes: { $lt: 90 } };

console.log('--- Services currently below 90 minutes ---');
const lowDurationServices = await db
  .collection('services')
  .find(belowMinimum, { projection: { name: 1, durationMinutes: 1, providerId: 1 } })
  .toArray();
lowDurationServices.forEach((doc) => console.log(doc));

const durationResult = await db
  .collection('services')
  .updateMany(belowMinimum, { $set: { durationMinutes: 90 } });
console.log(`--- Updated ${durationResult.modifiedCount} service(s) to durationMinutes: 90 ---`);

// --- 2. Accept the pending booking for phone ending 9876543210 ---
// Only acts if there's exactly ONE PENDING booking for that phone — with just a phone number
// and no booking ID to go on, guessing among multiple matches would risk accepting the wrong
// customer's order. If it prints "multiple" or "no", it lists what it found instead of guessing;
// re-run with an explicit bookingId filter once you know which one.
//
// Caveat: this flips the DB status directly — it will NOT send the "Booking accepted" push
// notification the real API sends. If the customer needs to be notified, use the real endpoint
// instead: PATCH /api/v1/bookings/:id/accept with the provider's bearer token.

console.log('\n--- Booking accept for phone ending 9876543210 ---');
const targetUser = await db.collection('users').findOne({ phone: { $regex: '9876543210$' } });
if (!targetUser) {
  console.log('No user found with a phone number ending in 9876543210.');
} else {
  const pendingBookings = await db
    .collection('bookings')
    .find({ userId: targetUser._id, status: 'PENDING' })
    .toArray();

  if (pendingBookings.length === 0) {
    console.log(`User ${targetUser._id} (${targetUser.phone}) has no PENDING bookings.`);
  } else if (pendingBookings.length > 1) {
    console.log(
      `User ${targetUser._id} (${targetUser.phone}) has ${pendingBookings.length} PENDING bookings — not guessing which one, listing them:`,
    );
    pendingBookings.forEach((b) =>
      console.log({ _id: b._id, providerId: b.providerId, scheduledStart: b.scheduledStart, price: b.price }),
    );
  } else {
    const booking = pendingBookings[0];
    await db.collection('bookings').updateOne({ _id: booking._id }, { $set: { status: 'ACCEPTED' } });
    console.log(`Accepted booking ${booking._id} for ${targetUser.phone}.`);
  }
}

await mongoose.disconnect();

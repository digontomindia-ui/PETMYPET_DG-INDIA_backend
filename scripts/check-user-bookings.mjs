// Usage: MONGO_URI="<uri>" node scripts/check-user-bookings.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

await mongoose.connect(uri);
const db = mongoose.connection.db;

const targetUser = await db.collection('users').findOne({ phone: { $regex: '9876543210$' } });
if (!targetUser) {
  console.log('No user found with a phone number ending in 9876543210.');
} else {
  console.log(`User: ${targetUser._id} (${targetUser.phone})`);

  const bookings = await db.collection('bookings').find({ userId: targetUser._id }).toArray();
  console.log(`\n--- ${bookings.length} booking(s) (any status) ---`);
  bookings.forEach((b) =>
    console.log({ _id: b._id, status: b.status, providerId: b.providerId, serviceId: b.serviceId, scheduledStart: b.scheduledStart, createdAt: b.createdAt }),
  );

  // In case it's not a service booking at all (e.g. stuck in a different collection).
  for (const coll of ['pettaxibookings', 'insuranceapplications', 'relocationrequests', 'orders']) {
    const exists = await db.listCollections({ name: coll }).toArray();
    if (exists.length === 0) continue;
    const rows = await db.collection(coll).find({ userId: targetUser._id }).toArray();
    if (rows.length > 0) {
      console.log(`\n--- ${rows.length} row(s) in ${coll} ---`);
      rows.forEach((r) => console.log({ _id: r._id, status: r.status, createdAt: r.createdAt }));
    }
  }
}

await mongoose.disconnect();

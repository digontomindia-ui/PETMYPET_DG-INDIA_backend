// Read-only inspection of the "madhab clinic" provider account.
// Usage: MONGO_URI="<uri>" node scripts/inspect-madhab.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

await mongoose.connect(uri);
const db = mongoose.connection.db;

const provider = await db.collection('providers').findOne({
  businessName: { $regex: 'madhab', $options: 'i' },
});
if (!provider) {
  console.log('NOT FOUND');
  process.exit(0);
}
console.log(JSON.stringify(provider, null, 2));

const service = await db.collection('services').findOne({ providerId: provider._id });
console.log('SERVICE:', JSON.stringify(service, null, 2));

const bookingsCount = await db.collection('bookings').countDocuments({ providerId: provider._id });
console.log('BOOKINGS COUNT:', bookingsCount);

await mongoose.disconnect();

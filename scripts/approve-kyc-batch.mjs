// One-off: approve KYC for a batch of providers by phone number.
//
// Usage:
//   MONGO_URI="<uri>" node scripts/approve-kyc-batch.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

const phones = [
  '9609226659',
  '8537094497',
  '9609226651',
  '9609226652',
  '9609226653',
  '9609226654',
];

await mongoose.connect(uri);
const db = mongoose.connection.db;

for (const phone of phones) {
  const user = await db.collection('users').findOne({ phone: { $regex: `${phone}$` } });
  if (!user) {
    console.log(`${phone}: no user found`);
    continue;
  }

  const provider = await db.collection('providers').findOne({ userId: user._id });
  if (!provider) {
    console.log(`${phone}: user ${user._id} has no provider profile`);
    continue;
  }

  await db.collection('providers').updateOne(
    { _id: provider._id },
    { $set: { kycStatus: 'APPROVED', kycRejectionReason: null } },
  );
  console.log(`${phone}: provider ${provider._id} KYC approved (was ${provider.kycStatus})`);
}

await mongoose.disconnect();

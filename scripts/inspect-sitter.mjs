// Read-only inspection of the 6 provider-app test accounts, to find the PET_SITTER one
// and check whether it's missing appointment/message/analytics data.
// Usage: MONGO_URI="<uri>" node scripts/inspect-sitter.mjs

import mongoose from 'mongoose';
const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

const PHONES = ['9609226659', '8537094497', '9609226651', '9609226652', '9609226653', '9609226654'];

await mongoose.connect(uri);
const db = mongoose.connection.db;

for (const phone of PHONES) {
  const user = await db.collection('users').findOne({ phone: { $regex: `${phone}$` } });
  if (!user) { console.log(`${phone}: no user`); continue; }
  const provider = await db.collection('providers').findOne({ userId: user._id });
  if (!provider) { console.log(`${phone}: no provider`); continue; }
  const bookings = await db.collection('bookings').countDocuments({ providerId: provider._id });
  let msgCount = 'n/a';
  try {
    msgCount = await db.collection('messages').countDocuments({
      $or: [{ senderId: user._id }, { recipientId: user._id }, { providerId: provider._id }],
    });
  } catch {}
  console.log(
    phone,
    provider.businessName,
    provider.providerType,
    'bookings:', bookings,
    'messages:', msgCount,
    'kyc:', provider.kycStatus,
    'zoneIds:', provider.zoneIds?.length ?? 0,
  );
}

await mongoose.disconnect();

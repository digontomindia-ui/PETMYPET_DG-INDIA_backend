// Read-only: does each provider-app test account have any services + any active-status booking?
// Usage: MONGO_URI="<uri>" node scripts/check-providerapp-services.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

const phones = ['9609226659', '8537094497', '9609226651', '9609226652', '9609226653', '9609226654'];

await mongoose.connect(uri);
const db = mongoose.connection.db;

for (const phone of phones) {
  const user = await db.collection('users').findOne({ phone: { $regex: `${phone}$` } });
  if (!user) continue;
  const provider = await db.collection('providers').findOne({ userId: user._id });
  if (!provider) continue;

  const serviceCount = await db.collection('services').countDocuments({ providerId: provider._id });
  const activeBookingCount = await db.collection('bookings').countDocuments({
    providerId: provider._id,
    status: { $in: ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'STARTED'] },
  });
  console.log(
    `${phone} (${provider.providerType}, ${provider.businessName}): services=${serviceCount}, activeBookings=${activeBookingCount}`,
  );
}

await mongoose.disconnect();

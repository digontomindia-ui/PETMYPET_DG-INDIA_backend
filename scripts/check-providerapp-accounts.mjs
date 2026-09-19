// Read-only: inspect a batch of provider-app accounts' current data (location/zoneIds/bookings).
// Usage: MONGO_URI="<uri>" node scripts/check-providerapp-accounts.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

const phones = ['9609226659', '8537094497', '9609226651', '9609226652', '9609226653', '9609226654'];

await mongoose.connect(uri);
const db = mongoose.connection.db;

for (const phone of phones) {
  const user = await db.collection('users').findOne({ phone: { $regex: `${phone}$` } });
  if (!user) {
    console.log(`${phone}: no user`);
    continue;
  }
  const provider = await db.collection('providers').findOne({ userId: user._id });
  if (!provider) {
    console.log(`${phone}: user ${user._id}, no provider`);
    continue;
  }
  console.log(
    JSON.stringify({
      phone,
      userId: user._id.toString(),
      providerId: provider._id.toString(),
      providerType: provider.providerType,
      businessName: provider.businessName,
      address: provider.address,
      location: provider.location,
      zoneIds: provider.zoneIds,
      kycStatus: provider.kycStatus,
    }),
  );
  const bookingCount = await db.collection('bookings').countDocuments({ providerId: provider._id });
  const bookingsNoPet = await db
    .collection('bookings')
    .countDocuments({ providerId: provider._id, petId: null });
  console.log(`  bookings: ${bookingCount}, withoutPetId: ${bookingsNoPet}`);
}

await mongoose.disconnect();

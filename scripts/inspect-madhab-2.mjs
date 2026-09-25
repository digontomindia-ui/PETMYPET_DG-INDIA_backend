// Read-only: find a valid zone + a bookable customer/pet to use when fixing the madhab clinic account.
// Usage: MONGO_URI="<uri>" node scripts/inspect-madhab-2.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

await mongoose.connect(uri);
const db = mongoose.connection.db;

const zone = await db.collection('zones').findOne({});
console.log('ZONE:', JSON.stringify(zone, null, 2));

const otherClinic = await db.collection('providers').findOne({
  providerType: 'CLINIC',
  businessName: { $not: { $regex: 'madhab', $options: 'i' } },
  'location.coordinates.0': { $ne: 0 },
});
console.log('OTHER CLINIC (for reference address/coords/zone):', JSON.stringify(otherClinic, null, 2));

const customer = await db.collection('users').findOne({ role: 'USER' });
console.log('CUSTOMER:', customer ? { _id: customer._id, name: customer.name, phone: customer.phone } : null);
const pet = customer ? await db.collection('pets').findOne({ ownerId: customer._id }) : null;
console.log('PET:', pet ? { _id: pet._id, name: pet.name, breed: pet.breed } : null);

await mongoose.disconnect();

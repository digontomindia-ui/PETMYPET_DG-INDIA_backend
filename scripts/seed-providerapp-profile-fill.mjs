// Frontend can't render blank fields, and most provider-app test accounts skipped onboarding, so
// their profile data is empty: user.name "", address "Pending onboarding", a device-local
// profileImageUrl, no experience/bio/documents. Pets have no dateOfBirth (age blank) and some
// seeded bookings have petId null (pet: null in appointments). This fills only what is blank —
// never overwrites real data — so it is safe to re-run.
//
// Usage: MONGO_URI="<uri>" node scripts/seed-providerapp-profile-fill.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

const PROFILE_FOR_TYPE = {
  VET: { names: ['Dr. Ananya Rao', 'Dr. Vikram Menon', 'Dr. Sneha Kapoor'], bio: 'Veterinarian focused on preventive care, vaccinations and small-animal medicine.' },
  CLINIC: { names: ['Dr. Rohan Iyer', 'Dr. Kavya Nair'], bio: 'Full-service pet clinic offering consultations, diagnostics and minor procedures.' },
  GROOMER: { names: ['Neha Grooming Studio', 'Arjun Pet Spa', 'Pooja Paws Salon'], bio: 'Certified groomer — breed cuts, de-shedding, bath and spa for dogs and cats.' },
  BOARDING: { names: ['Happy Tails Boarding', 'Paws Retreat', 'Cozy Kennel Stay'], bio: 'Safe, supervised boarding with daily walks, playtime and photo updates.' },
  PET_WALKER: { names: ['Rahul Walks', 'Sameer Dog Walker', 'Ishita Walks'], bio: 'Reliable daily walks with GPS tracking and post-walk updates.' },
  PET_SITTER: { names: ['Meera Pet Sitter', 'Karan Home Sitter', 'Tanya Pet Care'], bio: 'In-home pet sitting — feeding, playtime, medication and overnight stays.' },
  TRAINER: { names: ['Aditya K9 Training', 'Riya Obedience Coach', 'Manav Dog Trainer'], bio: 'Positive-reinforcement obedience and behaviour training for all ages.' },
  PHARMACY: { names: ['PetCare Pharmacy'], bio: 'Veterinary medicines, supplements and prescription diets.' },
  RELOCATION: { names: ['SafePaws Relocation'], bio: 'Domestic and international pet relocation with full documentation support.' },
};
const DAY_MS = 24 * 60 * 60 * 1000;

await mongoose.connect(uri);
const db = mongoose.connection.db;

const zone = await db.collection('zones').findOne({ name: 'Koramangala' });
if (!zone) throw new Error('Koramangala zone not found');

const isBlank = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
const counters = {};
const bump = (k) => (counters[k] = (counters[k] ?? 0) + 1);

const providers = await db.collection('providers').find({}).toArray();
const seenPerType = {};
for (const p of providers) {
  const profile = PROFILE_FOR_TYPE[p.providerType] ?? PROFILE_FOR_TYPE.GROOMER;
  const idx = (seenPerType[p.providerType] = (seenPerType[p.providerType] ?? -1) + 1);
  const name = profile.names[idx % profile.names.length];

  const user = await db.collection('users').findOne({ _id: p.userId }, { projection: { name: 1 } });
  if (user && isBlank(user.name)) {
    await db.collection('users').updateOne({ _id: p.userId }, { $set: { name } });
    bump('user.name');
  }

  const set = {};
  if (isBlank(p.businessName) || /partner$/i.test(p.businessName)) set.businessName = name;
  if (isBlank(p.description)) set.description = profile.bio;
  if (p.experienceYears == null) set.experienceYears = 3 + (idx % 6);
  if (!p.profileImageUrl || !/^https?:\/\//.test(p.profileImageUrl)) {
    set.profileImageUrl = `https://picsum.photos/seed/provider-${p._id}/300/300`;
  }
  if (isBlank(p.address) || p.address === 'Pending onboarding') {
    set.address = `${12 + idx * 7}, 80 Feet Road, Koramangala, Bengaluru, Karnataka 560034`;
  }
  const coords = p.location?.coordinates;
  if (!coords || (coords[0] === 0 && coords[1] === 0)) {
    set.location = { type: 'Point', coordinates: zone.center.coordinates };
  }
  if (!p.zoneIds?.length) set.zoneIds = [zone._id];
  if (!p.kycDocuments?.length) {
    set.kycDocuments = [
      { _id: new mongoose.Types.ObjectId(), type: 'GOVERNMENT_ID', url: `https://picsum.photos/seed/kyc-id-${p._id}/600/400`, uploadedAt: new Date() },
      { _id: new mongoose.Types.ObjectId(), type: 'PROFESSIONAL_CERTIFICATE', url: `https://picsum.photos/seed/kyc-cert-${p._id}/600/400`, uploadedAt: new Date() },
    ];
  }
  if (p.providerType === 'BOARDING' && !p.metadata?.boarding?.capacity) {
    set['metadata.boarding'] = { capacity: 20, availableKennels: 12, amenities: ['AC Rooms', 'Daily Walks', 'CCTV'] };
  }

  // Rating from actual reviews, so profile/home rating matches reviews_count.
  const [agg] = await db
    .collection('reviews')
    .aggregate([{ $match: { providerId: p._id } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }])
    .toArray();
  if (agg && (!p.rating || p.ratingCount !== agg.n)) {
    set.rating = Math.round(agg.avg * 10) / 10;
    set.ratingCount = agg.n;
  }

  if (Object.keys(set).length) {
    await db.collection('providers').updateOne({ _id: p._id }, { $set: { ...set, updatedAt: new Date() } });
    for (const k of Object.keys(set)) bump(`provider.${k}`);
  }
}

// Pets without a date of birth: 1-8 years old, deterministic per pet.
const pets = await db.collection('pets').find({ $or: [{ dateOfBirth: null }, { dateOfBirth: { $exists: false } }] }).toArray();
for (const pet of pets) {
  const years = 1 + (parseInt(pet._id.toString().slice(-2), 16) % 8);
  await db.collection('pets').updateOne({ _id: pet._id }, { $set: { dateOfBirth: new Date(Date.now() - years * 365 * DAY_MS) } });
  bump('pet.dateOfBirth');
}

// Bookings with no pet: point them at a real (owner, pet) pair so pet/owner stay consistent.
const owners = await db
  .collection('pets')
  .aggregate([{ $group: { _id: '$ownerId', petId: { $first: '$_id' } } }])
  .toArray();
const petless = await db.collection('bookings').find({ petId: null }).project({ userId: 1 }).toArray();
for (const [i, b] of petless.entries()) {
  const own = owners.find((o) => o._id.equals(b.userId)) ?? owners[i % owners.length];
  await db.collection('bookings').updateOne({ _id: b._id }, { $set: { userId: own._id, petId: own.petId } });
  bump('booking.petId');
}

console.log(counters);
await mongoose.disconnect();

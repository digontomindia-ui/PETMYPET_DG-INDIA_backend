// One-off: backfill `workingHours` on every existing provider that has none set (empty array,
// e.g. shell profiles created by provider-app signup before this had a schema default) — without
// it, GET /availability always returns an empty slot list for that provider. Applies the same
// Mon-Sat 09:00-19:00 / Sun-closed default the schema now uses for new providers.
// Safe to re-run: skips any provider that already has workingHours.
//
// Usage: MONGO_URI="<uri>" node scripts/backfill-provider-working-hours.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DEFAULT_WORKING_HOURS = WEEKDAYS.map((day) => ({
  day,
  openTime: '09:00',
  closeTime: '19:00',
  isClosed: day === 'SUN',
}));

await mongoose.connect(uri);
const db = mongoose.connection.db;

const filter = { $or: [{ workingHours: { $exists: false } }, { workingHours: { $size: 0 } }] };

const providers = await db
  .collection('providers')
  .find(filter, { projection: { businessName: 1 } })
  .toArray();

console.log(`--- ${providers.length} provider(s) to backfill ---`);
providers.forEach((p) => console.log(`${p._id}: ${p.businessName}`));

const result = await db.collection('providers').updateMany(filter, { $set: { workingHours: DEFAULT_WORKING_HOURS } });
console.log(`--- updated ${result.modifiedCount} provider(s) ---`);

await mongoose.disconnect();

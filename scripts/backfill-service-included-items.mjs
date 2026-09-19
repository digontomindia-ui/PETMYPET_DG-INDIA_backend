// One-off: backfill `includedItems` on every existing service from its `description`
// ("Bath, Blow Dry, Nail Trim" -> [{name, imageUrl}, ...]) so GET /services responses carry a
// real, renderable image per "What's Included" row instead of the app guessing an icon
// client-side. Images are picsum.photos (same pattern already used for provider/category
// photos elsewhere in this codebase) — real, publicly reachable, renders in-app immediately.
// Safe to re-run: skips any service that already has includedItems.
//
// Usage: MONGO_URI="<uri>" node scripts/backfill-service-included-items.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

await mongoose.connect(uri);
const db = mongoose.connection.db;

const services = await db
  .collection('services')
  .find({
    description: { $exists: true, $ne: '' },
    $or: [{ includedItems: { $exists: false } }, { includedItems: { $size: 0 } }],
  })
  .toArray();

console.log(`--- ${services.length} service(s) to backfill ---`);

let updated = 0;
for (const service of services) {
  const names = service.description
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (names.length === 0) continue;

  const includedItems = names.map((name) => ({
    name,
    imageUrl: `https://picsum.photos/seed/included-${slugify(name)}/100/100`,
  }));

  await db.collection('services').updateOne({ _id: service._id }, { $set: { includedItems } });
  console.log(`${service._id}: ${service.name} -> ${names.join(' | ')}`);
  updated += 1;
}

console.log(`--- updated ${updated} service(s) ---`);
await mongoose.disconnect();

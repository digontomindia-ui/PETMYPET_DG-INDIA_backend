// Fills blank grooming packages (no includedItems / images / originalPrice) created by
// seed-providerapp-home-data.mjs, and moves the "Pet Sitting Visit" service out of the grooming
// category (fix-pet-sitter.mjs picked categories.findOne({}) which happened to be grooming).
// Usage: MONGO_URI="<uri>" node scripts/fix-grooming-packages.mjs [--apply]   (dry-run without --apply)

import mongoose from 'mongoose';
const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');
const apply = process.argv.includes('--apply');

const item = (name) => ({
  _id: new mongoose.Types.ObjectId(),
  name,
  imageUrl: `https://picsum.photos/seed/included-${name.toLowerCase().replace(/\s+/g, '-')}/100/100`,
});
const TEMPLATES = {
  'Basic Grooming': { originalPrice: 799, items: ['Bath', 'Blow Dry', 'Nail Trim'] },
  'Standard Grooming': { originalPrice: 1199, items: ['Bath', 'Blow Dry', 'Nail Trim', 'Hair Trim', 'Ear Cleaning'] },
  'Premium Grooming': { originalPrice: 1799, items: ['Full Grooming', 'Styling', 'De-shedding', 'Paw Care'] },
};

await mongoose.connect(uri);
const db = mongoose.connection.db;
const grooming = await db.collection('categories').findOne({ slug: 'grooming' });
const sitting = await db.collection('categories').findOne({ slug: 'pet-sitting' });
if (!grooming) throw new Error('grooming category not found');

for (const s of await db.collection('services').find({ categoryId: grooming._id }).toArray()) {
  const t = TEMPLATES[s.name];
  if (!t) continue;
  const set = {};
  if (!s.includedItems?.length) set.includedItems = t.items.map(item);
  if (!s.images?.length) set.images = [`https://picsum.photos/seed/service-${s.name.toLowerCase().replace(/\s+/g, '-')}/600/600`];
  if (s.originalPrice == null) set.originalPrice = t.originalPrice;
  if (!Object.keys(set).length) continue;
  console.log(s._id.toString(), s.name, 'set:', Object.keys(set).join(','));
  if (apply) await db.collection('services').updateOne({ _id: s._id }, { $set: { ...set, updatedAt: new Date() } });
}

if (sitting) {
  const filter = { name: 'Pet Sitting Visit', categoryId: grooming._id };
  console.log('Pet Sitting Visit in grooming:', await db.collection('services').countDocuments(filter));
  if (apply) await db.collection('services').updateMany(filter, { $set: { categoryId: sitting._id, updatedAt: new Date() } });
} else console.log('pet-sitting category not found, skipped sitter move');

console.log(apply ? 'applied' : 'dry-run, pass --apply to write');
await mongoose.disconnect();

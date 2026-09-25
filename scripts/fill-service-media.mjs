// Fills services that have no includedItems / images (so package detail screens aren't blank).
// includedItems come from the comma-separated description, else the service name.
// Usage: MONGO_URI="<uri>" node scripts/fill-service-media.mjs

import mongoose from 'mongoose';
const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

await mongoose.connect(uri);
const services = mongoose.connection.db.collection('services');
const slug = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-');

for (const s of await services.find({ $or: [{ includedItems: { $in: [null, []] } }, { images: { $in: [null, []] } }] }).toArray()) {
  const set = {};
  if (!s.includedItems?.length) {
    const parts = (s.description || '').split(',').map((x) => x.trim()).filter(Boolean);
    set.includedItems = (parts.length > 1 ? parts : [s.name]).map((name) => ({
      _id: new mongoose.Types.ObjectId(),
      name,
      imageUrl: `https://picsum.photos/seed/included-${slug(name)}/100/100`,
    }));
  }
  if (!s.images?.length) set.images = [`https://picsum.photos/seed/service-${slug(s.name)}/600/600`];
  await services.updateOne({ _id: s._id }, { $set: { ...set, updatedAt: new Date() } });
  console.log(s._id.toString(), s.name, Object.keys(set).join(','));
}

await mongoose.disconnect();

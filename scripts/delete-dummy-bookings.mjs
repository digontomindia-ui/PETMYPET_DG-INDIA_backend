// Deletes the dummy (script-seeded) bookings on every vendor, plus what hangs off them: reviews,
// payments, coupon redemptions, booking chat rooms + messages, booking notifications, and the
// showcase wallet ledger/withdrawals. Then recomputes provider rating/ratingCount and wallet balances.
//
// A booking is "dummy" if ANY of:
//   - it has `seedTag` (seed-madhab-showcase.mjs)
//   - it has no `__v` — Mongoose stamps __v on every booking the API creates; the seed-providerapp-*
//     and create-test-grooming-booking scripts insert raw docs without it
//   - its customer is a `@seed.patmypets.in` user (npm run seed)
// Bookings made through the apps (even test ones) are kept.
//
// Usage (dry run by default — prints counts, changes nothing):
//   MONGO_URI="<uri>" node scripts/delete-dummy-bookings.mjs
//   MONGO_URI="<uri>" node scripts/delete-dummy-bookings.mjs --apply
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');
const APPLY = process.argv.includes('--apply');

await mongoose.connect(uri);
const db = mongoose.connection.db;
const col = (n) => db.collection(n);

const seedUserIds = (
  await col('users').find({ email: /@seed\.patmypets\.in$/i }, { projection: { _id: 1 } }).toArray()
).map((u) => u._id);

const bookings = await col('bookings')
  .find(
    { $or: [{ seedTag: { $exists: true } }, { __v: { $exists: false } }, { userId: { $in: seedUserIds } }] },
    { projection: { _id: 1, providerId: 1 } },
  )
  .toArray();
const bookingIds = bookings.map((b) => b._id);
const bookingIdStrings = bookingIds.map(String);
const total = await col('bookings').countDocuments();
console.log(`${APPLY ? 'APPLY' : 'DRY RUN'}: ${bookingIds.length} dummy of ${total} bookings`);

const perProvider = new Map();
for (const b of bookings) perProvider.set(String(b.providerId), (perProvider.get(String(b.providerId)) ?? 0) + 1);
const providers = await col('providers')
  .find({ _id: { $in: [...perProvider.keys()].map((id) => new mongoose.Types.ObjectId(id)) } })
  .project({ businessName: 1, providerType: 1, userId: 1 })
  .toArray();
for (const p of providers) console.log(`  ${p.providerType} ${p.businessName}: ${perProvider.get(String(p._id))}`);

const roomIds = (
  await col('chatrooms')
    .find({ $or: [{ bookingId: { $in: bookingIds } }, { seedTag: { $exists: true } }] }, { projection: { _id: 1 } })
    .toArray()
).map((r) => r._id);

const targets = [
  ['reviews', { $or: [{ bookingId: { $in: bookingIds } }, { seedTag: { $exists: true }, bookingId: { $ne: null } }] }],
  ['payments', { bookingId: { $in: bookingIds } }],
  ['couponredemptions', { bookingId: { $in: bookingIds } }],
  ['messages', { roomId: { $in: roomIds } }],
  ['chatrooms', { _id: { $in: roomIds } }],
  ['notifications', { $or: [{ 'data.bookingId': { $in: bookingIdStrings } }, { seedTag: { $exists: true } }] }],
  ['wallettransactions', { seedTag: { $exists: true } }],
  ['payoutrequests', { seedTag: { $exists: true } }],
  ['bookings', { _id: { $in: bookingIds } }],
];

// Wallets whose ledger loses rows need their balance re-derived afterwards.
const touchedWalletIds = await col('wallettransactions').distinct('walletId', { seedTag: { $exists: true } });

for (const [name, filter] of targets) {
  const n = await col(name).countDocuments(filter);
  console.log(`  ${name}: ${n}`);
  if (APPLY && n) await col(name).deleteMany(filter);
}

if (APPLY) {
  for (const p of providers) {
    const [agg] = await col('reviews')
      .aggregate([{ $match: { providerId: p._id } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }])
      .toArray();
    await col('providers').updateOne(
      { _id: p._id },
      { $set: { rating: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg?.n ?? 0 } },
    );
  }
  for (const walletId of touchedWalletIds) {
    const last = await col('wallettransactions').find({ walletId }).sort({ createdAt: -1, _id: -1 }).limit(1).next();
    await col('wallets').updateOne({ _id: walletId }, { $set: { balance: last?.balanceAfter ?? 0 } });
  }
  console.log(`recomputed rating for ${providers.length} providers, balance for ${touchedWalletIds.length} wallets`);
} else {
  console.log('nothing changed — re-run with --apply to delete');
}

await mongoose.disconnect();

// App-development showcase data for Madhab's provider-app account (default: groomer 9609226659).
// Goal: for the next ~60 days (and 100 days back) NO provider-app GET returns an empty screen:
//   home, appointments (every day, every status), my-appointments, analytics (week/month/year),
//   earnings + chart + transactions, withdrawals, reviews (124 @ 4.9), patients (Dog/Cat/Birds) +
//   records, inbox (all / unread / emergency) + history, profile, personal-info, experience-skills,
//   documents, bank-account.
//
// Trick for "next 2 months": analytics/earnings only count rows whose createdAt / completion time
// is already in the past, so every future day gets a few PAID bookings whose createdAt/completion
// fall on that day — as the calendar advances they "arrive" and the charts stay populated.
//
// Everything this script inserts carries `seedTag`, so re-running first deletes the previous run
// (idempotent). Legacy fixes (string paymentId, stale STARTED sessions) are applied once and are
// not tagged.
//
// Usage: MONGO_URI="<uri incl. db>" node scripts/seed-madhab-showcase.mjs [--dry] [--phone=9609226659]

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');
const DRY = process.argv.includes('--dry');
const PHONE = (process.argv.find((a) => a.startsWith('--phone=')) ?? '--phone=9609226659').split('=')[1];
const TAG = 'showcase-2026-10';

const DAY = 86_400_000;
const IST = 5.5 * 3_600_000;
const PAST_DAYS = 100;
const FUTURE_DAYS = 60;
const oid = (id) => new mongoose.Types.ObjectId(id);

// deterministic PRNG so dry-run == real run
let seed = 20261007;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const otp = () => String(Math.floor(100000 + rnd() * 900000));
const round2 = (n) => Math.round(n * 100) / 100;

// IST wall-clock -> UTC Date, for day offset d from today(IST)
const now = new Date();
const todayIst = new Date(now.getTime() + IST);
const todayY = todayIst.getUTCFullYear();
const todayM = todayIst.getUTCMonth();
const todayD = todayIst.getUTCDate();
function at(dayOffset, hh, mm = 0) {
  return new Date(Date.UTC(todayY, todayM, todayD + dayOffset, hh, mm) - IST);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;
const col = (n) => db.collection(n);

// ---------- locate account ----------
const user = await col('users').findOne({ phone: { $regex: `${PHONE}$` }, role: 'SERVICE_PROVIDER' });
if (!user) throw new Error(`no provider user for ${PHONE}`);
const provider = await col('providers').findOne({ userId: user._id });
if (!provider) throw new Error('no provider profile');
console.log(`target: ${user.name} / ${provider.providerType} / ${provider.businessName} / ${provider._id}`);
const providerId = provider._id;
const commissionPercent = provider.commissionPercent ?? 15;

// ---------- 0. wipe previous run ----------
const wipe = async (name, filter) => {
  const n = await col(name).countDocuments(filter);
  if (!DRY && n) await col(name).deleteMany(filter);
  if (n) console.log(`  wiped ${n} ${name}`);
};
// every wipe is scoped to THIS provider/user so seeding several accounts never clobbers each other.
const oldBookingIds = (await col('bookings').find({ seedTag: TAG, providerId }, { projection: { _id: 1 } }).toArray()).map((b) => b._id);
const oldRoomIds = (await col('chatrooms').find({ seedTag: TAG, participantIds: user._id }, { projection: { _id: 1 } }).toArray()).map((r) => r._id);
await wipe('reviews', { seedTag: TAG, providerId });
await wipe('messages', { seedTag: TAG, roomId: { $in: oldRoomIds } });
await wipe('chatrooms', { seedTag: TAG, participantIds: user._id });
await wipe('notifications', { seedTag: TAG, userId: user._id });
await wipe('wallettransactions', { seedTag: TAG, userId: user._id });
await wipe('payoutrequests', { seedTag: TAG, userId: user._id });
await wipe('payments', { seedTag: TAG, bookingId: { $in: oldBookingIds } });
await wipe('bookings', { seedTag: TAG, providerId });
await wipe('services', { seedTag: TAG, providerId });
// shared bird pets are created once and reused by every account (never wiped).
const haveBirds = await col('pets').countDocuments({ seedTag: TAG, species: 'BIRD' });

// ---------- 1. legacy fixes ----------
const badPay = await col('bookings').countDocuments({ providerId, paymentId: { $type: 'string' } });
console.log(`legacy string paymentId bookings: ${badPay}`);
if (!DRY && badPay) {
  await col('bookings').updateMany({ providerId, paymentId: { $type: 'string' } }, { $set: { paymentId: null } });
}
// stale STARTED sessions older than 2 days block "end session" (oldest STARTED wins) -> complete them.
const stale = await col('bookings')
  .find({ providerId, status: 'STARTED', scheduledStart: { $lt: new Date(now.getTime() - 2 * DAY) } })
  .toArray();
console.log(`stale STARTED sessions to complete: ${stale.map((b) => String(b._id).slice(-6)).join(', ') || 'none'}`);
if (!DRY) {
  for (const b of stale) {
    await col('bookings').updateOne(
      { _id: b._id },
      {
        $set: {
          status: 'COMPLETED',
          otpStartVerifiedAt: b.scheduledStart,
          otpEndVerifiedAt: b.scheduledEnd,
          paymentStatus: 'PAID',
          updatedAt: b.scheduledEnd,
        },
      },
    );
  }
}

// overdue never-started bookings (old seed rows) sort first in every "upcoming" list and bury the
// real ones -> close them out: accepted/on-the-way = completed, never-accepted = cancelled.
const overdueCut = new Date(now.getTime() - 2 * DAY);
const overdue = await col('bookings')
  .find({ providerId, seedTag: { $exists: false }, status: { $in: ['PENDING', 'ACCEPTED', 'ON_THE_WAY'] }, scheduledStart: { $lt: overdueCut } })
  .toArray();
console.log(`overdue active bookings to close: ${overdue.length}`);
if (!DRY) {
  for (const b of overdue) {
    const $set = b.status === 'PENDING'
      ? { status: 'CANCELLED', cancelledBy: 'PROVIDER', cancellationReason: 'Request expired', paymentStatus: 'REFUNDED', updatedAt: b.scheduledEnd }
      : { status: 'COMPLETED', otpStartVerifiedAt: b.scheduledStart, otpEndVerifiedAt: b.scheduledEnd, paymentStatus: 'PAID', updatedAt: b.scheduledEnd };
    await col('bookings').updateOne({ _id: b._id }, { $set });
  }
}

// ---------- 2. services ----------
const baseService = await col('services').findOne({ providerId, seedTag: { $exists: false } });
if (!baseService) throw new Error('provider has no base service');
const GROOMER_DEFS = [
  { name: 'Full Grooming', price: 999, originalPrice: 1299, durationMinutes: 120, description: 'Bath, haircut, blow dry, nail trim and ear cleaning', items: ['Bath', 'Haircut', 'Blow Dry', 'Nail Trim', 'Ear Cleaning'] },
  { name: 'Spa & Bath', price: 699, originalPrice: 899, durationMinutes: 75, description: 'Aromatherapy bath with conditioner and massage', items: ['Aroma Bath', 'Conditioner', 'Massage'] },
  { name: 'De-shedding Treatment', price: 1199, originalPrice: 1499, durationMinutes: 120, description: 'Deep de-shedding for double-coated breeds', items: ['De-shed Brush', 'Bath', 'Blow Dry'] },
  { name: 'Nail & Ear Care', price: 299, originalPrice: 399, durationMinutes: 30, description: 'Quick nail trim, paw care and ear cleaning', items: ['Nail Trim', 'Paw Care', 'Ear Cleaning'] },
  { name: 'Puppy First Groom', price: 599, originalPrice: 799, durationMinutes: 60, description: 'Gentle first-groom experience for puppies', items: ['Gentle Bath', 'Light Trim', 'Cuddles'] },
];
const WALKER_DEFS = [
  { name: '15 Min Walk', price: 149, originalPrice: 199, durationMinutes: 15, description: 'Quick potty and sniff walk', items: ['Leash Walk', 'Water Break'] },
  { name: '45 Min Walk', price: 349, originalPrice: 449, durationMinutes: 45, description: 'Long energetic walk with play breaks', items: ['Leash Walk', 'Play Time', 'Water Break'] },
  { name: '60 Min Walk', price: 449, originalPrice: 599, durationMinutes: 60, description: 'Full hour of exercise and fun', items: ['Leash Walk', 'Fetch', 'Water Break'] },
  { name: 'Evening Group Walk', price: 249, originalPrice: 299, durationMinutes: 40, description: 'Social group walk with other pups', items: ['Group Walk', 'Socialising'] },
  { name: 'Puppy Potty Walk', price: 199, originalPrice: 249, durationMinutes: 20, description: 'Short potty-training focused walk', items: ['Potty Training', 'Treats'] },
];
const TRAINER_DEFS = [
  { name: 'Puppy Basics Training', price: 799, originalPrice: 999, durationMinutes: 60, description: 'Sit, stay, recall and leash basics for puppies', items: ['Sit & Stay', 'Recall', 'Leash Manners'] },
  { name: 'Behaviour Correction', price: 1299, originalPrice: 1599, durationMinutes: 75, description: 'Barking, biting and anxiety correction plan', items: ['Behaviour Assessment', 'Correction Plan'] },
  { name: 'Advanced Obedience', price: 1099, originalPrice: 1399, durationMinutes: 75, description: 'Off-leash control and advanced commands', items: ['Off-leash Control', 'Advanced Commands'] },
  { name: 'Agility Session', price: 899, originalPrice: 1099, durationMinutes: 60, description: 'Agility course for active dogs', items: ['Agility Course', 'Fitness'] },
  { name: 'Home Training Visit', price: 999, originalPrice: 1199, durationMinutes: 60, description: 'One-to-one training at your home', items: ['Home Visit', 'Owner Coaching'] },
];
const VET_DEFS = [
  { name: 'Vaccination Visit', price: 599, originalPrice: 799, durationMinutes: 20, description: 'Core vaccines with health check', items: ['Vaccine', 'Health Check'] },
  { name: 'Dental Checkup', price: 799, originalPrice: 999, durationMinutes: 30, description: 'Oral exam and scaling advice', items: ['Oral Exam', 'Scaling Advice'] },
  { name: 'Skin & Coat Consultation', price: 699, originalPrice: 899, durationMinutes: 30, description: 'Allergy and skin condition diagnosis', items: ['Skin Scrape', 'Treatment Plan'] },
  { name: 'Follow-up Visit', price: 299, originalPrice: 399, durationMinutes: 15, description: 'Quick review after treatment', items: ['Review'] },
  { name: 'Video Consultation', price: 399, originalPrice: 499, durationMinutes: 20, description: 'Online consult from home', items: ['Video Call', 'e-Prescription'] },
];
const BOARDING_DEFS = [
  { name: 'Deluxe Boarding', price: 899, originalPrice: 1099, durationMinutes: 1440, description: 'AC room with daily walks and play time', items: ['AC Room', 'Daily Walks', 'Play Time'] },
  { name: 'Premium Suite', price: 1499, originalPrice: 1799, durationMinutes: 1440, description: 'Private suite with CCTV and grooming', items: ['Private Suite', 'CCTV', 'Daily Grooming'] },
  { name: 'Day Care', price: 399, originalPrice: 499, durationMinutes: 1440, description: 'Daytime care and socialising', items: ['Meals', 'Socialising'] },
  { name: 'Puppy Boarding', price: 699, originalPrice: 849, durationMinutes: 1440, description: 'Extra attention for puppies', items: ['Puppy Care', 'Feeding Schedule'] },
  { name: 'Weekend Stay', price: 999, originalPrice: 1199, durationMinutes: 1440, description: 'Comfortable weekend stay', items: ['AC Room', 'Walks'] },
];
const SITTER_DEFS = [
  { name: '2 Hour Sit', price: 399, originalPrice: 499, durationMinutes: 120, description: 'Companionship and feeding at home', items: ['Feeding', 'Play Time'] },
  { name: 'Overnight Sit', price: 999, originalPrice: 1299, durationMinutes: 600, description: 'Sitter stays overnight at your home', items: ['Overnight Stay', 'Feeding'] },
  { name: 'Daily Visit', price: 249, originalPrice: 299, durationMinutes: 30, description: 'Quick visit for food, water and cuddles', items: ['Feeding', 'Cuddles'] },
  { name: 'Weekend Sit', price: 1499, originalPrice: 1799, durationMinutes: 1440, description: 'Full weekend care', items: ['Feeding', 'Walks', 'Play Time'] },
  { name: 'Puppy Sit', price: 349, originalPrice: 449, durationMinutes: 90, description: 'Puppy-safe supervised sit', items: ['Supervision', 'Potty Breaks'] },
];
const DEFS_BY_TYPE = { PET_WALKER: WALKER_DEFS, TRAINER: TRAINER_DEFS, GROOMER: GROOMER_DEFS, VET: VET_DEFS, CLINIC: VET_DEFS, BOARDING: BOARDING_DEFS, PET_SITTER: SITTER_DEFS };
const svcDefs = DEFS_BY_TYPE[provider.providerType];
if (!svcDefs) throw new Error(`unsupported provider type ${provider.providerType}`);
const T = provider.providerType;

const newServices = svcDefs.map((s) => ({
  _id: new mongoose.Types.ObjectId(),
  providerId,
  categoryId: baseService.categoryId,
  name: s.name,
  description: s.description,
  price: s.price,
  originalPrice: s.originalPrice,
  durationMinutes: s.durationMinutes,
  images: [`https://picsum.photos/seed/${encodeURIComponent(s.name)}/600/600`],
  includedItems: s.items.map((n) => ({ name: n, imageUrl: `https://picsum.photos/seed/inc-${encodeURIComponent(n)}/100/100` })),
  addOnCatalog: [
    { name: 'Treat Pack', price: 49 },
    { name: 'Photo Update', price: 29 },
  ],
  isActive: true,
  isDeleted: false,
  seedTag: TAG,
  createdAt: new Date(now.getTime() - 120 * DAY),
  updatedAt: new Date(now.getTime() - 120 * DAY),
}));
const services = [
  { _id: baseService._id, name: baseService.name, price: baseService.price, durationMinutes: baseService.durationMinutes },
  ...newServices.map((s) => ({ _id: s._id, name: s.name, price: s.price, durationMinutes: s.durationMinutes })),
];
const svcWeights = [4, 4, 2, 2, 1, 1]; // base, full, spa, deshed, nail, puppy
const svcBag = services.flatMap((s, i) => Array(svcWeights[i]).fill(s));
const addOnPool = T === 'GROOMER' ? [{ name: 'Teeth Brushing', price: 99 }, { name: 'Perfume Spray', price: 49 }, { name: 'De-tangling', price: 149 }] : [{ name: 'Treat Pack', price: 49 }, { name: 'Photo Update', price: 29 }];

// ---------- 3. customers & pets ----------
const customerSuffixes = ['23e5', '23e8', '23eb', '23ee', '3b80', '3b89', '3b9e', '3bac', '3bb3', '3bba', '3bc1', '3bc8', '3bcf', '3bd6', '3ba5', '3b90', '3b97'];
const allUsers = await col('users').find({ role: 'USER', isDeleted: { $ne: true } }).toArray();
const customers = allUsers.filter((u) => customerSuffixes.some((s) => String(u._id).endsWith(s)));
if (customers.length < 10) throw new Error(`only ${customers.length} demo customers found`);
const newPets = [];
const birdSeeds = [
  { name: 'Mitthu', breed: 'Alexandrine Parakeet', owner: customers.find((u) => String(u._id).endsWith('3b90')) },
  { name: 'Kiwi', breed: 'Cockatiel', owner: customers.find((u) => String(u._id).endsWith('3b97')) },
];
for (const b of birdSeeds) {
  if (!b.owner || haveBirds > 0) continue;
  newPets.push({
    _id: new mongoose.Types.ObjectId(),
    ownerId: b.owner._id,
    name: b.name,
    species: 'BIRD',
    breed: b.breed,
    gender: 'MALE',
    dateOfBirth: new Date(now.getTime() - 400 * DAY),
    weightKg: 0.3,
    avatarUrl: `https://picsum.photos/seed/bird-${b.name}/300/300`,
    galleryUrls: [],
    notes: 'Handle gently, wing trim only on request.',
    medicalRecords: [{ _id: new mongoose.Types.ObjectId(), title: 'Beak & feather check', description: 'Healthy plumage, nails trimmed.', fileUrl: null, providerId: null, recordedAt: new Date(now.getTime() - 45 * DAY) }],
    vaccinations: [{ _id: new mongoose.Types.ObjectId(), name: 'Polyomavirus Vaccine', administeredAt: new Date(now.getTime() - 300 * DAY), expiresAt: new Date(now.getTime() + 20 * DAY), certificateUrl: null, providerId: null }],
    activities: [],
    companionProfile: null,
    viewCount: 0,
    isDeleted: false,
    seedTag: TAG,
    createdAt: new Date(now.getTime() - 200 * DAY),
    updatedAt: new Date(now.getTime() - 200 * DAY),
  });
}
const existingPets = await col('pets')
  .find({ ownerId: { $in: customers.map((c) => c._id) }, isDeleted: { $ne: true } })
  .toArray();
const petsPool = [...existingPets, ...newPets];
const petOwner = new Map(petsPool.map((p) => [String(p._id), p.ownerId]));
const customerById = new Map(customers.map((c) => [String(c._id), c]));
console.log(`customers ${customers.length}, pets ${petsPool.length} (species: ${[...new Set(petsPool.map((p) => p.species))].join(',')})`);

// ---------- 4. bookings ----------
const bookings = [];
const payments = [];
const photosPool = (n, phase) => [{ url: `https://picsum.photos/seed/${phase}-${n}/600/600`, phase, caption: phase === 'BEFORE' ? 'Before grooming' : 'After grooming', uploadedAt: new Date() }];
const customerNotes = ['Please use hypoallergenic shampoo.', 'Nervous around dryers, go slow.', 'Trim nails short please.', 'Please keep the teddy-bear cut.', 'Sensitive skin on belly.', '', '', ''];
const providerNotes = T !== 'GROOMER' ? ['Session went smoothly, pet was energetic.', 'Great progress today.', 'Pet was calm and responsive.', 'Followed all commands well.', 'Hydrated and happy after the session.'] : ['Coat in good shape, used conditioner.', 'Calm throughout, nails trimmed.', 'Mild matting behind ears, de-tangled.', 'Recommended monthly grooming.', 'Skin check clear.'];
const cancelReasons = [['USER', 'Change of plans'], ['USER', 'Pet not well today'], ['PROVIDER', 'Provider unavailable at this slot'], ['USER', 'Booked by mistake']];
const slotHours = [9, 10, 11, 12, 14, 15, 16, 17];

function makeBooking({ dayOffset, hour, minute = 0, status, createdAt, custIdx, forceDays = null }) {
  const svc = pick(svcBag);
  const pet = petsPool[(custIdx + Math.floor(rnd() * 3)) % petsPool.length];
  const customerId = petOwner.get(String(pet._id));
  const scheduledStart = at(dayOffset, hour, minute);
  const isBoarding = T === 'BOARDING';
  let stayDays = isBoarding ? (forceDays ?? 1 + Math.floor(rnd() * 4)) : null;
  if (isBoarding && dayOffset < 0 && !forceDays) stayDays = Math.max(1, Math.min(stayDays, -dayOffset)); // past stays must already be over
  const scheduledEnd = isBoarding
    ? new Date(scheduledStart.getTime() + stayDays * DAY)
    : new Date(scheduledStart.getTime() + svc.durationMinutes * 60_000);
  const addOns = rnd() < 0.3 ? [pick(addOnPool)] : [];
  const gross = svc.price * (isBoarding ? stayDays : 1) + addOns.reduce((s, a) => s + a.price, 0);
  const discountAmount = rnd() < 0.15 ? 50 : 0;
  const net = gross - discountAmount;
  const commissionAmount = round2(net * (commissionPercent / 100));
  const providerPayoutAmount = round2(net - commissionAmount);
  const completed = status === 'COMPLETED';
  const started = status === 'STARTED';
  const cancelled = status === 'CANCELLED';
  const cancel = cancelled ? pick(cancelReasons) : null;
  const _id = new mongoose.Types.ObjectId();
  const paymentId = !cancelled ? new mongoose.Types.ObjectId() : null;
  if (paymentId) {
    payments.push({
      _id: paymentId,
      bookingId: _id,
      orderId: null,
      userId: customerId,
      amount: net,
      currency: 'INR',
      method: pick(['RAZORPAY', 'RAZORPAY', 'CASH', 'WALLET']),
      purpose: 'BOOKING',
      status: 'CAPTURED',
      razorpayOrderId: null,
      razorpayPaymentId: null,
      refundedAmount: 0,
      failureReason: null,
      seedTag: TAG,
      createdAt,
      updatedAt: createdAt,
    });
  }
  const doc = {
    _id,
    userId: customerId,
    petId: pet._id,
    providerId,
    serviceId: svc._id,
    zoneId: provider.zoneIds?.[0] ?? null,
    scheduledStart,
    scheduledEnd,
    status,
    otpStart: otp(),
    otpStartVerifiedAt: completed || started ? scheduledStart : null,
    otpEnd: otp(),
    otpEndVerifiedAt: completed ? scheduledEnd : null,
    payoutCreditedAt: null,
    price: gross,
    currency: 'INR',
    couponCode: discountAmount ? 'FIRST50' : null,
    discountAmount,
    commissionPercent,
    commissionAmount,
    providerPayoutAmount,
    paymentStatus: cancelled ? 'REFUNDED' : 'PAID',
    paymentId,
    cancelledBy: cancel?.[0] ?? null,
    cancellationReason: cancel?.[1] ?? null,
    notes: pick(customerNotes),
    addOns,
    durationDays: isBoarding ? stayDays : null,
    dropOffTime: isBoarding ? '10:00 AM' : null,
    pickupTime: isBoarding ? '06:00 PM' : null,
    consultationMode: T === 'VET' || T === 'CLINIC' ? (rnd() < 0.25 ? 'ONLINE' : 'CLINIC') : null,
    providerNotes: completed ? pick(providerNotes) : '',
    photos: (T === 'VET' || T === 'CLINIC') && completed && rnd() < 0.6 ? [{ url: `https://picsum.photos/seed/rx-${String(_id).slice(-4)}/600/800`, phase: 'PRESCRIPTION', caption: 'Prescription', uploadedAt: new Date() }] : T === 'BOARDING' && completed && rnd() < 0.6 ? [{ url: `https://picsum.photos/seed/rcpt-${String(_id).slice(-4)}/600/800`, phase: 'RECEIPT', caption: 'Check-out receipt', uploadedAt: new Date() }] : T === 'GROOMER' && completed && rnd() < 0.5 ? [...photosPool(String(_id).slice(-4), 'BEFORE'), ...photosPool(String(_id).slice(-4), 'AFTER')] : [],
    progressUpdates: [],
    walkStats: T === 'PET_WALKER' && completed ? { distanceMeters: 1200 + Math.floor(rnd() * 3500), durationSeconds: svc.durationMinutes * 60, steps: 1800 + Math.floor(rnd() * 5000), calories: 60 + Math.floor(rnd() * 200), updatedAt: scheduledEnd } : null,
    isDeleted: false,
    seedTag: TAG,
    createdAt,
    updatedAt: completed ? scheduledEnd : createdAt,
  };
  bookings.push(doc);
  return doc;
}

let cIdx = 0;
// past: completed history (+ occasional cancelled)
for (let d = -PAST_DAYS; d <= -1; d++) {
  const count = rnd() < 0.6 ? 2 : 1;
  const hours = [...slotHours].sort(() => rnd() - 0.5).slice(0, count + 1);
  for (let i = 0; i < count; i++) {
    makeBooking({ dayOffset: d, hour: hours[i], minute: pick([0, 30]), status: 'COMPLETED', createdAt: at(d - 1 - Math.floor(rnd() * 2), 18), custIdx: cIdx++ });
  }
  if (rnd() < 0.15) makeBooking({ dayOffset: d, hour: hours[count], status: 'CANCELLED', createdAt: at(d - 2, 12), custIdx: cIdx++ });
}
// today: a full realistic day
makeBooking({ dayOffset: 0, hour: 8, minute: 0, status: 'COMPLETED', createdAt: at(-1, 17), custIdx: cIdx++ });
makeBooking({ dayOffset: 0, hour: 11, status: 'ON_THE_WAY', createdAt: at(-1, 19), custIdx: cIdx++ });
makeBooking({ dayOffset: 0, hour: 14, status: 'ACCEPTED', createdAt: at(-2, 10), custIdx: cIdx++ });
makeBooking({ dayOffset: 0, hour: 16, status: 'ACCEPTED', createdAt: at(-2, 15), custIdx: cIdx++ });
makeBooking({ dayOffset: 0, hour: 17, minute: 30, status: 'PENDING', createdAt: at(0, 0, 5), custIdx: cIdx++ });
makeBooking({ dayOffset: 0, hour: 12, status: 'CANCELLED', createdAt: at(-3, 11), custIdx: cIdx++ });
if (T === 'BOARDING') {
  // pets currently checked in: started 1-3 days ago, checking out today / +1 / +2
  for (let i = 0; i < 6; i++) {
    const back = 1 + (i % 3);
    makeBooking({ dayOffset: -back, hour: 10, status: 'STARTED', createdAt: at(-back - 3, 12), custIdx: cIdx++, forceDays: back + (i % 3) });
  }
}
// future: 3 live bookings per day + a pre-completed one so earnings/analytics never go flat
for (let d = 1; d <= FUTURE_DAYS; d++) {
  const hours = [...slotHours].sort(() => rnd() - 0.5);
  const liveStatuses = d <= 2 ? ['ON_THE_WAY', 'ACCEPTED', 'PENDING'] : ['ACCEPTED', rnd() < 0.5 ? 'PENDING' : 'ACCEPTED', rnd() < 0.35 ? 'PENDING' : 'ACCEPTED'];
  for (let i = 0; i < 3; i++) {
    makeBooking({ dayOffset: d, hour: hours[i], minute: pick([0, 30]), status: liveStatuses[i], createdAt: at(d - 1 - Math.floor(rnd() * 3), 10 + Math.floor(rnd() * 8)), custIdx: cIdx++ });
  }
  makeBooking({ dayOffset: d, hour: 8, minute: 0, status: 'COMPLETED', createdAt: at(d - 2, 20), custIdx: cIdx++ });
  if (d % 5 === 0) makeBooking({ dayOffset: d, hour: hours[3], status: 'CANCELLED', createdAt: at(d - 2, 13), custIdx: cIdx++ });
}
console.log(`bookings to insert: ${bookings.length} (payments ${payments.length})`);

// in-progress progress updates for a couple of today's rows are not needed (no STARTED rows seeded).

// ---------- 5. reviews: 121 new + 3 existing = 124, avg 4.9 ----------
const existingReviews = await col('reviews').find({ providerId, seedTag: { $exists: false } }).toArray();
const wantNew = 124 - existingReviews.length;
const reviewable = bookings
  .filter((b) => b.status === 'COMPLETED' && b.otpEndVerifiedAt < now)
  .sort((a, b) => b.scheduledStart - a.scheduledStart)
  .slice(0, wantNew);
const existingSum = existingReviews.reduce((s, r) => s + r.rating, 0);
// target avg 4.9 (>=4.85): 5-stars everywhere except a few 4s and a single 3
const targetSum = Math.ceil(4.88 * 124);
const ratings = Array(reviewable.length).fill(5);
let deficit = reviewable.length * 5 + existingSum - targetSum;
for (let i = 0; deficit > 0 && i < ratings.length; i += 9) {
  const drop = deficit >= 2 && i === 18 ? 2 : 1;
  ratings[i] -= drop;
  deficit -= drop;
}
const comments5 = T !== 'GROOMER' ? ['Wonderful experience, my dog was so happy!', 'Very reliable and punctual.', 'Great with our energetic pup, sends updates too.', 'Highly recommended, will book again.', 'Patient and caring, my dog loves him/her.', 'Visible improvement after just a few sessions.', 'Professional and friendly throughout.', 'Best service in the area.'] : [
  'Amazing service, my dog was so happy and calm!',
  'Super gentle with my pet. Looks fabulous!',
  'On time, professional and very caring.',
  'Best grooming experience we have had in Bengaluru.',
  'My cat usually panics but she was relaxed the whole time.',
  'Loved the spa session, coat is so soft.',
  'Explained every step and sent photos. Highly recommended!',
  'Great value for money, will book again.',
  'Very patient with our puppy on the first groom.',
  'Clean tools, friendly staff, lovely result.',
];
const comments4 = ['Good job overall, slightly late.', 'Nice session, would like a bit more time next time.'];
const comments3 = ['Okay experience, took longer than expected.'];
const replies = ['Thank you so much! See you next time 🐾', 'Glad your pet enjoyed it!', 'Thanks for the lovely feedback.', 'We appreciate you trusting us with your furry friend.'];
const reviews = reviewable.map((b, i) => {
  const rating = ratings[i];
  const created = new Date(b.otpEndVerifiedAt.getTime() + (1 + Math.floor(rnd() * 20)) * 3_600_000);
  const createdAt = created > now ? new Date(now.getTime() - 3_600_000) : created;
  return {
    _id: new mongoose.Types.ObjectId(),
    bookingId: b._id,
    productId: null,
    petId: null,
    userId: b.userId,
    providerId,
    rating,
    comment: rating === 5 ? pick(comments5) : rating === 4 ? pick(comments4) : pick(comments3),
    reply: rnd() < 0.6 ? { text: pick(replies), repliedAt: new Date(createdAt.getTime() + 3_600_000 * (2 + Math.floor(rnd() * 30))) } : null,
    seedTag: TAG,
    createdAt,
  };
});
const allRatings = [...existingReviews.map((r) => r.rating), ...reviews.map((r) => r.rating)];
const avg = Math.round((allRatings.reduce((s, r) => s + r, 0) / allRatings.length) * 10) / 10;
console.log(`reviews: ${allRatings.length} total, avg ${avg}`);

// ---------- 6. wallet ledger + withdrawals ----------
const wallet = (await col('wallets').findOne({ userId: user._id })) ?? { _id: new mongoose.Types.ObjectId(), userId: user._id, balance: 0, currency: 'INR', createdAt: now, updatedAt: now };
const creditable = bookings
  .filter((b) => b.status === 'COMPLETED' && b.otpEndVerifiedAt < new Date(now.getTime() - DAY))
  .sort((a, b) => a.otpEndVerifiedAt - b.otpEndVerifiedAt);
const events = creditable.map((b) => ({ at: b.otpEndVerifiedAt, kind: 'credit', amount: b.providerPayoutAmount, booking: b }));
const bank = { accountHolderName: user.name || 'Madhab', bankName: 'HDFC Bank', accountNumber: '50100123454821', ifscCode: 'HDFC0000123', accountType: 'SAVINGS' };
const totalCredit = creditable.reduce((t, b) => t + b.providerPayoutAmount, 0);
const frac = (f) => Math.max(100, Math.round((totalCredit * f) / 100) * 100);
const withdrawalPlan = [
  { daysAgo: 60, amount: frac(0.3), status: 'PAID', ref: 'UTR2026080112345' },
  { daysAgo: 30, amount: frac(0.2), status: 'PAID', ref: 'UTR2026090798765' },
  { daysAgo: 12, amount: frac(0.05), status: 'REJECTED', ref: null, note: 'Bank account name mismatch' },
  { daysAgo: 2, amount: frac(0.08), status: 'REQUESTED', ref: null },
];
const payoutRequests = [];
for (const w of withdrawalPlan) {
  const at_ = new Date(now.getTime() - w.daysAgo * DAY);
  const id = new mongoose.Types.ObjectId();
  payoutRequests.push({
    _id: id,
    providerId,
    userId: user._id,
    amount: w.amount,
    currency: 'INR',
    status: w.status,
    bankAccount: bank,
    referenceNumber: w.ref,
    adminNote: w.note ?? '',
    processedBy: null,
    processedAt: w.status === 'REQUESTED' ? null : new Date(at_.getTime() + 6 * 3_600_000),
    seedTag: TAG,
    createdAt: at_,
    updatedAt: at_,
  });
  events.push({ at: at_, kind: 'debit', amount: w.amount, payout: id });
  if (w.status === 'REJECTED') events.push({ at: new Date(at_.getTime() + 6 * 3_600_000), kind: 'reversal', amount: w.amount, payout: id });
}
events.sort((a, b) => a.at - b.at);
let balance = 0;
const walletTx = [];
for (const e of events) {
  if (e.kind === 'debit' && balance < e.amount) { e.skip = true; continue; }
  balance = round2(balance + (e.kind === 'debit' ? -e.amount : e.amount));
  walletTx.push({
    _id: new mongoose.Types.ObjectId(),
    walletId: wallet._id,
    userId: user._id,
    type: e.kind === 'debit' ? 'DEBIT' : 'CREDIT',
    reason: e.kind === 'credit' ? 'BOOKING_PAYOUT' : e.kind === 'debit' ? 'PAYOUT_WITHDRAWAL' : 'PAYOUT_REVERSAL',
    amount: e.amount,
    balanceAfter: balance,
    referenceId: e.booking?._id ?? e.payout ?? null,
    description: e.kind === 'credit' ? 'Booking payout' : e.kind === 'debit' ? 'Withdrawal to bank' : 'Withdrawal rejected - amount returned',
    seedTag: TAG,
    createdAt: e.at,
  });
  if (e.booking) e.booking.payoutCreditedAt = e.at;
}
console.log(`wallet: ${walletTx.length} txns, final balance ₹${balance}`);

// ---------- 7. chats ----------
const chatCustomers = [...new Map(bookings.filter((b) => ['ACCEPTED', 'PENDING', 'ON_THE_WAY'].includes(b.status)).map((b) => [String(b.userId), b])).values()].slice(0, 9);
const rooms = [];
const messages = [];
const convo = [
  ['c', 'Hi! I wanted to confirm my pet\'s grooming slot.'],
  ['p', 'Hello! Yes, your slot is confirmed. Anything special I should know?'],
  ['c', 'She gets anxious with dryers, please go slow.'],
  ['p', 'Absolutely, we will use the low-noise dryer and take breaks.'],
  ['c', 'Perfect, thank you!'],
  ['p', 'See you soon 🐾'],
];
chatCustomers.forEach((b, idx) => {
  const roomId = new mongoose.Types.ObjectId();
  const urgent = idx === 1 || idx === 5;
  const unread = idx % 3 === 0 || urgent;
  const start = new Date(now.getTime() - (idx + 1) * 3 * 3_600_000 - 30 * 60_000 * convo.length);
  const script = urgent
    ? [['c', 'URGENT: my dog just ate something from the floor after grooming prep, what should I do?'], ['c', 'Can we move the appointment earlier?']]
    : convo;
  script.forEach(([who, text], i) => {
    const isLast = i === script.length - 1;
    messages.push({
      _id: new mongoose.Types.ObjectId(),
      roomId,
      senderId: who === 'c' ? b.userId : user._id,
      text,
      imageUrl: idx === 2 && i === 0 ? 'https://picsum.photos/seed/chat-img/600/600' : null,
      isRead: who === 'c' ? !(unread && i >= script.length - 2) : true,
      seedTag: TAG,
      createdAt: new Date(start.getTime() + i * 25 * 60_000),
    });
    if (isLast) rooms.push({ roomId, b, text, at: new Date(start.getTime() + i * 25 * 60_000), urgent });
  });
});
const chatRooms = rooms.map((r) => ({
  _id: r.roomId,
  participantIds: [r.b.userId, user._id],
  bookingId: r.b._id,
  lastMessageAt: r.at,
  lastMessagePreview: r.text,
  isUrgent: r.urgent,
  clearedAt: [],
  blockedBy: [],
  seedTag: TAG,
  createdAt: new Date(r.at.getTime() - 6 * 3_600_000),
}));
console.log(`chat rooms ${chatRooms.length}, messages ${messages.length}`);

// ---------- 8. notifications ----------
const notifTemplates = [
  ['BOOKING_CREATED', 'New booking request', 'You have a new grooming request for tomorrow.', false],
  ['BOOKING_CREATED', 'New booking request', 'Priya booked Full Grooming for Bruno.', false],
  ['PAYMENT_RECEIVED', 'Payment received', '₹999 received for Full Grooming.', false],
  ['NEW_MESSAGE', 'New message', 'Rahul: Can we reschedule to 4 PM?', false],
  ['BOOKING_CANCELLED', 'Booking cancelled', 'A customer cancelled tomorrow\'s 12:00 slot.', false],
  ['BOOKING_COMPLETED', 'Session completed', 'Grooming for Luna was completed. ₹549 added to wallet.', true],
  ['PAYMENT_RECEIVED', 'Payout processed', 'Your withdrawal has been paid to your bank account.', true],
  ['GENERIC', 'Review received', 'You got a new 5★ review.', true],
  ['KYC_APPROVED', 'KYC approved', 'Your documents were verified. You are all set!', true],
  ['BOOKING_ACCEPTED', 'Booking accepted', 'You accepted Max\'s appointment.', true],
];
const notifications = Array.from({ length: 24 }, (_, i) => {
  const [type, title, body, isRead] = notifTemplates[i % notifTemplates.length];
  return {
    _id: new mongoose.Types.ObjectId(),
    userId: user._id,
    type,
    title,
    body,
    data: {},
    isRead: i < 9 ? false : isRead,
    seedTag: TAG,
    createdAt: new Date(now.getTime() - i * 5 * 3_600_000),
  };
});

// ---------- 9. pet records (vaccinations + medical) so /patients/:id/records is rich ----------
const petRecordUpdates = [];
const vaxNames = ['Annual Vaccine Booster', 'Rabies', 'DHPP', 'Bordetella'];
const petsBooked = [...new Set(bookings.map((b) => String(b.petId)))];
for (const pid of petsBooked) {
  const pet = petsPool.find((p) => String(p._id) === pid);
  if (!pet || pet.seedTag === TAG) continue;
  if ((pet.vaccinations?.length ?? 0) > 0 && (pet.medicalRecords?.length ?? 0) > 0) continue;
  const dueIn = 5 + Math.floor(rnd() * 55); // vaccine booster due within the 2-month window
  petRecordUpdates.push({
    _id: pet._id,
    avatar: pet.avatarUrl ? null : `https://picsum.photos/seed/pet-${pid.slice(-4)}/300/300`,
    vaccinations: (pet.vaccinations?.length ?? 0) > 0 ? [] : [
      { _id: new mongoose.Types.ObjectId(), name: pick(vaxNames), administeredAt: new Date(now.getTime() - (365 - dueIn) * DAY), expiresAt: new Date(now.getTime() + dueIn * DAY), certificateUrl: `https://picsum.photos/seed/cert-${pid.slice(-4)}/600/800`, providerId: null },
      { _id: new mongoose.Types.ObjectId(), name: 'Rabies', administeredAt: new Date(now.getTime() - 200 * DAY), expiresAt: new Date(now.getTime() + 165 * DAY), certificateUrl: null, providerId: null },
    ],
    medicalRecords: (pet.medicalRecords?.length ?? 0) > 0 ? [] : [
      { _id: new mongoose.Types.ObjectId(), title: 'Skin allergy check', description: 'Mild seasonal allergy, hypoallergenic shampoo advised.', fileUrl: null, providerId: null, recordedAt: new Date(now.getTime() - 90 * DAY) },
      { _id: new mongoose.Types.ObjectId(), title: 'Annual health checkup', description: 'All vitals normal.', fileUrl: null, providerId: null, recordedAt: new Date(now.getTime() - 30 * DAY) },
    ],
  });
}
console.log(`pet record updates: ${petRecordUpdates.length}`);

// ---------- 10. provider / user profile fill ----------
const providerSet = {
  rating: avg,
  ratingCount: allRatings.length,
  bankAccount: bank,
  galleryUrls: [1, 2, 3, 4].map((i) => `https://picsum.photos/seed/salon-${i}/800/600`),
  ...(T === 'GROOMER' ? { 'metadata.groomer': { specializations: ['Breed Cuts', 'De-shedding', 'Bath & Spa', 'Nail Trimming'] } } : {}),
  ...((provider.skills ?? []).length ? {} : { skills: T === 'PET_WALKER' ? ['Dog Walking', 'Puppy Care', 'Leash Training', 'Pet First Aid'] : T === 'TRAINER' ? ['Obedience', 'Behaviour Correction', 'Puppy Training', 'Agility'] : T === 'VET' || T === 'CLINIC' ? ['General Medicine', 'Vaccination', 'Dental Care', 'Dermatology'] : T === 'BOARDING' ? ['Overnight Care', 'Daily Walks', 'Medication Handling'] : ['Pet Sitting', 'Feeding', 'Basic First Aid'] }),
  certifications: [
    { _id: new mongoose.Types.ObjectId(), title: 'Certified Professional Groomer', issuedBy: 'Indian Pet Grooming Academy', issuedYear: 2019 },
    { _id: new mongoose.Types.ObjectId(), title: 'Pet First Aid & CPR', issuedBy: 'Red Cross India', issuedYear: 2022 },
  ],
  successRatePercent: 98,
  updatedAt: new Date(),
};
const haveDocNames = new Set((provider.kycDocuments ?? []).map((d) => d.name));
const extraDocs = [
  ['AADHAAR_CARD', 'GOVERNMENT_ID'],
  ['PAN_CARD', 'GOVERNMENT_ID'],
  ['DRIVING_LICENSE', 'GOVERNMENT_ID'],
  ['POLICE_VERIFICATION', 'OTHER'],
]
  .filter(([n]) => !haveDocNames.has(n))
  .map(([name, type]) => ({ _id: new mongoose.Types.ObjectId(), type, name, status: 'VERIFIED', url: `https://picsum.photos/seed/${name}/800/600`, uploadedAt: new Date(now.getTime() - 40 * DAY) }));

// ---------- write ----------
console.log('--- summary ---');
console.log({ bookings: bookings.length, payments: payments.length, reviews: reviews.length, walletTx: walletTx.length, payoutRequests: payoutRequests.length, chatRooms: chatRooms.length, messages: messages.length, notifications: notifications.length, services: newServices.length, newPets: newPets.length, petRecordUpdates: petRecordUpdates.length, extraDocs: extraDocs.length });
if (DRY) {
  console.log('DRY RUN - nothing written');
  await mongoose.disconnect();
  process.exit(0);
}

const ins = async (name, docs) => {
  if (!docs.length) return;
  for (let i = 0; i < docs.length; i += 500) await col(name).insertMany(docs.slice(i, i + 500));
  console.log(`  inserted ${docs.length} ${name}`);
};
await ins('services', newServices);
await ins('pets', newPets);
await ins('payments', payments);
await ins('bookings', bookings);
await ins('reviews', reviews);
await ins('chatrooms', chatRooms);
await ins('messages', messages);
await ins('notifications', notifications);
await ins('payoutrequests', payoutRequests);
await ins('wallettransactions', walletTx);
await col('wallets').updateOne(
  { userId: user._id },
  { $set: { balance, updatedAt: new Date() }, $setOnInsert: { _id: wallet._id, currency: 'INR', createdAt: now } },
  { upsert: true },
);
for (const u of petRecordUpdates) {
  const $set = { updatedAt: new Date() };
  if (u.avatar) $set.avatarUrl = u.avatar;
  const update = { $set };
  const $push = {};
  if (u.vaccinations.length) $push.vaccinations = { $each: u.vaccinations };
  if (u.medicalRecords.length) $push.medicalRecords = { $each: u.medicalRecords };
  if (Object.keys($push).length) update.$push = $push;
  await col('pets').updateOne({ _id: u._id }, update);
}
await col('providers').updateOne({ _id: providerId }, { $set: providerSet, ...(extraDocs.length ? { $push: { kycDocuments: { $each: extraDocs } } } : {}) });
if (!user.avatarUrl) await col('users').updateOne({ _id: user._id }, { $set: { avatarUrl: provider.profileImageUrl } });
console.log('DONE');
await mongoose.disconnect();

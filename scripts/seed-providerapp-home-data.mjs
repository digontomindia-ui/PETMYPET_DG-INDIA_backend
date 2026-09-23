// Provider-app GET /home + GET /trainer/dashboard render empty sections (todays_grooming_session,
// todays_overview, today_check_ins/outs, pet_updates_due, upcoming_sessions, chart points,
// recent_reviews) for any account without bookings around today. This seeds, per
// GROOMER/VET/CLINIC/BOARDING/TRAINER/PET_WALKER/PET_SITTER provider:
//   - a service if it has none
//   - today's bookings (boarding: check-in today, check-out today, a mid-stay pet, a pending
//     request; others: one STARTED now + two ACCEPTED later today)
//   - 5 upcoming ACCEPTED/PENDING bookings over the next 5 days
//   - 5 COMPLETED + PAID bookings over the past 6 days (earnings charts)
//   - 3 reviews on those completed bookings if the provider has no reviews yet
// Idempotent: a provider that already has an active booking scheduled today is skipped.
//
// Usage: MONGO_URI="<uri>" node scripts/seed-providerapp-home-data.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const ACTIVE = ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'STARTED'];

const CATEGORY_SLUG_FOR_TYPE = {
  GROOMER: 'grooming',
  VET: 'veterinary',
  CLINIC: 'veterinary',
  BOARDING: 'boarding',
  TRAINER: 'dog-training',
  PET_WALKER: 'dog-walking',
  PET_SITTER: 'pet-sitting',
};
const SERVICE_TEMPLATE_FOR_TYPE = {
  GROOMER: { name: 'Basic Grooming', description: 'Bath, Blow Dry, Nail Trim', price: 499, durationMinutes: 90 },
  VET: { name: 'General Consultation', description: 'In-clinic or video vet consultation', price: 499, durationMinutes: 90 },
  CLINIC: { name: 'Clinic Consultation', description: 'In-clinic consultation', price: 499, durationMinutes: 90 },
  BOARDING: { name: 'Standard Boarding', description: 'Per-day boarding with daily walks', price: 899, durationMinutes: 1440 },
  TRAINER: { name: 'Basic Obedience Training', description: 'One-on-one obedience session', price: 899, durationMinutes: 90 },
  PET_WALKER: { name: '30 Min Walk', description: 'Standard 30-minute walk', price: 199, durationMinutes: 30 },
  PET_SITTER: { name: 'Pet Sitting Visit', description: 'In-home pet sitting visit', price: 449, durationMinutes: 90 },
};
const REVIEW_COMMENTS = [
  [5, 'Amazing service, my dog was so happy and calm!'],
  [4, 'Very professional and on time. Will book again.'],
  [5, 'Gentle with pets and explained everything clearly.'],
];

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

await mongoose.connect(uri);
const db = mongoose.connection.db;

// Customers who own a pet, so pet/owner fields in the responses are populated.
const pets = await db
  .collection('pets')
  .aggregate([{ $group: { _id: '$ownerId', petId: { $first: '$_id' } } }, { $limit: 4 }])
  .toArray();
if (pets.length === 0) throw new Error('No pets found to book with');

const providers = await db
  .collection('providers')
  .find({ providerType: { $in: Object.keys(SERVICE_TEMPLATE_FOR_TYPE) } })
  .toArray();

for (const provider of providers) {
  const label = `${provider.providerType} ${provider._id}`;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const alreadySeeded = await db.collection('bookings').findOne({
    providerId: provider._id,
    status: { $in: ACTIVE },
    scheduledStart: { $gte: startOfToday, $lt: new Date(startOfToday.getTime() + DAY_MS) },
  });
  if (alreadySeeded) {
    console.log(`${label}: already has bookings today, skipped`);
    continue;
  }

  let service = await db.collection('services').findOne({ providerId: provider._id });
  if (!service) {
    const template = SERVICE_TEMPLATE_FOR_TYPE[provider.providerType];
    const category = await db
      .collection('categories')
      .findOne({ slug: CATEGORY_SLUG_FOR_TYPE[provider.providerType] });
    if (!category) {
      console.log(`${label}: no category, skipped`);
      continue;
    }
    const { insertedId } = await db.collection('services').insertOne({
      providerId: provider._id,
      categoryId: category._id,
      name: template.name,
      description: template.description,
      price: template.price,
      originalPrice: null,
      durationMinutes: template.durationMinutes,
      images: [],
      includedItems: [],
      addOnCatalog: [],
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    service = { _id: insertedId, ...template };
  }

  let n = 0;
  const build = (status, scheduledStart, scheduledEnd, { paid = false, createdAt = new Date() } = {}) => {
    const { _id: userId, petId } = pets[n++ % pets.length];
    const commissionPercent = provider.commissionPercent ?? 15;
    const price = service.price ?? 499;
    const commissionAmount = Math.round(price * commissionPercent) / 100;
    return {
      userId,
      petId,
      providerId: provider._id,
      serviceId: service._id,
      zoneId: provider.zoneIds?.[0] ?? null,
      scheduledStart,
      scheduledEnd:
        scheduledEnd ?? new Date(scheduledStart.getTime() + (service.durationMinutes ?? 90) * 60_000),
      status,
      otpStart: genOtp(),
      otpStartVerifiedAt: ['STARTED', 'COMPLETED'].includes(status) ? scheduledStart : null,
      otpEnd: genOtp(),
      otpEndVerifiedAt: status === 'COMPLETED' ? scheduledStart : null,
      price,
      currency: 'INR',
      couponCode: null,
      discountAmount: 0,
      commissionPercent,
      commissionAmount,
      providerPayoutAmount: Math.round((price - commissionAmount) * 100) / 100,
      paymentStatus: paid ? 'PAID' : 'PENDING',
      paymentId: paid ? `seed_pay_${Math.random().toString(36).slice(2, 10)}` : null,
      cancelledBy: null,
      cancellationReason: null,
      notes: '',
      addOns: [],
      durationDays: null,
      dropOffTime: null,
      pickupTime: null,
      consultationMode: null,
      providerNotes: '',
      photos: [],
      progressUpdates: [],
      walkStats: null,
      isDeleted: false,
      createdAt,
      updatedAt: createdAt,
    };
  };

  const now = Date.now();
  const at = (ms) => new Date(now + ms);
  const docs =
    provider.providerType === 'BOARDING'
      ? [
          build('ACCEPTED', at(HOUR_MS), at(3 * DAY_MS)), // check-in today
          build('STARTED', at(-3 * DAY_MS), at(2 * HOUR_MS)), // check-out today
          build('STARTED', at(-DAY_MS), at(2 * DAY_MS)), // mid-stay, pet update due
          build('PENDING', at(2 * DAY_MS), at(5 * DAY_MS)), // pending request
        ]
      : [
          build('STARTED', at(-20 * 60_000)),
          build('ACCEPTED', at(2 * HOUR_MS)),
          build('ACCEPTED', at(3 * HOUR_MS)),
        ];
  for (let d = 1; d <= 5; d++) {
    const start = at(d * DAY_MS);
    docs.push(
      provider.providerType === 'BOARDING'
        ? build(d % 2 ? 'ACCEPTED' : 'PENDING', start, new Date(start.getTime() + 2 * DAY_MS))
        : build(d % 2 ? 'ACCEPTED' : 'PENDING', start),
    );
  }
  const completed = [];
  for (let d = 1; d <= 5; d++) {
    const start = at(-d * DAY_MS - HOUR_MS);
    completed.push(build('COMPLETED', start, null, { paid: true, createdAt: start }));
  }
  await db.collection('bookings').insertMany([...docs, ...completed]);

  let reviewCount = 0;
  if (!(await db.collection('reviews').countDocuments({ providerId: provider._id }))) {
    const reviews = REVIEW_COMMENTS.map(([rating, comment], i) => ({
      bookingId: completed[i]._id,
      productId: null,
      petId: null,
      userId: completed[i].userId,
      providerId: provider._id,
      rating,
      comment,
      createdAt: completed[i].scheduledEnd,
    }));
    await db.collection('reviews').insertMany(reviews);
    reviewCount = reviews.length;
    if (!provider.ratingCount) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await db
        .collection('providers')
        .updateOne(
          { _id: provider._id },
          { $set: { rating: Math.round(avg * 10) / 10, ratingCount: reviews.length } },
        );
    }
  }
  console.log(
    `${label}: inserted ${docs.length + completed.length} bookings, ${reviewCount} reviews`,
  );
}

await mongoose.disconnect();

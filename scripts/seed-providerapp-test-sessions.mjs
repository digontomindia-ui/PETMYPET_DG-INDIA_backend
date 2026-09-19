// Every provider-app test account (the 6 phones approved for KYC) has zero services and zero
// bookings — that's why /session/resend-otp, /start-Session/verify-otp, /end-Session all 404
// with "no active/ready session" (correct behavior, not a routing bug) and there's nothing to
// exercise those endpoints against. This creates one service + one ACCEPTED booking per account
// so the full session lifecycle (start-otp -> notes/photos -> end-otp -> summary) becomes
// testable. Safe to re-run: skips any account that already has a service.
//
// Usage: MONGO_URI="<uri>" node scripts/seed-providerapp-test-sessions.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

const PHONES = ['9609226659', '8537094497', '9609226651', '9609226652', '9609226653', '9609226654'];

const CATEGORY_SLUG_FOR_TYPE = {
  GROOMER: 'grooming',
  VET: 'veterinary',
  CLINIC: 'veterinary',
  BOARDING: 'boarding',
  PET_WALKER: 'dog-walking',
  TRAINER: 'dog-training',
  PET_SITTER: 'pet-sitting',
};

const SERVICE_TEMPLATE_FOR_TYPE = {
  GROOMER: { name: 'Basic Grooming', description: 'Bath, Blow Dry, Nail Trim', price: 499, durationMinutes: 90 },
  VET: { name: 'General Consultation', description: 'In-clinic or video vet consultation', price: 499, durationMinutes: 90 },
  CLINIC: { name: 'Clinic Consultation', description: 'In-clinic consultation', price: 499, durationMinutes: 90 },
  BOARDING: { name: 'Standard Boarding', description: 'Per-day boarding with daily walks', price: 899, durationMinutes: 1440 },
  PET_WALKER: { name: '30 Min Walk', description: 'Standard 30-minute walk', price: 199, durationMinutes: 90 },
  TRAINER: { name: 'Basic Obedience Training', description: 'One-on-one obedience session', price: 899, durationMinutes: 90 },
  PET_SITTER: { name: 'Pet Sitting Visit', description: 'In-home pet sitting visit', price: 449, durationMinutes: 90 },
};

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

await mongoose.connect(uri);
const db = mongoose.connection.db;

const customer = await db.collection('users').findOne({ role: 'USER' });
if (!customer) throw new Error('No USER-role account found to book with');
const pet = await db.collection('pets').findOne({ ownerId: customer._id });

for (const phone of PHONES) {
  const user = await db.collection('users').findOne({ phone: { $regex: `${phone}$` } });
  if (!user) { console.log(`${phone}: no user`); continue; }
  const provider = await db.collection('providers').findOne({ userId: user._id });
  if (!provider) { console.log(`${phone}: no provider`); continue; }

  let service = await db.collection('services').findOne({ providerId: provider._id });
  if (!service) {
    const categorySlug = CATEGORY_SLUG_FOR_TYPE[provider.providerType];
    const category = categorySlug ? await db.collection('categories').findOne({ slug: categorySlug }) : null;
    const template = SERVICE_TEMPLATE_FOR_TYPE[provider.providerType];
    if (!category || !template) {
      console.log(`${phone}: no category/template for providerType ${provider.providerType}, skipping`);
      continue;
    }
    const insertResult = await db.collection('services').insertOne({
      providerId: provider._id,
      categoryId: category._id,
      name: template.name,
      description: template.description,
      price: template.price,
      originalPrice: null,
      durationMinutes: template.durationMinutes,
      images: [],
      includedItems: template.description
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          imageUrl: `https://picsum.photos/seed/included-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/100/100`,
        })),
      addOnCatalog: [],
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    service = { _id: insertResult.insertedId, ...template };
    console.log(`${phone}: created service ${service._id} (${template.name})`);
  }

  const activeBooking = await db.collection('bookings').findOne({
    providerId: provider._id,
    status: { $in: ['PENDING', 'ACCEPTED', 'ON_THE_WAY', 'STARTED'] },
  });
  if (activeBooking) {
    console.log(`${phone}: already has an active booking ${activeBooking._id}, skipping`);
    continue;
  }

  const scheduledStart = new Date();
  const scheduledEnd = new Date(scheduledStart.getTime() + (service.durationMinutes ?? 90) * 60_000);
  const commissionPercent = provider.commissionPercent ?? 15;
  const price = service.price ?? 499;
  const commissionAmount = Math.round(price * (commissionPercent / 100) * 100) / 100;
  const providerPayoutAmount = Math.round((price - commissionAmount) * 100) / 100;
  const otpStart = genOtp();
  const otpEnd = genOtp();

  const bookingResult = await db.collection('bookings').insertOne({
    userId: customer._id,
    petId: pet?._id ?? null,
    providerId: provider._id,
    serviceId: service._id,
    zoneId: provider.zoneIds?.[0] ?? null,
    scheduledStart,
    scheduledEnd,
    status: 'ACCEPTED',
    otpStart,
    otpStartVerifiedAt: null,
    otpEnd,
    otpEndVerifiedAt: null,
    price,
    currency: 'INR',
    couponCode: null,
    discountAmount: 0,
    commissionPercent,
    commissionAmount,
    providerPayoutAmount,
    paymentStatus: 'PENDING',
    paymentId: null,
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
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(
    `${phone}: created ACCEPTED booking ${bookingResult.insertedId} — otpStart=${otpStart} otpEnd=${otpEnd}`,
  );
}

await mongoose.disconnect();

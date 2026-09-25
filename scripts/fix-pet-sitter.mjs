// One-off fix for the "Pet Sitter Partner" provider-app test account (+919609226655):
// stuck mid-onboarding (placeholder address/location, no zone, no service, blank user
// name), so /home, /my-appointments, /appointments, /analytics, and /message (inbox)
// all came back empty. This sets a real address/zone, creates a service, sets the
// user's name, adds bookings (past/active/upcoming) and a chat room with messages.
// Usage: MONGO_URI="<uri>" node scripts/fix-pet-sitter.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

await mongoose.connect(uri);
const db = mongoose.connection.db;

const provider = await db.collection('providers').findOne({ businessName: 'Pet Sitter Partner' });
if (!provider) throw new Error('Pet Sitter Partner provider not found');

const zone = await db.collection('zones').findOne({ name: 'Koramangala' });
if (!zone) throw new Error('Koramangala zone not found');

await db.collection('providers').updateOne(
  { _id: provider._id },
  {
    $set: {
      address: '5th Block, Koramangala, Bengaluru, Karnataka 560095',
      location: { type: 'Point', coordinates: zone.center.coordinates },
      zoneIds: [zone._id],
      updatedAt: new Date(),
    },
  },
);
console.log('Provider address/location/zoneIds updated.');

await db.collection('users').updateOne(
  { _id: provider.userId },
  { $set: { name: 'Ramesh Kumar', updatedAt: new Date() } },
);
console.log('User name set.');

const category = await db.collection('categories').findOne({});
let service = await db.collection('services').findOne({ providerId: provider._id });
if (!service) {
  const serviceDoc = {
    providerId: provider._id,
    categoryId: category?._id ?? null,
    name: 'Pet Sitting Visit',
    description: 'In-home pet sitting visit',
    price: 399,
    originalPrice: null,
    durationMinutes: 90,
    images: ['https://picsum.photos/seed/service-pet-sitting-visit/600/600'],
    isActive: true,
    isDeleted: false,
    deletedAt: null,
    addOnCatalog: [],
    includedItems: [
      {
        name: 'In-home pet sitting visit',
        imageUrl: 'https://picsum.photos/seed/included-in-home-pet-sitting-visit/100/100',
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection('services').insertOne(serviceDoc);
  service = { ...serviceDoc, _id: result.insertedId };
  console.log('Service created:', service._id.toString());
} else {
  console.log('Service already exists:', service._id.toString());
}

const customer = await db.collection('users').findOne({ role: 'USER' });
if (!customer) throw new Error('no USER-role account found to book with');
const pet = await db.collection('pets').findOne({ ownerId: customer._id });

function buildBooking({ status, scheduledStart, paymentStatus }) {
  const scheduledEnd = new Date(scheduledStart.getTime() + (service.durationMinutes ?? 90) * 60_000);
  const commissionPercent = provider.commissionPercent ?? 15;
  const price = service.price ?? 399;
  const commissionAmount = Math.round(price * (commissionPercent / 100) * 100) / 100;
  const providerPayoutAmount = Math.round((price - commissionAmount) * 100) / 100;
  return {
    userId: customer._id,
    petId: pet?._id ?? null,
    providerId: provider._id,
    serviceId: service._id,
    zoneId: zone._id,
    scheduledStart,
    scheduledEnd,
    status,
    otpStart: genOtp(),
    otpStartVerifiedAt: status === 'COMPLETED' ? scheduledStart : null,
    otpEnd: genOtp(),
    otpEndVerifiedAt: status === 'COMPLETED' ? scheduledEnd : null,
    price,
    currency: 'INR',
    couponCode: null,
    discountAmount: 0,
    commissionPercent,
    commissionAmount,
    providerPayoutAmount,
    paymentStatus,
    paymentId: paymentStatus === 'PAID' ? `seed_pay_${Math.random().toString(36).slice(2, 10)}` : null,
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
    createdAt: scheduledStart,
    updatedAt: scheduledStart,
  };
}

const now = new Date();
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

const bookingDocs = [
  buildBooking({ status: 'COMPLETED', scheduledStart: twoDaysAgo, paymentStatus: 'PAID' }),
  buildBooking({ status: 'STARTED', scheduledStart: new Date(now.getTime() - 20 * 60 * 1000), paymentStatus: 'PENDING' }),
  buildBooking({ status: 'ACCEPTED', scheduledStart: inTwoHours, paymentStatus: 'PENDING' }),
  buildBooking({ status: 'ACCEPTED', scheduledStart: inTwoDays, paymentStatus: 'PENDING' }),
];

const bookingResult = await db.collection('bookings').insertMany(bookingDocs);
console.log(`Inserted ${bookingResult.insertedCount} bookings.`);
const bookingIds = Object.values(bookingResult.insertedIds);

let room = await db.collection('chatrooms').findOne({
  participantIds: { $all: [provider.userId, customer._id] },
});
if (!room) {
  const roomDoc = {
    participantIds: [provider.userId, customer._id],
    bookingId: bookingIds[bookingIds.length - 1],
    lastMessageAt: now,
    lastMessagePreview: 'See you at the visit!',
    isUrgent: false,
    createdAt: now,
  };
  const roomResult = await db.collection('chatrooms').insertOne(roomDoc);
  room = { ...roomDoc, _id: roomResult.insertedId };
  console.log('Chat room created:', room._id.toString());
} else {
  console.log('Chat room already exists:', room._id.toString());
}

const messageDocs = [
  {
    roomId: room._id,
    senderId: customer._id,
    text: "Hi! Looking forward to Bruno's visit today.",
    imageUrl: null,
    isRead: true,
    createdAt: new Date(now.getTime() - 30 * 60 * 1000),
  },
  {
    roomId: room._id,
    senderId: provider.userId,
    text: 'See you at the visit!',
    imageUrl: null,
    isRead: false,
    createdAt: now,
  },
];
const messageResult = await db.collection('messages').insertMany(messageDocs);
console.log(`Inserted ${messageResult.insertedCount} messages.`);

await mongoose.disconnect();

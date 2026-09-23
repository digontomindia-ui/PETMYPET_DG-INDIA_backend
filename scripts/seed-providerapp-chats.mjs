// GET /api/v1/message (provider-app inbox) returns [] when a provider has no chat rooms.
// This seeds, per provider account (every type) with zero rooms, one room per customer (up to 4 USER-role accounts) with a short
// conversation; the last customer message is left unread so unread_msg is non-zero.
// Idempotent: accounts that already have any chat room are skipped.
//
// Usage: MONGO_URI="<uri>" node scripts/seed-providerapp-chats.mjs

import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

const MIN_MS = 60_000;

const SCRIPTS = {
  GROOMER: [
    ['c', 'Hi, is the 11 AM grooming slot still available tomorrow?'],
    ['p', 'Yes it is! Shall I book full grooming with nail trimming?'],
    ['c', 'Great, please do. He gets a bit anxious with the dryer.'],
    ['p', 'No worries, we will use low heat and go slow.'],
    ['c', 'Thank you! See you tomorrow.'],
  ],
  DEFAULT: [
    ['c', 'Hi, are you available this weekend?'],
    ['p', 'Yes, Saturday morning works. What time suits you?'],
    ['c', '10 AM would be perfect.'],
    ['p', 'Done, booked you in for 10 AM Saturday.'],
    ['c', 'Thanks a lot!'],
  ],
  VET: [
    ['c', 'Hello doctor, my dog has been scratching his ears a lot.'],
    ['p', 'Any redness or discharge? Please send a photo if possible.'],
    ['c', 'Some redness, no discharge. Can I bring him in today?'],
    ['p', 'Sure, 5 PM works. Please carry his vaccination card.'],
    ['c', 'Okay, will be there by 5. Thanks!'],
  ],
};

await mongoose.connect(uri);
const db = mongoose.connection.db;

const customers = await db.collection('users').find({ role: 'USER' }).limit(4).toArray();
if (customers.length === 0) throw new Error('No USER-role account found to chat with');

const providers = await db.collection('providers').find({ isDeleted: { $ne: true } }).toArray();

for (const provider of providers) {
  const label = `${provider.providerType} ${provider._id}`;
  if (await db.collection('chatrooms').countDocuments({ participantIds: provider.userId })) {
    console.log(`${label}: already has rooms, skipped`);
    continue;
  }

  let msgCount = 0;
  for (const [i, customer] of customers.entries()) {
    const booking = await db
      .collection('bookings')
      .findOne({ providerId: provider._id, userId: customer._id }, { sort: { createdAt: -1 } });
    const lines = SCRIPTS[provider.providerType === 'CLINIC' ? 'VET' : provider.providerType] ?? SCRIPTS.DEFAULT;
    // Stagger rooms so inbox ordering (lastMessageAt desc) is stable: room 0 newest.
    const end = Date.now() - i * 90 * MIN_MS;
    const start = end - (lines.length - 1) * 5 * MIN_MS;

    const roomId = new mongoose.Types.ObjectId();
    const messages = lines.map(([who, text], j) => ({
      roomId,
      senderId: who === 'c' ? customer._id : provider.userId,
      text,
      imageUrl: null,
      isRead: j < lines.length - 1,
      createdAt: new Date(start + j * 5 * MIN_MS),
    }));
    const last = messages.at(-1);

    await db.collection('chatrooms').insertOne({
      _id: roomId,
      participantIds: [customer._id, provider.userId],
      bookingId: booking?._id ?? null,
      lastMessageAt: last.createdAt,
      lastMessagePreview: last.text.slice(0, 200),
      isUrgent: false,
      createdAt: new Date(start),
    });
    await db.collection('messages').insertMany(messages);
    msgCount += messages.length;
  }
  console.log(`${label}: inserted ${customers.length} rooms, ${msgCount} messages`);
}

await mongoose.disconnect();

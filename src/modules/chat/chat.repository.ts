import { Types } from 'mongoose';
import { ChatRoomModel, MessageModel } from './chat.schema.js';

export const chatRepository = {
  async findOrCreateRoom(userIdA: string, userIdB: string, bookingId?: string) {
    const participantIds = [new Types.ObjectId(userIdA), new Types.ObjectId(userIdB)];
    const existing = await ChatRoomModel.findOne({
      participantIds: { $all: participantIds, $size: 2 },
    }).exec();
    if (existing) return existing;

    return ChatRoomModel.create({
      participantIds,
      bookingId: bookingId ? new Types.ObjectId(bookingId) : null,
    });
  },

  async findRoomById(roomId: string) {
    return ChatRoomModel.findById(roomId).exec();
  },

  async listRoomsForUser(userId: string, skip: number, limit: number, isUrgent?: boolean) {
    const filter: Record<string, unknown> = { participantIds: new Types.ObjectId(userId) };
    if (isUrgent !== undefined) filter.isUrgent = isUrgent;
    const [items, total] = await Promise.all([
      ChatRoomModel.find(filter).sort({ lastMessageAt: -1 }).skip(skip).limit(limit).exec(),
      ChatRoomModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  async setUrgent(roomId: string, isUrgent: boolean) {
    return ChatRoomModel.findByIdAndUpdate(roomId, { isUrgent }, { new: true }).exec();
  },

  async appendMessage(roomId: string, senderId: string, text: string, imageUrl: string | null) {
    const message = await MessageModel.create({ roomId, senderId, text, imageUrl });
    await ChatRoomModel.updateOne(
      { _id: roomId },
      { lastMessageAt: message.createdAt, lastMessagePreview: text ? text.slice(0, 200) : imageUrl ? 'Photo' : '' },
    ).exec();
    return message;
  },

  async clearRoomFor(roomId: string, userId: string) {
    const uid = new Types.ObjectId(userId);
    await ChatRoomModel.updateOne({ _id: roomId }, { $pull: { clearedAt: { userId: uid } } }).exec();
    await ChatRoomModel.updateOne({ _id: roomId }, { $push: { clearedAt: { userId: uid, at: new Date() } } }).exec();
  },

  async setBlocked(roomId: string, userId: string, blocked: boolean) {
    const uid = new Types.ObjectId(userId);
    return ChatRoomModel.findByIdAndUpdate(
      roomId,
      blocked ? { $addToSet: { blockedBy: uid } } : { $pull: { blockedBy: uid } },
      { new: true },
    ).exec();
  },

  async listMessages(roomId: string, limit: number, before?: string, since?: Date) {
    const filter: Record<string, unknown> = { roomId };
    if (since) filter.createdAt = { $gt: since };
    if (before) filter._id = { $lt: new Types.ObjectId(before) };
    return MessageModel.find(filter).sort({ _id: -1 }).limit(limit).exec();
  },

  /** Page-numbered variant (newest first) for clients that page by number rather than cursor. */
  async listMessagesPage(roomId: string, skip: number, limit: number, since?: Date) {
    const filter: Record<string, unknown> = since ? { roomId, createdAt: { $gt: since } } : { roomId };
    const [items, total] = await Promise.all([
      MessageModel.find(filter).sort({ _id: -1 }).skip(skip).limit(limit).exec(),
      MessageModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  },

  async markRoomRead(roomId: string, readerId: string): Promise<void> {
    await MessageModel.updateMany(
      { roomId, senderId: { $ne: readerId }, isRead: false },
      { isRead: true },
    ).exec();
  },

  async countUnreadInRoom(roomId: string, readerId: string, since?: Date): Promise<number> {
    return MessageModel.countDocuments({
      roomId,
      senderId: { $ne: readerId },
      isRead: false,
      ...(since && { createdAt: { $gt: since } }),
    }).exec();
  },
};

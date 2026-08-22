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
      { lastMessageAt: message.createdAt, lastMessagePreview: text.slice(0, 200) },
    ).exec();
    return message;
  },

  async listMessages(roomId: string, limit: number, before?: string) {
    const filter: Record<string, unknown> = { roomId };
    if (before) filter._id = { $lt: new Types.ObjectId(before) };
    return MessageModel.find(filter).sort({ _id: -1 }).limit(limit).exec();
  },

  async markRoomRead(roomId: string, readerId: string): Promise<void> {
    await MessageModel.updateMany(
      { roomId, senderId: { $ne: readerId }, isRead: false },
      { isRead: true },
    ).exec();
  },

  async countUnreadInRoom(roomId: string, readerId: string): Promise<number> {
    return MessageModel.countDocuments({
      roomId,
      senderId: { $ne: readerId },
      isRead: false,
    }).exec();
  },
};

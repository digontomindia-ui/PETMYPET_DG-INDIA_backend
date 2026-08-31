import { BaseRepository } from '../../common/repositories/base.repository.js';
import { AiChatMessageModel } from './ai-chat.schema.js';
import type { IAiChatMessage } from './ai-chat.types.js';

export class AiChatMessageRepository extends BaseRepository<IAiChatMessage> {
  constructor() {
    super(AiChatMessageModel);
  }

  /** Paginated history, newest first — for the client's chat screen. */
  async findForUser(userId: string, skip: number, limit: number) {
    const filter = { userId };
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  /** Oldest-first, capped to the most recent `limit` — for building the Gemini prompt. */
  async findRecentForContext(userId: string, limit: number) {
    const recent = await this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return recent.reverse();
  }
}

export const aiChatMessageRepository = new AiChatMessageRepository();

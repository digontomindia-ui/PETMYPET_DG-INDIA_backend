import { Types } from 'mongoose';
import { parsePagination } from '../../common/utils/pagination.js';
import { generateAiChatReply } from '../../common/integrations/gemini.js';
import { AI_CHAT_HISTORY_LIMIT, AI_CHAT_ROLES } from './ai-chat.constants.js';
import { aiChatMessageRepository } from './ai-chat.repository.js';
import { toAiChatMessageDto } from './ai-chat.mapper.js';
import type { ListAiChatMessagesQuery, SendAiChatMessageInput } from './ai-chat.dto.js';

export const aiChatService = {
  async sendMessage(userId: string, input: SendAiChatMessageInput) {
    const userMessage = await aiChatMessageRepository.create({
      userId: new Types.ObjectId(userId),
      role: AI_CHAT_ROLES.USER,
      text: input.text,
    });

    const history = await aiChatMessageRepository.findRecentForContext(
      userId,
      AI_CHAT_HISTORY_LIMIT,
    );
    const replyText = await generateAiChatReply(
      history.map((message) => ({ role: message.role, text: message.text })),
    );

    const assistantMessage = await aiChatMessageRepository.create({
      userId: new Types.ObjectId(userId),
      role: AI_CHAT_ROLES.ASSISTANT,
      text: replyText,
    });

    return {
      userMessage: toAiChatMessageDto(userMessage),
      assistantMessage: toAiChatMessageDto(assistantMessage),
    };
  },

  async listMine(userId: string, query: ListAiChatMessagesQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await aiChatMessageRepository.findForUser(userId, skip, limit);
    return { messages: items.map(toAiChatMessageDto), total, page, limit };
  },
};

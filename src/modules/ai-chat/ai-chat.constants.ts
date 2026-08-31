export const AI_CHAT_MESSAGE_MODEL_NAME = 'AiChatMessage';

export const AI_CHAT_ROLES = { USER: 'USER', ASSISTANT: 'ASSISTANT' } as const;

export type AiChatRole = (typeof AI_CHAT_ROLES)[keyof typeof AI_CHAT_ROLES];

/** How many of the most recent messages are sent to Gemini as conversation context. */
export const AI_CHAT_HISTORY_LIMIT = 20;

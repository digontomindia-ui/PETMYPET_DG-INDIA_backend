export const CHAT_ROOM_MODEL_NAME = 'ChatRoom';
export const MESSAGE_MODEL_NAME = 'Message';

/** Who sent a chat message, in the chat's own vocabulary (a pet owner is a USER, a service
 * provider is a VENDOR). Stored on each message so both the live socket payload and the REST
 * history report the sender's role without a per-message user lookup. */
export const CHAT_SENDER_ROLES = {
  USER: 'USER',
  VENDOR: 'VENDOR',
  ADMIN: 'ADMIN',
} as const;

export type ChatSenderRole = (typeof CHAT_SENDER_ROLES)[keyof typeof CHAT_SENDER_ROLES];

export const CHAT_SOCKET_EVENTS = {
  JOIN: 'chat:join',
  TYPING: 'chat:typing',
  MESSAGE: 'chat:message',
  READ: 'chat:read',
} as const;

/** Provider mobile app's snake_case socket contract, emitted alongside the chat:* events. */
export const PROVIDER_APP_SOCKET_EVENTS = {
  NEW_MESSAGE: 'new_message',
  MESSAGE_ACK: 'message_ack',
  MESSAGES_READ: 'messages_read',
  USER_TYPING: 'user_typing',
  USER_STATUS: 'user_status',
} as const;

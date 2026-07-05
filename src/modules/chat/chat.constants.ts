export const CHAT_ROOM_MODEL_NAME = 'ChatRoom';
export const MESSAGE_MODEL_NAME = 'Message';

export const CHAT_SOCKET_EVENTS = {
  JOIN: 'chat:join',
  TYPING: 'chat:typing',
  MESSAGE: 'chat:message',
  READ: 'chat:read',
} as const;

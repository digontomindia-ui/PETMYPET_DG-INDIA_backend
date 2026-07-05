import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { chatController } from './chat.controller.js';
import {
  createRoomSchema,
  listMessagesQuerySchema,
  listRoomsQuerySchema,
  roomIdParamSchema,
  sendMessageSchema,
} from './chat.validators.js';

export const chatRoutes = Router();

chatRoutes.use(authenticate);

chatRoutes.post('/rooms', validate({ body: createRoomSchema }), chatController.createRoom);
chatRoutes.get('/rooms', validate({ query: listRoomsQuerySchema }), chatController.listRooms);

chatRoutes.get(
  '/rooms/:roomId/messages',
  validate({ params: roomIdParamSchema, query: listMessagesQuerySchema }),
  chatController.listMessages,
);
chatRoutes.post(
  '/rooms/:roomId/messages',
  validate({ params: roomIdParamSchema, body: sendMessageSchema }),
  chatController.sendMessage,
);
chatRoutes.patch(
  '/rooms/:roomId/read',
  validate({ params: roomIdParamSchema }),
  chatController.markRead,
);

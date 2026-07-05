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

/**
 * @openapi
 * /chat/rooms:
 *   post:
 *     tags: [Chat]
 *     summary: Create or fetch a chat room with a participant
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Room created }
 */
chatRoutes.post('/rooms', validate({ body: createRoomSchema }), chatController.createRoom);
/**
 * @openapi
 * /chat/rooms:
 *   get:
 *     tags: [Chat]
 *     summary: List chat rooms for the current user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of chat rooms }
 */
chatRoutes.get('/rooms', validate({ query: listRoomsQuerySchema }), chatController.listRooms);

/**
 * @openapi
 * /chat/rooms/{roomId}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: List messages in a chat room
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: string }
 *       - in: query
 *         name: before
 *         schema: { type: string }
 *     responses:
 *       200: { description: List of messages }
 */
chatRoutes.get(
  '/rooms/:roomId/messages',
  validate({ params: roomIdParamSchema, query: listMessagesQuerySchema }),
  chatController.listMessages,
);
/**
 * @openapi
 * /chat/rooms/{roomId}/messages:
 *   post:
 *     tags: [Chat]
 *     summary: Send a message in a chat room
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Message sent }
 */
chatRoutes.post(
  '/rooms/:roomId/messages',
  validate({ params: roomIdParamSchema, body: sendMessageSchema }),
  chatController.sendMessage,
);
/**
 * @openapi
 * /chat/rooms/{roomId}/read:
 *   patch:
 *     tags: [Chat]
 *     summary: Mark messages in a chat room as read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Room marked as read }
 */
chatRoutes.patch(
  '/rooms/:roomId/read',
  validate({ params: roomIdParamSchema }),
  chatController.markRead,
);

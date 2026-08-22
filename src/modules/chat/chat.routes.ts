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
  updateUrgentSchema,
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participantId]
 *             properties:
 *               participantId: { type: string, description: "24-hex-char ObjectId of the other participant" }
 *               bookingId: { type: string, description: "Optional related booking ObjectId" }
 *           example:
 *             participantId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *             bookingId: "64f1a2b3c4d5e6f7a8b9c0a1"
 *     responses:
 *       201:
 *         description: Room created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0b1"
 *                 otherParticipantId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 bookingId: "64f1a2b3c4d5e6f7a8b9c0a1"
 *                 lastMessageAt: null
 *                 lastMessagePreview: ""
 *                 isUrgent: false
 *                 unreadCount: 0
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Cannot create a chat room with yourself
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "1"
 *       - in: query
 *         name: limit
 *         schema: { type: string }
 *         example: "20"
 *       - in: query
 *         name: isUrgent
 *         schema: { type: string, enum: ["true", "false"] }
 *         description: Filter to only urgent (or only non-urgent) rooms — backs the "Emergency" filter pill
 *         example: "true"
 *     responses:
 *       200:
 *         description: List of chat rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0b1"
 *                   otherParticipantId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   bookingId: "64f1a2b3c4d5e6f7a8b9c0a1"
 *                   lastMessageAt: "2024-06-21T10:15:00.000Z"
 *                   lastMessagePreview: "Sure, see you at 5pm!"
 *                   isUrgent: false
 *                   unreadCount: 2
 *               meta:
 *                 page: 1
 *                 limit: 20
 *                 total: 1
 *                 totalPages: 1
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: "limit: Invalid input"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f1a2b3c4d5e6f7a8b9c0b1"
 *       - in: query
 *         name: limit
 *         schema: { type: string }
 *         example: "50"
 *       - in: query
 *         name: before
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0c9"
 *     responses:
 *       200:
 *         description: List of messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: array, items: { type: object } }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0c8"
 *                   roomId: "64f1a2b3c4d5e6f7a8b9c0b1"
 *                   senderId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   text: "Hi, is 5pm still good for the grooming appointment?"
 *                   imageUrl: null
 *                   isRead: true
 *                   createdAt: "2024-06-21T10:10:00.000Z"
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0c9"
 *                   roomId: "64f1a2b3c4d5e6f7a8b9c0b1"
 *                   senderId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   text: "Sure, see you at 5pm!"
 *                   imageUrl: null
 *                   isRead: false
 *                   createdAt: "2024-06-21T10:15:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f1a2b3c4d5e6f7a8b9c0b1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string, maxLength: 4000, default: "" }
 *               imageUrl: { type: string, format: uri }
 *             description: Either text or imageUrl (or both) must be provided
 *           example:
 *             text: "Sure, see you at 5pm!"
 *     responses:
 *       201:
 *         description: Message sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0c9"
 *                 roomId: "64f1a2b3c4d5e6f7a8b9c0b1"
 *                 senderId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 text: "Sure, see you at 5pm!"
 *                 imageUrl: null
 *                 isRead: false
 *                 createdAt: "2024-06-21T10:15:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Message must have text or an image
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
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
 *         example: "64f1a2b3c4d5e6f7a8b9c0b1"
 *     responses:
 *       200:
 *         description: Room marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { nullable: true }
 *             example:
 *               success: true
 *               message: Room marked as read
 *               data: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 */
chatRoutes.patch(
  '/rooms/:roomId/read',
  validate({ params: roomIdParamSchema }),
  chatController.markRead,
);

/**
 * @openapi
 * /chat/rooms/{roomId}/urgent:
 *   patch:
 *     tags: [Chat]
 *     summary: Flag or unflag a chat room as urgent/emergency
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0b1"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isUrgent]
 *             properties:
 *               isUrgent: { type: boolean }
 *           example:
 *             isUrgent: true
 *     responses:
 *       200:
 *         description: Room updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data: { type: object }
 *             example:
 *               success: true
 *               message: Room updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0b1"
 *                 otherParticipantId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 bookingId: null
 *                 lastMessageAt: "2024-06-21T10:15:00.000Z"
 *                 lastMessagePreview: "Bunny isn't eating, please call me!"
 *                 isUrgent: true
 *                 unreadCount: 1
 *       400:
 *         description: Validation error or invalid id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Authentication required
 *       403:
 *         description: Not a participant in this room
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: FORBIDDEN
 *               message: You are not a participant in this chat room
 */
chatRoutes.patch(
  '/rooms/:roomId/urgent',
  validate({ params: roomIdParamSchema, body: updateUrgentSchema }),
  chatController.setUrgent,
);

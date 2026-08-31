import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { aiChatController } from './ai-chat.controller.js';
import { listAiChatMessagesQuerySchema, sendAiChatMessageSchema } from './ai-chat.validators.js';

export const aiChatRoutes = Router();

aiChatRoutes.use(authenticate);

/**
 * @openapi
 * /ai-chat/messages:
 *   get:
 *     tags: [AI Chat]
 *     summary: List the current user's AI chat history (newest first)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, required: false, schema: { type: string }, example: '1' }
 *       - { name: limit, in: query, required: false, schema: { type: string }, example: '20' }
 *     responses:
 *       200:
 *         description: Chat history
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                   role: ASSISTANT
 *                   text: "A weekly bath is usually enough for most dogs — more often can dry out their skin."
 *                   createdAt: '2026-08-31T10:05:00.000Z'
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0e0
 *                   role: USER
 *                   text: "How often should I bathe my golden retriever?"
 *                   createdAt: '2026-08-31T10:04:50.000Z'
 *               meta: { page: 1, limit: 20, total: 2, totalPages: 1 }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
aiChatRoutes.get(
  '/messages',
  validate({ query: listAiChatMessagesQuerySchema }),
  aiChatController.listMine,
);

/**
 * @openapi
 * /ai-chat/messages:
 *   post:
 *     tags: [AI Chat]
 *     summary: Send a message to the AI assistant and get its reply
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text: { type: string, maxLength: 2000 }
 *           example:
 *             text: "How often should I bathe my golden retriever?"
 *     responses:
 *       201:
 *         description: Both the user's message and the assistant's reply
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 userMessage:
 *                   id: 64f1a2b3c4d5e6f7a8b9c0e0
 *                   role: USER
 *                   text: "How often should I bathe my golden retriever?"
 *                   createdAt: '2026-08-31T10:04:50.000Z'
 *                 assistantMessage:
 *                   id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                   role: ASSISTANT
 *                   text: "A weekly bath is usually enough for most dogs — more often can dry out their skin."
 *                   createdAt: '2026-08-31T10:05:00.000Z'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: Gemini is not configured, or the AI call failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: INTERNAL_ERROR
 *               message: Gemini is not configured
 */
aiChatRoutes.post(
  '/messages',
  validate({ body: sendAiChatMessageSchema }),
  aiChatController.sendMessage,
);

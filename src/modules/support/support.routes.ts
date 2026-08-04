import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { supportController } from './support.controller.js';
import {
  addMessageSchema,
  createTicketSchema,
  idParamSchema,
  listTicketsQuerySchema,
  updateTicketStatusSchema,
} from './support.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const supportRoutes = Router();

supportRoutes.use(authenticate);

/**
 * @openapi
 * /support-tickets:
 *   post:
 *     tags: [Support]
 *     summary: Create a new support ticket
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, message]
 *             properties:
 *               subject: { type: string, maxLength: 200 }
 *               message: { type: string, maxLength: 4000 }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH], default: MEDIUM }
 *           example:
 *             subject: "Refund not received for cancelled booking"
 *             message: "I cancelled my grooming booking 3 days ago but haven't received the refund yet."
 *             priority: HIGH
 *     responses:
 *       201:
 *         description: Ticket created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Support ticket created
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f4"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 subject: "Refund not received for cancelled booking"
 *                 status: OPEN
 *                 priority: HIGH
 *                 createdAt: "2026-08-04T12:00:00.000Z"
 *                 updatedAt: "2026-08-04T12:00:00.000Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "subject is required" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
supportRoutes.post('/', validate({ body: createTicketSchema }), supportController.create);
/**
 * @openapi
 * /support-tickets:
 *   get:
 *     tags: [Support]
 *     summary: List support tickets owned by the current user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED] }
 *         example: OPEN
 *       - name: page
 *         in: query
 *         required: false
 *         schema: { type: string, default: "1" }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         required: false
 *         schema: { type: string, default: "20" }
 *         example: "20"
 *     responses:
 *       200:
 *         description: List of tickets
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0f4"
 *                   userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   subject: "Refund not received for cancelled booking"
 *                   status: OPEN
 *                   priority: HIGH
 *                   createdAt: "2026-08-04T12:00:00.000Z"
 *                   updatedAt: "2026-08-04T12:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
supportRoutes.get('/', validate({ query: listTicketsQuerySchema }), supportController.listMine);
/**
 * @openapi
 * /support-tickets/admin:
 *   get:
 *     tags: [Support]
 *     summary: List all support tickets (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED] }
 *         example: OPEN
 *       - name: page
 *         in: query
 *         required: false
 *         schema: { type: string, default: "1" }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         required: false
 *         schema: { type: string, default: "20" }
 *         example: "20"
 *     responses:
 *       200:
 *         description: List of all tickets
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0f4"
 *                   userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   subject: "Refund not received for cancelled booking"
 *                   status: OPEN
 *                   priority: HIGH
 *                   createdAt: "2026-08-04T12:00:00.000Z"
 *                   updatedAt: "2026-08-04T12:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
 */
supportRoutes.get(
  '/admin',
  ...adminOnly,
  validate({ query: listTicketsQuerySchema }),
  supportController.listAll,
);

/**
 * @openapi
 * /support-tickets/{id}:
 *   get:
 *     tags: [Support]
 *     summary: Get a support ticket with its messages
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f4"
 *     responses:
 *       200:
 *         description: Ticket with messages
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 ticket:
 *                   id: "64f1a2b3c4d5e6f7a8b9c0f4"
 *                   userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   subject: "Refund not received for cancelled booking"
 *                   status: OPEN
 *                   priority: HIGH
 *                   createdAt: "2026-08-04T12:00:00.000Z"
 *                   updatedAt: "2026-08-04T12:00:00.000Z"
 *                 messages:
 *                   - id: "64f1a2b3c4d5e6f7a8b9c0f5"
 *                     ticketId: "64f1a2b3c4d5e6f7a8b9c0f4"
 *                     senderId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                     content: "I cancelled my grooming booking 3 days ago but haven't received the refund yet."
 *                     createdAt: "2026-08-04T12:00:00.000Z"
 *       400:
 *         description: Invalid id parameter or ticket not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Support ticket not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
supportRoutes.get('/:id', validate({ params: idParamSchema }), supportController.getWithMessages);
/**
 * @openapi
 * /support-tickets/{id}/messages:
 *   post:
 *     tags: [Support]
 *     summary: Add a message to a support ticket
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, maxLength: 4000 }
 *           example:
 *             content: "Following up - any update on this refund?"
 *     responses:
 *       201:
 *         description: Message added
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Message added
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f6"
 *                 ticketId: "64f1a2b3c4d5e6f7a8b9c0f4"
 *                 senderId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 content: "Following up - any update on this refund?"
 *                 createdAt: "2026-08-04T12:05:00.000Z"
 *       400:
 *         description: Validation error, invalid id, or ticket not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Support ticket not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
supportRoutes.post(
  '/:id/messages',
  validate({ params: idParamSchema, body: addMessageSchema }),
  supportController.addMessage,
);
/**
 * @openapi
 * /support-tickets/{id}/status:
 *   patch:
 *     tags: [Support]
 *     summary: Update a support ticket's status (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f1a2b3c4d5e6f7a8b9c0f4"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED] }
 *           example:
 *             status: RESOLVED
 *     responses:
 *       200:
 *         description: Ticket status updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Ticket status updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0f4"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 subject: "Refund not received for cancelled booking"
 *                 status: RESOLVED
 *                 priority: HIGH
 *                 createdAt: "2026-08-04T12:00:00.000Z"
 *                 updatedAt: "2026-08-04T12:10:00.000Z"
 *       400:
 *         description: Validation error or ticket not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Support ticket not found" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "Insufficient permissions" }
 */
supportRoutes.patch(
  '/:id/status',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateTicketStatusSchema }),
  supportController.updateStatus,
);

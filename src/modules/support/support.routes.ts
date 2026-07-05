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
 *     responses:
 *       201: { description: Ticket created }
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
 *       - { name: status, in: query, required: false, schema: { type: string } }
 *       - { name: page, in: query, required: false, schema: { type: string } }
 *       - { name: limit, in: query, required: false, schema: { type: string } }
 *     responses:
 *       200: { description: List of tickets }
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
 *       - { name: status, in: query, required: false, schema: { type: string } }
 *       - { name: page, in: query, required: false, schema: { type: string } }
 *       - { name: limit, in: query, required: false, schema: { type: string } }
 *     responses:
 *       200: { description: List of all tickets }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Ticket with messages }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: Message added }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Ticket status updated }
 */
supportRoutes.patch(
  '/:id/status',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateTicketStatusSchema }),
  supportController.updateStatus,
);

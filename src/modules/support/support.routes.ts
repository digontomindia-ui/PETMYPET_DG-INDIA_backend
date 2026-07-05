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

supportRoutes.post('/', validate({ body: createTicketSchema }), supportController.create);
supportRoutes.get('/', validate({ query: listTicketsQuerySchema }), supportController.listMine);
supportRoutes.get(
  '/admin',
  ...adminOnly,
  validate({ query: listTicketsQuerySchema }),
  supportController.listAll,
);

supportRoutes.get('/:id', validate({ params: idParamSchema }), supportController.getWithMessages);
supportRoutes.post(
  '/:id/messages',
  validate({ params: idParamSchema, body: addMessageSchema }),
  supportController.addMessage,
);
supportRoutes.patch(
  '/:id/status',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateTicketStatusSchema }),
  supportController.updateStatus,
);

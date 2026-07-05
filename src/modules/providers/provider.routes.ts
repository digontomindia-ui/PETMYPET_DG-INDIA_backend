import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { providerController } from './provider.controller.js';
import {
  createProviderProfileSchema,
  documentIdParamSchema,
  idParamSchema,
  nearbyProvidersQuerySchema,
  rejectKycSchema,
  setBankAccountSchema,
  updateProviderProfileSchema,
  uploadKycDocumentSchema,
} from './provider.validators.js';

const requireProvider = [authenticate, requireRole(ROLES.SERVICE_PROVIDER)] as const;
const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const providerRoutes = Router();

providerRoutes.get(
  '/nearby',
  validate({ query: nearbyProvidersQuerySchema }),
  providerController.listNearby,
);

providerRoutes.post(
  '/me',
  ...requireProvider,
  validate({ body: createProviderProfileSchema }),
  providerController.createProfile,
);
providerRoutes.get('/me', ...requireProvider, providerController.getMyProfile);
providerRoutes.put(
  '/me',
  ...requireProvider,
  validate({ body: updateProviderProfileSchema }),
  providerController.updateMyProfile,
);
providerRoutes.patch('/me/active', ...requireProvider, providerController.setActive);

providerRoutes.post(
  '/me/kyc-documents',
  ...requireProvider,
  validate({ body: uploadKycDocumentSchema }),
  providerController.uploadKycDocument,
);
providerRoutes.delete(
  '/me/kyc-documents/:documentId',
  ...requireProvider,
  validate({ params: documentIdParamSchema.pick({ documentId: true }) }),
  providerController.removeKycDocument,
);

providerRoutes.put(
  '/me/bank-account',
  ...requireProvider,
  validate({ body: setBankAccountSchema }),
  providerController.setBankAccount,
);

providerRoutes.post('/me/attendance/check-in', ...requireProvider, providerController.checkIn);
providerRoutes.post('/me/attendance/check-out', ...requireProvider, providerController.checkOut);

providerRoutes.get('/pending-kyc', ...adminOnly, providerController.listPendingKyc);
providerRoutes.patch(
  '/:id/kyc/approve',
  ...adminOnly,
  validate({ params: idParamSchema }),
  providerController.approveKyc,
);
providerRoutes.patch(
  '/:id/kyc/reject',
  ...adminOnly,
  validate({ params: idParamSchema, body: rejectKycSchema }),
  providerController.rejectKyc,
);

providerRoutes.get('/:id', validate({ params: idParamSchema }), providerController.getById);

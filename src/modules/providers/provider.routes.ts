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

/**
 * @openapi
 * /providers/nearby:
 *   get:
 *     tags: [Providers]
 *     summary: List nearby providers
 *     parameters:
 *       - { name: lat, in: query, required: true, schema: { type: string } }
 *       - { name: lng, in: query, required: true, schema: { type: string } }
 *       - { name: radiusMeters, in: query, schema: { type: string } }
 *       - { name: providerType, in: query, schema: { type: string } }
 *       - { name: page, in: query, schema: { type: string } }
 *       - { name: limit, in: query, schema: { type: string } }
 *     responses:
 *       200: { description: List of nearby providers }
 */
providerRoutes.get(
  '/nearby',
  validate({ query: nearbyProvidersQuerySchema }),
  providerController.listNearby,
);

/**
 * @openapi
 * /providers/me:
 *   post:
 *     tags: [Providers]
 *     summary: Create own provider profile (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Provider profile created }
 */
providerRoutes.post(
  '/me',
  ...requireProvider,
  validate({ body: createProviderProfileSchema }),
  providerController.createProfile,
);
/**
 * @openapi
 * /providers/me:
 *   get:
 *     tags: [Providers]
 *     summary: Get own provider profile (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Provider profile retrieved }
 */
providerRoutes.get('/me', ...requireProvider, providerController.getMyProfile);
/**
 * @openapi
 * /providers/me:
 *   put:
 *     tags: [Providers]
 *     summary: Update own provider profile (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Provider profile updated }
 */
providerRoutes.put(
  '/me',
  ...requireProvider,
  validate({ body: updateProviderProfileSchema }),
  providerController.updateMyProfile,
);
/**
 * @openapi
 * /providers/me/active:
 *   patch:
 *     tags: [Providers]
 *     summary: Toggle own active status (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Active status updated }
 */
providerRoutes.patch('/me/active', ...requireProvider, providerController.setActive);

/**
 * @openapi
 * /providers/me/kyc-documents:
 *   post:
 *     tags: [Providers]
 *     summary: Upload a KYC document (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: KYC document uploaded }
 */
providerRoutes.post(
  '/me/kyc-documents',
  ...requireProvider,
  validate({ body: uploadKycDocumentSchema }),
  providerController.uploadKycDocument,
);
/**
 * @openapi
 * /providers/me/kyc-documents/{documentId}:
 *   delete:
 *     tags: [Providers]
 *     summary: Remove a KYC document (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: documentId, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: KYC document removed }
 */
providerRoutes.delete(
  '/me/kyc-documents/:documentId',
  ...requireProvider,
  validate({ params: documentIdParamSchema.pick({ documentId: true }) }),
  providerController.removeKycDocument,
);

/**
 * @openapi
 * /providers/me/bank-account:
 *   put:
 *     tags: [Providers]
 *     summary: Set own bank account details (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Bank account details updated }
 */
providerRoutes.put(
  '/me/bank-account',
  ...requireProvider,
  validate({ body: setBankAccountSchema }),
  providerController.setBankAccount,
);

/**
 * @openapi
 * /providers/me/attendance/check-in:
 *   post:
 *     tags: [Providers]
 *     summary: Check in for attendance (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Checked in }
 */
providerRoutes.post('/me/attendance/check-in', ...requireProvider, providerController.checkIn);
/**
 * @openapi
 * /providers/me/attendance/check-out:
 *   post:
 *     tags: [Providers]
 *     summary: Check out for attendance (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Checked out }
 */
providerRoutes.post('/me/attendance/check-out', ...requireProvider, providerController.checkOut);

/**
 * @openapi
 * /providers/pending-kyc:
 *   get:
 *     tags: [Providers]
 *     summary: List providers with pending KYC (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of providers with pending KYC }
 */
providerRoutes.get('/pending-kyc', ...adminOnly, providerController.listPendingKyc);
/**
 * @openapi
 * /providers/{id}/kyc/approve:
 *   patch:
 *     tags: [Providers]
 *     summary: Approve a provider's KYC (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: KYC approved }
 */
providerRoutes.patch(
  '/:id/kyc/approve',
  ...adminOnly,
  validate({ params: idParamSchema }),
  providerController.approveKyc,
);
/**
 * @openapi
 * /providers/{id}/kyc/reject:
 *   patch:
 *     tags: [Providers]
 *     summary: Reject a provider's KYC (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: KYC rejected }
 */
providerRoutes.patch(
  '/:id/kyc/reject',
  ...adminOnly,
  validate({ params: idParamSchema, body: rejectKycSchema }),
  providerController.rejectKyc,
);

/**
 * @openapi
 * /providers/{id}:
 *   get:
 *     tags: [Providers]
 *     summary: Get a provider by id
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Provider retrieved }
 */
providerRoutes.get('/:id', validate({ params: idParamSchema }), providerController.getById);

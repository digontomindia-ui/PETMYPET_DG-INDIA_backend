import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { petInsuranceController } from './pet-insurance.controller.js';
import {
  createInsuranceApplicationSchema,
  idParamSchema,
  listInsuranceApplicationsQuerySchema,
  listMyApplicationsQuerySchema,
  updateApplicationStatusSchema,
} from './pet-insurance.validators.js';

const adminOnly = [authenticate, requireRole(ROLES.SUPER_ADMIN)] as const;

export const petInsuranceRoutes = Router();

/**
 * @openapi
 * /pet-insurance/applications:
 *   post:
 *     tags: [PetInsurance]
 *     summary: Submit a pet insurance application
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ownerName, ownerEmail, ownerPhone, petName, petType, petAge, petBreed, previousIllness, previousSurgery, vaccinated]
 *             properties:
 *               ownerName: { type: string, minLength: 1, maxLength: 120 }
 *               ownerEmail: { type: string, format: email }
 *               ownerPhone: { type: string, description: "E.164-ish phone, 7-15 digits" }
 *               petName: { type: string, minLength: 1, maxLength: 60 }
 *               petType: { type: string, enum: [DOG, CAT, OTHER] }
 *               petAge: { type: string, maxLength: 30, description: "Free text, e.g. \"3 years\"" }
 *               petBreed: { type: string, minLength: 1, maxLength: 100 }
 *               previousIllness: { type: boolean }
 *               illnessDocumentUrls:
 *                 type: array
 *                 items: { type: string, format: uri }
 *                 maxItems: 5
 *                 description: "Upload files via POST /uploads (category KYC_DOCUMENT) first, then pass the returned URLs here. Ignored server-side unless previousIllness is true."
 *               previousSurgery: { type: boolean }
 *               vaccinated: { type: boolean }
 *               vaccinationDocumentUrls:
 *                 type: array
 *                 items: { type: string, format: uri }
 *                 maxItems: 5
 *                 description: "Upload files via POST /uploads (category KYC_DOCUMENT) first, then pass the returned URLs here. Ignored server-side unless vaccinated is true."
 *           example:
 *             ownerName: Ananya Rao
 *             ownerEmail: ananya.rao@example.com
 *             ownerPhone: "+919876543210"
 *             petName: Bruno
 *             petType: DOG
 *             petAge: "3 years"
 *             petBreed: Labrador Retriever
 *             previousIllness: true
 *             illnessDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-illness.pdf"]
 *             previousSurgery: false
 *             vaccinated: true
 *             vaccinationDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-vaccination.pdf"]
 *     responses:
 *       201:
 *         description: Insurance application submitted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Insurance application submitted
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 ownerName: Ananya Rao
 *                 ownerEmail: ananya.rao@example.com
 *                 ownerPhone: "+919876543210"
 *                 petName: Bruno
 *                 petType: DOG
 *                 petAge: "3 years"
 *                 petBreed: Labrador Retriever
 *                 previousIllness: true
 *                 illnessDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-illness.pdf"]
 *                 previousSurgery: false
 *                 vaccinated: true
 *                 vaccinationDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-vaccination.pdf"]
 *                 status: SUBMITTED
 *                 rejectionReason: null
 *                 createdAt: "2026-08-20T08:00:00.000Z"
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "ownerEmail: Invalid email" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
petInsuranceRoutes.post(
  '/applications',
  authenticate,
  validate({ body: createInsuranceApplicationSchema }),
  petInsuranceController.create,
);

/**
 * @openapi
 * /pet-insurance/applications/me:
 *   get:
 *     tags: [PetInsurance]
 *     summary: List the authenticated user's own insurance applications
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *         example: "20"
 *     responses:
 *       200:
 *         description: List of the caller's insurance applications
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   ownerName: Ananya Rao
 *                   ownerEmail: ananya.rao@example.com
 *                   ownerPhone: "+919876543210"
 *                   petName: Bruno
 *                   petType: DOG
 *                   petAge: "3 years"
 *                   petBreed: Labrador Retriever
 *                   previousIllness: true
 *                   illnessDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-illness.pdf"]
 *                   previousSurgery: false
 *                   vaccinated: true
 *                   vaccinationDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-vaccination.pdf"]
 *                   status: SUBMITTED
 *                   rejectionReason: null
 *                   createdAt: "2026-08-20T08:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "limit must be a valid number" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
petInsuranceRoutes.get(
  '/applications/me',
  authenticate,
  validate({ query: listMyApplicationsQuerySchema }),
  petInsuranceController.listMine,
);

/**
 * @openapi
 * /pet-insurance/applications:
 *   get:
 *     tags: [PetInsurance]
 *     summary: List all insurance applications (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED] }
 *         example: SUBMITTED
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *         example: "20"
 *     responses:
 *       200:
 *         description: List of insurance applications
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   ownerName: Ananya Rao
 *                   ownerEmail: ananya.rao@example.com
 *                   ownerPhone: "+919876543210"
 *                   petName: Bruno
 *                   petType: DOG
 *                   petAge: "3 years"
 *                   petBreed: Labrador Retriever
 *                   previousIllness: true
 *                   illnessDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-illness.pdf"]
 *                   previousSurgery: false
 *                   vaccinated: true
 *                   vaccinationDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-vaccination.pdf"]
 *                   status: SUBMITTED
 *                   rejectionReason: null
 *                   createdAt: "2026-08-20T08:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Invalid enum value for status" }
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
 *             example: { success: false, error: FORBIDDEN, message: "You do not have permission to perform this action" }
 */
petInsuranceRoutes.get(
  '/applications',
  ...adminOnly,
  validate({ query: listInsuranceApplicationsQuerySchema }),
  petInsuranceController.list,
);

/**
 * @openapi
 * /pet-insurance/applications/{id}:
 *   get:
 *     tags: [PetInsurance]
 *     summary: Get an insurance application by id (owner or SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Insurance application found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 ownerName: Ananya Rao
 *                 ownerEmail: ananya.rao@example.com
 *                 ownerPhone: "+919876543210"
 *                 petName: Bruno
 *                 petType: DOG
 *                 petAge: "3 years"
 *                 petBreed: Labrador Retriever
 *                 previousIllness: true
 *                 illnessDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-illness.pdf"]
 *                 previousSurgery: false
 *                 vaccinated: true
 *                 vaccinationDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-vaccination.pdf"]
 *                 status: SUBMITTED
 *                 rejectionReason: null
 *                 createdAt: "2026-08-20T08:00:00.000Z"
 *       400:
 *         description: Invalid id parameter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Invalid id" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Not the owner of this application
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "You do not have access to this application" }
 *       404:
 *         description: Insurance application not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Insurance application not found" }
 */
petInsuranceRoutes.get(
  '/applications/:id',
  authenticate,
  validate({ params: idParamSchema }),
  petInsuranceController.getById,
);

/**
 * @openapi
 * /pet-insurance/applications/{id}/status:
 *   patch:
 *     tags: [PetInsurance]
 *     summary: Update an insurance application's status (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [UNDER_REVIEW, APPROVED, REJECTED] }
 *               rejectionReason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: "Required when status is REJECTED"
 *           example:
 *             status: REJECTED
 *             rejectionReason: Vaccination document is illegible; please resubmit a clearer scan.
 *     responses:
 *       200:
 *         description: Insurance application status updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Application status updated
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 userId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 ownerName: Ananya Rao
 *                 ownerEmail: ananya.rao@example.com
 *                 ownerPhone: "+919876543210"
 *                 petName: Bruno
 *                 petType: DOG
 *                 petAge: "3 years"
 *                 petBreed: Labrador Retriever
 *                 previousIllness: true
 *                 illnessDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-illness.pdf"]
 *                 previousSurgery: false
 *                 vaccinated: true
 *                 vaccinationDocumentUrls: ["https://res.cloudinary.com/patmypets/image/upload/v1699999999/kyc-documents/bruno-vaccination.pdf"]
 *                 status: REJECTED
 *                 rejectionReason: Vaccination document is illegible; please resubmit a clearer scan.
 *                 createdAt: "2026-08-20T08:00:00.000Z"
 *       400:
 *         description: Invalid request body or id parameter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "rejectionReason is required when status is REJECTED" }
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
 *             example: { success: false, error: FORBIDDEN, message: "You do not have permission to perform this action" }
 *       404:
 *         description: Insurance application not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Insurance application not found" }
 */
petInsuranceRoutes.patch(
  '/applications/:id/status',
  ...adminOnly,
  validate({ params: idParamSchema, body: updateApplicationStatusSchema }),
  petInsuranceController.updateStatus,
);

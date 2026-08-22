import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { providerController } from './provider.controller.js';
import {
  addUnavailableDateSchema,
  attendanceQuerySchema,
  createProviderProfileSchema,
  documentIdParamSchema,
  idParamSchema,
  nearbyProvidersQuerySchema,
  providerAnalyticsQuerySchema,
  rejectKycSchema,
  setBankAccountSchema,
  unavailableDateParamSchema,
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
 *     summary: List nearby providers (public summary — omits kycDocuments, kycRejectionReason, bankAccount, attendance; see GET /providers/me for the full self-view)
 *     parameters:
 *       - { name: lat, in: query, required: true, schema: { type: string }, example: "12.9716" }
 *       - { name: lng, in: query, required: true, schema: { type: string }, example: "77.5946" }
 *       - { name: radiusMeters, in: query, schema: { type: string }, example: "10000" }
 *       - { name: providerType, in: query, schema: { type: string }, example: "GROOMER" }
 *       - { name: page, in: query, schema: { type: string }, example: "1" }
 *       - { name: limit, in: query, schema: { type: string }, example: "20" }
 *     responses:
 *       200:
 *         description: List of nearby providers
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   providerType: GROOMER
 *                   businessName: Happy Paws Grooming
 *                   description: Mobile grooming service for dogs and cats
 *                   experienceYears: 5
 *                   languages: ["English", "Hindi"]
 *                   kycStatus: APPROVED
 *                   zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *                   location: { type: Point, coordinates: [77.5946, 12.9716] }
 *                   address: 12 MG Road, Bengaluru, Karnataka 560001
 *                   workingHours:
 *                     - { day: MON, openTime: "09:00", closeTime: "18:00", isClosed: false }
 *                   unavailableDates: []
 *                   metadata: { groomer: { specializations: ["deshedding", "bathing"] } }
 *                   commissionPercent: 15
 *                   rating: 4.6
 *                   ratingCount: 82
 *                   isActive: true
 *                   createdAt: "2026-01-15T09:30:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid or missing query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: lat must be a number
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               providerType: { type: string, enum: [VET, GROOMER, BOARDING, PET_WALKER, TRAINER, CLEANER, PHARMACY, RELOCATION, OTHER] }
 *               businessName: { type: string }
 *               experienceYears: { type: integer, minimum: 0 }
 *               languages: { type: array, items: { type: string } }
 *               description: { type: string }
 *               coordinates:
 *                 type: array
 *                 items: { type: number }
 *               address: { type: string }
 *               zoneIds:
 *                 type: array
 *                 items: { type: string }
 *               workingHours:
 *                 type: array
 *                 items: { type: object }
 *               metadata: { type: object }
 *           example:
 *             providerType: GROOMER
 *             businessName: Happy Paws Grooming
 *             description: Mobile grooming service for dogs and cats
 *             experienceYears: 5
 *             languages: ["English", "Hindi"]
 *             coordinates: [77.5946, 12.9716]
 *             address: 12 MG Road, Bengaluru, Karnataka 560001
 *             zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *             workingHours:
 *               - { day: MON, openTime: "09:00", closeTime: "18:00", isClosed: false }
 *               - { day: SUN, openTime: "00:00", closeTime: "00:00", isClosed: true }
 *             metadata:
 *               groomer:
 *                 specializations: ["deshedding", "bathing"]
 *     responses:
 *       201:
 *         description: Provider profile created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Provider profile created
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: GROOMER
 *                 businessName: Happy Paws Grooming
 *                 description: Mobile grooming service for dogs and cats
 *                 experienceYears: 5
 *                 languages: ["English", "Hindi"]
 *                 kycStatus: PENDING
 *                 zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *                 location: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 address: 12 MG Road, Bengaluru, Karnataka 560001
 *                 workingHours:
 *                   - { day: MON, openTime: "09:00", closeTime: "18:00", isClosed: false }
 *                 unavailableDates: []
 *                 metadata: { groomer: { specializations: ["deshedding", "bathing"] } }
 *                 commissionPercent: null
 *                 rating: 0
 *                 ratingCount: 0
 *                 isActive: true
 *                 kycRejectionReason: null
 *                 kycDocuments: []
 *                 bankAccount: null
 *                 attendance: []
 *                 createdAt: "2026-01-15T09:30:00.000Z"
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: businessName is required
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
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
 *       200:
 *         description: Provider profile retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: GROOMER
 *                 businessName: Happy Paws Grooming
 *                 description: Mobile grooming service for dogs and cats
 *                 experienceYears: 5
 *                 languages: ["English", "Hindi"]
 *                 kycStatus: APPROVED
 *                 zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *                 location: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 address: 12 MG Road, Bengaluru, Karnataka 560001
 *                 workingHours:
 *                   - { day: MON, openTime: "09:00", closeTime: "18:00", isClosed: false }
 *                 unavailableDates: []
 *                 metadata: { groomer: { specializations: ["deshedding", "bathing"] } }
 *                 commissionPercent: 15
 *                 rating: 4.6
 *                 ratingCount: 82
 *                 isActive: true
 *                 kycRejectionReason: null
 *                 kycDocuments: [{ id: "64f1a2b3c4d5e6f7a8b9c0f1", type: GOVERNMENT_ID, url: "https://cdn.petmypet.in/kyc/64f1a2b3c4d5e6f7a8b9c0d1/aadhaar-front.jpg", uploadedAt: "2026-01-10T08:00:00.000Z" }]
 *                 bankAccount: { accountHolderName: Rohit Sharma, bankName: HDFC Bank, last4: "7890" }
 *                 attendance: [{ id: "64f1a2b3c4d5e6f7a8b9c0f9", date: "2026-08-20", checkInAt: "2026-08-20T09:00:00.000Z", checkOutAt: "2026-08-20T17:00:00.000Z" }]
 *                 createdAt: "2026-01-15T09:30:00.000Z"
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 */
providerRoutes.get('/me', ...requireProvider, providerController.getMyProfile);
/**
 * @openapi
 * /providers/me:
 *   put:
 *     tags: [Providers]
 *     summary: Update own provider profile (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName: { type: string }
 *               experienceYears: { type: integer, minimum: 0 }
 *               languages: { type: array, items: { type: string } }
 *               description: { type: string }
 *               address: { type: string }
 *               coordinates:
 *                 type: array
 *                 items: { type: number }
 *               zoneIds:
 *                 type: array
 *                 items: { type: string }
 *               workingHours:
 *                 type: array
 *                 items: { type: object }
 *               metadata: { type: object }
 *           example:
 *             businessName: Happy Paws Grooming & Spa
 *             description: Mobile grooming and spa service for dogs and cats
 *             experienceYears: 5
 *             languages: ["English", "Hindi"]
 *             address: 45 Brigade Road, Bengaluru, Karnataka 560025
 *     responses:
 *       200:
 *         description: Provider profile updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Provider profile updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: GROOMER
 *                 businessName: Happy Paws Grooming & Spa
 *                 description: Mobile grooming and spa service for dogs and cats
 *                 experienceYears: 5
 *                 languages: ["English", "Hindi"]
 *                 kycStatus: APPROVED
 *                 zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *                 location: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 address: 45 Brigade Road, Bengaluru, Karnataka 560025
 *                 workingHours:
 *                   - { day: MON, openTime: "09:00", closeTime: "18:00", isClosed: false }
 *                 unavailableDates: []
 *                 metadata: { groomer: { specializations: ["deshedding", "bathing"] } }
 *                 commissionPercent: 15
 *                 rating: 4.6
 *                 ratingCount: 82
 *                 isActive: true
 *                 kycRejectionReason: null
 *                 kycDocuments: [{ id: "64f1a2b3c4d5e6f7a8b9c0f1", type: GOVERNMENT_ID, url: "https://cdn.petmypet.in/kyc/64f1a2b3c4d5e6f7a8b9c0d1/aadhaar-front.jpg", uploadedAt: "2026-01-10T08:00:00.000Z" }]
 *                 bankAccount: { accountHolderName: Rohit Sharma, bankName: HDFC Bank, last4: "7890" }
 *                 attendance: [{ id: "64f1a2b3c4d5e6f7a8b9c0f9", date: "2026-08-20", checkInAt: "2026-08-20T09:00:00.000Z", checkOutAt: "2026-08-20T17:00:00.000Z" }]
 *                 createdAt: "2026-01-15T09:30:00.000Z"
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: businessName must be at most 150 characters
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive: { type: boolean }
 *             required: [isActive]
 *           example:
 *             isActive: false
 *     responses:
 *       200:
 *         description: Active status updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Availability updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: GROOMER
 *                 businessName: Happy Paws Grooming
 *                 description: Mobile grooming service for dogs and cats
 *                 experienceYears: 5
 *                 languages: ["English", "Hindi"]
 *                 kycStatus: APPROVED
 *                 zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *                 location: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 address: 12 MG Road, Bengaluru, Karnataka 560001
 *                 workingHours: []
 *                 unavailableDates: []
 *                 metadata: {}
 *                 commissionPercent: 15
 *                 rating: 4.6
 *                 ratingCount: 82
 *                 isActive: false
 *                 kycRejectionReason: null
 *                 kycDocuments: [{ id: "64f1a2b3c4d5e6f7a8b9c0f1", type: GOVERNMENT_ID, url: "https://cdn.petmypet.in/kyc/64f1a2b3c4d5e6f7a8b9c0d1/aadhaar-front.jpg", uploadedAt: "2026-01-10T08:00:00.000Z" }]
 *                 bankAccount: { accountHolderName: Rohit Sharma, bankName: HDFC Bank, last4: "7890" }
 *                 attendance: [{ id: "64f1a2b3c4d5e6f7a8b9c0f9", date: "2026-08-20", checkInAt: "2026-08-20T09:00:00.000Z", checkOutAt: "2026-08-20T17:00:00.000Z" }]
 *                 createdAt: "2026-01-15T09:30:00.000Z"
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 */
providerRoutes.patch('/me/active', ...requireProvider, providerController.setActive);

/**
 * @openapi
 * /providers/me/kyc-documents:
 *   post:
 *     tags: [Providers]
 *     summary: Upload a KYC document (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string, enum: [GOVERNMENT_ID, BUSINESS_LICENSE, PROFESSIONAL_CERTIFICATE, ADDRESS_PROOF, OTHER] }
 *               url: { type: string, format: uri }
 *             required: [type, url]
 *           example:
 *             type: GOVERNMENT_ID
 *             url: https://cdn.petmypet.in/kyc/64f1a2b3c4d5e6f7a8b9c0d1/aadhaar-front.jpg
 *     responses:
 *       201:
 *         description: KYC document uploaded
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: KYC document uploaded
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: GROOMER
 *                 businessName: Happy Paws Grooming
 *                 description: Mobile grooming service for dogs and cats
 *                 experienceYears: 5
 *                 languages: ["English", "Hindi"]
 *                 kycStatus: PENDING
 *                 zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *                 location: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 address: 12 MG Road, Bengaluru, Karnataka 560001
 *                 workingHours: []
 *                 unavailableDates: []
 *                 metadata: {}
 *                 commissionPercent: null
 *                 rating: 0
 *                 ratingCount: 0
 *                 isActive: true
 *                 kycRejectionReason: null
 *                 kycDocuments: [{ id: "64f1a2b3c4d5e6f7a8b9c0f1", type: GOVERNMENT_ID, url: "https://cdn.petmypet.in/kyc/64f1a2b3c4d5e6f7a8b9c0d1/aadhaar-front.jpg", uploadedAt: "2026-01-10T08:00:00.000Z" }]
 *                 bankAccount: null
 *                 attendance: []
 *                 createdAt: "2026-01-15T09:30:00.000Z"
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: url must be a valid URL
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
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
 *       - { name: documentId, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0f1" }
 *     responses:
 *       200:
 *         description: KYC document removed
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: KYC document removed
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: GROOMER
 *                 businessName: Happy Paws Grooming
 *                 description: Mobile grooming service for dogs and cats
 *                 experienceYears: 5
 *                 languages: ["English", "Hindi"]
 *                 kycStatus: PENDING
 *                 zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *                 location: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 address: 12 MG Road, Bengaluru, Karnataka 560001
 *                 workingHours: []
 *                 unavailableDates: []
 *                 metadata: {}
 *                 commissionPercent: null
 *                 rating: 0
 *                 ratingCount: 0
 *                 isActive: true
 *                 kycRejectionReason: null
 *                 kycDocuments: []
 *                 bankAccount: null
 *                 attendance: []
 *                 createdAt: "2026-01-15T09:30:00.000Z"
 *       400:
 *         description: Invalid document id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountHolderName: { type: string }
 *               accountNumber: { type: string }
 *               ifscCode: { type: string }
 *               bankName: { type: string }
 *             required: [accountHolderName, accountNumber, ifscCode, bankName]
 *           example:
 *             accountHolderName: Rohit Sharma
 *             accountNumber: "50100234567890"
 *             ifscCode: HDFC0001234
 *             bankName: HDFC Bank
 *     responses:
 *       200:
 *         description: Bank account details updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Bank account updated
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: GROOMER
 *                 businessName: Happy Paws Grooming
 *                 description: Mobile grooming service for dogs and cats
 *                 experienceYears: 5
 *                 languages: ["English", "Hindi"]
 *                 kycStatus: APPROVED
 *                 zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *                 location: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 address: 12 MG Road, Bengaluru, Karnataka 560001
 *                 workingHours: []
 *                 unavailableDates: []
 *                 metadata: {}
 *                 commissionPercent: 15
 *                 rating: 4.6
 *                 ratingCount: 82
 *                 isActive: true
 *                 kycRejectionReason: null
 *                 kycDocuments: [{ id: "64f1a2b3c4d5e6f7a8b9c0f1", type: GOVERNMENT_ID, url: "https://cdn.petmypet.in/kyc/64f1a2b3c4d5e6f7a8b9c0d1/aadhaar-front.jpg", uploadedAt: "2026-01-10T08:00:00.000Z" }]
 *                 bankAccount: { accountHolderName: Rohit Sharma, bankName: HDFC Bank, last4: "7890" }
 *                 attendance: [{ id: "64f1a2b3c4d5e6f7a8b9c0f9", date: "2026-08-20", checkInAt: "2026-08-20T09:00:00.000Z", checkOutAt: "2026-08-20T17:00:00.000Z" }]
 *                 createdAt: "2026-01-15T09:30:00.000Z"
 *       400:
 *         description: Invalid bank account details
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: ifscCode must be at least 4 characters
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
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
 *       201:
 *         description: Checked in
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Checked in
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: GROOMER
 *                 businessName: Happy Paws Grooming
 *                 description: Mobile grooming service for dogs and cats
 *                 experienceYears: 5
 *                 languages: ["English", "Hindi"]
 *                 kycStatus: APPROVED
 *                 zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *                 location: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 address: 12 MG Road, Bengaluru, Karnataka 560001
 *                 workingHours: []
 *                 unavailableDates: []
 *                 metadata: {}
 *                 commissionPercent: 15
 *                 rating: 4.6
 *                 ratingCount: 82
 *                 isActive: true
 *                 kycRejectionReason: null
 *                 kycDocuments: [{ id: "64f1a2b3c4d5e6f7a8b9c0f1", type: GOVERNMENT_ID, url: "https://cdn.petmypet.in/kyc/64f1a2b3c4d5e6f7a8b9c0d1/aadhaar-front.jpg", uploadedAt: "2026-01-10T08:00:00.000Z" }]
 *                 bankAccount: { accountHolderName: Rohit Sharma, bankName: HDFC Bank, last4: "7890" }
 *                 attendance: [{ id: "64f1a2b3c4d5e6f7a8b9c0f9", date: "2026-08-22", checkInAt: "2026-08-22T09:00:00.000Z", checkOutAt: null }]
 *                 createdAt: "2026-01-15T09:30:00.000Z"
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 *       409:
 *         description: Already checked in for today
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: CONFLICT
 *               message: Already checked in for today
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
 *       201:
 *         description: Checked out
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Checked out
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: GROOMER
 *                 businessName: Happy Paws Grooming
 *                 description: Mobile grooming service for dogs and cats
 *                 experienceYears: 5
 *                 languages: ["English", "Hindi"]
 *                 kycStatus: APPROVED
 *                 zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *                 location: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 address: 12 MG Road, Bengaluru, Karnataka 560001
 *                 workingHours: []
 *                 unavailableDates: []
 *                 metadata: {}
 *                 commissionPercent: 15
 *                 rating: 4.6
 *                 ratingCount: 82
 *                 isActive: true
 *                 kycRejectionReason: null
 *                 kycDocuments: [{ id: "64f1a2b3c4d5e6f7a8b9c0f1", type: GOVERNMENT_ID, url: "https://cdn.petmypet.in/kyc/64f1a2b3c4d5e6f7a8b9c0d1/aadhaar-front.jpg", uploadedAt: "2026-01-10T08:00:00.000Z" }]
 *                 bankAccount: { accountHolderName: Rohit Sharma, bankName: HDFC Bank, last4: "7890" }
 *                 attendance: [{ id: "64f1a2b3c4d5e6f7a8b9c0f9", date: "2026-08-22", checkInAt: "2026-08-22T09:00:00.000Z", checkOutAt: "2026-08-22T17:00:00.000Z" }]
 *                 createdAt: "2026-01-15T09:30:00.000Z"
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 *       400:
 *         description: No open check-in found for today
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: No open check-in found for today
 */
providerRoutes.post('/me/attendance/check-out', ...requireProvider, providerController.checkOut);

/**
 * @openapi
 * /providers/me/unavailable-dates:
 *   post:
 *     tags: [Providers]
 *     summary: Add a holiday/blocked date (SERVICE_PROVIDER only) — GET /availability returns no bookable slots on this date
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date: { type: string, format: date, example: "2026-10-02" }
 *           example:
 *             date: "2026-10-02"
 *     responses:
 *       201:
 *         description: Unavailable date added
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Unavailable date added
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 unavailableDates: ["2026-10-02"]
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "date: Invalid date" }
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Missing or malformed Authorization header }
 */
providerRoutes.post(
  '/me/unavailable-dates',
  ...requireProvider,
  validate({ body: addUnavailableDateSchema }),
  providerController.addUnavailableDate,
);

/**
 * @openapi
 * /providers/me/unavailable-dates/{date}:
 *   delete:
 *     tags: [Providers]
 *     summary: Remove a holiday/blocked date (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: date, in: path, required: true, schema: { type: string, format: date }, example: "2026-10-02" }
 *     responses:
 *       200:
 *         description: Unavailable date removed
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Unavailable date removed
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 unavailableDates: []
 *       400:
 *         description: Invalid date format
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Expected YYYY-MM-DD" }
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: Missing or malformed Authorization header }
 */
providerRoutes.delete(
  '/me/unavailable-dates/:date',
  ...requireProvider,
  validate({ params: unavailableDateParamSchema }),
  providerController.removeUnavailableDate,
);

/**
 * @openapi
 * /providers/me/analytics:
 *   get:
 *     tags: [Providers]
 *     summary: Get own performance analytics (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: range
 *         in: query
 *         required: false
 *         schema: { type: string, enum: [week, month], default: week }
 *         example: week
 *     responses:
 *       200:
 *         description: Provider analytics retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 earningsByDay:
 *                   - { date: "2026-08-16", amount: 2400 }
 *                   - { date: "2026-08-17", amount: 1800 }
 *                   - { date: "2026-08-20", amount: 3200 }
 *                 bookingCount: 14
 *                 ratingBreakdown: { "5": 64.3, "4": 21.4, "3": 7.1, "2": 0, "1": 7.1 }
 *                 repeatClientPercent: 35.7
 *                 caseMix:
 *                   - { categoryId: "64f1a2b3c4d5e6f7a8b9c0c1", categoryName: Grooming, count: 10, percent: 71.4 }
 *                   - { categoryId: "64f1a2b3c4d5e6f7a8b9c0c2", categoryName: Boarding, count: 4, percent: 28.6 }
 *                 topServices:
 *                   - { serviceId: "64f1a2b3c4d5e6f7a8b9c0a5", name: "Full Grooming Package", price: 899, bookingCount: 8 }
 *                   - { serviceId: "64f1a2b3c4d5e6f7a8b9c0a6", name: "Basic Bath & Trim", price: 499, bookingCount: 6 }
 *                 avgServiceDurationMinutes: 52
 *                 satisfactionScore: 4.64
 *                 previousPeriodEarnings: 6100
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 *       404:
 *         description: Provider profile not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: NOT_FOUND
 *               message: Provider profile not found
 */
providerRoutes.get(
  '/me/analytics',
  ...requireProvider,
  validate({ query: providerAnalyticsQuerySchema }),
  providerController.getMyAnalytics,
);

/**
 * @openapi
 * /providers/me/attendance:
 *   get:
 *     tags: [Providers]
 *     summary: List own attendance history, newest first (SERVICE_PROVIDER only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, schema: { type: string }, example: "1" }
 *       - { name: limit, in: query, schema: { type: string }, example: "20" }
 *     responses:
 *       200:
 *         description: Attendance history retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0f9"
 *                   date: "2026-08-22"
 *                   checkInAt: "2026-08-22T09:00:00.000Z"
 *                   checkOutAt: null
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0f8"
 *                   date: "2026-08-21"
 *                   checkInAt: "2026-08-21T09:05:00.000Z"
 *                   checkOutAt: "2026-08-21T17:10:00.000Z"
 *               meta: { page: 1, limit: 20, total: 2, totalPages: 1 }
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 *       404:
 *         description: Provider profile not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: NOT_FOUND
 *               message: Provider profile not found
 */
providerRoutes.get(
  '/me/attendance',
  ...requireProvider,
  validate({ query: attendanceQuerySchema }),
  providerController.getMyAttendance,
);

/**
 * @openapi
 * /providers/pending-kyc:
 *   get:
 *     tags: [Providers]
 *     summary: List providers with pending KYC (SUPER_ADMIN only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { name: page, in: query, schema: { type: string }, example: "1" }
 *       - { name: limit, in: query, schema: { type: string }, example: "20" }
 *     responses:
 *       200:
 *         description: List of providers with pending KYC
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                   providerType: VET
 *                   businessName: Cityvet Clinic
 *                   description: Full service veterinary clinic
 *                   kycStatus: PENDING
 *                   zoneIds: []
 *                   location: { type: Point, coordinates: [77.6033, 12.9352] }
 *                   address: 8 Koramangala 4th Block, Bengaluru, Karnataka 560034
 *                   workingHours: []
 *                   unavailableDates: []
 *                   metadata: { vet: { specializations: ["surgery"], consultationFee: 500, licenseNumber: "VET-KA-1234", supportsVideoConsultation: true } }
 *                   commissionPercent: null
 *                   rating: 0
 *                   ratingCount: 0
 *                   isActive: false
 *                   kycRejectionReason: null
 *                   kycDocuments: [{ id: "64f1a2b3c4d5e6f7a8b9c0f1", type: GOVERNMENT_ID, url: "https://cdn.petmypet.in/kyc/64f1a2b3c4d5e6f7a8b9c0d1/aadhaar-front.jpg", uploadedAt: "2026-01-10T08:00:00.000Z" }]
 *                   bankAccount: null
 *                   attendance: []
 *                   createdAt: "2026-01-20T11:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *     responses:
 *       200:
 *         description: KYC approved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Provider KYC approved
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: VET
 *                 businessName: Cityvet Clinic
 *                 description: Full service veterinary clinic
 *                 kycStatus: APPROVED
 *                 zoneIds: []
 *                 location: { type: Point, coordinates: [77.6033, 12.9352] }
 *                 address: 8 Koramangala 4th Block, Bengaluru, Karnataka 560034
 *                 workingHours: []
 *                 unavailableDates: []
 *                 metadata: { vet: { specializations: ["surgery"], consultationFee: 500, licenseNumber: "VET-KA-1234", supportsVideoConsultation: true } }
 *                 commissionPercent: null
 *                 rating: 0
 *                 ratingCount: 0
 *                 isActive: false
 *                 kycRejectionReason: null
 *                 kycDocuments: [{ id: "64f1a2b3c4d5e6f7a8b9c0f1", type: GOVERNMENT_ID, url: "https://cdn.petmypet.in/kyc/64f1a2b3c4d5e6f7a8b9c0d1/aadhaar-front.jpg", uploadedAt: "2026-01-10T08:00:00.000Z" }]
 *                 bankAccount: null
 *                 attendance: []
 *                 createdAt: "2026-01-20T11:00:00.000Z"
 *       400:
 *         description: Invalid provider id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 *       404:
 *         description: Provider not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: NOT_FOUND
 *               message: Provider not found
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
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *             required: [reason]
 *           example:
 *             reason: Business license document is unreadable, please re-upload a clearer scan
 *     responses:
 *       200:
 *         description: KYC rejected
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Provider KYC rejected
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: VET
 *                 businessName: Cityvet Clinic
 *                 description: Full service veterinary clinic
 *                 kycStatus: REJECTED
 *                 zoneIds: []
 *                 location: { type: Point, coordinates: [77.6033, 12.9352] }
 *                 address: 8 Koramangala 4th Block, Bengaluru, Karnataka 560034
 *                 workingHours: []
 *                 unavailableDates: []
 *                 metadata: { vet: { specializations: ["surgery"], consultationFee: 500, licenseNumber: "VET-KA-1234", supportsVideoConsultation: true } }
 *                 commissionPercent: null
 *                 rating: 0
 *                 ratingCount: 0
 *                 isActive: false
 *                 kycRejectionReason: "Business license document is unreadable, please re-upload a clearer scan"
 *                 kycDocuments: [{ id: "64f1a2b3c4d5e6f7a8b9c0f1", type: GOVERNMENT_ID, url: "https://cdn.petmypet.in/kyc/64f1a2b3c4d5e6f7a8b9c0d1/aadhaar-front.jpg", uploadedAt: "2026-01-10T08:00:00.000Z" }]
 *                 bankAccount: null
 *                 attendance: []
 *                 createdAt: "2026-01-20T11:00:00.000Z"
 *       400:
 *         description: Invalid provider id or missing rejection reason
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: reason is required
 *       401:
 *         description: Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: UNAUTHORIZED
 *               message: Missing or malformed Authorization header
 *       404:
 *         description: Provider not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: NOT_FOUND
 *               message: Provider not found
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
 *     summary: Get a provider by id (public summary — omits kycDocuments, kycRejectionReason, bankAccount, attendance; see GET /providers/me for the full self-view)
 *     parameters:
 *       - { name: id, in: path, required: true, schema: { type: string }, example: "64f1a2b3c4d5e6f7a8b9c0d1" }
 *     responses:
 *       200:
 *         description: Provider retrieved
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d2"
 *                 providerType: GROOMER
 *                 businessName: Happy Paws Grooming
 *                 description: Mobile grooming service for dogs and cats
 *                 experienceYears: 5
 *                 languages: ["English", "Hindi"]
 *                 kycStatus: APPROVED
 *                 zoneIds: ["64f1a2b3c4d5e6f7a8b9c0e1"]
 *                 location: { type: Point, coordinates: [77.5946, 12.9716] }
 *                 address: 12 MG Road, Bengaluru, Karnataka 560001
 *                 workingHours:
 *                   - { day: MON, openTime: "09:00", closeTime: "18:00", isClosed: false }
 *                 unavailableDates: []
 *                 metadata: { groomer: { specializations: ["deshedding", "bathing"] } }
 *                 commissionPercent: 15
 *                 rating: 4.6
 *                 ratingCount: 82
 *                 isActive: true
 *                 createdAt: "2026-01-15T09:30:00.000Z"
 *       400:
 *         description: Invalid provider id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: BAD_REQUEST
 *               message: Invalid id
 *       404:
 *         description: Provider not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: NOT_FOUND
 *               message: Provider not found
 */
providerRoutes.get('/:id', validate({ params: idParamSchema }), providerController.getById);

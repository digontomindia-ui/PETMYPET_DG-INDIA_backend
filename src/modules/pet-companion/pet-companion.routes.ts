import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { petCompanionController } from './pet-companion.controller.js';
import { discoverQuerySchema, petIdQuerySchema, swipeSchema } from './pet-companion.validators.js';

export const petCompanionRoutes = Router();

petCompanionRoutes.use(authenticate);

/**
 * @openapi
 * /pet-companion/discover:
 *   get:
 *     tags: [PetCompanion]
 *     summary: Discover nearby pets with companion profiles enabled
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: petId
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *       - name: lat
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: "12.9716"
 *       - name: lng
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: "77.5946"
 *       - name: radiusMeters
 *         in: query
 *         schema: { type: string }
 *         example: "50000"
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
 *         description: Nearby candidate pets
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                   ownerId: 64f1a2b3c4d5e6f7a8b9c0e2
 *                   ownerName: Ananya S.
 *                   name: Luna
 *                   species: DOG
 *                   breed: Golden Retriever
 *                   gender: FEMALE
 *                   dateOfBirth: "2023-05-01T00:00:00.000Z"
 *                   weightKg: 24.0
 *                   avatarUrl: "https://cdn.petmypet.in/pets/luna-avatar.jpg"
 *                   companionProfile:
 *                     isEnabled: true
 *                     bio: Loves the dog park and fetch.
 *                     personalityTraits: [friendly, playful]
 *                     interests: [fetch, swimming]
 *                     lookingFor: [playdates]
 *                     activityLevel: HIGH
 *                     temperament: Great with other dogs
 *                     neutered: true
 *                     getsAlongWith: { dogs: YES, cats: YES, kids: YES, families: YES }
 *                   distanceMeters: 1240.5
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "lat and lng must be valid numbers" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Not the owner of petId
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "You do not have access to this pet" }
 *       404:
 *         description: Pet not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Pet not found" }
 */
petCompanionRoutes.get(
  '/discover',
  validate({ query: discoverQuerySchema }),
  petCompanionController.discover,
);

/**
 * @openapi
 * /pet-companion/swipe:
 *   post:
 *     tags: [PetCompanion]
 *     summary: Swipe on another pet (like, pass, or superlike)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [swiperPetId, targetPetId, action]
 *             properties:
 *               swiperPetId: { type: string }
 *               targetPetId: { type: string }
 *               action: { type: string, enum: [LIKE, PASS, SUPERLIKE] }
 *           example:
 *             swiperPetId: 64f1a2b3c4d5e6f7a8b9c0d1
 *             targetPetId: 64f1a2b3c4d5e6f7a8b9c0e1
 *             action: LIKE
 *     responses:
 *       200:
 *         description: Swipe recorded (mutual match info included if applicable)
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             examples:
 *               match:
 *                 summary: Mutual like — match created
 *                 value:
 *                   success: true
 *                   message: It's a match!
 *                   data:
 *                     matched: true
 *                     matchId: 64f1a2b3c4d5e6f7a8b9c0f1
 *                     chatRoomId: 64f1a2b3c4d5e6f7a8b9c0f2
 *               noMatch:
 *                 summary: No mutual match yet
 *                 value:
 *                   success: true
 *                   message: Swipe recorded
 *                   data: { matched: false }
 *       400:
 *         description: Invalid request body, or swiping on the caller's own pet
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Cannot swipe on the same pet" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Not the owner of swiperPetId
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "You do not have access to this pet" }
 *       404:
 *         description: Target pet not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Target pet not found" }
 */
petCompanionRoutes.post('/swipe', validate({ body: swipeSchema }), petCompanionController.swipe);

/**
 * @openapi
 * /pet-companion/likes-received:
 *   get:
 *     tags: [PetCompanion]
 *     summary: List pets that liked the caller's pet without a mutual match yet
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: petId
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
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
 *         description: Pets awaiting a reciprocal swipe
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                   ownerId: 64f1a2b3c4d5e6f7a8b9c0e2
 *                   name: Luna
 *                   species: DOG
 *                   breed: Golden Retriever
 *                   avatarUrl: "https://cdn.petmypet.in/pets/luna-avatar.jpg"
 *                   action: SUPERLIKE
 *                   swipedAt: "2026-08-10T09:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
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
 *         description: Not the owner of petId
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "You do not have access to this pet" }
 *       404:
 *         description: Pet not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Pet not found" }
 */
petCompanionRoutes.get(
  '/likes-received',
  validate({ query: petIdQuerySchema }),
  petCompanionController.likesReceived,
);

/**
 * @openapi
 * /pet-companion/matches:
 *   get:
 *     tags: [PetCompanion]
 *     summary: List the caller's pet's mutual matches
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: petId
 *         in: query
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
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
 *         description: List of matches
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - matchId: 64f1a2b3c4d5e6f7a8b9c0f1
 *                   otherPet:
 *                     id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                     name: Luna
 *                     avatarUrl: "https://cdn.petmypet.in/pets/luna-avatar.jpg"
 *                     breed: Golden Retriever
 *                   chatRoomId: 64f1a2b3c4d5e6f7a8b9c0f2
 *                   matchedAt: "2026-08-10T09:05:00.000Z"
 *               meta: { page: 1, limit: 20, total: 1, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
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
 *         description: Not the owner of petId
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "You do not have access to this pet" }
 *       404:
 *         description: Pet not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Pet not found" }
 */
petCompanionRoutes.get(
  '/matches',
  validate({ query: petIdQuerySchema }),
  petCompanionController.matches,
);

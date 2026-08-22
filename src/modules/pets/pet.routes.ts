import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { petController } from './pet.controller.js';
import {
  addMedicalRecordSchema,
  addVaccinationSchema,
  createPetSchema,
  idParamSchema,
  recordIdParamSchema,
  updateCompanionProfileSchema,
  updatePetSchema,
} from './pet.validators.js';

export const petRoutes = Router();

petRoutes.use(authenticate);

/**
 * @openapi
 * /pets:
 *   post:
 *     tags: [Pets]
 *     summary: Create a new pet
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 60 }
 *               species: { type: string, enum: [DOG, CAT, BIRD, RABBIT, FISH, OTHER] }
 *               breed: { type: string, maxLength: 100 }
 *               gender: { type: string, enum: [MALE, FEMALE, UNKNOWN] }
 *               dateOfBirth: { type: string, format: date }
 *               weightKg: { type: number, minimum: 0, maximum: 500 }
 *               avatarUrl: { type: string, format: uri }
 *               notes: { type: string, maxLength: 2000 }
 *           example:
 *             name: Bruno
 *             species: DOG
 *             breed: Labrador Retriever
 *             gender: MALE
 *             dateOfBirth: "2021-05-14"
 *             weightKg: 28.5
 *             avatarUrl: "https://cdn.petmypet.in/pets/bruno-avatar.jpg"
 *             notes: Loves belly rubs, allergic to chicken.
 *     responses:
 *       201:
 *         description: Pet created
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Pet created
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 ownerId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 name: Bruno
 *                 species: DOG
 *                 breed: Labrador Retriever
 *                 gender: MALE
 *                 dateOfBirth: "2021-05-14T00:00:00.000Z"
 *                 weightKg: 28.5
 *                 avatarUrl: "https://cdn.petmypet.in/pets/bruno-avatar.jpg"
 *                 notes: Loves belly rubs, allergic to chicken.
 *                 medicalRecords: []
 *                 vaccinations: []
 *                 createdAt: "2026-08-04T08:00:00.000Z"
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "name is required" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
petRoutes.post('/', validate({ body: createPetSchema }), petController.create);
/**
 * @openapi
 * /pets:
 *   get:
 *     tags: [Pets]
 *     summary: List pets owned by the current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of pets
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   ownerId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   name: Bruno
 *                   species: DOG
 *                   breed: Labrador Retriever
 *                   gender: MALE
 *                   dateOfBirth: "2021-05-14T00:00:00.000Z"
 *                   weightKg: 28.5
 *                   avatarUrl: "https://cdn.petmypet.in/pets/bruno-avatar.jpg"
 *                   notes: Loves belly rubs, allergic to chicken.
 *                   medicalRecords: []
 *                   vaccinations: []
 *                   createdAt: "2026-08-04T08:00:00.000Z"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
petRoutes.get('/', petController.listMine);
/**
 * @openapi
 * /pets/{id}:
 *   get:
 *     tags: [Pets]
 *     summary: Get a pet by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Pet details
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 ownerId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 name: Bruno
 *                 species: DOG
 *                 breed: Labrador Retriever
 *                 gender: MALE
 *                 dateOfBirth: "2021-05-14T00:00:00.000Z"
 *                 weightKg: 28.5
 *                 avatarUrl: "https://cdn.petmypet.in/pets/bruno-avatar.jpg"
 *                 notes: Loves belly rubs, allergic to chicken.
 *                 medicalRecords: []
 *                 vaccinations: []
 *                 createdAt: "2026-08-04T08:00:00.000Z"
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
 */
petRoutes.get('/:id', validate({ params: idParamSchema }), petController.getById);
/**
 * @openapi
 * /pets/{id}:
 *   put:
 *     tags: [Pets]
 *     summary: Update a pet by id
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
 *             properties:
 *               name: { type: string, maxLength: 60 }
 *               species: { type: string, enum: [DOG, CAT, BIRD, RABBIT, FISH, OTHER] }
 *               breed: { type: string, maxLength: 100 }
 *               gender: { type: string, enum: [MALE, FEMALE, UNKNOWN] }
 *               dateOfBirth: { type: string, format: date }
 *               weightKg: { type: number, minimum: 0, maximum: 500 }
 *               avatarUrl: { type: string, format: uri }
 *               notes: { type: string, maxLength: 2000 }
 *           example:
 *             weightKg: 29.2
 *             notes: Started hydrotherapy for hip dysplasia.
 *     responses:
 *       200:
 *         description: Pet updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Pet updated
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 ownerId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 name: Bruno
 *                 species: DOG
 *                 breed: Labrador Retriever
 *                 gender: MALE
 *                 dateOfBirth: "2021-05-14T00:00:00.000Z"
 *                 weightKg: 29.2
 *                 avatarUrl: "https://cdn.petmypet.in/pets/bruno-avatar.jpg"
 *                 notes: Started hydrotherapy for hip dysplasia.
 *                 medicalRecords: []
 *                 vaccinations: []
 *                 createdAt: "2026-08-04T08:00:00.000Z"
 *       400:
 *         description: Invalid request body or id parameter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "weightKg must be a positive number" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
petRoutes.put(
  '/:id',
  validate({ params: idParamSchema, body: updatePetSchema }),
  petController.update,
);
/**
 * @openapi
 * /pets/{id}:
 *   delete:
 *     tags: [Pets]
 *     summary: Delete a pet by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *     responses:
 *       200:
 *         description: Pet deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Pet removed
 *               data: null
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
 */
petRoutes.delete('/:id', validate({ params: idParamSchema }), petController.remove);

/**
 * @openapi
 * /pets/{id}/medical-records:
 *   post:
 *     tags: [Pets]
 *     summary: Add a medical record to a pet
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
 *             required: [title]
 *             properties:
 *               title: { type: string, maxLength: 150 }
 *               description: { type: string, maxLength: 2000, default: "" }
 *               fileUrl: { type: string, format: uri }
 *           example:
 *             title: Annual checkup
 *             description: "Blood work normal, weight stable. Recommended dental cleaning next visit."
 *             fileUrl: "https://cdn.petmypet.in/pets/records/bruno-checkup-2026.pdf"
 *     responses:
 *       201:
 *         description: Medical record added
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Medical record added
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 ownerId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 name: Bruno
 *                 medicalRecords:
 *                   - id: 64f1a2b3c4d5e6f7a8b9c0e9
 *                     title: Annual checkup
 *                     description: "Blood work normal, weight stable. Recommended dental cleaning next visit."
 *                     fileUrl: "https://cdn.petmypet.in/pets/records/bruno-checkup-2026.pdf"
 *                     createdAt: "2026-08-04T08:00:00.000Z"
 *                 vaccinations: []
 *       400:
 *         description: Invalid request body or id parameter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "title is required" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
petRoutes.post(
  '/:id/medical-records',
  validate({ params: idParamSchema, body: addMedicalRecordSchema }),
  petController.addMedicalRecord,
);
/**
 * @openapi
 * /pets/{id}/vaccinations:
 *   post:
 *     tags: [Pets]
 *     summary: Add a vaccination record to a pet
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
 *             required: [name, administeredAt]
 *             properties:
 *               name: { type: string, maxLength: 150 }
 *               administeredAt: { type: string, format: date }
 *               expiresAt: { type: string, format: date }
 *               certificateUrl: { type: string, format: uri }
 *           example:
 *             name: Rabies
 *             administeredAt: "2026-06-01"
 *             expiresAt: "2027-06-01"
 *             certificateUrl: "https://cdn.petmypet.in/pets/certificates/bruno-rabies-2026.pdf"
 *     responses:
 *       201:
 *         description: Vaccination record added
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Vaccination record added
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 ownerId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 name: Bruno
 *                 medicalRecords: []
 *                 vaccinations:
 *                   - id: 64f1a2b3c4d5e6f7a8b9c0ea
 *                     name: Rabies
 *                     administeredAt: "2026-06-01T00:00:00.000Z"
 *                     expiresAt: "2027-06-01T00:00:00.000Z"
 *                     certificateUrl: "https://cdn.petmypet.in/pets/certificates/bruno-rabies-2026.pdf"
 *       400:
 *         description: Invalid request body or id parameter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "administeredAt is required" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
petRoutes.post(
  '/:id/vaccinations',
  validate({ params: idParamSchema, body: addVaccinationSchema }),
  petController.addVaccination,
);

/**
 * @openapi
 * /pets/{id}/medical-records/{recordId}:
 *   delete:
 *     tags: [Pets]
 *     summary: Delete a medical record from a pet
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *       - name: recordId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0e9
 *     responses:
 *       200:
 *         description: Medical record removed
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Medical record removed
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 ownerId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 name: Bruno
 *                 medicalRecords: []
 *                 vaccinations: []
 *       400:
 *         description: Invalid id or recordId parameter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Invalid record id" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Not the owner of this pet
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "You do not have access to this pet" }
 *       404:
 *         description: Pet or medical record not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Medical record not found" }
 */
petRoutes.delete(
  '/:id/medical-records/:recordId',
  validate({ params: recordIdParamSchema }),
  petController.removeMedicalRecord,
);
/**
 * @openapi
 * /pets/{id}/vaccinations/{recordId}:
 *   delete:
 *     tags: [Pets]
 *     summary: Delete a vaccination record from a pet
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
 *       - name: recordId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: 64f1a2b3c4d5e6f7a8b9c0ea
 *     responses:
 *       200:
 *         description: Vaccination removed
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Vaccination removed
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 ownerId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 name: Bruno
 *                 medicalRecords: []
 *                 vaccinations: []
 *       400:
 *         description: Invalid id or recordId parameter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "Invalid record id" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Not the owner of this pet
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: FORBIDDEN, message: "You do not have access to this pet" }
 *       404:
 *         description: Pet or vaccination not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: NOT_FOUND, message: "Vaccination not found" }
 */
petRoutes.delete(
  '/:id/vaccinations/:recordId',
  validate({ params: recordIdParamSchema }),
  petController.removeVaccination,
);

/**
 * @openapi
 * /pets/{id}/companion-profile:
 *   put:
 *     tags: [Pets]
 *     summary: Create or update a pet's companion (playdate) profile
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
 *             properties:
 *               isEnabled: { type: boolean, default: false }
 *               bio: { type: string, maxLength: 1000 }
 *               personalityTraits: { type: array, items: { type: string } }
 *               interests: { type: array, items: { type: string } }
 *               lookingFor: { type: array, items: { type: string } }
 *               activityLevel: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *               temperament: { type: string }
 *               getsAlongWith:
 *                 type: object
 *                 properties:
 *                   dogs: { type: boolean }
 *                   cats: { type: boolean }
 *                   kids: { type: boolean }
 *                   families: { type: boolean }
 *           example:
 *             isEnabled: true
 *             bio: Bruno loves fetch and making new furry friends at the park.
 *             personalityTraits: [playful, friendly, energetic]
 *             interests: [fetch, swimming, long walks]
 *             lookingFor: [playdates, running buddy]
 *             activityLevel: HIGH
 *             temperament: Gentle with smaller dogs
 *             getsAlongWith: { dogs: true, cats: false, kids: true, families: true }
 *     responses:
 *       200:
 *         description: Companion profile updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Companion profile updated
 *               data:
 *                 id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                 ownerId: 64f1a2b3c4d5e6f7a8b9c0d2
 *                 name: Bruno
 *                 species: DOG
 *                 breed: Labrador Retriever
 *                 gender: MALE
 *                 dateOfBirth: "2021-05-14T00:00:00.000Z"
 *                 weightKg: 28.5
 *                 avatarUrl: "https://cdn.petmypet.in/pets/bruno-avatar.jpg"
 *                 notes: Loves belly rubs, allergic to chicken.
 *                 medicalRecords: []
 *                 vaccinations: []
 *                 companionProfile:
 *                   isEnabled: true
 *                   bio: Bruno loves fetch and making new furry friends at the park.
 *                   personalityTraits: [playful, friendly, energetic]
 *                   interests: [fetch, swimming, long walks]
 *                   lookingFor: [playdates, running buddy]
 *                   activityLevel: HIGH
 *                   temperament: Gentle with smaller dogs
 *                   getsAlongWith: { dogs: true, cats: false, kids: true, families: true }
 *                 createdAt: "2026-08-04T08:00:00.000Z"
 *       400:
 *         description: Invalid request body or id parameter
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "bio must be at most 1000 characters" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 *       403:
 *         description: Not the owner of this pet
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
petRoutes.put(
  '/:id/companion-profile',
  validate({ params: idParamSchema, body: updateCompanionProfileSchema }),
  petController.updateCompanionProfile,
);

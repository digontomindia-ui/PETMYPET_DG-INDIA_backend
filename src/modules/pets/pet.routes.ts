import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { petController } from './pet.controller.js';
import {
  addMedicalRecordSchema,
  addVaccinationSchema,
  createPetSchema,
  idParamSchema,
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: Medical record added }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       201: { description: Vaccination record added }
 */
petRoutes.post(
  '/:id/vaccinations',
  validate({ params: idParamSchema, body: addVaccinationSchema }),
  petController.addVaccination,
);

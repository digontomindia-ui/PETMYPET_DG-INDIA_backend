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
 *     responses:
 *       201: { description: Pet created }
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
 *       200: { description: List of pets }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Pet details }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Pet updated }
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
 *       - { name: id, in: path, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Pet deleted }
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

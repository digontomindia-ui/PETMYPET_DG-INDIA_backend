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

petRoutes.post('/', validate({ body: createPetSchema }), petController.create);
petRoutes.get('/', petController.listMine);
petRoutes.get('/:id', validate({ params: idParamSchema }), petController.getById);
petRoutes.put(
  '/:id',
  validate({ params: idParamSchema, body: updatePetSchema }),
  petController.update,
);
petRoutes.delete('/:id', validate({ params: idParamSchema }), petController.remove);

petRoutes.post(
  '/:id/medical-records',
  validate({ params: idParamSchema, body: addMedicalRecordSchema }),
  petController.addMedicalRecord,
);
petRoutes.post(
  '/:id/vaccinations',
  validate({ params: idParamSchema, body: addVaccinationSchema }),
  petController.addVaccination,
);

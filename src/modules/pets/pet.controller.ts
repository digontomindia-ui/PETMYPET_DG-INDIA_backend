import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { petService } from './pet.service.js';
import type {
  AddActivityInput,
  AddMedicalRecordInput,
  AddVaccinationInput,
  CreatePetInput,
  UpdateCompanionProfileInput,
  UpdatePetInput,
} from './pet.dto.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const petController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const pet = await petService.create(userId, req.body as CreatePetInput);
    sendSuccess(res, HTTP_STATUS.CREATED, pet, 'Pet created');
  }),

  listMine: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const pets = await petService.listMine(userId);
    sendSuccess(res, HTTP_STATUS.OK, pets);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const pet = await petService.getById(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, pet);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const pet = await petService.update(
      req.params.id as string,
      userId,
      role,
      req.body as UpdatePetInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, pet, 'Pet updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    await petService.remove(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Pet removed');
  }),

  addMedicalRecord: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const pet = await petService.addMedicalRecord(
      req.params.id as string,
      userId,
      role,
      req.body as AddMedicalRecordInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, pet, 'Medical record added');
  }),

  addVaccination: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const pet = await petService.addVaccination(
      req.params.id as string,
      userId,
      role,
      req.body as AddVaccinationInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, pet, 'Vaccination added');
  }),

  removeMedicalRecord: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const pet = await petService.removeMedicalRecord(
      req.params.id as string,
      userId,
      role,
      req.params.recordId as string,
    );
    sendSuccess(res, HTTP_STATUS.OK, pet, 'Medical record removed');
  }),

  removeVaccination: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const pet = await petService.removeVaccination(
      req.params.id as string,
      userId,
      role,
      req.params.recordId as string,
    );
    sendSuccess(res, HTTP_STATUS.OK, pet, 'Vaccination removed');
  }),

  addActivity: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const pet = await petService.addActivity(
      req.params.id as string,
      userId,
      role,
      req.body as AddActivityInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, pet, 'Activity added');
  }),

  removeActivity: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const pet = await petService.removeActivity(
      req.params.id as string,
      userId,
      role,
      req.params.activityId as string,
    );
    sendSuccess(res, HTTP_STATUS.OK, pet, 'Activity removed');
  }),

  updateCompanionProfile: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    const pet = await petService.updateCompanionProfile(
      req.params.id as string,
      userId,
      role,
      req.body as UpdateCompanionProfileInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, pet, 'Companion profile updated');
  }),
};

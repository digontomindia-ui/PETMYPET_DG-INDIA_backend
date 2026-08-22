import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { userService } from './user.service.js';
import type {
  AddressInput,
  RegisterDeviceTokenInput,
  UpdateAddressInput,
  UpdateProfileInput,
} from './user.dto.js';

function requireAuth(req: Request): { userId: string } {
  if (!req.user) throw AppError.unauthorized();
  return { userId: req.user.userId };
}

export const userController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const user = await userService.getById(userId);
    sendSuccess(res, HTTP_STATUS.OK, user);
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const user = await userService.updateProfile(userId, req.body as UpdateProfileInput);
    sendSuccess(res, HTTP_STATUS.OK, user, 'Profile updated');
  }),

  deleteMe: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    await userService.deleteOwnAccount(userId);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Account deleted');
  }),

  addAddress: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const user = await userService.addAddress(userId, req.body as AddressInput);
    sendSuccess(res, HTTP_STATUS.CREATED, user, 'Address added');
  }),

  updateAddress: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const user = await userService.updateAddress(
      userId,
      req.params.addressId as string,
      req.body as UpdateAddressInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, user, 'Address updated');
  }),

  removeAddress: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const user = await userService.removeAddress(userId, req.params.addressId as string);
    sendSuccess(res, HTTP_STATUS.OK, user, 'Address removed');
  }),

  registerDeviceToken: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { deviceToken } = req.body as RegisterDeviceTokenInput;
    await userService.registerDeviceToken(userId, deviceToken);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Device registered');
  }),

  removeDeviceToken: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { deviceToken } = req.body as RegisterDeviceTokenInput;
    await userService.removeDeviceToken(userId, deviceToken);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Device removed');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getById(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, user);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { users, total, page, limit } = await userService.listUsers(req.query);
    sendSuccess(res, HTTP_STATUS.OK, users, 'Success', buildPaginationMeta(page, limit, total));
  }),

  block: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const user = await userService.blockUser(userId, req.params.id as string, true);
    sendSuccess(res, HTTP_STATUS.OK, user, 'User blocked');
  }),

  unblock: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const user = await userService.blockUser(userId, req.params.id as string, false);
    sendSuccess(res, HTTP_STATUS.OK, user, 'User unblocked');
  }),

  deleteById: asyncHandler(async (req: Request, res: Response) => {
    await userService.deleteUserById(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, null, 'User deleted');
  }),
};

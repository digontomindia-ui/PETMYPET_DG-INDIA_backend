import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { auditLogService } from '../admin/admin.service.js';
import { AUDIT_ACTIONS } from '../admin/admin.constants.js';
import { userRepository } from './user.repository.js';
import { toPublicUser } from './user.mapper.js';
import type {
  AddressInput,
  ListUsersQuery,
  UpdateAddressInput,
  UpdateProfileInput,
} from './user.dto.js';
import type { PublicUser } from './user.types.js';

export const userService = {
  async getById(userId: string): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    return toPublicUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');

    if (input.name !== undefined) user.name = input.name;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl;
    if (input.preferences) {
      user.preferences = { ...user.preferences, ...input.preferences };
    }

    await user.save();
    return toPublicUser(user);
  },

  async addAddress(userId: string, input: AddressInput): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');

    if (input.isDefault) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    user.addresses.push({
      label: input.label,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      location: { type: 'Point', coordinates: input.coordinates },
      isDefault: input.isDefault || user.addresses.length === 0,
    });

    await user.save();
    return toPublicUser(user);
  },

  async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateAddressInput,
  ): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');

    const address = user.addresses.id(addressId);
    if (!address) throw AppError.notFound('Address not found');

    if (input.isDefault) {
      user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    if (input.label !== undefined) address.label = input.label;
    if (input.addressLine1 !== undefined) address.addressLine1 = input.addressLine1;
    if (input.addressLine2 !== undefined) address.addressLine2 = input.addressLine2;
    if (input.city !== undefined) address.city = input.city;
    if (input.state !== undefined) address.state = input.state;
    if (input.postalCode !== undefined) address.postalCode = input.postalCode;
    if (input.country !== undefined) address.country = input.country;
    if (input.coordinates !== undefined) {
      address.location = { type: 'Point', coordinates: input.coordinates };
    }
    if (input.isDefault !== undefined) address.isDefault = input.isDefault;

    await user.save();
    return toPublicUser(user);
  },

  async removeAddress(userId: string, addressId: string): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');

    const address = user.addresses.id(addressId);
    if (!address) throw AppError.notFound('Address not found');
    address.deleteOne();

    await user.save();
    return toPublicUser(user);
  },

  async registerDeviceToken(userId: string, deviceToken: string): Promise<void> {
    await userRepository.updateById(userId, { $addToSet: { deviceTokens: deviceToken } });
  },

  async removeDeviceToken(userId: string, deviceToken: string): Promise<void> {
    await userRepository.updateById(userId, { $pull: { deviceTokens: deviceToken } });
  },

  async deleteOwnAccount(userId: string): Promise<void> {
    const deleted = await userRepository.softDeleteById(userId);
    if (!deleted) throw AppError.notFound('User not found');
  },

  async listUsers(
    query: ListUsersQuery,
  ): Promise<{ users: PublicUser[]; total: number; page: number; limit: number }> {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};
    if (query.role) filter.role = query.role;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { phone: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      userRepository.findMany(filter, { skip, limit, sort: { createdAt: -1 } }),
      userRepository.count(filter),
    ]);

    return { users: users.map(toPublicUser), total, page, limit };
  },

  async blockUser(actorId: string, userId: string, isBlocked: boolean): Promise<PublicUser> {
    const user = await userRepository.updateById(userId, { isBlocked });
    if (!user) throw AppError.notFound('User not found');
    await auditLogService.record(
      actorId,
      isBlocked ? AUDIT_ACTIONS.USER_BLOCKED : AUDIT_ACTIONS.USER_UNBLOCKED,
      'User',
      userId,
    );
    return toPublicUser(user);
  },

  async deleteUserById(userId: string): Promise<void> {
    const deleted = await userRepository.softDeleteById(userId);
    if (!deleted) throw AppError.notFound('User not found');
  },
};

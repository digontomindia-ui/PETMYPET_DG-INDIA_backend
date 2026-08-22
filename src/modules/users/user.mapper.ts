import type { PublicUser, UserDocument } from './user.types.js';

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isVerified: user.isVerified,
    isBlocked: user.isBlocked,
    addresses: user.addresses,
    preferences: user.preferences,
    referralCode: user.referralCode ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

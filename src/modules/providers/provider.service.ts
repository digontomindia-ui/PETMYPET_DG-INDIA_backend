import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { ROLES } from '../../common/constants/roles.js';
import { userRepository } from '../users/user.repository.js';
import { providerRepository } from './provider.repository.js';
import { toPublicProvider } from './provider.mapper.js';
import { KYC_STATUSES } from './provider.constants.js';
import type {
  CreateProviderProfileInput,
  NearbyProvidersQuery,
  RejectKycInput,
  SetBankAccountInput,
  UpdateProviderProfileInput,
  UploadKycDocumentInput,
} from './provider.dto.js';
import type { ProviderDocument } from './provider.types.js';
import type { ProviderType } from '../../common/constants/roles.js';

const DEFAULT_RADIUS_METERS = 15_000;

async function requireOwnProvider(userId: string): Promise<ProviderDocument> {
  const provider = await providerRepository.findByUserId(userId);
  if (!provider) throw AppError.notFound('Provider profile not found');
  return provider;
}

export const providerService = {
  async createProfile(userId: string, input: CreateProviderProfileInput) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    if (user.role !== ROLES.SERVICE_PROVIDER) {
      throw AppError.forbidden('Only service provider accounts can create a provider profile');
    }

    const existing = await providerRepository.findByUserId(userId);
    if (existing) throw AppError.conflict('A provider profile already exists for this account');

    const provider = await providerRepository.create({
      userId: user._id,
      providerType: input.providerType,
      businessName: input.businessName,
      description: input.description,
      zoneIds: input.zoneIds.map((id) => new Types.ObjectId(id)),
      location: { type: 'Point', coordinates: input.coordinates },
      address: input.address,
      workingHours: input.workingHours,
      metadata: input.metadata,
    });

    return toPublicProvider(provider);
  },

  async getMyProfile(userId: string) {
    const provider = await requireOwnProvider(userId);
    return toPublicProvider(provider);
  },

  async updateMyProfile(userId: string, input: UpdateProviderProfileInput) {
    const provider = await requireOwnProvider(userId);

    if (input.businessName !== undefined) provider.businessName = input.businessName;
    if (input.description !== undefined) provider.description = input.description;
    if (input.address !== undefined) provider.address = input.address;
    if (input.workingHours !== undefined) provider.workingHours = input.workingHours;
    if (input.zoneIds !== undefined)
      provider.zoneIds = input.zoneIds.map((id) => new Types.ObjectId(id));
    if (input.coordinates !== undefined) {
      provider.location = { type: 'Point', coordinates: input.coordinates };
    }
    if (input.metadata !== undefined) {
      provider.metadata = { ...provider.metadata, ...input.metadata };
    }

    await provider.save();
    return toPublicProvider(provider);
  },

  async getById(id: string) {
    const provider = await providerRepository.findById(id);
    if (!provider) throw AppError.notFound('Provider not found');
    return toPublicProvider(provider);
  },

  async setActive(userId: string, isActive: boolean) {
    const provider = await requireOwnProvider(userId);
    provider.isActive = isActive;
    await provider.save();
    return toPublicProvider(provider);
  },

  async uploadKycDocument(userId: string, input: UploadKycDocumentInput) {
    const provider = await requireOwnProvider(userId);
    provider.kycDocuments.push({ type: input.type, url: input.url, uploadedAt: new Date() });
    if (provider.kycStatus === KYC_STATUSES.REJECTED) {
      provider.kycStatus = KYC_STATUSES.PENDING;
      provider.kycRejectionReason = null;
    }
    await provider.save();
    return toPublicProvider(provider);
  },

  async removeKycDocument(userId: string, documentId: string) {
    const provider = await requireOwnProvider(userId);
    const document = provider.kycDocuments.id(documentId);
    if (!document) throw AppError.notFound('KYC document not found');
    document.deleteOne();
    await provider.save();
    return toPublicProvider(provider);
  },

  async setBankAccount(userId: string, input: SetBankAccountInput) {
    const provider = await requireOwnProvider(userId);
    provider.bankAccount = input;
    await provider.save();
    return toPublicProvider(provider);
  },

  async checkIn(userId: string) {
    const provider = await requireOwnProvider(userId);
    const today = new Date().toISOString().slice(0, 10);

    const openEntry = provider.attendance.find(
      (entry) => entry.date === today && !entry.checkOutAt,
    );
    if (openEntry) throw AppError.conflict('Already checked in for today');

    provider.attendance.push({ date: today, checkInAt: new Date(), checkOutAt: null });
    await provider.save();
    return toPublicProvider(provider);
  },

  async checkOut(userId: string) {
    const provider = await requireOwnProvider(userId);
    const today = new Date().toISOString().slice(0, 10);

    const openEntry = provider.attendance.find(
      (entry) => entry.date === today && !entry.checkOutAt,
    );
    if (!openEntry) throw AppError.badRequest('No open check-in found for today');

    openEntry.checkOutAt = new Date();
    await provider.save();
    return toPublicProvider(provider);
  },

  async listPendingKyc(query: { page?: string; limit?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const filter = { kycStatus: KYC_STATUSES.PENDING };
    const [providers, total] = await Promise.all([
      providerRepository.findMany(filter, { skip, limit, sort: { createdAt: 1 } }),
      providerRepository.count(filter),
    ]);
    return { providers: providers.map(toPublicProvider), total, page, limit };
  },

  async approveKyc(id: string) {
    const provider = await providerRepository.updateById(id, {
      kycStatus: KYC_STATUSES.APPROVED,
      kycRejectionReason: null,
    });
    if (!provider) throw AppError.notFound('Provider not found');
    return toPublicProvider(provider);
  },

  async rejectKyc(id: string, input: RejectKycInput) {
    const provider = await providerRepository.updateById(id, {
      kycStatus: KYC_STATUSES.REJECTED,
      kycRejectionReason: input.reason,
    });
    if (!provider) throw AppError.notFound('Provider not found');
    return toPublicProvider(provider);
  },

  async listNearby(query: NearbyProvidersQuery) {
    const { page, limit, skip } = parsePagination(query);
    const providers = await providerRepository.findNearby({
      lat: Number(query.lat),
      lng: Number(query.lng),
      radiusMeters: query.radiusMeters ? Number(query.radiusMeters) : DEFAULT_RADIUS_METERS,
      providerType: query.providerType as ProviderType | undefined,
      skip,
      limit,
    });
    return { providers: providers.map(toPublicProvider), page, limit };
  },
};

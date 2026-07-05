import type { ProviderDocument, PublicProvider } from './provider.types.js';

export function toPublicProvider(provider: ProviderDocument): PublicProvider {
  return {
    id: provider._id.toString(),
    userId: provider.userId.toString(),
    providerType: provider.providerType,
    businessName: provider.businessName,
    description: provider.description,
    kycStatus: provider.kycStatus,
    zoneIds: provider.zoneIds.map((id) => id.toString()),
    location: provider.location,
    address: provider.address,
    workingHours: provider.workingHours,
    metadata: provider.metadata,
    commissionPercent: provider.commissionPercent,
    rating: provider.rating,
    ratingCount: provider.ratingCount,
    isActive: provider.isActive,
    createdAt: provider.createdAt,
  };
}

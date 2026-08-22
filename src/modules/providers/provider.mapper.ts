import type {
  IAttendanceEntry,
  IBankAccount,
  IKycDocument,
  ProviderDocument,
  PublicAttendanceEntry,
  PublicBankAccount,
  PublicKycDocument,
  PublicProvider,
  PublicProviderSummary,
} from './provider.types.js';

const MAX_ATTENDANCE_ENTRIES = 30;

function maskBankAccount(bankAccount: IBankAccount | null): PublicBankAccount | null {
  if (!bankAccount) return null;
  return {
    accountHolderName: bankAccount.accountHolderName,
    bankName: bankAccount.bankName,
    last4: bankAccount.accountNumber.slice(-4),
  };
}

export function mapKycDocument(doc: IKycDocument): PublicKycDocument {
  return { id: doc._id.toString(), type: doc.type, url: doc.url, uploadedAt: doc.uploadedAt };
}

export function mapAttendanceEntry(entry: IAttendanceEntry): PublicAttendanceEntry {
  return {
    id: entry._id.toString(),
    date: entry.date,
    checkInAt: entry.checkInAt,
    checkOutAt: entry.checkOutAt,
  };
}

/** Newest-first, capped to the most recent MAX_ATTENDANCE_ENTRIES. */
export function mapRecentAttendance(entries: IAttendanceEntry[]): PublicAttendanceEntry[] {
  return [...entries]
    .sort((a, b) => b.checkInAt.getTime() - a.checkInAt.getTime())
    .slice(0, MAX_ATTENDANCE_ENTRIES)
    .map(mapAttendanceEntry);
}

export function toPublicProvider(provider: ProviderDocument): PublicProvider {
  return {
    id: provider._id.toString(),
    userId: provider.userId.toString(),
    providerType: provider.providerType,
    businessName: provider.businessName,
    description: provider.description,
    experienceYears: provider.experienceYears,
    languages: provider.languages,
    kycStatus: provider.kycStatus,
    kycRejectionReason: provider.kycRejectionReason,
    kycDocuments: provider.kycDocuments.map(mapKycDocument),
    zoneIds: provider.zoneIds.map((id) => id.toString()),
    location: provider.location,
    address: provider.address,
    workingHours: provider.workingHours,
    unavailableDates: provider.unavailableDates.map((date) => date.toISOString().slice(0, 10)),
    metadata: provider.metadata,
    bankAccount: maskBankAccount(provider.bankAccount),
    commissionPercent: provider.commissionPercent,
    rating: provider.rating,
    ratingCount: provider.ratingCount,
    isActive: provider.isActive,
    attendance: mapRecentAttendance(provider.attendance),
    createdAt: provider.createdAt,
  };
}

/** For public browsing endpoints — see `PublicProviderSummary` for what's deliberately left out. */
export function toPublicProviderSummary(provider: ProviderDocument): PublicProviderSummary {
  const full = toPublicProvider(provider);
  return {
    id: full.id,
    userId: full.userId,
    providerType: full.providerType,
    businessName: full.businessName,
    description: full.description,
    experienceYears: full.experienceYears,
    languages: full.languages,
    kycStatus: full.kycStatus,
    zoneIds: full.zoneIds,
    location: full.location,
    address: full.address,
    workingHours: full.workingHours,
    unavailableDates: full.unavailableDates,
    metadata: full.metadata,
    commissionPercent: full.commissionPercent,
    rating: full.rating,
    ratingCount: full.ratingCount,
    isActive: full.isActive,
    createdAt: full.createdAt,
  };
}

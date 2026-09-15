import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { generateOtpCode } from '../../common/utils/otp.js';
import { sendSms } from '../../common/integrations/sms.js';
import { ROLES, PROVIDER_TYPES } from '../../common/constants/roles.js';
import { userRepository } from '../users/user.repository.js';
import { UserModel } from '../users/user.schema.js';
import { PetModel } from '../pets/pet.schema.js';
import { ServiceModel } from '../services/service.schema.js';
import { ZoneModel } from '../zones/zone.schema.js';
import { providerRepository } from '../providers/provider.repository.js';
import { providerService } from '../providers/provider.service.js';
import { KYC_DOCUMENT_TYPES, KYC_STATUSES } from '../providers/provider.constants.js';
import { bookingRepository } from '../bookings/booking.repository.js';
import { BookingModel } from '../bookings/booking.schema.js';
import { BOOKING_STATUSES, WALK_SOCKET_EVENTS } from '../bookings/booking.constants.js';
import { computeAmounts } from '../bookings/booking.service.js';
import { bookingService } from '../bookings/booking.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { NOTIFICATION_TYPES } from '../notifications/notification.constants.js';
import { referralService } from '../referrals/referral.service.js';
import { tryGetSocketServer } from '../../sockets/index.js';
import { chatService } from '../chat/chat.service.js';
import {
  issueOtp as issueAuthOtp,
  verifyOtp as verifyAuthOtp,
  issueTokens,
} from '../auth/auth.service.js';
import { OTP_PURPOSES } from '../auth/auth.constants.js';
import type { DeviceInfo } from '../auth/auth.dto.js';
import {
  ROLE_SLUG_TO_PROVIDER_TYPE,
  roleSlugForProviderType,
  SESSION_ACTIVE_STATUSES,
  SESSION_START_STATUSES,
} from './provider-app.constants.js';
import type {
  AppointmentsQuery,
  MessageHistoryQuery,
  MyAppointmentsQuery,
  PatientsQuery,
  ProviderAppAnalyticsQuery,
  ProviderVerifyOtpInput,
  SessionOtpInput,
  SigninSignupInput,
  TrainerDashboardQuery,
  UploadDocumentsInput,
  UploadTrainingProcessInput,
} from './provider-app.dto.js';
import {
  mapBoardingHome,
  mapGenericProfile,
  mapGroomerHome,
  mapInboxItem,
  mapMessageHistory,
  mapPatients,
  mapSitterAnalytics,
  mapSitterAppointments,
  mapSitterHome,
  mapTrainerAnalytics,
  mapTrainerAppointments,
  mapTrainerDashboard,
  mapVetAppointments,
  mapVetHome,
  mapVetProfile,
  mapWalkerAnalytics,
  mapWalkerAppointments,
  mapWalkerHome,
  type EnrichedBooking,
} from './provider-app.mapper.js';
import type { ProviderAnalytics, ProviderDocument } from '../providers/provider.types.js';
import type { BookingDocument } from '../bookings/booking.types.js';
import type { UserDocument } from '../users/user.types.js';

const ACTIVE_STATUSES = [
  BOOKING_STATUSES.PENDING,
  BOOKING_STATUSES.ACCEPTED,
  BOOKING_STATUSES.ON_THE_WAY,
  BOOKING_STATUSES.STARTED,
];

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function sumEarnings(analytics: ProviderAnalytics): number {
  return analytics.earningsByDay.reduce((sum, day) => sum + day.amount, 0);
}

/** Spec's date query param is `DD-MM-YY` (e.g. "05-09-26"); returns the [00:00, 23:59:59.999]
 * range for that calendar day, or {} if unparseable/absent so the caller falls back to "all". */
function dayRangeFor(dateStr: string | undefined): { from?: Date; to?: Date } {
  if (!dateStr) return {};
  const match = /^(\d{2})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return {};
  const [, dd, mm, yy] = match;
  const from = new Date(`20${yy}-${mm}-${dd}T00:00:00.000Z`);
  const to = new Date(`20${yy}-${mm}-${dd}T23:59:59.999Z`);
  if (Number.isNaN(from.getTime())) return {};
  return { from, to };
}

async function requireOwnProvider(userId: string): Promise<ProviderDocument> {
  const provider = await providerRepository.findByUserId(userId);
  if (!provider) throw AppError.notFound('Provider profile not found');
  return provider;
}

async function requireContext(userId: string) {
  const [user, provider] = await Promise.all([
    userRepository.findById(userId),
    providerRepository.findByUserId(userId),
  ]);
  if (!user) throw AppError.notFound('User not found');
  if (!provider) throw AppError.notFound('Provider profile not found');
  return { user, provider };
}

/** Batch-fetches pet/owner/service details for a page of bookings — the raw booking doc only
 * carries ObjectId references, but every provider-app screen needs pet name/image, owner name,
 * and the service label embedded directly on each item. */
async function enrichBookings(bookings: BookingDocument[]): Promise<EnrichedBooking[]> {
  if (bookings.length === 0) return [];

  const petIds = [...new Set(bookings.filter((b) => b.petId).map((b) => b.petId!.toString()))];
  const userIds = [...new Set(bookings.map((b) => b.userId.toString()))];
  const serviceIds = [...new Set(bookings.map((b) => b.serviceId.toString()))];

  const [pets, owners, services] = await Promise.all([
    PetModel.find({ _id: { $in: petIds } }).select('name breed avatarUrl').lean(),
    UserModel.find({ _id: { $in: userIds } }).select('name phone addresses').lean(),
    ServiceModel.find({ _id: { $in: serviceIds } }).select('name').lean(),
  ]);
  const petById = new Map(pets.map((p) => [p._id.toString(), p]));
  const ownerById = new Map(owners.map((u) => [u._id.toString(), u]));
  const serviceById = new Map(services.map((s) => [s._id.toString(), s]));

  return bookings.map((booking) => {
    const pet = booking.petId ? petById.get(booking.petId.toString()) : undefined;
    const owner = ownerById.get(booking.userId.toString());
    const service = serviceById.get(booking.serviceId.toString());
    const defaultAddress = owner?.addresses.find((a) => a.isDefault) ?? owner?.addresses[0];

    return {
      id: booking._id.toString(),
      status: booking.status,
      scheduledStart: booking.scheduledStart,
      scheduledEnd: booking.scheduledEnd,
      createdAt: booking.createdAt,
      location: defaultAddress ? `${defaultAddress.addressLine1}, ${defaultAddress.city}` : '',
      pet: pet
        ? { id: pet._id.toString(), name: pet.name, breed: pet.breed, avatarUrl: pet.avatarUrl }
        : null,
      owner: owner ? { id: owner._id.toString(), name: owner.name, phone: owner.phone } : null,
      serviceName: service?.name ?? '',
    };
  });
}

async function fetchBookingsForProvider(
  providerId: string,
  statuses: string[] | undefined,
  limit = 100,
): Promise<EnrichedBooking[]> {
  const { items } = await bookingRepository.findForProvider(providerId, statuses, {}, 0, limit);
  return enrichBookings(items);
}

/** Applies the role-specific subset of upload-documents fields onto a shell provider profile
 * created at verify-otp time; each branch mutates in place, common fields (documents/media) are
 * applied once at the end. */
function applyRoleFields(
  provider: ProviderDocument,
  user: UserDocument,
  input: UploadDocumentsInput,
): void {
  switch (provider.providerType) {
    case PROVIDER_TYPES.CLINIC: {
      if (!input.clinic_name) throw AppError.badRequest('clinic_name is required');
      provider.businessName = input.clinic_name;
      provider.description = input.description ?? provider.description;
      if (input.founded && provider.experienceYears === null) {
        const foundedYear = Number.parseInt(input.founded, 10);
        if (!Number.isNaN(foundedYear)) {
          provider.experienceYears = Math.max(0, new Date().getFullYear() - foundedYear);
        }
      }
      if (input.specialization) {
        provider.metadata.vet = {
          specializations: [input.specialization],
          consultationFee: provider.metadata.vet?.consultationFee ?? 0,
          licenseNumber: provider.metadata.vet?.licenseNumber ?? '',
          supportsVideoConsultation: provider.metadata.vet?.supportsVideoConsultation ?? false,
        };
      }
      if (input.clinic_images) provider.galleryUrls = input.clinic_images;
      break;
    }
    case PROVIDER_TYPES.BOARDING: {
      if (!input.boarding_name) throw AppError.badRequest('boarding_name is required');
      provider.businessName = input.boarding_name;
      provider.description = input.description ?? provider.description;
      if (input.clinic_images) provider.galleryUrls = input.clinic_images;
      break;
    }
    case PROVIDER_TYPES.VET: {
      if (!input.name) throw AppError.badRequest('name is required');
      provider.businessName = input.name;
      provider.experienceYears = input.experience ?? provider.experienceYears;
      provider.description = input.bio ?? provider.description;
      provider.profileImageUrl = input.profile_image ?? provider.profileImageUrl;
      if (input.email) user.email = input.email;
      if (input.specialization) {
        provider.metadata.vet = {
          specializations: [input.specialization],
          consultationFee: provider.metadata.vet?.consultationFee ?? 0,
          licenseNumber: provider.metadata.vet?.licenseNumber ?? '',
          supportsVideoConsultation: provider.metadata.vet?.supportsVideoConsultation ?? false,
        };
      }
      break;
    }
    case PROVIDER_TYPES.TRAINER: {
      if (!input.name) throw AppError.badRequest('name is required');
      provider.businessName = input.name;
      provider.experienceYears = input.experience ?? provider.experienceYears;
      provider.description = input.bio ?? provider.description;
      provider.profileImageUrl = input.profile_image ?? provider.profileImageUrl;
      if (input.email) user.email = input.email;
      if (input.media) provider.galleryUrls = input.media;
      break;
    }
    default: {
      // GROOMER, PET_WALKER, PET_SITTER all share this shape.
      if (!input.name) throw AppError.badRequest('name is required');
      provider.businessName = input.name;
      provider.experienceYears = input.experience ?? provider.experienceYears;
      provider.description = input.bio ?? provider.description;
      provider.profileImageUrl = input.profile_image ?? provider.profileImageUrl;
      if (input.email) user.email = input.email;
      if (provider.providerType === PROVIDER_TYPES.GROOMER && input.specialization) {
        provider.metadata.groomer = { specializations: [input.specialization] };
      }
    }
  }

  if (input.documents) {
    const now = new Date();
    if (input.documents.adhar_card) {
      provider.kycDocuments.push({
        type: KYC_DOCUMENT_TYPES.GOVERNMENT_ID,
        url: input.documents.adhar_card,
        uploadedAt: now,
      });
    }
    if (input.documents.pan_card) {
      provider.kycDocuments.push({
        type: KYC_DOCUMENT_TYPES.GOVERNMENT_ID,
        url: input.documents.pan_card,
        uploadedAt: now,
      });
    }
  }
}

export const providerAppService = {
  async signinSignup(input: SigninSignupInput): Promise<void> {
    const providerType = ROLE_SLUG_TO_PROVIDER_TYPE[input.role];
    let user = await userRepository.findByPhone(input.phone);

    if (user) {
      if (user.role !== ROLES.SERVICE_PROVIDER) {
        throw AppError.conflict('This phone number is already registered as a customer account');
      }
      const existingProvider = await providerRepository.findByUserId(user._id.toString());
      if (existingProvider && existingProvider.providerType !== providerType) {
        const existingSlug = roleSlugForProviderType(existingProvider.providerType);
        throw AppError.conflict(
          `This phone number is already registered as a${existingSlug ? ` "${existingSlug}"` : ''} account`,
        );
      }
    } else {
      user = await userRepository.create({
        phone: input.phone,
        role: ROLES.SERVICE_PROVIDER,
        name: '',
        isVerified: false,
      });
    }

    if (input.fcm_token && !user.deviceTokens.includes(input.fcm_token)) {
      user.deviceTokens.push(input.fcm_token);
      await user.save();
    }

    await issueAuthOtp(input.phone, OTP_PURPOSES.PROVIDER_LOGIN);
  },

  async verifyOtp(input: ProviderVerifyOtpInput, deviceInfo: DeviceInfo) {
    const providerType = ROLE_SLUG_TO_PROVIDER_TYPE[input.role];
    const user = await userRepository.findByPhone(input.phone);
    if (!user) throw AppError.badRequest('No pending signup found for this phone number');

    await verifyAuthOtp(input.phone, OTP_PURPOSES.PROVIDER_LOGIN, input.otp);

    user.isVerified = true;
    await user.save();

    let provider = await providerRepository.findByUserId(user._id.toString());
    if (!provider) {
      // Mongoose's `required: true` on a String field rejects '' (not just null/undefined) —
      // placeholders here, overwritten for real by upload-documents right after.
      provider = await providerRepository.create({
        userId: user._id,
        providerType,
        businessName: 'Pending onboarding',
        description: '',
        location: { type: 'Point', coordinates: [0, 0] },
        address: 'Pending onboarding',
      });
    }

    const tokens = await issueTokens(user, deviceInfo);
    return {
      token: tokens.accessToken,
      isDocumentSubmited: provider.kycDocuments.length > 0,
      isDocumentApproved: provider.kycStatus === KYC_STATUSES.APPROVED,
    };
  },

  async uploadDocuments(userId: string, input: UploadDocumentsInput): Promise<void> {
    const provider = await requireOwnProvider(userId);
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');

    applyRoleFields(provider, user, input);

    if (provider.kycStatus === KYC_STATUSES.REJECTED) {
      provider.kycStatus = KYC_STATUSES.PENDING;
      provider.kycRejectionReason = null;
    }

    await Promise.all([provider.save(), user.save()]);
  },

  async getHome(userId: string) {
    const { user, provider } = await requireContext(userId);
    const providerId = provider._id.toString();
    const today = new Date();

    if (provider.providerType === PROVIDER_TYPES.TRAINER) {
      return this.getTrainerDashboard(userId, {});
    }

    if (provider.providerType === PROVIDER_TYPES.PET_SITTER) {
      const analytics = await providerService.getMyAnalytics(userId, { range: 'week' });
      const active = await fetchBookingsForProvider(providerId, ACTIVE_STATUSES, 5);
      return mapSitterHome(user, provider, sumEarnings(analytics), active);
    }

    if (provider.providerType === PROVIDER_TYPES.PET_WALKER) {
      const active = await fetchBookingsForProvider(providerId, ACTIVE_STATUSES, 50);
      const todays = active.filter((b) => isSameDay(b.scheduledStart, today));
      return mapWalkerHome(user, provider, todays, todays.length);
    }

    if (provider.providerType === PROVIDER_TYPES.VET || provider.providerType === PROVIDER_TYPES.CLINIC) {
      const active = await fetchBookingsForProvider(providerId, ACTIVE_STATUSES, 100);
      const todays = active.filter((b) => isSameDay(b.scheduledStart, today));
      const monthAnalytics = await providerService.getMyAnalytics(userId, { range: 'month' });
      const revenueTotal = sumEarnings(monthAnalytics);
      return mapVetHome(
        user,
        provider,
        { appointments: todays.length, walkIns: 0, surgeries: 0, revenue: revenueTotal },
        todays,
        revenueTotal,
      );
    }

    if (provider.providerType === PROVIDER_TYPES.BOARDING) {
      const active = await fetchBookingsForProvider(providerId, ACTIVE_STATUSES, 200);
      const checkIns = active.filter((b) => isSameDay(b.scheduledStart, today));
      const checkOuts = active.filter((b) => isSameDay(b.scheduledEnd, today));
      const pending = active.filter((b) => b.status === BOOKING_STATUSES.PENDING);
      const occupiedPets = active.filter((b) => b.status === BOOKING_STATUSES.STARTED).length;
      const newBookingsToday = active.filter((b) => isSameDay(b.createdAt, today)).length;
      const [weekAnalytics, monthAnalytics] = await Promise.all([
        providerService.getMyAnalytics(userId, { range: 'week' }),
        providerService.getMyAnalytics(userId, { range: 'month' }),
      ]);
      const todayEarnings =
        weekAnalytics.earningsByDay.find((d) => isSameDay(new Date(d.date), today))?.amount ?? 0;
      return mapBoardingHome(
        provider,
        checkIns,
        checkOuts,
        pending,
        occupiedPets,
        newBookingsToday,
        todayEarnings,
        sumEarnings(monthAnalytics),
      );
    }

    // GROOMER and any other role default to the groomer-shaped dashboard.
    const active = await fetchBookingsForProvider(providerId, ACTIVE_STATUSES, 100);
    const todays = active.filter((b) => isSameDay(b.scheduledStart, today));
    const activeSession = active.find((b) => b.status === BOOKING_STATUSES.STARTED) ?? null;
    const nextToday = todays[0] ?? null;
    const [weekAnalytics, monthAnalytics, totalBookings] = await Promise.all([
      providerService.getMyAnalytics(userId, { range: 'week' }),
      providerService.getMyAnalytics(userId, { range: 'month' }),
      BookingModel.countDocuments({ providerId: provider._id, status: BOOKING_STATUSES.COMPLETED }),
    ]);
    return mapGroomerHome(
      user,
      provider,
      todays.length,
      activeSession,
      nextToday,
      sumEarnings(weekAnalytics),
      sumEarnings(monthAnalytics),
      totalBookings,
    );
  },

  async getMyAppointments(userId: string, query: MyAppointmentsQuery) {
    const { user, provider } = await requireContext(userId);
    const { skip, limit } = parsePagination(query);

    const statusMap: Record<string, string[]> = {
      upcoming: ACTIVE_STATUSES,
      completed: [BOOKING_STATUSES.COMPLETED],
      cancelled: [BOOKING_STATUSES.CANCELLED],
    };
    const key = query.status?.toLowerCase();
    const statuses = key && key !== 'all' ? statusMap[key] : undefined;

    const { items } = await bookingRepository.findForProvider(
      provider._id.toString(),
      statuses,
      {},
      skip,
      limit,
    );
    const enriched = await enrichBookings(items);
    return mapSitterAppointments(user.name || '', enriched);
  },

  async getAppointments(userId: string, query: AppointmentsQuery) {
    const { provider } = await requireContext(userId);
    const { page, skip, limit } = parsePagination(query);

    const statusMap: Record<string, string[]> = {
      upcoming: ACTIVE_STATUSES,
      // spec's own example spells this "UPCOMMING" — accept both spellings.
      upcomming: ACTIVE_STATUSES,
      completed: [BOOKING_STATUSES.COMPLETED],
      cancelled: [BOOKING_STATUSES.CANCELLED],
    };
    const key = query.status?.toLowerCase();
    const statuses = key && key !== 'all' ? statusMap[key] : undefined;
    const dateRange = dayRangeFor(query.date);

    const { items, total } = await bookingRepository.findForProvider(
      provider._id.toString(),
      statuses,
      dateRange,
      skip,
      limit,
    );
    const enriched = await enrichBookings(items);

    if (provider.providerType === PROVIDER_TYPES.VET || provider.providerType === PROVIDER_TYPES.CLINIC) {
      return mapVetAppointments(enriched);
    }
    return mapWalkerAppointments(enriched, page, limit, total);
  },

  async getTrainerDashboard(userId: string, query: TrainerDashboardQuery) {
    const { user, provider } = await requireContext(userId);
    const providerId = provider._id.toString();
    const hasAppointmentParams = Boolean(query.type || query.filter);

    if (!hasAppointmentParams) {
      const active = await fetchBookingsForProvider(providerId, ACTIVE_STATUSES, 50);
      const today = new Date();
      const todaysSessions = active.filter((b) => isSameDay(b.scheduledStart, today));
      const weekAnalytics = await providerService.getMyAnalytics(userId, { range: 'week' });
      const todayEarnings =
        weekAnalytics.earningsByDay.find((d) => isSameDay(new Date(d.date), today))?.amount ?? 0;
      return mapTrainerDashboard(
        user,
        provider,
        todaysSessions.length,
        todayEarnings,
        active.slice(0, 5),
      );
    }

    const { page, skip, limit } = parsePagination(query);
    const statuses =
      query.filter === 'pending'
        ? [BOOKING_STATUSES.PENDING]
        : query.type === 'past'
          ? [BOOKING_STATUSES.COMPLETED, BOOKING_STATUSES.CANCELLED]
          : ACTIVE_STATUSES;
    const now = new Date();
    const dateRange =
      query.filter === 'today'
        ? { from: new Date(now.setHours(0, 0, 0, 0)), to: new Date(now.setHours(23, 59, 59, 999)) }
        : query.filter === 'this_week'
          ? { from: new Date(), to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
          : {};
    const { items, total } = await bookingRepository.findForProvider(
      providerId,
      statuses,
      dateRange,
      skip,
      limit,
    );
    const enriched = await enrichBookings(items);
    return mapTrainerAppointments(enriched, page, limit, total);
  },

  async getAnalytics(userId: string, query: ProviderAppAnalyticsQuery) {
    const { provider } = await requireContext(userId);
    const analytics = await providerService.getMyAnalytics(userId, { range: query.time_range });

    if (provider.providerType === PROVIDER_TYPES.PET_SITTER) {
      return mapSitterAnalytics(query.time_range, analytics);
    }
    if (provider.providerType === PROVIDER_TYPES.TRAINER) {
      return mapTrainerAnalytics(analytics);
    }
    return mapWalkerAnalytics(query.time_range, analytics);
  },

  async getProfile(userId: string) {
    const { user, provider } = await requireContext(userId);

    if (provider.providerType === PROVIDER_TYPES.VET || provider.providerType === PROVIDER_TYPES.CLINIC) {
      return mapVetProfile(user, provider);
    }

    const [analytics, zones] = await Promise.all([
      providerService.getMyAnalytics(userId, { range: 'month' }),
      ZoneModel.find({ _id: { $in: provider.zoneIds } }).select('name').lean(),
    ]);
    const specializations =
      provider.metadata.groomer?.specializations ?? provider.metadata.vet?.specializations ?? [];
    return mapGenericProfile(
      user,
      provider,
      analytics,
      specializations,
      zones.map((z) => z.name),
    );
  },

  async getPatients(userId: string, query: PatientsQuery) {
    const { provider } = await requireContext(userId);
    const { items } = await bookingRepository.findForProvider(
      provider._id.toString(),
      [...ACTIVE_STATUSES, BOOKING_STATUSES.COMPLETED],
      {},
      0,
      100,
    );

    const petIds = [...new Set(items.filter((b) => b.petId).map((b) => b.petId!.toString()))];
    if (petIds.length === 0) return mapPatients([]);

    const speciesFilter: Record<string, string> = { Dog: 'DOG', Cat: 'CAT', Birds: 'BIRD' };
    const filter: Record<string, unknown> = { _id: { $in: petIds } };
    if (query.type !== 'All' && speciesFilter[query.type]) filter.species = speciesFilter[query.type];

    const pets = await PetModel.find(filter).select('name breed avatarUrl species ownerId').lean();
    const ownerIds = [...new Set(pets.map((p) => p.ownerId.toString()))];
    const owners = await UserModel.find({ _id: { $in: ownerIds } }).select('name').lean();
    const ownerById = new Map(owners.map((o) => [o._id.toString(), o]));

    return mapPatients(
      pets.map((pet) => {
        const owner = ownerById.get(pet.ownerId.toString());
        return {
          id: pet._id.toString(),
          name: pet.name,
          breed: pet.breed,
          avatarUrl: pet.avatarUrl,
          species: pet.species,
          owner: owner ? { id: owner._id.toString(), name: owner.name } : null,
        };
      }),
    );
  },

  async startSessionVerifyOtp(userId: string, input: SessionOtpInput): Promise<void> {
    const provider = await requireOwnProvider(userId);
    const booking = await bookingRepository.findActiveForProvider(
      provider._id.toString(),
      SESSION_START_STATUSES,
    );
    if (!booking) throw AppError.notFound('No session is ready to start right now');
    await bookingService.verifyStartOtp(booking._id.toString(), userId, input.otp);
  },

  /** ponytail: booking OTPs aren't SMS-delivered today (the owner app just displays them, the
   * provider asks for it in person) — "resend" here regenerates the pending code and texts it to
   * the owner directly, a real upgrade over the silent-regenerate-only alternative. No-ops (still
   * returns success) if SMS isn't configured, same demo-mode behavior as every other OTP flow. */
  async resendSessionOtp(userId: string): Promise<void> {
    const provider = await requireOwnProvider(userId);
    const providerId = provider._id.toString();

    let booking = await bookingRepository.findActiveForProvider(providerId, SESSION_START_STATUSES);
    let field: 'otpStart' | 'otpEnd' = 'otpStart';
    if (!booking) {
      booking = await bookingRepository.findActiveForProvider(providerId, SESSION_ACTIVE_STATUSES);
      field = 'otpEnd';
    }
    if (!booking) throw AppError.notFound('No active session to resend an OTP for');

    const code = generateOtpCode();
    booking[field] = code;
    await booking.save();

    const owner = await userRepository.findById(booking.userId.toString());
    if (owner) {
      await sendSms(
        owner.phone,
        `Your Patmypets service ${field === 'otpStart' ? 'start' : 'end'} code is ${code}.`,
      );
    }
  },

  async endSessionVerifyOtp(userId: string, input: SessionOtpInput): Promise<void> {
    const provider = await requireOwnProvider(userId);
    const booking = await bookingRepository.findActiveForProvider(
      provider._id.toString(),
      SESSION_ACTIVE_STATUSES,
    );
    if (!booking) throw AppError.notFound('No active session to end right now');
    if (booking.otpEnd !== input.otp) throw AppError.badRequest('Invalid end OTP');

    const { commissionAmount, providerPayoutAmount } = computeAmounts(
      booking.price,
      booking.discountAmount,
      booking.commissionPercent,
    );
    booking.status = BOOKING_STATUSES.COMPLETED;
    booking.otpEndVerifiedAt = new Date();
    booking.commissionAmount = commissionAmount;
    booking.providerPayoutAmount = providerPayoutAmount;
    await booking.save();

    tryGetSocketServer()
      ?.to(`booking:${booking._id.toString()}`)
      .emit(WALK_SOCKET_EVENTS.ENDED, { bookingId: booking._id.toString(), walkStats: booking.walkStats });

    await notificationService.notify({
      userId: booking.userId.toString(),
      type: NOTIFICATION_TYPES.BOOKING_COMPLETED,
      title: 'Service completed',
      body: 'Your service is complete. Please rate your experience.',
      data: { bookingId: booking._id.toString() },
    });

    await referralService.onFirstBookingCompleted(booking.userId.toString());
  },

  async getEndSessionSummary(userId: string) {
    const provider = await requireOwnProvider(userId);
    let booking = await bookingRepository.findActiveForProvider(
      provider._id.toString(),
      SESSION_ACTIVE_STATUSES,
    );
    if (!booking) {
      booking = await BookingModel.findOne({
        providerId: provider._id,
        status: BOOKING_STATUSES.COMPLETED,
      })
        .sort({ updatedAt: -1 })
        .exec();
    }
    if (!booking) throw AppError.notFound('No session found');

    const distanceKm = booking.walkStats ? (booking.walkStats.distanceMeters / 1000).toFixed(1) : '0.0';
    return {
      success: true,
      message: 'summary fatch sucessfully.',
      summary: {
        distance: `${distanceKm} km`,
        status: booking.status === BOOKING_STATUSES.COMPLETED ? 'Completed' : 'In Process',
      },
    };
  },

  async uploadTrainingProcess(userId: string, input: UploadTrainingProcessInput): Promise<void> {
    const provider = await requireOwnProvider(userId);
    const booking = await bookingRepository.findActiveForProvider(
      provider._id.toString(),
      SESSION_ACTIVE_STATUSES,
    );
    if (!booking) throw AppError.badRequest('No active session to post a progress update for');

    booking.progressUpdates.push({
      caption: input.caption,
      progressNote: input.progress_note,
      media: input.media,
      createdAt: new Date(),
    });
    await booking.save();
  },

  async getInbox(userId: string, query: { page?: string; limit?: string }) {
    const { rooms } = await chatService.listRooms(userId, {
      page: query.page,
      limit: query.limit,
      isUrgent: undefined,
    });
    if (rooms.length === 0) return { success: true, message: 'message receive successfully.', data: [] };

    const otherIds = [
      ...new Set(rooms.map((r) => r.otherParticipantId).filter((id): id is string => id !== null)),
    ];
    const users = await UserModel.find({ _id: { $in: otherIds } }).select('name avatarUrl').lean();
    const userById = new Map(users.map((u) => [u._id.toString(), u]));

    const data = rooms.map((room) => {
      const other = room.otherParticipantId ? userById.get(room.otherParticipantId) : undefined;
      return mapInboxItem({
        id: room.id,
        otherParticipantId: room.otherParticipantId ?? '',
        otherParticipantName: other?.name ?? '',
        otherParticipantAvatar: other?.avatarUrl ?? null,
        lastMessagePreview: room.lastMessagePreview,
        unreadCount: room.unreadCount,
        lastMessageAt: room.lastMessageAt,
      });
    });

    return { success: true, message: 'message receive successfully.', data };
  },

  async getRoomHistory(userId: string, roomId: string, query: MessageHistoryQuery) {
    const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit ?? '', 10) || 20));
    const page = Math.max(1, Number.parseInt(query.page ?? '', 10) || 1);
    const messages = await chatService.listMessages(roomId, userId, { limit: String(limit) });
    const hasMore = messages.length === limit;
    return mapMessageHistory(roomId, messages, page, limit, hasMore);
  },
};

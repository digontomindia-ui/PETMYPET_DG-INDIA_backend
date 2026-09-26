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
import { ReviewModel } from '../reviews/review.schema.js';
import { NotificationModel } from '../notifications/notification.schema.js';
import { BOOKING_STATUSES } from '../bookings/booking.constants.js';
import { bookingService } from '../bookings/booking.service.js';
import { chatService } from '../chat/chat.service.js';
import { isUserOnline, userLastSeen } from '../chat/chat.gateway.js';
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
  InboxQuery,
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
  type RecentService,
} from './provider-app.mapper.js';
import { walletRepository } from '../wallet/wallet.repository.js';
import type { Types } from 'mongoose';
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
    PetModel.find({ _id: { $in: petIds } }).select('name breed avatarUrl dateOfBirth gender species').lean(),
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
      coordinates: defaultAddress?.location?.coordinates ?? null,
      pet: pet
        ? {
            id: pet._id.toString(),
            name: pet.name,
            breed: pet.breed,
            avatarUrl: pet.avatarUrl,
            dateOfBirth: pet.dateOfBirth ?? null,
            gender: pet.gender,
            species: pet.species,
          }
        : null,
      owner: owner ? { id: owner._id.toString(), name: owner.name, phone: owner.phone } : null,
      serviceName: service?.name ?? '',
      consultationMode: booking.consultationMode ?? null,
      price: Math.max(0, booking.price - booking.discountAmount),
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

/** Last few completed bookings for the dashboard's "recent services / prescriptions" cards;
 * `phase` limits it to bookings with that kind of uploaded document (e.g. a vet's prescription). */
async function recentCompleted(providerId: Types.ObjectId, phase?: string): Promise<RecentService[]> {
  const filter: Record<string, unknown> = { providerId, status: BOOKING_STATUSES.COMPLETED };
  if (phase) filter['photos.phase'] = phase;
  const bookings = await BookingModel.find(filter).sort({ otpEndVerifiedAt: -1, updatedAt: -1 }).limit(5).lean();
  const [pets, services] = await Promise.all([
    PetModel.find({ _id: { $in: bookings.map((b) => b.petId).filter(Boolean) } }).select('name breed avatarUrl').lean(),
    ServiceModel.find({ _id: { $in: bookings.map((b) => b.serviceId) } }).select('name').lean(),
  ]);
  const petById = new Map(pets.map((p) => [p._id.toString(), p]));
  const serviceById = new Map(services.map((s) => [s._id.toString(), s]));
  return bookings.map((b) => {
    const pet = b.petId ? petById.get(b.petId.toString()) : undefined;
    const doc = b.photos.find((p) => p.phase === (phase ?? 'RECEIPT')) ?? null;
    return {
      id: b._id.toString(),
      pet: pet ? { name: pet.name, breed: pet.breed, image_url: pet.avatarUrl } : null,
      service_name: serviceById.get(b.serviceId.toString())?.name ?? '',
      completed_at: b.otpEndVerifiedAt ?? null,
      amount: Math.max(0, b.price - b.discountAmount),
      document_url: doc?.url ?? null,
    };
  });
}

/** "(New: 4)" on the Patients Today tile — today's pets that have never had an earlier booking
 * with this provider. */
async function countNewClients(providerId: Types.ObjectId, todays: EnrichedBooking[]): Promise<number> {
  const petIds = [...new Set(todays.map((b) => b.pet?.id).filter((id): id is string => Boolean(id)))];
  if (petIds.length === 0) return 0;
  const earliestToday = new Date(Math.min(...todays.map((b) => b.scheduledStart.getTime())));
  const returning = await BookingModel.distinct('petId', {
    providerId,
    petId: { $in: petIds },
    scheduledStart: { $lt: earliestToday },
  });
  return petIds.length - returning.length;
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
        name: 'AADHAAR_CARD',
        url: input.documents.adhar_card,
        uploadedAt: now,
      });
    }
    if (input.documents.pan_card) {
      provider.kycDocuments.push({
        type: KYC_DOCUMENT_TYPES.GOVERNMENT_ID,
        name: 'PAN_CARD',
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

    // The shell profile created at verify-otp time has no address/location/zone (placeholder
    // coordinates [0,0]) — this is the only place onboarding ever supplies real ones, so apply
    // them here and auto-assign the nearest zone, otherwise the provider never shows up in
    // nearby search and GET /profile's service_areas stays empty forever.
    if (input.location?.address) provider.address = input.location.address;
    if (input.location?.longtude !== undefined && input.location?.latatude !== undefined) {
      const coordinates: [number, number] = [input.location.longtude, input.location.latatude];
      provider.location = { type: 'Point', coordinates };
      const nearestZone = await ZoneModel.findOne({
        center: { $nearSphere: { $geometry: { type: 'Point', coordinates } } },
      });
      if (nearestZone) provider.zoneIds = [nearestZone._id];
    }

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
      const weekAnalytics = await providerService.getMyAnalytics(userId, { range: 'week' });
      return mapWalkerHome(user, provider, todays, todays.length, sumEarnings(weekAnalytics));
    }

    if (provider.providerType === PROVIDER_TYPES.CLINIC) {
      const active = await fetchBookingsForProvider(providerId, ACTIVE_STATUSES, 100);
      const todays = active.filter((b) => isSameDay(b.scheduledStart, today));
      const monthAnalytics = await providerService.getMyAnalytics(userId, { range: 'month' });
      const revenueTotal = sumEarnings(monthAnalytics);
      const revenueToday =
        monthAnalytics.earningsByDay.find((d) => isSameDay(new Date(d.date), today))?.amount ?? 0;
      return mapVetHome(
        user,
        provider,
        { appointments: todays.length, walkIns: 0, surgeries: 0, revenue: revenueToday },
        todays,
        revenueTotal,
        monthAnalytics.earningsByDay,
        monthAnalytics.previousPeriodEarnings,
      );
    }

    if (provider.providerType === PROVIDER_TYPES.BOARDING) {
      const active = await fetchBookingsForProvider(providerId, ACTIVE_STATUSES, 200);
      const checkIns = active.filter((b) => isSameDay(b.scheduledStart, today));
      const checkOuts = active.filter((b) => isSameDay(b.scheduledEnd, today));
      const pending = active.filter((b) => b.status === BOOKING_STATUSES.PENDING);
      const boarding = active.filter((b) => b.status === BOOKING_STATUSES.STARTED);
      const occupiedPets = boarding.length;
      const newBookingsToday = active.filter((b) => isSameDay(b.createdAt, today)).length;
      const [weekAnalytics, monthAnalytics, inbox] = await Promise.all([
        providerService.getMyAnalytics(userId, { range: 'week' }),
        providerService.getMyAnalytics(userId, { range: 'month' }),
        this.getInbox(userId, { limit: '3' }),
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
        boarding,
        inbox.data,
        user.phone,
      );
    }

    // GROOMER, VET (individual vet — same dashboard layout, vet labels) and any other role.
    const active = await fetchBookingsForProvider(providerId, ACTIVE_STATUSES, 100);
    const todays = active.filter((b) => isSameDay(b.scheduledStart, today));
    const activeSession =
      todays.find((b) => b.status === BOOKING_STATUSES.STARTED) ??
      active.find((b) => b.status === BOOKING_STATUSES.STARTED) ??
      null;
    const nextToday = todays[0] ?? null;
    const isVet = provider.providerType === PROVIDER_TYPES.VET;
    const [
      weekAnalytics,
      monthAnalytics,
      totalBookings,
      reviews,
      unreadNotifications,
      wallet,
      monthCompleted,
      recentServices,
      recentPrescriptions,
      newClientsToday,
    ] = await Promise.all([
      providerService.getMyAnalytics(userId, { range: 'week' }),
      providerService.getMyAnalytics(userId, { range: 'month' }),
      BookingModel.countDocuments({ providerId: provider._id, status: BOOKING_STATUSES.COMPLETED }),
      ReviewModel.find({ providerId: provider._id }).sort({ createdAt: -1 }).limit(3).lean(),
      NotificationModel.countDocuments({ userId: user._id, isRead: false }),
      walletRepository.getOrCreate(userId),
      BookingModel.countDocuments({
        providerId: provider._id,
        status: BOOKING_STATUSES.COMPLETED,
        otpEndVerifiedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      recentCompleted(provider._id),
      isVet ? recentCompleted(provider._id, 'PRESCRIPTION') : Promise.resolve(undefined),
      countNewClients(provider._id, todays),
    ]);
    const reviewers = await UserModel.find({ _id: { $in: reviews.map((r) => r.userId) } })
      .select('name avatarUrl')
      .lean();
    const reviewerById = new Map(reviewers.map((u) => [u._id.toString(), u]));
    const recentReviews = reviews.map((r) => {
      const reviewer = reviewerById.get(r.userId.toString());
      return {
        id: r._id.toString(),
        rating: r.rating,
        comment: r.comment,
        reviewerName: reviewer?.name ?? '',
        reviewerAvatar: reviewer?.avatarUrl ?? null,
        createdAt: r.createdAt,
      };
    });
    return mapGroomerHome(
      user,
      provider,
      todays.length,
      activeSession,
      nextToday,
      sumEarnings(weekAnalytics),
      sumEarnings(monthAnalytics),
      totalBookings,
      weekAnalytics.earningsByDay,
      recentReviews,
      unreadNotifications,
      weekAnalytics.previousPeriodEarnings,
      {
        designation: isVet ? 'Veterinary Specialist' : undefined,
        walletBalance: wallet.balance,
        todaysSessions: todays,
        newClientsToday,
        monthCompleted,
        recentServices,
        recentPrescriptions,
      },
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

  /** Booking detail for Start Service / Start Visit / Boarding Details / session screens — one
   * shape for every role, owner contact + pet profile + package + past sessions with this pet. */
  async getAppointmentDetail(userId: string, bookingId: string) {
    const provider = await requireOwnProvider(userId);
    const booking = await BookingModel.findOne({ _id: bookingId, providerId: provider._id }).exec();
    if (!booking) throw AppError.notFound('Appointment not found');

    const [owner, pet, service, pastSessions] = await Promise.all([
      UserModel.findById(booking.userId).select('name phone avatarUrl addresses').lean(),
      booking.petId ? PetModel.findById(booking.petId).lean() : Promise.resolve(null),
      ServiceModel.findById(booking.serviceId).select('name description price durationMinutes includedItems').lean(),
      booking.petId
        ? BookingModel.find({
            providerId: provider._id,
            petId: booking.petId,
            status: BOOKING_STATUSES.COMPLETED,
            _id: { $ne: booking._id },
          })
            .sort({ scheduledStart: -1 })
            .limit(5)
            .select('scheduledStart providerNotes serviceId')
            .lean()
        : Promise.resolve([]),
    ]);
    const address = owner?.addresses.find((a) => a.isDefault) ?? owner?.addresses[0];
    const initials = (owner?.name ?? '')
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0]!.toUpperCase())
      .slice(0, 2)
      .join('');
    const vaccinated = (pet?.vaccinations ?? []).some((v) => !v.expiresAt || v.expiresAt > new Date());

    return {
      success: true,
      message: 'Appointment fetched successfully.',
      data: {
        id: booking._id.toString(),
        booking_code: `#${booking._id.toString().slice(-8).toUpperCase()}`,
        status: booking.status,
        scheduled_start: booking.scheduledStart,
        scheduled_end: booking.scheduledEnd,
        mode: booking.consultationMode === 'CLINIC' ? 'CLINIC' : booking.consultationMode === 'ONLINE' ? 'VIDEO' : 'HOME',
        duration_days: booking.durationDays,
        drop_off_time: booking.dropOffTime,
        pickup_time: booking.pickupTime,
        client: owner
          ? {
              id: owner._id.toString(),
              name: owner.name,
              initials,
              phone: owner.phone,
              avatar_url: owner.avatarUrl,
              address: address ? `${address.addressLine1}, ${address.city}` : '',
              location: address ? { longitude: address.location.coordinates[0], latitude: address.location.coordinates[1] } : null,
            }
          : null,
        pet: pet
          ? {
              id: pet._id.toString(),
              name: pet.name,
              species: pet.species,
              breed: pet.breed,
              gender: pet.gender,
              date_of_birth: pet.dateOfBirth,
              weight_kg: pet.weightKg,
              image_url: pet.avatarUrl,
              is_vaccinated: vaccinated,
              notes: pet.notes,
            }
          : null,
        service: service
          ? {
              id: service._id.toString(),
              name: service.name,
              description: service.description,
              duration_minutes: service.durationMinutes,
              includes: service.includedItems.map((i) => i.name),
            }
          : null,
        add_ons: booking.addOns,
        price: booking.price,
        discount: booking.discountAmount,
        total: Math.max(0, booking.price - booking.discountAmount),
        payment_status: booking.paymentStatus,
        customer_notes: booking.notes,
        provider_notes: booking.providerNotes,
        photos: booking.photos.map((p) => ({ url: p.url, phase: p.phase, caption: p.caption ?? '' })),
        progress_updates: booking.progressUpdates.map((u) => ({
          id: u._id.toString(),
          caption: u.caption,
          progress_note: u.progressNote,
          media: u.media,
          created_at: u.createdAt,
        })),
        timeline: {
          booked_at: booking.createdAt,
          started_at: booking.otpStartVerifiedAt,
          completed_at: booking.otpEndVerifiedAt,
        },
        walk_stats: booking.walkStats,
        past_sessions: pastSessions.map((s) => ({
          id: s._id.toString(),
          date: s.scheduledStart,
          note: s.providerNotes,
        })),
      },
    };
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
      const patientIds = await BookingModel.distinct('petId', {
        providerId: provider._id,
        petId: { $ne: null },
      });
      return mapVetProfile(user, provider, patientIds.length);
    }

    const [analytics, zones, services] = await Promise.all([
      providerService.getMyAnalytics(userId, { range: 'month' }),
      ZoneModel.find({ _id: { $in: provider.zoneIds } }).select('name').lean(),
      ServiceModel.find({ providerId: provider._id, isDeleted: false }).select('name').lean(),
    ]);
    const declared =
      provider.metadata.groomer?.specializations ?? provider.metadata.vet?.specializations ?? [];
    // Roles without a specializations field fall back to the services they actually offer.
    const specializations = declared.length > 0 ? declared : services.map((s) => s.name);
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

    const pets = await PetModel.find(filter)
      .select('name breed avatarUrl species ownerId dateOfBirth')
      .lean();
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
          dateOfBirth: pet.dateOfBirth ?? null,
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
    await bookingService.completeBooking(booking);
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
    const [enriched] = await enrichBookings([booking]);
    return {
      success: true,
      message: 'summary fatch sucessfully.',
      summary: {
        distance: `${distanceKm} km`,
        status: booking.status === BOOKING_STATUSES.COMPLETED ? 'Completed' : 'In Process',
        // Service Completed screen fields:
        booking_id: booking._id.toString(),
        booking_code: `#${booking._id.toString().slice(-8).toUpperCase()}`,
        pet: enriched?.pet ? { name: enriched.pet.name, breed: enriched.pet.breed, image_url: enriched.pet.avatarUrl } : null,
        owner_name: enriched?.owner?.name ?? '',
        service_name: enriched?.serviceName ?? '',
        started_at: booking.otpStartVerifiedAt,
        completed_at: booking.otpEndVerifiedAt,
        duration_minutes:
          booking.otpStartVerifiedAt && booking.otpEndVerifiedAt
            ? Math.round((booking.otpEndVerifiedAt.getTime() - booking.otpStartVerifiedAt.getTime()) / 60000)
            : null,
        amount: Math.max(0, booking.price - booking.discountAmount),
        earnings: booking.providerPayoutAmount,
        payment_status: booking.paymentStatus,
        photos: booking.photos.map((p) => ({ url: p.url, phase: p.phase, caption: p.caption ?? '' })),
        walk_stats: booking.walkStats,
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

  /** Messages screen. `filter` drives the All Chats / Unread / Emergency chips; `search` matches
   * the owner's name or the pet's name (the row title is "Owner (Pet)").
   * ponytail: unread/search are applied in memory over the newest 200 rooms — plenty for one
   * provider's inbox; push them into the Mongo query if inboxes ever get that large. */
  async getInbox(userId: string, query: InboxQuery) {
    const urgentOnly = query.filter === 'emergency' || query.is_urgent === 'true';
    const inMemory = query.filter === 'unread' || Boolean(query.search);
    const { page, limit, skip } = parsePagination(query);
    const { rooms } = await chatService.listRooms(userId, {
      page: inMemory ? '1' : String(page),
      limit: inMemory ? '200' : String(limit),
      isUrgent: urgentOnly ? 'true' : undefined,
    });
    if (rooms.length === 0) return { success: true, message: 'message receive successfully.', data: [] };

    const otherIds = [
      ...new Set(rooms.map((r) => r.otherParticipantId).filter((id): id is string => id !== null)),
    ];
    const bookingIds = rooms.map((r) => r.bookingId).filter((id): id is string => id !== null);
    const [users, bookings] = await Promise.all([
      UserModel.find({ _id: { $in: otherIds } }).select('name avatarUrl').lean(),
      BookingModel.find({ _id: { $in: bookingIds } }).select('petId').lean(),
    ]);
    const pets = await PetModel.find({ _id: { $in: bookings.map((b) => b.petId).filter(Boolean) } })
      .select('name avatarUrl')
      .lean();
    const userById = new Map(users.map((u) => [u._id.toString(), u]));
    const petIdByBooking = new Map(bookings.map((b) => [b._id.toString(), b.petId?.toString()]));
    const petById = new Map(pets.map((p) => [p._id.toString(), p]));

    let data = rooms.map((room) => {
      const other = room.otherParticipantId ? userById.get(room.otherParticipantId) : undefined;
      const petId = room.bookingId ? petIdByBooking.get(room.bookingId) : undefined;
      const pet = petId ? petById.get(petId) : undefined;
      return mapInboxItem({
        id: room.id,
        otherParticipantId: room.otherParticipantId ?? '',
        otherParticipantName: other?.name ?? '',
        otherParticipantAvatar: other?.avatarUrl ?? null,
        lastMessagePreview: room.lastMessagePreview,
        unreadCount: room.unreadCount,
        lastMessageAt: room.lastMessageAt,
        isUrgent: room.isUrgent,
        bookingId: room.bookingId,
        isOnline: room.otherParticipantId ? isUserOnline(room.otherParticipantId) : false,
        lastSeen: room.otherParticipantId ? userLastSeen(room.otherParticipantId) : null,
        petName: pet?.name ?? null,
        petImage: pet?.avatarUrl ?? null,
      });
    });

    if (inMemory) {
      const needle = query.search?.trim().toLowerCase();
      data = data
        .filter((item) => query.filter !== 'unread' || Number(item.unread_msg) > 0)
        .filter(
          (item) =>
            !needle ||
            item.name.toLowerCase().includes(needle) ||
            (item.pet_name ?? '').toLowerCase().includes(needle),
        )
        .slice(skip, skip + limit);
    }

    return { success: true, message: 'message receive successfully.', data };
  },

  async getRoomHistory(userId: string, roomId: string, query: MessageHistoryQuery) {
    const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit ?? '', 10) || 20));
    const page = Math.max(1, Number.parseInt(query.page ?? '', 10) || 1);
    const { messages, total } = await chatService.listMessagesPage(roomId, userId, page, limit);
    return mapMessageHistory(roomId, messages, page, limit, total);
  },
};

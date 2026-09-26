import type { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { userRepository } from '../users/user.repository.js';
import { UserModel } from '../users/user.schema.js';
import { PetModel } from '../pets/pet.schema.js';
import { ServiceModel } from '../services/service.schema.js';
import { providerRepository } from '../providers/provider.repository.js';
import { KYC_DOCUMENT_NAMES, KYC_DOCUMENT_TYPES } from '../providers/provider.constants.js';
import { BookingModel } from '../bookings/booking.schema.js';
import { BOOKING_STATUSES } from '../bookings/booking.constants.js';
import { PaymentModel } from '../payments/payment.schema.js';
import { ReviewModel } from '../reviews/review.schema.js';
import { walletRepository } from '../wallet/wallet.repository.js';
import { payoutService } from '../wallet/payout.service.js';
import { MIN_WITHDRAWAL_AMOUNT } from '../wallet/payout.schema.js';
import { notificationService } from '../notifications/notification.service.js';
import { NOTIFICATION_TYPES } from '../notifications/notification.constants.js';
import type { ProviderDocument } from '../providers/provider.types.js';
import type {
  BankAccountInput,
  EarningsQuery,
  ExperienceSkillsInput,
  PersonalInfoInput,
  ProviderDocumentInput,
  ReviewsQuery,
} from './provider-app.dto.js';

const TZ = 'Asia/Kolkata';
const DAY_MS = 24 * 60 * 60 * 1000;
/** Documents screen always lists these, showing MISSING until uploaded. */
const REQUIRED_DOCUMENTS = [
  { name: KYC_DOCUMENT_NAMES.AADHAAR_CARD, title: 'Aadhaar Card' },
  { name: KYC_DOCUMENT_NAMES.PAN_CARD, title: 'PAN Card' },
  { name: KYC_DOCUMENT_NAMES.DRIVING_LICENSE, title: 'Driving License' },
  { name: KYC_DOCUMENT_NAMES.POLICE_VERIFICATION, title: 'Police Verification' },
] as const;

async function requireProvider(userId: string): Promise<ProviderDocument> {
  const provider = await providerRepository.findByUserId(userId);
  if (!provider) throw AppError.notFound('Provider profile not found');
  return provider;
}

/** Start of "today" in IST, as a UTC instant. */
function startOfTodayIst(): Date {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  istNow.setUTCHours(0, 0, 0, 0);
  return new Date(istNow.getTime() - 5.5 * 60 * 60 * 1000);
}

function growth(current: number, previous: number) {
  const percentage =
    previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : current > 0 ? 100 : 0;
  return { percentage, level: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'flat' };
}

function maskedBank(provider: ProviderDocument) {
  const bank = provider.bankAccount;
  if (!bank) return null;
  return {
    account_holder_name: bank.accountHolderName,
    bank_name: bank.bankName,
    ifsc_code: bank.ifscCode,
    account_type: bank.accountType ?? 'SAVINGS',
    account_number_last4: bank.accountNumber.slice(-4),
  };
}

/** Completed = has an otpEndVerifiedAt; older rows completed before that field existed fall back
 * to updatedAt. */
const completedAt = { $ifNull: ['$otpEndVerifiedAt', '$updatedAt'] };

async function sumEarnings(providerId: Types.ObjectId, from: Date, to: Date = new Date()) {
  const [row] = await BookingModel.aggregate<{ total: number; count: number }>([
    { $match: { providerId, status: BOOKING_STATUSES.COMPLETED } },
    { $addFields: { completedAt } },
    { $match: { completedAt: { $gte: from, $lt: to } } },
    { $group: { _id: null, total: { $sum: '$providerPayoutAmount' }, count: { $sum: 1 } } },
  ]);
  return { total: Math.round((row?.total ?? 0) * 100) / 100, count: row?.count ?? 0 };
}

/** Zero-filled chart buckets so a 7-day chart always has 7 bars, not just the days with sales. */
function buildBuckets(range: 'week' | 'month' | 'year') {
  const today = startOfTodayIst();
  if (range === 'year') {
    const ist = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() - 11 + i, 1));
      const key = d.toISOString().slice(0, 7);
      return { key, label: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }) };
    });
  }
  const days = range === 'week' ? 7 : 30;
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * DAY_MS + 5.5 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const label =
      range === 'week'
        ? d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
        : d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', timeZone: 'UTC' });
    return { key, label };
  });
}

function rangeStart(range: 'week' | 'month' | 'year'): Date {
  const today = startOfTodayIst();
  if (range === 'week') return new Date(today.getTime() - 6 * DAY_MS);
  if (range === 'month') return new Date(today.getTime() - 29 * DAY_MS);
  const ist = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() - 11, 1) - 5.5 * 60 * 60 * 1000);
}

export const providerAppAccountService = {
  // ---- Reviews & Ratings ----

  async getReviews(userId: string, query: ReviewsQuery) {
    const provider = await requireProvider(userId);
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = { providerId: provider._id };
    if (query.rating) filter.rating = Number(query.rating);

    const [breakdownRows, reviews, total] = await Promise.all([
      ReviewModel.aggregate<{ _id: number; count: number }>([
        { $match: { providerId: provider._id } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
      ReviewModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ReviewModel.countDocuments(filter),
    ]);

    const bookingIds = reviews.map((r) => r.bookingId).filter(Boolean);
    const [reviewers, bookings] = await Promise.all([
      UserModel.find({ _id: { $in: reviews.map((r) => r.userId) } }).select('name avatarUrl').lean(),
      BookingModel.find({ _id: { $in: bookingIds } }).select('petId serviceId').lean(),
    ]);
    const bookingById = new Map(bookings.map((b) => [b._id.toString(), b]));
    const [pets, services] = await Promise.all([
      PetModel.find({ _id: { $in: bookings.map((b) => b.petId).filter(Boolean) } })
        .select('name avatarUrl breed')
        .lean(),
      ServiceModel.find({ _id: { $in: bookings.map((b) => b.serviceId) } }).select('name').lean(),
    ]);
    const reviewerById = new Map(reviewers.map((u) => [u._id.toString(), u]));
    const petById = new Map(pets.map((p) => [p._id.toString(), p]));
    const serviceById = new Map(services.map((s) => [s._id.toString(), s]));

    const totalReviews = breakdownRows.reduce((sum, row) => sum + row.count, 0);
    const weighted = breakdownRows.reduce((sum, row) => sum + row._id * row.count, 0);
    return {
      success: true,
      message: 'Reviews fetched successfully.',
      data: {
        summary: {
          average_rating: totalReviews > 0 ? Math.round((weighted / totalReviews) * 10) / 10 : 0,
          total_reviews: totalReviews,
          breakdown: [5, 4, 3, 2, 1].map((star) => {
            const count = breakdownRows.find((row) => row._id === star)?.count ?? 0;
            return {
              star,
              count,
              percentage: totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0,
            };
          }),
        },
        reviews: reviews.map((review) => {
          const reviewer = reviewerById.get(review.userId.toString());
          const booking = review.bookingId ? bookingById.get(review.bookingId.toString()) : undefined;
          const pet = booking?.petId ? petById.get(booking.petId.toString()) : undefined;
          return {
            id: review._id.toString(),
            rating: review.rating,
            comment: review.comment,
            reviewer: { name: reviewer?.name || 'Pet Parent', avatar_url: reviewer?.avatarUrl ?? null },
            pet: pet ? { name: pet.name, breed: pet.breed, image_url: pet.avatarUrl } : null,
            service_name: booking ? (serviceById.get(booking.serviceId.toString())?.name ?? '') : '',
            booking_id: review.bookingId?.toString() ?? null,
            reply: review.reply ? { text: review.reply.text, replied_at: review.reply.repliedAt } : null,
            created_at: review.createdAt,
          };
        }),
        pagination: {
          current_page: page,
          total_pages: Math.max(1, Math.ceil(total / limit)),
          total_items: total,
          has_next: page * limit < total,
        },
      },
    };
  },

  async replyToReview(userId: string, reviewId: string, text: string) {
    const provider = await requireProvider(userId);
    const review = await ReviewModel.findOneAndUpdate(
      { _id: reviewId, providerId: provider._id },
      { reply: { text, repliedAt: new Date() } },
      { new: true },
    );
    if (!review) throw AppError.notFound('Review not found');

    await notificationService.notify({
      userId: review.userId.toString(),
      type: NOTIFICATION_TYPES.GENERIC,
      title: `${provider.businessName} replied to your review`,
      body: text.slice(0, 120),
      data: { reviewId },
    });
    return {
      success: true,
      message: 'Reply saved successfully.',
      data: { id: reviewId, reply: { text, replied_at: review.reply?.repliedAt ?? new Date() } },
    };
  },

  // ---- Earnings & withdrawals ----

  async getEarnings(userId: string, query: EarningsQuery) {
    const provider = await requireProvider(userId);
    const range = query.range;
    const { page, limit, skip } = parsePagination(query);
    const today = startOfTodayIst();
    const from = rangeStart(range);
    const previousFrom = new Date(from.getTime() - (Date.now() - from.getTime()));

    const bucketFormat = range === 'year' ? '%Y-%m' : '%Y-%m-%d';
    const completedFilter = { providerId: provider._id, status: BOOKING_STATUSES.COMPLETED };

    const [wallet, todayE, weekE, monthE, lifetime, current, previous, chartRows, txTotal, txRows] =
      await Promise.all([
        walletRepository.getOrCreate(userId),
        sumEarnings(provider._id, today),
        sumEarnings(provider._id, new Date(today.getTime() - 6 * DAY_MS)),
        sumEarnings(provider._id, new Date(today.getTime() - 29 * DAY_MS)),
        sumEarnings(provider._id, new Date(0)),
        sumEarnings(provider._id, from),
        sumEarnings(provider._id, previousFrom, from),
        BookingModel.aggregate<{ _id: string; amount: number }>([
          { $match: completedFilter },
          { $addFields: { completedAt } },
          { $match: { completedAt: { $gte: from } } },
          {
            $group: {
              _id: { $dateToString: { format: bucketFormat, date: '$completedAt', timezone: TZ } },
              amount: { $sum: '$providerPayoutAmount' },
            },
          },
        ]),
        BookingModel.countDocuments(completedFilter),
        BookingModel.aggregate([
          { $match: completedFilter },
          { $addFields: { completedAt } },
          { $sort: { completedAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ]),
      ]);

    const amountByBucket = new Map(chartRows.map((row) => [row._id, row.amount]));
    const txs = txRows as {
      _id: Types.ObjectId;
      petId: Types.ObjectId | null;
      serviceId: Types.ObjectId;
      paymentId: Types.ObjectId | null;
      paymentStatus: string;
      price: number;
      discountAmount: number;
      commissionAmount: number;
      providerPayoutAmount: number;
      payoutCreditedAt: Date | null;
      completedAt: Date;
    }[];
    const [pets, services, payments] = await Promise.all([
      PetModel.find({ _id: { $in: txs.map((t) => t.petId).filter(Boolean) } }).select('name avatarUrl').lean(),
      ServiceModel.find({ _id: { $in: txs.map((t) => t.serviceId) } }).select('name').lean(),
      PaymentModel.find({ _id: { $in: txs.map((t) => t.paymentId).filter(Boolean) } }).select('method').lean(),
    ]);
    const petById = new Map(pets.map((p) => [p._id.toString(), p]));
    const serviceById = new Map(services.map((s) => [s._id.toString(), s]));
    const methodById = new Map(payments.map((p) => [p._id.toString(), p.method]));

    const growthVsPrevious = growth(current.total, previous.total);
    return {
      success: true,
      message: 'Earnings fetched successfully.',
      data: {
        currency: 'INR',
        wallet_balance: wallet.balance,
        min_withdrawal_amount: MIN_WITHDRAWAL_AMOUNT,
        can_withdraw:
          Boolean(provider.bankAccount) &&
          provider.kycStatus === 'APPROVED' &&
          wallet.balance >= MIN_WITHDRAWAL_AMOUNT,
        bank_account: maskedBank(provider),
        summary: {
          today: todayE.total,
          this_week: weekE.total,
          this_month: monthE.total,
          lifetime: lifetime.total,
          completed_services: lifetime.count,
        },
        selected_range: range,
        range_summary: {
          total: current.total,
          services: current.count,
          previous_total: previous.total,
          percentage_change: growthVsPrevious.percentage,
          level: growthVsPrevious.level,
        },
        chart: buildBuckets(range).map((bucket) => ({
          label: bucket.label,
          date: bucket.key,
          value: amountByBucket.get(bucket.key) ?? 0,
        })),
        transactions: txs.map((t) => {
          const pet = t.petId ? petById.get(t.petId.toString()) : undefined;
          const method = t.paymentId ? methodById.get(t.paymentId.toString()) : undefined;
          return {
            booking_id: t._id.toString(),
            booking_code: `#${t._id.toString().slice(-8).toUpperCase()}`,
            pet: pet ? { name: pet.name, image_url: pet.avatarUrl } : null,
            service_name: serviceById.get(t.serviceId.toString())?.name ?? '',
            completed_at: t.completedAt,
            amount: Math.max(0, t.price - t.discountAmount),
            commission: t.commissionAmount,
            earning: t.providerPayoutAmount,
            payment_method: t.paymentStatus === 'PAID' ? (method ?? 'ONLINE') : 'UNPAID',
            credited_to_wallet: Boolean(t.payoutCreditedAt),
          };
        }),
        pagination: {
          current_page: page,
          total_pages: Math.max(1, Math.ceil(txTotal / limit)),
          total_items: txTotal,
          has_next: page * limit < txTotal,
        },
      },
    };
  },

  async withdraw(userId: string, amount: number) {
    const payout = await payoutService.request(userId, amount);
    const wallet = await walletRepository.getOrCreate(userId);
    return {
      success: true,
      message: 'Withdrawal requested successfully.',
      data: { withdrawal: payout, wallet_balance: wallet.balance },
    };
  },

  async listWithdrawals(userId: string, query: { page?: string; limit?: string }) {
    const { items, total, page, limit } = await payoutService.listMine(userId, query);
    return {
      success: true,
      message: 'Withdrawals fetched successfully.',
      data: {
        withdrawals: items,
        pagination: {
          current_page: page,
          total_pages: Math.max(1, Math.ceil(total / limit)),
          total_items: total,
          has_next: page * limit < total,
        },
      },
    };
  },

  // ---- Profile sub-screens ----

  async getPersonalInfo(userId: string) {
    const provider = await requireProvider(userId);
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    return {
      success: true,
      message: 'Personal info fetched successfully.',
      data: {
        full_name: user.name,
        email: user.email ?? '',
        phone: user.phone,
        date_of_birth: provider.dateOfBirth ? provider.dateOfBirth.toISOString().slice(0, 10) : null,
        gender: provider.gender,
        address: provider.address === 'Pending onboarding' ? '' : provider.address,
        profile_image: provider.profileImageUrl,
      },
    };
  },

  async updatePersonalInfo(userId: string, input: PersonalInfoInput) {
    const provider = await requireProvider(userId);
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');

    if (input.email && input.email.toLowerCase() !== user.email) {
      const taken = await userRepository.findByEmail(input.email);
      if (taken && taken._id.toString() !== userId) throw AppError.conflict('Email is already in use');
      user.email = input.email;
    }
    if (input.full_name !== undefined) user.name = input.full_name;
    if (input.date_of_birth !== undefined) {
      provider.dateOfBirth = input.date_of_birth ? new Date(`${input.date_of_birth}T00:00:00.000Z`) : null;
    }
    if (input.gender !== undefined) provider.gender = input.gender;
    if (input.address !== undefined) provider.address = input.address;
    if (input.profile_image !== undefined) provider.profileImageUrl = input.profile_image;

    await Promise.all([user.save(), provider.save()]);
    return this.getPersonalInfo(userId);
  },

  async getExperienceSkills(userId: string) {
    const provider = await requireProvider(userId);
    return {
      success: true,
      message: 'Experience & skills fetched successfully.',
      data: {
        experience_years: provider.experienceYears ?? 0,
        work_experience: provider.workExperience.map((w) => ({
          id: w._id.toString(),
          title: w.title,
          company: w.company,
          start_date: w.startDate.toISOString().slice(0, 10),
          end_date: w.endDate ? w.endDate.toISOString().slice(0, 10) : null,
          is_current: w.endDate === null,
        })),
        skills: provider.skills,
      },
    };
  },

  /** Full replace of both lists — the screen edits them locally (add/remove chips, add rows) and
   * saves the whole thing, so there's no per-item endpoint to keep in sync. */
  async updateExperienceSkills(userId: string, input: ExperienceSkillsInput) {
    const provider = await requireProvider(userId);
    if (input.work_experience) {
      provider.set(
        'workExperience',
        input.work_experience.map((w) => ({
          title: w.title,
          company: w.company ?? '',
          startDate: new Date(`${w.start_date}T00:00:00.000Z`),
          endDate: w.end_date ? new Date(`${w.end_date}T00:00:00.000Z`) : null,
        })),
      );
    }
    if (input.skills) provider.skills = [...new Set(input.skills.map((s) => s.trim()).filter(Boolean))];
    if (input.experience_years !== undefined) provider.experienceYears = input.experience_years;
    await provider.save();
    return this.getExperienceSkills(userId);
  },

  async getDocuments(userId: string) {
    const provider = await requireProvider(userId);
    // Uploads made before documents carried a name are the onboarding Aadhaar + PAN pair (in that
    // order) — label them so the screen doesn't show both as MISSING.
    const legacyIds = provider.kycDocuments
      .filter((d) => d.type === KYC_DOCUMENT_TYPES.GOVERNMENT_ID && (!d.name || d.name === 'OTHER'))
      .map((d) => d._id.toString());
    const nameOf = (doc: (typeof provider.kycDocuments)[number]) => {
      const legacyIndex = legacyIds.indexOf(doc._id.toString());
      if (legacyIndex === 0) return KYC_DOCUMENT_NAMES.AADHAAR_CARD;
      if (legacyIndex === 1) return KYC_DOCUMENT_NAMES.PAN_CARD;
      return doc.name ?? KYC_DOCUMENT_NAMES.OTHER;
    };
    const statusOf = (doc: (typeof provider.kycDocuments)[number]) =>
      provider.kycStatus === 'APPROVED' && (!doc.status || doc.status === 'PENDING') && legacyIds.includes(doc._id.toString())
        ? 'VERIFIED'
        : (doc.status ?? 'PENDING');

    const docs = provider.kycDocuments.map((doc) => ({
      id: doc._id.toString(),
      name: nameOf(doc),
      status: statusOf(doc),
      document_url: doc.url,
      uploaded_at: doc.uploadedAt,
    }));
    const latestByName = new Map<string, (typeof docs)[number]>();
    for (const doc of docs) latestByName.set(doc.name, doc); // later uploads win

    const required = REQUIRED_DOCUMENTS.map(({ name, title }) => {
      const doc = latestByName.get(name);
      return doc
        ? { ...doc, title }
        : { id: null, name, title, status: 'MISSING', document_url: null, uploaded_at: null };
    });
    const others = docs
      .filter((d) => !REQUIRED_DOCUMENTS.some((r) => r.name === d.name))
      .map((d) => ({ ...d, title: 'Other Document' }));

    return {
      success: true,
      message: 'Documents fetched successfully.',
      data: { kyc_status: provider.kycStatus, documents: [...required, ...others] },
    };
  },

  /** Uploading a document again under the same name replaces the old one (e.g. a re-scan after a
   * rejection) rather than piling up duplicates; a REJECTED provider goes back to PENDING review. */
  async uploadDocument(userId: string, input: ProviderDocumentInput) {
    const provider = await requireProvider(userId);
    if (input.name !== KYC_DOCUMENT_NAMES.OTHER) {
      for (const doc of provider.kycDocuments.filter((d) => d.name === input.name)) doc.deleteOne();
    }
    provider.kycDocuments.push({
      type: input.name === 'OTHER' ? KYC_DOCUMENT_TYPES.OTHER : KYC_DOCUMENT_TYPES.GOVERNMENT_ID,
      name: input.name,
      status: 'PENDING',
      url: input.url,
      uploadedAt: new Date(),
    });
    if (provider.kycStatus === 'REJECTED') {
      provider.kycStatus = 'PENDING';
      provider.kycRejectionReason = null;
    }
    await provider.save();
    return this.getDocuments(userId);
  },

  async getBankAccount(userId: string) {
    const provider = await requireProvider(userId);
    return {
      success: true,
      message: 'Bank account fetched successfully.',
      data: { bank_account: maskedBank(provider) },
    };
  },

  async setBankAccount(userId: string, input: BankAccountInput) {
    const provider = await requireProvider(userId);
    provider.bankAccount = {
      accountHolderName: input.account_holder_name,
      bankName: input.bank_name,
      accountNumber: input.account_number,
      ifscCode: input.ifsc_code.toUpperCase(),
      accountType: input.account_type,
    };
    await provider.save();
    return {
      success: true,
      message: 'Bank details saved successfully.',
      data: { bank_account: maskedBank(provider) },
    };
  },
};

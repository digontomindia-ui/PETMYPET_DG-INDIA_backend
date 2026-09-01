/**
 * One-shot dev/staging seed script — `npm run seed`.
 *
 * Populates every module with a small, internally-consistent, cross-referenced
 * dataset so the app team can exercise every screen in SCREEN_TO_API_GUIDE.md
 * against real data without hand-crafting it via the API first. Idempotent:
 * if "Bangalore" already exists as a city, the whole run is skipped (delete
 * that city document, or drop the DB, to reseed from scratch).
 */
import 'dotenv/config';
import type { Types } from 'mongoose';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from './mongoose.js';
import { hashPassword } from '../utils/password.js';
import { logger } from '../utils/logger.js';

import { ROLES, PROVIDER_TYPES } from '../constants/roles.js';
import { UserModel } from '../../modules/users/user.schema.js';
import { CityModel, ZoneModel } from '../../modules/zones/zone.schema.js';
import { CategoryModel } from '../../modules/categories/category.schema.js';
import { ProviderModel } from '../../modules/providers/provider.schema.js';
import { KYC_STATUSES } from '../../modules/providers/provider.constants.js';
import { ServiceModel } from '../../modules/services/service.schema.js';
import { PetModel } from '../../modules/pets/pet.schema.js';
import { PET_SPECIES, PET_GENDERS, COMPANION_ACTIVITY_LEVELS, GETS_ALONG_WITH_STATUS } from '../../modules/pets/pet.constants.js';
import { ProductModel } from '../../modules/marketplace/product.schema.js';
import { PRODUCT_CATEGORIES } from '../../modules/marketplace/product.constants.js';
import { CartModel } from '../../modules/marketplace/cart.schema.js';
import { OrderModel } from '../../modules/marketplace/order.schema.js';
import { ORDER_STATUSES, ORDER_PAYMENT_METHODS, ORDER_PAYMENT_STATUSES } from '../../modules/marketplace/order.constants.js';
import { CouponModel } from '../../modules/coupons/coupon.schema.js';
import { DISCOUNT_TYPES } from '../../modules/coupons/coupon.constants.js';
import { BookingModel } from '../../modules/bookings/booking.schema.js';
import { BOOKING_STATUSES, PAYMENT_STATUSES as BOOKING_PAYMENT_STATUSES } from '../../modules/bookings/booking.constants.js';
import { PaymentModel } from '../../modules/payments/payment.schema.js';
import { PAYMENT_METHODS, PAYMENT_TRANSACTION_STATUSES, PAYMENT_PURPOSES } from '../../modules/payments/payment.constants.js';
import { ReviewModel } from '../../modules/reviews/review.schema.js';
import { WalletModel, WalletTransactionModel } from '../../modules/wallet/wallet.schema.js';
import { WALLET_TRANSACTION_TYPES, WALLET_TRANSACTION_REASONS } from '../../modules/wallet/wallet.constants.js';
import { LostAndFoundModel } from '../../modules/lost-and-found/lost-and-found.schema.js';
import { LOST_AND_FOUND_TYPES, APPROVAL_STATUSES } from '../../modules/lost-and-found/lost-and-found.constants.js';
import { ReferralModel } from '../../modules/referrals/referral.schema.js';
import { REFERRAL_STATUSES, REFERRAL_REWARD_POINTS } from '../../modules/referrals/referral.constants.js';
import { PetSwipeModel, PetMatchModel } from '../../modules/pet-companion/pet-companion.schema.js';
import { SWIPE_ACTIONS } from '../../modules/pet-companion/pet-companion.constants.js';
import { ChatRoomModel, MessageModel } from '../../modules/chat/chat.schema.js';
import { PetTaxiBookingModel } from '../../modules/pet-taxi/pet-taxi.schema.js';
import { PET_TAXI_TRIP_TYPES, PET_TAXI_STATUSES, PET_TAXI_RATES } from '../../modules/pet-taxi/pet-taxi.constants.js';
import { RelocationRequestModel } from '../../modules/pet-relocation/pet-relocation.schema.js';
import { TRANSPORT_TYPES, TIME_SLOTS, RELOCATION_STATUSES } from '../../modules/pet-relocation/pet-relocation.constants.js';
import { InsuranceApplicationModel } from '../../modules/pet-insurance/pet-insurance.schema.js';
import { PET_TYPES, APPLICATION_STATUSES } from '../../modules/pet-insurance/pet-insurance.constants.js';
import { NotificationModel } from '../../modules/notifications/notification.schema.js';
import { NOTIFICATION_TYPES } from '../../modules/notifications/notification.constants.js';
import { BlogModel } from '../../modules/blogs/blog.schema.js';
import { BannerModel, FeatureFlagModel } from '../../modules/admin/admin.schema.js';
import { SupportTicketModel, TicketMessageModel } from '../../modules/support/support.schema.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);
const daysFromNow = (n: number) => new Date(Date.now() + n * DAY_MS);

/** Koramangala, Bangalore — every seeded address/provider sits within a few km of here so
 * geo queries (nearby providers, lost & found radius, pet companion discover) return results. */
const KORAMANGALA: [number, number] = [77.6146, 12.9352];
/** GeoJSON is [lng, lat] — the app's test/dev location is fixed here (22.5753941N, 88.4797903E,
 * Kolkata), so a second full provider/service set is seeded around this point too, or nearby
 * searches from this location come back empty and the booking wizard never gets a provider to
 * even ask /availability about. */
const KOLKATA: [number, number] = [88.47979029999999, 22.575393100000003];
/** Digha, West Bengal — requested test location so nearby searches from there return results too. */
const DIGHA: [number, number] = [87.55930839999999, 21.674505699999997];
function jitter([lng, lat]: [number, number], meters: number): [number, number] {
  const deg = meters / 111_320; // ~meters per degree latitude
  return [lng + (Math.random() - 0.5) * deg, lat + (Math.random() - 0.5) * deg];
}

const WEEKDAY_HOURS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => ({
  day,
  openTime: '09:00',
  closeTime: '19:00',
  isClosed: false,
}));
const STANDARD_WORKING_HOURS = [
  ...WEEKDAY_HOURS,
  { day: 'SUN', openTime: '09:00', closeTime: '19:00', isClosed: true },
];

async function seed(): Promise<void> {
  await connectDatabase();

  const alreadySeeded = await CityModel.findOne({ name: 'Bangalore' }).exec();
  if (alreadySeeded) {
    logger.info('Seed data already present (found city "Bangalore") — skipping. Delete it (and its dependents) to reseed.');
    await disconnectDatabase();
    return;
  }

  logger.info('Seeding Patmypets dev dataset...');

  // ---- Geography ----------------------------------------------------------
  const bangalore = await CityModel.create({ name: 'Bangalore', state: 'Karnataka', country: 'India' });
  await CityModel.create({ name: 'Mumbai', state: 'Maharashtra', country: 'India' });
  const kolkata = await CityModel.create({ name: 'Kolkata', state: 'West Bengal', country: 'India' });
  const koramangala = await ZoneModel.create({
    name: 'Koramangala',
    cityId: bangalore._id,
    center: { type: 'Point', coordinates: KORAMANGALA },
    radiusMeters: 8000,
  });
  const kolkataZone = await ZoneModel.create({
    name: 'Kolkata Central',
    cityId: kolkata._id,
    center: { type: 'Point', coordinates: KOLKATA },
    radiusMeters: 8000,
  });
  const digha = await CityModel.create({ name: 'Digha', state: 'West Bengal', country: 'India' });
  const dighaZone = await ZoneModel.create({
    name: 'Digha Central',
    cityId: digha._id,
    center: { type: 'Point', coordinates: DIGHA },
    radiusMeters: 8000,
  });

  // ---- Categories -----------------------------------------------------------
  // picsum.photos serves a real (if generic) photo per seed string — unlike the old
  // https://cdn.petmypet.in/... placeholders, which point at a domain nobody ever stood up
  // and so rendered as broken images everywhere in the app.
  const seedImage = (seedKey: string, w = 600, h = 600) =>
    `https://picsum.photos/seed/${seedKey}/${w}/${h}`;

  async function createCategory(name: string, slug: string, providerTypes: string[]) {
    return CategoryModel.create({
      name,
      slug,
      providerTypes,
      description: `${name} services`,
      iconUrl: seedImage(`category-${slug}`, 200, 200),
    });
  }
  const categoryGrooming = await createCategory('Grooming', 'grooming', [PROVIDER_TYPES.GROOMER]);
  const categoryVeterinary = await createCategory('Veterinary', 'veterinary', [PROVIDER_TYPES.VET]);
  const categoryBoarding = await createCategory('Boarding', 'boarding', [PROVIDER_TYPES.BOARDING]);
  const categoryDogWalking = await createCategory('Dog Walking', 'dog-walking', [PROVIDER_TYPES.PET_WALKER]);
  const categoryDogTraining = await createCategory('Dog Training', 'dog-training', [PROVIDER_TYPES.TRAINER]);
  const categoryPetSitting = await createCategory('Pet Sitting', 'pet-sitting', [PROVIDER_TYPES.PET_SITTER]);
  await createCategory('Pharmacy', 'pharmacy', [PROVIDER_TYPES.PHARMACY]);

  // ---- Admin ----------------------------------------------------------------
  const adminPasswordHash = await hashPassword('Admin@12345');
  await UserModel.create({
    role: ROLES.SUPER_ADMIN,
    name: 'Patmypets Admin',
    email: 'admin@seed.patmypets.in',
    phone: '+919111000000',
    passwordHash: adminPasswordHash,
    isVerified: true,
  });

  // ---- End users --------------------------------------------------------
  const userPasswordHash = await hashPassword('Passw0rd!');
  const priya = await UserModel.create({
    role: ROLES.USER,
    name: 'Priya Sharma',
    email: 'priya.sharma@seed.patmypets.in',
    phone: '+919111000001',
    passwordHash: userPasswordHash,
    isVerified: true,
    referralCode: 'PRIYA001',
    serviceInterests: ['Grooming', 'Veterinary', 'Vaccination'],
    emergencyContact: { name: 'Anil Sharma', phone: '+919111011111' },
    addresses: [
      {
        label: 'Home',
        addressLine1: 'Flat 4B, Green Heights Apartment',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560034',
        country: 'India',
        location: { type: 'Point', coordinates: jitter(KORAMANGALA, 500) },
        isDefault: true,
      },
    ],
  });

  const rahul = await UserModel.create({
    role: ROLES.USER,
    name: 'Rahul Verma',
    email: 'rahul.verma@seed.patmypets.in',
    phone: '+919111000002',
    passwordHash: userPasswordHash,
    isVerified: true,
    referredBy: priya._id,
    addresses: [
      {
        label: 'Home',
        addressLine1: '221B Baker Street, Near HSR Layout',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560102',
        country: 'India',
        location: { type: 'Point', coordinates: jitter(KORAMANGALA, 1500) },
        isDefault: true,
      },
    ],
  });

  const ananya = await UserModel.create({
    role: ROLES.USER,
    name: 'Ananya S.',
    email: 'ananya.s@seed.patmypets.in',
    phone: '+919111000003',
    passwordHash: userPasswordHash,
    isVerified: true,
    addresses: [
      {
        label: 'Home',
        addressLine1: '12 MG Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        location: { type: 'Point', coordinates: jitter(KORAMANGALA, 2000) },
        isDefault: true,
      },
    ],
  });

  // ---- Providers --------------------------------------------------------
  async function createProviderWithUser(opts: {
    name: string;
    businessName: string;
    providerType: string;
    experienceYears: number;
    languages: string[];
    metadata: Record<string, unknown>;
    commissionPercent?: number;
    bankAccount?: boolean;
    zoneId?: Types.ObjectId;
    center?: [number, number];
    addressLabel?: string;
    certifications?: { title: string; issuedBy: string; issuedYear: number }[];
    successRatePercent?: number;
    profileImageUrl?: string;
  }) {
    const email = `${opts.name.toLowerCase().replace(/[^a-z]+/g, '.')}@seed.patmypets-partner.in`;
    const slug = opts.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const providerUser = await UserModel.create({
      role: ROLES.SERVICE_PROVIDER,
      name: opts.name,
      email,
      phone: `+91911${Math.floor(1000000 + Math.random() * 8999999)}`,
      passwordHash: userPasswordHash,
      isVerified: true,
    });

    const zoneId = opts.zoneId ?? koramangala._id;
    const center = opts.center ?? KORAMANGALA;
    const addressLabel = opts.addressLabel ?? `${opts.businessName}, Koramangala, Bangalore, Karnataka 560034`;

    const provider = await ProviderModel.create({
      userId: providerUser._id,
      providerType: opts.providerType,
      businessName: opts.businessName,
      description: `${opts.businessName} — trusted Patmypets partner.`,
      experienceYears: opts.experienceYears,
      languages: opts.languages,
      kycStatus: KYC_STATUSES.APPROVED,
      zoneIds: [zoneId],
      location: { type: 'Point', coordinates: jitter(center, 1000) },
      address: addressLabel,
      workingHours: STANDARD_WORKING_HOURS,
      metadata: opts.metadata,
      commissionPercent: opts.commissionPercent ?? null,
      rating: 4.5 + Math.random() * 0.4,
      ratingCount: Math.floor(50 + Math.random() * 200),
      isActive: true,
      attendance: [
        { date: new Date(daysAgo(1)).toISOString().slice(0, 10), checkInAt: daysAgo(1), checkOutAt: daysAgo(1) },
      ],
      unavailableDates: [daysFromNow(20)],
      profileImageUrl: opts.profileImageUrl ?? seedImage(slug, 400, 400),
      galleryUrls: opts.profileImageUrl
        ? [opts.profileImageUrl, seedImage(`${slug}-1`, 800, 600)]
        : [seedImage(`${slug}-1`, 800, 600), seedImage(`${slug}-2`, 800, 600)],
      certifications: opts.certifications ?? [
        { title: 'Certified Pet Care Professional', issuedBy: 'Indian Canine Training', issuedYear: 2022 },
      ],
      successRatePercent: opts.successRatePercent ?? Math.floor(92 + Math.random() * 7),
      ...(opts.bankAccount
        ? {
            bankAccount: {
              accountHolderName: opts.name,
              accountNumber: '000123456789',
              ifscCode: 'HDFC0001234',
              bankName: 'HDFC Bank',
            },
          }
        : {}),
    });

    return { providerUser, provider };
  }

  const groomer = await createProviderWithUser({
    name: 'Rohit Grooming',
    businessName: 'Happy Paws Grooming',
    providerType: PROVIDER_TYPES.GROOMER,
    experienceYears: 5,
    languages: ['English', 'Hindi'],
    metadata: { groomer: { specializations: ['bathing', 'haircut', 'deshedding'] } },
    bankAccount: true,
  });

  const vet = await createProviderWithUser({
    name: 'Dr Rahul Sharma',
    businessName: 'Paws & Care Vet Clinic',
    providerType: PROVIDER_TYPES.VET,
    experienceYears: 12,
    languages: ['English', 'Hindi', 'Bengali'],
    metadata: {
      vet: {
        specializations: ['General', 'Surgery', 'Vaccination'],
        consultationFee: 599,
        licenseNumber: 'VET-KA-1234',
        supportsVideoConsultation: true,
      },
    },
  });

  const boarding = await createProviderWithUser({
    name: 'Paw Stay Boarding',
    businessName: 'Paw Stay Boarding Center',
    providerType: PROVIDER_TYPES.BOARDING,
    experienceYears: 8,
    languages: ['English', 'Kannada'],
    metadata: { boarding: { capacity: 20, availableKennels: 8, amenities: ['24/7 Care', 'Play Area', 'CCTV Monitored'] } },
  });

  const walker = await createProviderWithUser({
    name: 'Rahul Walker',
    businessName: "Rahul's Dog Walking",
    providerType: PROVIDER_TYPES.PET_WALKER,
    experienceYears: 6,
    languages: ['English', 'Hindi'],
    metadata: { petWalker: { maxPetsPerWalk: 3 } },
  });

  const trainer = await createProviderWithUser({
    name: 'Alex Sterling',
    businessName: 'K9 Behaviorist Training',
    providerType: PROVIDER_TYPES.TRAINER,
    experienceYears: 6,
    languages: ['English'],
    metadata: {
      trainer: {
        trainingPlans: [
          {
            name: 'Popular Package',
            description: '4-session obedience program',
            price: 3999,
            durationDays: 30,
            goals: ['PUPPY_TRAINING', 'BASIC_OBEDIENCE'],
          },
        ],
      },
    },
  });

  const sitter = await createProviderWithUser({
    name: 'Trusted Pet Sitters',
    businessName: 'Trusted Pet Sitters Co.',
    providerType: PROVIDER_TYPES.PET_SITTER,
    experienceYears: 3,
    languages: ['English', 'Hindi'],
    metadata: { petSitter: { maxPetsAtOnce: 2 } },
  });

  await createProviderWithUser({
    name: 'PetCare Pharmacy',
    businessName: 'PetCare Pharmacy',
    providerType: PROVIDER_TYPES.PHARMACY,
    experienceYears: 4,
    languages: ['English'],
    metadata: { pharmacy: { licenseNumber: 'PH-KA-0001' } },
  });

  await createProviderWithUser({
    name: 'SafeMove Relocation',
    businessName: 'SafeMove Pet Relocation',
    providerType: PROVIDER_TYPES.RELOCATION,
    experienceYears: 7,
    languages: ['English', 'Hindi'],
    metadata: { relocation: { vehicleTypes: ['AC Van', 'Cargo Vehicle'] } },
  });

  // ---- Kolkata providers (distinct names to avoid colliding with the Bangalore set's
  // auto-generated emails) — same shape, anchored at the app's actual test/dev location. ----
  const kolkataOpts = { zoneId: kolkataZone._id, center: KOLKATA };
  const groomerKolkata = await createProviderWithUser({
    ...kolkataOpts,
    name: 'Priyanka Grooming',
    businessName: 'Kolkata Paws Grooming Studio',
    providerType: PROVIDER_TYPES.GROOMER,
    experienceYears: 6,
    languages: ['English', 'Hindi', 'Bengali'],
    metadata: { groomer: { specializations: ['bathing', 'haircut', 'deshedding'] } },
    addressLabel: 'Kolkata Paws Grooming Studio, Park Street, Kolkata, West Bengal 700016',
  });
  const vetKolkata = await createProviderWithUser({
    ...kolkataOpts,
    name: 'Dr Ananya Chatterjee',
    businessName: 'Kolkata Pet Care Clinic',
    providerType: PROVIDER_TYPES.VET,
    experienceYears: 10,
    languages: ['English', 'Hindi', 'Bengali'],
    metadata: {
      vet: {
        specializations: ['General', 'Surgery', 'Vaccination'],
        consultationFee: 599,
        licenseNumber: 'VET-WB-5678',
        supportsVideoConsultation: true,
      },
    },
    addressLabel: 'Kolkata Pet Care Clinic, Park Street, Kolkata, West Bengal 700016',
  });
  const boardingKolkata = await createProviderWithUser({
    ...kolkataOpts,
    name: 'Kolkata Paw Stay',
    businessName: 'Kolkata Paw Stay Boarding Center',
    providerType: PROVIDER_TYPES.BOARDING,
    experienceYears: 5,
    languages: ['English', 'Bengali'],
    metadata: { boarding: { capacity: 15, availableKennels: 6, amenities: ['24/7 Care', 'Play Area', 'CCTV Monitored'] } },
    addressLabel: 'Kolkata Paw Stay Boarding Center, Salt Lake, Kolkata, West Bengal 700091',
    // Real storefront photo (until Cloudinary creds are configured) served from /static.
    profileImageUrl: `${env.PUBLIC_BASE_URL}/static/seed/kolkata-boarding-center.jpg`,
  });
  const walkerKolkata = await createProviderWithUser({
    ...kolkataOpts,
    name: 'Souvik Walker',
    businessName: "Souvik's Dog Walking",
    providerType: PROVIDER_TYPES.PET_WALKER,
    experienceYears: 4,
    languages: ['English', 'Bengali'],
    metadata: { petWalker: { maxPetsPerWalk: 3 } },
    addressLabel: 'Salt Lake, Kolkata, West Bengal 700091',
  });
  const trainerKolkata = await createProviderWithUser({
    ...kolkataOpts,
    name: 'Ritwik Behaviorist',
    businessName: 'Kolkata K9 Training',
    providerType: PROVIDER_TYPES.TRAINER,
    experienceYears: 5,
    languages: ['English', 'Bengali'],
    metadata: {
      trainer: {
        trainingPlans: [
          {
            name: 'Popular Package',
            description: '4-session obedience program',
            price: 3999,
            durationDays: 30,
            goals: ['PUPPY_TRAINING', 'BASIC_OBEDIENCE'],
          },
        ],
      },
    },
    addressLabel: 'Salt Lake, Kolkata, West Bengal 700091',
  });
  const sitterKolkata = await createProviderWithUser({
    ...kolkataOpts,
    name: 'Kolkata Trusted Sitters',
    businessName: 'Kolkata Trusted Pet Sitters',
    providerType: PROVIDER_TYPES.PET_SITTER,
    experienceYears: 3,
    languages: ['English', 'Bengali'],
    metadata: { petSitter: { maxPetsAtOnce: 2 } },
    addressLabel: 'Park Street, Kolkata, West Bengal 700016',
  });

  // ---- Digha providers (requested test location) --------------------------
  const dighaOpts = { zoneId: dighaZone._id, center: DIGHA };
  const boardingDigha = await createProviderWithUser({
    ...dighaOpts,
    name: 'Digha Paw Stay',
    businessName: 'Digha Paw Stay Boarding Center',
    providerType: PROVIDER_TYPES.BOARDING,
    experienceYears: 6,
    languages: ['English', 'Bengali'],
    metadata: { boarding: { capacity: 12, availableKennels: 5, amenities: ['24/7 Care', 'Play Area', 'CCTV Monitored'] } },
    addressLabel: 'Digha Paw Stay Boarding Center, New Digha, West Bengal 721428',
  });
  const vetDigha = await createProviderWithUser({
    ...dighaOpts,
    name: 'Dr Aniket Roy',
    businessName: 'Digha Popular Pet Clinic',
    providerType: PROVIDER_TYPES.VET,
    experienceYears: 9,
    languages: ['English', 'Hindi', 'Bengali'],
    metadata: {
      vet: {
        specializations: ['General', 'Surgery', 'Vaccination'],
        consultationFee: 499,
        licenseNumber: 'VET-WB-9012',
        supportsVideoConsultation: true,
      },
    },
    addressLabel: 'Digha Popular Pet Clinic, New Digha, West Bengal 721428',
  });

  // ---- Services (= "packages" shown in the app) --------------------------
  async function createService(data: Record<string, unknown> & { name: string }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return ServiceModel.create({ ...data, images: [seedImage(`service-${slug}`, 600, 600)] });
  }

  const groomingBasic = await createService({
    providerId: groomer.provider._id,
    categoryId: categoryGrooming._id,
    name: 'Basic Grooming',
    description: 'Bath, Blow Dry, Nail Trim',
    price: 499,
    originalPrice: 799,
    durationMinutes: 45,
  });
  await createService({
    providerId: groomer.provider._id,
    categoryId: categoryGrooming._id,
    name: 'Standard Grooming',
    description: 'Bath, Blow Dry, Nail Trim, Hair Trim, Ear Cleaning',
    price: 899,
    originalPrice: 1199,
    durationMinutes: 60,
  });
  await createService({
    providerId: groomer.provider._id,
    categoryId: categoryGrooming._id,
    name: 'Premium Grooming',
    description: 'Full Grooming, Styling, De-shedding, Paw Care',
    price: 1299,
    originalPrice: 1799,
    durationMinutes: 90,
  });

  const onlineConsult = await createService({
    providerId: vet.provider._id,
    categoryId: categoryVeterinary._id,
    name: 'Online Video Consultation',
    description: 'Video consultation with a licensed vet',
    price: 599,
    originalPrice: 999,
    durationMinutes: 20,
  });
  await createService({
    providerId: vet.provider._id,
    categoryId: categoryVeterinary._id,
    name: 'Clinic Consultation',
    description: 'In-clinic consultation',
    price: 799,
    originalPrice: 1599,
    durationMinutes: 30,
  });
  await createService({
    providerId: vet.provider._id,
    categoryId: categoryVeterinary._id,
    name: 'Essential Vaccination Package',
    description: 'DHPPi + Anti-Rabies + Deworming Consultation',
    price: 1299,
    originalPrice: 1599,
    durationMinutes: 20,
  });

  const walkAddOns = [
    { name: 'Extra 15 Min', price: 79 },
    { name: 'Poo Pickup', price: 49 },
    { name: 'Hydration Break', price: 29 },
  ];
  await createService({
    providerId: walker.provider._id,
    categoryId: categoryDogWalking._id,
    name: '30 Min Walk',
    description: 'Standard 30-minute walk',
    price: 199,
    durationMinutes: 30,
    addOnCatalog: walkAddOns,
  });
  await createService({
    providerId: walker.provider._id,
    categoryId: categoryDogWalking._id,
    name: '45 Min Walk',
    description: 'Extended 45-minute walk',
    price: 249,
    durationMinutes: 45,
    addOnCatalog: walkAddOns,
  });
  await createService({
    providerId: walker.provider._id,
    categoryId: categoryDogWalking._id,
    name: '60 Min Walk',
    description: 'Adventure 60-minute walk',
    price: 299,
    durationMinutes: 60,
    addOnCatalog: walkAddOns,
  });

  const boardingService = await createService({
    providerId: boarding.provider._id,
    categoryId: categoryBoarding._id,
    name: 'Standard Boarding',
    description: 'Per-day boarding with daily walks',
    price: 899,
    durationMinutes: 1440,
    addOnCatalog: [
      { name: 'Extra Playtime', price: 150 },
      { name: 'Grooming', price: 300 },
      { name: 'Special Diet', price: 100 },
    ],
  });

  await createService({
    providerId: trainer.provider._id,
    categoryId: categoryDogTraining._id,
    name: 'Basic Obedience Training',
    description: 'One-on-one obedience session',
    price: 799,
    durationMinutes: 60,
  });

  await createService({
    providerId: sitter.provider._id,
    categoryId: categoryPetSitting._id,
    name: 'Pet Sitting Visit',
    description: 'In-home pet sitting visit',
    price: 399,
    durationMinutes: 60,
  });

  // ---- Kolkata services — same package structure as Bangalore, different providers ------
  await createService({
    providerId: groomerKolkata.provider._id,
    categoryId: categoryGrooming._id,
    name: 'Basic Grooming',
    description: 'Bath, Blow Dry, Nail Trim',
    price: 499,
    originalPrice: 799,
    durationMinutes: 45,
  });
  await createService({
    providerId: groomerKolkata.provider._id,
    categoryId: categoryGrooming._id,
    name: 'Standard Grooming',
    description: 'Bath, Blow Dry, Nail Trim, Hair Trim, Ear Cleaning',
    price: 899,
    originalPrice: 1199,
    durationMinutes: 60,
  });
  await createService({
    providerId: groomerKolkata.provider._id,
    categoryId: categoryGrooming._id,
    name: 'Premium Grooming',
    description: 'Full Grooming, Styling, De-shedding, Paw Care',
    price: 1299,
    originalPrice: 1799,
    durationMinutes: 90,
  });

  await createService({
    providerId: vetKolkata.provider._id,
    categoryId: categoryVeterinary._id,
    name: 'Online Video Consultation',
    description: 'Video consultation with a licensed vet',
    price: 599,
    originalPrice: 999,
    durationMinutes: 20,
  });
  await createService({
    providerId: vetKolkata.provider._id,
    categoryId: categoryVeterinary._id,
    name: 'Clinic Consultation',
    description: 'In-clinic consultation',
    price: 799,
    originalPrice: 1599,
    durationMinutes: 30,
  });
  await createService({
    providerId: vetKolkata.provider._id,
    categoryId: categoryVeterinary._id,
    name: 'Essential Vaccination Package',
    description: 'DHPPi + Anti-Rabies + Deworming Consultation',
    price: 1299,
    originalPrice: 1599,
    durationMinutes: 20,
  });

  await createService({
    providerId: walkerKolkata.provider._id,
    categoryId: categoryDogWalking._id,
    name: '30 Min Walk',
    description: 'Standard 30-minute walk',
    price: 199,
    durationMinutes: 30,
    addOnCatalog: walkAddOns,
  });
  await createService({
    providerId: walkerKolkata.provider._id,
    categoryId: categoryDogWalking._id,
    name: '45 Min Walk',
    description: 'Extended 45-minute walk',
    price: 249,
    durationMinutes: 45,
    addOnCatalog: walkAddOns,
  });
  await createService({
    providerId: walkerKolkata.provider._id,
    categoryId: categoryDogWalking._id,
    name: '60 Min Walk',
    description: 'Adventure 60-minute walk',
    price: 299,
    durationMinutes: 60,
    addOnCatalog: walkAddOns,
  });

  await createService({
    providerId: boardingKolkata.provider._id,
    categoryId: categoryBoarding._id,
    name: 'Standard Boarding',
    description: 'Per-day boarding with daily walks',
    price: 899,
    durationMinutes: 1440,
    addOnCatalog: [
      { name: 'Extra Playtime', price: 150 },
      { name: 'Grooming', price: 300 },
      { name: 'Special Diet', price: 100 },
    ],
  });

  await createService({
    providerId: trainerKolkata.provider._id,
    categoryId: categoryDogTraining._id,
    name: 'Basic Obedience Training',
    description: 'One-on-one obedience session',
    price: 799,
    durationMinutes: 60,
  });

  await createService({
    providerId: sitterKolkata.provider._id,
    categoryId: categoryPetSitting._id,
    name: 'Pet Sitting Visit',
    description: 'In-home pet sitting visit',
    price: 399,
    durationMinutes: 60,
  });

  await createService({
    providerId: boardingDigha.provider._id,
    categoryId: categoryBoarding._id,
    name: 'Standard Boarding',
    description: 'Per-day boarding with daily walks',
    price: 799,
    durationMinutes: 1440,
    addOnCatalog: [
      { name: 'Extra Playtime', price: 150 },
      { name: 'Grooming', price: 300 },
    ],
  });

  await createService({
    providerId: vetDigha.provider._id,
    categoryId: categoryVeterinary._id,
    name: 'General Consultation',
    description: 'In-clinic or video vet consultation',
    price: 499,
    durationMinutes: 30,
  });

  // ---- Pets ---------------------------------------------------------------
  const bruno = await PetModel.create({
    ownerId: priya._id,
    name: 'Bruno',
    species: PET_SPECIES.DOG,
    breed: 'Golden Retriever',
    gender: PET_GENDERS.MALE,
    dateOfBirth: daysAgo(365 * 2),
    weightKg: 28,
    notes: 'Loves belly rubs, allergic to chicken.',
    companionProfile: {
      isEnabled: true,
      bio: 'Bruno loves fetch and making new furry friends at the park.',
      personalityTraits: ['playful', 'friendly', 'energetic'],
      interests: ['fetch', 'swimming', 'long walks'],
      lookingFor: ['playdates', 'running buddy'],
      activityLevel: COMPANION_ACTIVITY_LEVELS.HIGH,
      temperament: 'Gentle with smaller dogs',
      neutered: true,
      getsAlongWith: {
        dogs: GETS_ALONG_WITH_STATUS.YES,
        cats: GETS_ALONG_WITH_STATUS.NEEDS_INTRODUCTION,
        kids: GETS_ALONG_WITH_STATUS.YES,
        families: GETS_ALONG_WITH_STATUS.YES,
      },
    },
  });

  const max = await PetModel.create({
    ownerId: rahul._id,
    name: 'Max',
    species: PET_SPECIES.DOG,
    breed: 'Labrador Retriever',
    gender: PET_GENDERS.MALE,
    dateOfBirth: daysAgo(365 * 3),
    weightKg: 30,
    companionProfile: {
      isEnabled: true,
      bio: 'Max is a laid-back lab who loves the dog park and long walks.',
      personalityTraits: ['calm', 'friendly'],
      interests: ['long walks', 'fetch'],
      lookingFor: ['walking buddy', 'playdates'],
      activityLevel: COMPANION_ACTIVITY_LEVELS.MEDIUM,
      temperament: 'Easygoing with other dogs',
      neutered: true,
      getsAlongWith: {
        dogs: GETS_ALONG_WITH_STATUS.YES,
        cats: GETS_ALONG_WITH_STATUS.YES,
        kids: GETS_ALONG_WITH_STATUS.YES,
        families: GETS_ALONG_WITH_STATUS.YES,
      },
    },
  });

  const luna = await PetModel.create({
    ownerId: ananya._id,
    name: 'Luna',
    species: PET_SPECIES.DOG,
    breed: 'Golden Retriever',
    gender: PET_GENDERS.FEMALE,
    dateOfBirth: daysAgo(365),
    weightKg: 22,
    companionProfile: {
      isEnabled: true,
      bio: 'Luna loves the dog park and swimming.',
      personalityTraits: ['friendly', 'playful'],
      interests: ['fetch', 'swimming'],
      lookingFor: ['playdates'],
      activityLevel: COMPANION_ACTIVITY_LEVELS.HIGH,
      temperament: 'Great with other dogs',
      neutered: true,
      getsAlongWith: {
        dogs: GETS_ALONG_WITH_STATUS.YES,
        cats: GETS_ALONG_WITH_STATUS.YES,
        kids: GETS_ALONG_WITH_STATUS.YES,
        families: GETS_ALONG_WITH_STATUS.YES,
      },
    },
  });

  // ---- Products -------------------------------------------------------------
  const foodProduct = await ProductModel.create({
    name: 'Royal Canin Adult Dog Food 3kg',
    description: 'Balanced nutrition for adult dogs.',
    category: PRODUCT_CATEGORIES.FOOD,
    price: 1499,
    mrp: 1699,
    images: [seedImage('product-royal-canin-3kg', 600, 600)],
    stock: 50,
    sku: 'RC-ADT-3KG',
  });
  await ProductModel.create({
    name: 'Pet Daily Multivitamin',
    category: PRODUCT_CATEGORIES.PHARMACY,
    price: 499,
    mrp: 599,
    images: [seedImage('product-multivitamin', 600, 600)],
    stock: 80,
    sku: 'PH-MVIT-001',
  });
  await ProductModel.create({
    name: 'Flea & Tick Defense Spray',
    category: PRODUCT_CATEGORIES.PHARMACY,
    price: 349,
    mrp: 399,
    images: [seedImage('product-flea-spray', 600, 600)],
    stock: 60,
    sku: 'PH-FTS-001',
  });
  await ProductModel.create({
    name: 'Cozy Comfort Pet Bed',
    category: PRODUCT_CATEGORIES.ACCESSORIES,
    price: 1299,
    mrp: 1599,
    images: [seedImage('product-pet-bed', 600, 600)],
    stock: 25,
    sku: 'ACC-BED-001',
  });
  await ProductModel.create({
    name: 'Reflective Safety Collar',
    category: PRODUCT_CATEGORIES.ACCESSORIES,
    price: 349,
    mrp: 399,
    images: [seedImage('product-collar', 600, 600)],
    stock: 100,
    sku: 'ACC-COL-001',
  });
  await ProductModel.create({
    name: 'Rope Toy',
    category: PRODUCT_CATEGORIES.TOYS,
    price: 249,
    mrp: 299,
    images: [seedImage('product-rope-toy', 600, 600)],
    stock: 120,
    sku: 'TOY-ROPE-001',
  });

  // ---- Coupons ----------------------------------------------------------
  await CouponModel.create({
    code: 'WELCOME10',
    description: '10% off, up to ₹200',
    discountType: DISCOUNT_TYPES.PERCENTAGE,
    discountValue: 10,
    maxDiscountAmount: 200,
    minBookingAmount: 300,
    usageLimit: 1000,
    perUserLimit: 1,
    validFrom: daysAgo(30),
    validUntil: daysFromNow(335),
  });
  await CouponModel.create({
    code: 'PETCARE20',
    description: 'First Grooming — 20% off',
    discountType: DISCOUNT_TYPES.PERCENTAGE,
    discountValue: 20,
    minBookingAmount: 0,
    applicableProviderTypes: [PROVIDER_TYPES.GROOMER],
    usageLimit: 500,
    perUserLimit: 1,
    validFrom: daysAgo(10),
    validUntil: daysFromNow(80),
  });

  // ---- Bookings (exercise the full lifecycle + provider analytics) ------
  function computeAmounts(price: number, commissionPercent: number) {
    const commissionAmount = Math.round(price * (commissionPercent / 100) * 100) / 100;
    return { commissionAmount, providerPayoutAmount: Math.round((price - commissionAmount) * 100) / 100 };
  }

  const completedStart = daysAgo(3);
  const { commissionAmount, providerPayoutAmount } = computeAmounts(499, 15);
  const completedBooking = await BookingModel.create({
    userId: rahul._id,
    petId: max._id,
    providerId: groomer.provider._id,
    serviceId: groomingBasic._id,
    zoneId: koramangala._id,
    scheduledStart: completedStart,
    scheduledEnd: new Date(completedStart.getTime() + 45 * 60_000),
    status: BOOKING_STATUSES.COMPLETED,
    otpStart: '112211',
    otpStartVerifiedAt: completedStart,
    otpEnd: '445566',
    otpEndVerifiedAt: new Date(completedStart.getTime() + 45 * 60_000),
    price: 499,
    commissionPercent: 15,
    commissionAmount,
    providerPayoutAmount,
    paymentStatus: BOOKING_PAYMENT_STATUSES.PAID,
  });

  await PaymentModel.create({
    bookingId: completedBooking._id,
    userId: rahul._id,
    amount: 499,
    method: PAYMENT_METHODS.CASH,
    status: PAYMENT_TRANSACTION_STATUSES.CAPTURED,
    purpose: PAYMENT_PURPOSES.BOOKING,
  });

  await ReviewModel.create({
    bookingId: completedBooking._id,
    userId: rahul._id,
    providerId: groomer.provider._id,
    rating: 5,
    comment: 'Excellent service, Bruno loved it!',
  });

  await ReviewModel.create({
    productId: foodProduct._id,
    userId: priya._id,
    rating: 5,
    comment: 'My dog loves this food, great quality.',
  });

  const upcomingStart = daysFromNow(2);
  await BookingModel.create({
    userId: priya._id,
    petId: bruno._id,
    providerId: vet.provider._id,
    serviceId: onlineConsult._id,
    zoneId: koramangala._id,
    scheduledStart: upcomingStart,
    scheduledEnd: new Date(upcomingStart.getTime() + 20 * 60_000),
    status: BOOKING_STATUSES.PENDING,
    otpStart: '223344',
    otpEnd: '556677',
    price: 599,
    commissionPercent: 15,
    consultationMode: 'ONLINE',
  });

  const boardingStart = daysFromNow(1);
  const boardingAddOns = [{ name: 'Extra Playtime', price: 150 }];
  await BookingModel.create({
    userId: rahul._id,
    petId: max._id,
    providerId: boarding.provider._id,
    serviceId: boardingService._id,
    zoneId: koramangala._id,
    scheduledStart: boardingStart,
    scheduledEnd: new Date(boardingStart.getTime() + 3 * DAY_MS),
    status: BOOKING_STATUSES.ACCEPTED,
    otpStart: '334455',
    otpEnd: '667788',
    price: 899 + 150,
    commissionPercent: 15,
    addOns: boardingAddOns,
    durationDays: 3,
    dropOffTime: '09:00',
    pickupTime: '18:00',
  });

  // ---- Wallets ------------------------------------------------------------
  async function seedWallet(userId: Types.ObjectId, amount: number) {
    const wallet = await WalletModel.create({ userId, balance: amount });
    await WalletTransactionModel.create({
      walletId: wallet._id,
      userId,
      type: WALLET_TRANSACTION_TYPES.CREDIT,
      reason: WALLET_TRANSACTION_REASONS.TOPUP,
      amount,
      balanceAfter: amount,
      description: 'Initial wallet top-up',
    });
  }
  await seedWallet(priya._id, 1000);
  await seedWallet(rahul._id, 500);

  // ---- Cart + Order ---------------------------------------------------------
  await CartModel.create({ userId: rahul._id, items: [{ productId: foodProduct._id, quantity: 1 }] });

  await OrderModel.create({
    userId: priya._id,
    items: [{ productId: foodProduct._id, name: foodProduct.name, price: foodProduct.price, quantity: 1 }],
    totalAmount: 1499 + 40,
    deliveryFee: 40,
    shippingAddress: {
      addressLine1: 'Flat 4B, Green Heights Apartment',
      city: 'Bangalore',
      state: 'Karnataka',
      postalCode: '560034',
      country: 'India',
    },
    status: ORDER_STATUSES.DELIVERED,
    paymentMethod: ORDER_PAYMENT_METHODS.WALLET,
    paymentStatus: ORDER_PAYMENT_STATUSES.PAID,
  });

  // ---- Lost & Found -----------------------------------------------------
  await LostAndFoundModel.create({
    reporterId: ananya._id,
    type: LOST_AND_FOUND_TYPES.LOST,
    petName: 'Tommy',
    species: 'Dog',
    breed: 'Siberian Husky',
    age: '3 years',
    gender: PET_GENDERS.MALE,
    rewardAmount: 5000,
    description: "Last seen near Cubbon Park wearing a red collar.",
    photoUrls: [seedImage('lost-and-found-tommy', 600, 600)],
    lastSeenLocation: { type: 'Point', coordinates: jitter(KORAMANGALA, 3000) },
    contactPhone: ananya.phone,
    approvalStatus: APPROVAL_STATUSES.APPROVED,
  });
  await LostAndFoundModel.create({
    reporterId: rahul._id,
    type: LOST_AND_FOUND_TYPES.FOUND,
    species: 'Cat',
    breed: 'Indie',
    age: '1 year',
    gender: PET_GENDERS.UNKNOWN,
    description: 'Found a friendly cat wandering near Indiranagar metro station.',
    lastSeenLocation: { type: 'Point', coordinates: jitter(KORAMANGALA, 4000) },
    contactPhone: rahul.phone,
    approvalStatus: APPROVAL_STATUSES.PENDING,
  });

  // ---- Referral (Priya referred Rahul; Rahul completed his first booking) --
  await ReferralModel.create({
    referrerId: priya._id,
    refereeId: rahul._id,
    status: REFERRAL_STATUSES.REWARDED,
    rewardPoints: REFERRAL_REWARD_POINTS,
  });

  // ---- Pet Companion: mutual match between Bruno and Luna, plus a chat --
  await PetSwipeModel.create({ swiperPetId: bruno._id, targetPetId: luna._id, action: SWIPE_ACTIONS.LIKE });
  await PetSwipeModel.create({ swiperPetId: luna._id, targetPetId: bruno._id, action: SWIPE_ACTIONS.LIKE });

  const companionChatRoom = await ChatRoomModel.create({
    participantIds: [priya._id, ananya._id],
    lastMessagePreview: 'Would love a playdate with Luna!',
    lastMessageAt: daysAgo(1),
  });
  await MessageModel.create({
    roomId: companionChatRoom._id,
    senderId: priya._id,
    text: 'Would love a playdate with Luna!',
  });

  const [petAId, petBId] =
    bruno._id.toString() < luna._id.toString() ? [bruno._id, luna._id] : [luna._id, bruno._id];
  await PetMatchModel.create({ petAId, petBId, chatRoomId: companionChatRoom._id });

  // ---- Pet Taxi / Pet Relocation / Pet Insurance -------------------------
  await PetTaxiBookingModel.create({
    userId: priya._id,
    tripType: PET_TAXI_TRIP_TYPES.ONE_WAY,
    petIds: [bruno._id],
    pickupAddress: '123, Green Park, New Delhi 110016',
    dropAddress: '45, Ring Road, South Extension, New Delhi 110049',
    pickupDate: daysFromNow(4),
    pickupTime: '12:00',
    price: PET_TAXI_RATES.ONE_WAY,
    status: PET_TAXI_STATUSES.PENDING,
  });

  await RelocationRequestModel.create({
    userId: rahul._id,
    ownerName: rahul.name,
    ownerPhone: rahul.phone,
    ownerEmail: rahul.email,
    petId: max._id,
    originAddress: 'Bangalore, Karnataka',
    destinationAddress: 'Kolkata, West Bengal',
    relocationDate: daysFromNow(30),
    transportType: TRANSPORT_TYPES.ROAD,
    preferredTimeSlot: TIME_SLOTS.MORNING,
    status: RELOCATION_STATUSES.SUBMITTED,
  });

  await InsuranceApplicationModel.create({
    userId: priya._id,
    ownerName: priya.name,
    ownerEmail: priya.email,
    ownerPhone: priya.phone,
    petName: bruno.name,
    petType: PET_TYPES.DOG,
    petAge: '2 years',
    petBreed: bruno.breed,
    previousIllness: false,
    previousSurgery: false,
    vaccinated: true,
    vaccinationDocumentUrls: ['https://cdn.petmypet.in/insurance/bruno-vaccination.pdf'],
    status: APPLICATION_STATUSES.SUBMITTED,
  });

  // ---- Notifications ------------------------------------------------------
  await NotificationModel.create({
    userId: rahul._id,
    type: NOTIFICATION_TYPES.BOOKING_COMPLETED,
    title: 'Service completed',
    body: 'Your grooming service is complete. Please rate your experience.',
    data: { bookingId: completedBooking._id.toString() },
  });
  await NotificationModel.create({
    userId: priya._id,
    type: NOTIFICATION_TYPES.BOOKING_CREATED,
    title: 'Booking confirmed',
    body: 'Your online vet consultation is scheduled.',
    isRead: true,
  });

  // ---- Blog / Banner / Feature flag ---------------------------------------
  await BlogModel.create({
    authorId: (await UserModel.findOne({ role: ROLES.SUPER_ADMIN }))!._id,
    title: 'Protect Your Pet with Timely Vaccinations',
    slug: 'protect-your-pet-with-timely-vaccinations',
    content: 'Regular vaccinations keep your pet healthy and protected against common diseases...',
    tags: ['pet-care', 'vaccination'],
    isPublished: true,
    publishedAt: daysAgo(5),
  });

  await BannerModel.create({
    title: 'Grooming at Home — Book Now',
    subtitle: 'Certified groomers, right at your doorstep',
    imageUrl: seedImage('banner-grooming-home', 1200, 500),
    linkUrl: '/services?categoryId=grooming',
    order: 1,
  });

  await FeatureFlagModel.create({
    key: 'pet_companion_enabled',
    isEnabled: true,
    description: 'Enables the Pet Companion matching feature',
  });

  // ---- Support ticket -------------------------------------------------------
  const ticket = await SupportTicketModel.create({
    userId: rahul._id,
    subject: 'Question about my grooming booking',
    priority: 'MEDIUM',
  });
  await TicketMessageModel.create({
    ticketId: ticket._id,
    senderId: rahul._id,
    content: 'Can I reschedule my upcoming boarding booking?',
  });

  logger.info('Seed complete.');
  logger.info('--- Test credentials (all end-user/provider passwords: Passw0rd!) ---');
  logger.info(`Admin        : admin@seed.patmypets.in / Admin@12345`);
  logger.info(`User (Priya) : priya.sharma@seed.patmypets.in / +919111000001`);
  logger.info(`User (Rahul) : rahul.verma@seed.patmypets.in / +919111000002 (referred by Priya)`);
  logger.info(`User (Ananya): ananya.s@seed.patmypets.in / +919111000003`);
  logger.info(`Groomer      : ${groomer.providerUser.email}`);
  logger.info(`Vet          : ${vet.providerUser.email}`);
  logger.info(`Boarding     : ${boarding.providerUser.email}`);
  logger.info(`Walker       : ${walker.providerUser.email}`);
  logger.info(`Trainer      : ${trainer.providerUser.email}`);
  logger.info(`Pet Sitter   : ${sitter.providerUser.email}`);
  logger.info('All provider/user accounts are phone+OTP-capable too — OTP is fixed to 123456 until SMTP/SMS creds are configured.');

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

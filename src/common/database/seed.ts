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
  const koramangala = await ZoneModel.create({
    name: 'Koramangala',
    cityId: bangalore._id,
    center: { type: 'Point', coordinates: KORAMANGALA },
    radiusMeters: 8000,
  });

  // ---- Categories -----------------------------------------------------------
  async function createCategory(name: string, slug: string, providerTypes: string[]) {
    return CategoryModel.create({ name, slug, providerTypes, description: `${name} services` });
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
  }) {
    const email = `${opts.name.toLowerCase().replace(/[^a-z]+/g, '.')}@seed.patmypets-partner.in`;
    const providerUser = await UserModel.create({
      role: ROLES.SERVICE_PROVIDER,
      name: opts.name,
      email,
      phone: `+91911${Math.floor(1000000 + Math.random() * 8999999)}`,
      passwordHash: userPasswordHash,
      isVerified: true,
    });

    const provider = await ProviderModel.create({
      userId: providerUser._id,
      providerType: opts.providerType,
      businessName: opts.businessName,
      description: `${opts.businessName} — trusted Patmypets partner in Bangalore.`,
      experienceYears: opts.experienceYears,
      languages: opts.languages,
      kycStatus: KYC_STATUSES.APPROVED,
      zoneIds: [koramangala._id],
      location: { type: 'Point', coordinates: jitter(KORAMANGALA, 1000) },
      address: `${opts.businessName}, Koramangala, Bangalore, Karnataka 560034`,
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
          { name: 'Popular Package', description: '4-session obedience program', price: 3999, durationDays: 30 },
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

  // ---- Services (= "packages" shown in the app) --------------------------
  const groomingBasic = await ServiceModel.create({
    providerId: groomer.provider._id,
    categoryId: categoryGrooming._id,
    name: 'Basic Grooming',
    description: 'Bath, Blow Dry, Nail Trim',
    price: 499,
    originalPrice: 799,
    durationMinutes: 45,
  });
  await ServiceModel.create({
    providerId: groomer.provider._id,
    categoryId: categoryGrooming._id,
    name: 'Standard Grooming',
    description: 'Bath, Blow Dry, Nail Trim, Hair Trim, Ear Cleaning',
    price: 899,
    originalPrice: 1199,
    durationMinutes: 60,
  });
  await ServiceModel.create({
    providerId: groomer.provider._id,
    categoryId: categoryGrooming._id,
    name: 'Premium Grooming',
    description: 'Full Grooming, Styling, De-shedding, Paw Care',
    price: 1299,
    originalPrice: 1799,
    durationMinutes: 90,
  });

  const onlineConsult = await ServiceModel.create({
    providerId: vet.provider._id,
    categoryId: categoryVeterinary._id,
    name: 'Online Video Consultation',
    description: 'Video consultation with a licensed vet',
    price: 599,
    originalPrice: 999,
    durationMinutes: 20,
  });
  await ServiceModel.create({
    providerId: vet.provider._id,
    categoryId: categoryVeterinary._id,
    name: 'Clinic Consultation',
    description: 'In-clinic consultation',
    price: 799,
    originalPrice: 1599,
    durationMinutes: 30,
  });
  await ServiceModel.create({
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
  await ServiceModel.create({
    providerId: walker.provider._id,
    categoryId: categoryDogWalking._id,
    name: '30 Min Walk',
    description: 'Standard 30-minute walk',
    price: 199,
    durationMinutes: 30,
    addOnCatalog: walkAddOns,
  });
  await ServiceModel.create({
    providerId: walker.provider._id,
    categoryId: categoryDogWalking._id,
    name: '45 Min Walk',
    description: 'Extended 45-minute walk',
    price: 249,
    durationMinutes: 45,
    addOnCatalog: walkAddOns,
  });
  await ServiceModel.create({
    providerId: walker.provider._id,
    categoryId: categoryDogWalking._id,
    name: '60 Min Walk',
    description: 'Adventure 60-minute walk',
    price: 299,
    durationMinutes: 60,
    addOnCatalog: walkAddOns,
  });

  const boardingService = await ServiceModel.create({
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

  await ServiceModel.create({
    providerId: trainer.provider._id,
    categoryId: categoryDogTraining._id,
    name: 'Basic Obedience Training',
    description: 'One-on-one obedience session',
    price: 799,
    durationMinutes: 60,
  });

  await ServiceModel.create({
    providerId: sitter.provider._id,
    categoryId: categoryPetSitting._id,
    name: 'Pet Sitting Visit',
    description: 'In-home pet sitting visit',
    price: 399,
    durationMinutes: 60,
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
    images: ['https://cdn.petmypet.in/products/royal-canin-3kg.jpg'],
    stock: 50,
    sku: 'RC-ADT-3KG',
  });
  await ProductModel.create({
    name: 'Pet Daily Multivitamin',
    category: PRODUCT_CATEGORIES.PHARMACY,
    price: 499,
    mrp: 599,
    images: ['https://cdn.petmypet.in/products/multivitamin.jpg'],
    stock: 80,
    sku: 'PH-MVIT-001',
  });
  await ProductModel.create({
    name: 'Flea & Tick Defense Spray',
    category: PRODUCT_CATEGORIES.PHARMACY,
    price: 349,
    mrp: 399,
    images: ['https://cdn.petmypet.in/products/flea-spray.jpg'],
    stock: 60,
    sku: 'PH-FTS-001',
  });
  await ProductModel.create({
    name: 'Cozy Comfort Pet Bed',
    category: PRODUCT_CATEGORIES.ACCESSORIES,
    price: 1299,
    mrp: 1599,
    images: ['https://cdn.petmypet.in/products/pet-bed.jpg'],
    stock: 25,
    sku: 'ACC-BED-001',
  });
  await ProductModel.create({
    name: 'Reflective Safety Collar',
    category: PRODUCT_CATEGORIES.ACCESSORIES,
    price: 349,
    mrp: 399,
    images: ['https://cdn.petmypet.in/products/collar.jpg'],
    stock: 100,
    sku: 'ACC-COL-001',
  });
  await ProductModel.create({
    name: 'Rope Toy',
    category: PRODUCT_CATEGORIES.TOYS,
    price: 249,
    mrp: 299,
    images: ['https://cdn.petmypet.in/products/rope-toy.jpg'],
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
    photoUrls: ['https://cdn.petmypet.in/lost-and-found/tommy.jpg'],
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
    imageUrl: 'https://cdn.petmypet.in/banners/grooming-home.jpg',
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

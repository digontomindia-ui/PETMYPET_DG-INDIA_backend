import { z } from 'zod';
import { PROVIDER_APP_ROLE_SLUGS, type ProviderAppRoleSlug } from './provider-app.constants.js';

const roleSlugSchema = z.enum(
  PROVIDER_APP_ROLE_SLUGS as [ProviderAppRoleSlug, ...ProviderAppRoleSlug[]],
);

export const signinSignupSchema = z.object({
  role: roleSlugSchema,
  phone: z.string().min(6).max(20),
  // Client may send null when it hasn't set up Firebase yet — accept that, not just omission.
  fcm_token: z.string().nullable().optional(),
  device_type: z.enum(['android', 'ios']).nullable().optional(),
  device_id: z.string().nullable().optional(),
});

export const providerVerifyOtpSchema = z.object({
  role: roleSlugSchema,
  phone: z.string().min(6).max(20),
  otp: z.string().min(4).max(6),
});

const documentsSchema = z.object({
  adhar_card: z.string().min(1),
  pan_card: z.string().min(1),
});

/** One superset schema for every role's upload-documents body — the request itself carries no
 * role field (it was fixed at signup), so per-role *requiredness* is enforced in the service
 * layer against the caller's own provider profile rather than here. */
export const uploadDocumentsSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  experience: z.number().int().min(0).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(2000).optional(),
  profile_image: z.string().min(1).optional(),
  documents: documentsSchema.optional(),
  clinic_name: z.string().min(1).max(150).optional(),
  boarding_name: z.string().min(1).max(150).optional(),
  location: z
    .object({
      address: z.string().min(1).optional(),
      longtude: z.number().optional(),
      latatude: z.number().optional(),
    })
    .optional(),
  founded: z.string().optional(),
  description: z.string().max(2000).optional(),
  specialization: z.string().optional(),
  clinic_images: z.array(z.string()).optional(),
  media: z.array(z.string()).optional(),
});

export const sessionOtpSchema = z.object({
  otp: z.string().min(4).max(6),
});

export const uploadTrainingProcessSchema = z.object({
  caption: z.string().max(500).default(''),
  progress_note: z.string().max(1000).default(''),
  media: z.array(z.string().min(1)).min(1),
});

export const providerHomeQuerySchema = z.object({
  date: z.string().optional(),
});

export const myAppointmentsQuerySchema = z.object({
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const appointmentsQuerySchema = z.object({
  status: z.string().optional(),
  date: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const trainerDashboardQuerySchema = z.object({
  type: z.enum(['upcoming', 'past']).optional(),
  filter: z.enum(['all', 'today', 'this_week', 'pending']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const providerAppAnalyticsQuerySchema = z.object({
  time_range: z.enum(['week', 'month', 'year']).default('week'),
});

export const patientsQuerySchema = z.object({
  type: z.enum(['Dog', 'Cat', 'Birds', 'All']).default('All'),
});

export const messageRoomParamSchema = z.object({
  room_id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});

export const messageHistoryQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const inboxQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  /** Filter chips on the Messages screen. */
  filter: z.enum(['all', 'unread', 'emergency']).optional(),
  is_urgent: z.enum(['true', 'false']).optional(),
  /** Matches the other participant's name or the booking's pet name. */
  search: z.string().max(100).optional(),
});

export const reviewsQuerySchema = z.object({
  rating: z.enum(['1', '2', '3', '4', '5']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const reviewIdParamSchema = z.object({ review_id: objectIdSchema });

export const replyReviewSchema = z.object({
  reply: z.string().trim().min(1).max(1000),
});

export const earningsQuerySchema = z.object({
  range: z.enum(['week', 'month', 'year']).default('week'),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const withdrawSchema = z.object({
  amount: z.number().positive(),
});

export const listQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const personalInfoSchema = z.object({
  full_name: z.string().trim().min(1).max(120).optional(),
  email: z.string().email().optional(),
  date_of_birth: dateOnlySchema.nullable().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
  address: z.string().trim().max(500).optional(),
  profile_image: z.string().url().nullable().optional(),
});

export const experienceSkillsSchema = z.object({
  experience_years: z.number().int().min(0).max(80).optional(),
  work_experience: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(150),
        company: z.string().trim().max(150).optional(),
        start_date: dateOnlySchema,
        /** null / omitted = "Present" */
        end_date: dateOnlySchema.nullable().optional(),
      }),
    )
    .max(30)
    .optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
});

export const providerDocumentSchema = z.object({
  name: z.enum(['AADHAAR_CARD', 'PAN_CARD', 'DRIVING_LICENSE', 'POLICE_VERIFICATION', 'OTHER']),
  url: z.string().url(),
});

export const bankAccountSchema = z
  .object({
    account_holder_name: z.string().trim().min(1).max(150),
    bank_name: z.string().trim().min(1).max(150),
    account_number: z.string().regex(/^\d{6,20}$/, 'Account number must be 6-20 digits'),
    confirm_account_number: z.string(),
    ifsc_code: z.string().regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, 'Invalid IFSC code'),
    account_type: z.enum(['SAVINGS', 'CURRENT']).default('SAVINGS'),
  })
  .refine((data) => data.account_number === data.confirm_account_number, {
    message: 'Account numbers do not match',
    path: ['confirm_account_number'],
  });

export const bookingIdParamSchema = z.object({ booking_id: objectIdSchema });

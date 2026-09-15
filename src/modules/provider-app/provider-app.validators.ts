import { z } from 'zod';
import { PROVIDER_APP_ROLE_SLUGS, type ProviderAppRoleSlug } from './provider-app.constants.js';

const roleSlugSchema = z.enum(
  PROVIDER_APP_ROLE_SLUGS as [ProviderAppRoleSlug, ...ProviderAppRoleSlug[]],
);

export const signinSignupSchema = z.object({
  role: roleSlugSchema,
  phone: z.string().min(6).max(20),
  fcm_token: z.string().optional(),
  device_type: z.enum(['android', 'ios']).optional(),
  device_id: z.string().optional(),
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

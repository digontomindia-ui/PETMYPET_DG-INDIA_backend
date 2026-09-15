import type { z } from 'zod';
import type {
  appointmentsQuerySchema,
  messageHistoryQuerySchema,
  myAppointmentsQuerySchema,
  patientsQuerySchema,
  providerAppAnalyticsQuerySchema,
  providerHomeQuerySchema,
  providerVerifyOtpSchema,
  sessionOtpSchema,
  signinSignupSchema,
  trainerDashboardQuerySchema,
  uploadDocumentsSchema,
  uploadTrainingProcessSchema,
} from './provider-app.validators.js';

export type SigninSignupInput = z.infer<typeof signinSignupSchema>;
export type ProviderVerifyOtpInput = z.infer<typeof providerVerifyOtpSchema>;
export type UploadDocumentsInput = z.infer<typeof uploadDocumentsSchema>;
export type SessionOtpInput = z.infer<typeof sessionOtpSchema>;
export type UploadTrainingProcessInput = z.infer<typeof uploadTrainingProcessSchema>;
export type ProviderHomeQuery = z.infer<typeof providerHomeQuerySchema>;
export type MyAppointmentsQuery = z.infer<typeof myAppointmentsQuerySchema>;
export type AppointmentsQuery = z.infer<typeof appointmentsQuerySchema>;
export type TrainerDashboardQuery = z.infer<typeof trainerDashboardQuerySchema>;
export type ProviderAppAnalyticsQuery = z.infer<typeof providerAppAnalyticsQuerySchema>;
export type PatientsQuery = z.infer<typeof patientsQuerySchema>;
export type MessageHistoryQuery = z.infer<typeof messageHistoryQuerySchema>;

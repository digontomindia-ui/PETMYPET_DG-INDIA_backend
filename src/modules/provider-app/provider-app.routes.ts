import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { requireRole } from '../../common/middlewares/role.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { ROLES } from '../../common/constants/roles.js';
import { providerAppController } from './provider-app.controller.js';
import {
  appointmentsQuerySchema,
  messageHistoryQuerySchema,
  messageRoomParamSchema,
  myAppointmentsQuerySchema,
  patientsQuerySchema,
  providerAppAnalyticsQuerySchema,
  providerVerifyOtpSchema,
  sessionOtpSchema,
  signinSignupSchema,
  trainerDashboardQuerySchema,
  uploadDocumentsSchema,
  uploadTrainingProcessSchema,
} from './provider-app.validators.js';

const requireProvider = [authenticate, requireRole(ROLES.SERVICE_PROVIDER)] as const;

/**
 * Mirrors a separately-specified vendor mobile app's exact endpoint contract (bare paths, no
 * `/provider-app` prefix) as its own module — additive only, reuses the existing
 * auth/provider/booking/chat services underneath rather than duplicating their logic, and never
 * modifies the routes the already-shipped owner app depends on.
 */
export const providerAppRoutes = Router();

providerAppRoutes.post(
  '/signin-signup',
  validate({ body: signinSignupSchema }),
  providerAppController.signinSignup,
);

providerAppRoutes.post(
  '/verify-otp',
  validate({ body: providerVerifyOtpSchema }),
  providerAppController.verifyOtp,
);

providerAppRoutes.post(
  '/upload-documents',
  ...requireProvider,
  validate({ body: uploadDocumentsSchema }),
  providerAppController.uploadDocuments,
);

providerAppRoutes.get('/home', ...requireProvider, providerAppController.getHome);

providerAppRoutes.get(
  '/my-appointments',
  ...requireProvider,
  validate({ query: myAppointmentsQuerySchema }),
  providerAppController.getMyAppointments,
);

providerAppRoutes.get(
  '/appointments',
  ...requireProvider,
  validate({ query: appointmentsQuerySchema }),
  providerAppController.getAppointments,
);

providerAppRoutes.get(
  '/trainer/dashboard',
  ...requireProvider,
  validate({ query: trainerDashboardQuerySchema }),
  providerAppController.getTrainerDashboard,
);

providerAppRoutes.get(
  '/analytics',
  ...requireProvider,
  validate({ query: providerAppAnalyticsQuerySchema }),
  providerAppController.getAnalytics,
);

providerAppRoutes.get('/profile', ...requireProvider, providerAppController.getProfile);

providerAppRoutes.get(
  '/patients',
  ...requireProvider,
  validate({ query: patientsQuerySchema }),
  providerAppController.getPatients,
);

providerAppRoutes.post(
  '/start-Session/verify-otp',
  ...requireProvider,
  validate({ body: sessionOtpSchema }),
  providerAppController.startSessionVerifyOtp,
);

providerAppRoutes.post(
  '/session/resend-otp',
  ...requireProvider,
  providerAppController.resendSessionOtp,
);

providerAppRoutes.post(
  '/end-Session/verify-otp',
  ...requireProvider,
  validate({ body: sessionOtpSchema }),
  providerAppController.endSessionVerifyOtp,
);

providerAppRoutes.get(
  '/end-Session',
  ...requireProvider,
  providerAppController.getEndSessionSummary,
);

providerAppRoutes.post(
  '/session/upload-training-process',
  ...requireProvider,
  validate({ body: uploadTrainingProcessSchema }),
  providerAppController.uploadTrainingProcess,
);

providerAppRoutes.get('/message', authenticate, providerAppController.getInbox);

providerAppRoutes.get(
  '/message/:room_id/history',
  authenticate,
  validate({ params: messageRoomParamSchema, query: messageHistoryQuerySchema }),
  providerAppController.getRoomHistory,
);

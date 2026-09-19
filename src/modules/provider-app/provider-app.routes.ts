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

/**
 * @openapi
 * /signin-signup:
 *   post:
 *     tags: [ProviderApp]
 *     summary: Provider signup/login step 1 — sends an OTP, auto-creating the user account if new
 *     description: |
 *       No auth required. Creates a `SERVICE_PROVIDER`-role user on first call for this phone (name
 *       left blank). Returns `409 CONFLICT` if the phone is already a customer account, or already
 *       registered under a *different* provider role slug.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role, phone]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [pet-groomer, pet-clinics, vets, boarding-center, dogs-trainer, dog-walker, pet-sitter]
 *               phone: { type: string, example: "9876543210" }
 *               fcm_token: { type: string, nullable: true }
 *               device_type: { type: string, enum: [android, ios], nullable: true }
 *               device_id: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *             example: { success: true, message: "OTP sent successfully" }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: Phone already registered under a different account/role
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.post(
  '/signin-signup',
  validate({ body: signinSignupSchema }),
  providerAppController.signinSignup,
);

/**
 * @openapi
 * /verify-otp:
 *   post:
 *     tags: [ProviderApp]
 *     summary: Provider signup/login step 2 — verifies the OTP and issues an access token
 *     description: |
 *       No auth required. On the very first successful verification, auto-creates a shell provider
 *       profile (`kycStatus: PENDING`, placeholder businessName/location) — fill it in via
 *       `POST /upload-documents` right after.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role, phone, otp]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [pet-groomer, pet-clinics, vets, boarding-center, dogs-trainer, dog-walker, pet-sitter]
 *               phone: { type: string, example: "9876543210" }
 *               otp: { type: string, example: "111111" }
 *     responses:
 *       200:
 *         description: Login/signup successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 isDocumentSubmited: { type: boolean }
 *                 isDocumentApproved: { type: boolean }
 *                 token: { type: string, description: "Bearer access token" }
 *             example:
 *               success: true
 *               message: "Login or signup successful"
 *               isDocumentSubmited: false
 *               isDocumentApproved: false
 *               token: "eyJhbGciOiJIUzI1NiIs..."
 *       400:
 *         description: No pending signup for this phone, or invalid/expired OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.post(
  '/verify-otp',
  validate({ body: providerVerifyOtpSchema }),
  providerAppController.verifyOtp,
);

/**
 * @openapi
 * /upload-documents:
 *   post:
 *     tags: [ProviderApp]
 *     summary: Complete the provider's onboarding profile (KYC docs + role-specific business info)
 *     description: |
 *       Bearer token required (`SERVICE_PROVIDER`). One superset body for every role — which fields
 *       are actually required depends on the caller's own provider role (e.g. `clinic_name` for
 *       `pet-clinics`, `name` for everyone else). Re-submitting after a KYC rejection resets
 *       `kycStatus` back to `PENDING`.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, maxLength: 150 }
 *               experience: { type: integer, minimum: 0 }
 *               email: { type: string, format: email }
 *               bio: { type: string, maxLength: 2000 }
 *               profile_image: { type: string, description: "URL from Uploads" }
 *               documents:
 *                 type: object
 *                 properties:
 *                   adhar_card: { type: string, description: "URL from Uploads" }
 *                   pan_card: { type: string, description: "URL from Uploads" }
 *               clinic_name: { type: string, maxLength: 150, description: "Required for pet-clinics" }
 *               boarding_name: { type: string, maxLength: 150, description: "Required for boarding-center" }
 *               location:
 *                 type: object
 *                 properties:
 *                   address: { type: string }
 *                   longtude: { type: number }
 *                   latatude: { type: number }
 *               founded: { type: string, description: "Year founded, e.g. \"2018\"" }
 *               description: { type: string, maxLength: 2000 }
 *               specialization: { type: string }
 *               clinic_images: { type: array, items: { type: string } }
 *               media: { type: array, items: { type: string } }
 *             example:
 *               name: "Dr. Asha Rao"
 *               experience: 5
 *               bio: "Small-animal vet"
 *               documents: { adhar_card: "https://cdn.example.com/adhar.jpg", pan_card: "https://cdn.example.com/pan.jpg" }
 *     responses:
 *       201:
 *         description: Documents submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *             example: { success: true, message: "Documents submitted successfully" }
 *       400:
 *         description: Missing a role-required field, or validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: Provider profile not found (verify-otp not called yet)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.post(
  '/upload-documents',
  ...requireProvider,
  validate({ body: uploadDocumentsSchema }),
  providerAppController.uploadDocuments,
);

/**
 * @openapi
 * /home:
 *   get:
 *     tags: [ProviderApp]
 *     summary: Role-shaped dashboard for the current provider
 *     description: |
 *       Bearer token required (`SERVICE_PROVIDER`). Response shape depends on the caller's provider
 *       role — trainers get the **GET /trainer/dashboard** shape; the example below is the
 *       groomer/default shape (also used for pet-walker/pet-sitter/vet/boarding, each with its own
 *       field set on `data`).
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Groomer dashboard retrieved successfully."
 *               data:
 *                 header: { greeting: "Good Day", location: "12 MG Road", notifications_count: 0, is_available: true }
 *                 profile_summary: { name: "Asha", is_verified: true, designation: "Professional Pet Groomer", rating: 4.8, reviews_count: 12, avatar_url: null }
 *                 stats_overview: { total_bookings: 40, today_grooming: 2, rating: 4.8, total_revenue: 15000 }
 *                 todays_grooming_session: null
 *                 active_grooming: null
 *                 earnings_overview: { this_week: { amount: "₹2000", percentage_change: "", chart_points: [] }, this_month: 15000 }
 *                 recent_reviews: null
 *                 recent_prescriptions: []
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: User or provider profile not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.get('/home', ...requireProvider, providerAppController.getHome);

/**
 * @openapi
 * /my-appointments:
 *   get:
 *     tags: [ProviderApp]
 *     summary: Pet-sitter-shaped appointment list for the current provider
 *     description: Bearer token required (`SERVICE_PROVIDER`).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [all, upcoming, completed, cancelled] }
 *       - name: page
 *         in: query
 *         schema: { type: string, example: "1" }
 *       - name: limit
 *         in: query
 *         schema: { type: string, example: "20" }
 *     responses:
 *       200:
 *         description: Appointment list
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Appointments fetched successfully"
 *               user_name: "Asha"
 *               appointments:
 *                 - id: "64f8b9c0d1e2f3a4b5c6d7e8"
 *                   pet: { id: "64f6f7a8b9c0d1e2f3a4b5c6", name: "Bruno", image_url: null }
 *                   owner: { id: "64f6f7a8b9c0d1e2f3a4b5c7", name: "Ravi" }
 *                   service_type: "Full Grooming"
 *                   appointment_date: "2026-09-20T09:00:00.000Z"
 *                   status: "ACCEPTED"
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.get(
  '/my-appointments',
  ...requireProvider,
  validate({ query: myAppointmentsQuerySchema }),
  providerAppController.getMyAppointments,
);

/**
 * @openapi
 * /appointments:
 *   get:
 *     tags: [ProviderApp]
 *     summary: Paginated appointment list (walker/sitter/etc. shape), or vet/clinic schedule shape
 *     description: |
 *       Bearer token required (`SERVICE_PROVIDER`). `vets`/`pet-clinics` providers get a flat
 *       `{ "total appointments", schedule }` shape instead of the paginated one shown below.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: status
 *         in: query
 *         schema: { type: string, enum: [all, upcoming, upcomming, completed, cancelled] }
 *         description: "\"upcomming\" (sic) is accepted as an alias for \"upcoming\"."
 *       - name: date
 *         in: query
 *         schema: { type: string, example: "05-09-26" }
 *         description: DD-MM-YY
 *       - name: page
 *         in: query
 *         schema: { type: string, example: "1" }
 *       - name: limit
 *         in: query
 *         schema: { type: string, example: "20" }
 *     responses:
 *       200:
 *         description: Appointment list
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Appointments fetched successfully."
 *               data:
 *                 appointments:
 *                   - id: "64f8b9c0d1e2f3a4b5c6d7e8"
 *                     pet: { id: "64f6f7a8b9c0d1e2f3a4b5c6", name: "Bruno", breed: "Labrador", image_url: null }
 *                     owner: { id: "64f6f7a8b9c0d1e2f3a4b5c7", name: "Ravi" }
 *                     appointment_date: "2026-09-20T09:00:00.000Z"
 *                     display_time: "Today, 09:00 AM"
 *                     location: "12 MG Road, Bengaluru"
 *                     status: "ACCEPTED"
 *                 pagination: { current_page: 1, total_pages: 3, total_items: 42, has_next: true }
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.get(
  '/appointments',
  ...requireProvider,
  validate({ query: appointmentsQuerySchema }),
  providerAppController.getAppointments,
);

/**
 * @openapi
 * /trainer/dashboard:
 *   get:
 *     tags: [ProviderApp]
 *     summary: Trainer home dashboard, or (with type/filter) trainer's paginated session list
 *     description: |
 *       Bearer token required (`SERVICE_PROVIDER`, trainer). With neither `type` nor `filter` set,
 *       returns the dashboard shape (`quick_metrics` + `upcoming_sessions`); passing either switches
 *       to the paginated session-list shape shown as the alternate example below. This is also what
 *       `GET /home` returns for a `dogs-trainer` role.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: type
 *         in: query
 *         schema: { type: string, enum: [upcoming, past] }
 *       - name: filter
 *         in: query
 *         schema: { type: string, enum: [all, today, this_week, pending] }
 *       - name: page
 *         in: query
 *         schema: { type: string, example: "1" }
 *       - name: limit
 *         in: query
 *         schema: { type: string, example: "20" }
 *     responses:
 *       200:
 *         description: Dashboard or session-list data
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Dashboard data retrieved successfully."
 *               data:
 *                 user: { id: "64f6f7a8b9c0d1e2f3a4b5c6", name: "Coach Dev", is_verified: true }
 *                 quick_metrics: { today_sessions: 2, earnings: 1200, rating: 4.9, reviews: 30 }
 *                 upcoming_sessions:
 *                   - id: "64f8b9c0d1e2f3a4b5c6d7e8"
 *                     pet: { id: "64f6f7a8b9c0d1e2f3a4b5c6", name: "Bruno", image_url: null }
 *                     owner: { id: "64f6f7a8b9c0d1e2f3a4b5c7", name: "Ravi" }
 *                     time_slot: "09:00 AM - 10:30 AM"
 *                     start_time: "2026-09-20T09:00:00.000Z"
 *                     end_time: "2026-09-20T10:30:00.000Z"
 *                     tag: "OBEDIENCE TRAINING"
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.get(
  '/trainer/dashboard',
  ...requireProvider,
  validate({ query: trainerDashboardQuerySchema }),
  providerAppController.getTrainerDashboard,
);

/**
 * @openapi
 * /analytics:
 *   get:
 *     tags: [ProviderApp]
 *     summary: Role-shaped earnings/performance analytics for the current provider
 *     description: |
 *       Bearer token required (`SERVICE_PROVIDER`). Shape depends on role — sitter, trainer, and
 *       everyone else (walker/groomer/vet/boarding default) each get a differently-keyed `data`
 *       object. Example below is the walker/default shape.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: time_range
 *         in: query
 *         schema: { type: string, enum: [week, month, year], default: week }
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Analytics fetched successfully"
 *               data:
 *                 selected_range: "week"
 *                 earnings_chart:
 *                   total_earnings: "4500"
 *                   percentage: "0"
 *                   level: "flat"
 *                   chart_data: [{ label: "Mon", value: 500 }]
 *                 overview: { total_walks: "12", avg_rating: "4.7", total_earnings: 4500, active_client: 0 }
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.get(
  '/analytics',
  ...requireProvider,
  validate({ query: providerAppAnalyticsQuerySchema }),
  providerAppController.getAnalytics,
);

/**
 * @openapi
 * /profile:
 *   get:
 *     tags: [ProviderApp]
 *     summary: The current provider's own profile
 *     description: |
 *       Bearer token required (`SERVICE_PROVIDER`). `vets`/`pet-clinics` get a clinic-shaped
 *       profile; every other role gets the generic shape shown below.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile data
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Profile fetched successfully."
 *               data:
 *                 user: { id: "64f6f7a8b9c0d1e2f3a4b5c6", name: "Asha", avatar_url: null, is_verified: true, bio: "Small-animal groomer" }
 *                 stats: { total_walks: 40, rating: 4.8, reviews_count: 12 }
 *                 details:
 *                   experience: 5
 *                   specializations: ["Full Grooming"]
 *                   service_areas: ["Koramangala"]
 *                   documents: [{ type: "GOVERNMENT_ID", status: "APPROVED", document_url: "https://cdn.example.com/adhar.jpg" }]
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.get('/profile', ...requireProvider, providerAppController.getProfile);

/**
 * @openapi
 * /patients:
 *   get:
 *     tags: [ProviderApp]
 *     summary: Pets the current provider has an active or completed booking with
 *     description: Bearer token required (`SERVICE_PROVIDER`).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: type
 *         in: query
 *         schema: { type: string, enum: [Dog, Cat, Birds, All], default: All }
 *     responses:
 *       200:
 *         description: Patient list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { type: object }
 *             example:
 *               - id: "64f6f7a8b9c0d1e2f3a4b5c6"
 *                 name: "Bruno"
 *                 breed: "Labrador"
 *                 age: ""
 *                 breed_and_age: "Labrador"
 *                 image_url: null
 *                 health_status: "HEALTHY"
 *                 owner: { id: "64f6f7a8b9c0d1e2f3a4b5c7", name: "Ravi" }
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.get(
  '/patients',
  ...requireProvider,
  validate({ query: patientsQuerySchema }),
  providerAppController.getPatients,
);

/**
 * @openapi
 * /start-Session/verify-otp:
 *   post:
 *     tags: [ProviderApp]
 *     summary: Verify the customer's start-OTP for the provider's current session
 *     description: |
 *       Bearer token required (`SERVICE_PROVIDER`). Resolves "the current session" from the
 *       provider's own `ACCEPTED`/`ON_THE_WAY` booking — there is no bookingId in the payload, so
 *       only one such booking may exist at a time. On success the booking moves to `STARTED`.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp: { type: string, example: "111111" }
 *     responses:
 *       200:
 *         description: OTP matched, session started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *             example: { success: true, message: "OTP matched successfully" }
 *       400:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: No session ready to start right now
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.post(
  '/start-Session/verify-otp',
  ...requireProvider,
  validate({ body: sessionOtpSchema }),
  providerAppController.startSessionVerifyOtp,
);

/**
 * @openapi
 * /session/resend-otp:
 *   post:
 *     tags: [ProviderApp]
 *     summary: Regenerate and SMS the pending start/end OTP for the provider's current session
 *     description: |
 *       Bearer token required (`SERVICE_PROVIDER`). Checks for a start-eligible session first, then
 *       an active (in-progress) one. No-ops (still returns 200) if SMS delivery isn't configured.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *             example: { success: true, message: "OTP sent successfully" }
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: No active session to resend an OTP for
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.post(
  '/session/resend-otp',
  ...requireProvider,
  providerAppController.resendSessionOtp,
);

/**
 * @openapi
 * /end-Session/verify-otp:
 *   post:
 *     tags: [ProviderApp]
 *     summary: Verify the customer's end-OTP, completing the provider's current session
 *     description: |
 *       Bearer token required (`SERVICE_PROVIDER`). Marks the `STARTED` booking `COMPLETED`,
 *       computes commission/payout, notifies the customer, and triggers first-booking referral
 *       rewards.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp: { type: string, example: "111111" }
 *     responses:
 *       200:
 *         description: OTP matched, session completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *             example: { success: true, message: "OTP matched successfully" }
 *       400:
 *         description: Invalid end OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: No active session to end right now
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.post(
  '/end-Session/verify-otp',
  ...requireProvider,
  validate({ body: sessionOtpSchema }),
  providerAppController.endSessionVerifyOtp,
);

/**
 * @openapi
 * /end-Session:
 *   get:
 *     tags: [ProviderApp]
 *     summary: Summary for the provider's just-ended (or most recent completed) session
 *     description: Bearer token required (`SERVICE_PROVIDER`).
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Session summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 summary:
 *                   type: object
 *                   properties:
 *                     distance: { type: string, example: "2.4 km" }
 *                     status: { type: string, enum: [Completed, "In Process"] }
 *             example:
 *               success: true
 *               message: "summary fatch sucessfully."
 *               summary: { distance: "2.4 km", status: "Completed" }
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: No session found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.get(
  '/end-Session',
  ...requireProvider,
  providerAppController.getEndSessionSummary,
);

/**
 * @openapi
 * /session/upload-training-process:
 *   post:
 *     tags: [ProviderApp]
 *     summary: Log a progress update (caption + note + media) against the provider's active session
 *     description: Bearer token required (`SERVICE_PROVIDER`). Requires a `STARTED` booking.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [media]
 *             properties:
 *               caption: { type: string, maxLength: 500, default: "" }
 *               progress_note: { type: string, maxLength: 1000, default: "" }
 *               media:
 *                 type: array
 *                 items: { type: string }
 *                 minItems: 1
 *                 description: URLs from Uploads
 *     responses:
 *       201:
 *         description: Progress update saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *             example: { success: true, message: "Training progress uploaded successfully" }
 *       400:
 *         description: No active session to post a progress update for, or validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.post(
  '/session/upload-training-process',
  ...requireProvider,
  validate({ body: uploadTrainingProcessSchema }),
  providerAppController.uploadTrainingProcess,
);

/**
 * @openapi
 * /message:
 *   get:
 *     tags: [ProviderApp]
 *     summary: Chat inbox — REST alias for the provider app's message list screen
 *     description: |
 *       Bearer token required (any authenticated role). Thin wrapper over the **Chat** module's
 *       room list.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: string, example: "1" }
 *       - name: limit
 *         in: query
 *         schema: { type: string, example: "20" }
 *     responses:
 *       200:
 *         description: Inbox rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *             example:
 *               success: true
 *               message: "message receive successfully."
 *               data:
 *                 - id: "64f8b9c0d1e2f3a4b5c6d7e8"
 *                   profile_image: null
 *                   name: "Ravi"
 *                   last_msg: "See you at 5pm"
 *                   unread_msg: "2"
 *                   data_time: "2026-09-19T05:00:00.000Z"
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.get('/message', authenticate, providerAppController.getInbox);

/**
 * @openapi
 * /message/{room_id}/history:
 *   get:
 *     tags: [ProviderApp]
 *     summary: Message history for one chat room — REST alias for the provider app's chat screen
 *     description: |
 *       Bearer token required (any authenticated role). Thin wrapper over the **Chat** module's
 *       message history; real-time delivery for connected clients is over Socket.IO instead.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: room_id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         example: "64f8b9c0d1e2f3a4b5c6d7e8"
 *       - name: page
 *         in: query
 *         schema: { type: string, example: "1" }
 *       - name: limit
 *         in: query
 *         schema: { type: string, example: "20" }
 *     responses:
 *       200:
 *         description: Message history
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Messages fetched successfully."
 *               data:
 *                 room_id: "64f8b9c0d1e2f3a4b5c6d7e8"
 *                 messages:
 *                   - id: "64f6f7a8b9c0d1e2f3a4b5c6"
 *                     room_id: "64f8b9c0d1e2f3a4b5c6d7e8"
 *                     sender_id: "64f6f7a8b9c0d1e2f3a4b5c7"
 *                     message: "See you at 5pm"
 *                     type: "TEXT"
 *                     status: "SEEN"
 *                     created_at: "2026-09-19T05:00:00.000Z"
 *                 pagination: { current_page: 1, total_pages: 1, has_more: false }
 *       400:
 *         description: Invalid room_id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
providerAppRoutes.get(
  '/message/:room_id/history',
  authenticate,
  validate({ params: messageRoomParamSchema, query: messageHistoryQuerySchema }),
  providerAppController.getRoomHistory,
);

import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authRateLimiter } from '../../common/middlewares/rate-limit.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { authController } from './auth.controller.js';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  requestOtpLoginSchema,
  resendOtpSchema,
  resetPasswordSchema,
  signupSchema,
  updatePasswordSchema,
  verifyOtpLoginSchema,
  verifySignupSchema,
} from './auth.validators.js';

export const authRoutes = Router();

authRoutes.use(authRateLimiter);

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user or service provider account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password]
 *             properties:
 *               name: { type: string, example: "Priya Sharma" }
 *               email: { type: string, format: email, example: "priya.sharma@example.com" }
 *               phone: { type: string, example: "+919876543210" }
 *               password: { type: string, format: password, example: "P@ssw0rd123" }
 *               role: { type: string, enum: [USER, SERVICE_PROVIDER], example: "USER" }
 *           example:
 *             name: "Priya Sharma"
 *             email: "priya.sharma@example.com"
 *             phone: "+919876543210"
 *             password: "P@ssw0rd123"
 *             role: "USER"
 *     responses:
 *       201:
 *         description: Signup successful, OTP sent
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Signup successful, please verify the OTP sent to your email"
 *               data:
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 identifier: "priya.sharma@example.com"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "email must be a valid email address"
 */
authRoutes.post('/signup', validate({ body: signupSchema }), authController.signup);

/**
 * @openapi
 * /auth/signup/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify signup with OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, code]
 *             properties:
 *               identifier: { type: string, example: "priya.sharma@example.com" }
 *               code: { type: string, example: "482913" }
 *           example:
 *             identifier: "priya.sharma@example.com"
 *             code: "482913"
 *     responses:
 *       200:
 *         description: Signup verified
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Account verified"
 *               data:
 *                 user:
 *                   id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   role: "USER"
 *                   name: "Priya Sharma"
 *                   email: "priya.sharma@example.com"
 *                   phone: "+919876543210"
 *                   avatarUrl: null
 *                   isVerified: true
 *                   isBlocked: false
 *                   addresses: []
 *                   preferences:
 *                     language: "en"
 *                     smsNotifications: true
 *                     emailNotifications: true
 *                     pushNotifications: true
 *                   createdAt: "2026-08-01T10:15:00.000Z"
 *                   updatedAt: "2026-08-04T09:30:00.000Z"
 *                 tokens:
 *                   accessToken: "eyJhbGciOi...<truncated>"
 *                   refreshToken: "eyJhbGciOi...<truncated>"
 *                   expiresIn: "15m"
 *       400:
 *         description: Validation error or invalid/expired OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "OTP has expired, please request a new one"
 */
authRoutes.post(
  '/signup/verify',
  validate({ body: verifySignupSchema }),
  authController.verifySignup,
);

/**
 * @openapi
 * /auth/otp/resend:
 *   post:
 *     tags: [Auth]
 *     summary: Resend an OTP code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, purpose]
 *             properties:
 *               identifier: { type: string, example: "priya.sharma@example.com" }
 *               purpose: { type: string, enum: [SIGNUP, LOGIN, PASSWORD_RESET], example: "SIGNUP" }
 *           example:
 *             identifier: "priya.sharma@example.com"
 *             purpose: "SIGNUP"
 *     responses:
 *       200:
 *         description: OTP resent
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "OTP sent"
 *               data: null
 *       400:
 *         description: Validation error or resend cooldown still active
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "purpose must be one of SIGNUP, LOGIN, PASSWORD_RESET"
 */
authRoutes.post('/otp/resend', validate({ body: resendOtpSchema }), authController.resendOtp);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: "priya.sharma@example.com" }
 *               password: { type: string, format: password, example: "P@ssw0rd123" }
 *           example:
 *             email: "priya.sharma@example.com"
 *             password: "P@ssw0rd123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Login successful"
 *               data:
 *                 user:
 *                   id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   role: "USER"
 *                   name: "Priya Sharma"
 *                   email: "priya.sharma@example.com"
 *                   phone: "+919876543210"
 *                   avatarUrl: null
 *                   isVerified: true
 *                   isBlocked: false
 *                   addresses: []
 *                   preferences:
 *                     language: "en"
 *                     smsNotifications: true
 *                     emailNotifications: true
 *                     pushNotifications: true
 *                   createdAt: "2026-08-01T10:15:00.000Z"
 *                   updatedAt: "2026-08-04T09:30:00.000Z"
 *                 tokens:
 *                   accessToken: "eyJhbGciOi...<truncated>"
 *                   refreshToken: "eyJhbGciOi...<truncated>"
 *                   expiresIn: "15m"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "password is required"
 */
authRoutes.post('/login', validate({ body: loginSchema }), authController.login);

/**
 * @openapi
 * /auth/login/otp/request:
 *   post:
 *     tags: [Auth]
 *     summary: Request an OTP for login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier]
 *             properties:
 *               identifier: { type: string, example: "+919876543210" }
 *           example:
 *             identifier: "+919876543210"
 *     responses:
 *       200:
 *         description: OTP sent
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "OTP sent"
 *               data: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Identifier must be a valid email or phone number"
 */
authRoutes.post(
  '/login/otp/request',
  validate({ body: requestOtpLoginSchema }),
  authController.requestOtpLogin,
);

/**
 * @openapi
 * /auth/login/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP and log in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, code]
 *             properties:
 *               identifier: { type: string, example: "+919876543210" }
 *               code: { type: string, example: "482913" }
 *           example:
 *             identifier: "+919876543210"
 *             code: "482913"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Login successful"
 *               data:
 *                 user:
 *                   id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   role: "USER"
 *                   name: "Priya Sharma"
 *                   email: "priya.sharma@example.com"
 *                   phone: "+919876543210"
 *                   avatarUrl: null
 *                   isVerified: true
 *                   isBlocked: false
 *                   addresses: []
 *                   preferences:
 *                     language: "en"
 *                     smsNotifications: true
 *                     emailNotifications: true
 *                     pushNotifications: true
 *                   createdAt: "2026-08-01T10:15:00.000Z"
 *                   updatedAt: "2026-08-04T09:30:00.000Z"
 *                 tokens:
 *                   accessToken: "eyJhbGciOi...<truncated>"
 *                   refreshToken: "eyJhbGciOi...<truncated>"
 *                   expiresIn: "15m"
 *       400:
 *         description: Validation error or invalid/expired OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Invalid OTP"
 */
authRoutes.post(
  '/login/otp/verify',
  validate({ body: verifyOtpLoginSchema }),
  authController.verifyOtpLogin,
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh an access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string, example: "eyJhbGciOi...<truncated>" }
 *           example:
 *             refreshToken: "eyJhbGciOi...<truncated>"
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Token refreshed"
 *               data:
 *                 accessToken: "eyJhbGciOi...<truncated>"
 *                 refreshToken: "eyJhbGciOi...<truncated>"
 *                 expiresIn: "15m"
 *       400:
 *         description: Validation error or session no longer valid
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "refreshToken is required"
 */
authRoutes.post('/refresh', validate({ body: refreshTokenSchema }), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out and invalidate a refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string, example: "eyJhbGciOi...<truncated>" }
 *           example:
 *             refreshToken: "eyJhbGciOi...<truncated>"
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Logged out"
 *               data: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "refreshToken is required"
 */
authRoutes.post('/logout', validate({ body: refreshTokenSchema }), authController.logout);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Log out of all sessions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Logged out of all devices"
 *               data: null
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
 */
authRoutes.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier]
 *             properties:
 *               identifier: { type: string, example: "priya.sharma@example.com" }
 *           example:
 *             identifier: "priya.sharma@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "If an account exists, an OTP has been sent"
 *               data: null
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Identifier must be a valid email or phone number"
 */
authRoutes.post(
  '/forgot-password',
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using a reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, code, newPassword]
 *             properties:
 *               identifier: { type: string, example: "priya.sharma@example.com" }
 *               code: { type: string, example: "482913" }
 *               newPassword: { type: string, format: password, example: "N3wP@ssw0rd" }
 *           example:
 *             identifier: "priya.sharma@example.com"
 *             code: "482913"
 *             newPassword: "N3wP@ssw0rd"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Password reset successful"
 *               data: null
 *       400:
 *         description: Validation error or invalid/expired OTP
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Invalid OTP"
 */
authRoutes.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);

/**
 * @openapi
 * /auth/update-password:
 *   post:
 *     tags: [Auth]
 *     summary: Update password for the authenticated user
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string, format: password, example: "P@ssw0rd123" }
 *               newPassword: { type: string, format: password, example: "N3wP@ssw0rd" }
 *           example:
 *             oldPassword: "P@ssw0rd123"
 *             newPassword: "N3wP@ssw0rd"
 *     responses:
 *       200:
 *         description: Password updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: "Password updated"
 *               data: null
 *       400:
 *         description: Validation error or incorrect current password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "BAD_REQUEST"
 *               message: "Current password is incorrect"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example:
 *               success: false
 *               error: "UNAUTHORIZED"
 *               message: "Authentication required"
 */
authRoutes.post(
  '/update-password',
  authenticate,
  validate({ body: updatePasswordSchema }),
  authController.updatePassword,
);

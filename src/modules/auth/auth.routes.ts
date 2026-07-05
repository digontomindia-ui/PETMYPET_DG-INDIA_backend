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
 *     responses:
 *       201: { description: Signup successful, OTP sent }
 */
authRoutes.post('/signup', validate({ body: signupSchema }), authController.signup);

/**
 * @openapi
 * /auth/signup/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify signup with OTP
 *     responses:
 *       200: { description: Signup verified }
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
 *     responses:
 *       200: { description: OTP resent }
 */
authRoutes.post('/otp/resend', validate({ body: resendOtpSchema }), authController.resendOtp);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     responses:
 *       200: { description: Login successful }
 */
authRoutes.post('/login', validate({ body: loginSchema }), authController.login);

/**
 * @openapi
 * /auth/login/otp/request:
 *   post:
 *     tags: [Auth]
 *     summary: Request an OTP for login
 *     responses:
 *       200: { description: OTP sent }
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
 *     responses:
 *       200: { description: Login successful }
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
 *     responses:
 *       200: { description: Token refreshed }
 */
authRoutes.post('/refresh', validate({ body: refreshTokenSchema }), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out and invalidate a refresh token
 *     responses:
 *       200: { description: Logout successful }
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
 *       200: { description: Logout successful }
 */
authRoutes.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset
 *     responses:
 *       200: { description: Password reset email sent }
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
 *     responses:
 *       200: { description: Password reset successful }
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
 *     responses:
 *       200: { description: Password updated }
 */
authRoutes.post(
  '/update-password',
  authenticate,
  validate({ body: updatePasswordSchema }),
  authController.updatePassword,
);

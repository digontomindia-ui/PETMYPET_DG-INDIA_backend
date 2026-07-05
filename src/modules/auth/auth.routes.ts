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
authRoutes.post(
  '/signup/verify',
  validate({ body: verifySignupSchema }),
  authController.verifySignup,
);
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
authRoutes.post(
  '/login/otp/request',
  validate({ body: requestOtpLoginSchema }),
  authController.requestOtpLogin,
);
authRoutes.post(
  '/login/otp/verify',
  validate({ body: verifyOtpLoginSchema }),
  authController.verifyOtpLogin,
);

authRoutes.post('/refresh', validate({ body: refreshTokenSchema }), authController.refresh);
authRoutes.post('/logout', validate({ body: refreshTokenSchema }), authController.logout);
authRoutes.post('/logout-all', authenticate, authController.logoutAll);

authRoutes.post(
  '/forgot-password',
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);
authRoutes.post(
  '/reset-password',
  validate({ body: resetPasswordSchema }),
  authController.resetPassword,
);
authRoutes.post(
  '/update-password',
  authenticate,
  validate({ body: updatePasswordSchema }),
  authController.updatePassword,
);

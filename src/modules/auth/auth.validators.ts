import { z } from 'zod';
import { ROLES } from '../../common/constants/roles.js';

const identifierSchema = z
  .string()
  .min(3)
  .refine((value) => value.includes('@') || /^\+?[0-9]{7,15}$/.test(value), {
    message: 'Identifier must be a valid email or phone number',
  });

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
  password: passwordSchema,
  role: z.enum([ROLES.USER, ROLES.SERVICE_PROVIDER]).default(ROLES.USER),
});

export const verifySignupSchema = z.object({
  identifier: identifierSchema,
  code: z.string().min(4).max(10),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const requestOtpLoginSchema = z.object({
  identifier: identifierSchema,
});

export const verifyOtpLoginSchema = z.object({
  identifier: identifierSchema,
  code: z.string().min(4).max(10),
});

export const resendOtpSchema = z.object({
  identifier: identifierSchema,
  purpose: z.enum(['SIGNUP', 'LOGIN', 'PASSWORD_RESET']),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10),
});

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

export const resetPasswordSchema = z.object({
  identifier: identifierSchema,
  code: z.string().min(4).max(10),
  newPassword: passwordSchema,
});

export const updatePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: passwordSchema,
});

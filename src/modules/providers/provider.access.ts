import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../common/errors/app-error.js';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { providerRepository } from './provider.repository.js';
import { KYC_STATUSES } from './provider.constants.js';

/**
 * Login/authentication gate for vendor (SERVICE_PROVIDER) accounts.
 *
 * Deletion and admin-suspension are the two states that must cut a vendor off entirely, so they
 * are blocked at token-issue time (see auth `issueTokens`) across every login path — password,
 * customer OTP, and the provider app. PENDING and REJECTED vendors are deliberately *allowed* to
 * authenticate: a brand-new vendor is PENDING and still has to upload KYC documents, and a
 * REJECTED vendor needs to read the rejection reason and re-submit — the approved-only dashboard
 * itself is fenced off separately by `ensureProviderApproved`.
 *
 * Uses the include-deleted lookup so a soft-deleted vendor is still seen (and blocked) rather
 * than slipping past the default soft-delete filter and looking like a never-onboarded account.
 */
export async function assertProviderLoginAllowed(userId: string): Promise<void> {
  const provider = await providerRepository.findByUserIdIncludingDeleted(userId);
  // No provider profile yet (e.g. a SERVICE_PROVIDER user mid-signup before the profile exists) —
  // nothing to gate on, so don't block.
  if (!provider) return;

  if (provider.isDeleted) {
    throw AppError.forbidden('This vendor account has been removed. Please contact support.');
  }
  if (provider.suspendedByAdmin) {
    throw AppError.forbidden(
      'Your vendor account has been suspended. Please contact support for assistance.',
    );
  }
}

/**
 * Request-time gate for the approved-only parts of the vendor dashboard (bookings, sessions,
 * earnings, patients, analytics, reviews). Runs after `authenticate` + `requireRole`, so
 * `req.user` is a SERVICE_PROVIDER. Onboarding and profile/document routes intentionally do NOT
 * use this gate, so a PENDING vendor can still complete onboarding.
 */
export const ensureProviderApproved = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();

    // Excludes soft-deleted — a deleted vendor has no live profile and is treated as removed.
    const provider = await providerRepository.findByUserId(req.user.userId);
    if (!provider) {
      throw AppError.forbidden('This vendor account has been removed. Please contact support.');
    }
    if (provider.suspendedByAdmin) {
      throw AppError.forbidden(
        'Your vendor account has been suspended. Please contact support for assistance.',
      );
    }

    if (provider.kycStatus !== KYC_STATUSES.APPROVED) {
      const message =
        provider.kycStatus === KYC_STATUSES.REJECTED
          ? `Your vendor application was rejected${provider.kycRejectionReason ? `: ${provider.kycRejectionReason}` : '.'}`
          : 'Your account is pending admin approval. You will receive access once verified.';
      // `details.kycStatus` lets the vendor app branch to the right status screen without
      // string-matching the message.
      throw new AppError(message, 403, 'FORBIDDEN', { kycStatus: provider.kycStatus });
    }

    next();
  },
);

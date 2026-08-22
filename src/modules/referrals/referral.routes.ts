import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { referralController } from './referral.controller.js';
import { listReferralHistoryQuerySchema } from './referral.validators.js';

export const referralRoutes = Router();

referralRoutes.use(authenticate);

/**
 * @openapi
 * /referrals/me:
 *   get:
 *     tags: [Referrals]
 *     summary: Get the caller's referral code, share link, and referral stats
 *     description: Generates and saves a referral code for the caller the first time this is called, if they don't already have one.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Referral summary for the caller
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 referralCode: "A1B2C3D4"
 *                 shareLink: "https://patmypets.app/invite/A1B2C3D4"
 *                 totalReferrals: 5
 *                 successfulReferrals: 3
 *                 pendingReferrals: 2
 *                 rewardPointsEarned: 300
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
referralRoutes.get('/me', referralController.getMe);

/**
 * @openapi
 * /referrals/me/history:
 *   get:
 *     tags: [Referrals]
 *     summary: List the caller's own referrals as referrer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: string }
 *         example: "1"
 *       - name: limit
 *         in: query
 *         schema: { type: string }
 *         example: "20"
 *     responses:
 *       200:
 *         description: Paginated list of the caller's referrals
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Success
 *               data:
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   refereeName: Priya Sharma
 *                   status: REWARDED
 *                   rewardPoints: 100
 *                   createdAt: "2026-08-01T10:30:00.000Z"
 *                 - id: 64f1a2b3c4d5e6f7a8b9c0d2
 *                   refereeName: Rohan Mehta
 *                   status: PENDING
 *                   rewardPoints: 100
 *                   createdAt: "2026-08-10T14:00:00.000Z"
 *               meta: { page: 1, limit: 20, total: 2, totalPages: 1 }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "limit must be a valid number" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
referralRoutes.get(
  '/me/history',
  validate({ query: listReferralHistoryQuerySchema }),
  referralController.getHistory,
);

/**
 * @openapi
 * /referrals/redeem:
 *   post:
 *     tags: [Referrals]
 *     summary: Redeem the caller's unredeemed referral reward points to wallet balance
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Reward points redeemed to wallet
 *         content:
 *           application/json:
 *             schema: { type: object }
 *             example:
 *               success: true
 *               message: Reward points redeemed to wallet
 *               data:
 *                 redeemedPoints: 300
 *                 wallet:
 *                   id: 64f1a2b3c4d5e6f7a8b9c0e1
 *                   userId: 64f1a2b3c4d5e6f7a8b9c0d1
 *                   balance: 300
 *                   currency: INR
 *       400:
 *         description: No reward points available to redeem
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: BAD_REQUEST, message: "No reward points available to redeem" }
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *             example: { success: false, error: UNAUTHORIZED, message: "Authentication required" }
 */
referralRoutes.post('/redeem', referralController.redeem);

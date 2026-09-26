import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { ProviderModel } from '../providers/provider.schema.js';
import { UserModel } from '../users/user.schema.js';
import { notificationService } from '../notifications/notification.service.js';
import { NOTIFICATION_TYPES } from '../notifications/notification.constants.js';
import { auditLogService } from '../admin/admin.service.js';
import { AUDIT_ACTIONS } from '../admin/admin.constants.js';
import { walletService } from './wallet.service.js';
import { WALLET_TRANSACTION_REASONS } from './wallet.constants.js';
import {
  MIN_WITHDRAWAL_AMOUNT,
  PAYOUT_STATUSES,
  PayoutRequestModel,
  toPayoutDto,
  type PayoutStatus,
} from './payout.schema.js';

/** Atomically moves a REQUESTED payout to its final state — two admins clicking at once can't
 * both succeed (which would double-credit a rejection). */
async function settle(id: string, update: Record<string, unknown>) {
  const payout = await PayoutRequestModel.findOneAndUpdate(
    { _id: id, status: PAYOUT_STATUSES.REQUESTED },
    { ...update, processedAt: new Date() },
    { new: true },
  ).exec();
  if (payout) return payout;
  const existing = await PayoutRequestModel.findById(id).select('status').lean();
  if (!existing) throw AppError.notFound('Payout request not found');
  throw AppError.badRequest(`This payout is already ${existing.status.toLowerCase()}`);
}

export const payoutService = {
  /** Provider withdraws wallet balance to their saved bank account. The wallet is debited up front
   * (atomic balance check), so the same money can't be requested twice; a rejection credits it back. */
  async request(userId: string, amount: number) {
    const provider = await ProviderModel.findOne({ userId }).exec();
    if (!provider) throw AppError.notFound('Provider profile not found');
    if (!provider.bankAccount) throw AppError.badRequest('Add a bank account before withdrawing');
    if (provider.kycStatus !== 'APPROVED') {
      throw AppError.badRequest('Withdrawals are available once your verification is approved');
    }
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      throw AppError.badRequest(`Minimum withdrawal is ₹${MIN_WITHDRAWAL_AMOUNT}`);
    }

    const payout = await PayoutRequestModel.create({
      providerId: provider._id,
      userId: provider.userId,
      amount,
      bankAccount: {
        accountHolderName: provider.bankAccount.accountHolderName,
        accountNumber: provider.bankAccount.accountNumber,
        ifscCode: provider.bankAccount.ifscCode,
        bankName: provider.bankAccount.bankName,
        accountType: provider.bankAccount.accountType ?? 'SAVINGS',
      },
    });
    try {
      await walletService.debit(
        userId,
        amount,
        WALLET_TRANSACTION_REASONS.PAYOUT_WITHDRAWAL,
        payout._id.toString(),
        'Withdrawal to bank account',
      );
    } catch (err) {
      await payout.deleteOne();
      throw err;
    }
    return toPayoutDto(payout);
  },

  async listMine(userId: string, query: { page?: string; limit?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await Promise.all([
      PayoutRequestModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PayoutRequestModel.countDocuments({ userId }),
    ]);
    return { items: items.map(toPayoutDto), total, page, limit };
  },

  /** Admin queue — full account number included, the admin needs it to make the transfer. */
  async adminList(query: { status?: PayoutStatus; page?: string; limit?: string }) {
    const { page, limit, skip } = parsePagination(query);
    const filter = query.status ? { status: query.status } : {};
    const [items, total] = await Promise.all([
      PayoutRequestModel.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
      PayoutRequestModel.countDocuments(filter),
    ]);
    const [providers, users] = await Promise.all([
      ProviderModel.find({ _id: { $in: items.map((p) => p.providerId) } })
        .select('businessName providerType')
        .lean(),
      UserModel.find({ _id: { $in: items.map((p) => p.userId) } }).select('name phone').lean(),
    ]);
    const providerById = new Map(providers.map((p) => [p._id.toString(), p]));
    const userById = new Map(users.map((u) => [u._id.toString(), u]));
    return {
      items: items.map((payout) => {
        const provider = providerById.get(payout.providerId.toString());
        const user = userById.get(payout.userId.toString());
        return {
          ...toPayoutDto(payout),
          bankAccount: { ...toPayoutDto(payout).bankAccount, accountNumber: payout.bankAccount.accountNumber },
          providerName: provider?.businessName ?? '',
          providerType: provider?.providerType ?? null,
          ownerName: user?.name ?? '',
          ownerPhone: user?.phone ?? '',
        };
      }),
      total,
      page,
      limit,
    };
  },

  async markPaid(actorId: string, id: string, input: { referenceNumber: string; note?: string }) {
    const payout = await settle(id, {
      status: PAYOUT_STATUSES.PAID,
      referenceNumber: input.referenceNumber,
      adminNote: input.note ?? '',
      processedBy: actorId,
    });

    await notificationService.notify({
      userId: payout.userId.toString(),
      type: NOTIFICATION_TYPES.GENERIC,
      title: 'Withdrawal processed',
      body: `₹${payout.amount} has been sent to your bank account (ref ${input.referenceNumber}).`,
      data: { payoutId: payout._id.toString() },
    });
    await auditLogService.record(actorId, AUDIT_ACTIONS.PAYOUT_PAID, 'PayoutRequest', id, {
      amount: payout.amount,
      referenceNumber: input.referenceNumber,
    });
    return toPayoutDto(payout);
  },

  async reject(actorId: string, id: string, input: { reason: string }) {
    const payout = await settle(id, {
      status: PAYOUT_STATUSES.REJECTED,
      adminNote: input.reason,
      processedBy: actorId,
    });

    await walletService.credit(
      payout.userId.toString(),
      payout.amount,
      WALLET_TRANSACTION_REASONS.PAYOUT_REVERSAL,
      payout._id.toString(),
      'Withdrawal rejected — amount returned',
    );
    await notificationService.notify({
      userId: payout.userId.toString(),
      type: NOTIFICATION_TYPES.GENERIC,
      title: 'Withdrawal rejected',
      body: `Your withdrawal of ₹${payout.amount} was returned to your wallet: ${input.reason}`,
      data: { payoutId: payout._id.toString() },
    });
    await auditLogService.record(actorId, AUDIT_ACTIONS.PAYOUT_REJECTED, 'PayoutRequest', id, {
      amount: payout.amount,
      reason: input.reason,
    });
    return toPayoutDto(payout);
  },
};

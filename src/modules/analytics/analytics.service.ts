import { UserModel } from '../users/user.schema.js';
import { ProviderModel } from '../providers/provider.schema.js';
import { BookingModel } from '../bookings/booking.schema.js';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../bookings/booking.constants.js';
import { PaymentModel } from '../payments/payment.schema.js';
import { PAYMENT_TRANSACTION_STATUSES } from '../payments/payment.constants.js';
import { OrderModel } from '../marketplace/order.schema.js';
import { ROLES } from '../../common/constants/roles.js';
import type { DateRangeQuery, TopServicesQuery } from './analytics.dto.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 30;

function parseDateRange(query: DateRangeQuery): { from: Date; to: Date } {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from
    ? new Date(query.from)
    : new Date(to.getTime() - DEFAULT_RANGE_DAYS * DAY_MS);
  return { from, to };
}

export const analyticsService = {
  async overview() {
    const activeBookingStatuses = [
      BOOKING_STATUSES.PENDING,
      BOOKING_STATUSES.ACCEPTED,
      BOOKING_STATUSES.ON_THE_WAY,
      BOOKING_STATUSES.STARTED,
    ];

    const [
      totalUsers,
      totalProviders,
      totalBookings,
      activeBookings,
      completedBookings,
      revenueAgg,
      totalOrders,
    ] = await Promise.all([
      UserModel.countDocuments({ role: ROLES.USER }).exec(),
      ProviderModel.countDocuments({}).exec(),
      BookingModel.countDocuments({}).exec(),
      BookingModel.countDocuments({ status: { $in: activeBookingStatuses } }).exec(),
      BookingModel.countDocuments({ status: BOOKING_STATUSES.COMPLETED }).exec(),
      PaymentModel.aggregate<{ _id: null; total: number }>([
        { $match: { status: PAYMENT_TRANSACTION_STATUSES.CAPTURED } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      OrderModel.countDocuments({}).exec(),
    ]);

    return {
      totalUsers,
      totalProviders,
      totalBookings,
      activeBookings,
      completedBookings,
      totalRevenue: revenueAgg[0]?.total ?? 0,
      totalOrders,
    };
  },

  async bookingsByDay(query: DateRangeQuery) {
    const { from, to } = parseDateRange(query);
    return BookingModel.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]);
  },

  async revenueByDay(query: DateRangeQuery) {
    const { from, to } = parseDateRange(query);
    return PaymentModel.aggregate([
      {
        $match: {
          status: PAYMENT_TRANSACTION_STATUSES.CAPTURED,
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: 1 } },
    ]);
  },

  async userGrowth(query: DateRangeQuery) {
    const { from, to } = parseDateRange(query);
    return UserModel.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', newUsers: 1 } },
    ]);
  },

  async topServices(query: TopServicesQuery) {
    const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit ?? '', 10) || 10));
    return BookingModel.aggregate([
      { $match: { status: { $ne: BOOKING_STATUSES.CANCELLED } } },
      { $group: { _id: '$serviceId', bookingCount: { $sum: 1 } } },
      { $sort: { bookingCount: -1 } },
      { $limit: limit },
      {
        $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' },
      },
      { $unwind: '$service' },
      {
        $project: {
          _id: 0,
          serviceId: '$_id',
          name: '$service.name',
          price: '$service.price',
          bookingCount: 1,
        },
      },
    ]);
  },

  async zonePerformance() {
    return BookingModel.aggregate([
      { $match: { zoneId: { $ne: null }, paymentStatus: PAYMENT_STATUSES.PAID } },
      {
        $group: {
          _id: '$zoneId',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
        },
      },
      { $lookup: { from: 'zones', localField: '_id', foreignField: '_id', as: 'zone' } },
      { $unwind: '$zone' },
      {
        $project: {
          _id: 0,
          zoneId: '$_id',
          zoneName: '$zone.name',
          totalBookings: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);
  },
};

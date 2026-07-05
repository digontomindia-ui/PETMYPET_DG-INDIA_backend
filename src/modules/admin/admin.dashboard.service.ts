import { analyticsService } from '../analytics/analytics.service.js';
import { ProviderModel } from '../providers/provider.schema.js';
import { KYC_STATUSES } from '../providers/provider.constants.js';
import { ReportModel } from '../community/post.schema.js';
import { REPORT_STATUSES } from '../community/post.constants.js';
import { LostAndFoundModel } from '../lost-and-found/lost-and-found.schema.js';
import { APPROVAL_STATUSES } from '../lost-and-found/lost-and-found.constants.js';
import { SupportTicketModel } from '../support/support.schema.js';
import { TICKET_STATUSES } from '../support/support.constants.js';

export const adminDashboardService = {
  async getDashboard() {
    const [overview, pendingKyc, pendingReports, pendingLostAndFound, openTickets] =
      await Promise.all([
        analyticsService.overview(),
        ProviderModel.countDocuments({ kycStatus: KYC_STATUSES.PENDING }).exec(),
        ReportModel.countDocuments({ status: REPORT_STATUSES.PENDING }).exec(),
        LostAndFoundModel.countDocuments({ approvalStatus: APPROVAL_STATUSES.PENDING }).exec(),
        SupportTicketModel.countDocuments({ status: TICKET_STATUSES.OPEN }).exec(),
      ]);

    return {
      ...overview,
      pendingModeration: {
        providerKyc: pendingKyc,
        communityReports: pendingReports,
        lostAndFoundPosts: pendingLostAndFound,
        openSupportTickets: openTickets,
      },
    };
  },
};

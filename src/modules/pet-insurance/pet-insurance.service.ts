import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { ROLES, type Role } from '../../common/constants/roles.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { petInsuranceRepository } from './pet-insurance.repository.js';
import { toInsuranceApplicationDto } from './pet-insurance.mapper.js';
import { APPLICATION_STATUSES } from './pet-insurance.constants.js';
import type {
  CancelInsuranceApplicationInput,
  CreateInsuranceApplicationInput,
  ListInsuranceApplicationsQuery,
  UpdateApplicationStatusInput,
} from './pet-insurance.dto.js';

/** Once underwriting has decided (APPROVED/REJECTED), the applicant backs out through support
 * rather than a self-serve cancel — same reasoning as petRelocationService's cancellable set. */
const USER_CANCELLABLE_STATUSES: string[] = [
  APPLICATION_STATUSES.SUBMITTED,
  APPLICATION_STATUSES.UNDER_REVIEW,
];

export const petInsuranceService = {
  async create(userId: string, input: CreateInsuranceApplicationInput) {
    const application = await petInsuranceRepository.create({
      userId: new Types.ObjectId(userId),
      ownerName: input.ownerName,
      ownerEmail: input.ownerEmail,
      ownerPhone: input.ownerPhone,
      petName: input.petName,
      petType: input.petType,
      petAge: input.petAge,
      petBreed: input.petBreed,
      previousIllness: input.previousIllness,
      // ponytail: cheaper to zero out the irrelevant array here than to add a cross-field zod refine
      illnessDocumentUrls: input.previousIllness ? input.illnessDocumentUrls : [],
      previousSurgery: input.previousSurgery,
      vaccinated: input.vaccinated,
      vaccinationDocumentUrls: input.vaccinated ? input.vaccinationDocumentUrls : [],
    });
    return toInsuranceApplicationDto(application);
  },

  async getById(id: string, userId: string, role: Role) {
    const application = await petInsuranceRepository.findById(id);
    if (!application) throw AppError.notFound('Insurance application not found');
    if (application.userId.toString() !== userId && role !== ROLES.SUPER_ADMIN) {
      throw AppError.forbidden('You do not have access to this application');
    }
    return toInsuranceApplicationDto(application);
  },

  async list(query: ListInsuranceApplicationsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    const [items, total] = await Promise.all([
      petInsuranceRepository.findMany(filter, { skip, limit, sort: { createdAt: -1 } }),
      petInsuranceRepository.count(filter),
    ]);
    return { applications: items.map(toInsuranceApplicationDto), total, page, limit };
  },

  async cancel(id: string, userId: string, input: CancelInsuranceApplicationInput) {
    const application = await petInsuranceRepository.findById(id);
    if (!application) throw AppError.notFound('Insurance application not found');
    if (application.userId.toString() !== userId) {
      throw AppError.forbidden('This application does not belong to you');
    }
    if (!USER_CANCELLABLE_STATUSES.includes(application.status)) {
      throw AppError.badRequest(`Cannot cancel an application that is already ${application.status}`);
    }
    application.status = APPLICATION_STATUSES.CANCELLED;
    application.cancellationReason = input.reason;
    await application.save();
    return toInsuranceApplicationDto(application);
  },

  async updateStatus(id: string, input: UpdateApplicationStatusInput) {
    const application = await petInsuranceRepository.updateById(id, {
      status: input.status,
      rejectionReason:
        input.status === APPLICATION_STATUSES.REJECTED ? input.rejectionReason : null,
    });
    if (!application) throw AppError.notFound('Insurance application not found');
    return toInsuranceApplicationDto(application);
  },
};

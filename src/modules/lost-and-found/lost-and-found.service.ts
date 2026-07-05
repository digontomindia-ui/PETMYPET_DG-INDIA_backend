import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { ROLES, type Role } from '../../common/constants/roles.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { lostAndFoundRepository } from './lost-and-found.repository.js';
import { LostAndFoundModel } from './lost-and-found.schema.js';
import { toLostAndFoundDto } from './lost-and-found.mapper.js';
import { APPROVAL_STATUSES, LOST_AND_FOUND_STATUSES } from './lost-and-found.constants.js';
import type {
  CreateLostAndFoundInput,
  ListLostAndFoundQuery,
  ListPendingQuery,
  RejectLostAndFoundInput,
} from './lost-and-found.dto.js';
import type { ILostAndFoundPost } from './lost-and-found.types.js';

export const lostAndFoundService = {
  async create(reporterId: string, input: CreateLostAndFoundInput) {
    const post = await lostAndFoundRepository.create({
      reporterId: new Types.ObjectId(reporterId),
      type: input.type,
      petName: input.petName,
      species: input.species,
      breed: input.breed,
      description: input.description,
      photoUrls: input.photoUrls,
      lastSeenLocation: input.coordinates
        ? { type: 'Point', coordinates: input.coordinates }
        : null,
      contactPhone: input.contactPhone,
    });
    return toLostAndFoundDto(post);
  },

  async list(query: ListLostAndFoundQuery) {
    const { page, limit, skip } = parsePagination(query);
    const baseMatch: Record<string, unknown> = {
      approvalStatus: APPROVAL_STATUSES.APPROVED,
      isDeleted: false,
    };
    if (query.type) baseMatch.type = query.type;

    if (query.lat && query.lng) {
      const posts = await LostAndFoundModel.aggregate<ILostAndFoundPost>([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [Number(query.lng), Number(query.lat)] },
            distanceField: 'distanceMeters',
            spherical: true,
            maxDistance: query.radiusMeters ? Number(query.radiusMeters) : 50_000,
            query: baseMatch,
          },
        },
        { $skip: skip },
        { $limit: limit },
      ]);
      const dtos = posts.map((doc) => toLostAndFoundDto(doc));
      return { posts: dtos, total: dtos.length, page, limit };
    }

    const [items, total] = await Promise.all([
      lostAndFoundRepository.findMany(baseMatch, { skip, limit, sort: { createdAt: -1 } }),
      lostAndFoundRepository.count(baseMatch),
    ]);
    return { posts: items.map(toLostAndFoundDto), total, page, limit };
  },

  async getById(id: string) {
    const post = await lostAndFoundRepository.findById(id);
    if (!post || post.approvalStatus !== APPROVAL_STATUSES.APPROVED) {
      throw AppError.notFound('Lost & found post not found');
    }
    return toLostAndFoundDto(post);
  },

  async resolve(id: string, userId: string, role: Role) {
    const post = await lostAndFoundRepository.findById(id);
    if (!post) throw AppError.notFound('Lost & found post not found');
    if (post.reporterId.toString() !== userId && role !== ROLES.SUPER_ADMIN) {
      throw AppError.forbidden('You do not have access to this post');
    }
    post.status = LOST_AND_FOUND_STATUSES.RESOLVED;
    await post.save();
    return toLostAndFoundDto(post);
  },

  async remove(id: string, userId: string, role: Role): Promise<void> {
    const post = await lostAndFoundRepository.findById(id);
    if (!post) throw AppError.notFound('Lost & found post not found');
    if (post.reporterId.toString() !== userId && role !== ROLES.SUPER_ADMIN) {
      throw AppError.forbidden('You do not have access to this post');
    }
    await post.softDelete();
  },

  async listPending(query: ListPendingQuery) {
    const { page, limit, skip } = parsePagination(query);
    const filter = { approvalStatus: APPROVAL_STATUSES.PENDING };
    const [items, total] = await Promise.all([
      lostAndFoundRepository.findMany(filter, { skip, limit, sort: { createdAt: 1 } }),
      lostAndFoundRepository.count(filter),
    ]);
    return { posts: items.map(toLostAndFoundDto), total, page, limit };
  },

  async approve(id: string) {
    const post = await lostAndFoundRepository.updateById(id, {
      approvalStatus: APPROVAL_STATUSES.APPROVED,
    });
    if (!post) throw AppError.notFound('Lost & found post not found');
    return toLostAndFoundDto(post);
  },

  async reject(id: string, input: RejectLostAndFoundInput) {
    const post = await lostAndFoundRepository.updateById(id, {
      approvalStatus: APPROVAL_STATUSES.REJECTED,
      rejectionReason: input.reason,
    });
    if (!post) throw AppError.notFound('Lost & found post not found');
    return toLostAndFoundDto(post);
  },
};

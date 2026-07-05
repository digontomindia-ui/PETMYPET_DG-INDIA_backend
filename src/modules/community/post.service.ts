import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { ROLES, type Role } from '../../common/constants/roles.js';
import { postRepository } from './post.repository.js';
import { LikeModel, PostModel } from './post.schema.js';
import { toCommentDto, toPostDto, toReportDto } from './post.mapper.js';
import type {
  CreateCommentInput,
  CreatePostInput,
  CreateReportInput,
  ListPostsQuery,
  ListReportsQuery,
  PaginationQuery,
  UpdateReportStatusInput,
} from './post.dto.js';

export const postService = {
  async create(authorId: string, input: CreatePostInput) {
    const post = await postRepository.create({ ...input, authorId: new Types.ObjectId(authorId) });
    return toPostDto(post);
  },

  async list(viewerId: string | undefined, query: ListPostsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = { isApproved: true };
    if (query.authorId) filter.authorId = query.authorId;

    const [items, total] = await Promise.all([
      postRepository.findMany(filter, { skip, limit, sort: { createdAt: -1 } }),
      postRepository.count(filter),
    ]);

    const likedIds = viewerId
      ? await getLikedPostIds(
          items.map((p) => p._id.toString()),
          viewerId,
        )
      : new Set<string>();
    return {
      posts: items.map((post) => toPostDto(post, likedIds.has(post._id.toString()))),
      total,
      page,
      limit,
    };
  },

  async getById(postId: string, viewerId?: string) {
    const post = await postRepository.findById(postId);
    if (!post || !post.isApproved) throw AppError.notFound('Post not found');
    const hasLiked = viewerId ? await postRepository.hasLiked(postId, viewerId) : false;
    return toPostDto(post, hasLiked);
  },

  async remove(postId: string, userId: string, role: Role): Promise<void> {
    const post = await postRepository.findById(postId);
    if (!post) throw AppError.notFound('Post not found');
    if (post.authorId.toString() !== userId && role !== ROLES.SUPER_ADMIN) {
      throw AppError.forbidden('You do not have access to this post');
    }
    await post.softDelete();
  },

  async like(postId: string, userId: string) {
    const liked = await postRepository.like(postId, userId);
    if (!liked) throw AppError.conflict('You have already liked this post');
  },

  async unlike(postId: string, userId: string) {
    const unliked = await postRepository.unlike(postId, userId);
    if (!unliked) throw AppError.notFound('You have not liked this post');
  },

  async bookmark(postId: string, userId: string) {
    const bookmarked = await postRepository.bookmark(postId, userId);
    if (!bookmarked) throw AppError.conflict('You have already bookmarked this post');
  },

  async unbookmark(postId: string, userId: string) {
    const removed = await postRepository.unbookmark(postId, userId);
    if (!removed) throw AppError.notFound('You have not bookmarked this post');
  },

  async listBookmarked(userId: string, query: PaginationQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { postIds, total } = await postRepository.listBookmarkedPostIds(userId, skip, limit);
    const posts = await PostModel.find({ _id: { $in: postIds }, isApproved: true }).exec();
    const postsById = new Map(posts.map((p) => [p._id.toString(), p]));
    const ordered = postIds
      .map((id) => postsById.get(id.toString()))
      .filter((p) => p !== undefined);
    return { posts: ordered.map((post) => toPostDto(post, true)), total, page, limit };
  },

  async addComment(postId: string, authorId: string, input: CreateCommentInput) {
    const comment = await postRepository.addComment(postId, authorId, input.content);
    return toCommentDto(comment);
  },

  async listComments(postId: string, query: PaginationQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await postRepository.listComments(postId, skip, limit);
    return { comments: items.map(toCommentDto), total, page, limit };
  },

  async deleteComment(commentId: string, userId: string, role: Role): Promise<void> {
    const comment = await postRepository.findCommentById(commentId);
    if (!comment) throw AppError.notFound('Comment not found');
    if (comment.authorId.toString() !== userId && role !== ROLES.SUPER_ADMIN) {
      throw AppError.forbidden('You do not have access to this comment');
    }
    await postRepository.deleteComment(commentId, comment.postId.toString());
  },

  async report(postId: string, reportedBy: string, input: CreateReportInput) {
    const post = await postRepository.findById(postId);
    if (!post) throw AppError.notFound('Post not found');
    const report = await postRepository.createReport(postId, reportedBy, input.reason);
    return toReportDto(report);
  },

  async listReports(query: ListReportsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await postRepository.listReports(query.status, skip, limit);
    return { reports: items.map(toReportDto), total, page, limit };
  },

  async resolveReport(reportId: string, input: UpdateReportStatusInput) {
    const report = await postRepository.updateReportStatus(reportId, input.status);
    if (!report) throw AppError.notFound('Report not found');
    return toReportDto(report);
  },

  async moderateRemove(postId: string): Promise<void> {
    const post = await postRepository.findById(postId);
    if (!post) throw AppError.notFound('Post not found');
    await post.softDelete();
  },
};

async function getLikedPostIds(postIds: string[], userId: string): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const likes = await LikeModel.find({ postId: { $in: postIds }, userId }).exec();
  return new Set(likes.map((l) => l.postId.toString()));
}

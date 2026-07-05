import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { sendSuccess, buildPaginationMeta } from '../../common/utils/api-response.js';
import { AppError } from '../../common/errors/app-error.js';
import { HTTP_STATUS } from '../../common/constants/http-status.js';
import { postService } from './post.service.js';
import type {
  CreateCommentInput,
  CreatePostInput,
  CreateReportInput,
  UpdateReportStatusInput,
} from './post.dto.js';

function requireAuth(req: Request) {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
}

export const postController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const post = await postService.create(userId, req.body as CreatePostInput);
    sendSuccess(res, HTTP_STATUS.CREATED, post, 'Post created');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { posts, total, page, limit } = await postService.list(req.user?.userId, req.query);
    sendSuccess(res, HTTP_STATUS.OK, posts, 'Success', buildPaginationMeta(page, limit, total));
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const post = await postService.getById(req.params.id as string, req.user?.userId);
    sendSuccess(res, HTTP_STATUS.OK, post);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    await postService.remove(req.params.id as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Post deleted');
  }),

  like: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    await postService.like(req.params.id as string, userId);
    sendSuccess(res, HTTP_STATUS.CREATED, null, 'Post liked');
  }),

  unlike: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    await postService.unlike(req.params.id as string, userId);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Post unliked');
  }),

  bookmark: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    await postService.bookmark(req.params.id as string, userId);
    sendSuccess(res, HTTP_STATUS.CREATED, null, 'Post bookmarked');
  }),

  unbookmark: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    await postService.unbookmark(req.params.id as string, userId);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Bookmark removed');
  }),

  listBookmarked: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const { posts, total, page, limit } = await postService.listBookmarked(userId, req.query);
    sendSuccess(res, HTTP_STATUS.OK, posts, 'Success', buildPaginationMeta(page, limit, total));
  }),

  addComment: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const comment = await postService.addComment(
      req.params.id as string,
      userId,
      req.body as CreateCommentInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, comment, 'Comment added');
  }),

  listComments: asyncHandler(async (req: Request, res: Response) => {
    const { comments, total, page, limit } = await postService.listComments(
      req.params.id as string,
      req.query,
    );
    sendSuccess(res, HTTP_STATUS.OK, comments, 'Success', buildPaginationMeta(page, limit, total));
  }),

  deleteComment: asyncHandler(async (req: Request, res: Response) => {
    const { userId, role } = requireAuth(req);
    await postService.deleteComment(req.params.commentId as string, userId, role);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Comment deleted');
  }),

  report: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const report = await postService.report(
      req.params.id as string,
      userId,
      req.body as CreateReportInput,
    );
    sendSuccess(res, HTTP_STATUS.CREATED, report, 'Post reported');
  }),

  listReports: asyncHandler(async (req: Request, res: Response) => {
    const { reports, total, page, limit } = await postService.listReports(req.query);
    sendSuccess(res, HTTP_STATUS.OK, reports, 'Success', buildPaginationMeta(page, limit, total));
  }),

  resolveReport: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const report = await postService.resolveReport(
      userId,
      req.params.id as string,
      req.body as UpdateReportStatusInput,
    );
    sendSuccess(res, HTTP_STATUS.OK, report, 'Report updated');
  }),

  moderateRemove: asyncHandler(async (req: Request, res: Response) => {
    await postService.moderateRemove(req.params.id as string);
    sendSuccess(res, HTTP_STATUS.OK, null, 'Post removed by moderation');
  }),
};

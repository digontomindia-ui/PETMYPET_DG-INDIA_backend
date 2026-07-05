import { BaseRepository } from '../../common/repositories/base.repository.js';
import { AppError } from '../../common/errors/app-error.js';
import { BookmarkModel, CommentModel, LikeModel, PostModel, ReportModel } from './post.schema.js';
import type { IPost } from './post.types.js';

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}

export class PostRepository extends BaseRepository<IPost> {
  constructor() {
    super(PostModel);
  }

  async like(postId: string, userId: string): Promise<boolean> {
    try {
      await LikeModel.create({ postId, userId });
    } catch (err) {
      if (isDuplicateKeyError(err)) return false;
      throw err;
    }
    await PostModel.updateOne({ _id: postId }, { $inc: { likesCount: 1 } }).exec();
    return true;
  }

  async unlike(postId: string, userId: string): Promise<boolean> {
    const result = await LikeModel.findOneAndDelete({ postId, userId }).exec();
    if (!result) return false;
    await PostModel.updateOne({ _id: postId }, { $inc: { likesCount: -1 } }).exec();
    return true;
  }

  async hasLiked(postId: string, userId: string): Promise<boolean> {
    const like = await LikeModel.findOne({ postId, userId }).exec();
    return like !== null;
  }

  async bookmark(postId: string, userId: string): Promise<boolean> {
    try {
      await BookmarkModel.create({ postId, userId });
      return true;
    } catch (err) {
      if (isDuplicateKeyError(err)) return false;
      throw err;
    }
  }

  async unbookmark(postId: string, userId: string): Promise<boolean> {
    const result = await BookmarkModel.findOneAndDelete({ postId, userId }).exec();
    return result !== null;
  }

  async listBookmarkedPostIds(userId: string, skip: number, limit: number) {
    const [bookmarks, total] = await Promise.all([
      BookmarkModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      BookmarkModel.countDocuments({ userId }).exec(),
    ]);
    return { postIds: bookmarks.map((b) => b.postId), total };
  }

  async addComment(postId: string, authorId: string, content: string) {
    const post = await PostModel.findById(postId).exec();
    if (!post) throw AppError.notFound('Post not found');

    const comment = await CommentModel.create({ postId, authorId, content });
    await PostModel.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } }).exec();
    return comment;
  }

  async listComments(postId: string, skip: number, limit: number) {
    const filter = { postId };
    const [items, total] = await Promise.all([
      CommentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      CommentModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async findCommentById(commentId: string) {
    return CommentModel.findById(commentId).exec();
  }

  async deleteComment(commentId: string, postId: string): Promise<void> {
    await CommentModel.deleteOne({ _id: commentId }).exec();
    await PostModel.updateOne({ _id: postId }, { $inc: { commentsCount: -1 } }).exec();
  }

  async createReport(postId: string, reportedBy: string, reason: string) {
    return ReportModel.create({ postId, reportedBy, reason });
  }

  async listReports(status: string | undefined, skip: number, limit: number) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      ReportModel.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).exec(),
      ReportModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async updateReportStatus(reportId: string, status: string) {
    return ReportModel.findByIdAndUpdate(reportId, { status }, { new: true }).exec();
  }
}

export const postRepository = new PostRepository();

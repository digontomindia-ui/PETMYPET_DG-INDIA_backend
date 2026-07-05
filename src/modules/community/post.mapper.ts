import type { CommentDocument, PostDocument, ReportDocument } from './post.types.js';

export function toPostDto(post: PostDocument, viewerHasLiked = false) {
  return {
    id: post._id.toString(),
    authorId: post.authorId.toString(),
    content: post.content,
    mediaUrls: post.mediaUrls,
    likesCount: post.likesCount,
    commentsCount: post.commentsCount,
    isApproved: post.isApproved,
    viewerHasLiked,
    createdAt: post.createdAt,
  };
}

export function toCommentDto(comment: CommentDocument) {
  return {
    id: comment._id.toString(),
    postId: comment.postId.toString(),
    authorId: comment.authorId.toString(),
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

export function toReportDto(report: ReportDocument) {
  return {
    id: report._id.toString(),
    postId: report.postId.toString(),
    reportedBy: report.reportedBy.toString(),
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt,
  };
}

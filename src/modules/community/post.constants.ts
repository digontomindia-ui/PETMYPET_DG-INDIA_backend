export const POST_MODEL_NAME = 'Post';
export const COMMENT_MODEL_NAME = 'Comment';
export const LIKE_MODEL_NAME = 'Like';
export const BOOKMARK_MODEL_NAME = 'Bookmark';
export const REPORT_MODEL_NAME = 'Report';

export const REPORT_STATUSES = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
} as const;

export type ReportStatus = (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES];

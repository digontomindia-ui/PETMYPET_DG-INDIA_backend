export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface ParsedPagination {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(query: { page?: string; limit?: string }): ParsedPagination {
  const page = Math.max(1, Number.parseInt(query.page ?? '', 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(query.limit ?? '', 10) || DEFAULT_LIMIT),
  );
  return { page, limit, skip: (page - 1) * limit };
}

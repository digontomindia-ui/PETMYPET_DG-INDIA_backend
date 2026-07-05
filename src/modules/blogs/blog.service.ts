import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { blogRepository } from './blog.repository.js';
import { toBlogDto } from './blog.mapper.js';
import type { CreateBlogInput, ListBlogsQuery, UpdateBlogInput } from './blog.dto.js';

export const blogService = {
  async create(authorId: string, input: CreateBlogInput) {
    const existing = await blogRepository.findBySlug(input.slug);
    if (existing) throw AppError.conflict('A blog post with this slug already exists');

    const blog = await blogRepository.create({
      ...input,
      authorId: new Types.ObjectId(authorId),
      publishedAt: input.isPublished ? new Date() : null,
    });
    return toBlogDto(blog);
  },

  async listPublished(query: ListBlogsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const filter: Record<string, unknown> = { isPublished: true };
    if (query.tag) filter.tags = query.tag;
    if (query.q) filter.$text = { $search: query.q };

    const [items, total] = await Promise.all([
      blogRepository.findMany(filter, { skip, limit, sort: { publishedAt: -1 } }),
      blogRepository.count(filter),
    ]);
    return { blogs: items.map(toBlogDto), total, page, limit };
  },

  async getBySlug(slug: string) {
    const blog = await blogRepository.findBySlug(slug);
    if (!blog || !blog.isPublished) throw AppError.notFound('Blog post not found');
    return toBlogDto(blog);
  },

  async update(id: string, input: UpdateBlogInput) {
    const blog = await blogRepository.findById(id);
    if (!blog) throw AppError.notFound('Blog post not found');

    Object.assign(blog, input);
    if (input.isPublished && !blog.publishedAt) blog.publishedAt = new Date();
    await blog.save();
    return toBlogDto(blog);
  },

  async remove(id: string): Promise<void> {
    const deleted = await blogRepository.softDeleteById(id);
    if (!deleted) throw AppError.notFound('Blog post not found');
  },
};

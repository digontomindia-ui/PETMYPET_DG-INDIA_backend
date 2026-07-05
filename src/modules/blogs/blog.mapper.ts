import type { BlogDocument } from './blog.types.js';

export function toBlogDto(blog: BlogDocument) {
  return {
    id: blog._id.toString(),
    authorId: blog.authorId.toString(),
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    coverImageUrl: blog.coverImageUrl,
    tags: blog.tags,
    isPublished: blog.isPublished,
    publishedAt: blog.publishedAt,
    createdAt: blog.createdAt,
  };
}

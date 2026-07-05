import { BaseRepository } from '../../common/repositories/base.repository.js';
import { BlogModel } from './blog.schema.js';
import type { IBlog } from './blog.types.js';

export class BlogRepository extends BaseRepository<IBlog> {
  constructor() {
    super(BlogModel);
  }

  async findBySlug(slug: string) {
    return this.model.findOne({ slug }).exec();
  }
}

export const blogRepository = new BlogRepository();

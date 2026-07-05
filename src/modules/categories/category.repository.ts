import { BaseRepository } from '../../common/repositories/base.repository.js';
import { CategoryModel } from './category.schema.js';
import type { ICategory } from './category.types.js';

export class CategoryRepository extends BaseRepository<ICategory> {
  constructor() {
    super(CategoryModel);
  }

  async findBySlug(slug: string) {
    return this.model.findOne({ slug }).exec();
  }
}

export const categoryRepository = new CategoryRepository();

import { AppError } from '../../common/errors/app-error.js';
import { categoryRepository } from './category.repository.js';
import { toCategoryDto } from './category.mapper.js';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.dto.js';

export const categoryService = {
  async create(input: CreateCategoryInput) {
    const existing = await categoryRepository.findBySlug(input.slug);
    if (existing) throw AppError.conflict('A category with this slug already exists');
    const category = await categoryRepository.create(input);
    return toCategoryDto(category);
  },

  async list() {
    const categories = await categoryRepository.findMany({ isActive: true }, { sort: { name: 1 } });
    return categories.map(toCategoryDto);
  },

  async getById(id: string) {
    const category = await categoryRepository.findById(id);
    if (!category) throw AppError.notFound('Category not found');
    return toCategoryDto(category);
  },

  async update(id: string, input: UpdateCategoryInput) {
    const category = await categoryRepository.updateById(id, input);
    if (!category) throw AppError.notFound('Category not found');
    return toCategoryDto(category);
  },

  async remove(id: string): Promise<void> {
    const deleted = await categoryRepository.softDeleteById(id);
    if (!deleted) throw AppError.notFound('Category not found');
  },
};

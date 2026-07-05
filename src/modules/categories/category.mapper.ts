import type { CategoryDocument } from './category.types.js';

export function toCategoryDto(category: CategoryDocument) {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description,
    iconUrl: category.iconUrl,
    providerTypes: category.providerTypes,
    isActive: category.isActive,
  };
}

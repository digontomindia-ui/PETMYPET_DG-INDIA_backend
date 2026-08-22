import type { ServiceDocument } from './service.types.js';

export function toServiceDto(service: ServiceDocument) {
  return {
    id: service._id.toString(),
    providerId: service.providerId.toString(),
    categoryId: service.categoryId.toString(),
    name: service.name,
    description: service.description,
    price: service.price,
    durationMinutes: service.durationMinutes,
    images: service.images,
    addOnCatalog: service.addOnCatalog,
    isActive: service.isActive,
    createdAt: service.createdAt,
  };
}

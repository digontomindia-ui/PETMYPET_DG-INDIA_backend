import { Types } from 'mongoose';
import { AppError } from '../../common/errors/app-error.js';
import { parsePagination } from '../../common/utils/pagination.js';
import { ROLES, type Role } from '../../common/constants/roles.js';
import { providerRepository } from '../providers/provider.repository.js';
import { productRepository } from './product.repository.js';
import { toProductDto } from './product.mapper.js';
import type { CreateProductInput, SearchProductsQuery, UpdateProductInput } from './product.dto.js';

async function resolveProviderId(
  userId: string,
  role: Role,
  requestedProviderId?: string,
): Promise<string | null> {
  if (role === ROLES.SUPER_ADMIN) return requestedProviderId ?? null;

  const provider = await providerRepository.findByUserId(userId);
  if (!provider) throw AppError.notFound('Provider profile not found');
  return provider._id.toString();
}

async function requireOwnProduct(productId: string, userId: string, role: Role) {
  const product = await productRepository.findById(productId);
  if (!product) throw AppError.notFound('Product not found');
  if (role === ROLES.SUPER_ADMIN) return product;

  const provider = await providerRepository.findByUserId(userId);
  if (
    !provider ||
    !product.providerId ||
    product.providerId.toString() !== provider._id.toString()
  ) {
    throw AppError.forbidden('You do not have access to this product');
  }
  return product;
}

export const productService = {
  async create(userId: string, role: Role, input: CreateProductInput) {
    const providerId = await resolveProviderId(userId, role, input.providerId);
    const product = await productRepository.create({
      ...input,
      providerId: providerId ? new Types.ObjectId(providerId) : null,
    });
    return toProductDto(product);
  },

  async search(query: SearchProductsQuery) {
    const { page, limit, skip } = parsePagination(query);
    const { items, total } = await productRepository.search({
      category: query.category,
      providerId: query.providerId,
      text: query.q,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      skip,
      limit,
    });
    return { products: items.map(toProductDto), total, page, limit };
  },

  async getById(id: string) {
    const product = await productRepository.findById(id);
    if (!product || !product.isActive) throw AppError.notFound('Product not found');
    return toProductDto(product);
  },

  async update(productId: string, userId: string, role: Role, input: UpdateProductInput) {
    const product = await requireOwnProduct(productId, userId, role);
    Object.assign(product, input);
    await product.save();
    return toProductDto(product);
  },

  async remove(productId: string, userId: string, role: Role): Promise<void> {
    const product = await requireOwnProduct(productId, userId, role);
    await product.softDelete();
  },
};

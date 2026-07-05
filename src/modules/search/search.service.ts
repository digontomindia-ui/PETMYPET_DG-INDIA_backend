import { ServiceModel } from '../services/service.schema.js';
import { ProductModel } from '../marketplace/product.schema.js';
import { ProviderModel } from '../providers/provider.schema.js';
import { BlogModel } from '../blogs/blog.schema.js';
import type { GlobalSearchQuery, SuggestQuery } from './search.dto.js';

const DEFAULT_CATEGORY_LIMIT = 5;
const DEFAULT_SUGGEST_LIMIT = 8;

export const searchService = {
  async globalSearch(query: GlobalSearchQuery) {
    const limit = Math.min(
      20,
      Math.max(1, Number.parseInt(query.limit ?? '', 10) || DEFAULT_CATEGORY_LIMIT),
    );
    const textFilter = { $text: { $search: query.q } };

    const [services, products, providers, blogs] = await Promise.all([
      ServiceModel.find({ ...textFilter, isActive: true })
        .limit(limit)
        .exec(),
      ProductModel.find({ ...textFilter, isActive: true })
        .limit(limit)
        .exec(),
      ProviderModel.find({
        businessName: { $regex: query.q, $options: 'i' },
        isActive: true,
        kycStatus: 'APPROVED',
      })
        .limit(limit)
        .exec(),
      BlogModel.find({ ...textFilter, isPublished: true })
        .limit(limit)
        .exec(),
    ]);

    return {
      services: services.map((s) => ({ id: s._id.toString(), name: s.name, price: s.price })),
      products: products.map((p) => ({ id: p._id.toString(), name: p.name, price: p.price })),
      providers: providers.map((p) => ({
        id: p._id.toString(),
        name: p.businessName,
        providerType: p.providerType,
        rating: p.rating,
      })),
      blogs: blogs.map((b) => ({ id: b._id.toString(), title: b.title, slug: b.slug })),
    };
  },

  async suggest(query: SuggestQuery) {
    const limit = Math.min(
      20,
      Math.max(1, Number.parseInt(query.limit ?? '', 10) || DEFAULT_SUGGEST_LIMIT),
    );
    const prefixFilter = { $regex: `^${escapeRegex(query.q)}`, $options: 'i' };
    const perSourceLimit = Math.ceil(limit / 3);

    const [services, products, providers] = await Promise.all([
      ServiceModel.find({ name: prefixFilter, isActive: true })
        .limit(perSourceLimit)
        .select('name')
        .exec(),
      ProductModel.find({ name: prefixFilter, isActive: true })
        .limit(perSourceLimit)
        .select('name')
        .exec(),
      ProviderModel.find({ businessName: prefixFilter, isActive: true })
        .limit(perSourceLimit)
        .select('businessName')
        .exec(),
    ]);

    const suggestions = new Set<string>([
      ...services.map((s) => s.name),
      ...products.map((p) => p.name),
      ...providers.map((p) => p.businessName),
    ]);

    return [...suggestions].slice(0, limit);
  },
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

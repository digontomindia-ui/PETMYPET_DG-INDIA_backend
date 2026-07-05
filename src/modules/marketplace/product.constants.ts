export const PRODUCT_MODEL_NAME = 'Product';

export const PRODUCT_CATEGORIES = {
  FOOD: 'FOOD',
  PHARMACY: 'PHARMACY',
  ACCESSORIES: 'ACCESSORIES',
  GROOMING_SUPPLIES: 'GROOMING_SUPPLIES',
  TOYS: 'TOYS',
  OTHER: 'OTHER',
} as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[keyof typeof PRODUCT_CATEGORIES];

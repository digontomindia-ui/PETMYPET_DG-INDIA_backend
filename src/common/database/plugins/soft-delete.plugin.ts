import type { Schema } from 'mongoose';

/**
 * Adds isDeleted/deletedAt fields, excludes soft-deleted docs from find/count queries by
 * default, and provides a softDelete() instance method. Callers that need deleted docs too
 * must explicitly pass { includeDeleted: true } in query options.
 */
export function softDeletePlugin(schema: Schema): void {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  });

  const excludeDeleted = function (this: {
    getFilter: () => Record<string, unknown>;
    getOptions: () => Record<string, unknown>;
  }) {
    const options = this.getOptions();
    if (options.includeDeleted) return;
    const filter = this.getFilter();
    if (filter.isDeleted === undefined) {
      filter.isDeleted = false;
    }
  };

  schema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments', 'count'], excludeDeleted);

  schema.methods.softDelete = function (this: { isDeleted: boolean; deletedAt: Date | null; save: () => Promise<unknown> }) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  };
}

export interface SoftDeletable {
  isDeleted: boolean;
  deletedAt: Date | null;
  softDelete: () => Promise<unknown>;
}

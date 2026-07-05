import type { Query, Schema } from 'mongoose';

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

  function excludeDeleted(this: Query<unknown, unknown>): void {
    const options = this.getOptions();
    if (options.includeDeleted) return;
    const filter = this.getFilter();
    if (filter.isDeleted === undefined) {
      this.where({ isDeleted: false });
    }
  }

  schema.pre('find', excludeDeleted);
  schema.pre('findOne', excludeDeleted);
  schema.pre('findOneAndUpdate', excludeDeleted);
  schema.pre('countDocuments', excludeDeleted);

  schema.methods.softDelete = function (this: SoftDeletable & { save: () => Promise<unknown> }) {
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

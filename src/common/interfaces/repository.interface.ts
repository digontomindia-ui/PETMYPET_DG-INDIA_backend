import type { FilterQuery, HydratedDocument, UpdateQuery } from 'mongoose';

export interface FindManyOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  populate?: string | string[];
  select?: string;
  includeDeleted?: boolean;
}

/** TRaw is the plain schema interface (e.g. IUser); documents returned are HydratedDocument<TRaw>. */
export interface IRepository<TRaw> {
  create(data: Partial<TRaw>): Promise<HydratedDocument<TRaw>>;
  findById(id: string): Promise<HydratedDocument<TRaw> | null>;
  findOne(filter: FilterQuery<TRaw>): Promise<HydratedDocument<TRaw> | null>;
  findMany(filter: FilterQuery<TRaw>, options?: FindManyOptions): Promise<HydratedDocument<TRaw>[]>;
  count(filter: FilterQuery<TRaw>, includeDeleted?: boolean): Promise<number>;
  updateById(id: string, update: UpdateQuery<TRaw>): Promise<HydratedDocument<TRaw> | null>;
  deleteById(id: string): Promise<boolean>;
  softDeleteById(id: string): Promise<boolean>;
}

import type { FilterQuery, UpdateQuery } from 'mongoose';

export interface FindManyOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  populate?: string | string[];
  select?: string;
  includeDeleted?: boolean;
}

export interface IRepository<TDoc> {
  create(data: Partial<TDoc>): Promise<TDoc>;
  findById(id: string): Promise<TDoc | null>;
  findOne(filter: FilterQuery<TDoc>): Promise<TDoc | null>;
  findMany(filter: FilterQuery<TDoc>, options?: FindManyOptions): Promise<TDoc[]>;
  count(filter: FilterQuery<TDoc>, includeDeleted?: boolean): Promise<number>;
  updateById(id: string, update: UpdateQuery<TDoc>): Promise<TDoc | null>;
  deleteById(id: string): Promise<boolean>;
  softDeleteById(id: string): Promise<boolean>;
}

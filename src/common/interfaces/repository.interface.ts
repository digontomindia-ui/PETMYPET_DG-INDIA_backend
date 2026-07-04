import type { FilterQuery, UpdateQuery } from 'mongoose';

export interface IRepository<TDoc> {
  create(data: Partial<TDoc>): Promise<TDoc>;
  findById(id: string): Promise<TDoc | null>;
  findOne(filter: FilterQuery<TDoc>): Promise<TDoc | null>;
  findMany(filter: FilterQuery<TDoc>, options?: FindManyOptions<TDoc>): Promise<TDoc[]>;
  count(filter: FilterQuery<TDoc>): Promise<number>;
  updateById(id: string, update: UpdateQuery<TDoc>): Promise<TDoc | null>;
  deleteById(id: string): Promise<boolean>;
  softDeleteById(id: string): Promise<boolean>;
}

export interface FindManyOptions<TDoc> {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  populate?: string | string[];
  select?: string;
  includeDeleted?: boolean;
}

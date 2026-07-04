import type { FilterQuery, HydratedDocument, Model, UpdateQuery } from 'mongoose';
import type { FindManyOptions, IRepository } from '../interfaces/repository.interface.js';

export class BaseRepository<TDoc> implements IRepository<HydratedDocument<TDoc>> {
  constructor(protected readonly model: Model<TDoc>) {}

  async create(data: Partial<TDoc>): Promise<HydratedDocument<TDoc>> {
    const doc = new this.model(data);
    return doc.save();
  }

  async findById(id: string): Promise<HydratedDocument<TDoc> | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<TDoc>): Promise<HydratedDocument<TDoc> | null> {
    return this.model.findOne(filter).exec();
  }

  async findMany(
    filter: FilterQuery<TDoc>,
    options: FindManyOptions<TDoc> = {},
  ): Promise<HydratedDocument<TDoc>[]> {
    let query = this.model.find(filter, null, { includeDeleted: options.includeDeleted });

    if (options.sort) query = query.sort(options.sort);
    if (typeof options.skip === 'number') query = query.skip(options.skip);
    if (typeof options.limit === 'number') query = query.limit(options.limit);
    if (options.select) query = query.select(options.select);
    if (options.populate) query = query.populate(options.populate);

    return query.exec();
  }

  async count(filter: FilterQuery<TDoc>, includeDeleted = false): Promise<number> {
    return this.model.countDocuments(filter, { includeDeleted }).exec();
  }

  async updateById(id: string, update: UpdateQuery<TDoc>): Promise<HydratedDocument<TDoc> | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async softDeleteById(id: string): Promise<boolean> {
    const result = await this.model
      .findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() } as UpdateQuery<TDoc>, {
        new: true,
      })
      .exec();
    return result !== null;
  }
}

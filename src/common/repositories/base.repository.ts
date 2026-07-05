import type { FilterQuery, HydratedDocument, Model, UpdateQuery } from 'mongoose';
import type { FindManyOptions, IRepository } from '../interfaces/repository.interface.js';

/** TRaw is the plain schema interface for the model (e.g. `IUser`), not a hydrated document. */
export class BaseRepository<TRaw> implements IRepository<TRaw> {
  constructor(protected readonly model: Model<TRaw>) {}

  async create(data: Partial<TRaw>): Promise<HydratedDocument<TRaw>> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<HydratedDocument<TRaw> | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<TRaw>): Promise<HydratedDocument<TRaw> | null> {
    return this.model.findOne(filter).exec();
  }

  async findMany(
    filter: FilterQuery<TRaw>,
    options: FindManyOptions = {},
  ): Promise<HydratedDocument<TRaw>[]> {
    let query = this.model.find(filter, null, { includeDeleted: options.includeDeleted });

    if (options.sort) query = query.sort(options.sort);
    if (typeof options.skip === 'number') query = query.skip(options.skip);
    if (typeof options.limit === 'number') query = query.limit(options.limit);
    if (options.select) query = query.select(options.select);
    if (options.populate) query = query.populate(options.populate);

    return query.exec();
  }

  async count(filter: FilterQuery<TRaw>, includeDeleted = false): Promise<number> {
    return this.model.countDocuments(filter, { includeDeleted }).exec();
  }

  async updateById(id: string, update: UpdateQuery<TRaw>): Promise<HydratedDocument<TRaw> | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async softDeleteById(id: string): Promise<boolean> {
    const result = await this.model
      .findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true })
      .exec();
    return result !== null;
  }
}

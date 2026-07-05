import type { FilterQuery, Model, UpdateQuery } from 'mongoose';
import type { FindManyOptions, IRepository } from '../interfaces/repository.interface.js';

/** TDoc must be the hydrated Mongoose document type for the model (e.g. `HydratedDocument<IUser>`). */
export class BaseRepository<TDoc> implements IRepository<TDoc> {
  constructor(protected readonly model: Model<TDoc>) {}

  async create(data: Partial<TDoc>): Promise<TDoc> {
    return this.model.create(data);
  }

  async findById(id: string): Promise<TDoc | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<TDoc>): Promise<TDoc | null> {
    return this.model.findOne(filter).exec();
  }

  async findMany(filter: FilterQuery<TDoc>, options: FindManyOptions = {}): Promise<TDoc[]> {
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

  async updateById(id: string, update: UpdateQuery<TDoc>): Promise<TDoc | null> {
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

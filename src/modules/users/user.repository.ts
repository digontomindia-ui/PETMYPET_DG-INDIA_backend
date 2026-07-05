import { BaseRepository } from '../../common/repositories/base.repository.js';
import { UserModel } from './user.schema.js';
import type { IUser, UserDocument } from './user.types.js';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string, includePassword = false): Promise<UserDocument | null> {
    const query = this.model.findOne({ email: email.toLowerCase() });
    return includePassword ? query.select('+passwordHash').exec() : query.exec();
  }

  async findByPhone(phone: string, includePassword = false): Promise<UserDocument | null> {
    const query = this.model.findOne({ phone });
    return includePassword ? query.select('+passwordHash').exec() : query.exec();
  }

  async findByIdWithPassword(id: string): Promise<UserDocument | null> {
    return this.model.findById(id).select('+passwordHash').exec();
  }
}

export const userRepository = new UserRepository();

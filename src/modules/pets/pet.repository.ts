import { BaseRepository } from '../../common/repositories/base.repository.js';
import { PetModel } from './pet.schema.js';
import type { IPet } from './pet.types.js';

export class PetRepository extends BaseRepository<IPet> {
  constructor() {
    super(PetModel);
  }

  async findByOwner(ownerId: string) {
    return this.model.find({ ownerId }).sort({ createdAt: -1 }).exec();
  }
}

export const petRepository = new PetRepository();

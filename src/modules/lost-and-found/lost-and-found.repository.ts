import { BaseRepository } from '../../common/repositories/base.repository.js';
import { LostAndFoundModel } from './lost-and-found.schema.js';
import type { ILostAndFoundPost } from './lost-and-found.types.js';

export class LostAndFoundRepository extends BaseRepository<ILostAndFoundPost> {
  constructor() {
    super(LostAndFoundModel);
  }
}

export const lostAndFoundRepository = new LostAndFoundRepository();

import { BaseRepository } from '../../common/repositories/base.repository.js';
import { RelocationRequestModel } from './pet-relocation.schema.js';
import type { IRelocationRequest } from './pet-relocation.types.js';

export class RelocationRequestRepository extends BaseRepository<IRelocationRequest> {
  constructor() {
    super(RelocationRequestModel);
  }
}

export const relocationRequestRepository = new RelocationRequestRepository();

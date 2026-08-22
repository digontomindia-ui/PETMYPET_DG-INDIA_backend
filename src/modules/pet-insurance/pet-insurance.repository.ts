import { BaseRepository } from '../../common/repositories/base.repository.js';
import { InsuranceApplicationModel } from './pet-insurance.schema.js';
import type { IInsuranceApplication } from './pet-insurance.types.js';

export class PetInsuranceRepository extends BaseRepository<IInsuranceApplication> {
  constructor() {
    super(InsuranceApplicationModel);
  }
}

export const petInsuranceRepository = new PetInsuranceRepository();

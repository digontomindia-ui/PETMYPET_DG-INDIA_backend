import { BaseRepository } from '../../common/repositories/base.repository.js';
import { ReferralModel } from './referral.schema.js';
import type { IReferral } from './referral.types.js';

export class ReferralRepository extends BaseRepository<IReferral> {
  constructor() {
    super(ReferralModel);
  }
}

export const referralRepository = new ReferralRepository();

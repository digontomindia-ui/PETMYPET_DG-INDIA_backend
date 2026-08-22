import { BaseRepository } from '../../common/repositories/base.repository.js';
import { PetTaxiBookingModel } from './pet-taxi.schema.js';
import type { IPetTaxiBooking } from './pet-taxi.types.js';

export class PetTaxiRepository extends BaseRepository<IPetTaxiBooking> {
  constructor() {
    super(PetTaxiBookingModel);
  }
}

export const petTaxiRepository = new PetTaxiRepository();

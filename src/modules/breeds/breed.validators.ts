import { z } from 'zod';
import { PET_SPECIES } from '../pets/pet.constants.js';

export const listBreedsQuerySchema = z.object({
  species: z.enum([
    PET_SPECIES.DOG,
    PET_SPECIES.CAT,
    PET_SPECIES.BIRD,
    PET_SPECIES.RABBIT,
    PET_SPECIES.FISH,
    PET_SPECIES.OTHER,
  ]),
});

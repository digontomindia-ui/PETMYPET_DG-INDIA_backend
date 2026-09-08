import mongoose from 'mongoose';
import { hashPassword } from './src/common/utils/password.js';
import { UserModel } from './src/modules/users/user.schema.js';
import { PetModel } from './src/modules/pets/pet.schema.js';
import { PET_SPECIES, PET_GENDERS, COMPANION_ACTIVITY_LEVELS, GETS_ALONG_WITH_STATUS } from './src/modules/pets/pet.constants.js';
import { ROLES } from './src/common/constants/roles.js';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

await mongoose.connect(uri);

const DIGHA: [number, number] = [87.55930839999999, 21.674505699999997];
function jitter([lng, lat]: [number, number], meters: number): [number, number] {
  const degrees = meters / 111_320;
  return [lng + (Math.random() - 0.5) * 2 * degrees, lat + (Math.random() - 0.5) * 2 * degrees];
}

let deepak = await UserModel.findOne({ email: 'deepak.barik@seed.patmypets.in' });
if (!deepak) {
  deepak = await UserModel.create({
    role: ROLES.USER,
    name: 'Deepak Barik',
    email: 'deepak.barik@seed.patmypets.in',
    phone: '+919111000006',
    passwordHash: await hashPassword('Passw0rd!'),
    isVerified: true,
    addresses: [
      {
        label: 'Home',
        addressLine1: 'Chaowl Bazar Road, Digha',
        city: 'Digha',
        state: 'West Bengal',
        postalCode: '721428',
        country: 'India',
        location: { type: 'Point', coordinates: jitter(DIGHA, 2000) },
        isDefault: true,
      },
    ],
  });
  console.log('created user', deepak._id.toString());
} else {
  console.log('user already exists', deepak._id.toString());
}

const existingPet = await PetModel.findOne({ ownerId: deepak._id, name: 'Simba' });
if (!existingPet) {
  const simba = await PetModel.create({
    ownerId: deepak._id,
    name: 'Simba',
    species: PET_SPECIES.DOG,
    breed: 'Labrador Retriever',
    gender: PET_GENDERS.MALE,
    dateOfBirth: new Date(Date.now() - 365 * 3 * 24 * 60 * 60 * 1000),
    weightKg: 28,
    companionProfile: {
      isEnabled: true,
      bio: 'Simba is a gentle giant who loves the beach and new friends.',
      personalityTraits: ['calm', 'friendly'],
      interests: ['beach walks', 'swimming'],
      lookingFor: ['playdates'],
      activityLevel: COMPANION_ACTIVITY_LEVELS.MEDIUM,
      temperament: 'Calm and social',
      neutered: true,
      getsAlongWith: {
        dogs: GETS_ALONG_WITH_STATUS.YES,
        cats: GETS_ALONG_WITH_STATUS.YES,
        kids: GETS_ALONG_WITH_STATUS.YES,
        families: GETS_ALONG_WITH_STATUS.YES,
      },
    },
  });
  console.log('created pet', simba._id.toString());
} else {
  console.log('pet already exists', existingPet._id.toString());
}

await mongoose.disconnect();

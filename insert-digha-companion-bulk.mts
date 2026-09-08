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

const passwordHash = await hashPassword('Passw0rd!');

const ENTRIES = [
  { owner: 'Ritesh Mallick', pet: 'Bolt', species: PET_SPECIES.DOG, breed: 'Golden Retriever', gender: PET_GENDERS.MALE, bio: 'Bolt is a high-energy pup who never says no to a game of fetch.', traits: ['energetic', 'playful'], interests: ['fetch', 'running'], activity: COMPANION_ACTIVITY_LEVELS.HIGH, temperament: 'Outgoing and bold' },
  { owner: 'Sneha Adak', pet: 'Misty', species: PET_SPECIES.CAT, breed: 'Indian Shorthair', gender: PET_GENDERS.FEMALE, bio: 'Misty loves sunbathing on the balcony and gentle head scratches.', traits: ['calm', 'affectionate'], interests: ['napping', 'sunbathing'], activity: COMPANION_ACTIVITY_LEVELS.LOW, temperament: 'Chill and cuddly' },
  { owner: 'Abir Jana', pet: 'Rex', species: PET_SPECIES.DOG, breed: 'Rottweiler', gender: PET_GENDERS.MALE, bio: 'Rex is a gentle giant who loves guarding the porch and long walks.', traits: ['loyal', 'protective'], interests: ['walks', 'guarding'], activity: COMPANION_ACTIVITY_LEVELS.MEDIUM, temperament: 'Loyal and watchful' },
  { owner: 'Piyali Sau', pet: 'Bella', species: PET_SPECIES.DOG, breed: 'Beagle', gender: PET_GENDERS.FEMALE, bio: 'Bella follows her nose everywhere and loves sniffing out treats.', traits: ['curious', 'friendly'], interests: ['sniffing', 'treats'], activity: COMPANION_ACTIVITY_LEVELS.MEDIUM, temperament: 'Curious and cheerful' },
  { owner: 'Suman Bera', pet: 'Tiger', species: PET_SPECIES.CAT, breed: 'Bengal', gender: PET_GENDERS.MALE, bio: 'Tiger is an athletic climber who loves chasing laser dots.', traits: ['agile', 'playful'], interests: ['climbing', 'chasing'], activity: COMPANION_ACTIVITY_LEVELS.HIGH, temperament: 'Bold and energetic' },
  { owner: 'Moumita Giri', pet: 'Snowy', species: PET_SPECIES.RABBIT, breed: 'Angora', gender: PET_GENDERS.FEMALE, bio: 'Snowy hops around the garden every evening and loves fresh greens.', traits: ['gentle', 'shy'], interests: ['hopping', 'greens'], activity: COMPANION_ACTIVITY_LEVELS.LOW, temperament: 'Gentle and quiet' },
  { owner: 'Debashish Maity', pet: 'Zeus', species: PET_SPECIES.DOG, breed: 'German Shepherd', gender: PET_GENDERS.MALE, bio: 'Zeus is a smart, trainable dog who loves agility drills on the beach.', traits: ['smart', 'active'], interests: ['agility', 'training'], activity: COMPANION_ACTIVITY_LEVELS.HIGH, temperament: 'Confident and alert' },
  { owner: 'Ruma Patra', pet: 'Choco', species: PET_SPECIES.DOG, breed: 'Indian Pariah', gender: PET_GENDERS.FEMALE, bio: 'Choco is a rescue pup who loves belly rubs and beach evenings.', traits: ['affectionate', 'friendly'], interests: ['belly rubs', 'beach walks'], activity: COMPANION_ACTIVITY_LEVELS.MEDIUM, temperament: 'Warm and trusting' },
  { owner: 'Arka Das', pet: 'Oscar', species: PET_SPECIES.CAT, breed: 'Persian', gender: PET_GENDERS.MALE, bio: 'Oscar prefers the quiet life — a soft cushion and a sunny window.', traits: ['calm', 'independent'], interests: ['napping', 'grooming'], activity: COMPANION_ACTIVITY_LEVELS.LOW, temperament: 'Reserved and dignified' },
  { owner: 'Tanushree Dutta', pet: 'Kizzy', species: PET_SPECIES.DOG, breed: 'Labrador Retriever', gender: PET_GENDERS.FEMALE, bio: 'Kizzy is a water-loving lab who never turns down a swim.', traits: ['playful', 'friendly'], interests: ['swimming', 'fetch'], activity: COMPANION_ACTIVITY_LEVELS.HIGH, temperament: 'Joyful and social' },
  { owner: 'Bikash Samanta', pet: 'Leo', species: PET_SPECIES.DOG, breed: 'Pug', gender: PET_GENDERS.MALE, bio: 'Leo is a laid-back pug who loves short strolls and long naps.', traits: ['lazy', 'sweet'], interests: ['napping', 'snacking'], activity: COMPANION_ACTIVITY_LEVELS.LOW, temperament: 'Easygoing and sweet' },
  { owner: 'Ipsita Khatua', pet: 'Nala', species: PET_SPECIES.CAT, breed: 'Siamese', gender: PET_GENDERS.FEMALE, bio: 'Nala is vocal, curious, and always the first to greet visitors.', traits: ['vocal', 'curious'], interests: ['exploring', 'chatting'], activity: COMPANION_ACTIVITY_LEVELS.MEDIUM, temperament: 'Chatty and social' },
  { owner: 'Gautam Dolui', pet: 'Bruno Jr', species: PET_SPECIES.DOG, breed: 'Doberman', gender: PET_GENDERS.MALE, bio: 'Bruno Jr is alert and athletic, always up for a run on the beach.', traits: ['alert', 'athletic'], interests: ['running', 'beach walks'], activity: COMPANION_ACTIVITY_LEVELS.HIGH, temperament: 'Sharp and energetic' },
  { owner: 'Rina Bag', pet: 'Pearl', species: PET_SPECIES.RABBIT, breed: 'Dutch', gender: PET_GENDERS.FEMALE, bio: 'Pearl loves lazy afternoons nibbling on carrots in the yard.', traits: ['gentle', 'calm'], interests: ['nibbling', 'lounging'], activity: COMPANION_ACTIVITY_LEVELS.LOW, temperament: 'Sweet and mellow' },
  { owner: 'Subrata Pramanik', pet: 'Rocket', species: PET_SPECIES.DOG, breed: 'Indian Pariah', gender: PET_GENDERS.MALE, bio: 'Rocket is a street-smart dog who loves exploring the fishing docks.', traits: ['adventurous', 'independent'], interests: ['exploring', 'digging'], activity: COMPANION_ACTIVITY_LEVELS.HIGH, temperament: 'Independent and spirited' },
];

let created = 0;
let skipped = 0;

for (let i = 0; i < ENTRIES.length; i++) {
  const entry = ENTRIES[i]!;
  const email = `${entry.owner.toLowerCase().replace(/[^a-z]+/g, '.')}@seed.patmypets.in`;

  let owner = await UserModel.findOne({ email });
  if (!owner) {
    owner = await UserModel.create({
      role: ROLES.USER,
      name: entry.owner,
      email,
      phone: `+9191110${String(100 + i).padStart(3, '0')}`,
      passwordHash,
      isVerified: true,
      addresses: [
        {
          label: 'Home',
          addressLine1: `${entry.pet}'s neighborhood, Digha`,
          city: 'Digha',
          state: 'West Bengal',
          postalCode: '721428',
          country: 'India',
          location: { type: 'Point', coordinates: jitter(DIGHA, 500 + i * 300) },
          isDefault: true,
        },
      ],
    });
  }

  const existingPet = await PetModel.findOne({ ownerId: owner._id, name: entry.pet });
  if (existingPet) {
    skipped++;
    continue;
  }

  await PetModel.create({
    ownerId: owner._id,
    name: entry.pet,
    species: entry.species,
    breed: entry.breed,
    gender: entry.gender,
    dateOfBirth: new Date(Date.now() - (365 + i * 40) * 24 * 60 * 60 * 1000),
    weightKg: 10 + i * 2,
    companionProfile: {
      isEnabled: true,
      bio: entry.bio,
      personalityTraits: entry.traits,
      interests: entry.interests,
      lookingFor: ['playdates'],
      activityLevel: entry.activity,
      temperament: entry.temperament,
      neutered: true,
      getsAlongWith: {
        dogs: GETS_ALONG_WITH_STATUS.YES,
        cats: GETS_ALONG_WITH_STATUS.YES,
        kids: GETS_ALONG_WITH_STATUS.YES,
        families: GETS_ALONG_WITH_STATUS.YES,
      },
    },
  });
  created++;
}

console.log(`created ${created} companion pets, skipped ${skipped} already existing`);
await mongoose.disconnect();

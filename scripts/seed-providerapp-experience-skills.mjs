// Fills workExperience / skills on providers where they are empty (never overwrites).
// Usage: MONGO_URI="<uri>" node scripts/seed-providerapp-experience-skills.mjs
import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

const SKILLS = {
  VET: ['Vaccinations', 'Surgery', 'Diagnostics', 'Preventive Care'],
  CLINIC: ['Consultation', 'Diagnostics', 'Minor Procedures', 'Pet First Aid'],
  GROOMER: ['Breed Cuts', 'De-shedding', 'Bath & Spa', 'Nail Trimming'],
  BOARDING: ['Pet Boarding', 'Daily Walks', 'Medication Handling', 'Pet First Aid'],
  PET_WALKER: ['Dog Walking', 'Leash Training', 'Pet First Aid'],
  PET_SITTER: ['Pet Sitting', 'Feeding & Medication', 'Overnight Stays', 'Pet First Aid'],
  TRAINER: ['Obedience Training', 'Behaviour Correction', 'Puppy Training'],
};
const DEFAULT_SKILLS = ['Pet Care', 'Pet First Aid'];
const d = (s) => new Date(`${s}T00:00:00.000Z`);

await mongoose.connect(uri);
const col = mongoose.connection.db.collection('providers');
let n = 0;
for (const p of await col.find({}).toArray()) {
  const set = {};
  if (!p.workExperience?.length) {
    set.workExperience = [
      { _id: new mongoose.Types.ObjectId(), title: 'Junior Pet Care Associate', company: 'PetCare Solutions', startDate: d('2019-01-01'), endDate: d('2021-05-31') },
      { _id: new mongoose.Types.ObjectId(), title: 'Senior Pet Care Specialist', company: 'Happy Paws Co.', startDate: d('2021-06-01'), endDate: null },
    ];
  }
  if (!p.skills?.length) set.skills = SKILLS[p.providerType] ?? DEFAULT_SKILLS;
  if (Object.keys(set).length) {
    await col.updateOne({ _id: p._id }, { $set: set });
    n++;
  }
}
console.log(`updated ${n} providers`);
await mongoose.disconnect();

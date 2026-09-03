import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;
if (!uri) throw new Error('set MONGO_URI env var');

await mongoose.connect(uri);

const bannerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'stat'], default: 'image' },
    title: { type: String, required: true, maxlength: 200 },
    subtitle: { type: String, default: '', maxlength: 300 },
    imageUrl: { type: String, default: '' },
    linkUrl: { type: String, default: null },
    number: { type: String, default: null },
    icon: { type: String, default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const BannerModel = mongoose.model('Banner', bannerSchema);

const stats = [
  { type: 'stat', title: 'Services', number: '10+', icon: 'https://api.iconify.design/mdi/paw.svg', order: 10 },
  { type: 'stat', title: 'Experts', number: '500+', icon: 'https://api.iconify.design/mdi/account-group.svg', order: 11 },
  { type: 'stat', title: 'Rating', number: '4.9', icon: 'https://api.iconify.design/mdi/star.svg', order: 12 },
];

for (const s of stats) {
  const existing = await BannerModel.findOne({ type: 'stat', title: s.title });
  if (existing) {
    console.log('skip existing', s.title);
    continue;
  }
  const created = await BannerModel.create(s);
  console.log('created', created.title, created._id.toString());
}

await mongoose.disconnect();

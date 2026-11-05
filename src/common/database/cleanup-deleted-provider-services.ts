/**
 * One-off cleanup: soft-delete the services of providers that were already deleted.
 *
 * The admin "delete vendor" action now cascades (it soft-deletes the vendor's services too), but
 * vendors deleted *before* that fix left their services active — so they can still show to users in
 * browse/search. Run this once to tidy up that existing data.
 *
 * Reads MONGO_URI from the environment (run where the backend's env is set).
 *
 * Local dev:   npm run cleanup-provider-services
 * Production:  node dist/common/database/cleanup-deleted-provider-services.js
 */
import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from './mongoose.js';
import { ProviderModel } from '../../modules/providers/provider.schema.js';
import { ServiceModel } from '../../modules/services/service.schema.js';

async function main(): Promise<void> {
  await connectDatabase();

  // includeDeleted: the default soft-delete filter would hide these deleted providers.
  const deletedProviders = await ProviderModel.find({ isDeleted: true }, null, {
    includeDeleted: true,
  })
    .select('_id')
    .exec();
  const ids = deletedProviders.map((p) => p._id);
  console.log(`Found ${ids.length} deleted provider(s).`);

  if (ids.length > 0) {
    const result = await ServiceModel.updateMany(
      { providerId: { $in: ids }, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
    ).exec();
    console.log(`Soft-deleted ${result.modifiedCount} orphaned service(s).`);
  }

  await disconnectDatabase();
}

main().catch((err: unknown) => {
  console.error('Failed to clean up deleted-provider services:', err);
  process.exit(1);
});

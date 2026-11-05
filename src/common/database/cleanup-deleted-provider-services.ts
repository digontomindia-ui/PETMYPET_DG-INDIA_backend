/**
 * One-off cleanup for vendors that were deleted *before* the delete-cascade fix.
 *
 * The admin "delete vendor" action now also soft-deletes the vendor's services and their underlying
 * user account, but vendors deleted earlier left both behind — so their services could still show to
 * users (browse/search) and their person kept appearing in the admin Users list. Run this once to
 * tidy up that existing data.
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
import { UserModel } from '../../modules/users/user.schema.js';

async function main(): Promise<void> {
  await connectDatabase();

  // includeDeleted: the default soft-delete filter would hide these deleted providers.
  const deletedProviders = await ProviderModel.find({ isDeleted: true }, null, {
    includeDeleted: true,
  })
    .select('_id userId')
    .exec();
  const providerIds = deletedProviders.map((p) => p._id);
  const userIds = deletedProviders.map((p) => p.userId);
  console.log(`Found ${providerIds.length} deleted provider(s).`);

  if (providerIds.length > 0) {
    const services = await ServiceModel.updateMany(
      { providerId: { $in: providerIds }, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
    ).exec();
    console.log(`Soft-deleted ${services.modifiedCount} orphaned service(s).`);

    const users = await UserModel.updateMany(
      { _id: { $in: userIds }, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
    ).exec();
    console.log(`Soft-deleted ${users.modifiedCount} orphaned user account(s).`);
  }

  await disconnectDatabase();
}

main().catch((err: unknown) => {
  console.error('Failed to clean up deleted-provider services:', err);
  process.exit(1);
});

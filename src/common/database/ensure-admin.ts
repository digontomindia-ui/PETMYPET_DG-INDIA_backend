/**
 * Create or reset a SUPER_ADMIN account directly in the database.
 *
 * Use this to fix "invalid credentials" on the admin dashboard: that error means the backend's
 * database has no matching admin (e.g. a freshly deployed DB that was never seeded) or the admin
 * password isn't what you think. Running the full seed against production would be wrong (it
 * writes a whole demo dataset and skips if a city already exists) — this touches only the one
 * admin account, so it's safe to run against a live database.
 *
 * It reads MONGO_URI from the environment, so run it where the backend's own env is set.
 *
 * Local dev (uses tsx):
 *   npm run create-admin -- admin@yourdomain.com 'YourStrongPass1'
 *
 * Production (compiled build, e.g. inside the deployed container — no tsx needed):
 *   node dist/common/database/ensure-admin.js admin@yourdomain.com 'YourStrongPass1'
 *
 * An optional third argument / ADMIN_PHONE sets the phone used only when creating a brand-new
 * account. With no arguments it defaults to the seed admin: admin@seed.patmypets.in / Admin@12345.
 * The password must satisfy the login policy (8+ chars, with an upper, lower, and number).
 */
import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from './mongoose.js';
import { hashPassword } from '../utils/password.js';
import { ROLES } from '../constants/roles.js';
import { UserModel } from '../../modules/users/user.schema.js';

const email = (process.argv[2] ?? process.env.ADMIN_EMAIL ?? 'admin@seed.patmypets.in')
  .trim()
  .toLowerCase();
const password = process.argv[3] ?? process.env.ADMIN_PASSWORD ?? 'Admin@12345';
const phone = (process.argv[4] ?? process.env.ADMIN_PHONE ?? '+919999999999').trim();

async function main(): Promise<void> {
  await connectDatabase();
  const passwordHash = await hashPassword(password);

  // findOne excludes soft-deleted accounts (the soft-delete plugin), so a previously-deleted
  // admin is replaced by a fresh active one rather than being resurrected half-deleted.
  const existing = await UserModel.findOne({ email }).exec();
  if (existing) {
    existing.role = ROLES.SUPER_ADMIN;
    existing.isVerified = true;
    existing.isBlocked = false;
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Reset existing account to SUPER_ADMIN: ${email}`);
  } else {
    const created = await UserModel.create({
      name: 'Patmypets Admin',
      email,
      phone,
      role: ROLES.SUPER_ADMIN,
      isVerified: true,
      passwordHash,
    });
    console.log(`Created SUPER_ADMIN: ${email} (id ${created._id.toString()})`);
  }

  console.log(`Log in to the admin dashboard with: ${email} / <the password you passed>`);
  await disconnectDatabase();
}

main().catch((err: unknown) => {
  console.error('Failed to ensure admin account:', err);
  process.exit(1);
});

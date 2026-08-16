// Creates (or resets) a SUPER_ADMIN user via Prisma Client — the same way
// seed.ts bootstraps the first admin. Safe to re-run: upserts everything.
//
// Usage (from backend/ folder, where node_modules + .env already live):
//   node create-super-admin.js

const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

const EMAIL = 'ajay@gmail.com';
const PASSWORD = 'As123456!';
const NAME = 'Ajay';

async function main() {
  // Super Admin is cross-organization (see platform.service.ts) — the User
  // row still needs *an* organizationId (required column), so it gets its
  // own lightweight "Platform Administration" org rather than being
  // attached to a customer's warehouse org.
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000099' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000099',
      name: 'Platform Administration',
    },
  });

  const role = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: null, name: 'SUPER_ADMIN' } },
    update: {},
    create: { name: 'SUPER_ADMIN', isSystem: true, organizationId: null },
  });

  const passwordHash = await argon2.hash(PASSWORD);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash, roleId: role.id, status: 'ACTIVE' },
    create: {
      organizationId: org.id,
      name: NAME,
      email: EMAIL,
      passwordHash,
      roleId: role.id,
    },
  });

  console.log(`Super admin ready: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

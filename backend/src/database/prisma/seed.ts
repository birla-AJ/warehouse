import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const SYSTEM_ROLES = [
  'SUPER_ADMIN',
  'WAREHOUSE_OWNER',
  'WAREHOUSE_MANAGER',
  'SUPERVISOR',
  'OPERATOR',
  'ACCOUNTANT',
  'SECURITY_GUARD',
  'FARMER',
  'AUDITOR',
  'VIEWER',
] as const;

const MODULES = [
  'warehouses',
  'farmers',
  'crops',
  'inventory',
  'quality',
  'weighbridge',
  'billing',
  'payments',
  'dispatch',
  'cctv',
  'reports',
  'employees',
  'settings',
  'notifications',
  'documents',
  'audit-log',
];

const ACTIONS = ['create', 'read', 'update', 'delete'];

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Default Organization',
    },
  });

  // Seed permissions: one row per module/action combination
  const permissionRecords = [];
  for (const module of MODULES) {
    for (const action of ACTIONS) {
      const perm = await prisma.permission.upsert({
        where: { module_action_scope: { module, action, scope: null as any } },
        update: {},
        create: { module, action },
      });
      permissionRecords.push(perm);
    }
  }

  // Seed system roles (organizationId: null — shared templates across every org)
  const roles: Record<string, { id: string }> = {};
  for (const name of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: null as any, name } },
      update: {},
      create: { name, isSystem: true, organizationId: null },
    });
    roles[name] = role;
  }

  // SUPER_ADMIN gets every permission (platform-level — though in practice
  // they only use the /platform routes, which are gated by role, not by
  // this permission table)
  for (const perm of permissionRecords) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles['SUPER_ADMIN'].id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { roleId: roles['SUPER_ADMIN'].id, permissionId: perm.id },
    });
  }

  // WAREHOUSE_OWNER (= "Admin" in the product's language) also gets every
  // permission — they are the sole full-control operator within their own
  // organization/warehouse: farmers, inventory, billing, dispatch, staff,
  // reports, settings, everything. This was missing before, which is why a
  // freshly onboarded admin saw an empty sidebar (only Dashboard, since
  // that's the only nav item with no requiredPermission) — every other nav
  // entry is permission-gated and this role had zero rows in
  // role_permissions.
  for (const perm of permissionRecords) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles['WAREHOUSE_OWNER'].id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { roleId: roles['WAREHOUSE_OWNER'].id, permissionId: perm.id },
    });
  }

  // Seed a bootstrap super admin user (change password immediately after first login)
  const passwordHash = await argon2.hash(process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!');
  await prisma.user.upsert({
    where: { email: 'admin@awms.local' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'System Administrator',
      email: 'admin@awms.local',
      passwordHash,
      roleId: roles['SUPER_ADMIN'].id,
    },
  });

  console.log('Seed complete. Change the bootstrap admin password immediately.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

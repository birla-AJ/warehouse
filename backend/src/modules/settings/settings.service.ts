import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Most of the original spec's "Settings" list already lives in its own
 * module with real validation — Warehouse (Phase 2), Bag Types & Crops
 * (Phase 3), Billing Rules (Phase 5), Roles & Permissions (Phase 1), Camera
 * settings (Phase 9). This generic key-value store is only for what's left:
 * free-form org config that doesn't warrant its own table. Value shape is a
 * convention per key, not enforced by a schema — document new keys here as
 * they're introduced.
 */
export const WELL_KNOWN_SETTING_KEYS = [
  'company_profile', // { legalName, gstNumber, address, logoUrl, contactEmail, contactPhone }
  'tax_defaults', // { gstPercent, cessPercent }
  'theme', // { mode: "light" | "dark", primaryColor }
  'language', // { code: "en" | "hi" | ... }
  'notification_preferences', // { channels: ["EMAIL","SMS"], digestFrequency }
] as const;

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  list(organizationId: string) {
    return this.prisma.setting.findMany({ where: { organizationId } });
  }

  async get(organizationId: string, key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { organizationId_key: { organizationId, key } },
    });
    if (!setting) throw new NotFoundException(`Setting "${key}" not set for this organization`);
    return setting;
  }

  upsert(organizationId: string, key: string, value: unknown) {
    return this.prisma.setting.upsert({
      where: { organizationId_key: { organizationId, key } },
      update: { value: value as any },
      create: { organizationId, key, value: value as any },
    });
  }
}

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FarmersRepository } from './farmers.repository';
import { CreateFarmerDto, UpdateFarmerDto, ListFarmersQueryDto } from './dto/farmer.dto';
import { EncryptionUtil } from '../../common/utils/encryption.util';

@Injectable()
export class FarmersService {
  constructor(private repo: FarmersRepository) {}

  async list(organizationId: string, query: ListFarmersQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const where = {
      organizationId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { mobile: { contains: query.search } },
              { village: { contains: query.search, mode: 'insensitive' as const } },
              { farmerCode: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.repo.findMany(where, (page - 1) * limit, limit),
      this.repo.count(where),
    ]);

    return {
      items: items.map((f) => this.sanitize(f)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const farmer = await this.repo.findById(id);
    if (!farmer) throw new NotFoundException('Farmer not found');
    return this.sanitize(farmer, { revealSensitive: true });
  }

  async create(organizationId: string, dto: CreateFarmerDto) {
    const existing = await this.repo.findByMobile(dto.mobile);
    if (existing) throw new ConflictException('A farmer with this mobile number already exists');

    const baseData = {
      organization: { connect: { id: organizationId } },
      name: dto.name,
      fatherName: dto.fatherName,
      village: dto.village,
      district: dto.district,
      state: dto.state,
      address: dto.address,
      mobile: dto.mobile,
      altMobile: dto.altMobile,
      email: dto.email,
      aadhaarNumberEnc: dto.aadhaarNumber ? EncryptionUtil.encrypt(dto.aadhaarNumber) : undefined,
      panNumber: dto.panNumber,
      gstNumber: dto.gstNumber,
      bankAccountNoEnc: dto.bankAccountNo ? EncryptionUtil.encrypt(dto.bankAccountNo) : undefined,
      bankIfsc: dto.bankIfsc,
      upiId: dto.upiId,
      nomineeName: dto.nomineeName,
      emergencyContactName: dto.emergencyContactName,
      emergencyContactPhone: dto.emergencyContactPhone,
      photoUrl: dto.photoUrl,
    };

    // Retry a couple of times in case two requests race and generate the same
    // sequence number for this org — the DB's (organizationId, farmerCode)
    // unique constraint is the real guard; this just recovers from a collision.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const farmerCode = await this.generateFarmerCode(organizationId);
      try {
        const farmer = await this.repo.create({ ...baseData, farmerCode });
        return this.sanitize(farmer, { revealSensitive: true });
      } catch (err) {
        const isCodeCollision =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          (err.meta?.target as string[] | undefined)?.includes('farmerCode');

        if (!isCodeCollision || attempt === maxAttempts) throw err;
      }
    }

    throw new ConflictException('Could not generate a unique farmer code, please retry');
  }

  async update(id: string, dto: UpdateFarmerDto) {
    await this.getById(id);

    const data: any = { ...dto };
    if (dto.aadhaarNumber) {
      data.aadhaarNumberEnc = EncryptionUtil.encrypt(dto.aadhaarNumber);
      delete data.aadhaarNumber;
    }
    if (dto.bankAccountNo) {
      data.bankAccountNoEnc = EncryptionUtil.encrypt(dto.bankAccountNo);
      delete data.bankAccountNo;
    }

    const updated = await this.repo.update(id, data);
    return this.sanitize(updated, { revealSensitive: true });
  }

  async remove(id: string) {
    await this.getById(id);
    await this.repo.softDelete(id);
    return { message: 'Farmer deactivated' };
  }

  /**
   * Generates FARM-000001-style sequential codes scoped per organization.
   * Uses the total count INCLUDING soft-deleted farmers so a sequence number
   * is never reused — reusing one would collide with the deleted farmer's
   * code under the (organizationId, farmerCode) unique constraint.
   */
  private async generateFarmerCode(organizationId: string): Promise<string> {
    const count = await this.repo.countByOrgIncludingDeleted(organizationId);
    const sequence = (count + 1).toString().padStart(6, '0');
    return `FARM-${sequence}`;
  }

  private sanitize(farmer: any, opts: { revealSensitive?: boolean } = {}) {
    const { aadhaarNumberEnc, bankAccountNoEnc, ...rest } = farmer;

    if (!opts.revealSensitive) {
      return rest;
    }

    return {
      ...rest,
      aadhaarNumberMasked: aadhaarNumberEnc
        ? EncryptionUtil.maskLast4(EncryptionUtil.decrypt(aadhaarNumberEnc))
        : null,
      bankAccountNoMasked: bankAccountNoEnc
        ? EncryptionUtil.maskLast4(EncryptionUtil.decrypt(bankAccountNoEnc))
        : null,
    };
  }
}
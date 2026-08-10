import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCropDto, UpdateCropDto, CreateBagTypeDto, AssignBagTypesDto } from './dto/crop.dto';

@Injectable()
export class CropsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.crop.findMany({
      where: { deletedAt: null },
      include: { allowedBagTypes: { include: { bagType: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const crop = await this.prisma.crop.findFirst({
      where: { id, deletedAt: null },
      include: { allowedBagTypes: { include: { bagType: true } } },
    });
    if (!crop) throw new NotFoundException('Crop not found');
    return crop;
  }

  async create(dto: CreateCropDto) {
    const existing = await this.prisma.crop.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Crop already exists');

    const { allowedBagTypeIds, ...cropData } = dto;

    return this.prisma.crop.create({
      data: {
        ...cropData,
        allowedBagTypes: allowedBagTypeIds
          ? { create: allowedBagTypeIds.map((bagTypeId) => ({ bagType: { connect: { id: bagTypeId } } })) }
          : undefined,
      },
      include: { allowedBagTypes: { include: { bagType: true } } },
    });
  }

  async update(id: string, dto: UpdateCropDto) {
    await this.getById(id);
    const { allowedBagTypeIds, ...cropData } = dto;
    return this.prisma.crop.update({
      where: { id },
      data: cropData,
      include: { allowedBagTypes: { include: { bagType: true } } },
    });
  }

  async assignBagTypes(cropId: string, dto: AssignBagTypesDto) {
    await this.getById(cropId);

    await this.prisma.$transaction([
      this.prisma.cropBagType.deleteMany({ where: { cropId } }),
      this.prisma.cropBagType.createMany({
        data: dto.bagTypeIds.map((bagTypeId) => ({ cropId, bagTypeId })),
        skipDuplicates: true,
      }),
    ]);

    return this.getById(cropId);
  }

  async remove(id: string) {
    await this.getById(id);
    await this.prisma.crop.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Crop archived' };
  }

  // ── Bag Types ────────────────────────────────────────────
  listBagTypes() {
    return this.prisma.bagType.findMany({ where: { deletedAt: null }, orderBy: { weightKg: 'asc' } });
  }

  async createBagType(dto: CreateBagTypeDto) {
    const existing = await this.prisma.bagType.findUnique({ where: { label: dto.label } });
    if (existing) throw new ConflictException('Bag type already exists');
    return this.prisma.bagType.create({ data: dto });
  }
}

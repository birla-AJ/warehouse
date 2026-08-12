import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateQualityReportDto } from './dto/quality.dto';

@Injectable()
export class QualityService {
  constructor(private prisma: PrismaService) {}

  async createForBag(bagId: string, organizationId: string, dto: CreateQualityReportDto, inspectorId?: string) {
    const bag = await this.prisma.bag.findFirst({ where: { id: bagId, deletedAt: null, farmer: { organizationId } } });
    if (!bag) throw new NotFoundException('Bag not found');

    const [report] = await this.prisma.$transaction([
      this.prisma.qualityReport.create({
        data: {
          bag: { connect: { id: bagId } },
          moisture: dto.moisture,
          damagePercent: dto.damagePercent,
          brokenPercent: dto.brokenPercent,
          rottenPercent: dto.rottenPercent,
          foreignMatter: dto.foreignMatter,
          grade: dto.grade,
          remarks: dto.remarks,
          photos: dto.photos ?? [],
          inspectorId,
        },
      }),
      this.prisma.bag.update({ where: { id: bagId }, data: { grade: dto.grade } }),
    ]);

    return report;
  }

  list(organizationId: string, bagId?: string, page = 1, limit = 20) {
    const where = { bag: { farmer: { organizationId } }, ...(bagId ? { bagId } : {}) };
    return Promise.all([
      this.prisma.qualityReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { bag: true },
      }),
      this.prisma.qualityReport.count({ where }),
    ]).then(([items, total]) => ({ items, meta: { page, limit, total } }));
  }
}

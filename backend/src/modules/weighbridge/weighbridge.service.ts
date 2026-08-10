import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWeighbridgeEntryDto } from './dto/weighbridge.dto';
import { PdfUtil } from '../../common/utils/pdf.util';

@Injectable()
export class WeighbridgeService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateWeighbridgeEntryDto) {
    if (dto.grossWeight < dto.tareWeight) {
      throw new BadRequestException('Gross weight cannot be less than tare weight');
    }
    const netWeight = dto.grossWeight - dto.tareWeight;
    const slipNumber = await this.generateSlipNumber();

    return this.prisma.weighbridgeEntry.create({
      data: {
        slipNumber,
        vehicleNo: dto.vehicleNo,
        direction: dto.direction,
        grossWeight: dto.grossWeight,
        tareWeight: dto.tareWeight,
        netWeight,
        farmerId: dto.farmerId,
        notes: dto.notes,
      },
    });
  }

  list(vehicleNo?: string, page = 1, limit = 20) {
    const where = vehicleNo ? { vehicleNo: { contains: vehicleNo } } : {};
    return Promise.all([
      this.prisma.weighbridgeEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.weighbridgeEntry.count({ where }),
    ]).then(([items, total]) => ({ items, meta: { page, limit, total } }));
  }

  async getSlip(id: string) {
    const entry = await this.prisma.weighbridgeEntry.findUnique({
      where: { id },
      include: { farmer: { select: { name: true, farmerCode: true, mobile: true } } },
    });
    if (!entry) throw new NotFoundException('Weighbridge entry not found');
    return entry;
  }

  /** Real PDF rendering (pdfkit) — replaces the earlier raw-JSON stub. */
  async getSlipPdf(id: string): Promise<Buffer> {
    const entry = await this.getSlip(id);
    return PdfUtil.renderWeighbridgeSlip({
      slipNumber: entry.slipNumber,
      vehicleNo: entry.vehicleNo,
      direction: entry.direction,
      grossWeight: Number(entry.grossWeight),
      tareWeight: Number(entry.tareWeight),
      netWeight: Number(entry.netWeight),
      notes: entry.notes,
      createdAt: entry.createdAt,
      farmer: entry.farmer,
    });
  }

  private async generateSlipNumber(): Promise<string> {
    const count = await this.prisma.weighbridgeEntry.count();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `WB-${datePart}-${(count + 1).toString().padStart(5, '0')}`;
  }
}

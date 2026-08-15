import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// OTP generation deps — unused now that dispatch has no OTP step (see create()).
// import * as argon2 from 'argon2';
// import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { BagsService } from '../bags/bags.service';
import { CreateDispatchDto } from './dto/dispatch.dto';
import { PdfUtil } from '../../common/utils/pdf.util';

@Injectable()
export class DispatchService {
  constructor(
    private prisma: PrismaService,
    private bagsService: BagsService,
  ) {}

  /**
   * Creates and immediately completes a dispatch for `bagCount` bags out of
   * a batch — no OTP, no QR gate-scan. The only checks are: the batch has
   * enough bags currently in storage, and driver name + mobile are given.
   */
  async create(organizationId: string, dto: CreateDispatchDto, performedById?: string) {
    // dispatchFromBatch validates the batch belongs to this org (bags are
    // looked up via farmer: { organizationId }) and that enough bags are
    // IN_STORAGE, then marks them DISPATCHED atomically.
    const dispatchedBags = await this.bagsService.dispatchFromBatch(organizationId, dto.batchId, dto.bagCount, performedById);

    const farmerId = dispatchedBags[0].farmerId;
    const totalRemaining = await this.prisma.bag.count({
      where: { batchId: dto.batchId, status: 'IN_STORAGE', deletedAt: null, farmer: { organizationId } },
    });
    const dispatchType = totalRemaining === 0 ? 'FULL' : 'PARTIAL';
    const dispatchNumber = await this.generateDispatchNumber();

    const dispatch = await this.prisma.dispatch.create({
      data: {
        dispatchNumber,
        farmer: { connect: { id: farmerId } },
        batchId: dto.batchId,
        vehicleNo: dto.vehicleNo,
        driverName: dto.driverName,
        driverMobile: dto.driverMobile,
        dispatchType,
        status: 'COMPLETED',
        gatePassUrl: `pending-render:${dispatchNumber}`, // wired to Documents module later
        bags: { create: dispatchedBags.map((bag) => ({ bag: { connect: { id: bag.id } } })) },
      },
      include: { bags: { include: { bag: true } }, farmer: true },
    });

    return dispatch;
  }

  // OTP verification removed along with the OTP/QR-scan gate-release step —
  // a dispatch now completes directly in create() above. Kept commented out
  // rather than deleted in case gate verification is reintroduced later.
  //
  // async verifyOtp(id: string, organizationId: string, dto: VerifyDispatchOtpDto, performedById?: string) {
  //   const dispatch = await this.prisma.dispatch.findFirst({
  //     where: { id, farmer: { organizationId } },
  //     include: { bags: true },
  //   });
  //   if (!dispatch) throw new NotFoundException('Dispatch not found');
  //   if (dispatch.status !== 'PENDING') {
  //     throw new BadRequestException(`Dispatch is already ${dispatch.status.toLowerCase()}`);
  //   }
  //   if (!dispatch.otpCodeHash || !dispatch.otpExpiresAt || dispatch.otpExpiresAt < new Date()) {
  //     throw new BadRequestException('OTP expired — cancel and re-initiate the dispatch');
  //   }
  //
  //   const valid = await argon2.verify(dispatch.otpCodeHash, dto.otp);
  //   if (!valid) throw new BadRequestException('Invalid OTP');
  //
  //   if (dto.scannedBagCodes && dto.scannedBagCodes.length > 0) {
  //     const dispatchBagIds = dispatch.bags.map((b) => b.bagId);
  //     const scannedBags = await this.prisma.bag.findMany({
  //       where: { qrCode: { in: dto.scannedBagCodes }, farmer: { organizationId } },
  //       select: { id: true, bagCode: true },
  //     });
  //     const scannedIds = new Set(scannedBags.map((b) => b.id));
  //
  //     const missing = dispatchBagIds.filter((id) => !scannedIds.has(id));
  //     if (missing.length > 0) {
  //       throw new BadRequestException(
  //         `${missing.length} bag(s) in this dispatch were not scanned at the gate — scan every bag's QR code before releasing.`,
  //       );
  //     }
  //   }
  //
  //   for (const { bagId } of dispatch.bags) {
  //     await this.bagsService.markDispatched(bagId, organizationId, performedById);
  //   }
  //
  //   const gatePassUrl = `pending-render:${dispatch.dispatchNumber}`;
  //
  //   return this.prisma.dispatch.update({
  //     where: { id },
  //     data: { status: 'COMPLETED', otpVerified: true, gatePassUrl },
  //     include: { bags: { include: { bag: true } }, farmer: true },
  //   });
  // }

  // Cancel had meaning only while a dispatch sat PENDING awaiting OTP — since
  // create() now completes a dispatch immediately, there's nothing pending
  // to cancel. Kept commented out in case a "PENDING dispatch" state returns.
  //
  // async cancel(id: string, organizationId: string) {
  //   const dispatch = await this.prisma.dispatch.findFirst({ where: { id, farmer: { organizationId } }, include: { bags: true } });
  //   if (!dispatch) throw new NotFoundException('Dispatch not found');
  //   if (dispatch.status !== 'PENDING') {
  //     throw new BadRequestException('Only a PENDING dispatch can be cancelled');
  //   }
  //
  //   for (const { bagId } of dispatch.bags) {
  //     await this.bagsService.unreserve(bagId, organizationId);
  //   }
  //
  //   return this.prisma.dispatch.update({ where: { id }, data: { status: 'CANCELLED' } });
  // }

  async getById(id: string, organizationId: string) {
    const dispatch = await this.prisma.dispatch.findFirst({
      where: { id, farmer: { organizationId } },
      include: { bags: { include: { bag: { include: { crop: true } } } }, farmer: true },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    return dispatch;
  }

  async getGatePass(id: string, organizationId: string) {
    const dispatch = await this.getById(id, organizationId);
    if (dispatch.status !== 'COMPLETED') {
      throw new BadRequestException('Gate pass is only available for a completed dispatch');
    }
    return dispatch;
  }

  async getGatePassPdf(id: string, organizationId: string): Promise<Buffer> {
    const dispatch = await this.getGatePass(id, organizationId);
    return PdfUtil.renderGatePass({
      dispatchNumber: dispatch.dispatchNumber,
      vehicleNo: dispatch.vehicleNo,
      driverName: dispatch.driverName,
      driverMobile: dispatch.driverMobile,
      dispatchType: dispatch.dispatchType,
      status: dispatch.status,
      createdAt: dispatch.createdAt,
      farmer: dispatch.farmer,
      bags: dispatch.bags.map((b: any) => ({
        bag: { bagCode: b.bag.bagCode, weightKg: Number(b.bag.weightKg), crop: b.bag.crop },
      })),
    });
  }

  list(organizationId: string, farmerId?: string, page = 1, limit = 20) {
    const where = { farmer: { organizationId }, ...(farmerId ? { farmerId } : {}) };
    return Promise.all([
      this.prisma.dispatch.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { farmer: true },
      }),
      this.prisma.dispatch.count({ where }),
    ]).then(([items, total]) => ({
      items,
      meta: { page, limit, total },
    }));
  }

  private async generateDispatchNumber(): Promise<string> {
    const count = await this.prisma.dispatch.count();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `DSP-${datePart}-${(count + 1).toString().padStart(5, '0')}`;
  }
}

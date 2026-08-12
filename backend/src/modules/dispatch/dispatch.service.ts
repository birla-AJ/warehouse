import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { BagsService } from '../bags/bags.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/dto/notification.dto';
import { CreateDispatchDto, VerifyDispatchOtpDto } from './dto/dispatch.dto';
import { PdfUtil } from '../../common/utils/pdf.util';

const OTP_TTL_MINUTES = 10;

@Injectable()
export class DispatchService {
  constructor(
    private prisma: PrismaService,
    private bagsService: BagsService,
    private notifications: NotificationsService,
  ) {}

  /** Initiates a dispatch: validates ownership/status, reserves bags, and OTPs the farmer. */
  async create(organizationId: string, dto: CreateDispatchDto, performedById?: string) {
    // Every bag AND the dispatching farmer must belong to the caller's
    // organization — without this, an org A user could dispatch org B's
    // bags out by supplying their IDs directly (bag IDs are opaque UUIDs
    // to a client, but not secret — they show up in list responses,
    // exported reports, etc., so "unguessable" isn't a safety boundary).
    const farmer = await this.prisma.farmer.findFirst({ where: { id: dto.farmerId, organizationId } });
    if (!farmer) throw new NotFoundException('Farmer not found');

    const bags = await this.prisma.bag.findMany({
      where: { id: { in: dto.bagIds }, deletedAt: null, farmer: { organizationId } },
    });

    if (bags.length !== dto.bagIds.length) {
      throw new NotFoundException('One or more bags were not found');
    }
    const notOwned = bags.filter((b) => b.farmerId !== dto.farmerId);
    if (notOwned.length > 0) {
      throw new BadRequestException('All bags must belong to the dispatching farmer');
    }
    const notInStorage = bags.filter((b) => b.status !== 'IN_STORAGE');
    if (notInStorage.length > 0) {
      throw new BadRequestException('All bags must currently be IN_STORAGE to dispatch');
    }

    for (const bag of bags) {
      await this.bagsService.reserve(bag.id, organizationId);
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpCodeHash = await argon2.hash(otp);
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    const dispatchNumber = await this.generateDispatchNumber();

    const dispatch = await this.prisma.dispatch.create({
      data: {
        dispatchNumber,
        farmer: { connect: { id: dto.farmerId } },
        vehicleNo: dto.vehicleNo,
        driverName: dto.driverName,
        driverMobile: dto.driverMobile,
        dispatchType: dto.dispatchType,
        otpCodeHash,
        otpExpiresAt,
        bags: { create: dto.bagIds.map((bagId) => ({ bag: { connect: { id: bagId } } })) },
      },
      include: { bags: { include: { bag: true } }, farmer: true },
    });

    await this.notifications.send({
      channel: NotificationChannel.SMS,
      recipient: dispatch.farmer.mobile,
      type: 'DISPATCH_OTP',
      body: `Your AWMS gate release OTP for dispatch ${dispatchNumber} is ${otp}. Valid for ${OTP_TTL_MINUTES} minutes.`,
      farmerId: dto.farmerId,
    });

    return { ...dispatch, otpCodeHash: undefined };
  }

  async verifyOtp(id: string, organizationId: string, dto: VerifyDispatchOtpDto, performedById?: string) {
    const dispatch = await this.prisma.dispatch.findFirst({
      where: { id, farmer: { organizationId } },
      include: { bags: true },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    if (dispatch.status !== 'PENDING') {
      throw new BadRequestException(`Dispatch is already ${dispatch.status.toLowerCase()}`);
    }
    if (!dispatch.otpCodeHash || !dispatch.otpExpiresAt || dispatch.otpExpiresAt < new Date()) {
      throw new BadRequestException('OTP expired — cancel and re-initiate the dispatch');
    }

    const valid = await argon2.verify(dispatch.otpCodeHash, dto.otp);
    if (!valid) throw new BadRequestException('Invalid OTP');

    if (dto.scannedBagCodes && dto.scannedBagCodes.length > 0) {
      const dispatchBagIds = dispatch.bags.map((b) => b.bagId);
      const scannedBags = await this.prisma.bag.findMany({
        where: { qrCode: { in: dto.scannedBagCodes }, farmer: { organizationId } },
        select: { id: true, bagCode: true },
      });
      const scannedIds = new Set(scannedBags.map((b) => b.id));

      const missing = dispatchBagIds.filter((id) => !scannedIds.has(id));
      if (missing.length > 0) {
        throw new BadRequestException(
          `${missing.length} bag(s) in this dispatch were not scanned at the gate — scan every bag's QR code before releasing.`,
        );
      }
    }

    for (const { bagId } of dispatch.bags) {
      await this.bagsService.markDispatched(bagId, organizationId, performedById);
    }

    const gatePassUrl = `pending-render:${dispatch.dispatchNumber}`; // wired to Documents module later

    return this.prisma.dispatch.update({
      where: { id },
      data: { status: 'COMPLETED', otpVerified: true, gatePassUrl },
      include: { bags: { include: { bag: true } }, farmer: true },
    });
  }

  async cancel(id: string, organizationId: string) {
    const dispatch = await this.prisma.dispatch.findFirst({ where: { id, farmer: { organizationId } }, include: { bags: true } });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    if (dispatch.status !== 'PENDING') {
      throw new BadRequestException('Only a PENDING dispatch can be cancelled');
    }

    for (const { bagId } of dispatch.bags) {
      await this.bagsService.unreserve(bagId, organizationId);
    }

    return this.prisma.dispatch.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async getById(id: string, organizationId: string) {
    const dispatch = await this.prisma.dispatch.findFirst({
      where: { id, farmer: { organizationId } },
      include: { bags: { include: { bag: { include: { crop: true } } } }, farmer: true },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    return { ...dispatch, otpCodeHash: undefined };
  }

  async getGatePass(id: string, organizationId: string) {
    const dispatch = await this.getById(id, organizationId);
    if (dispatch.status !== 'COMPLETED') {
      throw new BadRequestException('Gate pass is only available for a completed dispatch');
    }
    return dispatch;
  }

  /** Real PDF rendering (pdfkit) — replaces the earlier raw-JSON stub. */
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
      items: items.map((d) => ({ ...d, otpCodeHash: undefined })),
      meta: { page, limit, total },
    }));
  }

  private async generateDispatchNumber(): Promise<string> {
    const count = await this.prisma.dispatch.count();
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `DSP-${datePart}-${(count + 1).toString().padStart(5, '0')}`;
  }
}

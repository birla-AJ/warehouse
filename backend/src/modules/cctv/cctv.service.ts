import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EncryptionUtil } from '../../common/utils/encryption.util';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationChannel } from '../notifications/dto/notification.dto';
import { CreateCameraDto, UpdateCameraDto, UpdateCameraHealthDto, MotionAlertDto } from './dto/camera.dto';

@Injectable()
export class CctvService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreateCameraDto) {
    const camera = await this.prisma.camera.create({
      data: {
        warehouse: { connect: { id: dto.warehouseId } },
        name: dto.name,
        brand: dto.brand,
        cameraType: dto.cameraType,
        rtspUrl: dto.rtspUrl,
        onvifDetails: dto.onvifDetails as any,
        username: dto.username,
        passwordEnc: dto.password ? EncryptionUtil.encrypt(dto.password) : undefined,
        assignedTo: dto.assignedTo,
      },
    });
    return this.sanitize(camera);
  }

  async list(warehouseId?: string) {
    const cameras = await this.prisma.camera.findMany({
      where: { deletedAt: null, ...(warehouseId ? { warehouseId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return cameras.map((c) => this.sanitize(c));
  }

  async getById(id: string) {
    const camera = await this.prisma.camera.findFirst({ where: { id, deletedAt: null } });
    if (!camera) throw new NotFoundException('Camera not found');
    return this.sanitize(camera);
  }

  /** Returns everything a video player needs to open the feed — RTSP URL and decrypted credentials, server-side only. */
  async getStreamInfo(id: string) {
    const camera = await this.prisma.camera.findFirst({ where: { id, deletedAt: null } });
    if (!camera) throw new NotFoundException('Camera not found');

    return {
      id: camera.id,
      name: camera.name,
      rtspUrl: camera.rtspUrl,
      username: camera.username,
      password: camera.passwordEnc ? EncryptionUtil.decrypt(camera.passwordEnc) : undefined,
      status: camera.status,
    };
  }

  async update(id: string, dto: UpdateCameraDto) {
    await this.getById(id);
  
    const { password, onvifDetails, ...rest } = dto;
  
    const camera = await this.prisma.camera.update({
      where: { id },
      data: {
        ...rest,
        ...(onvifDetails !== undefined
          ? {
              onvifDetails: onvifDetails as Prisma.InputJsonValue,
            }
          : {}),
        passwordEnc: password
          ? EncryptionUtil.encrypt(password)
          : undefined,
      },
    });
  
    return this.sanitize(camera);
  }

  async remove(id: string) {
    await this.getById(id);
    await this.prisma.camera.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Camera removed' };
  }

  /** Called by a health-check worker (or the camera/NVR itself via webhook). Alerts on transition to OFFLINE. */
  async reportHealth(id: string, dto: UpdateCameraHealthDto) {
    const camera = await this.getById(id);
    const updated = await this.prisma.camera.update({
      where: { id },
      data: { status: dto.status, lastHealthCheckAt: new Date() },
    });

    if (dto.status === 'OFFLINE' && camera.status !== 'OFFLINE') {
      await this.notifications.send({
        channel: NotificationChannel.PUSH,
        recipient: `warehouse:${camera.warehouseId}`, // TODO: target actual assigned managers once staff-assignment exists
        type: 'CAMERA_OFFLINE',
        body: `Camera "${camera.name}" (${camera.assignedTo ?? 'unassigned location'}) went offline.`,
      });
    }

    return this.sanitize(updated);
  }

  /** Webhook target for motion-detection events pushed by the camera/NVR. */
  async motionAlert(id: string, dto: MotionAlertDto) {
    const camera = await this.getById(id);
    await this.notifications.send({
      channel: NotificationChannel.PUSH,
      recipient: `warehouse:${camera.warehouseId}`,
      type: 'CAMERA_MOTION',
      body: `Motion detected on "${camera.name}" (${camera.assignedTo ?? 'unassigned location'}).${dto.note ? ` ${dto.note}` : ''}`,
    });
    return { message: 'Motion alert recorded' };
  }

  /**
   * Snapshot capture requires an edge worker that actually pulls a frame
   * from the RTSP stream and uploads it — out of scope for this API server.
   * This records the *request* so the frontend has something to poll/react
   * to once that worker exists; it does not produce a real image today.
   */
  async requestSnapshot(id: string) {
    await this.getById(id);
    return { message: 'Snapshot requested — capture worker not yet implemented', cameraId: id, requestedAt: new Date() };
  }

  private sanitize(camera: any) {
    const { passwordEnc, ...rest } = camera;
    return rest;
  }
}

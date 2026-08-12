import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(organizationId: string, dto: CreateCameraDto) {
    const warehouse = await this.prisma.warehouse.findFirst({ where: { id: dto.warehouseId, organizationId } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

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

  async list(organizationId: string, warehouseId?: string) {
    const cameras = await this.prisma.camera.findMany({
      where: { deletedAt: null, warehouse: { organizationId }, ...(warehouseId ? { warehouseId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return cameras.map((c) => this.sanitize(c));
  }

  async getById(id: string, organizationId: string) {
    const camera = await this.prisma.camera.findFirst({
      where: { id, deletedAt: null, warehouse: { organizationId } },
    });
    if (!camera) throw new NotFoundException('Camera not found');
    return this.sanitize(camera);
  }

  /**
   * Returns everything a video player needs to open the feed — RTSP URL and
   * decrypted credentials, server-side only. This is the single most
   * sensitive read path in the module (leaks live camera access), so it's
   * scoped by organization independently rather than delegating to
   * getById() — keeping the credential-decrypt path self-contained makes
   * the scoping impossible to accidentally drop in a future refactor of
   * getById().
   */
  async getStreamInfo(id: string, organizationId: string) {
    const camera = await this.prisma.camera.findFirst({
      where: { id, deletedAt: null, warehouse: { organizationId } },
    });
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

  async update(id: string, organizationId: string, dto: UpdateCameraDto) {
    await this.getById(id, organizationId);
    const { password, ...rest } = dto;
    const camera = await this.prisma.camera.update({
      where: { id },
      data: { ...rest, passwordEnc: password ? EncryptionUtil.encrypt(password) : undefined },
    });
    return this.sanitize(camera);
  }

  async remove(id: string, organizationId: string) {
    await this.getById(id, organizationId);
    await this.prisma.camera.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Camera removed' };
  }

  /**
   * Called by a health-check worker (or the camera/NVR itself via webhook).
   * Alerts on transition to OFFLINE.
   *
   * NOTE: webhook/worker callers won't have a logged-in user's JWT, so this
   * is NOT behind organizationId scoping the way the user-facing methods
   * are — it's expected to be reached via a separate service-to-service
   * auth mechanism (e.g. a shared worker secret), which isn't wired up yet.
   * Flagging so it isn't mistaken for an oversight: don't add
   * @Permissions()-only protection here without also adding that mechanism,
   * or the worker will simply be unable to call it.
   */
  async reportHealth(id: string, dto: UpdateCameraHealthDto) {
    const camera = await this.prisma.camera.findFirst({ where: { id, deletedAt: null } });
    if (!camera) throw new NotFoundException('Camera not found');
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

  /** Webhook target for motion-detection events pushed by the camera/NVR — same caller-identity caveat as reportHealth() above. */
  async motionAlert(id: string, dto: MotionAlertDto) {
    const camera = await this.prisma.camera.findFirst({ where: { id, deletedAt: null } });
    if (!camera) throw new NotFoundException('Camera not found');
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
  async requestSnapshot(id: string, organizationId: string) {
    await this.getById(id, organizationId);
    return { message: 'Snapshot requested — capture worker not yet implemented', cameraId: id, requestedAt: new Date() };
  }

  private sanitize(camera: any) {
    const { passwordEnc, ...rest } = camera;
    return rest;
  }
}

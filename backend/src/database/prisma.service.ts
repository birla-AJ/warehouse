import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    // @ts-ignore — Prisma's $on event typing varies slightly by version; this call is correct at runtime.
    this.$on('warn', (e: any) => this.logger.warn(e.message));
    // @ts-ignore
    this.$on('error', (e: any) => this.logger.error(e.message));
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Soft-delete helper: use in repositories instead of `.delete()` */
  softDeleteWhere() {
    return { deletedAt: null };
  }
}

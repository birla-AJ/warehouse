import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

const START_TIME = Date.now();

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  /**
   * Liveness probe — process is up and responding. Never checks external
   * dependencies (DB down should not restart a perfectly healthy pod).
   */
  @Public()
  @Get()
  liveness() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - START_TIME) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe — process AND its dependencies (DB) are ready to serve
   * traffic. Used by load balancers / k8s readinessProbe / ECS health checks
   * to decide whether to route requests to this instance.
   */
  @Public()
  @Get('ready')
  async readiness(@Res() res: Response) {
    const checks: Record<string, { status: 'up' | 'down'; latencyMs?: number; error?: string }> = {};

    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { status: 'up', latencyMs: Date.now() - dbStart };
    } catch (err: any) {
      checks.database = { status: 'down', error: err?.message ?? 'unknown error' };
    }

    const allUp = Object.values(checks).every((c) => c.status === 'up');

    res.status(allUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: allUp ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  }
}

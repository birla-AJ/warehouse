import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers, body } = request;

    if (!MUTATING_METHODS.has(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        // Fire-and-forget: never block the response on audit logging
        this.prisma.auditLog
          .create({
            data: {
              userId: user?.id ?? null,
              organizationId: user?.organizationId ?? null,
              action: method,
              module: this.extractModule(url),
              entityId: responseBody?.id ?? body?.id ?? null,
              newValue: this.safeJson(body),
              ipAddress: ip,
              device: headers?.['user-agent'] ?? null,
              browser: headers?.['sec-ch-ua'] ?? null,
            },
          })
          .catch(() => {
            // Audit logging must never crash the request lifecycle
          });
      }),
    );
  }

  private extractModule(url: string): string {
    const parts = url.split('/').filter(Boolean);
    // /api/v1/<module>/...
    return parts[2] ?? 'unknown';
  }

  private safeJson(body: unknown) {
    try {
      const clone = JSON.parse(JSON.stringify(body ?? {}));
      delete clone.password;
      delete clone.passwordHash;
      delete clone.otpCode;
      return clone;
    } catch {
      return undefined;
    }
  }
}

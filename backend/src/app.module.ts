import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RbacGuard } from './common/guards/rbac.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesPermissionsModule } from './modules/roles-permissions/roles-permissions.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { FarmersModule } from './modules/farmers/farmers.module';
import { CropsModule } from './modules/crops/crops.module';
import { WeighbridgeModule } from './modules/weighbridge/weighbridge.module';
import { BagsModule } from './modules/bags/bags.module';
import { QualityModule } from './modules/quality/quality.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { BillingModule } from './modules/billing/billing.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CctvModule } from './modules/cctv/cctv.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { HealthModule } from './modules/health/health.module';
import { PlatformModule } from './modules/platform/platform.module';
import { PrismaService } from './database/prisma.service';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
        // Never log sensitive fields (passwords, tokens, OTPs, encrypted PII)
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.otp',
          'req.body.otpCode',
          'req.body.aadhaarNumber',
          'req.body.bankAccountNo',
          'res.headers["set-cookie"]',
        ],
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]), // 120 req/min per IP, tune per route as needed
    AuthModule,
    UsersModule,
    RolesPermissionsModule,
    WarehousesModule,
    FarmersModule,
    CropsModule,
    WeighbridgeModule,
    BagsModule,
    QualityModule,
    InventoryModule,
    BillingModule,
    PaymentsModule,
    DispatchModule,
    DashboardModule,
    ReportsModule,
    NotificationsModule,
    DocumentsModule,
    CctvModule,
    EmployeesModule,
    SettingsModule,
    AuditLogModule,
    HealthModule,
    PlatformModule,
  ],
  providers: [
    PrismaService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Auth-by-default: every route requires a valid JWT unless explicitly
    // marked @Public() (see src/common/decorators/public.decorator.ts).
    // RbacGuard then checks @Permissions() on top of that, and is a no-op
    // on routes that don't declare any (auth-only routes).
    //
    // This was previously registered inside AuthModule instead of here.
    // NestJS applies APP_GUARD globally regardless of which module
    // declares it, so it WAS enforced — but burying it in a feature module
    // means anyone auditing security posture from this file (the natural
    // place to look) would wrongly conclude nothing was enforced. Moved
    // here as the single, visible source of truth. Order matters:
    // JwtAuthGuard must run before RbacGuard so `request.user` exists by
    // the time RbacGuard reads it.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { MetricsController } from "./metrics.controller";
import { MetricsInterceptor } from "./metrics.interceptor";
import { MetricsService } from "./metrics.service";

/**
 * Rota /metrics fica fora do prefixo global /api/v1 (configurado via
 * `setGlobalPrefix(..., { exclude: ["metrics"] })` em main.ts) — mesmo
 * padrão de infra do HealthModule.
 */
@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}

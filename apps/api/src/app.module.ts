import { Module, ValidationPipe } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { JwtAuthGuard } from "./common/auth/jwt-auth.guard";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { HealthModule } from "./health/health.module";
import { IdentityModule } from "./identity/identity.module";
import { CatalogModule } from "./catalog/catalog.module";
import { TrainingModule } from "./training/training.module";
import { MeasurementsModule } from "./measurements/measurements.module";
import { ExploreModule } from "./explore/explore.module";
import { CoachingModule } from "./coaching/coaching.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { MetricsModule } from "./metrics/metrics.module";

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env["NODE_ENV"] === "production" ? "info" : "debug",
        autoLogging: false,
      },
    }),
    HealthModule,
    MetricsModule,
    IdentityModule,
    CatalogModule,
    TrainingModule,
    MeasurementsModule,
    ExploreModule,
    CoachingModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}

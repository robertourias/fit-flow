import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { NewMessageNotificationProcessor } from "./infra/queue/new-message-notification.processor";
import { PrismaNotificationRepository } from "./infra/repositories/prisma-notification.repository";
import { NotificationsController } from "./presentation/notifications.controller";
import { CreateNotificationUseCase } from "./application/use-cases/create-notification.use-case";
import { ListMyNotificationsUseCase } from "./application/use-cases/list-my-notifications.use-case";
import { MarkNotificationReadUseCase } from "./application/use-cases/mark-notification-read.use-case";
import { MarkAllNotificationsReadUseCase } from "./application/use-cases/mark-all-notifications-read.use-case";
import { CREATE_NOTIFICATION_USE_CASE, NOTIFICATION_REPOSITORY } from "./notifications.tokens";

export { NOTIFICATION_REPOSITORY, CREATE_NOTIFICATION_USE_CASE } from "./notifications.tokens";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>("REDIS_URL"),
        },
      }),
    }),
    BullModule.registerQueue({
      name: "notifications",
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NewMessageNotificationProcessor,
    { provide: NOTIFICATION_REPOSITORY, useClass: PrismaNotificationRepository },
    { provide: CREATE_NOTIFICATION_USE_CASE, useClass: CreateNotificationUseCase },
    ListMyNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
  ],
  exports: [
    BullModule,
    NOTIFICATION_REPOSITORY,
    ListMyNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
  ],
})
export class NotificationsModule {}

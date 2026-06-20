import { Inject, Injectable } from "@nestjs/common";
import { NOTIFICATION_REPOSITORY } from "../../notifications.tokens";
import type { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import type { ICreateNotificationUseCase } from "./create-notification.use-case.interface";
import { NotificationPayload } from "../../domain/notification.entity";
import { NotificationType } from "../../domain/notification-type.enum";

/**
 * Implementação real consumida pelo processor da fila `notifications` (T2).
 * Cria a Notification para o destinatário a partir do job `new-message`.
 */
@Injectable()
export class CreateNotificationUseCase implements ICreateNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly _notificationRepository: INotificationRepository,
  ) {}

  async execute(input: {
    recipientId: string;
    type: NotificationType;
    payload: NotificationPayload;
  }): Promise<void> {
    await this._notificationRepository.create({
      userId: input.recipientId,
      type: input.type,
      payload: input.payload,
    });
  }
}

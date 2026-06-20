import { Inject, Injectable } from "@nestjs/common";
import { NOTIFICATION_REPOSITORY } from "../../notifications.tokens";
import type { INotificationRepository } from "../../domain/repositories/notification.repository.interface";

/**
 * FR-008: marca todas as notificações não lidas do usuário autenticado
 * como lidas. Retorna a quantidade de notificações atualizadas.
 */
@Injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly _notificationRepository: INotificationRepository,
  ) {}

  async execute(userId: string): Promise<number> {
    return this._notificationRepository.markAllRead(userId);
  }
}

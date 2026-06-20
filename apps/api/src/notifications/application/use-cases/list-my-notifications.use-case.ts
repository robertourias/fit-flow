import { Inject, Injectable } from "@nestjs/common";
import { NOTIFICATION_REPOSITORY } from "../../notifications.tokens";
import type { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import type { Notification } from "../../domain/notification.entity";

/**
 * FR-006: lista as notificações do usuário autenticado, desc por createdAt,
 * com filtro opcional `unreadOnly`. Ordenação desc já é garantida pelo
 * repositório (findByUser).
 */
@Injectable()
export class ListMyNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly _notificationRepository: INotificationRepository,
  ) {}

  async execute(userId: string, opts?: { unreadOnly?: boolean }): Promise<Notification[]> {
    return this._notificationRepository.findByUser(userId, opts);
  }
}

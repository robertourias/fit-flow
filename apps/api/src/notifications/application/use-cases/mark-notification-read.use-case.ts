import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { NOTIFICATION_REPOSITORY } from "../../notifications.tokens";
import type { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import type { Notification } from "../../domain/notification.entity";

/**
 * FR-007: marca uma notificação como lida. `markRead` do repositório já
 * retorna `null` quando a notificação não existe ou não pertence ao
 * usuário autenticado — nesse caso lançamos 404 (não 403), mesma regra de
 * acesso usada nos demais recursos do produto (não revelar existência de
 * recurso de outro usuário).
 */
@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly _notificationRepository: INotificationRepository,
  ) {}

  async execute(userId: string, notificationId: string): Promise<Notification> {
    const updated = await this._notificationRepository.markRead(notificationId, userId);
    if (!updated) {
      throw new NotFoundException("Notification not found");
    }
    return updated;
  }
}

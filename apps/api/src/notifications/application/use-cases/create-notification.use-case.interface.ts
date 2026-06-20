import { NotificationPayload } from "../../domain/notification.entity";
import { NotificationType } from "../../domain/notification-type.enum";

/**
 * Porta consumida pelo processor da fila `notifications` (T2).
 * Implementação real (CreateNotificationUseCase) entra na T4 — até lá,
 * o módulo provê NOOP_CREATE_NOTIFICATION_USE_CASE via CREATE_NOTIFICATION_USE_CASE.
 */
export interface ICreateNotificationUseCase {
  execute(input: {
    recipientId: string;
    type: NotificationType;
    payload: NotificationPayload;
  }): Promise<void>;
}

import { Notification, NotificationPayload } from "../notification.entity";
import { NotificationType } from "../notification-type.enum";

export interface INotificationRepository {
  create(data: {
    userId: string;
    type: NotificationType;
    payload: NotificationPayload;
  }): Promise<Notification>;
  findByUser(userId: string, opts?: { unreadOnly?: boolean }): Promise<Notification[]>;
  markRead(id: string, userId: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<number>;
}

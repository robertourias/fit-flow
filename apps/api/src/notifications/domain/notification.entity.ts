import { NotificationType } from "./notification-type.enum";

export interface INewMessageNotificationPayload {
  relationshipId: string;
  messageId: string;
  senderId: string;
}

export type NotificationPayload = INewMessageNotificationPayload;

export interface INotificationProps {
  id: string;
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
  read: boolean;
  createdAt: Date;
}

export class Notification {
  constructor(private readonly props: INotificationProps) {}

  get id() { return this.props.id; }
  get userId() { return this.props.userId; }
  get type() { return this.props.type; }
  get payload() { return this.props.payload; }
  get read() { return this.props.read; }
  get createdAt() { return this.props.createdAt; }

  belongsTo(userId: string): boolean {
    return this.props.userId === userId;
  }
}

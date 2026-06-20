import { ApiProperty } from "@nestjs/swagger";
import { NotificationType } from "../../domain/notification-type.enum";
import type { Notification, NotificationPayload } from "../../domain/notification.entity";

export class NotificationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ type: Object })
  payload!: NotificationPayload;

  @ApiProperty()
  read!: boolean;

  @ApiProperty()
  createdAt!: string;

  static fromEntity(notification: Notification): NotificationDto {
    const dto = new NotificationDto();
    dto.id = notification.id;
    dto.type = notification.type;
    dto.payload = notification.payload;
    dto.read = notification.read;
    dto.createdAt = notification.createdAt.toISOString();
    return dto;
  }
}

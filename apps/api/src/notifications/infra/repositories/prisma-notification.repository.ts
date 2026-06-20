import { Injectable } from "@nestjs/common";
import { prisma, Prisma } from "@fitflow/db";
import { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import { Notification, NotificationPayload } from "../../domain/notification.entity";
import { NotificationType } from "../../domain/notification-type.enum";

type NotificationRow = Prisma.NotificationGetPayload<Record<string, never>>;

@Injectable()
export class PrismaNotificationRepository implements INotificationRepository {
  async create(data: {
    userId: string;
    type: NotificationType;
    payload: NotificationPayload;
  }): Promise<Notification> {
    const row = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        payload: data.payload as unknown as Prisma.InputJsonValue,
      },
    });
    return this.toDomain(row);
  }

  async findByUser(userId: string, opts?: { unreadOnly?: boolean }): Promise<Notification[]> {
    const rows = await prisma.notification.findMany({
      where: { userId, ...(opts?.unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async markRead(id: string, userId: string): Promise<Notification | null> {
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return null;
    }
    const row = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
    return this.toDomain(row);
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return result.count;
  }

  private toDomain(row: NotificationRow): Notification {
    return new Notification({
      id: row.id,
      userId: row.userId,
      type: row.type as NotificationType,
      payload: row.payload as unknown as NotificationPayload,
      read: row.read,
      createdAt: row.createdAt,
    });
  }
}

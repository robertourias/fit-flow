import { ListMyNotificationsUseCase } from "../list-my-notifications.use-case";
import { Notification } from "../../../domain/notification.entity";
import { NotificationType } from "../../../domain/notification-type.enum";
import type { INotificationRepository } from "../../../domain/repositories/notification.repository.interface";

describe("ListMyNotificationsUseCase", () => {
  function buildRepository(): jest.Mocked<INotificationRepository> {
    return {
      create: jest.fn(),
      findByUser: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    };
  }

  function makeNotification(overrides: Partial<{ id: string; read: boolean }> = {}): Notification {
    return new Notification({
      id: overrides.id ?? "notif-1",
      userId: "user-1",
      type: NotificationType.NEW_MESSAGE,
      payload: { relationshipId: "rel-1", messageId: "msg-1", senderId: "user-2" },
      read: overrides.read ?? false,
      createdAt: new Date("2026-06-18T10:00:00Z"),
    });
  }

  it("FR-006: retorna notificações do usuário autenticado via repositório, sem filtro por padrão", async () => {
    const repository = buildRepository();
    const notifications = [makeNotification({ id: "notif-1" }), makeNotification({ id: "notif-2" })];
    repository.findByUser.mockResolvedValue(notifications);

    const useCase = new ListMyNotificationsUseCase(repository);
    const result = await useCase.execute("user-1");

    expect(repository.findByUser).toHaveBeenCalledWith("user-1", undefined);
    expect(result).toBe(notifications);
  });

  it("FR-006: propaga o filtro unreadOnly para o repositório", async () => {
    const repository = buildRepository();
    const unread = [makeNotification({ id: "notif-2", read: false })];
    repository.findByUser.mockResolvedValue(unread);

    const useCase = new ListMyNotificationsUseCase(repository);
    const result = await useCase.execute("user-1", { unreadOnly: true });

    expect(repository.findByUser).toHaveBeenCalledWith("user-1", { unreadOnly: true });
    expect(result).toBe(unread);
  });
});

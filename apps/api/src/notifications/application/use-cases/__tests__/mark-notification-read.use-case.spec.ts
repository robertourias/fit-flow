import { NotFoundException } from "@nestjs/common";
import { MarkNotificationReadUseCase } from "../mark-notification-read.use-case";
import { Notification } from "../../../domain/notification.entity";
import { NotificationType } from "../../../domain/notification-type.enum";
import type { INotificationRepository } from "../../../domain/repositories/notification.repository.interface";

describe("MarkNotificationReadUseCase", () => {
  function buildRepository(): jest.Mocked<INotificationRepository> {
    return {
      create: jest.fn(),
      findByUser: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    };
  }

  it("FR-007: marca a notificação como lida quando pertence ao usuário", async () => {
    const repository = buildRepository();
    const updated = new Notification({
      id: "notif-1",
      userId: "user-1",
      type: NotificationType.NEW_MESSAGE,
      payload: { relationshipId: "rel-1", messageId: "msg-1", senderId: "user-2" },
      read: true,
      createdAt: new Date("2026-06-18T10:00:00Z"),
    });
    repository.markRead.mockResolvedValue(updated);

    const useCase = new MarkNotificationReadUseCase(repository);
    const result = await useCase.execute("user-1", "notif-1");

    expect(repository.markRead).toHaveBeenCalledWith("notif-1", "user-1");
    expect(result).toBe(updated);
  });

  it("FR-007: lança NotFoundException (404) quando a notificação não existe", async () => {
    const repository = buildRepository();
    repository.markRead.mockResolvedValue(null);

    const useCase = new MarkNotificationReadUseCase(repository);

    await expect(useCase.execute("user-1", "notif-inexistente")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("FR-007: lança NotFoundException (404) quando a notificação pertence a outro usuário", async () => {
    const repository = buildRepository();
    // Repositório já encapsula a regra de posse — markRead retorna null
    // quando o id existe mas não pertence ao userId informado.
    repository.markRead.mockResolvedValue(null);

    const useCase = new MarkNotificationReadUseCase(repository);

    await expect(useCase.execute("user-2", "notif-de-outro-usuario")).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.markRead).toHaveBeenCalledWith("notif-de-outro-usuario", "user-2");
  });
});

import { CreateNotificationUseCase } from "../create-notification.use-case";
import { Notification } from "../../../domain/notification.entity";
import { NotificationType } from "../../../domain/notification-type.enum";
import type { INotificationRepository } from "../../../domain/repositories/notification.repository.interface";

describe("CreateNotificationUseCase", () => {
  function buildRepository(): jest.Mocked<INotificationRepository> {
    return {
      create: jest.fn(),
      findByUser: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    };
  }

  it("cria uma Notification NEW_MESSAGE para o destinatário via repositório", async () => {
    const repository = buildRepository();
    const payload = { relationshipId: "rel-1", messageId: "msg-1", senderId: "user-1" };
    repository.create.mockResolvedValue(
      new Notification({
        id: "notif-1",
        userId: "user-2",
        type: NotificationType.NEW_MESSAGE,
        payload,
        read: false,
        createdAt: new Date("2026-06-18T10:00:00Z"),
      }),
    );

    const useCase = new CreateNotificationUseCase(repository);

    await useCase.execute({
      recipientId: "user-2",
      type: NotificationType.NEW_MESSAGE,
      payload,
    });

    expect(repository.create).toHaveBeenCalledWith({
      userId: "user-2",
      type: NotificationType.NEW_MESSAGE,
      payload,
    });
  });
});

import { MarkAllNotificationsReadUseCase } from "../mark-all-notifications-read.use-case";
import type { INotificationRepository } from "../../../domain/repositories/notification.repository.interface";

describe("MarkAllNotificationsReadUseCase", () => {
  function buildRepository(): jest.Mocked<INotificationRepository> {
    return {
      create: jest.fn(),
      findByUser: jest.fn(),
      markRead: jest.fn(),
      markAllRead: jest.fn(),
    };
  }

  it("FR-008: marca todas as não lidas do usuário como lidas e retorna a quantidade atualizada", async () => {
    const repository = buildRepository();
    repository.markAllRead.mockResolvedValue(3);

    const useCase = new MarkAllNotificationsReadUseCase(repository);
    const result = await useCase.execute("user-1");

    expect(repository.markAllRead).toHaveBeenCalledWith("user-1");
    expect(result).toBe(3);
  });

  it("FR-008: retorna 0 quando não há notificações não lidas", async () => {
    const repository = buildRepository();
    repository.markAllRead.mockResolvedValue(0);

    const useCase = new MarkAllNotificationsReadUseCase(repository);
    const result = await useCase.execute("user-1");

    expect(result).toBe(0);
  });
});

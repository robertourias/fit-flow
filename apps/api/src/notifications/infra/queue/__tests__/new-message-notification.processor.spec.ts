import { Test } from "@nestjs/testing";
import { NewMessageNotificationProcessor } from "../new-message-notification.processor";
import { CREATE_NOTIFICATION_USE_CASE } from "../../../notifications.tokens";
import { ICreateNotificationUseCase } from "../../../application/use-cases/create-notification.use-case.interface";
import { NotificationType } from "../../../domain/notification-type.enum";

describe("NewMessageNotificationProcessor", () => {
  function makeJob(name: string, data: Record<string, unknown>) {
    return { name, data } as never;
  }

  async function buildProcessor(createNotification: ICreateNotificationUseCase) {
    const moduleRef = await Test.createTestingModule({
      providers: [
        NewMessageNotificationProcessor,
        { provide: CREATE_NOTIFICATION_USE_CASE, useValue: createNotification },
      ],
    }).compile();

    return moduleRef.get(NewMessageNotificationProcessor);
  }

  it("delega para o use-case de criação de notificação no job new-message", async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const processor = await buildProcessor({ execute });

    const job = makeJob("new-message", {
      recipientId: "user-2",
      relationshipId: "rel-1",
      messageId: "msg-1",
      senderId: "user-1",
    });

    await processor.process(job);

    expect(execute).toHaveBeenCalledWith({
      recipientId: "user-2",
      type: NotificationType.NEW_MESSAGE,
      payload: { relationshipId: "rel-1", messageId: "msg-1", senderId: "user-1" },
    });
  });

  it("ignora jobs com nome desconhecido sem chamar o use-case", async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const processor = await buildProcessor({ execute });

    const job = makeJob("unknown-job", { recipientId: "user-2" });

    await processor.process(job);

    expect(execute).not.toHaveBeenCalled();
  });

  it("propaga erro do use-case (permitindo retry/backoff do BullMQ)", async () => {
    const execute = jest.fn().mockRejectedValue(new Error("boom"));
    const processor = await buildProcessor({ execute });

    const job = makeJob("new-message", {
      recipientId: "user-2",
      relationshipId: "rel-1",
      messageId: "msg-1",
      senderId: "user-1",
    });

    await expect(processor.process(job)).rejects.toThrow("boom");
  });
});

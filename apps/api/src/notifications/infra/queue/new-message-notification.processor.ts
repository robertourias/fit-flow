import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { CREATE_NOTIFICATION_USE_CASE } from "../../notifications.tokens";
import type { ICreateNotificationUseCase } from "../../application/use-cases/create-notification.use-case.interface";
import { NotificationType } from "../../domain/notification-type.enum";

export interface INewMessageJobData {
  recipientId: string;
  relationshipId: string;
  messageId: string;
  senderId: string;
}

@Processor("notifications")
export class NewMessageNotificationProcessor extends WorkerHost {
  private readonly _logger = new Logger(NewMessageNotificationProcessor.name);

  constructor(
    @Inject(CREATE_NOTIFICATION_USE_CASE)
    private readonly _createNotification: ICreateNotificationUseCase,
  ) {
    super();
  }

  async process(job: Job<INewMessageJobData, void, string>): Promise<void> {
    if (job.name !== "new-message") {
      this._logger.warn(`Job desconhecido recebido na fila notifications: ${job.name}`);
      return;
    }

    const { recipientId, relationshipId, messageId, senderId } = job.data;

    await this._createNotification.execute({
      recipientId,
      type: NotificationType.NEW_MESSAGE,
      payload: { relationshipId, messageId, senderId },
    });
  }

  // BullMQ's Worker is an EventEmitter — sem um listener para "error" (ex.: a
  // conexão ioredis fechando durante o shutdown do Worker), o Node trata o
  // evento como uncaughtException (ERR_UNHANDLED_ERROR). Logar aqui evita
  // derrubar o processo/testes por ruído de desconexão esperado no shutdown.
  @OnWorkerEvent("error")
  onError(error: Error): void {
    this._logger.error("Worker error on notifications queue", { error });
  }
}

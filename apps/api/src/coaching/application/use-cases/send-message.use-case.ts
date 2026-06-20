import { Inject, Injectable, Logger, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import { TRAINER_STUDENT_RELATIONSHIP_REPOSITORY } from "../../../identity/identity.tokens";
import type { ITrainerStudentRelationshipRepository } from "../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import { MESSAGE_REPOSITORY } from "../../coaching.tokens";
import type { IMessageRepository } from "../../domain/repositories/message.repository.interface";
import { Message } from "../../domain/message.entity";
import { containsProhibitedLanguage } from "../../domain/message-content-policy";
import type { INewMessageJobData } from "../../../notifications/infra/queue/new-message-notification.processor";

@Injectable()
export class SendMessageUseCase {
  private readonly _logger = new Logger(SendMessageUseCase.name);

  constructor(
    @Inject(TRAINER_STUDENT_RELATIONSHIP_REPOSITORY)
    private readonly _relationshipRepository: ITrainerStudentRelationshipRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly _messageRepository: IMessageRepository,
    @InjectQueue("notifications")
    private readonly _notificationsQueue: Queue<INewMessageJobData>,
  ) {
    // Queue é um EventEmitter — sem listener para "error" (ex.: conexão Redis
    // fechando durante shutdown), o Node trata o evento como uncaughtException
    // (ERR_UNHANDLED_ERROR), o que derruba o processo/testes por ruído de
    // desconexão esperado, não por um problema real do enqueue. Guard com
    // typeof porque os mocks de Queue em testes unitários só implementam
    // `add` (a única chamada exercitada pelo use-case).
    if (typeof this._notificationsQueue.on === "function") {
      this._notificationsQueue.on("error", (error) => {
        this._logger.error("Queue error on notifications queue", { error });
      });
    }
  }

  async execute(currentUserId: string, relationshipId: string, content: string): Promise<Message> {
    // FR-001: só pode enviar entre os dois lados de um vínculo ACTIVE (mesma regra de
    // acesso do FR-008/TASK17: sem vínculo ACTIVE ou sem participação → 404, não 403).
    const relationship = await this._relationshipRepository.findById(relationshipId);
    if (
      !relationship ||
      !relationship.isActive() ||
      (relationship.trainerId !== currentUserId && relationship.studentId !== currentUserId)
    ) {
      throw new NotFoundException("Relationship not found");
    }

    // FR-002: moderação antes de persistir — bloqueado retorna 422 e não persiste/enfileira.
    if (containsProhibitedLanguage(content)) {
      throw new UnprocessableEntityException("Message content is not allowed");
    }

    const message = await this._messageRepository.create({
      relationshipId,
      senderId: currentUserId,
      content,
    });

    const recipientId =
      relationship.trainerId === currentUserId ? relationship.studentId : relationship.trainerId;

    // FR-003: falha no enqueue é best-effort — não deve quebrar a resposta de sucesso
    // do envio (a mensagem já persistida é a fonte da verdade).
    try {
      await this._notificationsQueue.add("new-message", {
        recipientId,
        relationshipId,
        messageId: message.id,
        senderId: currentUserId,
      });
    } catch (error) {
      this._logger.error("Failed to enqueue new-message notification job", {
        relationshipId,
        messageId: message.id,
        error,
      });
    }

    return message;
  }
}

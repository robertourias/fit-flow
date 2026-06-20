import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { TrainingModule } from "../training/training.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { CoachingController } from "./presentation/coaching.controller";
import { InviteRelationshipUseCase } from "./application/use-cases/invite-relationship.use-case";
import { RespondRelationshipUseCase } from "./application/use-cases/respond-relationship.use-case";
import { RevokeRelationshipUseCase } from "./application/use-cases/revoke-relationship.use-case";
import { ListMyStudentsUseCase } from "./application/use-cases/list-my-students.use-case";
import { ListMyTrainersUseCase } from "./application/use-cases/list-my-trainers.use-case";
import { CreateStudentStrategyUseCase } from "./application/use-cases/create-student-strategy.use-case";
import { CreateStudentWorkoutUseCase } from "./application/use-cases/create-student-workout.use-case";
import { GetStudentDashboardUseCase } from "./application/use-cases/get-student-dashboard.use-case";
import { SendMessageUseCase } from "./application/use-cases/send-message.use-case";
import { ListMessagesUseCase } from "./application/use-cases/list-messages.use-case";
import { MarkMessagesReadUseCase } from "./application/use-cases/mark-messages-read.use-case";
import { PrismaMessageRepository } from "./infra/repositories/prisma-message.repository";
import { MESSAGE_REPOSITORY } from "./coaching.tokens";

export { MESSAGE_REPOSITORY } from "./coaching.tokens";

@Module({
  // IdentityModule: repositórios de usuário e de vínculo trainer/student.
  // TrainingModule: use-cases de Strategy/Workout/Dashboard reaproveitados para o aluno.
  // NotificationsModule: exporta o BullModule com a fila "notifications" já registrada
  // (T2) — necessário para @InjectQueue("notifications") em SendMessageUseCase (T3).
  imports: [IdentityModule, TrainingModule, NotificationsModule],
  controllers: [CoachingController],
  providers: [
    InviteRelationshipUseCase,
    RespondRelationshipUseCase,
    RevokeRelationshipUseCase,
    ListMyStudentsUseCase,
    ListMyTrainersUseCase,
    CreateStudentStrategyUseCase,
    CreateStudentWorkoutUseCase,
    GetStudentDashboardUseCase,
    { provide: MESSAGE_REPOSITORY, useClass: PrismaMessageRepository },
    SendMessageUseCase,
    ListMessagesUseCase,
    MarkMessagesReadUseCase,
  ],
  exports: [
    InviteRelationshipUseCase,
    RespondRelationshipUseCase,
    RevokeRelationshipUseCase,
    ListMyStudentsUseCase,
    ListMyTrainersUseCase,
    CreateStudentStrategyUseCase,
    CreateStudentWorkoutUseCase,
    GetStudentDashboardUseCase,
    SendMessageUseCase,
    ListMessagesUseCase,
    MarkMessagesReadUseCase,
  ],
})
export class CoachingModule {}

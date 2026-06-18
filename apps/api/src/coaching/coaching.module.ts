import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { TrainingModule } from "../training/training.module";
import { CoachingController } from "./presentation/coaching.controller";
import { InviteRelationshipUseCase } from "./application/use-cases/invite-relationship.use-case";
import { RespondRelationshipUseCase } from "./application/use-cases/respond-relationship.use-case";
import { RevokeRelationshipUseCase } from "./application/use-cases/revoke-relationship.use-case";
import { ListMyStudentsUseCase } from "./application/use-cases/list-my-students.use-case";
import { ListMyTrainersUseCase } from "./application/use-cases/list-my-trainers.use-case";
import { CreateStudentStrategyUseCase } from "./application/use-cases/create-student-strategy.use-case";
import { CreateStudentWorkoutUseCase } from "./application/use-cases/create-student-workout.use-case";
import { GetStudentDashboardUseCase } from "./application/use-cases/get-student-dashboard.use-case";

@Module({
  // IdentityModule: repositórios de usuário e de vínculo trainer/student.
  // TrainingModule: use-cases de Strategy/Workout/Dashboard reaproveitados para o aluno.
  imports: [IdentityModule, TrainingModule],
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
  ],
})
export class CoachingModule {}

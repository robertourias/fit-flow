import { Module } from "@nestjs/common";
import { CatalogModule } from "../catalog/catalog.module";
import { IdentityModule } from "../identity/identity.module";
import { PrismaStrategiesRepository } from "./infra/repositories/prisma-strategies.repository";
import { PrismaWorkoutsRepository } from "./infra/repositories/prisma-workouts.repository";
import { PrismaWorkoutSessionsRepository } from "./infra/repositories/prisma-workout-sessions.repository";
import { StrategiesController } from "./presentation/strategies.controller";
import { WorkoutsController } from "./presentation/workouts.controller";
import { WorkoutSessionsController } from "./presentation/workout-sessions.controller";
import { ListStrategiesUseCase } from "./application/use-cases/list-strategies.use-case";
import { GetStrategyUseCase } from "./application/use-cases/get-strategy.use-case";
import { CreateStrategyUseCase } from "./application/use-cases/create-strategy.use-case";
import { UpdateStrategyUseCase } from "./application/use-cases/update-strategy.use-case";
import { DeleteStrategyUseCase } from "./application/use-cases/delete-strategy.use-case";
import { CreateWorkoutUseCase } from "./application/use-cases/create-workout.use-case";
import { GetWorkoutUseCase } from "./application/use-cases/get-workout.use-case";
import { GetWorkoutsLimitUseCase } from "./application/use-cases/get-workouts-limit.use-case";
import { UpdateWorkoutUseCase } from "./application/use-cases/update-workout.use-case";
import { DeleteWorkoutUseCase } from "./application/use-cases/delete-workout.use-case";
import { CreateWorkoutSessionUseCase } from "./application/use-cases/create-workout-session.use-case";
import { ListWorkoutSessionsUseCase } from "./application/use-cases/list-workout-sessions.use-case";
import { GetWorkoutSessionUseCase } from "./application/use-cases/get-workout-session.use-case";
import { UpdateWorkoutSessionUseCase } from "./application/use-cases/update-workout-session.use-case";
import { DeleteWorkoutSessionUseCase } from "./application/use-cases/delete-workout-session.use-case";
import { GetActiveWorkoutUseCase } from "./application/use-cases/get-active-workout.use-case";
import { GetDashboardSummaryUseCase } from "./application/use-cases/get-dashboard-summary.use-case";
import {
  STRATEGIES_REPOSITORY,
  WORKOUTS_REPOSITORY,
  WORKOUT_SESSIONS_REPOSITORY,
} from "./training.tokens";

export {
  STRATEGIES_REPOSITORY,
  WORKOUTS_REPOSITORY,
  WORKOUT_SESSIONS_REPOSITORY,
} from "./training.tokens";

@Module({
  // CatalogModule: validação de exerciseId; IdentityModule: plano do usuário (retenção 60d)
  imports: [CatalogModule, IdentityModule],
  controllers: [StrategiesController, WorkoutsController, WorkoutSessionsController],
  providers: [
    { provide: STRATEGIES_REPOSITORY, useClass: PrismaStrategiesRepository },
    { provide: WORKOUTS_REPOSITORY, useClass: PrismaWorkoutsRepository },
    { provide: WORKOUT_SESSIONS_REPOSITORY, useClass: PrismaWorkoutSessionsRepository },
    ListStrategiesUseCase,
    GetStrategyUseCase,
    CreateStrategyUseCase,
    UpdateStrategyUseCase,
    DeleteStrategyUseCase,
    CreateWorkoutUseCase,
    GetWorkoutUseCase,
    GetWorkoutsLimitUseCase,
    UpdateWorkoutUseCase,
    DeleteWorkoutUseCase,
    CreateWorkoutSessionUseCase,
    ListWorkoutSessionsUseCase,
    GetWorkoutSessionUseCase,
    UpdateWorkoutSessionUseCase,
    DeleteWorkoutSessionUseCase,
    GetActiveWorkoutUseCase,
    GetDashboardSummaryUseCase,
  ],
  exports: [
    STRATEGIES_REPOSITORY,
    WORKOUTS_REPOSITORY,
    WORKOUT_SESSIONS_REPOSITORY,
    CreateStrategyUseCase,
    CreateWorkoutUseCase,
    GetDashboardSummaryUseCase,
  ],
})
export class TrainingModule {}

import { Module } from "@nestjs/common";
import { PrismaExercisesRepository } from "./infra/repositories/prisma-exercises.repository";
import { PrismaMuscleGroupsRepository } from "./infra/repositories/prisma-muscle-groups.repository";
import { PrismaEquipmentRepository } from "./infra/repositories/prisma-equipment.repository";
import { CatalogReferenceController } from "./presentation/catalog-reference.controller";
import { ExercisesController } from "./presentation/exercises.controller";
import { ListMuscleGroupsUseCase } from "./application/use-cases/list-muscle-groups.use-case";
import { ListEquipmentUseCase } from "./application/use-cases/list-equipment.use-case";
import { ListExercisesUseCase } from "./application/use-cases/list-exercises.use-case";
import { GetExerciseUseCase } from "./application/use-cases/get-exercise.use-case";
import { CreateExerciseUseCase } from "./application/use-cases/create-exercise.use-case";
import { UpdateExerciseUseCase } from "./application/use-cases/update-exercise.use-case";
import { ArchiveExerciseUseCase } from "./application/use-cases/archive-exercise.use-case";
import {
  EQUIPMENT_REPOSITORY,
  EXERCISES_REPOSITORY,
  MUSCLE_GROUPS_REPOSITORY,
} from "./catalog.tokens";

export { EXERCISES_REPOSITORY, MUSCLE_GROUPS_REPOSITORY, EQUIPMENT_REPOSITORY } from "./catalog.tokens";

@Module({
  controllers: [CatalogReferenceController, ExercisesController],
  providers: [
    { provide: EXERCISES_REPOSITORY, useClass: PrismaExercisesRepository },
    { provide: MUSCLE_GROUPS_REPOSITORY, useClass: PrismaMuscleGroupsRepository },
    { provide: EQUIPMENT_REPOSITORY, useClass: PrismaEquipmentRepository },
    ListMuscleGroupsUseCase,
    ListEquipmentUseCase,
    ListExercisesUseCase,
    GetExerciseUseCase,
    CreateExerciseUseCase,
    UpdateExerciseUseCase,
    ArchiveExerciseUseCase,
  ],
  exports: [EXERCISES_REPOSITORY, MUSCLE_GROUPS_REPOSITORY, EQUIPMENT_REPOSITORY],
})
export class CatalogModule {}

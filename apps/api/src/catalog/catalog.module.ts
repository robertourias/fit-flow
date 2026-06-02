import { Module } from "@nestjs/common";
import { PrismaExercisesRepository } from "./infra/repositories/prisma-exercises.repository";

export const EXERCISES_REPOSITORY = Symbol("IExercisesRepository");

@Module({
  providers: [{ provide: EXERCISES_REPOSITORY, useClass: PrismaExercisesRepository }],
  exports: [EXERCISES_REPOSITORY],
})
export class CatalogModule {}

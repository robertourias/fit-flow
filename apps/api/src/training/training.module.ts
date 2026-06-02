import { Module } from "@nestjs/common";
import { PrismaStrategiesRepository } from "./infra/repositories/prisma-strategies.repository";
import { PrismaWorkoutsRepository } from "./infra/repositories/prisma-workouts.repository";
import { PrismaWorkoutSessionsRepository } from "./infra/repositories/prisma-workout-sessions.repository";

export const STRATEGIES_REPOSITORY = Symbol("IStrategiesRepository");
export const WORKOUTS_REPOSITORY = Symbol("IWorkoutsRepository");
export const WORKOUT_SESSIONS_REPOSITORY = Symbol("IWorkoutSessionsRepository");

@Module({
  providers: [
    { provide: STRATEGIES_REPOSITORY, useClass: PrismaStrategiesRepository },
    { provide: WORKOUTS_REPOSITORY, useClass: PrismaWorkoutsRepository },
    { provide: WORKOUT_SESSIONS_REPOSITORY, useClass: PrismaWorkoutSessionsRepository },
  ],
  exports: [STRATEGIES_REPOSITORY, WORKOUTS_REPOSITORY, WORKOUT_SESSIONS_REPOSITORY],
})
export class TrainingModule {}

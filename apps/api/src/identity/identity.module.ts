import { Module } from "@nestjs/common";
import { PrismaUsersRepository } from "./infra/repositories/prisma-users.repository";
import { PrismaTrainerStudentRelationshipRepository } from "./infra/repositories/prisma-trainer-student-relationship.repository";

export const USERS_REPOSITORY = Symbol("IUsersRepository");
export const TRAINER_STUDENT_RELATIONSHIP_REPOSITORY = Symbol(
  "ITrainerStudentRelationshipRepository",
);

@Module({
  providers: [
    { provide: USERS_REPOSITORY, useClass: PrismaUsersRepository },
    {
      provide: TRAINER_STUDENT_RELATIONSHIP_REPOSITORY,
      useClass: PrismaTrainerStudentRelationshipRepository,
    },
  ],
  exports: [USERS_REPOSITORY, TRAINER_STUDENT_RELATIONSHIP_REPOSITORY],
})
export class IdentityModule {}

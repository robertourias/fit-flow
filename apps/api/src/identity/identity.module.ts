import { Module } from "@nestjs/common";
import { PrismaUsersRepository } from "./infra/repositories/prisma-users.repository";
import { PrismaTrainerStudentRelationshipRepository } from "./infra/repositories/prisma-trainer-student-relationship.repository";
import { UsersController } from "./presentation/users.controller";
import { GetMeUseCase } from "./application/use-cases/get-me.use-case";
import { UpdateMeUseCase } from "./application/use-cases/update-me.use-case";
import { DeleteMeUseCase } from "./application/use-cases/delete-me.use-case";
import {
  TRAINER_STUDENT_RELATIONSHIP_REPOSITORY,
  USERS_REPOSITORY,
} from "./identity.tokens";

export { USERS_REPOSITORY, TRAINER_STUDENT_RELATIONSHIP_REPOSITORY } from "./identity.tokens";

@Module({
  controllers: [UsersController],
  providers: [
    { provide: USERS_REPOSITORY, useClass: PrismaUsersRepository },
    {
      provide: TRAINER_STUDENT_RELATIONSHIP_REPOSITORY,
      useClass: PrismaTrainerStudentRelationshipRepository,
    },
    GetMeUseCase,
    UpdateMeUseCase,
    DeleteMeUseCase,
  ],
  exports: [USERS_REPOSITORY, TRAINER_STUDENT_RELATIONSHIP_REPOSITORY],
})
export class IdentityModule {}

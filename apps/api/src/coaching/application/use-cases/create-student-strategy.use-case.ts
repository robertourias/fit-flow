import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TRAINER_STUDENT_RELATIONSHIP_REPOSITORY } from "../../../identity/identity.tokens";
import type { ITrainerStudentRelationshipRepository } from "../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import { CreateStrategyUseCase } from "../../../training/application/use-cases/create-strategy.use-case";
import type { Strategy } from "../../../training/domain/strategy.entity";
import type { CreateStrategyDto } from "../../../training/application/dto/strategy.dto";

@Injectable()
export class CreateStudentStrategyUseCase {
  constructor(
    @Inject(TRAINER_STUDENT_RELATIONSHIP_REPOSITORY)
    private readonly _relationshipRepository: ITrainerStudentRelationshipRepository,
    private readonly _createStrategy: CreateStrategyUseCase,
  ) {}

  async execute(
    trainerId: string,
    studentId: string,
    dto: CreateStrategyDto,
  ): Promise<Strategy> {
    // FR-008: isolamento de dados — exige vínculo ACTIVE entre preparador e aluno.
    const hasAccess = await this._relationshipRepository.trainerHasAccessToStudent(
      trainerId,
      studentId,
    );
    if (!hasAccess) {
      throw new NotFoundException("Student not found");
    }

    // FR-009: tenantId é o do aluno — limite de plano FREE aplica ao aluno, não ao preparador.
    return this._createStrategy.execute(studentId, dto);
  }
}

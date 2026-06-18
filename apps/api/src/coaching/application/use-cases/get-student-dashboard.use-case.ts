import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TRAINER_STUDENT_RELATIONSHIP_REPOSITORY } from "../../../identity/identity.tokens";
import type { ITrainerStudentRelationshipRepository } from "../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import { GetDashboardSummaryUseCase } from "../../../training/application/use-cases/get-dashboard-summary.use-case";
import type { DashboardSummaryDto } from "../../../training/application/dto/dashboard-summary.dto";

@Injectable()
export class GetStudentDashboardUseCase {
  constructor(
    @Inject(TRAINER_STUDENT_RELATIONSHIP_REPOSITORY)
    private readonly _relationshipRepository: ITrainerStudentRelationshipRepository,
    private readonly _getDashboardSummary: GetDashboardSummaryUseCase,
  ) {}

  async execute(trainerId: string, studentId: string): Promise<DashboardSummaryDto> {
    // FR-008: isolamento de dados — exige vínculo ACTIVE entre preparador e aluno.
    const hasAccess = await this._relationshipRepository.trainerHasAccessToStudent(
      trainerId,
      studentId,
    );
    if (!hasAccess) {
      throw new NotFoundException("Student not found");
    }

    // FR-010: dashboard é computado com tenantId do aluno.
    return this._getDashboardSummary.execute(studentId);
  }
}

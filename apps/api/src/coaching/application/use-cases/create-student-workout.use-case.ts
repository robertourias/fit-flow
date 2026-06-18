import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TRAINER_STUDENT_RELATIONSHIP_REPOSITORY } from "../../../identity/identity.tokens";
import type { ITrainerStudentRelationshipRepository } from "../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import { CreateWorkoutUseCase } from "../../../training/application/use-cases/create-workout.use-case";
import type { Workout } from "../../../training/domain/workout.entity";
import type { CreateWorkoutDto } from "../../../training/application/dto/workout.dto";

@Injectable()
export class CreateStudentWorkoutUseCase {
  constructor(
    @Inject(TRAINER_STUDENT_RELATIONSHIP_REPOSITORY)
    private readonly _relationshipRepository: ITrainerStudentRelationshipRepository,
    private readonly _createWorkout: CreateWorkoutUseCase,
  ) {}

  async execute(trainerId: string, studentId: string, dto: CreateWorkoutDto): Promise<Workout> {
    // FR-008: isolamento de dados — exige vínculo ACTIVE entre preparador e aluno.
    const hasAccess = await this._relationshipRepository.trainerHasAccessToStudent(
      trainerId,
      studentId,
    );
    if (!hasAccess) {
      throw new NotFoundException("Student not found");
    }

    // FR-009: tenantId é o do aluno — limite de plano FREE (6 treinos/tenant) aplica ao aluno.
    return this._createWorkout.execute(studentId, dto);
  }
}

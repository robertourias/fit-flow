import { BadRequestException } from "@nestjs/common";
import { ApiErrorCode } from "@fitflow/types";
import type { IExercisesRepository } from "../../../catalog/domain/repositories/exercises.repository.interface";

/**
 * Garante que todo exerciseId referenciado é visível ao tenant (global ou próprio).
 * Lança 400 VALIDATION_ERROR no primeiro inválido.
 */
export async function validateExerciseIds(
  exercisesRepository: IExercisesRepository,
  tenantId: string,
  exerciseIds: string[],
): Promise<void> {
  const unique = [...new Set(exerciseIds)];
  for (const exerciseId of unique) {
    const exercise = await exercisesRepository.findById(exerciseId);
    if (!exercise || (!exercise.isGlobal() && exercise.tenantId !== tenantId)) {
      throw new BadRequestException({
        code: ApiErrorCode.VALIDATION_ERROR,
        message: `exerciseId inválido: ${exerciseId}`,
      });
    }
  }
}

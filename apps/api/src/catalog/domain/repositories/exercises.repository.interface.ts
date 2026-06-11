import { Exercise } from "../exercise.entity";

export interface IFindExercisesOptions {
  tenantId: string;
  search?: string;
  muscleGroupSlug?: string;
  equipmentSlug?: string;
  category?: string;
  includeArchived?: boolean;
}

export interface IExerciseWriteData {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  category: string;
  muscleGroupIds: Array<{ id: string; isPrimary: boolean }>;
  equipmentIds: string[];
}

export interface IExercisesRepository {
  /** Página de exercícios visíveis ao tenant (globais + próprios), ordenada por createdAt asc, id asc. */
  findMany(
    options: IFindExercisesOptions & { take: number; cursor?: string; skip?: number },
  ): Promise<Exercise[]>;
  count(options: IFindExercisesOptions): Promise<number>;
  findById(id: string): Promise<Exercise | null>;
  create(data: IExerciseWriteData & { tenantId?: string }): Promise<Exercise>;
  /**
   * Atualiza exercício customizado do tenant (campos simples + relações recriadas).
   * Retorna null se o exercício for global ou de outro tenant.
   */
  update(
    id: string,
    tenantId: string,
    data: Partial<IExerciseWriteData>,
  ): Promise<Exercise | null>;
  /** Arquiva (isArchived=true) exercício custom do tenant. Retorna false se global/outro tenant. */
  archive(id: string, tenantId: string): Promise<boolean>;
}

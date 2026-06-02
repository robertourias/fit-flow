import { Exercise } from "../exercise.entity";

export interface IFindExercisesOptions {
  tenantId: string;
  search?: string;
  muscleGroupSlug?: string;
  equipmentSlug?: string;
  category?: string;
  includeArchived?: boolean;
}

export interface IExercisesRepository {
  findMany(options: IFindExercisesOptions): Promise<Exercise[]>;
  findById(id: string): Promise<Exercise | null>;
  create(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    videoUrl?: string;
    category: string;
    tenantId?: string;
    muscleGroupIds: Array<{ id: string; isPrimary: boolean }>;
    equipmentIds: string[];
  }): Promise<Exercise>;
  archive(id: string): Promise<void>;
}

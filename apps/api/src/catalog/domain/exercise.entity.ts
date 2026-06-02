import { ExerciseCategory } from "./exercise-category.enum";
import { MuscleGroup } from "./muscle-group.entity";
import { Equipment } from "./equipment.entity";

export interface IExerciseProps {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  category: ExerciseCategory;
  isArchived: boolean;
  tenantId?: string | null;
  muscleGroups: Array<{ muscleGroup: MuscleGroup; isPrimary: boolean }>;
  equipment: Equipment[];
  createdAt: Date;
  updatedAt: Date;
}

export class Exercise {
  constructor(private readonly props: IExerciseProps) {}

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get description() { return this.props.description; }
  get imageUrl() { return this.props.imageUrl; }
  get videoUrl() { return this.props.videoUrl; }
  get category() { return this.props.category; }
  get isArchived() { return this.props.isArchived; }
  get tenantId() { return this.props.tenantId; }
  get muscleGroups() { return this.props.muscleGroups; }
  get equipment() { return this.props.equipment; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  isGlobal(): boolean {
    return this.props.tenantId == null;
  }

  primaryMuscleGroups(): MuscleGroup[] {
    return this.props.muscleGroups
      .filter((m) => m.isPrimary)
      .map((m) => m.muscleGroup);
  }
}

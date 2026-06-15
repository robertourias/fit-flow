export enum ApiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  NOT_FOUND = "NOT_FOUND",
  PLAN_LIMIT_EXCEEDED = "PLAN_LIMIT_EXCEEDED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export type ApiResponse<T> =
  | { data: T; error: null }
  // message é string[] para erros de validação (uma mensagem por campo)
  | { data: null; error: { message: string | string[]; code: string } };

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  nextCursor: string | null;
};

export interface UserMeDto {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  age: number | null;
  goals: string[];
  isTrainer: boolean;
  plan: "FREE" | "PRO";
  hasOnboarded: boolean;
  createdAt: string;
}

export interface UpdateUserMeDto {
  name?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  age?: number | null;
  goals?: string[];
  hasOnboarded?: boolean;
}

export interface MuscleGroupDto {
  id: string;
  name: string;
  slug: string;
}

export interface EquipmentDto {
  id: string;
  name: string;
  slug: string;
}

export interface ExerciseDto {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  category: "STRENGTH" | "CARDIO" | "FLEXIBILITY" | "BALANCE";
  isArchived: boolean;
  tenantId: string | null;
  muscleGroups: Array<MuscleGroupDto & { isPrimary: boolean }>;
  equipment: EquipmentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PlannedSetDto {
  id: string;
  setNumber: number;
  targetReps: string;
  targetKg: string | null;
}

export interface WorkoutExerciseDto {
  id: string;
  exerciseId: string;
  order: number;
  restSeconds: number;
  notes: string | null;
  plannedSets: PlannedSetDto[];
}

export interface WorkoutSummaryDto {
  id: string;
  name: string;
  order: number;
}

export interface WorkoutDetailDto {
  id: string;
  strategyId: string;
  name: string;
  description: string | null;
  order: number;
  exercises: WorkoutExerciseDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlannedSetDto {
  setNumber: number;
  targetReps: string;
  targetKg?: string;
}

export interface CreateWorkoutExerciseDto {
  exerciseId: string;
  order: number;
  restSeconds?: number;
  notes?: string;
  plannedSets: CreatePlannedSetDto[];
}

export interface CreateWorkoutDto {
  strategyId: string;
  name: string;
  description?: string;
  order: number;
  exercises: CreateWorkoutExerciseDto[];
}

export interface UpdateWorkoutDto {
  name?: string;
  description?: string;
  order?: number;
  exercises?: CreateWorkoutExerciseDto[];
}

export interface WorkoutsLimitDto {
  count: number;
  limit: number | null;
  plan: "FREE" | "PRO";
}

export interface StrategySummaryDto {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  isActive: boolean;
  workouts: WorkoutSummaryDto[];
  createdAt: string;
  updatedAt: string;
}

export interface StrategyDetailDto extends Omit<StrategySummaryDto, "workouts"> {
  workouts: WorkoutDetailDto[];
}

export interface CreateStrategyDto {
  name: string;
  type?: string;
  description?: string;
}

export interface UpdateStrategyDto {
  name?: string;
  type?: string;
  description?: string;
  isActive?: boolean;
}

export interface DashboardSummaryDto {
  diasEstaSemana: number;
  treinosNoMes: number;
  treinosNoMesDelta: number;
  diasSequencia: number;
  volumeSemanal: number;
  volumeData: Array<{
    dia: "Seg" | "Ter" | "Qua" | "Qui" | "Sex" | "Sáb" | "Dom";
    volume: number;
  }>;
  muscleGroups: Array<{ nome: string; percentual: number }>;
  trainDates: number[];
  workoutsCount: number;
}

export interface ActiveWorkoutDto {
  estrategiaNome: string;
  workout: { id: string; nome: string; exercicios: string[]; order: number };
  proximos: Array<{ id: string; nome: string; numExercicios: number; order: number }>;
}

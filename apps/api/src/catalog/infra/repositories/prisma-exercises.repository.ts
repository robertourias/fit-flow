import { Injectable } from "@nestjs/common";
import { prisma, Prisma } from "@fitflow/db";
import {
  IExercisesRepository,
  IFindExercisesOptions,
} from "../../domain/repositories/exercises.repository.interface";
import { Exercise } from "../../domain/exercise.entity";
import { ExerciseCategory } from "../../domain/exercise-category.enum";
import { MuscleGroup } from "../../domain/muscle-group.entity";
import { Equipment } from "../../domain/equipment.entity";

type ExerciseRow = Prisma.ExerciseGetPayload<{
  include: {
    muscleGroups: { include: { muscleGroup: true } };
    equipment: { include: { equipment: true } };
  };
}>;

const EXERCISE_INCLUDE = {
  muscleGroups: { include: { muscleGroup: true } },
  equipment: { include: { equipment: true } },
} as const;

@Injectable()
export class PrismaExercisesRepository implements IExercisesRepository {
  async findMany(options: IFindExercisesOptions): Promise<Exercise[]> {
    const rows = await prisma.exercise.findMany({
      where: {
        // FR-005: global (tenantId IS NULL) OR owned by this tenant
        OR: [{ tenantId: null }, { tenantId: options.tenantId }],
        isArchived: options.includeArchived ? undefined : false,
        ...(options.search
          ? { name: { contains: options.search, mode: "insensitive" } }
          : {}),
        ...(options.muscleGroupSlug
          ? { muscleGroups: { some: { muscleGroup: { slug: options.muscleGroupSlug } } } }
          : {}),
        ...(options.equipmentSlug
          ? { equipment: { some: { equipment: { slug: options.equipmentSlug } } } }
          : {}),
        ...(options.category ? { category: options.category as ExerciseCategory } : {}),
      },
      include: EXERCISE_INCLUDE,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string): Promise<Exercise | null> {
    const row = await prisma.exercise.findUnique({
      where: { id },
      include: EXERCISE_INCLUDE,
    });
    return row ? this.toDomain(row) : null;
  }

  async create(data: Parameters<IExercisesRepository["create"]>[0]): Promise<Exercise> {
    const row = await prisma.exercise.create({
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        category: data.category as ExerciseCategory,
        tenantId: data.tenantId,
        muscleGroups: {
          create: data.muscleGroupIds.map((m) => ({
            muscleGroupId: m.id,
            isPrimary: m.isPrimary,
          })),
        },
        equipment: {
          create: data.equipmentIds.map((id) => ({ equipmentId: id })),
        },
      },
      include: EXERCISE_INCLUDE,
    });
    return this.toDomain(row);
  }

  async archive(id: string): Promise<void> {
    await prisma.exercise.update({ where: { id }, data: { isArchived: true } });
  }

  private toDomain(row: ExerciseRow): Exercise {
    return new Exercise({
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.imageUrl,
      videoUrl: row.videoUrl,
      category: row.category as ExerciseCategory,
      isArchived: row.isArchived,
      tenantId: row.tenantId,
      muscleGroups: row.muscleGroups.map((m) => ({
        muscleGroup: new MuscleGroup(m.muscleGroup.id, m.muscleGroup.name, m.muscleGroup.slug),
        isPrimary: m.isPrimary,
      })),
      equipment: row.equipment.map(
        (e) => new Equipment(e.equipment.id, e.equipment.name, e.equipment.slug),
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

import { Injectable } from "@nestjs/common";
import { prisma, Prisma } from "@fitflow/db";
import {
  IExercisesRepository,
  IExerciseWriteData,
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
  private _buildWhere(options: IFindExercisesOptions): Prisma.ExerciseWhereInput {
    return {
      // FR-030: global (tenantId IS NULL) OR owned by this tenant
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
    };
  }

  async findMany(
    options: IFindExercisesOptions & { take: number; cursor?: string; skip?: number },
  ): Promise<Exercise[]> {
    const rows = await prisma.exercise.findMany({
      where: this._buildWhere(options),
      include: EXERCISE_INCLUDE,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: options.take,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: options.skip ?? 1 } : {}),
    });
    return rows.map((r) => this.toDomain(r));
  }

  async count(options: IFindExercisesOptions): Promise<number> {
    return prisma.exercise.count({ where: this._buildWhere(options) });
  }

  async findById(id: string): Promise<Exercise | null> {
    const row = await prisma.exercise.findUnique({
      where: { id },
      include: EXERCISE_INCLUDE,
    });
    return row ? this.toDomain(row) : null;
  }

  async create(data: IExerciseWriteData & { tenantId?: string }): Promise<Exercise> {
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

  async update(
    id: string,
    tenantId: string,
    data: Partial<IExerciseWriteData>,
  ): Promise<Exercise | null> {
    const existing = await prisma.exercise.findUnique({ where: { id }, select: { tenantId: true } });
    // global (tenantId null) ou de outro tenant => 404
    if (!existing || existing.tenantId !== tenantId) return null;

    const row = await prisma.$transaction(async (tx) => {
      await tx.exercise.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
          ...(data.category !== undefined && { category: data.category as ExerciseCategory }),
        },
      });
      if (data.muscleGroupIds !== undefined) {
        await tx.exerciseMuscleGroup.deleteMany({ where: { exerciseId: id } });
        await tx.exerciseMuscleGroup.createMany({
          data: data.muscleGroupIds.map((m) => ({
            exerciseId: id,
            muscleGroupId: m.id,
            isPrimary: m.isPrimary,
          })),
        });
      }
      if (data.equipmentIds !== undefined) {
        await tx.exerciseEquipment.deleteMany({ where: { exerciseId: id } });
        await tx.exerciseEquipment.createMany({
          data: data.equipmentIds.map((equipmentId) => ({ exerciseId: id, equipmentId })),
        });
      }
      return tx.exercise.findUniqueOrThrow({ where: { id }, include: EXERCISE_INCLUDE });
    });
    return this.toDomain(row);
  }

  async archive(id: string, tenantId: string): Promise<boolean> {
    const existing = await prisma.exercise.findUnique({ where: { id }, select: { tenantId: true } });
    if (!existing || existing.tenantId !== tenantId) return false;
    await prisma.exercise.update({ where: { id }, data: { isArchived: true } });
    return true;
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

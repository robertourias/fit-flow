import { Injectable } from "@nestjs/common";
import { prisma } from "@fitflow/db";
import { IMuscleGroupsRepository } from "../../domain/repositories/muscle-groups.repository.interface";
import { MuscleGroup } from "../../domain/muscle-group.entity";

@Injectable()
export class PrismaMuscleGroupsRepository implements IMuscleGroupsRepository {
  async findAll(): Promise<MuscleGroup[]> {
    const rows = await prisma.muscleGroup.findMany({ orderBy: { name: "asc" } });
    return rows.map((row) => new MuscleGroup(row.id, row.name, row.slug));
  }
}

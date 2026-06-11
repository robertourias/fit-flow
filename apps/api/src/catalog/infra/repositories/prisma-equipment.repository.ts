import { Injectable } from "@nestjs/common";
import { prisma } from "@fitflow/db";
import { IEquipmentRepository } from "../../domain/repositories/equipment.repository.interface";
import { Equipment } from "../../domain/equipment.entity";

@Injectable()
export class PrismaEquipmentRepository implements IEquipmentRepository {
  async findAll(): Promise<Equipment[]> {
    const rows = await prisma.equipment.findMany({ orderBy: { name: "asc" } });
    return rows.map((row) => new Equipment(row.id, row.name, row.slug));
  }
}

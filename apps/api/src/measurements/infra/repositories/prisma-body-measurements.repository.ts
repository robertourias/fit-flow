import { Injectable } from "@nestjs/common";
import { prisma } from "@fitflow/db";
import { IBodyMeasurementsRepository } from "../../domain/repositories/body-measurements.repository.interface";
import { BodyMeasurement, IBodyMeasurementProps } from "../../domain/body-measurement.entity";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BodyMeasurementRow = any;

function toDomain(row: BodyMeasurementRow): BodyMeasurement {
  return new BodyMeasurement({
    id: row.id,
    tenantId: row.tenantId,
    measuredAt: row.measuredAt,
    weight: row.weight != null ? Number(row.weight) : null,
    neck: row.neck != null ? Number(row.neck) : null,
    chest: row.chest != null ? Number(row.chest) : null,
    waist: row.waist != null ? Number(row.waist) : null,
    hip: row.hip != null ? Number(row.hip) : null,
    leftArm: row.leftArm != null ? Number(row.leftArm) : null,
    rightArm: row.rightArm != null ? Number(row.rightArm) : null,
    leftThigh: row.leftThigh != null ? Number(row.leftThigh) : null,
    rightThigh: row.rightThigh != null ? Number(row.rightThigh) : null,
    calf: row.calf != null ? Number(row.calf) : null,
    bodyFatPct: row.bodyFatPct != null ? Number(row.bodyFatPct) : null,
    muscleMassPct: row.muscleMassPct != null ? Number(row.muscleMassPct) : null,
    visceralFat: row.visceralFat ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaBodyMeasurementsRepository implements IBodyMeasurementsRepository {
  async findById(id: string): Promise<BodyMeasurement | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await (prisma as any).bodyMeasurement.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findManyByTenant(
    opts: Parameters<IBodyMeasurementsRepository["findManyByTenant"]>[0],
  ): Promise<BodyMeasurement[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (prisma as any).bodyMeasurement.findMany({
      where: {
        tenantId: opts.tenantId,
        ...(opts.measuredAfter ? { measuredAt: { gte: opts.measuredAfter } } : {}),
      },
      orderBy: [{ measuredAt: "desc" }, { id: "desc" }],
      take: opts.take,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: opts.skip ?? 1 } : {}),
    });
    return rows.map(toDomain);
  }

  async count(opts: Parameters<IBodyMeasurementsRepository["count"]>[0]): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (prisma as any).bodyMeasurement.count({
      where: {
        tenantId: opts.tenantId,
        ...(opts.measuredAfter ? { measuredAt: { gte: opts.measuredAfter } } : {}),
      },
    });
  }

  async create(
    data: Parameters<IBodyMeasurementsRepository["create"]>[0],
  ): Promise<BodyMeasurement> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await (prisma as any).bodyMeasurement.create({ data });
    return toDomain(row);
  }

  async update(
    id: string,
    data: Parameters<IBodyMeasurementsRepository["update"]>[1],
  ): Promise<BodyMeasurement> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = await (prisma as any).bodyMeasurement.update({ where: { id }, data });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).bodyMeasurement.delete({ where: { id } });
  }
}

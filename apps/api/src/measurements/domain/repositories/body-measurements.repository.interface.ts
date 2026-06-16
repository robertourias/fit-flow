import { BodyMeasurement, IBodyMeasurementProps } from "../body-measurement.entity";

export interface IBodyMeasurementsRepository {
  findById(id: string): Promise<BodyMeasurement | null>;
  findManyByTenant(opts: {
    tenantId: string;
    take: number;
    cursor?: string;
    skip?: number;
    measuredAfter?: Date;
  }): Promise<BodyMeasurement[]>;
  count(opts: { tenantId: string; measuredAfter?: Date }): Promise<number>;
  create(data: Omit<IBodyMeasurementProps, "id" | "createdAt" | "updatedAt">): Promise<BodyMeasurement>;
  update(id: string, data: Partial<Omit<IBodyMeasurementProps, "id" | "tenantId" | "createdAt" | "updatedAt">>): Promise<BodyMeasurement>;
  delete(id: string): Promise<void>;
}

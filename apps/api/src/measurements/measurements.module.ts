import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { PrismaBodyMeasurementsRepository } from "./infra/repositories/prisma-body-measurements.repository";
import { MeasurementsController } from "./presentation/measurements.controller";
import { CreateBodyMeasurementUseCase } from "./application/use-cases/create-body-measurement.use-case";
import { ListBodyMeasurementsUseCase } from "./application/use-cases/list-body-measurements.use-case";
import { GetBodyMeasurementUseCase } from "./application/use-cases/get-body-measurement.use-case";
import { UpdateBodyMeasurementUseCase } from "./application/use-cases/update-body-measurement.use-case";
import { DeleteBodyMeasurementUseCase } from "./application/use-cases/delete-body-measurement.use-case";
import { BODY_MEASUREMENTS_REPOSITORY } from "./measurements.tokens";

@Module({
  imports: [IdentityModule],
  controllers: [MeasurementsController],
  providers: [
    { provide: BODY_MEASUREMENTS_REPOSITORY, useClass: PrismaBodyMeasurementsRepository },
    CreateBodyMeasurementUseCase,
    ListBodyMeasurementsUseCase,
    GetBodyMeasurementUseCase,
    UpdateBodyMeasurementUseCase,
    DeleteBodyMeasurementUseCase,
  ],
})
export class MeasurementsModule {}

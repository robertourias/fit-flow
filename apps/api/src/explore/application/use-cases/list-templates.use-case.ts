import { Injectable } from "@nestjs/common";
import { prisma } from "@fitflow/db";
import { StrategyTemplateDto } from "../dto/strategy-template.dto";

@Injectable()
export class ListTemplatesUseCase {
  async execute(): Promise<StrategyTemplateDto[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (prisma.strategy as any).findMany({
      where: { isTemplate: true },
      include: {
        workouts: {
          orderBy: { order: "asc" },
          include: {
            workoutExercises: {
              include: {
                exercise: {
                  include: { muscleGroups: { include: { muscleGroup: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((r: any) => StrategyTemplateDto.fromPrismaRow(r));
  }
}

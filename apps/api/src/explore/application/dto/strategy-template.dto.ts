import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class StrategyTemplateDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  type!: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty()
  workoutsCount!: number;

  @ApiProperty({ type: [String] })
  workoutNames!: string[];

  @ApiProperty({ type: [String] })
  muscleGroups!: string[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromPrismaRow(row: any): StrategyTemplateDto {
    const dto = new StrategyTemplateDto();
    dto.id = row.id;
    dto.name = row.name;
    dto.type = row.type ?? null;
    dto.description = row.description ?? null;
    dto.workoutsCount = row.workouts?.length ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dto.workoutNames = (row.workouts ?? []).map((w: any) => w.name as string);
    const mgSet = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const w of (row.workouts ?? [])) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const we of (w.workoutExercises ?? [])) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const mg of (we.exercise?.muscleGroups ?? [])) {
          if (mg.muscleGroup?.name) mgSet.add(mg.muscleGroup.name as string);
        }
      }
    }
    dto.muscleGroups = Array.from(mgSet);
    return dto;
  }
}

import { ApiProperty } from "@nestjs/swagger";

export class VolumeDataDto {
  @ApiProperty()
  dia!: "Seg" | "Ter" | "Qua" | "Qui" | "Sex" | "Sáb" | "Dom";

  @ApiProperty()
  volume!: number;
}

export class DurationDataDto {
  @ApiProperty()
  dia!: string;

  @ApiProperty()
  totalMinutos!: number;
}

export class HeatmapDataDto {
  @ApiProperty()
  date!: string;

  @ApiProperty()
  count!: number;
}

export class MuscleGroupDto {
  @ApiProperty()
  nome!: string;

  @ApiProperty()
  percentual!: number;
}

export class DashboardSummaryDto {
  @ApiProperty()
  diasEstaSemana!: number;

  @ApiProperty()
  treinosNoMes!: number;

  @ApiProperty()
  treinosNoMesDelta!: number;

  @ApiProperty()
  diasSequencia!: number;

  @ApiProperty()
  volumeSemanal!: number;

  @ApiProperty({ type: [VolumeDataDto] })
  volumeData!: VolumeDataDto[];

  @ApiProperty({ type: [MuscleGroupDto] })
  muscleGroups!: MuscleGroupDto[];

  @ApiProperty({ type: [Number] })
  trainDates!: number[];

  @ApiProperty()
  workoutsCount!: number;

  @ApiProperty({ type: [DurationDataDto] })
  durationData!: DurationDataDto[];

  @ApiProperty()
  semanalDuracao!: number;

  @ApiProperty({ type: [HeatmapDataDto] })
  heatmapData!: HeatmapDataDto[];
}

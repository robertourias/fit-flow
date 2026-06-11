import { ApiProperty } from "@nestjs/swagger";

export class TodayWorkoutDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty({ type: [String] })
  exercicios!: string[];

  @ApiProperty()
  order!: number;
}

export class NextWorkoutDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  nome!: string;

  @ApiProperty()
  numExercicios!: number;

  @ApiProperty()
  order!: number;
}

export class ActiveWorkoutDto {
  @ApiProperty()
  estrategiaNome!: string;

  @ApiProperty({ type: TodayWorkoutDto })
  workout!: TodayWorkoutDto;

  @ApiProperty({ type: [NextWorkoutDto] })
  proximos!: NextWorkoutDto[];
}

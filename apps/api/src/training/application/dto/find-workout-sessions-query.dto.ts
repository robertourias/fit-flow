import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto";

export class FindWorkoutSessionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: "Filtra sessões de um treino específico" })
  @IsOptional()
  @IsString()
  workoutId?: string;
}

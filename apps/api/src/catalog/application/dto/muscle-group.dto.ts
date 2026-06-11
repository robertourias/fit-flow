import { ApiProperty } from "@nestjs/swagger";
import type { MuscleGroup } from "../../domain/muscle-group.entity";

export class MuscleGroupDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  static fromEntity(entity: MuscleGroup): MuscleGroupDto {
    const dto = new MuscleGroupDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.slug = entity.slug;
    return dto;
  }
}

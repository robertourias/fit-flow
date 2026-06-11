import { ApiProperty } from "@nestjs/swagger";
import type { Equipment } from "../../domain/equipment.entity";

export class EquipmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  static fromEntity(entity: Equipment): EquipmentDto {
    const dto = new EquipmentDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.slug = entity.slug;
    return dto;
  }
}

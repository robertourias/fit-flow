import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { MuscleGroupDto } from "../application/dto/muscle-group.dto";
import { EquipmentDto } from "../application/dto/equipment.dto";
import { ListMuscleGroupsUseCase } from "../application/use-cases/list-muscle-groups.use-case";
import { ListEquipmentUseCase } from "../application/use-cases/list-equipment.use-case";

@ApiTags("catalog")
@ApiBearerAuth()
@Controller()
export class CatalogReferenceController {
  constructor(
    private readonly _listMuscleGroups: ListMuscleGroupsUseCase,
    private readonly _listEquipment: ListEquipmentUseCase,
  ) {}

  @Get("muscle-groups")
  @ApiOkResponse({ type: [MuscleGroupDto] })
  async muscleGroups(): Promise<MuscleGroupDto[]> {
    const groups = await this._listMuscleGroups.execute();
    return groups.map((group) => MuscleGroupDto.fromEntity(group));
  }

  @Get("equipment")
  @ApiOkResponse({ type: [EquipmentDto] })
  async equipment(): Promise<EquipmentDto[]> {
    const equipment = await this._listEquipment.execute();
    return equipment.map((item) => EquipmentDto.fromEntity(item));
  }
}

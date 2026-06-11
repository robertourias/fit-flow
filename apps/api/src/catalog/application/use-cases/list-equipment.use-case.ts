import { Inject, Injectable } from "@nestjs/common";
import { EQUIPMENT_REPOSITORY } from "../../catalog.tokens";
import type { IEquipmentRepository } from "../../domain/repositories/equipment.repository.interface";
import type { Equipment } from "../../domain/equipment.entity";

@Injectable()
export class ListEquipmentUseCase {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY)
    private readonly _equipmentRepository: IEquipmentRepository,
  ) {}

  async execute(): Promise<Equipment[]> {
    return this._equipmentRepository.findAll();
  }
}

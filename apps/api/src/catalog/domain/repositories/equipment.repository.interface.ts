import { Equipment } from "../equipment.entity";

export interface IEquipmentRepository {
  findAll(): Promise<Equipment[]>;
}

import { MuscleGroup } from "../muscle-group.entity";

export interface IMuscleGroupsRepository {
  findAll(): Promise<MuscleGroup[]>;
}

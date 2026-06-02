import { User } from "../user.entity";

export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: {
    id?: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    isTrainer?: boolean;
  }): Promise<User>;
  update(
    id: string,
    data: Partial<{ name: string; avatarUrl: string | null; isTrainer: boolean; plan: string }>,
  ): Promise<User>;
  countWorkouts(tenantId: string): Promise<number>;
}

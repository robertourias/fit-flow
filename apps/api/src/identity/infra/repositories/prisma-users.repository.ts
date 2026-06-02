import { Injectable } from "@nestjs/common";
import { prisma, Prisma } from "@fitflow/db";
import { IUsersRepository } from "../../domain/repositories/users.repository.interface";
import { User } from "../../domain/user.entity";
import { Plan } from "../../domain/plan.enum";

type UserRow = Prisma.UserGetPayload<Record<string, never>>;

@Injectable()
export class PrismaUsersRepository implements IUsersRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: Parameters<IUsersRepository["create"]>[0]): Promise<User> {
    const row = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        isTrainer: data.isTrainer ?? false,
      },
    });
    return this.toDomain(row);
  }

  async update(id: string, data: Parameters<IUsersRepository["update"]>[1]): Promise<User> {
    const row = await prisma.user.update({ where: { id }, data: data as Prisma.UserUpdateInput });
    return this.toDomain(row);
  }

  async countWorkouts(tenantId: string): Promise<number> {
    return prisma.workout.count({ where: { tenantId } });
  }

  private toDomain(row: UserRow): User {
    return new User({
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatarUrl,
      isTrainer: row.isTrainer,
      plan: row.plan as Plan,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

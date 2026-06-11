import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { USERS_REPOSITORY } from "../../identity.tokens";
import type { IUsersRepository } from "../../domain/repositories/users.repository.interface";
import type { User } from "../../domain/user.entity";
import type { UpdateUserMeDto } from "../dto/update-user-me.dto";

@Injectable()
export class UpdateMeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly _usersRepository: IUsersRepository,
  ) {}

  async execute(tenantId: string, dto: UpdateUserMeDto): Promise<User> {
    const user = await this._usersRepository.findById(tenantId);
    if (!user || user.isDeleted()) {
      throw new NotFoundException("User not found");
    }
    return this._usersRepository.update(tenantId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.age !== undefined && { age: dto.age }),
      ...(dto.goals !== undefined && { goals: dto.goals }),
    });
  }
}

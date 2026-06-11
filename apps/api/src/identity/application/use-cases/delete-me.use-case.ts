import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { USERS_REPOSITORY } from "../../identity.tokens";
import type { IUsersRepository } from "../../domain/repositories/users.repository.interface";

@Injectable()
export class DeleteMeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly _usersRepository: IUsersRepository,
  ) {}

  async execute(tenantId: string): Promise<void> {
    const user = await this._usersRepository.findById(tenantId);
    if (!user || user.isDeleted()) {
      throw new NotFoundException("User not found");
    }
    await this._usersRepository.softDelete(tenantId);
  }
}

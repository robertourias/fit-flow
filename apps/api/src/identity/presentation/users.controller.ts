import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch } from "@nestjs/common";
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/jwt-auth.guard";
import { UserMeDto } from "../application/dto/user-me.dto";
import { UpdateUserMeDto } from "../application/dto/update-user-me.dto";
import { GetMeUseCase } from "../application/use-cases/get-me.use-case";
import { UpdateMeUseCase } from "../application/use-cases/update-me.use-case";
import { DeleteMeUseCase } from "../application/use-cases/delete-me.use-case";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(
    private readonly _getMe: GetMeUseCase,
    private readonly _updateMe: UpdateMeUseCase,
    private readonly _deleteMe: DeleteMeUseCase,
  ) {}

  @Get("me")
  @ApiOkResponse({ type: UserMeDto })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserMeDto> {
    return UserMeDto.fromEntity(await this._getMe.execute(user.id));
  }

  @Patch("me")
  @ApiOkResponse({ type: UserMeDto })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserMeDto,
  ): Promise<UserMeDto> {
    return UserMeDto.fromEntity(await this._updateMe.execute(user.id, dto));
  }

  @Delete("me")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async deleteMe(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this._deleteMe.execute(user.id);
  }
}

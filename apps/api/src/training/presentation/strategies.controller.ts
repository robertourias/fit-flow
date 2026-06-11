import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/jwt-auth.guard";
import {
  CreateStrategyDto,
  StrategyDetailDto,
  StrategySummaryDto,
  UpdateStrategyDto,
} from "../application/dto/strategy.dto";
import { ActiveWorkoutDto } from "../application/dto/active-workout.dto";
import { ListStrategiesUseCase } from "../application/use-cases/list-strategies.use-case";
import { GetStrategyUseCase } from "../application/use-cases/get-strategy.use-case";
import { CreateStrategyUseCase } from "../application/use-cases/create-strategy.use-case";
import { UpdateStrategyUseCase } from "../application/use-cases/update-strategy.use-case";
import { DeleteStrategyUseCase } from "../application/use-cases/delete-strategy.use-case";
import { GetActiveWorkoutUseCase } from "../application/use-cases/get-active-workout.use-case";

@ApiTags("strategies")
@ApiBearerAuth()
@Controller("strategies")
export class StrategiesController {
  constructor(
    private readonly _listStrategies: ListStrategiesUseCase,
    private readonly _getStrategy: GetStrategyUseCase,
    private readonly _createStrategy: CreateStrategyUseCase,
    private readonly _updateStrategy: UpdateStrategyUseCase,
    private readonly _deleteStrategy: DeleteStrategyUseCase,
    private readonly _getActiveWorkout: GetActiveWorkoutUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: [StrategySummaryDto] })
  async list(@CurrentUser() user: AuthenticatedUser): Promise<StrategySummaryDto[]> {
    const strategies = await this._listStrategies.execute(user.id);
    return strategies.map((strategy) => StrategySummaryDto.fromEntity(strategy));
  }

  @Get("active-workout")
  @ApiOkResponse({ type: ActiveWorkoutDto })
  async getActiveWorkout(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ActiveWorkoutDto | null> {
    return this._getActiveWorkout.execute(user.id);
  }

  @Get(":id")
  @ApiOkResponse({ type: StrategyDetailDto })
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<StrategyDetailDto> {
    return StrategyDetailDto.fromEntity(await this._getStrategy.execute(id, user.id));
  }

  @Post()
  @ApiCreatedResponse({ type: StrategySummaryDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStrategyDto,
  ): Promise<StrategySummaryDto> {
    return StrategySummaryDto.fromEntity(await this._createStrategy.execute(user.id, dto));
  }

  @Patch(":id")
  @ApiOkResponse({ type: StrategySummaryDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateStrategyDto,
  ): Promise<StrategySummaryDto> {
    return StrategySummaryDto.fromEntity(await this._updateStrategy.execute(id, user.id, dto));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this._deleteStrategy.execute(id, user.id);
  }
}

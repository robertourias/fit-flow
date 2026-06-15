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
  CreateWorkoutDto,
  UpdateWorkoutDto,
  WorkoutDetailDto,
} from "../application/dto/workout.dto";
import { WorkoutsLimitDto } from "../application/dto/workouts-limit.dto";
import { CreateWorkoutUseCase } from "../application/use-cases/create-workout.use-case";
import { GetWorkoutUseCase } from "../application/use-cases/get-workout.use-case";
import { GetWorkoutsLimitUseCase } from "../application/use-cases/get-workouts-limit.use-case";
import { UpdateWorkoutUseCase } from "../application/use-cases/update-workout.use-case";
import { DeleteWorkoutUseCase } from "../application/use-cases/delete-workout.use-case";

@ApiTags("workouts")
@ApiBearerAuth()
@Controller("workouts")
export class WorkoutsController {
  constructor(
    private readonly _createWorkout: CreateWorkoutUseCase,
    private readonly _getWorkout: GetWorkoutUseCase,
    private readonly _getWorkoutsLimit: GetWorkoutsLimitUseCase,
    private readonly _updateWorkout: UpdateWorkoutUseCase,
    private readonly _deleteWorkout: DeleteWorkoutUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: WorkoutDetailDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkoutDto,
  ): Promise<WorkoutDetailDto> {
    return WorkoutDetailDto.fromEntity(await this._createWorkout.execute(user.id, dto));
  }

  // IMPORTANTE: declarada antes de @Get(":id") para evitar route shadowing
  // (Nest/Express casariam GET /workouts/limit com :id="limit" se viesse depois).
  @Get("limit")
  @ApiOkResponse({ type: WorkoutsLimitDto })
  async getLimit(@CurrentUser() user: AuthenticatedUser): Promise<WorkoutsLimitDto> {
    return WorkoutsLimitDto.from(await this._getWorkoutsLimit.execute(user.id));
  }

  @Get(":id")
  @ApiOkResponse({ type: WorkoutDetailDto })
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<WorkoutDetailDto> {
    return WorkoutDetailDto.fromEntity(await this._getWorkout.execute(id, user.id));
  }

  @Patch(":id")
  @ApiOkResponse({ type: WorkoutDetailDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateWorkoutDto,
  ): Promise<WorkoutDetailDto> {
    return WorkoutDetailDto.fromEntity(await this._updateWorkout.execute(id, user.id, dto));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this._deleteWorkout.execute(id, user.id);
  }
}

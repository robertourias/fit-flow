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
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { PaginatedResponse } from "@fitflow/types";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/jwt-auth.guard";
import {
  CreateWorkoutSessionDto,
  UpdateWorkoutSessionDto,
  WorkoutSessionDetailDto,
  WorkoutSessionSummaryDto,
} from "../application/dto/workout-session.dto";
import { FindWorkoutSessionsQueryDto } from "../application/dto/find-workout-sessions-query.dto";
import { CreateWorkoutSessionUseCase } from "../application/use-cases/create-workout-session.use-case";
import { ListWorkoutSessionsUseCase } from "../application/use-cases/list-workout-sessions.use-case";
import { GetWorkoutSessionUseCase } from "../application/use-cases/get-workout-session.use-case";
import { UpdateWorkoutSessionUseCase } from "../application/use-cases/update-workout-session.use-case";
import { DeleteWorkoutSessionUseCase } from "../application/use-cases/delete-workout-session.use-case";

@ApiTags("workout-sessions")
@ApiBearerAuth()
@Controller("workout-sessions")
export class WorkoutSessionsController {
  constructor(
    private readonly _createSession: CreateWorkoutSessionUseCase,
    private readonly _listSessions: ListWorkoutSessionsUseCase,
    private readonly _getSession: GetWorkoutSessionUseCase,
    private readonly _updateSession: UpdateWorkoutSessionUseCase,
    private readonly _deleteSession: DeleteWorkoutSessionUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: WorkoutSessionDetailDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWorkoutSessionDto,
  ): Promise<WorkoutSessionDetailDto> {
    return WorkoutSessionDetailDto.fromEntity(await this._createSession.execute(user.id, dto));
  }

  @Get()
  @ApiOkResponse({ type: [WorkoutSessionSummaryDto] })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindWorkoutSessionsQueryDto,
  ): Promise<PaginatedResponse<WorkoutSessionSummaryDto>> {
    const page = await this._listSessions.execute(user.id, query);
    return { ...page, items: page.items.map((item) => WorkoutSessionSummaryDto.fromEntity(item)) };
  }

  @Get(":id")
  @ApiOkResponse({ type: WorkoutSessionDetailDto })
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<WorkoutSessionDetailDto> {
    return WorkoutSessionDetailDto.fromEntity(await this._getSession.execute(id, user.id));
  }

  @Patch(":id")
  @ApiOkResponse({ type: WorkoutSessionDetailDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateWorkoutSessionDto,
  ): Promise<WorkoutSessionDetailDto> {
    return WorkoutSessionDetailDto.fromEntity(await this._updateSession.execute(id, user.id, dto));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this._deleteSession.execute(id, user.id);
  }
}

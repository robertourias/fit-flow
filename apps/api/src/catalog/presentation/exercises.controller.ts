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
  CreateExerciseDto,
  ExerciseDto,
  UpdateExerciseDto,
} from "../application/dto/exercise.dto";
import { FindExercisesQueryDto } from "../application/dto/find-exercises-query.dto";
import { ListExercisesUseCase } from "../application/use-cases/list-exercises.use-case";
import { GetExerciseUseCase } from "../application/use-cases/get-exercise.use-case";
import { CreateExerciseUseCase } from "../application/use-cases/create-exercise.use-case";
import { UpdateExerciseUseCase } from "../application/use-cases/update-exercise.use-case";
import { ArchiveExerciseUseCase } from "../application/use-cases/archive-exercise.use-case";

@ApiTags("exercises")
@ApiBearerAuth()
@Controller("exercises")
export class ExercisesController {
  constructor(
    private readonly _listExercises: ListExercisesUseCase,
    private readonly _getExercise: GetExerciseUseCase,
    private readonly _createExercise: CreateExerciseUseCase,
    private readonly _updateExercise: UpdateExerciseUseCase,
    private readonly _archiveExercise: ArchiveExerciseUseCase,
  ) {}

  @Get()
  @ApiOkResponse({ type: [ExerciseDto] })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindExercisesQueryDto,
  ): Promise<PaginatedResponse<ExerciseDto>> {
    const page = await this._listExercises.execute(user.id, query);
    return { ...page, items: page.items.map((item) => ExerciseDto.fromEntity(item)) };
  }

  @Get(":id")
  @ApiOkResponse({ type: ExerciseDto })
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<ExerciseDto> {
    return ExerciseDto.fromEntity(await this._getExercise.execute(id, user.id));
  }

  @Post()
  @ApiCreatedResponse({ type: ExerciseDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExerciseDto,
  ): Promise<ExerciseDto> {
    return ExerciseDto.fromEntity(await this._createExercise.execute(user.id, dto));
  }

  @Patch(":id")
  @ApiOkResponse({ type: ExerciseDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateExerciseDto,
  ): Promise<ExerciseDto> {
    return ExerciseDto.fromEntity(await this._updateExercise.execute(id, user.id, dto));
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this._archiveExercise.execute(id, user.id);
  }
}

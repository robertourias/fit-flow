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
import { BodyMeasurementDto, CreateBodyMeasurementDto, UpdateBodyMeasurementDto } from "../application/dto/body-measurement.dto";
import { FindBodyMeasurementsQueryDto } from "../application/dto/find-body-measurements-query.dto";
import { CreateBodyMeasurementUseCase } from "../application/use-cases/create-body-measurement.use-case";
import { ListBodyMeasurementsUseCase } from "../application/use-cases/list-body-measurements.use-case";
import { GetBodyMeasurementUseCase } from "../application/use-cases/get-body-measurement.use-case";
import { UpdateBodyMeasurementUseCase } from "../application/use-cases/update-body-measurement.use-case";
import { DeleteBodyMeasurementUseCase } from "../application/use-cases/delete-body-measurement.use-case";

@ApiTags("body-measurements")
@ApiBearerAuth()
@Controller("body-measurements")
export class MeasurementsController {
  constructor(
    private readonly _create: CreateBodyMeasurementUseCase,
    private readonly _list: ListBodyMeasurementsUseCase,
    private readonly _get: GetBodyMeasurementUseCase,
    private readonly _update: UpdateBodyMeasurementUseCase,
    private readonly _delete: DeleteBodyMeasurementUseCase,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: BodyMeasurementDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBodyMeasurementDto,
  ): Promise<BodyMeasurementDto> {
    return this._create.execute(user.id, dto);
  }

  @Get()
  @ApiOkResponse({ type: [BodyMeasurementDto] })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindBodyMeasurementsQueryDto,
  ): Promise<PaginatedResponse<BodyMeasurementDto>> {
    const page = await this._list.execute(user.id, query);
    return { ...page, items: page.items.map((item) => BodyMeasurementDto.fromEntity(item)) };
  }

  @Get(":id")
  @ApiOkResponse({ type: BodyMeasurementDto })
  async get(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ): Promise<BodyMeasurementDto> {
    return this._get.execute(id, user.id);
  }

  @Patch(":id")
  @ApiOkResponse({ type: BodyMeasurementDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateBodyMeasurementDto,
  ): Promise<BodyMeasurementDto> {
    return this._update.execute(id, user.id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this._delete.execute(id, user.id);
  }
}

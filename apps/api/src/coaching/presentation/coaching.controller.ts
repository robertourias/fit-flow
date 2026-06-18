import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/jwt-auth.guard";
import {
  CreateStrategyDto,
  StrategySummaryDto,
} from "../../training/application/dto/strategy.dto";
import { CreateWorkoutDto, WorkoutDetailDto } from "../../training/application/dto/workout.dto";
import { DashboardSummaryDto } from "../../training/application/dto/dashboard-summary.dto";
import { RelationshipDto } from "../application/dto/relationship.dto";
import { InviteRelationshipDto } from "../application/dto/invite-relationship.dto";
import { RespondRelationshipDto } from "../application/dto/respond-relationship.dto";
import { FindRelationshipsQueryDto } from "../application/dto/find-relationships-query.dto";
import { InviteRelationshipUseCase } from "../application/use-cases/invite-relationship.use-case";
import { RespondRelationshipUseCase } from "../application/use-cases/respond-relationship.use-case";
import { RevokeRelationshipUseCase } from "../application/use-cases/revoke-relationship.use-case";
import { ListMyStudentsUseCase } from "../application/use-cases/list-my-students.use-case";
import { ListMyTrainersUseCase } from "../application/use-cases/list-my-trainers.use-case";
import { CreateStudentStrategyUseCase } from "../application/use-cases/create-student-strategy.use-case";
import { CreateStudentWorkoutUseCase } from "../application/use-cases/create-student-workout.use-case";
import { GetStudentDashboardUseCase } from "../application/use-cases/get-student-dashboard.use-case";

@ApiTags("coaching")
@ApiBearerAuth()
@Controller("coaching")
export class CoachingController {
  constructor(
    private readonly _inviteRelationship: InviteRelationshipUseCase,
    private readonly _respondRelationship: RespondRelationshipUseCase,
    private readonly _revokeRelationship: RevokeRelationshipUseCase,
    private readonly _listMyStudents: ListMyStudentsUseCase,
    private readonly _listMyTrainers: ListMyTrainersUseCase,
    private readonly _createStudentStrategy: CreateStudentStrategyUseCase,
    private readonly _createStudentWorkout: CreateStudentWorkoutUseCase,
    private readonly _getStudentDashboard: GetStudentDashboardUseCase,
  ) {}

  @Post("relationships")
  @ApiOperation({
    summary: "Convida um usuário (preparador ou aluno) pelo email para criar um vínculo",
    description:
      "Idempotente: convite duplicado com vínculo PENDING/ACTIVE retorna o vínculo existente.",
  })
  @ApiCreatedResponse({ type: RelationshipDto })
  @ApiResponse({ status: 400, description: "Regra de vínculo violada (FR-002/FR-005)" })
  @ApiResponse({ status: 404, description: "Email não encontrado" })
  async invite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteRelationshipDto,
  ): Promise<RelationshipDto> {
    return this._inviteRelationship.execute(user.id, dto.targetEmail);
  }

  @Get("students")
  @ApiOperation({ summary: "Lista os alunos do preparador autenticado" })
  @ApiOkResponse({ type: [RelationshipDto] })
  async listStudents(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindRelationshipsQueryDto,
  ): Promise<RelationshipDto[]> {
    return this._listMyStudents.execute(user.id, query.status);
  }

  @Get("trainers")
  @ApiOperation({ summary: "Lista os preparadores do aluno autenticado" })
  @ApiOkResponse({ type: [RelationshipDto] })
  async listTrainers(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: FindRelationshipsQueryDto,
  ): Promise<RelationshipDto[]> {
    return this._listMyTrainers.execute(user.id, query.status);
  }

  @Patch("relationships/:id")
  @ApiOperation({
    summary: "Responde (ACCEPT/REJECT) ou revoga (REVOKE) um vínculo",
  })
  @ApiOkResponse({ type: RelationshipDto })
  @ApiResponse({ status: 403, description: "Ação não permitida para o lado do usuário (FR-006)" })
  @ApiResponse({ status: 404, description: "Vínculo não encontrado ou usuário não participa dele" })
  @ApiResponse({ status: 409, description: "Transição de status inválida" })
  async respond(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: RespondRelationshipDto,
  ): Promise<RelationshipDto> {
    if (dto.action === "REVOKE") {
      return this._revokeRelationship.execute(user.id, id);
    }
    return this._respondRelationship.execute(user.id, id, dto.action);
  }

  @Get("students/:studentId/dashboard")
  @ApiOperation({ summary: "Dashboard de progresso de um aluno vinculado" })
  @ApiOkResponse({ type: DashboardSummaryDto })
  @ApiResponse({ status: 404, description: "Sem vínculo ACTIVE com o aluno" })
  async getStudentDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Param("studentId") studentId: string,
  ): Promise<DashboardSummaryDto> {
    return this._getStudentDashboard.execute(user.id, studentId);
  }

  @Post("students/:studentId/strategies")
  @ApiOperation({ summary: "Cria uma estratégia em nome de um aluno vinculado" })
  @ApiCreatedResponse({ type: StrategySummaryDto })
  @ApiResponse({ status: 404, description: "Sem vínculo ACTIVE com o aluno" })
  async createStudentStrategy(
    @CurrentUser() user: AuthenticatedUser,
    @Param("studentId") studentId: string,
    @Body() dto: CreateStrategyDto,
  ): Promise<StrategySummaryDto> {
    const strategy = await this._createStudentStrategy.execute(user.id, studentId, dto);
    return StrategySummaryDto.fromEntity(strategy);
  }

  @Post("students/:studentId/workouts")
  @ApiOperation({ summary: "Cria um treino em nome de um aluno vinculado" })
  @ApiCreatedResponse({ type: WorkoutDetailDto })
  @ApiResponse({ status: 404, description: "Sem vínculo ACTIVE com o aluno" })
  @ApiResponse({ status: 422, description: "Limite do plano FREE do aluno atingido" })
  async createStudentWorkout(
    @CurrentUser() user: AuthenticatedUser,
    @Param("studentId") studentId: string,
    @Body() dto: CreateWorkoutDto,
  ): Promise<WorkoutDetailDto> {
    const workout = await this._createStudentWorkout.execute(user.id, studentId, dto);
    return WorkoutDetailDto.fromEntity(workout);
  }
}

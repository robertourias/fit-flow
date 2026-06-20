import { Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { Public } from "../../common/auth/public.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { AuthenticatedUser } from "../../common/auth/jwt-auth.guard";
import { ListTemplatesUseCase } from "../application/use-cases/list-templates.use-case";
import { ImportTemplateUseCase } from "../application/use-cases/import-template.use-case";
import { StrategyTemplateDto } from "../application/dto/strategy-template.dto";

@ApiTags("explore")
@Controller("explore")
export class ExploreController {
  constructor(
    private readonly _listTemplates: ListTemplatesUseCase,
    private readonly _importTemplate: ImportTemplateUseCase,
  ) {}

  @Get("templates")
  @Public()
  @ApiOperation({ summary: "Lista todos os templates públicos de estratégia" })
  @ApiResponse({ status: 200, type: [StrategyTemplateDto] })
  async listTemplates(): Promise<StrategyTemplateDto[]> {
    return this._listTemplates.execute();
  }

  @Post("templates/:id/import")
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Importa template para o tenant do usuário autenticado" })
  async importTemplate(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this._importTemplate.execute(id, user.id);
  }
}

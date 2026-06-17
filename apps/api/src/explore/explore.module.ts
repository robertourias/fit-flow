import { Module } from "@nestjs/common";
import { TrainingModule } from "../training/training.module";
import { IdentityModule } from "../identity/identity.module";
import { ListTemplatesUseCase } from "./application/use-cases/list-templates.use-case";
import { ImportTemplateUseCase } from "./application/use-cases/import-template.use-case";
import { ExploreController } from "./presentation/explore.controller";

@Module({
  imports: [TrainingModule, IdentityModule],
  controllers: [ExploreController],
  providers: [ListTemplatesUseCase, ImportTemplateUseCase],
})
export class ExploreModule {}

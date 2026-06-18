import { NotFoundException } from "@nestjs/common";
import { GetStudentDashboardUseCase } from "../get-student-dashboard.use-case";
import { GetDashboardSummaryUseCase } from "../../../../training/application/use-cases/get-dashboard-summary.use-case";
import { DashboardSummaryDto } from "../../../../training/application/dto/dashboard-summary.dto";
import type { ITrainerStudentRelationshipRepository } from "../../../../identity/domain/repositories/trainer-student-relationship.repository.interface";

function makeDashboardSummary(): DashboardSummaryDto {
  const dto = new DashboardSummaryDto();
  dto.diasEstaSemana = 3;
  dto.treinosNoMes = 10;
  dto.treinosNoMesDelta = 2;
  dto.diasSequencia = 5;
  dto.volumeSemanal = 1000;
  dto.volumeData = [];
  dto.muscleGroups = [];
  dto.trainDates = [];
  dto.workoutsCount = 4;
  dto.durationData = [];
  dto.semanalDuracao = 120;
  dto.heatmapData = [];
  return dto;
}

function makeRelationshipRepo(): jest.Mocked<ITrainerStudentRelationshipRepository> {
  return {
    findById: jest.fn(),
    findByTrainerAndStudent: jest.fn(),
    findByStudent: jest.fn(),
    findByTrainer: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    trainerHasAccessToStudent: jest.fn(),
  };
}

function makeGetDashboardSummaryUseCase(): jest.Mocked<GetDashboardSummaryUseCase> {
  return {
    execute: jest.fn(),
  } as unknown as jest.Mocked<GetDashboardSummaryUseCase>;
}

describe("GetStudentDashboardUseCase", () => {
  it("throws NotFound when trainer has no active relationship with student (FR-008)", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const getDashboardSummary = makeGetDashboardSummaryUseCase();
    relationshipRepo.trainerHasAccessToStudent.mockResolvedValue(false);

    const useCase = new GetStudentDashboardUseCase(relationshipRepo, getDashboardSummary);

    await expect(useCase.execute("trainer-1", "student-1")).rejects.toThrow(NotFoundException);
    expect(getDashboardSummary.execute).not.toHaveBeenCalled();
  });

  it("delegates to GetDashboardSummaryUseCase using studentId as tenantId when access is granted (FR-010)", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const getDashboardSummary = makeGetDashboardSummaryUseCase();
    relationshipRepo.trainerHasAccessToStudent.mockResolvedValue(true);
    const summary = makeDashboardSummary();
    getDashboardSummary.execute.mockResolvedValue(summary);

    const useCase = new GetStudentDashboardUseCase(relationshipRepo, getDashboardSummary);
    const result = await useCase.execute("trainer-1", "student-1");

    expect(relationshipRepo.trainerHasAccessToStudent).toHaveBeenCalledWith(
      "trainer-1",
      "student-1",
    );
    expect(getDashboardSummary.execute).toHaveBeenCalledWith("student-1");
    expect(result).toBe(summary);
  });
});

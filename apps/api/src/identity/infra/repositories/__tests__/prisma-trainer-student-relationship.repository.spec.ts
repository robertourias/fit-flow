import { PrismaTrainerStudentRelationshipRepository } from "../prisma-trainer-student-relationship.repository";
import { RelationshipStatus } from "../../../domain/relationship-status.enum";
import { RelationshipInitiator } from "../../../domain/relationship-initiator.enum";

const mockRow = {
  id: "rel-1",
  trainerId: "trainer-1",
  studentId: "student-1",
  status: "PENDING",
  initiatedBy: "TRAINER",
  startedAt: new Date("2026-01-01"),
  endedAt: null,
};

jest.mock("@fitflow/db", () => ({
  prisma: {
    trainerStudentRelationship: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
  Prisma: {},
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { prisma } = require("@fitflow/db");

describe("PrismaTrainerStudentRelationshipRepository", () => {
  let repo: PrismaTrainerStudentRelationshipRepository;

  beforeEach(() => {
    repo = new PrismaTrainerStudentRelationshipRepository();
    jest.clearAllMocks();
  });

  describe("findById()", () => {
    it("returns mapped relationship when found", async () => {
      prisma.trainerStudentRelationship.findUnique.mockResolvedValue(mockRow);
      const rel = await repo.findById("rel-1");
      expect(rel?.id).toBe("rel-1");
      expect(rel?.initiatedBy).toBe(RelationshipInitiator.TRAINER);
      expect(prisma.trainerStudentRelationship.findUnique).toHaveBeenCalledWith({
        where: { id: "rel-1" },
      });
    });

    it("returns null when not found", async () => {
      prisma.trainerStudentRelationship.findUnique.mockResolvedValue(null);
      const rel = await repo.findById("missing");
      expect(rel).toBeNull();
    });
  });

  describe("findByTrainerAndStudent()", () => {
    it("queries by composite unique key", async () => {
      prisma.trainerStudentRelationship.findUnique.mockResolvedValue(mockRow);
      await repo.findByTrainerAndStudent("trainer-1", "student-1");
      expect(prisma.trainerStudentRelationship.findUnique).toHaveBeenCalledWith({
        where: { trainerId_studentId: { trainerId: "trainer-1", studentId: "student-1" } },
      });
    });
  });

  describe("findByStudent() / findByTrainer()", () => {
    it("filters by status when provided", async () => {
      prisma.trainerStudentRelationship.findMany.mockResolvedValue([mockRow]);
      await repo.findByStudent("student-1", RelationshipStatus.ACTIVE);
      expect(prisma.trainerStudentRelationship.findMany).toHaveBeenCalledWith({
        where: { studentId: "student-1", status: RelationshipStatus.ACTIVE },
      });
    });

    it("omits status filter when not provided", async () => {
      prisma.trainerStudentRelationship.findMany.mockResolvedValue([mockRow]);
      await repo.findByTrainer("trainer-1");
      expect(prisma.trainerStudentRelationship.findMany).toHaveBeenCalledWith({
        where: { trainerId: "trainer-1" },
      });
    });
  });

  describe("create()", () => {
    it("persists initiatedBy alongside trainerId/studentId", async () => {
      prisma.trainerStudentRelationship.create.mockResolvedValue(mockRow);
      const rel = await repo.create("trainer-1", "student-1", RelationshipInitiator.TRAINER);
      expect(prisma.trainerStudentRelationship.create).toHaveBeenCalledWith({
        data: {
          trainerId: "trainer-1",
          studentId: "student-1",
          initiatedBy: RelationshipInitiator.TRAINER,
        },
      });
      expect(rel.initiatedBy).toBe(RelationshipInitiator.TRAINER);
    });

    it("supports STUDENT as initiator", async () => {
      prisma.trainerStudentRelationship.create.mockResolvedValue({
        ...mockRow,
        initiatedBy: "STUDENT",
      });
      const rel = await repo.create("trainer-1", "student-1", RelationshipInitiator.STUDENT);
      expect(rel.initiatedBy).toBe(RelationshipInitiator.STUDENT);
    });
  });

  describe("updateStatus()", () => {
    it("sets endedAt when status is REVOKED", async () => {
      prisma.trainerStudentRelationship.update.mockResolvedValue({
        ...mockRow,
        status: "REVOKED",
        endedAt: new Date("2026-02-01"),
      });
      await repo.updateStatus("rel-1", RelationshipStatus.REVOKED);
      expect(prisma.trainerStudentRelationship.update).toHaveBeenCalledWith({
        where: { id: "rel-1" },
        data: { status: RelationshipStatus.REVOKED, endedAt: expect.any(Date) },
      });
    });

    it("does not set endedAt for ACTIVE status", async () => {
      prisma.trainerStudentRelationship.update.mockResolvedValue({
        ...mockRow,
        status: "ACTIVE",
      });
      await repo.updateStatus("rel-1", RelationshipStatus.ACTIVE);
      expect(prisma.trainerStudentRelationship.update).toHaveBeenCalledWith({
        where: { id: "rel-1" },
        data: { status: RelationshipStatus.ACTIVE },
      });
    });
  });

  describe("trainerHasAccessToStudent()", () => {
    it("returns true when relationship is ACTIVE", async () => {
      prisma.trainerStudentRelationship.findUnique.mockResolvedValue({ status: "ACTIVE" });
      expect(await repo.trainerHasAccessToStudent("trainer-1", "student-1")).toBe(true);
    });

    it("returns false when relationship is PENDING", async () => {
      prisma.trainerStudentRelationship.findUnique.mockResolvedValue({ status: "PENDING" });
      expect(await repo.trainerHasAccessToStudent("trainer-1", "student-1")).toBe(false);
    });

    it("returns false when relationship does not exist", async () => {
      prisma.trainerStudentRelationship.findUnique.mockResolvedValue(null);
      expect(await repo.trainerHasAccessToStudent("trainer-1", "student-1")).toBe(false);
    });
  });
});

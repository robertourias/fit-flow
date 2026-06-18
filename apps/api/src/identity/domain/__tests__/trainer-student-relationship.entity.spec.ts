import { TrainerStudentRelationship } from "../trainer-student-relationship.entity";
import { RelationshipStatus } from "../relationship-status.enum";
import { RelationshipInitiator } from "../relationship-initiator.enum";

const base = {
  id: "rel-1",
  trainerId: "trainer-1",
  studentId: "student-1",
  status: RelationshipStatus.PENDING,
  initiatedBy: RelationshipInitiator.TRAINER,
  startedAt: new Date("2026-01-01"),
};

describe("TrainerStudentRelationship entity", () => {
  it("exposes all props via getters", () => {
    const rel = new TrainerStudentRelationship({ ...base, endedAt: null });
    expect(rel.id).toBe("rel-1");
    expect(rel.trainerId).toBe("trainer-1");
    expect(rel.studentId).toBe("student-1");
    expect(rel.status).toBe(RelationshipStatus.PENDING);
    expect(rel.initiatedBy).toBe(RelationshipInitiator.TRAINER);
    expect(rel.startedAt).toEqual(new Date("2026-01-01"));
    expect(rel.endedAt).toBeNull();
  });

  describe("isActive()", () => {
    it("returns true when status is ACTIVE", () => {
      const rel = new TrainerStudentRelationship({ ...base, status: RelationshipStatus.ACTIVE });
      expect(rel.isActive()).toBe(true);
    });

    it("returns false when status is PENDING", () => {
      const rel = new TrainerStudentRelationship({ ...base, status: RelationshipStatus.PENDING });
      expect(rel.isActive()).toBe(false);
    });

    it("returns false when status is REVOKED", () => {
      const rel = new TrainerStudentRelationship({ ...base, status: RelationshipStatus.REVOKED });
      expect(rel.isActive()).toBe(false);
    });
  });

  describe("wasInitiatedBy()", () => {
    it("returns true for trainerId when initiatedBy is TRAINER", () => {
      const rel = new TrainerStudentRelationship({
        ...base,
        initiatedBy: RelationshipInitiator.TRAINER,
      });
      expect(rel.wasInitiatedBy("trainer-1")).toBe(true);
      expect(rel.wasInitiatedBy("student-1")).toBe(false);
    });

    it("returns true for studentId when initiatedBy is STUDENT", () => {
      const rel = new TrainerStudentRelationship({
        ...base,
        initiatedBy: RelationshipInitiator.STUDENT,
      });
      expect(rel.wasInitiatedBy("student-1")).toBe(true);
      expect(rel.wasInitiatedBy("trainer-1")).toBe(false);
    });

    it("returns false for an unrelated userId", () => {
      const rel = new TrainerStudentRelationship({ ...base });
      expect(rel.wasInitiatedBy("someone-else")).toBe(false);
    });
  });
});

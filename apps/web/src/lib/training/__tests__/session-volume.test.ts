import { computeSessionVolume } from "../session-volume";
import type { SessionExerciseDto } from "@fitflow/types";

function buildExercise(overrides: Partial<SessionExerciseDto> = {}): SessionExerciseDto {
  return {
    id: "exercise-1",
    exerciseId: "ex-1",
    order: 1,
    notes: null,
    executedSets: [],
    ...overrides,
  };
}

describe("computeSessionVolume", () => {
  it("returns 0 for an empty list of exercises", () => {
    expect(computeSessionVolume([])).toBe(0);
  });

  it("sums sets for a single exercise, treating kg = null as 0", () => {
    const exercises: SessionExerciseDto[] = [
      buildExercise({
        executedSets: [
          { id: "set-1", setNumber: 1, kg: 10, reps: 10, completedAt: null },
          { id: "set-2", setNumber: 2, kg: null, reps: 12, completedAt: null },
          { id: "set-3", setNumber: 3, kg: 20, reps: 5, completedAt: null },
        ],
      }),
    ];

    // set-1: 10 * 10 = 100
    // set-2: null kg -> 0 * 12 = 0
    // set-3: 20 * 5 = 100
    expect(computeSessionVolume(exercises)).toBe(200);
  });

  it("sums volume across multiple exercises", () => {
    const exercises: SessionExerciseDto[] = [
      buildExercise({
        id: "exercise-1",
        executedSets: [{ id: "set-1", setNumber: 1, kg: 10, reps: 10, completedAt: null }],
      }),
      buildExercise({
        id: "exercise-2",
        executedSets: [
          { id: "set-2", setNumber: 1, kg: 5, reps: 8, completedAt: null },
          { id: "set-3", setNumber: 2, kg: null, reps: null, completedAt: null },
        ],
      }),
    ];

    // exercise-1: 10 * 10 = 100
    // exercise-2: 5 * 8 = 40, plus null/null -> 0
    expect(computeSessionVolume(exercises)).toBe(140);
  });
});

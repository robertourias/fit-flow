import {
  workoutFormSchema,
  toCreateWorkoutDto,
  toUpdateWorkoutDto,
  type WorkoutFormValues,
} from "../workout-form.schema";
import type { ExerciseDto } from "@fitflow/types";

/**
 * Helper to create a minimal ExerciseDto for testing
 */
function createMockExercise(id: string, name: string): ExerciseDto {
  return {
    id,
    name,
    description: null,
    imageUrl: null,
    videoUrl: null,
    category: "STRENGTH",
    isArchived: false,
    tenantId: null,
    muscleGroups: [],
    equipment: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Helper to create a sample WorkoutFormValues fixture
 */
function createSampleWorkoutFormValues(): WorkoutFormValues {
  return {
    name: "Upper Body A",
    description: "Upper body strength day",
    exercises: [
      {
        exerciseId: "ex-1",
        restSeconds: 120,
        notes: "Go heavy",
        plannedSets: [
          { targetReps: "5", targetKg: "100" },
          { targetReps: "5", targetKg: "100" },
        ],
        _exercise: createMockExercise("ex-1", "Bench Press"),
      },
      {
        exerciseId: "ex-2",
        restSeconds: 90,
        notes: undefined,
        plannedSets: [
          { targetReps: "8", targetKg: "50" },
          { targetReps: "8", targetKg: "50" },
        ],
        _exercise: createMockExercise("ex-2", "Barbell Rows"),
      },
    ],
  };
}

describe("workoutFormSchema", () => {
  it("should validate a correct workout form", () => {
    const values = createSampleWorkoutFormValues();
    const result = workoutFormSchema.safeParse(values);

    expect(result.success).toBe(true);
  });

  it("should reject when exercises array is empty", () => {
    const values = createSampleWorkoutFormValues();
    values.exercises = [];

    const result = workoutFormSchema.safeParse(values);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("exercises"))).toBe(true);
    }
  });

  it("should reject when plannedSets array is empty", () => {
    const values = createSampleWorkoutFormValues();
    values.exercises[0].plannedSets = [];

    const result = workoutFormSchema.safeParse(values);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("plannedSets"))).toBe(true);
    }
  });

  it("should apply restSeconds default of 90 when omitted", () => {
    const input = {
      name: "Test Workout",
      exercises: [
        {
          exerciseId: "ex-1",
          notes: "test",
          plannedSets: [{ targetReps: "5" }],
          _exercise: createMockExercise("ex-1", "Test Exercise"),
        },
      ],
    };

    const result = workoutFormSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exercises[0].restSeconds).toBe(90);
    }
  });

  it("should accept optional description", () => {
    const values = createSampleWorkoutFormValues();
    values.description = undefined;

    const result = workoutFormSchema.safeParse(values);

    expect(result.success).toBe(true);
  });

  it("should accept optional targetKg in plannedSet", () => {
    const values = createSampleWorkoutFormValues();
    values.exercises[0].plannedSets[0].targetKg = undefined;

    const result = workoutFormSchema.safeParse(values);

    expect(result.success).toBe(true);
  });

  it("should reject when name is empty", () => {
    const values = createSampleWorkoutFormValues();
    values.name = "";

    const result = workoutFormSchema.safeParse(values);

    expect(result.success).toBe(false);
  });

  it("should reject when targetReps is empty", () => {
    const values = createSampleWorkoutFormValues();
    values.exercises[0].plannedSets[0].targetReps = "";

    const result = workoutFormSchema.safeParse(values);

    expect(result.success).toBe(false);
  });
});

describe("toCreateWorkoutDto", () => {
  it("should convert form values to CreateWorkoutDto with strategyId and order", () => {
    const values = createSampleWorkoutFormValues();
    const strategyId = "strategy-1";
    const order = 3;

    const result = toCreateWorkoutDto(values, strategyId, order);

    expect(result.strategyId).toBe("strategy-1");
    expect(result.order).toBe(3);
  });

  it("should derive exercise order from array index", () => {
    const values = createSampleWorkoutFormValues();

    const result = toCreateWorkoutDto(values, "strategy-1", 0);

    expect(result.exercises[0].order).toBe(0);
    expect(result.exercises[1].order).toBe(1);
  });

  it("should derive setNumber from array index (1-based)", () => {
    const values = createSampleWorkoutFormValues();

    const result = toCreateWorkoutDto(values, "strategy-1", 0);

    expect(result.exercises[0].plannedSets[0].setNumber).toBe(1);
    expect(result.exercises[0].plannedSets[1].setNumber).toBe(2);
    expect(result.exercises[1].plannedSets[0].setNumber).toBe(1);
    expect(result.exercises[1].plannedSets[1].setNumber).toBe(2);
  });

  it("should strip _exercise field from result", () => {
    const values = createSampleWorkoutFormValues();

    const result = toCreateWorkoutDto(values, "strategy-1", 0);

    expect(result.exercises[0]).not.toHaveProperty("_exercise");
    expect(result.exercises[1]).not.toHaveProperty("_exercise");
  });

  it("should preserve exercise attributes like restSeconds and notes", () => {
    const values = createSampleWorkoutFormValues();

    const result = toCreateWorkoutDto(values, "strategy-1", 0);

    expect(result.exercises[0].restSeconds).toBe(120);
    expect(result.exercises[0].notes).toBe("Go heavy");
    expect(result.exercises[1].restSeconds).toBe(90);
    expect(result.exercises[1].notes).toBeUndefined();
  });

  it("should preserve plannedSet attributes like targetReps and targetKg", () => {
    const values = createSampleWorkoutFormValues();

    const result = toCreateWorkoutDto(values, "strategy-1", 0);

    expect(result.exercises[0].plannedSets[0].targetReps).toBe("5");
    expect(result.exercises[0].plannedSets[0].targetKg).toBe("100");
  });

  it("should preserve workout name and description", () => {
    const values = createSampleWorkoutFormValues();

    const result = toCreateWorkoutDto(values, "strategy-1", 0);

    expect(result.name).toBe("Upper Body A");
    expect(result.description).toBe("Upper body strength day");
  });

  it("should handle undefined description", () => {
    const values = createSampleWorkoutFormValues();
    values.description = undefined;

    const result = toCreateWorkoutDto(values, "strategy-1", 0);

    expect(result.description).toBeUndefined();
  });

  it("should handle undefined targetKg in plannedSet", () => {
    const values = createSampleWorkoutFormValues();
    values.exercises[0].plannedSets[0].targetKg = undefined;

    const result = toCreateWorkoutDto(values, "strategy-1", 0);

    expect(result.exercises[0].plannedSets[0].targetKg).toBeUndefined();
  });
});

describe("toUpdateWorkoutDto", () => {
  it("should convert form values to UpdateWorkoutDto without strategyId and order", () => {
    const values = createSampleWorkoutFormValues();

    const result = toUpdateWorkoutDto(values);

    expect(result).not.toHaveProperty("strategyId");
    expect(result).not.toHaveProperty("order");
  });

  it("should derive exercise order from array index", () => {
    const values = createSampleWorkoutFormValues();

    const result = toUpdateWorkoutDto(values);

    expect(result.exercises![0].order).toBe(0);
    expect(result.exercises![1].order).toBe(1);
  });

  it("should derive setNumber from array index (1-based)", () => {
    const values = createSampleWorkoutFormValues();

    const result = toUpdateWorkoutDto(values);

    expect(result.exercises![0].plannedSets[0].setNumber).toBe(1);
    expect(result.exercises![0].plannedSets[1].setNumber).toBe(2);
    expect(result.exercises![1].plannedSets[0].setNumber).toBe(1);
    expect(result.exercises![1].plannedSets[1].setNumber).toBe(2);
  });

  it("should strip _exercise field from result", () => {
    const values = createSampleWorkoutFormValues();

    const result = toUpdateWorkoutDto(values);

    expect(result.exercises![0]).not.toHaveProperty("_exercise");
    expect(result.exercises![1]).not.toHaveProperty("_exercise");
  });

  it("should preserve exercise attributes like restSeconds and notes", () => {
    const values = createSampleWorkoutFormValues();

    const result = toUpdateWorkoutDto(values);

    expect(result.exercises![0].restSeconds).toBe(120);
    expect(result.exercises![0].notes).toBe("Go heavy");
    expect(result.exercises![1].restSeconds).toBe(90);
    expect(result.exercises![1].notes).toBeUndefined();
  });

  it("should preserve plannedSet attributes like targetReps and targetKg", () => {
    const values = createSampleWorkoutFormValues();

    const result = toUpdateWorkoutDto(values);

    expect(result.exercises![0].plannedSets[0].targetReps).toBe("5");
    expect(result.exercises![0].plannedSets[0].targetKg).toBe("100");
  });

  it("should preserve workout name and description", () => {
    const values = createSampleWorkoutFormValues();

    const result = toUpdateWorkoutDto(values);

    expect(result.name).toBe("Upper Body A");
    expect(result.description).toBe("Upper body strength day");
  });

  it("should handle undefined description", () => {
    const values = createSampleWorkoutFormValues();
    values.description = undefined;

    const result = toUpdateWorkoutDto(values);

    expect(result.description).toBeUndefined();
  });

  it("should handle undefined targetKg in plannedSet", () => {
    const values = createSampleWorkoutFormValues();
    values.exercises[0].plannedSets[0].targetKg = undefined;

    const result = toUpdateWorkoutDto(values);

    expect(result.exercises![0].plannedSets[0].targetKg).toBeUndefined();
  });
});

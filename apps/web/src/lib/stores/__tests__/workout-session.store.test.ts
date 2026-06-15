import { useWorkoutSessionStore } from "../workout-session.store";

describe("useWorkoutSessionStore", () => {
  beforeEach(() => {
    useWorkoutSessionStore.getState().resetSession();
  });

  describe("startSession", () => {
    it("seeds exercises from exerciseIds in order with empty notes and sets", () => {
      useWorkoutSessionStore.getState().startSession("workout-1", ["ex-a", "ex-b", "ex-c"]);

      const state = useWorkoutSessionStore.getState();
      expect(state.status).toBe("active");
      expect(state.workoutId).toBe("workout-1");
      expect(state.currentExerciseIndex).toBe(0);
      expect(state.restEndsAt).toBeNull();
      expect(state.exercises).toEqual([
        { exerciseId: "ex-a", notes: "", sets: [] },
        { exerciseId: "ex-b", notes: "", sets: [] },
        { exerciseId: "ex-c", notes: "", sets: [] },
      ]);
    });

    it("sets startedAt to an ISO timestamp", () => {
      useWorkoutSessionStore.getState().startSession("workout-1", ["ex-a"]);

      const { startedAt } = useWorkoutSessionStore.getState();
      expect(startedAt).not.toBeNull();
      expect(new Date(startedAt as string).toISOString()).toBe(startedAt);
    });

    it("handles an empty exerciseIds array", () => {
      useWorkoutSessionStore.getState().startSession("workout-1", []);

      expect(useWorkoutSessionStore.getState().exercises).toEqual([]);
    });

    it("resets currentExerciseIndex and restEndsAt from a previous session", () => {
      useWorkoutSessionStore.getState().startSession("workout-1", ["ex-a", "ex-b"]);
      useWorkoutSessionStore.getState().setCurrentExercise(1);
      useWorkoutSessionStore.getState().setRestTimer("2026-06-15T12:00:00.000Z");

      useWorkoutSessionStore.getState().startSession("workout-2", ["ex-c"]);

      const state = useWorkoutSessionStore.getState();
      expect(state.workoutId).toBe("workout-2");
      expect(state.currentExerciseIndex).toBe(0);
      expect(state.restEndsAt).toBeNull();
      expect(state.exercises).toEqual([{ exerciseId: "ex-c", notes: "", sets: [] }]);
    });
  });

  describe("completeSet", () => {
    beforeEach(() => {
      useWorkoutSessionStore.getState().startSession("workout-1", ["ex-a", "ex-b"]);
    });

    it("adds a completed set with kg/reps and completedAt", () => {
      useWorkoutSessionStore.getState().completeSet(0, 1, 80, 8);

      const ex = useWorkoutSessionStore.getState().exercises[0];
      expect(ex.sets).toHaveLength(1);
      expect(ex.sets[0].setNumber).toBe(1);
      expect(ex.sets[0].kg).toBe(80);
      expect(ex.sets[0].reps).toBe(8);
      expect(ex.sets[0].completedAt).toBeTruthy();
    });

    it("replaces an existing set with the same setNumber", () => {
      useWorkoutSessionStore.getState().completeSet(0, 1, 80, 8);
      useWorkoutSessionStore.getState().completeSet(0, 1, 85, 6);

      const ex = useWorkoutSessionStore.getState().exercises[0];
      expect(ex.sets).toHaveLength(1);
      expect(ex.sets[0].kg).toBe(85);
      expect(ex.sets[0].reps).toBe(6);
    });

    it("keeps sets sorted by setNumber", () => {
      useWorkoutSessionStore.getState().completeSet(0, 2, 80, 8);
      useWorkoutSessionStore.getState().completeSet(0, 1, 80, 8);

      const ex = useWorkoutSessionStore.getState().exercises[0];
      expect(ex.sets.map((s) => s.setNumber)).toEqual([1, 2]);
    });

    it("only affects the targeted exercise", () => {
      useWorkoutSessionStore.getState().completeSet(0, 1, 80, 8);

      expect(useWorkoutSessionStore.getState().exercises[1].sets).toEqual([]);
    });

    it("allows completing a set without kg/reps", () => {
      useWorkoutSessionStore.getState().completeSet(0, 1);

      const ex = useWorkoutSessionStore.getState().exercises[0];
      expect(ex.sets[0].kg).toBeUndefined();
      expect(ex.sets[0].reps).toBeUndefined();
      expect(ex.sets[0].completedAt).toBeTruthy();
    });
  });

  describe("rest timer", () => {
    it("setRestTimer sets restEndsAt", () => {
      useWorkoutSessionStore.getState().setRestTimer("2026-06-15T12:05:00.000Z");
      expect(useWorkoutSessionStore.getState().restEndsAt).toBe("2026-06-15T12:05:00.000Z");
    });

    it("clearRest resets restEndsAt to null", () => {
      useWorkoutSessionStore.getState().setRestTimer("2026-06-15T12:05:00.000Z");
      useWorkoutSessionStore.getState().clearRest();
      expect(useWorkoutSessionStore.getState().restEndsAt).toBeNull();
    });
  });

  describe("setCurrentExercise", () => {
    it("updates currentExerciseIndex", () => {
      useWorkoutSessionStore.getState().startSession("workout-1", ["ex-a", "ex-b", "ex-c"]);
      useWorkoutSessionStore.getState().setCurrentExercise(2);
      expect(useWorkoutSessionStore.getState().currentExerciseIndex).toBe(2);
    });
  });

  describe("updateNote", () => {
    it("updates the note for the targeted exercise only", () => {
      useWorkoutSessionStore.getState().startSession("workout-1", ["ex-a", "ex-b"]);
      useWorkoutSessionStore.getState().updateNote(1, "Senti dor no ombro");

      const state = useWorkoutSessionStore.getState();
      expect(state.exercises[0].notes).toBe("");
      expect(state.exercises[1].notes).toBe("Senti dor no ombro");
    });
  });

  describe("addExecutedSet", () => {
    it("appends a new set with the next setNumber", () => {
      useWorkoutSessionStore.getState().startSession("workout-1", ["ex-a"]);
      useWorkoutSessionStore.getState().addExecutedSet(0);
      useWorkoutSessionStore.getState().addExecutedSet(0);

      const ex = useWorkoutSessionStore.getState().exercises[0];
      expect(ex.sets).toEqual([{ setNumber: 1 }, { setNumber: 2 }]);
    });

    it("computes nextSetNumber after sets already completed", () => {
      useWorkoutSessionStore.getState().startSession("workout-1", ["ex-a"]);
      useWorkoutSessionStore.getState().completeSet(0, 1, 80, 8);
      useWorkoutSessionStore.getState().addExecutedSet(0);

      const ex = useWorkoutSessionStore.getState().exercises[0];
      expect(ex.sets[ex.sets.length - 1]).toEqual({ setNumber: 2 });
    });
  });

  describe("beginFinishing", () => {
    it("sets status to finishing", () => {
      useWorkoutSessionStore.getState().startSession("workout-1", ["ex-a"]);
      useWorkoutSessionStore.getState().beginFinishing();
      expect(useWorkoutSessionStore.getState().status).toBe("finishing");
    });
  });

  describe("resetSession", () => {
    it("restores the initial state", () => {
      useWorkoutSessionStore.getState().startSession("workout-1", ["ex-a", "ex-b"]);
      useWorkoutSessionStore.getState().completeSet(0, 1, 80, 8);
      useWorkoutSessionStore.getState().setRestTimer("2026-06-15T12:05:00.000Z");
      useWorkoutSessionStore.getState().setCurrentExercise(1);

      useWorkoutSessionStore.getState().resetSession();

      expect(useWorkoutSessionStore.getState()).toMatchObject({
        status: "idle",
        workoutId: null,
        startedAt: null,
        currentExerciseIndex: 0,
        exercises: [],
        restEndsAt: null,
      });
    });
  });
});

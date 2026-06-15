import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SessionStatus = "idle" | "active" | "finishing";

export interface ExecutedSet {
  setNumber: number;
  kg?: number;
  reps?: number;
  completedAt?: string;
}

export interface ExecutedExercise {
  exerciseId: string;
  notes: string;
  sets: ExecutedSet[];
}

interface WorkoutSessionState {
  status: SessionStatus;
  workoutId: string | null;
  startedAt: string | null;
  currentExerciseIndex: number;
  exercises: ExecutedExercise[];
  restEndsAt: string | null;
}

interface WorkoutSessionActions {
  startSession: (workoutId: string, exerciseIds: string[]) => void;
  completeSet: (exerciseIdx: number, setNumber: number, kg?: number, reps?: number) => void;
  setRestTimer: (endsAt: string) => void;
  clearRest: () => void;
  setCurrentExercise: (idx: number) => void;
  updateNote: (exerciseIdx: number, note: string) => void;
  addExecutedSet: (exerciseIdx: number) => void;
  beginFinishing: () => void;
  resetSession: () => void;
}

export type WorkoutSessionStore = WorkoutSessionState & WorkoutSessionActions;

const initialState: WorkoutSessionState = {
  status: "idle",
  workoutId: null,
  startedAt: null,
  currentExerciseIndex: 0,
  exercises: [],
  restEndsAt: null,
};

export const useWorkoutSessionStore = create<WorkoutSessionStore>()(
  persist(
    (set) => ({
      ...initialState,

      startSession: (workoutId, exerciseIds) =>
        set({
          status: "active",
          workoutId,
          startedAt: new Date().toISOString(),
          currentExerciseIndex: 0,
          restEndsAt: null,
          exercises: exerciseIds.map((exerciseId) => ({
            exerciseId,
            notes: "",
            sets: [],
          })),
        }),

      completeSet: (exerciseIdx, setNumber, kg, reps) =>
        set((state) => ({
          exercises: state.exercises.map((ex, i) => {
            if (i !== exerciseIdx) return ex;
            const completedSet: ExecutedSet = {
              setNumber,
              kg,
              reps,
              completedAt: new Date().toISOString(),
            };
            const sets = ex.sets.filter((s) => s.setNumber !== setNumber);
            return { ...ex, sets: [...sets, completedSet].sort((a, b) => a.setNumber - b.setNumber) };
          }),
        })),

      setRestTimer: (endsAt) => set({ restEndsAt: endsAt }),

      clearRest: () => set({ restEndsAt: null }),

      setCurrentExercise: (idx) => set({ currentExerciseIndex: idx }),

      updateNote: (exerciseIdx, note) =>
        set((state) => ({
          exercises: state.exercises.map((ex, i) =>
            i === exerciseIdx ? { ...ex, notes: note } : ex
          ),
        })),

      addExecutedSet: (exerciseIdx) =>
        set((state) => ({
          exercises: state.exercises.map((ex, i) => {
            if (i !== exerciseIdx) return ex;
            const nextSetNumber = ex.sets.length + 1;
            return { ...ex, sets: [...ex.sets, { setNumber: nextSetNumber }] };
          }),
        })),

      beginFinishing: () => set({ status: "finishing" }),

      resetSession: () => set(initialState),
    }),
    {
      name: "fitflow-workout-session",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        return localStorage;
      }),
      partialize: (state) => ({
        status: state.status,
        workoutId: state.workoutId,
        startedAt: state.startedAt,
        currentExerciseIndex: state.currentExerciseIndex,
        exercises: state.exercises,
        restEndsAt: state.restEndsAt,
      }),
    }
  )
);

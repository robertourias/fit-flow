/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { WorkoutActiveSession } from "../WorkoutActiveSession";
import { useWorkoutSessionStore } from "@/lib/stores/workout-session.store";
import type { WorkoutSessionStore } from "@/lib/stores/workout-session.store";
import type { ExerciseDto, WorkoutDetailDto, WorkoutSessionDetailDto } from "@fitflow/types";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/lib/stores/workout-session.store", () => ({
  useWorkoutSessionStore: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseWorkoutSessionStore = useWorkoutSessionStore as unknown as jest.MockedFunction<
  typeof useWorkoutSessionStore
>;

const EXERCISE_FIXTURES: ExerciseDto[] = [
  {
    id: "ex-1",
    name: "Supino reto",
    description: null,
    imageUrl: "https://example.com/supino.jpg",
    videoUrl: null,
    category: "STRENGTH",
    isArchived: false,
    tenantId: null,
    muscleGroups: [
      { id: "mg-1", name: "Peito", slug: "peito", isPrimary: true },
      { id: "mg-2", name: "Tríceps", slug: "triceps", isPrimary: false },
    ],
    equipment: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "ex-2",
    name: "Remada curvada",
    description: null,
    imageUrl: null,
    videoUrl: null,
    category: "STRENGTH",
    isArchived: false,
    tenantId: null,
    muscleGroups: [{ id: "mg-3", name: "Costas", slug: "costas", isPrimary: true }],
    equipment: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
];

const WORKOUT_FIXTURE: WorkoutDetailDto = {
  id: "workout-1",
  strategyId: "strategy-1",
  name: "Treino A",
  description: null,
  order: 0,
  exercises: [
    {
      id: "we-2",
      exerciseId: "ex-2",
      order: 1,
      restSeconds: 60,
      notes: null,
      plannedSets: [{ id: "ps-3", setNumber: 1, targetReps: "10", targetKg: null }],
    },
    {
      id: "we-1",
      exerciseId: "ex-1",
      order: 0,
      restSeconds: 90,
      notes: null,
      plannedSets: [
        { id: "ps-1", setNumber: 1, targetReps: "8-12", targetKg: "20" },
        { id: "ps-2", setNumber: 2, targetReps: "8-12", targetKg: "20" },
      ],
    },
  ],
  createdAt: "2026-06-13T00:00:00.000Z",
  updatedAt: "2026-06-13T00:00:00.000Z",
};

const LAST_SESSION_FIXTURE: WorkoutSessionDetailDto = {
  id: "session-1",
  workoutId: "workout-1",
  workoutName: "Treino A",
  startedAt: "2026-06-01T10:00:00.000Z",
  endedAt: "2026-06-01T11:00:00.000Z",
  status: "FINISHED",
  comment: null,
  difficulty: null,
  createdAt: "2026-06-01T10:00:00.000Z",
  exercises: [
    {
      id: "se-1",
      exerciseId: "ex-1",
      order: 0,
      notes: null,
      executedSets: [
        { id: "es-1", setNumber: 1, kg: 22.5, reps: 10, completedAt: "2026-06-01T10:05:00.000Z" },
        { id: "es-2", setNumber: 2, kg: 22.5, reps: 8, completedAt: "2026-06-01T10:08:00.000Z" },
      ],
    },
  ],
};

function buildStoreState(overrides: Partial<WorkoutSessionStore> = {}): WorkoutSessionStore {
  return {
    status: "active",
    workoutId: "workout-1",
    startedAt: "2026-06-15T10:00:00.000Z",
    currentExerciseIndex: 0,
    exercises: [
      { exerciseId: "ex-1", notes: "", sets: [] },
      { exerciseId: "ex-2", notes: "", sets: [] },
    ],
    restEndsAt: null,
    startSession: jest.fn(),
    completeSet: jest.fn(),
    setRestTimer: jest.fn(),
    clearRest: jest.fn(),
    setCurrentExercise: jest.fn(),
    updateNote: jest.fn(),
    addExecutedSet: jest.fn(),
    beginFinishing: jest.fn(),
    resetSession: jest.fn(),
    ...overrides,
  };
}

describe("WorkoutActiveSession", () => {
  const push = jest.fn();
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push,
      replace,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it('shows "—" in the "Anterior" column when there is no lastSession', () => {
    mockUseWorkoutSessionStore.mockReturnValue(buildStoreState());

    render(
      <WorkoutActiveSession workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    // currentExerciseIndex 0 → sortedExercises[0] = we-1 (order 0, ex-1), 2 planned sets
    const cells = screen.getAllByText("—");
    expect(cells.length).toBeGreaterThanOrEqual(2);
  });

  it('shows "kg × reps" from the previous session in the "Anterior" column when lastSession is present', () => {
    mockUseWorkoutSessionStore.mockReturnValue(buildStoreState());

    render(
      <WorkoutActiveSession
        workout={WORKOUT_FIXTURE}
        exercises={EXERCISE_FIXTURES}
        lastSession={LAST_SESSION_FIXTURE}
      />
    );

    expect(screen.getByText("22.5kg × 10")).toBeInTheDocument();
    expect(screen.getByText("22.5kg × 8")).toBeInTheDocument();
  });

  it("marks a set as completed calling completeSet and setRestTimer with the exercise's restSeconds", async () => {
    const completeSet = jest.fn();
    const setRestTimer = jest.fn();
    mockUseWorkoutSessionStore.mockReturnValue(
      buildStoreState({ completeSet, setRestTimer })
    );

    render(
      <WorkoutActiveSession workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    const completeButtons = screen.getAllByRole("button", { name: "Marcar como concluída" });
    await userEvent.click(completeButtons[0]);

    expect(completeSet).toHaveBeenCalledWith(0, 1, undefined, undefined);
    expect(setRestTimer).toHaveBeenCalledTimes(1);
    // restSeconds for we-1 (order 0, current exercise) is 90
    const [calledWith] = setRestTimer.mock.calls[0];
    const endsAt = new Date(calledWith).getTime();
    expect(endsAt).toBeGreaterThan(Date.now() + 89_000);
    expect(endsAt).toBeLessThanOrEqual(Date.now() + 91_000);
  });

  it("renders the exercise name and primary muscle group from the matching ExerciseDto", () => {
    mockUseWorkoutSessionStore.mockReturnValue(buildStoreState());

    render(
      <WorkoutActiveSession workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    expect(screen.getByRole("heading", { name: "Supino reto" })).toBeInTheDocument();
    expect(screen.getByText("Peito")).toBeInTheDocument();
  });

  it("shows the next exercise in the footer", () => {
    mockUseWorkoutSessionStore.mockReturnValue(buildStoreState());

    render(
      <WorkoutActiveSession workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    expect(screen.getByText("Remada curvada")).toBeInTheDocument();
    expect(screen.getByText("1 séries × 10 reps")).toBeInTheDocument();
  });

  it("renders nothing meaningful when the session is not active (redirect handled by effect)", () => {
    mockUseWorkoutSessionStore.mockReturnValue(buildStoreState({ status: "idle", workoutId: null }));

    render(
      <WorkoutActiveSession workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith("/workout/workout-1/start");
  });

  it('clicking "Finalizar" calls beginFinishing and navigates to /finish', async () => {
    const beginFinishing = jest.fn();
    mockUseWorkoutSessionStore.mockReturnValue(buildStoreState({ beginFinishing }));

    render(
      <WorkoutActiveSession workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Finalizar" }));

    expect(beginFinishing).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/workout/workout-1/finish");
  });

  it("auto-finalizes when currentExerciseIndex reaches the end of the exercise list", () => {
    const beginFinishing = jest.fn();
    mockUseWorkoutSessionStore.mockReturnValue(
      buildStoreState({ currentExerciseIndex: 2, beginFinishing })
    );

    render(
      <WorkoutActiveSession workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    expect(beginFinishing).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/workout/workout-1/finish");
  });

  it("typing Kg/Reps for a pending set updates local inputs and completeSet receives parsed values", async () => {
    const completeSet = jest.fn();
    mockUseWorkoutSessionStore.mockReturnValue(buildStoreState({ completeSet }));

    render(
      <WorkoutActiveSession workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    const kgInputs = screen.getAllByLabelText("Kg");
    const repsInputs = screen.getAllByLabelText("Reps");
    await userEvent.type(kgInputs[0], "25");
    await userEvent.type(repsInputs[0], "12");

    const completeButtons = screen.getAllByRole("button", { name: "Marcar como concluída" });
    await userEvent.click(completeButtons[0]);

    expect(completeSet).toHaveBeenCalledWith(0, 1, 25, 12);
  });

  it('clicking "Adicionar série" adds an extra row to the sets table', async () => {
    mockUseWorkoutSessionStore.mockReturnValue(buildStoreState());

    render(
      <WorkoutActiveSession workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    const initialRows = screen.getAllByRole("button", { name: "Marcar como concluída" }).length;
    await userEvent.click(screen.getByRole("button", { name: "Adicionar série" }));

    expect(screen.getAllByRole("button", { name: "Marcar como concluída" })).toHaveLength(
      initialRows + 1
    );
  });

  it('shows the rest countdown and "Pular" clears the rest timer', async () => {
    const clearRest = jest.fn();
    const restEndsAt = new Date(Date.now() + 60_000).toISOString();
    mockUseWorkoutSessionStore.mockReturnValue(buildStoreState({ restEndsAt, clearRest }));

    render(
      <WorkoutActiveSession workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    expect(screen.getByText("Descanso")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pular" }));

    expect(clearRest).toHaveBeenCalled();
  });

  it('clicking the next-exercise footer calls clearRest and advances to the next exercise', async () => {
    const clearRest = jest.fn();
    const setCurrentExercise = jest.fn();
    mockUseWorkoutSessionStore.mockReturnValue(
      buildStoreState({ clearRest, setCurrentExercise })
    );

    render(
      <WorkoutActiveSession workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    await userEvent.click(screen.getByText("Remada curvada"));

    expect(clearRest).toHaveBeenCalled();
    expect(setCurrentExercise).toHaveBeenCalledWith(1);
  });
});

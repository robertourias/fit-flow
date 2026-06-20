/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { WorkoutStartPreview } from "../WorkoutStartPreview";
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
    muscleGroups: [],
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
    muscleGroups: [],
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
  exercises: [],
};

describe("WorkoutStartPreview", () => {
  const push = jest.fn();
  const startSession = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push,
    } as unknown as ReturnType<typeof useRouter>);
    mockUseWorkoutSessionStore.mockImplementation((selector) =>
      selector({ startSession } as unknown as WorkoutSessionStore)
    );
  });

  it("renders stats and exercises ordered by 'order', with 'Última execução' when a last session exists", () => {
    render(
      <WorkoutStartPreview
        workout={WORKOUT_FIXTURE}
        exercises={EXERCISE_FIXTURES}
        lastSession={LAST_SESSION_FIXTURE}
      />
    );

    expect(screen.getByRole("heading", { name: "Treino A" })).toBeInTheDocument();

    // total sets: 2 (ex-1) + 1 (ex-2) = 3
    expect(screen.getByText("3")).toBeInTheDocument();

    expect(screen.getByText(/Última execução:/)).toBeInTheDocument();
    expect(screen.queryByText("Primeira execução")).not.toBeInTheDocument();

    // exercises ordered by `order`: ex-1 (order 0) then ex-2 (order 1)
    const names = screen.getAllByText(/Supino reto|Remada curvada/);
    expect(names[0]).toHaveTextContent("Supino reto");
    expect(names[1]).toHaveTextContent("Remada curvada");

    expect(screen.getByText("2 Séries · 8-12 reps · 20kg")).toBeInTheDocument();
    expect(screen.getByText("1 Séries · 10 reps")).toBeInTheDocument();
  });

  it('shows "Primeira execução" when there is no last session', () => {
    render(
      <WorkoutStartPreview workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    expect(screen.getByText("Primeira execução")).toBeInTheDocument();
    expect(screen.queryByText(/Última execução:/)).not.toBeInTheDocument();
  });

  it('starts the session with exerciseIds in order and navigates to /session on "Iniciar Treino"', async () => {
    render(
      <WorkoutStartPreview workout={WORKOUT_FIXTURE} exercises={EXERCISE_FIXTURES} lastSession={null} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Iniciar Treino" }));

    expect(startSession).toHaveBeenCalledWith("workout-1", ["ex-1", "ex-2"]);
    expect(push).toHaveBeenCalledWith("/workout/workout-1/session");
  });
});

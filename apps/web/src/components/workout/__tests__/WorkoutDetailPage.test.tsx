/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, notFound } from "next/navigation";
import { WorkoutDetailPage } from "../WorkoutDetailPage";
import { useWorkout } from "@/lib/api/hooks/use-workout";
import { useExercisesByIds } from "@/lib/api/hooks/use-exercises-by-ids";
import { ApiClientError } from "@/lib/api/client";
import type { ExerciseDto, WorkoutDetailDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-workout", () => ({
  useWorkout: jest.fn(),
}));
jest.mock("@/lib/api/hooks/use-exercises-by-ids", () => ({
  useExercisesByIds: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  notFound: jest.fn(),
}));

const mockUseWorkout = useWorkout as jest.MockedFunction<typeof useWorkout>;
const mockUseExercisesByIds = useExercisesByIds as jest.MockedFunction<typeof useExercisesByIds>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

const EXERCISE_FIXTURES: Record<string, ExerciseDto> = {
  "ex-1": {
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
  "ex-2": {
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
};

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
      plannedSets: [
        { id: "ps-3", setNumber: 1, targetReps: "10", targetKg: null },
      ],
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

function mockLoadedWorkout() {
  mockUseWorkout.mockReturnValue({
    data: WORKOUT_FIXTURE,
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof useWorkout>);
  mockUseExercisesByIds.mockReturnValue([
    { data: EXERCISE_FIXTURES["ex-2"], isLoading: false },
    { data: EXERCISE_FIXTURES["ex-1"], isLoading: false },
  ] as unknown as ReturnType<typeof useExercisesByIds>);
}

describe("WorkoutDetailPage", () => {
  const push = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("renders the workout name and exercise list ordered by 'order'", () => {
    mockLoadedWorkout();

    render(<WorkoutDetailPage id="workout-1" />);

    expect(screen.getByRole("heading", { name: "Treino A" })).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    // exercise with order 0 (ex-1) comes first, then order 1 (ex-2)
    expect(items[0]).toHaveTextContent("Supino reto");
    expect(items[0]).toHaveTextContent("Peito");
    expect(items[0]).toHaveTextContent("2 séries · 8-12 reps · 20kg");
    expect(items[1]).toHaveTextContent("Remada curvada");
    expect(items[1]).toHaveTextContent("Costas");
    expect(items[1]).toHaveTextContent("1 séries · 10 reps");
  });

  it("renders rest time for each exercise", () => {
    mockLoadedWorkout();

    render(<WorkoutDetailPage id="workout-1" />);

    expect(screen.getByText("1min 30s")).toBeInTheDocument();
    expect(screen.getByText("1min")).toBeInTheDocument();
  });

  it('navigates to /workout/[id]/start when "Iniciar Treino" is clicked', async () => {
    mockLoadedWorkout();

    render(<WorkoutDetailPage id="workout-1" />);

    await userEvent.click(screen.getByRole("button", { name: /Iniciar Treino/i }));

    expect(push).toHaveBeenCalledWith("/workout/workout-1/start");
  });

  it('links "Editar" to /workout/[id]/edit', () => {
    mockLoadedWorkout();

    render(<WorkoutDetailPage id="workout-1" />);

    const editLink = screen.getByRole("link", { name: /Editar/i });
    expect(editLink).toHaveAttribute("href", "/workout/workout-1/edit");
  });

  it("links back to /program/[strategyId]", () => {
    mockLoadedWorkout();

    render(<WorkoutDetailPage id="workout-1" />);

    const backLink = screen.getByRole("link", { name: "Voltar para o programa" });
    expect(backLink).toHaveAttribute("href", "/program/strategy-1");
  });

  it("shows a loading skeleton while the workout is loading", () => {
    mockUseWorkout.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useWorkout>);
    mockUseExercisesByIds.mockReturnValue([] as unknown as ReturnType<typeof useExercisesByIds>);

    render(<WorkoutDetailPage id="workout-1" />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("shows a loading skeleton while exercises are still loading", () => {
    mockUseWorkout.mockReturnValue({
      data: WORKOUT_FIXTURE,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useWorkout>);
    mockUseExercisesByIds.mockReturnValue([
      { data: undefined, isLoading: true },
      { data: undefined, isLoading: true },
    ] as unknown as ReturnType<typeof useExercisesByIds>);

    render(<WorkoutDetailPage id="workout-1" />);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("calls notFound when the workout 404s", () => {
    mockUseWorkout.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiClientError(404, "Not found"),
    } as unknown as ReturnType<typeof useWorkout>);
    mockUseExercisesByIds.mockReturnValue([] as unknown as ReturnType<typeof useExercisesByIds>);

    render(<WorkoutDetailPage id="workout-1" />);

    expect(mockNotFound).toHaveBeenCalled();
  });
});

/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams, useRouter, notFound } from "next/navigation";
import NewWorkoutPage from "../page";
import { useStrategy } from "@/lib/api/hooks/use-strategy";
import { useCreateWorkout } from "@/lib/api/hooks/use-create-workout";
import { useWorkoutsLimit } from "@/lib/api/hooks/use-workouts-limit";
import { ApiClientError } from "@/lib/api/client";
import { toCreateWorkoutDto, type WorkoutFormValues } from "@/lib/workout/workout-form.schema";
import type { ExerciseDto, StrategyDetailDto, WorkoutsLimitDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-strategy", () => ({
  useStrategy: jest.fn(),
}));
jest.mock("@/lib/api/hooks/use-create-workout", () => ({
  useCreateWorkout: jest.fn(),
}));
jest.mock("@/lib/api/hooks/use-workouts-limit", () => ({
  useWorkoutsLimit: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
  notFound: jest.fn(),
}));
interface WorkoutBuilderStubProps {
  mode: "create" | "edit";
  initialValues?: WorkoutFormValues;
  onSubmit: (values: WorkoutFormValues) => Promise<unknown>;
  isLoading?: boolean;
  submitError?: string;
}

jest.mock("@/components/workout/WorkoutBuilder", () => ({
  WorkoutBuilder: ({ mode, initialValues, onSubmit, isLoading, submitError }: WorkoutBuilderStubProps) => (
    <div>
      <span data-testid="mode">{mode}</span>
      {initialValues && <span data-testid="initial-name">{initialValues.name}</span>}
      {submitError && <span data-testid="submit-error">{submitError}</span>}
      <button onClick={() => onSubmit(SAMPLE_FORM_VALUES)} disabled={isLoading}>
        Submit
      </button>
    </div>
  ),
}));

const mockUseStrategy = useStrategy as jest.MockedFunction<typeof useStrategy>;
const mockUseCreateWorkout = useCreateWorkout as jest.MockedFunction<typeof useCreateWorkout>;
const mockUseWorkoutsLimit = useWorkoutsLimit as jest.MockedFunction<typeof useWorkoutsLimit>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

const EXERCISE_FIXTURE: ExerciseDto = {
  id: "ex-1",
  name: "Supino reto",
  description: null,
  imageUrl: null,
  videoUrl: null,
  category: "STRENGTH",
  isArchived: false,
  tenantId: null,
  muscleGroups: [],
  equipment: [],
} as unknown as ExerciseDto;

const SAMPLE_FORM_VALUES: WorkoutFormValues = {
  name: "Treino A",
  description: "",
  exercises: [
    {
      exerciseId: "ex-1",
      restSeconds: 90,
      notes: "",
      plannedSets: [{ targetReps: "10", targetKg: "20" }],
      _exercise: EXERCISE_FIXTURE,
    },
  ],
};

const FREE_UNDER_LIMIT: WorkoutsLimitDto = { count: 2, limit: 6, plan: "FREE" };
const FREE_AT_LIMIT: WorkoutsLimitDto = { count: 6, limit: 6, plan: "FREE" };
const PRO_NO_LIMIT: WorkoutsLimitDto = { count: 11, limit: null, plan: "PRO" };

function buildStrategy(workoutCount: number): StrategyDetailDto {
  return {
    id: "strategy-1",
    name: "Programa A",
    type: "ABC",
    description: null,
    isActive: true,
    workouts: Array.from({ length: workoutCount }, (_, i) => ({
      id: `workout-${i}`,
      strategyId: "strategy-1",
      name: `Treino ${i}`,
      description: null,
      order: i,
      exercises: [],
      createdAt: "2026-06-13T00:00:00.000Z",
      updatedAt: "2026-06-13T00:00:00.000Z",
    })),
    createdAt: "2026-06-13T00:00:00.000Z",
    updatedAt: "2026-06-13T00:00:00.000Z",
  };
}

describe("NewWorkoutPage", () => {
  const push = jest.fn();
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: "strategy-1" });
    mockUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    mockUseCreateWorkout.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateWorkout>);
    mockUseWorkoutsLimit.mockReturnValue({
      data: FREE_UNDER_LIMIT,
      isLoading: false,
    } as unknown as ReturnType<typeof useWorkoutsLimit>);
  });

  it("creates a workout with strategyId and order derived from strategy.workouts.length, then redirects", async () => {
    const strategy = buildStrategy(2);
    mockUseStrategy.mockReturnValue({
      data: strategy,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStrategy>);
    mutateAsync.mockResolvedValue({ id: "workout-new", strategyId: "strategy-1" });

    render(<NewWorkoutPage />);

    expect(screen.getByTestId("mode")).toHaveTextContent("create");

    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    const expectedDto = toCreateWorkoutDto(SAMPLE_FORM_VALUES, "strategy-1", 2);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(expectedDto);
    });
    expect(mutateAsync.mock.calls[0][0].strategyId).toBe("strategy-1");
    expect(mutateAsync.mock.calls[0][0].order).toBe(2);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/program/strategy-1");
    });
  });

  it('shows "Limite de 6 treinos atingido" on 422 error and does not navigate', async () => {
    const strategy = buildStrategy(6);
    mockUseStrategy.mockReturnValue({
      data: strategy,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStrategy>);
    mutateAsync.mockRejectedValue(new ApiClientError(422, "Plan limit exceeded"));

    render(<NewWorkoutPage />);

    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByTestId("submit-error")).toHaveTextContent("Limite de 6 treinos atingido");
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("renders a loading state while strategy is loading", () => {
    mockUseStrategy.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useStrategy>);

    render(<NewWorkoutPage />);

    expect(screen.queryByTestId("mode")).not.toBeInTheDocument();
  });

  it("calls notFound when the strategy 404s", () => {
    mockUseStrategy.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiClientError(404, "Not found"),
    } as unknown as ReturnType<typeof useStrategy>);

    render(<NewWorkoutPage />);

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renders a loading state while the workouts limit is loading", () => {
    const strategy = buildStrategy(2);
    mockUseStrategy.mockReturnValue({
      data: strategy,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStrategy>);
    mockUseWorkoutsLimit.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useWorkoutsLimit>);

    render(<NewWorkoutPage />);

    expect(screen.queryByTestId("mode")).not.toBeInTheDocument();
  });

  it("shows a limit-reached message with a 'Voltar' link instead of WorkoutBuilder when count >= limit (FREE)", () => {
    const strategy = buildStrategy(6);
    mockUseStrategy.mockReturnValue({
      data: strategy,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStrategy>);
    mockUseWorkoutsLimit.mockReturnValue({
      data: FREE_AT_LIMIT,
      isLoading: false,
    } as unknown as ReturnType<typeof useWorkoutsLimit>);

    render(<NewWorkoutPage />);

    expect(screen.queryByTestId("mode")).not.toBeInTheDocument();
    expect(screen.getByText(/Limite de 6 treinos do plano gratuito atingido/)).toBeInTheDocument();

    const links = screen.getAllByRole("link", { name: /Voltar/i });
    expect(links.length).toBeGreaterThanOrEqual(2);
    links.forEach((link) => expect(link).toHaveAttribute("href", "/program/strategy-1"));
  });

  it("renders WorkoutBuilder normally when limit is null (PRO)", () => {
    const strategy = buildStrategy(11);
    mockUseStrategy.mockReturnValue({
      data: strategy,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useStrategy>);
    mockUseWorkoutsLimit.mockReturnValue({
      data: PRO_NO_LIMIT,
      isLoading: false,
    } as unknown as ReturnType<typeof useWorkoutsLimit>);

    render(<NewWorkoutPage />);

    expect(screen.getByTestId("mode")).toHaveTextContent("create");
    expect(screen.queryByText(/Limite de/)).not.toBeInTheDocument();
  });
});

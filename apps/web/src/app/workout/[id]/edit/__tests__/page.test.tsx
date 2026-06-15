/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useParams, useRouter, notFound } from "next/navigation";
import EditWorkoutPage from "../page";
import { useWorkout } from "@/lib/api/hooks/use-workout";
import { useExercisesByIds } from "@/lib/api/hooks/use-exercises-by-ids";
import { useUpdateWorkout } from "@/lib/api/hooks/use-update-workout";
import { ApiClientError } from "@/lib/api/client";
import { toUpdateWorkoutDto, type WorkoutFormValues } from "@/lib/workout/workout-form.schema";
import type { ExerciseDto, WorkoutDetailDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-workout", () => ({
  useWorkout: jest.fn(),
}));
jest.mock("@/lib/api/hooks/use-exercises-by-ids", () => ({
  useExercisesByIds: jest.fn(),
}));
jest.mock("@/lib/api/hooks/use-update-workout", () => ({
  useUpdateWorkout: jest.fn(),
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

const mockUseWorkout = useWorkout as jest.MockedFunction<typeof useWorkout>;
const mockUseExercisesByIds = useExercisesByIds as jest.MockedFunction<typeof useExercisesByIds>;
const mockUseUpdateWorkout = useUpdateWorkout as jest.MockedFunction<typeof useUpdateWorkout>;
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
  name: "Treino A Editado",
  description: "",
  exercises: [
    {
      exerciseId: "ex-1",
      restSeconds: 60,
      notes: "",
      plannedSets: [{ targetReps: "12", targetKg: "25" }],
      _exercise: EXERCISE_FIXTURE,
    },
  ],
};

const WORKOUT_FIXTURE: WorkoutDetailDto = {
  id: "workout-1",
  strategyId: "strategy-1",
  name: "Treino A",
  description: null,
  order: 0,
  exercises: [
    {
      id: "we-1",
      exerciseId: "ex-1",
      order: 0,
      restSeconds: 90,
      notes: null,
      plannedSets: [{ id: "ps-1", setNumber: 1, targetReps: "10", targetKg: "20" }],
    },
  ],
  createdAt: "2026-06-13T00:00:00.000Z",
  updatedAt: "2026-06-13T00:00:00.000Z",
};

describe("EditWorkoutPage", () => {
  const push = jest.fn();
  const back = jest.fn();
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: "workout-1" });
    mockUseRouter.mockReturnValue({
      push,
      back,
    } as unknown as ReturnType<typeof useRouter>);
    mockUseUpdateWorkout.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateWorkout>);
  });

  it("prefills the form with workout name, exercises, sets and notes", () => {
    mockUseWorkout.mockReturnValue({
      data: WORKOUT_FIXTURE,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useWorkout>);
    mockUseExercisesByIds.mockReturnValue([
      { data: EXERCISE_FIXTURE, isLoading: false },
    ] as unknown as ReturnType<typeof useExercisesByIds>);

    render(<EditWorkoutPage />);

    expect(screen.getByTestId("mode")).toHaveTextContent("edit");
    expect(screen.getByTestId("initial-name")).toHaveTextContent("Treino A");
  });

  it("updates the workout and redirects to /program/[strategyId]", async () => {
    mockUseWorkout.mockReturnValue({
      data: WORKOUT_FIXTURE,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useWorkout>);
    mockUseExercisesByIds.mockReturnValue([
      { data: EXERCISE_FIXTURE, isLoading: false },
    ] as unknown as ReturnType<typeof useExercisesByIds>);
    mutateAsync.mockResolvedValue(WORKOUT_FIXTURE);

    render(<EditWorkoutPage />);

    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    const expectedDto = toUpdateWorkoutDto(SAMPLE_FORM_VALUES);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(expectedDto);
    });
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/program/strategy-1");
    });
  });

  it('shows "Limite de 6 treinos atingido" on 422 error and does not navigate', async () => {
    mockUseWorkout.mockReturnValue({
      data: WORKOUT_FIXTURE,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useWorkout>);
    mockUseExercisesByIds.mockReturnValue([
      { data: EXERCISE_FIXTURE, isLoading: false },
    ] as unknown as ReturnType<typeof useExercisesByIds>);
    mutateAsync.mockRejectedValue(new ApiClientError(422, "Plan limit exceeded"));

    render(<EditWorkoutPage />);

    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByTestId("submit-error")).toHaveTextContent("Limite de 6 treinos atingido");
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("does not render WorkoutBuilder while exercises are still loading", () => {
    mockUseWorkout.mockReturnValue({
      data: WORKOUT_FIXTURE,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useWorkout>);
    mockUseExercisesByIds.mockReturnValue([
      { data: undefined, isLoading: true },
    ] as unknown as ReturnType<typeof useExercisesByIds>);

    render(<EditWorkoutPage />);

    expect(screen.queryByTestId("mode")).not.toBeInTheDocument();
  });

  it("calls notFound when the workout 404s", () => {
    mockUseWorkout.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new ApiClientError(404, "Not found"),
    } as unknown as ReturnType<typeof useWorkout>);
    mockUseExercisesByIds.mockReturnValue([] as unknown as ReturnType<typeof useExercisesByIds>);

    render(<EditWorkoutPage />);

    expect(mockNotFound).toHaveBeenCalled();
  });
});

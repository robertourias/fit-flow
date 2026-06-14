/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExercisePicker } from "../ExercisePicker";
import { useExercises } from "@/lib/api/hooks/use-exercises";
import { useMuscleGroups } from "@/lib/api/hooks/use-muscle-groups";
import type { ExerciseDto, MuscleGroupDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-exercises", () => ({
  useExercises: jest.fn(),
}));
jest.mock("@/lib/api/hooks/use-muscle-groups", () => ({
  useMuscleGroups: jest.fn(),
}));

const mockUseExercises = useExercises as jest.MockedFunction<typeof useExercises>;
const mockUseMuscleGroups = useMuscleGroups as jest.MockedFunction<typeof useMuscleGroups>;

const MUSCLE_GROUP: MuscleGroupDto = { id: "mg-1", name: "Peito", slug: "peito" };

const EXERCISE_1: ExerciseDto = {
  id: "ex-1",
  name: "Supino reto",
  description: null,
  imageUrl: null,
  videoUrl: null,
  category: "STRENGTH",
  isArchived: false,
  tenantId: null,
  muscleGroups: [{ ...MUSCLE_GROUP, isPrimary: true }],
  equipment: [],
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const EXERCISE_2: ExerciseDto = {
  id: "ex-2",
  name: "Agachamento livre",
  description: null,
  imageUrl: null,
  videoUrl: null,
  category: "STRENGTH",
  isArchived: false,
  tenantId: null,
  muscleGroups: [{ id: "mg-2", name: "Pernas", slug: "pernas", isPrimary: true }],
  equipment: [],
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const EXERCISE_3: ExerciseDto = {
  id: "ex-3",
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
};

function mockExercisesResult(items: ExerciseDto[], overrides: Partial<ReturnType<typeof useExercises>> = {}) {
  return {
    data: { pages: [{ items, nextCursor: null, total: items.length }], pageParams: [null] },
    isLoading: false,
    isError: false,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useExercises>;
}

describe("ExercisePicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMuscleGroups.mockReturnValue({
      data: [MUSCLE_GROUP],
      isLoading: false,
    } as unknown as ReturnType<typeof useMuscleGroups>);
  });

  it("searches with debounce and calls useExercises with the typed value", async () => {
    mockUseExercises.mockReturnValue(mockExercisesResult([EXERCISE_1, EXERCISE_2, EXERCISE_3]));

    render(<ExercisePicker open onOpenChange={jest.fn()} onSelect={jest.fn()} />);

    const searchInput = screen.getByRole("textbox", { name: /buscar exercício/i });
    await userEvent.type(searchInput, "Supino");

    await waitFor(() => {
      expect(mockUseExercises).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Supino" })
      );
    });
  });

  it("filters out exercises whose id is in excludeIds", () => {
    mockUseExercises.mockReturnValue(mockExercisesResult([EXERCISE_1, EXERCISE_2]));

    render(
      <ExercisePicker open onOpenChange={jest.fn()} onSelect={jest.fn()} excludeIds={["ex-1"]} />
    );

    expect(screen.queryByText("Supino reto")).not.toBeInTheDocument();
    expect(screen.getByText("Agachamento livre")).toBeInTheDocument();
  });

  it("calls onSelect with the exercise and closes the sheet when a row is clicked", async () => {
    mockUseExercises.mockReturnValue(mockExercisesResult([EXERCISE_1, EXERCISE_2]));
    const onSelect = jest.fn();
    const onOpenChange = jest.fn();

    render(<ExercisePicker open onOpenChange={onOpenChange} onSelect={onSelect} />);

    await userEvent.click(screen.getByText("Agachamento livre"));

    expect(onSelect).toHaveBeenCalledWith(EXERCISE_2);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkoutBuilder } from "../WorkoutBuilder";
import type { ExerciseDto } from "@fitflow/types";

const EXERCISE_FIXTURE: ExerciseDto = {
  id: "ex-1",
  name: "Supino Reto",
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
};

const EXERCISE_FIXTURE_2: ExerciseDto = {
  ...EXERCISE_FIXTURE,
  id: "ex-2",
  name: "Crucifixo",
};

let nextFixture: ExerciseDto = EXERCISE_FIXTURE;

jest.mock("@/components/workout/ExercisePicker", () => ({
  ExercisePicker: ({
    open,
    onSelect,
  }: {
    open: boolean;
    onSelect: (exercise: ExerciseDto) => void;
  }) =>
    open ? (
      <button onClick={() => onSelect(nextFixture)}>Selecionar exercício de teste</button>
    ) : null,
}));

describe("WorkoutBuilder", () => {
  beforeEach(() => {
    nextFixture = EXERCISE_FIXTURE;
  });

  it("blocks submit with 0 exercises and shows the array-level error", async () => {
    const onSubmit = jest.fn();
    render(<WorkoutBuilder mode="create" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nome/i), "Treino A");
    await userEvent.click(screen.getByRole("button", { name: /criar treino/i }));

    await waitFor(() => {
      expect(screen.getByText("Adicione ao menos um exercício")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the expected payload after a full create flow", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<WorkoutBuilder mode="create" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nome/i), "Treino A");

    await userEvent.click(screen.getByRole("button", { name: /adicionar exercício/i }));
    await userEvent.click(screen.getByRole("button", { name: /selecionar exercício de teste/i }));

    const repsInput = screen.getByLabelText(/repetições da série 1/i);
    await userEvent.type(repsInput, "10");

    await userEvent.click(screen.getByRole("button", { name: /criar treino/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.name).toBe("Treino A");
    expect(submitted.exercises[0].exerciseId).toBe(EXERCISE_FIXTURE.id);
    expect(submitted.exercises[0].restSeconds).toBe(90);
    expect(submitted.exercises[0]._exercise).toEqual(EXERCISE_FIXTURE);
    expect(submitted.exercises[0].plannedSets[0].targetReps).toBe("10");
  });

  it("reflects removed sets in the submitted payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<WorkoutBuilder mode="create" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nome/i), "Treino A");

    await userEvent.click(screen.getByRole("button", { name: /adicionar exercício/i }));
    await userEvent.click(screen.getByRole("button", { name: /selecionar exercício de teste/i }));

    // Now there is 1 set. Add a second one.
    await userEvent.click(screen.getByRole("button", { name: /adicionar série/i }));

    await userEvent.type(screen.getByLabelText(/repetições da série 1/i), "10");
    await userEvent.type(screen.getByLabelText(/repetições da série 2/i), "8");

    // Remove the second set before submitting.
    await userEvent.click(screen.getByRole("button", { name: /remover série 2/i }));

    await userEvent.click(screen.getByRole("button", { name: /criar treino/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.exercises[0].plannedSets).toHaveLength(1);
    expect(submitted.exercises[0].plannedSets[0].targetReps).toBe("10");
  });

  it("renders 'Salvar alterações' and pre-fills fields in edit mode", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const initialValues = {
      name: "Treino existente",
      description: "Descrição existente",
      exercises: [
        {
          exerciseId: EXERCISE_FIXTURE.id,
          _exercise: EXERCISE_FIXTURE,
          restSeconds: 60,
          notes: "Drop set na última série",
          plannedSets: [{ targetReps: "12", targetKg: "20" }],
        },
      ],
    };

    render(<WorkoutBuilder mode="edit" initialValues={initialValues} onSubmit={onSubmit} />);

    expect(screen.getByRole("button", { name: /salvar alterações/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nome/i)).toHaveValue("Treino existente");
    expect(screen.getByText("Supino Reto")).toBeInTheDocument();
    expect(screen.getByLabelText(/repetições da série 1/i)).toHaveValue("12");

    await userEvent.click(screen.getByRole("button", { name: /salvar alterações/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.name).toBe("Treino existente");
    expect(submitted.exercises[0].restSeconds).toBe(60);
  });

  it("reflects removed exercises in the submitted payload", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<WorkoutBuilder mode="create" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/nome/i), "Treino A");

    // Add first exercise
    await userEvent.click(screen.getByRole("button", { name: /adicionar exercício/i }));
    await userEvent.click(screen.getByRole("button", { name: /selecionar exercício de teste/i }));

    // Add second exercise (different fixture)
    nextFixture = EXERCISE_FIXTURE_2;
    await userEvent.click(screen.getByRole("button", { name: /adicionar exercício/i }));
    await userEvent.click(screen.getByRole("button", { name: /selecionar exercício de teste/i }));

    // Remove the first exercise
    const removeButtons = screen.getAllByRole("button", { name: /remover exercício/i });
    await userEvent.click(removeButtons[0]);

    // Fill the remaining set's reps
    await userEvent.type(screen.getByLabelText(/repetições da série 1/i), "12");

    await userEvent.click(screen.getByRole("button", { name: /criar treino/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.exercises).toHaveLength(1);
    expect(submitted.exercises[0].exerciseId).toBe(EXERCISE_FIXTURE_2.id);
  });
});

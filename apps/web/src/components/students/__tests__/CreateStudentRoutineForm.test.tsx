/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateStudentRoutineForm } from "../CreateStudentRoutineForm";
import { useExercises } from "@/lib/api/hooks/use-exercises";
import { useCreateStudentStrategy } from "@/lib/api/hooks/use-create-student-strategy";
import { useCreateStudentWorkout } from "@/lib/api/hooks/use-create-student-workout";
import { ApiClientError } from "@/lib/api/client";

jest.mock("@/lib/api/hooks/use-exercises");
jest.mock("@/lib/api/hooks/use-create-student-strategy");
jest.mock("@/lib/api/hooks/use-create-student-workout");

const EXERCISE = {
  id: "ex-1",
  name: "Supino reto",
  description: null,
  imageUrl: null,
  videoUrl: null,
  category: "STRENGTH" as const,
  isArchived: false,
  tenantId: null,
  muscleGroups: [],
  equipment: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const defaultExercisesMock = {
  data: { pages: [{ items: [EXERCISE], total: 1, nextCursor: null }] },
};

beforeEach(() => {
  jest.clearAllMocks();
  (useExercises as jest.Mock).mockReturnValue(defaultExercisesMock);
});

// jsdom does not dispatch a "submit" event from a plain fireEvent.click on a
// type="submit" button, so we submit the form directly (matches RHF's handleSubmit wiring).
function submitForm(button: HTMLElement) {
  const form = button.closest("form");
  if (!form) throw new Error("submit button is not inside a form");
  fireEvent.submit(form);
}

describe("CreateStudentRoutineForm", () => {
  it("renders exercise options from useExercises", () => {
    (useCreateStudentStrategy as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
    (useCreateStudentWorkout as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });

    render(<CreateStudentRoutineForm studentId="student-1" />);
    expect(screen.getByText("Supino reto")).toBeInTheDocument();
  });

  it("validates required fields", async () => {
    (useCreateStudentStrategy as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
    (useCreateStudentWorkout as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });

    render(<CreateStudentRoutineForm studentId="student-1" />);
    submitForm(screen.getByRole("button", { name: "Criar rotina" }));

    expect(await screen.findByText("Informe o nome da estratégia")).toBeInTheDocument();
    expect(screen.getByText("Informe o nome do treino")).toBeInTheDocument();
  });

  it("creates strategy then workout with selected exercise on submit", async () => {
    const createStrategy = jest.fn().mockResolvedValue({ id: "strategy-1" });
    const createWorkout = jest.fn().mockResolvedValue({ id: "workout-1" });
    (useCreateStudentStrategy as jest.Mock).mockReturnValue({ mutateAsync: createStrategy });
    (useCreateStudentWorkout as jest.Mock).mockReturnValue({ mutateAsync: createWorkout });

    const onCreated = jest.fn();
    render(<CreateStudentRoutineForm studentId="student-1" onCreated={onCreated} />);

    fireEvent.change(screen.getByLabelText("Nome da estratégia"), { target: { value: "Hipertrofia" } });
    fireEvent.change(screen.getByLabelText("Nome do treino"), { target: { value: "Treino A" } });
    fireEvent.change(screen.getByLabelText("Exercício"), { target: { value: "ex-1" } });
    fireEvent.change(screen.getByLabelText("Reps"), { target: { value: "12" } });

    submitForm(screen.getByRole("button", { name: "Criar rotina" }));

    await waitFor(() => expect(createStrategy).toHaveBeenCalledWith({ name: "Hipertrofia" }));
    await waitFor(() =>
      expect(createWorkout).toHaveBeenCalledWith({
        strategyId: "strategy-1",
        name: "Treino A",
        order: 0,
        exercises: [
          {
            exerciseId: "ex-1",
            order: 0,
            plannedSets: [{ setNumber: 1, targetReps: "12" }],
          },
        ],
      })
    );
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(await screen.findByText("Rotina criada com sucesso.")).toBeInTheDocument();
  });

  it("adds and removes exercise rows", () => {
    (useCreateStudentStrategy as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
    (useCreateStudentWorkout as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });

    render(<CreateStudentRoutineForm studentId="student-1" />);
    expect(screen.getAllByLabelText("Exercício")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Adicionar exercício" }));
    expect(screen.getAllByLabelText("Exercício")).toHaveLength(2);

    fireEvent.click(screen.getAllByLabelText("Remover exercício")[1]);
    expect(screen.getAllByLabelText("Exercício")).toHaveLength(1);
  });

  it("shows plan limit error message on 403", async () => {
    const createStrategy = jest.fn().mockResolvedValue({ id: "strategy-1" });
    const createWorkout = jest.fn().mockRejectedValue(new ApiClientError(403, "limit"));
    (useCreateStudentStrategy as jest.Mock).mockReturnValue({ mutateAsync: createStrategy });
    (useCreateStudentWorkout as jest.Mock).mockReturnValue({ mutateAsync: createWorkout });

    render(<CreateStudentRoutineForm studentId="student-1" />);

    fireEvent.change(screen.getByLabelText("Nome da estratégia"), { target: { value: "Hipertrofia" } });
    fireEvent.change(screen.getByLabelText("Nome do treino"), { target: { value: "Treino A" } });
    fireEvent.change(screen.getByLabelText("Exercício"), { target: { value: "ex-1" } });
    fireEvent.change(screen.getByLabelText("Reps"), { target: { value: "12" } });
    submitForm(screen.getByRole("button", { name: "Criar rotina" }));

    expect(
      await screen.findByText("Limite de treinos do plano gratuito do aluno foi atingido.")
    ).toBeInTheDocument();
  });
});

/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { SessionDetailPage } from "../SessionDetailPage";
import type { WorkoutSessionDetailDto, ExerciseDto } from "@fitflow/types";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("@/components/exercises/ExerciseImage", () => ({
  ExerciseImage: ({ src, alt }: { src: string | null; alt: string }) => (
    <img src={src ?? ""} alt={alt} />
  ),
}));

const SESSION: WorkoutSessionDetailDto = {
  id: "s1",
  workoutId: "w1",
  workoutName: "Treino A",
  startedAt: "2026-06-10T10:00:00.000Z",
  endedAt: "2026-06-10T11:00:00.000Z",
  status: "FINISHED",
  comment: "Treino pesado",
  difficulty: 8,
  createdAt: "2026-06-10T11:00:00.000Z",
  exercises: [
    {
      id: "se-1",
      exerciseId: "ex-1",
      order: 1,
      notes: null,
      executedSets: [
        { id: "es-1", setNumber: 1, kg: 80, reps: 8, completedAt: "2026-06-10T10:10:00.000Z" },
        { id: "es-2", setNumber: 2, kg: 80, reps: 7, completedAt: "2026-06-10T10:12:00.000Z" },
        { id: "es-3", setNumber: 3, kg: null, reps: null, completedAt: null },
      ],
    },
  ],
};

const EXERCISES: ExerciseDto[] = [
  {
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
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
];

describe("SessionDetailPage", () => {
  it("renderiza o nome do treino no cabeçalho", () => {
    render(<SessionDetailPage session={SESSION} exercises={EXERCISES} />);
    expect(screen.getByRole("heading", { name: "Treino A" })).toBeInTheDocument();
  });

  it("renderiza o nome do exercício", () => {
    render(<SessionDetailPage session={SESSION} exercises={EXERCISES} />);
    expect(screen.getByText("Supino reto")).toBeInTheDocument();
  });

  it("exibe apenas as 2 séries concluídas, omitindo a série sem completedAt", () => {
    render(<SessionDetailPage session={SESSION} exercises={EXERCISES} />);
    const rows = screen.getAllByRole("row");
    // 1 header row + 2 data rows
    expect(rows).toHaveLength(3);
    // kg=80 aparece nas duas séries
    expect(screen.getAllByText("80")).toHaveLength(2);
    // reps: 8 (série 1) e reps: 7 (série 2)
    expect(screen.getAllByText("8").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("exibe a duração calculada de 1h 0min para sessão de 60 minutos", () => {
    render(<SessionDetailPage session={SESSION} exercises={EXERCISES} />);
    expect(screen.getByText("1h 0min")).toBeInTheDocument();
  });

  it("exibe a dificuldade no formato X/10", () => {
    render(<SessionDetailPage session={SESSION} exercises={EXERCISES} />);
    expect(screen.getByText("8/10")).toBeInTheDocument();
  });

  it("exibe o comentário da sessão", () => {
    render(<SessionDetailPage session={SESSION} exercises={EXERCISES} />);
    expect(screen.getByText(/Treino pesado/)).toBeInTheDocument();
  });

  it("exibe '—' na duração quando endedAt é nulo", () => {
    const sessionWithoutEnd: WorkoutSessionDetailDto = {
      ...SESSION,
      endedAt: null,
    };
    render(<SessionDetailPage session={sessionWithoutEnd} exercises={EXERCISES} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("omite a dificuldade quando é nula", () => {
    const sessionWithoutDifficulty: WorkoutSessionDetailDto = {
      ...SESSION,
      difficulty: null,
    };
    render(<SessionDetailPage session={sessionWithoutDifficulty} exercises={EXERCISES} />);
    expect(screen.queryByText(/\/10/)).not.toBeInTheDocument();
  });

  it("omite o comentário quando é nulo", () => {
    const sessionWithoutComment: WorkoutSessionDetailDto = {
      ...SESSION,
      comment: null,
    };
    render(<SessionDetailPage session={sessionWithoutComment} exercises={EXERCISES} />);
    expect(screen.queryByText(/Comentário/)).not.toBeInTheDocument();
  });

  it("exibe 'Exercício pulado' quando não há séries concluídas", () => {
    const sessionWithSkippedExercise: WorkoutSessionDetailDto = {
      ...SESSION,
      exercises: [
        {
          id: "se-1",
          exerciseId: "ex-1",
          order: 1,
          notes: null,
          executedSets: [
            { id: "es-1", setNumber: 1, kg: null, reps: null, completedAt: null },
          ],
        },
      ],
    };
    render(<SessionDetailPage session={sessionWithSkippedExercise} exercises={EXERCISES} />);
    expect(screen.getByText("Exercício pulado")).toBeInTheDocument();
  });
});

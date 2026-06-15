/**
 * @jest-environment jsdom
 */
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import ProgramPage from "../page";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import type { StrategyDetailDto, WorkoutsLimitDto } from "@fitflow/types";

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client");
  return {
    ...actual,
    apiFetch: jest.fn(),
  };
});
jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}));
jest.mock("@/components/library/ProgramHeader", () => ({
  ProgramHeader: () => <div data-testid="program-header" />,
}));
jest.mock("@/components/library/WorkoutListRow", () => ({
  WorkoutListRow: ({ workout }: { workout: { id: string } }) => (
    <div data-testid="workout-row">{workout.id}</div>
  ),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;

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

const FREE_UNDER_LIMIT: WorkoutsLimitDto = { count: 2, limit: 6, plan: "FREE" };
const FREE_AT_LIMIT: WorkoutsLimitDto = { count: 6, limit: 6, plan: "FREE" };
const PRO_NO_LIMIT: WorkoutsLimitDto = { count: 11, limit: null, plan: "PRO" };

async function renderProgramPage() {
  const ui = await ProgramPage({ params: Promise.resolve({ id: "strategy-1" }) });
  return render(ui);
}

describe("ProgramPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the workout limit badge and an active 'Adicionar treino' link when count < limit (FREE)", async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path === "/strategies/strategy-1") return Promise.resolve(buildStrategy(2));
      if (path === "/workouts/limit") return Promise.resolve(FREE_UNDER_LIMIT);
      throw new Error(`Unexpected path: ${path}`);
    });

    await renderProgramPage();

    expect(screen.getByText("2/6 treinos")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Adicionar treino/i });
    expect(link).toHaveAttribute("href", "/program/strategy-1/workout/novo");
    expect(screen.queryByText(/Limite de/)).not.toBeInTheDocument();
  });

  it("renders no badge and an active 'Adicionar treino' link when limit is null (PRO)", async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path === "/strategies/strategy-1") return Promise.resolve(buildStrategy(11));
      if (path === "/workouts/limit") return Promise.resolve(PRO_NO_LIMIT);
      throw new Error(`Unexpected path: ${path}`);
    });

    await renderProgramPage();

    expect(screen.queryByText(/treinos$/i, { selector: "span" })).not.toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Adicionar treino/i });
    expect(link).toHaveAttribute("href", "/program/strategy-1/workout/novo");
  });

  it("disables 'Adicionar treino' and shows a limit message when count >= limit (FREE)", async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path === "/strategies/strategy-1") return Promise.resolve(buildStrategy(6));
      if (path === "/workouts/limit") return Promise.resolve(FREE_AT_LIMIT);
      throw new Error(`Unexpected path: ${path}`);
    });

    await renderProgramPage();

    expect(screen.getByText("6/6 treinos")).toBeInTheDocument();

    expect(screen.queryByRole("link", { name: /Adicionar treino/i })).not.toBeInTheDocument();

    const button = screen.getByRole("button", { name: /Adicionar treino/i });
    expect(button).toBeDisabled();

    expect(screen.getByText("Limite de 6 treinos do plano gratuito atingido.")).toBeInTheDocument();
  });

  it("calls notFound when the strategy 404s", async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path === "/strategies/strategy-1") return Promise.reject(new ApiClientError(404, "Not found"));
      return Promise.resolve(FREE_UNDER_LIMIT);
    });

    await expect(ProgramPage({ params: Promise.resolve({ id: "strategy-1" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );

    expect(mockNotFound).toHaveBeenCalled();
  });
});

/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExploreListPage } from "../ExploreListPage";
import { useTemplates } from "@/lib/api/hooks/use-templates";
import { useImportTemplate } from "@/lib/api/hooks/use-import-template";
import { useWorkoutsLimit } from "@/lib/api/hooks/use-workouts-limit";

jest.mock("@/lib/api/hooks/use-templates");
jest.mock("@/lib/api/hooks/use-import-template");
jest.mock("@/lib/api/hooks/use-workouts-limit");
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const TEMPLATE_BIG: import("@fitflow/types").StrategyTemplateDto = {
  id: "t1",
  name: "PPL — Iniciante",
  type: "PPL",
  description: "6 treinos por semana.",
  workoutsCount: 6,
  workoutNames: ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B"],
  muscleGroups: ["Peito", "Costas", "Ombros"],
};

const TEMPLATE_SMALL: import("@fitflow/types").StrategyTemplateDto = {
  id: "t2",
  name: "Full Body",
  type: "FULL_BODY",
  description: null,
  workoutsCount: 3,
  workoutNames: ["Full A", "Full B", "Full C"],
  muscleGroups: ["Peito"],
};

const defaultImportMock = { mutateAsync: jest.fn(), isPending: false };
const defaultLimitMock = { data: { count: 0, limit: 6, plan: "FREE" } };

beforeEach(() => {
  jest.clearAllMocks();
  (useImportTemplate as jest.Mock).mockReturnValue(defaultImportMock);
  (useWorkoutsLimit as jest.Mock).mockReturnValue(defaultLimitMock);
});

describe("ExploreListPage", () => {
  it("renderiza skeleton durante loading", () => {
    (useTemplates as jest.Mock).mockReturnValue({ data: undefined, isLoading: true });
    render(<ExploreListPage />);
    expect(screen.getByLabelText("Carregando templates")).toBeInTheDocument();
  });

  it("renderiza cards de templates com nome, tipo e grupos musculares", () => {
    (useTemplates as jest.Mock).mockReturnValue({ data: [TEMPLATE_BIG], isLoading: false });
    render(<ExploreListPage />);
    expect(screen.getByText("PPL — Iniciante")).toBeInTheDocument();
    expect(screen.getByText("6 treinos")).toBeInTheDocument();
    expect(screen.getByText("Peito")).toBeInTheDocument();
    expect(screen.getByText("Costas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /importar ppl/i })).toBeInTheDocument();
  });

  it("botão Importar desabilitado para FREE user quando template excede o limite", () => {
    // count=4, template tem 6 workouts → 4+6=10 > 6
    (useWorkoutsLimit as jest.Mock).mockReturnValue({
      data: { count: 4, limit: 6, plan: "FREE" },
    });
    (useTemplates as jest.Mock).mockReturnValue({ data: [TEMPLATE_BIG], isLoading: false });
    render(<ExploreListPage />);
    const btn = screen.getByRole("button", { name: /importar ppl — iniciante/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent("Limite atingido");
  });

  it("FREE user com espaço pode importar template pequeno", () => {
    // count=2, template tem 3 workouts → 2+3=5 <= 6
    (useWorkoutsLimit as jest.Mock).mockReturnValue({
      data: { count: 2, limit: 6, plan: "FREE" },
    });
    (useTemplates as jest.Mock).mockReturnValue({ data: [TEMPLATE_SMALL], isLoading: false });
    render(<ExploreListPage />);
    const btn = screen.getByRole("button", { name: /importar full body/i });
    expect(btn).not.toBeDisabled();
  });

  it("exibe mensagem de sucesso com link para Biblioteca após importar", async () => {
    const mutateAsync = jest.fn().mockResolvedValue({ id: "s1" });
    (useImportTemplate as jest.Mock).mockReturnValue({ mutateAsync, isPending: false });
    (useTemplates as jest.Mock).mockReturnValue({ data: [TEMPLATE_SMALL], isLoading: false });
    render(<ExploreListPage />);

    fireEvent.click(screen.getByRole("button", { name: /importar full body/i }));
    await waitFor(() => expect(screen.getByText(/importado/i)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: /biblioteca/i })).toHaveAttribute("href", "/library");
  });
});

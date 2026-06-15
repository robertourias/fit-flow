/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { LibraryListPage } from "../LibraryListPage";
import { useStrategies } from "@/lib/api/hooks/use-strategies";
import { useCreateStrategy } from "@/lib/api/hooks/use-create-strategy";
import type { StrategySummaryDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-strategies", () => ({
  useStrategies: jest.fn(),
}));
jest.mock("@/lib/api/hooks/use-create-strategy", () => ({
  useCreateStrategy: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockUseStrategies = useStrategies as jest.MockedFunction<typeof useStrategies>;
const mockUseCreateStrategy = useCreateStrategy as jest.MockedFunction<typeof useCreateStrategy>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const NEW_STRATEGY: StrategySummaryDto = {
  id: "new-1",
  name: "Treino Novo",
  type: null,
  description: null,
  isActive: true,
  workouts: [],
  createdAt: "2026-06-13T00:00:00.000Z",
  updatedAt: "2026-06-13T00:00:00.000Z",
};

describe("LibraryListPage", () => {
  const push = jest.fn();
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStrategies.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useStrategies>);
    mockUseCreateStrategy.mockReturnValue({
      mutateAsync,
    } as unknown as ReturnType<typeof useCreateStrategy>);
    mockUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  });

  it('opens the create dialog when "Criar novo programa" is clicked', async () => {
    render(<LibraryListPage />);

    await userEvent.click(screen.getByRole("button", { name: "Criar novo programa" }));

    expect(screen.getByRole("heading", { name: "Criar novo programa" })).toBeInTheDocument();
  });

  it("creates a strategy on valid submit and navigates to /program/[id]", async () => {
    mutateAsync.mockResolvedValue(NEW_STRATEGY);
    render(<LibraryListPage />);

    await userEvent.click(screen.getByRole("button", { name: "Criar novo programa" }));
    await userEvent.type(screen.getByLabelText("Nome *"), "Treino Novo");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        name: "Treino Novo",
        type: undefined,
        description: undefined,
      });
    });
    expect(push).toHaveBeenCalledWith("/program/new-1");
  });
});

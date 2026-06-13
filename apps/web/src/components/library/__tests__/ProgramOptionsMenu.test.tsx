/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { ProgramOptionsMenu } from "../ProgramOptionsMenu";
import { useUpdateStrategy } from "@/lib/api/hooks/use-update-strategy";
import { useDeleteStrategy } from "@/lib/api/hooks/use-delete-strategy";
import type { StrategyDetailDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-update-strategy", () => ({
  useUpdateStrategy: jest.fn(),
}));
jest.mock("@/lib/api/hooks/use-delete-strategy", () => ({
  useDeleteStrategy: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockUseUpdateStrategy = useUpdateStrategy as jest.MockedFunction<typeof useUpdateStrategy>;
const mockUseDeleteStrategy = useDeleteStrategy as jest.MockedFunction<typeof useDeleteStrategy>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const STRATEGY: StrategyDetailDto = {
  id: "p1",
  name: "Treino Atual",
  type: "ABC",
  description: "desc",
  isActive: true,
  workouts: [],
  createdAt: "2026-06-13T00:00:00.000Z",
  updatedAt: "2026-06-13T00:00:00.000Z",
};

async function openEditDialog() {
  await userEvent.click(screen.getByRole("button"));
  await userEvent.click(screen.getByRole("menuitem", { name: /editar/i }));
  await screen.findByRole("heading", { name: "Editar programa" });
}

describe("ProgramOptionsMenu", () => {
  const updateMutateAsync = jest.fn();
  const deleteMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUpdateStrategy.mockReturnValue({
      mutateAsync: updateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateStrategy>);
    mockUseDeleteStrategy.mockReturnValue({
      mutateAsync: deleteMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteStrategy>);
    mockUseRouter.mockReturnValue({ push: jest.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  it("opens edit dialog pre-filled with the program's current data (FR-003)", async () => {
    render(<ProgramOptionsMenu strategy={STRATEGY} />);

    await openEditDialog();

    expect(screen.getByRole("heading", { name: "Editar programa" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome *")).toHaveValue("Treino Atual");
    expect(screen.getByLabelText("Descrição")).toHaveValue("desc");
  });

  it("updates name/split/description on valid submit (FR-004)", async () => {
    updateMutateAsync.mockResolvedValue(STRATEGY);
    render(<ProgramOptionsMenu strategy={STRATEGY} />);

    await openEditDialog();
    const nameInput = screen.getByLabelText("Nome *");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Treino Renomeado");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({
        id: "p1",
        data: { name: "Treino Renomeado", type: "ABC", description: "desc" },
      });
    });
  });

  it('opens edit dialog with "Personalizado" selected when the program has no type', async () => {
    updateMutateAsync.mockResolvedValue(STRATEGY);
    render(<ProgramOptionsMenu strategy={{ ...STRATEGY, type: null }} />);

    await openEditDialog();
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({
        id: "p1",
        data: { name: "Treino Atual", type: undefined, description: "desc" },
      });
    });
  });
});

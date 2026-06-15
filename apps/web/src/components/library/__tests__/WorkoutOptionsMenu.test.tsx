/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { WorkoutOptionsMenu } from "../WorkoutOptionsMenu";
import { useDeleteWorkout } from "@/lib/api/hooks/use-delete-workout";
import type { WorkoutDetailDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-delete-workout", () => ({
  useDeleteWorkout: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockUseDeleteWorkout = useDeleteWorkout as jest.MockedFunction<typeof useDeleteWorkout>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const WORKOUT: WorkoutDetailDto = {
  id: "w1",
  strategyId: "p1",
  name: "Treino A",
  description: null,
  order: 0,
  exercises: [],
  createdAt: "2026-06-13T00:00:00.000Z",
  updatedAt: "2026-06-13T00:00:00.000Z",
};

describe("WorkoutOptionsMenu", () => {
  const deleteMutateAsync = jest.fn();
  const push = jest.fn();
  const refresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeleteWorkout.mockReturnValue({
      mutateAsync: deleteMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteWorkout>);
    mockUseRouter.mockReturnValue({
      push,
      refresh,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("navigates to the edit route when 'Editar' is clicked", async () => {
    render(<WorkoutOptionsMenu workout={WORKOUT} />);

    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("menuitem", { name: /editar/i }));

    expect(push).toHaveBeenCalledWith("/workout/w1/edit");
  });

  it("deletes the workout after confirmation and refreshes the page", async () => {
    deleteMutateAsync.mockResolvedValue(undefined);
    render(<WorkoutOptionsMenu workout={WORKOUT} />);

    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(screen.getByRole("menuitem", { name: /excluir/i }));

    await screen.findByRole("heading", { name: "Excluir treino?" });
    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(deleteMutateAsync).toHaveBeenCalledWith({ id: "w1", strategyId: "p1" });
    });
    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Excluir treino?" })).not.toBeInTheDocument();
    });
  });
});

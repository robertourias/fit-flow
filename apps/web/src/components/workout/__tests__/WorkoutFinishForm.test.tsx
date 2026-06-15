/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { WorkoutFinishForm } from "../WorkoutFinishForm";
import { useWorkoutSessionStore } from "@/lib/stores/workout-session.store";
import { useCreateWorkoutSession } from "@/lib/api/hooks/use-create-workout-session";
import { ApiClientError } from "@/lib/api/client";
import type { WorkoutDetailDto, WorkoutSessionDetailDto } from "@fitflow/types";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/lib/stores/workout-session.store", () => ({
  useWorkoutSessionStore: jest.fn(),
}));
jest.mock("@/lib/api/hooks/use-create-workout-session", () => ({
  useCreateWorkoutSession: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseWorkoutSessionStore = useWorkoutSessionStore as unknown as jest.MockedFunction<
  () => unknown
>;
const mockUseCreateWorkoutSession = useCreateWorkoutSession as jest.MockedFunction<
  typeof useCreateWorkoutSession
>;

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
      plannedSets: [
        { id: "ps-1", setNumber: 1, targetReps: "8-12", targetKg: "20" },
        { id: "ps-2", setNumber: 2, targetReps: "8-12", targetKg: "20" },
      ],
    },
    {
      id: "we-2",
      exerciseId: "ex-2",
      order: 1,
      restSeconds: 60,
      notes: null,
      plannedSets: [{ id: "ps-3", setNumber: 1, targetReps: "10", targetKg: null }],
    },
  ],
  createdAt: "2026-06-13T00:00:00.000Z",
  updatedAt: "2026-06-13T00:00:00.000Z",
};

const SESSION_STATE = {
  startedAt: "2026-06-15T10:00:00.000Z",
  exercises: [
    {
      exerciseId: "ex-1",
      notes: "",
      sets: [
        { setNumber: 1, kg: 20, reps: 10, completedAt: "2026-06-15T10:05:00.000Z" },
        { setNumber: 2, kg: 20, reps: 8, completedAt: "2026-06-15T10:10:00.000Z" },
      ],
    },
    {
      exerciseId: "ex-2",
      notes: "",
      sets: [{ setNumber: 1, kg: undefined, reps: 10, completedAt: "2026-06-15T10:15:00.000Z" }],
    },
  ],
  resetSession: jest.fn(),
};

const SESSION_RESPONSE: WorkoutSessionDetailDto = {
  id: "session-99",
  workoutId: "workout-1",
  startedAt: "2026-06-15T10:00:00.000Z",
  endedAt: "2026-06-15T11:00:00.000Z",
  status: "FINISHED",
  comment: null,
  difficulty: null,
  createdAt: "2026-06-15T11:00:00.000Z",
  exercises: [],
};

describe("WorkoutFinishForm", () => {
  const push = jest.fn();
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push,
    } as unknown as ReturnType<typeof useRouter>);
    mockUseWorkoutSessionStore.mockReturnValue(SESSION_STATE);
    mockUseCreateWorkoutSession.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateWorkoutSession>);
  });

  it('submits the session, resets the store and navigates to /program/[strategyId] on success', async () => {
    mutateAsync.mockResolvedValue(SESSION_RESPONSE);

    render(<WorkoutFinishForm workout={WORKOUT_FIXTURE} />);

    await userEvent.click(screen.getByRole("button", { name: "Salvar Treino" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      workoutId: "workout-1",
      startedAt: "2026-06-15T10:00:00.000Z",
      endedAt: expect.any(String),
      comment: undefined,
      difficulty: undefined,
      exercises: [
        {
          exerciseId: "ex-1",
          order: 0,
          notes: undefined,
          executedSets: [
            { setNumber: 1, kg: 20, reps: 10, completedAt: "2026-06-15T10:05:00.000Z" },
            { setNumber: 2, kg: 20, reps: 8, completedAt: "2026-06-15T10:10:00.000Z" },
          ],
        },
        {
          exerciseId: "ex-2",
          order: 1,
          notes: undefined,
          executedSets: [
            { setNumber: 1, kg: undefined, reps: 10, completedAt: "2026-06-15T10:15:00.000Z" },
          ],
        },
      ],
    });

    expect(SESSION_STATE.resetSession).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/program/strategy-1");
  });

  it("shows an inline error and preserves comment/difficulty when the API call fails", async () => {
    mutateAsync.mockRejectedValue(new ApiClientError(500, "Internal error"));

    render(<WorkoutFinishForm workout={WORKOUT_FIXTURE} />);

    const commentInput = screen.getByLabelText("Como foi?");
    await userEvent.type(commentInput, "Treino puxado hoje");
    await userEvent.click(screen.getByRole("button", { name: "Dificuldade 4" }));

    await userEvent.click(screen.getByRole("button", { name: "Salvar Treino" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível salvar o treino. Tente novamente."
    );

    expect(SESSION_STATE.resetSession).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();

    expect(commentInput).toHaveValue("Treino puxado hoje");
    expect(screen.getByRole("button", { name: "Dificuldade 4" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("toggles 'Atualizar valores da rotina', Strava and Health Connect switches", async () => {
    mutateAsync.mockResolvedValue(SESSION_RESPONSE);

    render(<WorkoutFinishForm workout={WORKOUT_FIXTURE} />);

    const switches = screen.getAllByRole("switch");
    expect(switches).toHaveLength(3);

    expect(switches[0]).toHaveAttribute("aria-checked", "true");
    expect(switches[1]).toHaveAttribute("aria-checked", "false");
    expect(switches[2]).toHaveAttribute("aria-checked", "false");

    await userEvent.click(switches[0]);
    await userEvent.click(switches[1]);
    await userEvent.click(switches[2]);

    expect(switches[0]).toHaveAttribute("aria-checked", "false");
    expect(switches[1]).toHaveAttribute("aria-checked", "true");
    expect(switches[2]).toHaveAttribute("aria-checked", "true");
  });

  it("expands the details accordion to show ended-at, duration and workout type", async () => {
    mutateAsync.mockResolvedValue(SESSION_RESPONSE);

    render(<WorkoutFinishForm workout={WORKOUT_FIXTURE} />);

    const detailsToggle = screen.getByRole("button", { name: "Detalhes" });
    expect(detailsToggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(detailsToggle);

    expect(detailsToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Encerrado em")).toBeInTheDocument();
    expect(screen.getByText("Tipo de treino")).toBeInTheDocument();

    await userEvent.click(detailsToggle);
    expect(detailsToggle).toHaveAttribute("aria-expanded", "false");
  });
});

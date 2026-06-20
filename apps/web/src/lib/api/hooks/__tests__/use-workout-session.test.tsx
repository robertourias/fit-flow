/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useWorkoutSession } from "../use-workout-session";
import { apiFetch } from "../../client";
import type { WorkoutSessionDetailDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const SESSION_DETAIL: WorkoutSessionDetailDto = {
  id: "session-1",
  workoutId: "w1",
  workoutName: "Treino A",
  startedAt: "2026-06-10T10:00:00.000Z",
  endedAt: "2026-06-10T11:00:00.000Z",
  status: "FINISHED",
  comment: "Bom treino",
  difficulty: 3,
  createdAt: "2026-06-10T11:00:00.000Z",
  exercises: [
    {
      id: "session-exercise-1",
      exerciseId: "exercise-1",
      order: 1,
      notes: null,
      executedSets: [
        { id: "set-1", setNumber: 1, kg: 50, reps: 10, completedAt: "2026-06-10T10:10:00.000Z" },
      ],
    },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper };
}

describe("useWorkoutSession", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("retorna o detalhe da sessão para id válido", async () => {
    mockApiFetch.mockResolvedValueOnce(SESSION_DETAIL);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkoutSession("session-1"), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/workout-sessions/session-1");
    expect(result.current.data).toEqual(SESSION_DETAIL);
    expect(result.current.data?.workoutName).toBe("Treino A");
    expect(result.current.data?.exercises).toHaveLength(1);
  });

  it("não faz fetch quando id é vazio (enabled: false)", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkoutSession(""), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

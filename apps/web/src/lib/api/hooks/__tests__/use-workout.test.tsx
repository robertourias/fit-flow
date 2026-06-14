/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useWorkout } from "../use-workout";
import { apiFetch } from "../../client";
import type { WorkoutDetailDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const WORKOUT_DETAIL: WorkoutDetailDto = {
  id: "w1",
  strategyId: "s1",
  name: "Treino 1",
  description: "Descrição",
  order: 1,
  exercises: [],
  createdAt: "2026-06-13T00:00:00.000Z",
  updatedAt: "2026-06-13T00:00:00.000Z",
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

describe("useWorkout", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("fetches /workouts/:id and returns workout data", async () => {
    mockApiFetch.mockResolvedValueOnce(WORKOUT_DETAIL);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkout("w1"), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/workouts/w1");
    expect(result.current.data).toEqual(WORKOUT_DETAIL);
  });

  it("uses correct query key with workout id", async () => {
    mockApiFetch.mockResolvedValueOnce(WORKOUT_DETAIL);
    const { Wrapper } = createWrapper();
    renderHook(() => useWorkout("w1"), { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalled();
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/workouts/w1");
  });
});

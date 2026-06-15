/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useUpdateWorkout } from "../use-update-workout";
import { apiFetch } from "../../client";
import type { UpdateWorkoutDto, WorkoutDetailDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const UPDATED_WORKOUT: WorkoutDetailDto = {
  id: "w1",
  strategyId: "s1",
  name: "Updated Treino",
  description: "Updated Descrição",
  order: 2,
  exercises: [],
  createdAt: "2026-06-13T00:00:00.000Z",
  updatedAt: "2026-06-14T00:00:00.000Z",
};

const UPDATE_WORKOUT_DATA: UpdateWorkoutDto = {
  name: "Updated Treino",
  description: "Updated Descrição",
  order: 2,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper, invalidateQueries };
}

describe("useUpdateWorkout", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("patches /workouts/:id and returns the updated workout", async () => {
    mockApiFetch.mockResolvedValueOnce(UPDATED_WORKOUT);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateWorkout("w1"), { wrapper: Wrapper });

    let response: WorkoutDetailDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync(UPDATE_WORKOUT_DATA);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/workouts/w1", {
      method: "PATCH",
      body: JSON.stringify(UPDATE_WORKOUT_DATA),
    });
    expect(response).toEqual(UPDATED_WORKOUT);
  });

  it("invalidates workout and strategy queries on success", async () => {
    mockApiFetch.mockResolvedValueOnce(UPDATED_WORKOUT);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useUpdateWorkout("w1"), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(UPDATE_WORKOUT_DATA);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["workout", "w1"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["strategy", "s1"] });
  });
});

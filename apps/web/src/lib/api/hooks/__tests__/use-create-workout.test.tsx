/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateWorkout } from "../use-create-workout";
import { apiFetch } from "../../client";
import type { CreateWorkoutDto, WorkoutDetailDto } from "@fitflow/types";

jest.mock("../../client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const CREATED_WORKOUT: WorkoutDetailDto = {
  id: "w1",
  strategyId: "s1",
  name: "Treino 1",
  description: "Descrição",
  order: 1,
  exercises: [],
  createdAt: "2026-06-13T00:00:00.000Z",
  updatedAt: "2026-06-13T00:00:00.000Z",
};

const CREATE_WORKOUT_DATA: CreateWorkoutDto = {
  strategyId: "s1",
  name: "Treino 1",
  description: "Descrição",
  order: 1,
  exercises: [],
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

describe("useCreateWorkout", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("posts to /workouts and returns the created workout", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_WORKOUT);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateWorkout(), { wrapper: Wrapper });

    let response: WorkoutDetailDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync(CREATE_WORKOUT_DATA);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/workouts", {
      method: "POST",
      body: JSON.stringify(CREATE_WORKOUT_DATA),
    });
    expect(response).toEqual(CREATED_WORKOUT);
  });

  it("invalidates strategy and strategies queries on success", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_WORKOUT);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useCreateWorkout(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(CREATE_WORKOUT_DATA);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["strategy", "s1"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["strategies"] });
  });

  it("throws ApiClientError with correct status on 422 error", async () => {
    const error = new ApiClientError(422, "PLAN_LIMIT_EXCEEDED");
    mockApiFetch.mockRejectedValueOnce(error);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateWorkout(), { wrapper: Wrapper });

    let thrownError: ApiClientError | undefined;
    await act(async () => {
      try {
        await result.current.mutateAsync(CREATE_WORKOUT_DATA);
      } catch (e) {
        thrownError = e as ApiClientError;
      }
    });

    expect(thrownError).toBeInstanceOf(ApiClientError);
    expect(thrownError?.status).toBe(422);
    expect(thrownError?.message).toBe("PLAN_LIMIT_EXCEEDED");
  });
});

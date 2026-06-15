/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateWorkoutSession } from "../use-create-workout-session";
import { apiFetch } from "../../client";
import type { CreateWorkoutSessionDto, WorkoutSessionDetailDto } from "@fitflow/types";

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

const CREATED_SESSION: WorkoutSessionDetailDto = {
  id: "session-1",
  workoutId: "w1",
  startedAt: "2026-06-15T10:00:00.000Z",
  endedAt: "2026-06-15T11:00:00.000Z",
  status: "FINISHED",
  comment: "Treino concluído",
  difficulty: 4,
  createdAt: "2026-06-15T11:00:00.000Z",
  exercises: [],
};

const CREATE_SESSION_DATA: CreateWorkoutSessionDto = {
  workoutId: "w1",
  startedAt: "2026-06-15T10:00:00.000Z",
  endedAt: "2026-06-15T11:00:00.000Z",
  comment: "Treino concluído",
  difficulty: 4,
  exercises: [
    {
      exerciseId: "exercise-1",
      order: 1,
      executedSets: [{ setNumber: 1, kg: 50, reps: 10, completedAt: "2026-06-15T10:10:00.000Z" }],
    },
  ],
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

describe("useCreateWorkoutSession", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("posts to /workout-sessions and returns the created session", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_SESSION);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateWorkoutSession(), { wrapper: Wrapper });

    let response: WorkoutSessionDetailDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync(CREATE_SESSION_DATA);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/workout-sessions", {
      method: "POST",
      body: JSON.stringify(CREATE_SESSION_DATA),
    });
    expect(response).toEqual(CREATED_SESSION);
  });

  it("invalidates last-session and workout-sessions queries on success", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_SESSION);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useCreateWorkoutSession(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(CREATE_SESSION_DATA);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["workout-session", "last", "w1"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["workout-sessions"] });
  });

  it("rejects with ApiClientError on API error", async () => {
    const error = new ApiClientError(400, "INVALID_PAYLOAD");
    mockApiFetch.mockRejectedValueOnce(error);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateWorkoutSession(), { wrapper: Wrapper });

    let thrownError: ApiClientError | undefined;
    await act(async () => {
      try {
        await result.current.mutateAsync(CREATE_SESSION_DATA);
      } catch (e) {
        thrownError = e as ApiClientError;
      }
    });

    expect(thrownError).toBeInstanceOf(ApiClientError);
    expect(thrownError?.status).toBe(400);
    expect(thrownError?.message).toBe("INVALID_PAYLOAD");
  });
});

/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLastFinishedSession } from "../use-last-finished-session";
import { apiFetch } from "../../client";
import type { PaginatedResponse, WorkoutSessionDetailDto, WorkoutSessionSummaryDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const SESSION_SUMMARY: WorkoutSessionSummaryDto = {
  id: "session-1",
  workoutId: "w1",
  startedAt: "2026-06-10T10:00:00.000Z",
  endedAt: "2026-06-10T11:00:00.000Z",
  status: "FINISHED",
  comment: "Bom treino",
  difficulty: 3,
  createdAt: "2026-06-10T11:00:00.000Z",
};

const SESSION_DETAIL: WorkoutSessionDetailDto = {
  ...SESSION_SUMMARY,
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

const EMPTY_PAGE: PaginatedResponse<WorkoutSessionSummaryDto> = {
  items: [],
  total: 0,
  nextCursor: null,
};

const PAGE_WITH_SESSION: PaginatedResponse<WorkoutSessionSummaryDto> = {
  items: [SESSION_SUMMARY],
  total: 1,
  nextCursor: null,
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

describe("useLastFinishedSession", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("returns null when there is no previous session", async () => {
    mockApiFetch.mockResolvedValueOnce(EMPTY_PAGE);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLastFinishedSession("w1"), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/workout-sessions?workoutId=w1&limit=1");
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBeNull();
  });

  it("returns the detailed session when a previous session exists", async () => {
    mockApiFetch.mockResolvedValueOnce(PAGE_WITH_SESSION);
    mockApiFetch.mockResolvedValueOnce(SESSION_DETAIL);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLastFinishedSession("w1"), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenNthCalledWith(1, "/workout-sessions?workoutId=w1&limit=1");
    expect(mockApiFetch).toHaveBeenNthCalledWith(2, "/workout-sessions/session-1");
    expect(mockApiFetch).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(SESSION_DETAIL);
  });

  it("does not fetch when workoutId is empty", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLastFinishedSession(""), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

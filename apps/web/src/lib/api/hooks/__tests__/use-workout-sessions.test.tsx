/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useWorkoutSessions } from "../use-workout-sessions";
import { apiFetch } from "../../client";
import type { PaginatedResponse, WorkoutSessionSummaryDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const SESSION_1: WorkoutSessionSummaryDto = {
  id: "session-1",
  workoutId: "w1",
  workoutName: "Treino A",
  startedAt: "2026-06-10T10:00:00.000Z",
  endedAt: "2026-06-10T11:00:00.000Z",
  status: "FINISHED",
  comment: "Bom treino",
  difficulty: 3,
  createdAt: "2026-06-10T11:00:00.000Z",
};

const SESSION_2: WorkoutSessionSummaryDto = {
  id: "session-2",
  workoutId: "w2",
  workoutName: "Treino B",
  startedAt: "2026-06-09T10:00:00.000Z",
  endedAt: "2026-06-09T11:00:00.000Z",
  status: "FINISHED",
  comment: null,
  difficulty: 5,
  createdAt: "2026-06-09T11:00:00.000Z",
};

const EMPTY_PAGE: PaginatedResponse<WorkoutSessionSummaryDto> = {
  items: [],
  total: 0,
  nextCursor: null,
};

const PAGE_1: PaginatedResponse<WorkoutSessionSummaryDto> = {
  items: [SESSION_1],
  total: 2,
  nextCursor: "cursor-abc",
};

const PAGE_2: PaginatedResponse<WorkoutSessionSummaryDto> = {
  items: [SESSION_2],
  total: 2,
  nextCursor: null,
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper, queryClient };
}

describe("useWorkoutSessions", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("retorna a primeira página com itens", async () => {
    mockApiFetch.mockResolvedValueOnce(PAGE_1);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkoutSessions(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/workout-sessions?limit=20");
    const items = result.current.data?.pages[0].items ?? [];
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("session-1");
    expect(items[0].workoutName).toBe("Treino A");
  });

  it("retorna página vazia sem itens", async () => {
    mockApiFetch.mockResolvedValueOnce(EMPTY_PAGE);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkoutSessions(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages[0].items).toHaveLength(0);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("getNextPageParam retorna cursor quando nextCursor está preenchido", async () => {
    mockApiFetch.mockResolvedValueOnce(PAGE_1);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkoutSessions(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(true);
  });

  it("getNextPageParam retorna null quando nextCursor é null", async () => {
    mockApiFetch.mockResolvedValueOnce(PAGE_2);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkoutSessions(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasNextPage).toBe(false);
  });

  it("busca próxima página com cursor correto", async () => {
    mockApiFetch.mockResolvedValueOnce(PAGE_1).mockResolvedValueOnce(PAGE_2);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkoutSessions(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    act(() => {
      result.current.fetchNextPage();
    });

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    }, { timeout: 3000 });

    expect(mockApiFetch).toHaveBeenNthCalledWith(2, "/workout-sessions?limit=20&cursor=cursor-abc");
    const allItems = result.current.data?.pages.flatMap((p) => p.items) ?? [];
    expect(allItems).toHaveLength(2);
  });
});

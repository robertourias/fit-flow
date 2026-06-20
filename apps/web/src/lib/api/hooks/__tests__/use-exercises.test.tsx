/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useExercises } from "../use-exercises";
import { apiFetch } from "../../client";
import type { ExerciseDto, PaginatedResponse } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function buildExercise(id: string, name: string): ExerciseDto {
  return {
    id,
    name,
    description: null,
    imageUrl: null,
    videoUrl: null,
    category: "STRENGTH",
    isArchived: false,
    tenantId: null,
    muscleGroups: [],
    equipment: [],
    createdAt: "2026-06-13T00:00:00.000Z",
    updatedAt: "2026-06-13T00:00:00.000Z",
  };
}

function buildPage(items: ExerciseDto[], nextCursor: string | null): PaginatedResponse<ExerciseDto> {
  return { items, total: items.length, nextCursor };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper };
}

describe("useExercises", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("fetches the first page with no query params when no filters are given", async () => {
    mockApiFetch.mockResolvedValue(buildPage([buildExercise("ex1", "Supino")], null));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useExercises(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiFetch).toHaveBeenCalledWith("/exercises?");
    expect(result.current.data?.pages[0].items).toHaveLength(1);
  });

  it("builds query params from search, muscleGroupSlug, equipmentSlug and category filters", async () => {
    mockApiFetch.mockResolvedValue(buildPage([], null));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () =>
        useExercises({
          search: "supino",
          muscleGroupSlug: "peito",
          equipmentSlug: "barra",
          category: "STRENGTH",
        }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledPath = mockApiFetch.mock.calls[0][0] as string;
    expect(calledPath.startsWith("/exercises?")).toBe(true);
    const params = new URLSearchParams(calledPath.split("?")[1]);
    expect(params.get("search")).toBe("supino");
    expect(params.get("muscleGroupSlug")).toBe("peito");
    expect(params.get("equipmentSlug")).toBe("barra");
    expect(params.get("category")).toBe("STRENGTH");
  });

  it("requests the next page using nextCursor returned by the previous page", async () => {
    mockApiFetch
      .mockResolvedValueOnce(buildPage([buildExercise("ex1", "Supino")], "cursor-2"))
      .mockResolvedValueOnce(buildPage([buildExercise("ex2", "Agachamento")], null));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useExercises(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await result.current.fetchNextPage();

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    const secondCallPath = mockApiFetch.mock.calls[1][0] as string;
    expect(secondCallPath).toContain("cursor=cursor-2");
    expect(result.current.hasNextPage).toBe(false);
  });
});

/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useExercisesByIds } from "../use-exercises-by-ids";
import { apiFetch } from "../../client";
import type { ExerciseDto } from "@fitflow/types";

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

const EXERCISE_1 = buildExercise("ex1", "Supino");
const EXERCISE_2 = buildExercise("ex2", "Agachamento");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper };
}

describe("useExercisesByIds", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("fetches /exercises/:id for each id and returns the results in order", async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path === "/exercises/ex1") return Promise.resolve(EXERCISE_1);
      if (path === "/exercises/ex2") return Promise.resolve(EXERCISE_2);
      return Promise.reject(new Error(`unexpected path: ${path}`));
    });
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useExercisesByIds(["ex1", "ex2"]), { wrapper: Wrapper });

    expect(result.current).toHaveLength(2);

    await waitFor(() => {
      expect(result.current.every((r) => r.isSuccess)).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/exercises/ex1");
    expect(mockApiFetch).toHaveBeenCalledWith("/exercises/ex2");
    expect(result.current[0].data).toEqual(EXERCISE_1);
    expect(result.current[1].data).toEqual(EXERCISE_2);
  });

  it("returns an empty array and does not fetch when ids is empty", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useExercisesByIds([]), { wrapper: Wrapper });

    expect(result.current).toEqual([]);
    await waitFor(() => {
      expect(mockApiFetch).not.toHaveBeenCalled();
    });
  });
});

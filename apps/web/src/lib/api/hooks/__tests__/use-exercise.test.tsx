/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useExercise } from "../use-exercise";
import { apiFetch } from "../../client";
import type { ExerciseDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const EXERCISE_DETAIL: ExerciseDto = {
  id: "ex1",
  name: "Supino",
  description: "Exercício de peito",
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper };
}

describe("useExercise", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("fetches /exercises/:id and returns exercise data", async () => {
    mockApiFetch.mockResolvedValueOnce(EXERCISE_DETAIL);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useExercise("ex1"), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/exercises/ex1");
    expect(result.current.data).toEqual(EXERCISE_DETAIL);
  });

  it("does not fetch when id is empty string", async () => {
    const { Wrapper } = createWrapper();
    renderHook(() => useExercise(""), { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockApiFetch).not.toHaveBeenCalled();
    });
  });

  it("does not fetch when id is falsy", async () => {
    const { Wrapper } = createWrapper();
    // @ts-expect-error Testing falsy value behavior
    renderHook(() => useExercise(null), { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockApiFetch).not.toHaveBeenCalled();
    });
  });
});

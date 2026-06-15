/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useDeleteWorkout } from "../use-delete-workout";
import { apiFetch } from "../../client";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

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

describe("useDeleteWorkout", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("deletes /workouts/:id", async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteWorkout(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "w1", strategyId: "s1" });
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/workouts/w1", { method: "DELETE" });
  });

  it("invalidates strategy query on success", async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useDeleteWorkout(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "w1", strategyId: "s1" });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["strategy", "s1"] });
  });
});

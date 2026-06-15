/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateStrategy } from "../use-create-strategy";
import { apiFetch } from "../../client";
import type { StrategySummaryDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const CREATED_STRATEGY: StrategySummaryDto = {
  id: "s1",
  name: "Treino A",
  type: null,
  description: null,
  isActive: true,
  workouts: [],
  createdAt: "2026-06-13T00:00:00.000Z",
  updatedAt: "2026-06-13T00:00:00.000Z",
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

describe("useCreateStrategy", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("posts to /strategies and returns the created strategy", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_STRATEGY);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateStrategy(), { wrapper: Wrapper });

    let response: StrategySummaryDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({ name: "Treino A" });
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/strategies", {
      method: "POST",
      body: JSON.stringify({ name: "Treino A" }),
    });
    expect(response).toEqual(CREATED_STRATEGY);
  });

  it("invalidates the strategies query on success", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_STRATEGY);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useCreateStrategy(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: "Treino A" });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["strategies"] });
  });
});

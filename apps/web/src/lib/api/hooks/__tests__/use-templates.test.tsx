/**
 * @jest-environment jsdom
 */
import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTemplates } from "../use-templates";
import { useImportTemplate } from "../use-import-template";
import { apiFetch } from "@/lib/api/client";
import type { StrategySummaryDto } from "@fitflow/types";

jest.mock("@/lib/api/client");

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper, invalidateQueries };
}

const TEMPLATE = {
  id: "t1", name: "PPL — Iniciante", type: "PPL", description: "6 treinos.",
  workoutsCount: 6, workoutNames: ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B"],
  muscleGroups: ["Peito", "Costas", "Ombros"],
};

const MOCK_STRATEGY: StrategySummaryDto = {
  id: "s1", name: "PPL", type: "PPL", description: null,
  isActive: true, workouts: [], createdAt: "", updatedAt: "",
};

describe("useTemplates", () => {
  beforeEach(() => mockApiFetch.mockReset());

  it("retorna lista de templates", async () => {
    mockApiFetch.mockResolvedValueOnce([TEMPLATE] as never);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTemplates(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([TEMPLATE]);
    expect(apiFetch).toHaveBeenCalledWith("/explore/templates");
  });

  it("retorna lista vazia", async () => {
    mockApiFetch.mockResolvedValueOnce([] as never);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTemplates(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("useImportTemplate", () => {
  beforeEach(() => mockApiFetch.mockReset());

  it("chama POST /explore/templates/:id/import e invalida cache", async () => {
    mockApiFetch.mockResolvedValueOnce(MOCK_STRATEGY as never);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useImportTemplate(), { wrapper: Wrapper });

    let response: StrategySummaryDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync("t1");
    });

    expect(apiFetch).toHaveBeenCalledWith("/explore/templates/t1/import", { method: "POST" });
    expect(response).toEqual(MOCK_STRATEGY);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["strategies"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["workouts-limit"] });
  });
});

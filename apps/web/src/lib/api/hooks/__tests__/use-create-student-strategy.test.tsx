/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateStudentStrategy } from "../use-create-student-strategy";
import { apiFetch } from "../../client";
import type { StrategySummaryDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const CREATED_STRATEGY: StrategySummaryDto = {
  id: "s1",
  name: "Treino do Aluno",
  type: null,
  description: null,
  isActive: true,
  workouts: [],
  createdAt: "2026-06-18T00:00:00.000Z",
  updatedAt: "2026-06-18T00:00:00.000Z",
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

describe("useCreateStudentStrategy", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("posts to /coaching/students/:studentId/strategies e retorna a estratégia criada", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_STRATEGY);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateStudentStrategy("student-1"), { wrapper: Wrapper });

    let response: StrategySummaryDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({ name: "Treino do Aluno" });
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/students/student-1/strategies", {
      method: "POST",
      body: JSON.stringify({ name: "Treino do Aluno" }),
    });
    expect(response).toEqual(CREATED_STRATEGY);
  });

  it("invalida o dashboard do aluno ao concluir", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_STRATEGY);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useCreateStudentStrategy("student-1"), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: "Treino do Aluno" });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["coaching", "student-dashboard", "student-1"],
    });
  });
});

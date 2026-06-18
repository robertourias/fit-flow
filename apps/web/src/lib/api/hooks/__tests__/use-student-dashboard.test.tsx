/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useStudentDashboard } from "../use-student-dashboard";
import { apiFetch } from "../../client";
import type { DashboardSummaryDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const SUMMARY: DashboardSummaryDto = {
  diasEstaSemana: 3,
  treinosNoMes: 10,
  treinosNoMesDelta: 2,
  diasSequencia: 4,
  volumeSemanal: 1200,
  volumeData: [{ dia: "Seg", volume: 100 }],
  muscleGroups: [{ nome: "Peito", percentual: 30 }],
  trainDates: [1, 5, 10],
  workoutsCount: 5,
  durationData: [{ dia: "Seg", totalMinutos: 60 }],
  semanalDuracao: 240,
  heatmapData: [{ date: "2026-06-10", count: 1 }],
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

describe("useStudentDashboard", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("retorna o dashboard do aluno para studentId válido", async () => {
    mockApiFetch.mockResolvedValueOnce(SUMMARY);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useStudentDashboard("student-1"), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/students/student-1/dashboard");
    expect(result.current.data).toEqual(SUMMARY);
  });

  it("não faz fetch quando studentId é vazio (enabled: false)", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useStudentDashboard(""), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

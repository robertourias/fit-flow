/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTrainers } from "../use-trainers";
import { apiFetch } from "../../client";
import type { RelationshipDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const TRAINERS: RelationshipDto[] = [
  {
    id: "rel-1",
    trainerId: "trainer-1",
    trainerName: "Treinador A",
    studentId: "student-1",
    studentName: "Aluno A",
    status: "PENDING",
    initiatedBy: "TRAINER",
    startedAt: "2026-06-10T00:00:00.000Z",
    endedAt: null,
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper };
}

describe("useTrainers", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("busca /coaching/trainers sem filtro de status", async () => {
    mockApiFetch.mockResolvedValueOnce(TRAINERS);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTrainers(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/trainers");
    expect(result.current.data).toEqual(TRAINERS);
  });

  it("busca /coaching/trainers?status=PENDING quando status é informado", async () => {
    mockApiFetch.mockResolvedValueOnce(TRAINERS);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTrainers("PENDING"), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/trainers?status=PENDING");
  });
});

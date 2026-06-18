/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useStudents } from "../use-students";
import { apiFetch } from "../../client";
import type { RelationshipDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const STUDENTS: RelationshipDto[] = [
  {
    id: "rel-1",
    trainerId: "trainer-1",
    trainerName: "Treinador A",
    studentId: "student-1",
    studentName: "Aluno A",
    status: "ACTIVE",
    initiatedBy: "STUDENT",
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

describe("useStudents", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("busca /coaching/students sem filtro de status", async () => {
    mockApiFetch.mockResolvedValueOnce(STUDENTS);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useStudents(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/students");
    expect(result.current.data).toEqual(STUDENTS);
  });

  it("busca /coaching/students?status=ACTIVE quando status é informado", async () => {
    mockApiFetch.mockResolvedValueOnce(STUDENTS);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useStudents("ACTIVE"), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/students?status=ACTIVE");
  });
});

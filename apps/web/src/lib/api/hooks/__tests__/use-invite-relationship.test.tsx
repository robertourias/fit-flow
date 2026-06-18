/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useInviteRelationship } from "../use-invite-relationship";
import { apiFetch } from "../../client";
import type { RelationshipDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const CREATED_RELATIONSHIP: RelationshipDto = {
  id: "rel-1",
  trainerId: "trainer-1",
  trainerName: "Treinador A",
  studentId: "student-1",
  studentName: "Aluno A",
  status: "PENDING",
  initiatedBy: "TRAINER",
  startedAt: "2026-06-18T00:00:00.000Z",
  endedAt: null,
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

describe("useInviteRelationship", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("posts to /coaching/relationships e retorna o vínculo criado", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_RELATIONSHIP);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useInviteRelationship(), { wrapper: Wrapper });

    let response: RelationshipDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({ targetEmail: "aluno@example.com" });
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/relationships", {
      method: "POST",
      body: JSON.stringify({ targetEmail: "aluno@example.com" }),
    });
    expect(response).toEqual(CREATED_RELATIONSHIP);
  });

  it("invalida as listas de students e trainers ao concluir", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_RELATIONSHIP);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useInviteRelationship(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ targetEmail: "aluno@example.com" });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["coaching", "students"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["coaching", "trainers"] });
  });
});

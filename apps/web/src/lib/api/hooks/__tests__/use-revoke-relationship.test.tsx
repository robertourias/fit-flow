/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useRevokeRelationship } from "../use-revoke-relationship";
import { apiFetch } from "../../client";
import type { RelationshipDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const REVOKED_RELATIONSHIP: RelationshipDto = {
  id: "rel-1",
  trainerId: "trainer-1",
  trainerName: "Treinador A",
  studentId: "student-1",
  studentName: "Aluno A",
  status: "REVOKED",
  initiatedBy: "TRAINER",
  startedAt: "2026-06-18T00:00:00.000Z",
  endedAt: "2026-06-18T12:00:00.000Z",
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

describe("useRevokeRelationship", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("patches /coaching/relationships/:id com action REVOKE", async () => {
    mockApiFetch.mockResolvedValueOnce(REVOKED_RELATIONSHIP);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRevokeRelationship(), { wrapper: Wrapper });

    let response: RelationshipDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync("rel-1");
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/relationships/rel-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "REVOKE" }),
    });
    expect(response).toEqual(REVOKED_RELATIONSHIP);
  });

  it("invalida as listas de students e trainers ao concluir", async () => {
    mockApiFetch.mockResolvedValueOnce(REVOKED_RELATIONSHIP);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useRevokeRelationship(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("rel-1");
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["coaching", "students"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["coaching", "trainers"] });
  });
});

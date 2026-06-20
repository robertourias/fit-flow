/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useRespondRelationship } from "../use-respond-relationship";
import { apiFetch } from "../../client";
import type { RelationshipDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const ACCEPTED_RELATIONSHIP: RelationshipDto = {
  id: "rel-1",
  trainerId: "trainer-1",
  trainerName: "Treinador A",
  studentId: "student-1",
  studentName: "Aluno A",
  status: "ACTIVE",
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

describe("useRespondRelationship", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("patches /coaching/relationships/:id com action ACCEPT", async () => {
    mockApiFetch.mockResolvedValueOnce(ACCEPTED_RELATIONSHIP);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRespondRelationship(), { wrapper: Wrapper });

    let response: RelationshipDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({ id: "rel-1", action: "ACCEPT" });
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/relationships/rel-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "ACCEPT" }),
    });
    expect(response).toEqual(ACCEPTED_RELATIONSHIP);
  });

  it("patches /coaching/relationships/:id com action REJECT", async () => {
    mockApiFetch.mockResolvedValueOnce({ ...ACCEPTED_RELATIONSHIP, status: "REVOKED" });
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useRespondRelationship(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "rel-1", action: "REJECT" });
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/relationships/rel-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "REJECT" }),
    });
  });

  it("invalida as listas de students e trainers ao concluir", async () => {
    mockApiFetch.mockResolvedValueOnce(ACCEPTED_RELATIONSHIP);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useRespondRelationship(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "rel-1", action: "ACCEPT" });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["coaching", "students"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["coaching", "trainers"] });
  });
});

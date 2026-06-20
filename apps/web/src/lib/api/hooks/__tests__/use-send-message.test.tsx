/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useSendMessage } from "../use-send-message";
import { apiFetch, ApiClientError } from "../../client";
import type { MessageDto } from "@fitflow/types";

jest.mock("../../client", () => {
  const actual = jest.requireActual("../../client");
  return {
    ...actual,
    apiFetch: jest.fn(),
  };
});

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const SENT_MESSAGE: MessageDto = {
  id: "msg-1",
  relationshipId: "rel-1",
  senderId: "student-1",
  content: "Bom dia, professor!",
  createdAt: "2026-06-18T10:00:00.000Z",
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

describe("useSendMessage", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("envia POST para /coaching/relationships/:id/messages e retorna a mensagem criada", async () => {
    mockApiFetch.mockResolvedValueOnce(SENT_MESSAGE);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSendMessage("rel-1"), { wrapper: Wrapper });

    let response: MessageDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync({ content: "Bom dia, professor!" });
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/relationships/rel-1/messages", {
      method: "POST",
      body: JSON.stringify({ content: "Bom dia, professor!" }),
    });
    expect(response).toEqual(SENT_MESSAGE);
  });

  it("invalida a query de mensagens do vínculo ao concluir", async () => {
    mockApiFetch.mockResolvedValueOnce(SENT_MESSAGE);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useSendMessage("rel-1"), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ content: "Bom dia, professor!" });
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["coaching", "messages", "rel-1"] });
  });

  it("expõe ApiClientError com status 422 quando a moderação bloqueia o conteúdo", async () => {
    mockApiFetch.mockRejectedValueOnce(new ApiClientError(422, "Conteúdo bloqueado pela moderação"));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSendMessage("rel-1"), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ content: "palavrão" })).rejects.toBeInstanceOf(ApiClientError);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error).toBeInstanceOf(ApiClientError);
    expect((result.current.error as ApiClientError).status).toBe(422);
    expect((result.current.error as ApiClientError).message).toBe("Conteúdo bloqueado pela moderação");
  });
});

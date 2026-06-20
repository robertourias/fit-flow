/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMessages } from "../use-messages";
import { apiFetch } from "../../client";
import type { MessageListResponseDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const MESSAGES_PAGE: MessageListResponseDto = {
  items: [
    {
      id: "msg-1",
      relationshipId: "rel-1",
      senderId: "trainer-1",
      content: "Olá, como foi o treino?",
      createdAt: "2026-06-18T10:00:00.000Z",
    },
  ],
  total: 1,
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

describe("useMessages", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("busca mensagens do vínculo sem parâmetros de paginação", async () => {
    mockApiFetch.mockResolvedValueOnce(MESSAGES_PAGE);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMessages("rel-1"), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/relationships/rel-1/messages");
    expect(result.current.data).toEqual(MESSAGES_PAGE);
  });

  it("busca mensagens com limit e offset quando informados", async () => {
    mockApiFetch.mockResolvedValueOnce(MESSAGES_PAGE);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMessages("rel-1", { limit: 20, offset: 40 }), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/relationships/rel-1/messages?limit=20&offset=40");
  });

  it("não busca quando relationshipId está vazio", () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMessages(""), { wrapper: Wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

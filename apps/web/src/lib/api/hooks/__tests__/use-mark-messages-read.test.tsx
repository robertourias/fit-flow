/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMarkMessagesRead } from "../use-mark-messages-read";
import { apiFetch } from "../../client";
import type { MarkMessagesReadResponseDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const READ_RESPONSE: MarkMessagesReadResponseDto = { lastReadAt: "2026-06-18T10:05:00.000Z" };

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

describe("useMarkMessagesRead", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("envia PATCH para /coaching/relationships/:id/messages/read e retorna lastReadAt", async () => {
    mockApiFetch.mockResolvedValueOnce(READ_RESPONSE);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMarkMessagesRead("rel-1"), { wrapper: Wrapper });

    let response: MarkMessagesReadResponseDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync();
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/relationships/rel-1/messages/read", {
      method: "PATCH",
    });
    expect(response).toEqual(READ_RESPONSE);
  });

  it("invalida a query de mensagens do vínculo ao concluir", async () => {
    mockApiFetch.mockResolvedValueOnce(READ_RESPONSE);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useMarkMessagesRead("rel-1"), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["coaching", "messages", "rel-1"] });
  });
});

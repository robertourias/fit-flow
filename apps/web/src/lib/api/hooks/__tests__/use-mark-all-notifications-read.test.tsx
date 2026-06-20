/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMarkAllNotificationsRead } from "../use-mark-all-notifications-read";
import { apiFetch } from "../../client";
import type { MarkAllNotificationsReadResponseDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const RESPONSE: MarkAllNotificationsReadResponseDto = { updated: 3 };

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

describe("useMarkAllNotificationsRead", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("envia PATCH para /notifications/read-all e retorna a contagem atualizada", async () => {
    mockApiFetch.mockResolvedValueOnce(RESPONSE);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMarkAllNotificationsRead(), { wrapper: Wrapper });

    let response: MarkAllNotificationsReadResponseDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync();
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/notifications/read-all", { method: "PATCH" });
    expect(response).toEqual(RESPONSE);
  });

  it("invalida a query de notificações ao concluir", async () => {
    mockApiFetch.mockResolvedValueOnce(RESPONSE);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useMarkAllNotificationsRead(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });
});

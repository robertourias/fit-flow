/**
 * @jest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMarkNotificationRead } from "../use-mark-notification-read";
import { apiFetch, ApiClientError } from "../../client";
import type { NotificationDto } from "@fitflow/types";

jest.mock("../../client", () => {
  const actual = jest.requireActual("../../client");
  return {
    ...actual,
    apiFetch: jest.fn(),
  };
});

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const READ_NOTIFICATION: NotificationDto = {
  id: "notif-1",
  type: "NEW_MESSAGE",
  payload: { relationshipId: "rel-1", messageId: "msg-1", senderId: "trainer-1" },
  read: true,
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

describe("useMarkNotificationRead", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("envia PATCH para /notifications/:id/read e retorna a notificação atualizada", async () => {
    mockApiFetch.mockResolvedValueOnce(READ_NOTIFICATION);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper: Wrapper });

    let response: NotificationDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync("notif-1");
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/notifications/notif-1/read", { method: "PATCH" });
    expect(response).toEqual(READ_NOTIFICATION);
  });

  it("invalida a query de notificações ao concluir", async () => {
    mockApiFetch.mockResolvedValueOnce(READ_NOTIFICATION);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("notif-1");
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });

  it("propaga ApiClientError com status 404 quando a notificação não pertence ao usuário", async () => {
    mockApiFetch.mockRejectedValueOnce(new ApiClientError(404, "Notificação não encontrada"));
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useMarkNotificationRead(), { wrapper: Wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync("notif-x")).rejects.toBeInstanceOf(ApiClientError);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect((result.current.error as ApiClientError).status).toBe(404);
  });
});

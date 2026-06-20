/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useNotifications } from "../use-notifications";
import { apiFetch } from "../../client";
import type { NotificationDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const NOTIFICATIONS: NotificationDto[] = [
  {
    id: "notif-1",
    type: "NEW_MESSAGE",
    payload: { relationshipId: "rel-1", messageId: "msg-1", senderId: "trainer-1" },
    read: false,
    createdAt: "2026-06-18T10:00:00.000Z",
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

describe("useNotifications", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("busca /notifications sem filtro", async () => {
    mockApiFetch.mockResolvedValueOnce(NOTIFICATIONS);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotifications(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/notifications");
    expect(result.current.data).toEqual(NOTIFICATIONS);
  });

  it("busca /notifications?unread=true quando unread é true", async () => {
    mockApiFetch.mockResolvedValueOnce(NOTIFICATIONS);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotifications(true), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/notifications?unread=true");
  });

  it("busca /notifications sem query string quando unread é false", async () => {
    mockApiFetch.mockResolvedValueOnce(NOTIFICATIONS);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotifications(false), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/notifications");
  });
});

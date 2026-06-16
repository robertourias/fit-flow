/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useUserMe } from "../use-user-me";
import { apiFetch } from "../../client";
import type { UserMeDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const USER_FREE: UserMeDto = {
  id: "user-1",
  email: "user@example.com",
  name: "John Doe",
  avatarUrl: null,
  bio: null,
  age: null,
  goals: [],
  isTrainer: false,
  plan: "FREE",
  hasOnboarded: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const USER_PRO: UserMeDto = {
  ...USER_FREE,
  id: "user-2",
  plan: "PRO",
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

describe("useUserMe", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("retorna UserMeDto do endpoint /users/me", async () => {
    mockApiFetch.mockResolvedValueOnce(USER_FREE);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserMe(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/users/me");
    expect(result.current.data).toEqual(USER_FREE);
  });

  it("retorna usuário com plan FREE", async () => {
    mockApiFetch.mockResolvedValueOnce(USER_FREE);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserMe(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.plan).toBe("FREE");
  });

  it("retorna usuário com plan PRO", async () => {
    mockApiFetch.mockResolvedValueOnce(USER_PRO);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUserMe(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.plan).toBe("PRO");
  });
});

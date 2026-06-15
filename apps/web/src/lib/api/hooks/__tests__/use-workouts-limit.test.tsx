/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useWorkoutsLimit } from "../use-workouts-limit";
import { apiFetch } from "../../client";
import type { WorkoutsLimitDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const FREE_LIMIT: WorkoutsLimitDto = {
  count: 4,
  limit: 6,
  plan: "FREE",
};

const PRO_LIMIT: WorkoutsLimitDto = {
  count: 11,
  limit: null,
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

describe("useWorkoutsLimit", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("fetches /workouts/limit and returns FREE plan data", async () => {
    mockApiFetch.mockResolvedValueOnce(FREE_LIMIT);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkoutsLimit(), { wrapper: Wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/workouts/limit");
    expect(result.current.data).toEqual(FREE_LIMIT);
  });

  it("fetches /workouts/limit and returns PRO plan data (no limit)", async () => {
    mockApiFetch.mockResolvedValueOnce(PRO_LIMIT);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useWorkoutsLimit(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/workouts/limit");
    expect(result.current.data).toEqual(PRO_LIMIT);
  });
});

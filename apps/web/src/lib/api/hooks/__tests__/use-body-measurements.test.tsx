/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useBodyMeasurements } from "../use-body-measurements";
import { useCreateBodyMeasurement } from "../use-create-body-measurement";
import { useUpdateBodyMeasurement } from "../use-update-body-measurement";
import { useDeleteBodyMeasurement } from "../use-delete-body-measurement";
import { apiFetch } from "../../client";
import type { BodyMeasurementDto, PaginatedResponse } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const MEASUREMENT_1: BodyMeasurementDto = {
  id: "m-1",
  tenantId: "t-1",
  measuredAt: "2026-06-16T00:00:00.000Z",
  weight: 80.5,
  neck: null,
  chest: null,
  waist: 85,
  hip: null,
  leftArm: null,
  rightArm: null,
  leftThigh: null,
  rightThigh: null,
  calf: null,
  bodyFatPct: 18.5,
  muscleMassPct: null,
  visceralFat: null,
  notes: null,
  createdAt: "2026-06-16T12:00:00.000Z",
  updatedAt: "2026-06-16T12:00:00.000Z",
};

const PAGE_1: PaginatedResponse<BodyMeasurementDto> = {
  items: [MEASUREMENT_1],
  total: 1,
  nextCursor: null,
};

const EMPTY_PAGE: PaginatedResponse<BodyMeasurementDto> = { items: [], total: 0, nextCursor: null };

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper, queryClient };
}

describe("useBodyMeasurements", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("retorna lista paginada", async () => {
    mockApiFetch.mockResolvedValueOnce(PAGE_1);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useBodyMeasurements(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApiFetch).toHaveBeenCalledWith("/body-measurements?limit=20");
    expect(result.current.data?.pages[0].items[0].id).toBe("m-1");
  });

  it("retorna página vazia", async () => {
    mockApiFetch.mockResolvedValueOnce(EMPTY_PAGE);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useBodyMeasurements(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].items).toHaveLength(0);
    expect(result.current.hasNextPage).toBe(false);
  });

  it("busca próxima página com cursor", async () => {
    const page1: PaginatedResponse<BodyMeasurementDto> = { items: [MEASUREMENT_1], total: 2, nextCursor: "cursor-x" };
    const page2: PaginatedResponse<BodyMeasurementDto> = { ...EMPTY_PAGE, total: 2 };
    mockApiFetch.mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useBodyMeasurements(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => { result.current.fetchNextPage(); });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2), { timeout: 3000 });
    expect(mockApiFetch).toHaveBeenNthCalledWith(2, "/body-measurements?limit=20&cursor=cursor-x");
  });
});

describe("useCreateBodyMeasurement", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("invoca POST e invalida cache", async () => {
    mockApiFetch.mockResolvedValueOnce(MEASUREMENT_1);
    const { Wrapper, queryClient } = createWrapper();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useCreateBodyMeasurement(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ measuredAt: "2026-06-16", weight: 80 });
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/body-measurements", expect.objectContaining({ method: "POST" }));
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["body-measurements"] }));
  });
});

describe("useUpdateBodyMeasurement", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("invoca PATCH e invalida cache do item e lista", async () => {
    mockApiFetch.mockResolvedValueOnce({ ...MEASUREMENT_1, weight: 81 });
    const { Wrapper, queryClient } = createWrapper();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateBodyMeasurement(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: "m-1", data: { weight: 81 } });
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/body-measurements/m-1", expect.objectContaining({ method: "PATCH" }));
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["body-measurements"] }));
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["body-measurement", "m-1"] }));
  });
});

describe("useDeleteBodyMeasurement", () => {
  beforeEach(() => { mockApiFetch.mockReset(); });

  it("invoca DELETE e invalida cache", async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);
    const { Wrapper, queryClient } = createWrapper();
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteBodyMeasurement(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync("m-1");
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/body-measurements/m-1", expect.objectContaining({ method: "DELETE" }));
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ["body-measurements"] }));
  });
});

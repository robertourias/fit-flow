/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { MeasurementsPage } from "../MeasurementsPage";
import { useBodyMeasurements } from "@/lib/api/hooks/use-body-measurements";
import { useDeleteBodyMeasurement } from "@/lib/api/hooks/use-delete-body-measurement";
import { useUserMe } from "@/lib/api/hooks/use-user-me";

jest.mock("@/lib/api/hooks/use-body-measurements");
jest.mock("@/lib/api/hooks/use-delete-body-measurement");
jest.mock("@/lib/api/hooks/use-user-me");
jest.mock("@/lib/api/hooks/use-create-body-measurement", () => ({
  useCreateBodyMeasurement: () => ({ mutateAsync: jest.fn(), error: null }),
}));
jest.mock("@/lib/api/hooks/use-update-body-measurement", () => ({
  useUpdateBodyMeasurement: () => ({ mutateAsync: jest.fn(), error: null }),
}));
jest.mock("../MeasurementFormDialog", () => ({
  MeasurementFormDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="form-dialog">dialog</div> : null,
}));

const MEASUREMENT = {
  id: "m-1",
  tenantId: "t-1",
  measuredAt: "2026-06-16T12:00:00.000Z",
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

const defaultMeasurementsMock = {
  data: undefined,
  isLoading: false,
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
};

const defaultDeleteMock = { mutateAsync: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  (useBodyMeasurements as jest.Mock).mockReturnValue(defaultMeasurementsMock);
  (useDeleteBodyMeasurement as jest.Mock).mockReturnValue(defaultDeleteMock);
  (useUserMe as jest.Mock).mockReturnValue({ data: { plan: "PRO" } });
});

describe("MeasurementsPage", () => {
  it("renders skeleton while loading", () => {
    (useBodyMeasurements as jest.Mock).mockReturnValue({
      ...defaultMeasurementsMock,
      isLoading: true,
    });

    render(<MeasurementsPage />);
    expect(screen.getByRole("list", { name: "Carregando medidas" })).toBeInTheDocument();
  });

  it("renders empty state when no measurements", () => {
    (useBodyMeasurements as jest.Mock).mockReturnValue({
      ...defaultMeasurementsMock,
      data: { pages: [{ items: [], total: 0, nextCursor: null }], pageParams: [null] },
    });

    render(<MeasurementsPage />);
    expect(screen.getByText("Nenhuma medida registrada ainda.")).toBeInTheDocument();
  });

  it("renders measurement list items", () => {
    (useBodyMeasurements as jest.Mock).mockReturnValue({
      ...defaultMeasurementsMock,
      data: { pages: [{ items: [MEASUREMENT], total: 1, nextCursor: null }], pageParams: [null] },
    });

    render(<MeasurementsPage />);
    expect(screen.getByText("16/06/2026")).toBeInTheDocument();
    expect(screen.getByText(/Peso: 80.5 kg/)).toBeInTheDocument();
    expect(screen.getByText(/Cintura: 85 cm/)).toBeInTheDocument();
    expect(screen.getByText(/Gordura: 18.5%/)).toBeInTheDocument();
  });

  it("shows FREE banner for FREE plan", () => {
    (useUserMe as jest.Mock).mockReturnValue({ data: { plan: "FREE" } });
    (useBodyMeasurements as jest.Mock).mockReturnValue({
      ...defaultMeasurementsMock,
      data: { pages: [{ items: [MEASUREMENT], total: 1, nextCursor: null }], pageParams: [null] },
    });

    render(<MeasurementsPage />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/60 dias/)).toBeInTheDocument();
  });

  it("does not show FREE banner for PRO plan", () => {
    (useBodyMeasurements as jest.Mock).mockReturnValue({
      ...defaultMeasurementsMock,
      data: { pages: [{ items: [MEASUREMENT], total: 1, nextCursor: null }], pageParams: [null] },
    });

    render(<MeasurementsPage />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("opens form dialog on Novo registro click", () => {
    (useBodyMeasurements as jest.Mock).mockReturnValue({
      ...defaultMeasurementsMock,
      data: { pages: [{ items: [], total: 0, nextCursor: null }], pageParams: [null] },
    });

    render(<MeasurementsPage />);
    fireEvent.click(screen.getAllByRole("button", { name: /Novo registro|Adicionar medida/i })[0]);
    expect(screen.getByTestId("form-dialog")).toBeInTheDocument();
  });

  it("shows Carregar mais when hasNextPage", () => {
    const fetchNextPage = jest.fn();
    (useBodyMeasurements as jest.Mock).mockReturnValue({
      data: { pages: [{ items: [MEASUREMENT], total: 10, nextCursor: "x" }], pageParams: [null] },
      isLoading: false,
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    });

    render(<MeasurementsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });
});

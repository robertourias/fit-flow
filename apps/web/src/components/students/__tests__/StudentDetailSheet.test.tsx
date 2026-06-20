/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { StudentDetailSheet } from "../StudentDetailSheet";
import { useStudentDashboard } from "@/lib/api/hooks/use-student-dashboard";
import type { DashboardSummaryDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-student-dashboard");

jest.mock("../CreateStudentRoutineForm", () => ({
  CreateStudentRoutineForm: ({ studentId }: { studentId: string }) => (
    <div data-testid="create-routine-form">{studentId}</div>
  ),
}));

// Chart components rely on dynamic()/recharts which is heavy — mock to keep this test focused on the sheet's wiring.
jest.mock("@/components/dashboard/ProgressChartClient", () => ({
  ProgressChartClient: () => <div data-testid="volume-chart" />,
}));
jest.mock("@/components/progress/DurationChartClient", () => ({
  DurationChartClient: () => <div data-testid="duration-chart" />,
}));
jest.mock("@/components/progress/ActivityHeatmapClient", () => ({
  ActivityHeatmapClient: () => <div data-testid="heatmap" />,
}));
// MetricsStrip uses embla-carousel, which needs matchMedia/layout APIs jsdom doesn't provide — mock it out.
jest.mock("@/components/dashboard/MetricsStrip", () => ({
  MetricsStrip: () => <div data-testid="metrics-strip" />,
}));

const SUMMARY: DashboardSummaryDto = {
  diasEstaSemana: 3,
  treinosNoMes: 10,
  treinosNoMesDelta: 2,
  diasSequencia: 4,
  volumeSemanal: 5000,
  volumeData: [{ dia: "Seg", volume: 100 }],
  muscleGroups: [{ nome: "Peito", percentual: 40 }],
  trainDates: [1, 2, 3],
  workoutsCount: 5,
  durationData: [{ dia: "Seg", totalMinutos: 60 }],
  semanalDuracao: 180,
  heatmapData: [{ date: "2026-06-01", count: 1 }],
};

beforeEach(() => {
  jest.clearAllMocks();
  (useStudentDashboard as jest.Mock).mockReturnValue({ data: SUMMARY, isLoading: false, isError: false });
});

describe("StudentDetailSheet", () => {
  it("renders nothing when closed", () => {
    render(
      <StudentDetailSheet studentId="student-1" studentName="Ana Aluna" open={false} onOpenChange={jest.fn()} />
    );
    expect(screen.queryByText("Ana Aluna")).not.toBeInTheDocument();
  });

  it("renders dashboard tab by default with chart components", () => {
    render(
      <StudentDetailSheet studentId="student-1" studentName="Ana Aluna" open onOpenChange={jest.fn()} />
    );
    expect(screen.getByText("Ana Aluna")).toBeInTheDocument();
    expect(screen.getByTestId("volume-chart")).toBeInTheDocument();
    expect(screen.getByTestId("duration-chart")).toBeInTheDocument();
    expect(screen.getByTestId("heatmap")).toBeInTheDocument();
  });

  it("shows loading skeleton while dashboard is loading", () => {
    (useStudentDashboard as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(
      <StudentDetailSheet studentId="student-1" studentName="Ana Aluna" open onOpenChange={jest.fn()} />
    );
    expect(screen.queryByTestId("volume-chart")).not.toBeInTheDocument();
  });

  it("shows error message when dashboard fails to load", () => {
    (useStudentDashboard as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(
      <StudentDetailSheet studentId="student-1" studentName="Ana Aluna" open onOpenChange={jest.fn()} />
    );
    expect(screen.getByText("Não foi possível carregar o progresso do aluno.")).toBeInTheDocument();
  });

  it("switches to routine tab and renders CreateStudentRoutineForm with studentId", () => {
    render(
      <StudentDetailSheet studentId="student-1" studentName="Ana Aluna" open onOpenChange={jest.fn()} />
    );
    fireEvent.click(screen.getByRole("tab", { name: "Criar rotina" }));
    expect(screen.getByTestId("create-routine-form")).toHaveTextContent("student-1");
  });
});

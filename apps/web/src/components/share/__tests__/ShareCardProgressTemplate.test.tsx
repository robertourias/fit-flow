/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import type { DashboardSummaryDto } from "@fitflow/types";
import { ShareCardProgressTemplate } from "../ShareCardProgressTemplate";

const SUMMARY: DashboardSummaryDto = {
  diasEstaSemana: 4,
  treinosNoMes: 12,
  treinosNoMesDelta: 2,
  diasSequencia: 7,
  volumeSemanal: 4200,
  volumeData: [],
  muscleGroups: [
    { nome: "Peito", percentual: 40 },
    { nome: "Pernas", percentual: 75 },
    { nome: "Costas", percentual: 60 },
    { nome: "Ombros", percentual: 10 },
  ],
  trainDates: [],
  workoutsCount: 12,
  durationData: [],
  semanalDuracao: 180,
  heatmapData: [],
};

describe("ShareCardProgressTemplate", () => {
  it("renders volumeSemanal, diasSequencia and treinosNoMes", () => {
    render(<ShareCardProgressTemplate summary={SUMMARY} />);

    expect(screen.getByText("4200 kg")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders only the top 3 muscle groups by percentual", () => {
    render(<ShareCardProgressTemplate summary={SUMMARY} />);

    expect(screen.getByText("Pernas")).toBeInTheDocument();
    expect(screen.getByText("Costas")).toBeInTheDocument();
    expect(screen.getByText("Peito")).toBeInTheDocument();
    expect(screen.queryByText("Ombros")).not.toBeInTheDocument();
  });

  it("does not mutate the original muscleGroups array order", () => {
    const original = [...SUMMARY.muscleGroups];
    render(<ShareCardProgressTemplate summary={SUMMARY} />);
    expect(SUMMARY.muscleGroups).toEqual(original);
  });

  it("renders the FitFlow wordmark", () => {
    render(<ShareCardProgressTemplate summary={SUMMARY} />);
    expect(screen.getByText("FitFlow")).toBeInTheDocument();
  });
});

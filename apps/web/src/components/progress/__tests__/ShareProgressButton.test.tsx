/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { DashboardSummaryDto } from "@fitflow/types";

jest.mock("../../share/ShareCardDialog", () => ({
  ShareCardDialog: ({
    open,
    filename,
    children,
  }: {
    open: boolean;
    filename: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="share-card-dialog" data-filename={filename}>
        {children}
      </div>
    ) : null,
}));

jest.mock("../../share/ShareCardProgressTemplate", () => ({
  ShareCardProgressTemplate: ({ summary }: { summary: DashboardSummaryDto }) => (
    <div data-testid="share-card-progress-template" data-volume={summary.volumeSemanal} />
  ),
}));

import { ShareProgressButton } from "../ShareProgressButton";

const SUMMARY: DashboardSummaryDto = {
  diasEstaSemana: 3,
  treinosNoMes: 10,
  treinosNoMesDelta: 2,
  diasSequencia: 5,
  volumeSemanal: 1234,
  volumeData: [],
  muscleGroups: [
    { nome: "Peito", percentual: 40 },
    { nome: "Pernas", percentual: 35 },
    { nome: "Costas", percentual: 25 },
  ],
  trainDates: [],
  workoutsCount: 10,
  durationData: [],
  semanalDuracao: 180,
  heatmapData: [],
};

describe("ShareProgressButton", () => {
  it("renders the 'Compartilhar progresso' button", () => {
    render(<ShareProgressButton summary={SUMMARY} />);
    expect(screen.getByRole("button", { name: /compartilhar progresso/i })).toBeInTheDocument();
  });

  it("does not render the dialog content before clicking", () => {
    render(<ShareProgressButton summary={SUMMARY} />);
    expect(screen.queryByTestId("share-card-dialog")).not.toBeInTheDocument();
  });

  it("opens the dialog with the progress template when clicked", () => {
    render(<ShareProgressButton summary={SUMMARY} />);
    fireEvent.click(screen.getByRole("button", { name: /compartilhar progresso/i }));

    const dialog = screen.getByTestId("share-card-dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("data-filename", "progresso-semana.png");

    const template = screen.getByTestId("share-card-progress-template");
    expect(template).toHaveAttribute("data-volume", "1234");
  });
});

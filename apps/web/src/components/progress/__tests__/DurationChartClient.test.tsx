/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import type { DurationDataDto } from "@fitflow/types";

jest.mock("@/components/progress/DurationChart", () => ({
  DurationChart: ({ data, semanalDuracao }: { data: DurationDataDto[]; semanalDuracao: number }) => (
    <div data-testid="duration-chart" data-items={data.length} data-total={semanalDuracao} />
  ),
}));

// Import after mock is set up
import { DurationChartClient } from "../DurationChartClient";

const WEEK_DATA: DurationDataDto[] = [
  { dia: "Seg", totalMinutos: 60 },
  { dia: "Ter", totalMinutos: 0 },
  { dia: "Qua", totalMinutos: 45 },
  { dia: "Qui", totalMinutos: 0 },
  { dia: "Sex", totalMinutos: 30 },
  { dia: "Sáb", totalMinutos: 0 },
  { dia: "Dom", totalMinutos: 0 },
];

describe("DurationChartClient", () => {
  it("renders without crashing with 7 items", () => {
    const { container } = render(
      <DurationChartClient data={WEEK_DATA} semanalDuracao={135} />
    );
    expect(container.firstChild).not.toBeNull();
  });

  it("passes semanalDuracao=0 without crashing", () => {
    const { container } = render(
      <DurationChartClient data={WEEK_DATA} semanalDuracao={0} />
    );
    expect(container.firstChild).not.toBeNull();
  });
});

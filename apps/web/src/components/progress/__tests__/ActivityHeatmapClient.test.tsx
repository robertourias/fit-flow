/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { ActivityHeatmapClient } from "../ActivityHeatmapClient";
import type { HeatmapDataDto } from "@fitflow/types";

function makeHeatmapData(overrides: Partial<Record<number, number>> = {}): HeatmapDataDto[] {
  return Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    return {
      date: d.toISOString().slice(0, 10),
      count: overrides[i] ?? 0,
    };
  });
}

describe("ActivityHeatmapClient", () => {
  it("renders exactly 84 cells", () => {
    const data = makeHeatmapData();
    render(<ActivityHeatmapClient data={data} />);
    // 84 aria-label cells
    const cells = document.querySelectorAll("[aria-label]");
    expect(cells.length).toBe(84);
  });

  it("applies bg-muted for count 0", () => {
    const data = makeHeatmapData({ 83: 0 }); // last day count=0
    render(<ActivityHeatmapClient data={data} />);
    const lastCell = document.querySelectorAll("[aria-label]")[83];
    expect(lastCell?.className).toContain("bg-muted");
  });

  it("applies bg-primary/40 for count 1", () => {
    const data = makeHeatmapData({ 83: 1 });
    render(<ActivityHeatmapClient data={data} />);
    const lastCell = document.querySelectorAll("[aria-label]")[83];
    expect(lastCell?.className).toContain("bg-primary/40");
  });

  it("applies bg-primary for count >= 2", () => {
    const data = makeHeatmapData({ 83: 2 });
    render(<ActivityHeatmapClient data={data} />);
    const lastCell = document.querySelectorAll("[aria-label]")[83];
    expect(lastCell?.className).toContain("bg-primary");
  });
});

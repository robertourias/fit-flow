/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { WorkoutLimitBadge } from "../WorkoutLimitBadge";

describe("WorkoutLimitBadge", () => {
  it("renders the count/limit pill when limit is not null", () => {
    render(<WorkoutLimitBadge count={4} limit={6} />);

    expect(screen.getByText("4/6 treinos")).toBeInTheDocument();
  });

  it("renders nothing when limit is null", () => {
    const { container } = render(<WorkoutLimitBadge count={11} limit={null} />);

    expect(container.firstChild).toBeNull();
  });
});

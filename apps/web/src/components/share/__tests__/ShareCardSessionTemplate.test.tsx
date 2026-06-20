/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import type { WorkoutSessionDetailDto } from "@fitflow/types";
import { ShareCardSessionTemplate } from "../ShareCardSessionTemplate";

const SESSION: WorkoutSessionDetailDto = {
  id: "session-1",
  workoutId: "workout-1",
  workoutName: "Treino A - Peito e Tríceps",
  startedAt: "2026-06-17T10:00:00.000Z",
  endedAt: "2026-06-17T10:45:00.000Z",
  status: "FINISHED",
  comment: null,
  difficulty: null,
  createdAt: "2026-06-17T10:00:00.000Z",
  exercises: [
    {
      id: "session-exercise-1",
      exerciseId: "exercise-1",
      order: 1,
      notes: null,
      executedSets: [
        { id: "set-1", setNumber: 1, kg: 50, reps: 10, completedAt: null },
        { id: "set-2", setNumber: 2, kg: 50, reps: 8, completedAt: null },
      ],
    },
    {
      id: "session-exercise-2",
      exerciseId: "exercise-2",
      order: 2,
      notes: null,
      executedSets: [
        { id: "set-3", setNumber: 1, kg: 20, reps: 12, completedAt: null },
        { id: "set-4", setNumber: 2, kg: null, reps: 10, completedAt: null },
      ],
    },
  ],
};

// computeSessionVolume: (50*10) + (50*8) + (20*12) + (0*10) = 500 + 400 + 240 + 0 = 1140
const EXPECTED_VOLUME = 1140;

describe("ShareCardSessionTemplate", () => {
  it("renders the workout name", () => {
    render(<ShareCardSessionTemplate session={SESSION} />);
    expect(screen.getByText("Treino A - Peito e Tríceps")).toBeInTheDocument();
  });

  it("renders the formatted date from startedAt", () => {
    render(<ShareCardSessionTemplate session={SESSION} />);
    expect(screen.getByText("17 de junho")).toBeInTheDocument();
  });

  it("renders the computed duration in minutes", () => {
    render(<ShareCardSessionTemplate session={SESSION} />);
    expect(screen.getByText("45 min")).toBeInTheDocument();
  });

  it("renders the total volume computed via computeSessionVolume", () => {
    render(<ShareCardSessionTemplate session={SESSION} />);
    expect(screen.getByText(`${EXPECTED_VOLUME} kg`)).toBeInTheDocument();
  });

  it("renders the exercise count", () => {
    render(<ShareCardSessionTemplate session={SESSION} />);
    expect(screen.getByText(String(SESSION.exercises.length))).toBeInTheDocument();
  });

  it("does not crash and shows 0 minutes when endedAt is null", () => {
    const activeSession: WorkoutSessionDetailDto = { ...SESSION, endedAt: null };
    render(<ShareCardSessionTemplate session={activeSession} />);
    expect(screen.getByText("0 min")).toBeInTheDocument();
  });

  it("renders the FitFlow wordmark", () => {
    render(<ShareCardSessionTemplate session={SESSION} />);
    expect(screen.getByText("FitFlow")).toBeInTheDocument();
  });
});

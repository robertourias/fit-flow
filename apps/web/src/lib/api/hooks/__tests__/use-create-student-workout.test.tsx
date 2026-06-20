/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCreateStudentWorkout } from "../use-create-student-workout";
import { apiFetch } from "../../client";
import type { CreateWorkoutDto, WorkoutDetailDto } from "@fitflow/types";

jest.mock("../../client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const WORKOUT_INPUT: CreateWorkoutDto = {
  strategyId: "s1",
  name: "Treino A",
  order: 1,
  exercises: [
    {
      exerciseId: "ex-1",
      order: 1,
      plannedSets: [{ setNumber: 1, targetReps: "8-12", targetKg: "60" }],
    },
  ],
};

const CREATED_WORKOUT: WorkoutDetailDto = {
  id: "w1",
  strategyId: "s1",
  name: "Treino A",
  description: null,
  order: 1,
  exercises: [],
  createdAt: "2026-06-18T00:00:00.000Z",
  updatedAt: "2026-06-18T00:00:00.000Z",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { Wrapper, invalidateQueries };
}

describe("useCreateStudentWorkout", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("posts to /coaching/students/:studentId/workouts e retorna o treino criado", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_WORKOUT);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateStudentWorkout("student-1"), { wrapper: Wrapper });

    let response: WorkoutDetailDto | undefined;
    await act(async () => {
      response = await result.current.mutateAsync(WORKOUT_INPUT);
    });

    expect(mockApiFetch).toHaveBeenCalledWith("/coaching/students/student-1/workouts", {
      method: "POST",
      body: JSON.stringify(WORKOUT_INPUT),
    });
    expect(response).toEqual(CREATED_WORKOUT);
  });

  it("invalida o dashboard do aluno ao concluir", async () => {
    mockApiFetch.mockResolvedValueOnce(CREATED_WORKOUT);
    const { Wrapper, invalidateQueries } = createWrapper();
    const { result } = renderHook(() => useCreateStudentWorkout("student-1"), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync(WORKOUT_INPUT);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["coaching", "student-dashboard", "student-1"],
    });
  });
});

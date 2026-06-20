/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { StudentsPage } from "../StudentsPage";
import { useStudents } from "@/lib/api/hooks/use-students";
import { useTrainers } from "@/lib/api/hooks/use-trainers";
import { useUserMe } from "@/lib/api/hooks/use-user-me";
import type { RelationshipDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-students");
jest.mock("@/lib/api/hooks/use-trainers");
jest.mock("@/lib/api/hooks/use-user-me");

const selectActiveSpy = jest.fn();

jest.mock("../RelationshipList", () => ({
  RelationshipList: ({ role, relationships, onSelectActive }: {
    role: string;
    relationships: RelationshipDto[];
    onSelectActive?: (r: RelationshipDto) => void;
  }) => (
    <div data-testid={`relationship-list-${role}`}>
      {relationships.map((r) => (
        <button key={r.id} onClick={() => { onSelectActive?.(r); selectActiveSpy(r); }}>
          {r.studentName}
        </button>
      ))}
    </div>
  ),
}));

jest.mock("../StudentDetailSheet", () => ({
  StudentDetailSheet: ({ studentName, open }: { studentName: string; open: boolean }) =>
    open ? <div data-testid="student-detail-sheet">{studentName}</div> : null,
}));

const ACTIVE_STUDENT: RelationshipDto = {
  id: "rel-1",
  trainerId: "trainer-1",
  trainerName: "Beto Treinador",
  studentId: "student-1",
  studentName: "Ana Aluna",
  status: "ACTIVE",
  initiatedBy: "TRAINER",
  startedAt: "2026-06-01T00:00:00.000Z",
  endedAt: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useStudents as jest.Mock).mockReturnValue({ data: [ACTIVE_STUDENT], isLoading: false, isError: false });
  (useTrainers as jest.Mock).mockReturnValue({ data: [], isLoading: false, isError: false });
  (useUserMe as jest.Mock).mockReturnValue({ data: { id: "trainer-1" } });
});

describe("StudentsPage", () => {
  it("renders the Meus Alunos tab by default", () => {
    render(<StudentsPage />);
    expect(screen.getByTestId("relationship-list-trainer")).toBeInTheDocument();
    expect(screen.queryByTestId("relationship-list-student")).not.toBeInTheDocument();
  });

  it("switches to Meus Preparadores tab", () => {
    render(<StudentsPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Meus Preparadores" }));
    expect(screen.getByTestId("relationship-list-student")).toBeInTheDocument();
    expect(screen.queryByTestId("relationship-list-trainer")).not.toBeInTheDocument();
  });

  it("opens student detail sheet when selecting an active student", () => {
    render(<StudentsPage />);
    fireEvent.click(screen.getByText("Ana Aluna"));
    expect(screen.getByTestId("student-detail-sheet")).toHaveTextContent("Ana Aluna");
  });
});

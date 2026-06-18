/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { RelationshipList } from "../RelationshipList";
import { useRespondRelationship } from "@/lib/api/hooks/use-respond-relationship";
import { useRevokeRelationship } from "@/lib/api/hooks/use-revoke-relationship";
import type { RelationshipDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-respond-relationship");
jest.mock("@/lib/api/hooks/use-revoke-relationship");
jest.mock("@/lib/api/hooks/use-invite-relationship", () => ({
  useInviteRelationship: () => ({ mutateAsync: jest.fn(), error: null }),
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

const PENDING_INVITED_BY_OTHER: RelationshipDto = {
  id: "rel-2",
  trainerId: "trainer-1",
  trainerName: "Beto Treinador",
  studentId: "student-2",
  studentName: "Carlos Aluno",
  status: "PENDING",
  initiatedBy: "STUDENT",
  startedAt: "2026-06-10T00:00:00.000Z",
  endedAt: null,
};

const PENDING_INVITED_BY_ME: RelationshipDto = {
  id: "rel-3",
  trainerId: "trainer-1",
  trainerName: "Beto Treinador",
  studentId: "student-3",
  studentName: "Duda Aluna",
  status: "PENDING",
  initiatedBy: "TRAINER",
  startedAt: "2026-06-11T00:00:00.000Z",
  endedAt: null,
};

const defaultRespondMock = { mutateAsync: jest.fn(), isPending: false };
const defaultRevokeMock = { mutateAsync: jest.fn(), isPending: false };

beforeEach(() => {
  jest.clearAllMocks();
  (useRespondRelationship as jest.Mock).mockReturnValue(defaultRespondMock);
  (useRevokeRelationship as jest.Mock).mockReturnValue(defaultRevokeMock);
});

describe("RelationshipList", () => {
  it("renders loading skeleton", () => {
    render(
      <RelationshipList
        role="trainer"
        relationships={[]}
        isLoading
        isError={false}
        currentUserId="trainer-1"
      />
    );
    expect(screen.getByRole("list", { name: "Carregando vínculos" })).toBeInTheDocument();
  });

  it("renders empty state for trainer role", () => {
    render(
      <RelationshipList
        role="trainer"
        relationships={[]}
        isLoading={false}
        isError={false}
        currentUserId="trainer-1"
      />
    );
    expect(screen.getByText("Nenhum aluno vinculado ainda.")).toBeInTheDocument();
  });

  it("renders empty state for student role", () => {
    render(
      <RelationshipList
        role="student"
        relationships={[]}
        isLoading={false}
        isError={false}
        currentUserId="student-1"
      />
    );
    expect(screen.getByText("Nenhum preparador vinculado ainda.")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <RelationshipList
        role="trainer"
        relationships={[]}
        isLoading={false}
        isError
        currentUserId="trainer-1"
      />
    );
    expect(screen.getByText("Não foi possível carregar a lista.")).toBeInTheDocument();
  });

  it("renders relationship list with status badge", () => {
    render(
      <RelationshipList
        role="trainer"
        relationships={[ACTIVE_STUDENT]}
        isLoading={false}
        isError={false}
        currentUserId="trainer-1"
      />
    );
    expect(screen.getByText("Ana Aluna")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  it("shows accept/reject buttons only to the invited side", () => {
    render(
      <RelationshipList
        role="trainer"
        relationships={[PENDING_INVITED_BY_OTHER, PENDING_INVITED_BY_ME]}
        isLoading={false}
        isError={false}
        currentUserId="trainer-1"
      />
    );
    // PENDING_INVITED_BY_OTHER: initiated by student, current user is trainer -> can respond
    expect(screen.getByLabelText("Aceitar convite de Carlos Aluno")).toBeInTheDocument();
    expect(screen.getByLabelText("Recusar convite de Carlos Aluno")).toBeInTheDocument();
    // PENDING_INVITED_BY_ME: initiated by trainer (current user) -> cannot respond
    expect(screen.queryByLabelText("Aceitar convite de Duda Aluna")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Recusar convite de Duda Aluna")).not.toBeInTheDocument();
  });

  it("calls accept mutation on accept click", () => {
    const mutateAsync = jest.fn().mockResolvedValue(undefined);
    (useRespondRelationship as jest.Mock).mockReturnValue({ mutateAsync, isPending: false });

    render(
      <RelationshipList
        role="trainer"
        relationships={[PENDING_INVITED_BY_OTHER]}
        isLoading={false}
        isError={false}
        currentUserId="trainer-1"
      />
    );

    fireEvent.click(screen.getByLabelText("Aceitar convite de Carlos Aluno"));
    expect(mutateAsync).toHaveBeenCalledWith({ id: "rel-2", action: "ACCEPT" });
  });

  it("calls reject mutation on reject click", () => {
    const mutateAsync = jest.fn().mockResolvedValue(undefined);
    (useRespondRelationship as jest.Mock).mockReturnValue({ mutateAsync, isPending: false });

    render(
      <RelationshipList
        role="trainer"
        relationships={[PENDING_INVITED_BY_OTHER]}
        isLoading={false}
        isError={false}
        currentUserId="trainer-1"
      />
    );

    fireEvent.click(screen.getByLabelText("Recusar convite de Carlos Aluno"));
    expect(mutateAsync).toHaveBeenCalledWith({ id: "rel-2", action: "REJECT" });
  });

  it("opens revoke confirmation dialog and calls revoke mutation", async () => {
    const mutateAsync = jest.fn().mockResolvedValue(undefined);
    (useRevokeRelationship as jest.Mock).mockReturnValue({ mutateAsync, isPending: false });

    render(
      <RelationshipList
        role="trainer"
        relationships={[ACTIVE_STUDENT]}
        isLoading={false}
        isError={false}
        currentUserId="trainer-1"
      />
    );

    fireEvent.click(screen.getByLabelText("Revogar vínculo com Ana Aluna"));
    expect(await screen.findByText("Revogar vínculo?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Revogar" }));
    expect(mutateAsync).toHaveBeenCalledWith("rel-1");
  });

  it("calls onSelectActive when clicking an active student in trainer role", () => {
    const onSelectActive = jest.fn();
    render(
      <RelationshipList
        role="trainer"
        relationships={[ACTIVE_STUDENT]}
        isLoading={false}
        isError={false}
        currentUserId="trainer-1"
        onSelectActive={onSelectActive}
      />
    );

    fireEvent.click(screen.getByLabelText("Ver detalhes de Ana Aluna"));
    expect(onSelectActive).toHaveBeenCalledWith(ACTIVE_STUDENT);
  });

  it("does not allow selecting in student role", () => {
    render(
      <RelationshipList
        role="student"
        relationships={[ACTIVE_STUDENT]}
        isLoading={false}
        isError={false}
        currentUserId="student-1"
      />
    );
    expect(screen.queryByLabelText("Ver detalhes de Ana Aluna")).not.toBeInTheDocument();
  });

  it("opens invite dialog on button click", () => {
    render(
      <RelationshipList
        role="trainer"
        relationships={[]}
        isLoading={false}
        isError={false}
        currentUserId="trainer-1"
      />
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Convidar aluno/i })[0]);
    expect(screen.getByRole("heading", { name: "Convidar aluno" })).toBeInTheDocument();
  });
});

/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InviteRelationshipDialog } from "../InviteRelationshipDialog";
import { useInviteRelationship } from "@/lib/api/hooks/use-invite-relationship";

jest.mock("@/lib/api/hooks/use-invite-relationship");

beforeEach(() => {
  jest.clearAllMocks();
});

// jsdom does not dispatch a "submit" event from a plain fireEvent.click on a
// type="submit" button, so we submit the form directly (matches RHF's handleSubmit wiring).
function submitForm(button: HTMLElement) {
  const form = button.closest("form");
  if (!form) throw new Error("submit button is not inside a form");
  fireEvent.submit(form);
}

describe("InviteRelationshipDialog", () => {
  it("renders trainer copy when role is trainer", () => {
    (useInviteRelationship as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), error: null });
    render(<InviteRelationshipDialog open onOpenChange={jest.fn()} role="trainer" />);
    expect(screen.getByRole("heading", { name: "Convidar aluno" })).toBeInTheDocument();
  });

  it("renders student copy when role is student", () => {
    (useInviteRelationship as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), error: null });
    render(<InviteRelationshipDialog open onOpenChange={jest.fn()} role="student" />);
    expect(screen.getByRole("heading", { name: "Convidar preparador" })).toBeInTheDocument();
  });

  it("validates email format", async () => {
    (useInviteRelationship as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), error: null });
    render(<InviteRelationshipDialog open onOpenChange={jest.fn()} role="trainer" />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    submitForm(screen.getByRole("button", { name: "Convidar" }));

    expect(await screen.findByText("Email inválido")).toBeInTheDocument();
  });

  it("submits valid email and closes dialog", async () => {
    const mutateAsync = jest.fn().mockResolvedValue(undefined);
    (useInviteRelationship as jest.Mock).mockReturnValue({ mutateAsync, error: null });
    const onOpenChange = jest.fn();

    render(<InviteRelationshipDialog open onOpenChange={onOpenChange} role="trainer" />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "aluno@exemplo.com" } });
    submitForm(screen.getByRole("button", { name: "Convidar" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ targetEmail: "aluno@exemplo.com" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("shows mutation error message", () => {
    (useInviteRelationship as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      error: { message: "Email não encontrado" },
    });
    render(<InviteRelationshipDialog open onOpenChange={jest.fn()} role="trainer" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Email não encontrado");
  });

  it("calls onOpenChange(false) on cancel", () => {
    (useInviteRelationship as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), error: null });
    const onOpenChange = jest.fn();
    render(<InviteRelationshipDialog open onOpenChange={onOpenChange} role="trainer" />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

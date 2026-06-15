/**
 * @jest-environment jsdom
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrategyFormDialog } from "../StrategyFormDialog";

describe("StrategyFormDialog", () => {
  it("blocks submit with empty name and shows inline error (FR-005)", async () => {
    const onSubmit = jest.fn();
    const onOpenChange = jest.fn();
    render(
      <StrategyFormDialog open mode="create" onOpenChange={onOpenChange} onSubmit={onSubmit} />
    );

    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(screen.getByText("Nome é obrigatório")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('maps type "Personalizado" to undefined on submit (FR-002/FR-004)', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onOpenChange = jest.fn();
    render(
      <StrategyFormDialog
        open
        mode="edit"
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        initialValues={{ name: "Treino X", type: "Personalizado", description: "" }}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Treino X",
        type: undefined,
        description: undefined,
      });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps dialog open, preserves values and shows error on submit failure (FR-007)", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("network error"));
    const onOpenChange = jest.fn();
    render(
      <StrategyFormDialog open mode="create" onOpenChange={onOpenChange} onSubmit={onSubmit} />
    );

    const nameInput = screen.getByLabelText("Nome *");
    await userEvent.type(nameInput, "Meu Programa");
    await userEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText("Não foi possível salvar. Tente novamente.")).toBeInTheDocument();
    });
    expect(nameInput).toHaveValue("Meu Programa");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('disables "Salvar" and shows loading while onSubmit is pending (FR-006)', async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );
    const onOpenChange = jest.fn();
    render(
      <StrategyFormDialog open mode="create" onOpenChange={onOpenChange} onSubmit={onSubmit} />
    );

    await userEvent.type(screen.getByLabelText("Nome *"), "Meu Programa");
    const submitButton = screen.getByRole("button", { name: /salvar/i });
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton.querySelector("svg.animate-spin")).not.toBeNull();

    await act(async () => {
      resolveSubmit();
      await Promise.resolve();
    });

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});

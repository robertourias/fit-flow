/**
 * @jest-environment jsdom
 */
import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShareCardDialog } from "../ShareCardDialog";
import { exportNodeToPngBlob, shareOrDownloadImage } from "../../../lib/share/export-image";

jest.mock("../../../lib/share/export-image");

const mockExport = exportNodeToPngBlob as jest.MockedFunction<typeof exportNodeToPngBlob>;
const mockShareOrDownload = shareOrDownloadImage as jest.MockedFunction<typeof shareOrDownloadImage>;

const BLOB = new Blob(["fake"], { type: "image/png" });

describe("ShareCardDialog", () => {
  const originalCanShare = (navigator as unknown as { canShare?: unknown }).canShare;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExport.mockResolvedValue(BLOB);
    mockShareOrDownload.mockResolvedValue("shared");
    URL.createObjectURL = jest.fn(() => "blob:mock-url");
    URL.revokeObjectURL = jest.fn();
    delete (navigator as unknown as { canShare?: unknown }).canShare;
  });

  afterEach(() => {
    if (originalCanShare === undefined) {
      delete (navigator as unknown as { canShare?: unknown }).canShare;
    } else {
      (navigator as unknown as { canShare?: unknown }).canShare = originalCanShare;
    }
  });

  function renderDialog() {
    return render(
      <ShareCardDialog open onOpenChange={() => {}} filename="card.png">
        <div data-testid="card-content">conteúdo</div>
      </ShareCardDialog>,
    );
  }

  it("always renders 'Baixar imagem' and calls exportNodeToPngBlob on click", async () => {
    const user = userEvent.setup();
    renderDialog();

    const downloadButton = screen.getByRole("button", { name: /baixar imagem/i });
    expect(downloadButton).toBeInTheDocument();

    await user.click(downloadButton);

    await waitFor(() => {
      expect(mockExport).toHaveBeenCalledTimes(1);
    });
  });

  it("shows 'Compartilhar' when navigator.canShare exists, hides it otherwise", async () => {
    (navigator as unknown as { canShare?: unknown }).canShare = () => true;

    renderDialog();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /compartilhar/i })).toBeInTheDocument();
    });
  });

  it("does not render 'Compartilhar' when navigator.canShare is undefined", async () => {
    renderDialog();

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /compartilhar/i })).not.toBeInTheDocument();
    });
  });

  it("shows a spinner while exporting and hides it after resolution", async () => {
    let resolveExport: (blob: Blob) => void = () => {};
    mockExport.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveExport = resolve;
        }),
    );

    const user = userEvent.setup();
    renderDialog();

    const downloadButton = screen.getByRole("button", { name: /baixar imagem/i });
    await user.click(downloadButton);

    expect(downloadButton.querySelector(".animate-spin")).toBeInTheDocument();

    await act(async () => {
      resolveExport(BLOB);
    });

    await waitFor(() => {
      expect(downloadButton.querySelector(".animate-spin")).not.toBeInTheDocument();
    });
  });

  it("renders an error message when exportNodeToPngBlob rejects, without crashing", async () => {
    mockExport.mockRejectedValue(new Error("capture failed"));

    const user = userEvent.setup();
    renderDialog();

    const downloadButton = screen.getByRole("button", { name: /baixar imagem/i });
    await user.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});

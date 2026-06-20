/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatPanel } from "../ChatPanel";
import { useMessages } from "@/lib/api/hooks/use-messages";
import { useSendMessage } from "@/lib/api/hooks/use-send-message";
import { useMarkMessagesRead } from "@/lib/api/hooks/use-mark-messages-read";
import { ApiClientError } from "@/lib/api/client";
import type { MessageListResponseDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-messages");
jest.mock("@/lib/api/hooks/use-send-message");
jest.mock("@/lib/api/hooks/use-mark-messages-read");

const mockUseMessages = useMessages as jest.Mock;
const mockUseSendMessage = useSendMessage as jest.Mock;
const mockUseMarkMessagesRead = useMarkMessagesRead as jest.Mock;

const MESSAGES: MessageListResponseDto = {
  items: [
    {
      id: "msg-2",
      relationshipId: "rel-1",
      senderId: "trainer-1",
      content: "Como foi o treino hoje?",
      createdAt: "2026-06-18T11:00:00.000Z",
    },
    {
      id: "msg-1",
      relationshipId: "rel-1",
      senderId: "student-1",
      content: "Bom dia!",
      createdAt: "2026-06-18T10:00:00.000Z",
    },
  ],
  total: 2,
};

const markReadMutate = jest.fn();
const sendMessageMutateAsync = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseMessages.mockReturnValue({ data: MESSAGES, isLoading: false, isError: false });
  mockUseSendMessage.mockReturnValue({
    mutateAsync: sendMessageMutateAsync,
    isPending: false,
  });
  mockUseMarkMessagesRead.mockReturnValue({ mutate: markReadMutate });
});

describe("ChatPanel", () => {
  it("marca as mensagens como lidas ao montar", () => {
    render(<ChatPanel relationshipId="rel-1" currentUserId="student-1" />);
    expect(markReadMutate).toHaveBeenCalledTimes(1);
  });

  it("renderiza as mensagens alinhadas por remetente, mais antiga primeiro", () => {
    render(<ChatPanel relationshipId="rel-1" currentUserId="student-1" />);
    const bubbles = screen.getAllByText(/Bom dia!|Como foi o treino hoje\?/);
    expect(bubbles[0]).toHaveTextContent("Bom dia!");
    expect(bubbles[1]).toHaveTextContent("Como foi o treino hoje?");
  });

  it("envia mensagem e limpa o campo de input", async () => {
    sendMessageMutateAsync.mockResolvedValueOnce({
      id: "msg-3",
      relationshipId: "rel-1",
      senderId: "student-1",
      content: "Tudo certo!",
      createdAt: "2026-06-18T12:00:00.000Z",
    });

    render(<ChatPanel relationshipId="rel-1" currentUserId="student-1" />);

    const input = screen.getByLabelText("Mensagem");
    fireEvent.change(input, { target: { value: "Tudo certo!" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    await waitFor(() => {
      expect(sendMessageMutateAsync).toHaveBeenCalledWith({ content: "Tudo certo!" });
    });
    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("mostra erro de moderação inline sem quebrar a tela", async () => {
    sendMessageMutateAsync.mockRejectedValueOnce(
      new ApiClientError(422, "Conteúdo bloqueado pela moderação"),
    );

    render(<ChatPanel relationshipId="rel-1" currentUserId="student-1" />);

    const input = screen.getByLabelText("Mensagem");
    fireEvent.change(input, { target: { value: "palavrão" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Conteúdo bloqueado pela moderação");
    });
    // input não deve ser limpo quando o envio falha
    expect(input).toHaveValue("palavrão");
  });

  it("não envia mensagem vazia", () => {
    render(<ChatPanel relationshipId="rel-1" currentUserId="student-1" />);
    expect(screen.getByRole("button", { name: "Enviar mensagem" })).toBeDisabled();
    expect(sendMessageMutateAsync).not.toHaveBeenCalled();
  });

  it("mostra estado vazio quando não há mensagens", () => {
    mockUseMessages.mockReturnValue({ data: { items: [], total: 0 }, isLoading: false, isError: false });
    render(<ChatPanel relationshipId="rel-1" currentUserId="student-1" />);
    expect(screen.getByText("Nenhuma mensagem ainda. Envie a primeira!")).toBeInTheDocument();
  });

  it("mostra erro ao carregar mensagens", () => {
    mockUseMessages.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<ChatPanel relationshipId="rel-1" currentUserId="student-1" />);
    expect(screen.getByText("Não foi possível carregar as mensagens.")).toBeInTheDocument();
  });
});

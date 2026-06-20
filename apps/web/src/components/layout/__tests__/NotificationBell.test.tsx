/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { NotificationBell } from "../NotificationBell";
import { useNotifications } from "@/lib/api/hooks/use-notifications";
import { useMarkNotificationRead } from "@/lib/api/hooks/use-mark-notification-read";
import type { NotificationDto } from "@fitflow/types";

jest.mock("@/lib/api/hooks/use-notifications");
jest.mock("@/lib/api/hooks/use-mark-notification-read");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockUseNotifications = useNotifications as jest.Mock;
const mockUseMarkNotificationRead = useMarkNotificationRead as jest.Mock;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const NOTIFICATIONS: NotificationDto[] = [
  {
    id: "notif-1",
    type: "NEW_MESSAGE",
    payload: { relationshipId: "rel-1", messageId: "msg-1", senderId: "trainer-1" },
    read: false,
    createdAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: "notif-2",
    type: "NEW_MESSAGE",
    payload: { relationshipId: "rel-2", messageId: "msg-2", senderId: "trainer-2" },
    read: true,
    createdAt: "2026-06-17T10:00:00.000Z",
  },
];

const markReadMutate = jest.fn();
const push = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockUseNotifications.mockReturnValue({ data: NOTIFICATIONS });
  mockUseMarkNotificationRead.mockReturnValue({ mutate: markReadMutate });
  mockUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

describe("NotificationBell", () => {
  it("mostra o contador de notificações não lidas", () => {
    render(<NotificationBell />);
    expect(screen.getByLabelText("1 notificações não lidas")).toBeInTheDocument();
  });

  it("não mostra contador quando não há notificações não lidas", () => {
    mockUseNotifications.mockReturnValue({
      data: NOTIFICATIONS.map((n) => ({ ...n, read: true })),
    });
    render(<NotificationBell />);
    expect(screen.queryByLabelText(/notificações não lidas/)).not.toBeInTheDocument();
  });

  it("abre o dropdown e lista as notificações recentes", async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    await user.click(screen.getByLabelText("Notificações"));
    expect(await screen.findAllByText("Nova mensagem")).toHaveLength(2);
  });

  it("marca como lida e navega para o vínculo ao clicar em uma notificação não lida", async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    await user.click(screen.getByLabelText("Notificações"));

    const items = await screen.findAllByRole("menuitem");
    await user.click(items[0]);

    await waitFor(() => {
      expect(markReadMutate).toHaveBeenCalledWith("notif-1");
    });
    expect(push).toHaveBeenCalledWith("/students");
  });

  it("não marca como lida novamente ao clicar em notificação já lida, mas navega", async () => {
    const user = userEvent.setup();
    render(<NotificationBell />);
    await user.click(screen.getByLabelText("Notificações"));

    const items = await screen.findAllByRole("menuitem");
    await user.click(items[1]);

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/students");
    });
    expect(markReadMutate).not.toHaveBeenCalled();
  });

  it("mostra estado vazio quando não há notificações", async () => {
    mockUseNotifications.mockReturnValue({ data: [] });
    const user = userEvent.setup();
    render(<NotificationBell />);
    await user.click(screen.getByLabelText("Notificações"));
    expect(await screen.findByText("Nenhuma notificação por aqui.")).toBeInTheDocument();
  });
});

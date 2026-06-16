/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { HistoryListPage } from "../HistoryListPage";
import { useWorkoutSessions } from "@/lib/api/hooks/use-workout-sessions";
import { useUserMe } from "@/lib/api/hooks/use-user-me";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
jest.mock("@/lib/api/hooks/use-workout-sessions");
jest.mock("@/lib/api/hooks/use-user-me");

const SESSION_SUMMARY = {
  id: "s1",
  workoutId: "w1",
  workoutName: "Treino A",
  startedAt: "2026-06-10T10:00:00.000Z",
  endedAt: "2026-06-10T11:00:00.000Z",
  status: "FINISHED" as const,
  comment: "Bom treino",
  difficulty: 7,
  createdAt: "2026-06-10T11:00:00.000Z",
};

const defaultSessionsMock = {
  data: undefined,
  isLoading: false,
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
};

const defaultUserMock = { data: { plan: "PRO" } };

beforeEach(() => {
  jest.clearAllMocks();
  (useWorkoutSessions as jest.Mock).mockReturnValue(defaultSessionsMock);
  (useUserMe as jest.Mock).mockReturnValue(defaultUserMock);
});

describe("HistoryListPage", () => {
  it("shows skeletons while loading", () => {
    (useWorkoutSessions as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<HistoryListPage />);

    expect(screen.getByRole("list", { name: "Carregando sessões" })).toBeInTheDocument();
  });

  it("renders session list with workoutName, date and duration", () => {
    (useWorkoutSessions as jest.Mock).mockReturnValue({
      data: {
        pages: [{ items: [SESSION_SUMMARY], total: 1, nextCursor: null }],
        pageParams: [null],
      },
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<HistoryListPage />);

    expect(screen.getByText("Treino A")).toBeInTheDocument();
    expect(screen.getByText(/10\/06\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/1h 0min/)).toBeInTheDocument();
    expect(screen.getByText("Dificuldade: 7/10")).toBeInTheDocument();
    expect(screen.getByText("Bom treino")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Treino A/i })).toHaveAttribute("href", "/history/s1");
  });

  it("shows empty state when no sessions", () => {
    (useWorkoutSessions as jest.Mock).mockReturnValue({
      data: {
        pages: [{ items: [], total: 0, nextCursor: null }],
        pageParams: [null],
      },
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<HistoryListPage />);

    expect(screen.getByText("Nenhuma sessão registrada ainda.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para Biblioteca" })).toHaveAttribute(
      "href",
      "/library"
    );
  });

  it("shows FREE retention banner when plan is FREE", () => {
    (useWorkoutSessions as jest.Mock).mockReturnValue({
      data: {
        pages: [{ items: [SESSION_SUMMARY], total: 1, nextCursor: null }],
        pageParams: [null],
      },
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
    (useUserMe as jest.Mock).mockReturnValue({ data: { plan: "FREE" } });

    render(<HistoryListPage />);

    expect(
      screen.getByText("Sessões com mais de 60 dias não aparecem aqui no plano gratuito.")
    ).toBeInTheDocument();
  });

  it("does not show FREE banner when plan is PRO", () => {
    (useWorkoutSessions as jest.Mock).mockReturnValue({
      data: {
        pages: [{ items: [SESSION_SUMMARY], total: 1, nextCursor: null }],
        pageParams: [null],
      },
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
    (useUserMe as jest.Mock).mockReturnValue({ data: { plan: "PRO" } });

    render(<HistoryListPage />);

    expect(
      screen.queryByText("Sessões com mais de 60 dias não aparecem aqui no plano gratuito.")
    ).not.toBeInTheDocument();
  });

  it("shows 'Carregar mais' button when hasNextPage is true and calls fetchNextPage on click", () => {
    const fetchNextPage = jest.fn();
    (useWorkoutSessions as jest.Mock).mockReturnValue({
      data: {
        pages: [{ items: [SESSION_SUMMARY], total: 10, nextCursor: "cursor1" }],
        pageParams: [null],
      },
      isLoading: false,
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    });

    render(<HistoryListPage />);

    const loadMoreBtn = screen.getByRole("button", { name: "Carregar mais" });
    expect(loadMoreBtn).toBeInTheDocument();

    fireEvent.click(loadMoreBtn);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("shows duration as '—' when endedAt is null", () => {
    (useWorkoutSessions as jest.Mock).mockReturnValue({
      data: {
        pages: [
          {
            items: [{ ...SESSION_SUMMARY, endedAt: null }],
            total: 1,
            nextCursor: null,
          },
        ],
        pageParams: [null],
      },
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<HistoryListPage />);

    expect(screen.getByText(/·\s*—/)).toBeInTheDocument();
  });
});

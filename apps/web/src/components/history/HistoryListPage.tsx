"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardList } from "lucide-react";
import { useWorkoutSessions } from "@/lib/api/hooks/use-workout-sessions";
import { useUserMe } from "@/lib/api/hooks/use-user-me";
import { Button } from "@/components/ui/button";
import type { WorkoutSessionSummaryDto } from "@fitflow/types";

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return "—";
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

interface SessionListItemProps {
  session: WorkoutSessionSummaryDto;
}

function SessionListItem({ session }: SessionListItemProps) {
  const dateLabel = format(parseISO(session.startedAt), "dd/MM/yyyy", { locale: ptBR });
  const durationLabel = formatDuration(session.startedAt, session.endedAt);

  return (
    <Link
      href={`/history/${session.id}`}
      className="block border-b border-border px-5 py-4 hover:bg-accent/50 transition-colors"
    >
      <p className="text-sm font-semibold text-foreground">{session.workoutName}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {dateLabel} · {durationLabel}
      </p>
      {session.difficulty != null && (
        <p className="text-xs text-muted-foreground mt-0.5">Dificuldade: {session.difficulty}/10</p>
      )}
      {session.comment && (
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{session.comment}</p>
      )}
    </Link>
  );
}

export function HistoryListPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useWorkoutSessions();
  const { data: user } = useUserMe();
  const sessions = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <main className="min-h-dvh bg-background">
      {user?.plan === "FREE" && (
        <div
          role="alert"
          className="mx-5 mt-5 rounded-lg bg-[var(--color-warning-bg)] border border-[var(--color-warning)] px-4 py-3 text-sm text-[var(--color-warning-text)]"
        >
          Sessões com mais de 60 dias não aparecem aqui no plano gratuito.
        </div>
      )}

      {isLoading && !data ? (
        <ul aria-label="Carregando sessões" className="mt-4 px-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <div className="h-16 rounded-l bg-muted animate-pulse" />
            </li>
          ))}
        </ul>
      ) : sessions.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-4 pt-24 px-5 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">Nenhuma sessão registrada ainda.</h2>
          <Button asChild variant="default">
            <Link href="/library">Ir para Biblioteca</Link>
          </Button>
        </section>
      ) : (
        <ul>
          {sessions.map((session) => (
            <li key={session.id}>
              <SessionListItem session={session} />
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="flex justify-center px-5 py-6">
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";
import type { WorkoutSessionDetailDto, ExerciseDto } from "@fitflow/types";

interface SessionDetailPageProps {
  session: WorkoutSessionDetailDto;
  exercises: ExerciseDto[];
}

function formatDuration(startedAt: string, endedAt: string): string {
  const ms = parseISO(endedAt).getTime() - parseISO(startedAt).getTime();
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

export function SessionDetailPage({ session, exercises }: SessionDetailPageProps) {
  const exercisesById = new Map(exercises.map((e) => [e.id, e]));
  const sortedSessionExercises = [...session.exercises].sort((a, b) => a.order - b.order);

  return (
    <main className="flex flex-col gap-6 p-5">
      <header className="flex flex-col gap-2">
        <Link
          href="/history"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Histórico
        </Link>

        <h1 className="text-2xl font-semibold font-secondary">{session.workoutName}</h1>

        <dl className="flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <dt className="sr-only">Data e hora</dt>
            <dd>
              <time dateTime={session.startedAt}>
                {format(parseISO(session.startedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </time>
            </dd>
          </div>

          <div className="flex gap-2">
            <dt>Duração:</dt>
            <dd>
              {session.endedAt ? formatDuration(session.startedAt, session.endedAt) : "—"}
            </dd>
          </div>

          {session.difficulty != null && (
            <div className="flex gap-2">
              <dt>Dificuldade:</dt>
              <dd>{session.difficulty}/10</dd>
            </div>
          )}
        </dl>

        {session.comment && (
          <p className="text-sm">
            <span className="font-medium">Comentário:</span> {session.comment}
          </p>
        )}
      </header>

      <section aria-label="Exercícios">
        <ol className="flex flex-col gap-6">
          {sortedSessionExercises.map((sessionExercise) => {
            const exercise = exercisesById.get(sessionExercise.exerciseId);
            const completedSets = sessionExercise.executedSets.filter(
              (s) => s.completedAt !== null,
            );

            return (
              <li key={sessionExercise.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-m">
                    <ExerciseImage
                      src={exercise?.imageUrl ?? null}
                      alt={exercise?.name ?? "Exercício"}
                      sizes="48px"
                    />
                  </div>
                  <h2 className="text-base font-medium">{exercise?.name ?? "Exercício"}</h2>
                </div>

                {completedSets.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th scope="col" className="pb-2 pr-4 font-medium">
                          Série
                        </th>
                        <th scope="col" className="pb-2 pr-4 font-medium">
                          Kg
                        </th>
                        <th scope="col" className="pb-2 pr-4 font-medium">
                          Reps
                        </th>
                        <th scope="col" className="pb-2 font-medium">
                          Horário
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedSets.map((set) => (
                        <tr key={set.id} className="border-b border-border last:border-0">
                          <td className="py-2 pr-4">{set.setNumber}</td>
                          <td className="py-2 pr-4">{set.kg ?? "—"}</td>
                          <td className="py-2 pr-4">{set.reps ?? "—"}</td>
                          <td className="py-2">
                            <time dateTime={set.completedAt!}>
                              {format(parseISO(set.completedAt!), "HH:mm")}
                            </time>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-muted-foreground">Exercício pulado</p>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

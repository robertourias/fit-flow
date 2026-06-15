"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, ChevronDown, Dumbbell, Star } from "lucide-react";
import { format, formatDuration, intervalToDuration, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useWorkoutSessionStore } from "@/lib/stores/workout-session.store";
import { useCreateWorkoutSession } from "@/lib/api/hooks/use-create-workout-session";
import { toCreateWorkoutSessionDto } from "@/lib/workout/workout-session.mapper";
import type { WorkoutDetailDto } from "@fitflow/types";

function calcDurationLabel(startedAt: string | null, endedAt: Date): string {
  if (!startedAt) return "—";
  const duration = intervalToDuration({ start: parseISO(startedAt), end: endedAt });
  return (
    formatDuration(duration, { locale: ptBR, format: ["hours", "minutes"] }) ||
    "< 1 minuto"
  );
}

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ value, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        value ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          value ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <span className="text-[13px] font-medium">{children}</span>
    </div>
  );
}

interface Props {
  workout: WorkoutDetailDto;
}

export function WorkoutFinishForm({ workout }: Props) {
  const router = useRouter();
  const { startedAt, exercises, resetSession } = useWorkoutSessionStore();
  const createSession = useCreateWorkoutSession();

  // Capture endedAt once on mount so duration doesn't drift while user fills the form
  const endedAt = useRef(new Date()).current;
  const durationLabel = calcDurationLabel(startedAt, endedAt);

  const [comment, setComment] = useState("");
  const [difficulty, setDifficulty] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updateRoutine, setUpdateRoutine] = useState(true);
  const [stravaSync, setStravaSync] = useState(false);
  const [healthSync, setHealthSync] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const completedSets = exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completedAt).length,
    0
  );

  async function handleSave() {
    setError(undefined);
    const dto = toCreateWorkoutSessionDto(
      workout,
      { startedAt: startedAt ?? new Date().toISOString(), exercises },
      { endedAt: endedAt.toISOString(), comment, difficulty: difficulty || undefined }
    );
    try {
      await createSession.mutateAsync(dto);
      resetSession();
      router.push(`/program/${workout.strategyId}`);
    } catch {
      setError("Não foi possível salvar o treino. Tente novamente.");
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-5">
        <Link
          href={`/workout/${workout.id}/session`}
          className="text-foreground hover:text-muted-foreground transition-colors"
          aria-label="Voltar para a sessão"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-[17px] font-bold">Finalizar Treino</h1>
        <div className="w-6" />
      </div>

      {/* Summary stats */}
      <div className="flex gap-3 px-5 pb-5">
        <div className="flex-1 bg-card rounded-xl p-4 border border-border flex flex-col gap-1">
          <span className="text-[24px] font-bold leading-none tabular-nums">{completedSets}</span>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Séries feitas
          </span>
        </div>
        <div className="flex-1 bg-card rounded-xl p-4 border border-border flex flex-col gap-1">
          <span className="text-[16px] font-bold leading-snug">{durationLabel}</span>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Duração</span>
        </div>
        <div className="flex-1 bg-card rounded-xl p-4 border border-border flex flex-col gap-1">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Musculação
          </span>
        </div>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto pb-36 px-5 space-y-3">
        {/* Comment */}
        <div className="bg-card rounded-xl border border-border p-4">
          <label
            htmlFor="workout-comment"
            className="block text-[13px] font-semibold mb-2"
          >
            Como foi?
          </label>
          <textarea
            id="workout-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Adicione um comentário sobre o treino..."
            className="w-full bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none"
          />
        </div>

        {/* Media button — UI only */}
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-3.5 text-[14px] font-medium text-muted-foreground cursor-not-allowed opacity-60"
          aria-label="Adicionar Fotos/Vídeos (em breve)"
        >
          <Camera className="h-4 w-4" />
          Adicionar Fotos / Vídeos
        </button>

        {/* Difficulty */}
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-[13px] font-semibold mb-3">Dificuldade</p>
          <div className="flex gap-2" role="group" aria-label="Selecionar dificuldade">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setDifficulty(n)}
                aria-label={`Dificuldade ${n}`}
                aria-pressed={difficulty >= n}
                className={cn(
                  "flex-1 flex items-center justify-center py-2.5 rounded-lg border transition-colors",
                  difficulty >= n
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <Star
                  className="h-5 w-5"
                  fill={difficulty >= n ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Details accordion */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setDetailsOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-[14px] font-semibold"
            aria-expanded={detailsOpen}
            aria-controls="finish-details"
          >
            Detalhes
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                detailsOpen && "rotate-180"
              )}
            />
          </button>
          {detailsOpen && (
            <div
              id="finish-details"
              className="border-t border-border px-4 pt-3 pb-4 space-y-1"
            >
              <DetailRow label="Encerrado em">
                {format(endedAt, "d 'de' MMMM 'de' yyyy 'às' HH'h'mm", { locale: ptBR })}
              </DetailRow>
              <DetailRow label="Duração">{durationLabel}</DetailRow>
              <DetailRow label="Tipo de treino">Musculação</DetailRow>
            </div>
          )}
        </div>

        {/* Update routine toggle */}
        <div className="bg-card rounded-xl border border-border flex items-center justify-between px-4 py-4 gap-4">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold">Atualizar valores da rotina</p>
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
              Salva cargas e reps como referência para o próximo treino
            </p>
          </div>
          <Toggle value={updateRoutine} onChange={setUpdateRoutine} />
        </div>

        {/* Integrations */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <p className="px-4 pt-3.5 pb-2 text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
            Integrações
          </p>
          <div className="border-t border-border/50 flex items-center justify-between px-4 py-3.5">
            <p className="text-[14px] font-medium">Strava</p>
            <Toggle value={stravaSync} onChange={setStravaSync} />
          </div>
          <div className="border-t border-border/50 flex items-center justify-between px-4 py-3.5">
            <p className="text-[14px] font-medium">Health Connect</p>
            <Toggle value={healthSync} onChange={setHealthSync} />
          </div>
        </div>
      </div>

      {/* Fixed save CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-10 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
        {error && (
          <p role="alert" className="text-[13px] text-destructive px-5 mb-2">
            {error}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={createSession.isPending}
          className={cn(
            "pointer-events-auto w-full bg-primary text-primary-foreground rounded-pill h-14 text-[16px] font-bold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg",
            createSession.isPending && "opacity-60 cursor-not-allowed"
          )}
        >
          {createSession.isPending ? "Salvando..." : "Salvar Treino"}
        </button>
      </div>
    </div>
  );
}

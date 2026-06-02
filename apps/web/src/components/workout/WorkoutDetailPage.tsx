"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Ellipsis,
  GripVertical,
  Play,
  Plus,
  Timer,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { DraggableAttributes } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { WorkoutDetail, WorkoutExercise } from "@/lib/mock/workout";
import { SuggestionsPanel } from "@/components/workout/SuggestionsPanel";

// ─── Local state types ───────────────────────────────────────────────────────

interface LocalSet {
  id: string;
  setNumber: number;
  targetReps: string;
  targetKg: string;
}

interface LocalExercise {
  id: string;
  name: string;
  muscleGroup: string;
  image: string;
  restSeconds: number;
  sets: LocalSet[];
  note: string;
}

function toLocalExercise(ex: WorkoutExercise): LocalExercise {
  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    image: ex.image,
    restSeconds: ex.restSeconds,
    sets: ex.sets.map((s) => ({
      id: `${ex.id}-${s.setNumber}`,
      setNumber: s.setNumber,
      targetReps: String(s.targetReps),
      targetKg: s.targetKg !== undefined ? String(s.targetKg) : "",
    })),
    note: "",
  };
}

function formatRest(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}min ${sec < 10 ? `0${sec}` : sec}s`;
}

// ─── SetRow ──────────────────────────────────────────────────────────────────

interface SetRowProps {
  set: LocalSet;
  onUpdate: (updates: Partial<LocalSet>) => void;
  onDelete: () => void;
}

function SetRow({ set, onUpdate, onDelete }: SetRowProps) {
  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="py-2 pl-5 pr-2 w-14">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold">
          {set.setNumber}
        </span>
      </td>
      <td className="py-2 px-2">
        <input
          type="text"
          inputMode="decimal"
          value={set.targetKg}
          onChange={(e) => onUpdate({ targetKg: e.target.value })}
          placeholder="—"
          aria-label="Carga"
          className="w-full bg-muted/50 rounded-s py-1 px-1.5 text-center text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </td>
      <td className="py-2 px-2">
        <input
          type="text"
          inputMode="numeric"
          value={set.targetReps}
          onChange={(e) => onUpdate({ targetReps: e.target.value })}
          placeholder="—"
          aria-label="Repetições"
          className="w-full bg-muted/50 rounded-s py-1 px-1.5 text-center text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </td>
      <td className="py-2 px-2 text-center text-[12px] text-muted-foreground select-none">—</td>
      <td className="py-2 pl-2 pr-4 text-right w-10">
        <button
          onClick={onDelete}
          className="text-muted-foreground/40 hover:text-destructive transition-colors"
          aria-label="Remover série"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ─── ExerciseBlock ───────────────────────────────────────────────────────────

interface ExerciseBlockProps {
  exercise: LocalExercise;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateSet: (setIdx: number, updates: Partial<LocalSet>) => void;
  onDeleteSet: (setIdx: number) => void;
  onAddSet: () => void;
  onUpdateNote: (note: string) => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: Record<string, React.EventHandler<React.SyntheticEvent>>;
}

function ExerciseBlock({
  exercise,
  isExpanded,
  onToggle,
  onUpdateSet,
  onDeleteSet,
  onAddSet,
  onUpdateNote,
  dragAttributes,
  dragListeners,
}: ExerciseBlockProps) {
  return (
    <div
      className={cn(
        "border-b border-border bg-card",
        isExpanded && "ring-1 ring-inset ring-primary/20"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          className="touch-none shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
          aria-label="Arrastar exercício"
          {...dragAttributes}
          {...dragListeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="relative h-11 w-11 rounded-m overflow-hidden shrink-0">
          <Image
            src={exercise.image}
            alt={exercise.name}
            fill
            sizes="44px"
            className="object-cover"
          />
        </div>

        <button className="flex-1 min-w-0 text-left" onClick={onToggle}>
          <p className="text-[14px] font-semibold leading-tight truncate">{exercise.name}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {exercise.muscleGroup} · {exercise.sets.length} séries
          </p>
        </button>

        <button
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Opções do exercício"
        >
          <Ellipsis className="h-4 w-4" />
        </button>
        <button
          onClick={onToggle}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={isExpanded ? "Recolher" : "Expandir"}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Expanded body */}
      {isExpanded && (
        <div>
          <div className="px-5 pb-2 pt-0.5">
            <input
              type="text"
              value={exercise.note}
              onChange={(e) => onUpdateNote(e.target.value)}
              placeholder="Adicionar nota..."
              className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 px-5 pb-3">
            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground">
              Descanso: {formatRest(exercise.restSeconds)}
            </span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-y border-border bg-muted/30">
                <th className="py-1.5 pl-5 pr-2 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Set
                </th>
                <th className="py-1.5 px-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Carga
                </th>
                <th className="py-1.5 px-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Repetições
                </th>
                <th className="py-1.5 px-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  RM
                </th>
                <th className="py-1.5 pl-2 pr-4 w-10" />
              </tr>
            </thead>
            <tbody>
              {exercise.sets.map((set, idx) => (
                <SetRow
                  key={set.id}
                  set={set}
                  onUpdate={(updates) => onUpdateSet(idx, updates)}
                  onDelete={() => onDeleteSet(idx)}
                />
              ))}
            </tbody>
          </table>

          <button
            onClick={onAddSet}
            className="flex items-center gap-1.5 w-full justify-center py-3 text-[13px] font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar série
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sortable wrapper ────────────────────────────────────────────────────────

function SortableExerciseBlock({
  exercise,
  ...rest
}: Omit<ExerciseBlockProps, "dragAttributes" | "dragListeners"> & {
  exercise: LocalExercise;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
        position: "relative",
      }}
    >
      <ExerciseBlock
        exercise={exercise}
        dragAttributes={attributes}
        dragListeners={listeners as Record<string, React.EventHandler<React.SyntheticEvent>>}
        {...rest}
      />
    </div>
  );
}

// ─── WorkoutDetailPage ───────────────────────────────────────────────────────

export function WorkoutDetailPage({ workout }: { workout: WorkoutDetail }) {
  const router = useRouter();

  const [exercises, setExercises] = useState<LocalExercise[]>(() =>
    workout.exercises.map(toLocalExercise)
  );
  const [expandedId, setExpandedId] = useState<string | null>(
    workout.exercises[0]?.id ?? null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setExercises((prev) => {
      const oldIdx = prev.findIndex((e) => e.id === active.id);
      const newIdx = prev.findIndex((e) => e.id === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  function updateSet(exIdx: number, setIdx: number, updates: Partial<LocalSet>) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i !== exIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, ...updates } : s)) }
      )
    );
  }

  function deleteSet(exIdx: number, setIdx: number) {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const filtered = ex.sets.filter((_, j) => j !== setIdx);
        return {
          ...ex,
          sets: filtered.map((s, j) => ({
            ...s,
            setNumber: j + 1,
            id: `${ex.id}-${j + 1}`,
          })),
        };
      })
    );
  }

  function addSet(exIdx: number) {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const nextNum = ex.sets.length + 1;
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { id: `${ex.id}-${nextNum}`, setNumber: nextNum, targetReps: "", targetKg: "" },
          ],
        };
      })
    );
  }

  function updateNote(exIdx: number, note: string) {
    setExercises((prev) =>
      prev.map((ex, i) => (i === exIdx ? { ...ex, note } : ex))
    );
  }

  const muscleGroups = [...new Set(exercises.map((e) => e.muscleGroup))];

  return (
    <div className="flex h-full">
      {/* Scrollable center column */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
        {/* Sticky header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card sticky top-0 z-20">
          <Link
            href={`/program/${workout.programId}`}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Voltar para o programa"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <h1 className="text-[15px] font-bold flex-1 truncate min-w-0">{workout.name}</h1>

          <button
            onClick={() => router.push(`/workout/${workout.id}/start`)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-pill px-3 py-1.5 text-[13px] font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            <Play className="h-3 w-3" fill="currentColor" />
            <span className="hidden xs:inline">Iniciar</span>
          </button>

          <button className="shrink-0 text-[13px] font-medium text-muted-foreground border border-border rounded-pill px-3 py-1.5 hover:text-foreground hover:border-foreground/30 transition-colors">
            Salvar
          </button>

          <button
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Mais opções"
          >
            <Ellipsis className="h-5 w-5" />
          </button>
        </div>

        {/* Exercise list */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={exercises.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            {exercises.map((ex, idx) => (
              <SortableExerciseBlock
                key={ex.id}
                exercise={ex}
                isExpanded={expandedId === ex.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === ex.id ? null : ex.id))
                }
                onUpdateSet={(setIdx, updates) => updateSet(idx, setIdx, updates)}
                onDeleteSet={(setIdx) => deleteSet(idx, setIdx)}
                onAddSet={() => addSet(idx)}
                onUpdateNote={(note) => updateNote(idx, note)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add exercise */}
        <button className="flex items-center gap-2 justify-center py-4 w-full text-[14px] font-medium text-primary hover:bg-primary/5 transition-colors border-b border-border">
          <Plus className="h-4 w-4" />
          Adicionar exercício
        </button>

        <div className="pb-24 md:pb-8" />
      </div>

      {/* Desktop right panel */}
      <div className="hidden lg:block w-80 shrink-0 border-l border-border overflow-y-auto">
        <SuggestionsPanel muscleGroups={muscleGroups} />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";
import { ExercisePicker } from "@/components/workout/ExercisePicker";
import { workoutFormSchema, type WorkoutFormValues } from "@/lib/workout/workout-form.schema";

/**
 * Input type for the form (pre-validation/transform). Differs from
 * `WorkoutFormValues` (the inferred output type) only in that `restSeconds`
 * is optional here due to the schema's `.default(90)`. We always set it
 * explicitly on `append`, so the two are equivalent in practice.
 */
type WorkoutFormInput = z.input<typeof workoutFormSchema>;

interface WorkoutBuilderProps {
  mode: "create" | "edit";
  initialValues?: WorkoutFormValues;
  onSubmit: (values: WorkoutFormValues) => Promise<unknown>;
  isLoading?: boolean;
  submitError?: string;
}

const DEFAULT_VALUES: WorkoutFormValues = { name: "", description: "", exercises: [] };

export function WorkoutBuilder({
  mode,
  initialValues,
  onSubmit,
  isLoading,
  submitError,
}: WorkoutBuilderProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkoutFormInput, unknown, WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: initialValues ?? DEFAULT_VALUES,
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: "exercises" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    move(oldIndex, newIndex);
  }

  const submit: SubmitHandler<WorkoutFormValues> = async (values) => {
    try {
      await onSubmit(values);
    } catch {
      // parent surfaces the error via the `submitError` prop
    }
  };

  const exercisesArrayError =
    errors.exercises?.message ?? errors.exercises?.root?.message;

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workout-name">Nome *</Label>
          <Input
            id="workout-name"
            placeholder="Ex: Treino A - Peito e Tríceps"
            {...register("name")}
          />
          {errors.name?.message && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workout-description">Descrição</Label>
          <Textarea
            id="workout-description"
            placeholder="Detalhes opcionais sobre este treino"
            {...register("description")}
          />
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <ExerciseBlock
                key={field.id}
                id={field.id}
                index={index}
                control={control}
                register={register}
                errors={errors}
                exercise={field._exercise}
                onRemove={() => remove(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-col gap-1.5">
        <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
          <Plus className="h-4 w-4" />
          Adicionar exercício
        </Button>
        {exercisesArrayError && (
          <p className="text-sm text-destructive">{exercisesArrayError}</p>
        )}
      </div>

      <ExercisePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        excludeIds={fields.map((f) => f.exerciseId)}
        onSelect={(exercise) => {
          append({
            exerciseId: exercise.id,
            _exercise: exercise,
            restSeconds: 90,
            notes: "",
            plannedSets: [{ targetReps: "", targetKg: "" }],
          });
          setPickerOpen(false);
        }}
      />

      <div className="flex flex-col gap-1.5">
        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        <Button type="submit" isLoading={isLoading}>
          {mode === "create" ? "Criar treino" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

// ─── ExerciseBlock ───────────────────────────────────────────────────────────

type WorkoutFormHook = ReturnType<typeof useForm<WorkoutFormInput, unknown, WorkoutFormValues>>;

interface ExerciseBlockProps {
  id: string;
  index: number;
  exercise: WorkoutFormValues["exercises"][number]["_exercise"];
  control: WorkoutFormHook["control"];
  register: WorkoutFormHook["register"];
  errors: WorkoutFormHook["formState"]["errors"];
  onRemove: () => void;
}

function ExerciseBlock({ id, index, exercise, control, register, errors, onRemove }: ExerciseBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const {
    fields: setFields,
    append: appendSet,
    remove: removeSet,
  } = useFieldArray({ control, name: `exercises.${index}.plannedSets` });

  const exerciseErrors = errors.exercises?.[index];
  const plannedSetsArrayError =
    exerciseErrors?.plannedSets?.message ?? exerciseErrors?.plannedSets?.root?.message;

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
      className="flex flex-col gap-3 rounded-l border border-border bg-card p-3"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="touch-none shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
          aria-label="Arrastar exercício"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="relative h-11 w-11 rounded-m overflow-hidden shrink-0">
          <ExerciseImage src={exercise.imageUrl} alt={exercise.name} sizes="44px" />
        </div>

        <p className="flex-1 min-w-0 text-[14px] font-semibold leading-tight truncate">
          {exercise.name}
        </p>

        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors"
          aria-label="Remover exercício"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Rest seconds */}
      <div className="flex flex-col gap-1.5 max-w-[160px]">
        <Label htmlFor={`exercise-${index}-rest`}>Descanso (s)</Label>
        <Input
          id={`exercise-${index}-rest`}
          type="number"
          {...register(`exercises.${index}.restSeconds`, { valueAsNumber: true })}
        />
        {exerciseErrors?.restSeconds?.message && (
          <p className="text-sm text-destructive">{exerciseErrors.restSeconds.message}</p>
        )}
      </div>

      {/* Notes / advanced techniques */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`exercise-${index}-notes`}>Técnica/observações</Label>
        <Textarea
          id={`exercise-${index}-notes`}
          placeholder="Ex: drop set na última série, bi-set com tríceps..."
          {...register(`exercises.${index}.notes`)}
        />
      </div>

      {/* Planned sets table */}
      <div className="flex flex-col gap-2">
        <table className="w-full">
          <thead>
            <tr className="border-y border-border bg-muted/30">
              <th className="py-1.5 pl-2 pr-2 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-10">
                Set
              </th>
              <th className="py-1.5 px-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Repetições
              </th>
              <th className="py-1.5 px-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Carga
              </th>
              <th className="py-1.5 pl-2 pr-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {setFields.map((setField, setIdx) => {
              const setErrors = exerciseErrors?.plannedSets?.[setIdx];
              return (
                <tr key={setField.id} className="border-b border-border/40 last:border-0">
                  <td className="py-2 pl-2 pr-2 align-top">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/15 text-primary text-[11px] font-bold">
                      {setIdx + 1}
                    </span>
                  </td>
                  <td className="py-2 px-2 align-top">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="—"
                      aria-label={`Repetições da série ${setIdx + 1}`}
                      {...register(`exercises.${index}.plannedSets.${setIdx}.targetReps`)}
                    />
                    {setErrors?.targetReps?.message && (
                      <p className="text-sm text-destructive mt-1">
                        {setErrors.targetReps.message}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-2 align-top">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="—"
                      aria-label={`Carga da série ${setIdx + 1}`}
                      {...register(`exercises.${index}.plannedSets.${setIdx}.targetKg`)}
                    />
                  </td>
                  <td className="py-2 pl-2 pr-2 text-right align-top">
                    <button
                      type="button"
                      onClick={() => removeSet(setIdx)}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors"
                      aria-label={`Remover série ${setIdx + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {plannedSetsArrayError && (
          <p className="text-sm text-destructive">{plannedSetsArrayError}</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => appendSet({ targetReps: "", targetKg: "" })}
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar série
        </Button>
      </div>
    </div>
  );
}

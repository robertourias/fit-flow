"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useExercises } from "@/lib/api/hooks/use-exercises";
import { useCreateStudentStrategy } from "@/lib/api/hooks/use-create-student-strategy";
import { useCreateStudentWorkout } from "@/lib/api/hooks/use-create-student-workout";
import { ApiClientError } from "@/lib/api/client";

const exerciseRowSchema = z.object({
  exerciseId: z.string().min(1, "Selecione um exercício"),
  targetReps: z.string().min(1, "Informe as repetições"),
});

const schema = z.object({
  strategyName: z.string().min(1, "Informe o nome da estratégia"),
  workoutName: z.string().min(1, "Informe o nome do treino"),
  exercises: z.array(exerciseRowSchema).min(1, "Adicione ao menos um exercício"),
});

type FormValues = z.infer<typeof schema>;

interface CreateStudentRoutineFormProps {
  studentId: string;
  onCreated?: () => void;
}

export function CreateStudentRoutineForm({ studentId, onCreated }: CreateStudentRoutineFormProps) {
  const { data: exercisesPages } = useExercises();
  const exercises = exercisesPages?.pages.flatMap((p) => p.items) ?? [];

  const createStrategy = useCreateStudentStrategy(studentId);
  const createWorkout = useCreateStudentWorkout(studentId);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { strategyName: "", workoutName: "", exercises: [{ exerciseId: "", targetReps: "" }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "exercises" });

  async function onSubmit(values: FormValues) {
    setSubmitError(undefined);
    setSuccess(false);
    try {
      const strategy = await createStrategy.mutateAsync({ name: values.strategyName });
      await createWorkout.mutateAsync({
        strategyId: strategy.id,
        name: values.workoutName,
        order: 0,
        exercises: values.exercises.map((ex, index) => ({
          exerciseId: ex.exerciseId,
          order: index,
          plannedSets: [{ setNumber: 1, targetReps: ex.targetReps }],
        })),
      });
      setSuccess(true);
      onCreated?.();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 403) {
        setSubmitError("Limite de treinos do plano gratuito do aluno foi atingido.");
      } else if (err instanceof ApiClientError && err.status === 404) {
        setSubmitError("Vínculo com o aluno não está mais ativo.");
      } else {
        setSubmitError("Não foi possível criar a rotina. Tente novamente.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <Label htmlFor="strategyName">Nome da estratégia</Label>
        <Input id="strategyName" placeholder="ex: Hipertrofia — fase 1" {...register("strategyName")} />
        {errors.strategyName && (
          <p className="text-xs text-destructive mt-1">{errors.strategyName.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="workoutName">Nome do treino</Label>
        <Input id="workoutName" placeholder="ex: Treino A — Peito e tríceps" {...register("workoutName")} />
        {errors.workoutName && (
          <p className="text-xs text-destructive mt-1">{errors.workoutName.message}</p>
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Exercícios</legend>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor={`exercises.${index}.exerciseId`}>Exercício</Label>
              <select
                id={`exercises.${index}.exerciseId`}
                className={cn(
                  "flex h-10 w-full rounded-m border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
                defaultValue=""
                {...register(`exercises.${index}.exerciseId`)}
              >
                <option value="" disabled>
                  Selecione
                </option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
              {errors.exercises?.[index]?.exerciseId && (
                <p className="text-xs text-destructive mt-1">
                  {errors.exercises[index]?.exerciseId?.message}
                </p>
              )}
            </div>
            <div className="w-28">
              <Label htmlFor={`exercises.${index}.targetReps`}>Reps</Label>
              <Input
                id={`exercises.${index}.targetReps`}
                placeholder="ex: 12"
                {...register(`exercises.${index}.targetReps`)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remover exercício"
              onClick={() => remove(index)}
              disabled={fields.length <= 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {errors.exercises?.root && (
          <p className="text-xs text-destructive">{errors.exercises.root.message}</p>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ exerciseId: "", targetReps: "" })}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Adicionar exercício
        </Button>
      </fieldset>

      {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}
      {success && (
        <p role="status" className="text-sm text-[hsl(var(--color-success-text))]">
          Rotina criada com sucesso.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando..." : "Criar rotina"}
      </Button>
    </form>
  );
}

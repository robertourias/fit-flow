"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateBodyMeasurement } from "@/lib/api/hooks/use-create-body-measurement";
import { useUpdateBodyMeasurement } from "@/lib/api/hooks/use-update-body-measurement";
import type { BodyMeasurementDto } from "@fitflow/types";

const optionalPositive = z.union([
  z.number().positive(),
  z.nan(),
  z.undefined(),
]).transform((v) => (v == null || Number.isNaN(v) ? undefined : v)).optional();

const schema = z.object({
  measuredAt: z.string().min(1, "Informe a data"),
  weight: optionalPositive,
  neck: optionalPositive,
  chest: optionalPositive,
  waist: optionalPositive,
  hip: optionalPositive,
  leftArm: optionalPositive,
  rightArm: optionalPositive,
  leftThigh: optionalPositive,
  rightThigh: optionalPositive,
  calf: optionalPositive,
  bodyFatPct: optionalPositive,
  muscleMassPct: optionalPositive,
  visceralFat: optionalPositive,
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface MeasurementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  measurement?: BodyMeasurementDto;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function numField(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}

export function MeasurementFormDialog({ open, onOpenChange, measurement }: MeasurementFormDialogProps) {
  const create = useCreateBodyMeasurement();
  const update = useUpdateBodyMeasurement();
  const isEdit = !!measurement;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { measuredAt: today() },
  });

  useEffect(() => {
    if (open) {
      reset(
        measurement
          ? {
              measuredAt: measurement.measuredAt.slice(0, 10),
              weight: measurement.weight ?? undefined,
              neck: measurement.neck ?? undefined,
              chest: measurement.chest ?? undefined,
              waist: measurement.waist ?? undefined,
              hip: measurement.hip ?? undefined,
              leftArm: measurement.leftArm ?? undefined,
              rightArm: measurement.rightArm ?? undefined,
              leftThigh: measurement.leftThigh ?? undefined,
              rightThigh: measurement.rightThigh ?? undefined,
              calf: measurement.calf ?? undefined,
              bodyFatPct: measurement.bodyFatPct ?? undefined,
              muscleMassPct: measurement.muscleMassPct ?? undefined,
              visceralFat: measurement.visceralFat ?? undefined,
              notes: measurement.notes ?? "",
            }
          : { measuredAt: today() },
      );
    }
  }, [open, measurement, reset]);

  async function onSubmit(values: FormValues) {
    const payload = {
      measuredAt: values.measuredAt,
      weight: values.weight,
      neck: values.neck,
      chest: values.chest,
      waist: values.waist,
      hip: values.hip,
      leftArm: values.leftArm,
      rightArm: values.rightArm,
      leftThigh: values.leftThigh,
      rightThigh: values.rightThigh,
      calf: values.calf,
      bodyFatPct: values.bodyFatPct,
      muscleMassPct: values.muscleMassPct,
      visceralFat: values.visceralFat,
      notes: values.notes || undefined,
    };

    if (isEdit && measurement) {
      await update.mutateAsync({ id: measurement.id, data: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  const error = create.error?.message ?? update.error?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar medição" : "Novo registro"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          {/* Data */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">Data</legend>
            <div>
              <Label htmlFor="measuredAt">Data da medição</Label>
              <Input
                id="measuredAt"
                type="date"
                max={today()}
                {...register("measuredAt")}
              />
              {errors.measuredAt && (
                <p className="text-xs text-destructive mt-1">{errors.measuredAt.message}</p>
              )}
            </div>
          </fieldset>

          {/* Peso */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">Peso</legend>
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="1"
                max="500"
                placeholder="ex: 80.5"
                {...register("weight", { valueAsNumber: true })}
              />
            </div>
          </fieldset>

          {/* Medidas corporais */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">Medidas corporais (cm)</legend>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "neck", label: "Pescoço" },
                { id: "chest", label: "Peito" },
                { id: "waist", label: "Cintura" },
                { id: "hip", label: "Quadril" },
                { id: "leftArm", label: "Braço esq." },
                { id: "rightArm", label: "Braço dir." },
                { id: "leftThigh", label: "Coxa esq." },
                { id: "rightThigh", label: "Coxa dir." },
                { id: "calf", label: "Panturrilha" },
              ].map(({ id, label }) => (
                <div key={id}>
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    type="number"
                    step="0.1"
                    min="1"
                    max="300"
                    placeholder="cm"
                    {...register(id as keyof FormValues, { valueAsNumber: true })}
                  />
                </div>
              ))}
            </div>
          </fieldset>

          {/* Bioimpedância */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">Bioimpedância</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bodyFatPct">Gordura corporal (%)</Label>
                <Input
                  id="bodyFatPct"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="%"
                  {...register("bodyFatPct", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="muscleMassPct">Massa muscular (%)</Label>
                <Input
                  id="muscleMassPct"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="%"
                  {...register("muscleMassPct", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="visceralFat">Gordura visceral (nível)</Label>
                <Input
                  id="visceralFat"
                  type="number"
                  step="1"
                  min="1"
                  max="59"
                  placeholder="1–59"
                  {...register("visceralFat", { valueAsNumber: true })}
                />
              </div>
            </div>
          </fieldset>

          {/* Observações */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">Observações</legend>
            <div>
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Contexto adicional sobre esta medição..."
                {...register("notes")}
              />
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Ruler, Plus, Trash2 } from "lucide-react";
import { useBodyMeasurements } from "@/lib/api/hooks/use-body-measurements";
import { useDeleteBodyMeasurement } from "@/lib/api/hooks/use-delete-body-measurement";
import { useUserMe } from "@/lib/api/hooks/use-user-me";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MeasurementFormDialog } from "./MeasurementFormDialog";
import type { BodyMeasurementDto } from "@fitflow/types";

interface MeasurementListItemProps {
  measurement: BodyMeasurementDto;
  onEdit: (m: BodyMeasurementDto) => void;
  onDelete: (id: string) => void;
}

function MeasurementListItem({ measurement, onEdit, onDelete }: MeasurementListItemProps) {
  const dateLabel = format(parseISO(measurement.measuredAt), "dd/MM/yyyy", { locale: ptBR });

  return (
    <li className="border-b border-border px-5 py-4 flex items-center gap-3">
      <button
        className="flex-1 text-left"
        onClick={() => onEdit(measurement)}
        aria-label={`Editar medição de ${dateLabel}`}
      >
        <p className="text-sm font-semibold text-foreground">{dateLabel}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {measurement.weight != null && `Peso: ${measurement.weight} kg`}
          {measurement.weight != null && measurement.waist != null && " · "}
          {measurement.waist != null && `Cintura: ${measurement.waist} cm`}
          {(measurement.weight != null || measurement.waist != null) && measurement.bodyFatPct != null && " · "}
          {measurement.bodyFatPct != null && `Gordura: ${measurement.bodyFatPct}%`}
        </p>
      </button>
      <button
        onClick={() => onDelete(measurement.id)}
        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
        aria-label={`Excluir medição de ${dateLabel}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

export function MeasurementsPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useBodyMeasurements();
  const { data: user } = useUserMe();
  const deleteMutation = useDeleteBodyMeasurement();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BodyMeasurementDto | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const measurements = data?.pages.flatMap((p) => p.items) ?? [];

  function handleEdit(m: BodyMeasurementDto) {
    setEditing(m);
    setFormOpen(true);
  }

  function handleNewClick() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) setEditing(undefined);
  }

  async function handleConfirmDelete() {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
  }

  return (
    <main className="min-h-dvh bg-background">
      {/* Banner FREE */}
      {user?.plan === "FREE" && (
        <div
          role="alert"
          className="mx-5 mt-5 rounded-lg bg-[var(--color-warning-bg)] border border-[var(--color-warning)] px-4 py-3 text-sm text-[var(--color-warning-text)]"
        >
          Medidas com mais de 60 dias não aparecem aqui no plano gratuito.
        </div>
      )}

      {/* Header com botão novo */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h1 className="text-base font-semibold text-foreground">Medidas</h1>
        <Button size="sm" onClick={handleNewClick}>
          <Plus className="h-4 w-4 mr-1.5" />
          Novo registro
        </Button>
      </div>

      {/* Loading */}
      {isLoading && !data ? (
        <ul aria-label="Carregando medidas" className="mt-2 space-y-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="border-b border-border px-5 py-4">
              <div className="h-5 w-32 rounded bg-muted animate-pulse mb-1.5" />
              <div className="h-3 w-48 rounded bg-muted animate-pulse" />
            </li>
          ))}
        </ul>
      ) : measurements.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-4 pt-24 px-5 text-center">
          <Ruler className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">Nenhuma medida registrada ainda.</h2>
          <Button onClick={handleNewClick}>
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar medida
          </Button>
        </section>
      ) : (
        <ul>
          {measurements.map((m) => (
            <MeasurementListItem
              key={m.id}
              measurement={m}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </ul>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center px-5 py-6">
          <Button variant="secondary" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}

      {/* Form dialog */}
      <MeasurementFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        measurement={editing}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir medição?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

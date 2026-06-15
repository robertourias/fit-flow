"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPLIT_PRESETS, type SplitType } from "@/lib/onboarding/split-presets";

export type StrategySplitOption = SplitType | "Personalizado";

export interface StrategyFormValues {
  name: string;
  type?: StrategySplitOption;
  description?: string;
}

export interface StrategyFormSubmitValues {
  name: string;
  type?: string;
  description?: string;
}

interface StrategyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialValues?: StrategyFormValues;
  onSubmit: (values: StrategyFormSubmitValues) => Promise<unknown>;
}

const SPLIT_OPTIONS: StrategySplitOption[] = [
  ...(Object.keys(SPLIT_PRESETS) as SplitType[]),
  "Personalizado",
];

const EMPTY_VALUES: StrategyFormValues = { name: "", type: undefined, description: "" };

export function StrategyFormDialog({
  open,
  onOpenChange,
  mode,
  initialValues,
  onSubmit,
}: StrategyFormDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<StrategySplitOption | "">("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const values = initialValues ?? EMPTY_VALUES;
    setName(values.name);
    setType(values.type ?? "");
    setDescription(values.description ?? "");
    setNameError(null);
    setSubmitError(null);
  }, [open, initialValues]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Nome é obrigatório");
      return;
    }

    setNameError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        name: trimmedName,
        type: type === "Personalizado" || type === "" ? undefined : type,
        description: description.trim() || undefined,
      });
      onOpenChange(false);
    } catch {
      setSubmitError("Não foi possível salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Criar novo programa" : "Editar programa"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Defina o nome e, opcionalmente, o split do seu novo programa."
              : "Atualize o nome, split e descrição deste programa."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="strategy-name">Nome *</Label>
            <Input
              id="strategy-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treino de Hipertrofia"
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="strategy-type">Split</Label>
            <Select value={type} onValueChange={(value) => setType(value as StrategySplitOption)}>
              <SelectTrigger id="strategy-type">
                <SelectValue placeholder="Escolha um split" />
              </SelectTrigger>
              <SelectContent>
                {SPLIT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="strategy-description">Descrição</Label>
            <Textarea
              id="strategy-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes opcionais sobre este programa"
            />
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <DialogFooter>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

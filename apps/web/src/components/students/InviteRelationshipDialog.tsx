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
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInviteRelationship } from "@/lib/api/hooks/use-invite-relationship";

const schema = z.object({
  targetEmail: z.string().min(1, "Informe o email").email("Email inválido"),
});

type FormValues = z.infer<typeof schema>;

interface InviteRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "trainer" = convidando um aluno; "student" = convidando um preparador */
  role: "trainer" | "student";
}

export function InviteRelationshipDialog({ open, onOpenChange, role }: InviteRelationshipDialogProps) {
  const invite = useInviteRelationship();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset({ targetEmail: "" });
  }, [open, reset]);

  async function onSubmit(values: FormValues) {
    await invite.mutateAsync({ targetEmail: values.targetEmail });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role === "trainer" ? "Convidar aluno" : "Convidar preparador"}</DialogTitle>
          <DialogDescription>
            {role === "trainer"
              ? "Informe o email do aluno que você quer acompanhar."
              : "Informe o email do preparador que vai te acompanhar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="targetEmail">Email</Label>
            <Input
              id="targetEmail"
              type="email"
              placeholder="nome@exemplo.com"
              {...register("targetEmail")}
            />
            {errors.targetEmail && (
              <p className="text-xs text-destructive mt-1">{errors.targetEmail.message}</p>
            )}
          </div>

          {invite.error && (
            <p role="alert" className="text-sm text-destructive">{invite.error.message}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Convidar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

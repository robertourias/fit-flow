"use client";

import { useState } from "react";
import { Users, UserPlus, Check, X, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useRespondRelationship } from "@/lib/api/hooks/use-respond-relationship";
import { useRevokeRelationship } from "@/lib/api/hooks/use-revoke-relationship";
import { InviteRelationshipDialog } from "./InviteRelationshipDialog";
import type { RelationshipDto } from "@fitflow/types";

const STATUS_LABEL: Record<RelationshipDto["status"], string> = {
  PENDING: "Pendente",
  ACTIVE: "Ativo",
  REVOKED: "Revogado",
};

interface RelationshipListProps {
  /** "trainer" = a aba "Meus Alunos" (current user é o trainer); "student" = aba "Meus Preparadores" */
  role: "trainer" | "student";
  relationships: RelationshipDto[];
  isLoading: boolean;
  isError: boolean;
  currentUserId: string;
  onSelectActive?: (relationship: RelationshipDto) => void;
}

export function RelationshipList({
  role,
  relationships,
  isLoading,
  isError,
  currentUserId,
  onSelectActive,
}: RelationshipListProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<RelationshipDto | null>(null);
  const respond = useRespondRelationship();
  const revoke = useRevokeRelationship();

  const emptyLabel = role === "trainer" ? "Nenhum aluno vinculado ainda." : "Nenhum preparador vinculado ainda.";
  const inviteLabel = role === "trainer" ? "Convidar aluno" : "Convidar preparador";

  async function handleAccept(relationship: RelationshipDto) {
    await respond.mutateAsync({ id: relationship.id, action: "ACCEPT" });
  }

  async function handleReject(relationship: RelationshipDto) {
    await respond.mutateAsync({ id: relationship.id, action: "REJECT" });
  }

  async function handleConfirmRevoke() {
    if (!revokeTarget) return;
    await revoke.mutateAsync(revokeTarget.id);
    setRevokeTarget(null);
  }

  function otherPartyName(relationship: RelationshipDto): string {
    return role === "trainer" ? relationship.studentName : relationship.trainerName;
  }

  function canRespond(relationship: RelationshipDto): boolean {
    // only the invited side (who did not initiate) may accept/reject
    const initiatedByCurrentUser =
      (relationship.initiatedBy === "TRAINER" && relationship.trainerId === currentUserId) ||
      (relationship.initiatedBy === "STUDENT" && relationship.studentId === currentUserId);
    return relationship.status === "PENDING" && !initiatedByCurrentUser;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h2 className="text-base font-semibold text-foreground">
          {role === "trainer" ? "Meus Alunos" : "Meus Preparadores"}
        </h2>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1.5" />
          {inviteLabel}
        </Button>
      </div>

      {isLoading && (
        <ul aria-label="Carregando vínculos" className="mt-2 space-y-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="border-b border-border px-5 py-4">
              <div className="h-5 w-32 rounded bg-muted animate-pulse mb-1.5" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </li>
          ))}
        </ul>
      )}

      {isError && !isLoading && (
        <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <p className="text-sm text-destructive">Não foi possível carregar a lista.</p>
        </div>
      )}

      {!isLoading && !isError && relationships.length === 0 && (
        <section className="flex flex-col items-center justify-center gap-4 pt-16 px-5 text-center">
          <Users className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-base font-semibold text-foreground">{emptyLabel}</h3>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            {inviteLabel}
          </Button>
        </section>
      )}

      {!isLoading && !isError && relationships.length > 0 && (
        <ul>
          {relationships.map((relationship) => {
            const name = otherPartyName(relationship);
            const isActive = relationship.status === "ACTIVE";
            const clickable = role === "trainer" && isActive && !!onSelectActive;

            return (
              <li key={relationship.id} className="border-b border-border px-5 py-4 flex items-center gap-3">
                {clickable ? (
                  <button
                    className="flex-1 text-left"
                    onClick={() => onSelectActive?.(relationship)}
                    aria-label={`Ver detalhes de ${name}`}
                  >
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <Badge variant={isActive ? "success" : relationship.status === "PENDING" ? "warning" : "muted"}>
                      {STATUS_LABEL[relationship.status]}
                    </Badge>
                  </button>
                ) : (
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <Badge variant={isActive ? "success" : relationship.status === "PENDING" ? "warning" : "muted"}>
                      {STATUS_LABEL[relationship.status]}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  {canRespond(relationship) && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`Aceitar convite de ${name}`}
                        onClick={() => handleAccept(relationship)}
                        disabled={respond.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Recusar convite de ${name}`}
                        onClick={() => handleReject(relationship)}
                        disabled={respond.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {isActive && (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Revogar vínculo com ${name}`}
                      onClick={() => setRevokeTarget(relationship)}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <InviteRelationshipDialog open={inviteOpen} onOpenChange={setInviteOpen} role={role} />

      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => { if (!open) setRevokeTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar vínculo?</AlertDialogTitle>
            <AlertDialogDescription>
              {revokeTarget && `O vínculo com ${otherPartyName(revokeTarget)} será encerrado. Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRevoke}>Revogar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

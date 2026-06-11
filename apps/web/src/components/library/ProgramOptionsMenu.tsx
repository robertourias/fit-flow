"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useUpdateStrategy } from "@/lib/api/hooks/use-update-strategy";
import { useDeleteStrategy } from "@/lib/api/hooks/use-delete-strategy";
import type { StrategyDetailDto } from "@fitflow/types";

interface ProgramOptionsMenuProps {
  strategy: StrategyDetailDto;
}

export function ProgramOptionsMenu({ strategy }: ProgramOptionsMenuProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const updateMutation = useUpdateStrategy();
  const deleteMutation = useDeleteStrategy();

  const handleToggleActive = async () => {
    try {
      await updateMutation.mutateAsync({
        id: strategy.id,
        data: { isActive: !strategy.isActive },
      });
    } catch (error) {
      console.error("Erro ao atualizar programa:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(strategy.id);
      setShowDeleteDialog(false);
      router.push("/library");
    } catch (error) {
      console.error("Erro ao deletar programa:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleToggleActive}
            disabled={updateMutation.isPending}
          >
            {strategy.isActive ? "Desativar" : "Ativar"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteMutation.isPending}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir programa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O programa "{strategy.name}" e
              todos os seus treinos serão permanentemente deletados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

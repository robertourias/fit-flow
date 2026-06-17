"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { exportNodeToPngBlob, shareOrDownloadImage } from "@/lib/share/export-image";

interface ShareCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  children: React.ReactNode;
}

type ExportAction = "download" | "share" | null;

export function ShareCardDialog({ open, onOpenChange, filename, children }: ShareCardDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [canShare, setCanShare] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeAction, setActiveAction] = useState<ExportAction>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.canShare);
  }, []);

  async function handleDownload() {
    if (!cardRef.current) return;

    setIsExporting(true);
    setActiveAction("download");
    setError(null);
    try {
      const blob = await exportNodeToPngBlob(cardRef.current);
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(href);
    } catch {
      setError("Não foi possível gerar a imagem. Tente novamente.");
    } finally {
      setIsExporting(false);
      setActiveAction(null);
    }
  }

  async function handleShare() {
    if (!cardRef.current) return;

    setIsExporting(true);
    setActiveAction("share");
    setError(null);
    try {
      const blob = await exportNodeToPngBlob(cardRef.current);
      await shareOrDownloadImage(blob, filename);
    } catch {
      setError("Não foi possível compartilhar a imagem. Tente novamente.");
    } finally {
      setIsExporting(false);
      setActiveAction(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <div ref={cardRef} className="mx-auto w-fit overflow-hidden rounded-l">
          {children}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={isExporting}
            onClick={handleDownload}
          >
            {isExporting && activeAction === "download" && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Baixar imagem
          </Button>

          {canShare && (
            <Button
              type="button"
              className="flex-1"
              disabled={isExporting}
              onClick={handleShare}
            >
              {isExporting && activeAction === "share" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Compartilhar
            </Button>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ShareCardDialog;

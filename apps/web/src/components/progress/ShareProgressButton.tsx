"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareCardDialog } from "@/components/share/ShareCardDialog";
import { ShareCardProgressTemplate } from "@/components/share/ShareCardProgressTemplate";
import type { DashboardSummaryDto } from "@fitflow/types";

interface ShareProgressButtonProps {
  summary: DashboardSummaryDto;
}

export function ShareProgressButton({ summary }: ShareProgressButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        <Share2 className="h-4 w-4" />
        Compartilhar progresso
      </Button>

      <ShareCardDialog open={open} onOpenChange={setOpen} filename="progresso-semana.png">
        <ShareCardProgressTemplate summary={summary} />
      </ShareCardDialog>
    </>
  );
}

export default ShareProgressButton;

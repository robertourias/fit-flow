import { Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/layout/NotificationBell";
import type { DashboardUser } from "@/lib/mock/dashboard";

interface TopHeaderProps {
  sectionTitle: string;
  user: DashboardUser;
}

export function TopHeader({ sectionTitle, user }: TopHeaderProps) {
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <header className="h-20 flex items-center gap-4 px-7 border-b border-border bg-card">
      <div className="flex flex-col flex-1 min-w-0 gap-0.5">
        <h1 className="font-bold text-[22px] leading-tight">{sectionTitle}</h1>
        <span className="text-[13px] text-muted-foreground capitalize">{today}</span>
      </div>

      {/* Plan badge: Zap icon + usage */}
      <div className="flex items-center gap-1.5 rounded-pill bg-[hsl(var(--color-warning-bg))] px-3 py-1.5 shrink-0">
        <Zap className="h-[13px] w-[13px] text-[hsl(var(--color-warning))]" />
        <span className="text-xs font-semibold text-[hsl(var(--color-warning-text))]">
          {user.planUsed} de {user.planLimit} treinos
        </span>
      </div>

      <ThemeToggle />

      <NotificationBell />
    </header>
  );
}

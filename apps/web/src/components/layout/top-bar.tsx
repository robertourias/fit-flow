"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavContent } from "@/components/layout/nav-content";
import type { DashboardUser } from "@/lib/mock/dashboard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

interface TopBarProps {
  user: DashboardUser;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TopBar({ user, activeTab, onTabChange }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <header className="flex items-center gap-2 px-5 py-4 bg-card border-b border-border">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-m bg-accent hover:bg-accent/80 shrink-0"
            aria-label="Abrir menu"
          >
            <Menu className="h-[18px] w-[18px]" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-72 p-0">
          <NavContent
            activeItem={activeTab}
            onItemChange={onTabChange}
            user={user}
            showThemeToggle
            onClose={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[20px] font-bold leading-tight truncate">
          {getGreeting()}, {user.name} 👋
        </span>
        <span className="text-[13px] text-muted-foreground capitalize">{today}</span>
      </div>

      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base">
          {user.initials}
        </AvatarFallback>
      </Avatar>
    </header>
  );
}

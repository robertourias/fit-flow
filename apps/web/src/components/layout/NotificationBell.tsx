"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/lib/api/hooks/use-notifications";
import { useMarkNotificationRead } from "@/lib/api/hooks/use-mark-notification-read";
import type { NotificationDto } from "@fitflow/types";

const TYPE_LABEL: Record<NotificationDto["type"], string> = {
  NEW_MESSAGE: "Nova mensagem",
};

export function NotificationBell() {
  const router = useRouter();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleSelect(notification: NotificationDto) {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
    const relationshipId = notification.payload?.relationshipId;
    if (typeof relationshipId === "string") {
      router.push("/students");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-m bg-accent hover:bg-accent/80 shrink-0"
          aria-label="Notificações"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 justify-center px-1 text-[11px]"
              aria-label={`${unreadCount} notificações não lidas`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground text-center">
            Nenhuma notificação por aqui.
          </p>
        )}

        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            onSelect={() => handleSelect(notification)}
            className="flex flex-col items-start gap-0.5"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="font-semibold">{TYPE_LABEL[notification.type] ?? notification.type}</span>
              {!notification.read && (
                <span className="h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(notification.createdAt), "d 'de' MMM, HH:mm", { locale: ptBR })}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

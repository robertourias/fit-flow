"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/lib/api/hooks/use-messages";
import { useSendMessage } from "@/lib/api/hooks/use-send-message";
import { useMarkMessagesRead } from "@/lib/api/hooks/use-mark-messages-read";
import { ApiClientError } from "@/lib/api/client";

interface ChatPanelProps {
  relationshipId: string;
  currentUserId: string;
}

export function ChatPanel({ relationshipId, currentUserId }: ChatPanelProps) {
  const { data, isLoading, isError } = useMessages(relationshipId);
  const sendMessage = useSendMessage(relationshipId);
  const markRead = useMarkMessagesRead(relationshipId);
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const markedReadRef = useRef(false);

  // Marca como lido ao abrir o painel (uma vez por montagem) — FR-005.
  useEffect(() => {
    if (markedReadRef.current) return;
    markedReadRef.current = true;
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- disparar uma única vez na montagem do painel
  }, []);

  const messages = data?.items ?? [];
  // API retorna createdAt desc; lista de chat exibe mais antiga -> mais recente.
  const orderedMessages = [...messages].reverse();

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setFormError(null);
    try {
      await sendMessage.mutateAsync({ content: trimmed });
      setContent("");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setFormError(error.message);
      } else {
        setFormError("Não foi possível enviar a mensagem.");
      }
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col gap-3 pt-4">
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto" aria-label="Histórico de mensagens">
        {isLoading && (
          <div className="flex flex-col gap-2">
            <div className="h-10 w-2/3 rounded-l bg-muted animate-pulse" />
            <div className="h-10 w-2/3 self-end rounded-l bg-muted animate-pulse" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">Não foi possível carregar as mensagens.</p>
        )}

        {!isLoading && !isError && orderedMessages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma mensagem ainda. Envie a primeira!
          </p>
        )}

        {!isLoading && !isError && orderedMessages.length > 0 && (
          <ul className="flex flex-col gap-2">
            {orderedMessages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              return (
                <li
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-l px-3 py-2 text-sm ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="flex items-center gap-2">
        <label htmlFor="chat-message-input" className="sr-only">
          Mensagem
        </label>
        <Input
          id="chat-message-input"
          placeholder="Escreva uma mensagem..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sendMessage.isPending}
        />
        <Button
          type="button"
          size="icon"
          aria-label="Enviar mensagem"
          onClick={handleSend}
          disabled={sendMessage.isPending || !content.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Icon from "@/components/ui/icon";
import { t } from "@/lib/i18n";

interface Conversation {
  id: number;
  other_name: string;
  other_avatar?: string;
  last_message?: string;
  last_message_at?: string;
  unread: number;
  animal_name?: string;
}

interface Message {
  id: number;
  sender_id: number;
  body: string;
  created_at: string;
  sender_name: string;
  sender_avatar?: string;
}

interface Props {
  initialConvId?: number;
  onBack?: () => void;
}

export default function MessagesPage({ initialConvId, onBack }: Props) {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<number | null>(initialConvId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .getConversations()
      .then((d: unknown) => setConvs((d as { conversations: Conversation[] }).conversations))
      .catch(() => toast.error(t("misc.error")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeConv == null) return;
    api
      .getMessages(activeConv)
      .then((d: unknown) => setMessages((d as { messages: Message[] }).messages))
      .catch(() => toast.error(t("misc.error")));
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim() || activeConv == null) return;
    const conv = convs.find((c) => c.id === activeConv);
    if (!conv) return;
    setSending(true);
    try {
      await api.sendMessage({ recipient_id: conv.id, body: text });
      setText("");
      const d = (await api.getMessages(activeConv)) as { messages: Message[] };
      setMessages(d.messages);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Chat view
  if (activeConv != null) {
    const conv = convs.find((c) => c.id === activeConv);
    return (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
          <button onClick={() => setActiveConv(null)}>
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <p className="font-semibold text-sm">{conv?.other_name}</p>
            {conv?.animal_name && <p className="text-xs text-muted-foreground">по объявлению: {conv.animal_name}</p>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((m) => {
            const isMe = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                    isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t bg-background">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Сообщение..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1"
          />
          <Button size="icon" onClick={sendMessage} disabled={sending || !text.trim()}>
            <Icon name="Send" size={16} />
          </Button>
        </div>
      </div>
    );
  }

  // Conversations list
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack}>
            <Icon name="ArrowLeft" size={20} />
          </button>
        )}
        <h2 className="font-semibold text-lg">{t("nav.messages")}</h2>
      </div>

      {!convs.length ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
          <Icon name="MessageCircle" size={40} className="opacity-30" />
          <p className="text-sm">Нет диалогов</p>
        </div>
      ) : (
        convs.map((c) => (
          <button
            key={c.id}
            className="w-full text-left flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted transition-colors"
            onClick={() => setActiveConv(c.id)}
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-semibold">
              {c.other_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{c.other_name}</p>
                {c.unread > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 ml-2">
                    {c.unread}
                  </span>
                )}
              </div>
              {c.animal_name && <p className="text-xs text-muted-foreground truncate">{c.animal_name}</p>}
              {c.last_message && <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

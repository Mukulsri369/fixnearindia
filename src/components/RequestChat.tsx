import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getRequestMessages } from "@/lib/marketplace.functions";

interface RequestChatProps {
  requestId: string;
  title?: string;
  technicianId?: string | null;
  onSend: (body: string) => Promise<unknown>;
}

export function RequestChat({ requestId, title = "Messages", technicianId, onSend }: RequestChatProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["request-messages", requestId],
    queryFn: () => getRequestMessages({ data: { requestId } }),
    enabled: open,
  });

  const visible = (messages ?? []).filter((m: any) =>
    technicianId ? m.technician_id === technicianId || m.technician_id === null : true
  );

  const handleSend = async () => {
    if (body.trim().length === 0) return;
    setSending(true);
    try {
      await onSend(body.trim());
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["request-messages", requestId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/50"
      >
        <MessageSquare className="h-4 w-4" />
        {title}
      </button>

      {open && (
        <div className="space-y-3 border-t p-4">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {visible.map((m: any) => (
                <div
                  key={m.id}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    m.sender_role === "customer" ? "bg-muted" : "bg-primary/10"
                  }`}
                >
                  <p className="text-xs font-medium capitalize text-muted-foreground">{m.sender_role}</p>
                  <p className="mt-0.5 whitespace-pre-wrap">{m.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Textarea rows={2} placeholder="Write a message…" value={body} onChange={(e) => setBody(e.target.value)} />
          <Button size="sm" onClick={handleSend} disabled={sending || body.trim().length === 0}>
            {sending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="mr-2 h-3 w-3" />}
            Send
          </Button>
        </div>
      )}
    </div>
  );
}

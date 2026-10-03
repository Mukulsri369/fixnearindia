import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getAmcMessages } from "@/lib/amc.functions";

export function AmcChat({ requestId, onSend, canSend = true }: { requestId: string; onSend: (body: string) => Promise<unknown>; canSend?: boolean }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["amc-messages", requestId],
    queryFn: () => getAmcMessages({ data: { requestId } }),
    enabled: open,
  });

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await onSend(body.trim());
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["amc-messages", requestId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  return <div className="rounded-lg border">
    <Button type="button" variant="ghost" className="h-auto w-full justify-start rounded-none px-4 py-3" onClick={() => setOpen((value) => !value)}>
      <MessageSquare className="mr-2 h-4 w-4" /> AMC conversation
    </Button>
    {open ? <div className="space-y-3 border-t p-4">
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : data.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> :
        <div className="max-h-64 space-y-2 overflow-y-auto">{data.map((message) => <div key={message.id} className={message.sender_role === "customer" ? "rounded-lg bg-muted px-3 py-2 text-sm" : "rounded-lg bg-primary/10 px-3 py-2 text-sm"}>
          <p className="text-xs font-medium capitalize text-muted-foreground">{message.sender_role}</p>
          <p className="whitespace-pre-wrap">{message.body}</p>
          <p className="mt-1 text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p>
        </div>)}</div>}
      {canSend ? <><Textarea rows={2} placeholder="Write a message…" value={body} onChange={(event) => setBody(event.target.value)} />
        <Button size="sm" disabled={sending || !body.trim()} onClick={send}>{sending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="mr-2 h-3 w-3" />}Send</Button></> : null}
    </div> : null}
  </div>;
}
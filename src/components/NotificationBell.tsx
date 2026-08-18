import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getMyNotifications, markNotificationsRead } from "@/lib/notifications.functions";

export function NotificationBell() {
  const fetchNotifications = useServerFn(getMyNotifications);
  const markRead = useServerFn(markNotificationsRead);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(),
    refetchInterval: 30000,
  });

  const items = data ?? [];
  const unread = items.filter((n: any) => !n.read).length;

  const handleOpenChange = async (open: boolean) => {
    if (open && unread > 0) {
      await markRead({ data: {} });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Notifications</div>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">You have no notifications yet.</p>
        ) : (
          <ScrollArea className="max-h-80">
            <ul className="divide-y">
              {items.map((n: any) => (
                <li key={n.id} className={`px-4 py-3 ${n.read ? "" : "bg-accent/40"}`}>
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

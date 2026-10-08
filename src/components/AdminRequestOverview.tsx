import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminRequestOverview } from "@/lib/admin-users.functions";

export function AdminRequestOverview() {
  const [page, setPage] = useState(1);
  const load = useServerFn(getAdminRequestOverview);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-request-overview", page],
    queryFn: () => load({ data: { page } }),
    retry: false,
  });

  if (isLoading) return <Loader2 aria-label="Loading requests" className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (error) return <p role="alert" className="text-sm text-destructive">{error instanceof Error ? error.message : "Could not load requests"}</p>;
  if (!data?.authorized) return <p className="text-sm text-muted-foreground">Admin access required.</p>;
  const pages = Math.max(1, Math.ceil(Math.max(data.repairCount, data.amcCount) / 100));

  return (
    <div className="space-y-8">
      <RequestList title="All repair requests" items={data.repairRequests} count={data.repairCount} type="repair" />
      <RequestList title="All AMC requests" items={data.amcRequests} count={data.amcCount} type="amc" />
      {pages > 1 ? <div className="flex items-center justify-end gap-3"><Button variant="outline" size="icon" aria-label="Previous requests" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft /></Button><span className="text-sm text-muted-foreground">{page} / {pages}</span><Button variant="outline" size="icon" aria-label="Next requests" disabled={page === pages} onClick={() => setPage(page + 1)}><ChevronRight /></Button></div> : null}
    </div>
  );
}

function RequestList({ title, items, count, type }: { title: string; items: any[]; count: number; type: "repair" | "amc" }) {
  return (
    <section>
      <h2 className="text-xl font-semibold">{title} ({count})</h2>
      {items.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No requests found.</p> : (
        <div className="mt-4 divide-y divide-border">
          {items.map((item) => {
            const asset = type === "amc" ? item.customer_assets : null;
            const name = type === "repair"
              ? [item.brand, item.model].filter(Boolean).join(" ") || item.customer_assets?.name || "Repair request"
              : [asset?.brand, asset?.model].filter(Boolean).join(" ") || asset?.name || "AMC request";
            const category = type === "repair" ? item.categories?.name : asset?.categories?.name;
            return (
              <Link key={item.id} to={type === "repair" ? "/request/$id" : "/amc/$id"} params={{ id: item.id }} className="flex flex-col gap-2 py-4 transition-colors hover:text-primary sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="font-medium">{name}</p><p className="text-sm text-muted-foreground">{category || "Uncategorised"} • {[item.city, item.state].filter(Boolean).join(", ") || "Location unavailable"} • {new Date(item.created_at).toLocaleDateString("en-IN")}</p></div>
                <Badge variant="secondary" className="w-fit capitalize">{item.status ?? "open"}</Badge>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
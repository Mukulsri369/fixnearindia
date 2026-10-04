import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CalendarClock, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyAmcs } from "@/lib/amc.functions";

const amcsQuery = () => queryOptions({ queryKey: ["my-amcs"], queryFn: () => getMyAmcs() });

export const Route = createFileRoute("/_authenticated/amcs")({
  head: () => ({ meta: [
    { title: "My AMC Contracts — FixNear India" },
    { name: "description", content: "Manage AMC requests and active asset service contracts." },
    { property: "og:title", content: "My AMC Contracts — FixNear India" },
    { property: "og:description", content: "Manage AMC requests and asset service coverage." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(amcsQuery()), component: AmcsPage,
});

function daysLeft(endsAt: string) { return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000)); }

function AmcsPage() {
  const { data: amcs } = useSuspenseQuery(amcsQuery());
  return <div className="px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">My AMC</h1><p className="mt-1 text-muted-foreground">Service coverage for your registered assets.</p></div><Button asChild><Link to="/new-amc"><Plus className="mr-2 h-4 w-4" /> Request AMC</Link></Button></div>
    {amcs.length === 0 ? <div className="rounded-lg border bg-card px-6 py-14 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">No AMC requests yet</h2><p className="mt-1 text-sm text-muted-foreground">Request annual maintenance coverage for one of your assets.</p><Button asChild className="mt-5"><Link to="/new-amc">Request AMC</Link></Button></div> :
      <div className="grid gap-4 sm:grid-cols-2">{amcs.map((amc: any) => { const contract = amc.amc_contracts?.[0]; return <Card key={amc.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{amc.customer_assets?.name ?? "Asset AMC"}</CardTitle><Badge variant={contract?.status === "active" ? "default" : "secondary"}>{contract?.status ?? amc.status}</Badge></div></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{[amc.customer_assets?.brand, amc.customer_assets?.model].filter(Boolean).join(" ")}</p>{contract ? <div className="flex items-center gap-2 text-sm"><CalendarClock className="h-4 w-4" /><strong>{daysLeft(contract.ends_at)} days left</strong><span className="text-muted-foreground">• ends {new Date(contract.ends_at).toLocaleDateString()}</span></div> : <p className="text-sm text-muted-foreground">Requested for {amc.requested_days} days</p>}<Button asChild size="sm" variant="outline"><Link to="/amc/$id" params={{ id: amc.id }}>View AMC</Link></Button></CardContent></Card>; })}</div>}
  </div></div>;
}
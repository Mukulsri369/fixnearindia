import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CalendarClock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AmcChat } from "@/components/AmcChat";
import { getTechnicianAmcs, postAmcMessage, submitAmcOffer } from "@/lib/amc.functions";

const query = () => queryOptions({ queryKey: ["technician-amcs"], queryFn: () => getTechnicianAmcs() });
export const Route = createFileRoute("/_authenticated/technician-amcs")({
  head: () => ({ meta: [
    { title: "AMC Requests — FixNear India" }, { name: "description", content: "Send AMC offers and manage active service contracts." },
    { property: "og:title", content: "AMC Requests — FixNear India" }, { property: "og:description", content: "Manage AMC opportunities and contracts." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), loader: ({ context }) => context.queryClient.ensureQueryData(query()), component: TechnicianAmcsPage,
});
function daysLeft(date: string) { return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)); }
function TechnicianAmcsPage() {
  const { data } = useSuspenseQuery(query()); const client = useQueryClient(); const offer = useServerFn(submitAmcOffer); const post = useServerFn(postAmcMessage);
  const [openId, setOpenId] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [form, setForm] = useState({ price: "", coverage: "", terms: "" });
  const submit = async (requestId: string) => { setBusy(true); try { await offer({ data: { requestId, price: Number(form.price), coverageDetails: form.coverage, terms: form.terms || undefined } }); toast.success("AMC offer sent"); setOpenId(null); setForm({ price: "", coverage: "", terms: "" }); await client.invalidateQueries({ queryKey: ["technician-amcs"] }); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not send offer"); } finally { setBusy(false); } };
  if (!data.isTechnician || !data.isApproved) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><h1 className="text-2xl font-bold">AMC requests unavailable</h1><p className="mt-2 text-muted-foreground">An approved technician account is required.</p></div>;
  return <div className="px-4 py-8 sm:px-6"><div className="mx-auto max-w-5xl"><h1 className="text-3xl font-bold">AMC requests</h1><p className="mt-1 text-muted-foreground">Offer coverage and manage contracted assets.</p>
    <h2 className="mt-8 text-xl font-semibold">Active & past AMC contracts</h2>{data.contracts.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No assigned AMC contracts yet.</p> : <div className="mt-4 grid gap-4 sm:grid-cols-2">{data.contracts.map((contract: any) => <Card key={contract.id}><CardHeader><div className="flex justify-between gap-3"><CardTitle>{contract.amc_requests?.customer_assets?.name ?? "AMC asset"}</CardTitle><Badge>{contract.status}</Badge></div></CardHeader><CardContent><p className="flex items-center gap-2 text-sm"><CalendarClock className="h-4 w-4" /> {daysLeft(contract.ends_at)} days left</p><p className="mt-2 text-sm text-muted-foreground">6-hour response SLA • ₹{Number(contract.price).toFixed(2)}</p><Button asChild className="mt-4" size="sm" variant="outline"><Link to="/amc/$id" params={{ id: contract.amc_request_id }}>Open AMC</Link></Button></CardContent></Card>)}</div>}
    <h2 className="mt-10 text-xl font-semibold">Open AMC opportunities</h2>{data.opportunities.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No matching AMC requests right now.</p> : <div className="mt-4 space-y-4">{data.opportunities.map((request: any) => { const mine = request.amc_offers?.find((item: any) => item.technician_id === data.technicianId); return <Card key={request.id}><CardHeader><div className="flex justify-between gap-3"><CardTitle>{request.customer_assets?.name ?? "AMC asset"}</CardTitle>{request.invited_technician_id ? <Badge>Direct invitation</Badge> : <Badge variant="secondary">Open</Badge>}</div></CardHeader><CardContent className="space-y-3"><p className="text-sm">{request.service_notes}</p><p className="text-sm text-muted-foreground">{request.customer_assets?.categories?.name} • {request.city} • {request.requested_days} days</p>{mine ? <p className="text-sm font-medium text-primary">Your offer: ₹{Number(mine.price).toFixed(2)}</p> : openId === request.id ? <div className="space-y-3 rounded-lg border p-4"><div><Label>AMC price (₹)</Label><Input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div><div><Label>Coverage details</Label><Textarea minLength={10} value={form.coverage} onChange={(event) => setForm({ ...form, coverage: event.target.value })} /></div><div><Label>Terms</Label><Textarea value={form.terms} onChange={(event) => setForm({ ...form, terms: event.target.value })} /></div><div className="flex gap-2"><Button size="sm" disabled={busy || !form.price || form.coverage.length < 10} onClick={() => submit(request.id)}>{busy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}Send offer</Button><Button size="sm" variant="outline" onClick={() => setOpenId(null)}>Cancel</Button></div></div> : <Button size="sm" onClick={() => setOpenId(request.id)}><ShieldCheck className="mr-2 h-4 w-4" /> Send AMC offer</Button>}<AmcChat requestId={request.id} canSend={Boolean(mine)} onSend={(body) => post({ data: { requestId: request.id, body } })} /></CardContent></Card>; })}</div>}
  </div></div>;
}
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getMyAssets } from "@/lib/assets.functions";
import { createAmcRequest } from "@/lib/amc.functions";
import { INDIA_STATES, citiesForState } from "@/lib/india-locations";

const assetsQuery = () => queryOptions({ queryKey: ["my-assets"], queryFn: () => getMyAssets() });
const searchSchema = z.object({ assetId: z.string().uuid().optional(), repairId: z.string().uuid().optional(), technicianId: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/new-amc")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({ meta: [
    { title: "Request AMC — FixNear India" }, { name: "description", content: "Request an AMC for a registered asset." },
    { property: "og:title", content: "Request AMC — FixNear India" }, { property: "og:description", content: "Request maintenance coverage for your asset." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), loader: ({ context }) => context.queryClient.ensureQueryData(assetsQuery()), component: NewAmcPage,
});

function NewAmcPage() {
  const search = Route.useSearch(); const navigate = useNavigate(); const { data: assets } = useSuspenseQuery(assetsQuery());
  const create = useServerFn(createAmcRequest); const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ assetId: search.assetId ?? "", requestedDays: "365", serviceNotes: "", address: "", state: "", city: "", pincode: "" });
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setBusy(true); try { const result = await create({ data: { assetId: form.assetId, requestedDays: Number(form.requestedDays) as 30 | 90 | 180 | 365, serviceNotes: form.serviceNotes, address: form.address || undefined, state: form.state || undefined, city: form.city, pincode: form.pincode, sourceRepairRequestId: search.repairId, invitedTechnicianId: search.technicianId } }); toast.success(result.existing ? "Opening the existing AMC" : search.technicianId ? "AMC invitation sent to your technician" : "AMC request created"); navigate({ to: "/amc/$id", params: { id: result.requestId } }); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create AMC request"); } finally { setBusy(false); } };
  return <div className="px-4 py-8 sm:px-6"><div className="mx-auto max-w-2xl"><Link to="/amcs" className="mb-6 inline-flex items-center text-sm text-muted-foreground"><ArrowLeft className="mr-1 h-4 w-4" /> My AMC</Link><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> {search.technicianId ? "Convert repair to AMC" : "Request AMC"}</CardTitle><p className="text-sm text-muted-foreground">{search.technicianId ? "This request goes only to the technician you already chose." : "Matching approved technicians can send coverage and price offers."}</p></CardHeader><CardContent>{assets.length === 0 ? <div className="py-8 text-center"><p>Add an asset before requesting AMC coverage.</p><Button asChild className="mt-4"><Link to="/assets">Add asset</Link></Button></div> : <form className="space-y-5" onSubmit={submit}>
    <div className="space-y-2"><Label>Asset</Label><Select required disabled={Boolean(search.assetId)} value={form.assetId} onValueChange={(assetId) => setForm({ ...form, assetId })}><SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger><SelectContent>{assets.map((asset) => <SelectItem key={asset.id} value={asset.id}>{asset.name} — {[asset.brand, asset.model].filter(Boolean).join(" ")}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-2"><Label>Contract term</Label><Select value={form.requestedDays} onValueChange={(requestedDays) => setForm({ ...form, requestedDays })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30">30 days</SelectItem><SelectItem value="90">90 days</SelectItem><SelectItem value="180">180 days</SelectItem><SelectItem value="365">365 days</SelectItem></SelectContent></Select></div>
    <div className="space-y-2"><Label htmlFor="coverage">Maintenance needs</Label><Textarea id="coverage" required minLength={10} rows={4} placeholder="Describe the preventive maintenance and support you expect." value={form.serviceNotes} onChange={(event) => setForm({ ...form, serviceNotes: event.target.value })} /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>State</Label><Select required value={form.state} onValueChange={(state) => setForm({ ...form, state, city: "" })}><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger><SelectContent>{INDIA_STATES.map((state) => <SelectItem key={state} value={state}>{state}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>City</Label><Select required value={form.city} onValueChange={(city) => setForm({ ...form, city })}><SelectTrigger disabled={!form.state}><SelectValue placeholder="Select city" /></SelectTrigger><SelectContent>{citiesForState(form.state).map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}</SelectContent></Select></div></div>
    <div className="space-y-2"><Label htmlFor="pincode">Pincode</Label><Input id="pincode" required minLength={6} maxLength={10} value={form.pincode} onChange={(event) => setForm({ ...form, pincode: event.target.value })} /></div>
    <div className="space-y-2"><Label htmlFor="address">Service address</Label><Textarea id="address" rows={3} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></div>
    <Button className="w-full" disabled={busy || !form.assetId}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{search.technicianId ? "Send AMC invitation" : "Create AMC request"}</Button>
  </form>}</CardContent></Card></div></div>;
}
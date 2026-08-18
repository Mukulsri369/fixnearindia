import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { expressInterest, getAvailableRequests } from "@/lib/marketplace.functions";

const ALL = "__all__";

const availableQueryOptions = (state?: string | null, city?: string | null) =>
  queryOptions({
    queryKey: ["available-requests", state ?? null, city ?? null],
    queryFn: () => getAvailableRequests({ data: { state: state ?? null, city: city ?? null } }),
  });

export const Route = createFileRoute("/_authenticated/available-jobs")({
  head: () => ({
    meta: [
      { title: "Nearby Repair Jobs — FixNear India" },
      { name: "description", content: "Browse open repair requests near you in your service categories." },
      { property: "og:title", content: "Nearby Repair Jobs — FixNear India" },
      { property: "og:description", content: "Browse open repair requests near you in your service categories." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(availableQueryOptions(null, null)),
  component: AvailableJobsPage,
});

function AvailableJobsPage() {
  const [state, setState] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const { data } = useSuspenseQuery(availableQueryOptions(state, city));
  const queryClient = useQueryClient();
  const doInterest = useServerFn(expressInterest);
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (requestId: string) => {
    setSubmitting(true);
    try {
      await doInterest({ data: { requestId, message } });
      toast.success("Your offer was sent to the customer");
      setOpenId(null);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["available-requests"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to send offer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Nearby repair jobs</h1>
          <p className="mt-1 text-muted-foreground">
            Open requests in your service categories. Send the customer your repair details to get picked.
          </p>
        </div>

        {data.isTechnician && data.isApproved && (
          <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
            <div className="min-w-40 flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">State</label>
              <Select
                value={state ?? ALL}
                onValueChange={(v) => {
                  setState(v === ALL ? null : v);
                  setCity(null);
                }}
              >
                <SelectTrigger><SelectValue placeholder="All states" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All states</SelectItem>
                  {(data.states ?? []).map((s: string) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-40 flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">City</label>
              <Select value={city ?? ALL} onValueChange={(v) => setCity(v === ALL ? null : v)}>
                <SelectTrigger><SelectValue placeholder="All cities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All cities</SelectItem>
                  {(data.cities ?? []).map((c: string) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(state || city) && (
              <Button variant="ghost" onClick={() => { setState(null); setCity(null); }}>
                Clear
              </Button>
            )}
          </div>
        )}

        {!data.isTechnician ? (
          <EmptyState
            title="You're not registered as a technician"
            description="Register your repair business to start receiving jobs."
            action={<Button asChild className="mt-6"><Link to="/register-technician">Register as a technician</Link></Button>}
          />
        ) : !data.isApproved ? (
          <EmptyState
            title="Approval pending"
            description="Your technician application is waiting for admin approval. You'll see jobs here once approved."
          />
        ) : data.requests.length === 0 ? (
          <EmptyState
            title="No open jobs in this location"
            description="Try a different state or city — new requests in your categories will show up here."
          />
        ) : (
          <div className="space-y-4">
            {data.requests.map((req: any) => (
              <Card key={req.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        {req.brand || "Device"} {req.model}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {req.categories?.name} • {req.city} • {req.pincode}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {req.isNearby && <Badge>Near you</Badge>}
                      <Badge variant="outline">{req.priority}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{req.issue_description}</p>
                  <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {req.address || "Address shared after assignment"}
                  </p>

                  {req.alreadyInterested ? (
                    <p className="mt-4 text-sm font-medium text-primary">
                      You've already responded — waiting for the customer to choose.
                    </p>
                  ) : openId === req.id ? (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        rows={4}
                        placeholder="Describe how you'll repair this, your estimated cost and when you can visit."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" disabled={submitting || message.trim().length < 5} onClick={() => handleSubmit(req.id)}>
                          {submitting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="mr-2 h-3 w-3" />}
                          Send offer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setOpenId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setOpenId(req.id);
                        setMessage("");
                      }}
                    >
                      I'm interested
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-12 text-center"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action}
    </motion.div>
  );
}

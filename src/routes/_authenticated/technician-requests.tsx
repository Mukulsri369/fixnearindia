import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getTechnicianAssignments } from "@/lib/repairs.functions";
import { completeJobWithInvoice, postRequestMessage, startJob } from "@/lib/marketplace.functions";
import { RequestChat } from "@/components/RequestChat";

const assignmentsQueryOptions = () =>
  queryOptions({
    queryKey: ["technician-assignments"],
    queryFn: () => getTechnicianAssignments(),
  });

export const Route = createFileRoute("/_authenticated/technician-requests")({
  head: () => ({
    meta: [
      { title: "My Jobs — FixNear India" },
      { name: "description", content: "Manage your assigned repair jobs, log repair details and raise invoices." },
      { property: "og:title", content: "My Jobs — FixNear India" },
      { property: "og:description", content: "Manage your assigned repair jobs and raise invoices on FixNear India." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(assignmentsQueryOptions()),
  component: TechnicianRequestsPage,
});

function TechnicianRequestsPage() {
  const { data } = useSuspenseQuery(assignmentsQueryOptions());
  const queryClient = useQueryClient();
  const doStart = useServerFn(startJob);
  const doComplete = useServerFn(completeJobWithInvoice);
  const doPost = useServerFn(postRequestMessage);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [formFor, setFormFor] = useState<string | null>(null);
  const [form, setForm] = useState({ repairNotes: "", partsReplaced: "", amount: "" });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["technician-assignments"] });

  const handleStart = async (assignmentId: string) => {
    setBusyId(assignmentId);
    try {
      await doStart({ data: { assignmentId } });
      toast.success("Job started");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to start job");
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = async (assignmentId: string) => {
    const amount = Number(form.amount);
    if (form.repairNotes.trim().length < 10) return toast.error("Describe the repair work (min 10 characters)");
    if (!Number.isFinite(amount) || amount < 0) return toast.error("Enter a valid amount");

    setBusyId(assignmentId);
    try {
      await doComplete({
        data: {
          assignmentId,
          repairNotes: form.repairNotes,
          partsReplaced: form.partsReplaced || undefined,
          amount,
        },
      });
      toast.success("Repair completed — invoice sent to the customer");
      setFormFor(null);
      setForm({ repairNotes: "", partsReplaced: "", amount: "" });
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete job");
    } finally {
      setBusyId(null);
    }
  };

  const assignments: any[] = data.assignments;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My jobs</h1>
            <p className="mt-1 text-muted-foreground">Your offers, active repairs and invoices.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/available-jobs">Find nearby jobs</Link>
          </Button>
        </div>

        {!data.isTechnician ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-12 text-center"
          >
            <h2 className="text-lg font-semibold">You're not registered as a technician</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Register your repair business to start receiving jobs.
            </p>
            <Button asChild className="mt-6">
              <Link to="/register-technician">Register as a technician</Link>
            </Button>
          </motion.div>
        ) : assignments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-12 text-center"
          >
            <h2 className="text-lg font-semibold">No jobs yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse nearby requests and send the customer your repair offer.
            </p>
            <Button asChild className="mt-6">
              <Link to="/available-jobs">Find nearby jobs</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const req = assignment.repair_requests;
              const isActive = assignment.status === "accepted" || assignment.status === "in_progress";
              return (
                <Card key={assignment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">
                          {req?.brand || "Device"} {req?.model}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {req?.categories?.name} • {req?.city} • {req?.pincode}
                        </p>
                      </div>
                      <Badge variant={assignment.status === "completed" ? "outline" : isActive ? "default" : "secondary"}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{req?.issue_description}</p>
                    {isActive && (
                      <>
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" /> {req?.address || "Address not provided"}
                        </p>
                        {req?.profiles?.phone && (
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4" /> {req.profiles.full_name} • {req.profiles.phone}
                          </p>
                        )}
                      </>
                    )}

                    {assignment.status === "completed" && (
                      <div className="space-y-3 rounded-lg border p-3 text-sm">
                        <div>
                          <p className="font-medium">Invoice raised: ₹{Number(assignment.amount ?? 0).toFixed(2)}</p>
                          <p className="mt-1 text-muted-foreground">{assignment.repair_notes}</p>
                        </div>
                        {req?.id && (
                          <Button asChild size="sm" variant="outline">
                            <Link to="/bill/$id" params={{ id: req.id }}>
                              <FileText className="mr-2 h-4 w-4" /> Create GST bill
                            </Link>
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {assignment.status === "accepted" && (
                        <Button size="sm" disabled={busyId === assignment.id} onClick={() => handleStart(assignment.id)}>
                          {busyId === assignment.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                          Start repair
                        </Button>
                      )}
                      {isActive && formFor !== assignment.id && (
                        <Button size="sm" variant="outline" onClick={() => setFormFor(assignment.id)}>
                          Complete & raise invoice
                        </Button>
                      )}
                    </div>

                    {formFor === assignment.id && (
                      <div className="space-y-3 rounded-lg border p-4">
                        <div>
                          <Label htmlFor={`notes-${assignment.id}`}>What did you repair? *</Label>
                          <Textarea
                            id={`notes-${assignment.id}`}
                            rows={3}
                            value={form.repairNotes}
                            onChange={(e) => setForm((f) => ({ ...f, repairNotes: e.target.value }))}
                            placeholder="Describe the diagnosis and the work carried out"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`parts-${assignment.id}`}>Parts replaced</Label>
                          <Textarea
                            id={`parts-${assignment.id}`}
                            rows={2}
                            value={form.partsReplaced}
                            onChange={(e) => setForm((f) => ({ ...f, partsReplaced: e.target.value }))}
                            placeholder="e.g. Compressor relay, 2m copper pipe"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`amount-${assignment.id}`}>Total amount (₹) *</Label>
                          <Input
                            id={`amount-${assignment.id}`}
                            type="number"
                            min={0}
                            step="0.01"
                            value={form.amount}
                            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" disabled={busyId === assignment.id} onClick={() => handleComplete(assignment.id)}>
                            {busyId === assignment.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                            Complete repair
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setFormFor(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {req?.id && (
                      <RequestChat
                        requestId={req.id}
                        onSend={(body) => doPost({ data: { requestId: req.id, body } })}
                        title="Chat with customer"
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

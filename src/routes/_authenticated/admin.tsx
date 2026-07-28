import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminTechnicians, setTechnicianApproval } from "@/lib/marketplace.functions";

const adminQueryOptions = () =>
  queryOptions({
    queryKey: ["admin-technicians"],
    queryFn: () => getAdminTechnicians(),
    retry: false,
  });

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Technician Approvals — FixNear India" },
      { name: "description", content: "Review and approve technician applications on FixNear India." },
      { property: "og:title", content: "Technician Approvals — FixNear India" },
      { property: "og:description", content: "Review and approve technician applications on FixNear India." },
    ],
  }),
  component: AdminPage,
  errorComponent: () => (
    <div className="px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Admin access required</h1>
      <p className="mt-2 text-muted-foreground">This page is only available to platform admins.</p>
    </div>
  ),
});

function AdminPage() {
  const { data: technicians } = useSuspenseQuery(adminQueryOptions());
  const queryClient = useQueryClient();
  const doApprove = useServerFn(setTechnicianApproval);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handle = async (technicianId: string, approve: boolean) => {
    setBusyId(technicianId);
    try {
      await doApprove({ data: { technicianId, approve } });
      toast.success(approve ? "Technician approved" : "Technician approval revoked");
      queryClient.invalidateQueries({ queryKey: ["admin-technicians"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update technician");
    } finally {
      setBusyId(null);
    }
  };

  const pending = technicians.filter((t: any) => !t.is_approved);
  const approved = technicians.filter((t: any) => t.is_approved);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Technician approvals</h1>
          <p className="mt-1 text-muted-foreground">
            Review applications. Approved technicians can see and bid on nearby repair requests.
          </p>
        </div>

        <Section title={`Pending approval (${pending.length})`}>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending applications.</p>
          ) : (
            pending.map((tech: any) => (
              <TechCard key={tech.id} tech={tech} busy={busyId === tech.id} onApprove={() => handle(tech.id, true)} />
            ))
          )}
        </Section>

        <Section title={`Approved (${approved.length})`}>
          {approved.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved technicians yet.</p>
          ) : (
            approved.map((tech: any) => (
              <TechCard key={tech.id} tech={tech} busy={busyId === tech.id} onRevoke={() => handle(tech.id, false)} />
            ))
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10 space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </motion.section>
  );
}

function TechCard({
  tech,
  busy,
  onApprove,
  onRevoke,
}: {
  tech: any;
  busy: boolean;
  onApprove?: () => void;
  onRevoke?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{tech.profiles?.full_name ?? "Unnamed technician"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {tech.business_name ? `${tech.business_name} • ` : ""}
              {tech.city} • {tech.pincode} • {tech.experience_years} yrs experience
            </p>
          </div>
          <Badge variant={tech.is_approved ? "default" : "secondary"}>
            {tech.is_approved ? "approved" : "pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Phone: {tech.profiles?.phone ?? "—"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(tech.technician_categories ?? []).map((tc: any, i: number) => (
            <Badge key={i} variant="outline">
              {tc.categories?.name}
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          {onApprove && (
            <Button size="sm" disabled={busy} onClick={onApprove}>
              {busy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Check className="mr-2 h-3 w-3" />}
              Approve
            </Button>
          )}
          {onRevoke && (
            <Button size="sm" variant="outline" disabled={busy} onClick={onRevoke}>
              {busy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <X className="mr-2 h-3 w-3" />}
              Revoke approval
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

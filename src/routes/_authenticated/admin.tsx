import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, ShieldCheck, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  getCatalogRequests,
  getOnboardingApplications,
  getTechnicianDocumentUrl,
  setCatalogRequestStatus,
  setOnboardingStatus,
} from "@/lib/onboarding.functions";
import { grantAdminByEmail, listAdmins, revokeAdmin } from "@/lib/admin-users.functions";
import { ONBOARDING_STATUS_LABELS, SEGMENTS } from "@/lib/technician-catalog";

const applicationsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin-onboarding"],
    queryFn: () => getOnboardingApplications(),
    retry: false,
  });

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Technician Verification — FixNear India" },
      { name: "description", content: "Review, verify and manage technician onboarding applications on FixNear India." },
      { property: "og:title", content: "Technician Verification — FixNear India" },
      { property: "og:description", content: "Review and verify technician onboarding applications on FixNear India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
  errorComponent: () => (
    <div className="px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Admin access required</h1>
      <p className="mt-2 text-muted-foreground">This page is only available to platform admins.</p>
    </div>
  ),
  notFoundComponent: () => <div className="px-4 py-20 text-center">Page not found</div>,
});

const STATUS_FILTERS = [
  "all",
  "submitted",
  "under_review",
  "verification_required",
  "verified",
  "active",
  "suspended",
  "rejected",
] as const;

function AdminPage() {
  const { data, isLoading, error } = useQuery(applicationsQueryOptions());
  const applications = data ?? [];
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const isForbidden = !!error && /admin access required/i.test(String((error as Error).message ?? ""));

  if (isLoading) {
    return (
      <div className="flex justify-center px-4 py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">This page is only available to platform admins.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Couldn't load applications</h1>
        <p className="mt-2 text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  const filtered = useMemo(
    () => (filter === "all" ? applications : applications.filter((a: any) => a.onboarding_status === filter)),
    [applications, filter],
  );

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Technician verification</h1>
          <p className="mt-1 text-muted-foreground">
            Review onboarding applications, verify documents and manage technician status.
          </p>
        </div>

        <Tabs defaultValue="applications">
          <TabsList>
            <TabsTrigger value="applications">Applications ({applications.length})</TabsTrigger>
            <TabsTrigger value="catalog">Catalog requests</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="mt-6 space-y-4">
            <div className="w-56">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === "all" ? "All statuses" : (ONBOARDING_STATUS_LABELS[s] ?? s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications in this status.</p>
            ) : (
              filtered.map((application: any) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onChanged={() => queryClient.invalidateQueries({ queryKey: ["admin-onboarding"] })}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="catalog" className="mt-6">
            <CatalogRequests />
          </TabsContent>

          <TabsContent value="admins" className="mt-6">
            <AdminsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ApplicationCard({ application, onChanged }: { application: any; onChanged: () => void }) {
  const doStatus = useServerFn(setOnboardingStatus);
  const doDocUrl = useServerFn(getTechnicianDocumentUrl);
  const [notes, setNotes] = useState<string>(application.review_notes ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const capabilities = application.technician_capabilities ?? [];
  const equipment = capabilities.filter((c: any) => c.equipment);
  const skills = capabilities.filter((c: any) => c.skill);
  const brands = capabilities.filter((c: any) => c.brand);
  const services = capabilities.filter((c: any) => c.service);

  const act = async (status: string) => {
    setBusy(status);
    try {
      await doStatus({ data: { technicianId: application.id, status: status as any, notes: notes || null } });
      toast.success(`Marked as ${ONBOARDING_STATUS_LABELS[status] ?? status}`);
      onChanged();
    } catch (err: any) {
      toast.error(err.message || "Could not update application");
    } finally {
      setBusy(null);
    }
  };

  const openDoc = async (path: string) => {
    try {
      const { url } = await doDocUrl({ data: { path } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(err.message || "Could not open document");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">
                {application.display_name || application.profiles?.full_name || "Unnamed technician"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {application.technician_type ? `${application.technician_type} • ` : ""}
                {application.city}
                {application.state ? `, ${application.state}` : ""} • {application.experience_years ?? 0} yrs
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {application.contact_phone ?? application.profiles?.phone ?? "—"} • {application.contact_email ?? "—"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={application.is_approved ? "default" : "secondary"}>
                {ONBOARDING_STATUS_LABELS[application.onboarding_status] ?? application.onboarding_status}
              </Badge>
              <span className="text-xs text-muted-foreground">{application.completion_percent ?? 0}% complete</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {(application.segments ?? []).map((segment: string) => (
              <Badge key={segment} variant="outline">
                {SEGMENTS.find((s) => s.id === segment)?.label ?? segment}
              </Badge>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Hide details" : "View full application"}
          </Button>

          {expanded && (
            <div className="space-y-4 rounded-xl border border-border p-4 text-sm">
              <Detail label="Headline" value={application.headline} />
              <Detail label="Service modes" value={(application.service_modes ?? []).join(", ")} />
              <Detail
                label="Service areas"
                value={(application.technician_service_areas ?? [])
                  .map((a: any) => `${a.city}, ${a.state}${a.pan_india ? " (pan-India)" : ""}`)
                  .join(" • ")}
              />
              <Detail label="Equipment" value={equipment.map((e: any) => e.equipment).join(", ")} />
              <Detail label="Skills" value={skills.map((s: any) => s.skill).join(", ")} />
              <Detail label="Brands" value={brands.map((b: any) => b.brand).join(", ")} />
              <Detail label="Services" value={services.map((s: any) => s.service).join(", ")} />
              <Detail
                label="Qualifications"
                value={(application.technician_qualifications ?? [])
                  .map((q: any) => [q.qualification, q.institute, q.year].filter(Boolean).join(" — "))
                  .join(" • ")}
              />
              <Detail
                label="Certifications"
                value={(application.technician_certifications ?? [])
                  .map((c: any) => `${c.name}${c.issuing_organization ? ` (${c.issuing_organization})` : ""}`)
                  .join(" • ")}
              />
              <Detail label="Availability" value={(application.availability?.days ?? []).join(", ")} />
              <Detail label="Pricing" value={application.pricing?.model} />
              <Detail label="Business type" value={application.business?.businessType} />
              <Detail label="GST" value={application.business?.gstNumber} />

              <div>
                <p className="font-medium">Documents</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(application.technician_documents ?? []).length === 0 ? (
                    <span className="text-muted-foreground">No documents uploaded</span>
                  ) : (
                    application.technician_documents.map((doc: any) => (
                      <Button key={doc.id} size="sm" variant="outline" onClick={() => openDoc(doc.file_path)}>
                        <FileText className="mr-2 h-3.5 w-3.5" />
                        {doc.document_type}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          <Textarea
            rows={2}
            placeholder="Review notes (shared with the technician when requesting changes or rejecting)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {[
              { status: "under_review", label: "Mark under review", variant: "outline" as const },
              { status: "verification_required", label: "Request changes", variant: "outline" as const },
              { status: "active", label: "Approve & activate", variant: "default" as const },
              { status: "suspended", label: "Suspend", variant: "outline" as const },
              { status: "rejected", label: "Reject", variant: "outline" as const },
              { status: "inactive", label: "Deactivate", variant: "ghost" as const },
            ].map((action) => (
              <Button
                key={action.status}
                size="sm"
                variant={action.variant}
                disabled={!!busy}
                onClick={() => act(action.status)}
              >
                {busy === action.status ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{value || "—"}</p>
    </div>
  );
}

function CatalogRequests() {
  const load = useServerFn(getCatalogRequests);
  const update = useServerFn(setCatalogRequestStatus);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-catalog-requests"], queryFn: () => load(), retry: false });
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (requestId: string, status: "approved" | "rejected") => {
    setBusy(requestId);
    try {
      await update({ data: { requestId, status } });
      toast.success(`Request ${status}`);
      queryClient.invalidateQueries({ queryKey: ["admin-catalog-requests"] });
    } catch (err: any) {
      toast.error(err.message || "Could not update request");
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground">No catalog requests.</p>;

  return (
    <div className="space-y-3">
      {data.map((request: any) => (
        <Card key={request.id}>
          <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
            <div>
              <p className="font-medium">
                {request.name} <Badge variant="outline">{request.kind}</Badge>
              </p>
              <p className="text-sm text-muted-foreground">{request.description || "No details provided"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={request.status === "approved" ? "default" : "secondary"}>{request.status}</Badge>
              <Button size="sm" disabled={busy === request.id} onClick={() => act(request.id, "approved")}>
                Approve
              </Button>
              <Button size="sm" variant="outline" disabled={busy === request.id} onClick={() => act(request.id, "rejected")}>
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminsSection() {
  const load = useServerFn(listAdmins);
  const grant = useServerFn(grantAdminByEmail);
  const revoke = useServerFn(revokeAdmin);
  const queryClient = useQueryClient();
  const { data: admins, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: () => load(), retry: false });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const add = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await grant({ data: { email: trimmed } });
      toast.success(`${trimmed} is now an admin`);
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: any) {
      toast.error(err.message || "Could not grant admin");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (userId: string, adminEmail: string) => {
    if (!window.confirm(`Remove admin access for ${adminEmail}?`)) return;
    setRevoking(userId);
    try {
      await revoke({ data: { userId } });
      toast.success(`Admin access removed for ${adminEmail}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err: any) {
      toast.error(err.message || "Could not revoke admin");
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5" /> Add an admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              placeholder="their-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <Button onClick={add} disabled={busy || !email.trim()}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Make admin
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            The person must already have a FixNear account. Admins can review technician applications, manage catalog
            requests and add other admins.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" /> Current admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : !admins || admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admins found.</p>
          ) : (
            <div className="divide-y divide-border">
              {admins.map((admin: any) => (
                <div key={admin.userId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="text-sm font-medium">
                      {admin.fullName || "Unnamed user"}
                      {admin.isSelf && (
                        <Badge variant="secondary" className="ml-2">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {admin.email} • admin since {new Date(admin.since).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  {!admin.isSelf && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={revoking === admin.userId}
                      onClick={() => remove(admin.userId, admin.email)}
                    >
                      {revoking === admin.userId ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UserMinus className="mr-2 h-3.5 w-3.5" />
                      )}
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

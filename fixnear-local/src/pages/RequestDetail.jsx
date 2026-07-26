import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "../hooks/useAuth.jsx";
import { getRepairRequest, requestAssignment } from "../services/repairs.js";
import { findMatchingTechnicians } from "../services/technicians.js";
import TechnicianCard from "../components/TechnicianCard.jsx";
import { Badge, Button, Card, EmptyState, Spinner } from "../components/ui.jsx";
import { formatDateTime, statusTone, STATUS_LABELS } from "../lib/utils.js";

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: request, isLoading, error } = useQuery({
    queryKey: ["request", id],
    queryFn: () => getRepairRequest(id),
  });

  const isOwner = request?.customer_id === user?.id;

  const matches = useQuery({
    queryKey: ["matches", id],
    queryFn: () => findMatchingTechnicians(request),
    enabled: false,
  });

  const invite = useMutation({
    mutationFn: (technicianId) => requestAssignment(id, technicianId),
    onSuccess: () => {
      toast.success("Technician invited");
      queryClient.invalidateQueries({ queryKey: ["request", id] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <p className="mx-auto max-w-3xl px-4 py-16 text-destructive">{error.message}</p>;
  }

  const invitedIds = (request.request_assignments ?? [])
    .filter((a) => a.status !== "rejected")
    .map((a) => a.technicians?.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {request.categories?.name}
            {request.brand ? ` · ${request.brand}` : ""} {request.model ?? ""}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Created {formatDateTime(request.created_at)}
          </p>
        </div>
        <Badge className={statusTone(request.status)}>
          {STATUS_LABELS[request.status] ?? request.status}
        </Badge>
      </div>

      <Card className="mt-8">
        <h2 className="font-semibold">Issue</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {request.issue_description}
        </p>

        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <Field label="Priority" value={request.priority} />
          <Field label="Preferred visit" value={request.preferred_visit_time} />
          <Field
            label="Location"
            value={[request.address, request.city, request.state, request.pincode]
              .filter(Boolean)
              .join(", ")}
          />
          <Field label="Last update" value={formatDateTime(request.updated_at)} />
        </dl>

        {(request.repair_request_images ?? []).length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {request.repair_request_images.map((image) => (
              <a key={image.id} href={image.url} target="_blank" rel="noreferrer">
                <img
                  src={image.url}
                  alt="Repair reference"
                  loading="lazy"
                  className="h-20 w-full rounded-lg object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </Card>

      <h2 className="mt-12 text-xl font-semibold">Technicians on this request</h2>
      {(request.request_assignments ?? []).length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No technician invited yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {request.request_assignments.map((assignment) => (
            <Card key={assignment.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {assignment.technicians?.profiles?.full_name ??
                      assignment.technicians?.business_name ??
                      "Technician"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {assignment.technicians?.city} ·{" "}
                    {assignment.technicians?.experience_years ?? 0} yrs experience
                    {assignment.status === "accepted" && assignment.technicians?.profiles?.phone
                      ? ` · ${assignment.technicians.profiles.phone}`
                      : ""}
                  </p>
                </div>
                <Badge className={statusTone(assignment.status)}>
                  {STATUS_LABELS[assignment.status] ?? assignment.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isOwner && request.status === "open" && (
        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Find matching technicians</h2>
            <Button onClick={() => matches.refetch()} disabled={matches.isFetching}>
              {matches.isFetching ? "Searching…" : "Find technicians near me"}
            </Button>
          </div>

          {matches.isError && (
            <p className="mt-4 text-sm text-destructive">{matches.error.message}</p>
          )}

          {matches.data && (
            <div className="mt-6 space-y-3">
              {matches.data.length === 0 ? (
                <EmptyState
                  title="No technicians available yet"
                  description="No approved technician covers this category in your area right now. We'll keep your request open."
                />
              ) : (
                matches.data.map((technician) => (
                  <TechnicianCard
                    key={technician.id}
                    technician={technician}
                    invited={invitedIds.includes(technician.id)}
                    isInviting={invite.isPending && invite.variables === technician.id}
                    onInvite={invite.mutate}
                  />
                ))
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value || "—"}</dd>
    </div>
  );
}

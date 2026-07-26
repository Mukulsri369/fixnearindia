import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "../hooks/useAuth.jsx";
import { listTechnicianAssignments, updateAssignmentStatus } from "../services/repairs.js";
import { setAvailability } from "../services/technicians.js";
import { Badge, Button, Card, EmptyState, Spinner } from "../components/ui.jsx";
import { formatDateTime, statusTone, STATUS_LABELS } from "../lib/utils.js";

export default function TechnicianRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["tech-assignments", user?.id],
    queryFn: () => listTechnicianAssignments(user.id),
    enabled: !!user?.id,
  });

  const update = useMutation({
    mutationFn: ({ assignmentId, status }) => updateAssignmentStatus(assignmentId, status),
    onSuccess: () => {
      toast.success("Job updated");
      queryClient.invalidateQueries({ queryKey: ["tech-assignments"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const availability = useMutation({
    mutationFn: ({ technicianId, isAvailable }) => setAvailability(technicianId, isAvailable),
    onSuccess: () => {
      toast.success("Availability updated");
      queryClient.invalidateQueries({ queryKey: ["tech-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["technician"] });
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
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          title="Technician account required"
          description={error.message}
          action={
            <Button as={Link} to="/register-technician">
              Register as technician
            </Button>
          }
        />
      </div>
    );
  }

  const { technician, assignments } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">My jobs</h1>
      <p className="mt-2 text-muted-foreground">
        Accept, decline and complete the repair requests sent to you.
      </p>

      <Card className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold">
              {technician.business_name ?? "Technician profile"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {technician.city} · {technician.service_radius_km} km radius ·{" "}
              {technician.is_approved ? "Approved" : "Pending approval"}
            </p>
          </div>
          <Button
            variant={technician.is_available ? "outline" : "success"}
            onClick={() =>
              availability.mutate({
                technicianId: technician.id,
                isAvailable: !technician.is_available,
              })
            }
            disabled={availability.isPending}
          >
            {technician.is_available ? "Go offline" : "Go online"}
          </Button>
        </div>
      </Card>

      {assignments.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No jobs yet"
            description="Customers in your city and category will appear here once they invite you."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {assignments.map((assignment) => {
            const request = assignment.repair_requests;
            return (
              <Card key={assignment.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      {request?.categories?.name}
                      {request?.brand ? ` · ${request.brand}` : ""} {request?.model ?? ""}
                    </h3>
                    <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                      {request?.issue_description}
                    </p>
                  </div>
                  <Badge className={statusTone(assignment.status)}>
                    {STATUS_LABELS[assignment.status] ?? assignment.status}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    {request?.city}
                    {request?.pincode ? ` — ${request.pincode}` : ""}
                  </span>
                  <span>Priority: {request?.priority}</span>
                  <span>Preferred: {request?.preferred_visit_time || "Flexible"}</span>
                  <span>Received {formatDateTime(assignment.created_at)}</span>
                </div>

                {assignment.status === "accepted" && request?.address && (
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">Address: </span>
                    {request.address}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  {assignment.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          update.mutate({ assignmentId: assignment.id, status: "accepted" })
                        }
                        disabled={update.isPending}
                      >
                        Accept job
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          update.mutate({ assignmentId: assignment.id, status: "rejected" })
                        }
                        disabled={update.isPending}
                      >
                        Decline
                      </Button>
                    </>
                  )}
                  {assignment.status === "accepted" && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() =>
                        update.mutate({ assignmentId: assignment.id, status: "completed" })
                      }
                      disabled={update.isPending}
                    >
                      Mark completed
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

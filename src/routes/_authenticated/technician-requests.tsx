import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getTechnicianAssignments, updateAssignmentStatus } from "@/lib/repairs.functions";

const assignmentsQueryOptions = () =>
  queryOptions({
    queryKey: ["technician-assignments"],
    queryFn: () => getTechnicianAssignments(),
  });

export const Route = createFileRoute("/_authenticated/technician-requests")({
  head: () => ({
    meta: [
      { title: "My Assignments — FixNear India" },
      { name: "description", content: "Manage your repair assignments on FixNear India." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(assignmentsQueryOptions()),
  component: TechnicianRequestsPage,
});

function TechnicianRequestsPage() {
  const { data } = useSuspenseQuery(assignmentsQueryOptions());
  const isTechnician = data.isTechnician;
  const assignments: any[] = data.assignments;

  const queryClient = useQueryClient();
  const doUpdate = useServerFn(updateAssignmentStatus);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdate = async (assignmentId: string, status: "accepted" | "rejected" | "completed") => {
    setUpdatingId(assignmentId);
    try {
      await doUpdate({ data: { assignmentId, status } });
      toast.success(`Assignment ${status}`);
      queryClient.invalidateQueries({ queryKey: ["technician-assignments"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update assignment");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Assignments</h1>
          <p className="mt-1 text-muted-foreground">Review and manage your repair jobs.</p>
        </div>

        {assignments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-12 text-center"
          >
            <h2 className="text-lg font-semibold">No assignments yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              New assignments will appear here when customers request your services.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const req = assignment.repair_requests;
              return (
                <Card key={assignment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">
                          {req?.brand} {req?.model}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {req?.categories?.name} • {req?.city} • {req?.pincode}
                        </p>
                      </div>
                      <Badge variant={assignment.status === "pending" ? "secondary" : assignment.status === "accepted" ? "default" : "outline"}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm">{req?.issue_description}</p>
                    <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {req?.address || "Address not provided"}
                    </p>
                    <div className="mt-4 flex gap-2">
                      {assignment.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(assignment.id, "accepted")}
                            disabled={updatingId === assignment.id}
                          >
                            {updatingId === assignment.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Check className="mr-2 h-3 w-3" />}
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdate(assignment.id, "rejected")}
                            disabled={updatingId === assignment.id}
                          >
                            <X className="mr-2 h-3 w-3" /> Reject
                          </Button>
                        </>
                      )}
                      {assignment.status === "accepted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdate(assignment.id, "completed")}
                          disabled={updatingId === assignment.id}
                        >
                          {updatingId === assignment.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : "Mark Completed"}
                        </Button>
                      )}
                    </div>
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

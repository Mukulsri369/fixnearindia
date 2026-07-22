import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMyRepairRequests } from "@/lib/repairs.functions";

const myRequestsQueryOptions = () =>
  queryOptions({
    queryKey: ["my-repair-requests"],
    queryFn: () => getMyRepairRequests(),
  });

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({
    meta: [
      { title: "My Repair Requests — FixNear India" },
      { name: "description", content: "View and manage your repair requests on FixNear India." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myRequestsQueryOptions()),
  component: RequestsPage,
});

function RequestsPage() {
  const { data: requests } = useSuspenseQuery(myRequestsQueryOptions());

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Repair Requests</h1>
            <p className="mt-1 text-muted-foreground">Track and manage your repair jobs.</p>
          </div>
          <Link to="/new-request">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Button>
          </Link>
        </div>

        {requests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-12 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wrench className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">No repair requests yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first request and get matched with nearby technicians.
            </p>
            <Link to="/new-request" className="mt-4 inline-block">
              <Button>Create Request</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        {request.brand} {request.model}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {request.categories?.name} • {request.city} • {request.pincode}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={statusVariant(request.status ?? "open")}>{request.status}</Badge>
                      <Badge variant={priorityVariant(request.priority ?? "medium")}>{request.priority}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm">{request.issue_description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {request.request_assignments && request.request_assignments.length > 0 ? (
                        <span>
                          Assignment: {request.request_assignments[0].status} with{" "}
                          {request.request_assignments[0].technicians?.profiles?.full_name}
                        </span>
                      ) : (
                        <span>No technician assigned yet</span>
                      )}
                    </p>
                    <Link to="/request/$id" params={{ id: request.id }}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function statusVariant(status: string) {
  switch (status) {
    case "open":
      return "secondary";
    case "assigned":
      return "default";
    case "completed":
      return "outline";
    default:
      return "secondary";
  }
}

function priorityVariant(priority: string) {
  switch (priority) {
    case "urgent":
    case "high":
      return "destructive";
    case "medium":
      return "default";
    default:
      return "outline";
  }
}

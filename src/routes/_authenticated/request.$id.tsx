import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { getRepairRequest, findMatchingTechnicians, requestAssignment } from "@/lib/repairs.functions";

const requestQueryOptions = (requestId: string) =>
  queryOptions({
    queryKey: ["repair-request", requestId],
    queryFn: () => getRepairRequest({ data: { requestId } }),
  });

export const Route = createFileRoute("/_authenticated/request/$id")({
  head: () => ({
    meta: [
      { title: "Request Details — FixNear India" },
      { name: "description", content: "View repair request details and find matching technicians." },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(requestQueryOptions(params.id)),
  component: RequestDetailPage,
});

function RequestDetailPage() {
  const { id } = useParams({ from: "/_authenticated/request/$id" });
  const { data: request } = useSuspenseQuery(requestQueryOptions(id));
  const queryClient = useQueryClient();
  const doFind = useServerFn(findMatchingTechnicians);
  const doRequest = useServerFn(requestAssignment);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const handleFind = async () => {
    setIsMatching(true);
    try {
      const matched = await doFind({ data: { requestId: id } });
      setTechnicians(matched);
    } catch (err: any) {
      toast.error(err.message || "Failed to find technicians");
    } finally {
      setIsMatching(false);
    }
  };

  const handleRequest = async (technicianId: string) => {
    setRequestingId(technicianId);
    try {
      await doRequest({ data: { requestId: id, technicianId } });
      toast.success("Assignment requested");
      queryClient.invalidateQueries({ queryKey: ["repair-request", id] });
      setTechnicians((prev) => prev.filter((t) => t.id !== technicianId));
    } catch (err: any) {
      toast.error(err.message || "Failed to request assignment");
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link to="/requests" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to requests
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">
                    {request.brand} {request.model}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.categories?.name} • {request.city}, {request.pincode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={request.status === "open" ? "secondary" : "default"}>{request.status}</Badge>
                  <Badge variant={request.priority === "urgent" || request.priority === "high" ? "destructive" : "outline"}>
                    {request.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{request.issue_description}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {request.address || "No address provided"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Preferred visit: {request.preferred_visit_time ? new Date(request.preferred_visit_time).toLocaleString() : "Flexible"}
                </div>
              </div>

              {request.status === "open" && (
                <Button onClick={handleFind} disabled={isMatching} className="w-full sm:w-auto">
                  {isMatching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Find Matching Technicians
                </Button>
              )}

              {request.request_assignments && request.request_assignments.length > 0 && (
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold">Assigned Technician</h3>
                  <p className="text-sm text-muted-foreground">
                    {request.request_assignments[0].technicians?.profiles?.full_name} ({request.request_assignments[0].status})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {technicians.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-semibold">Available Technicians</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {technicians.map((tech) => (
                  <Card key={tech.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{tech.profiles?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tech.experience_years} years • {tech.city} • {tech.service_radius_km} km radius
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" /> {tech.profiles?.phone}
                          </p>
                          <Button
                            size="sm"
                            className="mt-3 w-full"
                            disabled={requestingId === tech.id}
                            onClick={() => handleRequest(tech.id)}
                          >
                            {requestingId === tech.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : "Request Assignment"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

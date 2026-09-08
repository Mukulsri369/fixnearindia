import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Loader2, MapPin, Phone, Star, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestChat } from "@/components/RequestChat";
import { getRepairRequest } from "@/lib/repairs.functions";
import {
  getInvoiceForRequest,
  getRequestInterests,
  postRequestMessage,
  selectTechnician,
  updateInvoiceStatus,
} from "@/lib/marketplace.functions";

const requestQueryOptions = (requestId: string) =>
  queryOptions({
    queryKey: ["repair-request", requestId],
    queryFn: () => getRepairRequest({ data: { requestId } }),
  });

const interestsQueryOptions = (requestId: string) =>
  queryOptions({
    queryKey: ["request-interests", requestId],
    queryFn: () => getRequestInterests({ data: { requestId } }),
  });

const invoiceQueryOptions = (requestId: string) =>
  queryOptions({
    queryKey: ["request-invoice", requestId],
    queryFn: () => getInvoiceForRequest({ data: { requestId } }),
  });

export const Route = createFileRoute("/_authenticated/request/$id")({
  head: () => ({
    meta: [
      { title: "Request Details — FixNear India" },
      { name: "description", content: "Chat with technicians, pick one and settle the invoice for your repair." },
      { property: "og:title", content: "Request Details — FixNear India" },
      { property: "og:description", content: "Chat with technicians and settle your repair invoice on FixNear India." },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(requestQueryOptions(params.id)),
  component: RequestDetailPage,
});

function RequestDetailPage() {
  const { id } = useParams({ from: "/_authenticated/request/$id" });
  const { data: request } = useSuspenseQuery(requestQueryOptions(id));
  const { data: interests } = useSuspenseQuery(interestsQueryOptions(id));
  const { data: invoice } = useSuspenseQuery(invoiceQueryOptions(id));

  const queryClient = useQueryClient();
  const doSelect = useServerFn(selectTechnician);
  const doPost = useServerFn(postRequestMessage);
  const doInvoice = useServerFn(updateInvoiceStatus);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["repair-request", id] });
    queryClient.invalidateQueries({ queryKey: ["request-interests", id] });
    queryClient.invalidateQueries({ queryKey: ["request-invoice", id] });
  };

  const handleSelect = async (assignmentId: string) => {
    setBusy(assignmentId);
    try {
      await doSelect({ data: { requestId: id, assignmentId } });
      toast.success("Technician assigned");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign technician");
    } finally {
      setBusy(null);
    }
  };

  const handleInvoice = async (action: "approve" | "pay") => {
    if (!invoice) return;
    setBusy(action);
    try {
      await doInvoice({ data: { invoiceId: invoice.id, action } });
      toast.success(action === "approve" ? "Invoice approved" : "Payment recorded — request closed");
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update invoice");
    } finally {
      setBusy(null);
    }
  };

  const accepted = (interests ?? []).find((i: any) => i.status !== "rejected" && i.status !== "interested");

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link to="/requests" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to requests
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
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
                <div className="flex flex-wrap justify-end gap-2">
                  <Badge>{request.status}</Badge>
                  <Badge variant="outline">{request.priority}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{request.issue_description}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {request.address || "No address provided"}
                </div>
                <div className="text-sm text-muted-foreground">
                  Preferred visit:{" "}
                  {request.preferred_visit_time ? new Date(request.preferred_visit_time).toLocaleString() : "Flexible"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice */}
          {invoice && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Invoice</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-3xl font-bold">₹{Number(invoice.amount).toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  From {invoice.technicians?.profiles?.full_name ?? "your technician"} •{" "}
                  <span className="capitalize">{invoice.status}</span>
                </p>
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">Work done</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{invoice.repair_notes}</p>
                  {invoice.parts_replaced && (
                    <>
                      <p className="mt-3 font-medium">Parts replaced</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{invoice.parts_replaced}</p>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {invoice.status === "issued" && (
                    <Button disabled={busy === "approve"} onClick={() => handleInvoice("approve")}>
                      {busy === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Approve repair
                    </Button>
                  )}
                  {invoice.status === "approved" && (
                    <Button disabled={busy === "pay"} onClick={() => handleInvoice("pay")}>
                      {busy === "pay" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Mark as paid
                    </Button>
                  )}
                  {invoice.status === "paid" && <Badge>Paid — request closed</Badge>}
                  {invoice.status === "paid" && (
                    <Button asChild variant="outline">
                      <Link to="/bill/$id" params={{ id }}>
                        <FileText className="mr-2 h-4 w-4" /> GST bill
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interested technicians */}
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold">
              {accepted ? "Assigned technician" : `Interested technicians (${interests?.length ?? 0})`}
            </h2>

            {(interests ?? []).length === 0 ? (
              <div className="rounded-xl border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No technician has responded yet. Approved technicians nearby will see your request and send offers.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(interests ?? [])
                  .filter((i: any) => (accepted ? i.id === accepted.id : true))
                  .map((interest: any) => (
                    <Card key={interest.id}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{interest.technicians?.profiles?.full_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {interest.technicians?.business_name
                                    ? `${interest.technicians.business_name} • `
                                    : ""}
                                  {interest.technicians?.experience_years} yrs • {interest.technicians?.city}
                                </p>
                                <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3" /> {interest.technicians?.avg_rating ?? 0}
                                  </span>
                                  {accepted?.id === interest.id && interest.technicians?.profiles?.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" /> {interest.technicians.profiles.phone}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <Badge variant={interest.status === "interested" ? "secondary" : "default"}>
                                {interest.status}
                              </Badge>
                            </div>

                            {!accepted && interest.status === "interested" && (
                              <Button
                                size="sm"
                                className="mt-3"
                                disabled={busy === interest.id}
                                onClick={() => handleSelect(interest.id)}
                              >
                                {busy === interest.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                                Choose this technician
                              </Button>
                            )}
                          </div>
                        </div>

                        <RequestChat
                          requestId={id}
                          technicianId={interest.technicians?.id}
                          title={`Chat with ${interest.technicians?.profiles?.full_name ?? "technician"}`}
                          onSend={(body) =>
                            doPost({
                              data: { requestId: id, technicianId: interest.technicians?.id ?? null, body },
                            })
                          }
                        />
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

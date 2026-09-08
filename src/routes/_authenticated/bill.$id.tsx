import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { attachBillPdf, getBillContext, getBillPdfUrl, saveGstBill } from "@/lib/billing.functions";

type Item = { description: string; hsn: string; quantity: number; rate: number; taxRate: number };

const billContextQueryOptions = (requestId: string) =>
  queryOptions({
    queryKey: ["bill-context", requestId],
    queryFn: () => getBillContext({ data: { requestId } }),
  });

export const Route = createFileRoute("/_authenticated/bill/$id")({
  head: () => ({
    meta: [
      { title: "Create GST Bill — FixNear India" },
      { name: "description", content: "Generate a GST invoice PDF for a completed repair job." },
      { property: "og:title", content: "Create GST Bill — FixNear India" },
      { property: "og:description", content: "Generate a GST invoice PDF for a completed repair job on FixNear India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BillPage,
});

function money(n: number) {
  return `₹${(Math.round(n * 100) / 100).toFixed(2)}`;
}

function BillPage() {
  const { id } = useParams({ from: "/_authenticated/bill/$id" });
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(billContextQueryOptions(id));
  const doSave = useServerFn(saveGstBill);
  const doAttach = useServerFn(attachBillPdf);
  const doUrl = useServerFn(getBillPdfUrl);

  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({
    billNumber: "",
    billDate: new Date().toISOString().slice(0, 10),
    firmName: "",
    firmAddress: "",
    firmGstin: "",
    firmPhone: "",
    firmEmail: "",
    placeOfSupply: "",
    customerName: "",
    customerAddress: "",
    customerGstin: "",
    taxMode: "cgst_sgst" as "cgst_sgst" | "igst" | "none",
    notes: "",
  });
  const [items, setItems] = useState<Item[]>([{ description: "", hsn: "", quantity: 1, rate: 0, taxRate: 18 }]);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!data || seeded) return;
    const bill: any = data.bill;
    if (bill) {
      setForm({
        billNumber: bill.bill_number ?? "",
        billDate: bill.bill_date ?? new Date().toISOString().slice(0, 10),
        firmName: bill.firm_name ?? "",
        firmAddress: bill.firm_address ?? "",
        firmGstin: bill.firm_gstin ?? "",
        firmPhone: bill.firm_phone ?? "",
        firmEmail: bill.firm_email ?? "",
        placeOfSupply: bill.place_of_supply ?? "",
        customerName: bill.customer_name ?? "",
        customerAddress: bill.customer_address ?? "",
        customerGstin: bill.customer_gstin ?? "",
        taxMode: (bill.tax_mode ?? "cgst_sgst") as typeof form.taxMode,
        notes: bill.notes ?? "",
      });
      if (Array.isArray(bill.items) && bill.items.length) setItems(bill.items as Item[]);
    } else if (data.prefill) {
      const p: any = data.prefill;
      setForm((f) => ({
        ...f,
        billNumber: `FN-${new Date().getFullYear()}-${String(id).slice(0, 6).toUpperCase()}`,
        firmName: p.firmName ?? "",
        firmAddress: p.firmAddress ?? "",
        firmGstin: p.firmGstin ?? "",
        firmPhone: p.firmPhone ?? "",
        firmEmail: p.firmEmail ?? "",
        placeOfSupply: p.placeOfSupply ?? "",
        customerName: p.customerName ?? "",
        customerAddress: p.customerAddress ?? "",
      }));
      const req: any = data.request;
      const amount = Number((data.invoice as any)?.amount ?? 0);
      setItems([
        {
          description: `Repair — ${[req?.brand, req?.model].filter(Boolean).join(" ") || req?.categories?.name || "Service"}`,
          hsn: "",
          quantity: 1,
          rate: amount,
          taxRate: 18,
        },
      ]);
    }
    setSeeded(true);
  }, [data, seeded, id]);

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0);
  const taxAmount =
    form.taxMode === "none"
      ? 0
      : items.reduce(
          (s, i) => s + ((Number(i.quantity) || 0) * (Number(i.rate) || 0) * (Number(i.taxRate) || 0)) / 100,
          0
        );
  const total = subtotal + taxAmount;

  const download = async () => {
    setBusy("download");
    try {
      const res = await doUrl({ data: { requestId: id } });
      if (!res.url) {
        toast.error("No bill PDF has been generated yet");
        return;
      }
      window.open(res.url, "_blank", "noopener");
    } catch (err: any) {
      toast.error(err.message || "Could not open the bill");
    } finally {
      setBusy(null);
    }
  };

  const generate = async () => {
    if (!form.firmName.trim()) return toast.error("Add your firm name");
    if (!items.some((i) => i.description.trim() && Number(i.rate) > 0)) {
      return toast.error("Add at least one item with a price");
    }
    setBusy("generate");
    try {
      const cleanItems = items
        .filter((i) => i.description.trim())
        .map((i) => ({
          description: i.description.trim(),
          hsn: i.hsn?.trim() ?? "",
          quantity: Number(i.quantity) || 0,
          rate: Number(i.rate) || 0,
          taxRate: form.taxMode === "none" ? 0 : Number(i.taxRate) || 0,
        }));

      const saved: any = await doSave({ data: { requestId: id, ...form, items: cleanItems } });
      if (!saved?.id) throw new Error("Could not save the bill");

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      let y = 48;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(form.firmName, 40, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      y += 16;
      if (form.firmAddress) {
        doc.text(doc.splitTextToSize(form.firmAddress, 300), 40, y);
        y += 12 * doc.splitTextToSize(form.firmAddress, 300).length;
      }
      if (form.firmPhone || form.firmEmail) {
        doc.text([form.firmPhone, form.firmEmail].filter(Boolean).join(" | "), 40, y);
        y += 12;
      }
      if (form.firmGstin) {
        doc.text(`GSTIN: ${form.firmGstin}`, 40, y);
        y += 12;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("TAX INVOICE", W - 40, 48, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Bill No: ${form.billNumber}`, W - 40, 66, { align: "right" });
      doc.text(`Date: ${form.billDate}`, W - 40, 80, { align: "right" });
      if (form.placeOfSupply) doc.text(`Place of supply: ${form.placeOfSupply}`, W - 40, 94, { align: "right" });

      y += 10;
      doc.line(40, y, W - 40, y);
      y += 18;
      doc.setFont("helvetica", "bold");
      doc.text("Billed to", 40, y);
      doc.setFont("helvetica", "normal");
      y += 14;
      if (form.customerName) {
        doc.text(form.customerName, 40, y);
        y += 12;
      }
      if (form.customerAddress) {
        const lines = doc.splitTextToSize(form.customerAddress, 300);
        doc.text(lines, 40, y);
        y += 12 * lines.length;
      }
      if (form.customerGstin) {
        doc.text(`GSTIN: ${form.customerGstin}`, 40, y);
        y += 12;
      }

      y += 12;
      const cols = [40, 250, 310, 370, 440, W - 40];
      doc.setFont("helvetica", "bold");
      doc.text("Description", cols[0]!, y);
      doc.text("HSN", cols[1]!, y);
      doc.text("Qty", cols[2]!, y);
      doc.text("Rate", cols[3]!, y);
      doc.text("Tax %", cols[4]!, y);
      doc.text("Amount", cols[5]!, y, { align: "right" });
      y += 6;
      doc.line(40, y, W - 40, y);
      y += 14;
      doc.setFont("helvetica", "normal");

      for (const item of cleanItems) {
        const lines = doc.splitTextToSize(item.description, 195);
        doc.text(lines, cols[0]!, y);
        doc.text(item.hsn || "-", cols[1]!, y);
        doc.text(String(item.quantity), cols[2]!, y);
        doc.text(item.rate.toFixed(2), cols[3]!, y);
        doc.text(form.taxMode === "none" ? "-" : `${item.taxRate}%`, cols[4]!, y);
        doc.text((item.quantity * item.rate).toFixed(2), cols[5]!, y, { align: "right" });
        y += Math.max(14, 12 * lines.length);
        if (y > 720) {
          doc.addPage();
          y = 60;
        }
      }

      doc.line(40, y, W - 40, y);
      y += 16;
      const row = (label: string, value: string, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.text(label, 370, y);
        doc.text(value, W - 40, y, { align: "right" });
        y += 14;
      };
      row("Subtotal", subtotal.toFixed(2));
      if (form.taxMode === "cgst_sgst") {
        row("CGST", (taxAmount / 2).toFixed(2));
        row("SGST", (taxAmount / 2).toFixed(2));
      } else if (form.taxMode === "igst") {
        row("IGST", taxAmount.toFixed(2));
      }
      row("Total", total.toFixed(2), true);

      if (form.notes) {
        y += 12;
        doc.setFont("helvetica", "normal");
        doc.text(doc.splitTextToSize(`Notes: ${form.notes}`, W - 80), 40, y);
      }

      doc.setFontSize(8);
      doc.text("Generated on FixNear India", 40, 810);

      const blob = doc.output("blob");
      const path = `${id}/bill-${form.billNumber.replace(/[^\w-]/g, "")}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("gst-bills")
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      await doAttach({ data: { billId: saved.id, pdfPath: path } });
      queryClient.invalidateQueries({ queryKey: ["bill-context", id] });
      queryClient.invalidateQueries({ queryKey: ["request-bill", id] });
      toast.success("GST bill generated and attached to the repair request");
    } catch (err: any) {
      toast.error(err.message || "Could not generate the bill");
    } finally {
      setBusy(null);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canEdit = data.canCreate;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/request/$id"
          params={{ id }}
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to repair request
        </Link>

        <h1 className="text-2xl font-bold sm:text-3xl">GST bill</h1>
        <p className="mt-1 text-muted-foreground">
          Add your firm and repair details, then generate the PDF — it attaches to the repair request for both you and
          the customer.
        </p>

        {data.bill?.pdf_path && (
          <Button className="mt-4" variant="outline" disabled={busy === "download"} onClick={download}>
            {busy === "download" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download bill PDF
          </Button>
        )}

        {!canEdit ? (
          <Card className="mt-8">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              {data.isCustomer
                ? data.bill
                  ? "Your technician has issued the bill — use the download button above."
                  : "Your technician has not issued a bill for this repair yet."
                : "A bill can be created only by the assigned technician after the customer has paid."}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg">Your firm details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Firm / business name *" value={form.firmName} onChange={(v) => setForm((f) => ({ ...f, firmName: v }))} />
                <Field label="GSTIN" value={form.firmGstin} onChange={(v) => setForm((f) => ({ ...f, firmGstin: v }))} />
                <Field label="Phone" value={form.firmPhone} onChange={(v) => setForm((f) => ({ ...f, firmPhone: v }))} />
                <Field label="Email" value={form.firmEmail} onChange={(v) => setForm((f) => ({ ...f, firmEmail: v }))} />
                <div className="sm:col-span-2">
                  <Label>Firm address</Label>
                  <Textarea
                    rows={2}
                    value={form.firmAddress}
                    onChange={(e) => setForm((f) => ({ ...f, firmAddress: e.target.value }))}
                  />
                </div>
                <Field label="Place of supply" value={form.placeOfSupply} onChange={(v) => setForm((f) => ({ ...f, placeOfSupply: v }))} />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bill number *" value={form.billNumber} onChange={(v) => setForm((f) => ({ ...f, billNumber: v }))} />
                  <div>
                    <Label>Bill date</Label>
                    <Input
                      type="date"
                      value={form.billDate}
                      onChange={(e) => setForm((f) => ({ ...f, billDate: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Customer details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Customer name" value={form.customerName} onChange={(v) => setForm((f) => ({ ...f, customerName: v }))} />
                <Field label="Customer GSTIN (optional)" value={form.customerGstin} onChange={(v) => setForm((f) => ({ ...f, customerGstin: v }))} />
                <div className="sm:col-span-2">
                  <Label>Billing address</Label>
                  <Textarea
                    rows={2}
                    value={form.customerAddress}
                    onChange={(e) => setForm((f) => ({ ...f, customerAddress: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-lg">Items repaired & charges</CardTitle>
                  <div className="w-48">
                    <Select
                      value={form.taxMode}
                      onValueChange={(v) => setForm((f) => ({ ...f, taxMode: v as typeof form.taxMode }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cgst_sgst">CGST + SGST (same state)</SelectItem>
                        <SelectItem value="igst">IGST (other state)</SelectItem>
                        <SelectItem value="none">No GST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-12">
                    <div className="sm:col-span-5">
                      <Label>Item / service</Label>
                      <Input
                        value={item.description}
                        placeholder="e.g. AC compressor replacement"
                        onChange={(e) =>
                          setItems((list) => list.map((it, i) => (i === index ? { ...it, description: e.target.value } : it)))
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>HSN / SAC</Label>
                      <Input
                        value={item.hsn}
                        onChange={(e) => setItems((list) => list.map((it, i) => (i === index ? { ...it, hsn: e.target.value } : it)))}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) =>
                          setItems((list) =>
                            list.map((it, i) => (i === index ? { ...it, quantity: Number(e.target.value) } : it))
                          )
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Rate (₹)</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.rate}
                        onChange={(e) =>
                          setItems((list) => list.map((it, i) => (i === index ? { ...it, rate: Number(e.target.value) } : it)))
                        }
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Label>Tax %</Label>
                      <Input
                        type="number"
                        min={0}
                        max={28}
                        disabled={form.taxMode === "none"}
                        value={item.taxRate}
                        onChange={(e) =>
                          setItems((list) =>
                            list.map((it, i) => (i === index ? { ...it, taxRate: Number(e.target.value) } : it))
                          )
                        }
                      />
                    </div>
                    <div className="flex items-end sm:col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove item"
                        disabled={items.length === 1}
                        onClick={() => setItems((list) => list.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItems((list) => [...list, { description: "", hsn: "", quantity: 1, rate: 0, taxRate: 18 }])}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add item
                </Button>

                <div>
                  <Label>Notes / terms</Label>
                  <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>

                <div className="rounded-lg border p-4 text-sm">
                  <Row label="Subtotal" value={money(subtotal)} />
                  {form.taxMode === "cgst_sgst" && (
                    <>
                      <Row label="CGST" value={money(taxAmount / 2)} />
                      <Row label="SGST" value={money(taxAmount / 2)} />
                    </>
                  )}
                  {form.taxMode === "igst" && <Row label="IGST" value={money(taxAmount)} />}
                  <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
                    <span>Total</span>
                    <span>{money(total)}</span>
                  </div>
                </div>

                <Button disabled={busy === "generate"} onClick={generate}>
                  {busy === "generate" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Generate PDF
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

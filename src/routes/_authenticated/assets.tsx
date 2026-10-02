import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Box, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCustomerAsset, deleteCustomerAsset, getMyAssets, updateCustomerAsset } from "@/lib/assets.functions";
import { getCategories } from "@/lib/categories.functions";

const assetsQueryOptions = () => queryOptions({ queryKey: ["my-assets"], queryFn: () => getMyAssets() });
const categoriesQueryOptions = () => queryOptions({ queryKey: ["categories"], queryFn: () => getCategories() });

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({
    meta: [
      { title: "My Assets — FixNear India" },
      { name: "description", content: "Register and manage the appliances and equipment linked to your FixNear account." },
      { property: "og:title", content: "My Assets — FixNear India" },
      { property: "og:description", content: "Manage your registered appliances and equipment on FixNear India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(assetsQueryOptions()),
    context.queryClient.ensureQueryData(categoriesQueryOptions()),
  ]),
  component: AssetsPage,
});

type AssetForm = {
  assetId?: string;
  name: string;
  categoryId: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  notes: string;
};

const emptyForm: AssetForm = { name: "", categoryId: "", brand: "", model: "", serialNumber: "", purchaseDate: "", notes: "" };

function AssetsPage() {
  const { data: assets } = useSuspenseQuery(assetsQueryOptions());
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const queryClient = useQueryClient();
  const createAsset = useServerFn(createCustomerAsset);
  const updateAsset = useServerFn(updateCustomerAsset);
  const deleteAsset = useServerFn(deleteCustomerAsset);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<AssetForm>(emptyForm);

  const openNew = () => { setForm(emptyForm); setOpen(true); };
  const openEdit = (asset: (typeof assets)[number]) => {
    setForm({
      assetId: asset.id,
      name: asset.name,
      categoryId: asset.category_id,
      brand: asset.brand ?? "",
      model: asset.model ?? "",
      serialNumber: asset.serial_number ?? "",
      purchaseDate: asset.purchase_date ?? "",
      notes: asset.notes ?? "",
    });
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        brand: form.brand || undefined,
        model: form.model || undefined,
        serialNumber: form.serialNumber || undefined,
        purchaseDate: form.purchaseDate || undefined,
        notes: form.notes || undefined,
      };
      if (form.assetId) await updateAsset({ data: { ...payload, assetId: form.assetId } });
      else await createAsset({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      toast.success(form.assetId ? "Asset updated" : "Asset added");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save asset");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (assetId: string) => {
    if (!window.confirm("Remove this asset?")) return;
    try {
      await deleteAsset({ data: { assetId } });
      await queryClient.invalidateQueries({ queryKey: ["my-assets"] });
      toast.success("Asset removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove asset");
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Assets</h1>
            <p className="mt-1 text-muted-foreground">Register appliances and equipment before requesting a repair.</p>
          </div>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add asset</Button>
        </div>

        {assets.length === 0 ? (
          <div className="rounded-lg border bg-card px-6 py-14 text-center">
            <Box className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">No assets registered</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add your first appliance or equipment to book a repair.</p>
            <Button className="mt-5" onClick={openNew}>Add your first asset</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <Card key={asset.id}>
                <CardHeader className="pb-3"><CardTitle className="text-lg">{asset.name}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{[asset.brand, asset.model].filter(Boolean).join(" ") || "Brand and model not added"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{asset.categories?.name}</p>
                  {asset.serial_number ? <p className="mt-3 text-xs text-muted-foreground">Serial: {asset.serial_number}</p> : null}
                  <div className="mt-5 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(asset)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(asset.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Remove</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.assetId ? "Edit asset" : "Add an asset"}</DialogTitle>
            <DialogDescription>Add the details that identify this appliance or equipment.</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="asset-name">Asset name</Label><Input id="asset-name" required placeholder="Living room AC" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Repair category</Label><Select required value={form.categoryId} onValueChange={(categoryId) => setForm({ ...form, categoryId })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="asset-brand">Brand</Label><Input id="asset-brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="asset-model">Model</Label><Input id="asset-model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="asset-serial">Serial number</Label><Input id="asset-serial" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="asset-date">Purchase date</Label><Input id="asset-date" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="asset-notes">Notes</Label><Textarea id="asset-notes" rows={3} placeholder="Warranty or identification notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy || !form.categoryId}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{form.assetId ? "Save changes" : "Add asset"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
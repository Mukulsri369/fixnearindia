import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";

import { useAuth } from "../hooks/useAuth.jsx";
import { useCategories } from "../hooks/useCategories.js";
import { createRepairRequest, uploadRequestImages } from "../services/repairs.js";
import { Button, Card, Input, Label, Select, Textarea } from "../components/ui.jsx";
import { PRIORITIES } from "../lib/utils.js";

export default function NewRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();

  const [form, setForm] = useState({
    categoryId: location.state?.categoryId ?? "",
    brand: "",
    model: "",
    issueDescription: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    preferredVisitTime: "",
    priority: "medium",
  });
  const [files, setFiles] = useState([]);

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const addFiles = (event) => {
    const selected = Array.from(event.target.files ?? []);
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
    event.target.value = "";
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const request = await createRepairRequest(user.id, form);
      if (files.length) await uploadRequestImages(request.id, files);
      return request;
    },
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      toast.success("Repair request created");
      navigate(`/request/${request.id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.categoryId) return toast.error("Please choose a category");
    if (form.issueDescription.trim().length < 20)
      return toast.error("Describe the issue in at least 20 characters");
    if (!form.city || form.pincode.length < 6)
      return toast.error("City and a 6-digit pincode are required");
    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Book a repair</h1>
      <p className="mt-2 text-muted-foreground">
        Tell us what needs fixing and where — we'll match technicians near you.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Card>
          <h2 className="font-semibold">Device details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="category">Category *</Label>
              <Select id="category" value={form.categoryId} onChange={set("categoryId")} required>
                <option value="">Select a category</option>
                {(categories ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" value={form.brand} onChange={set("brand")} placeholder="Samsung" />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input id="model" value={form.model} onChange={set("model")} placeholder="AR18TY" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="issue">What's the problem? *</Label>
              <Textarea
                id="issue"
                rows={5}
                value={form.issueDescription}
                onChange={set("issueDescription")}
                placeholder="The AC runs but does not cool. It also makes a rattling noise when started…"
                required
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" value={form.priority} onChange={set("priority")}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="visit">Preferred visit time</Label>
              <Input
                id="visit"
                value={form.preferredVisitTime}
                onChange={set("preferredVisitTime")}
                placeholder="Weekdays after 6 PM"
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Service location</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={set("address")}
                placeholder="Flat 12B, Green Residency, MG Road"
              />
            </div>
            <div>
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={form.city} onChange={set("city")} placeholder="Pune" required />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={set("state")} placeholder="Maharashtra" />
            </div>
            <div>
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                value={form.pincode}
                onChange={set("pincode")}
                placeholder="411001"
                minLength={6}
                maxLength={10}
                required
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Photos (optional, up to 5)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Photos of the device, model sticker or the fault help technicians quote accurately.
          </p>

          <label className="mt-5 flex h-28 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/50">
            <ImagePlus className="h-5 w-5" />
            Click to add images
            <input type="file" accept="image/*" multiple className="hidden" onChange={addFiles} />
          </label>

          {files.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-20 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <Button type="submit" size="lg" disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting…" : "Submit request"}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

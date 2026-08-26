import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Plus, Upload, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { getCategories } from "@/lib/categories.functions";
import { createRepairRequest, uploadRepairImage } from "@/lib/repairs.functions";

const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

export const Route = createFileRoute("/_authenticated/new-request")({
  head: () => ({
    meta: [
      { title: "New Repair Request — FixNear India" },
      { name: "description", content: "Create a new repair request and get matched with nearby technicians." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQueryOptions()),
  component: NewRequestPage,
});

function NewRequestPage() {
  const navigate = useNavigate();
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const doCreate = useServerFn(createRepairRequest);
  const doUpload = useServerFn(uploadRepairImage);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"choose" | "create">("choose");
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [form, setForm] = useState({
    title: "",
    brand: "",
    model: "",
    categoryId: "",
    issueDescription: "",
    pincode: "",
    city: "",
    state: "",
    address: "",
    preferredVisitTime: "",
    priority: "medium",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...newImages].slice(0, 4));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { requestId } = await doCreate({
        data: {
          title: form.title,
          brand: form.brand,
          model: form.model,
          categoryId: form.categoryId,
          issueDescription: form.issueDescription,
          pincode: form.pincode,
          city: form.city,
          state: form.state,
          address: form.address,
          preferredVisitTime: form.preferredVisitTime,
          priority: form.priority as "low" | "medium" | "high" | "urgent",
        },
      });

      for (const image of images) {
        const base64 = await fileToBase64(image.file);
        await doUpload({
          data: {
            requestId,
            base64Image: base64,
            fileName: image.file.name,
            contentType: image.file.type,
          },
        });
      }

      toast.success("Repair request created");
      navigate({ to: "/requests" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        {mode === "choose" ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Plus className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4 text-xl">Create repair request</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Describe the problem and let matching technicians near you send their offers.
                </p>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button className="w-full" onClick={() => setMode("create")}>
                  Create repair request
                </Button>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4 text-xl">See nearby technicians</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Browse verified technicians in your city for your repair category and contact them directly.
                </p>
              </CardHeader>
              <CardContent className="mt-auto">
                <Link to="/nearby-technicians">
                  <Button variant="outline" className="w-full">
                    See nearby technicians
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Plus className="h-6 w-6" />
              </div>
              <CardTitle className="mt-4 text-2xl">Create a Repair Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Samsung washing machine not spinning"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      placeholder="Samsung"
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="WA70N4260SS"
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    required
                    value={form.categoryId}
                    onValueChange={(value) => setForm({ ...form, categoryId: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a repair category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Issue Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue in detail..."
                    required
                    minLength={20}
                    rows={5}
                    value={form.issueDescription}
                    onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select
                      required
                      value={form.state}
                      onValueChange={(value) => setForm({ ...form, state: value, city: "" })}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIA_STATES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Select required value={form.city} onValueChange={(value) => setForm({ ...form, city: value })}>
                      <SelectTrigger id="city" disabled={!form.state}>
                        <SelectValue placeholder={form.state ? "Select city" : "Select a state first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {citiesForState(form.state).map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      placeholder="560001"
                      required
                      minLength={6}
                      maxLength={10}
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Your full address for the technician visit"
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="preferredTime">Preferred Visit Time</Label>
                    <Input
                      id="preferredTime"
                      type="datetime-local"
                      value={form.preferredVisitTime}
                      onChange={(e) => setForm({ ...form, preferredVisitTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="images">Photos (optional, max 4)</Label>
                  <div className="flex flex-wrap gap-3">
                    {images.map((image, i) => (
                      <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                        <img src={image.preview} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 4 && (
                      <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border hover:bg-accent">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="mt-1 text-xs text-muted-foreground">Add</span>
                        <input
                          id="images"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !form.categoryId}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
        )}
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
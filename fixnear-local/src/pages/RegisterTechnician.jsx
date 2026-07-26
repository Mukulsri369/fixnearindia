import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "../hooks/useAuth.jsx";
import { useCategories } from "../hooks/useCategories.js";
import { registerTechnician } from "../services/technicians.js";
import { Button, Card, Input, Label, Textarea } from "../components/ui.jsx";

export default function RegisterTechnician() {
  const { user, isAuthenticated, refreshRole } = useAuth();
  const navigate = useNavigate();
  const { data: categories } = useCategories();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    businessName: "",
    experienceYears: 1,
    address: "",
    city: "",
    state: "",
    pincode: "",
    serviceRadiusKm: 10,
  });
  const [categoryIds, setCategoryIds] = useState([]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleCategory = (id) =>
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );

  const mutation = useMutation({
    mutationFn: () =>
      registerTechnician(user, {
        ...form,
        experienceYears: Number(form.experienceYears),
        serviceRadiusKm: Number(form.serviceRadiusKm),
        categoryIds,
      }),
    onSuccess: async () => {
      await refreshRole();
      toast.success("Application submitted — we'll review and approve it shortly.");
      navigate("/dashboard");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Join as a technician</h1>
        <p className="mt-3 text-muted-foreground">
          Create an account or sign in first, then complete your technician profile.
        </p>
        <Button as={Link} to="/auth" size="lg" className="mt-8">
          Sign in to continue
        </Button>
      </div>
    );
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (form.fullName.trim().length < 2) return toast.error("Enter your full name");
    if (form.phone.trim().length < 10) return toast.error("Enter a valid phone number");
    if (!categoryIds.length) return toast.error("Select at least one service category");
    if (!form.city || form.pincode.length < 6)
      return toast.error("City and a 6-digit pincode are required");
    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Become a FixNear technician</h1>
      <p className="mt-2 text-muted-foreground">
        Get repair jobs from customers near you. Applications are reviewed before approval.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <Card>
          <h2 className="font-semibold">About you</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fullName">Full name *</Label>
              <Input id="fullName" value={form.fullName} onChange={set("fullName")} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="9876543210" required />
            </div>
            <div>
              <Label htmlFor="businessName">Shop / business name</Label>
              <Input id="businessName" value={form.businessName} onChange={set("businessName")} />
            </div>
            <div>
              <Label htmlFor="experience">Years of experience *</Label>
              <Input
                id="experience"
                type="number"
                min={0}
                max={60}
                value={form.experienceYears}
                onChange={set("experienceYears")}
                required
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Service categories *</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose everything you can repair — we match jobs on these.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(categories ?? []).map((category) => {
              const active = categoryIds.includes(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Service area</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="address">Shop / home address</Label>
              <Textarea id="address" rows={3} value={form.address} onChange={set("address")} />
            </div>
            <div>
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={form.city} onChange={set("city")} required />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={set("state")} />
            </div>
            <div>
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                value={form.pincode}
                onChange={set("pincode")}
                minLength={6}
                maxLength={10}
                required
              />
            </div>
            <div>
              <Label htmlFor="radius">Service radius (km) *</Label>
              <Input
                id="radius"
                type="number"
                min={1}
                max={100}
                value={form.serviceRadiusKm}
                onChange={set("serviceRadiusKm")}
                required
              />
            </div>
          </div>
        </Card>

        <Button type="submit" size="lg" disabled={mutation.isPending}>
          {mutation.isPending ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </div>
  );
}

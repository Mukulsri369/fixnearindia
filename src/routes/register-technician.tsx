import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCategories } from "@/lib/categories.functions";
import { getTechnicianRegistrationStatus, registerTechnician } from "@/lib/auth.functions";
import { useAuth } from "@/hooks/use-auth";

const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

export const Route = createFileRoute("/register-technician")({
  head: () => ({
    meta: [
      { title: "Register as Technician — FixNear India" },
      { name: "description", content: "Register as a verified technician on FixNear India and start accepting local repair jobs." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQueryOptions()),
  component: RegisterTechnicianPage,
});

function RegisterTechnicianPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const doRegister = useServerFn(registerTechnician);
  const getStatus = useServerFn(getTechnicianRegistrationStatus);
  const { data: registrationStatus } = useQuery({
    queryKey: ["technician-registration-status"],
    queryFn: () => getStatus(),
    enabled: isAuthenticated,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    city: "",
    experienceYears: "",
    serviceRadiusKm: "10",
    categoryIds: [] as string[],
  });

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please sign in or create an account first");
      navigate({ to: "/auth", search: { redirect: window.location.href } });
      return;
    }

    if (form.categoryIds.length === 0) {
      toast.error("Select at least one repair category");
      return;
    }

    setIsLoading(true);
    try {
      await doRegister({
        data: {
          fullName: form.fullName,
          phone: form.phone,
          pincode: form.pincode,
          city: form.city,
          experienceYears: parseInt(form.experienceYears, 10),
          serviceRadiusKm: parseInt(form.serviceRadiusKm, 10),
          categoryIds: form.categoryIds,
        },
      });
      toast.success("Technician registration submitted for approval");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {registrationStatus?.hasTechnicianApplication ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Wrench className="h-6 w-6" />
                </div>
                <CardTitle className="mt-4 text-2xl">
                  {registrationStatus.isApproved ? "Technician account approved" : "Registration submitted"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {registrationStatus.isApproved
                    ? "You can now accept repair jobs near your service area."
                    : "Your technician application is waiting for admin approval."}
                </p>
              </CardHeader>
              <CardContent>
                <Link to={registrationStatus.isApproved ? "/available-jobs" : "/dashboard"}>
                  <Button className="w-full">
                    {registrationStatus.isApproved ? "View nearby repair jobs" : "Back to dashboard"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Wrench className="h-6 w-6" />
              </div>
              <CardTitle className="mt-4 text-2xl">Register as a Technician</CardTitle>
              <p className="text-sm text-muted-foreground">
                Join our network of verified repair professionals and get local jobs.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Rahul Sharma"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Bangalore"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Service Pincode</Label>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience (years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      min={0}
                      max={60}
                      placeholder="5"
                      required
                      value={form.experienceYears}
                      onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="radius">Service Radius (km)</Label>
                    <Input
                      id="radius"
                      type="number"
                      min={1}
                      max={100}
                      placeholder="10"
                      required
                      value={form.serviceRadiusKm}
                      onChange={(e) => setForm({ ...form, serviceRadiusKm: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Repair Categories</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={form.categoryIds.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                        <Label htmlFor={category.id} className="cursor-pointer text-sm font-normal">
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Registration
                </Button>
              </form>

              {!isAuthenticated ? (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/auth" className="font-medium text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              ) : null}
            </CardContent>
          </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}

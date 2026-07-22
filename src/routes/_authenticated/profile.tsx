import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useState } from "react";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUserProfile } from "@/lib/auth.functions";

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
});

const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone })
      .eq("user_id", context.userId);

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return { ok: true };
  });

const profileQueryOptions = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: () => getCurrentUserProfile(),
  });

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — FixNear India" },
      { name: "description", content: "Update your FixNear India profile information." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQueryOptions()),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const queryClient = useQueryClient();
  const doUpdate = useServerFn(updateProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await doUpdate({ data: form });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <User className="h-6 w-6" />
              </div>
              <CardTitle className="mt-4 text-2xl">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

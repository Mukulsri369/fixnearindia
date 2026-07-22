import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, LogOut, User, Wrench, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentUserProfile, getCurrentUserRole, signOut } from "@/lib/auth.functions";
import { useState } from "react";

const profileQueryOptions = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: () => getCurrentUserProfile(),
  });

const roleQueryOptions = () =>
  queryOptions({
    queryKey: ["role"],
    queryFn: () => getCurrentUserRole(),
  });

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FixNear India" },
      { name: "description", content: "Manage your repair requests and technician profile on FixNear India." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(profileQueryOptions());
    context.queryClient.ensureQueryData(roleQueryOptions());
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const { data: roleData } = useSuspenseQuery(roleQueryOptions());
  const role = roleData?.role ?? "customer";
  const isTechnician = role === "technician";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const doSignOut = useServerFn(signOut);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    await doSignOut({ data: undefined });
    navigate({ to: "/", replace: true });
    toast.success("Signed out");
    setIsSigningOut(false);
  };

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {profile?.full_name ?? "User"}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Sign out
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Role</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{role}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Phone</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profile?.phone ?? "—"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Requests</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No recent activity yet.</p>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!isTechnician ? (
                    <Link to="/new-request">
                      <Button className="w-full">Book a Repair</Button>
                    </Link>
                  ) : null}
                  {!isTechnician ? (
                    <Link to="/register-technician">
                      <Button variant="outline" className="w-full">Become a Technician</Button>
                    </Link>
                  ) : null}
                  <Link to="/profile">
                    <Button variant="outline" className="w-full">Edit Profile</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

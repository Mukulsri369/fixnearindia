import { Link } from "react-router-dom";
import {
  ClipboardList,
  PlusCircle,
  UserCog,
  Wrench,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth.jsx";
import { useProfile } from "../hooks/useProfile.js";
import { listMyRequests } from "../services/repairs.js";
import { getTechnicianByUser } from "../services/technicians.js";
import { Badge, Button, Card, Spinner } from "../components/ui.jsx";
import { statusTone, STATUS_LABELS } from "../lib/utils.js";

export default function Dashboard() {
  const { user, role, isTechnician } = useAuth();
  const { data: profile } = useProfile();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-requests", user?.id],
    queryFn: () => listMyRequests(user.id),
    enabled: !!user?.id,
  });

  const { data: technician } = useQuery({
    queryKey: ["technician", user?.id],
    queryFn: () => getTechnicianByUser(user.id),
    enabled: !!user?.id && isTechnician,
  });

  const open = (requests ?? []).filter((r) => r.status === "open").length;
  const active = (requests ?? []).filter((r) =>
    ["assigned", "in_progress"].includes(r.status),
  ).length;
  const done = (requests ?? []).filter((r) => r.status === "completed").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Hi{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Signed in as {user?.email} · role: {role ?? "customer"}
          </p>
        </div>
        <Button as={Link} to="/new-request">
          <PlusCircle className="h-4 w-4" /> New repair request
        </Button>
      </div>

      {isTechnician && technician && (
        <Card className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Technician account</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {technician.city} · {technician.experience_years} yrs experience ·{" "}
                {technician.service_radius_km} km radius
              </p>
            </div>
            <Badge
              className={
                technician.is_approved
                  ? "bg-success/15 text-success"
                  : "bg-warning/20 text-warning-foreground"
              }
            >
              {technician.is_approved ? "Approved" : "Pending approval"}
            </Badge>
          </div>
        </Card>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["Open requests", open],
          ["In progress", active],
          ["Completed", done],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold">{isLoading ? "—" : value}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold">Quick actions</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction to="/new-request" Icon={PlusCircle} title="Book a repair" />
        <QuickAction to="/requests" Icon={ClipboardList} title="My requests" />
        {isTechnician ? (
          <QuickAction to="/technician-requests" Icon={Wrench} title="My jobs" />
        ) : (
          <QuickAction to="/register-technician" Icon={Wrench} title="Become a technician" />
        )}
        <QuickAction to="/profile" Icon={UserCog} title="Edit profile" />
      </div>

      <h2 className="mt-12 text-xl font-semibold">Recent requests</h2>
      {isLoading ? (
        <div className="mt-6 flex justify-center">
          <Spinner />
        </div>
      ) : (requests ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No requests yet. Create your first repair request above.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {requests.slice(0, 5).map((request) => (
            <Link
              key={request.id}
              to={`/request/${request.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/40"
            >
              <span className="text-sm font-medium">
                {request.categories?.name} {request.brand ? `· ${request.brand}` : ""}
              </span>
              <Badge className={statusTone(request.status)}>
                {STATUS_LABELS[request.status] ?? request.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickAction({ to, Icon, title }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-sm font-semibold">{title}</span>
    </Link>
  );
}

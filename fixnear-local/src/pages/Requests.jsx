import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../hooks/useAuth.jsx";
import { listMyRequests } from "../services/repairs.js";
import RequestCard from "../components/RequestCard.jsx";
import { Button, EmptyState, Select, Spinner } from "../components/ui.jsx";

const FILTERS = [
  { value: "all", label: "All requests" },
  { value: "open", label: "Open" },
  { value: "assigned", label: "Assigned" },
  { value: "completed", label: "Completed" },
];

export default function Requests() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-requests", user?.id],
    queryFn: () => listMyRequests(user.id),
    enabled: !!user?.id,
  });

  const requests = (data ?? []).filter((r) => filter === "all" || r.status === filter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My repair requests</h1>
          <p className="mt-2 text-muted-foreground">
            Track every request and the technicians working on them.
          </p>
        </div>
        <Button as={Link} to="/new-request">
          New request
        </Button>
      </div>

      <div className="mt-8 max-w-xs">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="mt-12 flex justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <p className="mt-8 text-sm text-destructive">{error.message}</p>
      ) : requests.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No requests here"
            description="Once you book a repair it will appear in this list with its live status."
            action={
              <Button as={Link} to="/new-request">
                Book a repair
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}

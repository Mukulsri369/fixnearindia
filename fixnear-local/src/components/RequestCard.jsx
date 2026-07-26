import { Link } from "react-router-dom";
import { Badge, Card } from "./ui.jsx";
import { formatDate, statusTone, STATUS_LABELS } from "../lib/utils.js";

export default function RequestCard({ request }) {
  const assignment = request.request_assignments?.find((a) => a.status !== "rejected");
  const technicianName = assignment?.technicians?.profiles?.full_name;

  return (
    <Link to={`/request/${request.id}`} className="block">
      <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">
              {request.categories?.name ?? "Repair"}
              {request.brand ? ` · ${request.brand}` : ""}
              {request.model ? ` ${request.model}` : ""}
            </h3>
            <p className="mt-1 line-clamp-2 max-w-xl text-sm text-muted-foreground">
              {request.issue_description}
            </p>
          </div>
          <Badge className={statusTone(request.status)}>
            {STATUS_LABELS[request.status] ?? request.status}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>
            {request.city}
            {request.pincode ? ` — ${request.pincode}` : ""}
          </span>
          <span>Priority: {request.priority}</span>
          <span>Created {formatDate(request.created_at)}</span>
          {technicianName && <span>Technician: {technicianName}</span>}
        </div>
      </Card>
    </Link>
  );
}

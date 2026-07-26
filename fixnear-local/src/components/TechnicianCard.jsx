import { Star } from "lucide-react";
import { Badge, Button, Card } from "./ui.jsx";

export default function TechnicianCard({ technician, onInvite, isInviting, invited }) {
  const profile = technician.profiles ?? {};

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">
            {profile.full_name ?? technician.business_name ?? "Technician"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {technician.experience_years ?? 0} yrs experience · {technician.city}
            {technician.pincode ? ` (${technician.pincode})` : ""}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Serves up to {technician.service_radius_km ?? 10} km
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <Badge className="bg-warning/20 text-warning-foreground">
            <Star className="mr-1 h-3 w-3" />
            {Number(technician.avg_rating ?? 0).toFixed(1)} ({technician.total_reviews ?? 0})
          </Badge>
          {invited ? (
            <Badge className="bg-primary/15 text-primary">Invited</Badge>
          ) : (
            <Button size="sm" onClick={() => onInvite(technician.id)} disabled={isInviting}>
              {isInviting ? "Sending…" : "Request visit"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

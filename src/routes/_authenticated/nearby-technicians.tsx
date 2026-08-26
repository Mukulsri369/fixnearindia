import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Mail, MapPin, Phone, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategories } from "@/lib/categories.functions";
import { getNearbyTechnicians } from "@/lib/marketplace.functions";
import { INDIA_STATES, citiesForState } from "@/lib/india-locations";

const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

export const Route = createFileRoute("/_authenticated/nearby-technicians")({
  head: () => ({
    meta: [
      { title: "Nearby Technicians — FixNear India" },
      {
        name: "description",
        content: "Browse verified repair technicians in your city by category and contact them directly.",
      },
      { property: "og:title", content: "Nearby Technicians — FixNear India" },
      {
        property: "og:description",
        content: "Find verified repair technicians in your city with contact details on FixNear India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQueryOptions()),
  component: NearbyTechniciansPage,
});

function NearbyTechniciansPage() {
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());
  const fetchTechnicians = useServerFn(getNearbyTechnicians);
  const [state, setState] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["nearby-technicians", state, city, categoryId],
    queryFn: () =>
      fetchTechnicians({
        data: {
          ...(city !== "all" ? { city } : {}),
          ...(state !== "all" ? { state } : {}),
          ...(categoryId !== "all" ? { categoryId } : {}),
        },
      }),
  });

  const technicians = data?.technicians ?? [];

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/new-request"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to options
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Nearby technicians</h1>
              <p className="text-sm text-muted-foreground">
                Verified technicians in your city, filtered by repair category.
              </p>
            </div>
          </div>

          <Card className="mt-6">
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Bangalore"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Repair category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading technicians…</p>
            ) : technicians.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No verified technicians found for this city and category yet. Create a repair request instead and
                  we'll notify matching technicians.
                  <div className="mt-4">
                    <Link to="/new-request">
                      <Button>Create repair request</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              technicians.map((technician) => (
                <Card key={technician.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {technician.name}
                        <BadgeCheck className="h-4 w-4 text-primary" />
                      </CardTitle>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4" /> {technician.rating.toFixed(1)} ({technician.totalReviews})
                      </span>
                    </div>
                    {technician.businessName ? (
                      <p className="text-sm text-muted-foreground">{technician.businessName}</p>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {[technician.city, technician.state, technician.pincode].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-muted-foreground">
                      {technician.experienceYears} yrs experience
                      {technician.categoryNames.length ? ` · ${technician.categoryNames.join(", ")}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      {technician.phone ? (
                        <a href={`tel:${technician.phone}`}>
                          <Button size="sm" variant="outline">
                            <Phone className="mr-2 h-4 w-4" /> {technician.phone}
                          </Button>
                        </a>
                      ) : null}
                      {technician.email ? (
                        <a href={`mailto:${technician.email}`}>
                          <Button size="sm" variant="outline">
                            <Mail className="mr-2 h-4 w-4" /> {technician.email}
                          </Button>
                        </a>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
